@echo off
echo ====================================
echo Voice Translation Backend
echo ====================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install/upgrade dependencies
echo Installing dependencies...
echo This may take a while on first run (downloading models)...
pip install --upgrade pip
pip install -r requirements.txt
echo.

REM Start the server
echo ====================================
echo Starting Voice Translation API on http://localhost:8002
echo Press Ctrl+C to stop the server
echo ====================================
echo.
python main.py

pause
