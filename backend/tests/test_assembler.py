# 영상 합성기(assembler)의 동작을 검증하는 테스트 모음
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models import Scene
from pipeline.assembler import add_subtitle, assemble_video

def _make_scenes(n=2) -> list[Scene]:
    return [Scene(narration=f"Scene {i} narration", image_prompt="img", duration_estimate=2.0) for i in range(n)]

def test_add_subtitle_returns_numpy_array(tmp_path):
    from PIL import Image
    import numpy as np

    img = Image.new("RGB", (1024, 1792), color=(100, 100, 100))
    img_path = tmp_path / "test.png"
    img.save(img_path)

    result = add_subtitle(img_path, "Hello subtitle")

    assert isinstance(result, np.ndarray)
    assert result.shape == (1920, 1080, 3)

def test_assemble_video_creates_output(tmp_path):
    scenes = _make_scenes(2)
    image_paths = [tmp_path / f"scene_{i:02d}.png" for i in range(2)]
    audio_paths = [tmp_path / f"scene_{i:02d}.mp3" for i in range(2)]

    mock_audio = MagicMock()
    mock_audio.duration = 2.0
    mock_clip = MagicMock()
    mock_clip.set_audio.return_value = mock_clip
    mock_final = MagicMock()

    with patch("pipeline.assembler.AudioFileClip", return_value=mock_audio), \
         patch("pipeline.assembler.ImageClip", return_value=mock_clip), \
         patch("pipeline.assembler.concatenate_videoclips", return_value=mock_final), \
         patch("pipeline.assembler.add_subtitle", return_value=MagicMock()):
        output = assemble_video(scenes, image_paths, audio_paths, tmp_path)

    mock_final.write_videofile.assert_called_once()
    call_args = mock_final.write_videofile.call_args
    assert "output.mp4" in call_args.args[0]
    assert call_args.kwargs.get("fps") == 24
