// js/cluster.js
// Cluster state + query functions + SLURM lifecycle.
import { makeInitialCluster, HARDWARE } from '../data/initial-cluster.js';

const PARTITION_TO_HWTYPE = {
    'lncc-cpu_amd':       'cpu_amd',
    'cpu_amd_dev':        'cpu_amd',
    'lncc-h100':          'h100',
    'lncc-h100_shared':   'h100',
    'h100_dev':           'h100',
    'lncc-gh200':         'gh200',
    'lncc-gh200_shared':  'gh200',
    'gh200_dev':          'gh200',
    'lncc-mi300a':        'mi300a',
    'lncc-mi300a_shared': 'mi300a',
    'mi300a_dev':         'mi300a',
    'lncc-grace':         'grace'
};

function walltimeToSec(str) {
    const parts = str.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function recomputeNodeState(n) {
    if (n.cpusAllocated === 0 && n.gpusAllocated === 0 && n.memGBAllocated === 0) return 'idle';
    const cpuFull = n.cpusAllocated >= n.cpusTotal;
    const gpuFull = n.gpusTotal > 0 && n.gpusAllocated >= n.gpusTotal;
    if (cpuFull || gpuFull) return 'alloc';
    return 'mix';
}

function tryAllocate(candidates, job) {
    const needed = job.nodes;
    const result = [];
    const perNodeCpus = Math.ceil(job.cpus / needed);
    const perNodeGpus = Math.ceil(job.gpus / needed);
    const perNodeMem = Math.ceil(job.memGB / needed);
    for (const n of candidates) {
        if (result.length >= needed) break;
        const freeCpus = n.cpusTotal - n.cpusAllocated;
        const freeGpus = n.gpusTotal - n.gpusAllocated;
        const freeMem = n.memGBTotal - n.memGBAllocated;
        if (freeCpus >= perNodeCpus && freeGpus >= perNodeGpus && freeMem >= perNodeMem) {
            result.push(n);
        }
    }
    return result.length === needed ? result : [];
}

export function createCluster() {
    const raw = makeInitialCluster();
    return {
        ...raw,

        getNodesByPartition(name) {
            const hwType = PARTITION_TO_HWTYPE[name];
            return hwType ? this.nodes.filter(n => n.hwType === hwType) : [];
        },
        getPartition(name) { return this.partitions.find(p => p.name === name); },
        getNode(id) {
            return this.nodes.find(n => n.id === id) || this.loginNodes.find(n => n.id === id);
        },
        getHardwareInfo(hwType) { return HARDWARE[hwType]; },
        allocateJobId() { return String(this.nextJobId++); },

        submitJob(request) {
            const part = this.getPartition(request.partition);
            if (!part) {
                const e = new Error(`sbatch: error: invalid partition '${request.partition}' specified`);
                throw e;
            }
            if (!part.name.endsWith('_dev') && !request.walltimeSec) {
                throw new Error('sbatch: error: Job submit/allocate failed: Requested time limit is invalid (missing or exceeds some limit)');
            }
            const maxSec = walltimeToSec(part.walltimeMax);
            if (request.walltimeSec && request.walltimeSec > maxSec) {
                throw new Error('sbatch: error: Job submit/allocate failed: Requested time limit exceeds partition maximum');
            }
            const targetNodes = this.getNodesByPartition(part.name);
            if (targetNodes.length === 0) {
                throw new Error('sbatch: error: Invalid generic resource (gres) specification');
            }
            const nodeGpus = targetNodes[0].gpusTotal;
            if (request.gpus > nodeGpus * (request.nodes || 1)) {
                throw new Error('sbatch: error: Requested node configuration is not available');
            }
            const job = {
                id: this.allocateJobId(),
                user: request.user,
                partition: part.name,
                nodes: request.nodes || 1,
                gpus: request.gpus || 0,
                cpus: request.cpus || 8,
                memGB: request.memGB || 64,
                walltimeSec: request.walltimeSec,
                name: request.name || 'job',
                script: request.script || '',
                state: 'PD',
                reason: 'Priority',
                submitTime: Date.now(),
                startTime: null,
                elapsedSec: 0,
                allocatedNodes: []
            };
            this.jobs.push(job);
            return job.id;
        },

        scheduleQueue() {
            const pending = this.jobs.filter(j => j.state === 'PD').sort((a, b) => {
                const aDev = a.partition.endsWith('_dev') ? 0 : 1;
                const bDev = b.partition.endsWith('_dev') ? 0 : 1;
                if (aDev !== bDev) return aDev - bDev;
                return a.submitTime - b.submitTime;
            });
            for (const job of pending) {
                const part = this.getPartition(job.partition);
                const candidates = this.getNodesByPartition(job.partition);
                if (part.gpusPerJob > 0 && job.gpus === 0) {
                    job.reason = 'QOSMinGRES';
                    continue;
                }
                const allocated = tryAllocate(candidates, job);
                if (allocated.length === 0) {
                    job.reason = 'Resources';
                    continue;
                }
                for (const n of allocated) {
                    n.cpusAllocated += Math.ceil(job.cpus / allocated.length);
                    n.gpusAllocated += Math.ceil(job.gpus / allocated.length);
                    n.memGBAllocated += Math.ceil(job.memGB / allocated.length);
                    n.currentJobs.push(job.id);
                    n.state = recomputeNodeState(n);
                }
                job.allocatedNodes = allocated.map(n => n.id);
                job.state = 'R';
                job.reason = null;
                job.startTime = Date.now();
            }
        },

        tick(deltaSec = 2) {
            for (const job of this.jobs) {
                if (job.state === 'R') {
                    job.elapsedSec += deltaSec;
                    if (job.elapsedSec >= (job.walltimeSec || Infinity)) {
                        job.state = 'CG';
                    }
                } else if (job.state === 'CG') {
                    job.state = 'CD';
                    this.releaseResources(job);
                }
            }
            // Drop very old completed jobs to keep queue readable
            const now = Date.now();
            this.jobs = this.jobs.filter(j => {
                if (j.state === 'CD' || j.state === 'CA' || j.state === 'F') {
                    return (now - (j.startTime || j.submitTime)) < 60000;
                }
                return true;
            });
            this.scheduleQueue();
        },

        releaseResources(job) {
            for (const nodeId of job.allocatedNodes) {
                const n = this.getNode(nodeId);
                if (!n) continue;
                n.cpusAllocated = Math.max(0, n.cpusAllocated - Math.ceil(job.cpus / job.allocatedNodes.length));
                n.gpusAllocated = Math.max(0, n.gpusAllocated - Math.ceil(job.gpus / job.allocatedNodes.length));
                n.memGBAllocated = Math.max(0, n.memGBAllocated - Math.ceil(job.memGB / job.allocatedNodes.length));
                n.currentJobs = n.currentJobs.filter(id => id !== job.id);
                n.state = recomputeNodeState(n);
            }
            job.allocatedNodes = [];
        },

        cancelJob(jobId, requestingUser) {
            const job = this.jobs.find(j => j.id === jobId);
            if (!job) throw new Error(`scancel: error: Invalid job id specified`);
            if (job.user !== requestingUser) {
                throw new Error(`scancel: error: Kill job error on job id ${jobId}: Access/operation not authorized with job`);
            }
            if (job.state === 'R' || job.state === 'CG') this.releaseResources(job);
            job.state = 'CA';
        }
    };
}
