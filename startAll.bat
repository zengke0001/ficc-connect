@echo off
chcp 65001 >nul

REM FICC Connect - Start All Services (Windows)
REM This script starts PostgreSQL in Docker and runs the backend (with PWA)

echo =====================================
echo   FICC Connect - Starting Services
echo =====================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo Please start Docker first
    exit /b 1
)

REM Start PostgreSQL
echo.
echo [INFO] Starting PostgreSQL...

REM Check if postgres container exists
docker ps -a --format "{{.Names}}" | findstr /C:"ficc-postgres" >nul
if errorlevel 1 (
    REM Create new container
    echo [INFO] Creating PostgreSQL container...
    docker run -d ^
        --name ficc-postgres ^
        -e POSTGRES_DB=ficc_connect ^
        -e POSTGRES_USER=postgres ^
        -e POSTGRES_PASSWORD=postgres ^
        -p 5432:5432 ^
        -v ficc_postgres_data:/var/lib/postgresql/data ^
        postgres:16-alpine >nul
    echo [OK] PostgreSQL container created and started
    echo [INFO] Waiting for PostgreSQL to be ready...
    timeout /t 3 /nobreak >nul
) else (
    REM Start existing container
    docker start ficc-postgres >nul
    echo [OK] PostgreSQL container started
)

REM Wait for PostgreSQL to accept connections
echo [INFO] Checking PostgreSQL connection...
:wait_loop
docker exec ficc-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo|set /p="."
    timeout /t 1 /nobreak >nul
    goto wait_loop
)
echo.
echo [OK] PostgreSQL is ready!

REM Initialize database if tables don't exist
echo.
echo [INFO] Checking database schema...
docker exec ficc-postgres psql -U postgres -d ficc_connect -c "SELECT 1 FROM users LIMIT 1" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Database not initialized. Running schema migration...
    docker cp backend\migrations\000_full_schema.sql ficc-postgres:/tmp/
    docker exec ficc-postgres psql -U postgres -d ficc_connect -f /tmp/000_full_schema.sql >nul
    echo [OK] Database initialized successfully!
) else (
    echo [OK] Database already initialized
)

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo.
    echo [INFO] Installing backend dependencies...
    cd backend && npm install && cd ..
)

REM Check if PWA dependencies are installed
if not exist "pwa\node_modules" (
    echo.
    echo [INFO] Installing PWA dependencies...
    cd pwa && npm install && cd ..
)

REM Build PWA
echo.
echo [INFO] Building PWA...
cd pwa && npm run build && cd ..
echo [OK] PWA build complete

REM Copy PWA build to backend public directory
echo [INFO] Copying PWA build to backend...
if not exist "backend\public" mkdir backend\public
xcopy /s /y /q pwa\dist\* backend\public\ >nul
echo [OK] PWA copied to backend\public

REM Start backend
echo.
echo [INFO] Starting backend server...
echo.
echo =====================================
echo   Services Started Successfully!
echo =====================================
echo.
echo [OK] PostgreSQL: localhost:5432
echo [OK] Backend API: http://localhost:3001/api
echo [OK] PWA App:   http://localhost:3001/ficc-connect/
echo.
echo Press Ctrl+C to stop all services
echo.

REM Run backend
cd backend && npm start
