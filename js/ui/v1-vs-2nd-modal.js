// js/ui/v1-vs-2nd-modal.js
import { openModal } from './modals.js';
import { V1_VS_2ND } from '../../data/v1-vs-2nd.js';

export function showV1vs2ndModal() {
    const rows = V1_VS_2ND.linhas.map(l =>
        `<tr><td class="td-aspecto">${l.aspecto}</td><td class="td-v1">${l.v1}</td><td class="td-v2">${l.v2}</td></tr>`
    ).join('');
    const guardians = V1_VS_2ND.guardians.map(f => `<li>${f}</li>`).join('');
    const body = `
        <p class="modal-subtitle">${V1_VS_2ND.subtitulo}</p>
        <ol class="guardian-list">${guardians}</ol>
        <table class="comparison-table">
            <thead><tr><th>Aspecto</th><th>v1 — você</th><th>2nd</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
    openModal({ title: '🔀 ' + V1_VS_2ND.titulo, body, wide: true });
}
