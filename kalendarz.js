// Funkcjonalność związana z kalendarzem
import { pobierzWszystkieDaty, pobierzNazweSwieta, czySwietoNakazane } from './swieta.js';
import { drukujZawartosc, zapiszDoPDF } from './utils.js';

// Lista dostępnych osób
const osoby = ["", "A", "B", "C", "D", "E", "F", "G"];

// Generowanie selecta z listą osób
function generujSelect() {
  const select = document.createElement("select");
  osoby.forEach(osoba => {
    const option = document.createElement("option");
    option.value = osoba;
    option.textContent = osoba === "" ? "(brak)" : osoba;
    select.appendChild(option);
  });
  return select.outerHTML;
}

// Generowanie kalendarza
export function generujKalendarz() {
  const tabela = document.querySelector("#tabelaKalendarz tbody");
  tabela.innerHTML = "";

  // Pobierz wszystkie daty i posortuj
  const datyPosortowane = pobierzWszystkieDaty();

  datyPosortowane.forEach(dateStr => {
    const nazwa = pobierzNazweSwieta(dateStr);
    const tr = document.createElement("tr");
    if (czySwietoNakazane(dateStr)) tr.classList.add("swieto");

    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${nazwa}</td>
      <td>${generujSelect()}</td>
      <td>${generujSelect()}</td>
      <td contenteditable="true"></td>
    `;
    tabela.appendChild(tr);
  });
}

// Drukowanie kalendarza
export function drukujKalendarz() {
  drukujZawartosc('kalendarz');
}

// Eksport kalendarza do PDF
export function zapiszKalendarzDoPDF() {
  zapiszDoPDF('kalendarz', 'kalendarz.pdf');
} 