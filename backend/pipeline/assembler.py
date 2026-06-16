# MoviePy + Pillow로 이미지, 음성, 자막을 합성하여 MP4를 출력하는 모듈
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips


def _load_font(size: int = 48) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    lines = []
    words = text.split()
    current: list[str] = []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def add_subtitle(image_path: Path, text: str) -> np.ndarray:
    img = Image.open(image_path).resize((1080, 1920))
    draw = ImageDraw.Draw(img)
    font = _load_font(48)

    margin = 60
    line_height = 58
    max_text_width = 1080 - 2 * margin - 20
    lines = _wrap_text(draw, text, font, max_text_width)

    y_start = 1920 - 220 - (len(lines) - 1) * line_height
    for i, line in enumerate(lines):
        draw.text(
            (margin, y_start + i * line_height),
            line,
            font=font,
            fill="white",
            stroke_width=2,
            stroke_fill="black",
        )
    return np.array(img)


def assemble_video(
    scenes: list,
    image_paths: list[Path],
    audio_paths: list[Path],
    job_dir: Path,
) -> Path:
    raw_clips: list[tuple] = []
    try:
        for scene, img_path, audio_path in zip(scenes, image_paths, audio_paths, strict=True):
            audio = AudioFileClip(str(audio_path))
            frame = add_subtitle(img_path, scene.narration)
            clip = ImageClip(frame, duration=audio.duration).set_audio(audio)
            raw_clips.append((clip, audio))

        final = concatenate_videoclips([c for c, _ in raw_clips], method="compose")
        output_path = job_dir / "output.mp4"
        final.write_videofile(
            str(output_path),
            fps=24,
            codec="libx264",
            audio_codec="aac",
            logger=None,
        )
        final.close()
        return output_path
    finally:
        for clip, audio in raw_clips:
            clip.close()
            audio.close()
