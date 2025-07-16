const swietaNakazane = {
    "2025-01-01": "Świętej Bożej Rodzicielki Maryi",
    "2025-01-06": "Objawienie Pańskie (Trzech Króli)",
    "2025-02-02": "Ofiarowanie Pańskie (Matki Bożej Gromnicznej)",
    "2025-04-20": "Niedziela Zmartwychwstania Pańskiego",
    "2025-05-08": "Niedziela Zesłania Ducha Świętego",
    "2025-06-19": "Boże Ciało",
    "2025-08-15": "Wniebowzięcie NMP",
    "2025-11-01": "Uroczystość Wszystkich Świętych",
    "2025-12-25": "Boże Narodzenie",
    "2025-12-26": "Drugi Dzień Bożego Narodzenia"
};

// Rzeczywisty kalendarz liturgiczny niedziel na 2025 rok
const niedzieleLiturgiczne = {
    "2025-01-05": "II Niedziela po Narodzeniu Pańskim",
    "2025-01-12": "Niedziela Chrztu Pańskiego",
    "2025-01-19": "II Niedziela zwykła",
    "2025-01-26": "III Niedziela zwykła",
    "2025-02-09": "V Niedziela zwykła",
    "2025-02-16": "VI Niedziela zwykła",
    "2025-02-23": "VII Niedziela zwykła",
    "2025-03-02": "VIII Niedziela zwykła",
    "2025-03-09": "I Niedziela Wielkiego Postu",
    "2025-03-16": "II Niedziela Wielkiego Postu",
    "2025-03-23": "III Niedziela Wielkiego Postu",
    "2025-03-30": "IV Niedziela Wielkiego Postu",
    "2025-04-06": "V Niedziela Wielkiego Postu",
    "2025-04-13": "Niedziela Palmowa",
    // 
    "2025-04-27": "II Niedziela Wielkanocna (Miłosierdzia Bożego)",
    "2025-05-04": "III Niedziela Wielkanocna",
    "2025-05-11": "IV Niedziela Wielkanocna",
    "2025-05-18": "V Niedziela Wielkanocna",
    "2025-05-25": "VI Niedziela Wielkanocna",
    "2025-06-01": "Uroczystość Wniebowstąpienia Pańskiego",
    "2025-06-08": "Uroczystość Zesłania Ducha Świętego",
    "2025-06-15": "XI Niedziela zwykła",
    "2025-06-22": "XII Niedziela zwykła",
    "2025-06-29": "XIII Niedziela zwykła",
    "2025-07-06": "XIV Niedziela zwykła",
    "2025-07-13": "XV Niedziela zwykła",
    "2025-07-20": "XVI Niedziela zwykła",
    "2025-07-27": "XVII Niedziela zwykła",
    "2025-08-03": "XVIII Niedziela zwykła",
    "2025-08-10": "XIX Niedziela zwykła",
    "2025-08-17": "XX Niedziela zwykła",
    "2025-08-24": "XXI Niedziela zwykła",
    "2025-08-31": "XXII Niedziela zwykła",
    "2025-09-07": "XXIII Niedziela zwykła",
    "2025-09-14": "XXIV Niedziela zwykła",
    "2025-09-21": "XXV Niedziela zwykła",
    "2025-09-28": "XXVI Niedziela zwykła",
    "2025-10-05": "XXVII Niedziela zwykła",
    "2025-10-12": "XXVIII Niedziela zwykła",
    "2025-10-19": "XXIX Niedziela zwykła",
    "2025-10-26": "XXX Niedziela zwykła",
    "2025-11-02": "XXXI Niedziela zwykła (Wspomnienie Wszystkich Wiernych Zmarłych)",
    "2025-11-09": "XXXII Niedziela zwykła",
    "2025-11-16": "XXXIII Niedziela zwykła",
    "2025-11-23": "Uroczystość Jezusa Chrystusa, Króla Wszechświata",
    "2025-11-30": "I Niedziela Adwentu",
    "2025-12-07": "II Niedziela Adwentu",
    "2025-12-14": "III Niedziela Adwentu",
    "2025-12-21": "IV Niedziela Adwentu",
    "2025-12-28": "Święto Świętej Rodziny Jezusa, Maryi i Józefa"
};

