// data/initial-users.js
// Fictional users cycling jobs, inspired by real LNCC workloads.
export const FICTIONAL_USERS = [
    {
        login: 'slima', displayName: 'Dra. Silvia Lima (LNCC)',
        jobs: [
            { partition: 'sequana_cpu', nodes: 8, gpus: 0, cpus: 384, memGB: 2048, walltimeSec: 50000, name: 'gromacs-md', script: '/scratch/lnccdm/slima/md.srm' }
        ]
    },
    {
        login: 'rmartins', displayName: 'Prof. R. Martins (UFRJ)',
        jobs: [
            { partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 40000, name: 'llm-finetune', script: '/scratch/ufrjml/rmartins/finetune.srm' }
        ]
    },
    {
        login: 'bioinfo01', displayName: 'FioCruz Bioinfo',
        jobs: [
            { partition: 'sequana_cpu_bigmem', nodes: 4, gpus: 0, cpus: 192, memGB: 2800, walltimeSec: 30000, name: 'star-align', script: '/scratch/fiobio/bioinfo01/align.srm' }
        ]
    },
    {
        login: 'cfdteam', displayName: 'CFD INPE',
        jobs: [
            { partition: 'sequana_cpu_long', nodes: 16, gpus: 0, cpus: 768, memGB: 6144, walltimeSec: 200000, name: 'openfoam-run', script: '/scratch/inpecfd/cfdteam/run.srm' }
        ]
    },
    {
        login: 'astrolab', displayName: 'Observatório Nacional',
        jobs: [
            { partition: 'sequana_gpu', nodes: 1, gpus: 4, cpus: 48, memGB: 384, walltimeSec: 20000, name: 'gadget-run', script: '/scratch/oncosm/astrolab/nbody.srm' }
        ]
    },
    {
        login: 'hemodin', displayName: 'Hemodinâmica LNCC',
        jobs: [
            { partition: 'sequana_cpu', nodes: 4, gpus: 0, cpus: 192, memGB: 1536, walltimeSec: 25000, name: 'fenics-sim', script: '/scratch/lncchd/hemodin/sim.srm' }
        ]
    },
    {
        login: 'quantumlab', displayName: 'Química Quântica USP',
        jobs: [
            { partition: 'sequana_cpu', nodes: 6, gpus: 0, cpus: 288, memGB: 2304, walltimeSec: 70000, name: 'orca-dft', script: '/scratch/uspqc/quantumlab/dft.srm' }
        ]
    }
];
