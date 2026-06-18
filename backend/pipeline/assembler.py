# MoviePy + Pillow로 이미지, 음성, 자막을 합성하여 MP4를 출력하는 모듈
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


def _wrap_text_2lines(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [text]
    lines = []
    remaining = list(words)
    while remaining and len(lines) < 2:
        current: list[str] = []
        while remaining:
            test = " ".join(current + [remaining[0]])
            w = draw.textbbox((0, 0), test, font=font)[2]
            if w > max_width and current:
                break
            current.append(remaining.pop(0))
        if not current:
            current = [remaining.pop(0)]
        lines.append(" ".join(current))
    return lines


def _add_subtitle(image_path: Path, text: str) -> np.ndarray:
    img = Image.open(image_path).resize((IMG_W, IMG_H))
    draw = ImageDraw.Draw(img)
    font = _load_font(FONT_SIZE)

    max_width = IMG_W - 120
    lines = _wrap_text_2lines(draw, text, font, max_width)
    total_h = len(lines) * LINE_HEIGHT
    y_start = (IMG_H - total_h) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (IMG_W - (bbox[2] - bbox[0])) // 2
        y = y_start + i * LINE_HEIGHT
        draw.text((x, y), line, font=font, fill="black", stroke_width=4, stroke_fill="black")
        draw.text((x, y), line, font=font, fill="white")

    return np.array(img)


def generate_frames(scenes: list, image_paths: list[Path]) -> list[np.ndarray]:
    """자막이 합성된 프레임 목록 생성 (자막 단계)."""
    return [_add_subtitle(img_path, scene.narration) for scene, img_path in zip(scenes, image_paths)]


def render_video(
    scenes: list,
    frames: list[np.ndarray],
    audio_paths: list[Path],
    job_dir: Path,
) -> Path:
    """프레임 + 오디오를 합쳐 MP4로 렌더링 (렌더 단계)."""
    raw_clips: list[tuple] = []
    try:
        for i, (scene, frame, audio_path) in enumerate(zip(scenes, frames, audio_paths, strict=True)):
            audio = AudioFileClip(str(audio_path))
            clip = ImageClip(frame, duration=audio.duration).set_audio(audio)
            if i > 0:
                clip = clip.crossfadein(FADE_DUR)
            raw_clips.append((clip, audio))

        padding = -FADE_DUR if len(raw_clips) > 1 else 0
        final = concatenate_videoclips([c for c, _ in raw_clips], method="compose", padding=padding)
        output_path = job_dir / "output.mp4"
        final.write_videofile(str(output_path), fps=24, codec="libx264", audio_codec="aac", logger=None)
        final.close()
        return output_path
    finally:
        for clip, audio in raw_clips:
            clip.close()
            audio.close()


def assemble_video(scenes: list, image_paths: list[Path], audio_paths: list[Path], job_dir: Path) -> Path:
    """하위 호환용 단일 호출 래퍼."""
    frames = generate_frames(scenes, image_paths)
    return render_video(scenes, frames, audio_paths, job_dir)