// Funkcja konwertująca cyfry arabskie na rzymskie
function naRzymskie(num) {
    const rzymskie = [
        { wartosc: 50, symbol: 'L' },
        { wartosc: 40, symbol: 'XL' },
        { wartosc: 10, symbol: 'X' },
        { wartosc: 9, symbol: 'IX' },
        { wartosc: 5, symbol: 'V' },
        { wartosc: 4, symbol: 'IV' },
        { wartosc: 1, symbol: 'I' }
    ];
    
    let wynik = '';
    for (let i = 0; i < rzymskie.length; i++) {
        while (num >= rzymskie[i].wartosc) {
            wynik += rzymskie[i].symbol;
            num -= rzymskie[i].wartosc;
        }
    }
    return wynik;
}

// --- UNIWERSALNY GENERATOR KALENDARZA LITURGICZNEGO ---

// Funkcja wyznaczająca datę Wielkanocy (algorytm Gaussa)
function wyznaczWielkanoc(rok) {
    let a = rok % 19;
    let b = Math.floor(rok / 100);
    let c = rok % 100;
    let d = Math.floor(b / 4);
    let e = b % 4;
    let f = Math.floor((b + 8) / 25);
    let g = Math.floor((b - f + 1) / 3);
    let h = (19 * a + b - d - g + 15) % 30;
    let i = Math.floor(c / 4);
    let k = c % 4;
    let l = (32 + 2 * e + 2 * i - h - k) % 7;
    let m = Math.floor((a + 11 * h + 22 * l) / 451);
    let miesiac = Math.floor((h + l - 7 * m + 114) / 31);
    let dzien = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(rok, miesiac - 1, dzien);
}

