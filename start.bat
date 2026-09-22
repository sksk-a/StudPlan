@echo off
setlocal
cd /d "%~dp0"
title StudPlan

where node >nul 2>&1
if errorlevel 1 (
    echo Ошибка: node.exe не найден. Проверьте установку Node.js.
    goto :failed
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo Ошибка: npm.cmd не найден. Проверьте установку Node.js.
    goto :failed
)
if not exist "node_modules\" (
    echo Ошибка: Сначала запустите npm.cmd install в папке проекта.
    goto :failed
)
if not exist "server\.env" (
    echo Ошибка: Создайте server\.env, используя server\.env.example.
    echo См. README.md для инструкций по настройке базы данных.
    goto :failed
)

echo Адреса служб StudPlan:
node -e "const {port}=require('./server/src/config'); console.log('Фронтенд запущен:  http://localhost:5173'); console.log('Бэкенд запущен:   http://localhost:'+port); console.log('Клиент БД запущен: http://127.0.0.1:5555');;"
if errorlevel 1 goto :failed
echo.
echo Starting services in separate console windows...
echo PostgreSQL must already be running and migrations must be applied.
echo Wait for the startup message in each window before opening its address.
echo To stop a service, press Ctrl+C in its window.
echo.

start "Запуск бэкенда" cmd /k "npm.cmd run dev:server"
start "Запуск фронтенда" cmd /k "npm.cmd run dev:client"
start "Запуск клиента БД" cmd /k "npm.cmd run db:studio"

pause
exit /b 0

:failed
echo.
pause
exit /b 1
