<?php
session_start();

// Jeśli użytkownik nie jest zalogowany, przekieruj go do strony logowania
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Grafik odwiedzin chorych</title>
  <link rel="stylesheet" href="style.css">
  <script type="module" src="main.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
  <div class="header-container">
    <h1 class="center-title">Grafik odwiedzin chorych</h1>
    <a href="logout.php" class="logout-button">Wyloguj</a>
  </div>
  <div class="tabs">
    <button class="tab-button active" data-tab="kalendarz">📅 Kalendarz</button>
    <button class="tab-button" data-tab="chorzy">🧑‍⚕️ Dane chorych</button>
    <button class="tab-button" data-tab="szafarze">🙋‍♂️ Dane szafarzy</button>
    <button class="tab-button" data-tab="raporty">📊 Raporty</button>
  </div>

  <!-- Zakładka Kalendarz -->
  <div id="kalendarz" class="tab-content active">
    <div class="chorzy-przyciski" id="kalendarz-buttons"></div>
    <div class="rok-wybor" style="margin: 10px 0; display: flex; align-items: center; gap: 10px;">
      <label for="wybierzRok">Wybierz rok:</label>
      <select id="wybierzRok" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
        <option value="2025" selected>2025</option>
      </select>
    </div>
    <table id="tabelaKalendarz" style="border:0 !important; outline:0 !important; box-shadow:none !important; border-radius:0 !important;">
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Nazwa</th>
          <th scope="col">Osoba Główna</th>
          <th scope="col">Pomocnik</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaKalendarzBody">
        <!-- Tutaj będą generowane wiersze kalendarza -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Dane chorych -->
  <div id="chorzy" class="tab-content">
    <div class="chorzy-przyciski">
      <button class="uni-btn" onclick="drukujListeChorych()">Drukuj</button>
      <button class="uni-btn" onclick="dodajWierszChorych()">Dodaj chorego</button>
    </div>
    <table id="tabelaChorych" border="1">
      <thead>
        <tr>
          <th scope="col">Imię i nazwisko</th>
          <th scope="col">Adres</th>
          <th scope="col">Telefon</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Aktualne</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaChorychBody">
        <!-- Tutaj będą generowane wiersze chorych -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Dane szafarzy -->
  <div id="szafarze" class="tab-content">
    <div class="chorzy-przyciski">
      <button class="uni-btn" onclick="drukujListeSzafarzy()">Drukuj</button>
      <button class="uni-btn" onclick="dodajWierszSzafarzy()">Dodaj szafarza</button>
    </div>
    <table id="tabelaSzafarzy" border="1">
      <thead>
        <tr>
          <th scope="col">Imię i nazwisko</th>
          <th scope="col">Telefon</th>
          <th scope="col">Email</th>
          <th scope="col">Uwagi</th>
          <th scope="col">Akcje</th>
        </tr>
      </thead>
      <tbody id="tabelaSzafarzyBody">
        <!-- Tutaj będą generowane wiersze szafarzy -->
      </tbody>
    </table>
  </div>

  <!-- Zakładka Raporty -->
  <div id="raporty" class="tab-content">
    <div class="raporty-row">
      <select id="wybierzMiesiac">
        <option value="2025-01">Styczeń 2025</option>
        <option value="2025-02">Luty 2025</option>
        <option value="2025-03">Marzec 2025</option>
        <option value="2025-04">Kwiecień 2025</option>
        <option value="2025-05">Maj 2025</option>
        <option value="2025-06" selected>Czerwiec 2025</option>
        <option value="2025-07">Lipiec 2025</option>
        <option value="2025-08">Sierpień 2025</option>
        <option value="2025-09">Wrzesień 2025</option>
        <option value="2025-10">Październik 2025</option>
        <option value="2025-11">Listopad 2025</option>
        <option value="2025-12">Grudzień 2025</option>
      </select>
      <div></div>
    </div>
    <div class="raporty-przyciski">
      <button class="uni-btn" onclick="generujRaportMiesieczny()">Generuj raport</button>
      <button class="uni-btn" onclick="drukujRaportMiesieczny()">Drukuj raport</button>
      <button class="uni-btn" onclick="eksportujRaportPDF()">Eksportuj do PDF</button>
      <button class="uni-btn" id="backupBtn">Wykonaj kopię zapasową</button>
    </div>
    <div id="raportContainer">
      <!-- Tutaj będzie wyświetlany raport -->
    </div>
  </div>

  <!-- MODAL: Oznaczanie odwiedzonych chorych -->
  <div id="modalOdwiedziny" class="modal" style="display:none;">
    <div class="modal-content">
      <span class="close" onclick="zamknijModalOdwiedziny()">&times;</span>
      <h3>Oznacz odwiedzonych chorych</h3>
      <form id="formOdwiedziny">
        <div id="listaChorychModal"></div>
        <button type="submit" class="uni-btn">Zapisz</button>
      </form>
    </div>
  </div>

</body>
</html> 