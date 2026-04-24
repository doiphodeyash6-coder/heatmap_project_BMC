# PowerShell script to start both servers
Write-Host "=========================================="
Write-Host " BMC Waste Collection - Start Both Servers"
Write-Host "=========================================="
Write-Host ""

# Start Python ML API in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:/field project bmc/waste-collection-heatmap/ml'; uvicorn api:app --reload"

# Wait a moment
Start-Sleep -Seconds 2

# Start Next.js dev server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:/field project bmc/waste-collection-heatmap'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting in separate windows!"
Write-Host ""
Write-Host "  - Python ML API:   http://127.0.0.1:8000"
Write-Host "  - Next.js App:     http://localhost:3000"
Write-Host ""
