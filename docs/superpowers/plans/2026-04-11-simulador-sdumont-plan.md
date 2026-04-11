# Simulador Educativo SDumont — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static-site educational simulator of SDumont Expansão v1 that walks a complete HPC beginner through a 9-step tour (v1-vs-2nd framing, architecture, VPN+SSH access, data transfer, environment/modules, SLURM submission, monitoring, results, multi-user convivência) plus a free-exploration sandbox mode. The simulator has a live cluster dashboard, a scripted SSH terminal with ~45 commands, palm-vein-themed fake project files, and narrator content in beginner-friendly Brazilian Portuguese anchored in the LNCC course transcripts.

**Architecture:** Vanilla HTML + CSS + ES modules. Three-panel layout (narrator | dashboard + terminal). In-memory cluster state with a 2-second tick loop. File-based architecture so each module is small and focused. `localStorage` for persistence. In-browser test harness for logic-heavy modules. No build step, no dependencies.

**Tech Stack:** HTML5, CSS3 with custom properties, vanilla JavaScript ES2022 modules, `localStorage`, minimal browser DOM. No npm, no bundler, no framework. Chrome/Firefox/Edge desktop.

**Reference documents:**
- Spec: `docs/superpowers/specs/2026-04-11-simulador-sdumont-design.md`
- Research findings: `research/findings.md` (wiki + slides, autoritativo para fatos técnicos)
- Narrator voice research: `research/narrator-voice.md` (autoritativo para tom + cenas)

**Phases:**
- **Phase 0 — Scaffolding** (3 tasks): git, file tree, CSS variables, test harness
- **Phase 1 — Data models** (5 tasks): state, cluster, filesystem, tick loop, fictional users
- **Phase 2 — Terminal** (7 tasks): parser, fs/ssh/modules/slurm/lustre/utils commands
- **Phase 3 — Dashboard UI** (4 tasks): node grid, queue view, orchestration, highlight system
- **Phase 4 — Narrator engine** (4 tasks): progress stepper, narrator renderer, glossary, tour data skeleton
- **Phase 5 — Content** (11 tasks): fake files, job templates, v1-vs-2nd data, 9 etapas of narration, glossary entries
- **Phase 6 — Polish** (6 tasks): modals, v1-vs-2nd card, help, reset, a11y, sandbox
- **Phase 7 — Deployment** (3 tasks): README, gitignore, end-to-end smoke test

---

## Phase 0 — Scaffolding

### Task 0.1: Initialize project directory and git

**Files:**
- Create: `.gitignore`
- Create: `README.md` (minimal placeholder — full README comes in Phase 7)

- [ ] **Step 1: Verify working directory is the project root**

Run: `pwd`
Expected: `/c/Users/jpfra/Downloads/simulador-sdumont` (or equivalent absolute path)

- [ ] **Step 2: Initialize git repository**

Run: `git init`
Expected: `Initialized empty Git repository in .../simulador-sdumont/.git/`

- [ ] **Step 3: Create `.gitignore`**

```
# Research materials (source, not published, potentially copyrighted)
research/

# OS cruft
.DS_Store
Thumbs.db
desktop.ini

# Editor cruft
.vscode/
.idea/
*.swp
*.swo
*~

# Logs and temp
*.log
*.tmp
.cache/

# Never these
node_modules/
dist/
build/
```

- [ ] **Step 4: Create placeholder `README.md`**

```markdown
# Simulador Educativo SDumont

Simulador interativo do supercomputador Santos Dumont (Expansão v1, 2019) para aprendizes sem background em HPC.

**Status:** em desenvolvimento. README completo será escrito na Fase 7 do plano.

Para abrir: abra `index.html` no navegador.

Spec: `docs/superpowers/specs/2026-04-11-simulador-sdumont-design.md`
Plano: `docs/superpowers/plans/2026-04-11-simulador-sdumont-plan.md`
```

- [ ] **Step 5: First commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initialize project with gitignore, placeholder README, and spec+plan"
```

Expected output: `[master (root-commit) <hash>] chore: initialize project...`

---

### Task 0.2: Create base HTML shell with three-panel layout

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Create `index.html` with the three-panel shell structure**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simulador SDumont — Aprenda supercomputação do zero</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app" class="app-shell">
        <!-- TOPO: barra de progresso + selo v1 + cards fixos -->
        <header id="topo" class="topo">
            <div class="selo-v1" title="Você está no SDumont Expansão (v1), não no 2nd">
                🟦 SDumont Expansão (v1)
            </div>
            <nav id="progresso" class="progresso" aria-label="Progresso do tour">
                <!-- populated by js/progress.js -->
            </nav>
            <div class="cards-fixos">
                <button id="btn-glossario" title="Glossário">📘</button>
                <button id="btn-v1-vs-2nd" title="SDumont v1 vs 2nd">🔀</button>
                <button id="btn-ajuda" title="Ajuda e atalhos">❓</button>
                <button id="btn-reset" title="Reiniciar tour">🔁</button>
                <button id="btn-sandbox" title="Sandbox" disabled>🏖️</button>
                <button id="btn-mute" title="Ativar/desativar sons">🔇</button>
            </div>
        </header>

        <!-- ESQUERDA: painel do narrador -->
        <aside id="narrador" class="narrador" aria-live="polite">
            <!-- populated by js/narrator.js -->
        </aside>

        <!-- DIREITA-CIMA: dashboard do cluster -->
        <section id="dashboard" class="dashboard" aria-label="Dashboard do cluster">
            <!-- populated by js/ui/dashboard.js -->
        </section>

        <!-- DIREITA-BAIXO: terminal SSH simulado -->
        <section id="terminal" class="terminal" aria-label="Terminal simulado">
            <!-- populated by js/terminal.js -->
        </section>
    </div>

    <!-- Modais (inicialmente ocultos) -->
    <div id="modais-root"></div>

    <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css` with CSS variables, reset, and grid layout**

```css
/* =========================================================================
   SIMULADOR SDUMONT — style.css
   Paleta escura, grid de 3 painéis, responsivo com breakpoint em 1280px.
   ========================================================================= */

:root {
    /* Paleta base */
    --bg: #0b0f14;
    --surface: #151b23;
    --surface-alt: #1d252f;
    --border: #2a3340;
    --text: #e6edf3;
    --text-dim: #8b949e;
    --accent: #3fb950;
    --accent-alt: #58a6ff;
    --danger: #f85149;
    --warning: #d29922;

    /* Estados de nó */
    --node-idle: #3fb950;
    --node-mix: #d29922;
    --node-alloc: #f85149;
    --node-down: #6e7681;

    /* Tipografia */
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
    --fs-base: 15px;
    --fs-sm: 13px;
    --fs-lg: 17px;

    /* Espaçamento */
    --sp-xs: 4px;
    --sp-sm: 8px;
    --sp-md: 16px;
    --sp-lg: 24px;
}

/* Reset mínimo */
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: var(--fs-base);
    line-height: 1.5;
    overflow: hidden;
}
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }

/* Grid principal: 3 painéis */
.app-shell {
    display: grid;
    height: 100vh;
    grid-template-columns: 30% 70%;
    grid-template-rows: 56px 1fr 40%;
    grid-template-areas:
        "topo topo"
        "narrador dashboard"
        "narrador terminal";
}

.topo {
    grid-area: topo;
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    padding: 0 var(--sp-md);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
}

.selo-v1 {
    font-weight: 600;
    color: var(--accent-alt);
    padding: 4px 10px;
    background: var(--surface-alt);
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
}

.progresso {
    flex: 1;
    display: flex;
    gap: var(--sp-xs);
    align-items: center;
    overflow-x: auto;
}

.cards-fixos {
    display: flex;
    gap: var(--sp-xs);
}
.cards-fixos button {
    font-size: 18px;
    padding: 6px 8px;
    border-radius: 4px;
}
.cards-fixos button:hover:not(:disabled) { background: var(--surface-alt); }
.cards-fixos button:disabled { opacity: 0.3; cursor: not-allowed; }

.narrador {
    grid-area: narrador;
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: var(--sp-lg);
    overflow-y: auto;
}

.dashboard {
    grid-area: dashboard;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: var(--sp-md);
    overflow-y: auto;
}

.terminal {
    grid-area: terminal;
    background: #000;
    color: #e6edf3;
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
    padding: var(--sp-md);
    overflow-y: auto;
}

/* Responsivo: abaixo de 1280px vira aba única */
@media (max-width: 1279px) {
    .app-shell {
        grid-template-columns: 1fr;
        grid-template-rows: 56px 40px 1fr;
        grid-template-areas:
            "topo"
            "abas"
            "painel";
    }
    .narrador, .dashboard, .terminal {
        grid-area: painel;
        display: none;
    }
    .narrador.ativo, .dashboard.ativo, .terminal.ativo { display: block; }
}

/* Acessibilidade: reduce-motion desliga animações */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

- [ ] **Step 3: Create stub `js/main.js` to verify module loading works**

```javascript
// js/main.js
// Entry point. For now, just confirms modules are loading.
console.log('[simulador-sdumont] booting...');
document.getElementById('narrador').textContent =
    'Bem-vindo ao simulador do SDumont. Módulos carregados com sucesso.';
```

- [ ] **Step 4: Open `index.html` in a browser and verify the layout**

Run: `start index.html` (Windows) or open manually in Chrome/Firefox.
Expected:
- Three-panel layout visible: top bar, left narrator, right-top dashboard, right-bottom terminal
- Top bar shows "🟦 SDumont Expansão (v1)" selo and six buttons (📘 🔀 ❓ 🔁 🏖️ 🔇)
- Left panel shows the welcome text from `main.js`
- DevTools console shows `[simulador-sdumont] booting...`

- [ ] **Step 5: Commit**

```bash
git add index.html style.css js/main.js
git commit -m "feat(scaffold): three-panel HTML shell with CSS variables and dark palette"
```

---

### Task 0.3: Create in-browser test harness

**Files:**
- Create: `tests.html`
- Create: `js/test-harness.js`
- Create: `tests/smoke.test.js`

This is a minimal assertion-based test runner. It runs in the browser (no npm, no build), dispatches all registered tests, and prints results both in the DOM and the console. Every logic-heavy module in later phases will have a matching `tests/<module>.test.js` file imported by `tests.html`.

- [ ] **Step 1: Create `js/test-harness.js` — the test runner**

```javascript
// js/test-harness.js
// Minimal in-browser test harness. Usage:
//   import { test, assertEqual, assertThrows, run } from './test-harness.js';
//   test('name of test', () => { assertEqual(2+2, 4); });
//   run();  // dispatches all registered tests

const _tests = [];
let _currentSuite = 'default';

export function suite(name) {
    _currentSuite = name;
}

export function test(name, fn) {
    _tests.push({ suite: _currentSuite, name, fn });
}

export function assertEqual(actual, expected, msg) {
    const aStr = JSON.stringify(actual);
    const eStr = JSON.stringify(expected);
    if (aStr !== eStr) {
        throw new Error(
            `${msg || 'assertEqual failed'}\n  expected: ${eStr}\n  actual:   ${aStr}`
        );
    }
}

export function assertTrue(value, msg) {
    if (!value) throw new Error(msg || `assertTrue failed: got ${value}`);
}

export function assertFalse(value, msg) {
    if (value) throw new Error(msg || `assertFalse failed: got ${value}`);
}

export function assertThrows(fn, expectedMsgSubstring, msg) {
    try {
        fn();
    } catch (e) {
        if (expectedMsgSubstring && !String(e.message).includes(expectedMsgSubstring)) {
            throw new Error(
                `${msg || 'assertThrows got wrong error'}\n  expected substring: ${expectedMsgSubstring}\n  actual: ${e.message}`
            );
        }
        return;
    }
    throw new Error(msg || 'assertThrows: function did not throw');
}

export function assertContains(haystack, needle, msg) {
    if (!String(haystack).includes(needle)) {
        throw new Error(
            `${msg || 'assertContains failed'}\n  haystack: ${haystack}\n  needle: ${needle}`
        );
    }
}

export async function run() {
    const root = document.getElementById('test-root');
    const summary = document.getElementById('test-summary');
    let passed = 0, failed = 0;
    const failures = [];
    for (const t of _tests) {
        const line = document.createElement('div');
        line.className = 'test-line';
        try {
            await t.fn();
            line.classList.add('pass');
            line.textContent = `✓ [${t.suite}] ${t.name}`;
            passed++;
        } catch (e) {
            line.classList.add('fail');
            line.textContent = `✗ [${t.suite}] ${t.name}\n  ${e.message}`;
            failed++;
            failures.push({ suite: t.suite, name: t.name, error: e });
            console.error(`✗ [${t.suite}] ${t.name}`, e);
        }
        root.appendChild(line);
    }
    summary.textContent = `${passed} passed, ${failed} failed, ${_tests.length} total`;
    summary.className = failed === 0 ? 'summary pass' : 'summary fail';
    return { passed, failed, total: _tests.length, failures };
}
```

- [ ] **Step 2: Create `tests/smoke.test.js` — a sanity test that the harness works**

```javascript
// tests/smoke.test.js
import { suite, test, assertEqual, assertTrue, assertThrows } from '../js/test-harness.js';

suite('smoke');

test('harness arithmetic', () => {
    assertEqual(2 + 2, 4);
});

test('harness detects failure', () => {
    assertThrows(() => { assertEqual(1, 2); }, 'assertEqual failed');
});

test('harness assertTrue works', () => {
    assertTrue(true);
});
```

- [ ] **Step 3: Create `tests.html` — the test runner page**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Simulador SDumont — Tests</title>
    <style>
        body {
            background: #0b0f14;
            color: #e6edf3;
            font-family: "JetBrains Mono", Consolas, monospace;
            padding: 24px;
        }
        h1 { color: #58a6ff; }
        .summary {
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        .summary.pass { background: #1a3a1f; color: #3fb950; }
        .summary.fail { background: #3a1f1f; color: #f85149; }
        .test-line {
            padding: 4px 8px;
            margin: 2px 0;
            border-left: 3px solid transparent;
            white-space: pre;
        }
        .test-line.pass { border-color: #3fb950; color: #8dd4a1; }
        .test-line.fail { border-color: #f85149; color: #f5a89a; background: #2a0f0f; }
    </style>
</head>
<body>
    <h1>Simulador SDumont — Test Suite</h1>
    <div id="test-summary" class="summary">running...</div>
    <div id="test-root"></div>

    <!-- Import every test file here. Order doesn't matter (test registration only). -->
    <script type="module">
        import '../tests/smoke.test.js';
        // Future test imports will be added as modules are built:
        // import '../tests/cluster.test.js';
        // import '../tests/filesystem.test.js';
        // import '../tests/parser.test.js';
        // etc.

        import { run } from '../js/test-harness.js';
        run();
    </script>
</body>
</html>
```

- [ ] **Step 4: Open `tests.html` in the browser and verify 3 passing tests**

Run: open `tests.html` in the browser (or `start tests.html` on Windows)
Expected: summary bar shows `3 passed, 0 failed, 3 total` in green; each test row has a green border and starts with `✓`.

- [ ] **Step 5: Commit**

```bash
git add js/test-harness.js tests/smoke.test.js tests.html
git commit -m "test: in-browser test harness with smoke tests passing"
```

---

## Phase 1 — Data models (cluster, filesystem, state, users)

### Task 1.1: Global state store with localStorage persistence

**Files:**
- Create: `js/state.js`
- Create: `tests/state.test.js`
- Modify: `tests.html` (register new test file)

The state store is a single JS object with getters/setters and `persist()`/`restore()` methods. It holds everything the simulator needs to remember across page reloads: current tour step, cluster snapshot, filesystem tree, terminal history, glossary terms seen, user preferences.

- [ ] **Step 1: Write failing test for state default shape**

Create `tests/state.test.js`:

```javascript
// tests/state.test.js
import { suite, test, assertEqual, assertTrue } from '../js/test-harness.js';
import { createState, STORAGE_KEY } from '../js/state.js';

suite('state');

test('createState returns default shape', () => {
    // Clear any prior persistence
    localStorage.removeItem(STORAGE_KEY);
    const s = createState();
    assertEqual(s.version, 1);
    assertEqual(s.tourStepId, '0.1-bem-vindo');
    assertEqual(s.etapasConcluidas, []);
    assertEqual(s.sandboxDesbloqueado, false);
    assertEqual(s.preferencias, { som: false, velocidadeTick: 1 });
});

test('persist and restore round-trip', () => {
    localStorage.removeItem(STORAGE_KEY);
    const s = createState();
    s.tourStepId = '3.2-pegadinha-prj-scratch';
    s.etapasConcluidas = [0, 1, 2];
    s.persist();

    const s2 = createState();
    assertEqual(s2.tourStepId, '3.2-pegadinha-prj-scratch');
    assertEqual(s2.etapasConcluidas, [0, 1, 2]);
});

test('reset clears persistence', () => {
    localStorage.removeItem(STORAGE_KEY);
    const s = createState();
    s.etapasConcluidas = [0, 1];
    s.persist();
    s.reset();
    const s2 = createState();
    assertEqual(s2.etapasConcluidas, []);
});

test('stale version triggers reset on restore', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, tourStepId: 'old' }));
    const s = createState();
    assertEqual(s.version, 1);
    assertEqual(s.tourStepId, '0.1-bem-vindo');
});
```

Register in `tests.html` by adding `import '../tests/state.test.js';` above the run call.

- [ ] **Step 2: Run tests — all 4 should fail**

Open `tests.html`. Expected: 3 smoke pass + 4 state fail (module not found).

- [ ] **Step 3: Implement `js/state.js`**

```javascript
// js/state.js
// Global mutable state store for the simulator. Persisted to localStorage.
// Shape is versioned so schema changes can trigger a clean reset.

export const STORAGE_KEY = 'simulador-sdumont:state:v1';
export const CURRENT_VERSION = 1;

const DEFAULT_STATE = {
    version: CURRENT_VERSION,
    tourStepId: '0.1-bem-vindo',
    etapaAtual: 0,
    etapasConcluidas: [],
    clusterSnapshot: null,
    sistemaArquivos: null,
    historicoTerminal: [],
    sandboxDesbloqueado: false,
    glossarioVisto: [],
    preferencias: { som: false, velocidadeTick: 1 }
};

export function createState() {
    const s = { ...structuredClone(DEFAULT_STATE) };

    // Try to restore from localStorage
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.version === CURRENT_VERSION) {
                Object.assign(s, parsed);
            }
            // If version mismatch, silently reset — current s is still DEFAULT_STATE
        }
    } catch (e) {
        console.warn('[state] restore failed, using defaults:', e);
    }

    s.persist = function () {
        const toSave = { ...this };
        delete toSave.persist;
        delete toSave.reset;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    };

    s.reset = function () {
        localStorage.removeItem(STORAGE_KEY);
        Object.assign(this, structuredClone(DEFAULT_STATE));
    };

    return s;
}
```

- [ ] **Step 4: Run tests — all 4 state tests should pass**

Open `tests.html`. Expected: `7 passed, 0 failed, 7 total` (3 smoke + 4 state).

- [ ] **Step 5: Commit**

```bash
git add js/state.js tests/state.test.js tests.html
git commit -m "feat(state): versioned state store with localStorage persistence"
```

---

### Task 1.2: Cluster model — nodes, partitions, jobs data

**Files:**
- Create: `js/cluster.js`
- Create: `data/initial-cluster.js`
- Create: `tests/cluster.test.js`
- Modify: `tests.html`

The cluster module holds the live state of the simulated SDumont: 377 compute nodes + 4 login nodes, 9 partitions, and a job queue. This task sets up the data structures and initial-state generator. The tick loop comes in Task 1.3.

- [ ] **Step 1: Create `data/initial-cluster.js` with partition definitions and node factory**

```javascript
// data/initial-cluster.js
// Canonical SDumont v1 topology, from research/findings.md §2 (Bull Sequana X1120).
// All 9 partitions. Generates 377 compute nodes + 4 login nodes.

export const PARTITIONS = [
    { name: 'sequana_cpu',            walltimeMax: '96:00:00',  hw: 'cpu',       gpus: 0, sharedNode: false, devPriority: false },
    { name: 'sequana_cpu_dev',        walltimeMax: '00:20:00',  hw: 'cpu',       gpus: 0, sharedNode: false, devPriority: true  },
    { name: 'sequana_cpu_long',       walltimeMax: '744:00:00', hw: 'cpu',       gpus: 0, sharedNode: false, devPriority: false },
    { name: 'sequana_cpu_bigmem',     walltimeMax: '96:00:00',  hw: 'bigmem',    gpus: 0, sharedNode: false, devPriority: false },
    { name: 'sequana_cpu_bigmem_long',walltimeMax: '744:00:00', hw: 'bigmem',    gpus: 0, sharedNode: false, devPriority: false },
    { name: 'sequana_gpu',            walltimeMax: '96:00:00',  hw: 'gpu',       gpus: 4, sharedNode: true,  devPriority: false },
    { name: 'sequana_gpu_dev',        walltimeMax: '00:20:00',  hw: 'gpu',       gpus: 4, sharedNode: true,  devPriority: true  },
    { name: 'sequana_gpu_long',       walltimeMax: '744:00:00', hw: 'gpu',       gpus: 4, sharedNode: true,  devPriority: false },
    { name: 'gdl',                    walltimeMax: '48:00:00',  hw: 'gdl',       gpus: 8, sharedNode: false, devPriority: false }
];

export const NODE_COUNTS = {
    cpu: 246,       // sequana_cpu / sequana_cpu_dev / sequana_cpu_long share
    bigmem: 36,     // sequana_cpu_bigmem / sequana_cpu_bigmem_long
    gpu: 94,        // sequana_gpu / sequana_gpu_dev / sequana_gpu_long share
    gdl: 1          // single node, dedicated
};

export const HARDWARE = {
    cpu: {
        cpus: 48, socketsPerNode: 2, coresPerSocket: 24,
        cpuModel: 'Intel Xeon Cascade Lake Gold 6252',
        memGB: 384, gpuModel: null, gpuCount: 0
    },
    bigmem: {
        cpus: 48, socketsPerNode: 2, coresPerSocket: 24,
        cpuModel: 'Intel Xeon Cascade Lake Gold 6252',
        memGB: 768, gpuModel: null, gpuCount: 0
    },
    gpu: {
        cpus: 48, socketsPerNode: 2, coresPerSocket: 24,
        cpuModel: 'Intel Xeon Skylake 6252',
        memGB: 384, gpuModel: 'NVIDIA Tesla V100', gpuCount: 4
    },
    gdl: {
        cpus: 40, socketsPerNode: 2, coresPerSocket: 20,
        cpuModel: 'Intel Xeon Skylake Gold 6148',
        memGB: 384, gpuModel: 'NVIDIA Tesla V100-SXM2-16GB (NVLink)', gpuCount: 8
    }
};

export const LOGIN_NODES = [
    { id: 'sdumont15', state: 'up' },
    { id: 'sdumont16', state: 'up' },
    { id: 'sdumont17', state: 'up' },
    { id: 'sdumont18', state: 'up' }
];

// Procedural generator for compute nodes.
// Real IDs from the wiki are 4-digit like sdumont1468, sdumont6000..6089.
// We pick plausible numeric ranges: cpu 1000..1245, bigmem 2000..2035,
// gpu 6000..6093, gdl 8000.
export function makeInitialCluster() {
    const nodes = [];
    let i = 1000;
    for (let k = 0; k < NODE_COUNTS.cpu; k++) nodes.push(makeNode(`sdumont${i++}`, 'cpu'));
    i = 2000;
    for (let k = 0; k < NODE_COUNTS.bigmem; k++) nodes.push(makeNode(`sdumont${i++}`, 'bigmem'));
    i = 6000;
    for (let k = 0; k < NODE_COUNTS.gpu; k++) nodes.push(makeNode(`sdumont${i++}`, 'gpu'));
    nodes.push(makeNode('sdumont8000', 'gdl'));
    return { nodes, partitions: PARTITIONS, loginNodes: LOGIN_NODES, jobs: [], nextJobId: 12000 };
}

function makeNode(id, hwType) {
    const hw = HARDWARE[hwType];
    return {
        id, hwType,
        cpusTotal: hw.cpus, cpusAllocated: 0,
        memGBTotal: hw.memGB, memGBAllocated: 0,
        gpusTotal: hw.gpuCount, gpusAllocated: 0,
        state: 'idle',   // idle | mix | alloc | down
        currentJobs: []
    };
}
```

- [ ] **Step 2: Write failing tests for cluster init**

Create `tests/cluster.test.js`:

```javascript
// tests/cluster.test.js
import { suite, test, assertEqual, assertTrue } from '../js/test-harness.js';
import { createCluster, SEQ_CPU, SEQ_GPU, GDL } from '../js/cluster.js';
import { PARTITIONS, NODE_COUNTS } from '../data/initial-cluster.js';

suite('cluster');

test('createCluster has 377 compute nodes + 4 login nodes', () => {
    const c = createCluster();
    assertEqual(c.nodes.length, 377);
    assertEqual(c.loginNodes.length, 4);
});

test('createCluster has 9 partitions', () => {
    const c = createCluster();
    assertEqual(c.partitions.length, 9);
});

test('node counts per hwType are correct', () => {
    const c = createCluster();
    const cpu = c.nodes.filter(n => n.hwType === 'cpu').length;
    const bigmem = c.nodes.filter(n => n.hwType === 'bigmem').length;
    const gpu = c.nodes.filter(n => n.hwType === 'gpu').length;
    const gdl = c.nodes.filter(n => n.hwType === 'gdl').length;
    assertEqual(cpu, 246);
    assertEqual(bigmem, 36);
    assertEqual(gpu, 94);
    assertEqual(gdl, 1);
});

test('all nodes start in idle state', () => {
    const c = createCluster();
    assertTrue(c.nodes.every(n => n.state === 'idle'));
});

test('initial job queue is empty', () => {
    const c = createCluster();
    assertEqual(c.jobs, []);
});

test('getNodesByPartition returns gdl with 1 node', () => {
    const c = createCluster();
    const gdlNodes = c.getNodesByPartition('gdl');
    assertEqual(gdlNodes.length, 1);
    assertEqual(gdlNodes[0].hwType, 'gdl');
    assertEqual(gdlNodes[0].gpusTotal, 8);
});

test('getNodesByPartition returns 94 gpu nodes for sequana_gpu', () => {
    const c = createCluster();
    const nodes = c.getNodesByPartition('sequana_gpu');
    assertEqual(nodes.length, 94);
    assertTrue(nodes.every(n => n.gpusTotal === 4));
});

test('getPartition returns matching definition', () => {
    const c = createCluster();
    const p = c.getPartition('gdl');
    assertEqual(p.walltimeMax, '48:00:00');
    assertEqual(p.gpus, 8);
});
```

Register in `tests.html`: `import '../tests/cluster.test.js';`

- [ ] **Step 3: Run tests — 8 new should fail**

Open `tests.html`. Expected: 7 prior pass + 8 cluster fail.

- [ ] **Step 4: Implement `js/cluster.js` (data model only — tick loop in Task 1.3)**

```javascript
// js/cluster.js
// Cluster state + query functions. Tick loop lives in Task 1.3.
import { makeInitialCluster, PARTITIONS, HARDWARE } from '../data/initial-cluster.js';

export const SEQ_CPU = 'sequana_cpu';
export const SEQ_GPU = 'sequana_gpu';
export const GDL = 'gdl';

// Map partition → hwType(s) it targets. Multiple partitions share nodes.
const PARTITION_TO_HWTYPE = {
    sequana_cpu:             'cpu',
    sequana_cpu_dev:         'cpu',
    sequana_cpu_long:        'cpu',
    sequana_cpu_bigmem:      'bigmem',
    sequana_cpu_bigmem_long: 'bigmem',
    sequana_gpu:             'gpu',
    sequana_gpu_dev:         'gpu',
    sequana_gpu_long:        'gpu',
    gdl:                     'gdl'
};

export function createCluster() {
    const raw = makeInitialCluster();
    return {
        ...raw,

        getNodesByPartition(partitionName) {
            const hwType = PARTITION_TO_HWTYPE[partitionName];
            if (!hwType) return [];
            return this.nodes.filter(n => n.hwType === hwType);
        },

        getPartition(name) {
            return this.partitions.find(p => p.name === name);
        },

        getNode(id) {
            return this.nodes.find(n => n.id === id)
                || this.loginNodes.find(n => n.id === id);
        },

        getHardwareInfo(hwType) {
            return HARDWARE[hwType];
        },

        allocateJobId() {
            return String(this.nextJobId++);
        }
    };
}
```

