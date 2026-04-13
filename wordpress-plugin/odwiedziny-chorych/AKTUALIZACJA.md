# Aktualizacja pluginu - Instrukcja

## ⚠️ WAŻNE - Przed aktualizacją

**ZAWSZE zrób kopię zapasową przed aktualizacją!**

1. **Kopia zapasowa bazy danych**
   - W panelu WordPress: Narzędzia → Eksport
   - Lub przez phpMyAdmin: wyeksportuj bazę danych

2. **Kopia zapasowa plików**
   - Skopiuj folder `wp-content/plugins/odwiedziny-chorych` na dysk lokalny

---

## Metoda 1: Przez FTP/SFTP (Rekomendowana) ⭐

### Krok 1: Pobierz nową wersję
- Pobierz zaktualizowany folder `odwiedziny-chorych`

### Krok 2: Połącz się z serwerem przez FTP
- Użyj klienta FTP (np. FileZilla, WinSCP)
- Połącz się z serwerem WordPress

### Krok 3: Zdezaktywuj plugin (opcjonalnie, ale bezpieczniejsze)
1. Zaloguj się do panelu WordPress
2. Przejdź do: Wtyczki → Zainstalowane wtyczki
3. Kliknij "Wyłącz" przy "Odwiedziny Chorych"

### Krok 4: Wgraj nowe pliki
1. Przejdź do: `/wp-content/plugins/`
2. **Usuń stary folder** `odwiedziny-chorych` (lub zmień nazwę na `odwiedziny-chorych-backup`)
3. **Wgraj nowy folder** `odwiedziny-chorych` z wszystkimi plikami

### Krok 5: Aktywuj plugin
1. W panelu WordPress: Wtyczki → Zainstalowane wtyczki
2. Kliknij "Włącz" przy "Odwiedziny Chorych"

### Krok 6: Sprawdź czy działa
1. Wejdź na stronę z aplikacją
2. Sprawdź czy wszystko działa poprawnie
3. Sprawdź logi błędów (jeśli są)

---

## Metoda 2: Przez Panel WordPress (File Manager)

### Krok 1: Zaloguj się do panelu hostingowego
- cPanel, Plesk, DirectAdmin, itp.

### Krok 2: Otwórz File Manager
- Znajdź opcję "File Manager" lub "Menedżer plików"

### Krok 3: Przejdź do folderu pluginu
- `public_html/wp-content/plugins/` (lub podobna ścieżka)

### Krok 4: Zdezaktywuj plugin w WordPress
- Przez panel WordPress: Wtyczki → Wyłącz

### Krok 5: Usuń stary folder
- Kliknij prawym na `odwiedziny-chorych` → Usuń
- Lub zmień nazwę na `odwiedziny-chorych-backup`

### Krok 6: Wgraj nowy folder
- Kliknij "Upload" lub "Wgraj"
- Wybierz nowy folder `odwiedziny-chorych`
- Rozpakuj jeśli jest w formacie ZIP

### Krok 7: Aktywuj plugin
- W panelu WordPress: Wtyczki → Włącz

---

## Metoda 3: Przez SSH (dla zaawansowanych)

```bash
# 1. Połącz się z serwerem przez SSH
ssh uzytkownik@serwer.pl

# 2. Przejdź do katalogu pluginów
cd /ścieżka/do/wordpress/wp-content/plugins/

# 3. Zrób kopię zapasową
cp -r odwiedziny-chorych odwiedziny-chorych-backup-$(date +%Y%m%d)

# 4. Usuń stary folder
rm -rf odwiedziny-chorych

# 5. Wgraj nowy folder (przez SCP lub wcześniej wgrany)
# Jeśli masz nowy folder lokalnie:
scp -r /lokalna/ścieżka/odwiedziny-chorych uzytkownik@serwer.pl:/ścieżka/do/wordpress/wp-content/plugins/

# 6. Ustaw uprawnienia
chmod -R 755 odwiedziny-chorych
chown -R www-data:www-data odwiedziny-chorych
```

