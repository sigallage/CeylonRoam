@echo off
setlocal

REM Start Auth/Signup backend on port 5001
cd /d %~dp0

if not exist node_modules (
  echo Installing dependencies...
  npm install
)

npm start
