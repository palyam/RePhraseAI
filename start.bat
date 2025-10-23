@echo off
REM RePhraseAI Startup Script for Windows
REM This script starts both the backend and frontend servers

echo.
echo Starting RePhraseAI...
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM Check if backend virtual environment exists
if not exist "%SCRIPT_DIR%backend\venv\" (
    echo [WARNING] Backend virtual environment not found. Creating...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    deactivate
    cd ..
)

REM Check if frontend node_modules exists
if not exist "%SCRIPT_DIR%frontend\node_modules\" (
    echo [WARNING] Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
)

REM Start backend server
echo [INFO] Starting backend server...
cd backend
start /B cmd /c "venv\Scripts\activate && python app.py > nul 2>&1"
cd ..
timeout /t 2 /nobreak > nul

echo [SUCCESS] Backend server started
echo           Running at: http://localhost:5000
echo.

REM Start frontend server
echo [INFO] Starting frontend server...
cd frontend
start /B cmd /c "npm run dev > nul 2>&1"
cd ..
timeout /t 3 /nobreak > nul

echo [SUCCESS] Frontend server started
echo           Running at: http://localhost:5847
echo.
echo [SUCCESS] RePhraseAI is ready!
echo           Open http://localhost:5847 in your browser
echo.
echo Press Ctrl+C to stop (you may need to manually kill node.exe and python.exe processes)
echo.

REM Keep window open
pause
