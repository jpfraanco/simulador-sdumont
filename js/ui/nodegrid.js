// js/ui/nodegrid.js
// Renders all 377 nodes as a color-coded grid, grouped by hwType.
// Enhanced tooltips show node details + jobs running on that node.

export function renderNodeGrid(cluster) {
    const groups = [
        { label: 'CPU AMD — Genoa-X 9684X, 192 cores, 768 GB', hwType: 'cpu_amd', short: 'CPU AMD' },
        { label: 'H100 — 4× NVIDIA H100 SXM 80GB', hwType: 'h100', short: 'H100' },
        { label: 'GH200 — 4× Grace Hopper', hwType: 'gh200', short: 'GH200' },
        { label: 'MI300A — 2× AMD Instinct MI300A APU', hwType: 'mi300a', short: 'MI300A' },
        { label: 'Grace — ARM CPU 144 cores', hwType: 'grace', short: 'GRACE' }
    ];
    const sections = [];
    for (const g of groups) {
        const nodes = cluster.nodes.filter(n => n.hwType === g.hwType);
        const idle = nodes.filter(n => n.state === 'idle').length;
        const alloc = nodes.filter(n => n.state === 'alloc').length;
        const mix = nodes.filter(n => n.state === 'mix').length;

        const cells = nodes.map(n => {
            return `<span id="${n.id}" class="node ${n.state}"></span>`;
        }).join('');

        const summary = `${idle} livres, ${alloc} cheios${mix > 0 ? `, ${mix} parciais` : ''}`;
        sections.push(`
            <div class="node-group">
                <h4>${g.short} (${nodes.length}) <span class="node-summary">${summary}</span></h4>
                <div class="node-grid">${cells}</div>
            </div>
        `);
    }
    return `<div class="nodegrid-root">${sections.join('')}</div>`;
}