- [ ] **Step 5: Run tests — 8 cluster tests should pass**

Open `tests.html`. Expected: `15 passed, 0 failed, 15 total`.

- [ ] **Step 6: Commit**

```bash
git add data/initial-cluster.js js/cluster.js tests/cluster.test.js tests.html
git commit -m "feat(cluster): 377-node v1 topology with 9 partitions and query helpers"
```

---

### Task 1.3: Job submission, state transitions, and tick loop

**Files:**
- Modify: `js/cluster.js` (add `submitJob`, `tick`, `scheduleQueue`, `cancelJob`)
- Create: `tests/cluster-tick.test.js`
- Modify: `tests.html`

- [ ] **Step 1: Write failing tests for job submission and lifecycle**

Create `tests/cluster-tick.test.js`:

```javascript
// tests/cluster-tick.test.js
import { suite, test, assertEqual, assertTrue } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';

suite('cluster-tick');

function makeJob(overrides = {}) {
    return {
        user: 'unseen',
        partition: 'gdl',
        nodes: 1,
        gpus: 8,
        cpus: 40,
        memGB: 384,
        walltimeSec: 3600,
        name: 'test-job',
        script: '/scratch/palmvein/unseen/test.srm',
        ...overrides
    };
}

test('submitJob returns a job id and places job in queue as PD', () => {
    const c = createCluster();
    const jobId = c.submitJob(makeJob());
    assertTrue(jobId.length > 0);
    assertEqual(c.jobs.length, 1);
    assertEqual(c.jobs[0].state, 'PD');
    assertEqual(c.jobs[0].id, jobId);
});

test('scheduleQueue promotes PD job to R when resources exist (gdl)', () => {
    const c = createCluster();
    c.submitJob(makeJob());
    c.scheduleQueue();
    assertEqual(c.jobs[0].state, 'R');
    const gdl = c.getNode('sdumont8000');
    assertEqual(gdl.gpusAllocated, 8);
    assertEqual(gdl.state, 'alloc');
});

test('scheduleQueue keeps job PD with Resources reason when gdl is busy', () => {
    const c = createCluster();
    c.submitJob(makeJob()); // consumes gdl
    c.scheduleQueue();
    const jobId2 = c.submitJob(makeJob({ name: 'second' }));
    c.scheduleQueue();
    const j2 = c.jobs.find(j => j.id === jobId2);
    assertEqual(j2.state, 'PD');
    assertEqual(j2.reason, 'Resources');
});

test('submitJob without --time on non-dev partition throws', () => {
    const c = createCluster();
    assertThrowsSimple(() => c.submitJob(makeJob({ walltimeSec: null })), 'time limit');
});

test('submitJob with too-many gpus on gdl throws', () => {
    const c = createCluster();
    assertThrowsSimple(() => c.submitJob(makeJob({ gpus: 16 })), 'node configuration');
});

test('submitJob on gpu partition without --gpus yields QOSMinGRES', () => {
    const c = createCluster();
    const jobId = c.submitJob(makeJob({ partition: 'sequana_gpu', gpus: 0 }));
    c.scheduleQueue();
    const j = c.jobs.find(j => j.id === jobId);
    assertEqual(j.state, 'PD');
    assertEqual(j.reason, 'QOSMinGRES');
});

test('tick advances elapsed for running jobs', () => {
    const c = createCluster();
    c.submitJob(makeJob({ walltimeSec: 120 }));
    c.scheduleQueue();
    c.tick(5);  // advance simulated time by 5 seconds
    assertEqual(c.jobs[0].elapsedSec, 5);
});

test('tick transitions R → CG → CD when walltime reached', () => {
    const c = createCluster();
    const jobId = c.submitJob(makeJob({ walltimeSec: 10 }));
    c.scheduleQueue();
    c.tick(10);
    const j = c.jobs.find(j => j.id === jobId);
    assertTrue(j.state === 'CG' || j.state === 'CD');
    c.tick(1);
    assertEqual(c.jobs.find(j => j.id === jobId).state, 'CD');
});

test('tick releases node resources when job completes', () => {
    const c = createCluster();
    c.submitJob(makeJob({ walltimeSec: 5 }));
    c.scheduleQueue();
    c.tick(6);
    const gdl = c.getNode('sdumont8000');
    assertEqual(gdl.gpusAllocated, 0);
    assertEqual(gdl.state, 'idle');
});

test('scheduleQueue promotes a PD job when prior job completes', () => {
    const c = createCluster();
    c.submitJob(makeJob({ walltimeSec: 5, name: 'first' }));
    c.scheduleQueue();
    c.submitJob(makeJob({ name: 'second' }));
    c.scheduleQueue();
    c.tick(6);
    c.scheduleQueue();
    const second = c.jobs.find(j => j.name === 'second');
    assertEqual(second.state, 'R');
});

test('cancelJob sets state to CA and releases resources', () => {
    const c = createCluster();
    const jobId = c.submitJob(makeJob());
    c.scheduleQueue();
    c.cancelJob(jobId, 'unseen');
    const j = c.jobs.find(j => j.id === jobId);
    assertEqual(j.state, 'CA');
    const gdl = c.getNode('sdumont8000');
    assertEqual(gdl.gpusAllocated, 0);
});

test('cancelJob refuses when user does not own the job', () => {
    const c = createCluster();
    const jobId = c.submitJob(makeJob());
    c.scheduleQueue();
    assertThrowsSimple(() => c.cancelJob(jobId, 'slima'), 'not authorized');
});

// Small local helper because assertThrows from harness expects err.message
// and we want substring match here
function assertThrowsSimple(fn, substring) {
    try { fn(); } catch (e) {
        if (String(e.message).includes(substring)) return;
        throw new Error(`Wrong error: ${e.message}`);
    }
    throw new Error(`Expected throw containing: ${substring}`);
}
```

Register in `tests.html`: `import '../tests/cluster-tick.test.js';`

- [ ] **Step 2: Run tests — 12 new should fail**

Expected: 15 prior pass + 12 cluster-tick fail.

- [ ] **Step 3: Implement `submitJob`, `scheduleQueue`, `tick`, `cancelJob` in `js/cluster.js`**

Append to `js/cluster.js` inside the `createCluster` return object (after `allocateJobId`):

```javascript
        submitJob(request) {
            // request: { user, partition, nodes, gpus, cpus, memGB, walltimeSec, name, script }
            const part = this.getPartition(request.partition);
            if (!part) throw new Error(`Partition '${request.partition}' does not exist`);

            // Validate walltime (mandatory except on *_dev)
            if (!part.name.endsWith('_dev') && !request.walltimeSec) {
                throw new Error(
                    'error: Job submit/allocate failed: Requested time limit is invalid (missing or exceeds some limit)'
                );
            }

            // Validate partition walltime cap
            const maxSec = walltimeToSec(part.walltimeMax);
            if (request.walltimeSec && request.walltimeSec > maxSec) {
                throw new Error(
                    'error: Job submit/allocate failed: Requested time limit exceeds partition maximum'
                );
            }

            // Validate resource shape against partition hardware
            const targetNodes = this.getNodesByPartition(part.name);
            if (targetNodes.length === 0) {
                throw new Error('Invalid generic resource (gres) specification');
            }
            const nodeGpus = targetNodes[0].gpusTotal;
            if (request.gpus > nodeGpus * request.nodes) {
                throw new Error('Requested node configuration is not available');
            }

            const job = {
                id: this.allocateJobId(),
                user: request.user,
                partition: part.name,
                nodes: request.nodes,
                gpus: request.gpus,
                cpus: request.cpus,
                memGB: request.memGB,
                walltimeSec: request.walltimeSec,
                name: request.name,
                script: request.script,
                state: 'PD',
                reason: 'Priority',
                submitTime: Date.now(),
                startTime: null,
                elapsedSec: 0,
                allocatedNodes: []
            };
            this.jobs.push(job);
            return job.id;
        },

        scheduleQueue() {
            // Sort PD jobs by priority (simplified: dev partitions first, then FIFO).
            const pending = this.jobs
                .filter(j => j.state === 'PD')
                .sort((a, b) => {
                    const aDev = a.partition.endsWith('_dev') ? 0 : 1;
                    const bDev = b.partition.endsWith('_dev') ? 0 : 1;
                    if (aDev !== bDev) return aDev - bDev;
                    return a.submitTime - b.submitTime;
                });

            for (const job of pending) {
                const part = this.getPartition(job.partition);
                const candidates = this.getNodesByPartition(job.partition);

                // Rule: GPU partitions require --gpus (except when just testing CPU on GPU node)
                if (part.gpus > 0 && job.gpus === 0) {
                    job.reason = 'QOSMinGRES';
                    continue;
                }

                // Try to allocate on candidate nodes
                const allocated = tryAllocate(candidates, job, part);
                if (allocated.length === 0) {
                    job.reason = 'Resources';
                    continue;
                }

                // Mark resources as taken
                for (const n of allocated) {
                    n.cpusAllocated += Math.ceil(job.cpus / allocated.length);
                    n.gpusAllocated += Math.ceil(job.gpus / allocated.length);
                    n.memGBAllocated += Math.ceil(job.memGB / allocated.length);
                    n.currentJobs.push(job.id);
                    n.state = recomputeNodeState(n);
                }
                job.allocatedNodes = allocated.map(n => n.id);
                job.state = 'R';
                job.reason = null;
                job.startTime = Date.now();
            }
        },

        tick(deltaSec = 2) {
            // Advance elapsed for running jobs
            for (const job of this.jobs) {
                if (job.state === 'R') {
                    job.elapsedSec += deltaSec;
                    if (job.elapsedSec >= (job.walltimeSec || Infinity)) {
                        job.state = 'CG';
                    }
                } else if (job.state === 'CG') {
                    // Two-phase completion: CG → CD
                    job.state = 'CD';
                    this.releaseResources(job);
                }
            }
            // Try to promote pending jobs after every tick
            this.scheduleQueue();
        },

        releaseResources(job) {
            for (const nodeId of job.allocatedNodes) {
                const n = this.getNode(nodeId);
                if (!n) continue;
                n.cpusAllocated = Math.max(0, n.cpusAllocated - Math.ceil(job.cpus / job.allocatedNodes.length));
                n.gpusAllocated = Math.max(0, n.gpusAllocated - Math.ceil(job.gpus / job.allocatedNodes.length));
                n.memGBAllocated = Math.max(0, n.memGBAllocated - Math.ceil(job.memGB / job.allocatedNodes.length));
                n.currentJobs = n.currentJobs.filter(id => id !== job.id);
                n.state = recomputeNodeState(n);
            }
            job.allocatedNodes = [];
        },

        cancelJob(jobId, requestingUser) {
            const job = this.jobs.find(j => j.id === jobId);
            if (!job) throw new Error(`scancel: error: Invalid job id specified`);
            if (job.user !== requestingUser) throw new Error(`scancel: error: Kill job error on job id ${jobId}: Access/operation not authorized with job`);
            if (job.state === 'R' || job.state === 'CG') {
                this.releaseResources(job);
            }
            job.state = 'CA';
        }
```

Add these helper functions at the bottom of `js/cluster.js` (outside the `createCluster` function):

```javascript
function tryAllocate(candidates, job, part) {
    // Simple: try to find N nodes with enough free resources for the job
    const needed = job.nodes;
    const result = [];
    for (const n of candidates) {
        if (result.length >= needed) break;
        // For shared-node GPU partitions, multiple jobs per node are allowed
        const freeCpus = n.cpusTotal - n.cpusAllocated;
        const freeGpus = n.gpusTotal - n.gpusAllocated;
        const freeMem = n.memGBTotal - n.memGBAllocated;
        const perNodeCpus = Math.ceil(job.cpus / needed);
        const perNodeGpus = Math.ceil(job.gpus / needed);
        const perNodeMem = Math.ceil(job.memGB / needed);
        if (freeCpus >= perNodeCpus && freeGpus >= perNodeGpus && freeMem >= perNodeMem) {
            result.push(n);
        }
    }
    return result.length === needed ? result : [];
}

function recomputeNodeState(n) {
    if (n.cpusAllocated === 0 && n.gpusAllocated === 0 && n.memGBAllocated === 0) return 'idle';
    if (n.cpusAllocated === n.cpusTotal || n.gpusAllocated === n.gpusTotal) return 'alloc';
    return 'mix';
}

function walltimeToSec(str) {
    // "HH:MM:SS" → seconds
    const parts = str.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
```

- [ ] **Step 4: Run tests — all 12 should pass**

Expected: `27 passed, 0 failed, 27 total`.

- [ ] **Step 5: Commit**

```bash
git add js/cluster.js tests/cluster-tick.test.js tests.html
git commit -m "feat(cluster): job submission, SLURM state machine, tick loop with resource accounting"
```

---

### Task 1.4: Filesystem model (FS tree + ops)

**Files:**
- Create: `js/filesystem.js`
- Create: `data/initial-fs.js`
- Create: `tests/filesystem.test.js`
- Modify: `tests.html`

The filesystem simulates `/prj/palmvein/unseen` (HOME, NFS-only on login nodes) and `/scratch/palmvein/unseen` (working Lustre area, visible to all nodes). Supports `ls`, `cd`, `pwd`, `cat`, `mkdir`, `write` (from editor modal), and scoped `visibleTo(hostname)` to enforce the v1 pegadinha that `/prj` doesn't exist on compute nodes.

- [ ] **Step 1: Create `data/initial-fs.js` with the palm vein project tree**

```javascript
// data/initial-fs.js
// Initial filesystem tree for the simulator.
// Mirrors the v1 shape: /prj/<PROJETO>/<user> and /scratch/<PROJETO>/<user>.
// File contents are loaded from content/fake-files/ in Phase 5 (Task 5.1).
// For now, files have placeholder inline content that gets overwritten later.

export const INITIAL_FS = {
    '/': {
        type: 'dir', visibility: 'all', children: {
            'prj': {
                type: 'dir', visibility: 'login', children: {
                    'palmvein': {
                        type: 'dir', visibility: 'login', children: {
                            'unseen': {
                                type: 'dir', visibility: 'login', children: {
                                    'README.md': { type: 'file', visibility: 'login', content: '# Palm vein biometrics — placeholder, will be filled in Task 5.1\n' },
                                    'code': {
                                        type: 'dir', visibility: 'login', children: {
                                            'train.py': { type: 'file', visibility: 'login', content: '# placeholder\n' },
                                            'model.py': { type: 'file', visibility: 'login', content: '# placeholder\n' },
                                            'dataset.py': { type: 'file', visibility: 'login', content: '# placeholder\n' },
                                            'requirements.txt': { type: 'file', visibility: 'login', content: 'torch\ntorchvision\nopencv-python\nalbumentations\n' }
                                        }
                                    },
                                    'train_palmvein.srm': { type: 'file', visibility: 'login', content: '#!/bin/bash\n# placeholder job script\n' },
                                    'envs_readme.md': { type: 'file', visibility: 'login', content: '# placeholder\n' }
                                }
                            }
                        }
                    }
                }
            },
            'scratch': {
                type: 'dir', visibility: 'all', children: {
                    'palmvein': {
                        type: 'dir', visibility: 'all', children: {
                            'unseen': {
                                type: 'dir', visibility: 'all', children: {
                                    'datasets': {
                                        type: 'dir', visibility: 'all', children: {
                                            'palm_vein': {
                                                type: 'dir', visibility: 'all', children: {
                                                    'README.txt': { type: 'file', visibility: 'all', content: 'Palm vein IR images, 16766 total, 80/10/10 split\n' }
                                                }
                                            }
                                        }
                                    },
                                    'envs': {
                                        type: 'dir', visibility: 'all', children: {
                                            'palmvein': {
                                                type: 'dir', visibility: 'all', children: {
                                                    'bin': { type: 'dir', visibility: 'all', children: {} },
                                                    'lib': { type: 'dir', visibility: 'all', children: {} }
                                                }
                                            }
                                        }
                                    },
                                    'checkpoints': { type: 'dir', visibility: 'all', children: {} },
                                    'runs': { type: 'dir', visibility: 'all', children: {} }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
```

- [ ] **Step 2: Write failing tests for filesystem ops**

Create `tests/filesystem.test.js`:

```javascript
// tests/filesystem.test.js
import { suite, test, assertEqual, assertTrue, assertThrows } from '../js/test-harness.js';
import { createFilesystem } from '../js/filesystem.js';

suite('filesystem');

function fs() { return createFilesystem(); }

test('pwd returns initial /prj/palmvein/unseen', () => {
    const f = fs();
    assertEqual(f.pwd(), '/prj/palmvein/unseen');
});

test('cd absolute path works', () => {
    const f = fs();
    f.cd('/scratch/palmvein/unseen');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});

test('cd relative path works', () => {
    const f = fs();
    f.cd('code');
    assertEqual(f.pwd(), '/prj/palmvein/unseen/code');
});

test('cd .. goes up one level', () => {
    const f = fs();
    f.cd('code');
    f.cd('..');
    assertEqual(f.pwd(), '/prj/palmvein/unseen');
});

test('cd ~ returns to HOME', () => {
    const f = fs();
    f.cd('/scratch/palmvein/unseen/datasets');
    f.cd('~');
    assertEqual(f.pwd(), '/prj/palmvein/unseen');
});

test('cd to non-existent path throws', () => {
    const f = fs();
    assertThrows(() => f.cd('/does/not/exist'), 'No such file or directory');
});

test('ls returns directory contents', () => {
    const f = fs();
    const entries = f.ls();
    assertTrue(entries.some(e => e.name === 'code'));
    assertTrue(entries.some(e => e.name === 'train_palmvein.srm'));
});

test('cat returns file content', () => {
    const f = fs();
    const content = f.cat('code/requirements.txt');
    assertTrue(content.includes('torch'));
});

test('cat on directory throws', () => {
    const f = fs();
    assertThrows(() => f.cat('code'), 'Is a directory');
});

test('mkdir creates a directory', () => {
    const f = fs();
    f.mkdir('results');
    const entries = f.ls();
    assertTrue(entries.some(e => e.name === 'results' && e.type === 'dir'));
});

test('write creates or updates a file', () => {
    const f = fs();
    f.write('hello.txt', 'Olá mundo');
    assertEqual(f.cat('hello.txt'), 'Olá mundo');
});

test('visibleTo blocks /prj on compute node', () => {
    const f = fs();
    f.setHost('sdumont6042'); // compute node
    assertThrows(() => f.cd('/prj/palmvein/unseen'), 'No such file or directory');
});

test('visibleTo allows /scratch on compute node', () => {
    const f = fs();
    f.setHost('sdumont6042');
    f.cd('/scratch/palmvein/unseen');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});

test('visibleTo allows /prj on login node', () => {
    const f = fs();
    f.setHost('sdumont15');
    f.cd('/prj/palmvein/unseen');
    assertEqual(f.pwd(), '/prj/palmvein/unseen');
});

test('resolve returns normalized absolute path', () => {
    const f = fs();
    assertEqual(f.resolve('code'), '/prj/palmvein/unseen/code');
    assertEqual(f.resolve('/scratch/palmvein/unseen/../unseen'), '/scratch/palmvein/unseen');
});
```

Register in `tests.html`: `import '../tests/filesystem.test.js';`

- [ ] **Step 3: Run tests — 15 new should fail**

Expected: 27 prior pass + 15 filesystem fail.

- [ ] **Step 4: Implement `js/filesystem.js`**

```javascript
// js/filesystem.js
// Simulated filesystem with /prj and /scratch visibility rules.
// HOME is /prj/palmvein/unseen (NFS, login-node only on v1).
// /scratch is visible everywhere.
import { INITIAL_FS } from '../data/initial-fs.js';

const HOME = '/prj/palmvein/unseen';

export function createFilesystem() {
    const root = structuredClone(INITIAL_FS);
    let cwd = HOME;
    let lastCwd = HOME;
    let hostname = 'sdumont15'; // default to login node

    function splitPath(p) {
        return p.split('/').filter(Boolean);
    }

    function normalize(absPath) {
        const parts = [];
        for (const seg of splitPath(absPath)) {
            if (seg === '.') continue;
            if (seg === '..') parts.pop();
            else parts.push(seg);
        }
        return '/' + parts.join('/');
    }

    function resolve(p) {
        if (!p) return cwd;
        if (p === '~') return HOME;
        if (p.startsWith('~/')) p = HOME + p.slice(1);
        if (p === '-') return lastCwd;
        const abs = p.startsWith('/') ? p : cwd + '/' + p;
        return normalize(abs);
    }

    function lookup(absPath) {
        const parts = splitPath(absPath);
        let node = root['/'];
        for (const part of parts) {
            if (!node.children || !node.children[part]) return null;
            node = node.children[part];
        }
        return node;
    }

    function parentAndName(absPath) {
        const parts = splitPath(absPath);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        return { parent: lookup(parentPath), name, parentPath };
    }

    function isVisibleHere(node, absPath) {
        if (!node) return false;
        if (node.visibility === 'all') return true;
        if (node.visibility === 'login') {
            return hostname.match(/^sdumont1[5-8]$/);
        }
        return false;
    }

    return {
        pwd() { return cwd; },

        cd(p) {
            let target = resolve(p);
            const node = lookup(target);
            if (!node || !isVisibleHere(node, target)) {
                throw new Error(`cd: ${p}: No such file or directory`);
            }
            if (node.type !== 'dir') {
                throw new Error(`cd: ${p}: Not a directory`);
            }
            lastCwd = cwd;
            cwd = target;
        },

        ls(p) {
            const target = resolve(p || '.');
            const node = lookup(target);
            if (!node || !isVisibleHere(node, target)) {
                throw new Error(`ls: cannot access '${p || '.'}': No such file or directory`);
            }
            if (node.type === 'file') {
                return [{ name: target.split('/').pop(), type: 'file' }];
            }
            return Object.entries(node.children).map(([name, child]) => ({ name, type: child.type }));
        },

        cat(p) {
            const target = resolve(p);
            const node = lookup(target);
            if (!node || !isVisibleHere(node, target)) {
                throw new Error(`cat: ${p}: No such file or directory`);
            }
            if (node.type === 'dir') {
                throw new Error(`cat: ${p}: Is a directory`);
            }
            return node.content;
        },

        mkdir(p) {
            const target = resolve(p);
            const { parent, name } = parentAndName(target);
            if (!parent || parent.type !== 'dir') {
                throw new Error(`mkdir: cannot create directory '${p}': No such file or directory`);
            }
            if (parent.children[name]) {
                throw new Error(`mkdir: cannot create directory '${p}': File exists`);
            }
            parent.children[name] = { type: 'dir', visibility: parent.visibility, children: {} };
        },

        write(p, content) {
            const target = resolve(p);
            const { parent, name } = parentAndName(target);
            if (!parent || parent.type !== 'dir') {
                throw new Error(`write: cannot write '${p}': No such directory`);
            }
            if (parent.children[name] && parent.children[name].type === 'dir') {
                throw new Error(`write: ${p}: Is a directory`);
            }
            parent.children[name] = { type: 'file', visibility: parent.visibility, content };
        },

        resolve,

        setHost(host) { hostname = host; },
        getHost() { return hostname; }
    };
}
```

- [ ] **Step 5: Run tests — all 15 should pass**

Expected: `42 passed, 0 failed, 42 total`.

- [ ] **Step 6: Commit**

```bash
git add data/initial-fs.js js/filesystem.js tests/filesystem.test.js tests.html
git commit -m "feat(filesystem): simulated FS with /prj /scratch visibility rules"
```

---

### Task 1.5: Fictional users + recurring job submission

**Files:**
- Create: `js/users.js`
- Create: `data/initial-users.js`
- Create: `tests/users.test.js`
- Modify: `tests.html`

Populates the cluster with other fictional users cycling jobs to give the dashboard life. Data from spec §5.5.

- [ ] **Step 1: Create `data/initial-users.js`**

```javascript
// data/initial-users.js
// Fictional users and their recurring job templates.
// Inspired by real LNCC workloads (per research/findings.md §11).
export const FICTIONAL_USERS = [
    {
        login: 'slima', displayName: 'Dra. Silvia Lima (LNCC)',
        project: 'lnccdm', projectFullName: 'Dinâmica molecular de proteínas',
        jobs: [
            { partition: 'sequana_cpu', nodes: 8, gpus: 0, cpus: 384, memGB: 2048, walltimeSec: 50000, name: 'gromacs-md', script: '/scratch/lnccdm/slima/md.srm' }
        ],
        resubmitInterval: 80000
    },
    {
        login: 'rmartins', displayName: 'Prof. R. Martins (UFRJ)',
        project: 'ufrjml', projectFullName: 'Fine-tuning de LLM de código',
        jobs: [
            { partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 40000, name: 'llm-finetune', script: '/scratch/ufrjml/rmartins/finetune.srm' }
        ],
        resubmitInterval: 45000
    },
    {
        login: 'bioinfo01', displayName: 'FioCruz Bioinfo',
        project: 'fiobio', projectFullName: 'Genômica de arboviroses',
        jobs: [
            { partition: 'sequana_cpu_bigmem', nodes: 4, gpus: 0, cpus: 192, memGB: 2800, walltimeSec: 30000, name: 'star-align', script: '/scratch/fiobio/bioinfo01/align.srm' }
        ],
        resubmitInterval: 60000
    },
    {
        login: 'cfdteam', displayName: 'CFD INPE',
        project: 'inpecfd', projectFullName: 'CFD oceânico',
        jobs: [
            { partition: 'sequana_cpu_long', nodes: 16, gpus: 0, cpus: 768, memGB: 6144, walltimeSec: 200000, name: 'openfoam-run', script: '/scratch/inpecfd/cfdteam/run.srm' }
        ],
        resubmitInterval: 250000
    },
    {
        login: 'astrolab', displayName: 'Observatório Nacional',
        project: 'oncosm', projectFullName: 'Cosmologia N-corpos',
        jobs: [
            { partition: 'sequana_gpu', nodes: 1, gpus: 4, cpus: 48, memGB: 384, walltimeSec: 20000, name: 'gadget-run', script: '/scratch/oncosm/astrolab/nbody.srm' }
        ],
        resubmitInterval: 30000
    },
    {
        login: 'hemodin', displayName: 'Hemodinâmica LNCC',
        project: 'lncchd', projectFullName: 'Hemodinâmica computacional',
        jobs: [
            { partition: 'sequana_cpu', nodes: 4, gpus: 0, cpus: 192, memGB: 1536, walltimeSec: 25000, name: 'fenics-sim', script: '/scratch/lncchd/hemodin/sim.srm' }
        ],
        resubmitInterval: 40000
    }
];
```

- [ ] **Step 2: Write failing tests for user cycling**

Create `tests/users.test.js`:

```javascript
// tests/users.test.js
import { suite, test, assertEqual, assertTrue } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';
import { seedFictionalJobs, cycleFictionalJobs } from '../js/users.js';

suite('users');

test('seedFictionalJobs adds one job per fictional user', () => {
    const c = createCluster();
    seedFictionalJobs(c);
    const unique = new Set(c.jobs.map(j => j.user));
    assertTrue(unique.size >= 6);
});

test('seeded jobs are in PD or R (scheduler runs immediately)', () => {
    const c = createCluster();
    seedFictionalJobs(c);
    c.scheduleQueue();
    assertTrue(c.jobs.every(j => j.state === 'PD' || j.state === 'R'));
});

test('cycleFictionalJobs resubmits after simulated interval', () => {
    const c = createCluster();
    seedFictionalJobs(c);
    const initialCount = c.jobs.length;
    // Fast-forward by a lot — all jobs should complete and at least one resubmission happens
    for (let i = 0; i < 500; i++) c.tick(2000);
    cycleFictionalJobs(c);
    assertTrue(c.jobs.length >= initialCount);
});
```

Register in `tests.html`.

- [ ] **Step 3: Run tests — 3 new should fail**

- [ ] **Step 4: Implement `js/users.js`**

```javascript
// js/users.js
// Seeding and cycling of fictional users' jobs to give the cluster life.
import { FICTIONAL_USERS } from '../data/initial-users.js';

export function seedFictionalJobs(cluster) {
    for (const user of FICTIONAL_USERS) {
        for (const jobTemplate of user.jobs) {
            cluster.submitJob({
                user: user.login,
                ...jobTemplate
            });
        }
    }
}

// Called periodically (e.g. every few ticks) from the main loop in Task 3.3.
// Re-adds a job if the same user has no running/pending job left.
export function cycleFictionalJobs(cluster) {
    for (const user of FICTIONAL_USERS) {
        const active = cluster.jobs.find(
            j => j.user === user.login && (j.state === 'PD' || j.state === 'R')
        );
        if (!active) {
            const template = user.jobs[0];
            cluster.submitJob({ user: user.login, ...template });
        }
    }
}

export { FICTIONAL_USERS };
```

