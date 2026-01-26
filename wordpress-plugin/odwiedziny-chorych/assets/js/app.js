/**
 * Aplikacja Odwiedziny Chorych - WordPress
 */

(function() {
    'use strict';

    // Debug mode - ustaw na false w produkcji, true do debugowania
    const DEBUG = false; // Zmień na true aby włączyć console.log

    // Konfiguracja API
    const API_URL = ocData.apiUrl;
    const NONCE = ocData.nonce;
    
    // Helper function dla debug logging
    function debugLog(...args) {
        if (DEBUG) console.log(...args);
    }
    
    function debugError(...args) {
        if (DEBUG) console.error(...args);
    }
    
    function debugWarn(...args) {
        if (DEBUG) console.warn(...args);
    }

    // Stan aplikacji
    let authToken = sessionStorage.getItem('oc_authToken') || null;
    let currentYear = new Date().getFullYear().toString();
    let szafarze = [];
    let chorzy = [];
    let kalendarzData = {};
    let adwentData = {};
    let historiaData = {}; // Przechowuje odwiedzonych chorych dla każdej daty

    // ==================== UTILITIES ====================

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function formatDate(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function formatDateForAPI(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function showMessage(message, type = 'success') {
        const container = document.getElementById('oc-mainApp') || document.getElementById('oc-app');
        const existing = container.querySelector('.oc-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = `oc-message oc-message-${type}`;
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            z-index: 10001;
            animation: fadeIn 0.3s;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
        `;
        div.textContent = message;
        container.appendChild(div);

        setTimeout(() => div.remove(), 3000);
    }

    async function confirm(message) {
        return window.confirm(message);
    }

    // ==================== API CALLS ====================

    async function apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': NONCE,
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Debug - loguj request dla /auth/verify
        if (endpoint === '/auth/verify') {
            debugLog('apiCall: Wysyłam request do', `${API_URL}${endpoint}`);
            debugLog('apiCall: Token w nagłówku:', authToken ? `Bearer ${authToken.substring(0, 10)}...` : 'BRAK');
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });

        // Debug - loguj response dla /auth/verify
        if (endpoint === '/auth/verify') {
            debugLog('apiCall: Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                debugError('apiCall: Response error:', errorText);
            }
        }

        if (response.status === 401) {
            debugWarn('apiCall: 401 Unauthorized - czyszczę token');
            authToken = null;
            sessionStorage.removeItem('oc_authToken');
            showLoginScreen();
            throw new Error('Sesja wygasła');
        }

        return response;
    }

    // ==================== AUTH ====================

    async function login(password) {
        try {
            debugLog('login: Rozpoczynam logowanie');
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': NONCE,
                },
                body: JSON.stringify({ username: 'admin', password }),
            });

            const data = await response.json();
            debugLog('login: Response:', response.status, data);

            if (response.ok && data.success) {
                authToken = data.token;
                sessionStorage.setItem('oc_authToken', authToken);
                debugLog('login: Token zapisany:', authToken ? authToken.substring(0, 10) + '...' : 'BRAK');
                
                // Natychmiast zweryfikuj token po logowaniu
                const verifyResult = await checkAuth();
                debugLog('login: Weryfikacja po logowaniu:', verifyResult);
                
                return true;
            } else {
                throw new Error(data.message || 'Nieprawidłowe hasło');
            }
        } catch (error) {
            debugError('Błąd logowania:', error);
            throw error;
        }
    }

    async function checkAuth() {
        if (!authToken) {
            debugLog('checkAuth: Brak tokenu');
            return false;
        }

        try {
            debugLog('checkAuth: Weryfikuję token:', authToken.substring(0, 10) + '...');
            const response = await apiCall('/auth/verify');
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                debugError('checkAuth: Błąd weryfikacji:', response.status, errorData);
                // Jeśli 401, wyczyść token i pokaż ekran logowania
                if (response.status === 401) {
                    authToken = null;
                    sessionStorage.removeItem('oc_authToken');
                    showLoginScreen();
                }
                return false;
            }
            
            debugLog('checkAuth: Token poprawny');
            return true;
        } catch (error) {
            debugError('checkAuth: Wyjątek:', error);
            return false;
        }
    }

    async function logout() {
        try {
            await apiCall('/auth/logout', { method: 'POST' });
        } catch (e) {
            debugError('Błąd wylogowania:', e);
        } finally {
            authToken = null;
            sessionStorage.removeItem('oc_authToken');
            showLoginScreen();
        }
    }

    // ==================== SZAFARZE ====================

    async function loadSzafarze() {
        try {
            const response = await apiCall('/szafarze');
            if (response.ok) {
                szafarze = await response.json();
            }
        } catch (e) {
            debugError('Błąd ładowania szafarzy:', e);
        }
    }

    async function saveSzafarze() {
        try {
            syncSzafarzeFromDOM();
            const response = await apiCall('/szafarze', {
                method: 'POST',
                body: JSON.stringify(szafarze),
            });
            if (response.ok) {
                showMessage('Szafarze zapisani');
            }
        } catch (e) {
            debugError('Błąd zapisu szafarzy:', e);
            showMessage('Błąd zapisu szafarzy', 'error');
        }
    }

    function syncSzafarzeFromDOM() {
        const tbody = document.getElementById('oc-tabelaSzafarzeBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        szafarze = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                szafarze.push({
                    imie: cells[0].textContent.trim(),
                    nazwisko: cells[1].textContent.trim(),
                    adres: cells[2].textContent.trim(),
                    email: cells[3].textContent.trim(),
                    telefon: cells[4].textContent.trim(),
                });
            }
        });
    }

    function renderSzafarze() {
        const tbody = document.getElementById('oc-tabelaSzafarzeBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        szafarze.forEach((szafarz, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td contenteditable="true">${szafarz.imie || ''}</td>
                <td contenteditable="true">${szafarz.nazwisko || ''}</td>
                <td contenteditable="true">${szafarz.adres || ''}</td>
                <td contenteditable="true">${szafarz.email || ''}</td>
                <td contenteditable="true">${szafarz.telefon || ''}</td>
                <td>
                    <button class="oc-btn oc-btn-danger oc-btn-small" onclick="ocApp.deleteSzafarz(${index})">Usuń</button>
                </td>
            `;

            // Zapisz przy zmianie
            row.querySelectorAll('[contenteditable]').forEach(cell => {
                cell.addEventListener('blur', debounce(saveSzafarze, 1000));
            });

            tbody.appendChild(row);
        });
    }

    function addSzafarz() {
        szafarze.push({ imie: '', nazwisko: '', adres: '', email: '', telefon: '' });
        renderSzafarze();
    }

    async function deleteSzafarz(index) {
        if (!await confirm('Czy na pewno chcesz usunąć tego szafarza?')) return;
        szafarze.splice(index, 1);
        renderSzafarze();
        await saveSzafarze();
    }

    // ==================== CHORZY ====================

    async function loadChorzy() {
        try {
            const response = await apiCall('/chorzy');
            if (response.ok) {
                chorzy = await response.json();
            }
        } catch (e) {
            debugError('Błąd ładowania chorych:', e);
        }
    }

    async function saveChorzy() {
        try {
            syncChorzyFromDOM();
            const response = await apiCall('/chorzy/bulk', {
                method: 'POST',
                body: JSON.stringify(chorzy),
            });
            if (response.ok) {
                showMessage('Chorzy zapisani');
            }
        } catch (e) {
            debugError('Błąd zapisu chorych:', e);
            showMessage('Błąd zapisu chorych', 'error');
        }
    }

    function syncChorzyFromDOM() {
        const tbody = document.getElementById('oc-tabelaChorzyBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        chorzy = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const select = row.querySelector('select');
            if (cells.length >= 4) {
                chorzy.push({
                    imieNazwisko: cells[0].textContent.trim(),
                    adres: cells[1].textContent.trim(),
                    telefon: cells[2].textContent.trim(),
                    uwagi: cells[3].textContent.trim(),
                    status: select ? select.value : 'TAK',
                });
            }
        });
    }

    function renderChorzy() {
        const tbody = document.getElementById('oc-tabelaChorzyBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Sortuj: TAK na górze, potem NIE, alfabetycznie
        const sorted = [...chorzy].sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'TAK' ? -1 : 1;
            }
            return (a.imieNazwisko || '').localeCompare(b.imieNazwisko || '');
        });

        sorted.forEach((chory, index) => {
            const originalIndex = chorzy.indexOf(chory);
            const row = document.createElement('tr');
            row.className = chory.status === 'TAK' ? 'status-tak' : 'status-nie';
            
            row.innerHTML = `
                <td contenteditable="true">${chory.imieNazwisko || ''}</td>
                <td contenteditable="true">${chory.adres || ''}</td>
                <td contenteditable="true">${chory.telefon || ''}</td>
                <td contenteditable="true">${chory.uwagi || ''}</td>
                <td>
                    <select class="oc-status-select ${chory.status === 'TAK' ? 'status-tak' : 'status-nie'}">
                        <option value="TAK" ${chory.status === 'TAK' ? 'selected' : ''}>TAK</option>
                        <option value="NIE" ${chory.status === 'NIE' ? 'selected' : ''}>NIE</option>
                    </select>
                </td>
                <td>
                    <button class="oc-btn oc-btn-danger oc-btn-small" onclick="ocApp.deleteChory(${originalIndex})">Usuń</button>
                </td>
            `;

            // Zapisz przy zmianie
            row.querySelectorAll('[contenteditable]').forEach(cell => {
                cell.addEventListener('blur', debounce(saveChorzy, 1000));
            });

            const select = row.querySelector('select');
            select.addEventListener('change', () => {
                chory.status = select.value;
                saveChorzy();
                renderChorzy();
            });

            tbody.appendChild(row);
        });
    }

    function addChory() {
        chorzy.push({ imieNazwisko: '', adres: '', telefon: '', uwagi: '', status: 'TAK' });
        renderChorzy();
    }

    async function deleteChory(index) {
        if (!await confirm('Czy na pewno chcesz usunąć tego chorego?')) return;
        chorzy.splice(index, 1);
        renderChorzy();
        await saveChorzy();
    }

    // ==================== KALENDARZ ====================

    async function loadKalendarz() {
        try {
            const response = await apiCall(`/kalendarz?rok=${currentYear}`);
            if (response.ok) {
                kalendarzData = await response.json();
            }
        } catch (e) {
            debugError('Błąd ładowania kalendarza:', e);
        }
    }

    async function saveKalendarz() {
        try {
            syncKalendarzFromDOM();
            const response = await apiCall(`/kalendarz?rok=${currentYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_kalendarz', dane: kalendarzData }),
            });
            if (response.ok) {
                showMessage('Kalendarz zapisany');
            }
        } catch (e) {
            debugError('Błąd zapisu kalendarza:', e);
            showMessage('Błąd zapisu kalendarza', 'error');
        }
    }

    function syncKalendarzFromDOM() {
        const tbody = document.getElementById('oc-tabelaKalendarzBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        kalendarzData = {};

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const dateDisplay = cells[0]?.textContent.trim();
            if (!dateDisplay) return;

            const [day, month, year] = dateDisplay.split('.');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            const selects = row.querySelectorAll('select');
            const uwagi = cells[4]?.textContent.trim() || '';

            if (selects[0]?.value || selects[1]?.value || uwagi) {
                kalendarzData[dateKey] = {
                    osobaGlowna: selects[0]?.value || '',
                    pomocnik: selects[1]?.value || '',
                    uwagi: uwagi,
                };
            }
        });
    }

    // Funkcja pomocnicza do aplikowania stylów ramki na wierszu z najbliższym dyżurem
    function applyNextDutyRowStyles(row) {
        if (!row) {
            return;
        }
        
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) {
            return;
        }
        
        cells.forEach((cell, index) => {
            // Ustaw ramkę na wszystkich komórkach z !important (przez setProperty)
            cell.style.setProperty('border', '3px solid #ffc107', 'important');
            cell.style.setProperty('border-top', '3px solid #ffc107', 'important');
            cell.style.setProperty('border-bottom', '3px solid #ffc107', 'important');
            cell.style.setProperty('border-left', '3px solid #ffc107', 'important');
            cell.style.setProperty('border-right', '3px solid #ffc107', 'important');
            cell.style.boxSizing = 'border-box';
            
            // Również ustaw bezpośrednio przez style.border (jako backup)
            cell.style.border = '3px solid #ffc107';
            cell.style.borderTop = '3px solid #ffc107';
            cell.style.borderBottom = '3px solid #ffc107';
            cell.style.borderLeft = '3px solid #ffc107';
            cell.style.borderRight = '3px solid #ffc107';
            
            // Szczególnie ważne dla pierwszej kolumny (sticky) - upewnij się, że ramka jest widoczna
            if (index === 0) {
                cell.style.setProperty('z-index', '11', 'important');
            }
        });
    }

    function renderKalendarz() {
        const tbody = document.getElementById('oc-tabelaKalendarzBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const year = parseInt(currentYear);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let nextDutyRow = null;

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();

            // Tylko niedziele (0 = niedziela) i święta nakazane
            const isSwieto = isSwietoNakazane(date);
            if (dayOfWeek !== 0 && !isSwieto) continue;

            const dateStr = formatDateForAPI(date);
            const data = kalendarzData[dateStr] || {};
            const swietoName = getSwietoName(date) || 'Niedziela';
            
            // Sprawdź czy są odwiedzeni chorzy dla tej daty
            const visitedChorzy = historiaData[dateStr] || [];
            const hasVisited = visitedChorzy.length > 0;
            const buttonText = hasVisited ? 'Odwiedzone' : 'Zaplanowane';
            const buttonClass = hasVisited ? 'oc-btn oc-btn-small oc-btn-success' : 'oc-btn oc-btn-small';

            const row = document.createElement('tr');
            if (isSwieto) row.classList.add('swieto-row');

            // Sprawdź czy to najbliższy dyżur PRZED renderowaniem HTML
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const isNextDuty = !nextDutyRow && dateOnly >= today && currentYear === today.getFullYear().toString();
            
            // Jeśli to najbliższy dyżur, ustaw nextDutyRow
            if (isNextDuty) {
                nextDutyRow = row;
                row.classList.add('next-duty-row');
            }

            // Generuj opcje dla selectów
            const szafarzeOptions = szafarze.map(s => 
                `<option value="${s.imie}" ${data.osobaGlowna === s.imie ? 'selected' : ''}>${s.imie}</option>`
            ).join('');

            // Jeśli to najbliższy dyżur, dodaj style inline do wszystkich komórek
            const borderStyle = isNextDuty ? 'style="border: 3px solid #ffc107 !important;"' : '';
            const borderStyleInline = isNextDuty ? 'border: 3px solid #ffc107 !important;' : '';
            
            row.innerHTML = `
                <td ${borderStyle}>${formatDate(date)}</td>
                <td style="white-space: normal; word-wrap: break-word; ${borderStyleInline}">${swietoName}</td>
                <td ${borderStyle}>
                    <select class="osoba-glowna-select">
                        <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptions}
                    </select>
                </td>
                <td ${borderStyle}>
                    <select class="pomocnik-select">
                        <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptions}
                    </select>
                </td>
                <td contenteditable="true" ${borderStyle}>${data.uwagi || ''}</td>
                <td ${borderStyle}>
                    <button class="${buttonClass}" onclick="ocApp.openVisitModal('${dateStr}')" data-date="${dateStr}">${buttonText}</button>
                </td>
            `;
            
            // Jeśli są odwiedzeni chorzy, ustaw tooltip
            if (hasVisited && visitedChorzy.length > 0) {
                const button = row.querySelector('button[data-date]');
                if (button) {
                    // Użyj setTimeout żeby upewnić się, że button jest w DOM
                    setTimeout(() => {
                        setupTooltip(button, visitedChorzy);
                    }, 0);
                }
            }

            // Zapisz przy zmianie
            row.querySelectorAll('select, [contenteditable]').forEach(el => {
                el.addEventListener('change', debounce(saveKalendarz, 1000));
                el.addEventListener('blur', debounce(saveKalendarz, 1000));
            });

            tbody.appendChild(row);
        }

        // Podświetl najbliższy dyżur
        if (nextDutyRow) {
            nextDutyRow.classList.add('next-duty-row');
            
            // Zastosuj style ramki - wywołaj funkcję pomocniczą
            // Użyj setTimeout, żeby upewnić się, że wiersz jest w DOM
            setTimeout(() => {
                applyNextDutyRowStyles(nextDutyRow);
            }, 50);
            
            setTimeout(() => {
                nextDutyRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    async function createNewYear() {
        const nextYear = (parseInt(currentYear) + 1).toString();
        
        // Sprawdź czy rok już istnieje w dropdown
        const rokSelect = document.getElementById('oc-wybierzRok');
        if (rokSelect) {
            const existingOption = rokSelect.querySelector(`option[value="${nextYear}"]`);
            if (existingOption) {
                showMessage(`Rok ${nextYear} już istnieje! Wybierz go z listy rozwijalnej.`, 'error');
                return;
            }
        }

        if (!await confirm(`Czy na pewno chcesz utworzyć nowy rok ${nextYear}? To wygeneruje kalendarz na kolejny rok na podstawie obecnego.`)) {
            return;
        }

        try {
            // Pobierz dane z aktualnego roku
            const response = await apiCall(`/kalendarz?rok=${currentYear}`);
            if (!response.ok) throw new Error('Błąd wczytywania danych aktualnego roku');
            
            const currentYearData = await response.json();
            
            // Wygeneruj nowe przypisania dla nowego roku
            const newYearData = generateNewYearData(nextYear, currentYearData);
            
            // Zapisz nowy rok
            const saveResponse = await apiCall(`/kalendarz?rok=${nextYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_kalendarz', dane: newYearData }),
            });

            if (!saveResponse.ok) throw new Error('Błąd zapisu nowego roku');
            
            // Dodaj nowy rok do dropdown
            if (rokSelect) {
                const option = document.createElement('option');
                option.value = nextYear;
                option.textContent = nextYear;
                rokSelect.appendChild(option);
                rokSelect.value = nextYear;
            }
            
            // Przełącz na nowy rok
            currentYear = nextYear;
            kalendarzData = newYearData;
            await loadKalendarz();
            renderKalendarz();
            
            showMessage(`Nowy rok ${nextYear} został utworzony i załadowany!`, 'success');
            
        } catch (error) {
            debugError('Błąd podczas tworzenia nowego roku:', error);
            showMessage('Wystąpił błąd podczas tworzenia nowego roku: ' + error.message, 'error');
        }
    }

    function generateNewYearData(year, currentYearData) {
        const newYearData = {};
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        let szafarzIndex = 0;
        
        // Znajdź ostatnie przypisanie z poprzedniego roku
        if (Object.keys(currentYearData).length > 0) {
            const lastDate = Object.keys(currentYearData).sort().pop();
            const lastAssignment = currentYearData[lastDate];
            
            if (lastAssignment && lastAssignment.osobaGlowna) {
                const lastSzafarzIndex = szafarze.findIndex(s => s.imie === lastAssignment.osobaGlowna);
                if (lastSzafarzIndex !== -1) {
                    szafarzIndex = lastSzafarzIndex + 1;
                }
            }
        }

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            const isSwieto = isSwietoNakazane(date);
            
            if (dayOfWeek === 0 || isSwieto) {
                const dateStr = formatDateForAPI(date);
                if (szafarze.length > 0) {
                    newYearData[dateStr] = {
                        osobaGlowna: szafarze[szafarzIndex % szafarze.length].imie,
                        pomocnik: '',
                        uwagi: `Automatyczne przypisanie dla ${dateStr}`
                    };
                    szafarzIndex++;
                }
            }
        }
        
        return newYearData;
    }

    async function autoAssignSzafarze() {
        if (!await confirm('Czy na pewno chcesz automatycznie przypisać szafarzy według kolejności z tabeli? To nadpisze obecne przypisania.')) {
            return;
        }

        try {
            // Pobierz aktualne dane kalendarza
            const response = await apiCall(`/kalendarz?rok=${currentYear}`);
            if (!response.ok) throw new Error('Błąd wczytywania danych kalendarza');
            
            const currentData = await response.json();
            
            // Wygeneruj nowe przypisania
            const newData = await generateAutoAssignments(currentData);
            
            // Zapisz nowe przypisania
            const saveResponse = await apiCall(`/kalendarz?rok=${currentYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_kalendarz', dane: newData }),
            });

            if (!saveResponse.ok) throw new Error('Błąd zapisu nowych przypisań');
            
            // Zaktualizuj lokalne dane
            kalendarzData = newData;
            
            // Odśwież kalendarz na ekranie
            renderKalendarz();
            
            showMessage('Szafarze zostali automatycznie przypisani!', 'success');
            
        } catch (error) {
            debugError('Błąd automatycznego przypisywania:', error);
            showMessage('Błąd automatycznego przypisywania szafarzy', 'error');
        }
    }

    async function generateAutoAssignments(currentData) {
        const newData = { ...currentData };
        const year = parseInt(currentYear);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const szafarzeNames = szafarze.map(s => s.imie).filter(Boolean);
        
        let szafarzIndex = 0;
        
        // Znajdź ostatnie przypisanie z poprzedniego roku
        const previousYear = (year - 1).toString();
        try {
            const prevResponse = await apiCall(`/kalendarz?rok=${previousYear}`);
            if (prevResponse.ok) {
                const prevData = await prevResponse.json();
                const prevDates = Object.keys(prevData).sort();
                
                if (prevDates.length > 0) {
                    const lastDate = prevDates[prevDates.length - 1];
                    const lastAssignment = prevData[lastDate];
                    
                    if (lastAssignment && lastAssignment.osobaGlowna) {
                        const lastSzafarzIndex = szafarzeNames.indexOf(lastAssignment.osobaGlowna);
                        if (lastSzafarzIndex !== -1) {
                            szafarzIndex = (lastSzafarzIndex + 1) % szafarzeNames.length;
                        }
                    }
                }
            }
        } catch (error) {
            debugLog('Nie można załadować danych z poprzedniego roku, rozpoczynam od początku listy');
        }

        // Przypisz szafarzy do wszystkich niedziel i świąt
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            const dateStr = formatDateForAPI(date);
            const isSwieto = isSwietoNakazane(date);
            
            if (dayOfWeek === 0 || isSwieto) {
                if (szafarzeNames.length > 0) {
                    const assignedSzafarz = szafarzeNames[szafarzIndex % szafarzeNames.length];
                    
                    if (!newData[dateStr]) {
                        newData[dateStr] = {};
                    }
                    
                    newData[dateStr].osobaGlowna = assignedSzafarz;
                    // Usuń pomocnika z istniejących danych i nie przypisuj automatycznie
                    delete newData[dateStr].pomocnik;
                    
                    szafarzIndex++;
                }
            }
        }
        
        return newData;
    }

    async function deleteYear(year) {
        if (!await confirm(`Czy na pewno chcesz usunąć wszystkie dane dla roku ${year}? Ta operacja jest nieodwracalna.`)) {
            return;
        }

        try {
            const response = await apiCall(`/kalendarz?rok=${year}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Błąd usuwania roku');
            }

            const result = await response.json();
            
            // Usuń rok z dropdown
            const rokSelect = document.getElementById('oc-wybierzRok');
            if (rokSelect) {
                const option = rokSelect.querySelector(`option[value="${year}"]`);
                if (option) {
                    option.remove();
                }
                // Jeśli usunięty rok był aktywny, przełącz na poprzedni dostępny rok
                if (currentYear === year.toString()) {
                    const options = rokSelect.querySelectorAll('option');
                    if (options.length > 0) {
                        rokSelect.value = options[options.length - 1].value;
                        currentYear = rokSelect.value;
                        await loadKalendarz();
                        renderKalendarz();
                    }
                }
            }
            
            showMessage(result.message || `Rok ${year} został usunięty`, 'success');
            
        } catch (error) {
            debugError('Błąd usuwania roku:', error);
            showMessage('Błąd usuwania roku: ' + error.message, 'error');
        }
    }

    // Udostępnij funkcję globalnie do użycia z konsoli
    window.ocApp = window.ocApp || {};
    window.ocApp.deleteYear = deleteYear;

    // ==================== LITURGICAL CALENDAR ====================

    const swietaNakazane = {
        '2025-01-01': 'Uroczystość Świętej Bożej Rodzicielki Maryi',
        '2025-01-06': 'Objawienie Pańskie (Trzech Króli)',
        '2025-04-20': 'Niedziela Zmartwychwstania Pańskiego',
        '2025-04-21': 'Poniedziałek Wielkanocny',
        '2025-06-01': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2025-06-08': 'Uroczystość Zesłania Ducha Świętego',
        '2025-06-19': 'Boże Ciało',
        '2025-08-15': 'Wniebowzięcie NMP',
        '2025-11-01': 'Uroczystość Wszystkich Świętych',
        '2025-12-25': 'Boże Narodzenie',
        '2025-12-26': 'Drugi Dzień Bożego Narodzenia',
        '2026-01-01': 'Uroczystość Świętej Bożej Rodzicielki Maryi',
        '2026-01-06': 'Objawienie Pańskie (Trzech Króli)',
        '2026-04-05': 'Niedziela Zmartwychwstania Pańskiego',
        '2026-04-06': 'Poniedziałek Wielkanocny',
        '2026-05-17': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2026-05-24': 'Uroczystość Zesłania Ducha Świętego',
        '2026-06-04': 'Boże Ciało',
        '2026-08-15': 'Wniebowzięcie NMP',
        '2026-11-01': 'Uroczystość Wszystkich Świętych',
        '2026-12-25': 'Boże Narodzenie',
        '2026-12-26': 'Drugi Dzień Bożego Narodzenia',
        '2027-01-01': 'Uroczystość Świętej Bożej Rodzicielki Maryi',
        '2027-01-06': 'Objawienie Pańskie (Trzech Króli)',
        '2027-03-28': 'Niedziela Zmartwychwstania Pańskiego',
        '2027-03-29': 'Poniedziałek Wielkanocny',
        '2027-05-09': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2027-05-16': 'Uroczystość Zesłania Ducha Świętego',
        '2027-05-27': 'Boże Ciało',
        '2027-08-15': 'Wniebowzięcie NMP',
        '2027-11-01': 'Uroczystość Wszystkich Świętych',
        '2027-12-25': 'Boże Narodzenie',
        '2027-12-26': 'Drugi Dzień Bożego Narodzenia',
        '2028-01-01': 'Uroczystość Świętej Bożej Rodzicielki Maryi',
        '2028-01-06': 'Objawienie Pańskie (Trzech Króli)',
        '2028-04-16': 'Niedziela Zmartwychwstania Pańskiego',
        '2028-04-17': 'Poniedziałek Wielkanocny',
        '2028-05-28': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2028-06-04': 'Uroczystość Zesłania Ducha Świętego',
        '2028-06-15': 'Boże Ciało',
        '2028-08-15': 'Wniebowzięcie NMP',
        '2028-11-01': 'Uroczystość Wszystkich Świętych',
        '2028-12-25': 'Boże Narodzenie',
        '2028-12-26': 'Drugi Dzień Bożego Narodzenia',
    };

    const niedzieleLiturgiczne = {
        '2025-01-05': 'I Niedziela po Narodzeniu Pańskim',
        '2025-01-12': 'Niedziela Chrztu Pańskiego',
        '2025-01-19': 'II Niedziela zwykła',
        '2025-01-26': 'III Niedziela zwykła',
        '2025-02-02': 'IV Niedziela zwykła',
        '2025-02-09': 'V Niedziela zwykła',
        '2025-02-16': 'VI Niedziela zwykła',
        '2025-02-23': 'VII Niedziela zwykła',
        '2025-03-02': 'VIII Niedziela zwykła',
        '2025-03-09': 'I Niedziela Wielkiego Postu',
        '2025-03-16': 'II Niedziela Wielkiego Postu',
        '2025-03-23': 'III Niedziela Wielkiego Postu',
        '2025-03-30': 'IV Niedziela Wielkiego Postu',
        '2025-04-06': 'V Niedziela Wielkiego Postu',
        '2025-04-13': 'Niedziela Palmowa',
        '2025-04-27': 'II Niedziela Wielkanocna (Miłosierdzia Bożego)',
        '2025-05-04': 'III Niedziela Wielkanocna',
        '2025-05-11': 'IV Niedziela Wielkanocna',
        '2025-05-18': 'V Niedziela Wielkanocna',
        '2025-05-25': 'VI Niedziela Wielkanocna',
        '2025-06-01': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2025-06-08': 'Uroczystość Zesłania Ducha Świętego',
        '2025-06-15': 'Uroczystość Najświętszej Trójcy',
        '2025-06-22': 'XII Niedziela zwykła',
        '2025-06-29': 'XIII Niedziela zwykła',
        '2025-07-06': 'XIV Niedziela zwykła',
        '2025-07-13': 'XV Niedziela zwykła',
        '2025-07-20': 'XVI Niedziela zwykła',
        '2025-07-27': 'XVII Niedziela zwykła',
        '2025-08-03': 'XVIII Niedziela zwykła',
        '2025-08-10': 'XIX Niedziela zwykła',
        '2025-08-17': 'XX Niedziela zwykła',
        '2025-08-24': 'XXI Niedziela zwykła',
        '2025-08-31': 'XXII Niedziela zwykła',
        '2025-09-07': 'XXIII Niedziela zwykła',
        '2025-09-14': 'XXIV Niedziela zwykła',
        '2025-09-21': 'XXV Niedziela zwykła',
        '2025-09-28': 'XXVI Niedziela zwykła',
        '2025-10-05': 'XXVII Niedziela zwykła',
        '2025-10-12': 'XXVIII Niedziela zwykła',
        '2025-10-19': 'XXIX Niedziela zwykła',
        '2025-10-26': 'XXX Niedziela zwykła',
        '2025-11-02': 'XXXI Niedziela zwykła',
        '2025-11-09': 'XXXII Niedziela zwykła',
        '2025-11-16': 'XXXIII Niedziela zwykła',
        '2025-11-23': 'Uroczystość Jezusa Chrystusa Króla Wszechświata',
        '2025-11-30': 'I Niedziela Adwentu',
        '2025-12-07': 'II Niedziela Adwentu',
        '2025-12-14': 'III Niedziela Adwentu',
        '2025-12-21': 'IV Niedziela Adwentu',
        '2025-12-28': 'Święto Świętej Rodziny Jezusa, Maryi i Józefa',
        '2026-01-04': 'II Niedziela po Narodzeniu Pańskim',
        '2026-01-11': 'Niedziela Chrztu Pańskiego',
        '2026-01-18': 'II Niedziela zwykła',
        '2026-01-25': 'III Niedziela zwykła',
        '2026-02-01': 'IV Niedziela zwykła',
        '2026-02-08': 'V Niedziela zwykła',
        '2026-02-15': 'VI Niedziela zwykła',
        '2026-02-22': 'I Niedziela Wielkiego Postu',
        '2026-03-01': 'II Niedziela Wielkiego Postu',
        '2026-03-08': 'III Niedziela Wielkiego Postu',
        '2026-03-15': 'IV Niedziela Wielkiego Postu',
        '2026-03-22': 'V Niedziela Wielkiego Postu',
        '2026-03-29': 'Niedziela Palmowa',
        '2026-04-05': 'Niedziela Zmartwychwstania Pańskiego',
        '2026-04-12': 'II Niedziela Wielkanocna (Miłosierdzia Bożego)',
        '2026-04-19': 'III Niedziela Wielkanocna',
        '2026-04-26': 'IV Niedziela Wielkanocna',
        '2026-05-03': 'V Niedziela Wielkanocna',
        '2026-05-10': 'VI Niedziela Wielkanocna',
        '2026-05-17': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2026-05-24': 'Uroczystość Zesłania Ducha Świętego',
        '2026-05-31': 'Uroczystość Najświętszej Trójcy',
        '2026-06-07': 'X Niedziela zwykła',
        '2026-06-14': 'XI Niedziela zwykła',
        '2026-06-21': 'XII Niedziela zwykła',
        '2026-06-28': 'XIII Niedziela zwykła',
        '2026-07-05': 'XIV Niedziela zwykła',
        '2026-07-12': 'XV Niedziela zwykła',
        '2026-07-19': 'XVI Niedziela zwykła',
        '2026-07-26': 'XVII Niedziela zwykła',
        '2026-08-02': 'XVIII Niedziela zwykła',
        '2026-08-09': 'XIX Niedziela zwykła',
        '2026-08-16': 'XX Niedziela zwykła',
        '2026-08-23': 'XXI Niedziela zwykła',
        '2026-08-30': 'XXII Niedziela zwykła',
        '2026-09-06': 'XXIII Niedziela zwykła',
        '2026-09-13': 'XXIV Niedziela zwykła',
        '2026-09-20': 'XXV Niedziela zwykła',
        '2026-09-27': 'XXVI Niedziela zwykła',
        '2026-10-04': 'XXVII Niedziela zwykła',
        '2026-10-11': 'XXVIII Niedziela zwykła',
        '2026-10-18': 'XXIX Niedziela zwykła',
        '2026-10-25': 'XXX Niedziela zwykła',
        '2026-11-01': 'Uroczystość Wszystkich Świętych',
        '2026-11-08': 'XXXII Niedziela zwykła',
        '2026-11-15': 'XXXIII Niedziela zwykła',
        '2026-11-22': 'Uroczystość Jezusa Chrystusa Króla Wszechświata',
        '2026-11-29': 'I Niedziela Adwentu',
        '2026-12-06': 'II Niedziela Adwentu',
        '2026-12-13': 'III Niedziela Adwentu',
        '2026-12-20': 'IV Niedziela Adwentu',
        '2026-12-27': 'Święto Świętej Rodziny Jezusa, Maryi i Józefa',
        '2027-01-03': 'II Niedziela po Narodzeniu Pańskim',
        '2027-01-10': 'Niedziela Chrztu Pańskiego',
        '2027-01-17': 'II Niedziela zwykła',
        '2027-01-24': 'III Niedziela zwykła',
        '2027-01-31': 'IV Niedziela zwykła',
        '2027-02-07': 'V Niedziela zwykła',
        '2027-02-14': 'VI Niedziela zwykła',
        '2027-02-21': 'I Niedziela Wielkiego Postu',
        '2027-02-28': 'II Niedziela Wielkiego Postu',
        '2027-03-07': 'III Niedziela Wielkiego Postu',
        '2027-03-14': 'IV Niedziela Wielkiego Postu',
        '2027-03-21': 'Niedziela Palmowa',
        '2027-03-28': 'Niedziela Zmartwychwstania Pańskiego',
        '2027-04-04': 'II Niedziela Wielkanocna (Miłosierdzia Bożego)',
        '2027-04-11': 'III Niedziela Wielkanocna',
        '2027-04-18': 'IV Niedziela Wielkanocna',
        '2027-04-25': 'V Niedziela Wielkanocna',
        '2027-05-02': 'VI Niedziela Wielkanocna',
        '2027-05-09': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2027-05-16': 'Uroczystość Zesłania Ducha Świętego',
        '2027-05-23': 'Uroczystość Najświętszej Trójcy',
        '2027-05-30': 'IX Niedziela zwykła',
        '2027-06-06': 'X Niedziela zwykła',
        '2027-06-13': 'XI Niedziela zwykła',
        '2027-06-20': 'XII Niedziela zwykła',
        '2027-06-27': 'XIII Niedziela zwykła',
        '2027-07-04': 'XIV Niedziela zwykła',
        '2027-07-11': 'XV Niedziela zwykła',
        '2027-07-18': 'XVI Niedziela zwykła',
        '2027-07-25': 'XVII Niedziela zwykła',
        '2027-08-01': 'XVIII Niedziela zwykła',
        '2027-08-08': 'XIX Niedziela zwykła',
        '2027-08-15': 'Wniebowzięcie NMP',
        '2027-08-22': 'XXI Niedziela zwykła',
        '2027-08-29': 'XXII Niedziela zwykła',
        '2027-09-05': 'XXIII Niedziela zwykła',
        '2027-09-12': 'XXIV Niedziela zwykła',
        '2027-09-19': 'XXV Niedziela zwykła',
        '2027-09-26': 'XXVI Niedziela zwykła',
        '2027-10-03': 'XXVII Niedziela zwykła',
        '2027-10-10': 'XXVIII Niedziela zwykła',
        '2027-10-17': 'XXIX Niedziela zwykła',
        '2027-10-24': 'XXX Niedziela zwykła',
        '2027-10-31': 'XXXI Niedziela zwykła',
        '2027-11-07': 'XXXII Niedziela zwykła',
        '2027-11-14': 'XXXIII Niedziela zwykła',
        '2027-11-21': 'Uroczystość Jezusa Chrystusa Króla Wszechświata',
        '2027-11-28': 'I Niedziela Adwentu',
        '2027-12-05': 'II Niedziela Adwentu',
        '2027-12-12': 'III Niedziela Adwentu',
        '2027-12-19': 'IV Niedziela Adwentu',
        '2027-12-26': 'Święto Świętej Rodziny Jezusa, Maryi i Józefa',
        '2028-01-02': 'II Niedziela po Narodzeniu Pańskim',
        '2028-01-09': 'Niedziela Chrztu Pańskiego',
        '2028-01-16': 'II Niedziela zwykła',
        '2028-01-23': 'III Niedziela zwykła',
        '2028-01-30': 'IV Niedziela zwykła',
        '2028-02-06': 'V Niedziela zwykła',
        '2028-02-13': 'VI Niedziela zwykła',
        '2028-02-20': 'VII Niedziela zwykła',
        '2028-02-27': 'VIII Niedziela zwykła',
        '2028-03-05': 'I Niedziela Wielkiego Postu',
        '2028-03-12': 'II Niedziela Wielkiego Postu',
        '2028-03-19': 'III Niedziela Wielkiego Postu',
        '2028-03-26': 'IV Niedziela Wielkiego Postu',
        '2028-04-02': 'V Niedziela Wielkiego Postu',
        '2028-04-09': 'Niedziela Palmowa',
        '2028-04-16': 'Niedziela Zmartwychwstania Pańskiego',
        '2028-04-23': 'II Niedziela Wielkanocna (Miłosierdzia Bożego)',
        '2028-04-30': 'III Niedziela Wielkanocna',
        '2028-05-07': 'IV Niedziela Wielkanocna',
        '2028-05-14': 'V Niedziela Wielkanocna',
        '2028-05-21': 'VI Niedziela Wielkanocna',
        '2028-05-28': 'Uroczystość Wniebowstąpienia Pańskiego',
        '2028-06-04': 'Uroczystość Zesłania Ducha Świętego',
        '2028-06-11': 'Uroczystość Najświętszej Trójcy',
        '2028-06-18': 'XI Niedziela zwykła',
        '2028-06-25': 'XII Niedziela zwykła',
        '2028-07-02': 'XIII Niedziela zwykła',
        '2028-07-09': 'XIV Niedziela zwykła',
        '2028-07-16': 'XV Niedziela zwykła',
        '2028-07-23': 'XVI Niedziela zwykła',
        '2028-07-30': 'XVII Niedziela zwykła',
        '2028-08-06': 'XVIII Niedziela zwykła',
        '2028-08-13': 'XIX Niedziela zwykła',
        '2028-08-20': 'XX Niedziela zwykła',
        '2028-08-27': 'XXI Niedziela zwykła',
        '2028-09-03': 'XXII Niedziela zwykła',
        '2028-09-10': 'XXIII Niedziela zwykła',
        '2028-09-17': 'XXIV Niedziela zwykła',
        '2028-09-24': 'XXV Niedziela zwykła',
        '2028-10-01': 'XXVI Niedziela zwykła',
        '2028-10-08': 'XXVII Niedziela zwykła',
        '2028-10-15': 'XXVIII Niedziela zwykła',
        '2028-10-22': 'XXIX Niedziela zwykła',
        '2028-10-29': 'XXX Niedziela zwykła',
        '2028-11-05': 'XXXI Niedziela zwykła',
        '2028-11-12': 'XXXII Niedziela zwykła',
        '2028-11-19': 'XXXIII Niedziela zwykła',
        '2028-11-26': 'Uroczystość Jezusa Chrystusa Króla Wszechświata',
        '2028-12-03': 'I Niedziela Adwentu',
        '2028-12-10': 'II Niedziela Adwentu',
        '2028-12-17': 'III Niedziela Adwentu',
        '2028-12-24': 'IV Niedziela Adwentu',
        '2028-12-31': 'Święto Świętej Rodziny Jezusa, Maryi i Józefa',
    };

    function isSwietoNakazane(date) {
        const dateStr = formatDateForAPI(date);
        return swietaNakazane[dateStr] !== undefined;
    }

    function getSwietoName(date) {
        const dateStr = formatDateForAPI(date);
        
        // Najpierw sprawdź święta nakazane
        if (swietaNakazane[dateStr]) {
            return swietaNakazane[dateStr];
        }
        
        // Potem sprawdź niedziele liturgiczne
        if (niedzieleLiturgiczne[dateStr]) {
            return niedzieleLiturgiczne[dateStr];
        }
        
        // Dla zwykłych niedziel (które nie mają nazwy w kalendarzu)
        return 'Niedziela';
    }

    // ==================== ADWENT ====================

    function getAdwentStartDate(year) {
        const christmas = new Date(year, 11, 25);
        let sundayBeforeChristmas = new Date(christmas);
        
        while (sundayBeforeChristmas.getDay() !== 0) {
            sundayBeforeChristmas.setDate(sundayBeforeChristmas.getDate() - 1);
        }
        
        const firstSundayOfAdvent = new Date(sundayBeforeChristmas);
        firstSundayOfAdvent.setDate(firstSundayOfAdvent.getDate() - 21);
        
        return firstSundayOfAdvent;
    }

    function getAdwentWeekdays(year) {
        const startDate = getAdwentStartDate(year);
        const endDate = new Date(year, 11, 24);
        const weekdays = [];
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const weekNumber = Math.ceil((date - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
                weekdays.push({
                    date: new Date(date),
                    dayName: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][dayOfWeek],
                    weekNumber: Math.min(weekNumber, 4),
                });
            }
        }
        
        return weekdays;
    }

    async function loadAdwent() {
        try {
            const response = await apiCall(`/adwent?rok=${currentYear}`);
            if (response.ok) {
                adwentData = await response.json();
            }
        } catch (e) {
            debugError('Błąd ładowania adwentu:', e);
        }
    }

    async function saveAdwent() {
        try {
            syncAdwentFromDOM();
            const response = await apiCall(`/adwent?rok=${currentYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_adwent', dane: adwentData }),
            });
            if (response.ok) {
                showMessage('Adwent zapisany');
            }
        } catch (e) {
            debugError('Błąd zapisu adwentu:', e);
        }
    }

    function syncAdwentFromDOM() {
        const tbody = document.getElementById('oc-tabelaAdwentBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        adwentData = {};

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const dateDisplay = cells[0]?.textContent.trim();
            if (!dateDisplay) return;

            const [day, month, year] = dateDisplay.split('.');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            const selects = row.querySelectorAll('select');

            if (selects[0]?.value || selects[1]?.value) {
                adwentData[dateKey] = {
                    osobaGlowna: selects[0]?.value || '',
                    pomocnik: selects[1]?.value || '',
                };
            }
        });
    }

    function renderAdwent() {
        const tbody = document.getElementById('oc-tabelaAdwentBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const weekdays = getAdwentWeekdays(parseInt(currentYear));

        weekdays.forEach(day => {
            const dateStr = formatDateForAPI(day.date);
            const data = adwentData[dateStr] || {};

            const szafarzeOptions = szafarze.map(s => 
                `<option value="${s.imie}" ${data.osobaGlowna === s.imie ? 'selected' : ''}>${s.imie}</option>`
            ).join('');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(day.date)}</td>
                <td>${day.dayName}</td>
                <td>${['', 'I Tydzień Adwentu', 'II Tydzień Adwentu', 'III Tydzień Adwentu', 'IV Tydzień Adwentu'][day.weekNumber]}</td>
                <td>
                    <select>
                        <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptions}
                    </select>
                </td>
                <td>
                    <select>
                        <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptions}
                    </select>
                </td>
            `;

            row.querySelectorAll('select').forEach(el => {
                el.addEventListener('change', debounce(saveAdwent, 1000));
            });

            tbody.appendChild(row);
        });
    }

    function showAdwentTab() {
        const adwentTabBtn = document.getElementById('oc-adwentTabBtn');
        const adwentContent = document.getElementById('oc-adwent');

        if (!adwentTabBtn || !adwentContent) {
            debugError('Nie znaleziono elementów Adwent');
            return;
        }

        const isVisible = adwentTabBtn.style.display !== 'none';

        if (isVisible) {
            // Ukryj Adwent - zakładka jest widoczna, więc ją ukryj
            adwentTabBtn.style.display = 'none';
            adwentTabBtn.classList.remove('active');
            adwentContent.classList.remove('active');

            // Jeśli Adwent był aktywny, pokaż Kalendarz
            if (adwentContent.classList.contains('active')) {
                const kalendarzBtn = document.querySelector('.oc-tab-button[data-tab="kalendarz"]');
                const kalendarzContent = document.getElementById('oc-kalendarz');
                if (kalendarzBtn && kalendarzContent) {
                    kalendarzBtn.classList.add('active');
                    kalendarzContent.classList.add('active');
                }
            }
        } else {
            // Pokaż Adwent - zakładka nie jest widoczna, więc ją pokaż
            adwentTabBtn.style.display = 'inline-block';
            adwentTabBtn.classList.add('active');
            adwentContent.classList.add('active');

            // Ukryj inne zakładki (ale nie usuwaj ich z menu)
            document.querySelectorAll('.oc-tab-button').forEach(btn => {
                if (btn.id !== 'oc-adwentTabBtn') {
                    btn.classList.remove('active');
                }
            });
            
            document.querySelectorAll('.oc-tab-content').forEach(content => {
                if (content.id !== 'oc-adwent') {
                    content.classList.remove('active');
                }
            });

            // Załaduj i wyrenderuj dane Adwentu
            loadAdwent().then(() => renderAdwent()).catch(err => {
                debugError('Błąd ładowania Adwentu:', err);
            });
        }
    }

    // ==================== VISIT MODAL ====================

    function openVisitModal(dateStr) {
        const modal = document.getElementById('oc-modalOdwiedziny');
        const dateEl = document.getElementById('oc-modalData');
        const listEl = document.getElementById('oc-modalChorzyList');

        if (!modal || !dateEl || !listEl) return;

        dateEl.textContent = dateStr;
        listEl.innerHTML = '';

        // Tylko chorzy ze statusem TAK
        const activeChorzy = chorzy.filter(c => c.status === 'TAK');
        
        // Pobierz już odwiedzonych chorych dla tej daty
        const visitedChorzy = historiaData[dateStr] || [];

        activeChorzy.forEach((chory, index) => {
            const isChecked = visitedChorzy.includes(chory.imieNazwisko);
            const div = document.createElement('div');
            div.className = 'oc-chorzy-item';
            div.innerHTML = `
                <label for="oc-chory-${index}">${chory.imieNazwisko}</label>
                <input type="checkbox" id="oc-chory-${index}" value="${chory.imieNazwisko}" ${isChecked ? 'checked' : ''}>
            `;
            listEl.appendChild(div);
        });

        modal.style.display = 'flex';
    }

    function closeVisitModal() {
        const modal = document.getElementById('oc-modalOdwiedziny');
        if (modal) modal.style.display = 'none';
    }
    
    function setupTooltip(button, odwiedzeniChorzy) {
        // Zapisz dane chorych na przycisku
        button._odwiedzeniChorzy = odwiedzeniChorzy;
        
        // Sprawdź czy już ma event listenery
        if (button._hasTooltipListeners) {
            // Zaktualizuj dane
            button._odwiedzeniChorzy = odwiedzeniChorzy;
            return;
        }
        button._hasTooltipListeners = true;
        
        let tooltipElement = null;
        let isHovering = false;
        let tooltipTimeout = null;
        
        const createTooltip = () => {
            // Usuń poprzedni tooltip
            if (tooltipElement) {
                tooltipElement.remove();
            }
            
            const chorzy = button._odwiedzeniChorzy || [];
            if (chorzy.length === 0) return null;
            
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'oc-visited-tooltip';
            
            // Tytuł
            const title = document.createElement('div');
            title.textContent = 'Odwiedzeni:';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '6px';
            tooltipElement.appendChild(title);
            
            // Lista chorych
            chorzy.forEach(chory => {
                const item = document.createElement('div');
                item.textContent = '• ' + chory;
                item.style.marginBottom = '2px';
                tooltipElement.appendChild(item);
            });
            
            document.body.appendChild(tooltipElement);
            
            // Pozycjonuj tooltip
            const rect = button.getBoundingClientRect();
            const tooltipHeight = tooltipElement.offsetHeight;
            
            // Pozycja nad przyciskiem
            let top = rect.top - tooltipHeight - 10;
            let left = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2);
            
            // Jeśli tooltip wychodzi poza górę ekranu, pokaż pod przyciskiem
            if (top < 10) {
                top = rect.bottom + 10;
            }
            
            // Ogranicz do ekranu
            left = Math.max(10, Math.min(left, window.innerWidth - tooltipElement.offsetWidth - 10));
            
            tooltipElement.style.top = top + 'px';
            tooltipElement.style.left = left + 'px';
            button._tooltipElement = tooltipElement;
            
            return tooltipElement;
        };
        
        const showTooltip = () => {
            isHovering = true;
            // Opóźnienie żeby odróżnić hover od kliknięcia
            tooltipTimeout = setTimeout(() => {
                if (isHovering) {
                    createTooltip();
                }
            }, 300);
        };
        
        const hideTooltip = () => {
            isHovering = false;
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            if (tooltipElement) {
                tooltipElement.remove();
                tooltipElement = null;
                button._tooltipElement = null;
            }
        };
        
        // Event listenery dla hover
        button.addEventListener('mouseenter', showTooltip);
        button.addEventListener('mouseleave', hideTooltip);
        
        // Ukryj tooltip przy kliknięciu (bo otworzy się modal)
        button.addEventListener('click', hideTooltip);
    }

    async function saveVisit() {
        const dateStr = document.getElementById('oc-modalData').textContent;
        const checkboxes = document.querySelectorAll('#oc-modalChorzyList input:checked');
        const selectedChorzy = Array.from(checkboxes).map(cb => cb.value);

        try {
            await apiCall('/historia', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'dodaj_odwiedziny',
                    data: dateStr,
                    chorzy: selectedChorzy,
                    typ: 'niedziela',
                }),
            });
            
            // Zaktualizuj lokalne dane historii
            historiaData[dateStr] = selectedChorzy;
            
            // Zaktualizuj przycisk
            const button = document.querySelector(`button[data-date="${dateStr}"]`);
            if (button) {
                if (selectedChorzy.length > 0) {
                    button.textContent = 'Odwiedzone';
                    button.className = 'oc-btn oc-btn-small oc-btn-success';
                    // Ustaw tooltip
                    setupTooltip(button, selectedChorzy);
                } else {
                    button.textContent = 'Zaplanowane';
                    button.className = 'oc-btn oc-btn-small';
                    // Usuń tooltip jeśli istnieje
                    if (button._tooltipElement) {
                        button._tooltipElement.remove();
                        button._tooltipElement = null;
                    }
                }
            }
            
            showMessage('Odwiedziny zapisane');
            closeVisitModal();
        } catch (e) {
            showMessage('Błąd zapisu odwiedzin', 'error');
        }
    }
    
    async function loadHistoriaForYear(year) {
        try {
            // Załaduj wszystkie odwiedziny dla danego roku
            const response = await apiCall('/historia');
            if (response.ok) {
                const allHistoria = await response.json();
                historiaData = {};
                
                // Filtruj tylko wpisy dla danego roku i typu 'niedziela'
                allHistoria.forEach(entry => {
                    if (entry.data && entry.data.startsWith(year) && entry.typ === 'niedziela') {
                        historiaData[entry.data] = entry.chorzy || [];
                    }
                });
            }
        } catch (e) {
            debugError('Błąd ładowania historii:', e);
        }
    }

    // ==================== RAPORTY ====================

    async function loadRaport(miesiac) {
        try {
            const response = await apiCall(`/raporty/miesieczny?miesiac=${miesiac}`);
            if (response.ok) {
                const data = await response.json();
                renderRaport(data, miesiac);
            }
        } catch (e) {
            debugError('Błąd ładowania raportu:', e);
        }
    }

    function renderRaport(data, miesiac) {
        const container = document.getElementById('oc-raportContainer');
        if (!container) return;

        const stats = data.statystyki || {};
        const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
        const [year, month] = miesiac.split('-');
        const monthName = monthNames[parseInt(month) - 1] + ' ' + year;

        container.innerHTML = `
            <h2>Raport miesięczny - ${monthName}</h2>
            <div class="oc-raport-stats">
                <h3>Statystyki</h3>
                <ul>
                    <li>Liczba odwiedzin w miesiącu: <strong>${stats.lacznaLiczbaOdwiedzinWMiesiacu || 0}</strong></li>
                    <li>Odwiedzeni chorzy w miesiącu: <strong>${stats.odwiedzeniChorzyWMiesiacu || 0}</strong></li>
                    <li>Łączna liczba chorych (od początku roku): <strong>${stats.lacznaLiczbaChorychOdPoczatkuRoku || 0}</strong></li>
                    <li>Szafarze: <strong>${(stats.szafarze || []).join(', ') || 'Brak'}</strong></li>
                </ul>
            </div>
        `;
    }

    // ==================== UI ====================

    function showLoginScreen() {
        document.getElementById('oc-loginScreen').style.display = 'flex';
        document.getElementById('oc-mainApp').style.display = 'none';
    }

    function showMainApp() {
        document.getElementById('oc-loginScreen').style.display = 'none';
        document.getElementById('oc-mainApp').style.display = 'block';
    }

    function setupTabs() {
        const buttons = document.querySelectorAll('.oc-tab-button');
        const contents = document.querySelectorAll('.oc-tab-content');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;

                // Jeśli kliknięto przycisk zakładki Adwent, użyj funkcji toggle
                if (tab === 'adwent' && button.id === 'oc-adwentTabBtn') {
                    showAdwentTab();
                    return;
                }

                // Ukryj wszystkie zakładki oprócz Adwent (jeśli jest widoczny)
                const adwentContent = document.getElementById('oc-adwent');
                const adwentTabBtn = document.getElementById('oc-adwentTabBtn');
                const isAdwentVisible = adwentTabBtn && adwentTabBtn.style.display !== 'none';

                buttons.forEach(btn => {
                    if (btn.id !== 'oc-adwentTabBtn') {
                        btn.classList.remove('active');
                    }
                });
                
                contents.forEach(content => {
                    if (content.id !== 'oc-adwent') {
                        content.classList.remove('active');
                    }
                });

                // Aktywuj klikniętą zakładkę
                button.classList.add('active');
                document.getElementById('oc-' + tab).classList.add('active');

                // Zakładka Adwent pozostaje widoczna jeśli była widoczna
                // (nie ukrywamy jej automatycznie)
            });
        });
    }

    function setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('oc-loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('oc-passwordInput').value;
                const errorEl = document.getElementById('oc-loginError');

                try {
                    await login(password);
                    errorEl.style.display = 'none';
                    await initApp();
                } catch (error) {
                    errorEl.textContent = error.message || 'Nieprawidłowe hasło';
                    errorEl.style.display = 'block';
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('oc-logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        // Rok select
        const rokSelect = document.getElementById('oc-wybierzRok');
        if (rokSelect) {
            rokSelect.addEventListener('change', async (e) => {
                currentYear = e.target.value;
                await Promise.all([
                    loadKalendarz(),
                    loadHistoriaForYear(currentYear)
                ]);
                renderKalendarz();
            });
        }

        // Rok adwent select
        const rokAdwentSelect = document.getElementById('oc-wybierzRokAdwent');
        if (rokAdwentSelect) {
            rokAdwentSelect.addEventListener('change', async (e) => {
                currentYear = e.target.value;
                await loadAdwent();
                renderAdwent();
            });
        }

        // Miesiąc select
        const miesiacSelect = document.getElementById('oc-wybierzMiesiac');
        if (miesiacSelect) {
            miesiacSelect.addEventListener('change', (e) => {
                loadRaport(e.target.value);
            });
        }

        // Dodaj szafarza
        const dodajSzafarzaBtn = document.getElementById('oc-dodajSzafarzaBtn');
        if (dodajSzafarzaBtn) {
            dodajSzafarzaBtn.addEventListener('click', addSzafarz);
        }

        // Dodaj chorego
        const dodajChoregoBtn = document.getElementById('oc-dodajChoregoBtn');
        if (dodajChoregoBtn) {
            dodajChoregoBtn.addEventListener('click', addChory);
        }

        // Adwent button
        const adwentBtn = document.getElementById('oc-adwent-btn');
        if (adwentBtn) {
            adwentBtn.addEventListener('click', showAdwentTab);
        }

        // Modal
        const modalClose = document.querySelector('.oc-modal-close');
        const modalCancel = document.querySelector('.oc-modal-cancel');
        const modalSave = document.getElementById('oc-modalZapiszBtn');

        if (modalClose) modalClose.addEventListener('click', closeVisitModal);
        if (modalCancel) modalCancel.addEventListener('click', closeVisitModal);
        if (modalSave) modalSave.addEventListener('click', saveVisit);

        // Print buttons
        document.getElementById('oc-print-btn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujSzafarzeBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujChorzyBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujAdwentBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujRaportBtn')?.addEventListener('click', () => window.print());

        // Create year button
        const createYearBtn = document.getElementById('oc-create-year-btn');
        if (createYearBtn) {
            createYearBtn.addEventListener('click', createNewYear);
        }

        // Auto-assign button
        const autoAssignBtn = document.getElementById('oc-auto-assign-btn');
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', autoAssignSzafarze);
        }
    }

    // ==================== INIT ====================

    async function initApp() {
        showMainApp();
        setupTabs();

        // Ustaw currentYear na wartość z selecta (jeśli istnieje)
        const rokSelect = document.getElementById('oc-wybierzRok');
        if (rokSelect && rokSelect.value) {
            currentYear = rokSelect.value;
        }

        // Załaduj dane
        await Promise.all([
            loadSzafarze(),
            loadChorzy(),
            loadKalendarz(),
            loadHistoriaForYear(currentYear),
        ]);

        // Renderuj
        renderSzafarze();
        renderChorzy();
        renderKalendarz();
        
        // Upewnij się, że style ramki są zastosowane (również po załadowaniu)
        // Wywołaj natychmiast po renderKalendarz
        setTimeout(() => {
            const nextDutyRow = document.querySelector('.next-duty-row');
            if (nextDutyRow) {
                applyNextDutyRowStyles(nextDutyRow);
            }
        }, 100);
        
        // Sprawdź ponownie po większym opóźnieniu
        setTimeout(() => {
            const nextDutyRow = document.querySelector('.next-duty-row');
            if (nextDutyRow) {
                applyNextDutyRowStyles(nextDutyRow);
            }
        }, 500);
        
        // Sprawdź ponownie po pełnym załadowaniu
        window.addEventListener('load', () => {
            setTimeout(() => {
                const nextDutyRow = document.querySelector('.next-duty-row');
                if (nextDutyRow) {
                    applyNextDutyRowStyles(nextDutyRow);
                }
            }, 300);
        });

        // Załaduj domyślny raport
        const currentMonth = new Date().toISOString().slice(0, 7);
        const miesiacSelect = document.getElementById('oc-wybierzMiesiac');
        if (miesiacSelect) {
            miesiacSelect.value = currentMonth;
            loadRaport(currentMonth);
        }
        
        // Przycisk wylogowania jest teraz w menu przycisków
    }

    async function init() {
        setupEventListeners();

        const isLoggedIn = await checkAuth();
        if (isLoggedIn) {
            await initApp();
        } else {
            showLoginScreen();
        }
    }

    // Expose to global scope
    window.ocApp = {
        deleteSzafarz,
        deleteChory,
        openVisitModal,
        applyNextDutyRowStyles, // Eksportuj funkcję do debugowania
    };
    
    // Również eksportuj bezpośrednio do window dla łatwego dostępu
    window.applyNextDutyRowStyles = applyNextDutyRowStyles;

    // Funkcja do ukrycia WordPress header
    function hideWordPressHeader() {
        // Lista możliwych selektorów WordPress header
        const headerSelectors = [
            'header:not(.oc-header)',
            '.site-header:not(.oc-header)',
            '.main-header:not(.oc-header)',
            '.wp-site-blocks > header:not(.oc-header)',
            '.wp-block-template-part[data-area="header"]:not(.oc-header)',
            '#masthead:not(.oc-header)',
            '#header:not(.oc-header)',
            '.header:not(.oc-header)',
            '.site-header-wrapper',
            'header[role="banner"]:not(.oc-header)',
            'nav[role="navigation"]:not(.oc-header)'
        ];
        
        headerSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.height = '0';
                el.style.overflow = 'hidden';
                el.style.margin = '0';
                el.style.padding = '0';
                el.style.opacity = '0';
            });
        });
        
        // Usuń duplikaty przycisku wylogowania (jeśli są w WordPress headerze)
        const logoutButtons = document.querySelectorAll('#oc-logoutBtn');
        if (logoutButtons.length > 1) {
            // Zostaw tylko ten w .oc-tabs
            logoutButtons.forEach((btn, index) => {
                const ocTabs = btn.closest('.oc-tabs');
                if (!ocTabs) {
                    // To nie jest w naszym menu zakładek, usuń
                    btn.remove();
                }
            });
        }
        
        // Przycisk wylogowania jest teraz w menu zakładek (.oc-tabs), nie w headerze
        
        // Ukryj też header, który jest przed .oc-container
        const ocContainer = document.querySelector('.oc-container');
        if (ocContainer) {
            let prevSibling = ocContainer.previousElementSibling;
            while (prevSibling) {
                if (prevSibling.tagName === 'HEADER' || prevSibling.classList.contains('site-header') || prevSibling.classList.contains('header')) {
                    prevSibling.style.display = 'none';
                    prevSibling.style.visibility = 'hidden';
                    prevSibling.style.height = '0';
                    prevSibling.style.overflow = 'hidden';
                }
                prevSibling = prevSibling.previousElementSibling;
            }
        }
    }
    
    // Funkcja do naprawy pozycjonowania przycisku - już nie potrzebna, przycisk jest w menu
    function fixLogoutButtonPosition() {
        // Przycisk wylogowania jest teraz w menu przycisków, nie potrzeba naprawy
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            // Ukryj WordPress header po załadowaniu DOM
            setTimeout(() => {
                hideWordPressHeader();
            }, 100);
            // Ukryj też po pełnym załadowaniu strony
            window.addEventListener('load', () => {
                hideWordPressHeader();
            });
        });
    } else {
        init();
        setTimeout(() => {
            hideWordPressHeader();
        }, 100);
        window.addEventListener('load', () => {
            hideWordPressHeader();
        });
    }
    
    // Ukryj header również po zmianach w DOM (jeśli WordPress dynamicznie dodaje elementy)
    const observer = new MutationObserver(() => {
        hideWordPressHeader();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
