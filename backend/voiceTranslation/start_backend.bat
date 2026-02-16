@echo off
echo Starting Voice Translation Backend...
echo.

REM Activate virtual environment if it exists
if exist "..\..\venv\Scripts\activate.bat" (
    call ..\..\venv\Scripts\activate.bat
) else if exist "..\..\.venv\Scripts\Activate.ps1" (
    powershell -ExecutionPolicy Bypass -File "..\..\.venv\Scripts\Activate.ps1"
)

REM Start the server
python main.py

pause
