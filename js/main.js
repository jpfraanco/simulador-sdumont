// js/main.js
// Entry point: wires state, cluster, filesystem, terminal, dashboard, and commands.
import { createState } from './state.js';
import { createCluster } from './cluster.js';
import { createFilesystem } from './filesystem.js';
import { createTerminal } from './terminal.js';
import { seedFictionalJobs } from './users.js';
import { mountDashboard } from './ui/dashboard.js';
import { dispatch } from './commands/index.js';
import { tokenize } from './commands/parser.js';
import { mountNarrator } from './narrator.js';
import { mountProgress } from './progress.js';
import { hydrateTerms } from './glossario.js';
import { highlight, clearHighlight } from './ui/highlight.js';
import { showV1vs2ndModal } from './ui/v1-vs-2nd-modal.js';
import { showGlossaryModal } from './ui/glossary-modal.js';
import { renderSandboxCheatsheet } from './ui/sandbox.js';

// Self-registering command modules
import './commands/fs.js';
import './commands/ssh.js';
import './commands/modules.js';
import './commands/slurm.js';
import './commands/utils.js';

console.log('[simulador-sdumont] booting...');

// ---------- Core state ----------
const state = createState();
const cluster = createCluster();
const filesystem = createFilesystem();
const terminal = createTerminal();

seedFictionalJobs(cluster);
cluster.scheduleQueue();

// Mutable identity — changes on ssh/exit
const ctx = {
    cluster,
    filesystem,
    terminal,
    state,
    currentUser: 'pedro',
    hostname: 'local'
};

// ---------- Dashboard ----------
mountDashboard({
    cluster, state,
    container: document.getElementById('dashboard'),
    getCurrentUser: () => ctx.currentUser
});

// ---------- Progress stepper ----------
const progressHandle = mountProgress(
    document.getElementById('progresso'),
    state,
    (etapa) => {
        // Clique em etapa concluída ou atual: pula pro primeiro passo dela
        if (state.etapasConcluidas.includes(etapa) || etapa === state.etapaAtual) {
            narratorHandle.narrator.jumpToEtapa(etapa);
            narratorHandle.render();
            progressHandle.render();
        }
    }
);

// ---------- Narrator ----------
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
const termPromptSpan = document.createElement('span');
termPromptSpan.className = 'term-prompt';
const termInput = document.createElement('input');
termInput.className = 'term-input';
termInput.type = 'text';
termInput.autocomplete = 'off';
termInput.autocapitalize = 'off';
termInput.spellcheck = false;
termInputLine.append(termPromptSpan, termInput);
termEl.append(termOutput, termInputLine);

function renderTerminal() {
    termOutput.innerHTML = '';
    for (const line of terminal.getOutput()) {
        const div = document.createElement('div');
        if (typeof line === 'string') {
            div.textContent = line;
        } else if (line && line.kind === 'err') {
            div.className = 'err';
            div.textContent = line.text;
        } else if (line && line.kind === 'prompt') {
            div.className = 'prompt-line';
            div.textContent = line.text;
        } else {
            div.textContent = String(line);
        }
        termOutput.appendChild(div);
    }
    termPromptSpan.textContent = terminal.getPrompt();
    termEl.scrollTop = termEl.scrollHeight;
}

function refreshPrompt() {
    terminal.setPrompt(
        `${ctx.currentUser}@${ctx.hostname}`,
        filesystem.pwd(),
        filesystem.getHome()
    );
}

function executeCommand(rawLine) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
        terminal.appendCommandLine(terminal.getPrompt(), '');
        renderTerminal();
        return;
    }
    terminal.appendCommandLine(terminal.getPrompt(), rawLine);
    terminal.addToHistory(rawLine);

    const tokens = tokenize(rawLine);
    const result = dispatch(tokens, ctx);

    if (result.stdout) {
        for (const l of result.stdout.replace(/\n$/, '').split('\n')) terminal.appendOutput(l);
    }
    if (result.stderr) {
        for (const l of result.stderr.replace(/\n$/, '').split('\n')) terminal.appendOutputError(l);
    }
    if (result.signal === 'exit-ssh') {
        ctx.hostname = 'local';
        ctx.currentUser = 'pedro';
        filesystem.setHost('local');
        filesystem.setUser('pedro');
        filesystem.setCwd('/home/pedro');
    }

    refreshPrompt();
    renderTerminal();

    // Notifica o narrator pra que `esperaComando` possa liberar o Próximo
    narratorHandle.notifyCommand(rawLine);
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
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        terminal.clear();
        renderTerminal();
    }
});

// Initial boot messages
refreshPrompt();
terminal.appendOutput('Simulador SDumont — máquina local simulada (pedro@local)');
terminal.appendOutput('Para entrar no cluster:  ssh unseen@sdumont15');
terminal.appendOutput('Para listar comandos:    help');
terminal.appendOutput('');
renderTerminal();

// Focus the terminal on click anywhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('button')) termInput.focus();
});
termInput.focus();

// ---------- Modals & buttons ----------
document.querySelector('.selo-v1')?.addEventListener('click', showV1vs2ndModal);
document.getElementById('btn-v1v2')?.addEventListener('click', showV1vs2ndModal);
document.getElementById('btn-glossario')?.addEventListener('click', showGlossaryModal);
document.getElementById('btn-help')?.addEventListener('click', () => {
    executeCommand('help');
    termInput.focus();
});

// Glossary hydration: after each narrator render, wrap known terms with tooltips
const origNarratorRender = narratorHandle.render;
narratorHandle.render = function () {
    origNarratorRender();
    // Hydrate terms
    const corpo = document.querySelector('.narrator-corpo');
    if (corpo) corpo.innerHTML = hydrateTerms(corpo.innerHTML);
    // Apply highlight
    const step = narratorHandle.narrator.currentStep();
    clearHighlight();
    if (step && step.destaque) highlight(step.destaque);
};
narratorHandle.render(); // re-render once to apply hydration on first load

// Sandbox chip click
let inSandbox = false;
const sandboxBtn = document.createElement('button');
sandboxBtn.id = 'btn-sandbox';
sandboxBtn.title = 'Sandbox';
sandboxBtn.textContent = '🏖️';
sandboxBtn.disabled = !state.sandboxDesbloqueado;
document.querySelector('.cards-fixos')?.prepend(sandboxBtn);

sandboxBtn.addEventListener('click', () => {
    if (!state.sandboxDesbloqueado) return;
    inSandbox = !inSandbox;
    const narratorEl = document.getElementById('narrador');
    if (inSandbox) {
        narratorEl.innerHTML = renderSandboxCheatsheet();
        narratorEl.querySelector('.btn-voltar-tour')?.addEventListener('click', () => {
            inSandbox = false;
            narratorHandle.render();
        });
    } else {
        narratorHandle.render();
    }
});

// Refresh sandbox button state when narrator changes
const origOnChange = narratorHandle.narrator.advance.bind(narratorHandle.narrator);
// Monitor sandbox unlock on every narrator render
const renderObserver = new MutationObserver(() => {
    sandboxBtn.disabled = !state.sandboxDesbloqueado;
});
renderObserver.observe(document.getElementById('narrador'), { childList: true });

// Expose ctx for debugging
window.__sim = { ctx, cluster, filesystem, terminal, state, narratorHandle };
