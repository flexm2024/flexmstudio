# GPT-4로 텍스트 스크립트를 장면별로 분할하는 파이프라인 모듈
import json
import os
from openai import OpenAI
from models import Scene

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-tests"))

_STYLE_PREFIX = {
    "realistic": "photorealistic, high quality photography",
    "animation": "animated cartoon style, vibrant colors",
    "minimal": "minimalist flat design, simple shapes",
}

def _demo_scenes(script: str) -> list[Scene]:
    sentences = [s.strip() for s in script.replace(".", ".\n").splitlines() if s.strip()][:3]
    if not sentences:
        sentences = [script[:80]]
    colors = ["a vibrant blue gradient background", "a warm orange sunset", "a cool green forest"]
    return [
        Scene(narration=s, image_prompt=f"{colors[i % len(colors)]}, minimal style", duration_estimate=2.5)
        for i, s in enumerate(sentences)
    ]


def parse_script(script: str, image_style: str) -> list[Scene]:
    if os.getenv("DEMO_MODE"):
        return _demo_scenes(script)
    style_desc = _STYLE_PREFIX.get(image_style, "photorealistic")
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a video script editor. Split the given script into 3-7 scenes. "
                    "For each scene provide: narration (text to read aloud), "
                    "image_prompt (DALL-E 3 prompt in English, with style prefix), "
                    "duration_estimate (estimated narration seconds as float). "
                    "Return JSON object with key 'scenes' containing an array."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Style: {style_desc}\n\nScript:\n{script}\n\n"
                    'Return: {"scenes": [{"narration": str, "image_prompt": str, "duration_estimate": float}]}'
                ),
            },
        ],
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content)
    return [Scene(**s) for s in data["scenes"]]
