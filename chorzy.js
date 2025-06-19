// Funkcjonalność związana z zarządzaniem listą chorych
import { drukujZawartosc, zapiszDoPDF } from './utils.js';

// Aktualizacja koloru wiersza w zależności od statusu
export function aktualizujKolorWiersza(selectElement) {
  const tr = selectElement.closest("tr");
  tr.classList.remove("wiersz-tak", "wiersz-nie");
  if (selectElement.value === "TAK") {
    tr.classList.add("wiersz-tak");
  } else if (selectElement.value === "NIE") {
    tr.classList.add("wiersz-nie");
  }
}

// Dodawanie nowego wiersza do tabeli chorych
export function dodajWierszChorych() {
  const tabela = document.querySelector("#tabelaChorzy tbody");
  const wiersze = tabela.querySelectorAll("tr");
  const nowyWiersz = document.createElement("tr");
  nowyWiersz.innerHTML = `
    <td>${wiersze.length + 1}</td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td>
      <select onchange="aktualizujKolorWiersza(this)">
        <option value=""></option>
        <option value="TAK">TAK</option>
        <option value="NIE">NIE</option>
      </select>
    </td>
  `;
  tabela.appendChild(nowyWiersz);
}

// Drukowanie listy chorych
export function drukujListeChorych() {
  drukujZawartosc('chorzy');
}

// Eksport listy chorych do PDF
export function zapiszListeChorychDoPDF() {
  zapiszDoPDF('chorzy', 'lista_chorych.pdf');
} 