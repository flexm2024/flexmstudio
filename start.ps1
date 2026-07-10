# 백엔드 + Cloudflare Tunnel 백그라운드 실행
$backendPath = "$PSScriptRoot\backend"
$tunnelConfig = "$env:USERPROFILE\.cloudflared\shorts-backend-config.yml"

Start-Process powershell -ArgumentList "-WindowStyle Hidden -Command cd '$backendPath'; uvicorn main:app" -WindowStyle Hidden

Start-Sleep -Seconds 3

Start-Process "https://shorts-generator.pages.dev"

Start-Process cloudflared -ArgumentList "tunnel --config `"$tunnelConfig`" run" -WindowStyle Hidden
