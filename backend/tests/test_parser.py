# GPT-4 스크립트 파서의 단위 테스트
import json
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.parser import parse_script

def _mock_response(scenes_data: list) -> MagicMock:
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps({"scenes": scenes_data})
    return mock

def test_parse_script_returns_scenes():
    scenes_data = [
        {"narration": "Hello world", "image_prompt": "A beautiful globe", "duration_estimate": 2.0}
    ]
    with patch("pipeline.parser.client.chat.completions.create", return_value=_mock_response(scenes_data)):
        scenes = parse_script("Hello world script", "realistic")

    assert len(scenes) == 1
    assert scenes[0].narration == "Hello world"
    assert scenes[0].image_prompt == "A beautiful globe"
    assert scenes[0].duration_estimate == 2.0

def test_parse_script_multiple_scenes():
    scenes_data = [
        {"narration": "Scene 1", "image_prompt": "Image 1", "duration_estimate": 3.0},
        {"narration": "Scene 2", "image_prompt": "Image 2", "duration_estimate": 2.5},
    ]
    with patch("pipeline.parser.client.chat.completions.create", return_value=_mock_response(scenes_data)):
        scenes = parse_script("Two scene script", "animation")

    assert len(scenes) == 2
    assert scenes[1].narration == "Scene 2"

def test_parse_script_style_prefix_in_prompt():
    scenes_data = [
        {"narration": "Scene", "image_prompt": "Image", "duration_estimate": 2.0}
    ]
    with patch("pipeline.parser.client.chat.completions.create", return_value=_mock_response(scenes_data)) as mock_create:
        parse_script("script", "animation")

    call_args = mock_create.call_args
    user_content = call_args.kwargs["messages"][1]["content"]
    assert "animated" in user_content

def test_parse_script_uses_json_response_format():
    scenes_data = [
        {"narration": "Scene", "image_prompt": "Image", "duration_estimate": 2.0}
    ]
    with patch("pipeline.parser.client.chat.completions.create", return_value=_mock_response(scenes_data)) as mock_create:
        parse_script("script", "realistic")

    call_kwargs = mock_create.call_args.kwargs
    assert call_kwargs["response_format"] == {"type": "json_object"}
    assert call_kwargs["model"] == "gpt-4o"
