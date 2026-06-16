# DALL-E 3으로 장면별 이미지를 생성하고 로컬에 저장하는 모듈
import os
from pathlib import Path
import httpx
from openai import OpenAI
from models import Scene

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-tests"))

def generate_images(scenes: list[Scene], job_dir: Path) -> list[Path]:
    images_dir = job_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    with httpx.Client() as http:
        for i, scene in enumerate(scenes):
            response = client.images.generate(
                model="dall-e-3",
                prompt=scene.image_prompt,
                size="1024x1792",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            image_path = images_dir / f"scene_{i:02d}.png"
            resp = http.get(image_url)
            resp.raise_for_status()
            image_path.write_bytes(resp.content)
            paths.append(image_path)

    return paths
