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

def parse_script(script: str, image_style: str) -> list[Scene]:
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
