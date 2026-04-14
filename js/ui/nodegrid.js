// js/ui/nodegrid.js
// Renders all 377 nodes as a color-coded grid, grouped by hwType.
// Enhanced tooltips show node details + jobs running on that node.

export function renderNodeGrid(cluster) {
    const groups = [
        { label: 'CPU — Intel Cascade Lake 48 cores, 384 GB', hwType: 'cpu', short: 'CPU' },
        { label: 'BIGMEM — Intel Cascade Lake 48 cores, 768 GB', hwType: 'bigmem', short: 'BIGMEM' },
        { label: 'GPU — 4× NVIDIA V100, 48 cores, 384 GB', hwType: 'gpu', short: 'GPU' },
        { label: 'GDL — 8× NVIDIA V100 NVLink (Deep Learning)', hwType: 'gdl', short: 'GDL' }
    ];
    const sections = [];
    for (const g of groups) {
        const nodes = cluster.nodes.filter(n => n.hwType === g.hwType);
        const idle = nodes.filter(n => n.state === 'idle').length;
        const alloc = nodes.filter(n => n.state === 'alloc').length;
        const mix = nodes.filter(n => n.state === 'mix').length;

        const cells = nodes.map(n => {
            // Build rich tooltip
            const jobs = cluster.jobs.filter(j => j.allocatedNodes.includes(n.id) && j.state === 'R');
            const jobInfo = jobs.length > 0
                ? `\nJobs: ${jobs.map(j => `${j.name} (${j.user})`).join(', ')}`
                : '\nLivre — sem jobs rodando';
            const title = `${n.id} [${n.state.toUpperCase()}]`
                + `\nCores: ${n.cpusAllocated}/${n.cpusTotal} usados`
                + (n.gpusTotal > 0 ? `\nGPUs: ${n.gpusAllocated}/${n.gpusTotal} usadas` : '')
                + `\nRAM: ${n.memGBAllocated}/${n.memGBTotal} GB`
                + jobInfo;
            return `<span id="${n.id}" class="node ${n.state}" title="${title.replace(/"/g, '&quot;')}"></span>`;
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
