@echo off
title VnExpress Lich Thi Dau Server
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   KHỞI ĐỘNG MÁY CHỦ LỊCH THI ĐẤU (VNEXPRESS)
echo ========================================================
echo.

:: 1. Kiểm tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "NODE_EXE=node"
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    ) else (
        echo [LỖI] Không tìm thấy Node.js! Hãy kiểm tra cài đặt.
        pause
        exit /b 1
    )
)

:: 2. Khởi động Web Server (Node.js Express trên cổng 3000)
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if %ERRORLEVEL% neq 0 (
    echo Đang khởi động Server trên cổng 3000...
    start "LTDBD Server" /min "%NODE_EXE%" server.js
    timeout /t 3 /nobreak >nul
) else (
    echo Server đã đang chạy trên http://localhost:3000
)

echo.
echo ========================================================
echo   SERVER ĐÃ SẴN SÀNG!
echo ========================================================
echo   - Trang chủ:        http://localhost:3000
echo   - Lịch thi đấu:     http://localhost:3000/lich-thi-dau
echo   - Kết quả:          http://localhost:3000/ket-qua
echo   - Ngoại hạng Anh:   http://localhost:3000/giai-dau/ngoai-hang-anh
echo   - Champions League: http://localhost:3000/giai-dau/champions-league
echo   (Khác với dự án Music4U đang chạy cổng 8000)
echo ========================================================
echo.

start http://localhost:3000

echo Để dừng máy chủ, hãy chạy file 'stop-server.bat'.
echo Cửa sổ này sẽ tự đóng sau 5 giây...
timeout /t 5 >nul
