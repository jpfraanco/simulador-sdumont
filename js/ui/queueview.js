// js/ui/queueview.js
// Renders the SLURM job queue as a table with rich tooltips.

const STATE_TIPS = {
    PD: 'Pending — esperando na fila por recursos ou prioridade',
    R:  'Running — rodando agora num compute node',
    CG: 'Completing — finalizando, liberando recursos',
    CD: 'Completed — terminou com sucesso',
    F:  'Failed — falhou (crash, OOM, ou exit code ≠ 0)',
    TO: 'Timeout — passou do walltime e foi morto pelo SLURM',
    CA: 'Cancelled — cancelado pelo usuário (scancel)'
};

const REASON_TIPS = {
    Resources:            'Não tem hardware disponível — todos os nós compatíveis estão ocupados',
    Priority:             'Outros jobs têm prioridade maior (fairshare, age, QOS)',
    QOSMinGRES:           'Você esqueceu de pedir GPU (--gpus) numa partição GPU',
    PartitionTimeLimit:   'Seu --time passa do máximo permitido pela partição',
    AssociationJobLimit:  'Seu projeto bateu o limite de 100 jobs simultâneos',
    None:                 'Sem razão específica — job está processando normalmente'
};

const PARTITION_TIPS = {
    sequana_cpu:             'CPU Cascade Lake 48c, 384GB. Walltime max 96h.',
    sequana_cpu_dev:         'CPU dev — max 20min, prioridade alta pra testes rápidos.',
    sequana_cpu_long:        'CPU longo — até 744h (31 dias).',
    sequana_cpu_bigmem:      'CPU BIGMEM 768GB RAM. Walltime 96h.',
    sequana_cpu_bigmem_long: 'BIGMEM longo — até 744h.',
    sequana_gpu:             '4× V100 por nó. Walltime 96h. Compartilhado.',
    sequana_gpu_dev:         'GPU dev — max 20min, prioridade alta.',
    sequana_gpu_long:        'GPU longo — até 744h.',
    gdl:                     'Deep Learning: 1 nó, 8× V100 NVLink. Walltime 48h.'
};

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

function tip(text) { return `title="${(text || '').replace(/"/g, '&quot;')}"`; }

export function renderQueueView(cluster, currentUser) {
    if (cluster.jobs.length === 0) {
        return `<section class="queue-section"><h4>Fila de jobs</h4><div class="queue-empty">(fila vazia — submeta um job com sbatch)</div></section>`;
    }
    const rows = cluster.jobs.map(j => {
        const isMe = j.user === currentUser;
        const elapsed = j.state === 'R' ? fmtElapsed(j.elapsedSec) : '0:00';
        const wall = fmtWall(j.walltimeSec);
        const reasonText = j.state === 'R' ? (j.allocatedNodes[0] || '') : `(${j.reason || 'None'})`;
        const reasonTip = j.state !== 'R' ? (REASON_TIPS[j.reason] || j.reason || '') : `Rodando em ${(j.allocatedNodes || []).join(', ')}`;
        return `
            <tr class="${isMe ? 'row-me' : ''}">
                <td>${j.id}</td>
                <td ${tip(PARTITION_TIPS[j.partition])}>${j.partition}</td>
                <td>${j.name}</td>
                <td>${j.user}</td>
                <td class="st-${j.state}" ${tip(STATE_TIPS[j.state])}>${j.state}</td>
                <td>${elapsed} / ${wall}</td>
                <td>${j.nodes}</td>
                <td ${tip(reasonTip)}>${reasonText}</td>
            </tr>
        `;
    }).join('');
    return `
        <section class="queue-section">
            <h4>Fila de jobs (${cluster.jobs.length})</h4>
            <table class="queue-table">
                <thead>
                    <tr>
                        <th ${tip('ID único do job no SLURM')}>JobID</th>
                        <th ${tip('Partição/fila onde o job foi submetido')}>Partition</th>
                        <th ${tip('Nome dado ao job via --job-name ou -J')}>Name</th>
                        <th ${tip('Login do usuário que submeteu')}>User</th>
                        <th ${tip('Estado: PD=pendente, R=rodando, CD=completo, CA=cancelado')}>ST</th>
                        <th ${tip('Tempo rodando / walltime solicitado')}>Time/Wall</th>
                        <th ${tip('Número de nós alocados')}>N</th>
                        <th ${tip('Nós alocados (se R) ou razão de pendência (se PD)')}>Nodes/Reason</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </section>
    `;
}
