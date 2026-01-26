# 🔄 Aktualizacja aplikacji w LocalWP - Przewodnik krok po kroku

## ⚠️ WAŻNE - Zanim zaczniesz

**ZAWSZE zrób kopię zapasową przed aktualizacją!**

Twoje dane (chorzy, szafarze, kalendarz) są bezpieczne - są w bazie danych, która nie zostanie usunięta. Ale lepiej być bezpiecznym! ✅

---

## 📋 KROK 1: Przygotowanie - Kopia zapasowa

### 1.1: Kopia zapasowa bazy danych

**Opcja A: Przez LocalWP (NAJŁATWIEJSZE)**

1. Otwórz aplikację **Local**
2. Kliknij na swoją stronę WordPress
3. Kliknij przycisk **"Open Database Admin"** (lub ikonę bazy danych)
4. Otworzy się **phpMyAdmin**
5. W lewym menu kliknij na nazwę swojej bazy danych (np. `local`)
6. Kliknij zakładkę **"Eksportuj"** (Export) u góry
7. Wybierz metodę: **"Szybka"** (Quick)
8. Kliknij **"Wykonaj"** (Go)
9. ✅ Plik SQL zostanie pobrany - zapisz go w bezpiecznym miejscu

**Opcja B: Przez WordPress (jeśli masz plugin eksportu)**

1. W panelu WordPress: **Narzędzia** → **Eksport**
2. Wybierz **"Wszystkie treści"**
3. Kliknij **"Pobierz plik eksportu"**

### 1.2: Kopia zapasowa folderu pluginu

