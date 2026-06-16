# YouTube Data API v3로 영상을 Shorts로 업로드하는 모듈
# 참고: YouTube 업로드를 위해서는 OAuth 2.0 인증이 필요합니다
import os
from pathlib import Path
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


def _get_youtube_client():
    creds = Credentials(
        token=os.getenv("YOUTUBE_ACCESS_TOKEN"),
        refresh_token=os.getenv("YOUTUBE_REFRESH_TOKEN"),
        client_id=os.getenv("YOUTUBE_CLIENT_ID"),
        client_secret=os.getenv("YOUTUBE_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("youtube", "v3", credentials=creds)


def upload_to_youtube(video_path: Path, title: str = "My Shorts") -> str:
    youtube = _get_youtube_client()
    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": "#Shorts",
                "tags": ["shorts"],
                "categoryId": "22",
            },
            "status": {"privacyStatus": "public"},
        },
        media_body=MediaFileUpload(str(video_path), chunksize=-1, resumable=True),
    )
    response = request.execute()
    return f"https://youtube.com/shorts/{response['id']}"
