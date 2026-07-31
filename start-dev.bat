@echo off
echo Starting BookSage Tauri App...
echo.

cd /d "%~dp0"
call npm run tauri dev

pause
