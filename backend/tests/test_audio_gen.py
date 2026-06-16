# OpenAI TTS 음성 생성 모듈의 단위 테스트
from pathlib import Path
from unittest.mock import patch, MagicMock, call
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models import Scene
from pipeline.audio_gen import generate_audio

def _make_scenes(n=2) -> list[Scene]:
    return [Scene(narration=f"Hello scene {i}", image_prompt="img", duration_estimate=2.0) for i in range(n)]

def _mock_streaming_client(mock_response):
    """with_streaming_response.create(...) 컨텍스트 매니저를 목킹하는 헬퍼"""
    cm = MagicMock()
    cm.__enter__ = MagicMock(return_value=mock_response)
    cm.__exit__ = MagicMock(return_value=False)
    return cm

def test_generate_audio_creates_mp3_files(tmp_path):
    scenes = _make_scenes(2)
    mock_response = MagicMock()
    mock_response.stream_to_file = MagicMock()

    with patch("pipeline.audio_gen.client.audio.speech.with_streaming_response.create",
               return_value=_mock_streaming_client(mock_response)):
        paths = generate_audio(scenes, "alloy", tmp_path)

    assert len(paths) == 2
    assert mock_response.stream_to_file.call_count == 2
    for p in paths:
        assert p.suffix == ".mp3"
        assert "scene_" in p.name

def test_generate_audio_uses_correct_voice(tmp_path):
    scenes = _make_scenes(1)
    mock_response = MagicMock()
    mock_response.stream_to_file = MagicMock()

    with patch("pipeline.audio_gen.client.audio.speech.with_streaming_response.create",
               return_value=_mock_streaming_client(mock_response)) as mock_tts:
        generate_audio(scenes, "nova", tmp_path)

    call_kwargs = mock_tts.call_args.kwargs
    assert call_kwargs["voice"] == "nova"
    assert call_kwargs["model"] == "tts-1"
    assert call_kwargs["input"] == "Hello scene 0"
