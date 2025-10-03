#!/bin/bash

# Skrypt uruchomieniowy dla aplikacji Odwiedziny Chorych (JavaScript)

echo "🚀 Uruchamianie aplikacji Odwiedziny Chorych (JavaScript)..."

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany. Zainstaluj Node.js 14.0.0 lub nowszy."
    echo "   Pobierz z: https://nodejs.org/"
    exit 1
fi

# Sprawdź wersję Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Wymagana wersja Node.js 14.0.0 lub nowsza. Obecna wersja: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) - OK"

# Sprawdź czy npm jest zainstalowany
if ! command -v npm &> /dev/null; then
    echo "❌ npm nie jest zainstalowany."
    exit 1
fi

echo "✅ npm $(npm -v) - OK"

# Sprawdź czy package.json istnieje
if [ ! -f "package.json" ]; then
    echo "❌ Plik package.json nie istnieje. Uruchom skrypt z katalogu js-version/"
    exit 1
fi

# Sprawdź czy node_modules istnieje
if [ ! -d "node_modules" ]; then
    echo "📦 Instalowanie zależności..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Błąd instalacji zależności"
        exit 1
    fi
    echo "✅ Zależności zainstalowane"
else
    echo "✅ Zależności już zainstalowane"
fi

# Sprawdź czy katalog data istnieje
if [ ! -d "src/data" ]; then
    echo "📁 Tworzenie katalogu danych..."
    mkdir -p src/data
fi

# Sprawdź czy pliki danych istnieją
if [ ! -f "src/data/chorzy.json" ]; then
    echo "📄 Tworzenie pustych plików danych..."
    echo '[]' > src/data/chorzy.json
    echo '[]' > src/data/szafarze.json
    echo '{}' > src/data/kalendarz.json
    echo '{}' > src/data/kalendarz_2025.json
    echo '{}' > src/data/kalendarz_2026.json
    echo '[]' > src/data/historia.json
    echo '{}' > src/data/login_lock.json
fi

# Ustaw zmienne środowiskowe
export NODE_ENV=development
export PORT=${PORT:-3000}

echo "🔧 Konfiguracja:"
echo "   - Tryb: $NODE_ENV"
echo "   - Port: $PORT"
echo "   - Katalog danych: src/data/"

# Uruchom aplikację
echo "🚀 Uruchamianie serwera..."
echo "   Aplikacja będzie dostępna pod adresem: http://localhost:$PORT"
echo "   Naciśnij Ctrl+C aby zatrzymać serwer"
echo ""

npm start


