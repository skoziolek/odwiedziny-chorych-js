// Funkcjonalność związana z zarządzaniem szafarzami
import { drukujZawartosc } from './utils.js';
import { debounce } from './utils.js';
import { fetchWithAuth } from './utils.js';

const API_URL = 'api.php?plik=szafarze';
let debounceTimer;
let szafarzeData = [];

// Wczytuje dane szafarzy z serwera i buduje tabelę
export async function wczytajSzafarzy() {
  try {
    const response = await fetchWithAuth('api.php?plik=szafarze');
    if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);
    const dane = await response.json();

    const tabela = document.querySelector("#tabelaSzafarzyBody");
    tabela.innerHTML = '';

    if (dane.length === 0) {
      dodajWierszSzafarzy(false);
    } else {
      dane.forEach((szafarz, index) => {
        const nowyWiersz = document.createElement("tr");
        nowyWiersz.innerHTML = `
          <td contenteditable="true">${szafarz.imieNazwisko || ''}</td>
          <td contenteditable="true">${szafarz.telefon || ''}</td>
          <td contenteditable="true">${szafarz.email || ''}</td>
          <td contenteditable="true">${szafarz.uwagi || ''}</td>
          <td>
            <button onclick="usunWierszSzafarzy(this)" class="uni-btn">Usuń</button>
          </td>
        `;
        tabela.appendChild(nowyWiersz);
      });
    }
  } catch (error) {
    console.error('Nie udało się wczytać danych szafarzy:', error);
    alert('Wystąpił błąd podczas wczytywania danych szafarzy.');
  }
}

// Zbiera dane z tabeli i wysyła je na serwer
async function zapiszSzafarzy() {
  const tabela = document.querySelector("#tabelaSzafarzyBody");
  const wiersze = tabela.querySelectorAll("tr");
  const daneDoZapisu = [];

  wiersze.forEach(wiersz => {
    const komorki = wiersz.querySelectorAll("td");
    if (komorki.length < 4) return;

    const imieNazwisko = komorki[0].textContent.trim();
    if (!imieNazwisko) return; // Nie zapisuj pustych wierszy

    daneDoZapisu.push({
      imieNazwisko: imieNazwisko,
      telefon: komorki[1].textContent.trim(),
      email: komorki[2].textContent.trim(),
      uwagi: komorki[3].textContent.trim(),
    });
  });

  try {
    const response = await fetchWithAuth('api.php?plik=szafarze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daneDoZapisu),
    });
    if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);

  } catch (error) {
    console.error('Nie udało się zapisać danych szafarzy:', error);
    alert('Wystąpił błąd podczas zapisywania danych szafarzy.');
  }
}

// Funkcja opóźniająca zapis (debounce)
function debounceZapisz() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(zapiszSzafarzy, 700);
}

// Dodaje nowy, pusty wiersz do tabeli
export function dodajWierszSzafarzy(zapisz = true) {
  const tabela = document.querySelector("#tabelaSzafarzyBody");
  const nowyWiersz = document.createElement("tr");
  nowyWiersz.innerHTML = `
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td>
      <button onclick="usunWierszSzafarzy(this)" class="uni-btn">Usuń</button>
    </td>
  `;
  tabela.appendChild(nowyWiersz);
  if (zapisz) zapiszSzafarzy();
}

// Usuwa wiersz z tabeli
window.usunWierszSzafarzy = function(button) {
  if (confirm('Czy na pewno chcesz usunąć tego szafarza?')) {
    button.closest('tr').remove();
    zapiszSzafarzy();
  }
};

// Drukowanie listy szafarzy
export function drukujListeSzafarzy() {
  drukujZawartosc('szafarze');
}

// Inicjalizacja nasłuchu na zmiany w tabeli w celu autozapisu
export function inicjalizujObslugeSzafarzy() {
  const tabela = document.querySelector("#tabelaSzafarzyBody");
  if (tabela) {
    tabela.addEventListener('input', debounceZapisz);
    tabela.addEventListener('focusout', (event) => {
        if (event.target.hasAttribute('contenteditable')) {
            debounceZapisz();
        }
    });
  }
} 