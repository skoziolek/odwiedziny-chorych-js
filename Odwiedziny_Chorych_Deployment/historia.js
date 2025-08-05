// Funkcjonalność związana z historią odwiedzin i raportami
import { fetchWithAuth } from './utils.js';

// Dodawanie odwiedzin do historii
export async function dodajOdwiedziny(data, chory_id, chory_nazwa, szafarz, status = 'wykonane') {
    try {
        const response = await fetchWithAuth('historia.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'dodaj_odwiedziny',
                data: data,
                chory_id: chory_id,
                chory_nazwa: chory_nazwa,
                szafarz: szafarz,
                status: status
            })
        });

        if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.statusText}`);
        }

        const wynik = await response.json();
        
        if (wynik.success) {
        
            return true;
        } else {
            console.error('Błąd podczas dodawania odwiedzin:', wynik.error);
            return false;
        }
    } catch (error) {
        console.error('Nie udało się dodać odwiedzin:', error);
        return false;
    }
}

// Pobieranie raportu miesięcznego
export async function pobierzRaportMiesieczny(miesiac = null) {
    try {
        if (!miesiac) {
            miesiac = new Date().toISOString().slice(0, 7); // Format YYYY-MM
        }
        
        const response = await fetchWithAuth(`historia.php?action=pobierz_raport_miesieczny&miesiac=${miesiac}`);
        
        if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.statusText}`);
        }

        const raport = await response.json();
        return raport;
    } catch (error) {
        console.error('Nie udało się pobrać raportu miesięcznego:', error);
        return null;
    }
}

// Wyświetlanie raportu miesięcznego
export function wyswietlRaportMiesieczny(raport) {
    if (!raport) {
        alert('Nie udało się pobrać raportu');
        return;
    }
    
    const miesiacNazwa = new Date(raport.miesiac + '-01').toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'long' 
    });
    
    let html = `
        <div class="raport-miesieczny">
            <h2>Raport miesięczny - ${miesiacNazwa}</h2>
            <div class="statystyki">
                <div class="statystyka">
                    <span class="liczba">${raport.ilosc_wizyt_miesiac}</span>
                    <span class="opis">Liczba wszystkich wizyt w tym miesiącu</span>
                </div>
                <div class="statystyka">
                    <span class="liczba">${raport.ilosc_wizyt_rok}</span>
                    <span class="opis">Liczba wszystkich wizyt od początku roku</span>
                </div>
            </div>
    `;
    
    if (raport.lista_chorych_rok && raport.lista_chorych_rok.length > 0) {
        html += `
            <div class="lista-chorych">
                <h3>Lista chorych odwiedzonych od początku roku:</h3>
                <ul>
                    ${raport.lista_chorych_rok.map(chory => `<li>${chory}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    html += '</div>';
    
    return html;
}

// Funkcja do drukowania raportu
export function drukujRaportMiesieczny(raport) {
    const html = wyswietlRaportMiesieczny(raport);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Raport miesięczny odwiedzin</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                .raport-miesieczny { max-width: 800px; margin: 0 auto; }
                .statystyki { display: flex; gap: 20px; margin: 20px 0; }
                .statystyka { text-align: center; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
                .liczba { display: block; font-size: 2em; font-weight: bold; color: #4CAF50; }
                .opis { display: block; margin-top: 5px; color: #666; }
                .lista-chorych { margin-top: 20px; }
                .lista-chorych ul { list-style-type: none; padding: 0; }
                .lista-chorych li { padding: 5px 0; border-bottom: 1px solid #eee; }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
} 