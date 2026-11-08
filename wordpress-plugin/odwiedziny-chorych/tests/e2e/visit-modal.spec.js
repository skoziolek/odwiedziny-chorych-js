const { test, expect } = require('@playwright/test');

const APP_PASSWORD = process.env.E2E_APP_PASSWORD || 'PomocDlaChorych!';
const CHANGED_PASSWORD = process.env.E2E_CHANGED_PASSWORD || 'PomocDlaChorychZmienione1!';
const APP_PATH = process.env.E2E_APP_PATH || '/odwiedziny-chorych/';

async function submitLogin(page, password) {
    await page.locator('#oc-passwordInput').fill(password);
    await page.locator('#oc-loginForm button[type="submit"]').click();
}

async function completeForcedPasswordChange(page) {
    const screen = page.locator('#oc-changePasswordScreen');
    if (!(await screen.isVisible())) {
        return;
    }
    await page.locator('#oc-newAdminPassword').fill(CHANGED_PASSWORD);
    await page.locator('#oc-confirmAdminPassword').fill(CHANGED_PASSWORD);
    await page.locator('#oc-changePasswordForm button[type="submit"]').click();
}

async function ensureLoggedIn(page) {
    await page.goto(APP_PATH);
    if (await page.locator('#oc-mainApp').isVisible()) {
        return;
    }
    if (await page.locator('#oc-changePasswordScreen').isVisible()) {
        await completeForcedPasswordChange(page);
        await expect(page.locator('#oc-mainApp')).toBeVisible();
        return;
    }
    const passwordInput = page.locator('#oc-passwordInput');
    if (await passwordInput.isVisible()) {
        await submitLogin(page, APP_PASSWORD);
        await Promise.race([
            page.locator('#oc-mainApp').waitFor({ state: 'visible' }),
            page.locator('#oc-changePasswordScreen').waitFor({ state: 'visible' }),
            page.locator('#oc-loginError').waitFor({ state: 'visible' }),
        ]);
        if (await page.locator('#oc-loginError').isVisible()) {
            await submitLogin(page, CHANGED_PASSWORD);
        }
        await completeForcedPasswordChange(page);
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

    test('reverts saved report back to planned', async ({ page }) => {
        await ensureLoggedIn(page);
        const dateStr = await openFirstPlannedModal(page);

        await expect(page.locator('#oc-raportPrzywrocBtn')).toBeHidden();
        await page.locator('#oc-raportZapiszBtn').click();
        await expect(page.locator('#oc-modalRaport')).toBeHidden();

        const dateBtn = page.locator(`#oc-tabelaKalendarzBody button[data-date="${dateStr}"]`);
        await expect(dateBtn).toHaveText('Odwiedzone');

        await dateBtn.click();
        await expect(page.locator('#oc-modalRaport')).toBeVisible();
        await expect(page.locator('#oc-raportPrzywrocBtn')).toBeVisible();

        page.once('dialog', dialog => dialog.accept());
        await page.locator('#oc-raportPrzywrocBtn').click();

        await expect(page.locator('#oc-modalRaport')).toBeHidden();
        await expect(dateBtn).toHaveText('Zaplanowane');
    });
});
