@echo off
echo Starting Gold Dashboard...

REM ปิด port เก่าก่อนถ้ามี
echo Closing existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

REM Start Docker PostgreSQL
docker-compose up -d
echo PostgreSQL started

REM รอสักครู่
timeout /t 3 /nobreak > nul

REM เปิด Backend
start "Gold Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 5 /nobreak > nul

REM เปิด Frontend
start "Gold Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak > nul

REM เปิด Browser
start "" "http://localhost:5173"

echo Gold Dashboard is running!