// js/glossario.js
// 30+ termos do glossário, todos em português claro para leigo.

export const GLOSSARIO = {
    'SDumont':       { curta: 'Supercomputador Santos Dumont, do LNCC em Petrópolis/RJ.', etapa: 0 },
    'SDumont 2nd':   { curta: 'A segunda geração (2024) do Santos Dumont — com H100/GH200. Você NÃO usa essa.', etapa: 0 },
    'Expansão':      { curta: 'A versão 2019 do SDumont (Bull Sequana X1120, V100). É essa que você usa.', etapa: 0 },
    'LNCC':          { curta: 'Laboratório Nacional de Computação Científica — quem administra o SDumont.', etapa: 0 },
    'HPC':           { curta: 'High Performance Computing — computação de alto desempenho usando múltiplos computadores.', etapa: 1 },
    'cluster':       { curta: 'Conjunto de computadores (nós) conectados por rede rápida, trabalhando juntos.', etapa: 1 },
    'nó':            { curta: 'Um computador individual dentro do cluster. O SDumont v1 tem 377 nós computacionais.', etapa: 1 },
    'node':          { curta: 'Mesmo que "nó" — um computador dentro do cluster.', etapa: 1 },
    'login node':    { curta: 'Nó de entrada (sdumont15-18). Só pra preparar coisas — NÃO rodar workloads.', etapa: 2 },
    'compute node':  { curta: 'Nó onde os jobs realmente rodam. Não tem internet. Não vê /prj.', etapa: 1 },
    'partição':      { curta: 'Fila de submissão do SLURM. Cada uma agrupa nós de mesmo tipo com regras próprias.', etapa: 1 },
    'fila':          { curta: 'Sinônimo de partição no contexto do SLURM.', etapa: 1 },
    'GDL':           { curta: 'Partição especial com 1 único nó de deep learning: 8× V100 NVLink. Walltime max 48h.', etapa: 1 },
    'V100':          { curta: 'NVIDIA Tesla V100 — a GPU do SDumont v1. 16 GB HBM2 por placa.', etapa: 1 },
    'H100':          { curta: 'GPU do SDumont 2nd (não do v1). Se alguém falar H100, é o 2nd.', etapa: 0 },
    'NVLink':        { curta: 'Conexão rápida entre GPUs dentro do mesmo nó. O GDL tem 8 V100 conectadas via NVLink.', etapa: 1 },
    'InfiniBand':    { curta: 'Rede de alta velocidade entre os nós do cluster. No v1 é EDR 100 Gb/s.', etapa: 1 },
    'glicol':        { curta: 'Líquido usado no sistema de refrigeração do contêiner do SDumont.', etapa: 1 },
    'VPN':           { curta: 'Virtual Private Network — o "crachá" pra entrar na rede do LNCC. Obrigatória.', etapa: 2 },
    'SSH':           { curta: 'Secure Shell — protocolo pra acessar um computador remoto com criptografia.', etapa: 2 },
    'Sophos':        { curta: 'Cliente VPN usado pelo LNCC (aparece como "Sofos" em vídeos do curso).', etapa: 2 },
    '/prj':          { curta: '$HOME no v1. NFS Isilon, 650 TB. Visível SÓ nos login nodes. Sem backup.', etapa: 3 },
    '/scratch':      { curta: '$SCRATCH. Lustre 1.1 PB. Visível em TODOS os nós. Sem backup. Purge 60 dias.', etapa: 3 },
    '$HOME':         { curta: 'No v1: /prj/<PROJETO>/<user>. Atenção: NÃO é /home/<user>.', etapa: 3 },
    '$SCRATCH':      { curta: '/scratch/<PROJETO>/<user>. Área de trabalho rápida, visível nos compute nodes.', etapa: 3 },
    'Lustre':        { curta: 'Sistema de arquivos paralelo open-source. O /scratch do v1 roda Lustre.', etapa: 3 },
    'NFS':           { curta: 'Network File System. O /prj do v1 é NFS (mais lento que Lustre).', etapa: 3 },
    'módulo':        { curta: 'Pacote de variáveis de ambiente que "acende" um software (module load).', etapa: 4 },
    'module load':   { curta: 'Comando que ativa um software no seu shell (ex: module load cuda/11.2_sequana).', etapa: 4 },
    '_sequana':      { curta: 'Sufixo nos nomes de módulo — indica "compilado para esta máquina (Bull Sequana)".', etapa: 4 },
    'conda':         { curta: 'Gerenciador de ambientes Python. No v1, o env deve morar no $SCRATCH.', etapa: 4 },
    'Singularity':   { curta: 'Container runtime pra clusters HPC. Alternativa ao Docker quando conda dá problema.', etapa: 4 },
    'SLURM':         { curta: 'Simple Linux Utility for Resource Management — o gerente que decide quando/onde seu job roda.', etapa: 5 },
    'sbatch':        { curta: 'Comando pra submeter um job script ao SLURM. Ex: sbatch train_palmvein.srm', etapa: 5 },
    'squeue':        { curta: 'Mostra a fila de jobs. Com --me, filtra só os seus.', etapa: 6 },
    'sinfo':         { curta: 'Mostra estado das partições e nós (idle/alloc/mix).', etapa: 6 },
    'sacct':         { curta: 'Histórico de accounting — tempo, memória, estado de jobs já terminados.', etapa: 6 },
    'scancel':       { curta: 'Cancela um job seu. Ex: scancel 12345', etapa: 6 },
    'scontrol':      { curta: 'Inspeciona ou modifica jobs. Truque: scontrol update Partition= move job pendente.', etapa: 6 },
    'job':           { curta: 'Um script + pedido de recursos submetido ao SLURM. Tem ID, estado, walltime.', etapa: 5 },
    'walltime':      { curta: 'Tempo máximo que seu job pode rodar (--time). Obrigatório. Pedir de menos = morte.', etapa: 5 },
    '--time':        { curta: 'Diretiva SBATCH obrigatória. Define walltime. Sem ela → job rejeitado.', etapa: 5 },
    '--gpus':        { curta: 'Diretiva SBATCH pra pedir GPUs. Estilo LNCC (não --gres=gpu:N).', etapa: 5 },
    'PD':            { curta: 'Pending — job esperando na fila por recursos ou prioridade.', etapa: 6 },
    'R':             { curta: 'Running — job rodando agora.', etapa: 6 },
    'CD':            { curta: 'Completed — job terminou com sucesso.', etapa: 6 },
    'fairshare':     { curta: 'Fator de prioridade: quem usou menos recursos recentemente tem mais prioridade.', etapa: 8 },
    'backfill':      { curta: 'Truque do SLURM tipo Tetris: encaixa jobs curtos nos buracos sem atrasar os grandes.', etapa: 8 },
    'QOS':           { curta: 'Quality of Service. Normal é o padrão. Cai pra Low se gastar UAs demais.', etapa: 8 },
    'UA':            { curta: 'Unidade de Alocação. 1 core-hora CPU = 1 UA. 1 GPU-hora V100 = 100 UAs.', etapa: 8 },
};

