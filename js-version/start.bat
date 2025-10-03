@echo off
REM Skrypt uruchomieniowy dla aplikacji Odwiedziny Chorych (JavaScript) - Windows

echo 🚀 Uruchamianie aplikacji Odwiedziny Chorych (JavaScript)...

REM Sprawdź czy Node.js jest zainstalowany
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nie jest zainstalowany. Zainstaluj Node.js 14.0.0 lub nowszy.
    echo    Pobierz z: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js zainstalowany

REM Sprawdź czy npm jest zainstalowany
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm nie jest zainstalowany.
    pause
    exit /b 1
)

echo ✅ npm zainstalowany

REM Sprawdź czy package.json istnieje
if not exist "package.json" (
    echo ❌ Plik package.json nie istnieje. Uruchom skrypt z katalogu js-version/
    pause
    exit /b 1
)

REM Sprawdź czy node_modules istnieje
if not exist "node_modules" (
    echo 📦 Instalowanie zależności...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Błąd instalacji zależności
        pause
        exit /b 1
    )
    echo ✅ Zależności zainstalowane
) else (
    echo ✅ Zależności już zainstalowane
)

REM Sprawdź czy katalog data istnieje
if not exist "src\data" (
    echo 📁 Tworzenie katalogu danych...
    mkdir src\data
)

REM Sprawdź czy pliki danych istnieją
if not exist "src\data\chorzy.json" (
    echo 📄 Tworzenie pustych plików danych...
    echo [] > src\data\chorzy.json
    echo [] > src\data\szafarze.json
    echo {} > src\data\kalendarz.json
    echo {} > src\data\kalendarz_2025.json
    echo {} > src\data\kalendarz_2026.json
    echo [] > src\data\historia.json
    echo {} > src\data\login_lock.json
)

REM Ustaw zmienne środowiskowe
set NODE_ENV=development
if "%PORT%"=="" set PORT=3000

echo 🔧 Konfiguracja:
echo    - Tryb: %NODE_ENV%
echo    - Port: %PORT%
echo    - Katalog danych: src\data\

REM Uruchom aplikację
echo 🚀 Uruchamianie serwera...
echo    Aplikacja będzie dostępna pod adresem: http://localhost:%PORT%
echo    Naciśnij Ctrl+C aby zatrzymać serwer
echo.

npm start


