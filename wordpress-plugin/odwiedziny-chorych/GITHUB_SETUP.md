# Instrukcja publikacji na GitHub

## 📋 Przygotowanie do publikacji

### Krok 1: Zainicjalizuj Git (jeśli jeszcze nie)

```bash
cd wordpress-plugin/odwiedziny-chorych
git init
```

### Krok 2: Dodaj pliki

```bash
git add .
```

### Krok 3: Utwórz pierwszy commit

```bash
git commit -m "Initial commit - Odwiedziny Chorych v1.0.0

- Pełna funkcjonalność aplikacji
- Responsywność na mobile i desktop
- System emaili z przypomnieniami
- Bezpieczeństwo zaimplementowane
- Gotowa do produkcji"
```

### Krok 4: Utwórz repozytorium na GitHub

1. Przejdź na: https://github.com
2. Kliknij **"New repository"** (lub **"+"** → **"New repository"**)
3. Wpisz nazwę: `odwiedziny-chorych` (lub inną)
4. Opis: `Plugin WordPress - System zarządzania odwiedzinami chorych`
5. Wybierz: **Private** (jeśli chcesz prywatne) lub **Public**
6. **NIE zaznaczaj** "Initialize with README" (bo już mamy README)
7. Kliknij **"Create repository"**

### Krok 5: Połącz lokalne repozytorium z GitHub

GitHub pokaże Ci instrukcje, ale oto one:

```bash
git remote add origin https://github.com/TWOJA_NAZWA/odwiedziny-chorych.git
git branch -M main
git push -u origin main
```

**Jeśli używasz SSH:**
```bash
git remote add origin git@github.com:TWOJA_NAZWA/odwiedziny-chorych.git
git branch -M main
git push -u origin main
```

### Krok 6: Zaktualizuj README.md

W pliku `README.md` znajdź i zaktualizuj:
```markdown
git clone https://github.com/TWOJA_NAZWA/odwiedziny-chorych.git
```
Zastąp `TWOJA_NAZWA` swoją nazwą użytkownika GitHub.

---

## 🔄 Kolejne aktualizacje

Gdy wprowadzisz zmiany:

```bash
# Sprawdź status
git status

# Dodaj zmiany
git add .

# Utwórz commit
git commit -m "Opis zmian"

# Wyślij na GitHub
git push
```

---

## 📝 Zalecane ustawienia repozytorium

### Opis repozytorium (GitHub)
```
Plugin WordPress - System zarządzania odwiedzinami chorych. Kalendarz dyżurów, zarządzanie szafarzami i chorymi, raporty, automatyczne przypomnienia email.
```

### Tematy (Topics) na GitHub:
- `wordpress-plugin`
- `wordpress`
- `php`
- `mysql`
- `calendar`
- `hospital-visits`
- `church-management`

### Licencja:
- Możesz dodać plik `LICENSE` jeśli chcesz
- WordPress używa GPL v2 lub nowszej

---

## 🔐 Bezpieczeństwo - Czego NIE publikować

⚠️ **NIGDY nie publikuj:**
- Plików z hasłami
- Plików konfiguracyjnych z danymi dostępowymi
- Kluczy API
- Informacji o bazie danych
- Plików `.env`

✅ **Pliki pomocnicze do usunięcia (opcjonalne):**
- `clear-cache-now.php` - tylko do lokalnego użytku
- `KOPIUJ_PLIKI*.bat`, `KOPIUJ_PLIKI.ps1` - tylko do lokalnego użytku
- `KOPIUJ_PLIKI_DO_LOCALWP.md` - instrukcja lokalna

**Te pliki nie stanowią zagrożenia**, ale można je usunąć dla czystości repozytorium.

---

## ✅ Checklist przed publikacją

- [x] Wszystkie pliki są na miejscu
- [x] README.md jest aktualny
- [x] INSTRUKCJA_DLA_ADMINA.md zawiera pełne instrukcje
- [x] .gitignore jest utworzony
- [x] Console.log są warunkowe (DEBUG = false)
- [x] Aria-labels dodane
- [x] Brak wrażliwych danych w kodzie
- [ ] README.md zaktualizowany z linkiem do repozytorium (po utworzeniu)

---

## 📦 Zalecana struktura README na GitHub

README.md powinien zawierać:
1. Krótki opis
2. Wymagania
3. Instrukcję instalacji
4. Link do szczegółowej dokumentacji
5. Screenshoty (opcjonalne)
6. Licencja

---

**Gotowe do publikacji!** 🚀

