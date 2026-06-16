# Instagram Graph API로 Reels를 업로드하는 모듈
# 주의: 영상은 공개 접근 가능한 URL이어야 함 (INSTAGRAM_VIDEO_HOST_URL 환경변수 설정 필요)
import os
from pathlib import Path
import httpx

GRAPH_API = "https://graph.facebook.com/v18.0"


def upload_to_instagram(video_path: Path, caption: str = "#Shorts") -> str:
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    ig_user_id = os.getenv("INSTAGRAM_USER_ID")
    video_host_url = os.getenv("INSTAGRAM_VIDEO_HOST_URL", "").rstrip("/")

    public_video_url = f"{video_host_url}/{video_path.name}"

    create_res = httpx.post(
        f"{GRAPH_API}/{ig_user_id}/media",
        params={
            "media_type": "REELS",
            "video_url": public_video_url,
            "caption": caption,
            "access_token": access_token,
        },
    )
    create_res.raise_for_status()
    creation_id = create_res.json()["id"]

    import time
    for _ in range(30):
        status_res = httpx.get(
            f"{GRAPH_API}/{creation_id}",
            params={"fields": "status_code", "access_token": access_token},
        )
        status_res.raise_for_status()
        status_code = status_res.json().get("status_code")
        if status_code == "FINISHED":
            break
        if status_code == "ERROR":
            raise RuntimeError("Instagram 미디어 컨테이너 처리 실패")
        time.sleep(5)
    else:
        raise TimeoutError("Instagram 미디어 컨테이너 대기 시간 초과")

    publish_res = httpx.post(
        f"{GRAPH_API}/{ig_user_id}/media_publish",
        params={"creation_id": creation_id, "access_token": access_token},
    )
    publish_res.raise_for_status()
    return f"Instagram 업로드 완료 (id: {publish_res.json()['id']})"
