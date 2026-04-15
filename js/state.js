// js/state.js
// Global mutable state store. Persisted to localStorage per-user.
export const ACTIVE_USER_KEY = 'simulador-sdumont:active-user';
export const CURRENT_VERSION = 1;

export const USERS = [
    { id: 'joao',  nome: 'João',  emoji: '🧑‍💻' },
    { id: 'pedro', nome: 'Pedro', emoji: '👨‍🔬' },
    { id: 'gui',   nome: 'Gui',   emoji: '🧑‍🎓' },
    { id: 'david', nome: 'David', emoji: '👨‍💼' }
];

function storageKey(userId) {
    return `simulador-sdumont:state:2nd:${userId}`;
}

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

export function getActiveUser() {
    return localStorage.getItem(ACTIVE_USER_KEY) || null;
}

export function setActiveUser(userId) {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function clearActiveUser() {
    localStorage.removeItem(ACTIVE_USER_KEY);
}

export function getUserProgress(userId) {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.version === CURRENT_VERSION) return parsed;
        }
    } catch (e) {}
    return null;
}

export function resetUserProgress(userId) {
    localStorage.removeItem(storageKey(userId));
}

export function createState(userId) {
    const key = storageKey(userId);
    const s = structuredClone(DEFAULT_STATE);
    s.userId = userId;
    try {
        const raw = localStorage.getItem(key);
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
        try { localStorage.setItem(key, JSON.stringify(toSave)); } catch (e) {}
    };
    s.reset = function () {
        localStorage.removeItem(key);
        const fresh = structuredClone(DEFAULT_STATE);
        fresh.userId = userId;
        Object.assign(this, fresh);
    };
    return s;
}
