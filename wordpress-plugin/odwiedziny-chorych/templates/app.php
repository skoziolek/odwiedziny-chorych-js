<?php
/**
 * Szablon główny aplikacji
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div id="oc-app" class="oc-container">
    <!-- Ekran logowania -->
    <div id="oc-loginScreen" class="oc-login-screen">
        <div class="oc-login-container">
            <div class="oc-login-header">
                <h1>🙏 Odwiedziny Chorych</h1>
                <p>System zarządzania odwiedzinami</p>
            </div>
            <form id="oc-loginForm" class="oc-login-form">
                <div class="oc-form-group">
                    <label for="oc-passwordInput">Hasło:</label>
                    <input type="password" id="oc-passwordInput" name="password" required autocomplete="current-password">
                </div>
                <div id="oc-loginError" class="oc-error" style="display: none;"></div>
                <button type="submit" class="oc-btn oc-btn-primary">Zaloguj się</button>
            </form>
        </div>
    </div>

    <!-- Główna aplikacja -->
    <div id="oc-mainApp" style="display: none;">
        <header class="oc-header">
            <h1>🙏 Odwiedziny Chorych</h1>
            <button id="oc-logoutBtn" class="oc-btn oc-btn-secondary">Wyloguj</button>
        </header>

        <!-- Zakładki -->
        <div class="oc-tabs">
            <button class="oc-tab-button active" data-tab="kalendarz">📅 Kalendarz</button>
            <button class="oc-tab-button" data-tab="adwent" id="oc-adwentTabBtn" style="display: none;">🕯️ Adwent</button>
            <button class="oc-tab-button" data-tab="chorzy">🧑‍⚕️ Dane chorych</button>
            <button class="oc-tab-button" data-tab="szafarze">🙋‍♂️ Dane szafarzy</button>
            <button class="oc-tab-button" data-tab="raporty">📊 Raporty</button>
        </div>

        <!-- Zakładka Kalendarz -->
        <div id="oc-kalendarz" class="oc-tab-content active">
            <div class="oc-buttons" id="oc-kalendarz-buttons">
                <button class="oc-btn" id="oc-print-btn">Drukuj</button>
                <button class="oc-btn" id="oc-create-year-btn">Utwórz nowy rok</button>
                <button class="oc-btn" id="oc-auto-assign-btn">Auto-przypisz szafarzy</button>
                <button class="oc-btn" id="oc-adwent-btn">🕯️ Adwent</button>
            </div>
            <div class="oc-year-select">
                <label for="oc-wybierzRok">Wybierz rok:</label>
                <select id="oc-wybierzRok">
                    <option value="2025" selected>2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                </select>
            </div>
            <div class="oc-table-container">
                <table id="oc-tabelaKalendarz" class="oc-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Nazwa</th>
                            <th>Osoba Główna</th>
                            <th>Pomocnik</th>
                            <th>Uwagi</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="oc-tabelaKalendarzBody">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Zakładka Adwent -->
        <div id="oc-adwent" class="oc-tab-content">
            <div class="oc-buttons" id="oc-adwent-buttons">
                <button class="oc-btn" id="oc-drukujAdwentBtn">Drukuj</button>
            </div>
            <div class="oc-year-select">
                <label for="oc-wybierzRokAdwent">Wybierz rok:</label>
                <select id="oc-wybierzRokAdwent">
                    <option value="2025" selected>2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                </select>
            </div>
            <div class="oc-table-container">
                <table id="oc-tabelaAdwent" class="oc-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Dzień tygodnia</th>
                            <th>Tydzień Adwentu</th>
                            <th>Osoba Główna</th>
                            <th>Pomocnik</th>
                        </tr>
                    </thead>
                    <tbody id="oc-tabelaAdwentBody">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Zakładka Chorzy -->
        <div id="oc-chorzy" class="oc-tab-content">
            <div class="oc-buttons" id="oc-chorzy-buttons">
                <button class="oc-btn" id="oc-drukujChorzyBtn">Drukuj</button>
                <button class="oc-btn oc-btn-success" id="oc-dodajChoregoBtn">+ Dodaj chorego</button>
            </div>
            <div class="oc-table-container">
                <table id="oc-tabelaChorzy" class="oc-table">
                    <thead>
                        <tr>
                            <th>Imię i Nazwisko</th>
                            <th>Adres</th>
                            <th>Telefon</th>
                            <th>Uwagi</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="oc-tabelaChorzyBody">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Zakładka Szafarze -->
        <div id="oc-szafarze" class="oc-tab-content">
            <div class="oc-buttons" id="oc-szafarze-buttons">
                <button class="oc-btn" id="oc-drukujSzafarzeBtn">Drukuj</button>
                <button class="oc-btn oc-btn-success" id="oc-dodajSzafarzaBtn">+ Dodaj szafarza</button>
            </div>
            <div class="oc-table-container">
                <table id="oc-tabelaSzafarze" class="oc-table">
                    <thead>
                        <tr>
                            <th>Imię</th>
                            <th>Nazwisko</th>
                            <th>Adres zamieszkania</th>
                            <th>Adres email</th>
                            <th>Numer telefonu</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="oc-tabelaSzafarzeBody">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Zakładka Raporty -->
        <div id="oc-raporty" class="oc-tab-content">
            <div class="oc-buttons" id="oc-raporty-buttons">
                <button class="oc-btn" id="oc-drukujRaportBtn">Drukuj raport</button>
                <button class="oc-btn" id="oc-eksportujPDFBtn">Eksportuj do PDF</button>
                <button class="oc-btn" id="oc-backupBtn">Wykonaj kopię zapasową</button>
            </div>
            <div class="oc-raport-select">
                <label for="oc-wybierzMiesiac">Wybierz miesiąc:</label>
                <select id="oc-wybierzMiesiac">
                    <option value="2025-01">Styczeń 2025</option>
                    <option value="2025-02">Luty 2025</option>
                    <option value="2025-03">Marzec 2025</option>
                    <option value="2025-04">Kwiecień 2025</option>
                    <option value="2025-05">Maj 2025</option>
                    <option value="2025-06">Czerwiec 2025</option>
                    <option value="2025-07">Lipiec 2025</option>
                    <option value="2025-08">Sierpień 2025</option>
                    <option value="2025-09">Wrzesień 2025</option>
                    <option value="2025-10">Październik 2025</option>
                    <option value="2025-11">Listopad 2025</option>
                    <option value="2025-12">Grudzień 2025</option>
                </select>
            </div>
            <div id="oc-raportContainer" class="oc-raport-container">
                <!-- Raport będzie tutaj generowany -->
            </div>
        </div>
    </div>

    <!-- Modal dla odwiedzin -->
    <div id="oc-modalOdwiedziny" class="oc-modal" style="display: none;">
        <div class="oc-modal-content">
            <div class="oc-modal-header">
                <h2>Zaplanuj odwiedziny</h2>
                <button class="oc-modal-close">&times;</button>
            </div>
            <div class="oc-modal-body">
                <p>Data: <strong id="oc-modalData"></strong></p>
                <div id="oc-modalChorzyList" class="oc-chorzy-list">
                    <!-- Lista chorych do zaznaczenia -->
                </div>
            </div>
            <div class="oc-modal-footer">
                <button class="oc-btn oc-btn-secondary oc-modal-cancel">Anuluj</button>
                <button class="oc-btn oc-btn-primary" id="oc-modalZapiszBtn">Zapisz</button>
            </div>
        </div>
    </div>
</div>