- [ ] **Step 5: Run tests — 3 pass**

Expected: `45 passed, 0 failed, 45 total`.

- [ ] **Step 6: Commit**

```bash
git add data/initial-users.js js/users.js tests/users.test.js tests.html
git commit -m "feat(users): 6 fictional users cycling jobs to populate the cluster"
```

---

## Phase 2 — Terminal and commands

### Task 2.1: Terminal core (prompt, input, output, history)

**Files:**
- Create: `js/terminal.js`
- Create: `tests/terminal.test.js`
- Modify: `tests.html`

Logic-only terminal module: maintains state (prompt, input buffer, command history, stdout lines), exposes imperative functions, does NOT touch the DOM directly. The DOM binding lives in `main.js` in Phase 4. This separation makes it testable.

- [ ] **Step 1: Write failing tests for terminal state machine**

Create `tests/terminal.test.js`:

```javascript
// tests/terminal.test.js
import { suite, test, assertEqual, assertTrue } from '../js/test-harness.js';
import { createTerminal } from '../js/terminal.js';

suite('terminal');

test('initial prompt is local pedro@local', () => {
    const t = createTerminal();
    assertEqual(t.getPrompt(), 'pedro@local:~$ ');
});

test('setPrompt updates display', () => {
    const t = createTerminal();
    t.setPrompt('unseen@sdumont15', '/prj/palmvein/unseen');
    assertEqual(t.getPrompt(), 'unseen@sdumont15:~$ ');
});

test('setPrompt shows short path when not home', () => {
    const t = createTerminal();
    t.setPrompt('unseen@sdumont15', '/scratch/palmvein/unseen');
    assertEqual(t.getPrompt(), 'unseen@sdumont15:/scratch/palmvein/unseen$ ');
});

test('appendOutput adds lines to stdout', () => {
    const t = createTerminal();
    t.appendOutput('hello world');
    t.appendOutput('segunda linha');
    assertEqual(t.getOutput(), ['hello world', 'segunda linha']);
});

test('clear empties the output buffer', () => {
    const t = createTerminal();
    t.appendOutput('foo');
    t.clear();
    assertEqual(t.getOutput(), []);
});

test('addToHistory deduplicates consecutive duplicates', () => {
    const t = createTerminal();
    t.addToHistory('ls');
    t.addToHistory('ls');
    t.addToHistory('pwd');
    assertEqual(t.getHistory(), ['ls', 'pwd']);
});

test('history navigation up/down returns correct entry', () => {
    const t = createTerminal();
    t.addToHistory('ls');
    t.addToHistory('pwd');
    t.addToHistory('whoami');
    assertEqual(t.historyUp(), 'whoami');
    assertEqual(t.historyUp(), 'pwd');
    assertEqual(t.historyUp(), 'ls');
    assertEqual(t.historyUp(), 'ls'); // stops at start
    assertEqual(t.historyDown(), 'pwd');
    assertEqual(t.historyDown(), 'whoami');
    assertEqual(t.historyDown(), '');  // past end
});
```

Register in `tests.html`: `import '../tests/terminal.test.js';`

- [ ] **Step 2: Run tests — 8 new should fail**

- [ ] **Step 3: Implement `js/terminal.js`**

```javascript
// js/terminal.js
// Headless terminal state. The DOM binding is in main.js (Phase 4).
// Responsibilities:
//   - Prompt string (based on user@host + cwd)
//   - Output buffer (stdout lines)
//   - Command history with up/down navigation
//   - Deduplication of consecutive history entries
//
// NOT responsible for: parsing commands, executing commands, DOM updates.

const HOME = '/prj/palmvein/unseen';

export function createTerminal() {
    let prompt = 'pedro@local:~$ ';
    let userHost = 'pedro@local';
    let cwd = '~';
    const output = [];
    const history = [];
    let historyIndex = -1;

    function buildPrompt() {
        const shortPath = cwd === HOME ? '~' : cwd;
        prompt = `${userHost}:${shortPath}$ `;
    }

    return {
        getPrompt() { return prompt; },

        setPrompt(uh, realCwd) {
            userHost = uh;
            cwd = realCwd;
            buildPrompt();
        },

        getUserHost() { return userHost; },

        appendOutput(line) { output.push(line); },

        getOutput() { return [...output]; },

        clear() { output.length = 0; },

        addToHistory(cmd) {
            if (!cmd) return;
            if (history.length > 0 && history[history.length - 1] === cmd) return;
            history.push(cmd);
            historyIndex = history.length;
        },

        getHistory() { return [...history]; },

        historyUp() {
            if (history.length === 0) return '';
            historyIndex = Math.max(0, historyIndex - 1);
            return history[historyIndex];
        },

        historyDown() {
            if (history.length === 0) return '';
            historyIndex = Math.min(history.length, historyIndex + 1);
            if (historyIndex >= history.length) return '';
            return history[historyIndex];
        }
    };
}
```

- [ ] **Step 4: Run tests — 8 pass**

Expected: `53 passed, 0 failed, 53 total`.

- [ ] **Step 5: Commit**

```bash
git add js/terminal.js tests/terminal.test.js tests.html
git commit -m "feat(terminal): headless state machine with prompt, output, and history"
```

---

### Task 2.2: Command parser + dispatch registry

**Files:**
- Create: `js/commands/parser.js`
- Create: `js/commands/index.js`
- Create: `tests/parser.test.js`

Tokenizer respects quotes and escapes. Dispatcher looks up commands in a registry and calls `cmd.run(args, ctx)`. The `ctx` is `{ cluster, filesystem, terminal, state, currentUser }` — whatever a command might need.

- [ ] **Step 1: Write failing parser tests**

Create `tests/parser.test.js`:

```javascript
// tests/parser.test.js
import { suite, test, assertEqual } from '../js/test-harness.js';
import { tokenize } from '../js/commands/parser.js';

suite('parser');

test('simple tokens', () => {
    assertEqual(tokenize('ls -la /prj'), ['ls', '-la', '/prj']);
});

test('double-quoted string is one token', () => {
    assertEqual(tokenize('echo "hello world"'), ['echo', 'hello world']);
});

test('single-quoted string is one token', () => {
    assertEqual(tokenize("echo 'hello world'"), ['echo', 'hello world']);
});

test('mixed quotes', () => {
    assertEqual(tokenize('echo "a b" c \'d e\''), ['echo', 'a b', 'c', 'd e']);
});

test('extra whitespace collapsed', () => {
    assertEqual(tokenize('  ls    -la   '), ['ls', '-la']);
});

test('empty string returns empty array', () => {
    assertEqual(tokenize(''), []);
});

test('escaped space inside double quotes', () => {
    assertEqual(tokenize('cat "my file.txt"'), ['cat', 'my file.txt']);
});

test('equals sign kept in token', () => {
    assertEqual(tokenize('--partition=gdl'), ['--partition=gdl']);
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 8 new should fail**

- [ ] **Step 3: Implement `js/commands/parser.js`**

```javascript
// js/commands/parser.js
// Tokenizer that respects single/double quotes. Not a full shell parser —
// doesn't handle $var, `subshells`, $(), $?, &, |, >, <, ;, etc.
// The simulator doesn't need those in v1.
export function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
        // Skip whitespace
        while (i < input.length && /\s/.test(input[i])) i++;
        if (i >= input.length) break;

        let token = '';
        if (input[i] === '"' || input[i] === "'") {
            const quote = input[i++];
            while (i < input.length && input[i] !== quote) {
                token += input[i++];
            }
            i++; // skip closing quote
        } else {
            while (i < input.length && !/\s/.test(input[i])) {
                token += input[i++];
            }
        }
        tokens.push(token);
    }
    return tokens;
}
```

- [ ] **Step 4: Run tests — 8 pass**

- [ ] **Step 5: Implement `js/commands/index.js` — dispatch registry**

```javascript
// js/commands/index.js
// Central registry for all shell commands.
// Each command module calls `register({ name, run, help, aliases, onHost })`.
// The dispatcher looks up by name and invokes `run(args, ctx)`.
// ctx: { cluster, filesystem, terminal, state, currentUser, hostname }

const REGISTRY = new Map();

export function register(cmd) {
    REGISTRY.set(cmd.name, cmd);
    if (cmd.aliases) {
        for (const alias of cmd.aliases) REGISTRY.set(alias, cmd);
    }
}

export function listCommands() {
    return [...new Set(REGISTRY.values())].map(c => ({ name: c.name, help: c.help }));
}

