const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://odwiedziny-chorych.local',
        headless: true,
        trace: 'on-first-retry',
    },
    reporter: [['list']],
});
