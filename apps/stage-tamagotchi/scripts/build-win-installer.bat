@echo off
setlocal

set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%build-win-installer.ps1"

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [Mira ASSISTANT] Build failed. See errors above.
  exit /b %ERRORLEVEL%
)

echo.
echo [Mira ASSISTANT] Build completed.
exit /b 0