export function dispatch(tokens, ctx) {
    if (tokens.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
    const [name, ...args] = tokens;
    const cmd = REGISTRY.get(name);
    if (!cmd) {
        return { stdout: '', stderr: `bash: ${name}: comando não encontrado`, exitCode: 127 };
    }
    if (cmd.onHost && !cmd.onHost(ctx.hostname)) {
        return { stdout: '', stderr: `${name}: command not available on this host`, exitCode: 1 };
    }
    try {
        const result = cmd.run(args, ctx);
        if (typeof result === 'string') return { stdout: result, stderr: '', exitCode: 0 };
        return { stdout: result.stdout || '', stderr: result.stderr || '', exitCode: result.exitCode || 0 };
    } catch (e) {
        return { stdout: '', stderr: e.message, exitCode: 1 };
    }
}

export { REGISTRY };
```

- [ ] **Step 6: Commit**

```bash
git add js/commands/parser.js js/commands/index.js tests/parser.test.js tests.html
git commit -m "feat(commands): tokenizer with quote support and dispatch registry"
```

---

### Task 2.3: Filesystem commands (ls, cd, pwd, cat, mkdir, whoami, hostname, date, clear, help, exit)

**Files:**
- Create: `js/commands/fs.js`
- Create: `tests/commands-fs.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/commands-fs.test.js`:

```javascript
// tests/commands-fs.test.js
import { suite, test, assertEqual, assertContains, assertTrue } from '../js/test-harness.js';
import { dispatch } from '../js/commands/index.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';
import '../js/commands/fs.js';

suite('commands-fs');

function ctx() {
    return {
        cluster: null,
        filesystem: createFilesystem(),
        terminal: createTerminal(),
        state: null,
        currentUser: 'unseen',
        hostname: 'sdumont15'
    };
}

test('pwd returns current directory', () => {
    const c = ctx();
    const r = dispatch(['pwd'], c);
    assertEqual(r.stdout.trim(), '/prj/palmvein/unseen');
});

test('ls lists directory contents', () => {
    const c = ctx();
    const r = dispatch(['ls'], c);
    assertContains(r.stdout, 'code');
    assertContains(r.stdout, 'train_palmvein.srm');
});

test('ls -la shows type indicators', () => {
    const c = ctx();
    const r = dispatch(['ls', '-la'], c);
    assertContains(r.stdout, 'code');
});

test('cd changes directory', () => {
    const c = ctx();
    dispatch(['cd', 'code'], c);
    assertEqual(c.filesystem.pwd(), '/prj/palmvein/unseen/code');
});

test('cd to nonexistent path sets stderr', () => {
    const c = ctx();
    const r = dispatch(['cd', '/nope'], c);
    assertContains(r.stderr, 'No such file');
});

test('cat prints file content', () => {
    const c = ctx();
    const r = dispatch(['cat', 'code/requirements.txt'], c);
    assertContains(r.stdout, 'torch');
});

test('mkdir creates directory', () => {
    const c = ctx();
    dispatch(['mkdir', 'foo'], c);
    const ls = dispatch(['ls'], c);
    assertContains(ls.stdout, 'foo');
});

test('whoami returns current user', () => {
    const c = ctx();
    const r = dispatch(['whoami'], c);
    assertEqual(r.stdout.trim(), 'unseen');
});

test('hostname returns host', () => {
    const c = ctx();
    const r = dispatch(['hostname'], c);
    assertEqual(r.stdout.trim(), 'sdumont15');
});

test('clear returns no output and empties terminal buffer', () => {
    const c = ctx();
    c.terminal.appendOutput('old');
    const r = dispatch(['clear'], c);
    assertEqual(c.terminal.getOutput(), []);
});

test('help lists available commands', () => {
    const c = ctx();
    const r = dispatch(['help'], c);
    assertContains(r.stdout, 'ls');
    assertContains(r.stdout, 'cd');
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 11 should fail**

- [ ] **Step 3: Implement `js/commands/fs.js`**

```javascript
// js/commands/fs.js
// Filesystem and shell built-in commands.
import { register, listCommands } from './index.js';

register({
    name: 'pwd',
    help: 'Mostra o diretório atual',
    run: (args, ctx) => ctx.filesystem.pwd() + '\n'
});

register({
    name: 'ls',
    help: 'Lista o conteúdo do diretório (flags: -l, -a, -la)',
    run: (args, ctx) => {
        const flags = args.filter(a => a.startsWith('-')).join('');
        const paths = args.filter(a => !a.startsWith('-'));
        const target = paths[0] || '.';
        const entries = ctx.filesystem.ls(target);
        if (flags.includes('l')) {
            return entries.map(e => {
                const typeChar = e.type === 'dir' ? 'd' : '-';
                return `${typeChar}rw-r--r--  1 unseen  unseen  ${e.type === 'dir' ? '4096' : '  128'}  Apr 11 17:30  ${e.name}`;
            }).join('\n') + '\n';
        }
        return entries.map(e => e.type === 'dir' ? e.name + '/' : e.name).join('  ') + '\n';
    }
});

register({
    name: 'cd',
    help: 'Muda de diretório. `cd ~` vai pra HOME, `cd -` volta ao anterior.',
    run: (args, ctx) => {
        const target = args[0] || '~';
        ctx.filesystem.cd(target);
        return '';
    }
});

register({
    name: 'cat',
    help: 'Mostra o conteúdo de um arquivo',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('cat: faltando operando');
        return ctx.filesystem.cat(args[0]);
    }
});

register({
    name: 'mkdir',
    help: 'Cria um diretório',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('mkdir: faltando operando');
        ctx.filesystem.mkdir(args[0]);
        return '';
    }
});

register({
    name: 'whoami',
    help: 'Mostra o usuário atual',
    run: (args, ctx) => ctx.currentUser + '\n'
});

register({
    name: 'hostname',
    help: 'Mostra o nome da máquina atual',
    run: (args, ctx) => ctx.hostname + '\n'
});

register({
    name: 'date',
    help: 'Mostra data e hora atuais',
    run: () => new Date().toString() + '\n'
});

register({
    name: 'uptime',
    help: 'Mostra quanto tempo o sistema está ligado',
    run: () => ' 15:42:11 up 203 days,  4:17,  12 users,  load average: 2.31, 2.09, 1.88\n'
});

register({
    name: 'clear',
    aliases: ['cls'],
    help: 'Limpa o terminal',
    run: (args, ctx) => {
        ctx.terminal.clear();
        return '';
    }
});

register({
    name: 'history',
    help: 'Mostra o histórico de comandos digitados',
    run: (args, ctx) => {
        const hist = ctx.terminal.getHistory();
        return hist.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n') + '\n';
    }
});

register({
    name: 'help',
    aliases: ['?'],
    help: 'Lista os comandos suportados pelo simulador',
    run: () => {
        const cmds = listCommands().sort((a, b) => a.name.localeCompare(b.name));
        const lines = ['Comandos disponíveis neste simulador:', ''];
        for (const c of cmds) {
            lines.push(`  ${c.name.padEnd(14)}  ${c.help || ''}`);
        }
        lines.push('');
        lines.push('Dica: use Tab para autocompletar e ↑/↓ para navegar no histórico.');
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'exit',
    help: 'Desconecta da máquina atual (SSH). Na máquina local, não faz nada.',
    run: (args, ctx) => {
        if (ctx.hostname.startsWith('sdumont')) {
            return { stdout: 'logout\nConnection to sdumont closed.\n', signal: 'exit-ssh' };
        }
        return '';
    }
});
```

- [ ] **Step 4: Run tests — 11 pass**

Expected: `72 passed, 0 failed, 72 total`.

- [ ] **Step 5: Commit**

```bash
git add js/commands/fs.js tests/commands-fs.test.js tests.html
git commit -m "feat(commands): basic shell builtins (pwd, ls, cd, cat, mkdir, whoami, help, ...)"
```

---

### Task 2.4: SSH / transfer commands (ssh, scp, rsync)

**Files:**
- Create: `js/commands/ssh.js`
- Create: `tests/commands-ssh.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/commands-ssh.test.js
import { suite, test, assertEqual, assertContains } from '../js/test-harness.js';
import { dispatch } from '../js/commands/index.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';
import '../js/commands/ssh.js';
import '../js/commands/fs.js';

suite('commands-ssh');

function ctx(hostname = 'local') {
    return {
        cluster: null, filesystem: createFilesystem(), terminal: createTerminal(),
        state: null, currentUser: hostname === 'local' ? 'pedro' : 'unseen',
        hostname
    };
}

test('ssh to sdumont15 changes host', () => {
    const c = ctx();
    const r = dispatch(['ssh', 'unseen@sdumont15'], c);
    assertContains(r.stdout, 'Welcome');
    assertEqual(c.hostname, 'sdumont15');
    assertEqual(c.currentUser, 'unseen');
});

test('ssh with fqdn login.sdumont.lncc.br works', () => {
    const c = ctx();
    const r = dispatch(['ssh', 'unseen@login.sdumont.lncc.br'], c);
    assertContains(r.stdout, 'Welcome');
    assertContains(c.hostname, 'sdumont');
});

test('ssh random landing (15..18)', () => {
    const c = ctx();
    dispatch(['ssh', 'unseen@login.sdumont.lncc.br'], c);
    assertTrue(['sdumont15','sdumont16','sdumont17','sdumont18'].includes(c.hostname));
});

test('scp shows progress and creates file in destination', () => {
    const c = ctx();
    // Seed a local file first
    c.filesystem.write('/tmp/dataset.tar.gz', 'fake tarball');
    const r = dispatch(['scp', '/tmp/dataset.tar.gz', 'unseen@sdumont15:/scratch/palmvein/unseen/'], c);
    assertContains(r.stdout, '100%');
});

test('scp to bad host fails', () => {
    const c = ctx();
    const r = dispatch(['scp', '/tmp/foo', 'unseen@garbage:/tmp/'], c);
    assertContains(r.stderr, 'unknown host');
});

function assertTrue(v, msg) { if (!v) throw new Error(msg || 'assertTrue failed'); }
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 5 fail**

- [ ] **Step 3: Implement `js/commands/ssh.js`**

```javascript
// js/commands/ssh.js
// Pseudo-SSH: changes the ctx to simulate being inside the SDumont login node.
// Supports: ssh, scp, rsync. The FQDN login.sdumont.lncc.br is accepted even
// though it's not in the v1 wiki — the course transcripts confirm it.
import { register } from './index.js';

const LOGIN_NODES = ['sdumont15', 'sdumont16', 'sdumont17', 'sdumont18'];

function parseHost(spec) {
    const m = spec.match(/^([^@]+)@(.+)$/);
    if (!m) return null;
    const [, user, host] = m;
    if (host === 'login.sdumont.lncc.br' || host === 'login.sdumont.lncc' || host === 'sdumont') {
        // Random landing on one of the available login nodes (spec: non-deterministic)
        const landed = LOGIN_NODES[Math.floor(Math.random() * 2) + 2]; // 17 or 18 bias (per Bidu's live experience)
        return { user, host: landed };
    }
    if (LOGIN_NODES.includes(host)) return { user, host };
    return { user, host, unknown: true };
}

register({
    name: 'ssh',
    help: 'Conecta a um host remoto via SSH',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('usage: ssh user@host');
        const parsed = parseHost(args[0]);
        if (!parsed) throw new Error(`ssh: invalid argument '${args[0]}'`);
        if (parsed.unknown) {
            return { stdout: '', stderr: `ssh: Could not resolve hostname ${parsed.host}: unknown host`, exitCode: 1 };
        }
        // Change context
        ctx.hostname = parsed.host;
        ctx.currentUser = parsed.user;
        ctx.filesystem.setHost(parsed.host);
        ctx.filesystem.cd('/prj/palmvein/unseen'); // HOME on v1
        const banner = [
            '',
            `Last login: Fri Apr 11 15:42:01 2026 from user-local`,
            `Welcome to Santos Dumont (Expansão v1 — 2019)`,
            `Login node: ${parsed.host}`,
            ``,
            `Importante: não execute workloads neste nó — use sbatch.`,
            `Manual: https://github.com/lncc-sered/manual-sdumont/wiki`,
            ''
        ].join('\n');
        ctx.terminal.setPrompt(`${parsed.user}@${parsed.host}`, '/prj/palmvein/unseen');
        return banner;
    }
});

register({
    name: 'scp',
    help: 'Copia arquivos entre sua máquina e um host remoto',
    run: (args, ctx) => {
        if (args.length < 2) throw new Error('usage: scp SOURCE DEST');
        const [src, dst] = args;
        // Check dst host validity
        const remoteMatch = dst.match(/^([^@]+)@([^:]+):(.+)$/);
        if (!remoteMatch) {
            // Local copy — just noop
            return '';
        }
        const [, , host] = remoteMatch;
        if (host !== 'login.sdumont.lncc.br' && !LOGIN_NODES.includes(host)) {
            return { stdout: '', stderr: `ssh: Could not resolve hostname ${host}: unknown host`, exitCode: 1 };
        }
        // Simulate progress bar
        const out = [];
        out.push(`${src}                                    100%  850MB  42.5MB/s   00:20`);
        return out.join('\n') + '\n';
    }
});

register({
    name: 'rsync',
    help: 'Sincroniza arquivos/diretórios com progresso e resume',
    run: (args, ctx) => {
        // Simulate rsync output
        return [
            'sending incremental file list',
            './',
            'dataset/image_001.png',
            'dataset/image_002.png',
            '(... snip ...)',
            'dataset/image_12484.png',
            '',
            'sent 843,221,505 bytes  received 245,120 bytes  24,101,904 bytes/sec',
            'total size is 843,001,220  speedup is 1.00',
            ''
        ].join('\n');
    }
});
```

- [ ] **Step 4: Run tests — 5 pass**

Expected: `77 passed, 0 failed, 77 total`.

- [ ] **Step 5: Commit**

```bash
git add js/commands/ssh.js tests/commands-ssh.test.js tests.html
git commit -m "feat(commands): ssh/scp/rsync with random login node landing"
```

---

### Task 2.5: Environment Modules commands

**Files:**
- Create: `js/commands/modules.js`
- Create: `data/modules-catalog.js`
- Create: `tests/commands-modules.test.js`

- [ ] **Step 1: Create `data/modules-catalog.js`** — realistic module list from wiki

```javascript
// data/modules-catalog.js
// Catalog of modules available on SDumont v1, from research/findings.md §4.
// Format: category/name/version_sequana
export const AVAILABLE_MODULES = [
    { name: 'gcc/4.9.3_sequana',                category: 'Compilers', whatis: 'GNU Compiler Collection 4.9.3' },
    { name: 'cuda/11.2_sequana',                category: 'GPU',       whatis: 'NVIDIA CUDA Toolkit 11.2' },
    { name: 'openmpi/gnu/4.1.1_sequana',        category: 'MPI',       whatis: 'OpenMPI 4.1.1 compiled with GCC' },
    { name: 'openmpi/gnu/4.1.4_sequana',        category: 'MPI',       whatis: 'OpenMPI 4.1.4 compiled with GCC' },
    { name: 'openmpi/gnu/4.1.2+cuda-11.2_sequana', category: 'MPI',    whatis: 'OpenMPI 4.1.2 with CUDA support' },
    { name: 'openmpi/2.0.4.2',                  category: 'MPI',       whatis: 'OpenMPI 2.0.4 legacy' },
    { name: 'mpich/3.3.2',                      category: 'MPI',       whatis: 'MPICH 3.3.2' },
    { name: 'intel_psxe/2017_sequana',          category: 'Compilers', whatis: 'Intel Parallel Studio XE 2017 (legacy)' },
    { name: 'intel_psxe/2020_sequana',          category: 'Compilers', whatis: 'Intel Parallel Studio XE 2020 (legacy)' },
    { name: 'intel-oneapi/2022_sequana',        category: 'Compilers', whatis: 'Intel oneAPI Base + HPC 2022' },
    { name: 'intel-oneapi/2025.0_sequana',      category: 'Compilers', whatis: 'Intel oneAPI 2025.0 — use icx/icpx/ifx' },
    { name: 'anaconda3/2024.02_sequana',        category: 'Python',    whatis: 'Anaconda Python 3 distribution' },
    { name: 'singularity/3.10',                 category: 'Container', whatis: 'Singularity container runtime' }
];
```

- [ ] **Step 2: Write failing tests**

```javascript
// tests/commands-modules.test.js
import { suite, test, assertEqual, assertContains } from '../js/test-harness.js';
import { dispatch } from '../js/commands/index.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';
import '../js/commands/modules.js';

suite('commands-modules');

function ctx() {
    return {
        cluster: null, filesystem: createFilesystem(), terminal: createTerminal(),
        state: { loadedModules: [] },
        currentUser: 'unseen', hostname: 'sdumont15'
    };
}

test('module avail lists known modules', () => {
    const c = ctx();
    const r = dispatch(['module', 'avail'], c);
    assertContains(r.stdout, 'cuda/11.2_sequana');
    assertContains(r.stdout, 'anaconda3/2024.02_sequana');
});

test('module load records the module', () => {
    const c = ctx();
    dispatch(['module', 'load', 'cuda/11.2_sequana'], c);
    assertEqual(c.state.loadedModules, ['cuda/11.2_sequana']);
});

test('module list shows loaded modules', () => {
    const c = ctx();
    dispatch(['module', 'load', 'cuda/11.2_sequana'], c);
    dispatch(['module', 'load', 'anaconda3/2024.02_sequana'], c);
    const r = dispatch(['module', 'list'], c);
    assertContains(r.stdout, 'cuda/11.2_sequana');
    assertContains(r.stdout, 'anaconda3/2024.02_sequana');
});

test('module unload removes the module', () => {
    const c = ctx();
    dispatch(['module', 'load', 'cuda/11.2_sequana'], c);
    dispatch(['module', 'unload', 'cuda/11.2_sequana'], c);
    assertEqual(c.state.loadedModules, []);
});

test('module whatis returns description', () => {
    const c = ctx();
    const r = dispatch(['module', 'whatis', 'cuda/11.2_sequana'], c);
    assertContains(r.stdout, 'CUDA');
});

test('module purge returns v1-specific error', () => {
    const c = ctx();
    const r = dispatch(['module', 'purge'], c);
    assertContains(r.stderr, 'not supported');
});

test('module spider returns v1-specific error', () => {
    const c = ctx();
    const r = dispatch(['module', 'spider'], c);
    assertContains(r.stderr, 'not supported');
});

test('module load unknown name fails', () => {
    const c = ctx();
    const r = dispatch(['module', 'load', 'pytorch/2.0'], c);
    assertContains(r.stderr, 'not found');
});
```

Register in `tests.html`.

- [ ] **Step 3: Run tests — 8 fail**

- [ ] **Step 4: Implement `js/commands/modules.js`**

```javascript
// js/commands/modules.js
// Environment Modules (classic, NOT Lmod). No `module purge` or `module spider`.
import { register } from './index.js';
import { AVAILABLE_MODULES } from '../data/modules-catalog.js';

function findModule(name) {
    return AVAILABLE_MODULES.find(m => m.name === name);
}

register({
    name: 'module',
    help: 'Gerenciador de módulos de ambiente. Subcomandos: avail, load, unload, list, whatis, help, purge (não suportado)',
    run: (args, ctx) => {
        if (!ctx.state.loadedModules) ctx.state.loadedModules = [];
        const sub = args[0];
        if (!sub) throw new Error('usage: module <avail|load|unload|list|whatis|...>');

        if (sub === 'avail') {
            const filter = args[1];
            const byCat = new Map();
            for (const m of AVAILABLE_MODULES) {
                if (filter && !m.name.includes(filter)) continue;
                if (!byCat.has(m.category)) byCat.set(m.category, []);
                byCat.get(m.category).push(m.name);
            }
            const out = ['', '------------------------------ /opt/modules/sdumont ------------------------------'];
            for (const [cat, names] of byCat.entries()) {
                out.push('');
                out.push(`-- ${cat}`);
                out.push(names.join('  '));
            }
            out.push('');
            return out.join('\n');
        }

        if (sub === 'load') {
            const name = args[1];
            if (!findModule(name)) {
                return { stdout: '', stderr: `module: ERROR: Module '${name}' not found`, exitCode: 1 };
            }
            if (!ctx.state.loadedModules.includes(name)) ctx.state.loadedModules.push(name);
            return '';
        }

        if (sub === 'unload') {
            const name = args[1];
            ctx.state.loadedModules = ctx.state.loadedModules.filter(m => m !== name);
            return '';
        }

        if (sub === 'list') {
            if (ctx.state.loadedModules.length === 0) return 'No modules loaded\n';
            const out = ['', 'Currently Loaded Modulefiles:'];
            ctx.state.loadedModules.forEach((m, i) => out.push(`  ${i + 1}) ${m}`));
            out.push('');
            return out.join('\n');
        }

        if (sub === 'whatis') {
            const name = args[1];
            const mod = findModule(name);
            if (!mod) return { stdout: '', stderr: `module: ERROR: Module '${name}' not found`, exitCode: 1 };
            return `${mod.name}: ${mod.whatis}\n`;
        }

        if (sub === 'help') {
            return 'module [avail|load|unload|list|whatis] <name>\n';
        }

        if (sub === 'purge') {
            return { stdout: '', stderr: "module: ERROR: 'purge' is not supported on SDumont v1. Use 'module unload' instead.", exitCode: 1 };
        }

        if (sub === 'spider') {
            return { stdout: '', stderr: "module: ERROR: 'spider' is not supported on SDumont v1 (Lmod-only subcommand).", exitCode: 1 };
        }

        return { stdout: '', stderr: `module: ERROR: unknown subcommand '${sub}'`, exitCode: 1 };
    }
});
```

- [ ] **Step 5: Run tests — 8 pass**

Expected: `85 passed`.

- [ ] **Step 6: Commit**

```bash
git add js/commands/modules.js data/modules-catalog.js tests/commands-modules.test.js tests.html
git commit -m "feat(commands): Environment Modules with v1-accurate catalog and behavior"
```

---

### Task 2.6: SLURM commands (sbatch, squeue, sinfo, sacct, scancel, scontrol, srun, salloc, sprio, sacctmgr, sstat)

**Files:**
- Create: `js/commands/slurm.js`
- Create: `tests/commands-slurm.test.js`

This is the biggest command module. It exposes ~11 SLURM commands, each calling into the cluster model from Phase 1.

- [ ] **Step 1: Write failing tests**

```javascript
// tests/commands-slurm.test.js
import { suite, test, assertEqual, assertContains, assertTrue } from '../js/test-harness.js';
import { dispatch } from '../js/commands/index.js';
import { createCluster } from '../js/cluster.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';
import { seedFictionalJobs } from '../js/users.js';
import '../js/commands/slurm.js';

suite('commands-slurm');

function ctx() {
    const cluster = createCluster();
    const fs = createFilesystem();
    // Seed a valid job script
    fs.write('/prj/palmvein/unseen/train_palmvein.srm', `#!/bin/bash
#SBATCH --job-name=palmvein-train
#SBATCH -p gdl
#SBATCH --nodes=1
#SBATCH --gpus=8
#SBATCH --cpus-per-gpu=5
#SBATCH --time=08:00:00
#SBATCH --output=slurm-%j.out

module load cuda/11.2_sequana
srun python train.py
`);
    return {
        cluster, filesystem: fs, terminal: createTerminal(),
        state: { loadedModules: [] },
        currentUser: 'unseen', hostname: 'sdumont15'
    };
}

test('sbatch on valid script returns Submitted batch job <ID>', () => {
    const c = ctx();
    const r = dispatch(['sbatch', 'train_palmvein.srm'], c);
    assertContains(r.stdout, 'Submitted batch job');
    assertEqual(c.cluster.jobs.length, 1);
    assertEqual(c.cluster.jobs[0].partition, 'gdl');
});

test('sbatch script without --time gives the real error', () => {
    const c = ctx();
    c.filesystem.write('/prj/palmvein/unseen/bad.srm', '#!/bin/bash\n#SBATCH -p sequana_cpu\nsrun hostname\n');
    const r = dispatch(['sbatch', 'bad.srm'], c);
    assertContains(r.stderr, 'Requested time limit is invalid');
});

test('sbatch script without file fails', () => {
    const c = ctx();
    const r = dispatch(['sbatch', 'nope.srm'], c);
    assertContains(r.stderr, 'Unable to open file');
});

test('squeue shows submitted job', () => {
    const c = ctx();
    dispatch(['sbatch', 'train_palmvein.srm'], c);
    const r = dispatch(['squeue'], c);
    assertContains(r.stdout, 'palmvein-train');
});

test('squeue --me filters to current user', () => {
    const c = ctx();
    seedFictionalJobs(c.cluster);
    dispatch(['sbatch', 'train_palmvein.srm'], c);
    const r = dispatch(['squeue', '--me'], c);
    assertContains(r.stdout, 'palmvein-train');
    assertTrue(!r.stdout.includes('gromacs'));
});

test('sinfo shows all partitions', () => {
    const c = ctx();
    const r = dispatch(['sinfo'], c);
    assertContains(r.stdout, 'sequana_cpu');
    assertContains(r.stdout, 'gdl');
});

test('sinfo -p gdl filters to gdl only', () => {
    const c = ctx();
    const r = dispatch(['sinfo', '-p', 'gdl'], c);
    assertContains(r.stdout, 'gdl');
    assertTrue(!r.stdout.includes('sequana_cpu'));
});

test('scancel own job changes state to CA', () => {
    const c = ctx();
    const out = dispatch(['sbatch', 'train_palmvein.srm'], c);
    const jobId = out.stdout.match(/\d+/)[0];
    c.cluster.scheduleQueue();
    dispatch(['scancel', jobId], c);
    const job = c.cluster.jobs.find(j => j.id === jobId);
    assertEqual(job.state, 'CA');
});

test('scancel other-user job fails', () => {
    const c = ctx();
    seedFictionalJobs(c.cluster);
    const otherJob = c.cluster.jobs.find(j => j.user !== 'unseen');
    const r = dispatch(['scancel', otherJob.id], c);
    assertContains(r.stderr, 'not authorized');
});

test('scontrol show job prints detailed info', () => {
    const c = ctx();
    const out = dispatch(['sbatch', 'train_palmvein.srm'], c);
    const jobId = out.stdout.match(/\d+/)[0];
    const r = dispatch(['scontrol', 'show', 'jobid', jobId], c);
    assertContains(r.stdout, `JobId=${jobId}`);
    assertContains(r.stdout, 'palmvein-train');
});

test('sacct -lj on completed job shows accounting', () => {
    const c = ctx();
    const out = dispatch(['sbatch', 'train_palmvein.srm'], c);
    const jobId = out.stdout.match(/\d+/)[0];
    c.cluster.scheduleQueue();
    c.cluster.tick(30000);
    c.cluster.tick(2);
    const r = dispatch(['sacct', '-lj', jobId], c);
    assertContains(r.stdout, jobId);
});

test('sprio -l shows priority factors', () => {
    const c = ctx();
    dispatch(['sbatch', 'train_palmvein.srm'], c);
    const r = dispatch(['sprio', '-l'], c);
    assertContains(r.stdout, 'FAIRSHARE');
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 12 should fail**

- [ ] **Step 3: Implement `js/commands/slurm.js`**

```javascript
// js/commands/slurm.js
// SLURM commands. Delegates resource logic to the cluster model.
import { register } from './index.js';

// ---------- Helpers ----------
function parseSrm(content) {
    // Parse #SBATCH directives from a shell script
    const directives = {};
    for (const line of content.split('\n')) {
        const m = line.match(/^#SBATCH\s+(.+)$/);
        if (!m) continue;
        const rest = m[1].trim();
        // Long form: --key=value or --key value
        const longEq = rest.match(/^--([a-zA-Z-]+)=(.+)$/);
        const longSpace = rest.match(/^--([a-zA-Z-]+)\s+(.+)$/);
        const shortForm = rest.match(/^-([a-zA-Z])\s+(.+)$/);
        if (longEq) directives[longEq[1]] = longEq[2];
        else if (longSpace) directives[longSpace[1]] = longSpace[2];
        else if (shortForm) {
            const shortKey = { p: 'partition', J: 'job-name', N: 'nodes', t: 'time' }[shortForm[1]] || shortForm[1];
            directives[shortKey] = shortForm[2];
        } else if (rest.startsWith('--')) {
            directives[rest.slice(2)] = true; // flag without value
        }
    }
    return directives;
}

function parseWalltime(str) {
    if (!str) return null;
    // "HH:MM:SS" or "D-HH:MM:SS" or "MM:SS"
    const parts = str.split(/[-:]/).map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 4) return parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3];
    return null;
}

function pad(str, n) { return String(str || '').padEnd(n).slice(0, n); }

function fmtElapsed(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------- sbatch ----------
register({
    name: 'sbatch',
    help: 'Submete um job script ao SLURM',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('sbatch: error: No script specified');
        let content;
        try {
            content = ctx.filesystem.cat(args[0]);
        } catch (e) {
            return { stdout: '', stderr: `sbatch: error: Unable to open file ${args[0]}`, exitCode: 1 };
        }
        const d = parseSrm(content);
        const partition = d['partition'] || d['p'];
        if (!partition) return { stdout: '', stderr: 'sbatch: error: No partition specified (-p)', exitCode: 1 };

        const nodes = parseInt(d['nodes'] || d['N'] || '1', 10);
        const gpus = parseInt(d['gpus'] || d['gpus-per-node'] || '0', 10);
        const cpusPerGpu = parseInt(d['cpus-per-gpu'] || '0', 10);
        const cpusPerTask = parseInt(d['cpus-per-task'] || '0', 10);
        const cpus = gpus * cpusPerGpu + cpusPerTask || 8;
        const memGB = parseInt(d['mem-per-gpu'] || '0', 10) / 1024 * gpus || 64;
        const walltimeSec = parseWalltime(d['time'] || d['t']);

        try {
            const jobId = ctx.cluster.submitJob({
                user: ctx.currentUser, partition, nodes, gpus, cpus, memGB, walltimeSec,
                name: d['job-name'] || d['J'] || 'job',
                script: ctx.filesystem.resolve(args[0])
            });
            return `Submitted batch job ${jobId}\n`;
        } catch (e) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }
});

// ---------- squeue ----------
register({
    name: 'squeue',
    help: 'Mostra jobs na fila',
    run: (args, ctx) => {
        const me = args.includes('--me');
        const uIdx = args.indexOf('-u');
        const user = uIdx >= 0 ? args[uIdx + 1] : (me ? ctx.currentUser : null);
        const startArg = args.includes('--start');

        let jobs = ctx.cluster.jobs;
        if (user) jobs = jobs.filter(j => j.user === user);

        const header = `${pad('JOBID', 8)} ${pad('PARTITION', 16)} ${pad('NAME', 18)} ${pad('USER', 10)} ${pad('ST', 3)} ${pad('TIME', 10)} ${pad('NODES', 6)} NODELIST(REASON)`;
        const lines = [header];
        for (const j of jobs) {
            if (startArg && j.state !== 'PD') continue;
            const time = j.state === 'R' ? fmtElapsed(j.elapsedSec) : '0:00';
            const nodelist = j.state === 'R' ? `[${j.allocatedNodes.join(',')}]` : `(${j.reason || 'None'})`;
            lines.push(`${pad(j.id, 8)} ${pad(j.partition, 16)} ${pad(j.name, 18)} ${pad(j.user, 10)} ${pad(j.state, 3)} ${pad(time, 10)} ${pad(j.nodes, 6)} ${nodelist}`);
        }
        return lines.join('\n') + '\n';
    }
});

// ---------- sinfo ----------
register({
    name: 'sinfo',
    help: 'Mostra estado das partições e nós',
    run: (args, ctx) => {
        const pIdx = args.indexOf('-p');
        const filter = pIdx >= 0 ? args[pIdx + 1] : null;

        const lines = [`${pad('PARTITION', 24)} AVAIL  TIMELIMIT  NODES  STATE NODELIST`];
        for (const p of ctx.cluster.partitions) {
            if (filter && p.name !== filter) continue;
            const nodes = ctx.cluster.getNodesByPartition(p.name);
            const idle = nodes.filter(n => n.state === 'idle').length;
            const mix = nodes.filter(n => n.state === 'mix').length;
            const alloc = nodes.filter(n => n.state === 'alloc').length;
            if (idle > 0) lines.push(`${pad(p.name, 24)} up  ${pad(p.walltimeMax, 10)} ${pad(idle, 6)} idle  ${nodes.filter(n=>n.state==='idle').slice(0,3).map(n=>n.id).join(',')}...`);
            if (mix > 0) lines.push(`${pad(p.name, 24)} up  ${pad(p.walltimeMax, 10)} ${pad(mix, 6)} mix   ${nodes.filter(n=>n.state==='mix').slice(0,3).map(n=>n.id).join(',')}...`);
            if (alloc > 0) lines.push(`${pad(p.name, 24)} up  ${pad(p.walltimeMax, 10)} ${pad(alloc, 6)} alloc ${nodes.filter(n=>n.state==='alloc').slice(0,3).map(n=>n.id).join(',')}...`);
        }
        return lines.join('\n') + '\n';
    }
});

// ---------- scancel ----------
register({
    name: 'scancel',
    help: 'Cancela um job seu',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('scancel: error: job id required');
        try {
            ctx.cluster.cancelJob(args[0], ctx.currentUser);
            return '';
        } catch (e) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }
});

// ---------- scontrol ----------
register({
    name: 'scontrol',
    help: 'Inspeciona e modifica jobs',
    run: (args, ctx) => {
        const sub = args[0];
        if (sub === 'show') {
            const what = args[1];
            if (what === 'jobid' || what === 'job') {
                const job = ctx.cluster.jobs.find(j => j.id === args[2]);
                if (!job) return { stdout: '', stderr: `slurm_load_jobs error: Invalid job id specified`, exitCode: 1 };
                return [
                    `JobId=${job.id} JobName=${job.name}`,
                    `   UserId=${job.user}  Partition=${job.partition}`,
                    `   NumNodes=${job.nodes} NumCPUs=${job.cpus} NumTasks=${job.nodes}`,
                    `   GRES=gpu:${job.gpus}`,
                    `   JobState=${job.state}  Reason=${job.reason || 'None'}`,
                    `   RunTime=${fmtElapsed(job.elapsedSec)}  TimeLimit=${fmtElapsed(job.walltimeSec || 0)}`,
                    `   NodeList=${(job.allocatedNodes || []).join(',')}`,
                    `   Command=${job.script}`,
                    ''
                ].join('\n');
            }
        }
        if (sub === 'update') {
            // scontrol update JobId=X Partition=Y
            const upd = {};
            for (const a of args.slice(1)) {
                const [k, v] = a.split('=');
                upd[k] = v;
            }
            const job = ctx.cluster.jobs.find(j => j.id === upd.JobId);
            if (!job) return { stdout: '', stderr: 'slurm_update_job error: Invalid job id specified', exitCode: 1 };
            if (upd.Partition) job.partition = upd.Partition;
            return '';
        }
        return { stdout: '', stderr: `scontrol: unknown subcommand '${sub}'`, exitCode: 1 };
    }
});

// ---------- sacct ----------
register({
    name: 'sacct',
    help: 'Histórico de accounting de jobs concluídos',
    run: (args, ctx) => {
        const ljIdx = args.indexOf('-lj');
        const jIdx = args.indexOf('-j');
        const jobId = args[ljIdx + 1] || args[jIdx + 1];
        if (!jobId) return 'JobID\tJobName\tPartition\tState\tElapsed\n';
        const job = ctx.cluster.jobs.find(j => j.id === jobId);
        if (!job) return `${jobId}\t(not found)\n`;
        return [
            `JobID           JobName      Partition   State       Elapsed      MaxRSS     AveCPU`,
            `${pad(job.id,14)} ${pad(job.name,12)} ${pad(job.partition,11)} ${pad(job.state,11)} ${fmtElapsed(job.elapsedSec)}   128GB      85%`,
            ''
        ].join('\n');
    }
});

// ---------- sstat ----------
register({
    name: 'sstat',
    help: 'Estatísticas ao vivo de um job em execução',
    run: (args, ctx) => {
        const job = ctx.cluster.jobs.find(j => j.id === args[0]);
        if (!job || job.state !== 'R') return { stdout: '', stderr: 'sstat: no running job with that id', exitCode: 1 };
        return `JobID   MaxRSS   AveCPU   MaxVMSize   AveVMSize\n${job.id}  128.5GB  85.3%    156GB       142GB\n`;
    }
});

// ---------- srun ----------
register({
    name: 'srun',
    help: 'Executa um comando num recurso alocado (inline)',
    run: (args, ctx) => {
        return `[srun] simulação didática: o comando rodaria num nó alocado pelo SLURM.\nUsado dentro de scripts sbatch ou para alocações interativas.\n`;
    }
});

// ---------- salloc ----------
register({
    name: 'salloc',
    help: 'Aloca recursos interativamente',
    run: (args, ctx) => {
        const jobId = ctx.cluster.allocateJobId();
        return [
            `salloc: Pending job allocation ${jobId}`,
            `salloc: job ${jobId} queued and waiting for resources`,
            `salloc: job ${jobId} has been allocated resources`,
            `salloc: Granted job allocation ${jobId}`,
            `salloc: Nodes sdumont6042 are ready for job`,
            ''
        ].join('\n');
    }
});

// ---------- sprio ----------
register({
    name: 'sprio',
    help: 'Mostra fatores de prioridade dos jobs pendentes',
    run: (args, ctx) => {
        const lines = ['JOBID    PARTITION     PRIORITY      AGE  FAIRSHARE    PARTITION        QOS'];
        for (const j of ctx.cluster.jobs.filter(j => j.state === 'PD')) {
            lines.push(`${pad(j.id,8)} ${pad(j.partition,13)} ${pad('15234',12)} ${pad('120',6)} ${pad('8100',10)} ${pad('5000',14)} ${pad('2014',6)}`);
        }
        lines.push('');
        return lines.join('\n');
    }
});

// ---------- sacctmgr ----------
register({
    name: 'sacctmgr',
    help: 'Gerencia associações de contas (usado read-only aqui)',
    run: (args, ctx) => {
        if (args[0] === 'list' && args[1] === 'user') {
            return `User        Account     Partition    MaxJobs  MaxSubmit  MaxNodes  MaxCPUs  MaxWall\n${ctx.currentUser}   palmvein   sequana_cpu       4         24        50     2400  96:00:00\n${ctx.currentUser}   palmvein   gdl               1          6         1       40  48:00:00\n`;
        }
        if (args[0] === 'list' && args[1] === 'account') {
            return `Account    Descr\npalmvein   Palm vein biometrics (Standard tier)\n`;
        }
        return '';
    }
});
```

- [ ] **Step 4: Run tests — 12 pass**

Expected: `97 passed`.

- [ ] **Step 5: Commit**

```bash
git add js/commands/slurm.js tests/commands-slurm.test.js tests.html
git commit -m "feat(commands): SLURM suite — sbatch, squeue, sinfo, sacct, scancel, scontrol, srun, salloc, sprio, sacctmgr"
```

---

### Task 2.7: Lustre + utility commands (lfs, df, nvidia-smi, top, kill, ps, sleep, nodeset)

**Files:**
- Create: `js/commands/lustre.js`
- Create: `js/commands/utils.js`
- Create: `tests/commands-utils.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/commands-utils.test.js
import { suite, test, assertContains, assertEqual } from '../js/test-harness.js';
import { dispatch } from '../js/commands/index.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';
import { createCluster } from '../js/cluster.js';
import '../js/commands/lustre.js';
import '../js/commands/utils.js';

suite('commands-utils');

function ctx(hostname = 'sdumont15') {
    return {
        cluster: createCluster(), filesystem: createFilesystem(), terminal: createTerminal(),
        state: { loadedModules: [], processes: [] },
        currentUser: 'unseen', hostname
    };
}

test('lfs quota shows project quota', () => {
    const c = ctx();
    const r = dispatch(['lfs', 'quota', '-h', '-g', 'palmvein', '/scratch'], c);
    assertContains(r.stdout, 'palmvein');
});

test('df -h /prj works on login node', () => {
    const c = ctx('sdumont15');
    const r = dispatch(['df', '-h', '/prj/palmvein'], c);
    assertContains(r.stdout, 'isilonsdnfs');
});

test('nvidia-smi on compute node shows 8 V100s in gdl', () => {
    const c = ctx('sdumont8000');
    const r = dispatch(['nvidia-smi'], c);
    assertContains(r.stdout, 'Tesla V100');
});

test('top lists some processes', () => {
    const c = ctx();
    const r = dispatch(['top'], c);
    assertContains(r.stdout, 'PID');
});

test('sleep in background creates a process entry', () => {
    const c = ctx();
    dispatch(['sleep', '300', '&'], c);
    assertEqual(c.state.processes.length, 1);
});

test('kill -9 PID removes the process', () => {
    const c = ctx();
    dispatch(['sleep', '300', '&'], c);
    const pid = c.state.processes[0].pid;
    dispatch(['kill', '-9', String(pid)], c);
    assertEqual(c.state.processes.length, 0);
});

test('nodeset -e expands bracket notation', () => {
    const c = ctx();
    const r = dispatch(['nodeset', '-e', 'sdumont[6000-6003]'], c);
    assertContains(r.stdout, 'sdumont6000 sdumont6001 sdumont6002 sdumont6003');
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 7 fail**

- [ ] **Step 3: Implement `js/commands/lustre.js`**

```javascript
// js/commands/lustre.js
// Lustre fs commands plus df.
import { register } from './index.js';

register({
    name: 'lfs',
    help: 'Utilitário Lustre (quota, df, setstripe, getstripe)',
    run: (args, ctx) => {
        const sub = args[0];
        if (sub === 'quota') {
            const gIdx = args.indexOf('-g');
            const proj = args[gIdx + 1];
            return [
                `Disk quotas for prj ${proj} (pid 10042):`,
                `     Filesystem  used   quota   limit   grace   files   quota   limit   grace`,
                `      /scratch  124.5G      0k   2000G      -    1842      0k  100000      -`,
                ''
            ].join('\n');
        }
        if (sub === 'df') {
            return [
                `UUID                   bytes        Used   Available Use% Mounted on`,
                `scratch-OST0000_UUID   1024.0T      421.7T      602.3T  41% /scratch[OST:0]`,
                `(...10 OSTs total...)`,
                `filesystem_summary:     1.1P        467.9T      632.1T  43% /scratch`,
                ''
            ].join('\n');
        }
        if (sub === 'getstripe') {
            return `stripe_count:   1 stripe_size:   1048576 stripe_offset: -1\n`;
        }
        if (sub === 'setstripe') {
            return '';
        }
        return { stdout: '', stderr: `lfs: unknown subcommand '${sub}'`, exitCode: 1 };
    }
});

register({
    name: 'df',
    help: 'Mostra uso de disco',
    run: (args, ctx) => {
        if (args.includes('/prj/palmvein') || args.includes('/prj/palmvein/unseen')) {
            return [
                `Filesystem                              Size  Used Avail Use% Mounted on`,
                `isilonsdnfs.sdumont.lncc.br:/ifs/palmvein  100G   12G   88G  12% /prj/palmvein`,
                ''
            ].join('\n');
        }
        return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   12G   38G  24% /\n`;
    }
});
```

- [ ] **Step 4: Implement `js/commands/utils.js`**

```javascript
// js/commands/utils.js
// Utility commands: nvidia-smi, top, kill, ps, sleep, nodeset
import { register } from './index.js';

let nextPid = 20001;

register({
    name: 'nvidia-smi',
    help: 'Mostra estado das GPUs NVIDIA no nó atual',
    run: (args, ctx) => {
        if (ctx.hostname === 'sdumont8000') {
            // GDL node — 8 V100s
            const lines = [
                '+-----------------------------------------------------------------------------+',
                '| NVIDIA-SMI 470.57.02    Driver Version: 470.57.02    CUDA Version: 11.4     |',
                '|-------------------------------+----------------------+----------------------+',
                '| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |',
                '| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |',
                '|===============================+======================+======================|'
            ];
            for (let i = 0; i < 8; i++) {
                lines.push(`|   ${i}  Tesla V100-SXM2   On | 00000000:0${i}:00.0 Off |                    0 |`);
                lines.push(`| N/A   52C    P0   218W/300W  | 14235MiB/16160MiB  |     92%      Default |`);
                lines.push(`+-------------------------------+----------------------+----------------------+`);
            }
            return lines.join('\n') + '\n';
        }
        if (ctx.hostname.startsWith('sdumont6')) {
            // gpu node — 4 V100s — similar but shorter
            return '(4x Tesla V100, output omitted for brevity)\n';
        }
        return { stdout: '', stderr: 'No devices were found.', exitCode: 1 };
    }
});

register({
    name: 'top',
    help: 'Mostra processos rodando na máquina atual',
    run: (args, ctx) => {
        const lines = [
            `top - 15:42:11 up 203 days,  4:17,  1 user,  load average: 0.42, 0.31, 0.29`,
            `Tasks: 231 total,   1 running, 230 sleeping`,
            `%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.3 id`,
            ``,
            `  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND`
        ];
        // System processes (fake)
        lines.push(`  891 root      20   0   72.4m   3.2m   2.1m S   0.3  0.0   0:02.18 systemd-journal`);
        lines.push(` 1234 ${ctx.currentUser}     20   0  141.8m  11.5m   7.2m S   0.0  0.0   0:00.42 bash`);
        // User processes (if any)
        for (const p of (ctx.state.processes || [])) {
            lines.push(` ${String(p.pid).padStart(4)} ${ctx.currentUser}     20   0    4.5m   0.8m   0.6m S   0.0  0.0   0:00.10 ${p.command}`);
        }
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'ps',
    help: 'Lista processos',
    run: (args, ctx) => {
        const lines = [`  PID TTY          TIME CMD`, ` 1234 pts/0    00:00:00 bash`];
        for (const p of (ctx.state.processes || [])) {
            lines.push(` ${String(p.pid).padStart(4)} pts/0    00:00:${String(p.elapsed || 0).padStart(2, '0')} ${p.command}`);
        }
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'sleep',
    help: 'Dorme por N segundos. Use `sleep N &` para rodar em background.',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('sleep: missing operand');
        const duration = parseInt(args[0], 10);
        if (args.includes('&')) {
            if (!ctx.state.processes) ctx.state.processes = [];
            ctx.state.processes.push({ pid: nextPid++, command: `sleep ${duration}`, elapsed: 0 });
            return `[1] ${nextPid - 1}\n`;
        }
        return '';  // synchronous version just returns (simulator doesn't actually wait)
    }
});

register({
    name: 'kill',
    help: 'Mata um processo pelo PID. Flag -9 força SIGKILL.',
    run: (args, ctx) => {
        const nonFlag = args.filter(a => !a.startsWith('-'));
        const pid = parseInt(nonFlag[0], 10);
        if (!pid) throw new Error('kill: usage: kill [-9] pid');
        if (!ctx.state.processes) ctx.state.processes = [];
        const before = ctx.state.processes.length;
        ctx.state.processes = ctx.state.processes.filter(p => p.pid !== pid);
        if (ctx.state.processes.length === before) {
            return { stdout: '', stderr: `kill: (${pid}) - No such process`, exitCode: 1 };
        }
        return '';
    }
});

register({
    name: 'nodeset',
    help: 'Manipula listas de nós no formato sdumont[NNNN-MMMM]',
    run: (args) => {
        if (args[0] === '-e' && args[1]) {
            const m = args[1].match(/^(\w+?)\[(\d+)-(\d+)\]$/);
            if (m) {
                const [, prefix, start, end] = m;
                const nodes = [];
                for (let i = parseInt(start); i <= parseInt(end); i++) nodes.push(prefix + i);
                return nodes.join(' ') + '\n';
            }
            return args[1] + '\n';
        }
        return '';
    }
});
```

- [ ] **Step 5: Run tests — 7 pass**

Expected: `104 passed`.

- [ ] **Step 6: Commit**

```bash
git add js/commands/lustre.js js/commands/utils.js tests/commands-utils.test.js tests.html
git commit -m "feat(commands): lustre lfs + utils (nvidia-smi, top, kill, ps, sleep, nodeset)"
```

---

## Phase 3 — Dashboard UI

Dashboard render functions are split into pure HTML-string generators (testable) and DOM mount functions (not unit tested, smoke-tested via `tests.html` + manual browser check).

### Task 3.1: Node grid renderer (377 nodes)

**Files:**
- Create: `js/ui/nodegrid.js`
- Create: `tests/ui-nodegrid.test.js`
- Modify: `style.css` (add node grid styles)

- [ ] **Step 1: Write failing tests for `renderNodeGrid`**

```javascript
// tests/ui-nodegrid.test.js
import { suite, test, assertContains, assertEqual } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';
import { renderNodeGrid } from '../js/ui/nodegrid.js';

suite('ui-nodegrid');

test('renders 377 node cells', () => {
    const c = createCluster();
    const html = renderNodeGrid(c);
    const matches = html.match(/class="node /g) || [];
    assertEqual(matches.length, 377);
});

test('groups nodes by partition hwType', () => {
    const c = createCluster();
    const html = renderNodeGrid(c);
    assertContains(html, 'CPU (246)');
    assertContains(html, 'BIGMEM (36)');
    assertContains(html, 'GPU (94)');
    assertContains(html, 'GDL (1)');
});

test('idle nodes have idle class', () => {
    const c = createCluster();
    const html = renderNodeGrid(c);
    assertContains(html, 'node idle');
});

test('allocated nodes have alloc class after scheduling a job', () => {
    const c = createCluster();
    c.submitJob({
        user: 'unseen', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384,
        walltimeSec: 3600, name: 'test', script: '/tmp/test.srm'
    });
    c.scheduleQueue();
    const html = renderNodeGrid(c);
    assertContains(html, 'sdumont8000" class="node alloc');
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 4 fail**

- [ ] **Step 3: Implement `js/ui/nodegrid.js`**

```javascript
// js/ui/nodegrid.js
// Renders all 377 nodes as a compact color-coded grid, grouped by hwType.
// Pure function: takes cluster, returns HTML string.

export function renderNodeGrid(cluster) {
    const groups = [
        { label: 'CPU', hwType: 'cpu' },
        { label: 'BIGMEM', hwType: 'bigmem' },
        { label: 'GPU', hwType: 'gpu' },
        { label: 'GDL', hwType: 'gdl' }
    ];
    const sections = [];
    for (const group of groups) {
        const nodes = cluster.nodes.filter(n => n.hwType === group.hwType);
        const cells = nodes.map(n => renderNodeCell(n)).join('');
        sections.push(`
            <div class="node-group">
                <h4>${group.label} (${nodes.length})</h4>
                <div class="node-grid">${cells}</div>
            </div>
        `);
    }
    return `<div class="nodegrid-root">${sections.join('')}</div>`;
}

function renderNodeCell(n) {
    const title = `${n.id} — ${n.state} — ${n.gpusAllocated}/${n.gpusTotal} GPUs, ${n.cpusAllocated}/${n.cpusTotal} cores`;
    return `<span id="${n.id}" class="node ${n.state}" title="${title}"></span>`;
}
```

- [ ] **Step 4: Add styles to `style.css`**

Append to `style.css`:

```css
/* =========================================================================
   NODE GRID
   ========================================================================= */
.nodegrid-root {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
}
.node-group h4 {
    font-size: var(--fs-sm);
    color: var(--text-dim);
    margin-bottom: var(--sp-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.node-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 14px);
    gap: 2px;
}
.node {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 2px;
    background: var(--node-idle);
    cursor: pointer;
    transition: transform 0.1s ease;
}
.node:hover { transform: scale(1.3); z-index: 1; }
.node.idle  { background: var(--node-idle); }
.node.mix   { background: var(--node-mix); }
.node.alloc { background: var(--node-alloc); }
.node.down  { background: var(--node-down); }
```

- [ ] **Step 5: Run tests — 4 pass**

Expected: `108 passed`.

- [ ] **Step 6: Commit**

```bash
git add js/ui/nodegrid.js style.css tests/ui-nodegrid.test.js tests.html
git commit -m "feat(ui): 377-node compact grid with state-colored cells"
```

---

### Task 3.2: Queue view (jobs table)

**Files:**
- Create: `js/ui/queueview.js`
- Create: `tests/ui-queueview.test.js`
- Modify: `style.css`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/ui-queueview.test.js
import { suite, test, assertContains, assertEqual } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';
import { renderQueueView } from '../js/ui/queueview.js';
import { seedFictionalJobs } from '../js/users.js';

suite('ui-queueview');

test('renderQueueView shows header row', () => {
    const c = createCluster();
    const html = renderQueueView(c, 'unseen');
    assertContains(html, 'JOBID');
    assertContains(html, 'PARTITION');
    assertContains(html, 'USER');
    assertContains(html, 'ST');
});

test('renders submitted jobs as table rows', () => {
    const c = createCluster();
    seedFictionalJobs(c);
    const html = renderQueueView(c, 'unseen');
    assertContains(html, 'slima');
    assertContains(html, 'rmartins');
});

test('highlights current user row', () => {
    const c = createCluster();
    c.submitJob({
        user: 'unseen', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384,
        walltimeSec: 3600, name: 'palmvein-train', script: '/tmp/t.srm'
    });
    const html = renderQueueView(c, 'unseen');
    assertContains(html, 'row-me');
});

test('shows "vazia" message when no jobs', () => {
    const c = createCluster();
    const html = renderQueueView(c, 'unseen');
    assertContains(html, 'fila vazia');
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 4 fail**

- [ ] **Step 3: Implement `js/ui/queueview.js`**

```javascript
// js/ui/queueview.js
// Renders the SLURM queue as an HTML table, highlighting the current user's jobs.

function fmtElapsed(sec) {
    if (!sec) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
}

export function renderQueueView(cluster, currentUser) {
    if (cluster.jobs.length === 0) {
        return `<div class="queue-empty">fila vazia</div>`;
    }
    const rows = cluster.jobs.map(j => {
        const isMe = j.user === currentUser;
        const time = j.state === 'R' ? fmtElapsed(j.elapsedSec) : '0:00';
        const rightCol = j.state === 'R'
            ? j.allocatedNodes[0] || ''
            : `(${j.reason || 'None'})`;
        return `
            <tr class="${isMe ? 'row-me' : ''} state-${j.state}">
                <td>${j.id}</td>
                <td>${j.partition}</td>
                <td>${j.name}</td>
                <td>${j.user}</td>
                <td class="st-${j.state}">${j.state}</td>
                <td>${time}</td>
                <td>${j.nodes}</td>
                <td>${rightCol}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="queue-root">
            <table class="queue-table">
                <thead>
                    <tr>
                        <th>JOBID</th><th>PARTITION</th><th>NAME</th><th>USER</th>
                        <th>ST</th><th>TIME</th><th>NODES</th><th>NODELIST(REASON)</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}
```

- [ ] **Step 4: Add styles**

Append to `style.css`:

```css
/* =========================================================================
   QUEUE VIEW
   ========================================================================= */
.queue-root { margin-top: var(--sp-md); }
.queue-empty {
    color: var(--text-dim);
    font-style: italic;
    padding: var(--sp-md);
}
.queue-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
}
.queue-table th {
    text-align: left;
    padding: 4px 8px;
    color: var(--text-dim);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
}
.queue-table td {
    padding: 4px 8px;
    border-bottom: 1px solid var(--surface-alt);
}
.queue-table tr.row-me { background: rgba(88, 166, 255, 0.15); }
.queue-table tr.state-R td.st-R   { color: var(--accent); font-weight: 600; }
.queue-table tr.state-PD td.st-PD { color: var(--warning); }
.queue-table tr.state-CD td.st-CD { color: var(--text-dim); }
.queue-table tr.state-F  td.st-F  { color: var(--danger); }
.queue-table tr.state-CA td.st-CA { color: var(--text-dim); }
```

- [ ] **Step 5: Run tests — 4 pass**

Expected: `112 passed`.

- [ ] **Step 6: Commit**

```bash
git add js/ui/queueview.js style.css tests/ui-queueview.test.js tests.html
git commit -m "feat(ui): queue view table with current-user highlighting"
```

---

### Task 3.3: Dashboard orchestrator + live tick binding

**Files:**
- Create: `js/ui/dashboard.js`

This module composes nodegrid + queueview into the `#dashboard` element, and sets up the recurring tick. Not unit-tested (DOM integration); verified via smoke test.

- [ ] **Step 1: Implement `js/ui/dashboard.js`**

```javascript
// js/ui/dashboard.js
// Orchestrates the dashboard panel: combines the node grid and queue view,
// wires up a tick loop that re-renders both on a timer.
import { renderNodeGrid } from './nodegrid.js';
import { renderQueueView } from './queueview.js';
import { cycleFictionalJobs } from '../users.js';

const TICK_MS = 2000;

export function mountDashboard({ cluster, state, container, getCurrentUser }) {
    function render() {
        container.innerHTML = `
            <div class="dashboard-inner">
                ${renderNodeGrid(cluster)}
                ${renderQueueView(cluster, getCurrentUser())}
            </div>
        `;
    }

    // Initial render
    render();

    // Tick loop
    let lastTick = Date.now();
    const tickInterval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTick) / 1000) * state.preferencias.velocidadeTick;
        lastTick = now;
        cluster.tick(delta);
        cycleFictionalJobs(cluster);
        render();
    }, TICK_MS);

    return {
        render,
        stop() { clearInterval(tickInterval); }
    };
}
```

- [ ] **Step 2: Append styles**

```css
.dashboard-inner { display: flex; flex-direction: column; gap: var(--sp-md); }
```

- [ ] **Step 3: Wire it into `main.js` for smoke test**

Replace `js/main.js` with:

```javascript
// js/main.js
import { createState } from './state.js';
import { createCluster } from './cluster.js';
import { createFilesystem } from './filesystem.js';
import { seedFictionalJobs } from './users.js';
import { mountDashboard } from './ui/dashboard.js';

console.log('[simulador-sdumont] booting...');

const state = createState();
const cluster = createCluster();
seedFictionalJobs(cluster);
cluster.scheduleQueue();

const filesystem = createFilesystem();

let currentUser = 'unseen';
const dashboard = mountDashboard({
    cluster, state,
    container: document.getElementById('dashboard'),
    getCurrentUser: () => currentUser
});

document.getElementById('narrador').innerHTML = `
    <h2>Dashboard conectado</h2>
    <p>O dashboard do cluster está vivo à direita. Veja os nós mudando de cor e a fila se movendo conforme os jobs rodam e terminam.</p>
    <p>O narrador completo entra na Fase 4 do plano.</p>
`;
```

- [ ] **Step 4: Open `index.html` in browser, verify**

Expected:
- Left: narrador placeholder
- Right-top: 377 color-coded node squares grouped by CPU / BIGMEM / GPU / GDL, plus a queue table below
- Fictional jobs showing up in the table with states changing over time
- After ~30 seconds: some jobs transition from R → CD, new ones appear

- [ ] **Step 5: Commit**

```bash
git add js/ui/dashboard.js js/main.js style.css
git commit -m "feat(ui): dashboard mount with live tick loop re-rendering nodegrid and queue"
```

---

### Task 3.4: Highlight system (halo + arrow)

**Files:**
- Create: `js/ui/highlight.js`
- Modify: `style.css`

Used by the narrator to draw attention to a specific element. Pure DOM helper.

- [ ] **Step 1: Implement `js/ui/highlight.js`**

```javascript
// js/ui/highlight.js
// Adds a pulsing halo + animated arrow pointing to a selector.
// Usage:
//   highlight('#terminal');    // add halo to #terminal
//   clearHighlight();          // remove all halos

let currentHalo = null;
let currentArrow = null;

export function highlight(selector) {
    clearHighlight();
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('halo-target');
    currentHalo = el;

    // Position an arrow above the element (top-right of its bbox)
    const rect = el.getBoundingClientRect();
    const arrow = document.createElement('div');
    arrow.className = 'narrator-arrow';
    arrow.textContent = '⬆';
    arrow.style.position = 'fixed';
    arrow.style.left = `${rect.left + rect.width / 2 - 12}px`;
    arrow.style.top = `${rect.top - 32}px`;
    arrow.style.zIndex = '1000';
    document.body.appendChild(arrow);
    currentArrow = arrow;
}

export function clearHighlight() {
    if (currentHalo) {
        currentHalo.classList.remove('halo-target');
        currentHalo = null;
    }
    if (currentArrow) {
        currentArrow.remove();
        currentArrow = null;
    }
}
```

- [ ] **Step 2: Append halo + arrow styles**

```css
/* =========================================================================
   HIGHLIGHT SYSTEM
   ========================================================================= */
.halo-target {
    position: relative;
    box-shadow: 0 0 0 3px var(--accent-alt), 0 0 20px 6px rgba(88, 166, 255, 0.4);
    animation: halo-pulse 1.5s ease-in-out infinite;
    border-radius: 6px;
}
@keyframes halo-pulse {
    0%, 100% { box-shadow: 0 0 0 3px var(--accent-alt), 0 0 20px 6px rgba(88, 166, 255, 0.4); }
    50%      { box-shadow: 0 0 0 3px var(--accent-alt), 0 0 28px 12px rgba(88, 166, 255, 0.6); }
}
.narrator-arrow {
    font-size: 28px;
    color: var(--accent-alt);
    animation: arrow-bounce 1s ease-in-out infinite;
    pointer-events: none;
}
@keyframes arrow-bounce {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
    .halo-target { animation: none; }
    .narrator-arrow { animation: none; }
}
```

- [ ] **Step 3: Smoke-test manually in DevTools**

Open `index.html`, in the DevTools console:
```javascript
const { highlight } = await import('./js/ui/highlight.js');
highlight('#terminal');
```
Expected: terminal panel gets a pulsing blue halo and an arrow above it.

- [ ] **Step 4: Commit**

```bash
git add js/ui/highlight.js style.css
git commit -m "feat(ui): halo + arrow highlight system respecting reduced-motion"
```

---

## Phase 4 — Narrator engine

The narrator engine is the core didactic layer. It reads the tour data, renders the current step in the left panel, handles Next/Back navigation, enforces `esperaComando` preconditions, updates the progress stepper, and saves progress to localStorage.

### Task 4.1: Progress stepper

**Files:**
- Create: `js/progress.js`
- Create: `tests/progress.test.js`
- Modify: `style.css`

- [ ] **Step 1: Create tour data skeleton first (minimal stub for testing)**

Create `data/tour.js` with bare metadata for the 9 etapas. Full content comes in Phase 5.

```javascript
// data/tour.js
// Tour skeleton. Full narration content is imported from content/narration/*.
// Etapas 0-8 plus sandbox. Each etapa has an array of sub-steps.
// This file is the single source of truth for the tour structure.

export const ETAPAS = [
    { num: 0, id: 'v1-vs-2nd',        titulo: 'SDumont v1 vs 2nd',      descricao: 'Entenda qual máquina você vai usar antes de tudo' },
    { num: 1, id: 'arquitetura',      titulo: 'Conceitos e arquitetura', descricao: 'O que é HPC, cluster, nó, partição' },
    { num: 2, id: 'acesso',           titulo: 'Acesso (VPN + SSH)',      descricao: 'Como entrar no cluster' },
    { num: 3, id: 'dados',            titulo: 'Transferência de dados',  descricao: '/prj vs /scratch e a pegadinha' },
    { num: 4, id: 'ambiente',         titulo: 'Ambiente (modules + conda)', descricao: 'Como "acender" software' },
    { num: 5, id: 'submissao',        titulo: 'Submissão SLURM',         descricao: 'Escrever e submeter um job script' },
    { num: 6, id: 'monitoramento',    titulo: 'Monitoramento',           descricao: 'squeue, sacct, sinfo, scontrol' },
    { num: 7, id: 'resultados',       titulo: 'Resultados e logs',       descricao: 'Ver output, baixar checkpoints' },
    { num: 8, id: 'convivencia',      titulo: 'Convivência multi-usuário', descricao: 'Fairshare, fila lotada, backfill' }
];

// Steps populated per etapa from content/narration/*.js imports in Task 4.4
export const STEPS = [];

export function registerSteps(etapaNum, steps) {
    for (const s of steps) {
        STEPS.push({ ...s, etapa: etapaNum });
    }
}

export function getStepById(id) {
    return STEPS.find(s => s.id === id);
}

export function getStepsByEtapa(etapaNum) {
    return STEPS.filter(s => s.etapa === etapaNum);
}

export function getFirstStep() {
    return STEPS[0] || null;
}

export function getNextStep(currentId) {
    const idx = STEPS.findIndex(s => s.id === currentId);
    return idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
}

export function getPreviousStep(currentId) {
    const idx = STEPS.findIndex(s => s.id === currentId);
    return idx > 0 ? STEPS[idx - 1] : null;
}
```

- [ ] **Step 2: Write failing tests for progress renderer**

Create `tests/progress.test.js`:

```javascript
// tests/progress.test.js
import { suite, test, assertContains, assertEqual } from '../js/test-harness.js';
import { renderProgress } from '../js/progress.js';
import { ETAPAS } from '../data/tour.js';

suite('progress');

test('renderProgress shows all 9 etapas', () => {
    const html = renderProgress({ etapaAtual: 0, etapasConcluidas: [] });
    for (const e of ETAPAS) {
        assertContains(html, e.titulo);
    }
});

test('etapa atual gets active class', () => {
    const html = renderProgress({ etapaAtual: 3, etapasConcluidas: [0, 1, 2] });
    assertContains(html, 'step active');
});

test('concluded etapas get done class', () => {
    const html = renderProgress({ etapaAtual: 3, etapasConcluidas: [0, 1, 2] });
    assertContains(html, 'step done');
});

test('future etapas get locked class', () => {
    const html = renderProgress({ etapaAtual: 2, etapasConcluidas: [0, 1] });
    assertContains(html, 'step locked');
});

test('sandbox appears at the end', () => {
    const html = renderProgress({ etapaAtual: 0, etapasConcluidas: [], sandboxDesbloqueado: false });
    assertContains(html, 'sandbox');
});
```

Register in `tests.html`.

- [ ] **Step 3: Run tests — 5 fail**

- [ ] **Step 4: Implement `js/progress.js`**

```javascript
// js/progress.js
// Renders the top progress stepper with 9 etapas + sandbox chip.
import { ETAPAS } from '../data/tour.js';

export function renderProgress(state) {
    const chips = ETAPAS.map(e => {
        let cls = 'step';
        if (state.etapasConcluidas.includes(e.num)) cls += ' done';
        if (e.num === state.etapaAtual) cls += ' active';
        if (e.num > state.etapaAtual && !state.etapasConcluidas.includes(e.num)) cls += ' locked';
        const check = state.etapasConcluidas.includes(e.num) ? '✓' : e.num;
        return `<button class="${cls}" data-etapa="${e.num}" title="${e.descricao}">
            <span class="step-num">${check}</span>
            <span class="step-label">${e.titulo}</span>
        </button>`;
    }).join('');

    const sandboxCls = state.sandboxDesbloqueado ? 'step sandbox unlocked' : 'step sandbox locked';
    const sandbox = `<button class="${sandboxCls}" title="Sandbox — exploração livre">
        <span class="step-num">🏖️</span>
        <span class="step-label">sandbox</span>
    </button>`;

    return `<div class="progresso-track">${chips}${sandbox}</div>`;
}

export function mountProgress(container, state, onStepClick) {
    function render() { container.innerHTML = renderProgress(state); }
    render();
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-etapa]');
        if (!btn) return;
        const etapa = parseInt(btn.dataset.etapa, 10);
        if (state.etapasConcluidas.includes(etapa) || etapa === state.etapaAtual) {
            onStepClick?.(etapa);
        }
    });
    return { render };
}
```

- [ ] **Step 5: Add styles**

Append to `style.css`:

```css
/* =========================================================================
   PROGRESS STEPPER
   ========================================================================= */
.progresso-track {
    display: flex;
    gap: 2px;
    align-items: center;
    width: 100%;
    overflow-x: auto;
}
.step {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    white-space: nowrap;
    font-size: var(--fs-sm);
}
.step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--border);
    font-weight: 600;
    font-size: 11px;
}
.step.done { color: var(--accent); }
.step.done .step-num { background: var(--accent); color: var(--bg); }
.step.active {
    color: var(--accent-alt);
    border-color: var(--accent-alt);
    animation: pulse-border 2s ease-in-out infinite;
}
.step.active .step-num { background: var(--accent-alt); color: var(--bg); }
.step.locked { opacity: 0.5; cursor: not-allowed; }
.step.sandbox.unlocked { border-color: var(--warning); color: var(--warning); cursor: pointer; }
@keyframes pulse-border {
    0%, 100% { border-color: var(--accent-alt); }
    50%      { border-color: rgba(88, 166, 255, 0.5); }
}
@media (prefers-reduced-motion: reduce) {
    .step.active { animation: none; }
}
```

- [ ] **Step 6: Run tests — 5 pass**

Expected: `117 passed`.

- [ ] **Step 7: Commit**

```bash
git add data/tour.js js/progress.js style.css tests/progress.test.js tests.html
git commit -m "feat(narrator): progress stepper with 9 etapas and sandbox chip"
```

---

### Task 4.2: Narrator renderer and tour navigation

**Files:**
- Create: `js/narrator.js`
- Create: `tests/narrator.test.js`
- Modify: `style.css`

The narrator renders the current step's `narracao` HTML in the left panel, shows Next/Back buttons, and checks `esperaComando` gating before allowing Next.

- [ ] **Step 1: Write failing tests**

```javascript
// tests/narrator.test.js
import { suite, test, assertContains, assertEqual, assertTrue, assertFalse } from '../js/test-harness.js';
import { createNarrator } from '../js/narrator.js';
import { STEPS, registerSteps } from '../data/tour.js';

suite('narrator');

// Clear and re-seed with stub content for testing
STEPS.length = 0;
registerSteps(0, [
    { id: '0.1-abertura', titulo: 'Bem-vindo', narracao: '<p>Primeiro passo</p>', esperaComando: null },
    { id: '0.2-tabela',   titulo: 'Tabela v1 vs 2nd', narracao: '<p>Segundo passo</p>', esperaComando: null }
]);
registerSteps(1, [
    { id: '1.1-intro', titulo: 'Arquitetura intro', narracao: '<p>Terceiro</p>', esperaComando: null },
    { id: '1.2-comando', titulo: 'Digite help', narracao: '<p>Digite help</p>', esperaComando: /^help/ }
]);

function makeState() {
    return {
        tourStepId: '0.1-abertura',
        etapaAtual: 0,
        etapasConcluidas: [],
        sandboxDesbloqueado: false,
        persist() {}
    };
}

test('narrator.currentStep returns the configured step', () => {
    const n = createNarrator({ state: makeState() });
    assertEqual(n.currentStep().id, '0.1-abertura');
});

test('narrator.advance moves to next step', () => {
    const n = createNarrator({ state: makeState() });
    n.advance();
    assertEqual(n.currentStep().id, '0.2-tabela');
});

test('narrator.back moves to previous step', () => {
    const state = makeState();
    state.tourStepId = '0.2-tabela';
    const n = createNarrator({ state });
    n.back();
    assertEqual(n.currentStep().id, '0.1-abertura');
});

test('advance across etapa boundary marks etapa concluida', () => {
    const state = makeState();
    state.tourStepId = '0.2-tabela';  // last step of etapa 0
    const n = createNarrator({ state });
    n.advance();
    assertEqual(state.etapasConcluidas, [0]);
    assertEqual(state.etapaAtual, 1);
});

test('canAdvance returns false when esperaComando is set and unmet', () => {
    const state = makeState();
    state.tourStepId = '1.2-comando';
    const n = createNarrator({ state });
    assertFalse(n.canAdvance());
});

test('notifyCommand unlocks esperaComando when regex matches', () => {
    const state = makeState();
    state.tourStepId = '1.2-comando';
    const n = createNarrator({ state });
    n.notifyCommand('help');
    assertTrue(n.canAdvance());
});

test('renderNarrator returns HTML containing the titulo and narracao', () => {
    const state = makeState();
    const n = createNarrator({ state });
    const html = n.renderHTML();
    assertContains(html, 'Bem-vindo');
    assertContains(html, 'Primeiro passo');
});

test('after advancing past all steps, sandbox unlocks', () => {
    const state = makeState();
    state.tourStepId = '1.2-comando';
    const n = createNarrator({ state });
    n.notifyCommand('help');
    n.advance();
    assertTrue(state.sandboxDesbloqueado);
});
```

Register in `tests.html`.

- [ ] **Step 2: Run tests — 8 fail**

- [ ] **Step 3: Implement `js/narrator.js`**

```javascript
// js/narrator.js
// Tour narrator: renders current step, navigates, gates on esperaComando.
import { STEPS, ETAPAS, getStepById, getNextStep, getPreviousStep } from '../data/tour.js';

export function createNarrator({ state, onChange }) {
    let commandMet = false;

    function currentStep() {
        return getStepById(state.tourStepId) || STEPS[0];
    }

    function canAdvance() {
        const s = currentStep();
        if (!s || !s.esperaComando) return true;
        return commandMet;
    }

    function advance() {
        if (!canAdvance()) return false;
        const cur = currentStep();
        const next = getNextStep(cur.id);
        if (!next) {
            // End of tour — unlock sandbox
            if (!state.etapasConcluidas.includes(cur.etapa)) {
                state.etapasConcluidas.push(cur.etapa);
            }
            state.sandboxDesbloqueado = true;
            state.persist();
            onChange?.();
            return true;
        }
        // If we crossed an etapa boundary, mark current etapa concluida
        if (next.etapa !== cur.etapa) {
            if (!state.etapasConcluidas.includes(cur.etapa)) {
                state.etapasConcluidas.push(cur.etapa);
            }
            state.etapaAtual = next.etapa;
        }
        state.tourStepId = next.id;
        commandMet = false;
        state.persist();
        onChange?.();
        return true;
    }

    function back() {
        const cur = currentStep();
        const prev = getPreviousStep(cur.id);
        if (!prev) return false;
        state.tourStepId = prev.id;
        state.etapaAtual = prev.etapa;
        commandMet = false;
        state.persist();
        onChange?.();
        return true;
    }

    function notifyCommand(cmdStr) {
        const s = currentStep();
        if (!s || !s.esperaComando) return;
        if (s.esperaComando.test(cmdStr)) commandMet = true;
    }

    function renderHTML() {
        const s = currentStep();
        if (!s) return '<p>Tour vazio — cadastre etapas em content/narration/</p>';
        const etapa = ETAPAS.find(e => e.num === s.etapa);
        const subSteps = STEPS.filter(x => x.etapa === s.etapa);
        const subIdx = subSteps.findIndex(x => x.id === s.id) + 1;

        return `
            <div class="narrator-inner">
                <div class="narrator-breadcrumb">
                    Etapa ${s.etapa}: ${etapa?.titulo || ''}
                    <span class="sub-counter">${subIdx}/${subSteps.length}</span>
                </div>
                <h2 class="narrator-titulo">${s.titulo}</h2>
                <div class="narrator-corpo">${s.narracao}</div>
                <div class="narrator-botoes">
                    <button class="btn-back" ${getPreviousStep(s.id) ? '' : 'disabled'}>← Voltar</button>
                    <button class="btn-next" ${canAdvance() ? '' : 'disabled title="digite o comando indicado para avançar"'}>
                        ${canAdvance() ? 'Próximo →' : '⏳ aguardando comando'}
                    </button>
                </div>
            </div>
        `;
    }

    return { currentStep, canAdvance, advance, back, notifyCommand, renderHTML };
}

export function mountNarrator({ container, state, onChange }) {
    const narrator = createNarrator({ state, onChange });
    function render() {
        container.innerHTML = narrator.renderHTML();
        container.querySelector('.btn-next')?.addEventListener('click', () => {
            if (narrator.advance()) render();
        });
        container.querySelector('.btn-back')?.addEventListener('click', () => {
            if (narrator.back()) render();
        });
    }
    render();
    return {
        render,
        narrator,
        notifyCommand(cmd) { narrator.notifyCommand(cmd); render(); }
    };
}
```

- [ ] **Step 4: Add styles**

```css
/* =========================================================================
   NARRATOR
   ========================================================================= */
.narrator-inner { display: flex; flex-direction: column; gap: var(--sp-md); }
.narrator-breadcrumb {
    color: var(--text-dim);
    font-size: var(--fs-sm);
    display: flex;
    justify-content: space-between;
}
.sub-counter { font-family: var(--font-mono); }
.narrator-titulo {
    color: var(--accent-alt);
    font-size: var(--fs-lg);
    border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-xs);
}
.narrator-corpo {
    line-height: 1.7;
    color: var(--text);
}
.narrator-corpo p { margin-bottom: var(--sp-sm); }
.narrator-corpo ul, .narrator-corpo ol { margin: var(--sp-sm) 0 var(--sp-sm) var(--sp-lg); }
.narrator-corpo code {
    background: var(--surface-alt);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--accent);
}
.narrator-corpo term {
    color: var(--accent-alt);
    border-bottom: 1px dashed var(--accent-alt);
    cursor: help;
}
.narrator-botoes { display: flex; justify-content: space-between; gap: var(--sp-md); }
.btn-back, .btn-next {
    padding: 8px 16px;
    border-radius: 4px;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    font-weight: 600;
}
.btn-next:not(:disabled) { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.btn-next:disabled, .btn-back:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-back:hover:not(:disabled), .btn-next:hover:not(:disabled) { filter: brightness(1.15); }
```

- [ ] **Step 5: Run tests — 8 pass**

Expected: `125 passed`.

- [ ] **Step 6: Commit**

```bash
git add js/narrator.js style.css tests/narrator.test.js tests.html
git commit -m "feat(narrator): tour engine with step navigation and command gating"
```

---

### Task 4.3: Glossary data + tooltip rendering

**Files:**
- Create: `js/glossario.js`
- Create: `js/ui/glossario.js`
- Create: `tests/glossario.test.js`
- Modify: `style.css`

The glossary data is just a JavaScript object. Each `<term>` tag in the narrator's HTML gets hydrated with an inline tooltip. Full glossary entries come in Task 5.11; this task sets up the plumbing.

- [ ] **Step 1: Create `js/glossario.js` with minimal seed entries**

```javascript
// js/glossario.js
// Glossary data store. Entries:
//   { termo, definicaoCurta, definicaoLonga, fonte, etapaPrincipal }
// Seeded with a few essentials; fully populated in Task 5.11.

export const GLOSSARIO = {
    'SSH': {
        termo: 'SSH',
        definicaoCurta: 'Secure Shell — protocolo para acessar um computador remoto com segurança.',
        definicaoLonga: 'SSH é como você faz login num computador em outro lugar pela rede, com toda a comunicação criptografada. Você usa ele pra "entrar" no SDumont depois de conectar a VPN.',
        fonte: 'findings.md §7',
        etapaPrincipal: 2
    },
    'VPN': {
        termo: 'VPN',
        definicaoCurta: 'Virtual Private Network — "crachá" pra entrar na rede interna do LNCC.',
        definicaoLonga: 'VPN é uma rede privada virtual. No caso do SDumont, ela é obrigatória: sem VPN ativa, você nem consegue ver que o cluster existe. No curso, o instrutor usa um cliente Sophos.',
        fonte: 'findings.md §7 + narrator-voice §3',
        etapaPrincipal: 2
    },
    'SLURM': {
        termo: 'SLURM',
        definicaoCurta: 'Simple Linux Utility for Resource Management — o gerente que decide quando seu job roda.',
        definicaoLonga: 'SLURM é o software que gerencia os recursos do cluster. Você submete um job com sbatch, ele decide quando e em qual nó o job vai rodar, e garante que múltiplos usuários dividam o hardware de forma justa.',
        fonte: 'findings.md §2, §6',
        etapaPrincipal: 5
    }
    // Full glossary in Task 5.11
};

export function getTerm(name) {
    return GLOSSARIO[name];
}

export function allTerms() {
    return Object.values(GLOSSARIO);
}
```

- [ ] **Step 2: Write failing tests**

```javascript
// tests/glossario.test.js
import { suite, test, assertEqual, assertContains } from '../js/test-harness.js';
import { getTerm, allTerms } from '../js/glossario.js';
import { hydrateTerms } from '../js/ui/glossario.js';

suite('glossario');

test('getTerm returns entry for known term', () => {
    const t = getTerm('SSH');
    assertContains(t.definicaoCurta, 'Secure Shell');
});

test('allTerms has at least 3 entries', () => {
    assertEqual(allTerms().length >= 3, true);
});

test('hydrateTerms wraps <term> tags with tooltip content', () => {
    const html = '<p>O <term>SSH</term> é legal</p>';
    const hydrated = hydrateTerms(html);
    assertContains(hydrated, 'data-tooltip');
    assertContains(hydrated, 'Secure Shell');
});

test('hydrateTerms leaves unknown terms as plain text (no tooltip)', () => {
    const html = '<p>foo <term>NOTFOUND</term> bar</p>';
    const hydrated = hydrateTerms(html);
    assertContains(hydrated, 'NOTFOUND');
});
```

Register in `tests.html`.

- [ ] **Step 3: Run tests — 4 fail**

- [ ] **Step 4: Implement `js/ui/glossario.js`**

```javascript
// js/ui/glossario.js
// Rendering helpers for the glossary: hydrates <term> tags with data-tooltip
// attributes, and builds the dropdown modal.
import { GLOSSARIO, allTerms } from '../glossario.js';

export function hydrateTerms(html) {
    return html.replace(/<term>([^<]+)<\/term>/g, (match, termName) => {
        const entry = GLOSSARIO[termName.trim()];
        if (!entry) return `<span class="term-missing">${termName}</span>`;
        const tooltip = entry.definicaoCurta.replace(/"/g, '&quot;');
        return `<span class="term" data-tooltip="${tooltip}" data-termo="${termName}">${termName}</span>`;
    });
}

export function renderGlossaryDropdown() {
    const entries = allTerms()
        .sort((a, b) => a.termo.localeCompare(b.termo))
        .map(t => `
            <div class="glossary-entry">
                <h4>${t.termo}</h4>
                <p class="def-curta">${t.definicaoCurta}</p>
                <p class="def-longa">${t.definicaoLonga}</p>
                <div class="fonte">${t.fonte}</div>
            </div>
        `).join('');
    return `<div class="glossary-root"><h2>📘 Glossário</h2>${entries}</div>`;
}
```

- [ ] **Step 5: Add styles**

```css
/* =========================================================================
   GLOSSARY
   ========================================================================= */
.term {
    color: var(--accent-alt);
    border-bottom: 1px dashed var(--accent-alt);
    cursor: help;
    position: relative;
}
.term:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--surface);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--accent-alt);
    font-size: var(--fs-sm);
    max-width: 300px;
    width: max-content;
    white-space: normal;
    z-index: 100;
    margin-top: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.glossary-root { padding: var(--sp-md); max-height: 80vh; overflow-y: auto; }
.glossary-entry {
    padding: var(--sp-sm) 0;
    border-bottom: 1px solid var(--border);
}
.glossary-entry h4 { color: var(--accent-alt); margin-bottom: var(--sp-xs); }
.glossary-entry .def-curta { color: var(--text); font-weight: 500; margin-bottom: 4px; }
.glossary-entry .def-longa { color: var(--text-dim); font-size: var(--fs-sm); }
.glossary-entry .fonte { color: var(--text-dim); font-size: 11px; font-style: italic; margin-top: 4px; }
.term-missing { color: var(--warning); }
```

- [ ] **Step 6: Run tests — 4 pass**

Expected: `129 passed`.

- [ ] **Step 7: Commit**

```bash
git add js/glossario.js js/ui/glossario.js style.css tests/glossario.test.js tests.html
git commit -m "feat(glossary): seed glossary with 3 terms + term tag hydration"
```

---

### Task 4.4: Wire narrator + progress + terminal into `main.js`

**Files:**
- Modify: `js/main.js`
- Modify: `index.html` (no changes; just verify boot)

This task connects the pieces built in Phase 2-4. After this task, the simulator boots with a working (but content-less) tour UI.

- [ ] **Step 1: Rewrite `js/main.js` as the full application entry point**

```javascript
// js/main.js
// Application entry point. Wires state, cluster, filesystem, terminal,
// dashboard, narrator, progress, and dispatches user input.

import { createState } from './state.js';
import { createCluster } from './cluster.js';
import { createFilesystem } from './filesystem.js';
import { createTerminal } from './terminal.js';
import { seedFictionalJobs } from './users.js';
import { mountDashboard } from './ui/dashboard.js';
import { mountNarrator } from './narrator.js';
import { mountProgress } from './progress.js';
import { dispatch } from './commands/index.js';
import { tokenize } from './commands/parser.js';
import { hydrateTerms } from './ui/glossario.js';

// Load all command modules (they self-register)
import './commands/fs.js';
import './commands/ssh.js';
import './commands/modules.js';
import './commands/slurm.js';
import './commands/lustre.js';
import './commands/utils.js';

console.log('[simulador-sdumont] booting...');

// ---------- Core state ----------
const state = createState();
const cluster = createCluster();
const filesystem = createFilesystem();
const terminal = createTerminal();

// Seed the cluster with fictional jobs
seedFictionalJobs(cluster);
cluster.scheduleQueue();

// Current user tracking (changes on ssh)
let currentUser = 'pedro';
let hostname = 'local';

// ---------- Mount UI pieces ----------
const dashboardHandle = mountDashboard({
    cluster, state,
    container: document.getElementById('dashboard'),
    getCurrentUser: () => currentUser
});

const progressHandle = mountProgress(
    document.getElementById('progresso'),
    state,
    (etapa) => {
        // Jump to the first sub-step of the clicked etapa (only enabled for done/current)
        import('../data/tour.js').then(({ getStepsByEtapa }) => {
            const steps = getStepsByEtapa(etapa);
            if (steps.length > 0) {
                state.tourStepId = steps[0].id;
                state.etapaAtual = etapa;
                state.persist();
                narratorHandle.render();
                progressHandle.render();
            }
        });
    }
);

const narratorHandle = mountNarrator({
    container: document.getElementById('narrador'),
    state,
    onChange: () => progressHandle.render()
});

// ---------- Terminal mounting ----------
const termEl = document.getElementById('terminal');
const termOutput = document.createElement('div');
termOutput.className = 'term-output';
const termInputLine = document.createElement('div');
termInputLine.className = 'term-input-line';
const termPrompt = document.createElement('span');
termPrompt.className = 'term-prompt';
const termInput = document.createElement('input');
termInput.className = 'term-input';
termInput.type = 'text';
termInput.autocomplete = 'off';
termInput.spellcheck = false;
termInputLine.append(termPrompt, termInput);
termEl.append(termOutput, termInputLine);

function renderTerminal() {
    const lines = terminal.getOutput();
    termOutput.textContent = lines.join('\n');
    termPrompt.textContent = terminal.getPrompt();
    termEl.scrollTop = termEl.scrollHeight;
}

function ctxForCommand() {
    return { cluster, filesystem, terminal, state, currentUser, hostname };
}

function executeCommand(rawLine) {
    if (!rawLine.trim()) {
        terminal.appendOutput(terminal.getPrompt());
        renderTerminal();
        return;
    }
    terminal.appendOutput(terminal.getPrompt() + rawLine);
    terminal.addToHistory(rawLine);
    const tokens = tokenize(rawLine);
    const result = dispatch(tokens, ctxForCommand());
    if (result.stdout) terminal.appendOutput(result.stdout.replace(/\n$/, ''));
    if (result.stderr) terminal.appendOutput(result.stderr);

    // Sync any ctx changes back
    if (ctxForCommand().hostname !== hostname || ctxForCommand().currentUser !== currentUser) {
        hostname = ctxForCommand().hostname;
        currentUser = ctxForCommand().currentUser;
        terminal.setPrompt(`${currentUser}@${hostname}`, filesystem.pwd());
    }
    terminal.setPrompt(`${currentUser}@${hostname}`, filesystem.pwd());

    // Notify narrator
    narratorHandle.notifyCommand(rawLine);

    renderTerminal();
}

termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const line = termInput.value;
        termInput.value = '';
        executeCommand(line);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        termInput.value = terminal.historyUp();
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        termInput.value = terminal.historyDown();
    }
});

terminal.setPrompt(`${currentUser}@${hostname}`, '~');
renderTerminal();
termInput.focus();
document.addEventListener('click', () => termInput.focus());

// Override narrator to hydrate <term> tags
const origNarratorRender = narratorHandle.render;
narratorHandle.render = function () {
    origNarratorRender();
    const corpo = document.querySelector('.narrator-corpo');
    if (corpo) corpo.innerHTML = hydrateTerms(corpo.innerHTML);
};
narratorHandle.render();
```

- [ ] **Step 2: Add terminal styles**

Append to `style.css`:

```css
/* =========================================================================
   TERMINAL (DOM)
   ========================================================================= */
.term-output {
    white-space: pre-wrap;
    margin-bottom: 4px;
}
.term-input-line {
    display: flex;
    align-items: center;
}
.term-prompt {
    color: var(--accent);
    white-space: pre;
    user-select: none;
}
.term-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
}
```

- [ ] **Step 3: Open `index.html` and smoke-test**

Expected in browser:
- Top bar: progress stepper with 9 etapas + sandbox (etapa 0 is active, others locked)
- Left panel: narrator with "Tour vazio — cadastre etapas em content/narration/" (because content comes in Phase 5)
- Dashboard: 377 nodes + jobs from fictional users
- Terminal: functional prompt `pedro@local:~$`, can type `help`, `whoami`, `ls`, `ssh unseen@sdumont15`, etc.
- After `ssh`, prompt changes to `unseen@sdumont15:~$`, `ls` shows /prj/palmvein/unseen contents
- Typing `sbatch train_palmvein.srm` submits a real job that shows up in the dashboard queue table
- `nvidia-smi` after SSHing to sdumont8000 shows 8 V100s (simulate by manually setting hostname in console: `hostname = 'sdumont8000'`)

- [ ] **Step 4: Commit**

```bash
git add js/main.js style.css
git commit -m "feat(app): wire narrator + progress + terminal + dashboard into working app shell"
```

---

## Phase 5 — Content (fake files, data, tour narration, glossary)

This phase fills in the actual didactic content. The narrator engine is already built — these tasks create the content files that feed it. Follow the voice rules in spec §6.3: beginner-friendly Portuguese, siglas defined, "why before how", gotchas as stories, clarity over instructor fidelity.

### Task 5.1: Fake palm vein project files

**Files:**
- Create: `content/fake-files/readme_palmvein_md.txt`
- Create: `content/fake-files/train_py.txt`
- Create: `content/fake-files/model_py.txt`
- Create: `content/fake-files/dataset_py.txt`
- Create: `content/fake-files/requirements_txt.txt`
- Create: `content/fake-files/train_palmvein_srm.txt`
- Create: `content/fake-files/envs_readme_md.txt`
- Modify: `data/initial-fs.js` (load content from these files)

- [ ] **Step 1: Create `content/fake-files/readme_palmvein_md.txt`**

```markdown
# Palm Vein Biometrics

Projeto de biometria de veias palmares para autenticação.

## Objetivo

Treinar uma rede neural siamesa que reconhece indivíduos pela
estrutura vascular da palma da mão capturada em imagens infravermelhas.

## Dataset

~16.800 imagens IR, 80/10/10 split train/val/test.
Captura próprio + datasets públicos (CASIA-MS-PalmprintV1).

## Arquitetura

SiameseCNN com triplet loss. Backbone ResNet-50 pré-treinado,
fine-tuning das últimas 12 camadas.

## Métricas

- EER (Equal Error Rate) — meta < 5%
- FAR (False Accept Rate)  @ FRR=0.1%
- FRR (False Reject Rate)  @ FAR=0.1%

## Como rodar no SDumont

Ver `train_palmvein.srm` e `envs_readme.md`.
```

- [ ] **Step 2: Create `content/fake-files/train_py.txt`**

```python
#!/usr/bin/env python
"""
train.py — Palm vein biometrics training loop.

Usage (dentro de um job SLURM):
    python train.py --data $SCRATCH/datasets/palm_vein \
                    --checkpoints $SCRATCH/checkpoints \
                    --epochs 50 --batch-size 128
"""
import argparse
import os
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.nn.parallel import DistributedDataParallel as DDP

from model import SiameseCNN, triplet_loss
from dataset import PalmVeinTripletDataset


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data', required=True)
    p.add_argument('--checkpoints', required=True)
    p.add_argument('--epochs', type=int, default=50)
    p.add_argument('--batch-size', type=int, default=128)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--margin', type=float, default=0.3)
    p.add_argument('--resume', default=None)
    return p.parse_args()


def main():
    args = parse_args()

    # Distributed setup — one process per GPU via torchrun
    rank = int(os.environ.get('LOCAL_RANK', 0))
    world_size = int(os.environ.get('WORLD_SIZE', 1))
    if world_size > 1:
        torch.distributed.init_process_group('nccl')
        torch.cuda.set_device(rank)

    device = torch.device(f'cuda:{rank}' if torch.cuda.is_available() else 'cpu')
    print(f'[rank {rank}/{world_size}] device={device}', flush=True)

    # Data
    train_ds = PalmVeinTripletDataset(args.data, split='train')
    val_ds   = PalmVeinTripletDataset(args.data, split='val')
    sampler  = torch.utils.data.distributed.DistributedSampler(train_ds) if world_size > 1 else None
    train_dl = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler,
                          num_workers=4, pin_memory=True)
    val_dl   = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=4)

    # Model
    model = SiameseCNN(embedding_dim=256).to(device)
    if world_size > 1:
        model = DDP(model, device_ids=[rank])

    optim = torch.optim.Adam(model.parameters(), lr=args.lr)

    start_epoch = 0
    if args.resume and os.path.exists(args.resume):
        ckpt = torch.load(args.resume, map_location=device)
        model.load_state_dict(ckpt['model'])
        optim.load_state_dict(ckpt['optim'])
        start_epoch = ckpt['epoch']

    for epoch in range(start_epoch, args.epochs):
        if sampler: sampler.set_epoch(epoch)
        model.train()
        t0 = time.time()
        total_loss = 0.0
        for batch in train_dl:
            anchor, positive, negative = [x.to(device) for x in batch]
            ea = model(anchor)
            ep = model(positive)
            en = model(negative)
            loss = triplet_loss(ea, ep, en, margin=args.margin)
            optim.zero_grad()
            loss.backward()
            optim.step()
            total_loss += loss.item()
        avg = total_loss / len(train_dl)

        # Validation (rank 0 only)
        if rank == 0:
            eer = evaluate(model, val_dl, device)
            print(f'[epoch {epoch+1}/{args.epochs}] '
                  f'loss={avg:.4f} eer={eer:.2%} '
                  f'time={time.time()-t0:.0f}s', flush=True)
            ckpt_path = os.path.join(args.checkpoints, f'epoch_{epoch+1:02d}.pt')
            torch.save({
                'model': model.state_dict() if world_size == 1 else model.module.state_dict(),
                'optim': optim.state_dict(),
                'epoch': epoch + 1
            }, ckpt_path)


def evaluate(model, loader, device):
    model.eval()
    # Placeholder for EER computation
    return 0.083  # fake: converges to ~5% by epoch 40


if __name__ == '__main__':
    main()
```

- [ ] **Step 3: Create `content/fake-files/model_py.txt`**

```python
"""
model.py — Siamese CNN for palm vein matching.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet50


class SiameseCNN(nn.Module):
    """ResNet-50 backbone + 256-dim embedding head.

    Returns L2-normalized embeddings suitable for triplet loss.
    """
    def __init__(self, embedding_dim=256):
        super().__init__()
        backbone = resnet50(weights='IMAGENET1K_V2')
        # Replace the final classification layer with an embedding head
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone
        self.embed = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, embedding_dim)
        )

    def forward(self, x):
        features = self.backbone(x)
        emb = self.embed(features)
        return F.normalize(emb, p=2, dim=1)


def triplet_loss(anchor, positive, negative, margin=0.3):
    """Triplet loss with L2 distance."""
    d_pos = (anchor - positive).pow(2).sum(dim=1)
    d_neg = (anchor - negative).pow(2).sum(dim=1)
    return F.relu(d_pos - d_neg + margin).mean()
```

- [ ] **Step 4: Create `content/fake-files/dataset_py.txt`**

```python
"""
dataset.py — Palm vein triplet dataset loader.
"""
import os
import random
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image


class PalmVeinTripletDataset(Dataset):
    """Returns (anchor, positive, negative) triplets.

    Anchor and positive come from the same subject; negative from a different one.
    """
    def __init__(self, root, split='train', img_size=224):
        self.root = os.path.join(root, split)
        self.subjects = sorted(os.listdir(self.root))
        self.samples_by_subject = {
            s: sorted(os.listdir(os.path.join(self.root, s))) for s in self.subjects
        }
        self.transform = transforms.Compose([
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((img_size, img_size)),
            transforms.RandomHorizontalFlip(0.3),
            transforms.RandomAffine(degrees=5, translate=(0.02, 0.02)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return sum(len(v) for v in self.samples_by_subject.values())

    def __getitem__(self, idx):
        anchor_subj = random.choice(self.subjects)
        neg_subj = random.choice([s for s in self.subjects if s != anchor_subj])
        anchor_img, pos_img = random.sample(self.samples_by_subject[anchor_subj], 2)
        neg_img = random.choice(self.samples_by_subject[neg_subj])
        load = lambda subj, name: self.transform(
            Image.open(os.path.join(self.root, subj, name))
        )
        return load(anchor_subj, anchor_img), load(anchor_subj, pos_img), load(neg_subj, neg_img)
```

- [ ] **Step 5: Create `content/fake-files/requirements_txt.txt`**

```
torch>=2.0
torchvision>=0.15
numpy
pillow
opencv-python
albumentations
scikit-learn
tqdm
```

- [ ] **Step 6: Create `content/fake-files/train_palmvein_srm.txt`**

```bash
#!/bin/bash
#SBATCH --job-name=palmvein-train
#SBATCH -p gdl
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --gpus=8
#SBATCH --cpus-per-gpu=5
#SBATCH --time=08:00:00
#SBATCH --output=slurm-%j.out

# SDumont v1 (Expansão) — job script for palm vein biometrics training.
# Run with:  sbatch train_palmvein.srm

echo "Job running on: $SLURM_JOB_NODELIST"
nodeset -e $SLURM_JOB_NODELIST

cd $SLURM_SUBMIT_DIR

# Activate environment — note: these go INSIDE the script, not before sbatch.
module load cuda/11.2_sequana
module load anaconda3/2024.02_sequana
source activate $SCRATCH/envs/palmvein

# Launch training with torchrun (uses all 8 V100s on the GDL node)
srun torchrun --nproc_per_node=8 \
    code/train.py \
    --data $SCRATCH/datasets/palm_vein \
    --checkpoints $SCRATCH/checkpoints \
    --epochs 50 \
    --batch-size 128
```

- [ ] **Step 7: Create `content/fake-files/envs_readme_md.txt`**

```markdown
# Como criar o conda env no SDumont v1

**IMPORTANTE:** o conda env mora dentro de `$SCRATCH`, não de `$HOME`.
Razão: compute nodes não enxergam `/prj` (onde `$HOME` mora no v1).

```bash
# No login node (sdumont15 por exemplo):
module load anaconda3/2024.02_sequana
conda create --prefix $SCRATCH/envs/palmvein python=3.11 -y
source activate $SCRATCH/envs/palmvein
pip install -r /prj/palmvein/unseen/code/requirements.txt
```

**Regra crítica:** NÃO deixe o conda env ativo quando for rodar `sbatch`.
O `module load` e `source activate` vão DENTRO do job script (ver
`train_palmvein.srm`), não antes.

Se o `sbatch` der erro relacionado a conflito de ambiente, rode:
```bash
conda deactivate
module purge  # (não funciona no v1 — use module unload)
```
```

- [ ] **Step 8: Wire fake files into `data/initial-fs.js`**

Replace the placeholder content lines in `data/initial-fs.js` with actual loads. Since this is a static file and we can't `import` text at module scope without top-level await, embed the contents directly at startup via a build step. Simpler: create a small loader module.

Create `js/fakefile-loader.js`:

```javascript
// js/fakefile-loader.js
// Fetches fake-file contents at startup and patches the FS tree.
const FAKE_FILES = {
    '/prj/palmvein/unseen/README.md':                  'content/fake-files/readme_palmvein_md.txt',
    '/prj/palmvein/unseen/code/train.py':              'content/fake-files/train_py.txt',
    '/prj/palmvein/unseen/code/model.py':              'content/fake-files/model_py.txt',
    '/prj/palmvein/unseen/code/dataset.py':            'content/fake-files/dataset_py.txt',
    '/prj/palmvein/unseen/code/requirements.txt':      'content/fake-files/requirements_txt.txt',
    '/prj/palmvein/unseen/train_palmvein.srm':         'content/fake-files/train_palmvein_srm.txt',
    '/prj/palmvein/unseen/envs_readme.md':             'content/fake-files/envs_readme_md.txt'
};

export async function loadFakeFiles(filesystem) {
    for (const [path, url] of Object.entries(FAKE_FILES)) {
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const text = await resp.text();
                filesystem.write(path, text);
            }
        } catch (e) {
            console.warn(`[fakefile-loader] failed to load ${url}`, e);
        }
    }
}
```

Then in `js/main.js`, add at the top of the async boot sequence (wrap the entire main in async IIFE or top-level await):

```javascript
import { loadFakeFiles } from './fakefile-loader.js';
// ...
await loadFakeFiles(filesystem);
```

Wrap the main.js body in `(async () => { ... })();` to allow `await`.

- [ ] **Step 9: Verify in browser**

Open `index.html`. After `ssh unseen@sdumont15`, run:
- `cat README.md` — should show the palm vein README content
- `cat code/train.py` — should show the Python training script
- `cat train_palmvein.srm` — should show the SLURM script

- [ ] **Step 10: Commit**

```bash
git add content/fake-files/ js/fakefile-loader.js data/initial-fs.js js/main.js
git commit -m "feat(content): fake palm vein project files loaded into /prj/palmvein/unseen"
```

---

### Task 5.2: Data files — v1 vs 2nd comparison table, job templates

**Files:**
- Create: `data/v1-vs-2nd.js`
- Create: `data/job-templates.js`

- [ ] **Step 1: Create `data/v1-vs-2nd.js` — the comparison card data**

```javascript
// data/v1-vs-2nd.js
// Data for the SDumont v1 vs 2nd comparison card (spec §9).
// Consumed by the modal in Task 6.2.
export const V1_VS_2ND = {
    titulo: 'SDumont Expansão (v1) vs SDumont 2nd',
    subtitulo: 'Você vai usar o v1. Se alguém mencionar H100/GH200/MI300A — é o 2nd.',
    frasesGuardian: [
        'Se aparecer H100, GH200 ou MI300A, é o 2nd — não é você.',
        'Se aparecer `sequana_*` nas partições, é o v1 — é você.',
        'Seu $HOME mora dentro de /prj, não em /home.'
    ],
    linhas: [
        { aspecto: 'Frame',                v1: 'Bull Sequana X1000 / X1120',       v2nd: 'Bull Sequana XH3000' },
        { aspecto: 'Ano de entrada',       v1: '2019',                             v2nd: '2024' },
        { aspecto: 'Pico teórico',         v1: '~5.1 PFlops',                      v2nd: '~25.0 PFlops' },
        { aspecto: 'Nós computacionais',   v1: '377 (246 CPU + 36 BIGMEM + 94 GPU + 1 GDL)', v2nd: '180' },
        { aspecto: 'CPU',                  v1: 'Intel Xeon Cascade/Skylake',       v2nd: 'AMD Genoa-X, Intel Sapphire Rapids, Grace ARM' },
        { aspecto: 'GPU',                  v1: '384× NVIDIA V100',                 v2nd: '248× H100 + 144× GH200 + 36× MI300A' },
        { aspecto: 'Interconnect',         v1: 'InfiniBand EDR 100 Gb/s',          v2nd: 'InfiniBand NDR 400 Gb/s' },
        { aspecto: 'Partições',            v1: 'sequana_cpu*, sequana_gpu*, gdl',  v2nd: 'lncc-h100, lncc-gh200, lncc-mi300a, etc.' },
        { aspecto: 'Walltime max (GPU)',   v1: '96h (48h no gdl)',                 v2nd: '24h (capped)' },
        { aspecto: '$HOME',                v1: '/prj/<PROJETO>/<user> (NFS, só login)', v2nd: '$HOME == $SCRATCH (Lustre)' },
        { aspecto: '$SCRATCH',             v1: '/scratch/<PROJETO>/<user> (Lustre 1.1 PB)', v2nd: '/scratch/<PROJETO>/<user> (Lustre 3 PB)' },
        { aspecto: 'Login node',           v1: 'sdumont15-18',                     v2nd: 'login.sdumont2nd.lncc.br' },
        { aspecto: 'Slurm',                v1: '23.11.1',                          v2nd: '24.05.3' },
        { aspecto: '--account=',           v1: 'não exigido',                      v2nd: 'obrigatório em todo job' },
        { aspecto: 'Módulos',              v1: 'flat (cuda/11.2_sequana)',         v2nd: 'architecture-prefixed (arch_gpu/current)' }
    ]
};
```

- [ ] **Step 2: Create `data/job-templates.js`**

```javascript
// data/job-templates.js
// Template job scripts that the narrator uses as examples.
export const TEMPLATES = {
    'train_palmvein.srm': {
        // Canonical palm vein training job — the one the user will submit in the tour
        path: '/prj/palmvein/unseen/train_palmvein.srm',
        loadFrom: 'content/fake-files/train_palmvein_srm.txt'
    },
    'hello-world.srm': {
        // Minimal working example — used in etapa 5 as the first submission
        path: '/prj/palmvein/unseen/hello-world.srm',
        inline: `#!/bin/bash
#SBATCH --job-name=hello
#SBATCH -p sequana_cpu_dev
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --time=00:05:00
#SBATCH --output=slurm-%j.out

echo "Hello from SDumont!"
hostname
date
`
    }
};
```

- [ ] **Step 3: Commit**

```bash
git add data/v1-vs-2nd.js data/job-templates.js
git commit -m "feat(data): v1-vs-2nd comparison table data and job templates"
```

---

### Task 5.3: Narration etapas 0 and 1 (v1-vs-2nd framing + architecture)

**Files:**
- Create: `content/narration/00-v1-vs-2nd.js`
- Create: `content/narration/01-arquitetura.js`
- Modify: `data/tour.js` (import and register)

Etapa 0 is short and critical — it hammers home that the user is on v1. Etapa 1 establishes the physical and conceptual model.

- [ ] **Step 1: Create `content/narration/00-v1-vs-2nd.js`**

```javascript
// content/narration/00-v1-vs-2nd.js
// Etapa 0: SDumont v1 vs SDumont 2nd — critical framing before anything else.
// Content grounded in: spec §6.2 etapa 0, research/findings.md §8, slides 1+3.
// Voice: beginner-friendly pt-BR, define acronyms on first use, why-before-how.

export default [
    {
        id: '0.1-bem-vindo',
        titulo: 'Bem-vindo! Vamos começar do zero',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>Oi! Antes de qualquer coisa: <strong>respira fundo</strong>. A gente
            vai aprender a usar um supercomputador do zero, sem assumir que você
            conhece nada. Vou explicar cada sigla, cada comando, cada conceito —
            e se algo não fizer sentido, é por minha culpa, não sua.</p>

            <p>O supercomputador que a gente vai explorar é o <strong>Santos Dumont</strong>
            (carinhosamente chamado de <term>SDumont</term>), do
            <term>LNCC</term> — o Laboratório Nacional de Computação Científica,
            que fica em Petrópolis, Rio de Janeiro. Ele existe pra rodar projetos
            de pesquisa científica do Brasil inteiro.</p>

            <p>Mas tem uma pegadinha importante que a gente precisa resolver
            AGORA, antes de qualquer coisa. Vamos lá.</p>
        `
    },
    {
        id: '0.2-tres-maquinas',
        titulo: 'Na verdade são três Santos Dumonts',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>O que a gente chama de "Santos Dumont" é na verdade uma linha do tempo
            de três máquinas diferentes:</p>

            <ol>
                <li><strong>SDumont Base (2015)</strong> — a primeira versão.
                    <strong>Foi descomissionada em 2025</strong>. Não existe mais.</li>
                <li><strong>SDumont Expansão (2019)</strong> — <strong>essa é a que
                    você vai usar</strong>. É uma máquina baseada em CPUs Intel Xeon e
                    GPUs NVIDIA V100. Nesta escola e neste simulador, quando eu
                    disser "SDumont" ou "v1", estou falando dessa.</li>
                <li><strong>SDumont 2nd (2024)</strong> — uma máquina novinha, com GPUs
                    H100 e GH200. É outra máquina, fica em outro container, tem
                    partições e comandos diferentes. <strong>Você NÃO vai usar ela.</strong>
                    Quando o pessoal do LNCC falar "2nd" ou mencionar H100/GH200, é
                    ela — não te preocupa.</li>
            </ol>

            <p>Por que isso importa? Porque se você pesquisar "Santos Dumont" no
            Google hoje, vai cair num blog da NVIDIA falando sobre H100 e ampliação
            4× maior. Esse blog é sobre o <strong>2nd</strong>, não sobre o que você
            vai usar. Não confunda.</p>
        `
    },
    {
        id: '0.3-guardian-phrases',
        titulo: 'Três frases-guardiãs para a reunião',
        esperaComando: null,
        destaque: '.selo-v1',
        narracao: `
            <p>Leva essas três frases na cabeça — elas vão te salvar na reunião:</p>

            <blockquote>
                <p>1. <strong>Se aparecer "H100", "GH200" ou "MI300A", é o 2nd — não é você.</strong></p>
                <p>2. <strong>Se aparecer <code>sequana_*</code> nas partições, é o v1 — é você.</strong></p>
                <p>3. <strong>Seu <code>$HOME</code> mora dentro de <code>/prj</code>, não em <code>/home</code>.</strong></p>
            </blockquote>

            <p>A terceira você ainda não entende — beleza, a gente explica na etapa 3.
            As duas primeiras já te protegem de confusão imediata.</p>

            <p>Olha pro canto superior esquerdo da tela: sempre tem o selo
            <strong>🟦 SDumont Expansão (v1)</strong> lembrando onde você está.
            Se alguma hora der dúvida, clica nesse selo — abre um card de comparação
            lado-a-lado com os dois clusters.</p>

            <p>Agora sim, bora pra arquitetura. Clique em <strong>Próximo</strong>.</p>
        `
    }
];
```

- [ ] **Step 2: Create `content/narration/01-arquitetura.js`** (6 sub-steps)

```javascript
// content/narration/01-arquitetura.js
// Etapa 1: Conceitos e arquitetura.
// Opens with the container-data-center image (Bruno's framing from sd01-i).
// Introduces: HPC, cluster, node, blade, partition, fairshare, socket topology.

export default [
    {
        id: '1.1-container',
        titulo: 'O SDumont mora num container',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>Primeira imagem mental: o SDumont <strong>literalmente cabe dentro de
            dois contêineres marítimos</strong>. Não é uma sala cheia de racks — são
            dois contêineres portáteis ligados por um corredor. Em teoria, dá pra
            pegar e plugar em qualquer lugar que tenha energia e água.</p>

            <p>Água? Sim. A refrigeração é feita por um loop de <strong>glicol</strong>
            (um líquido). Entra frio pela parte de cima do rack, passa perto dos
            componentes quentes, sai aquecido, e volta pro sistema de resfriamento.
            É um data center em miniatura.</p>

            <p>Por que isso importa pra você? Porque quando você for submeter um
            treino, seu código vai parar fisicamente dentro de uma dessas caixas
            de metal. É bom saber onde.</p>
        `
    },
    {
        id: '1.2-hpc',
        titulo: 'O que é "HPC" afinal?',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p><term>HPC</term> é High Performance Computing — em português,
            "computação de alto desempenho". Soa pomposo, mas a ideia é simples:
            problemas que um computador sozinho não aguenta, a gente divide em
            pedaços e roda em <strong>vários computadores trabalhando juntos</strong>.</p>

            <p>Esses vários computadores, coordenados por uma rede rápida, formam
            um <strong>cluster</strong>. Cada computador individual é chamado de
            <strong>nó</strong> (em inglês, <em>node</em>).</p>

            <p>O SDumont v1 tem <strong>377 nós computacionais</strong>. Sim, trezentos
            e setenta e sete. Você não vai usar todos — quase ninguém usa.
            Projetos típicos usam entre 1 e 16 nós ao mesmo tempo.</p>
        `
    },
    {
        id: '1.3-tipos-de-no',
        titulo: 'Os 4 tipos de nó no v1',
        esperaComando: null,
        destaque: '.node-grid',
        narracao: `
            <p>Nem todo nó é igual. O SDumont v1 tem 4 "sabores", cada um pensado
            pra um tipo de trabalho:</p>

            <ul>
                <li><strong>CPU (246 nós)</strong> — 2 processadores Intel Xeon
                    Cascade Lake cada, totalizando 48 cores, 384 GB de RAM, sem GPU.
                    São para simulações que rodam em CPU pura (CFD, MD, etc.).</li>
                <li><strong>CPU BIGMEM (36 nós)</strong> — iguais aos CPU mas com
                    <strong>768 GB de RAM</strong>. Pra quando o dataset é gigante e
                    não cabe em 384 GB.</li>
                <li><strong>GPU (94 nós)</strong> — 48 cores CPU + <strong>4 GPUs
                    NVIDIA Tesla V100</strong>. Para CUDA e deep learning em
                    múltiplas GPUs.</li>
                <li><strong>GDL (1 nó único)</strong> — o nó especial dedicado a
                    deep learning. Tem <strong>8 V100 conectadas por NVLink</strong>
                    num único nó, dando 128 GB de memória de GPU ao todo. É o mais
                    cobiçado pra treino de rede neural grande. <strong>É nele que
                    seu projeto palm vein vai rodar.</strong></li>
            </ul>

            <p>Olha pro dashboard à direita: você vê os 377 nós como quadradinhos
            coloridos, agrupados por tipo. Verde = livre, amarelo = parcialmente
            ocupado, vermelho = totalmente ocupado.</p>
        `
    },
    {
        id: '1.4-particao',
        titulo: 'Partições: a fila que seu job escolhe',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>Cada grupo de nós é oferecido através de uma ou mais
            <strong>partições</strong>. Dá pra pensar em partição como uma
            <em>fila de supermercado</em>: cada fila aceita um tipo de cliente e
            tem suas regras.</p>

            <p>No SDumont v1, as partições principais são:</p>
            <ul>
                <li><code>sequana_cpu</code> — nós CPU. Walltime máximo 96 horas.</li>
                <li><code>sequana_cpu_dev</code> — mesmos nós, mas walltime máximo
                    20 minutos. Tem prioridade alta — é a fila pra testar coisas rapidamente.</li>
                <li><code>sequana_cpu_long</code> — jobs longos, até 744 horas (31 dias!).</li>
                <li><code>sequana_cpu_bigmem</code> / <code>sequana_cpu_bigmem_long</code> —
                    os nós BIGMEM.</li>
                <li><code>sequana_gpu</code> / <code>sequana_gpu_dev</code> /
                    <code>sequana_gpu_long</code> — os 94 nós GPU.</li>
                <li><code>gdl</code> — o nó único de deep learning. Walltime 48h máx.
                    <strong>É aqui que seu job palm vein vai.</strong></li>
            </ul>

            <p>Uma fila só aceita jobs compatíveis com o hardware dela. Você não
            pode pedir GPU numa fila <code>sequana_cpu</code>. Cada fila também tem
            regras de prioridade, quantos jobs você pode ter ao mesmo tempo, etc.
            A gente volta nisso depois, tá?</p>
        `
    },
    {
        id: '1.5-socket',
        titulo: 'Detalhe dos 48 cores (importante pra depois)',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>Pequeno detalhe técnico que o instrutor Roberto mostra no curso e
            que não está no manual oficial: os 48 cores de um nó CPU não são 48
            cores num único processador gigante. São <strong>2 processadores
            físicos (sockets) de 24 cores cada</strong>, lado a lado.</p>

            <p>Por que isso importa? Porque se você pedir, digamos, 16 cores pra
            uma tarefa, o SLURM pode acabar dando 8 cores num socket e 8 no outro.
            Eles conseguem conversar, mas com um pouquinho mais de overhead
            (precisa passar pela cache L3). Em cargas pesadas de CPU-intensive,
            isso degrada performance.</p>

            <p>Anota no canto da cabeça: "nó = 2 sockets × 24 cores". A gente usa
            isso na etapa 5, quando for escrever o job script.</p>
        `
    },
    {
        id: '1.6-heterogeneo',
        titulo: 'Por que hardware heterogêneo?',
        esperaComando: null,
        destaque: null,
        narracao: `
            <p>Você deve estar pensando: "por que tanto tipo diferente de nó? Por
            que não só um padrão?"</p>

            <p>Resposta do admin do SDumont (Bruno, no curso): <strong>"a gente
            preza por atender o maior número de projetos distintos possível"</strong>.
            Tem grupo que precisa de muita RAM (BIGMEM), tem grupo que precisa de
            GPU, tem grupo que precisa de CPU pura com muitos nós pra MPI.
            Comprar hardware variado serve mais pesquisadores.</p>

            <p>O custo dessa decisão é que não existe "um benchmark do SDumont" —
            cada subsistema é medido separado. E quando a gente for escolher onde
            rodar, a gente escolhe pela partição certa pra cada tipo de trabalho.
            No seu caso: <strong>deep learning multi-GPU → <code>gdl</code></strong>.</p>

            <p>Beleza, conceitos gerais dados. Agora vamos ver como a gente
            <strong>entra</strong> nessa máquina. Próxima etapa: acesso via VPN + SSH.</p>
        `
    }
];
```

- [ ] **Step 3: Modify `data/tour.js` to import and register etapas 0 and 1**

Add at the top of `data/tour.js`:

```javascript
import etapa0 from '../content/narration/00-v1-vs-2nd.js';
import etapa1 from '../content/narration/01-arquitetura.js';
registerSteps(0, etapa0);
registerSteps(1, etapa1);
```

- [ ] **Step 4: Verify in browser**

Open `index.html`. Narrator should now show the "Bem-vindo!" step from etapa 0. Click "Próximo" a few times to walk through etapas 0 and 1. Progress stepper should advance.

- [ ] **Step 5: Commit**

```bash
git add content/narration/00-v1-vs-2nd.js content/narration/01-arquitetura.js data/tour.js
git commit -m "feat(content): etapas 0 (v1-vs-2nd) and 1 (arquitetura) with 9 sub-steps"
```

---

### Task 5.4: Narration etapas 2 and 3 (acesso + transferência)

**Files:**
- Create: `content/narration/02-acesso.js`
- Create: `content/narration/03-dados.js`
- Modify: `data/tour.js`

Etapa 2 includes the **VPN reconnect → SSH retry** scene from Bidu's live demo. Etapa 3 includes the **`/prj` invisible on compute node** pegadinha scene.

- [ ] **Step 1: Create `content/narration/02-acesso.js`** (6 sub-steps)

Sub-steps to create (content should follow the voice rules; each step should be ~300-500 words of clear Portuguese prose with concrete examples):

1. `2.1-abertura`: "Pra usar o cluster você precisa entrar nele". Explains the two-step access: VPN + SSH. No command expected.
2. `2.2-vpn`: Defines VPN. Uses the "crachá" analogy. Mentions Sophos as an example client. No command.
3. `2.3-ssh-teoria`: Defines SSH. Explains it's a remote terminal session. No command.
4. `2.4-ssh-pratica`: **Pede para o aluno digitar `ssh unseen@sdumont15`**. `esperaComando: /^ssh /`. `destaque: '#terminal'`.
5. `2.5-vpn-caiu`: **Cena dramatizada** do Bidu: simulador fecha a conexão, o aluno vê mensagem de VPN caída, é orientado a "reconectar o cliente VPN" (botão simulado) e fazer SSH de novo. Ensinar o sintoma.
6. `2.6-login-node-nao-determinstico`: Explica que você pode cair em qualquer um dos 4 login nodes (`sdumont15..18`), e que cada sessão é independente. Menciona que no curso o Bidu só viu 2 respondendo (17 e 18).
7. `2.7-regra-30-min`: A regra dos 30 minutos — login nodes matam automaticamente processos do usuário que passem de 30min CPU. Explica por que (login é pra preparar, não pra rodar).

Use this template for the content file:

```javascript
// content/narration/02-acesso.js
// Etapa 2: Acesso ao SDumont (VPN + SSH).
// Includes the VPN reconnect live scene from Bidu's demo (spec §6.2 etapa 2).

export default [
    {
        id: '2.1-abertura',
        titulo: 'Para entrar, duas chaves: VPN e SSH',
        esperaComando: null,
        destaque: null,
        narracao: `<p>...</p>`  // expand to ~300-500 words
    },
    // ...
];
```

Write complete Portuguese prose for each step — no placeholders. Apply voice rules from spec §6.3.

- [ ] **Step 2: Create `content/narration/03-dados.js`** (5 sub-steps)

Sub-steps:
1. `3.1-duas-areas`: Apresenta `/prj` e `/scratch`. Define "HOMEDIR" e "working area". Usa as metáforas "armário" vs "bancada".
2. `3.2-comando-cd-home`: `esperaComando: /^cd/` + `destaque: '#terminal'` — ensina o aluno a ir pra HOME.
3. `3.3-pegadinha`: **Cena dramatizada**. O aluno tenta rodar um job que referencia `/prj` a partir de um compute node → vê erro `No such file or directory` → narrador explica a regra.
4. `3.4-transferencia`: scp e rsync do computador local para o cluster. Exemplos completos.
5. `3.5-sem-backup`: Avisa sobre purge de 60 dias e falta de backup.

Each step ~300-500 words of expanded prose following voice rules.

- [ ] **Step 3: Register in `data/tour.js`**

```javascript
import etapa2 from '../content/narration/02-acesso.js';
import etapa3 from '../content/narration/03-dados.js';
registerSteps(2, etapa2);
registerSteps(3, etapa3);
```

- [ ] **Step 4: Verify in browser** — walk through etapas 2 and 3 end-to-end, including typing the expected commands.

- [ ] **Step 5: Commit**

```bash
git add content/narration/02-acesso.js content/narration/03-dados.js data/tour.js
git commit -m "feat(content): etapas 2 (VPN+SSH with reconnect scene) and 3 (/prj vs /scratch pegadinha)"
```

**Reference pointer for the implementer:** when expanding the prose, use `research/narrator-voice.md` §5 for concrete scenes and §4 for analogies, but rewrite for a complete beginner per spec §6.3. All acronyms wrapped in `<term>TAG</term>` for glossary hydration.

---

### Task 5.5: Narration etapas 4 and 5 (ambiente + submissão SLURM)

**Files:**
- Create: `content/narration/04-ambiente.js`
- Create: `content/narration/05-submissao.js`
- Modify: `data/tour.js`

Etapa 4 covers modules + conda. Etapa 5 is the biggest: batch submission with the `--ntasks-per-node` correction scene.

- [ ] **Step 1: Create `content/narration/04-ambiente.js`** (6 sub-steps)

1. `4.1-modules-analogia`: "Num cluster compartilhado você não instala software como no seu computador. Usa módulos."
2. `4.2-module-avail`: `esperaComando: /^module avail/`. Destaque: terminal.
3. `4.3-module-load`: Pede `module load cuda/11.2_sequana`. Explica cada pedaço do nome (cuda = software, 11.2 = versão, `_sequana` = para esse cluster).
4. `4.4-conda-por-que`: Por que PyTorch não é módulo. Por que conda env.
5. `4.5-conda-scratch`: Regra: conda env no `$SCRATCH`, não no home.
6. `4.6-regra-critica`: Conda NÃO ativo quando roda sbatch.

- [ ] **Step 2: Create `content/narration/05-submissao.js`** (9 sub-steps — biggest etapa)

1. `5.1-batch-conceito`: "Batch = conjunto de coisas uma atrás da outra". Daí sbatch.
2. `5.2-slurm-intro`: Define SLURM. "Gerente da fila."
3. `5.3-anatomia`: Mostra o `train_palmvein.srm` no nano/vim modal. Explica linha por linha.
4. `5.4-primeira-submissao`: `esperaComando: /^sbatch /`. Aluno submete o hello-world primeiro.
5. `5.5-time-obrigatorio`: Cena — aluno tenta submeter sem `--time`, vê erro. Narrador explica por quê (backfill).
6. `5.6-gpu-obrigatoria`: Submete em `sequana_gpu` sem `--gpus` → QOSMinGRES. Explica.
7. `5.7-srun-block-correcao`: **Cena do Roberto**. Mostra `srun -N 2 --ntasks 6` → narrador explica que caiu 5+1, refaz com `--ntasks-per-node 3`. Conceito de BLOCK distribution.
8. `5.8-palmvein-submit`: Aluno finalmente submete `train_palmvein.srm`. Retorna `Submitted batch job 12xxx`.
9. `5.9-proximo-passo`: "Deu certo. Agora vamos ver como acompanhar seu job." (Hook pra etapa 6.)

Each ~400-600 words.

- [ ] **Step 3: Register in `data/tour.js`** and **verify in browser**.

- [ ] **Step 4: Commit**

```bash
git add content/narration/04-ambiente.js content/narration/05-submissao.js data/tour.js
git commit -m "feat(content): etapas 4 (modules+conda) and 5 (sbatch with srun correction scene)"
```

---

### Task 5.6: Narration etapas 6 and 7 (monitoramento + resultados)

**Files:**
- Create: `content/narration/06-monitoramento.js`
- Create: `content/narration/07-resultados.js`
- Modify: `data/tour.js`

- [ ] **Step 1: Create `content/narration/06-monitoramento.js`** (8 sub-steps)

1. `6.1-e-agora`: "Submeti o job, e agora?" Pergunta natural do aluno.
2. `6.2-squeue-me`: `esperaComando: /^squeue --me/`. Explica cada coluna.
3. `6.3-estados-do-job`: PD, R, CG, CD, F, TO, CA — em linguagem simples.
4. `6.4-razoes-pending`: Resources, Priority, QOSMinGRES, PartitionTimeLimit, AssociationJobLimit.
5. `6.5-sinfo`: `esperaComando: /^sinfo/`. Explica A/I/O/T.
6. `6.6-scontrol-show`: Mostra detalhes de job.
7. `6.7-scontrol-update-rescue`: **Cena do Roberto**. Job preso em `sequana_cpu` por fila lotada → move pra `sequana_cpu_dev` com `scontrol update`. Truque avançado.
8. `6.8-top-kill-pid`: **Cena do Bidu**. Roda `sleep 300 &`, vê no `top`, mata com `kill -9 PID`. Ensina diferença entre job (SLURM) e processo (SO).

- [ ] **Step 2: Create `content/narration/07-resultados.js`** (5 sub-steps)

1. `7.1-slurm-out`: Onde vai o output. `cat slurm-<ID>.out`.
2. `7.2-checkpoints`: `/scratch/palmvein/unseen/checkpoints/`. Decisão é do próprio código.
3. `7.3-sacct`: `sacct -lj <ID>` — estatísticas reais.
4. `7.4-download`: `scp` reverso pra baixar resultados.
5. `7.5-mover-prj`: Antes de "fim do projeto", move checkpoints importantes pra `/prj` pra preservar.

- [ ] **Step 3: Register in `data/tour.js`** and verify.

- [ ] **Step 4: Commit**

```bash
git add content/narration/06-monitoramento.js content/narration/07-resultados.js data/tour.js
git commit -m "feat(content): etapas 6 (monitoring with scontrol+top scenes) and 7 (results)"
```

---

### Task 5.7: Narration etapa 8 (convivência multi-usuário)

**Files:**
- Create: `content/narration/08-convivencia.js`
- Modify: `data/tour.js`

Final etapa. After it, the sandbox unlocks.

- [ ] **Step 1: Create `content/narration/08-convivencia.js`** (7 sub-steps)

1. `8.1-centenas`: "Você não está sozinho — tem centenas de projetos rodando ao mesmo tempo."
2. `8.2-fila-lotada`: O simulador orquestra: submete seu job, outros jobs estão na frente, você fica PD com razão Resources.
3. `8.3-prioridade`: Fórmula `Age + Fairshare + Partition + QOS`. Cada fator em português simples.
4. `8.4-backfill-tetris`: Metáfora do Tetris. Por que `--time` curto = mais chance de backfill.
5. `8.5-ua`: Unidades de Alocação. 1 core-hora = 1 UA. 1 GPU-hora V100 = 100 UAs. Exemplo: 8h × 8 GPUs = 6400 UAs.
6. `8.6-cap-100`: O limite de 100 jobs simultâneos por projeto.
7. `8.7-ultima-dica-scratch`: Lembrete final sobre 60-day purge e sem backup.
8. `8.8-fim`: Parabéns, você completou o tour. Sandbox destravado.

- [ ] **Step 2: Register in `data/tour.js`**.

- [ ] **Step 3: Verify end-to-end — walk through all 9 etapas. Sandbox chip should turn gold at the end.**

- [ ] **Step 4: Commit**

```bash
git add content/narration/08-convivencia.js data/tour.js
git commit -m "feat(content): etapa 8 (convivência multi-usuário) completes the tour"
```

---

### Task 5.8: Full glossary (30+ terms)

**Files:**
- Modify: `js/glossario.js` (expand `GLOSSARIO` object)

Replace the 3-term seed with the full glossary. Each entry: `termo`, `definicaoCurta` (1 line), `definicaoLonga` (2-3 short paragraphs), `fonte`, `etapaPrincipal`.

- [ ] **Step 1: Rewrite `js/glossario.js` with 30+ entries**

Expand the `GLOSSARIO` object to cover all obligatory terms from spec §12:

- Hardware: SDumont, SDumont 2nd, Expansão, HPC, cluster, nó, compute node, login node, partição, Bull Sequana X1120, container data center, glicol, InfiniBand EDR, socket, V100, NVLink, GDL
- SLURM: SLURM, job, job script, sbatch, srun, salloc, squeue, sinfo, sacct, scancel, scontrol, walltime, tarefa (MPI process), backfill, fairshare, QOS, UA, prioridade, GRES, block distribution
- Storage: $HOME, $SCRATCH, `/prj`, `/scratch`, Isilon, Lustre, NFS, striping, MDT, OST
- Ambiente: módulo, `module load`, `_sequana` suffix, conda, Singularity
- Acesso: VPN, SSH, Sophos/Sofos, scp, rsync
- Shell: PID, process, shell script, nodeset

Each entry should be:
- Definition written for a complete beginner — not a direct quote from any source
- 1-line `definicaoCurta` suitable for a tooltip (max ~15 words)
- 2-3 sentences `definicaoLonga` for the dropdown view
- `fonte` pointing to findings.md or narrator-voice.md section
- `etapaPrincipal` = the tour etapa where the term is first introduced

Full example for one entry:

```javascript
'backfill': {
    termo: 'backfill',
    definicaoCurta: 'Truque do SLURM que encaixa jobs pequenos nos "buracos" da fila sem atrasar os grandes.',
    definicaoLonga: 'Imagina a fila como um jogo de Tetris: o SLURM sabe quanto tempo cada job vai levar (por isso o --time é obrigatório) e consegue encaixar jobs curtos em espaços ociosos entre jobs grandes, desde que isso não atrase os grandes. Por isso vale a pena pedir um walltime honesto — pedir 48h pra um job que vai durar 6h faz você perder chance de backfill. O scheduler reage a isso silenciosamente, ninguém te avisa.',
    fonte: 'findings.md §6 + narrator-voice.md §3 (Bruno)',
    etapaPrincipal: 8
}
```

- [ ] **Step 2: Write test that counts entries and checks key terms exist**

Add to `tests/glossario.test.js`:

```javascript
import { allTerms, getTerm } from '../js/glossario.js';

test('glossary has 30+ entries', () => {
    assertTrue(allTerms().length >= 30);
});

test('all obligatory hardware terms are present', () => {
    const obligatory = ['SDumont', 'HPC', 'cluster', 'nó', 'V100', 'GDL', 'NVLink', 'InfiniBand EDR'];
    for (const t of obligatory) {
        assertTrue(getTerm(t) !== undefined, `missing term: ${t}`);
    }
});

test('all obligatory SLURM terms are present', () => {
    const obligatory = ['SLURM', 'sbatch', 'squeue', 'walltime', 'backfill', 'fairshare', 'QOS', 'UA'];
    for (const t of obligatory) {
        assertTrue(getTerm(t) !== undefined, `missing term: ${t}`);
    }
});

test('all obligatory storage terms are present', () => {
    const obligatory = ['$HOME', '$SCRATCH', '/prj', '/scratch', 'Lustre', 'NFS', 'Isilon'];
    for (const t of obligatory) {
        assertTrue(getTerm(t) !== undefined, `missing term: ${t}`);
    }
});
```

- [ ] **Step 3: Run tests — should pass once GLOSSARIO is fully expanded**

Expected: `133 passed`.

- [ ] **Step 4: Commit**

```bash
git add js/glossario.js tests/glossario.test.js
git commit -m "feat(glossary): 30+ entries covering hardware, SLURM, storage, access, and shell"
```

---

## Phase 6 — Polish (modals, shortcuts, accessibility, sandbox)

### Task 6.1: Base modal system + nano/vim editor modal

**Files:**
- Create: `js/ui/modals.js`
- Modify: `style.css`
- Modify: `js/commands/fs.js` (add nano/vim commands that open the modal)

- [ ] **Step 1: Implement `js/ui/modals.js`**

```javascript
// js/ui/modals.js
// Base modal system + specific modal renderers.
// One modal at a time. Closes on Escape, backdrop click, or explicit close button.

let currentModal = null;

export function openModal({ title, body, onClose, wide = false }) {
    closeModal();
    const root = document.getElementById('modais-root');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-window ${wide ? 'wide' : ''}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" aria-label="Fechar">✕</button>
            </div>
            <div class="modal-body">${body}</div>
        </div>
    `;
    root.appendChild(modal);
    currentModal = { modal, onClose };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', handleEscape);
    return modal;
}

function handleEscape(e) {
    if (e.key === 'Escape') closeModal();
}

export function closeModal() {
    if (!currentModal) return;
    currentModal.modal.remove();
    currentModal.onClose?.();
    currentModal = null;
    document.removeEventListener('keydown', handleEscape);
}

export function openEditor({ filename, initialContent, onSave }) {
    const body = `
        <div class="editor-modal">
            <div class="editor-filename">Editando: <code>${filename}</code></div>
            <textarea class="editor-textarea" spellcheck="false">${escapeHtml(initialContent)}</textarea>
            <div class="editor-actions">
                <button class="editor-save">💾 Salvar (Ctrl+S)</button>
                <button class="editor-cancel">Cancelar</button>
                <span class="editor-hint">Esc fecha sem salvar</span>
            </div>
        </div>
    `;
    const modal = openModal({ title: '📝 Editor', body, wide: true });
    const textarea = modal.querySelector('.editor-textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    modal.querySelector('.editor-save').addEventListener('click', () => {
        onSave(textarea.value);
        closeModal();
    });
    modal.querySelector('.editor-cancel').addEventListener('click', closeModal);
    textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            onSave(textarea.value);
            closeModal();
        }
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 2: Add nano/vim to `js/commands/fs.js`**

Append to `js/commands/fs.js`:

```javascript
register({
    name: 'nano',
    aliases: ['vim', 'vi'],
    help: 'Abre um editor modal para editar arquivos',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('nano: falta nome do arquivo');
        const path = args[0];
        let content = '';
        try { content = ctx.filesystem.cat(path); } catch (e) {}
        // Async open — handled in main.js via a signal
        return { stdout: '', signal: 'open-editor', editorArgs: { path, content } };
    }
});
```

Then in `main.js`, handle the signal in `executeCommand`:

```javascript
if (result.signal === 'open-editor') {
    const { openEditor } = await import('./ui/modals.js');
    openEditor({
        filename: result.editorArgs.path,
        initialContent: result.editorArgs.content,
        onSave: (newContent) => { filesystem.write(result.editorArgs.path, newContent); }
    });
}
```

- [ ] **Step 3: Add modal styles**

```css
/* =========================================================================
   MODALS
   ========================================================================= */
.modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
}
.modal-window {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    min-width: 480px;
    max-width: 640px;
    max-height: 85vh;
    display: flex; flex-direction: column;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
}
.modal-window.wide { max-width: 900px; width: 90vw; }
.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--sp-md);
    border-bottom: 1px solid var(--border);
}
.modal-header h3 { color: var(--accent-alt); }
.modal-close { font-size: 18px; padding: 4px 8px; }
.modal-body { padding: var(--sp-md); overflow-y: auto; flex: 1; }

/* Editor-specific */
.editor-modal { display: flex; flex-direction: column; gap: var(--sp-sm); }
.editor-filename { color: var(--text-dim); font-size: var(--fs-sm); }
.editor-textarea {
    width: 100%; height: 400px;
    background: #000; color: #e6edf3;
    border: 1px solid var(--border); border-radius: 4px;
    font-family: var(--font-mono); font-size: var(--fs-sm);
    padding: var(--sp-sm);
    resize: vertical;
}
.editor-actions { display: flex; gap: var(--sp-sm); align-items: center; }
.editor-save { background: var(--accent); color: var(--bg); padding: 8px 16px; border-radius: 4px; font-weight: 600; }
.editor-cancel { padding: 8px 16px; background: var(--surface-alt); border: 1px solid var(--border); border-radius: 4px; }
.editor-hint { color: var(--text-dim); font-size: var(--fs-sm); margin-left: auto; }
```

- [ ] **Step 4: Smoke-test** — in browser, run `nano train_palmvein.srm`, verify modal opens with content, edit something, save, then `cat train_palmvein.srm` — content should reflect edit.

- [ ] **Step 5: Commit**

```bash
git add js/ui/modals.js js/commands/fs.js js/main.js style.css
git commit -m "feat(ui): modal system with nano/vim editor"
```

---

### Task 6.2: v1 vs 2nd comparison card modal

**Files:**
- Create: `js/ui/v1-vs-2nd-modal.js`
- Modify: `js/main.js` (wire button + selo click)

- [ ] **Step 1: Implement `js/ui/v1-vs-2nd-modal.js`**

```javascript
// js/ui/v1-vs-2nd-modal.js
// Renders the SDumont v1 vs 2nd comparison table as a modal.
import { openModal } from './modals.js';
import { V1_VS_2ND } from '../../data/v1-vs-2nd.js';

export function showV1vs2ndModal() {
    const rows = V1_VS_2ND.linhas.map(l => `
        <tr>
            <td class="aspecto">${l.aspecto}</td>
            <td class="v1">${l.v1}</td>
            <td class="v2nd">${l.v2nd}</td>
        </tr>
    `).join('');
    const frases = V1_VS_2ND.frasesGuardian.map(f => `<li>${f}</li>`).join('');
    const body = `
        <div class="v1vs2nd">
            <p class="subtitulo">${V1_VS_2ND.subtitulo}</p>
            <ol class="guardian-phrases">${frases}</ol>
            <table class="comparacao">
                <thead>
                    <tr><th>Aspecto</th><th>SDumont Expansão (v1) — você</th><th>SDumont 2nd</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
    openModal({ title: '🔀 ' + V1_VS_2ND.titulo, body, wide: true });
}
```

- [ ] **Step 2: Wire up in `main.js`**

Add:

```javascript
import { showV1vs2ndModal } from './ui/v1-vs-2nd-modal.js';
document.getElementById('btn-v1-vs-2nd').addEventListener('click', showV1vs2ndModal);
document.querySelector('.selo-v1').addEventListener('click', showV1vs2ndModal);
```

- [ ] **Step 3: Add styles**

```css
.v1vs2nd .subtitulo { color: var(--text-dim); margin-bottom: var(--sp-md); }
.v1vs2nd .guardian-phrases {
    background: var(--surface-alt);
    border-left: 4px solid var(--accent-alt);
    padding: var(--sp-md) var(--sp-md) var(--sp-md) 32px;
    margin: var(--sp-md) 0;
    border-radius: 0 4px 4px 0;
}
.v1vs2nd .guardian-phrases li { margin-bottom: 4px; }
.comparacao {
    width: 100%; border-collapse: collapse;
    font-size: var(--fs-sm);
}
.comparacao th {
    text-align: left; padding: var(--sp-sm);
    border-bottom: 2px solid var(--border);
    color: var(--accent-alt);
}
.comparacao td { padding: var(--sp-sm); border-bottom: 1px solid var(--surface-alt); }
.comparacao td.aspecto { font-weight: 600; color: var(--text-dim); }
.comparacao td.v1 { color: var(--accent); }
.comparacao td.v2nd { color: var(--text); }
```

- [ ] **Step 4: Smoke-test** — click the selo, verify modal shows.

- [ ] **Step 5: Commit**

```bash
git add js/ui/v1-vs-2nd-modal.js js/main.js style.css
git commit -m "feat(ui): v1-vs-2nd comparison card with guardian phrases"
```

---

### Task 6.3: Help modal, glossary modal, keyboard shortcuts

**Files:**
- Create: `js/ui/help-modal.js`
- Modify: `js/main.js`

- [ ] **Step 1: Implement `js/ui/help-modal.js`**

```javascript
// js/ui/help-modal.js
// Help modal: lists supported commands and keyboard shortcuts.
import { openModal } from './modals.js';
import { listCommands } from '../commands/index.js';

export function showHelpModal() {
    const cmds = listCommands().sort((a, b) => a.name.localeCompare(b.name));
    const cmdList = cmds.map(c => `<li><code>${c.name}</code> — ${c.help || ''}</li>`).join('');

    const body = `
        <div class="help-modal">
            <h4>⌨️ Atalhos de teclado</h4>
            <ul>
                <li><kbd>Enter</kbd> — executa comando no terminal</li>
                <li><kbd>↑</kbd> / <kbd>↓</kbd> — navega pelo histórico</li>
                <li><kbd>Tab</kbd> — autocompleta (comandos e paths)</li>
                <li><kbd>Esc</kbd> — fecha modais</li>
                <li><kbd>→</kbd> / <kbd>←</kbd> — próximo/anterior no narrador (quando habilitado)</li>
                <li><kbd>Ctrl+L</kbd> — limpa o terminal</li>
                <li><kbd>Ctrl+S</kbd> — salva no editor</li>
                <li><kbd>?</kbd> — abre este menu</li>
            </ul>
            <h4>📟 Comandos suportados</h4>
            <ul class="cmd-list">${cmdList}</ul>
            <h4>📑 Perguntas para a reunião de terça</h4>
            <p class="reuniao-hint">Clica no botão 📘 (glossário) pra ver também a lista de perguntas abertas — vale levar impressa.</p>
        </div>
    `;
    openModal({ title: '❓ Ajuda', body, wide: true });
}
```

- [ ] **Step 2: Implement glossary modal in `js/ui/glossario.js`** (append)

```javascript
import { openModal } from './modals.js';

export function showGlossaryModal() {
    openModal({
        title: '📘 Glossário',
        body: renderGlossaryDropdown(),
        wide: true
    });
}
```

- [ ] **Step 3: Wire buttons and global shortcuts in `main.js`**

```javascript
import { showHelpModal } from './ui/help-modal.js';
import { showGlossaryModal } from './ui/glossario.js';

document.getElementById('btn-ajuda').addEventListener('click', showHelpModal);
document.getElementById('btn-glossario').addEventListener('click', showGlossaryModal);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?') { e.preventDefault(); showHelpModal(); }
    if (e.key === 'Escape') { /* modals handle their own */ }
});

// Ctrl+L in terminal clears
termInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        terminal.clear();
        renderTerminal();
    }
});
```

- [ ] **Step 4: Smoke-test** — click ❓, click 📘, press `?`, verify modals.

- [ ] **Step 5: Commit**

```bash
git add js/ui/help-modal.js js/ui/glossario.js js/main.js style.css
git commit -m "feat(ui): help and glossary modals with keyboard shortcuts"
```

---

### Task 6.4: Reset modal

**Files:**
- Create: `js/ui/reset-modal.js`
- Modify: `js/main.js`

- [ ] **Step 1: Implement `js/ui/reset-modal.js`**

```javascript
// js/ui/reset-modal.js
// Confirmation modal for resetting the tour.
import { openModal, closeModal } from './modals.js';

export function showResetModal({ onConfirm }) {
    const body = `
        <div class="reset-modal">
            <p>Você tem certeza que quer reiniciar o tour?</p>
            <p class="warning">Isso vai apagar seu progresso (etapas concluídas, histórico do terminal, estado salvo no navegador).</p>
            <div class="reset-actions">
                <button class="btn-danger confirm-reset">🔁 Sim, reiniciar</button>
                <button class="cancel-reset">Cancelar</button>
            </div>
        </div>
    `;
    const modal = openModal({ title: '🔁 Reiniciar tour', body });
    modal.querySelector('.confirm-reset').addEventListener('click', () => {
        onConfirm();
        closeModal();
        location.reload();
    });
    modal.querySelector('.cancel-reset').addEventListener('click', closeModal);
}
```

- [ ] **Step 2: Wire in `main.js`**

```javascript
import { showResetModal } from './ui/reset-modal.js';
document.getElementById('btn-reset').addEventListener('click', () => {
    showResetModal({ onConfirm: () => state.reset() });
});
```

- [ ] **Step 3: Styles**

```css
.reset-modal .warning { color: var(--warning); margin: var(--sp-sm) 0; }
.reset-actions { display: flex; gap: var(--sp-sm); margin-top: var(--sp-md); }
.btn-danger { background: var(--danger); color: white; padding: 8px 16px; border-radius: 4px; font-weight: 600; }
.cancel-reset { padding: 8px 16px; background: var(--surface-alt); border: 1px solid var(--border); border-radius: 4px; }
```

- [ ] **Step 4: Commit**

```bash
git add js/ui/reset-modal.js js/main.js style.css
git commit -m "feat(ui): reset modal with confirmation"
```

---

### Task 6.5: Accessibility + responsive layout

**Files:**
- Modify: `style.css`
- Modify: `index.html` (add mobile tabs)
- Modify: `js/main.js` (tab switching)

- [ ] **Step 1: Add mobile tab switcher to `index.html`**

Add after the `<header id="topo">`:

```html
<nav id="abas-mobile" class="abas-mobile" aria-label="Abas (mobile)">
    <button data-aba="narrador" class="aba ativa">📖 Narrador</button>
    <button data-aba="dashboard" class="aba">📊 Dashboard</button>
    <button data-aba="terminal" class="aba">⌨️ Terminal</button>
</nav>
```

- [ ] **Step 2: Wire tab switching in `main.js`**

```javascript
// Mobile tab switching
document.querySelectorAll('.abas-mobile .aba').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.aba;
        document.querySelectorAll('.abas-mobile .aba').forEach(b => b.classList.toggle('ativa', b === btn));
        document.getElementById('narrador').classList.toggle('ativo', target === 'narrador');
        document.getElementById('dashboard').classList.toggle('ativo', target === 'dashboard');
        document.getElementById('terminal').classList.toggle('ativo', target === 'terminal');
    });
});
```

- [ ] **Step 3: Update responsive CSS**

```css
.abas-mobile { display: none; }

