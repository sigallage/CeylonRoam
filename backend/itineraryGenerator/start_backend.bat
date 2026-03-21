@echo off
REM Start backend: create venv (if missing), activate, install deps, run uvicorn in a new cmd window
cd /d "%~dp0"
set PYTHON_PATH=C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe
if not exist ".venv\Scripts\python.exe" (
  "%PYTHON_PATH%" -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
start "TRAVEL-AI API" cmd /k "call .venv\Scripts\activate && python -m uvicorn main:app --reload --port 8001"
echo Backend started in new window.
