@echo off
setlocal
cd /d "%~dp0"
echo NextStep N1: Downloading original N1 word, kanji and grammar datasets...
echo Internet connection is required.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Download_N1_Data.ps1"
if errorlevel 1 (
 echo.
 echo Download failed. Make sure you have an internet connection.
 pause
 exit /b 1
)
echo.
echo SUCCESS. The real N1 datasets are now in the data folder.
echo Upload the ENTIRE N1 folder to your GitHub repository.
pause
