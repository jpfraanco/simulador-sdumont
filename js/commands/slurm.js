// js/commands/slurm.js
import { register } from './index.js';

function parseSrm(content) {
    const directives = {};
    for (const line of content.split('\n')) {
        const m = line.match(/^#SBATCH\s+(.+)$/);
        if (!m) continue;
        const rest = m[1].trim().replace(/\s+#.*$/, '');
        const longEq = rest.match(/^--([a-zA-Z-]+)=(.+)$/);
        const longSpace = rest.match(/^--([a-zA-Z-]+)\s+(.+)$/);
        const shortForm = rest.match(/^-([a-zA-Z])\s+(.+)$/);
        if (longEq) directives[longEq[1]] = longEq[2];
        else if (longSpace) directives[longSpace[1]] = longSpace[2];
        else if (shortForm) {
            const map = { p: 'partition', J: 'job-name', N: 'nodes', t: 'time' };
            directives[map[shortForm[1]] || shortForm[1]] = shortForm[2];
        } else if (rest.startsWith('--')) {
            directives[rest.slice(2)] = true;
        }
    }
    return directives;
}

function parseWalltime(str) {
    if (!str) return null;
    const parts = String(str).split(/[-:]/).map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 4) return parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3];
    return null;
}

function pad(str, n) { return String(str || '').padEnd(n).slice(0, n); }
function padl(str, n) { return String(str || '').padStart(n).slice(0, n); }
function fmtElapsed(sec) {
    if (!sec) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
}

register({
    name: 'sbatch',
    help: 'Submete um job script ao SLURM',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('sbatch: error: No script specified');
        let content;
        try {
            content = ctx.filesystem.cat(args[0]);
        } catch (e) {
            return { stdout: '', stderr: `sbatch: error: Unable to open file ${args[0]}`, exitCode: 1 };
        }
        const d = parseSrm(content);
        const partition = d['partition'] || d['p'];
        if (!partition) return { stdout: '', stderr: 'sbatch: error: No partition specified (-p)', exitCode: 1 };

        const nodes = parseInt(d['nodes'] || d['N'] || '1', 10);
        const gpus = parseInt(d['gpus'] || d['gpus-per-node'] || '0', 10);
        const cpusPerGpu = parseInt(d['cpus-per-gpu'] || '0', 10);
        const cpusPerTask = parseInt(d['cpus-per-task'] || '0', 10);
        const ntasksPerNode = parseInt(d['ntasks-per-node'] || '1', 10);
        const cpus = gpus * cpusPerGpu + cpusPerTask * ntasksPerNode * nodes || 8;
        const memGB = parseInt(d['mem-per-gpu'] || '0', 10) / 1024 * gpus || 64;
        const walltimeSec = parseWalltime(d['time'] || d['t']);

        try {
            const jobId = ctx.cluster.submitJob({
                user: ctx.currentUser, partition, nodes, gpus, cpus, memGB, walltimeSec,
                name: d['job-name'] || d['J'] || 'job',
                script: ctx.filesystem.resolve(args[0])
            });
            return `Submitted batch job ${jobId}\n`;
        } catch (e) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }
});

