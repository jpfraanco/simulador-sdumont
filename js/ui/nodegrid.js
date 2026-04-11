// js/ui/nodegrid.js
// Renders all 377 nodes as a color-coded grid, grouped by hwType.
export function renderNodeGrid(cluster) {
    const groups = [
        { label: 'CPU', hwType: 'cpu' },
        { label: 'BIGMEM', hwType: 'bigmem' },
        { label: 'GPU (4× V100)', hwType: 'gpu' },
        { label: 'GDL (8× V100 NVLink)', hwType: 'gdl' }
    ];
    const sections = [];
    for (const g of groups) {
        const nodes = cluster.nodes.filter(n => n.hwType === g.hwType);
        const cells = nodes.map(n => {
            const title = `${n.id} — ${n.state} — GPUs ${n.gpusAllocated}/${n.gpusTotal}, cores ${n.cpusAllocated}/${n.cpusTotal}`;
            return `<span id="${n.id}" class="node ${n.state}" title="${title}"></span>`;
        }).join('');
        sections.push(`
            <div class="node-group">
                <h4>${g.label} (${nodes.length})</h4>
                <div class="node-grid">${cells}</div>
            </div>
        `);
    }
    return `<div class="nodegrid-root">${sections.join('')}</div>`;
}
