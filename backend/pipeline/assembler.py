# MoviePy + Pillow로 이미지, 음성, 자막을 합성하여 MP4를 출력하는 모듈
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips


def add_subtitle(image_path: Path, text: str) -> np.ndarray:
    img = Image.open(image_path).resize((1080, 1920))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 48)
    except OSError:
        font = ImageFont.load_default()

    margin = 60
    y_position = 1920 - 220
    draw.text(
        (margin, y_position),
        text,
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
    clips = []
    for scene, img_path, audio_path in zip(scenes, image_paths, audio_paths):
        audio = AudioFileClip(str(audio_path))
        frame = add_subtitle(img_path, scene.narration)
        clip = ImageClip(frame, duration=audio.duration).set_audio(audio)
        clips.append(clip)

    final = concatenate_videoclips(clips, method="compose")
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