1. W aplikacji **Local** kliknij na swoją stronę
2. Kliknij ikonę **folderu** obok nazwy strony (lub prawym → **"Reveal in Explorer"**)
3. Przejdź do: `wp-content\plugins\`
4. Znajdź folder `odwiedziny-chorych`
5. **Skopiuj** cały folder `odwiedziny-chorych`
6. **Wklej** go w bezpieczne miejsce (np. na Pulpicie lub w folderze "Backup")

✅ **Kopia zapasowa gotowa!** Możesz przejść do aktualizacji.

---

## 📥 KROK 2: Pobierz nową wersję pluginu

### 2.1: Skąd pobrać nową wersję?

**Opcja A: Z GitHuba (jeśli masz repozytorium)**
- Pobierz najnowszą wersję z repozytorium GitHub
- Rozpakuj archiwum ZIP

**Opcja B: Od dewelopera**
- Otrzymałeś nową wersję w formie folderu lub ZIP
- Rozpakuj jeśli jest w formacie ZIP

**Opcja C: Z lokalnego folderu**
- Masz zaktualizowaną wersję w innym folderze na komputerze
- Upewnij się, że to najnowsza wersja

### 2.2: Sprawdź nową wersję

Upewnij się, że masz:
- Folder `odwiedziny-chorych` z wszystkimi plikami
- Główny plik `odwiedziny-chorych.php` jest w folderze
- Wszystkie podfoldery: `includes/`, `templates/`, `assets/`, `admin/`

---

## 🔄 KROK 3: Zdezaktywuj plugin (opcjonalnie, ale bezpieczniejsze)

### 3.1: Otwórz panel WordPress

1. W aplikacji **Local** kliknij na swoją stronę
2. Kliknij przycisk **"Open Site Admin"** (lub ikonę globusa → wp-admin)
3. Zaloguj się do WordPress (jeśli wymagane)

### 3.2: Zdezaktywuj plugin

1. W panelu WordPress: **Wtyczki** → **Zainstalowane wtyczki**
2. Znajdź **"Odwiedziny Chorych"** na liście
3. Kliknij przycisk **"Wyłącz"** przy wtyczce
4. ✅ Plugin jest teraz zdezaktywowany

**Dlaczego to robimy?**
- Zapobiega konfliktom podczas kopiowania plików
- Bezpieczniejsze dla bazy danych
- WordPress nie próbuje używać plików podczas ich wymiany

---

## 📁 KROK 4: Znajdź folder pluginu w LocalWP

### 4.1: Otwórz folder strony

**Metoda A: Przez ikonę folderu (NAJŁATWIEJSZE)**

1. W aplikacji **Local** kliknij na swoją stronę
2. Kliknij ikonę **folderu** obok nazwy strony
3. ✅ Otworzy się Eksplorator Windows z folderem strony

**Metoda B: Przez menu kontekstowe**

1. W aplikacji **Local** kliknij **prawym przyciskiem** na stronę
2. Wybierz **"Reveal in Explorer"** (Windows) lub **"Reveal in Finder"** (Mac)
3. ✅ Otworzy się folder strony

### 4.2: Przejdź do folderu plugins

1. W otwartym folderze strony przejdź do: `wp-content\plugins\`
2. Powinieneś zobaczyć folder `odwiedziny-chorych`

**Ścieżka przykładowa:**
```
C:\Users\TwojeImie\Local Sites\twoja-strona\app\public\wp-content\plugins\odwiedziny-chorych\
```

---

## 🗑️ KROK 5: Usuń stary folder pluginu

### 5.1: Zmień nazwę na backup (ZALECANE)

**To jest bezpieczniejsze niż usunięcie!**

1. W folderze `wp-content\plugins\` znajdź folder `odwiedziny-chorych`
2. Kliknij na niego **prawym przyciskiem myszy**
3. Wybierz **"Zmień nazwę"** (Rename)
4. Zmień nazwę na: `odwiedziny-chorych-backup-2025-01-15` (z dzisiejszą datą)
5. Naciśnij **Enter**

✅ **Stary plugin jest teraz bezpiecznie zapisany jako backup!**

### 5.2: Lub usuń folder (jeśli masz już kopię zapasową)

1. Kliknij na folder `odwiedziny-chorych` **prawym przyciskiem**
2. Wybierz **"Usuń"** (Delete)
3. Potwierdź usunięcie

⚠️ **Uwaga:** Upewnij się, że masz kopię zapasową przed usunięciem!

---

## 📦 KROK 6: Skopiuj nową wersję pluginu

### 6.1: Skopiuj nowy folder

1. Znajdź nową wersję pluginu (folder `odwiedziny-chorych` z aktualizacją)
2. **Skopiuj** cały folder (Ctrl+C lub prawym → Kopiuj)
3. Wróć do folderu `wp-content\plugins\` w LocalWP
4. **Wklej** folder (Ctrl+V lub prawym → Wklej)

### 6.2: Sprawdź czy skopiowano poprawnie

Upewnij się, że w folderze `wp-content\plugins\odwiedziny-chorych\` są:
- ✅ Plik `odwiedziny-chorych.php` (główny plik pluginu)
- ✅ Folder `includes/`
- ✅ Folder `templates/`
- ✅ Folder `assets/`
- ✅ Folder `admin/`
- ✅ Inne pliki i foldery

---

## ✅ KROK 7: Aktywuj plugin

### 7.1: Otwórz panel WordPress

1. W aplikacji **Local** kliknij na swoją stronę
2. Kliknij przycisk **"Open Site Admin"**
3. Jeśli nie jesteś zalogowany, zaloguj się

### 7.2: Aktywuj plugin

1. W panelu WordPress: **Wtyczki** → **Zainstalowane wtyczki**
2. Znajdź **"Odwiedziny Chorych"** na liście
3. Kliknij przycisk **"Włącz"** przy wtyczce
4. ✅ Plugin jest teraz aktywny!

**Jeśli widzisz błąd:**
- Sprawdź logi błędów (Krok 8)
- Sprawdź czy wszystkie pliki są skopiowane
- Sprawdź czy folder ma poprawną nazwę

---

## 🔍 KROK 8: Sprawdź czy wszystko działa

### 8.1: Sprawdź aplikację

1. W aplikacji **Local** kliknij **"Open Site"**
2. Przejdź do strony z aplikacją (ta z shortcode `[odwiedziny_chorych]`)
3. Zaloguj się (hasło: `PomocDlaChorych!` lub Twoje zmienione hasło)
4. Sprawdź czy:
   - ✅ Kalendarz się wyświetla
   - ✅ Lista chorych działa
   - ✅ Lista szafarzy działa
   - ✅ Wszystkie funkcje działają poprawnie

### 8.2: Sprawdź logi błędów

**W LocalWP:**

1. W aplikacji **Local** kliknij na swoją stronę
2. Kliknij zakładkę **"Logs"** (lub ikonę logów)
3. Sprawdź `php-errors.log` - czy są jakieś błędy?

**W WordPress:**

1. W panelu WordPress: **Narzędzia** → **Logi błędów** (jeśli masz plugin)
2. Lub sprawdź plik: `wp-content\debug.log` (jeśli jest włączony debug)

### 8.3: Sprawdź konsolę przeglądarki

1. Otwórz aplikację w przeglądarce
2. Naciśnij **F12** (otwórz narzędzia deweloperskie)
3. Przejdź do zakładki **"Console"**
4. Sprawdź czy nie ma błędów JavaScript (czerwone komunikaty)

### 8.4: Sprawdź REST API

1. W przeglądarce otwórz:
   ```
   http://twoja-strona.local/wp-json/odwiedziny-chorych/v1/
   ```
2. Powinien wyświetlić się JSON (może być pusty, ale nie błąd 404)
3. Jeśli widzisz błąd 404, sprawdź permalinks w WordPress

---

## 🎉 KROK 9: Gotowe!

Jeśli wszystko działa poprawnie:

1. ✅ **Aplikacja jest zaktualizowana!**
2. ✅ **Wszystkie dane są bezpieczne** (chorzy, szafarze, kalendarz)
3. ✅ **Możesz usunąć backup** (jeśli chcesz, ale lepiej zostaw na kilka dni)

---

## 🆘 Co zrobić jeśli coś nie działa?

### Problem 1: Plugin nie aktywuje się

**Rozwiązanie:**
1. Sprawdź logi błędów w LocalWP (zakładka "Logs")
2. Sprawdź czy wszystkie pliki są skopiowane
3. Sprawdź czy folder ma poprawną nazwę: `odwiedziny-chorych`
4. Zrestartuj stronę w LocalWP: **Stop Site** → **Start Site**

### Problem 2: Aplikacja nie wyświetla się

**Rozwiązanie:**
1. Sprawdź czy plugin jest aktywny
2. Sprawdź czy shortcode jest poprawny: `[odwiedziny_chorych]`
3. Wyczyść cache przeglądarki: **Ctrl+F5**
4. Zrestartuj stronę w LocalWP

### Problem 3: Błędy JavaScript

**Rozwiązanie:**
1. Otwórz konsolę przeglądarki (F12 → Console)
2. Sprawdź jakie błędy są wyświetlane
3. Sprawdź czy pliki JS są załadowane (F12 → Network)
4. Wyczyść cache przeglądarki

### Problem 4: Dane zniknęły

**Rozwiązanie:**
1. **NIE PANIKUJ!** Dane są w bazie danych
2. Sprawdź czy plugin jest aktywny
3. Sprawdź czy baza danych działa (Local → Open Database Admin)
4. Jeśli problem pozostaje, przywróć backup (Krok 10)

---

## 🔙 KROK 10: Przywróć backup (jeśli coś poszło nie tak)

### 10.1: Przywróć folder pluginu

1. W folderze `wp-content\plugins\` znajdź folder backup (np. `odwiedziny-chorych-backup-2025-01-15`)
2. **Usuń** nowy folder `odwiedziny-chorych` (jeśli istnieje)
3. **Zmień nazwę** folderu backup z powrotem na `odwiedziny-chorych`
4. W panelu WordPress: **Wtyczki** → **Włącz** plugin

### 10.2: Przywróć bazę danych (jeśli trzeba)

1. W LocalWP: **Open Database Admin** (phpMyAdmin)
2. Wybierz bazę danych
3. Kliknij **"Importuj"** (Import)
4. Wybierz plik SQL z kopii zapasowej
5. Kliknij **"Wykonaj"**

---

## 📋 Checklist aktualizacji

Przed aktualizacją:
- [ ] Kopia zapasowa bazy danych
- [ ] Kopia zapasowa folderu pluginu
- [ ] Nowa wersja pluginu gotowa

Podczas aktualizacji:
- [ ] Plugin zdezaktywowany
- [ ] Stary folder zmieniony na backup (lub usunięty)
- [ ] Nowy folder skopiowany
- [ ] Plugin aktywowany

Po aktualizacji:
- [ ] Aplikacja działa poprawnie
- [ ] Wszystkie funkcje działają
- [ ] Brak błędów w logach
- [ ] Brak błędów w konsoli przeglądarki
- [ ] REST API działa

---

## 💡 Wskazówki

### Szybsza aktualizacja (dla zaawansowanych)

Jeśli często aktualizujesz plugin, możesz użyć Site Shell:

```bash
# W LocalWP: Open Site Shell
cd wp-content/plugins

