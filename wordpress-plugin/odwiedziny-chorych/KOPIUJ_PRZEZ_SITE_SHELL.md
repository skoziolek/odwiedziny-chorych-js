# Jak skopiować plugin przez Site Shell w LocalWP - Najłatwiejsza metoda

## 🚀 Szybka metoda przez Site Shell

### Krok 1: Otwórz Site Shell w Local

1. Otwórz program **Local**
2. Kliknij na swoją stronę WordPress
3. Kliknij przycisk **"Open Site Shell"** (ikonę terminala)
   - Lub: Kliknij prawym przyciskiem na stronę → "Open Site Shell"

✅ **Otworzy się terminal w katalogu strony**

---

## 📋 Metoda 1: Jeśli masz plugin w folderze projektu

### Załóżmy, że masz plugin w:
```
C:\Users\TwojeImie\Documents\Odwiedziny chorych\odwiedziny-chorych-js\wordpress-plugin\odwiedziny-chorych
```

### W Site Shell wykonaj:

```bash
# Przejdź do folderu plugins
cd wp-content/plugins

# Skopiuj cały folder pluginu (dostosuj ścieżkę źródłową!)
# Windows (w Site Shell używamy / zamiast \):
cp -r "C:/Users/TwojeImie/Documents/Odwiedziny chorych/odwiedziny-chorych-js/wordpress-plugin/odwiedziny-chorych" .

# Sprawdź czy folder został skopiowany
ls -la

# Powinien pojawić się folder: odwiedziny-chorych
```

**Gotowe!** Plugin jest skopiowany.

---

## 📋 Metoda 2: Jeśli masz plugin jako ZIP

```bash
# Przejdź do folderu plugins
cd wp-content/plugins

# Skopiuj plik ZIP (dostosuj ścieżkę)
cp "C:/Users/TwojeImie/Desktop/odwiedziny-chorych.zip" .

# Rozpakuj
unzip odwiedziny-chorych.zip

# Usuń ZIP (opcjonalnie)
rm odwiedziny-chorych.zip

# Sprawdź
ls -la
```

---

## 📋 Metoda 3: Najprostsza - jeśli jesteś w folderze projektu

Jeśli masz otwarty terminal w folderze projektu, możesz użyć:

```bash
# W terminalu projektu (NIE w Site Shell):
# Przejdź do folderu pluginu
cd wordpress-plugin/odwiedziny-chorych

# Skopiuj przez Site Shell (musisz znać ścieżkę docelową)
# Otwórz Site Shell w Local i wykonaj:
# (w Site Shell)
cp -r "C:/Users/TwojeImie/Documents/Odwiedziny chorych/odwiedziny-chorych-js/wordpress-plugin/odwiedziny-chorych" wp-content/plugins/
```

---

## 📋 Metoda 4: Przez Git (jeśli masz repozytorium)

Jeśli plugin jest na GitHub, możesz sklonować:

```bash
# W Site Shell:
cd wp-content/plugins

# Sklonuj repozytorium
git clone https://github.com/TWOJA_NAZWA/odwiedziny-chorych.git

# Lub jeśli masz inny branch:
git clone -b feature/js-migration https://github.com/TWOJA_NAZWA/odwiedziny-chorych-js.git odwiedziny-chorych
```

---

## ✅ Weryfikacja

Po skopiowaniu sprawdź:

```bash
# Sprawdź czy folder istnieje
ls -la wp-content/plugins/odwiedziny-chorych

# Sprawdź czy główny plik istnieje
ls -la wp-content/plugins/odwiedziny-chorych/odwiedziny-chorych.php

# Jeśli widzisz plik - plugin jest gotowy!
```

---

## 🎯 Dalsze kroki (te same co zawsze)

1. **Aktywuj plugin** w WordPress:
   - Otwórz `http://twoja-strona.local/wp-admin`
   - Wtyczki → Zainstalowane wtyczki
   - Kliknij "Włącz" przy "Odwiedziny Chorych"

2. **Dodaj shortcode** na stronę:
   - Strony → Dodaj nową
   - Wpisz: `[odwiedziny_chorych]`
   - Opublikuj

3. **Gotowe!** 🎉

---

## 💡 Wskazówki

### Jak znaleźć dokładną ścieżkę do pluginu?

**W PowerShell (Windows):**
```powershell
# Przejdź do folderu pluginu
cd "C:\Users\TwojeImie\Documents\Odwiedziny chorych\odwiedziny-chorych-js\wordpress-plugin\odwiedziny-chorych"

# Wyświetl pełną ścieżkę
pwd
```

**Skopiuj ścieżkę i użyj w Site Shell** (zmień `\` na `/`)

### Sprawdź gdzie jesteś w Site Shell:

```bash
# Wyświetl obecną ścieżkę
pwd

# Wyświetl zawartość folderu
ls -la
```

### Najczęstsza ścieżka w Site Shell:
```
/home/your-name/Local Sites/twoja-strona/app/public
```

---

## 🔄 Aktualizacja pluginu (gdy wprowadzisz zmiany)

```bash
# W Site Shell:
cd wp-content/plugins/odwiedziny-chorych

# Usuń stary plugin (UWAGA: usuwa dane!)
# LUB po prostu nadpisz pliki:

# Skopiuj nowe pliki (nadpisuje istniejące)
cp -r "C:/ścieżka/do/nowego/pluginu/odwiedziny-chorych/"* .

# Lub tylko konkretne pliki:
cp "C:/ścieżka/app.js" assets/js/app.js
cp "C:/ścieżka/style.css" assets/css/style.css
```

---

**Gotowe!** To najszybsza metoda. 🚀



