// data/modules-index.js
// Registry of all learning modules.
export const MODULES = [
    {
        id: 'sdumont',
        num: 1,
        titulo: 'Fundamentos HPC',
        subtitulo: 'Ambiente SDumont, SLURM e Shell',
        emoji: '🖥️',
        cor: '#3fb950',
        tourFile: '../data/tour.js'
    },
    {
        id: 'openmp',
        num: 2,
        titulo: 'OpenMP / Multicore',
        subtitulo: 'Paralelismo em CPU com memória compartilhada',
        emoji: '🧵',
        cor: '#58a6ff',
        tourFile: '../data/tour-openmp.js'
    },
    {
        id: 'gpu',
        num: 3,
        titulo: 'GPU / CUDA',
        subtitulo: 'Programação de aceleradores',
        emoji: '⚡',
        cor: '#d29922',
        tourFile: '../data/tour-gpu.js',
        comingSoon: true
    },
    {
        id: 'mpi',
        num: 4,
        titulo: 'MPI / Distribuídos',
        subtitulo: 'Troca de mensagens entre nós',
        emoji: '🌐',
        cor: '#f85149',
        tourFile: '../data/tour-mpi.js',
        comingSoon: true
    }
];
