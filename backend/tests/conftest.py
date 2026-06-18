import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


@pytest.fixture(autouse=True)
def reset_demo_mode(monkeypatch):
    """load_dotenv()가 DEMO_MODE를 주입해도 각 테스트는 독립적으로 실행되도록 보장"""
    monkeypatch.delenv("DEMO_MODE", raising=False)
