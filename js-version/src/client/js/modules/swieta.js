const swietaNakazane = {
    "2025-01-01": "Świętej Bożej Rodzicielki Maryi",
    "2025-01-06": "Objawienie Pańskie (Trzech Króli)",
    "2025-02-02": "Ofiarowanie Pańskie (Matki Bożej Gromnicznej)",
    "2025-04-20": "Niedziela Zmartwychwstania Pańskiego",
    "2025-04-21": "Poniedziałek Wielkanocny",
    "2025-06-08": "Niedziela Zesłania Ducha Świętego",
    "2025-06-19": "Boże Ciało",
    "2025-08-15": "Wniebowzięcie NMP",
    "2025-11-01": "Uroczystość Wszystkich Świętych",
    "2025-11-02": "Wszystkich Wiernych Zmarłych",
    "2025-12-25": "Boże Narodzenie",
    "2025-12-26": "Drugi Dzień Bożego Narodzenia"
};

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
    "2025-11-02": "XXXI Niedziela zwykła / Wszystkich Wiernych Zmarłych",
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

// Zwraca datę w formacie YYYY-MM-DD
function formatLocalISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Wyznacz Wielkanoc (algorytm Gaussa)
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

// Generuje kalendarz liturgiczny niedziel
function generujKalendarzLiturgiczny(rok) {
    const niedziele = {};
    const wielkanoc = wyznaczWielkanoc(rok);
    const adwentStart = (() => {
        let d = new Date(rok, 10, 30);
        while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
        return d;
    })();
    const bozeNarodzenie = new Date(rok, 11, 25);
    const koniecRoku = new Date(rok, 11, 31);

    let zwyklaPrzed = 2;
    let wielkiPost = 0;
    let wielkanocny = 0;
    let zwyklaPo = 0;
    let adwent = 0;

    let current = new Date(rok, 0, 1);
    while (current.getDay() !== 0) current.setDate(current.getDate() + 1);

    while (current <= koniecRoku) {
        const iso = formatLocalISODate(current);

        if (current < new Date(wielkanoc.getTime() - 48 * 86400000)) {
            niedziele[iso] = `${naRzymskie(zwyklaPrzed++)} Niedziela zwykła`;
        } else if (current < new Date(wielkanoc.getTime() - 7 * 86400000)) {
            niedziele[iso] = `${naRzymskie(++wielkiPost)} Niedziela Wielkiego Postu`;
            if (wielkiPost === 6) niedziele[iso] = "Niedziela Palmowa";
        } else if (current.getTime() === wielkanoc.getTime()) {
            niedziele[iso] = "Niedziela Zmartwychwstania Pańskiego";
        } else if (current > wielkanoc && current < new Date(wielkanoc.getTime() + 49 * 86400000)) {
            niedziele[iso] = `${naRzymskie(++wielkanocny)} Niedziela Wielkanocna`;
        } else if (current < adwentStart) {
            niedziele[iso] = `${naRzymskie(++zwyklaPo + 6)} Niedziela zwykła`;
        } else if (current >= adwentStart && current < bozeNarodzenie) {
            niedziele[iso] = `${naRzymskie(++adwent)} Niedziela Adwentu`;
        } else if (current >= bozeNarodzenie && current <= koniecRoku) {
            niedziele[iso] = `Święto Świętej Rodziny Jezusa, Maryi i Józefa`;
        }

        current.setDate(current.getDate() + 7);
    }
    return niedziele;
}

// Funkcje pomocnicze
function dodajSwietoNakazane(data, nazwa) { swietaNakazane[data] = nazwa; }
function dodajNiedzieleLiturgiczna(data, nazwa) { niedzieleLiturgiczne[data] = nazwa; }
function usunSwietoNakazane(data) { delete swietaNakazane[data]; }
function usunNiedzieleLiturgiczna(data) { delete niedzieleLiturgiczne[data]; }
function czySwietoNakazane(data, rok = null) {
    // Jeśli rok nie jest podany, wyciągnij z daty
    if (!rok) {
        rok = parseInt(data.split('-')[0]);
    }
    
    // Dla roku 2025 użyj statycznych danych
    if (rok === 2025) {
        return data in swietaNakazane;
    }
    
    // Dla innych lat sprawdź czy to święto nakazane
    const nazwa = pobierzNazweSwieta(data, rok);
    return nazwa && !nazwa.includes('Niedziela') && !nazwa.includes('zwykła');
}
function czyNiedzielaLiturgiczna(data) { return data in niedzieleLiturgiczne; }

