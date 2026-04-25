# Site shell — podmiana pluginu na Local

Szybka synchronizacja folderu `wordpress-plugin/odwiedziny-chorych` z repozytorium do instalacji WordPress w **LocalWP**.

## Najprościej (bez configu)

Jeśli strona w Local nazywa się **`odwiedziny-chorych`** i wtyczka leży w  
`%USERPROFILE%\Local Sites\odwiedziny-chorych\app\public\wp-content\plugins\odwiedziny-chorych`  
— **dwuklik `sync.bat`**. Skrypt sam znajdzie ten folder.

Sprawdzenie folderu: dwuklik **`open-plugin-folder-in-explorer.bat`** (otwiera ten katalog w Eksploratorze).

## Gdy sync zgłosi „Could not find…”

1. Otwórz Eksplorator: `%USERPROFILE%\Local Sites`
2. Wejdź w swoją stronę → `app\public\wp-content\plugins\odwiedziny-chorych`
3. Skopiuj ścieżkę z paska adresu, ustaw zmienną środowiskową **OC_LOCAL_PLUGIN_DIR** na ten folder (albo skopiuj `config.example.ps1` → `config.local.ps1` i ustaw `$TargetPluginDir`).

## Windows (opcjonalnie: config.local.ps1)

1. Skopiuj `config.example.ps1` → `config.local.ps1` (gdy auto-wykrywanie nie trafia).
2. Uruchom `sync.bat` lub w PowerShellu: `.\sync-to-local.ps1` (z folderu `site-shell`).

## Git Bash / WSL

1. Skopiuj `config.example.sh` → `config.local.sh` i ustaw `TARGET_PLUGIN_DIR`.
2. `chmod +x sync-to-local.sh && ./sync-to-local.sh`

## Gdzie w Local jest folder pluginu?

W Local: **Open Site Shell** → `pwd` — zwykle `.../app/public`. Plugin:  
`wp-content/plugins/odwiedziny-chorych`.

Synchronizacja jest **lustrzana** (`/MIR` / `rsync --delete`): pliki usunięte w repozytorium znikną też w docelowym folderze pluginu.

Po sync odśwież stronę z aplikacją (**Ctrl+F5**), żeby wczytać nowe `app.js` / `style.css`.
