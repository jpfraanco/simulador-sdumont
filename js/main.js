// js/main.js
// Entry point. Shows user selection screen first, then boots the simulator.
import { createState, getActiveUser, setActiveUser, clearActiveUser, USERS, getUserProgress, resetUserProgress } from './state.js';
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
import { MODULES } from '../data/modules-index.js';
import * as tourSdumont from '../data/tour.js';
import * as tourOpenmp from '../data/tour-openmp.js';
import { OPENMP_FILES } from '../data/openmp-files.js';

const TOUR_MODULES = {
    sdumont: tourSdumont,
    openmp: tourOpenmp
};

// Self-registering command modules
import './commands/fs.js';
import './commands/ssh.js';
import './commands/modules.js';
import './commands/slurm.js';
import './commands/utils.js';
import './commands/compile.js';

console.log('[simulador-sdumont] booting...');

// =====================================================================
// USER SELECTION SCREEN
// =====================================================================

let selectedModuleId = 'sdumont'; // default

function renderUserSelection() {
    const app = document.getElementById('app');
    app.style.display = 'none';

    const screen = document.createElement('div');
    screen.id = 'user-select-screen';
    screen.innerHTML = `
        <div class="user-select-container">
            <div class="user-select-header">
                <span class="user-select-selo">🟦 SDumont — Simulador Educativo</span>
                <h1>Escola Supercomputador Santos Dumont</h1>
                <p>Escolha o módulo e depois quem você é.</p>
            </div>

            <h2 style="color:#58a6ff; margin: 24px 0 16px; font-size:20px;">📚 Módulos de aprendizado</h2>
            <div class="module-cards">
                ${MODULES.map(m => {
                    const active = m.id === selectedModuleId;
                    const disabled = m.comingSoon;
                    return `
                        <div class="module-card ${active ? 'active' : ''} ${disabled ? 'coming-soon' : ''}" data-module="${m.id}">
                            <div class="module-num">${m.num}</div>
                            <div class="module-info">
                                <div class="module-emoji">${m.emoji}</div>
                                <div class="module-titulo">${m.titulo}</div>
                                <div class="module-sub">${m.subtitulo}</div>
                                ${disabled ? '<span class="module-badge">em breve</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <h2 style="color:#3fb950; margin: 32px 0 16px; font-size:20px;">👤 Quem é você?</h2>
            <div class="user-cards">
                ${USERS.map(u => {
                    const progress = getUserProgress(u.id);
                    const hasProgress = progress !== null;
                    return `
                        <div class="user-card" data-user="${u.id}">
                            <div class="user-emoji">${u.emoji}</div>
                            <div class="user-name">${u.nome}</div>
                            <div class="user-progress-info">
                                ${hasProgress
                                    ? `<span class="user-progress-text">tem progresso salvo</span>`
                                    : `<span class="user-progress-text new">Novo</span>`}
                            </div>
                            ${hasProgress ? `<button class="user-reset-btn" data-reset="${u.id}" title="Resetar progresso de ${u.nome}">🔁</button>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <p class="user-select-footer">Progresso salvo no navegador (localStorage) por pessoa e por módulo.</p>
        </div>
    `;
    document.body.appendChild(screen);

    // Module card clicks
    screen.querySelectorAll('.module-card:not(.coming-soon)').forEach(card => {
        card.addEventListener('click', () => {
            selectedModuleId = card.dataset.module;
            screen.querySelectorAll('.module-card').forEach(c => c.classList.toggle('active', c.dataset.module === selectedModuleId));
        });
    });

    // User card clicks → save selection, reload to boot clean
    screen.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.user-reset-btn')) return;
            const userId = card.dataset.user;
            setActiveUser(userId);
            localStorage.setItem('simulador-sdumont:active-module', selectedModuleId);
            location.reload();
        });
    });

    // Reset buttons
    screen.querySelectorAll('.user-reset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = btn.dataset.reset;
            const user = USERS.find(u => u.id === userId);
            if (confirm(`Tem certeza que quer apagar todo o progresso de ${user.nome}?`)) {
                resetUserProgress(userId);
                screen.remove();
                renderUserSelection();
            }
        });
    });
}

// =====================================================================
// BOOT SIMULATOR
// =====================================================================

function bootSimulator(userId, moduleId = 'sdumont') {
    const app = document.getElementById('app');
    app.style.display = '';

    const userName = USERS.find(u => u.id === userId)?.nome || userId;
    const moduleName = MODULES.find(m => m.id === moduleId)?.titulo || moduleId;
    const tourData = TOUR_MODULES[moduleId] || tourSdumont;

    const state = createState(userId);
    state.activeModule = moduleId;
    const cluster = createCluster();
    const filesystem = createFilesystem();
    const terminal = createTerminal();

    seedFictionalJobs(cluster);
    cluster.scheduleQueue();

    // Load OpenMP fake files into filesystem
    if (moduleId === 'openmp' || true) { // always load so files are available
        for (const [path, content] of Object.entries(OPENMP_FILES)) {
            try {
                // Ensure parent dirs exist
                const parts = path.split('/').filter(Boolean);
                let dir = '/';
                for (let i = 0; i < parts.length - 1; i++) {
                    dir += (dir === '/' ? '' : '/') + parts[i];
                    try { filesystem.mkdir(dir); } catch (e) {}
                }
                filesystem.write(path, content);
            } catch (e) {}
        }
    }

    const ctx = {
        cluster, filesystem, terminal, state,
        currentUser: 'pedro',
        hostname: 'local'
    };

    // ---------- Dashboard ----------
    const dashboardHandle = mountDashboard({
        cluster, state,
        container: document.getElementById('dashboard'),
        getCurrentUser: () => ctx.currentUser
    });

    // ---------- Progress stepper ----------
    const progressHandle = mountProgress(
        document.getElementById('progresso'),
        state,
        tourData.ETAPAS,
        (etapa) => {
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
        tourData,
        onChange: () => progressHandle.render()
    });

    // ---------- Terminal ----------
    const termEl = document.getElementById('terminal');
    termEl.innerHTML = '';
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

    refreshPrompt();
    terminal.appendOutput(`Simulador SDumont — ${userName}, bem-vindo(a)!`);
    terminal.appendOutput(`Módulo: ${moduleName}`);
    terminal.appendOutput('Para entrar no cluster:  ssh unseen@sdumont15');
    terminal.appendOutput('Para listar comandos:    help');
    terminal.appendOutput('');
    renderTerminal();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('.modal-backdrop') && !e.target.closest('.user-select-container')) {
            termInput.focus();
        }
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

    // "Trocar usuário" button
    const switchBtn = document.getElementById('btn-switch-user');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            clearActiveUser();
            localStorage.removeItem('simulador-sdumont:active-module');
            location.reload();
        });
    }

    // Glossary hydration + highlight on each narrator render
    const origRender = narratorHandle.render;
    narratorHandle.render = function () {
        origRender();
        const corpo = document.querySelector('.narrator-corpo');
        if (corpo) corpo.innerHTML = hydrateTerms(corpo.innerHTML);
        const step = narratorHandle.narrator.currentStep();
        clearHighlight();
        if (step && step.destaque) highlight(step.destaque);
    };
    narratorHandle.render();

    // Sandbox
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

    const renderObserver = new MutationObserver(() => {
        sandboxBtn.disabled = !state.sandboxDesbloqueado;
    });
    renderObserver.observe(document.getElementById('narrador'), { childList: true });

    window.__sim = { ctx, cluster, filesystem, terminal, state, narratorHandle };
}

// =====================================================================
// ENTRY: check if user already selected, else show selection screen
// =====================================================================

// Check if user + module already selected (from previous selection)
const activeUser = getActiveUser();
const activeModule = localStorage.getItem('simulador-sdumont:active-module');
if (activeUser && USERS.find(u => u.id === activeUser) && activeModule && TOUR_MODULES[activeModule]) {
    bootSimulator(activeUser, activeModule);
} else {
    renderUserSelection();
}
