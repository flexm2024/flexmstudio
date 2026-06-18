# 인메모리 + JSON 파일 기반 잡 상태 저장소
import json
from datetime import datetime
from pathlib import Path
from models import Job, JobStatus

_jobs: dict[str, Job] = {}
_INDEX_FILE = Path("storage/jobs_index.json")


def _load():
    if _INDEX_FILE.exists():
        try:
            data = json.loads(_INDEX_FILE.read_text(encoding="utf-8"))
            for job_id, job_data in data.items():
                _jobs[job_id] = Job(**job_data)
        except Exception:
            pass


def _save():
    _INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {jid: job.model_dump() for jid, job in _jobs.items()}
    _INDEX_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


_load()


def create_job(job_id: str, title: str = "", script: str = "") -> Job:
    job = Job(job_id=job_id, title=title, script=script, created_at=datetime.now().isoformat())
    _jobs[job_id] = job
    _save()
    return job


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)


def update_job(job: Job) -> None:
    _jobs[job.job_id] = job
    if job.status in (JobStatus.done, JobStatus.error):
        _save()


def delete_job(job_id: str) -> bool:
    if job_id not in _jobs:
        return False
    del _jobs[job_id]
    _save()
    return True


def list_jobs() -> list[Job]:
    return sorted(_jobs.values(), key=lambda j: j.created_at, reverse=True)
