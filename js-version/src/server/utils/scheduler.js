const cron = require('node-cron');

function startSchedulers({ onRemindersRun }) {
  // Przykładowy harmonogram: codziennie o 18:00 czasu serwera
  // Cron format: min godz dzien_mies mies dzien_tyg
  cron.schedule('0 18 * * *', async () => {
    try {
      if (typeof onRemindersRun === 'function') {
        await onRemindersRun();
      }
      console.log('⏰ Job reminders wykonany.');
    } catch (e) {
      console.error('Błąd job reminders:', e);
    }
  });
}

module.exports = {
  startSchedulers,
};


