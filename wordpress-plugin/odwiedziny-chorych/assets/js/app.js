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
    let currentUser = null;
    let showOnlyMyDuties = sessionStorage.getItem('oc_showOnlyMyDuties') === '1';
    let kalendarzData = {};
    let adwentData = {};
    let adwentOpen = false;
    let historiaData = {}; // Przechowuje odwiedzonych chorych dla każdej daty
    let plannedData = {}; // Przechowuje zaplanowanych chorych dla każdej daty
    const visitPlanning = window.ocVisitPlanning;
    if (!visitPlanning) {
        throw new Error('Brak modułu ocVisitPlanning. Odśwież stronę i sprawdź enqueue skryptów.');
    }
    const {
        OCCASIONAL_VISIT_MARKER,
        VISIT_HISTORY_TYPE,
        PLANNED_VISIT_HISTORY_TYPE,
        normalizeName,
        compareNames,
        buildPatientIndexByName,
        isOccasionalVisit,
        assembleVisitPatientList,
        resolveNextVisitDefault,
        resolveScheduleAfterRemoval,
        buildScheduleMapAfterRevertingVisit,
        splitHistoriaEntriesByType,
        getUpcomingDutyDates: planningGetUpcomingDutyDates,
        createPerKeySaveQueue,
        collectVisitDataFromCards,
        getVisitButtonState,
        formatNextVisitOption: planningFormatNextVisitOption,
        buildVisitHistoryPayload,
        buildDeleteVisitHistoryPayload,
        persistVisitReport,
        revertVisitReportToPlanned,
        VISIT_LIST_HINT,
        getEmptyVisitListMessage,
    } = visitPlanning;

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

    function formatDateTime(mysqlOrIso) {
        if (!mysqlOrIso) return '';
        const normalized = String(mysqlOrIso).replace(' ', 'T');
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return mysqlOrIso;
        return d.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
    }

    function formatNextVisitDisplay(dateStr) {
        if (!dateStr) return '—';
        if (isOccasionalVisit(dateStr)) return 'Okazjonalne odwiedziny';
        return formatDate(dateStr);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cellInputHtml(field, value, label, extraClass = '') {
        const classes = extraClass ? `oc-cell-input ${extraClass}` : 'oc-cell-input';
        return `<input type="text" class="${classes}" data-field="${escapeHtml(field)}" value="${escapeHtml(value || '')}" aria-label="${escapeHtml(label)}">`;
    }

    function cellTextareaHtml(field, value, label, extraClass = '') {
        const classes = extraClass ? `oc-cell-input oc-cell-textarea ${extraClass}` : 'oc-cell-input oc-cell-textarea';
        return `<textarea class="${classes}" data-field="${escapeHtml(field)}" rows="2" aria-label="${escapeHtml(label)}">${escapeHtml(value || '')}</textarea>`;
    }

    function cellFieldValue(row, field) {
        const el = row.querySelector(`[data-field="${field}"]`);
        return el ? el.value.trim() : '';
    }

    function setTableSaveStatus(statusId, text, isError = false) {
        const el = document.getElementById(statusId);
        if (!el) {
            return;
        }
        el.textContent = text || '';
        el.classList.toggle('oc-save-status-error', !!isError);
    }

    function bindTableDirty(root, statusId) {
        if (!root) {
            return;
        }
        const clearStatus = () => setTableSaveStatus(statusId, '');
        root.querySelectorAll('.oc-cell-input, .oc-szafarz-haslo-input, select.oc-status-select').forEach(el => {
            el.addEventListener('input', clearStatus);
            el.addEventListener('change', clearStatus);
        });
    }

    function szafarzSelectOptions(selectedImie) {
        return szafarze.map(s => {
            const imie = escapeHtml(s.imie || '');
            const selected = s.imie === selectedImie ? 'selected' : '';
            return `<option value="${imie}" ${selected}>${imie}</option>`;
        }).join('');
    }

    function getMyDutyNameKeys() {
        const keys = new Set();
        if (!currentUser || currentUser.role !== 'szafarz') {
            return keys;
        }
        const add = (value) => {
            const normalized = normalizeName(value);
            if (normalized) {
                keys.add(normalized);
            }
        };
        add(currentUser.label);
        const id = Number(currentUser.szafarzId);
        const sz = id ? szafarze.find(s => Number(s.id) === id) : null;
        if (sz) {
            add(sz.imie);
            add([sz.imie, sz.nazwisko].filter(Boolean).join(' '));
        }
        return keys;
    }

    function isMyDutyAssignment(osobaGlowna, pomocnik) {
        const keys = getMyDutyNameKeys();
        if (!keys.size) {
            return false;
        }
        return keys.has(normalizeName(osobaGlowna)) || keys.has(normalizeName(pomocnik));
    }

    function syncMyDutiesButton() {
        const btn = document.getElementById('oc-mojeDyzuryBtn');
        if (!btn) return;
        const on = !!(currentUser && currentUser.role === 'szafarz' && showOnlyMyDuties);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('oc-btn-pressed', on);
        btn.textContent = on ? 'Cały grafik' : 'Moje dyżury';
        btn.title = on
            ? 'Pokaż cały grafik tego roku'
            : 'Pokaż tylko moje dyżury w wybranym roku';
        btn.setAttribute('aria-label', btn.title);
    }

    function toggleMyDutiesFilter() {
        if (!currentUser || currentUser.role !== 'szafarz') {
            return;
        }
        showOnlyMyDuties = !showOnlyMyDuties;
        sessionStorage.setItem('oc_showOnlyMyDuties', showOnlyMyDuties ? '1' : '0');
        syncMyDutiesButton();
        renderKalendarz();
    }

    function collectPlannedNamesFromCards(rootSelector = '#oc-raportListaChorych .oc-raport-card') {
        return Array.from(document.querySelectorAll(rootSelector))
            .map(card => card.dataset.name)
            .filter(Boolean);
    }

    async function saveVisitHistory(dateStr, chorzyList, typ) {
        const response = await apiCall('/historia', {
            method: 'POST',
            body: JSON.stringify(buildVisitHistoryPayload(dateStr, chorzyList || [], typ)),
        });
        return response.ok;
    }

    async function deleteVisitHistory(dateStr, typ) {
        const response = await apiCall('/historia', {
            method: 'POST',
            body: JSON.stringify(buildDeleteVisitHistoryPayload(dateStr, typ)),
        });
        return response.ok;
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

    async function login(payload) {
        try {
            debugLog('login: Rozpoczynam logowanie');
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': NONCE,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            debugLog('login: Response:', response.status, data);

            if (response.ok && data.success) {
                authToken = data.token;
                sessionStorage.setItem('oc_authToken', authToken);
                if (data.user) {
                    currentUser = data.user;
                }
                debugLog('login: Token zapisany:', authToken ? authToken.substring(0, 10) + '...' : 'BRAK');
                
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
                if (response.status === 401) {
                    authToken = null;
                    sessionStorage.removeItem('oc_authToken');
                    currentUser = null;
                    showLoginScreen();
                }
                return false;
            }

            const verifyData = await response.json().catch(() => ({}));
            if (verifyData.user) {
                currentUser = verifyData.user;
            }
            
            debugLog('checkAuth: Token poprawny');
            return true;
        } catch (error) {
            debugError('checkAuth: Wyjątek:', error);
            return false;
        }
    }

    async function fillLoginSzafarzeSelect() {
        const sel = document.getElementById('oc-loginSzafarzSelect');
        if (!sel) return;
        try {
            const response = await fetch(`${API_URL}/szafarze/login-list`, {
                headers: { 'X-WP-Nonce': NONCE },
            });
            if (!response.ok) return;
            const list = await response.json();
            sel.innerHTML = '<option value="">— wybierz —</option>';
            list.forEach(s => {
                const opt = document.createElement('option');
                opt.value = String(s.id);
                const label = [s.imie, s.nazwisko].filter(Boolean).join(' ').trim();
                opt.textContent = label || (`Szafarz #${s.id}`);
                sel.appendChild(opt);
            });
        } catch (e) {
            debugError('Lista szafarzy (logowanie):', e);
        }
    }

    function applyRoleUI() {
        const isSzafarz = currentUser && currentUser.role === 'szafarz';
        document.querySelectorAll('.oc-tab-button[data-tab="szafarze"], .oc-tab-button[data-tab="raporty"]').forEach(btn => {
            btn.style.display = isSzafarz ? 'none' : '';
        });
        const info = document.getElementById('oc-sessionInfo');
        if (info) {
            info.textContent = currentUser && currentUser.label ? `Zalogowano jako: ${currentUser.label}` : '';
        }
        const myDutiesBtn = document.getElementById('oc-mojeDyzuryBtn');
        if (myDutiesBtn) {
            myDutiesBtn.hidden = !isSzafarz;
            if (!isSzafarz) {
                showOnlyMyDuties = false;
            }
            syncMyDutiesButton();
        }
        if (isSzafarz) {
            const active = document.querySelector('.oc-tab-button.active');
            if (active && (active.dataset.tab === 'szafarze' || active.dataset.tab === 'raporty')) {
                activateTab('kalendarz');
            }
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
            sessionStorage.removeItem('oc_showOnlyMyDuties');
            currentUser = null;
            showOnlyMyDuties = false;
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
                document.querySelectorAll('.oc-szafarz-haslo-input').forEach(inp => {
                    inp.value = '';
                });
                await loadSzafarze();
                renderSzafarze();
                setTableSaveStatus('oc-szafarzeSaveStatus', 'Zapisano');
            } else {
                setTableSaveStatus('oc-szafarzeSaveStatus', 'Nie zapisano', true);
                showMessage('Błąd zapisu szafarzy', 'error');
            }
        } catch (e) {
            debugError('Błąd zapisu szafarzy:', e);
            setTableSaveStatus('oc-szafarzeSaveStatus', 'Nie zapisano', true);
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
            if (cells.length < 7) return;
            const idRaw = row.dataset.ocId;
            const id = idRaw ? parseInt(idRaw, 10) : undefined;
            const hasloInput = row.querySelector('.oc-szafarz-haslo-input');
            const noweHaslo = hasloInput ? hasloInput.value.trim() : '';
            const entry = {
                imie: cellFieldValue(row, 'imie'),
                nazwisko: cellFieldValue(row, 'nazwisko'),
                adres: cellFieldValue(row, 'adres'),
                email: cellFieldValue(row, 'email'),
                telefon: cellFieldValue(row, 'telefon'),
            };
            if (id) {
                entry.id = id;
            }
            if (noweHaslo) {
                entry.noweHaslo = noweHaslo;
            }
            szafarze.push(entry);
        });
    }

    function renderSzafarze() {
        const tbody = document.getElementById('oc-tabelaSzafarzeBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        szafarze.forEach((szafarz, index) => {
            const row = document.createElement('tr');
            row.dataset.ocId = szafarz.id != null ? String(szafarz.id) : '';
            const hasloHint = szafarz.maHaslo ? '(hasło ustawione)' : '(brak hasła)';
            row.innerHTML = `
                <td>${cellInputHtml('imie', szafarz.imie, 'Imię')}</td>
                <td>${cellInputHtml('nazwisko', szafarz.nazwisko, 'Nazwisko')}</td>
                <td>${cellInputHtml('adres', szafarz.adres, 'Adres zamieszkania')}</td>
                <td>${cellInputHtml('email', szafarz.email, 'Adres email')}</td>
                <td>${cellInputHtml('telefon', szafarz.telefon, 'Numer telefonu')}</td>
                <td class="oc-szafarz-haslo-cell">
                    <input type="password" class="oc-szafarz-haslo-input" autocomplete="new-password" placeholder="Nowe hasło" aria-label="Nowe hasło logowania szafarza">
                    <span class="oc-szafarz-haslo-status oc-muted">${hasloHint}</span>
                </td>
                <td>
                    <button class="oc-btn oc-btn-danger oc-btn-small" onclick="ocApp.deleteSzafarz(${index})">Usuń</button>
                </td>
            `;

            tbody.appendChild(row);
        });
        bindTableDirty(tbody, 'oc-szafarzeSaveStatus');
    }

    function addSzafarz() {
        syncSzafarzeFromDOM();
        szafarze.push({ imie: '', nazwisko: '', adres: '', email: '', telefon: '' });
        renderSzafarze();
        setTableSaveStatus('oc-szafarzeSaveStatus', '');
    }

    async function deleteSzafarz(index) {
        if (!await confirm('Czy na pewno chcesz usunąć tego szafarza?')) return;
        syncSzafarzeFromDOM();
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
                await loadChorzy();
                renderChorzy();
                setTableSaveStatus('oc-chorzySaveStatus', 'Zapisano');
            } else {
                setTableSaveStatus('oc-chorzySaveStatus', 'Nie zapisano', true);
                showMessage('Błąd zapisu chorych', 'error');
            }
        } catch (e) {
            debugError('Błąd zapisu chorych:', e);
            setTableSaveStatus('oc-chorzySaveStatus', 'Nie zapisano', true);
            showMessage('Błąd zapisu chorych', 'error');
        }
    }

    function syncChorzyFromDOM() {
        const tbody = document.getElementById('oc-tabelaChorzyBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const newChorzy = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const select = row.querySelector('select');
            if (cells.length < 5) return;
            const idRaw = row.dataset.ocId;
            const id = idRaw ? parseInt(idRaw, 10) : null;
            const prev = id ? chorzy.find(c => c.id === id) : null;
            newChorzy.push({
                id: id || undefined,
                imieNazwisko: cellFieldValue(row, 'imieNazwisko'),
                adres: cellFieldValue(row, 'adres'),
                telefon: cellFieldValue(row, 'telefon'),
                uwagi: cellFieldValue(row, 'uwagi'),
                status: select ? select.value : 'TAK',
                nastepnaWizyta: prev ? prev.nastepnaWizyta : undefined,
                uwagiOstatnioPrzez: prev ? prev.uwagiOstatnioPrzez : undefined,
                uwagiOstatnioData: prev ? prev.uwagiOstatnioData : undefined,
            });
        });
        chorzy = newChorzy;
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
            const row = document.createElement('tr');
            row.className = chory.status === 'TAK' ? 'status-tak' : 'status-nie';
            row.dataset.ocId = chory.id != null ? String(chory.id) : '';

            const nastepnaWizytaText = formatNextVisitDisplay(chory.nastepnaWizyta);

            const idJs = chory.id != null ? String(chory.id) : 'null';
            row.innerHTML = `
                <td class="oc-lp-cell">${index + 1}</td>
                <td>${cellInputHtml('imieNazwisko', chory.imieNazwisko, 'Imię i nazwisko')}</td>
                <td>${cellInputHtml('adres', chory.adres, 'Adres')}</td>
                <td>${cellInputHtml('telefon', chory.telefon, 'Telefon')}</td>
                <td class="oc-chorzy-uwagi">${cellTextareaHtml('uwagi', chory.uwagi, 'Uwagi')}</td>
                <td class="oc-nastepna-wizyta">${escapeHtml(nastepnaWizytaText)}</td>
                <td>
                    <select class="oc-status-select ${chory.status === 'TAK' ? 'status-tak' : 'status-nie'}" aria-label="Status chorego: aktywny lub nieaktywny">
                        <option value="TAK" ${chory.status === 'TAK' ? 'selected' : ''}>AKTYWNY</option>
                        <option value="NIE" ${chory.status === 'NIE' ? 'selected' : ''}>NIEAKTYWNY</option>
                    </select>
                </td>
                <td>
                    <button class="oc-btn oc-btn-danger oc-btn-small" onclick="ocApp.deleteChory(${idJs}, ${index})">Usuń</button>
                </td>
            `;

            const select = row.querySelector('select');
            select.addEventListener('change', () => {
                row.className = select.value === 'TAK' ? 'status-tak' : 'status-nie';
                select.className = `oc-status-select ${select.value === 'TAK' ? 'status-tak' : 'status-nie'}`;
            });

            const uwagiCell = row.querySelector('.oc-chorzy-uwagi');
            if (uwagiCell && chory.uwagiOstatnioPrzez && chory.uwagiOstatnioData) {
                attachChorzyUwagiAuditTooltip(uwagiCell, chory);
            }

            tbody.appendChild(row);
        });
        bindTableDirty(tbody, 'oc-chorzySaveStatus');
    }

    function addChory() {
        syncChorzyFromDOM();
        chorzy.push({ imieNazwisko: '', adres: '', telefon: '', uwagi: '', status: 'TAK' });
        renderChorzy();
        setTableSaveStatus('oc-chorzySaveStatus', '');
    }

    async function deleteChory(id, sortedIndex) {
        if (!await confirm('Czy na pewno chcesz usunąć tego chorego?')) return;
        syncChorzyFromDOM();
        let index = typeof sortedIndex === 'number' ? sortedIndex : -1;
        if (id) {
            const byId = chorzy.findIndex(c => Number(c.id) === Number(id));
            if (byId >= 0) {
                index = byId;
            }
        }
        const chory = chorzy[index];
        if (!chory) return;

        if (chory.id) {
            try {
                const response = await apiCall(`/chorzy/${chory.id}`, { method: 'DELETE' });
                if (!response.ok) {
                    showMessage('Błąd usuwania chorego', 'error');
                    return;
                }
            } catch (e) {
                debugError('Błąd usuwania chorego:', e);
                showMessage('Błąd usuwania chorego', 'error');
                return;
            }
        }

        chorzy.splice(index, 1);
        renderChorzy();
        showMessage('Chory usunięty');
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
        if (window.matchMedia('(max-width: 768px)').matches) {
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

    function renderKalendarz(options) {
        const skipScroll = !!(options && options.skipScroll);
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
            const mine = isMyDutyAssignment(data.osobaGlowna, data.pomocnik);
            const filterMine = !!(currentUser && currentUser.role === 'szafarz' && showOnlyMyDuties);
            
            // Sprawdź czy są odwiedzeni chorzy dla tej daty
            const hasSavedVisitReport = Object.prototype.hasOwnProperty.call(historiaData, dateStr);
            const visitedChorzy = historiaData[dateStr] || [];
            const hasVisited = visitedChorzy.length > 0;
            const buttonState = getVisitButtonState(visitedChorzy, { completed: hasSavedVisitReport });
            const buttonText = buttonState.text;
            const buttonClass = buttonState.className;

            const row = document.createElement('tr');
            if (isSwieto) row.classList.add('swieto-row');
            if (mine) row.classList.add('oc-my-duty-row');
            if (filterMine && !mine) row.classList.add('oc-duty-filtered-out');

            // Sprawdź czy to najbliższy dyżur PRZED renderowaniem HTML
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const countsForNextDuty = !filterMine || mine;
            const isNextDuty = countsForNextDuty && !nextDutyRow && dateOnly >= today && currentYear === today.getFullYear().toString();
            
            // Jeśli to najbliższy dyżur, ustaw nextDutyRow
            if (isNextDuty) {
                nextDutyRow = row;
                row.classList.add('next-duty-row');
            }

            // Osobne listy opcji — selected musi być od osoby głównej vs pomocnika (wspólny szablon zawsze podświetlał główną w obu)
            const szafarzeOptionsOsoba = szafarzSelectOptions(data.osobaGlowna);
            const szafarzeOptionsPomocnik = szafarzSelectOptions(data.pomocnik);

            const isNarrow = window.matchMedia('(max-width: 768px)').matches;
            const borderStyle = isNextDuty && !isNarrow ? 'style="border: 3px solid #ffc107 !important;"' : '';
            const borderStyleInline = isNextDuty && !isNarrow ? 'border: 3px solid #ffc107 !important;' : '';
            
            row.innerHTML = `
                <td class="oc-cal-date" data-label="Data" ${borderStyle}>${escapeHtml(formatDate(date))}</td>
                <td class="oc-cal-name" data-label="Dzień" style="white-space: normal; word-wrap: break-word; ${borderStyleInline}">${escapeHtml(swietoName)}</td>
                <td class="oc-cal-osoba" data-label="Osoba główna" ${borderStyle}>
                    <select class="osoba-glowna-select" aria-label="Osoba główna">
                        <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptionsOsoba}
                    </select>
                </td>
                <td class="oc-cal-pomocnik" data-label="Pomocnik" ${borderStyle}>
                    <select class="pomocnik-select" aria-label="Pomocnik">
                        <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptionsPomocnik}
                    </select>
                </td>
                <td class="oc-cal-uwagi" data-label="Uwagi" contenteditable="true" ${borderStyle}>${escapeHtml(data.uwagi || '')}</td>
                <td class="oc-cal-raport" data-label="Raport" ${borderStyle}>
                    <button class="${escapeHtml(buttonClass)}" onclick="ocApp.openVisitModal('${escapeHtml(dateStr)}')" data-date="${escapeHtml(dateStr)}">${escapeHtml(buttonText)}</button>
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

        const emptyNote = document.getElementById('oc-mojeDyzuryPuste');
        if (emptyNote) {
            const filterMine = !!(currentUser && currentUser.role === 'szafarz' && showOnlyMyDuties);
            const hasMine = !!tbody.querySelector('.oc-my-duty-row');
            emptyNote.hidden = !filterMine || hasMine;
        }

        // Podświetl najbliższy dyżur
        if (nextDutyRow) {
            nextDutyRow.classList.add('next-duty-row');
            
            // Zastosuj style ramki - wywołaj funkcję pomocniczą
            // Użyj setTimeout, żeby upewnić się, że wiersz jest w DOM
            setTimeout(() => {
                applyNextDutyRowStyles(nextDutyRow);
            }, 50);

            if (!skipScroll) {
                setTimeout(() => {
                    nextDutyRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else if (!skipScroll && currentUser && currentUser.role === 'szafarz' && showOnlyMyDuties) {
            const firstMine = tbody.querySelector('.oc-my-duty-row');
            if (firstMine) {
                setTimeout(() => {
                    firstMine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }

    function ensureYearOption(select, year) {
        if (!select || !year) return;
        const value = String(year);
        if (select.querySelector(`option[value="${value}"]`)) return;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        const insertBefore = Array.from(select.options).find(opt => parseInt(opt.value, 10) > parseInt(value, 10));
        if (insertBefore) {
            select.insertBefore(option, insertBefore);
        } else {
            select.appendChild(option);
        }
    }

    function fillYearSelects() {
        const nowY = new Date().getFullYear();
        const ids = ['oc-wybierzRok', 'oc-wybierzRokAdwent'];
        ids.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            const selected = select.value;
            for (let year = nowY - 1; year <= nowY + 4; year++) {
                ensureYearOption(select, year);
            }
            if (selected && select.querySelector(`option[value="${selected}"]`)) {
                select.value = selected;
            }
        });
    }

    async function createNewYear() {
        const nextYear = (parseInt(currentYear, 10) + 1).toString();
        const rokSelect = document.getElementById('oc-wybierzRok');

        try {
            const existingResponse = await apiCall(`/kalendarz?rok=${nextYear}`);
            const existingData = existingResponse.ok ? await existingResponse.json() : {};
            const hasAssignments = Object.values(existingData || {}).some(row =>
                (row && (row.osobaGlowna || row.pomocnik))
            );

            const question = hasAssignments
                ? `Rok ${nextYear} ma już wpisane osoby. Czy nadpisać grafik nowym, wyliczonym z roku ${currentYear}?`
                : `Utworzyć kalendarz na rok ${nextYear} na podstawie roku ${currentYear}?`;
            if (!await confirm(question)) {
                return;
            }

            const response = await apiCall(`/kalendarz?rok=${currentYear}`);
            if (!response.ok) throw new Error('Błąd wczytywania danych aktualnego roku');

            const currentYearData = await response.json();
            const newYearData = generateNewYearData(nextYear, currentYearData);

            const saveResponse = await apiCall(`/kalendarz?rok=${nextYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_kalendarz', dane: newYearData }),
            });

            if (!saveResponse.ok) throw new Error('Błąd zapisu nowego roku');

            ensureYearOption(rokSelect, nextYear);
            ensureYearOption(document.getElementById('oc-wybierzRokAdwent'), nextYear);
            if (rokSelect) rokSelect.value = nextYear;

            currentYear = nextYear;
            kalendarzData = newYearData;
            await Promise.all([
                loadKalendarz(),
                loadHistoriaForYear(currentYear),
            ]);
            renderKalendarz();

            showMessage(`Kalendarz na rok ${nextYear} jest gotowy.`, 'success');
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
                    // Tylko osoba główna — pusty pomocnik (klucz musi być w JSON, żeby API wyczyściło bazę)
                    newData[dateStr].pomocnik = '';
                    
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

    function addDaysLocal(date, days) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    }

    function calculateEasterDate(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    function generateHolyDaysForYear(year) {
        const easter = calculateEasterDate(year);
        const ymd = (d) => formatDateForAPI(d);
        const map = {};
        const put = (key, name) => { map[key] = name; };
        put(ymd(new Date(year, 0, 1)), 'Uroczystość Świętej Bożej Rodzicielki Maryi');
        put(ymd(new Date(year, 0, 6)), 'Objawienie Pańskie (Trzech Króli)');
        put(ymd(easter), 'Niedziela Zmartwychwstania Pańskiego');
        put(ymd(addDaysLocal(easter, 1)), 'Poniedziałek Wielkanocny');
        put(ymd(addDaysLocal(easter, 42)), 'Uroczystość Wniebowstąpienia Pańskiego');
        put(ymd(addDaysLocal(easter, 49)), 'Uroczystość Zesłania Ducha Świętego');
        put(ymd(addDaysLocal(easter, 60)), 'Boże Ciało');
        put(ymd(new Date(year, 7, 15)), 'Wniebowzięcie NMP');
        put(ymd(new Date(year, 10, 1)), 'Uroczystość Wszystkich Świętych');
        put(ymd(new Date(year, 11, 25)), 'Boże Narodzenie');
        put(ymd(new Date(year, 11, 26)), 'Drugi Dzień Bożego Narodzenia');
        return map;
    }

    function toRomanLiturgy(num) {
        const map = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        let n = num;
        let out = '';
        map.forEach(([value, glyph]) => {
            while (n >= value) {
                out += glyph;
                n -= value;
            }
        });
        return out;
    }

    function generateSundayNamesForYear(year) {
        const names = { ...generateHolyDaysForYear(year) };
        const easter = calculateEasterDate(year);
        const advent1 = (() => {
            const d = new Date(year, 10, 27);
            while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
            return d;
        })();
        const christKing = addDaysLocal(advent1, -7);
        const lent1 = addDaysLocal(easter, -42);
        const palm = addDaysLocal(easter, -7);
        const trinity = addDaysLocal(easter, 56);
        const epiphany = new Date(year, 0, 6);
        const baptism = addDaysLocal(epiphany, (7 - epiphany.getDay()) % 7 || 7);
        const christmas = new Date(year, 11, 25);
        const holyFamily = christmas.getDay() === 0
            ? new Date(year, 11, 30)
            : addDaysLocal(christmas, (7 - christmas.getDay()) % 7);

        const firstSunday = new Date(year, 0, 1);
        while (firstSunday.getDay() !== 0) firstSunday.setDate(firstSunday.getDate() + 1);

        let ordinaryBefore = 2;
        const postTrinity = [];

        for (let d = new Date(firstSunday); d.getFullYear() === year; d = addDaysLocal(d, 7)) {
            const key = formatDateForAPI(d);
            const t = d.getTime();
            if (names[key]) continue;
            if (t === holyFamily.getTime()) {
                names[key] = 'Święto Świętej Rodziny Jezusa, Maryi i Józefa';
                continue;
            }
            if (t === baptism.getTime()) {
                names[key] = 'Niedziela Chrztu Pańskiego';
                continue;
            }
            if (t >= advent1.getTime()) {
                const week = Math.round((t - advent1.getTime()) / (7 * 86400000)) + 1;
                names[key] = ['I Niedziela Adwentu', 'II Niedziela Adwentu', 'III Niedziela Adwentu', 'IV Niedziela Adwentu'][week - 1] || 'Niedziela Adwentu';
                continue;
            }
            if (t === christKing.getTime()) {
                names[key] = 'Uroczystość Jezusa Chrystusa Króla Wszechświata';
                continue;
            }
            if (t === palm.getTime()) {
                names[key] = 'Niedziela Palmowa';
                continue;
            }
            if (t >= lent1.getTime() && t < easter.getTime()) {
                const week = Math.round((t - lent1.getTime()) / (7 * 86400000)) + 1;
                names[key] = `${toRomanLiturgy(week)} Niedziela Wielkiego Postu`;
                continue;
            }
            if (t > easter.getTime() && t < addDaysLocal(easter, 49).getTime()) {
                const week = Math.round((t - easter.getTime()) / (7 * 86400000)) + 1;
                names[key] = week === 2
                    ? 'II Niedziela Wielkanocna (Miłosierdzia Bożego)'
                    : `${toRomanLiturgy(week)} Niedziela Wielkanocna`;
                continue;
            }
            if (t === trinity.getTime()) {
                names[key] = 'Uroczystość Najświętszej Trójcy';
                continue;
            }
            if (t > baptism.getTime() && t < lent1.getTime()) {
                names[key] = `${toRomanLiturgy(ordinaryBefore)} Niedziela zwykła`;
                ordinaryBefore += 1;
                continue;
            }
            if (t > trinity.getTime() && t < christKing.getTime()) {
                postTrinity.push(key);
                continue;
            }
            if (t < baptism.getTime()) {
                names[key] = 'Niedziela po Narodzeniu Pańskim';
            }
        }

        postTrinity.forEach((key, idx) => {
            const num = 33 - (postTrinity.length - 1 - idx);
            names[key] = `${toRomanLiturgy(num)} Niedziela zwykła`;
        });

        return names;
    }

    const generatedSundayNames = {};

    function sundayNamesForYear(year) {
        if (!generatedSundayNames[year]) {
            generatedSundayNames[year] = generateSundayNamesForYear(year);
        }
        return generatedSundayNames[year];
    }

    function isSwietoNakazane(date) {
        const dateStr = formatDateForAPI(date);
        if (swietaNakazane[dateStr]) return true;
        const year = date instanceof Date ? date.getFullYear() : parseInt(String(dateStr).slice(0, 4), 10);
        return !!generateHolyDaysForYear(year)[dateStr];
    }

    function getSwietoName(date) {
        const dateStr = formatDateForAPI(date);
        if (swietaNakazane[dateStr]) return swietaNakazane[dateStr];
        if (niedzieleLiturgiczne[dateStr]) return niedzieleLiturgiczne[dateStr];
        const year = date instanceof Date ? date.getFullYear() : parseInt(String(dateStr).slice(0, 4), 10);
        return sundayNamesForYear(year)[dateStr] || 'Niedziela';
    }

    // ==================== TERMINY KOLEJNYCH WIZYT ====================

    // Kolejne dni dyżurowe (niedziele + święta nakazane) po podanej dacie
    function getUpcomingDutyDates(dateStr, count = 5) {
        return planningGetUpcomingDutyDates(dateStr, count, isSwietoNakazane);
    }

    // Czytelna etykieta opcji dla listy "Następna wizyta"
    function formatNextVisitOption(dateStr) {
        const date = new Date(dateStr);
        return planningFormatNextVisitOption(dateStr, {
            isHoliday: isSwietoNakazane(date),
            nowDate: new Date(),
        });
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

    function applyAdwentPayload(payload) {
        if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'open')) {
            adwentOpen = !!payload.open;
            adwentData = payload.dane && typeof payload.dane === 'object' ? payload.dane : {};
            return;
        }
        adwentData = payload && typeof payload === 'object' ? payload : {};
        adwentOpen = Object.keys(adwentData).length > 0;
    }

    function updateAdwentToolbarButton() {
        const btn = document.getElementById('oc-adwent-btn');
        if (!btn) return;
        if (adwentOpen) {
            btn.title = `Zamknij Adwent na rok ${currentYear}. Tabela zniknie, a wszystkie wpisy adwentowe tego roku zostaną usunięte.`;
            btn.setAttribute('aria-label', `Zamknij Adwent na rok ${currentYear} i usuń wpisy`);
        } else {
            btn.title = `Otwórz tabelę Adwentu na rok ${currentYear}. Drugie kliknięcie zamknie rok i usunie wpisy.`;
            btn.setAttribute('aria-label', `Otwórz Adwent na rok ${currentYear}`);
        }
    }

    function syncYearSelectsToCurrent() {
        ['oc-wybierzRok', 'oc-wybierzRokAdwent'].forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            ensureYearOption(select, currentYear);
            select.value = currentYear;
        });
    }

    function showAdwentInMenu() {
        const adwentTabBtn = document.getElementById('oc-adwentTabBtn');
        if (adwentTabBtn) {
            adwentTabBtn.style.display = 'inline-block';
        }
        updateAdwentToolbarButton();
    }

    function syncAdwentTabForYear() {
        if (adwentOpen) {
            showAdwentInMenu();
        } else {
            hideAdwentFromMenu();
        }
    }

    async function loadAdwent() {
        try {
            const response = await apiCall(`/adwent?rok=${currentYear}`);
            if (response.ok) {
                applyAdwentPayload(await response.json());
            }
        } catch (e) {
            debugError('Błąd ładowania adwentu:', e);
        }
        updateAdwentToolbarButton();
    }

    async function saveAdwent() {
        if (!adwentOpen) return;
        try {
            syncAdwentFromDOM();
            const response = await apiCall(`/adwent?rok=${currentYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'zapisz_adwent', dane: adwentData }),
            });
            if (response.ok) {
                showMessage('Adwent zapisany');
            } else {
                showMessage('Błąd zapisu Adwentu', 'error');
            }
        } catch (e) {
            debugError('Błąd zapisu adwentu:', e);
            showMessage('Błąd zapisu Adwentu', 'error');
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

            const szafarzeOptionsOsoba = szafarzSelectOptions(data.osobaGlowna);
            const szafarzeOptionsPomocnik = szafarzSelectOptions(data.pomocnik);

            const weekName = ['', 'I Tydzień Adwentu', 'II Tydzień Adwentu', 'III Tydzień Adwentu', 'IV Tydzień Adwentu'][day.weekNumber] || '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="oc-cal-date" data-label="Data">${escapeHtml(formatDate(day.date))}</td>
                <td class="oc-cal-name" data-label="Dzień">${escapeHtml(day.dayName)}</td>
                <td class="oc-adv-week" data-label="Tydzień Adwentu">${escapeHtml(weekName)}</td>
                <td class="oc-cal-osoba" data-label="Osoba główna">
                    <select class="osoba-glowna-select" aria-label="Osoba główna">
                        <option value="" ${!data.osobaGlowna ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptionsOsoba}
                    </select>
                </td>
                <td class="oc-cal-pomocnik" data-label="Pomocnik">
                    <select class="pomocnik-select" aria-label="Pomocnik">
                        <option value="" ${!data.pomocnik ? 'selected' : ''}>-- Wybierz --</option>
                        ${szafarzeOptionsPomocnik}
                    </select>
                </td>
            `;

            row.querySelectorAll('select').forEach(el => {
                el.addEventListener('change', debounce(saveAdwent, 1000));
            });

            tbody.appendChild(row);
        });
    }

    /** Przełącza główne menu na wybraną zakładkę (Kalendarz, Adwent, …). Adwent w menu tylko otwiera widok; zamknięcie jest z paska Kalendarza. */
    function activateTab(tab) {
        if (!tab) return;

        const buttons = document.querySelectorAll('.oc-tab-button');
        const contents = document.querySelectorAll('.oc-tab-content');
        const adwentTabBtn = document.getElementById('oc-adwentTabBtn');

        buttons.forEach(btn => btn.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        const tabButton = document.querySelector(`.oc-tab-button[data-tab="${tab}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }

        const panel = document.getElementById('oc-' + tab);
        if (panel) {
            panel.classList.add('active');
        }

        if (tab === 'adwent' && adwentTabBtn) {
            if (!adwentOpen) {
                activateTab('kalendarz');
                return;
            }
            adwentTabBtn.style.display = 'inline-block';
            loadAdwent().then(() => {
                if (adwentOpen) {
                    renderAdwent();
                } else {
                    syncAdwentTabForYear();
                }
            }).catch(err => {
                debugError('Błąd ładowania Adwentu:', err);
            });
        }

        if (tab === 'raporty') {
            fillRaportYearSelect();
            fillRaportMonthSelect();
            loadCurrentRaport();
        }
    }

    function navigateToAdwent() {
        activateTab('adwent');
    }

    /**
     * Przycisk Adwent w pasku Kalendarza: pierwsze kliknięcie otwiera tabelę na wybrany rok,
     * drugie zamyka rok i kasuje wpisy adwentowe.
     */
    async function onToolbarAdwentClick() {
        if (adwentOpen) {
            const ok = await confirm(
                `Zamknąć Adwent na rok ${currentYear}? Tabela zniknie, a wszystkie wpisy adwentowe tego roku zostaną usunięte. Adwent na ten rok będzie można otworzyć ponownie od nowa.`
            );
            if (!ok) return;
            try {
                const response = await apiCall(`/adwent?rok=${currentYear}`, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'zamknij_adwent' }),
                });
                if (!response.ok) {
                    showMessage('Nie udało się zamknąć Adwentu', 'error');
                    return;
                }
                applyAdwentPayload(await response.json());
                syncAdwentTabForYear();
                showMessage(`Adwent ${currentYear} zamknięty. Wpisy usunięte.`);
            } catch (e) {
                debugError('Błąd zamykania Adwentu:', e);
                showMessage('Nie udało się zamknąć Adwentu', 'error');
            }
            return;
        }

        try {
            const response = await apiCall(`/adwent?rok=${currentYear}`, {
                method: 'POST',
                body: JSON.stringify({ action: 'otworz_adwent' }),
            });
            if (!response.ok) {
                showMessage('Nie udało się otworzyć Adwentu', 'error');
                return;
            }
            applyAdwentPayload(await response.json());
            syncAdwentTabForYear();
            navigateToAdwent();
        } catch (e) {
            debugError('Błąd otwierania Adwentu:', e);
            showMessage('Nie udało się otworzyć Adwentu', 'error');
        }
    }

    /** Usuwa „Adwent” z głównego menu. Gdy aktywna była zakładka Adwent, wraca do Kalendarza. */
    function hideAdwentFromMenu() {
        const adwentTabBtn = document.getElementById('oc-adwentTabBtn');
        const adwentContent = document.getElementById('oc-adwent');
        if (!adwentTabBtn || !adwentContent) return;

        const wasOnAdwent = adwentTabBtn.classList.contains('active') || adwentContent.classList.contains('active');

        adwentTabBtn.style.display = 'none';
        adwentTabBtn.classList.remove('active');
        adwentContent.classList.remove('active');

        if (wasOnAdwent) {
            const kalendarzBtn = document.querySelector('.oc-tab-button[data-tab="kalendarz"]');
            const kalendarzContent = document.getElementById('oc-kalendarz');
            if (kalendarzBtn && kalendarzContent) {
                document.querySelectorAll('.oc-tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.oc-tab-content').forEach(c => c.classList.remove('active'));
                kalendarzBtn.classList.add('active');
                kalendarzContent.classList.add('active');
            }
        }
        updateAdwentToolbarButton();
    }

    // ==================== VISIT MODAL ====================

    function buildVisitModalDataset(dateStr) {
        const upcoming = getUpcomingDutyDates(dateStr, 5);
        const aktywni = chorzy.filter(c => c.status === 'TAK' && normalizeName(c.imieNazwisko));
        const visitedChorzy = historiaData[dateStr];
        const plannedChorzy = plannedData[dateStr] || [];

        return {
            upcoming,
            aktywni,
            visitedChorzy: visitedChorzy || [],
            hasSavedVisitReport: Array.isArray(visitedChorzy),
            doPokazania: assembleVisitPatientList({
                aktywni,
                dateStr,
                visitedNames: visitedChorzy || [],
                plannedNames: plannedChorzy,
                patientByName: buildPatientIndexByName(chorzy),
                getUpcomingDutyDatesFn: getUpcomingDutyDates,
            }),
        };
    }

    function syncVisitModalEmptyState(listEl) {
        const hintEl = document.querySelector('#oc-modalRaport .oc-raport-hint');
        const hasCards = !!listEl.querySelector('.oc-raport-card');
        const canAddOccasional = !!listEl.querySelector('.oc-raport-add-occasional');
        const message = getEmptyVisitListMessage({ hasCards, canAddOccasional });
        const existing = listEl.querySelector('.oc-raport-empty');

        if (hintEl) {
            hintEl.hidden = !hasCards;
            if (hasCards) hintEl.textContent = VISIT_LIST_HINT;
        }

        if (!message) {
            if (existing) existing.remove();
            return;
        }

        const isPlannedEmpty = canAddOccasional;
        if (existing) {
            existing.textContent = message;
            existing.classList.toggle('oc-raport-empty-planned', isPlannedEmpty);
            return;
        }

        const notice = document.createElement('div');
        notice.className = 'oc-raport-empty' + (isPlannedEmpty ? ' oc-raport-empty-planned' : '');
        notice.textContent = message;
        const picker = listEl.querySelector('.oc-raport-add-occasional');
        if (picker) {
            picker.after(notice);
        } else {
            listEl.appendChild(notice);
        }
    }

    function persistCurrentPlannedList(dateStr) {
        const plannedNow = collectPlannedNamesFromCards();
        plannedData[dateStr] = plannedNow;
        return queuePlannedVisitSave(dateStr, plannedNow).then(ok => {
            if (!ok) {
                showMessage('Nie udało się zapisać listy planowanych odwiedzin', 'error');
            }
            return ok;
        });
    }

    function persistAfterRemovingFromVisitList(dateStr, removedName) {
        const plannedPromise = persistCurrentPlannedList(dateStr);
        const previousVisited = historiaData[dateStr] || [];
        const wasVisited = previousVisited.some(n => normalizeName(n) === removedName);
        if (!wasVisited) {
            return plannedPromise;
        }

        const remainingVisited = previousVisited.filter(n => normalizeName(n) !== removedName);
        historiaData[dateStr] = remainingVisited;
        return Promise.all([
            plannedPromise,
            saveVisitHistory(dateStr, remainingVisited, VISIT_HISTORY_TYPE),
        ]).then(([planOk, visitOk]) => {
            if (planOk && visitOk) {
                updateVisitButtonState(dateStr, remainingVisited);
                return true;
            }
            if (planOk && !visitOk) {
                showMessage('Nie udało się zaktualizować zapisanego raportu odwiedzin', 'error');
            }
            return planOk && visitOk;
        });
    }

    function restoreNameToOccasionalSelect(ctx, name) {
        const { listEl } = ctx;
        let select = listEl.querySelector('#oc-raportOccasionalSelect');
        if (!select) {
            renderOccasionalAddPicker(ctx);
            return;
        }
        if (Array.from(select.options).some(opt => opt.value === name)) {
            return;
        }
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        const rest = Array.from(select.options).slice(1);
        const insertBefore = rest.find(opt => compareNames(opt.value, name) > 0);
        if (insertBefore) {
            select.insertBefore(option, insertBefore);
        } else {
            select.appendChild(option);
        }
    }

    function buildVisitCardMarkup(name, isVisited, defaultDate, optionsHtml, selectId, removable) {
        const occasionalSelected = defaultDate === OCCASIONAL_VISIT_MARKER ? 'selected' : '';
        const safeName = escapeHtml(name);
        const removeBtn = removable
            ? `<button type="button" class="oc-raport-remove" aria-label="Usuń ${safeName} z listy tego dnia">Usuń</button>`
            : '';
        return `
            <div class="oc-raport-top">
                <span class="oc-raport-name"><span class="oc-raport-lp"></span> ${safeName}</span>
                <div class="oc-raport-top-actions">
                    <label class="oc-raport-status">
                        <input type="checkbox" class="oc-raport-odwiedzona" ${isVisited ? 'checked' : ''}>
                        <span class="oc-raport-status-label">${isVisited ? 'Odwiedzona' : 'Nieobecny'}</span>
                    </label>
                    ${removeBtn}
                </div>
            </div>
            <div class="oc-raport-bottom">
                <label class="oc-raport-next-label" for="${selectId}">Następna wizyta:</label>
                <select class="oc-raport-next-select" id="${selectId}">
                    <option value="${OCCASIONAL_VISIT_MARKER}" ${occasionalSelected}>${formatNextVisitOption(OCCASIONAL_VISIT_MARKER)}</option>
                    ${optionsHtml || '<option value="">Brak dostępnych terminów</option>'}
                </select>
            </div>
        `;
    }

    function createVisitCardAppender(ctx) {
        const { listEl, upcoming, visitedChorzy, hasSavedVisitReport, renderedNames, dateStr } = ctx;
        const visitedSet = new Set(visitedChorzy.map(name => normalizeName(name)).filter(Boolean));
        let nextSelectIndex = 0;

        const renumberRaportCards = () => {
            const cards = Array.from(listEl.querySelectorAll('.oc-raport-card'));
            cards.forEach((cardEl, idx) => {
                const lpEl = cardEl.querySelector('.oc-raport-lp');
                if (lpEl) lpEl.textContent = `${idx + 1}.`;
            });
        };

        return function appendChoryCard(chory) {
            const name = normalizeName(chory.imieNazwisko);
            if (!name || renderedNames.has(name)) return;
            renderedNames.add(name);

            const isVisited = hasSavedVisitReport ? visitedSet.has(name) : true;
            const defaultDate = resolveNextVisitDefault(chory.nastepnaWizyta, upcoming, dateStr);
            const scheduleAfterRemoval = resolveScheduleAfterRemoval(
                chory.nastepnaWizyta,
                dateStr
            );

            const optionsForSelect = [...upcoming];
            if (defaultDate && !isOccasionalVisit(defaultDate) && !optionsForSelect.includes(defaultDate)) {
                optionsForSelect.unshift(defaultDate);
            }
            const optionsHtml = optionsForSelect.map(ds => {
                const selected = ds === defaultDate ? 'selected' : '';
                return `<option value="${ds}" ${selected}>${formatNextVisitOption(ds)}</option>`;
            }).join('');

            const selectId = `oc-raportNext-${nextSelectIndex++}`;
            const card = document.createElement('div');
            card.className = 'oc-raport-card' + (isVisited ? '' : ' nieobecny');
            card.dataset.name = name;
            card.innerHTML = buildVisitCardMarkup(name, isVisited, defaultDate, optionsHtml, selectId, true);

            const checkbox = card.querySelector('.oc-raport-odwiedzona');
            const statusLabel = card.querySelector('.oc-raport-status-label');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    statusLabel.textContent = 'Odwiedzona';
                    card.classList.remove('nieobecny');
                } else {
                    statusLabel.textContent = 'Nieobecny';
                    card.classList.add('nieobecny');
                }
            });

            const removeBtn = card.querySelector('.oc-raport-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', async () => {
                    const confirmed = await confirm(`Czy na pewno chcesz usunąć ${name} z listy tego dnia?`);
                    if (!confirmed) return;

                    renderedNames.delete(name);
                    card.remove();
                    renumberRaportCards();
                    restoreNameToOccasionalSelect(ctx, name);
                    if (scheduleAfterRemoval !== null) {
                        await updateChorzySchedules({ [chory.imieNazwisko]: scheduleAfterRemoval });
                    }
                    persistAfterRemovingFromVisitList(dateStr, name);
                    syncVisitModalEmptyState(listEl);
                });
            }

            const existingCards = Array.from(listEl.querySelectorAll('.oc-raport-card'));
            const insertBefore = existingCards.find(existing => compareNames(existing.dataset.name, name) > 0);
            if (insertBefore) {
                listEl.insertBefore(card, insertBefore);
            } else {
                listEl.appendChild(card);
            }
            renumberRaportCards();
            syncVisitModalEmptyState(listEl);
        };
    }

    function renderOccasionalAddPicker(ctx) {
        const { listEl, aktywni, renderedNames, appendChoryCard, dateStr } = ctx;
        const occasionalToAdd = aktywni
            .filter(c => !renderedNames.has(normalizeName(c.imieNazwisko)))
            .sort((a, b) => compareNames(a.imieNazwisko, b.imieNazwisko));

        if (occasionalToAdd.length === 0) {
            return false;
        }

        const addBox = document.createElement('div');
        addBox.className = 'oc-raport-add-occasional';
        addBox.innerHTML = `
            <span class="oc-raport-add-occasional-label">Dodaj chorego okazjonalnie na ten termin:</span>
            <div class="oc-raport-add-occasional-controls">
                <select class="oc-raport-next-select" id="oc-raportOccasionalSelect">
                    <option value="">— wybierz osobę —</option>
                    ${occasionalToAdd.map(ch => {
                        const name = escapeHtml(normalizeName(ch.imieNazwisko));
                        return `<option value="${name}">${name}</option>`;
                    }).join('')}
                </select>
                <button type="button" class="oc-btn oc-btn-small" id="oc-raportAddOccasionalBtn">Dodaj</button>
            </div>
        `;
        listEl.prepend(addBox);

        const occasionalSelect = addBox.querySelector('#oc-raportOccasionalSelect');
        const addOccasionalBtn = addBox.querySelector('#oc-raportAddOccasionalBtn');
        addOccasionalBtn.addEventListener('click', () => {
            const selectedName = normalizeName(occasionalSelect.value);
            if (!selectedName) return;

            const chory = aktywni.find(c => normalizeName(c.imieNazwisko) === selectedName);
            if (!chory) return;

            appendChoryCard(chory);
            const selectedOption = Array.from(occasionalSelect.options).find(opt => opt.value === selectedName);
            if (selectedOption) selectedOption.remove();
            occasionalSelect.value = '';

            persistCurrentPlannedList(dateStr);
        });

        return true;
    }

    function openVisitModal(dateStr) {
        const modal = document.getElementById('oc-modalRaport');
        const listEl = document.getElementById('oc-raportListaChorych');
        const titleEl = document.getElementById('oc-raportTytul');
        if (!modal || !listEl) return;

        modal.dataset.date = dateStr;
        if (titleEl) titleEl.textContent = `Raport odwiedzin — ${formatDate(dateStr)}`;
        listEl.innerHTML = '';

        const { upcoming, aktywni, visitedChorzy, hasSavedVisitReport, doPokazania } = buildVisitModalDataset(dateStr);
        const ctx = {
            listEl,
            dateStr,
            upcoming,
            aktywni,
            visitedChorzy,
            hasSavedVisitReport,
            renderedNames: new Set(),
            appendChoryCard: null,
        };
        ctx.appendChoryCard = createVisitCardAppender(ctx);

        doPokazania.forEach(chory => ctx.appendChoryCard(chory));
        renderOccasionalAddPicker(ctx);
        syncVisitModalEmptyState(listEl);
        syncRevertVisitButton(hasSavedVisitReport);

        modal.style.display = 'flex';
    }

    function syncRevertVisitButton(visible) {
        const btn = document.getElementById('oc-raportPrzywrocBtn');
        if (!btn) return;
        btn.hidden = !visible;
    }

    function closeVisitModal() {
        const modal = document.getElementById('oc-modalRaport');
        if (modal) modal.style.display = 'none';
    }

    async function savePlannedVisitList(dateStr, plannedChorzy) {
        if (!dateStr) return false;
        try {
            return await saveVisitHistory(dateStr, plannedChorzy || [], PLANNED_VISIT_HISTORY_TYPE);
        } catch (e) {
            debugError('Błąd zapisu listy planowanych odwiedzin:', e);
            return false;
        }
    }

    const plannedVisitSaveQueue = createPerKeySaveQueue(savePlannedVisitList);

    function queuePlannedVisitSave(dateStr, plannedChorzy) {
        return plannedVisitSaveQueue.enqueue(dateStr, plannedChorzy);
    }
    
    /**
     * Wspólny panel jak przy „Odwiedzone” (.oc-visited-tooltip) — ten sam wygląd co w kalendarzu.
     * renderContent(panel) zwraca true, gdy panel ma być pokazany.
     */
    function bindOcStyleTooltip(anchor, renderContent, options = {}) {
        const hideOnClick = options.hideOnClick !== false;

        if (anchor._ocStyleTooltipBound) {
            anchor._ocStyleTooltipRender = renderContent;
            return;
        }
        anchor._ocStyleTooltipBound = true;
        anchor._ocStyleTooltipRender = renderContent;

        let tooltipElement = null;
        let isHovering = false;
        let tooltipTimeout = null;

        const createTooltip = () => {
            if (tooltipElement) {
                tooltipElement.remove();
                tooltipElement = null;
            }

            const panel = document.createElement('div');
            panel.className = 'oc-visited-tooltip';
            const ok = anchor._ocStyleTooltipRender(panel);
            if (!ok) {
                panel.remove();
                return null;
            }

            tooltipElement = panel;
            document.body.appendChild(tooltipElement);

            const rect = anchor.getBoundingClientRect();
            const th = tooltipElement.offsetHeight;
            let top = rect.top - th - 10;
            let left = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2);
            if (top < 10) {
                top = rect.bottom + 10;
            }
            left = Math.max(10, Math.min(left, window.innerWidth - tooltipElement.offsetWidth - 10));
            tooltipElement.style.top = top + 'px';
            tooltipElement.style.left = left + 'px';
            anchor._tooltipElement = tooltipElement;
            return tooltipElement;
        };

        const showTooltip = () => {
            isHovering = true;
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
                anchor._tooltipElement = null;
            }
        };

        anchor.addEventListener('mouseenter', showTooltip);
        anchor.addEventListener('mouseleave', hideTooltip);
        if (hideOnClick) {
            anchor.addEventListener('click', hideTooltip);
        }
    }

    function attachChorzyUwagiAuditTooltip(cell, chory) {
        bindOcStyleTooltip(cell, (panel) => {
            if (!chory.uwagiOstatnioPrzez || !chory.uwagiOstatnioData) {
                return false;
            }
            const title = document.createElement('div');
            title.textContent = 'Ostatnia zmiana uwag';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '6px';
            panel.appendChild(title);
            const who = document.createElement('div');
            who.textContent = '• ' + chory.uwagiOstatnioPrzez;
            who.style.marginBottom = '2px';
            panel.appendChild(who);
            const when = document.createElement('div');
            when.textContent = '• ' + formatDateTime(chory.uwagiOstatnioData);
            when.style.marginBottom = '2px';
            panel.appendChild(when);
            return true;
        }, { hideOnClick: false });
    }

    function setupTooltip(button, odwiedzeniChorzy) {
        button._odwiedzeniChorzy = odwiedzeniChorzy;

        if (button._hasTooltipListeners) {
            return;
        }
        button._hasTooltipListeners = true;

        bindOcStyleTooltip(button, (panel) => {
            const chorzyList = button._odwiedzeniChorzy || [];
            if (chorzyList.length === 0) {
                return false;
            }
            const title = document.createElement('div');
            title.textContent = 'Odwiedzeni:';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '6px';
            panel.appendChild(title);
            chorzyList.forEach(name => {
                const item = document.createElement('div');
                item.textContent = '• ' + name;
                item.style.marginBottom = '2px';
                panel.appendChild(item);
            });
            return true;
        });
    }

    function updateVisitButtonState(dateStr, selectedChorzy) {
        const button = document.querySelector(`#oc-tabelaKalendarzBody button[data-date="${dateStr}"]`)
            || document.querySelector(`button[data-date="${dateStr}"]`);
        if (!button) return;

        const completed = Object.prototype.hasOwnProperty.call(historiaData, dateStr);
        const state = getVisitButtonState(selectedChorzy, { completed });
        button.textContent = state.text;
        button.className = state.className;

        if (state.hasVisited) {
            setupTooltip(button, selectedChorzy);
            return;
        }

        if (button._tooltipElement) {
            button._tooltipElement.remove();
            button._tooltipElement = null;
        }
    }

    async function saveVisit() {
        const modal = document.getElementById('oc-modalRaport');
        const dateStr = modal ? modal.dataset.date : '';
        if (!dateStr) return;

        const cards = document.querySelectorAll('#oc-raportListaChorych .oc-raport-card');
        const { selectedChorzy, plannedChorzy, scheduleMap } = collectVisitDataFromCards(cards);

        try {
            // 1) Zapisz skład zaplanowanych odwiedzin dla tej daty (niezależnie od statusu odwiedzenia)
            plannedData[dateStr] = plannedChorzy;
            const persistResult = await persistVisitReport({
                dateStr,
                plannedChorzy,
                selectedChorzy,
                queuePlannedVisitSave,
                saveVisitHistoryFn: saveVisitHistory,
            });

            if (!persistResult.ok) {
                if (persistResult.error === 'planned_save_failed') {
                    showMessage('Błąd zapisu listy planowanych odwiedzin', 'error');
                    return;
                }
                debugError('saveVisit: nieudany zapis historii odwiedzin');
                showMessage('Błąd zapisu odwiedzin', 'error');
                return;
            }

            // Zaktualizuj lokalne dane historii
            historiaData[dateStr] = selectedChorzy;

            // Zapisz kolejne terminy wizyt dla poszczególnych chorych
            await updateChorzySchedules(scheduleMap);

            // Zaktualizuj przycisk
            updateVisitButtonState(dateStr, selectedChorzy);

            showMessage('Raport odwiedzin zapisany');
            closeVisitModal();
        } catch (e) {
            showMessage('Błąd zapisu raportu odwiedzin', 'error');
        }
    }

    async function revertVisitToPlanned() {
        const modal = document.getElementById('oc-modalRaport');
        const dateStr = modal ? modal.dataset.date : '';
        if (!dateStr) return;

        const confirmed = await confirm(
            'Czy na pewno chcesz cofnąć raport odwiedzin? Lista osób na ten dzień zostanie, status wróci do „Zaplanowane”, a następna wizyta wróci na ten dzień.'
        );
        if (!confirmed) return;

        const cards = document.querySelectorAll('#oc-raportListaChorych .oc-raport-card');
        const { plannedChorzy } = collectVisitDataFromCards(cards);
        const scheduleMap = buildScheduleMapAfterRevertingVisit(chorzy, plannedChorzy, dateStr);

        try {
            plannedData[dateStr] = plannedChorzy;
            const persistResult = await revertVisitReportToPlanned({
                dateStr,
                plannedChorzy,
                queuePlannedVisitSave,
                deleteVisitHistoryFn: deleteVisitHistory,
            });

            if (!persistResult.ok) {
                if (persistResult.error === 'planned_save_failed') {
                    showMessage('Błąd zapisu listy planowanych odwiedzin', 'error');
                    return;
                }
                showMessage('Nie udało się cofnąć raportu odwiedzin', 'error');
                return;
            }

            delete historiaData[dateStr];
            await updateChorzySchedules(scheduleMap);
            updateVisitButtonState(dateStr, []);
            showMessage('Raport cofnięty — status: Zaplanowane');
            closeVisitModal();
        } catch (e) {
            showMessage('Nie udało się cofnąć raportu odwiedzin', 'error');
        }
    }

    /**
     * Zapisuje termin kolejnej wizyty (nastepnaWizyta) dla wskazanych chorych.
     * Aktualizuje lokalną listę i zapisuje całość przez /chorzy/bulk
     * (bez odczytu z DOM, by nie nadpisać danych, gdy tabela nie jest wyrenderowana).
     */
    async function updateChorzySchedules(scheduleMap) {
        if (!scheduleMap || Object.keys(scheduleMap).length === 0) return;

        let changed = false;
        chorzy.forEach(c => {
            if (Object.prototype.hasOwnProperty.call(scheduleMap, c.imieNazwisko)) {
                c.nastepnaWizyta = scheduleMap[c.imieNazwisko];
                changed = true;
            }
        });
        if (!changed) return;

        try {
            const response = await apiCall('/chorzy/bulk', {
                method: 'POST',
                body: JSON.stringify(chorzy),
            });
            if (response.ok) {
                await loadChorzy();
                renderChorzy();
            }
        } catch (e) {
            debugError('Błąd zapisu terminów wizyt:', e);
        }
    }
    
    async function loadHistoriaForYear(year) {
        try {
            // Załaduj wszystkie odwiedziny dla danego roku
            const response = await apiCall('/historia');
            if (response.ok) {
                const allHistoria = await response.json();
                const { nextHistoriaData, nextPlannedData } = splitHistoriaEntriesByType(allHistoria, year);
                historiaData = nextHistoriaData;
                plannedData = nextPlannedData;
            }
        } catch (e) {
            debugError('Błąd ładowania historii:', e);
        }
    }

    // ==================== RAPORTY ====================

    const RAPORT_MONTH_NAMES = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

    let lastRaportView = null;

    function formatRaportMonthName(miesiac) {
        const [year, month] = String(miesiac || '').split('-');
        const monthIndex = parseInt(month, 10) - 1;
        if (!year || monthIndex < 0 || monthIndex > 11) {
            return miesiac || '';
        }
        return `${RAPORT_MONTH_NAMES[monthIndex]} ${year}`;
    }

    function raportYearRange() {
        const now = new Date();
        const currentY = now.getFullYear();
        return {
            startY: Math.min(2025, currentY - 1),
            endY: currentY + 1,
            currentY,
        };
    }

    function fillRaportMonthSelect() {
        const select = document.getElementById('oc-wybierzMiesiac');
        if (!select) return '';

        const previous = select.value;
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

        select.innerHTML = '';

        const yearOption = document.createElement('option');
        yearOption.value = 'rok';
        yearOption.textContent = 'Cały rok';
        select.appendChild(yearOption);

        RAPORT_MONTH_NAMES.forEach((name, index) => {
            const value = String(index + 1).padStart(2, '0');
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            select.appendChild(option);
        });

        const preferred = previous || currentMonth;
        select.value = select.querySelector(`option[value="${preferred}"]`) ? preferred : currentMonth;
        return select.value;
    }

    function fillRaportYearSelect() {
        const select = document.getElementById('oc-wybierzRokRaport');
        if (!select) return '';

        const { startY, endY, currentY } = raportYearRange();
        const previous = select.value;
        select.innerHTML = '';
        for (let year = startY; year <= endY; year++) {
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            select.appendChild(option);
        }
        const preferred = previous || String(currentY);
        select.value = select.querySelector(`option[value="${preferred}"]`) ? preferred : String(currentY);
        return select.value;
    }

    function selectedRaportMonth() {
        const yearSelect = document.getElementById('oc-wybierzRokRaport');
        const monthSelect = document.getElementById('oc-wybierzMiesiac');
        const rok = (yearSelect && yearSelect.value) || fillRaportYearSelect();
        const miesiac = (monthSelect && monthSelect.value) || fillRaportMonthSelect();
        if (!rok || !miesiac) return '';
        return `${rok}-${miesiac}`;
    }

    function loadCurrentRaport() {
        const yearSelect = document.getElementById('oc-wybierzRokRaport');
        const monthSelect = document.getElementById('oc-wybierzMiesiac');
        const rok = (yearSelect && yearSelect.value) || fillRaportYearSelect();
        const miesiac = (monthSelect && monthSelect.value) || fillRaportMonthSelect();
        if (miesiac === 'rok') {
            return loadRaportRoczny(rok);
        }
        return loadRaport(selectedRaportMonth());
    }

    async function loadRaport(miesiac) {
        const container = document.getElementById('oc-raportContainer');
        if (!miesiac) {
            lastRaportView = null;
            if (container) {
                container.innerHTML = '<p class="oc-raport-empty-note">Wybierz miesiąc, aby zobaczyć statystyki.</p>';
            }
            return;
        }
        try {
            if (container) {
                container.innerHTML = '<p class="oc-raport-empty-note">Ładowanie raportu…</p>';
            }
            const response = await apiCall(`/raporty/miesieczny?miesiac=${encodeURIComponent(miesiac)}`);
            if (response.ok) {
                const data = await response.json();
                lastRaportView = { type: 'miesiac', key: miesiac, data };
                renderRaport(data, miesiac);
                return;
            }
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.message || `Błąd ładowania raportu (${response.status})`);
        } catch (e) {
            lastRaportView = null;
            debugError('Błąd ładowania raportu:', e);
            if (container) {
                container.innerHTML = `<p class="oc-raport-error">Nie udało się wczytać statystyk: ${escapeHtml(e.message || 'nieznany błąd')}</p>`;
            }
        }
    }

    async function loadRaportRoczny(rok) {
        const container = document.getElementById('oc-raportContainer');
        if (!rok) {
            lastRaportView = null;
            if (container) {
                container.innerHTML = '<p class="oc-raport-empty-note">Wybierz rok, aby zobaczyć zestawienie.</p>';
            }
            return;
        }
        try {
            if (container) {
                container.innerHTML = '<p class="oc-raport-empty-note">Ładowanie raportu rocznego…</p>';
            }
            const response = await apiCall(`/raporty/roczny?rok=${encodeURIComponent(rok)}`);
            if (response.ok) {
                const data = await response.json();
                lastRaportView = { type: 'rok', key: String(rok), data };
                renderRaportRoczny(data, rok);
                return;
            }
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.message || `Błąd ładowania raportu rocznego (${response.status})`);
        } catch (e) {
            lastRaportView = null;
            debugError('Błąd ładowania raportu rocznego:', e);
            if (container) {
                container.innerHTML = `<p class="oc-raport-error">Nie udało się wczytać raportu rocznego: ${escapeHtml(e.message || 'nieznany błąd')}</p>`;
            }
        }
    }

    function renderRaportCalendarRows(kalendarz, historiaByDate) {
        const dates = Array.from(new Set([
            ...Object.keys(kalendarz || {}),
            ...Object.keys(historiaByDate),
        ])).sort();

        if (dates.length === 0) {
            return '<tr><td colspan="5">Brak dyżurów w kalendarzu dla wybranego zakresu.</td></tr>';
        }

        return dates.map(dateStr => {
            const dane = kalendarz[dateStr] || {};
            const odwiedziny = historiaByDate[dateStr];
            const chorzyText = odwiedziny && odwiedziny.chorzy && odwiedziny.chorzy.length
                ? odwiedziny.chorzy.join(', ')
                : '—';
            const uwagiText = (dane.uwagi || '').trim() || (odwiedziny && odwiedziny.uwagi ? String(odwiedziny.uwagi).trim() : '');
            return `
                <tr>
                    <td>${escapeHtml(formatDate(dateStr))}</td>
                    <td>${escapeHtml(dane.osobaGlowna || '')}</td>
                    <td>${escapeHtml(dane.pomocnik || '')}</td>
                    <td>${escapeHtml(uwagiText)}</td>
                    <td>${escapeHtml(chorzyText)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderRaport(data, miesiac) {
        const container = document.getElementById('oc-raportContainer');
        if (!container) return;

        const stats = data.statystyki || {};
        const kalendarz = data.kalendarz || {};
        const historia = Array.isArray(data.historia) ? data.historia : [];
        const historiaByDate = {};
        historia.forEach(entry => {
            if (entry && entry.data) {
                historiaByDate[entry.data] = entry;
            }
        });

        const visitCount = Number(stats.lacznaLiczbaOdwiedzinWMiesiacu) || 0;
        const visitedCount = Number(stats.odwiedzeniChorzyWMiesiacu) || 0;
        const yearCount = Number(stats.lacznaLiczbaChorychOdPoczatkuRoku) || 0;
        const szafarzeText = (stats.szafarze || []).filter(Boolean).join(', ') || 'Brak';

        container.innerHTML = `
            <h2>Raport miesięczny — ${escapeHtml(formatRaportMonthName(miesiac))}</h2>
            <div class="oc-raport-stats">
                <h3>Statystyki</h3>
                <ul>
                    <li>Liczba zapisanych odwiedzin w miesiącu: <strong>${visitCount}</strong></li>
                    <li>Odwiedzeni chorzy w miesiącu: <strong>${visitedCount}</strong></li>
                    <li>Łączna liczba odwiedzonych chorych (od początku roku): <strong>${yearCount}</strong></li>
                    <li>Szafarze w tym miesiącu: <strong>${escapeHtml(szafarzeText)}</strong></li>
                </ul>
            </div>
            <div class="oc-raport-kalendarz">
                <h3>Kalendarz odwiedzin</h3>
                <div class="oc-table-container">
                    <table class="oc-table oc-raport-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Osoba Główna</th>
                                <th>Pomocnik</th>
                                <th>Uwagi</th>
                                <th>Odwiedzeni chorzy</th>
                            </tr>
                        </thead>
                        <tbody>${renderRaportCalendarRows(kalendarz, historiaByDate)}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderRaportRoczny(data, rok) {
        const container = document.getElementById('oc-raportContainer');
        if (!container) return;

        const stats = data.statystyki || {};
        const kalendarz = data.kalendarz || {};
        const historia = Array.isArray(data.historia) ? data.historia : [];
        const miesiace = Array.isArray(data.miesiace) ? data.miesiace : [];
        const historiaByDate = {};
        historia.forEach(entry => {
            if (entry && entry.data) {
                historiaByDate[entry.data] = entry;
            }
        });

        const visitCount = Number(stats.lacznaLiczbaOdwiedzinWRoku) || 0;
        const visitedCount = Number(stats.odwiedzeniChorzyWRoku) || 0;
        const szafarzeText = (stats.szafarze || []).filter(Boolean).join(', ') || 'Brak';
        const monthRows = miesiace.map(row => `
            <tr>
                <td>${escapeHtml(formatRaportMonthName(row.miesiac))}</td>
                <td>${Number(row.liczbaOdwiedzin) || 0}</td>
                <td>${Number(row.odwiedzeniChorzy) || 0}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <h2>Raport roczny — ${escapeHtml(String(rok))}</h2>
            <div class="oc-raport-stats">
                <h3>Statystyki</h3>
                <ul>
                    <li>Liczba zapisanych odwiedzin w roku: <strong>${visitCount}</strong></li>
                    <li>Odwiedzeni chorzy w roku: <strong>${visitedCount}</strong></li>
                    <li>Szafarze w tym roku: <strong>${escapeHtml(szafarzeText)}</strong></li>
                </ul>
            </div>
            <div class="oc-raport-miesiace">
                <h3>Zestawienie miesięczne</h3>
                <div class="oc-table-container">
                    <table class="oc-table oc-raport-table">
                        <thead>
                            <tr>
                                <th>Miesiąc</th>
                                <th>Odwiedziny</th>
                                <th>Odwiedzeni chorzy</th>
                            </tr>
                        </thead>
                        <tbody>${monthRows || '<tr><td colspan="3">Brak danych.</td></tr>'}</tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">Cały rok</th>
                                <td>${visitCount}</td>
                                <td>${visitedCount}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div class="oc-raport-kalendarz">
                <h3>Kalendarz odwiedzin</h3>
                <div class="oc-table-container">
                    <table class="oc-table oc-raport-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Osoba Główna</th>
                                <th>Pomocnik</th>
                                <th>Uwagi</th>
                                <th>Odwiedzeni chorzy</th>
                            </tr>
                        </thead>
                        <tbody>${renderRaportCalendarRows(kalendarz, historiaByDate)}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function csvCell(value) {
        const text = String(value ?? '');
        if (/[;"\n\r]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function downloadCsv(filename, rows) {
        const body = rows.map(row => row.map(csvCell).join(';')).join('\r\n');
        const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function buildRaportCsvRows(view) {
        const data = view.data || {};
        const stats = data.statystyki || {};
        const kalendarz = data.kalendarz || {};
        const historia = Array.isArray(data.historia) ? data.historia : [];
        const historiaByDate = {};
        historia.forEach(entry => {
            if (entry && entry.data) {
                historiaByDate[entry.data] = entry;
            }
        });
        const szafarzeText = (stats.szafarze || []).filter(Boolean).join(', ') || 'Brak';
        const rows = [];

        if (view.type === 'rok') {
            rows.push(['Raport', `Roczny ${view.key}`]);
            rows.push(['Liczba odwiedzin', Number(stats.lacznaLiczbaOdwiedzinWRoku) || 0]);
            rows.push(['Odwiedzeni chorzy', Number(stats.odwiedzeniChorzyWRoku) || 0]);
            rows.push(['Szafarze', szafarzeText]);
            rows.push([]);
            rows.push(['Miesiąc', 'Odwiedziny', 'Odwiedzeni chorzy']);
            (data.miesiace || []).forEach(row => {
                rows.push([
                    formatRaportMonthName(row.miesiac),
                    Number(row.liczbaOdwiedzin) || 0,
                    Number(row.odwiedzeniChorzy) || 0,
                ]);
            });
            rows.push([
                'Cały rok',
                Number(stats.lacznaLiczbaOdwiedzinWRoku) || 0,
                Number(stats.odwiedzeniChorzyWRoku) || 0,
            ]);
        } else {
            rows.push(['Raport', `Miesięczny ${formatRaportMonthName(view.key)}`]);
            rows.push(['Liczba odwiedzin', Number(stats.lacznaLiczbaOdwiedzinWMiesiacu) || 0]);
            rows.push(['Odwiedzeni chorzy', Number(stats.odwiedzeniChorzyWMiesiacu) || 0]);
            rows.push(['Odwiedzeni od początku roku', Number(stats.lacznaLiczbaChorychOdPoczatkuRoku) || 0]);
            rows.push(['Szafarze', szafarzeText]);
        }

        rows.push([]);
        rows.push(['Data', 'Osoba główna', 'Pomocnik', 'Odwiedzeni chorzy', 'Uwagi']);
        const dates = Array.from(new Set([
            ...Object.keys(kalendarz),
            ...Object.keys(historiaByDate),
        ])).sort();
        dates.forEach(dateStr => {
            const dane = kalendarz[dateStr] || {};
            const odwiedziny = historiaByDate[dateStr];
            rows.push([
                formatDate(dateStr),
                dane.osobaGlowna || '',
                dane.pomocnik || '',
                odwiedziny && odwiedziny.chorzy ? odwiedziny.chorzy.join(', ') : '',
                dane.uwagi || (odwiedziny && odwiedziny.uwagi) || '',
            ]);
        });
        return rows;
    }

    function exportCurrentRaportCsv() {
        if (!lastRaportView) {
            showMessage('Najpierw wczytaj raport, potem eksportuj CSV.', 'error');
            return;
        }
        const stamp = lastRaportView.type === 'rok'
            ? lastRaportView.key
            : lastRaportView.key;
        downloadCsv(`raport-odwiedziny-${stamp}.csv`, buildRaportCsvRows(lastRaportView));
        showMessage('Pobrano plik CSV.', 'success');
    }

    async function downloadBackup() {
        try {
            const response = await apiCall('/backup');
            if (response.status === 403) {
                showMessage('Kopię zapasową pobiera administrator.', 'error');
                return;
            }
            if (!response.ok) {
                showMessage('Nie udało się pobrać kopii zapasowej.', 'error');
                return;
            }
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const stamp = new Date().toISOString().slice(0, 10);
            link.download = `odwiedziny-chorych-kopia-${stamp}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showMessage('Pobrano kopię zapasową.');
        } catch (e) {
            debugError('Błąd kopii zapasowej:', e);
            showMessage('Nie udało się pobrać kopii zapasowej.', 'error');
        }
    }

    // ==================== UI ====================

    function showLoginScreen() {
        document.getElementById('oc-loginScreen').style.display = 'flex';
        document.getElementById('oc-mainApp').style.display = 'none';
        hideChangePasswordScreen();
        const info = document.getElementById('oc-sessionInfo');
        if (info) info.textContent = '';
        fillLoginSzafarzeSelect();
    }

    function showMainApp() {
        document.getElementById('oc-loginScreen').style.display = 'none';
        document.getElementById('oc-mainApp').style.display = 'block';
        hideChangePasswordScreen();
    }

    function showChangePasswordScreen() {
        document.getElementById('oc-loginScreen').style.display = 'none';
        document.getElementById('oc-mainApp').style.display = 'none';
        const screen = document.getElementById('oc-changePasswordScreen');
        if (screen) screen.style.display = 'flex';
    }

    function hideChangePasswordScreen() {
        const screen = document.getElementById('oc-changePasswordScreen');
        if (screen) screen.style.display = 'none';
    }

    function needsPasswordChange() {
        return !!(currentUser && currentUser.role === 'admin' && currentUser.mustChangePassword);
    }

    function setupTabs() {
        if (setupTabs._bound) {
            return;
        }
        setupTabs._bound = true;

        document.querySelectorAll('.oc-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                if (!tab) {
                    return;
                }
                activateTab(tab);
            });
        });
    }

    function setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('oc-loginForm');
        const loginRoleSelect = document.getElementById('oc-loginRoleSelect');
        const loginSzafarzGroup = document.getElementById('oc-loginSzafarzGroup');
        if (loginRoleSelect && loginSzafarzGroup) {
            loginRoleSelect.addEventListener('change', () => {
                const isSzafarz = loginRoleSelect.value === 'szafarz';
                loginSzafarzGroup.style.display = isSzafarz ? 'block' : 'none';
            });
        }
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('oc-passwordInput').value;
                const errorEl = document.getElementById('oc-loginError');
                const role = document.getElementById('oc-loginRoleSelect')?.value || 'admin';

                try {
                    if (role === 'admin') {
                        await login({ username: 'admin', password });
                    } else {
                        const sid = parseInt(document.getElementById('oc-loginSzafarzSelect')?.value || '', 10);
                        if (!sid) {
                            throw new Error('Wybierz szafarza z listy.');
                        }
                        await login({ szafarzId: sid, password });
                    }
                    errorEl.style.display = 'none';
                    if (needsPasswordChange()) {
                        showChangePasswordScreen();
                    } else {
                        await initApp();
                    }
                } catch (error) {
                    errorEl.textContent = error.message || 'Nieprawidłowe hasło';
                    errorEl.style.display = 'block';
                }
            });
        }

        const changePasswordForm = document.getElementById('oc-changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorEl = document.getElementById('oc-changePasswordError');
                const newPassword = document.getElementById('oc-newAdminPassword')?.value || '';
                const confirmPassword = document.getElementById('oc-confirmAdminPassword')?.value || '';
                try {
                    const response = await apiCall('/auth/change-password', {
                        method: 'POST',
                        body: JSON.stringify({ newPassword, confirmPassword }),
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Nie udało się zmienić hasła.');
                    }
                    if (data.user) {
                        currentUser = data.user;
                    } else if (currentUser) {
                        currentUser.mustChangePassword = false;
                    }
                    if (errorEl) errorEl.style.display = 'none';
                    await initApp();
                } catch (error) {
                    if (errorEl) {
                        errorEl.textContent = error.message || 'Nie udało się zmienić hasła.';
                        errorEl.style.display = 'block';
                    }
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
                syncYearSelectsToCurrent();
                await Promise.all([
                    loadKalendarz(),
                    loadHistoriaForYear(currentYear),
                    loadAdwent(),
                ]);
                renderKalendarz();
                syncAdwentTabForYear();
            });
        }

        // Rok adwent select
        const rokAdwentSelect = document.getElementById('oc-wybierzRokAdwent');
        if (rokAdwentSelect) {
            rokAdwentSelect.addEventListener('change', async (e) => {
                currentYear = e.target.value;
                syncYearSelectsToCurrent();
                await loadAdwent();
                syncAdwentTabForYear();
                if (adwentOpen) {
                    renderAdwent();
                }
            });
        }

        const miesiacSelect = document.getElementById('oc-wybierzMiesiac');
        if (miesiacSelect) {
            miesiacSelect.addEventListener('change', () => {
                loadCurrentRaport();
            });
        }

        const rokRaportSelect = document.getElementById('oc-wybierzRokRaport');
        if (rokRaportSelect) {
            rokRaportSelect.addEventListener('change', () => {
                loadCurrentRaport();
            });
        }

        // Dodaj szafarza
        const dodajSzafarzaBtn = document.getElementById('oc-dodajSzafarzaBtn');
        if (dodajSzafarzaBtn) {
            dodajSzafarzaBtn.addEventListener('click', addSzafarz);
        }
        document.getElementById('oc-zapiszSzafarzeBtn')?.addEventListener('click', saveSzafarze);

        // Dodaj chorego
        const dodajChoregoBtn = document.getElementById('oc-dodajChoregoBtn');
        if (dodajChoregoBtn) {
            dodajChoregoBtn.addEventListener('click', addChory);
        }
        document.getElementById('oc-zapiszChorzyBtn')?.addEventListener('click', saveChorzy);

        // Adwent w pasku Kalendarza: jedyna dezaktywacja (ukrycie zakładki w menu); włączenie gdy zakładki jeszcze nie ma
        const adwentBtn = document.getElementById('oc-adwent-btn');
        if (adwentBtn) {
            adwentBtn.addEventListener('click', onToolbarAdwentClick);
        }

        const mojeDyzuryBtn = document.getElementById('oc-mojeDyzuryBtn');
        if (mojeDyzuryBtn) {
            mojeDyzuryBtn.addEventListener('click', toggleMyDutiesFilter);
        }

        if (window.matchMedia) {
            const calendarLayoutMq = window.matchMedia('(max-width: 768px)');
            const onCalendarLayoutChange = () => {
                const tbody = document.getElementById('oc-tabelaKalendarzBody');
                if (!tbody || !tbody.children.length) {
                    return;
                }
                renderKalendarz({ skipScroll: true });
            };
            if (typeof calendarLayoutMq.addEventListener === 'function') {
                calendarLayoutMq.addEventListener('change', onCalendarLayoutChange);
            } else if (typeof calendarLayoutMq.addListener === 'function') {
                calendarLayoutMq.addListener(onCalendarLayoutChange);
            }
        }

        // Modal raportu odwiedzin
        const modalClose = document.querySelector('.oc-raport-close');
        const modalCancel = document.querySelector('.oc-raport-cancel');
        const modalSave = document.getElementById('oc-raportZapiszBtn');
        const modalRevert = document.getElementById('oc-raportPrzywrocBtn');

        if (modalClose) modalClose.addEventListener('click', closeVisitModal);
        if (modalCancel) modalCancel.addEventListener('click', closeVisitModal);
        if (modalSave) modalSave.addEventListener('click', saveVisit);
        if (modalRevert) modalRevert.addEventListener('click', revertVisitToPlanned);

        // Print buttons
        document.getElementById('oc-print-btn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujSzafarzeBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujChorzyBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujAdwentBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-drukujRaportBtn')?.addEventListener('click', () => window.print());
        document.getElementById('oc-eksportujCSVBtn')?.addEventListener('click', exportCurrentRaportCsv);
        document.getElementById('oc-eksportujPDFBtn')?.addEventListener('click', () => {
            showMessage('W oknie drukowania wybierz „Zapisz jako PDF”.', 'success');
            window.print();
        });
        document.getElementById('oc-backupBtn')?.addEventListener('click', downloadBackup);

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

    function applyNextDutyStylesIfPresent() {
        const nextDutyRow = document.querySelector('.next-duty-row');
        if (nextDutyRow) {
            applyNextDutyRowStyles(nextDutyRow);
        }
    }

    function scheduleNextDutyStyleRefreshes() {
        [100, 500].forEach(delayMs => {
            setTimeout(() => {
                applyNextDutyStylesIfPresent();
            }, delayMs);
        });

        window.addEventListener('load', () => {
            setTimeout(() => {
                applyNextDutyStylesIfPresent();
            }, 300);
        });
    }

    async function initApp() {
        showMainApp();
        setupTabs();

        // Ustaw currentYear na wartość z selecta (jeśli istnieje)
        fillYearSelects();
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
            loadAdwent(),
        ]);

        applyRoleUI();
        syncAdwentTabForYear();

        // Renderuj
        renderSzafarze();
        renderChorzy();
        renderKalendarz();
        scheduleNextDutyStyleRefreshes();

        fillRaportYearSelect();
        fillRaportMonthSelect();
        loadCurrentRaport();
        
        // Przycisk wylogowania jest teraz w menu przycisków
    }

    async function init() {
        setupEventListeners();
        await fillLoginSzafarzeSelect();

        const isLoggedIn = await checkAuth();
        if (isLoggedIn) {
            if (needsPasswordChange()) {
                showChangePasswordScreen();
            } else {
                await initApp();
            }
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

            let nextSibling = ocContainer.nextElementSibling;
            while (nextSibling) {
                nextSibling.style.display = 'none';
                nextSibling = nextSibling.nextElementSibling;
            }
        }

        document.querySelectorAll('footer, .site-footer, .wp-block-template-part[data-area="footer"]').forEach(el => {
            if (!el.closest('#oc-app, .oc-container')) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            }
        });
    }
    
    function startWordPressHeaderHider() {
        setTimeout(() => {
            hideWordPressHeader();
        }, 100);
        window.addEventListener('load', () => {
            hideWordPressHeader();
        });

        // Ukryj header również po zmianach w DOM (jeśli WordPress dynamicznie dodaje elementy)
        const observer = new MutationObserver(() => {
            hideWordPressHeader();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            startWordPressHeaderHider();
        });
    } else {
        init();
        startWordPressHeaderHider();
    }

})();
