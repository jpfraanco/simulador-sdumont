// data/initial-users.js
// Fictional users cycling jobs on SDumont 2nd.
export const FICTIONAL_USERS = [
    {
        login: 'slima', displayName: 'Dra. Silvia Lima (LNCC)',
        jobs: [
            { partition: 'lncc-cpu_amd', nodes: 4, gpus: 0, cpus: 768, memGB: 2048, walltimeSec: 50000, name: 'gromacs-md', script: '/scratch/lnccdm/slima/md.srm', account: 'lnccdm' }
        ]
    },
    {
        login: 'rmartins', displayName: 'Prof. R. Martins (UFRJ)',
        jobs: [
            { partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 40000, name: 'llm-finetune', script: '/scratch/ufrjml/rmartins/finetune.srm', account: 'ufrjml' }
        ]
    },
    {
        login: 'bioinfo01', displayName: 'FioCruz Bioinfo',
        jobs: [
            { partition: 'lncc-cpu_amd', nodes: 2, gpus: 0, cpus: 384, memGB: 1536, walltimeSec: 30000, name: 'star-align', script: '/scratch/fiobio/bioinfo01/align.srm', account: 'fiobio' }
        ]
    },
    {
        login: 'cfdteam', displayName: 'CFD INPE',
        jobs: [
            { partition: 'lncc-cpu_amd', nodes: 8, gpus: 0, cpus: 1536, memGB: 4096, walltimeSec: 200000, name: 'openfoam-run', script: '/scratch/inpecfd/cfdteam/run.srm', account: 'inpecfd' }
        ]
    },
    {
        login: 'astrolab', displayName: 'Observatório Nacional',
        jobs: [
            { partition: 'lncc-gh200', nodes: 1, gpus: 4, cpus: 72, memGB: 480, walltimeSec: 20000, name: 'gadget-run', script: '/scratch/oncosm/astrolab/nbody.srm', account: 'oncosm' }
        ]
    },
    {
        login: 'hemodin', displayName: 'Hemodinâmica LNCC',
        jobs: [
            { partition: 'lncc-cpu_amd', nodes: 2, gpus: 0, cpus: 384, memGB: 1536, walltimeSec: 25000, name: 'fenics-sim', script: '/scratch/lncchd/hemodin/sim.srm', account: 'lncchd' }
        ]
    },
    {
        login: 'quantumlab', displayName: 'Química Quântica USP',
        jobs: [
            { partition: 'lncc-mi300a', nodes: 1, gpus: 2, cpus: 48, memGB: 256, walltimeSec: 70000, name: 'orca-dft', script: '/scratch/uspqc/quantumlab/dft.srm', account: 'uspqc' }
        ]
    }
];
