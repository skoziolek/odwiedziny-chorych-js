// Funkcje pomocnicze dla wszystkich modułów

// Funkcja do drukowania zawartości
export function drukujZawartosc(elementId) {
  const printContent = document.getElementById(elementId).innerHTML;
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = printContent;
  window.print();
  document.body.innerHTML = originalContent;
}

// Funkcja do eksportu do PDF
export function zapiszDoPDF(elementId, nazwaPliku) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const elementHTML = document.getElementById(elementId);
  
  doc.html(elementHTML, {
    callback: function (doc) {
      doc.save(nazwaPliku);
    },
    x: 10,
    y: 10
  });
} 