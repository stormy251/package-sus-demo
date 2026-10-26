import { createHttp } from '../core/http.js';
import { checkPackage, validName } from '../core/check.js';
import { buildIndex } from '../core/typosquat.js';

// Browser fetch: pypistats.org sends no CORS headers, so skip it instantly (no retries) instead of failing noisily.
// 'user-agent' is a forbidden header in browsers; drop it so no CORS preflight is triggered by it.
export function browserFetch(url, init = {}) {
    if (new URL(url).host === 'pypistats.org') {
        const e = new Error('pypistats.org does not allow browser (CORS) requests, so the PyPI weekly-download signal is skipped in this demo');
        e.status = 451;
        return Promise.reject(e);
    }
    const headers = { ...(init.headers || {}) };
    delete headers['user-agent'];
    return fetch(url, { ...init, headers });
}

let popularP;
export function loadPopularLists(base = '') {
    popularP ||= Promise.all(['npm', 'pypi'].map((e) => fetch(`${base}data/popular-${e}.json`).then((r) => {
        if (!r.ok) throw new Error(`could not load typosquat list (${r.status})`);
        return r.json();
    }))).then(([n, p]) => ({ npm: buildIndex(n.names, n), pypi: buildIndex(p.names, p) }));
    return popularP;
}

export async function runCheck(ecosystem, name, { base = '', fetchImpl = browserFetch } = {}) {
    const popular = await loadPopularLists(base);
    const http = createHttp({ fetchImpl, userAgent: 'browser', maxRetries: 2 });
    return checkPackage({ ecosystem, name }, { http, popular, options: { includeEol: false, includeScorecard: false } });
}

export { validName };

// ---------- UI (only when running in a page) ----------
if (typeof document !== 'undefined' && document.getElementById('f')) {
    const $ = (id) => document.getElementById(id);
    const out = $('out');
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const render = (d) => {
        out.replaceChildren();
        const h = el('h2', '', `${d.name} `);
        h.append(el('span', `v ${d.verdict}`, d.verdict.replace('_', ' ') + (d.riskScore != null ? ` · risk ${d.riskScore}/100` : '')));
        out.append(h);
        if (d.verdict === 'error') { out.append(el('p', '', (d.reasons[0] && d.reasons[0].message) || 'Lookup failed. Try again.')); return; }
        out.append(el('p', '', d.summary || (d.reasons[0] && d.reasons[0].message) || ''));
        const shown = (d.reasons || []).filter((x) => x.points > 0 || d.verdict === 'not_found');
        if (shown.length) { const ul = el('ul'); shown.forEach((x) => ul.append(el('li', '', x.message))); out.append(ul); }
        const notes = [];
        if (d.ecosystem === 'pypi') notes.push('PyPI weekly downloads are not available in the browser (pypistats.org blocks cross-origin requests), so that signal is skipped. Low-usage signals for PyPI packages need the Actor.');
        (d.errors || []).filter((e) => !/pypistats/.test(e)).forEach((e) => notes.push(`Data source problem: ${e}`));
        notes.forEach((n) => out.append(el('p', 'muted', n)));
    };
    const go = async (eco, name) => {
        out.replaceChildren(el('p', 'muted', 'Checking…'));
        if (!validName(eco, name)) { out.replaceChildren(el('p', '', `"${name}" is not a valid ${eco} package name.`)); return; }
        try { render(await runCheck(eco, name)); } catch (e) { out.replaceChildren(el('p', '', `Check failed: ${e.message}. Try again.`)); }
    };
    $('f').addEventListener('submit', (ev) => { ev.preventDefault(); go($('eco').value, $('name').value.trim()); });
    document.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => {
        const [eco, name] = b.dataset.ex.split(':');
        $('eco').value = eco; $('name').value = name; go(eco, name);
    }));
    window.__psdReady = true;
}
