# Publikacja na GitHub - Szybka Instrukcja

## 🚀 Krok po kroku

### 1. Przejdź do folderu pluginu

```bash
cd wordpress-plugin/odwiedziny-chorych
```

### 2. Zainicjalizuj Git (jeśli jeszcze nie)

```bash
git init
```

### 3. Dodaj wszystkie pliki

```bash
git add .
```

### 4. Utwórz pierwszy commit

```bash
git commit -m "Initial commit - Odwiedziny Chorych v1.0.0

- Pełna funkcjonalność aplikacji
- Responsywność na mobile i desktop  
- System emaili z przypomnieniami
- Bezpieczeństwo zaimplementowane
- Gotowa do produkcji"
```

### 5. Utwórz repozytorium na GitHub

1. Przejdź na: https://github.com
2. Kliknij **"New"** (lub **"+"** → **"New repository"**)
3. Nazwa: `odwiedziny-chorych`
4. Opis: `Plugin WordPress - System zarządzania odwiedzinami chorych`
5. Wybierz **Public** lub **Private**
6. **NIE zaznaczaj** "Add a README file"
7. Kliknij **"Create repository"**

### 6. Połącz z GitHub i wyślij kod

GitHub pokaże Ci instrukcje. Wykonaj:

```bash
git remote add origin https://github.com/TWOJA_NAZWA/odwiedziny-chorych.git
git branch -M main
git push -u origin main
```

**Zastąp `TWOJA_NAZWA` swoją nazwą użytkownika GitHub!**

### 7. Zaktualizuj linki w README

W pliku `README.md` i `INSTRUKCJA_DLA_ADMINA.md` znajdź:
```
https://github.com/TWOJE_REPO/odwiedziny-chorych.git
```

Zastąp `TWOJE_REPO` na `TWOJA_NAZWA/odwiedziny-chorych`

---

## ✅ Gotowe!

Repozytorium jest teraz na GitHub! 🎉

---

## 📝 Dla kolejnych aktualizacji

```bash
git add .
git commit -m "Opis zmian"
git push
```

