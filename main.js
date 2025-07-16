import { generujKalendarz, drukujKalendarz, inicjalizujObslugeKalendarza, resetujPrzypisaniaDyzurow, zmienRokKalendarza, automatyczniePrzypiszDyzurow } from './kalendarz.js';
import { wczytajChorych, dodajWierszChorych, drukujListeChorych, aktualizujKolorWiersza, inicjalizujObslugeChorych } from './chorzy.js';
import { wczytajSzafarzy, dodajWierszSzafarzy, drukujListeSzafarzy, inicjalizujObslugeSzafarzy } from './szafarze.js';
import { pobierzRaportMiesieczny, wyswietlRaportMiesieczny, drukujRaportMiesieczny, dodajOdwiedziny } from './historia.js';
import { fetchWithAuth } from './utils.js';

// Udostępnienie funkcji globalnie, aby były dostępne z HTML (np. onclick)
window.dodajWierszChorych = dodajWierszChorych;
window.dodajWierszSzafarzy = dodajWierszSzafarzy;
window.drukujListeChorych = drukujListeChorych;
window.drukujListeSzafarzy = drukujListeSzafarzy;
window.drukujKalendarz = drukujKalendarz;
window.generujKalendarz = generujKalendarz;
window.aktualizujKolorWiersza = aktualizujKolorWiersza;
window.resetujPrzypisaniaDyzurow = resetujPrzypisaniaDyzurow;
window.dodajOdwiedziny = dodajOdwiedziny;

window.generujRaportMiesieczny = async function() {
  const miesiac = document.getElementById('wybierzMiesiac').value;
  const raport = await pobierzRaportMiesieczny(miesiac);
  const html = wyswietlRaportMiesieczny(raport);
  const container = document.getElementById('raportContainer');
  container.innerHTML = html;
};

window.drukujRaportMiesieczny = async function() {
  const miesiac = document.getElementById('wybierzMiesiac').value;
  const raport = await pobierzRaportMiesieczny(miesiac);
  drukujRaportMiesieczny(raport);
};

window.resetujStatusyOdwiedzin = async function() {
  if (!confirm('Czy na pewno chcesz zresetować wszystkie statusy odwiedzin?')) return;
  try {
    const resp = await fetch('historia.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resetuj_statusy_odwiedzin' })
    });
    const wynik = await resp.json();
    if (wynik.success) {
      alert('Statusy odwiedzin zostały zresetowane!');
      await generujKalendarz();
    } else {
      alert('Błąd podczas resetowania statusów!');
    }
  } catch (e) {
    alert('Błąd sieci podczas resetowania statusów!');
  }
};

window.migrujDaneDoSzyfrowania = async function() {
  if (!confirm('Czy na pewno chcesz zaszyfrować wszystkie istniejące dane? Ta operacja jest nieodwracalna!')) return;
  try {
    const [chorzy, szafarze, historia] = await Promise.all([
      fetch('api.php?plik=chorzy').then(r => r.json()),
      fetch('api.php?plik=szafarze').then(r => r.json()),
      fetch('api.php?plik=historia').then(r => r.json())
    ]);
    let daneDoZaszyfrowania = [];
    if (!chorzy.encrypted && !chorzy.iv) {
      daneDoZaszyfrowania.push(['chorzy', chorzy]);
    }
    if (!szafarze.encrypted && !szafarze.iv) {
      daneDoZaszyfrowania.push(['szafarze', szafarze]);
    }
    if (!historia.encrypted && !historia.iv) {
      daneDoZaszyfrowania.push(['historia', historia]);
    }
    if (daneDoZaszyfrowania.length === 0) {
      alert('Wszystkie dane są już zaszyfrowane!');
      return;
    }
    for (const [plik, dane] of daneDoZaszyfrowania) {
      try {
        const response = await fetch(`api.php?plik=${plik}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dane)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Błąd przy szyfrowaniu ${plik}:`, response.status, errorText);
          throw new Error(`Błąd ${response.status} przy szyfrowaniu ${plik}: ${errorText}`);
        }
      } catch (error) {
        console.error(`Błąd przy szyfrowaniu ${plik}:`, error);
        throw error;
      }
    }
    alert(`Dane zostały pomyślnie zaszyfrowane! Zaszyfrowano ${daneDoZaszyfrowania.length} plików.`);
    location.reload();
  } catch (error) {
    console.error('Błąd podczas migracji:', error);
    alert('Błąd podczas szyfrowania danych: ' + error.message);
  }
};