export function getTerm(name) { return GLOSSARIO[name]; }
export function allTerms() { return Object.entries(GLOSSARIO).map(([k, v]) => ({ termo: k, ...v })); }

// Hydrate known terms in HTML — wraps first occurrence of each glossary term
// in a <span class="term" data-tooltip="..."> tag. Skips content inside <code>/<pre>.
export function hydrateTerms(html) {
    const sorted = Object.keys(GLOSSARIO).sort((a, b) => b.length - a.length); // longest first
    let result = html;
    const hydrated = new Set();
    for (const termo of sorted) {
        if (hydrated.has(termo)) continue;
        const entry = GLOSSARIO[termo];
        const escaped = termo.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
        // Match the term NOT inside a tag attribute, <code>, or already wrapped
        const regex = new RegExp(`(?<![\\w-])(?<!<[^>]*)\\b${escaped}\\b(?![^<]*<\\/code>)(?![^<]*<\\/span>)`, 'i');
        const match = result.match(regex);
        if (match) {
            const tooltip = entry.curta.replace(/"/g, '&quot;');
            const replacement = `<span class="term" data-tooltip="${tooltip}">${match[0]}</span>`;
            result = result.slice(0, match.index) + replacement + result.slice(match.index + match[0].length);
            hydrated.add(termo);
        }
    }
    return result;
}
