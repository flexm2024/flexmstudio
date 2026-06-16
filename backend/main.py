# FastAPI 앱 진입점: 영상 생성 파이프라인 및 업로드 엔드포인트 정의
import uuid
import json
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from models import GenerateRequest, JobStatus, UploadRequest
from job_store import create_job, get_job, update_job
from pipeline.parser import parse_script
from pipeline.image_gen import generate_images
from pipeline.audio_gen import generate_audio
from pipeline.assembler import assemble_video

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = Path("storage")


def run_pipeline(job_id: str, request: GenerateRequest):
    job = get_job(job_id)
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        job.status = JobStatus.parsing
        job.message = "스크립트 분석 중..."
        job.progress = 10
        update_job(job)

        scenes = parse_script(request.script, request.image_style)
        job.scenes = scenes
        job.progress = 25
        update_job(job)

        job.status = JobStatus.generating_images
        job.message = f"이미지 생성 중 (총 {len(scenes)}장)..."
        update_job(job)

        image_paths = generate_images(scenes, job_dir)
        job.progress = 55
        update_job(job)

        job.status = JobStatus.generating_audio
        job.message = "음성 생성 중..."
        update_job(job)

        audio_paths = generate_audio(scenes, request.voice, job_dir)
        job.progress = 75
        update_job(job)

        job.status = JobStatus.assembling
        job.message = "영상 합성 중..."
        update_job(job)

        output_path = assemble_video(scenes, image_paths, audio_paths, job_dir)
        job.output_path = str(output_path)
        job.status = JobStatus.done
        job.message = "완료!"
        job.progress = 100
        update_job(job)

    except Exception as e:
        job.status = JobStatus.error
        job.error = str(e)
        job.message = f"오류: {e}"
        update_job(job)


@app.post("/api/generate")
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    create_job(job_id)
    background_tasks.add_task(run_pipeline, job_id, request)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    async def event_stream():
        while True:
            job = get_job(job_id)
            if not job:
                yield f"data: {json.dumps({'error': 'not found'})}\n\n"
                break
            yield f"data: {json.dumps({'status': job.status, 'progress': job.progress, 'message': job.message, 'error': job.error})}\n\n"
            if job.status in (JobStatus.done, JobStatus.error):
                break
            await asyncio.sleep(1)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/video/{job_id}")
async def get_video(job_id: str):
    job = get_job(job_id)
    if not job or not job.output_path:
        raise HTTPException(status_code=404, detail="영상을 찾을 수 없습니다")
    return FileResponse(job.output_path, media_type="video/mp4")


@app.post("/api/upload/{job_id}")
async def upload(job_id: str, body: UploadRequest):
    job = get_job(job_id)
    if not job or not job.output_path:
        raise HTTPException(status_code=404)

    results: dict[str, str] = {}
    video_path = Path(job.output_path)

    if "youtube" in body.platforms:
        from uploaders.youtube import upload_to_youtube
        results["youtube"] = upload_to_youtube(video_path)

    if "tiktok" in body.platforms:
        from uploaders.tiktok import upload_to_tiktok
        results["tiktok"] = upload_to_tiktok(video_path)

    if "instagram" in body.platforms:
        from uploaders.instagram import upload_to_instagram
        results["instagram"] = upload_to_instagram(video_path)

    return {"results": results}
