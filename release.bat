@echo off
cd /d "%~dp0"
for /f "usebackq" %%v in (`node -p "require('./package.json').version"`) do set VER=%%v
echo Releasing Pocket Assistant version %VER%
echo.
echo Before continuing: did you raise "version" in package.json and test with npm run debug?
set /p OK=Type y to continue: 
if /i not "%OK%"=="y" goto :eof
set /p GH_TOKEN=Paste your GitHub token and press Enter: 
cls
echo Building and uploading version %VER% ... this takes a few minutes.
if exist dist rmdir /s /q dist
call npm run release
set GH_TOKEN=
echo.
echo Finished. Next: open GitHub Releases, edit the Draft and click Publish release.
pause
