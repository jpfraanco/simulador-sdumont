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
import { ETAPAS } from '../data/tour.js';

// Self-registering command modules
import './commands/fs.js';
import './commands/ssh.js';
import './commands/modules.js';
import './commands/slurm.js';
import './commands/utils.js';

console.log('[simulador-sdumont] booting...');

// =====================================================================
// USER SELECTION SCREEN
// =====================================================================

function renderUserSelection() {
    const app = document.getElementById('app');
    app.style.display = 'none';

    const screen = document.createElement('div');
    screen.id = 'user-select-screen';
    screen.innerHTML = `
        <div class="user-select-container">
            <div class="user-select-header">
                <span class="user-select-selo">🟦 SDumont Expansão (v1)</span>
                <h1>Simulador Educativo do Santos Dumont</h1>
                <p>Escolha quem é você para começar (ou continuar) o tour. Cada pessoa tem seu próprio progresso salvo.</p>
            </div>
            <div class="user-cards">
                ${USERS.map(u => {
                    const progress = getUserProgress(u.id);
                    const etapaDone = progress ? progress.etapasConcluidas.length : 0;
                    const etapaAtual = progress ? progress.etapaAtual : 0;
                    const pct = Math.round((etapaDone / ETAPAS.length) * 100);
                    const hasProgress = progress !== null;
                    return `
                        <div class="user-card" data-user="${u.id}">
                            <div class="user-emoji">${u.emoji}</div>
                            <div class="user-name">${u.nome}</div>
                            <div class="user-progress-info">
                                ${hasProgress
                                    ? `<div class="user-progress-bar"><div class="user-progress-fill" style="width:${pct}%"></div></div>
                                       <span class="user-progress-text">${etapaDone}/${ETAPAS.length} etapas (${pct}%)</span>`
                                    : `<span class="user-progress-text new">Novo — sem progresso</span>`}
                            </div>
                            ${hasProgress ? `<button class="user-reset-btn" data-reset="${u.id}" title="Resetar progresso de ${u.nome}">🔁 Resetar</button>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <p class="user-select-footer">O progresso é salvo no navegador (localStorage). Se limpar os dados do browser, perde o progresso.</p>
        </div>
    `;
    document.body.appendChild(screen);

    // Card clicks → select user
    screen.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.user-reset-btn')) return; // don't select if clicking reset
            const userId = card.dataset.user;
            setActiveUser(userId);
            screen.remove();
            bootSimulator(userId);
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
                renderUserSelection(); // re-render
            }
        });
    });
}

// =====================================================================
// BOOT SIMULATOR
// =====================================================================

function bootSimulator(userId) {
    const app = document.getElementById('app');
    app.style.display = '';

    const userName = USERS.find(u => u.id === userId)?.nome || userId;

    const state = createState(userId);
    const cluster = createCluster();
    const filesystem = createFilesystem();
    const terminal = createTerminal();

    seedFictionalJobs(cluster);
    cluster.scheduleQueue();

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
            dashboardHandle.stop();
            app.style.display = 'none';
            document.getElementById('narrador').innerHTML = '';
            document.getElementById('progresso').innerHTML = '';
            termEl.innerHTML = '';
            renderUserSelection();
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

const activeUser = getActiveUser();
if (activeUser && USERS.find(u => u.id === activeUser)) {
    bootSimulator(activeUser);
} else {
    renderUserSelection();
}
