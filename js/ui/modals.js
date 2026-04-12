// js/ui/modals.js
// Base modal system. One modal at a time. Closes on Escape/backdrop click/close button.

let current = null;

export function openModal({ title, body, wide = false }) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
        <div class="modal-window ${wide ? 'wide' : ''}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" aria-label="Fechar">✕</button>
            </div>
            <div class="modal-body">${body}</div>
        </div>
    `;
    document.body.appendChild(backdrop);
    current = backdrop;
    backdrop.querySelector('.modal-close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', escHandler);
    return backdrop;
}

function escHandler(e) { if (e.key === 'Escape') closeModal(); }

export function closeModal() {
    if (!current) return;
    current.remove();
    current = null;
    document.removeEventListener('keydown', escHandler);
}
