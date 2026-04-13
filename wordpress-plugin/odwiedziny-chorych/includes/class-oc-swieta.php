<?php
/**
 * Klasa do obsługi świąt nakazanych i niedziel liturgicznych
 * 
 * @package OdwiedzinyChorych
 */

if (!defined('ABSPATH')) {
    exit;
}

class OC_Swieta {
    
    /**
     * Święta nakazane (stałe daty)
     */
    private static $swieta_nakazane = array(
        '2025-01-01' => 'Świętej Bożej Rodzicielki Maryi',
        '2025-01-06' => 'Objawienie Pańskie (Trzech Króli)',
        '2025-04-20' => 'Niedziela Zmartwychwstania Pańskiego',
        '2025-04-21' => 'Poniedziałek Wielkanocny',
        '2025-06-08' => 'Uroczystość Zesłania Ducha Świętego',
        '2025-06-19' => 'Boże Ciało',
        '2025-08-15' => 'Wniebowzięcie NMP',
        '2025-11-01' => 'Uroczystość Wszystkich Świętych',
        '2025-12-25' => 'Boże Narodzenie',
        '2025-12-26' => 'Drugi Dzień Bożego Narodzenia',
        
        '2026-01-01' => 'Świętej Bożej Rodzicielki Maryi',
        '2026-01-06' => 'Objawienie Pańskie (Trzech Króli)',
        '2026-04-05' => 'Niedziela Zmartwychwstania Pańskiego',
        '2026-04-06' => 'Poniedziałek Wielkanocny',
        '2026-05-24' => 'Uroczystość Zesłania Ducha Świętego',
        '2026-06-04' => 'Boże Ciało',
        '2026-08-15' => 'Wniebowzięcie NMP',
        '2026-11-01' => 'Uroczystość Wszystkich Świętych',
        '2026-12-25' => 'Boże Narodzenie',
        '2026-12-26' => 'Drugi Dzień Bożego Narodzenia',
    );
    
    /**
     * Niedziele liturgiczne
     */
    private static $niedziele_liturgiczne = array(
        '2025-01-05' => 'I Niedziela po Narodzeniu Pańskim',
        '2025-01-12' => 'Niedziela Chrztu Pańskiego',
        '2025-01-19' => 'II Niedziela zwykła',
        '2025-01-26' => 'III Niedziela zwykła',
        '2025-02-02' => 'IV Niedziela zwykła',
        '2025-02-09' => 'V Niedziela zwykła',
        '2025-02-16' => 'VI Niedziela zwykła',
        '2025-02-23' => 'VII Niedziela zwykła',
        '2025-03-02' => 'VIII Niedziela zwykła',
        '2025-03-09' => 'I Niedziela Wielkiego Postu',
        '2025-03-16' => 'II Niedziela Wielkiego Postu',
        '2025-03-23' => 'III Niedziela Wielkiego Postu',
        '2025-03-30' => 'IV Niedziela Wielkiego Postu',
        '2025-04-06' => 'V Niedziela Wielkiego Postu',
        '2025-04-13' => 'Niedziela Palmowa',
        '2025-04-27' => 'II Niedziela Wielkanocna (Miłosierdzia Bożego)',
        '2025-05-04' => 'III Niedziela Wielkanocna',
        '2025-05-11' => 'IV Niedziela Wielkanocna',
        '2025-05-18' => 'V Niedziela Wielkanocna',
        '2025-05-25' => 'VI Niedziela Wielkanocna',
        '2025-06-01' => 'Uroczystość Wniebowstąpienia Pańskiego',
        '2025-06-15' => 'X Niedziela zwykła',
        '2025-06-22' => 'XI Niedziela zwykła',
        '2025-06-29' => 'Uroczystość Świętych Apostołów Piotra i Pawła',
        '2025-07-06' => 'XII Niedziela zwykła',
        '2025-07-13' => 'XIII Niedziela zwykła',
        '2025-07-20' => 'XIV Niedziela zwykła',
        '2025-07-27' => 'XV Niedziela zwykła',
        '2025-08-03' => 'XVI Niedziela zwykła',
        '2025-08-10' => 'XVII Niedziela zwykła',
        '2025-08-17' => 'XVIII Niedziela zwykła',
        '2025-08-24' => 'XIX Niedziela zwykła',
        '2025-08-31' => 'XX Niedziela zwykła',
        '2025-09-07' => 'XXI Niedziela zwykła',
        '2025-09-14' => 'XXII Niedziela zwykła',
        '2025-09-21' => 'XXIII Niedziela zwykła',
        '2025-09-28' => 'XXIV Niedziela zwykła',
        '2025-10-05' => 'XXV Niedziela zwykła',
        '2025-10-12' => 'XXVI Niedziela zwykła',
        '2025-10-19' => 'XXVII Niedziela zwykła',
        '2025-10-26' => 'XXVIII Niedziela zwykła',
        '2025-11-02' => 'XXIX Niedziela zwykła',
        '2025-11-09' => 'XXX Niedziela zwykła',
        '2025-11-16' => 'XXXI Niedziela zwykła',
        '2025-11-23' => 'Uroczystość Jezusa Chrystusa Króla Wszechświata',
        '2025-11-30' => 'I Niedziela Adwentu',
        '2025-12-07' => 'II Niedziela Adwentu',
        '2025-12-14' => 'III Niedziela Adwentu',
        '2025-12-21' => 'IV Niedziela Adwentu',
        '2025-12-28' => 'Święto Świętej Rodziny Jezusa, Maryi i Józefa',
    );
    
