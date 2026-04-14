// js/progress.js
// Barra de progresso — aceita etapas dinâmicas (suporta múltiplos módulos).

export function renderProgress(state, etapas) {
    const chips = etapas.map(e => {
        let cls = 'step';
        const done = state.etapasConcluidas.includes(e.num);
        if (done) cls += ' done';
        if (e.num === state.etapaAtual) cls += ' active';
        if (e.num > state.etapaAtual && !done) cls += ' locked';
        const icon = done ? '✓' : e.num;
        const clickable = done || e.num === state.etapaAtual;
        return `<button class="${cls}" data-etapa="${e.num}" ${clickable ? '' : 'disabled'} title="${e.descricao}">
            <span class="step-num">${icon}</span>
            <span class="step-label">${e.titulo}</span>
        </button>`;
    }).join('');
    const sandboxCls = state.sandboxDesbloqueado ? 'step sandbox unlocked' : 'step sandbox locked';
    const sandbox = `<span class="${sandboxCls}" title="Sandbox — exploração livre">
        <span class="step-num">🏖️</span>
    </span>`;
    return `<div class="progresso-track">${chips}${sandbox}</div>`;
}

export function mountProgress(container, state, etapas, onStepClick) {
    function render() { container.innerHTML = renderProgress(state, etapas); bind(); }
    function bind() {
        container.querySelectorAll('[data-etapa]').forEach(btn => {
            btn.addEventListener('click', () => {
                const n = parseInt(btn.dataset.etapa, 10);
                onStepClick?.(n);
            });
        });
    }
    render();
    return { render };
}
