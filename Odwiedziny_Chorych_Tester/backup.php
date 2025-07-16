<?php
header('Content-Type: application/json; charset=utf-8');

$folderDocelowy = __DIR__ . '/backups';
if (!file_exists($folderDocelowy)) {
    if (!mkdir($folderDocelowy, 0777, true)) {
        echo json_encode(['success' => false, 'error' => 'Nie można utworzyć folderu backups.']);
        exit;
    }
}

$pliki = glob(__DIR__ . '/*.json');
$data = date('Y-m-d_His');
$wyniki = [];

foreach ($pliki as $plik) {
    $nazwa = basename($plik, '.json');
    $nowaNazwa = $nazwa . '_' . $data . '.json';
    $sciezkaDocelowa = $folderDocelowy . '/' . $nowaNazwa;
    if (copy($plik, $sciezkaDocelowa)) {
        $wyniki[] = $nowaNazwa;
    }
}

if (count($wyniki) > 0) {
    echo json_encode(['success' => true, 'files' => $wyniki]);
} else {
    echo json_encode(['success' => false, 'error' => 'Nie znaleziono plików do backupu lub błąd kopiowania.']);
} 