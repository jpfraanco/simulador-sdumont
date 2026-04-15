// data/initial-cluster.js
// SDumont 2nd (2024) topology — Bull Sequana XH3000.
// 180 compute nodes: 60 CPU AMD + 62 H100 + 36 GH200 + 18 MI300A + 4 Grace.
// Source: spec v2 §6.1, official wiki manual-sdumont2nd.

export const PARTITIONS = [
    { name: 'lncc-cpu_amd',        walltimeMax: '72:00:00',  hwType: 'cpu_amd',  gpusPerJob: 0, devPriority: false },
    { name: 'cpu_amd_dev',         walltimeMax: '00:20:00',  hwType: 'cpu_amd',  gpusPerJob: 0, devPriority: true  },
    { name: 'lncc-h100',           walltimeMax: '24:00:00',  hwType: 'h100',     gpusPerJob: 4, devPriority: false },
    { name: 'lncc-h100_shared',    walltimeMax: '24:00:00',  hwType: 'h100',     gpusPerJob: 1, devPriority: false },
    { name: 'h100_dev',            walltimeMax: '00:20:00',  hwType: 'h100',     gpusPerJob: 4, devPriority: true  },
    { name: 'lncc-gh200',          walltimeMax: '24:00:00',  hwType: 'gh200',    gpusPerJob: 4, devPriority: false },
    { name: 'lncc-gh200_shared',   walltimeMax: '24:00:00',  hwType: 'gh200',    gpusPerJob: 1, devPriority: false },
    { name: 'gh200_dev',           walltimeMax: '00:20:00',  hwType: 'gh200',    gpusPerJob: 4, devPriority: true  },
    { name: 'lncc-mi300a',         walltimeMax: '24:00:00',  hwType: 'mi300a',   gpusPerJob: 2, devPriority: false },
    { name: 'lncc-mi300a_shared',  walltimeMax: '24:00:00',  hwType: 'mi300a',   gpusPerJob: 1, devPriority: false },
    { name: 'mi300a_dev',          walltimeMax: '00:20:00',  hwType: 'mi300a',   gpusPerJob: 2, devPriority: true  },
    { name: 'lncc-grace',          walltimeMax: '72:00:00',  hwType: 'grace',    gpusPerJob: 0, devPriority: false }
];

export const NODE_COUNTS = { cpu_amd: 60, h100: 62, gh200: 36, mi300a: 18, grace: 4 };

export const HARDWARE = {
    cpu_amd: { cpus: 192, memGB: 768,  gpuModel: null,                           gpuCount: 0, cpuModel: 'AMD EPYC Genoa-X 9684X (192 cores)' },
    h100:    { cpus: 96,  memGB: 512,  gpuModel: 'NVIDIA H100 SXM 80GB',         gpuCount: 4, cpuModel: 'Intel Xeon Sapphire Rapids' },
    gh200:   { cpus: 72,  memGB: 480,  gpuModel: 'NVIDIA GH200 Grace Hopper',    gpuCount: 4, cpuModel: 'NVIDIA Grace ARM (72 cores)' },
    mi300a:  { cpus: 48,  memGB: 256,  gpuModel: 'AMD Instinct MI300A APU',       gpuCount: 2, cpuModel: 'AMD EPYC (integrated APU)' },
    grace:   { cpus: 144, memGB: 512,  gpuModel: null,                           gpuCount: 0, cpuModel: 'NVIDIA Grace ARM (144 cores)' }
};

export const LOGIN_NODES = [
    { id: 'sdumont2nd4', state: 'up', ip: '146.134.176.5', hw: '2x AMD EPYC 9454, 386GB, 2x H100' },
    { id: 'sdumont2nd5', state: 'up', ip: '146.134.176.6', hw: '2x AMD EPYC 9454, 386GB, 2x H100' },
    { id: 'sdumont2nd6', state: 'up', ip: '146.134.176.7', hw: '2x AMD EPYC 9454, 386GB, 2x L40S' },
    { id: 'sdumont2nd7', state: 'up', ip: '146.134.176.8', hw: '2x AMD EPYC 9454, 386GB, 2x L40S' }
];

export function makeInitialCluster() {
    const nodes = [];
    // CPU AMD nodes: sd2nd-cpu001 .. sd2nd-cpu060
    for (let k = 1; k <= NODE_COUNTS.cpu_amd; k++) nodes.push(makeNode(`sd2nd-cpu${String(k).padStart(3,'0')}`, 'cpu_amd'));
    // H100 nodes: sd2nd-h100-001 .. sd2nd-h100-062
    for (let k = 1; k <= NODE_COUNTS.h100; k++) nodes.push(makeNode(`sd2nd-h100-${String(k).padStart(3,'0')}`, 'h100'));
    // GH200 nodes: sd2nd-gh200-001 .. sd2nd-gh200-036
    for (let k = 1; k <= NODE_COUNTS.gh200; k++) nodes.push(makeNode(`sd2nd-gh200-${String(k).padStart(3,'0')}`, 'gh200'));
    // MI300A nodes: sd2nd-mi300a-001 .. sd2nd-mi300a-018
    for (let k = 1; k <= NODE_COUNTS.mi300a; k++) nodes.push(makeNode(`sd2nd-mi300a-${String(k).padStart(3,'0')}`, 'mi300a'));
    // Grace nodes: sd2nd-grace-001 .. sd2nd-grace-004
    for (let k = 1; k <= NODE_COUNTS.grace; k++) nodes.push(makeNode(`sd2nd-grace-${String(k).padStart(3,'0')}`, 'grace'));
    return { nodes, partitions: PARTITIONS, loginNodes: LOGIN_NODES, jobs: [], nextJobId: 12000 };
}

function makeNode(id, hwType) {
    const hw = HARDWARE[hwType];
    return {
        id, hwType,
        cpusTotal: hw.cpus, cpusAllocated: 0,
        memGBTotal: hw.memGB, memGBAllocated: 0,
        gpusTotal: hw.gpuCount, gpusAllocated: 0,
        state: 'idle',
        currentJobs: []
    };
}