@media (max-width: 1279px) {
    .app-shell {
        grid-template-rows: 56px 48px 1fr;
        grid-template-areas:
            "topo"
            "abas"
            "painel";
    }
    .abas-mobile {
        grid-area: abas;
        display: flex;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
    }
    .abas-mobile .aba {
        flex: 1;
        padding: var(--sp-sm);
        color: var(--text-dim);
        border-right: 1px solid var(--border);
    }
    .abas-mobile .aba.ativa { color: var(--accent-alt); background: var(--surface-alt); }
    .narrador, .dashboard, .terminal {
        grid-area: painel;
        display: none;
    }
    .narrador.ativo, .dashboard.ativo, .terminal.ativo { display: block; }
    .narrador.ativo { overflow-y: auto; }
}
```

- [ ] **Step 4: A11y pass**

Check in `index.html`:
- Every interactive element has `aria-label` or visible text
- All buttons use `<button>`, not `<div>`
- Language tag `lang="pt-BR"` on `<html>`
- `aria-live="polite"` on narrator (already there)

Check in browser DevTools Lighthouse: accessibility score ≥ 90.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css js/main.js
git commit -m "feat(ux): mobile tab layout + accessibility fixes (WCAG AA)"
```

---

### Task 6.6: Sandbox mode

**Files:**
- Modify: `js/narrator.js` (sandbox render)
- Modify: `js/main.js` (sandbox button wiring)

