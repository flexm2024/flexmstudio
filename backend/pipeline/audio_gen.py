# OpenAI TTS로 장면별 내레이션 음성을 생성하는 모듈
import os
from pathlib import Path
from openai import OpenAI
from models import Scene

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-tests"))

def _demo_audio(scenes: list[Scene], job_dir: Path) -> list[Path]:
    import wave, struct, math
    audio_dir = job_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, scene in enumerate(scenes):
        duration = scene.duration_estimate or 2.5
        sample_rate = 22050
        n_samples = int(sample_rate * duration)
        audio_path = audio_dir / f"scene_{i:02d}.wav"
        with wave.open(str(audio_path), "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            # 저음 비프 0.1초 + 무음
            beep_samples = int(sample_rate * 0.1)
            frames = b""
            for j in range(n_samples):
                if j < beep_samples:
                    val = int(3000 * math.sin(2 * math.pi * 440 * j / sample_rate))
                else:
                    val = 0
                frames += struct.pack("<h", val)
            wf.writeframes(frames)
        paths.append(audio_path)
    return paths


def generate_audio(scenes: list[Scene], voice: str, job_dir: Path) -> list[Path]:
    if os.getenv("DEMO_MODE"):
        return _demo_audio(scenes, job_dir)
    audio_dir = job_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for i, scene in enumerate(scenes):
        audio_path = audio_dir / f"scene_{i:02d}.mp3"
        with client.audio.speech.with_streaming_response.create(
            model="tts-1",
            voice=voice,
            input=scene.narration,
        ) as response:
            response.stream_to_file(audio_path)
        paths.append(audio_path)

    return paths
