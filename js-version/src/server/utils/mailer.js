const nodemailer = require('nodemailer');

function isEmailEnabled() {
  return String(process.env.NOTIFICATIONS_EMAIL_ENABLED || 'false') === 'true';
}

function createTransporter() {
  if (!isEmailEnabled()) return null;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP nie jest w pełni skonfigurowany. Wyłączam wysyłkę e-mail.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

const transporter = createTransporter();

async function sendEmail({ to, subject, html, text }) {
  if (!isEmailEnabled() || !transporter) {
    console.log('📬 [EMAIL DISABLED] Temat:', subject, '→', to);
    return { disabled: true };
  }
  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  const info = await transporter.sendMail({ from, to, subject, html, text });
  console.log('📨 Email wysłany:', info.messageId, '→', to);
  return info;
}

module.exports = {
  isEmailEnabled,
  sendEmail,
};


