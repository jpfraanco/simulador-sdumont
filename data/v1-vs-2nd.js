// data/v1-vs-2nd.js
// Tabela comparativa SDumont 2nd vs v1. Perspectiva invertida: 2nd é "você".
export const V1_VS_2ND = {
    titulo: 'SDumont 2nd vs SDumont v1 (Expansão)',
    subtitulo: 'Você usa o 2nd. O v1 (Expansão, 2019) ainda existe mas é uma máquina separada.',
    guardians: [
        'Se aparecer H100, GH200 ou MI300A, é o 2nd — é você.',
        'Se aparecer <code>lncc-*</code> nas partições, é o 2nd — é você.',
        'Se aparecer <code>sequana_*</code> nas partições, é o v1 — não é você.',
        '<code>--account=</code> é obrigatório em todo job no 2nd.'
    ],
    linhas: [
        { aspecto: 'Frame',              v2: 'Bull Sequana XH3000',                      v1: 'Bull Sequana X1000 / X1120' },
        { aspecto: 'Ano',                v2: '2024',                                       v1: '2019' },
        { aspecto: 'Pico teórico',       v2: '~25.0 PFlops',                              v1: '~5.1 PFlops' },
        { aspecto: 'Nós computacionais', v2: '180 (60 CPU + 62 H100 + 36 GH200 + 18 MI300A + 4 Grace)', v1: '377 (246 CPU + 36 BIGMEM + 94 GPU + 1 GDL)' },
        { aspecto: 'CPU',                v2: 'AMD Genoa-X 9684X, Intel Sapphire Rapids, Grace ARM', v1: 'Intel Xeon Cascade/Skylake' },
        { aspecto: 'GPU',                v2: '248× H100 + 144× GH200 + 36× MI300A',       v1: '384× NVIDIA V100' },
        { aspecto: 'Interconnect',       v2: 'InfiniBand NDR 400 Gb/s',                    v1: 'InfiniBand EDR 100 Gb/s' },
        { aspecto: 'Partições',          v2: 'lncc-h100, lncc-gh200, lncc-mi300a, lncc-cpu_amd, lncc-grace', v1: 'sequana_cpu*, sequana_gpu*, gdl' },
        { aspecto: 'Walltime max GPU',   v2: '24h (capped em todas GPU queues)',            v1: '96h (48h no gdl)' },
        { aspecto: '$HOME',              v2: '$HOME == $SCRATCH (Lustre)',                  v1: '/prj/<PROJETO>/<user> (NFS, só login)' },
        { aspecto: '$SCRATCH',           v2: '/scratch/…/<user> (Lustre 3 PB)',             v1: '/scratch/…/<user> (Lustre 1.1 PB)' },
        { aspecto: 'Login node',         v2: 'login.sdumont2nd.lncc.br (sdumont2nd4-7)',   v1: 'sdumont15-18' },
        { aspecto: 'Slurm',              v2: '24.05.3',                                    v1: '23.11.1' },
        { aspecto: '--account=',         v2: 'obrigatório em todo job',                     v1: 'não exigido' },
        { aspecto: 'Módulos',            v2: 'arch-prefixed (arch_gpu/current primeiro)',   v1: 'flat (cuda/11.2_sequana)' }
    ]
};
