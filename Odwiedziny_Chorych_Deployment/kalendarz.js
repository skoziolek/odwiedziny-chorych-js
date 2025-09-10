// Funkcjonalność związana z kalendarzem
import { pobierzWszystkieDaty, pobierzNazweSwieta, czySwietoNakazane } from './swieta.js';
import { drukujZawartosc, fetchWithAuth } from './utils.js';

const API_URL = 'api.php?plik=kalendarz';
let debounceTimer;

// Statyczna lista osób na wypadek, gdyby dynamiczne wczytywanie zawiodło
const OSOBY_DOMYSLNE = [" ", "Tomasz", "pan Andrzej", "Piotr", "Dawid", "Mateusz", "Damian", "Sebastian"];
let listaSzafarzy = [...OSOBY_DOMYSLNE]; // Domyślnie użyj statycznej listy

let kalendarzData = []; // Przechowuje dane kalendarza

// --- FUNKCJE ZAPISU I ODCZYTU Z SERWERA ---

async function zapiszKalendarz() {

  
  const tabela = document.querySelector("#tabelaKalendarzBody");
  const wiersze = tabela.querySelectorAll("tr");
  const daneDoZapisu = {};

  wiersze.forEach(wiersz => {
    const komorki = wiersz.querySelectorAll("td");
    const data = komorki[0].textContent.trim();
    if (!data) return;

    const [selectGlowna, selectPomocnik] = wiersz.querySelectorAll("select");
    const uwagi = komorki[4].textContent.trim();

    // Zapisuj tylko, jeśli coś zostało wybrane lub wpisane
    if (selectGlowna.value.trim() || selectPomocnik.value.trim() || uwagi) {
        const noweDane = {
          osobaGlowna: selectGlowna.value,
          pomocnik: selectPomocnik.value,
          uwagi: uwagi,
        };
        
        daneDoZapisu[data] = noweDane;
    }
  });

  // Dodaj pole action
  const body = { action: 'zapisz_kalendarz', dane: daneDoZapisu };

  try {
    const response = await fetchWithAuth('api.php?plik=kalendarz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);

    
  } catch (error) {
    console.error('Nie udało się zapisać danych kalendarza:', error);
    alert('Wystąpił błąd podczas zapisywania danych kalendarza.');
  }
}

function debounceZapisz() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(zapiszKalendarz, 700);
}

// --- GŁÓWNE FUNKCJE MODUŁU ---

// Pobiera listę szafarzy z ich tabeli, aby użyć jej w listach rozwijanych
function aktualizujListeSzafarzy() {
    const tabelaSzafarzy = document.querySelector("#tabelaSzafarzyBody");
    if (!tabelaSzafarzy) return;
    
    const szafarzeZTabeli = [];
    const wiersze = tabelaSzafarzy.querySelectorAll("tr");
    
    wiersze.forEach(wiersz => {
        const komorka = wiersz.querySelector("td:nth-child(1)");
        if (komorka) {
            const imieNazwisko = komorka.textContent.trim();
            if (imieNazwisko) {
                szafarzeZTabeli.push(imieNazwisko);
            }
        }
    });

    // Jeśli znaleziono szafarzy, użyj ich. Jeśli nie, wróć do domyślnej listy.
    if (szafarzeZTabeli.length > 0) {
        listaSzafarzy = [" ", ...szafarzeZTabeli];
    } else {
        listaSzafarzy = [...OSOBY_DOMYSLNE];
    }
}

function generujSelect(wybranaOsoba = '') {
  let html = '<select>';
  listaSzafarzy.forEach(osoba => {
    if (osoba === wybranaOsoba) {
      html += `<option value="${osoba}" selected>${osoba.trim() === "" ? "(brak)" : osoba}</option>`;
    } else {
      html += `<option value="${osoba}">${osoba.trim() === "" ? "(brak)" : osoba}</option>`;
    }
  });
  html += '</select>';
  return html;
}