window.generujDaneTestowe = async function() {
  if (!confirm('Czy na pewno chcesz wygenerować dane testowe? To nadpisze wszystkie obecne dane!')) return;
  try {
    const response = await fetch('api.php?plik=kalendarz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generuj_dane_testowe' })
    });
    const wynik = await response.json();
    if (wynik.success) {
      alert('Dane testowe zostały wygenerowane!');
      await generujKalendarz();
      await wczytajChorych();
      await wczytajSzafarzy();
    } else {
      alert('Błąd podczas generowania danych testowych: ' + (wynik.error || 'Nieznany błąd'));
    }
  } catch (error) {
    console.error('Błąd podczas generowania danych testowych:', error);
    alert('Błąd sieci podczas generowania danych testowych!');
  }
};

window.wyczyscDaneTestowe = async function() {
  if (!confirm('Czy na pewno chcesz wyczyścić wszystkie dane testowe? Ta operacja jest nieodwracalna!')) return;
  try {
    const response = await fetch('api.php?plik=kalendarz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'wyczyść_dane_testowe' })
    });
    const wynik = await response.json();
    if (wynik.success) {
      alert('Dane testowe zostały wyczyszczone!');
      await generujKalendarz();
      await wczytajChorych();
      await wczytajSzafarzy();
    } else {
      alert('Błąd podczas czyszczenia danych testowych: ' + (wynik.error || 'Nieznany błąd'));
    }
  } catch (error) {
    console.error('Błąd podczas czyszczenia danych testowych:', error);
    alert('Błąd sieci podczas czyszczenia danych testowych!');
  }
};