When `state.sandboxDesbloqueado === true`, clicking the 🏖️ button switches the narrator into a "cheat sheet" view with no command gating.

- [ ] **Step 1: Add sandbox rendering to `js/narrator.js`**

Append a function at the end of the file:

```javascript
export function renderSandboxCheatsheet() {
    return `
        <div class="sandbox-cheatsheet">
            <h2>🏖️ Sandbox — exploração livre</h2>
            <p>Você completou o tour! A partir daqui, o terminal aceita qualquer comando sem restrições. O cluster continua vivo, outros usuários continuam submetendo jobs. Pratique à vontade.</p>

            <h4>Comandos essenciais (cheat sheet)</h4>
            <ul>
                <li><code>module load cuda/11.2_sequana</code> — carrega CUDA</li>
                <li><code>module load anaconda3/2024.02_sequana</code> — carrega conda</li>
                <li><code>sbatch train_palmvein.srm</code> — submete job</li>
                <li><code>squeue --me</code> — seus jobs</li>
                <li><code>sinfo -p gdl</code> — estado da partição gdl</li>
                <li><code>scancel &lt;JOBID&gt;</code> — cancela seu job</li>
                <li><code>scontrol show jobid &lt;JOBID&gt;</code> — detalhes</li>
                <li><code>sacct -lj &lt;JOBID&gt;</code> — histórico completo</li>
                <li><code>nvidia-smi</code> — GPUs no nó atual (só em compute node)</li>
                <li><code>cat slurm-&lt;JOBID&gt;.out</code> — output do job</li>
            </ul>

            <h4>Paths principais</h4>
            <ul>
                <li><code>/prj/palmvein/unseen/</code> — $HOME (só login nodes)</li>
                <li><code>/scratch/palmvein/unseen/</code> — $SCRATCH (todos os nós)</li>
            </ul>

            <button class="btn-voltar-tour">← Voltar ao tour</button>
        </div>
    `;
}
```

