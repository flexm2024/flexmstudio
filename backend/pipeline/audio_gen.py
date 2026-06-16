# OpenAI TTS로 장면별 내레이션 음성을 생성하는 모듈
import os
from pathlib import Path
from openai import OpenAI
from models import Scene

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-tests"))

def generate_audio(scenes: list[Scene], voice: str, job_dir: Path) -> list[Path]:
    audio_dir = job_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for i, scene in enumerate(scenes):
        audio_path = audio_dir / f"scene_{i:02d}.mp3"
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=scene.narration,
        )
        response.stream_to_file(audio_path)
        paths.append(audio_path)

    return paths
