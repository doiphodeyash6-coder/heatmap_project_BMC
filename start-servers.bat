@echo off
echo ==========================================
echo  BMC Waste Collection - Start Both Servers
echo ==========================================
echo.

REM Start Python ML API in a new window
start "Python ML API" cmd /k "cd /d "%~dp0ml" && uvicorn api:app --reload"

REM Wait a moment for Python to start
timeout /t 2 /nobreak >nul

REM Start Next.js dev server in a new window
start "Next.js Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo.
echo   - Python ML API:   http://127.0.0.1:8000
echo   - Next.js App:     http://localhost:3000
echo.
pause

