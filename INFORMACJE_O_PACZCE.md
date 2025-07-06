# Informacje o Paczce Deployment

## Plik: `Odwiedziny_Chorych_v1.2.0_Deployment.zip`
**Rozmiar:** 52 KB  
**Data utworzenia:** 2025-07-05  
**Wersja aplikacji:** 1.2.0

## Zawartość paczki:
✅ **Wszystkie pliki aplikacji** (PHP, JavaScript, CSS)  
✅ **System backupów** z przykładowymi danymi  
✅ **Plik .htaccess** dla konfiguracji serwera Apache  
✅ **Instrukcje instalacji** dla administratora  
✅ **Dokumentacja** (README.md)  

## Pliki w paczce:
- `index.php` - Strona główna
- `login.php` - System logowania
- `main.php` - Główny panel aplikacji
- `api.php` - API do zarządzania danymi
- `auth.php` - System autoryzacji
- `backup.php` - System kopii zapasowych
- `historia.php` - Historia odwiedzin i raporty
- `logout.php` - Wylogowanie
- `*.js` - Pliki JavaScript (6 plików)
- `style.css` - Style CSS
- `*.json` - Pliki danych (szyfrowane)
- `backups/` - Katalog z kopiami zapasowymi
- `.htaccess` - Konfiguracja serwera
- `INSTRUKCJE_INSTALACJI.md` - Instrukcje dla administratora
- `README.md` - Dokumentacja aplikacji

## Instrukcje dla administratora:
1. Rozpakuj plik ZIP do katalogu głównego strony
2. Ustaw odpowiednie uprawnienia (755 dla plików PHP, 644 dla JSON)
3. Sprawdź czy serwer obsługuje PHP 8.0+
4. Otwórz stronę w przeglądarce
5. Zaloguj się hasłem: `PomocDlaChorych!`

## Bezpieczeństwo:
- Wszystkie dane są szyfrowane
- Pliki JSON są zabezpieczone przed bezpośrednim dostępem
- System automatycznych kopii zapasowych
- Kontrola dostępu przez hasło

## Wymagania serwera:
- PHP 8.0 lub nowszy
- Rozszerzenia: json, openssl
- Serwer webowy (Apache/Nginx)

---
**Gotowe do wdrożenia na serwer produkcyjny!** 