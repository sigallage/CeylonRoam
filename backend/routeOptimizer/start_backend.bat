@echo off
REM Start backend: create venv (if missing), activate, install deps, run uvicorn.
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  REM Prefer the Python launcher if available.
  where py >nul 2>&1
  if %errorlevel%==0 (
    py -3.12 -m venv .venv 2>nul
    if %errorlevel% neq 0 py -m venv .venv
  ) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
      python -m venv .venv
    ) else (
      echo Python not found. Install Python 3.11+ or ensure `py`/`python` is on PATH.
      exit /b 1
    )
  )
)

call .venv\Scripts\activate
python -m pip install -r requirements.txt

REM Bind to localhost for local dev + Vite proxy.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8002
