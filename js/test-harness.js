// js/test-harness.js
// Minimal in-browser test runner.
const _tests = [];
let _suite = 'default';

export function suite(name) { _suite = name; }

export function test(name, fn) { _tests.push({ suite: _suite, name, fn }); }

export function assertEqual(actual, expected, msg) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error(`${msg || 'assertEqual'}\n  expected: ${e}\n  actual:   ${a}`);
}

export function assertTrue(v, msg) { if (!v) throw new Error(msg || `assertTrue: got ${v}`); }
export function assertFalse(v, msg) { if (v) throw new Error(msg || `assertFalse: got ${v}`); }
export function assertContains(haystack, needle, msg) {
    if (!String(haystack).includes(needle))
        throw new Error(`${msg || 'assertContains'}\n  needle: ${needle}\n  haystack: ${String(haystack).slice(0, 200)}`);
}
export function assertThrows(fn, substring) {
    try { fn(); } catch (e) {
        if (substring && !String(e.message).includes(substring))
            throw new Error(`Wrong error: ${e.message}\n  expected substring: ${substring}`);
        return;
    }
    throw new Error(`Expected throw${substring ? ' containing: ' + substring : ''}`);
}

export async function run() {
    const root = document.getElementById('test-root');
    const summary = document.getElementById('test-summary');
    let passed = 0, failed = 0;
    for (const t of _tests) {
        const div = document.createElement('div');
        div.className = 'test-line';
        try {
            await t.fn();
            div.classList.add('pass');
            div.textContent = `✓ [${t.suite}] ${t.name}`;
            passed++;
        } catch (e) {
            div.classList.add('fail');
            div.textContent = `✗ [${t.suite}] ${t.name}\n  ${e.message}`;
            failed++;
            console.error(`✗ [${t.suite}] ${t.name}`, e);
        }
        root.appendChild(div);
    }
    summary.textContent = `${passed} passed, ${failed} failed, ${_tests.length} total`;
    summary.className = failed === 0 ? 'summary pass' : 'summary fail';
}
