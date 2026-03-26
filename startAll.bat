@echo off
chcp 65001 >nul

REM FICC Connect - Start All Services (Windows)
REM This script starts the backend with SQLite (no Docker/PostgreSQL required)
REM Uses sql.js for database file storage

echo =====================================
echo   FICC Connect - Starting Services
echo =====================================
echo.
echo Using SQLite database (no Docker required)
echo.

REM Ensure data directory exists for SQLite
if not exist "backend\data" mkdir backend\data

REM Initialize SQLite database
echo [INFO] Initializing SQLite database...
cd backend
if exist "node_modules\sql.js\dist\sql-wasm.wasm" (
    echo [INFO] Running database migrations...
    node migrations\run.js
    if errorlevel 1 (
        echo [ERROR] Database migration failed
        cd ..
        exit /b 1
    )
) else (
    echo [INFO] Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        cd ..
        exit /b 1
    )
    echo [INFO] Running database migrations...
    node migrations\run.js
)
cd ..

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo.
    echo [INFO] Installing backend dependencies...
    cd backend && call npm install && cd ..
)

REM Check if PWA dependencies are installed
if not exist "pwa\node_modules" (
    echo.
    echo [INFO] Installing PWA dependencies...
    cd pwa && call npm install && cd ..
)

REM Build PWA
echo.
echo [INFO] Building PWA...
cd pwa && call npm run build
if errorlevel 1 (
    echo [ERROR] PWA build failed
    cd ..
    exit /b 1
)
cd ..

REM Copy PWA build to backend public directory
echo [INFO] Copying PWA build to backend...
if not exist "backend\public" mkdir backend\public
xcopy /s /y /q pwa\dist\* backend\public\ >nul 2>&1
echo [OK] PWA copied to backend\public

REM Start backend
echo.
echo [INFO] Starting backend server...
echo.
echo =====================================
echo   Services Started Successfully!
echo =====================================
echo.
echo [OK] Database:    SQLite (backend\data\ficc_connect.db)
echo [OK] Backend API: http://localhost:3001/api
echo [OK] PWA App:   http://localhost:3001/ficc-connect/
echo.
echo Press Ctrl+C to stop all services
echo.

REM Run backend
cd backend && npm start
