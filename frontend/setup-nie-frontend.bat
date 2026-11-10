@echo off
setlocal
title NIE PDF HUB - Frontend Structure Setup

echo.
echo ==========================================
echo     NIE PDF HUB - Frontend Setup
echo ==========================================
echo.

REM Create folders
for %%D in (
    "public"
    "src"
    "src\assets"
    "src\components"
    "src\pages"
    "src\services"
    "src\styles"
) do (
    if not exist "%%~D" mkdir "%%~D"
)

REM Create component files
for %%F in (
    "src\components\Navbar.jsx"
    "src\components\Footer.jsx"
    "src\components\Sidebar.jsx"
    "src\components\PDFCard.jsx"
    "src\components\Loader.jsx"
) do (
    if not exist "%%~F" type nul > "%%~F"
)

REM Create page files
for %%F in (
    "src\pages\Home.jsx"
    "src\pages\Departments.jsx"
    "src\pages\Subjects.jsx"
    "src\pages\Materials.jsx"
    "src\pages\PDFViewer.jsx"
    "src\pages\AdminLogin.jsx"
    "src\pages\AdminDashboard.jsx"
) do (
    if not exist "%%~F" type nul > "%%~F"
)

REM Create service, styles, and root files
for %%F in (
    "src\services\api.js"
    "src\styles\global.css"
    "src\styles\home.css"
    "src\styles\admin.css"
    "src\App.jsx"
    "src\main.jsx"
    ".env"
) do (
    if not exist "%%~F" type nul > "%%~F"
)

echo Frontend folders and files are ready.
echo Existing files were left unchanged.
echo.
echo Next: run npm install, then npm run dev from the frontend folder.
echo.
pause
endlocal
