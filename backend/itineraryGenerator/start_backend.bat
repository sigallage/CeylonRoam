@echo off
REM Start backend: create venv (if missing), activate, install deps, run uvicorn in a new cmd window
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
start "TRAVEL-AI API" cmd /k "call .venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"
echo Backend started in new window.
