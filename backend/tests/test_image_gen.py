# DALL-E 3 이미지 생성기 단위 테스트
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models import Scene
from pipeline.image_gen import generate_images

def _make_scenes(n=2) -> list[Scene]:
    return [Scene(narration=f"Scene {i}", image_prompt=f"Prompt {i}", duration_estimate=2.0) for i in range(n)]

def test_generate_images_creates_files(tmp_path):
    scenes = _make_scenes(2)
    mock_img_response = MagicMock()
    mock_img_response.data[0].url = "https://example.com/image.png"

    fake_img_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

    with patch("pipeline.image_gen.client.images.generate", return_value=mock_img_response), \
         patch("pipeline.image_gen.httpx.Client") as mock_http_cls:
        mock_http = MagicMock()
        mock_http.__enter__ = lambda s: s
        mock_http.__exit__ = MagicMock(return_value=False)
        mock_http.get.return_value.content = fake_img_bytes
        mock_http_cls.return_value = mock_http

        paths = generate_images(scenes, tmp_path)

    assert len(paths) == 2
    for p in paths:
        assert p.exists()
        assert p.suffix == ".png"

def test_generate_images_uses_correct_size(tmp_path):
    scenes = _make_scenes(1)
    mock_img_response = MagicMock()
    mock_img_response.data[0].url = "https://example.com/img.png"

    with patch("pipeline.image_gen.client.images.generate", return_value=mock_img_response) as mock_gen, \
         patch("pipeline.image_gen.httpx.Client") as mock_http_cls:
        mock_http = MagicMock()
        mock_http.__enter__ = lambda s: s
        mock_http.__exit__ = MagicMock(return_value=False)
        mock_http.get.return_value.content = b"fake"
        mock_http_cls.return_value = mock_http

        generate_images(scenes, tmp_path)

    call_kwargs = mock_gen.call_args.kwargs
    assert call_kwargs["size"] == "1024x1792"
    assert call_kwargs["model"] == "dall-e-3"