# Zmień nazwę starego folderu
mv odwiedziny-chorych odwiedziny-chorych-backup

# Skopiuj nowy folder (dostosuj ścieżkę źródłową)
cp -r "C:/Users/TwojeImie/Documents/odwiedziny-chorych-js/wordpress-plugin/odwiedziny-chorych" .

# Sprawdź czy skopiowano
ls -la odwiedziny-chorych
```

### Automatyczna aktualizacja (przyszłość)

W przyszłości można dodać automatyczne aktualizacje przez WordPress, ale na razie **aktualizacja ręczna jest bezpieczniejsza** - masz pełną kontrolę.

---

## ✅ Podsumowanie - Szybki start

1. **Kopia zapasowa** (baza danych + folder pluginu)
2. **Pobierz nową wersję** pluginu
3. **Zdezaktywuj** plugin w WordPress
4. **Zmień nazwę** starego folderu na backup
5. **Skopiuj** nowy folder pluginu
6. **Aktywuj** plugin w WordPress
7. **Sprawdź** czy wszystko działa
8. **Gotowe!** 🎉

**Czas trwania:** 5-10 minut

---

## 📞 Wsparcie

Jeśli masz problemy z aktualizacją:
1. Sprawdź tę instrukcję krok po kroku
2. Sprawdź logi błędów w LocalWP
3. Przywróć backup jeśli coś poszło nie tak
4. Sprawdź `ROZWIAZYWANIE_PROBLEMOW_LOCALWP.md` dla dodatkowej pomocy

---

**Powodzenia z aktualizacją!** 🚀

