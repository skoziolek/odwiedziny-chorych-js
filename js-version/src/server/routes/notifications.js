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
  const found = szafarze.find(s => norm(s.imieNazwisko) === target);
  return found && found.email ? String(found.email).trim() : null;
}

async function buildTomorrowReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const year = tomorrow.getFullYear();

  // Kalendarz może być w pliku rocznym lub ogólnym
  const isoKey = toISO(tomorrow);         // np. 2025-02-01
  const dotKey = toLegacyDotFormat(tomorrow); // np. 1.02.2025
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
  const patientsHtml = Array.isArray(patients) && patients.length
    ? `
      <div style="margin-top:16px;padding:12px;background:#f7f7f7;border:1px solid #e3e3e3;border-radius:6px">
        <div style="font-weight:bold;margin-bottom:8px">Aktualna lista chorych do odwiedzenia</div>
        <ul style="margin:0;padding-left:18px">${patients.map(p => {
          const name = (p.imieNazwisko||'').replace(/</g,'&lt;');
          const addr = (p.adres||'').replace(/</g,'&lt;');
          const tel = (p.telefon||'').replace(/</g,'&lt;');
          const uw = (p.uwagi||'').replace(/</g,'&lt;');
          const telPart = tel ? `, tel: <strong>${tel}</strong>` : '';
          const uwPart = uw ? ` — uwagi: <em>${uw}</em>` : '';
          return `<li>${name} — ${addr}${telPart}${uwPart}</li>`;
        }).join('')}</ul>
      </div>
    `
    : '';
  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 12px 0">Przypomnienie o dyżurze - ${dateLabel}</h2>
      <p>Masz zaplanowany dyżur: <strong>${dutyName}</strong> (${role}).</p>
      <p><a href="${link}" target="_blank">Otwórz aplikację</a></p>
      ${patientsHtml}
      <hr>
      <p style="font-size:12px;color:#666">Jeśli nie chcesz otrzymywać e‑maili, skontaktuj się z koordynatorem.</p>
    </div>
  `;
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
  const jobs = await buildTomorrowReminders();
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
    const jobs = await buildTomorrowReminders();
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


