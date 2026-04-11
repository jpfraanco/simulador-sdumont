// js/narrator.js
// Tour engine: renderiza o passo atual, navega Next/Back, gating por esperaComando.
import { ETAPAS, STEPS, getStepById, getNextStep, getPreviousStep, getFirstStepOfEtapa } from '../data/tour.js';

export function createNarrator({ state }) {
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
            return true;
        }
        if (next.etapa !== cur.etapa) {
            if (!state.etapasConcluidas.includes(cur.etapa)) {
                state.etapasConcluidas.push(cur.etapa);
            }
            state.etapaAtual = next.etapa;
        }
        state.tourStepId = next.id;
        commandMet = false;
        state.persist();
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
        return true;
    }

    function jumpToEtapa(etapaNum) {
        const first = getFirstStepOfEtapa(etapaNum);
        if (!first) return false;
        state.tourStepId = first.id;
        state.etapaAtual = etapaNum;
        commandMet = false;
        state.persist();
        return true;
    }

    function notifyCommand(cmdStr) {
        const s = currentStep();
        if (!s || !s.esperaComando) return;
        if (s.esperaComando.test(cmdStr)) commandMet = true;
    }

    function renderHTML() {
        const s = currentStep();
        if (!s) return '<p>Tour vazio.</p>';
        const etapa = ETAPAS.find(e => e.num === s.etapa);
        const subSteps = STEPS.filter(x => x.etapa === s.etapa);
        const subIdx = subSteps.findIndex(x => x.id === s.id) + 1;
        const prev = getPreviousStep(s.id);
        const next = getNextStep(s.id);
        const advReady = canAdvance();
        return `
            <div class="narrator-inner">
                <div class="narrator-breadcrumb">
                    <span>Etapa ${s.etapa}: ${etapa?.titulo || ''}</span>
                    <span class="sub-counter">${subIdx}/${subSteps.length}</span>
                </div>
                <h2 class="narrator-titulo">${s.titulo}</h2>
                <div class="narrator-corpo">${s.narracao}</div>
                <div class="narrator-botoes">
                    <button class="btn-back" ${prev ? '' : 'disabled'}>← Voltar</button>
                    ${next
                        ? `<button class="btn-next" ${advReady ? '' : 'disabled'} title="${advReady ? '' : 'digite o comando indicado pra avançar'}">${advReady ? 'Próximo →' : '⏳ aguardando comando'}</button>`
                        : `<button class="btn-next" ${advReady ? '' : 'disabled'}>${advReady ? '🏁 Finalizar tour' : '⏳ aguardando comando'}</button>`}
                </div>
            </div>
        `;
    }

    return { currentStep, canAdvance, advance, back, jumpToEtapa, notifyCommand, renderHTML };
}

export function mountNarrator({ container, state, onChange }) {
    const narrator = createNarrator({ state });
    function render() {
        container.innerHTML = narrator.renderHTML();
        const nextBtn = container.querySelector('.btn-next');
        const backBtn = container.querySelector('.btn-back');
        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (narrator.advance()) { render(); onChange?.(); }
        });
        if (backBtn) backBtn.addEventListener('click', () => {
            if (narrator.back()) { render(); onChange?.(); }
        });
    }
    render();
    return {
        render,
        narrator,
        notifyCommand(cmd) {
            narrator.notifyCommand(cmd);
            render();
        }
    };
}
