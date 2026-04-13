# Jak wyczyścić cache WordPress

## 🔍 Metoda 1: Przez panel WordPress (jeśli masz plugin cache)

### Najpopularniejsze pluginy cache:

#### **WP Super Cache**
1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **WP Super Cache** → **Zawartość**
3. Kliknij **"Usuń cache"** lub **"Delete Cache"**

#### **W3 Total Cache**
1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **Performance** → **Dashboard**
3. Kliknij **"Empty All Caches"**

#### **WP Rocket**
1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **WP Rocket** → **Dashboard**
3. Kliknij **"Clear cache"** lub **"Wyczyść cache"**

#### **LiteSpeed Cache**
1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **LiteSpeed Cache** → **Toolbox**
3. Kliknij **"Purge All"**

#### **Autoptimize**
1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **Autoptimize** → **Settings**
3. Kliknij **"Delete Cache"**

---

## 🔧 Metoda 2: Przez LocalWP (jeśli używasz LocalWP)

### Opcja A: Restart serwera
1. Otwórz **LocalWP**
2. Kliknij prawym przyciskiem na swoją stronę
3. Wybierz **"Restart"** lub **"Restart All"**
4. Poczekaj aż strona się zrestartuje

### Opcja B: Wyczyść cache przez terminal
1. Otwórz **LocalWP**
2. Kliknij prawym przyciskiem na stronę → **"Open Site Shell"**
3. Wpisz:
   ```bash
   wp cache flush
   ```
4. Naciśnij Enter

---

## 🛠️ Metoda 3: Przez WP-CLI (jeśli masz dostęp)

Otwórz terminal w katalogu WordPress i wpisz:
```bash
wp cache flush
```

---

## 🗑️ Metoda 4: Ręczne usunięcie plików cache

### Jeśli używasz LocalWP:

1. Otwórz folder strony w LocalWP:
   - Kliknij prawym przyciskiem na stronę → **"Reveal in Explorer"** (lub ikona folderu)
   
2. Przejdź do folderu cache:
   ```
   wp-content/cache/
   ```
   
3. Usuń zawartość folderu `cache/` (NIE usuń samego folderu!)

### Lokalizacja plików cache:
- `wp-content/cache/` - główny folder cache
- `wp-content/wp-cache-config.php` - konfiguracja WP Super Cache
- `wp-content/advanced-cache.php` - cache advanced

---

## 🔄 Metoda 5: Deaktywacja i reaktywacja pluginu

Jeśli masz problemy z cache, możesz tymczasowo wyłączyć plugin cache:

1. Zaloguj się do WordPress Admin (`/wp-admin`)
2. Przejdź do: **Wtyczki** → **Zainstalowane wtyczki**
3. Znajdź plugin cache (np. WP Super Cache, W3 Total Cache)
4. Kliknij **"Deaktywuj"**
5. Odśwież stronę
6. Jeśli działa, możesz ponownie aktywować plugin

---

## ⚡ Metoda 6: Szybkie rozwiązanie - restart LocalWP

Najprostsza metoda dla LocalWP:

1. Otwórz **LocalWP**
2. Kliknij prawym przyciskiem na stronę
3. Wybierz **"Stop"**
4. Poczekaj 5 sekund
5. Kliknij **"Start"**
6. Odśwież stronę w przeglądarce

---

## 🎯 Metoda 7: Wyczyść cache przeglądarki + WordPress

Często problem jest w cache przeglądarki, nie WordPress:

1. **Wyczyść cache przeglądarki:**
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Wybierz: "Obrazy i pliki w pamięci podręcznej"
   - Kliknij "Wyczyść dane"

2. **Twarde odświeżenie:**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

3. **Wyczyść cache WordPress** (jedną z metod powyżej)

---

## 📋 Checklist - Co zrobić krok po kroku:

### Dla LocalWP:
- [ ] 1. Zrestartuj stronę w LocalWP (Stop → Start)
- [ ] 2. Wyczyść cache przeglądarki (`Ctrl + Shift + Delete`)
- [ ] 3. Twarde odświeżenie strony (`Ctrl + Shift + R`)
- [ ] 4. Sprawdź czy zmiany są widoczne

### Jeśli masz plugin cache:
- [ ] 1. Zaloguj się do `/wp-admin`
- [ ] 2. Znajdź plugin cache w menu
- [ ] 3. Kliknij "Clear Cache" / "Wyczyść cache"
- [ ] 4. Wyczyść cache przeglądarki
- [ ] 5. Twarde odświeżenie strony

### Jeśli nadal nie działa:
- [ ] 1. Tymczasowo wyłącz plugin cache
- [ ] 2. Sprawdź czy zmiany są widoczne
- [ ] 3. Jeśli tak - problem był w pluginie cache
- [ ] 4. Jeśli nie - problem może być gdzie indziej

---

## 🆘 Rozwiązywanie problemów

### Problem: "Nie widzę opcji cache w WordPress"

**Rozwiązanie:**
- Możesz nie mieć zainstalowanego pluginu cache
- WordPress domyślnie nie ma cache
- Problem może być tylko w cache przeglądarki

### Problem: "Cache się nie czyści"

**Rozwiązanie:**
1. Wyłącz plugin cache
2. Usuń ręcznie folder `wp-content/cache/`
3. Zrestartuj serwer (LocalWP: Stop → Start)
4. Włącz ponownie plugin cache

### Problem: "Nadal widzę stare wersje plików"

**Rozwiązanie:**
1. Sprawdź czy pliki zostały zapisane (data modyfikacji)
2. Wyczyść cache przeglądarki całkowicie
3. Użyj trybu incognito/privatny w przeglądarce
4. Sprawdź w DevTools (F12) → Network → czy pliki są ładowane z serwera

---

## 💡 Najszybsza metoda dla LocalWP:

```powershell
# W terminalu LocalWP (Open Site Shell):
wp cache flush
```

LUB po prostu:
1. **Stop** strony w LocalWP
2. **Start** strony w LocalWP
3. Odśwież przeglądarkę (`Ctrl + Shift + R`)

---

**Ostatnia aktualizacja:** 2025-12-29

