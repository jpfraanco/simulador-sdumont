// data/v1-vs-2nd.js
// Tabela comparativa SDumont v1 vs 2nd (spec §9).
export const V1_VS_2ND = {
    titulo: 'SDumont Expansão (v1) vs SDumont 2nd',
    subtitulo: 'Você vai usar o v1. Se alguém mencionar H100/GH200/MI300A — é o 2nd.',
    guardians: [
        'Se aparecer H100, GH200 ou MI300A, é o 2nd — não é você.',
        'Se aparecer <code>sequana_*</code> nas partições, é o v1 — é você.',
        'Seu <code>$HOME</code> mora dentro de <code>/prj</code>, não em <code>/home</code>.'
    ],
    linhas: [
        { aspecto: 'Frame',              v1: 'Bull Sequana X1000 / X1120',             v2: 'Bull Sequana XH3000' },
        { aspecto: 'Ano',                v1: '2019',                                    v2: '2024' },
        { aspecto: 'Pico teórico',       v1: '~5.1 PFlops',                            v2: '~25.0 PFlops' },
        { aspecto: 'Nós computacionais', v1: '377 (246 CPU + 36 BIGMEM + 94 GPU + 1 GDL)', v2: '180' },
        { aspecto: 'CPU',                v1: 'Intel Xeon Cascade/Skylake',              v2: 'AMD Genoa-X, Intel Sapphire Rapids, Grace ARM' },
        { aspecto: 'GPU',                v1: '384× NVIDIA V100',                        v2: '248× H100 + 144× GH200 + 36× MI300A' },
        { aspecto: 'Interconnect',       v1: 'InfiniBand EDR 100 Gb/s',                v2: 'InfiniBand NDR 400 Gb/s' },
        { aspecto: 'Partições',          v1: 'sequana_cpu*, sequana_gpu*, gdl',         v2: 'lncc-h100, lncc-gh200, lncc-mi300a, etc.' },
        { aspecto: 'Walltime max GPU',   v1: '96h (48h no gdl)',                        v2: '24h (capped)' },
        { aspecto: '$HOME',              v1: '/prj/<PROJETO>/<user> (NFS, só login)',   v2: '$HOME == $SCRATCH (Lustre)' },
        { aspecto: '$SCRATCH',           v1: '/scratch/…/<user> (Lustre 1.1 PB)',       v2: '/scratch/…/<user> (Lustre 3 PB)' },
        { aspecto: 'Login node',         v1: 'sdumont15-18',                            v2: 'login.sdumont2nd.lncc.br' },
        { aspecto: 'Slurm',              v1: '23.11.1',                                 v2: '24.05.3' },
        { aspecto: '--account=',         v1: 'não exigido',                             v2: 'obrigatório em todo job' },
        { aspecto: 'Módulos',            v1: 'flat (cuda/11.2_sequana)',                v2: 'arch-prefixed (arch_gpu/current)' }
    ]
};
