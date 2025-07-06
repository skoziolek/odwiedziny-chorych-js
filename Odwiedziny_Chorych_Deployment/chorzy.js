// Funkcjonalność związana z zarządzaniem listą chorych
import { drukujZawartosc } from './utils.js';
import { debounce } from './utils.js';
import { fetchWithAuth } from './utils.js';

const API_URL = 'api.php?plik=chorzy';
let debounceTimer;
let chorychData = [];

// --- FUNKCJE ZAPISU I ODCZYTU Z SERWERA ---

// Wczytuje dane chorych z serwera i buduje tabelę
export async function wczytajChorych() {
  try {
  
    const response = await fetchWithAuth('api.php?plik=chorzy');
    if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
    let dane = await response.json();

    // Domyślnie status: '' jeśli nie ustawiony
    dane.forEach(chory => {
      if (!('status' in chory)) chory.status = '';
    });

    // Sortowanie: najpierw TAK, potem puste, potem NIE, każda grupa alfabetycznie
    dane = [
      ...dane.filter(c => c.status === 'TAK').sort((a, b) => a.imieNazwisko.localeCompare(b.imieNazwisko)),
      ...dane.filter(c => c.status === '').sort((a, b) => a.imieNazwisko.localeCompare(b.imieNazwisko)),
      ...dane.filter(c => c.status === 'NIE').sort((a, b) => a.imieNazwisko.localeCompare(b.imieNazwisko))
    ];

    const tabela = document.querySelector("#tabelaChorychBody");
    tabela.innerHTML = '';

    if (dane.length === 0) {
      dodajWierszChorych(false);
    } else {
      dane.forEach((chory, index) => {
        const nowyWiersz = document.createElement("tr");
        if (chory.status === 'TAK') nowyWiersz.className = 'chory-tak';
        else if (chory.status === 'NIE') nowyWiersz.className = 'chory-nie';
        else nowyWiersz.className = '';
        nowyWiersz.innerHTML = `
          <td contenteditable="true">${chory.imieNazwisko || ''}</td>
          <td contenteditable="true">${chory.adres || ''}</td>
          <td contenteditable="true">${chory.telefon || ''}</td>
          <td contenteditable="true">${chory.uwagi || ''}</td>
          <td>
            <select class="status-select">
              <option value="" ${!chory.status ? 'selected' : ''}></option>
              <option value="TAK" ${chory.status === 'TAK' ? 'selected' : ''}>TAK</option>
              <option value="NIE" ${chory.status === 'NIE' ? 'selected' : ''}>NIE</option>
            </select>
          </td>
          <td>
            <button onclick="usunWierszChorych(this)" class="uni-btn">Usuń</button>
          </td>
        `;
        tabela.appendChild(nowyWiersz);
      });
    }

    // Nasłuch na zmianę statusu
    tabela.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async function() {
        aktualizujKolorWiersza(this.closest('tr'), false);
        await zapiszChorych();
        await wczytajChorych();
      });
    });
  } catch (error) {
    console.error('Nie udało się wczytać danych chorych:', error);
    alert('Wystąpił błąd podczas wczytywania danych chorych.');
  }
}

// Zbiera dane z tabeli i wysyła je na serwer
async function zapiszChorych() {
  const tabela = document.querySelector("#tabelaChorychBody");
  const wiersze = tabela.querySelectorAll("tr");
  const daneDoZapisu = [];

  wiersze.forEach(wiersz => {
    const komorki = wiersz.querySelectorAll("td");
    if (komorki.length < 5) return;
    const imieNazwisko = komorki[0].textContent.trim();
    const adres = komorki[1].textContent.trim();
    if (!imieNazwisko && !adres) return;
    const select = komorki[4].querySelector('select');
    daneDoZapisu.push({
      imieNazwisko: imieNazwisko,
      adres: adres,
      telefon: komorki[2].textContent.trim(),
      uwagi: komorki[3].textContent.trim(),
      status: select ? select.value : 'TAK',
    });
  });

  try {

    const response = await fetchWithAuth('api.php?plik=chorzy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daneDoZapisu),
    });
    if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);

  } catch (error) {
    console.error('Nie udało się zapisać danych chorych:', error);
    alert('Wystąpił błąd podczas zapisywania danych chorych.');
  }
}

// Funkcja opóźniająca zapis (debounce)
function debounceZapisz() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(zapiszChorych, 700); // Zapis 700ms po ostatniej zmianie
}

// --- GŁÓWNE FUNKCJE MODUŁU ---

// Aktualizuje kolor wiersza i opcjonalnie zapisuje zmiany
export function aktualizujKolorWiersza(wiersz, zapisz = true) {
  if (!wiersz) return;
  const select = wiersz.querySelector('.status-select');
  if (select) {
    if (select.value === 'TAK') wiersz.className = 'chory-tak';
    else if (select.value === 'NIE') wiersz.className = 'chory-nie';
    else wiersz.className = '';
  }
  if (zapisz) debounceZapisz();
}

// Dodaje nowy, pusty wiersz do tabeli
export function dodajWierszChorych(zapisz = true) {
  const tabela = document.querySelector("#tabelaChorychBody");
  const nowyWiersz = document.createElement("tr");
  nowyWiersz.className = '';
  nowyWiersz.innerHTML = `
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td>
      <select class="status-select">
        <option value="" selected></option>
        <option value="TAK">TAK</option>
        <option value="NIE">NIE</option>
      </select>
    </td>
    <td>
      <button onclick="usunWierszChorych(this)" class="uni-btn">Usuń</button>
    </td>
  `;
  tabela.appendChild(nowyWiersz);
  if (zapisz) zapiszChorych();
}

// Usuwa wiersz z tabeli
window.usunWierszChorych = function(button) {
  if (confirm('Czy na pewno chcesz usunąć tego chorego?')) {
    button.closest('tr').remove();
    zapiszChorych();
  }
};

// Drukowanie listy chorych
export function drukujListeChorych() {
  drukujZawartosc('chorzy');
}

// Inicjalizacja nasłuchu na zmiany w tabeli w celu autozapisu
export function inicjalizujObslugeChorych() {
    const tabela = document.querySelector("#tabelaChorychBody");
    if (!tabela) return;

    // Nasłuch na edycję komórek tekstowych
    tabela.addEventListener('input', debounceZapisz);

    // Nasłuch na focusout (gdy użytkownik kończy edycję)
    tabela.addEventListener('focusout', (event) => {
        if (event.target.hasAttribute('contenteditable')) {
            debounceZapisz();
        }
    });
} 