// Funkcja generująca kalendarz liturgiczny niedziel na dany rok
function generujKalendarzLiturgiczny(rok) {
    const niedziele = {};
    const wielkanoc = wyznaczWielkanoc(rok);
    const adwentStart = (() => {
        // Adwent zaczyna się w niedzielę najbliższą 30 listopada (włącznie)
        let d = new Date(rok, 10, 30); // 30 listopada
        while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
        return d;
    })();
    const bozeNarodzenie = new Date(rok, 11, 25);
    const koniecRoku = new Date(rok, 11, 31);

    // Pomocnicze liczniki
    let zwyklaPrzed = 2;
    let wielkiPost = 0;
    let wielkanocny = 0;
    let zwyklaPo = 0;
    let adwent = 0;

    // Znajdź pierwszą niedzielę roku
    let current = new Date(rok, 0, 1);
    while (current.getDay() !== 0) current.setDate(current.getDate() + 1);

    while (current <= koniecRoku) {
        const iso = current.toISOString().slice(0, 10);

        if (current < new Date(rok, 0, 13)) {
            // Okres Bożego Narodzenia
            if (current.getMonth() === 0 && current.getDate() < 13) {
                if (iso === `${rok}-01-05` || iso === `${rok}-01-06` || iso === `${rok}-01-07`) {
                    niedziele[iso] = "II Niedziela po Narodzeniu Pańskim";
                } else if (iso === `${rok}-01-12` || iso === `${rok}-01-13`) {
                    niedziele[iso] = "Niedziela Chrztu Pańskiego";
                }
            }
        } else if (current < new Date(wielkanoc.getTime() - 48 * 24 * 60 * 60 * 1000)) {
            // Okres zwykły przed Wielkim Postem
            niedziele[iso] = `${naRzymskie(zwyklaPrzed++)} Niedziela zwykła`;
        } else if (current < new Date(wielkanoc.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            // Wielki Post
            niedziele[iso] = `${naRzymskie(++wielkiPost)} Niedziela Wielkiego Postu`;
            if (wielkiPost === 6) niedziele[iso] = "Niedziela Palmowa";
        } else if (current.getTime() === wielkanoc.getTime()) {
            niedziele[iso] = "Niedziela Zmartwychwstania Pańskiego";
        } else if (current > wielkanoc && current < new Date(wielkanoc.getTime() + 49 * 24 * 60 * 60 * 1000)) {
            // Okres Wielkanocny
            niedziele[iso] = `${naRzymskie(++wielkanocny)} Niedziela Wielkanocna`;
        } else if (current < adwentStart) {
            // Okres zwykły po Wielkanocy
            niedziele[iso] = `${naRzymskie(++zwyklaPo + 6)} Niedziela zwykła`;
        } else if (current >= adwentStart && current < bozeNarodzenie) {
            // Adwent
            niedziele[iso] = `${naRzymskie(++adwent)} Niedziela Adwentu`;
        } else if (current >= bozeNarodzenie && current <= koniecRoku) {
            // Okres Bożego Narodzenia (po 25 grudnia)
            niedziele[iso] = `Święto Świętej Rodziny Jezusa, Maryi i Józefa`;
        }
        current.setDate(current.getDate() + 7);
    }
    return niedziele;
}

// Przykład użycia:
// const niedziele2025 = generujKalendarzLiturgiczny(2025);


// Funkcje pomocnicze do zarządzania świętami

// Dodaje nowe święto nakazane
function dodajSwietoNakazane(data, nazwa) {
    swietaNakazane[data] = nazwa;
}

// Dodaje nową niedzielę liturgiczną
function dodajNiedzieleLiturgiczna(data, nazwa) {
    niedzieleLiturgiczne[data] = nazwa;
}

// Usuwa święto nakazane
function usunSwietoNakazane(data) {
    delete swietaNakazane[data];
}

// Usuwa niedzielę liturgiczną
function usunNiedzieleLiturgiczna(data) {
    delete niedzieleLiturgiczne[data];
}

// Sprawdza czy dana data jest świętem nakazanym
function czySwietoNakazane(data) {
    return data in swietaNakazane;
}

// Sprawdza czy dana data jest niedzielą liturgiczną
function czyNiedzielaLiturgiczna(data) {
    return data in niedzieleLiturgiczne;
}

// Zwraca nazwę święta dla danej daty
function pobierzNazweSwieta(data) {
    if (czySwietoNakazane(data) && czyNiedzielaLiturgiczna(data)) {
        return `${niedzieleLiturgiczne[data]} / ${swietaNakazane[data]}`;
    }
    return swietaNakazane[data] || niedzieleLiturgiczne[data] || "";
}

// Zwraca wszystkie daty świąt w formie posortowanej tablicy
function pobierzWszystkieDaty() {
    const wszystkieDaty = new Set([
        ...Object.keys(swietaNakazane),
        ...Object.keys(niedzieleLiturgiczne)
    ]);
    return Array.from(wszystkieDaty).sort();
}

// Eksportuje dane świąt do formatu JSON
function eksportujDaneSwiat() {
    return JSON.stringify({
        swietaNakazane,
        niedzieleLiturgiczne
    }, null, 2);
}

// Importuje dane świąt z formatu JSON
function importujDaneSwiat(jsonDane) {
    const dane = JSON.parse(jsonDane);
    Object.assign(swietaNakazane, dane.swietaNakazane);
    Object.assign(niedzieleLiturgiczne, dane.niedzieleLiturgiczne);
}

// Eksport funkcji jako moduły ES6
export {
    czySwietoNakazane,
    czyNiedzielaLiturgiczna,
    pobierzNazweSwieta,
    pobierzWszystkieDaty,
    eksportujDaneSwiat,
    importujDaneSwiat,
    dodajSwietoNakazane,
    dodajNiedzieleLiturgiczna,
    usunSwietoNakazane,
    usunNiedzieleLiturgiczna,
    generujKalendarzLiturgiczny
};

// Test eksportu
 