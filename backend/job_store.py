# 인메모리 잡 상태 저장소 (단일 서버 환경용)
from models import Job

_jobs: dict[str, Job] = {}

def create_job(job_id: str) -> Job:
    job = Job(job_id=job_id)
    _jobs[job_id] = job
    return job

def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)

def update_job(job: Job) -> None:
    _jobs[job.job_id] = job
