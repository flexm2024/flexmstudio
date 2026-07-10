# MoviePy + Pillow로 이미지, 음성, 자막을 합성하여 MP4를 출력하는 모듈
import re
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips

IMG_W, IMG_H = 1080, 1920
FONT_SIZE = 52
LINE_HEIGHT = 68
FADE_DUR = 0.35

_FONT_CANDIDATES = [
    "C:/claudecode/shorts/backend/fonts/Pretendard-Regular.ttf",
    "C:/Windows/Fonts/malgun.ttf",
    "C:/Windows/Fonts/gulim.ttc",
    "arial.ttf",
]


def _load_font(size: int = FONT_SIZE) -> ImageFont.FreeTypeFont:
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int, max_lines: int = 20) -> list[str]:
    """한국어 포함 텍스트 줄바꿈. 글자 단위 이진탐색, 공백 우선 분리."""
    lines: list[str] = []
    remaining = text.strip()
    while remaining and len(lines) < max_lines:
        lo, hi = 1, len(remaining)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            w = draw.textbbox((0, 0), remaining[:mid], font=font)[2]
            if w <= max_width:
                lo = mid
            else:
                hi = mid - 1
        end = lo
        chunk = remaining[:end]
        if end < len(remaining) and " " in chunk:
            last_space = chunk.rfind(" ")
            if last_space > 0:
                chunk = chunk[:last_space]
                end = last_space
        lines.append(chunk)
        remaining = remaining[end:].lstrip()
    return lines


PADDING_X = 60  # 좌우 여백

def _draw_lines(draw: ImageDraw.ImageDraw, lines: list[str], font, align: str = "center") -> None:
    """줄 목록을 화면 세로 정중앙에 렌더링. align: left|center|right."""
    total_h = len(lines) * LINE_HEIGHT
    y_start = (IMG_H - total_h) // 2
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        if align == "left":
            x = PADDING_X
        elif align == "right":
            x = IMG_W - w - PADDING_X
        else:
            x = (IMG_W - w) // 2
        y = y_start + i * LINE_HEIGHT
        draw.text((x, y), line, font=font, fill="black", stroke_width=4, stroke_fill="black")
        draw.text((x, y), line, font=font, fill="white")


def _split_to_chunks(text: str) -> list[str]:
    """문장(마침표·느낌표·물음표) → 쉼표 순으로 단순 분리. 합치지 않음."""
    # 1단계: 문장 분리
    sentences = re.split(r'(?<=[.!?。])\s*', text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        sentences = [text.strip()]

    # 2단계: 각 문장을 쉼표로 추가 분리
    chunks: list[str] = []
    for sent in sentences:
        parts = re.split(r'(?<=[,，])\s*', sent)
        parts = [p.strip() for p in parts if p.strip()]
        chunks.extend(parts if parts else [sent])

    return chunks if chunks else [text.strip()]


def _scene_to_clip(scene, image_path: Path, audio_path: Path, font, align: str = "center") -> tuple:
    """씬 하나를 구절 단위 자막 애니메이션 클립으로 변환."""
    audio = AudioFileClip(str(audio_path))
    total_dur = audio.duration

    dummy_draw = ImageDraw.Draw(Image.new("RGB", (IMG_W, IMG_H)))
    max_width = IMG_W - 120

    # 사용자 지정 청크 > 자동 분리
    phrase_texts = scene.subtitle_chunks if scene.subtitle_chunks else _split_to_chunks(scene.narration)

    # 각 구절을 줄 목록으로 변환 (\n은 강제 줄바꿈, 긴 줄은 자동 줄바꿈)
    def to_lines(text: str) -> list[str]:
        lines: list[str] = []
        for part in text.split("\n"):
            part = part.strip()
            if part:
                lines.extend(_wrap_text(dummy_draw, part, font, max_width, max_lines=3))
        return lines or [""]

    chunks: list[list[str]] = [to_lines(p) for p in phrase_texts]

    # 표시 시간 = 글자수 비율 배분
    char_counts = [max(sum(len(l) for l in c), 1) for c in chunks]
    total_chars = sum(char_counts)
    durations = [total_dur * cc / total_chars for cc in char_counts]

    sub_clips = []
    for chunk_lines, dur in zip(chunks, durations):
        img = Image.open(image_path).resize((IMG_W, IMG_H))
        _draw_lines(ImageDraw.Draw(img), chunk_lines, font, align)
        sub_clips.append(ImageClip(np.array(img), duration=dur))

    scene_clip = concatenate_videoclips(sub_clips, method="compose").set_audio(audio)
    return scene_clip, audio


def render_video(
    scenes: list,
    image_paths: list[Path],
    audio_paths: list[Path],
    job_dir: Path,
    align: str = "center",
) -> Path:
    """씬별 자막 청크 애니메이션 + 오디오를 합쳐 MP4 렌더링."""
    font = _load_font(FONT_SIZE)
    raw_clips: list[tuple] = []
    try:
        for i, (scene, image_path, audio_path) in enumerate(
            zip(scenes, image_paths, audio_paths)
        ):
            clip, audio = _scene_to_clip(scene, image_path, audio_path, font, align)
            if i > 0:
                clip = clip.crossfadein(FADE_DUR)
            raw_clips.append((clip, audio))

        padding = -FADE_DUR if len(raw_clips) > 1 else 0
        final = concatenate_videoclips([c for c, _ in raw_clips], method="compose", padding=padding)
        output_path = job_dir / "output.mp4"
        final.write_videofile(
            str(output_path), fps=24, codec="libx264", audio_codec="aac", logger=None,
            ffmpeg_params=["-g", "24"],  # 1초마다 키프레임 → 정확한 탐색 지원
        )
        final.close()
        return output_path
    finally:
        for clip, audio in raw_clips:
            clip.close()
            audio.close()


def assemble_video(scenes: list, image_paths: list[Path], audio_paths: list[Path], job_dir: Path) -> Path:
    """하위 호환용 래퍼."""
    return render_video(scenes, image_paths, audio_paths, job_dir)