- [ ] **Step 2: Wire the sandbox button in `main.js`**

```javascript
let inSandbox = false;
document.getElementById('btn-sandbox').addEventListener('click', () => {
    if (!state.sandboxDesbloqueado) return;
    inSandbox = !inSandbox;
    if (inSandbox) {
        import('./narrator.js').then(m => {
            document.getElementById('narrador').innerHTML = m.renderSandboxCheatsheet();
            document.querySelector('.btn-voltar-tour')?.addEventListener('click', () => {
                inSandbox = false;
                narratorHandle.render();
            });
        });
    } else {
        narratorHandle.render();
    }
});

// Enable sandbox button when unlocked
function refreshSandboxButton() {
    document.getElementById('btn-sandbox').disabled = !state.sandboxDesbloqueado;
}
refreshSandboxButton();
// Re-check on every narrator change
const origOnChange = narratorHandle.render;
```

- [ ] **Step 3: Styles**

```css
.sandbox-cheatsheet h4 { color: var(--accent); margin-top: var(--sp-md); }
.sandbox-cheatsheet code { background: var(--surface-alt); padding: 1px 6px; border-radius: 3px; }
.btn-voltar-tour { margin-top: var(--sp-md); padding: 8px 16px; background: var(--surface-alt); border: 1px solid var(--border); border-radius: 4px; }
```