export async function generujKalendarz() {

  
  listaSzafarzy = [...OSOBY_DOMYSLNE];

  let zapisaneDane = {};
  try {
    const response = await fetchWithAuth('api.php?plik=kalendarz');
    if (!response.ok) throw new Error('Błąd wczytywania danych kalendarza');
    zapisaneDane = await response.json();
  
  } catch (error) {
    console.error(error);
    alert('Nie udało się wczytać zapisanych dyżurów.');
  }

  const datyPosortowane = pobierzWszystkieDaty();


  const czyKalendarzPusty = Object.keys(zapisaneDane).length === 0 || 
                            datyPosortowane.every(data => !zapisaneDane[data] || 
                            (!zapisaneDane[data].osobaGlowna && !zapisaneDane[data].pomocnik));

    if (czyKalendarzPusty) {
    zapisaneDane = automatyczniePrzypiszDyzurow();
    try {
      const body = { action: 'zapisz_kalendarz', dane: zapisaneDane };
      const response = await fetchWithAuth('api.php?plik=kalendarz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);

    } catch (error) {
      console.error('Nie udało się zapisać automatycznych przypisań:', error);
    }
  }

  const tabela = document.querySelector("#tabelaKalendarzBody");
  if (!tabela) {
    console.error("Nie znaleziono tabeli kalendarza!");
    return;
  }
  
  tabela.innerHTML = "";

  // Pobierz status odwiedzin dla wszystkich dat (równolegle)
  const statusyOdwiedzin = {};
  await Promise.all(datyPosortowane.map(async dateStr => {
    try {
      const resp = await fetchWithAuth(`historia.php?action=pobierz_raport_dzienny&data=${dateStr}`);
      if (resp.ok) {
        const raport = await resp.json();
        // Jeśli jest przynajmniej jeden wpis ze statusem 'odwiedzone', uznaj dzień za odwiedzony
        statusyOdwiedzin[dateStr] = (raport.odwiedziny || []).some(o => o.status === 'odwiedzone') ? 'odwiedzone' : 'zaplanowane';
      } else {
        statusyOdwiedzin[dateStr] = 'zaplanowane';
      }
    } catch {
      statusyOdwiedzin[dateStr] = 'zaplanowane';
    }
  }));



  let liczbaWierszy = 0;
  datyPosortowane.forEach(dateStr => {
    const daneDnia = zapisaneDane[dateStr] || {};
    const tr = document.createElement("tr");
    if (czySwietoNakazane(dateStr)) tr.classList.add("swieto");

    let status = statusyOdwiedzin[dateStr] || 'zaplanowane';
    let buttonText = status === 'odwiedzone' ? 'Odwiedzone' : 'Zaplanowane';
    let buttonClass = status === 'odwiedzone' ? 'visit-button' : 'planned-button';
    let buttonDisabled = '';

    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${pobierzNazweSwieta(dateStr)}</td>
      <td>${generujSelect(daneDnia.osobaGlowna || '')}</td>
      <td>${generujSelect(daneDnia.pomocnik || '')}</td>
      <td contenteditable="true">${daneDnia.uwagi || ''}</td>
      <td>
        <button onclick="otworzModalOdwiedziny('${dateStr}', { tylkoTak: true })" class="${buttonClass}" data-status="${status}" ${buttonDisabled}>${buttonText}</button>
      </td>
    `;
    tabela.appendChild(tr);
    liczbaWierszy++;
  });


}

export function drukujKalendarz() {
  drukujZawartosc('kalendarz');
}

export function inicjalizujObslugeKalendarza() {
  const tabela = document.querySelector("#tabelaKalendarzBody");
  if (tabela) {
    tabela.addEventListener('change', debounceZapisz);
    tabela.addEventListener('input', debounceZapisz);
    tabela.addEventListener('focusout', (event) => {
        if (event.target.hasAttribute('contenteditable')) {
            debounceZapisz();
        }
    });
  }
}

function automatyczniePrzypiszDyzurow() {
  const datyPosortowane = pobierzWszystkieDaty();
  const przypisania = {};
  let indeksOsoby = 1; // Zacznij od pierwszej osoby (pomijając pustą opcję)

  datyPosortowane.forEach(data => {
    // Usunięto pomijanie świąt nakazanych - szafarze będą przypisywani także do świąt
    // if (czySwietoNakazane(data)) {
    //   return;
    // }

    // Przypisz osobę główną
    if (indeksOsoby < listaSzafarzy.length) {
      przypisania[data] = {
        osobaGlowna: listaSzafarzy[indeksOsoby],
        pomocnik: '', // Pomocnik pozostaje pusty
        uwagi: ''
      };
      indeksOsoby++;
    } else {
      // Jeśli skończyły się osoby, zacznij od początku
      indeksOsoby = 1;
      przypisania[data] = {
        osobaGlowna: listaSzafarzy[indeksOsoby],
        pomocnik: '',
        uwagi: ''
      };
      indeksOsoby++;
    }
  });

  return przypisania;
}

export async function resetujPrzypisaniaDyzurow() {
  if (!confirm('Czy na pewno chcesz zresetować wszystkie przypisania dyżurów? To usunie wszystkie ręczne zmiany.')) {
    return;
  }

  try {
  
    
    // Wygeneruj nowe automatyczne przypisania
    const nowePrzypisania = automatyczniePrzypiszDyzurow();
    
    // Dodaj pole action
    const body = { action: 'resetuj_kalendarz', dane: nowePrzypisania };
    // Zapisz na serwerze
    const response = await fetchWithAuth('api.php?plik=kalendarz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);
    
    // Odśwież kalendarz
    await generujKalendarz();
    
    alert('Przypisania dyżurów zostały zresetowane i automatycznie przypisane.');
    
  } catch (error) {
    console.error('Błąd podczas resetowania przypisań:', error);
    alert('Wystąpił błąd podczas resetowania przypisań dyżurów.');
  }
} 

// MODAL: Oznaczanie odwiedzonych chorych
window.otworzModalOdwiedziny = async function(data, opcje = {}) {
  try {
    const tylkoTak = opcje.tylkoTak ? '1' : '0';
    const resp = await fetch(`historia.php?action=pobierz_chorych_na_dzien&data=${data}&tylko_tak=${tylkoTak}`);
    if (!resp.ok) {
      throw new Error(`Błąd pobierania chorych: ${resp.status}`);
    }
    const chorzy = await resp.json();
    
    if (!Array.isArray(chorzy) || chorzy.length === 0) {
      alert('Brak chorych w systemie. Dodaj najpierw chorych w zakładce "Dane chorych".');
      return;
    }
    
    const listaDiv = document.getElementById('listaChorychModal');
    listaDiv.innerHTML = chorzy.map(chory =>
      `<label style="display:block;margin-bottom:6px;">
        <input type="checkbox" name="chory" value="${chory.id}" ${chory.status === 'odwiedzone' ? 'checked' : ''}>
        ${chory.imieNazwisko}
      </label>`
    ).join('');
    
    document.getElementById('modalOdwiedziny').style.display = 'flex';
    
    document.getElementById('formOdwiedziny').onsubmit = async function(e) {
      e.preventDefault();
      const odwiedzeni = Array.from(document.querySelectorAll('#listaChorychModal input[type=checkbox]:checked')).map(cb => cb.value);
      
      if (odwiedzeni.length === 0) {
        alert('Zaznacz przynajmniej jednego chorego!');
        return;
      }
      
      try {
        const response = await fetch('historia.php?action=oznacz_odwiedzonych', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: 'oznacz_odwiedzonych', data, odwiedzeni})
        });
        
        if (!response.ok) {
          throw new Error(`Błąd zapisywania: ${response.status}`);
        }
        
        const wynik = await response.json();
        if (wynik.success) {
          alert(`Odwiedziny zostały zarejestrowane! Odwiedzono ${wynik.ilosc_dodanych} chorych.`);
          document.getElementById('modalOdwiedziny').style.display = 'none';
          if (window.generujKalendarz) await window.generujKalendarz();
        } else {
          alert('Błąd podczas zapisywania odwiedzin: ' + (wynik.error || 'Nieznany błąd'));
        }
      } catch (error) {
        console.error('Błąd podczas zapisywania odwiedzin:', error);
        alert('Wystąpił błąd podczas zapisywania odwiedzin: ' + error.message);
      }
    };
  } catch (error) {
    console.error('Błąd podczas otwierania modala:', error);
    alert('Wystąpił błąd podczas ładowania listy chorych: ' + error.message);
  }
};

window.zamknijModalOdwiedziny = function() {
  document.getElementById('modalOdwiedziny').style.display = 'none';
}; 