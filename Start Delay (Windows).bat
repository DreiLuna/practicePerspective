@echo off
title Delay
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org, then run this again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing dependencies...
  call npm install || (pause & exit /b 1)
)

echo Starting Delay. Your browser will open at http://localhost:5173
echo Close this window to stop the app.
call npm start
pause
