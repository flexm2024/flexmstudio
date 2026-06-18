# 백엔드 + Cloudflare Tunnel 동시 시작
$backendPath = "$PSScriptRoot\backend"
$tunnelConfig = "$env:USERPROFILE\.cloudflared\shorts-backend-config.yml"

Write-Host "백엔드 시작 중..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; uvicorn main:app --reload"

Start-Sleep -Seconds 3

Write-Host "Cloudflare Tunnel 시작 중..." -ForegroundColor Cyan
Write-Host "주소: https://shorts.flexmstudio.com" -ForegroundColor Green
cloudflared tunnel --config $tunnelConfig run
