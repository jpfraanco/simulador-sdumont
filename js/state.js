// js/state.js
// Global mutable state store. Persisted to localStorage.
export const STORAGE_KEY = 'simulador-sdumont:state:v1';
export const CURRENT_VERSION = 1;

const DEFAULT_STATE = {
    version: CURRENT_VERSION,
    tourStepId: '0.1-bem-vindo',
    etapaAtual: 0,
    etapasConcluidas: [],
    historicoTerminal: [],
    sandboxDesbloqueado: false,
    loadedModules: [],
    preferencias: { som: false, velocidadeTick: 1 }
};

export function createState() {
    const s = structuredClone(DEFAULT_STATE);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.version === CURRENT_VERSION) Object.assign(s, parsed);
        }
    } catch (e) {
        console.warn('[state] restore failed, using defaults:', e);
    }
    s.persist = function () {
        const toSave = { ...this };
        delete toSave.persist;
        delete toSave.reset;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch (e) {}
    };
    s.reset = function () {
        localStorage.removeItem(STORAGE_KEY);
        Object.assign(this, structuredClone(DEFAULT_STATE));
    };
    return s;
}
