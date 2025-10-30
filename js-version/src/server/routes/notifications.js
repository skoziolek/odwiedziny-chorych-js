const express = require('express');
const router = express.Router();
const { sendEmail, isEmailEnabled } = require('../utils/mailer');
const fs = require('fs-extra');
const path = require('path');
const { decryptData, isEncrypted } = require('../utils/crypto');

const DATA_DIR = path.join(__dirname, '../../data');

async function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!await fs.pathExists(filePath)) {
    return null;
  }
  const data = await fs.readJson(filePath);
  if (isEncrypted(data)) {
    return decryptData(data) || [];
  }
  return data;
}

function toISO(dateObj) {
  return dateObj.toISOString().split('T')[0];
}

function toLegacyDotFormat(dateObj) {
  const d = dateObj.getDate();
  const m = dateObj.getMonth() + 1;
  const y = dateObj.getFullYear();
  return `${d}.${m < 10 ? '0'+m : m}.${y}`;
}

function findSzafarzEmailByName(szafarze, name) {
  if (!name) return null;
  const norm = (s) => String(s || '').trim().toLowerCase();
  const target = norm(name);

  // 1) Próba pełnego dopasowania "Imię Nazwisko"
  let found = szafarze.find(s => norm(s.imieNazwisko) === target);
  if (found && found.email) return String(found.email).trim();

  // 2) Fallback: dopasowanie po pierwszym imieniu (gdy w kalendarzu zapisano samo imię)
  const candidates = szafarze.filter(s => {
    const first = norm((s.imieNazwisko || '').split(' ')[0]);
    return first && first === target;
  });

  if (candidates.length === 1 && candidates[0].email) {
    return String(candidates[0].email).trim();
  }

  // 3) Brak jednoznacznego dopasowania
  return null;
}

async function buildRemindersForDate(targetDate) {
  const dateObj = new Date(targetDate);
  if (isNaN(dateObj)) return [];
  const year = dateObj.getFullYear();

  // Kalendarz może być w pliku rocznym lub ogólnym
  const isoKey = toISO(dateObj);         // np. 2025-02-01
  const dotKey = toLegacyDotFormat(dateObj); // np. 1.02.2025
  const kalendarzYearFile = `kalendarz_${year}.json`;
  const kalendarzData = (await loadJson(kalendarzYearFile)) || (await loadJson('kalendarz.json')) || {};
  const entry = kalendarzData[isoKey] || kalendarzData[dotKey] || null;

  if (!entry) return [];

  const szafarze = (await loadJson('szafarze.json')) || [];

  const recipients = [];
  const baseLink = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const dateLabel = isoKey;
  const dutyName = entry.nazwa || 'Odwiedziny chorych';
  // Lista chorych o statusie "TAK" do dołączenia do maila
  const chorzy = (await loadJson('chorzy.json')) || [];
  const patients = chorzy
    .filter(c => c && c.status === 'TAK')
    .map(c => ({ imieNazwisko: c.imieNazwisko, adres: c.adres, telefon: c.telefon, uwagi: c.uwagi }));

  // osoba główna
  const mainEmail = findSzafarzEmailByName(szafarze, entry.osobaGlowna);
  if (mainEmail) {
    recipients.push({ to: mainEmail, subject: `Przypomnienie: dyżur jutro (${dateLabel})`, html: templateReminder({ dateLabel, dutyName, role: 'główny', link: baseLink, patients }), text: `Przypomnienie o dyżurze jutro (${dateLabel})` });
  }
  // pomocnik
  const helperEmail = findSzafarzEmailByName(szafarze, entry.pomocnik);
  if (helperEmail) {
    recipients.push({ to: helperEmail, subject: `Przypomnienie: dyżur jutro (${dateLabel})`, html: templateReminder({ dateLabel, dutyName, role: 'pomocnik', link: baseLink, patients }), text: `Przypomnienie o dyżurze jutro (${dateLabel})` });
  }

  return recipients;
}

// Proste szablony HTML (MVP)
function templateReminder({ dateLabel, dutyName, role, link, patients = [] }) {
  const tableRows = Array.isArray(patients) && patients.length
    ? patients.map(p => {
        const name = (p.imieNazwisko||'').replace(/</g,'&lt;');
        const addr = (p.adres||'').replace(/</g,'&lt;');
        const tel = (p.telefon||'').replace(/</g,'&lt;');
        const uw = (p.uwagi||'').replace(/</g,'&lt;');
        return `
          <tr>
            <td style="padding:8px;border:1px solid #e6e2d3">${name}</td>
            <td style="padding:8px;border:1px solid #e6e2d3">${addr}</td>
            <td style="padding:8px;border:1px solid #e6e2d3;white-space:nowrap;">${tel || ''}</td>
            <td style="padding:8px;border:1px solid #e6e2d3">${uw || ''}</td>
          </tr>`;
      }).join('')
    : '';

  const patientsTable = tableRows
    ? `
      <div style="margin-top:16px">
        <div style="font-weight:600;margin:0 0 8px 0;color:#5d4a2a">Aktualna lista chorych do odwiedzenia</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#fff;border:1px solid #e6e2d3">
          <thead>
            <tr style="background:#faf6ef;color:#5d4a2a">
              <th align="left" style="padding:10px;border:1px solid #e6e2d3;font-size:13px">Imię i nazwisko</th>
              <th align="left" style="padding:10px;border:1px solid #e6e2d3;font-size:13px">Adres</th>
              <th align="left" style="padding:10px;border:1px solid #e6e2d3;font-size:13px">Telefon</th>
              <th align="left" style="padding:10px;border:1px solid #e6e2d3;font-size:13px">Uwagi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `
    : '';

  return `
  <div style="margin:0;padding:0;background:#f6f3ec">
    <div style="max-width:680px;margin:0 auto;padding:20px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#2c2a28;font-size:14px;line-height:1.5">
      <div style="background:#fff;border:1px solid #e6e2d3;border-radius:8px;padding:20px">
        <h2 style="margin:0 0 8px 0;color:#5d4a2a;font-size:18px">Przypomnienie o dyżurze</h2>
        <div style="margin:0 0 14px 0;color:#7a6a4a;font-size:13px">Data: <strong>${dateLabel}</strong></div>
        <div style="margin:0 0 12px 0">Masz zaplanowany dyżur: <strong>${dutyName}</strong> (<em>${role}</em>).</div>
        <div style="margin:12px 0 18px 0">
          <a href="${link}" target="_blank" style="display:inline-block;background:#bfa16b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600">Otwórz aplikację</a>
        </div>
        ${patientsTable}
        <div style="margin-top:18px;padding-top:12px;border-top:1px solid #eee;color:#817763;font-size:12px">
          Jeśli nie chcesz otrzymywać e‑maili, skontaktuj się z koordynatorem.
        </div>
      </div>
    </div>
  </div>`;
}

