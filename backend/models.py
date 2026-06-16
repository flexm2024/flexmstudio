# 쇼츠 생성 파이프라인의 데이터 모델 정의
from pydantic import BaseModel
from enum import Enum
from typing import Optional

class ImageStyle(str, Enum):
    realistic = "realistic"
    animation = "animation"
    minimal = "minimal"

class Voice(str, Enum):
    alloy = "alloy"
    echo = "echo"
    nova = "nova"

class GenerateRequest(BaseModel):
    script: str
    voice: Voice = Voice.alloy
    image_style: ImageStyle = ImageStyle.realistic

class Scene(BaseModel):
    narration: str
    image_prompt: str
    duration_estimate: float

class JobStatus(str, Enum):
    pending = "pending"
    parsing = "parsing"
    generating_images = "generating_images"
    generating_audio = "generating_audio"
    assembling = "assembling"
    done = "done"
    error = "error"

class Job(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.pending
    progress: int = 0
    message: str = ""
    scenes: list[Scene] = []
    output_path: Optional[str] = None
    error: Optional[str] = None

class UploadRequest(BaseModel):
    platforms: list[str]
