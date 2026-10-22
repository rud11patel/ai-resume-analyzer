@echo off
title AI Resume Analyzer Launcher
echo ==============================================================
echo  AI Resume Analyzer - Starting All 3 Services
echo ==============================================================
echo  [1] Python ML Service : http://127.0.0.1:8000
echo  [2] Express API Server: http://localhost:5000
echo  [3] React Web Client  : http://localhost:5173
echo ==============================================================
echo.

node "%~dp0start-all.js"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Node.js not detected or error occurred. Press any key to exit.
    pause >nul
)
