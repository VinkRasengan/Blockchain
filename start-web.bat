@echo off
echo Starting MyCoin Web Application...

echo.
echo Building TypeScript...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Build failed! Please check for errors.
    pause
    exit /b 1
)

echo.
echo Starting MyCoin Web Server on port 8080...
echo.
echo ========================================
echo  MyCoin Web Wallet is starting...
echo ========================================
echo.
echo  Web Interface: http://localhost:8080
echo  API Endpoint:  http://localhost:8080/api  
echo  Explorer:      http://localhost:8080/explorer
echo.
echo ========================================
echo.

node dist/server.js

pause
