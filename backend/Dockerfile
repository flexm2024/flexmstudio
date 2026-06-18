# FastAPI + FFmpeg 백엔드 컨테이너 (Render.com 배포용)
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
