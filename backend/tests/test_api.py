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

def test_generate_and_status():
    with patch("main.run_pipeline"):
        from main import app
        client = TestClient(app)
        gen_res = client.post("/api/generate", json={
            "script": "Test script",
            "voice": "echo",
            "image_style": "minimal",
        })
    job_id = gen_res.json()["job_id"]
    assert job_id is not None
