<#
.SYNOPSIS
    Starts all 3 services for the AI Resume Analyzer.

.DESCRIPTION
    Launches:
    1. Python FastAPI ML Service (Port 8000)
    2. Node.js Express Backend API (Port 5000)
    3. React Vite Frontend Client (Port 5173)

.PARAMETER SeparateWindows
    If specified, launches each service in its own dedicated PowerShell window.
    Default behavior runs all 3 concurrently in this single terminal with color-coded logs.

.EXAMPLE
    .\start-services.ps1
    Runs all 3 services in the current console.

.EXAMPLE
    .\start-services.ps1 -SeparateWindows
    Spawns 3 separate PowerShell windows for each service.
#>

param (
    [switch]$SeparateWindows
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " AI Resume Analyzer — Starting All 3 Services" -ForegroundColor White
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " [1] Python ML Service : http://127.0.0.1:8000 (FastAPI)" -ForegroundColor Green
Write-Host " [2] Express API Server : http://localhost:5000  (Node.js)" -ForegroundColor Cyan
Write-Host " [3] React Web Client   : http://localhost:5173  (Vite)" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Cyan

# Locate Python in venv
$VenvPython = Join-Path $RootDir "ml-service\venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    $VenvPython = "python"
}

if ($SeparateWindows) {
    Write-Host "`nLaunching 3 separate PowerShell windows..." -ForegroundColor Yellow

    # 1. ML Service
    $MlCmd = "cd `"$RootDir\ml-service`"; & `"$VenvPython`" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '=== [1] Python ML Service (Port 8000) ===' -ForegroundColor Green; $MlCmd"

    # 2. Server
    $ServerCmd = "cd `"$RootDir\server`"; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '=== [2] Express Backend Server (Port 5000) ===' -ForegroundColor Cyan; $ServerCmd"

    # 3. Client
    $ClientCmd = "cd `"$RootDir\client`"; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '=== [3] React Frontend Client (Port 5173) ===' -ForegroundColor Yellow; $ClientCmd"

    Write-Host "`nAll 3 windows have been launched!" -ForegroundColor Green
    Write-Host "Close the individual windows to stop each service." -ForegroundColor Gray
} else {
    Write-Host "`nRunning unified service orchestrator (Ctrl+C to stop all)...`n" -ForegroundColor White
    node (Join-Path $RootDir "start-all.js")
}
