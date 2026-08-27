const { test, expect } = require('@playwright/test');

const APP_PASSWORD = process.env.E2E_APP_PASSWORD || 'PomocDlaChorych!';
const APP_PATH = process.env.E2E_APP_PATH || '/odwiedziny-chorych/';

async function ensureLoggedIn(page) {
    await page.goto(APP_PATH);
    const passwordInput = page.locator('#oc-passwordInput');
    if (await passwordInput.isVisible()) {
        await passwordInput.fill(APP_PASSWORD);
        await page.locator('#oc-loginForm button[type="submit"]').click();
    }
    await expect(page.locator('#oc-mainApp')).toBeVisible();
}

async function openFirstPlannedModal(page) {
    const firstPlannedBtn = page.locator('#oc-tabelaKalendarzBody button', { hasText: 'Zaplanowane' }).first();
    await expect(firstPlannedBtn).toBeVisible();
    const dateStr = await firstPlannedBtn.getAttribute('data-date');
    await firstPlannedBtn.click();
    await expect(page.locator('#oc-modalRaport')).toBeVisible();
    return dateStr;
}

test.describe('Visit Modal E2E', () => {
    test('opens and saves report without UI errors', async ({ page }) => {
        await ensureLoggedIn(page);
        await openFirstPlannedModal(page);

        await expect(page.locator('#oc-raportListaChorych')).toBeVisible();
        await page.locator('#oc-raportZapiszBtn').click();
        await expect(page.locator('#oc-modalRaport')).toBeHidden();
    });

    test('keeps occasional patient after close/open before save', async ({ page }) => {
        await ensureLoggedIn(page);
        const dateStr = await openFirstPlannedModal(page);

        const occasionalSelect = page.locator('#oc-raportOccasionalSelect');
        if (!(await occasionalSelect.count())) {
            test.skip(true, 'Brak sekcji dodawania okazjonalnego dla tej daty.');
        }

        const options = occasionalSelect.locator('option');
        const optionCount = await options.count();
        if (optionCount < 2) {
            test.skip(true, 'Brak kandydatów do dodania okazjonalnie.');
        }

        const patientName = (await options.nth(1).textContent() || '').trim();
        await occasionalSelect.selectOption({ label: patientName });
        await page.locator('#oc-raportAddOccasionalBtn').click();

        const patientCard = page.locator(`.oc-raport-card[data-name="${patientName}"]`);
        await expect(patientCard).toBeVisible();

        await page.locator('.oc-raport-close').click();
        await expect(page.locator('#oc-modalRaport')).toBeHidden();

        const reopenBtn = page.locator(`button[data-date="${dateStr}"]`);
        await reopenBtn.click();
        await expect(page.locator('#oc-modalRaport')).toBeVisible();
        await expect(page.locator(`.oc-raport-card[data-name="${patientName}"]`)).toBeVisible();
    });
});
