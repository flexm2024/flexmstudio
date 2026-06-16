# FastAPI 엔드포인트 동작을 검증하는 통합 테스트
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from pathlib import Path

def test_generate_returns_job_id():
    with patch("main.run_pipeline"):
        from main import app
        client = TestClient(app)
        res = client.post("/api/generate", json={
            "script": "Hello world",
            "voice": "alloy",
            "image_style": "realistic",
        })
    assert res.status_code == 200
    assert "job_id" in res.json()

def test_video_endpoint_404_when_job_missing():
    from main import app
    client = TestClient(app)
    res = client.get("/api/video/nonexistent-job-id")
    assert res.status_code == 404

def test_status_streams_job_state():
    from main import app
    import job_store
    from models import Job, JobStatus
    client = TestClient(app)
    job = Job(job_id="test-status-job", status=JobStatus.done, progress=100, message="완료!")
    job_store._jobs["test-status-job"] = job
    status_res = client.get("/api/status/test-status-job")
    assert status_res.status_code == 200
    assert "done" in status_res.text