window.utworzNowyRok = async function() {
  if (!confirm('Czy na pewno chcesz utworzyć nowy rok? To wygeneruje kalendarz na kolejny rok na podstawie obecnego.')) {
    return;
  }
  
  try {
    // Pobierz aktualny rok z dropdown
    const aktualnyRok = document.getElementById('wybierzRok').value;
    const nowyRok = (parseInt(aktualnyRok) + 1).toString();
    
    // Pobierz dane z aktualnego roku
    const response = await fetchWithAuth(`api.php?plik=kalendarz&rok=${aktualnyRok}`);
    if (!response.ok) throw new Error('Błąd wczytywania danych aktualnego roku');
    const daneAktualnegoRoku = await response.json();
    
    // Znajdź ostatnie przypisanie z poprzedniego roku
    let ostatniSzafarz = null;
    let ostatniIndeks = 0;
    
    if (Object.keys(daneAktualnegoRoku).length > 0) {
      // Sortuj daty i znajdź ostatnie przypisanie
      const datyPosortowane = Object.keys(daneAktualnegoRoku).sort();
      const ostatniaData = datyPosortowane[datyPosortowane.length - 1];
      const ostatniePrzypisanie = daneAktualnegoRoku[ostatniaData];
      
      if (ostatniePrzypisanie && ostatniePrzypisanie.osobaGlowna) {
        ostatniSzafarz = ostatniePrzypisanie.osobaGlowna;
        // Znajdź indeks tego szafarza w liście
        const listaSzafarzy = [" ", "Tomasz", "pan Andrzej", "Piotr", "Dawid", "Mateusz", "Damian", "Sebastian"];
        ostatniIndeks = listaSzafarzy.indexOf(ostatniSzafarz);
        if (ostatniIndeks === -1) ostatniIndeks = 0;
      }
    }
    
    // Wygeneruj nowe przypisania dla nowego roku, zaczynając od następnej osoby
    const nowePrzypisania = automatyczniePrzypiszDyzurow(nowyRok, ostatniIndeks + 1);
    
    // Zapisz nowy rok
    const body = { action: 'zapisz_kalendarz', dane: nowePrzypisania };
    const saveResponse = await fetchWithAuth(`api.php?plik=kalendarz&rok=${nowyRok}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    if (!saveResponse.ok) throw new Error(`Błąd zapisu nowego roku: ${saveResponse.statusText}`);
    
    // Dodaj nowy rok do dropdown
    const rokSelect = document.getElementById('wybierzRok');
    if (rokSelect) {
      const option = document.createElement('option');
      option.value = nowyRok;
      option.textContent = nowyRok;
      rokSelect.appendChild(option);
      rokSelect.value = nowyRok;
    }
    
    // Przełącz na nowy rok
    await generujKalendarz(nowyRok);
    
    alert(`Nowy rok ${nowyRok} został utworzony i załadowany!`);
    
  } catch (error) {
    console.error('Błąd podczas tworzenia nowego roku:', error);
    alert('Wystąpił błąd podczas tworzenia nowego roku: ' + error.message);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const kalendarzButtons = document.getElementById('kalendarz-buttons');
  if (kalendarzButtons) {
    // Przycisk Drukuj
    const drukujBtn = document.createElement('button');
    drukujBtn.textContent = 'Drukuj';
    drukujBtn.className = 'uni-btn';
    drukujBtn.onclick = window.drukujKalendarz;
    kalendarzButtons.appendChild(drukujBtn);

    // Przycisk Generuj dane testowe
    const generujTestBtn = document.createElement('button');
    generujTestBtn.textContent = 'Generuj dane testowe';
    generujTestBtn.className = 'uni-btn';
    generujTestBtn.style.backgroundColor = '#ff9800';
    generujTestBtn.onclick = window.generujDaneTestowe;
    kalendarzButtons.appendChild(generujTestBtn);

    // Przycisk Wyczyść dane testowe
    const wyczyscTestBtn = document.createElement('button');
    wyczyscTestBtn.textContent = 'Wyczyść dane testowe';
    wyczyscTestBtn.className = 'uni-btn';
    wyczyscTestBtn.style.backgroundColor = '#f44336';
    wyczyscTestBtn.onclick = window.wyczyscDaneTestowe;
    kalendarzButtons.appendChild(wyczyscTestBtn);

    // Przycisk Utwórz nowy rok
    const nowyRokBtn = document.createElement('button');
    nowyRokBtn.textContent = 'Utwórz nowy rok';
    nowyRokBtn.className = 'uni-btn';
    nowyRokBtn.style.backgroundColor = '#2196f3';
    nowyRokBtn.style.color = '#fff';
    nowyRokBtn.onclick = window.utworzNowyRok;
    kalendarzButtons.appendChild(nowyRokBtn);

    // Przycisk Resetuj przypisania dyżurów
    const resetujDyzurowBtn = document.createElement('button');
    resetujDyzurowBtn.textContent = 'Resetuj przypisania dyżurów';
    resetujDyzurowBtn.className = 'uni-btn';
    resetujDyzurowBtn.style.backgroundColor = '#4caf50';
    resetujDyzurowBtn.style.color = '#fff';
    resetujDyzurowBtn.onclick = window.resetujPrzypisaniaDyzurow;
    kalendarzButtons.appendChild(resetujDyzurowBtn);
  }
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      buttons.forEach(btn => btn.classList.remove('active'));
      contents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(tab).classList.add('active');
    });
  });
  await Promise.all([
    wczytajSzafarzy(),
    wczytajChorych()
  ]);
  await generujKalendarz();
  let tabelaKalendarz = document.getElementById('tabelaKalendarzBody');
  inicjalizujObslugeChorych();
  inicjalizujObslugeSzafarzy();
  inicjalizujObslugeKalendarza();
  
  // Obsługa zmiany roku w dropdown
  const rokSelect = document.getElementById('wybierzRok');
  if (rokSelect) {
    rokSelect.addEventListener('change', zmienRokKalendarza);
  }