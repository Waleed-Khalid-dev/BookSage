@echo off
echo Killing any process on port 1420...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :1420') do (
    echo Terminating PID: %%a
    taskkill /F /PID %%a 2>nul
)
echo Done!
pause
