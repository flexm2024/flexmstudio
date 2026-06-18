# FastAPI 앱 진입점: 영상 생성 파이프라인 및 업로드 엔드포인트 정의
import uuid
import json
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from models import GenerateRequest, JobStatus, UploadRequest, ScriptGenRequest, DraftRequest
from job_store import create_job, get_job, update_job, list_jobs, delete_job
from pipeline.parser import parse_script
from pipeline.image_gen import generate_images
from pipeline.audio_gen import generate_audio
from pipeline.assembler import generate_frames, render_video

app = FastAPI()
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
_allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = Path("storage")


def run_pipeline(job_id: str, request: GenerateRequest):
    """파트 1: 스크립트 분석 → 이미지 생성 → TTS → 검수 대기."""
    job = get_job(job_id)
    job_dir = STORAGE_DIR / job_id

    try:
        job_dir.mkdir(parents=True, exist_ok=True)
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

        generate_images(scenes, job_dir)
        job.progress = 55
        update_job(job)

        job.status = JobStatus.generating_audio
        job.message = "음성 생성 중..."
        update_job(job)

        generate_audio(scenes, request.voice, job_dir)
        job.progress = 75
        update_job(job)

        # 이미지 검수 대기
        job.status = JobStatus.awaiting_render
        job.message = "이미지를 검수한 후 렌더를 시작하세요."
        update_job(job)

    except Exception as e:
        job.status = JobStatus.error
        job.error = str(e)
        job.message = f"오류: {e}"
        update_job(job)


def run_render(job_id: str):
    """파트 2: 자막 적용 → 렌더링 (검수 승인 후 실행)."""
    job = get_job(job_id)
    job_dir = STORAGE_DIR / job_id

    try:
        image_paths = sorted((job_dir / "images").glob("scene_*.png"))
        audio_paths = sorted((job_dir / "audio").glob("scene_*.mp3"))

        job.status = JobStatus.assembling
        job.message = "자막 적용 중..."
        job.progress = 82
        update_job(job)

        frames = generate_frames(job.scenes, image_paths)

        job.status = JobStatus.rendering
        job.message = "영상 렌더링 중..."
        job.progress = 90
        update_job(job)

        output_path = render_video(job.scenes, frames, audio_paths, job_dir)
        job.output_path = str(output_path.resolve())
        job.status = JobStatus.done
        job.message = "완료!"
        job.progress = 100
        update_job(job)

    except Exception as e:
        job.status = JobStatus.error
        job.error = str(e)
        job.message = f"오류: {e}"
        update_job(job)


@app.post("/api/job/draft")
async def create_draft(body: DraftRequest):
    job_id = str(uuid.uuid4())
    create_job(job_id, title=body.title.strip(), script="")
    return {"job_id": job_id}


@app.post("/api/job/{job_id}/run")
async def run_job(job_id: str, request: GenerateRequest, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404)
    job.script = request.script
    update_job(job)
    background_tasks.add_task(run_pipeline, job_id, request)
    return {"ok": True}


@app.post("/api/generate-script")
async def generate_script(body: ScriptGenRequest):
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    kw = f"\n키워드: {body.keywords}" if body.keywords.strip() else ""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 숏폼 영상(YouTube Shorts, TikTok) 스크립트 작가입니다. "
                    "제목과 키워드를 받아 한국어 나레이션 스크립트를 작성해 주세요. "
                    "스크립트는 구어체로 자연스럽게, 400~600자 내외로 작성하세요. "
                    "씬 구분 없이 연속된 나레이션 텍스트만 반환하세요."
                ),
            },
            {"role": "user", "content": f"제목: {body.title}{kw}"},
        ],
    )
    return {"script": response.choices[0].message.content.strip()}


@app.delete("/api/job/{job_id}")
async def remove_job(job_id: str):
    ok = delete_job(job_id)
    if not ok:
        raise HTTPException(status_code=404, detail="job not found")
    return {"ok": True}


@app.get("/api/jobs")
async def get_jobs():
    jobs = list_jobs()
    return {"jobs": [
        {"job_id": j.job_id, "title": j.title, "status": j.status,
         "created_at": j.created_at, "progress": j.progress}
        for j in jobs
    ]}


@app.post("/api/generate")
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    title = (request.title.strip() or request.script[:40].replace("\n", " ")).strip()
    create_job(job_id, title=title, script=request.script)
    background_tasks.add_task(run_pipeline, job_id, request)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def status(job_id: str, request: Request):
    async def event_stream():
        while True:
            if await request.is_disconnected():
                break
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


@app.post("/api/job/{job_id}/render")
async def trigger_render(job_id: str, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404)
    if job.status != JobStatus.awaiting_render:
        raise HTTPException(status_code=400, detail="검수 대기 상태가 아닙니다")
    background_tasks.add_task(run_render, job_id)
    return {"ok": True}


@app.get("/api/job/{job_id}/info")
async def job_info(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404)
    img_dir = STORAGE_DIR / job_id / "images"
    audio_dir = STORAGE_DIR / job_id / "audio"
    image_count = len(list(img_dir.glob("scene_*.png"))) if img_dir.exists() else 0
    audio_count = len(list(audio_dir.glob("scene_*.mp3"))) if audio_dir.exists() else 0
    return {
        "script": job.script,
        "scenes": [s.model_dump() for s in job.scenes],
        "image_count": image_count,
        "audio_count": audio_count,
    }


@app.get("/api/job/{job_id}/image/{idx}")
async def job_image(job_id: str, idx: int):
    path = STORAGE_DIR / job_id / "images" / f"scene_{idx:02d}.png"
    if not path.exists():
        raise HTTPException(status_code=404)
    return FileResponse(path, media_type="image/png")


@app.get("/api/job/{job_id}/audio/{idx}")
async def job_audio(job_id: str, idx: int):
    path = STORAGE_DIR / job_id / "audio" / f"scene_{idx:02d}.mp3"
    if not path.exists():
        raise HTTPException(status_code=404)
    return FileResponse(path, media_type="audio/mpeg")


@app.post("/api/upload/{job_id}")
async def upload(job_id: str, body: UploadRequest):
    job = get_job(job_id)
    if not job or not job.output_path:
        raise HTTPException(status_code=404)

    results: dict[str, str] = {}
    video_path = Path(job.output_path)

    if "youtube" in body.platforms:
        try:
            from uploaders.youtube import upload_to_youtube
            results["youtube"] = upload_to_youtube(video_path)
        except Exception as e:
            results["youtube"] = f"오류: {e}"

    if "tiktok" in body.platforms:
        try:
            from uploaders.tiktok import upload_to_tiktok
            results["tiktok"] = upload_to_tiktok(video_path)
        except Exception as e:
            results["tiktok"] = f"오류: {e}"

    if "instagram" in body.platforms:
        try:
            from uploaders.instagram import upload_to_instagram
            results["instagram"] = upload_to_instagram(video_path)
        except Exception as e:
            results["instagram"] = f"오류: {e}"

    return {"results": results}
