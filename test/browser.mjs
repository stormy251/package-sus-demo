// Headless-Chrome check of the real page against the live registries (needs network).
// usage: CHROME=/usr/bin/google-chrome node test/browser.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const URL_UNDER_TEST = process.env.TEST_URL; // e.g. https://stormy251.github.io/package-sus-demo/ ; default: local server
const port = 8123;
const srv = URL_UNDER_TEST ? { kill() {} } : spawn('node', ['scripts/serve.mjs', String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
const problems = [];
page.on('requestfailed', (r) => console.log('REQFAILED', r.url(), r.failure()?.errorText));
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
await page.goto(URL_UNDER_TEST || `http://localhost:${port}/`);
await page.waitForFunction(() => window.__psdReady === true);
const cases = [
    ['npm', 'react-codeshift', /caution/],
    ['npm', 'expres', /caution/],
    ['npm', 'express', /ok/],
    ['npm', 'react-state-guard-pro', /not found/],
    ['npm', 'unused-imports', /suspicious/],
    ['pypi', 'requests', /ok/],
    ['pypi', 'reqeusts', /not found/],
    ['pypi', 'pycrypto', /caution/],
];
let fail = 0;
for (const [eco, name, want] of cases) {
    await page.selectOption('#eco', eco);
    await page.fill('#name', name);
    await page.click('#f button');
    await page.waitForFunction(() => document.querySelector('#out .v') || /failed|valid/.test(document.getElementById('out').textContent), null, { timeout: 30000 });
    const badge = (await page.$('#out h2')) ? await page.textContent('#out h2') : 'NO-H2: ' + (await page.textContent('#out'));
    const ok = want.test(badge);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${eco}:${name} -> ${badge.trim()}`);
}
const text = await page.textContent('body');
for (const must of ['risk signals, not accusations'.toLowerCase(), 'try the actor on apify']) {
    const ok = text.toLowerCase().includes(must); if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} page contains "${must}"`);
}
const href = await page.getAttribute('a.btn', 'href'); console.log('CTA href:', href); if (!/apify\.com\/stormy251\/package-sus-detector/.test(href)) fail++;
// XSS probe: invalid name must be rejected, not rendered as HTML
await page.fill('#name', '<img src=x onerror=alert(1)>'); await page.click('#f button');
await page.waitForFunction(() => /valid/.test(document.getElementById('out').textContent));
if (await page.$('#out img')) { fail++; console.log('FAIL xss'); } else console.log('PASS invalid name rejected, nothing injected');
const real = problems.filter((p) => !/status of 404/.test(p));
console.log('page/console errors (expected 404s for not-registered names ignored):', real.length ? real : 'none');
await browser.close(); srv.kill();
process.exit(fail || real.length ? 1 : 0);
