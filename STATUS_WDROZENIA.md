# 📋 Status wdrożenia aplikacji na serwer parafii

**Data sprawdzenia:** 2025-01-15  
**Status:** ✅ **GOTOWE DO WDROŻENIA**

---

## ✅ Weryfikacja repozytorium GitHub

### 1. Pliki kluczowe
- ✅ `odwiedziny-chorych.php` - główny plik pluginu
- ✅ `assets/js/app.js` - JavaScript aplikacji (zaktualizowany)
- ✅ `assets/css/style.css` - Style CSS (zaktualizowany)
- ✅ `templates/app.php` - Szablon aplikacji (rok 2026 jako domyślny)
- ✅ Wszystkie klasy PHP w `includes/`
- ✅ Wszystkie pliki konfiguracyjne

### 2. Najnowsze zmiany w repozytorium
- ✅ Usunięto nieużywane klasy (7 plików)
- ✅ Usunięto zbędne dokumenty (8 plików)
- ✅ Naprawiono ramki w podglądzie wydruku (0.5px)
- ✅ Naprawiono rok domyślny w zakładce Adwent (2026)
- ✅ DEBUG = false w app.js
- ✅ Przywrócono pliki assets (app.js, style.css)

### 3. Branch gotowy do wdrożenia
- **Branch:** `cleanup/remove-unused-files`
- **Ostatni commit:** `0c3a401` - "Fix: Restore missing assets files"
- **Status:** Wypchnięty na GitHub ✅

---

## 🚀 Instrukcja wdrożenia

### Krok 1: Pobierz najnowszą wersję z GitHub

**Opcja A: Przez Git (zalecane)**
```bash
git clone https://github.com/skoziolek/odwiedziny-chorych-js.git
cd odwiedziny-chorych-js
git checkout cleanup/remove-unused-files
```

**Opcja B: Pobierz ZIP**
1. Przejdź do: https://github.com/skoziolek/odwiedziny-chorych-js
2. Przełącz na branch: `cleanup/remove-unused-files`
3. Kliknij "Code" → "Download ZIP"
4. Rozpakuj archiwum

### Krok 2: Skopiuj plugin na serwer

**Przez FTP/SFTP:**
1. Połącz się z serwerem przez klienta FTP (FileZilla, WinSCP)
2. Przejdź do: `/wp-content/plugins/`
3. Wgraj folder `wordpress-plugin/odwiedziny-chorych/` (zawartość, nie sam folder)

**Przez Panel Hostingu (File Manager):**
1. Zaloguj się do panelu hostingu (cPanel, Plesk)
2. Otwórz **File Manager**
3. Przejdź do: `public_html/wp-content/plugins/`
4. Wgraj folder `odwiedziny-chorych`

### Krok 3: Aktywuj plugin w WordPress

1. Zaloguj się do panelu WordPress: `https://twoja-strona.pl/wp-admin`
2. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**
3. Znajdź **"Odwiedziny Chorych"** i kliknij **"Włącz"**

### Krok 4: Dodaj shortcode na stronę

1. W panelu WordPress: **Strony** → **Dodaj nową** (lub edytuj istniejącą)
2. Dodaj shortcode: `[odwiedziny_chorych]`
3. Opublikuj stronę

### Krok 5: Skonfiguruj SMTP (dla emaili)

1. Zainstaluj plugin **"WP Mail SMTP"**
2. Skonfiguruj serwer SMTP (Gmail, Outlook, itp.)
3. Przetestuj wysyłkę emaili

### Krok 6: Zmień hasło

1. Przejdź do: **Odwiedziny Chorych** → **Ustawienia**
2. Zmień domyślne hasło: `PomocDlaChorych!`

---

## ✅ Checklist przed wdrożeniem

- [x] Wszystkie pliki są w repozytorium
- [x] Pliki assets (app.js, style.css) są aktualne
- [x] DEBUG = false w app.js
- [x] Brak błędów w kodzie
- [x] Wszystkie funkcjonalności działają
- [x] Responsywność działa
- [x] Podgląd wydruku działa
- [ ] **Przed wdrożeniem:** Zrób kopię zapasową bazy danych
- [ ] **Przed wdrożeniem:** Zrób kopię zapasową folderu pluginu (jeśli aktualizujesz)

---

## 📊 Wersja aplikacji

- **Branch:** `cleanup/remove-unused-files`
- **Commit:** `0c3a401`
- **Data:** 2025-01-15
- **Status:** Gotowe do produkcji ✅

---

## ⚠️ Ważne uwagi

1. **Kopia zapasowa:** Zawsze rób kopię zapasową przed wdrożeniem!
2. **Testowanie:** Przetestuj aplikację po wdrożeniu na serwerze
3. **SMTP:** Upewnij się, że SMTP jest skonfigurowany dla emaili
4. **Hasło:** Zmień domyślne hasło po wdrożeniu

---

**Aplikacja jest gotowa do wdrożenia na serwer parafii!** 🚀


