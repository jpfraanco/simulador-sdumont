// js/ui/glossary-modal.js
import { openModal } from './modals.js';
import { allTerms } from '../glossario.js';

export function showGlossaryModal() {
    const terms = allTerms().sort((a, b) => a.termo.localeCompare(b.termo));
    const entries = terms.map(t => `
        <div class="glossary-entry">
            <strong>${t.termo}</strong>
            <span class="glossary-def">${t.curta}</span>
            <span class="glossary-etapa">etapa ${t.etapa}</span>
        </div>
    `).join('');
    openModal({
        title: `📘 Glossário (${terms.length} termos)`,
        body: `<div class="glossary-list">${entries}</div>`,
        wide: true
    });
}
