@echo off
chcp 65001 > nul
title MYSTRA Loyihasini Ishga Tushirish

echo ========================================================
echo        MYSTRA - Tizimni Ishga Tushirish
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Python kutubxonalarini tekshirish va o'rnatish...
cd mystra-django
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [XATO] Python kutubxonalarini o'rnatishda xatolik yuz berdi!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Ma'lumotlar bazasini sozlash...
python manage.py migrate
python manage.py bootstrap

echo.
echo [3/4] Frontend kutubxonalarini tekshirish...
cd ..\react_src
if not exist node_modules (
    echo Node modullari o'rnatilmoqda...
    call npm install
)

echo.
echo [4/4] Serverlarni ishga tushirish...
echo - Backend:  http://127.0.0.1:8000/api/
echo - Frontend: http://localhost:5173/
echo.

:: Backendni ishga tushirish
start "MYSTRA Backend (Django)" cmd /k "cd /d "%~dp0mystra-django" && python manage.py runserver 127.0.0.1:8000"

:: Frontendni ishga tushirish
start "MYSTRA Frontend (React)" cmd /k "cd /d "%~dp0react_src" && npm run dev"

:: 3 soniya kutib, brauzerni ochish
timeout /t 3 > nul
start http://localhost:5173/

echo ========================================================
echo  MYSTRA muvaffaqiyatli ishga tushirildi!
echo  Brauzerda: http://localhost:5173/
echo.
echo  Kirish: login va parollar .env faylida (ADMIN_PASSWORD, TEACHER_PASSWORD).
echo.
echo  Serverlarni to'xtatish uchun ochilgan oynalarni yoping.
echo ========================================================
pause
