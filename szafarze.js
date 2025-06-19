// Funkcjonalność związana z zarządzaniem szafarzami
import { drukujZawartosc, zapiszDoPDF } from './utils.js';

// Dodawanie nowego wiersza do tabeli szafarzy
export function dodajWierszSzafarzy() {
  const tabela = document.querySelector("#tabelaSzafarze tbody");
  const wiersze = tabela.querySelectorAll("tr");
  const nowyWiersz = document.createElement("tr");
  nowyWiersz.innerHTML = `
    <td>${wiersze.length + 1}</td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
  `;
  tabela.appendChild(nowyWiersz);
}

// Drukowanie listy szafarzy
export function drukujListeSzafarzy() {
  drukujZawartosc('szafarze');
}

// Eksport listy szafarzy do PDF
export function zapiszListeSzafarzyDoPDF() {
  zapiszDoPDF('szafarze', 'lista_szafarzy.pdf');
} 