---

## Co się dzieje z danymi podczas aktualizacji?

### ✅ Dane są bezpieczne!
- **Baza danych NIE jest usuwana** - wszystkie dane pozostają
- **Tabele MySQL pozostają** - chorzy, szafarze, kalendarz itp.
- **Tylko pliki PHP/JS/CSS są aktualizowane**

### ⚠️ Uwaga na zmiany w bazie danych
Jeśli nowa wersja wymaga zmian w strukturze bazy:
- Plugin automatycznie zaktualizuje tabele przy aktywacji
- Sprawdź logi błędów po aktualizacji
- W razie problemów przywróć kopię zapasową

---

## Sprawdzanie po aktualizacji

### 1. Sprawdź czy plugin działa
- Wejdź na stronę z aplikacją
- Zaloguj się
- Sprawdź czy wszystkie funkcje działają

### 2. Sprawdź logi błędów
- Panel WordPress: Narzędzia → Logi błędów
- Lub plik: `wp-content/debug.log`

### 3. Sprawdź REST API
- Otwórz: `https://twoja-strona.pl/wp-json/odwiedziny-chorych/v1/szafarze`
- Powinno zwrócić JSON (lub błąd autoryzacji - to OK)

### 4. Sprawdź konsolę przeglądarki
- F12 → Console
- Sprawdź czy nie ma błędów JavaScript

---

## Co zrobić jeśli coś nie działa?

### 1. Przywróć kopię zapasową
- Przywróć stary folder pluginu
- Aktywuj plugin
- Sprawdź czy działa

### 2. Sprawdź uprawnienia plików
- Foldery: `755`
- Pliki: `644`

### 3. Sprawdź wersję PHP
- Plugin wymaga PHP 7.4+
- Sprawdź w panelu hostingowym

### 4. Sprawdź logi błędów
- `wp-content/debug.log`
- Logi serwera (panel hostingowy)

### 5. Skontaktuj się z administratorem
- Jeśli nic nie pomaga, przywróć kopię zapasową
- Skontaktuj się z deweloperem

---

## Automatyczna aktualizacja (przyszłość)

W przyszłości można dodać automatyczne aktualizacje przez WordPress:

1. **Dodaj plik `update.json`** na zewnętrznym serwerze
2. **Zarejestruj plugin w WordPress.org** (opcjonalnie)
3. **Użyj biblioteki aktualizacji** (np. EDD Software Licensing)

Ale na razie **aktualizacja ręczna jest bezpieczniejsza** - masz pełną kontrolę.

---

## Checklist aktualizacji

- [ ] Kopia zapasowa bazy danych
- [ ] Kopia zapasowa folderu pluginu
- [ ] Zdezaktywowanie pluginu (opcjonalnie)
- [ ] Usunięcie starego folderu
- [ ] Wgranie nowego folderu
- [ ] Aktywacja pluginu
- [ ] Sprawdzenie działania aplikacji
- [ ] Sprawdzenie logów błędów
- [ ] Sprawdzenie konsoli przeglądarki

---

## Przykładowy scenariusz aktualizacji

**Sytuacja:** Chcesz zaktualizować z wersji 1.0.0 do 1.1.0

1. **Pobierz nową wersję** (np. z GitHuba lub od dewelopera)
2. **Zrób kopię zapasową** przez FTP
3. **Zdezaktywuj plugin** w WordPress
4. **Wgraj nowy folder** przez FTP
5. **Aktywuj plugin** w WordPress
6. **Sprawdź czy działa** - wejdź na stronę z aplikacją
7. **Gotowe!** ✅

**Czas trwania:** 5-10 minut

---

## Wsparcie

Jeśli masz problemy z aktualizacją:
1. Sprawdź tę instrukcję
2. Sprawdź logi błędów
3. Przywróć kopię zapasową
4. Skontaktuj się z deweloperem


