@echo off
title Beauty Salon CRM - Dev Mode
echo ========================================
echo   Beauty Salon CRM - Starting Dev Mode
echo ========================================
echo.

echo [1/3] Checking Docker containers...
docker-compose ps
echo.

echo [2/3] Starting API Server (port 3000)...
start "API Server" cmd /k "cd /d "%~dp0api-server" && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting CRM Frontend (port 5174)...
start "CRM Frontend" cmd /k "cd /d "%~dp0crm-frontend-react" && npm run dev"

echo.
echo ========================================
echo   Services starting:
echo   - API Server:    http://localhost:3000
echo   - CRM Frontend:  http://localhost:5174
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
