@echo off
title Dừng VnExpress Lich Thi Dau Server
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   DỪNG MÁY CHỦ LỊCH THI ĐẤU (PORT 3000)
echo ========================================================
echo.

echo Đang tắt Node.js Web Server trên cổng 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================================
echo   ĐÃ DỪNG THÀNH CÔNG!
echo ========================================================
timeout /t 3 >nul
