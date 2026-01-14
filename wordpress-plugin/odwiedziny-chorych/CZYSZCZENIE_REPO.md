# Czyszczenie repozytorium przed publikacją

## Pliki które NIE powinny być w repozytorium

Te pliki są tylko do lokalnego użytku i zostały dodane do `.gitignore`:

### ⚠️ Pliki pomocnicze (dodane do .gitignore):
- `clear-cache-now.php` - pomocniczy skrypt do czyszczenia cache
- `KOPIUJ_PLIKI_CMD.bat` - skrypt batch do kopiowania plików
- `KOPIUJ_PLIKI.ps1` - skrypt PowerShell do kopiowania plików
- `KOPIUJ_PLIKI_DO_LOCALWP.md` - instrukcja dla lokalnego środowiska
- `ROZWIAZYWANIE_PROBLEMOW_LOCALWP.md` - rozwiązania problemów lokalnych

### 📝 Pliki opcjonalne (dokumentacja deweloperska):

Możesz je zostawić (dla deweloperów) lub usunąć:
- `RAPORT_TESTOWANIA.md` - raport z testowania
- `ROZWIAZANIA_MOBILE.md` - rozwiązania responsive
- `TESTOWANIE_EMAILI.md` - dokumentacja testowania emaili

**Rekomendacja:** Zostaw je - nie szkodzą, a mogą być przydatne.

---

## Jak wyczyścić repozytorium

### Opcja 1: Zostaw w .gitignore (ZALECANE)

Pliki są już w `.gitignore`, więc nie będą dodane do Git:

```bash
git status  # Sprawdź czy są w "Untracked files"
git add .gitignore
git commit -m "Add .gitignore - exclude local helper files"
```

### Opcja 2: Usuń pliki całkowicie

Jeśli chcesz je usunąć z dysku:

```bash
# Usuń pliki pomocnicze
rm clear-cache-now.php
rm KOPIUJ_PLIKI_CMD.bat
rm KOPIUJ_PLIKI.ps1
rm KOPIUJ_PLIKI_DO_LOCALWP.md
rm ROZWIAZYWANIE_PROBLEMOW_LOCALWP.md

# Opcjonalnie - usuń dokumentację deweloperską
# rm RAPORT_TESTOWANIA.md
# rm ROZWIAZANIA_MOBILE.md
# rm TESTOWANIE_EMAILI.md
```

---

## ✅ Pliki które POWINNY być w repozytorium

- ✅ Kod źródłowy (PHP, JS, CSS)
- ✅ Templates
- ✅ README.md
- ✅ INSTRUKCJA_DLA_ADMINA.md
- ✅ GITHUB_SETUP.md
- ✅ PUBLIKACJA_GITHUB.md
- ✅ Wszystkie pliki dokumentacji produkcyjnej
- ✅ .gitignore

---

## 🚀 Po wyczyszczeniu

```bash
git add .
git commit -m "Clean repository - remove local helper files from tracking"
git push
```