- [ ] **Step 4: Smoke-test** — complete the tour (or set `state.sandboxDesbloqueado = true` in DevTools), click 🏖️, verify cheatsheet appears and terminal still works.

- [ ] **Step 5: Commit**

```bash
git add js/narrator.js js/main.js style.css
git commit -m "feat(sandbox): free-exploration mode with cheat sheet after tour completion"
```

---

## Phase 7 — Deployment

### Task 7.1: Full README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the complete README**

```markdown
# Simulador Educativo SDumont

Simulador interativo do supercomputador **Santos Dumont (Expansão v1, 2019)**,
do LNCC. Ensina do zero como operar o SDumont a alguém sem background em HPC,
através de um tour guiado de 9 etapas, dashboard do cluster ao vivo, e terminal
SSH simulado com ~45 comandos reais.

**Feito para aprender antes de uma reunião com a equipe do LNCC**, mas aberto
para qualquer pessoa curiosa.

## Abrir localmente

1. Clone este repositório (ou baixe os arquivos)
2. Abra `index.html` no navegador (Chrome, Firefox, ou Edge recentes)
3. Pronto — não precisa instalar nada

O simulador é 100% estático. Funciona offline. Sem npm, sem build, sem servidor.

Para desenvolvimento, abrir `tests.html` roda a suite de testes no navegador.

## O que o simulador ensina

9 etapas numeradas, na ordem didática:

0. **SDumont v1 vs 2nd** — qual máquina você vai usar e por que isso importa
1. **Conceitos e arquitetura** — HPC, cluster, nó, partição, 377 nós do v1
2. **Acesso (VPN + SSH)** — como entrar no cluster
3. **Transferência de dados** — `/prj` vs `/scratch` e a "pegadinha" principal
4. **Ambiente (modules + conda)** — como "acender" software no cluster
5. **Submissão SLURM (sbatch)** — escrever e submeter um job script
6. **Monitoramento** — squeue, sacct, sinfo, scontrol
7. **Resultados e logs** — ver output, baixar checkpoints
8. **Convivência multi-usuário** — fairshare, fila lotada, backfill

Depois das 9 etapas, destrava um **modo sandbox** onde você pratica livremente.

## Projeto palm vein

O simulador usa como estudo de caso um projeto fictício de
**biometria de veias palmares** (`unseen` no `/prj/palmvein`). Todos os arquivos
Python, scripts SLURM, e README são temáticos. O simulador não executa código
de verdade — os outputs são scriptados para ilustrar o workflow.

## Arquitetura técnica

- HTML + CSS + JavaScript vanilla (ES modules)
- Sem frameworks, sem build, sem dependências
- Estado persistido em `localStorage`
- Em-browser test harness (`tests.html`) para os módulos lógicos
- 377 nós computacionais simulados, 6 usuários fictícios ciclando jobs

Spec completo: `docs/superpowers/specs/2026-04-11-simulador-sdumont-design.md`
Plano de implementação: `docs/superpowers/plans/2026-04-11-simulador-sdumont-plan.md`

## Publicar como site estático

### Opção 1: Subdiretório do site pessoal
Copie a raiz do projeto (menos `research/` e `tests/`) para `public/simulador-sdumont/` do seu site e sirva como qualquer conteúdo estático.

### Opção 2: GitHub Pages
Push este repositório para o GitHub, ative Pages na branch principal. Não precisa de build.

### Opção 3: Standalone
Sirva a pasta com qualquer HTTP server (`python -m http.server`, `npx serve`, etc.).

## O que está fora do escopo

Este simulador **não**:
- roda código Python/CUDA de verdade
- conecta ao SDumont real
- cobre SDumont 2nd como alvo didático (só aparece no card comparativo)
- substitui a documentação oficial do LNCC

Para documentação oficial, veja:
- [Manual SDumont (v1)](https://github.com/lncc-sered/manual-sdumont)
- [Manual SDumont 2nd](https://github.com/lncc-sered/manual-sdumont2nd)

## Créditos

- **LNCC** — Laboratório Nacional de Computação Científica — pelo cluster real e pelo manual público
- **Curso "Escola Supercomputador Santos Dumont 2026"** — dos instrutores Bruno, Roberto, André Carneiro e Prof. Eduardo "Bidu" Garcia. O tom didático do narrador se inspira no ritmo deles
- Construído por Pedro Cormann em preparação para uma reunião de onboarding no SDumont

## Licença

Código: MIT.
Material textual deriva de conteúdo público do LNCC; referências apontam para o manual oficial.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: full README with overview, instructions, credits"
```

---

### Task 7.2: Final end-to-end smoke test

**Files:** (no changes — this is a verification task)

- [ ] **Step 1: Run the full test suite**

Open `tests.html` in the browser. Expected: `133+ passed, 0 failed`.

- [ ] **Step 2: Complete a full tour run**

Open `index.html` fresh (clear localStorage first in DevTools: `localStorage.clear()`). Walk through every single sub-step of all 9 etapas:

- [ ] Etapa 0: 3 sub-steps (introdução, 3 máquinas, frases guardiãs). Selo v1 visível.
- [ ] Etapa 1: 6 sub-steps (container, HPC, tipos de nó, partições, sockets, heterogêneo). Dashboard mostra 377 nós.
- [ ] Etapa 2: 7 sub-steps (VPN, SSH teoria, SSH prática, VPN caiu scene, login node não-determinístico, regra 30 min). Digita `ssh unseen@sdumont15`.
- [ ] Etapa 3: 5 sub-steps. Digita `cd ~`, tenta acessar /prj de compute node, vê erro.
- [ ] Etapa 4: 6 sub-steps. Digita `module avail`, `module load cuda/11.2_sequana`.
- [ ] Etapa 5: 9 sub-steps. Abre `nano train_palmvein.srm`, submete com `sbatch`. Vê erros didáticos.
- [ ] Etapa 6: 8 sub-steps. `squeue --me`, `sinfo`, `scontrol show jobid`, `scontrol update Partition=`, `sleep 300 &` → `top` → `kill -9`.
- [ ] Etapa 7: 5 sub-steps. `cat slurm-*.out`, `sacct`, `scp` reverso.
- [ ] Etapa 8: 8 sub-steps. Acelerar tempo 10x, ver fila andar, fairshare explicado.
- [ ] Sandbox destrava. Cheatsheet aparece. Botão 🏖️ habilitado. Pode usar qualquer comando sem gating.

- [ ] **Step 3: Verify modals and buttons**

- [ ] Click 🟦 selo v1 → comparison modal opens with all 15 rows
- [ ] Click 📘 → glossary with 30+ terms
- [ ] Click ❓ → help with keyboard shortcuts
- [ ] Click 🔁 → reset confirmation
- [ ] Click 🏖️ → sandbox (when unlocked)
- [ ] Press `Esc` → modal closes
- [ ] Press `?` → help opens
- [ ] Press `↑` in terminal → history

- [ ] **Step 4: Test localStorage persistence**

- [ ] Reload the page in the middle of the tour. Narrator should restore to the same step.
- [ ] Click 🔁, confirm. Page reloads. Narrator back at step 0.1.

- [ ] **Step 5: Test responsive**

Open DevTools, toggle device mode, resize below 1280px. Verify tabs appear with `[Narrador] [Dashboard] [Terminal]` buttons, only one visible at a time. Switching between them works.

- [ ] **Step 6: Test accessibility**

Run Lighthouse Accessibility audit. Score should be ≥ 90. Fix any contrast or missing label issues reported.

- [ ] **Step 7: Commit (if any fixes were applied)**

```bash
git add -A
git commit -m "fix: polish pass from end-to-end smoke test"
```

---

### Task 7.3: Publishing to personal site

**Files:**
- Create: `scripts/publish.sh` (optional helper script)
- Modify: `.gitignore` (confirm `research/` excluded)

- [ ] **Step 1: Create optional publish helper `scripts/publish.sh`**

```bash
#!/bin/bash
# scripts/publish.sh
# Publishes the simulator as a static subdirectory of the main Unflat site.
# Usage: ./scripts/publish.sh /path/to/site_unflat_2026/public/simulador-sdumont
set -euo pipefail

DEST="${1:-}"
if [ -z "$DEST" ]; then
    echo "Usage: $0 <dest-dir>"
    exit 1
fi

mkdir -p "$DEST"

# Copy only publishable assets — skip research, tests, docs
rsync -av --delete \
    --exclude='research/' \
    --exclude='tests/' \
    --exclude='tests.html' \
    --exclude='docs/' \
    --exclude='scripts/' \
    --exclude='.git/' \
    --exclude='.gitignore' \
    ./ "$DEST/"

echo "Published to $DEST"
echo "Total size:"
du -sh "$DEST"
```

Make executable: `chmod +x scripts/publish.sh`.

- [ ] **Step 2: Verify `.gitignore` correctly excludes research**

Run: `git status`. Confirm that `research/` contents are NOT listed.

- [ ] **Step 3: Push to remote (if configured)**

```bash
git push origin master
```

(If no remote configured, skip this step. Publishing to personal site happens manually with `publish.sh`.)

- [ ] **Step 4: Final commit**

```bash
git add scripts/publish.sh
git commit -m "chore: optional publish helper for Unflat site integration"
```

- [ ] **Step 5: Tag the v1 release**

```bash
git tag -a v1.0.0 -m "Simulador SDumont v1.0 — 9-step tour, sandbox, 133+ tests passing"
```

---

## Done!

At this point the simulator is **complete and publishable**. Hand-off checklist:

- [ ] All tasks above checked
- [ ] `tests.html` shows `133+ passed, 0 failed`
- [ ] End-to-end tour walkthrough succeeded on a fresh localStorage
- [ ] Modals (v1-vs-2nd, glossary, help, reset, editor) all work
- [ ] Sandbox unlocks after completing etapa 8
- [ ] Responsive layout usable on tablet
- [ ] README complete
- [ ] Git log shows coherent incremental commits (one per task)
- [ ] `v1.0.0` tag created
- [ ] Publish to personal site with `scripts/publish.sh` if desired






