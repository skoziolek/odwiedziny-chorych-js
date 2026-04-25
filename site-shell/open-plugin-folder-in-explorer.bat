@echo off
set "P=%USERPROFILE%\Local Sites\odwiedziny-chorych\app\public\wp-content\plugins\odwiedziny-chorych"
if exist "%P%" start "" explorer.exe "%P%" & goto :eof
echo Folder not found:
echo   %P%
echo.
echo Open Local Sites manually: %USERPROFILE%\Local Sites
pause