function templateChange({ dateLabel, dutyName, changeInfo, link }) {
  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 12px 0">Zmiana w grafiku - ${dateLabel}</h2>
      <p>Dotyczy: <strong>${dutyName}</strong></p>
      <p>${changeInfo}</p>
      <p><a href="${link}" target="_blank">Otwórz aplikację</a></p>
      <hr>
      <p style="font-size:12px;color:#666">Jeśli nie chcesz otrzymywać e‑maili, skontaktuj się z koordynatorem.</p>
    </div>
  `;
}

// Podgląd HTML w przeglądarce
router.get('/preview', async (req, res) => {
  const { type = 'reminder' } = req.query;
  const link = req.query.link || 'http://localhost:3000';
  const dateLabel = req.query.dateLabel || 'jutro (sobota)';
  const dutyName = req.query.dutyName || 'Odwiedziny - Parafia';
  let patients = [];
  try {
    const chorzy = (await loadJson('chorzy.json')) || [];
    patients = chorzy
      .filter(c => c && c.status === 'TAK')
      .map(c => ({ imieNazwisko: c.imieNazwisko, adres: c.adres, telefon: c.telefon, uwagi: c.uwagi }));
  } catch (_) {}
  if (type === 'change') {
    const html = templateChange({ dateLabel, dutyName, changeInfo: 'Zamiana osoby pomocniczej.', link });
    return res.type('html').send(html);
  }
  const html = templateReminder({ dateLabel, dutyName, role: 'główny', link, patients });
  return res.type('html').send(html);
});

// Test wysyłki e‑mail
router.get('/test', async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Parametr ?to= jest wymagany' });
  try {
    // Do testu też dorzuć listę chorych (TAK)
    let patients = [];
    try {
      const chorzy = (await loadJson('chorzy.json')) || [];
      patients = chorzy
        .filter(c => c && c.status === 'TAK')
        .map(c => ({ imieNazwisko: c.imieNazwisko, adres: c.adres, telefon: c.telefon, uwagi: c.uwagi }));
    } catch (_) {}
    const html = templateReminder({ dateLabel: 'jutro', dutyName: 'Dyżur testowy', role: 'główny', link: req.query.link || 'http://localhost:3000', patients });
    const info = await sendEmail({ to, subject: 'Test: przypomnienie o dyżurze', html, text: 'Test przypomnienia o dyżurze' });
    return res.json({ ok: true, info, emailEnabled: isEmailEnabled() });
  } catch (e) {
    console.error('Błąd testu wysyłki:', e);
    return res.status(500).json({ error: 'Błąd wysyłki', message: e.message });
  }
});

async function sendTomorrowReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const jobs = await buildRemindersForDate(tomorrow);
  let sent = 0;
  for (const job of jobs) {
    try {
      await sendEmail(job);
      sent++;
    } catch (e) {
      console.error('Błąd wysyłki przypomnienia:', e);
    }
  }
  return { planned: jobs.length, sent };
}

module.exports = router;
module.exports.sendTomorrowReminders = sendTomorrowReminders;

// Ręczne uruchomienie przypomnień "jutro dyżur"
router.post('/run/reminders', async (req, res) => {
  try {
    const { date } = req.query;
    let targetDate;
    if (date) {
      // Obsłuż zarówno YYYY-MM-DD jak i D.MM.YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        targetDate = new Date(date);
      } else if (/^\d{1,2}\.\d{2}\.\d{4}$/.test(date)) {
        const [d, m, y] = date.split('.');
        targetDate = new Date(parseInt(y,10), parseInt(m,10)-1, parseInt(d,10));
      }
    }
    const now = new Date();
    const fallbackTomorrow = new Date(now);
    fallbackTomorrow.setDate(now.getDate() + 1);
    const jobs = await buildRemindersForDate(targetDate || fallbackTomorrow);
    if (jobs.length === 0) return res.json({ ok: true, sent: 0, note: 'Brak dyżurów na jutro lub brak adresów e‑mail' });
    let sent = 0;
    for (const job of jobs) {
      try {
        await sendEmail(job);
        sent++;
      } catch (e) {
        console.error('Błąd wysyłki przypomnienia:', e);
      }
    }
    return res.json({ ok: true, sent });
  } catch (e) {
    console.error('Błąd uruchomienia reminders:', e);
    return res.status(500).json({ error: 'Błąd uruchomienia reminders', message: e.message });
  }
});