function pobierzNazweSwieta(data, rok = null) {
    // Jeśli rok nie jest podany, użyj aktualnego roku
    if (!rok) {
        rok = new Date().getFullYear();
    }
    
    if (rok === 2025) {
        // priorytet dla święta nakazanego
        if (czySwietoNakazane(data)) {
            return swietaNakazane[data];
        }
        return niedzieleLiturgiczne[data] || "";
    }

    const kalendarzLiturgiczny = generujKalendarzLiturgiczny(rok);

    const swietaNakazaneRok = {};
    Object.keys(swietaNakazane).forEach(data2025 => {
        const nazwa = swietaNakazane[data2025];
        const nowaData = data2025.replace('2025-', `${rok}-`);
        if (![
            "Niedziela Zmartwychwstania Pańskiego",
            "Poniedziałek Wielkanocny",
            "Niedziela Zesłania Ducha Świętego",
            "Boże Ciało"
        ].includes(nazwa)) {
            swietaNakazaneRok[nowaData] = nazwa;
        }
    });

    const wielkanoc = wyznaczWielkanoc(rok);
    swietaNakazaneRok[formatLocalISODate(wielkanoc)] = "Niedziela Zmartwychwstania Pańskiego";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+1*86400000))] = "Poniedziałek Wielkanocny";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+49*86400000))] = "Niedziela Zesłania Ducha Świętego";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+60*86400000))] = "Boże Ciało";

    const nazwaSwietaNakazanego = swietaNakazaneRok[data];
    const nazwaNiedzieli = kalendarzLiturgiczny[data];
    
    // priorytet dla święta nakazanego
    if (nazwaSwietaNakazanego) return nazwaSwietaNakazanego;
    return nazwaNiedzieli || "";
}

function pobierzWszystkieDaty(rok = null) {
    // Jeśli rok nie jest podany, użyj aktualnego roku
    if (!rok) {
        rok = new Date().getFullYear();
    }
    
    if (rok === 2025) {
        const wszystkieDaty = new Set([...Object.keys(swietaNakazane), ...Object.keys(niedzieleLiturgiczne)]);
        return Array.from(wszystkieDaty).sort();
    }

    const kalendarzLiturgiczny = generujKalendarzLiturgiczny(rok);
    const swietaNakazaneRok = {};
    Object.keys(swietaNakazane).forEach(data2025 => {
        const nazwa = swietaNakazane[data2025];
        const nowaData = data2025.replace('2025-', `${rok}-`);
        if (!["Niedziela Zmartwychwstania Pańskiego","Poniedziałek Wielkanocny","Niedziela Zesłania Ducha Świętego","Boże Ciało"].includes(nazwa)) {
            swietaNakazaneRok[nowaData] = nazwa;
        }
    });

    const wielkanoc = wyznaczWielkanoc(rok);
    swietaNakazaneRok[formatLocalISODate(wielkanoc)] = "Niedziela Zmartwychwstania Pańskiego";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+1*86400000))] = "Poniedziałek Wielkanocny";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+49*86400000))] = "Niedziela Zesłania Ducha Świętego";
    swietaNakazaneRok[formatLocalISODate(new Date(wielkanoc.getTime()+60*86400000))] = "Boże Ciało";

    const wszystkieDaty = new Set([...Object.keys(swietaNakazaneRok), ...Object.keys(kalendarzLiturgiczny)]);
    return Array.from(wszystkieDaty).sort();
}

// Eksport/import
function eksportujDaneSwiat() { return JSON.stringify({swietaNakazane,niedzieleLiturgiczne},null,2); }
function importujDaneSwiat(jsonDane) { const dane = JSON.parse(jsonDane); Object.assign(swietaNakazane,dane.swietaNakazane); Object.assign(niedzieleLiturgiczne,dane.niedzieleLiturgiczne); }

// Test dla 2026
function testRok2026() {
    console.log('=== TEST ROKU 2026 ===');
    const daty2026 = pobierzWszystkieDaty(2026);
    console.log('Liczba dat w 2026:', daty2026.length);
    console.log('Pierwsze 10 dat:', daty2026.slice(0, 10));
    console.log('Ostatnie 10 dat:', daty2026.slice(-10));

    const kluczoweDaty = ['2026-01-01','2026-01-06','2026-02-02','2026-04-05','2026-04-06','2026-05-24','2026-06-04','2026-08-15','2026-11-01','2026-11-02','2026-12-25','2026-12-26'];
    kluczoweDaty.forEach(data => {
        if(daty2026.includes(data)) {
            console.log('✓',data,'-', pobierzNazweSwieta(data,2026));
        } else {
            console.log('✗',data,'- BRAK');
        }
    });
}

// Eksport modułów
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
    generujKalendarzLiturgiczny,
    testRok2026
};
