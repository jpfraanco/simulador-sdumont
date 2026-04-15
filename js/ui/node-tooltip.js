// js/ui/node-tooltip.js
// Custom styled tooltip for dashboard nodes (replaces browser native title).
// Uses a single reusable DOM element with event delegation on .nodegrid-root.

let tooltipEl = null;

function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'node-tooltip';
    tooltipEl.innerHTML = '<div class="node-tooltip-content"></div>';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
}

function positionTooltip(nodeEl) {
    const rect = nodeEl.getBoundingClientRect();
    const tt = tooltipEl;
    const margin = 8;

    // Position above the node by default
    tt.style.left = `${rect.left + rect.width / 2}px`;
    tt.style.top = `${rect.top - margin}px`;
    tt.style.transform = 'translate(-50%, -100%)';
    tt.classList.remove('arrow-top');
    tt.classList.add('arrow-bottom');

    // After positioning, check if it overflows the top — flip below if so
    requestAnimationFrame(() => {
        const ttRect = tt.getBoundingClientRect();
        if (ttRect.top < 4) {
            tt.style.top = `${rect.bottom + margin}px`;
            tt.style.transform = 'translate(-50%, 0)';
            tt.classList.remove('arrow-bottom');
            tt.classList.add('arrow-top');
        }
        // Clamp horizontally
        const ttRect2 = tt.getBoundingClientRect();
        if (ttRect2.left < 4) {
            tt.style.left = `${4 + ttRect2.width / 2}px`;
        } else if (ttRect2.right > window.innerWidth - 4) {
            tt.style.left = `${window.innerWidth - 4 - ttRect2.width / 2}px`;
        }
    });
}

function buildTooltipHTML(nodeEl, cluster) {
    const nodeId = nodeEl.id;
    const node = cluster.nodes.find(n => n.id === nodeId)
        || cluster.loginNodes.find(n => n.id === nodeId);
    if (!node) return null;

    const stateColors = { idle: '#3fb950', mix: '#d29922', alloc: '#f85149', down: '#6e7681' };
    const stateLabels = { idle: 'Livre', mix: 'Parcial', alloc: 'Cheio', down: 'Offline' };
    const color = stateColors[node.state] || '#6e7681';
    const label = stateLabels[node.state] || node.state.toUpperCase();

    // Jobs running on this node
    const jobs = cluster.jobs.filter(j => j.allocatedNodes.includes(nodeId) && j.state === 'R');

    let html = `
        <div class="ntt-header">
            <span class="ntt-name">${nodeId}</span>
            <span class="ntt-state" style="color:${color}">${label}</span>
        </div>
        <div class="ntt-resources">
            <div class="ntt-row">
                <span class="ntt-label">CPU</span>
                <span class="ntt-bar-wrap">
                    <span class="ntt-bar" style="width:${node.cpusTotal ? (node.cpusAllocated / node.cpusTotal * 100) : 0}%;background:${color}"></span>
                </span>
                <span class="ntt-val">${node.cpusAllocated}/${node.cpusTotal}</span>
            </div>`;

    if (node.gpusTotal > 0) {
        html += `
            <div class="ntt-row">
                <span class="ntt-label">GPU</span>
                <span class="ntt-bar-wrap">
                    <span class="ntt-bar" style="width:${(node.gpusAllocated / node.gpusTotal * 100)}%;background:${color}"></span>
                </span>
                <span class="ntt-val">${node.gpusAllocated}/${node.gpusTotal}</span>
            </div>`;
    }

    html += `
            <div class="ntt-row">
                <span class="ntt-label">RAM</span>
                <span class="ntt-bar-wrap">
                    <span class="ntt-bar" style="width:${node.memGBTotal ? (node.memGBAllocated / node.memGBTotal * 100) : 0}%;background:${color}"></span>
                </span>
                <span class="ntt-val">${node.memGBAllocated}/${node.memGBTotal} GB</span>
            </div>
        </div>`;

    if (jobs.length > 0) {
        html += `<div class="ntt-jobs">`;
        for (const j of jobs) {
            html += `<div class="ntt-job"><span class="ntt-job-name">${j.name}</span> <span class="ntt-job-user">${j.user}</span></div>`;
        }
        html += `</div>`;
    } else {
        html += `<div class="ntt-empty">Sem jobs rodando</div>`;
    }

    return html;
}

export function mountNodeTooltip(container, cluster) {
    const tt = ensureTooltip();
    const content = tt.querySelector('.node-tooltip-content');

    container.addEventListener('mouseover', (e) => {
        const nodeEl = e.target.closest('.node');
        if (!nodeEl) return;
        const html = buildTooltipHTML(nodeEl, cluster);
        if (!html) return;
        content.innerHTML = html;
        positionTooltip(nodeEl);
        tt.classList.add('visible');
    });

    container.addEventListener('mouseout', (e) => {
        const nodeEl = e.target.closest('.node');
        if (!nodeEl) return;
        // Only hide if we're not moving to another node
        const related = e.relatedTarget?.closest?.('.node');
        if (!related) {
            tt.classList.remove('visible');
        }
    });
}
