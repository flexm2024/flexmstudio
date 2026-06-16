# TikTok Content Posting API로 영상을 업로드하는 모듈
# 참고: TikTok Developer 앱 승인 후 사용 가능
import os
from pathlib import Path
import httpx

TIKTOK_API = "https://open.tiktokapis.com/v2"


def upload_to_tiktok(video_path: Path, title: str = "My Shorts") -> str:
    access_token = os.getenv("TIKTOK_ACCESS_TOKEN")
    video_size = video_path.stat().st_size

    init_res = httpx.post(
        f"{TIKTOK_API}/post/publish/video/init/",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={
            "post_info": {
                "title": title,
                "privacy_level": "SELF_ONLY",
                "disable_duet": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": video_size,
                "chunk_size": video_size,
                "total_chunk_count": 1,
            },
        },
    )
    init_res.raise_for_status()
    data = init_res.json()["data"]

    httpx.put(
        data["upload_url"],
        content=video_path.read_bytes(),
        headers={
            "Content-Type": "video/mp4",
            "Content-Range": f"bytes 0-{video_size - 1}/{video_size}",
        },
    ).raise_for_status()

    return f"TikTok 업로드 완료 (publish_id: {data['publish_id']})"
