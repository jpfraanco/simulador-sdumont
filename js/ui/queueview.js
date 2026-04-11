// js/ui/queueview.js
// Renders the SLURM job queue as a table, highlighting current-user rows.
function fmtElapsed(sec) {
    if (!sec) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
}
function fmtWall(sec) {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
}

export function renderQueueView(cluster, currentUser) {
    if (cluster.jobs.length === 0) {
        return `<section class="queue-section"><h4>Fila de jobs</h4><div class="queue-empty">(fila vazia — submeta um job com sbatch)</div></section>`;
    }
    const rows = cluster.jobs.map(j => {
        const isMe = j.user === currentUser;
        const elapsed = j.state === 'R' ? fmtElapsed(j.elapsedSec) : '0:00';
        const wall = fmtWall(j.walltimeSec);
        const info = j.state === 'R'
            ? (j.allocatedNodes[0] || '')
            : `(${j.reason || 'None'})`;
        return `
            <tr class="${isMe ? 'row-me' : ''}">
                <td>${j.id}</td>
                <td>${j.partition}</td>
                <td>${j.name}</td>
                <td>${j.user}</td>
                <td class="st-${j.state}">${j.state}</td>
                <td>${elapsed} / ${wall}</td>
                <td>${j.nodes}</td>
                <td>${info}</td>
            </tr>
        `;
    }).join('');
    return `
        <section class="queue-section">
            <h4>Fila de jobs (${cluster.jobs.length})</h4>
            <table class="queue-table">
                <thead>
                    <tr>
                        <th>JobID</th><th>Partition</th><th>Name</th><th>User</th>
                        <th>ST</th><th>Time/Wall</th><th>N</th><th>Nodes/Reason</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </section>
    `;
}
