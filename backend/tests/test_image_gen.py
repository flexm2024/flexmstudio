# 나노바나나(Gemini 2.5 Flash Image) 이미지 생성기 단위 테스트
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models import Scene
from pipeline.image_gen import generate_images


def _make_scenes(n=2) -> list[Scene]:
    return [Scene(narration=f"Scene {i}", image_prompt=f"Prompt {i}", duration_estimate=2.0) for i in range(n)]


def _mock_gemini_response():
    mock_part = MagicMock()
    mock_part.inline_data = MagicMock()
    mock_img = MagicMock()
    mock_part.as_image.return_value = mock_img

    mock_response = MagicMock()
    mock_response.parts = [mock_part]
    return mock_response, mock_img


def test_generate_images_creates_files(tmp_path):
    scenes = _make_scenes(2)
    mock_response, mock_img = _mock_gemini_response()

    with patch("pipeline.image_gen.client.models.generate_content", return_value=mock_response):
        paths = generate_images(scenes, tmp_path)

    assert len(paths) == 2
    assert mock_img.save.call_count == 2
    for p in paths:
        assert p.suffix == ".png"


def test_generate_images_uses_correct_model(tmp_path):
    scenes = _make_scenes(1)
    mock_response, _ = _mock_gemini_response()

    with patch("pipeline.image_gen.client.models.generate_content", return_value=mock_response) as mock_gen:
        generate_images(scenes, tmp_path)

    assert mock_gen.call_args.kwargs["model"] == "gemini-2.5-flash-image"


def test_generate_images_uses_9_16_aspect_ratio(tmp_path):
    scenes = _make_scenes(1)
    mock_response, _ = _mock_gemini_response()

    with patch("pipeline.image_gen.client.models.generate_content", return_value=mock_response) as mock_gen:
        generate_images(scenes, tmp_path)

    config = mock_gen.call_args.kwargs["config"]
    assert "IMAGE" in config.response_modalities
    assert config.image_config.aspect_ratio == "9:16"