register({
    name: 'squeue',
    help: 'Mostra jobs na fila (--me filtra os seus)',
    run: (args, ctx) => {
        const me = args.includes('--me');
        const uIdx = args.indexOf('-u');
        const user = uIdx >= 0 ? args[uIdx + 1] : (me ? ctx.currentUser : null);
        let jobs = ctx.cluster.jobs;
        if (user) jobs = jobs.filter(j => j.user === user);

        const header = `${pad('JOBID', 8)} ${pad('PARTITION', 18)} ${pad('NAME', 18)} ${pad('USER', 11)} ${pad('ST', 3)} ${padl('TIME', 8)}  ${padl('NODES', 5)} NODELIST(REASON)`;
        const lines = [header];
        for (const j of jobs) {
            const time = j.state === 'R' ? fmtElapsed(j.elapsedSec) : '0:00';
            const nodelist = j.state === 'R' ? `${j.allocatedNodes.join(',')}` : `(${j.reason || 'None'})`;
            lines.push(`${pad(j.id, 8)} ${pad(j.partition, 18)} ${pad(j.name, 18)} ${pad(j.user, 11)} ${pad(j.state, 3)} ${padl(time, 8)}  ${padl(String(j.nodes), 5)} ${nodelist}`);
        }
        if (jobs.length === 0) lines.push('(fila vazia)');
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'sinfo',
    help: 'Mostra estado das partições',
    run: (args, ctx) => {
        const pIdx = args.indexOf('-p');
        const filter = pIdx >= 0 ? args[pIdx + 1] : null;
        const lines = [`${pad('PARTITION', 24)} AVAIL  TIMELIMIT       NODES STATE`];
        for (const p of ctx.cluster.partitions) {
            if (filter && p.name !== filter) continue;
            const nodes = ctx.cluster.getNodesByPartition(p.name);
            const idle = nodes.filter(n => n.state === 'idle').length;
            const mix = nodes.filter(n => n.state === 'mix').length;
            const alloc = nodes.filter(n => n.state === 'alloc').length;
            if (idle > 0)  lines.push(`${pad(p.name, 24)} up    ${pad(p.walltimeMax, 14)} ${padl(String(idle), 5)} idle`);
            if (mix > 0)   lines.push(`${pad(p.name, 24)} up    ${pad(p.walltimeMax, 14)} ${padl(String(mix), 5)} mix`);
            if (alloc > 0) lines.push(`${pad(p.name, 24)} up    ${pad(p.walltimeMax, 14)} ${padl(String(alloc), 5)} alloc`);
            if (idle === 0 && mix === 0 && alloc === 0) lines.push(`${pad(p.name, 24)} up    ${pad(p.walltimeMax, 14)} ${padl('0', 5)} n/a`);
        }
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'scancel',
    help: 'Cancela um job seu',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('scancel: error: job id required');
        ctx.cluster.cancelJob(args[0], ctx.currentUser);
        return '';
    }
});

register({
    name: 'scontrol',
    help: 'Inspeciona ou atualiza jobs (show jobid / update)',
    run: (args, ctx) => {
        const sub = args[0];
        if (sub === 'show' && (args[1] === 'jobid' || args[1] === 'job')) {
            const job = ctx.cluster.jobs.find(j => j.id === args[2]);
            if (!job) return { stdout: '', stderr: `slurm_load_jobs error: Invalid job id specified`, exitCode: 1 };
            return [
                `JobId=${job.id} JobName=${job.name}`,
                `   UserId=${job.user}  Partition=${job.partition}`,
                `   NumNodes=${job.nodes} NumCPUs=${job.cpus} GRES=gpu:${job.gpus}`,
                `   JobState=${job.state}  Reason=${job.reason || 'None'}`,
                `   RunTime=${fmtElapsed(job.elapsedSec)}  TimeLimit=${fmtElapsed(job.walltimeSec || 0)}`,
                `   NodeList=${(job.allocatedNodes || []).join(',')}`,
                `   Command=${job.script}`,
                ''
            ].join('\n');
        }
        if (sub === 'update') {
            const upd = {};
            for (const a of args.slice(1)) {
                const [k, v] = a.split('=');
                upd[k] = v;
            }
            const job = ctx.cluster.jobs.find(j => j.id === upd.JobId);
            if (!job) return { stdout: '', stderr: 'slurm_update_job error: Invalid job id specified', exitCode: 1 };
            if (upd.Partition) job.partition = upd.Partition;
            return '';
        }
        return { stdout: '', stderr: `scontrol: unknown subcommand`, exitCode: 1 };
    }
});

register({
    name: 'sacct',
    help: 'Histórico de accounting',
    run: (args, ctx) => {
        const ljIdx = args.indexOf('-lj');
        const jIdx = args.indexOf('-j');
        const jobId = args[ljIdx + 1] || args[jIdx + 1];
        if (!jobId) return 'JobID\tJobName\tPartition\tState\tElapsed\n';
        const job = ctx.cluster.jobs.find(j => j.id === jobId);
        if (!job) return `${jobId}\t(not found)\n`;
        return [
            `JobID          JobName      Partition   State       Elapsed      MaxRSS   AveCPU`,
            `${pad(job.id,14)} ${pad(job.name,12)} ${pad(job.partition,11)} ${pad(job.state,11)} ${fmtElapsed(job.elapsedSec)}   128GB    85%`,
            ''
        ].join('\n');
    }
});

register({
    name: 'sprio',
    help: 'Fatores de prioridade dos jobs pendentes',
    run: (args, ctx) => {
        const lines = ['JOBID    PARTITION         PRIORITY     AGE  FAIRSHARE  PARTITION   QOS'];
        for (const j of ctx.cluster.jobs.filter(j => j.state === 'PD')) {
            lines.push(`${pad(j.id,8)} ${pad(j.partition,17)} ${pad('15234',11)} ${pad('120',6)} ${pad('8100',10)} ${pad('5000',11)} ${pad('2014',5)}`);
        }
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'srun',
    help: 'Execução interativa (didático)',
    run: () => '[srun] comando rodaria num recurso alocado pelo SLURM\n'
});

register({
    name: 'salloc',
    help: 'Aloca recursos interativamente',
    run: (args, ctx) => {
        const jobId = ctx.cluster.allocateJobId();
        return [
            `salloc: Pending job allocation ${jobId}`,
            `salloc: Granted job allocation ${jobId}`,
            `salloc: Nodes sd2nd-cpu001 are ready for job`,
            ''
        ].join('\n');
    }
});
