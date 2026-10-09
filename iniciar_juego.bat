@echo off
title El Despertar de Vigirima - Servidor de Desarrollo
color 0E

echo ===============================================================================
echo     PROYECTO CULTURA: EL DESPERTAR DE VIGIRIMA (NIVEL 1)
echo     Parque Arqueologico Piedra Pintada - Naguanagua, Carabobo, Venezuela
echo ===============================================================================
echo.
echo Iniciando servidor local en el puerto 8000...
echo.

:: Obtener la direccion IP local para conectar desde celulares
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP: =%

echo [PC] Acceso local en computadora:
echo      http://localhost:8000
echo.
echo [MOVIL] Acceso desde tu celular (conectado al mismo Wi-Fi):
echo      http://%IP%:8000
echo.
echo Presiona Ctrl + C en esta ventana para detener el servidor cuando termines.
echo ===============================================================================
echo.

:: Abrir automaticamente en el navegador predeterminado
start http://localhost:8000

:: Iniciar servidor HTTP con Python
python -m http.server 8000
pause