    /**
     * Sprawdź czy to święto nakazane
     */
    public static function is_swieto_nakazane($date) {
        // Sprawdź w predefiniowanych
        if (isset(self::$swieta_nakazane[$date])) {
            return true;
        }
        
        // Generuj dla innych lat
        $year = (int) substr($date, 0, 4);
        $swieta = self::generate_swieta_for_year($year);
        
        return isset($swieta[$date]);
    }
    
    /**
     * Pobierz nazwę święta/niedzieli
     */
    public static function get_name($date) {
        // Sprawdź święta nakazane
        if (isset(self::$swieta_nakazane[$date])) {
            return self::$swieta_nakazane[$date];
        }
        
        // Sprawdź niedziele liturgiczne
        if (isset(self::$niedziele_liturgiczne[$date])) {
            return self::$niedziele_liturgiczne[$date];
        }
        
        // Generuj dla innych lat
        $year = (int) substr($date, 0, 4);
        
        if ($year !== 2025) {
            $swieta = self::generate_swieta_for_year($year);
            if (isset($swieta[$date])) {
                return $swieta[$date];
            }
            
            $niedziele = self::generate_niedziele_for_year($year);
            if (isset($niedziele[$date])) {
                return $niedziele[$date];
            }
        }
        
        return 'Niedziela';
    }
    
    /**
     * Oblicz datę Wielkanocy (algorytm Gaussa)
     */
    public static function calculate_easter($year) {
        $a = $year % 19;
        $b = floor($year / 100);
        $c = $year % 100;
        $d = floor($b / 4);
        $e = $b % 4;
        $f = floor(($b + 8) / 25);
        $g = floor(($b - $f + 1) / 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = floor($c / 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = floor(($a + 11 * $h + 22 * $l) / 451);
        $month = floor(($h + $l - 7 * $m + 114) / 31);
        $day = (($h + $l - 7 * $m + 114) % 31) + 1;
        
        return new DateTime("$year-$month-$day");
    }
    
    /**
     * Generuj święta nakazane dla roku
     */
    public static function generate_swieta_for_year($year) {
        $swieta = array();
        
        // Stałe święta
        $swieta["$year-01-01"] = 'Świętej Bożej Rodzicielki Maryi';
        $swieta["$year-01-06"] = 'Objawienie Pańskie (Trzech Króli)';
        $swieta["$year-08-15"] = 'Wniebowzięcie NMP';
        $swieta["$year-11-01"] = 'Uroczystość Wszystkich Świętych';
        $swieta["$year-12-25"] = 'Boże Narodzenie';
        $swieta["$year-12-26"] = 'Drugi Dzień Bożego Narodzenia';
        
        // Święta ruchome
        $easter = self::calculate_easter($year);
        
        $swieta[$easter->format('Y-m-d')] = 'Niedziela Zmartwychwstania Pańskiego';
        
        $easter_monday = clone $easter;
        $easter_monday->modify('+1 day');
        $swieta[$easter_monday->format('Y-m-d')] = 'Poniedziałek Wielkanocny';
        
        $pentecost = clone $easter;
        $pentecost->modify('+49 days');
        $swieta[$pentecost->format('Y-m-d')] = 'Uroczystość Zesłania Ducha Świętego';
        
        $corpus_christi = clone $easter;
        $corpus_christi->modify('+60 days');
        $swieta[$corpus_christi->format('Y-m-d')] = 'Boże Ciało';
        
        return $swieta;
    }
    
    /**
     * Generuj niedziele liturgiczne dla roku
     */
    public static function generate_niedziele_for_year($year) {
        $niedziele = array();
        
        $easter = self::calculate_easter($year);
        
        // Pierwsza niedziela Adwentu (4 niedziele przed Bożym Narodzeniem)
        $christmas = new DateTime("$year-12-25");
        $advent_start = clone $christmas;
        $advent_start->modify('last sunday');
        $advent_start->modify('-3 weeks');
        
        // Generuj niedziele...
        // (Uproszczona wersja - w pełnej implementacji trzeba uwzględnić cały rok liturgiczny)
        
        return $niedziele;
    }
    
    /**
     * Pobierz wszystkie święta i niedziele dla roku
     */
    public static function get_all_for_year($year) {
        if ($year == 2025) {
            return array_merge(self::$swieta_nakazane, self::$niedziele_liturgiczne);
        }
        
        $swieta = self::generate_swieta_for_year($year);
        $niedziele = self::generate_niedziele_for_year($year);
        
        return array_merge($swieta, $niedziele);
    }
    
    /**
     * Konwertuj liczbę na cyfrę rzymską
     */
    private static function to_roman($num) {
        $map = array(
            'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9,
            'V' => 5, 'IV' => 4, 'I' => 1
        );
        
        $result = '';
        foreach ($map as $roman => $value) {
            while ($num >= $value) {
                $result .= $roman;
                $num -= $value;
            }
        }
        
        return $result;
    }
}



