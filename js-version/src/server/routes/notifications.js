const express = require('express');
const router = express.Router();
const { sendEmail, isEmailEnabled } = require('../utils/mailer');

// Proste szablony HTML (MVP)
function templateReminder({ dateLabel, dutyName, role, link }) {
  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 12px 0">Przypomnienie o dyżurze - ${dateLabel}</h2>
      <p>Masz zaplanowany dyżur: <strong>${dutyName}</strong> (${role}).</p>
      <p><a href="${link}" target="_blank">Otwórz aplikację</a></p>
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
router.get('/preview', (req, res) => {
  const { type = 'reminder' } = req.query;
  const link = req.query.link || 'http://localhost:3000';
  const dateLabel = req.query.dateLabel || 'jutro (sobota)';
  const dutyName = req.query.dutyName || 'Odwiedziny - Parafia';
  if (type === 'change') {
    const html = templateChange({ dateLabel, dutyName, changeInfo: 'Zamiana osoby pomocniczej.', link });
    return res.type('html').send(html);
  }
  const html = templateReminder({ dateLabel, dutyName, role: 'główny', link });
  return res.type('html').send(html);
});

// Test wysyłki e‑mail
router.get('/test', async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Parametr ?to= jest wymagany' });
  try {
    const html = templateReminder({ dateLabel: 'jutro', dutyName: 'Dyżur testowy', role: 'główny', link: req.query.link || 'http://localhost:3000' });
    const info = await sendEmail({ to, subject: 'Test: przypomnienie o dyżurze', html, text: 'Test przypomnienia o dyżurze' });
    return res.json({ ok: true, info, emailEnabled: isEmailEnabled() });
  } catch (e) {
    console.error('Błąd testu wysyłki:', e);
    return res.status(500).json({ error: 'Błąd wysyłki', message: e.message });
  }
});

module.exports = router;


