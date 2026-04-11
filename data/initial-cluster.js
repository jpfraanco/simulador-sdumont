// data/initial-cluster.js
// Canonical SDumont v1 topology, from research/findings.md §2.
export const PARTITIONS = [
    { name: 'sequana_cpu',             walltimeMax: '96:00:00',  hwType: 'cpu',    gpusPerJob: 0, devPriority: false },
    { name: 'sequana_cpu_dev',         walltimeMax: '00:20:00',  hwType: 'cpu',    gpusPerJob: 0, devPriority: true  },
    { name: 'sequana_cpu_long',        walltimeMax: '744:00:00', hwType: 'cpu',    gpusPerJob: 0, devPriority: false },
    { name: 'sequana_cpu_bigmem',      walltimeMax: '96:00:00',  hwType: 'bigmem', gpusPerJob: 0, devPriority: false },
    { name: 'sequana_cpu_bigmem_long', walltimeMax: '744:00:00', hwType: 'bigmem', gpusPerJob: 0, devPriority: false },
    { name: 'sequana_gpu',             walltimeMax: '96:00:00',  hwType: 'gpu',    gpusPerJob: 4, devPriority: false },
    { name: 'sequana_gpu_dev',         walltimeMax: '00:20:00',  hwType: 'gpu',    gpusPerJob: 4, devPriority: true  },
    { name: 'sequana_gpu_long',        walltimeMax: '744:00:00', hwType: 'gpu',    gpusPerJob: 4, devPriority: false },
    { name: 'gdl',                     walltimeMax: '48:00:00',  hwType: 'gdl',    gpusPerJob: 8, devPriority: false }
];

export const NODE_COUNTS = { cpu: 246, bigmem: 36, gpu: 94, gdl: 1 };

export const HARDWARE = {
    cpu:    { cpus: 48, memGB: 384, gpuModel: null, gpuCount: 0, cpuModel: 'Intel Xeon Cascade Lake Gold 6252' },
    bigmem: { cpus: 48, memGB: 768, gpuModel: null, gpuCount: 0, cpuModel: 'Intel Xeon Cascade Lake Gold 6252' },
    gpu:    { cpus: 48, memGB: 384, gpuModel: 'NVIDIA Tesla V100', gpuCount: 4, cpuModel: 'Intel Xeon Skylake 6252' },
    gdl:    { cpus: 40, memGB: 384, gpuModel: 'NVIDIA Tesla V100-SXM2-16GB (NVLink)', gpuCount: 8, cpuModel: 'Intel Xeon Skylake Gold 6148' }
};

export const LOGIN_NODES = [
    { id: 'sdumont15', state: 'up' },
    { id: 'sdumont16', state: 'up' },
    { id: 'sdumont17', state: 'up' },
    { id: 'sdumont18', state: 'up' }
];

export function makeInitialCluster() {
    const nodes = [];
    let i = 1000;
    for (let k = 0; k < NODE_COUNTS.cpu; k++) nodes.push(makeNode(`sdumont${i++}`, 'cpu'));
    i = 2000;
    for (let k = 0; k < NODE_COUNTS.bigmem; k++) nodes.push(makeNode(`sdumont${i++}`, 'bigmem'));
    i = 6000;
    for (let k = 0; k < NODE_COUNTS.gpu; k++) nodes.push(makeNode(`sdumont${i++}`, 'gpu'));
    nodes.push(makeNode('sdumont8000', 'gdl'));
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
