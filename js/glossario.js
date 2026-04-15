// js/glossario.js
// 50+ termos do glossário — SDumont 2nd focus.

export const GLOSSARIO = {
    'SDumont':       { curta: 'Supercomputador Santos Dumont, do LNCC em Petrópolis/RJ.', etapa: 0 },
    'SDumont 2nd':   { curta: 'A segunda geração (2024) do Santos Dumont — Bull Sequana XH3000 com H100/GH200/MI300A. É essa que você usa.', etapa: 0 },
    'v1':            { curta: 'A primeira geração do SDumont (2019, Bull Sequana X1120, V100). Ainda operacional mas separada.', etapa: 0 },
    'LNCC':          { curta: 'Laboratório Nacional de Computação Científica — quem administra o SDumont.', etapa: 0 },
    'HPC':           { curta: 'High Performance Computing — computação de alto desempenho usando múltiplos computadores.', etapa: 1 },
    'cluster':       { curta: 'Conjunto de computadores (nós) conectados por rede rápida, trabalhando juntos.', etapa: 1 },
    'nó':            { curta: 'Um computador individual dentro do cluster. O SDumont 2nd tem 180 nós computacionais.', etapa: 1 },
    'node':          { curta: 'Mesmo que "nó" — um computador dentro do cluster.', etapa: 1 },
    'login node':    { curta: 'Nó de entrada (sdumont2nd4-7). Só pra preparar coisas — NÃO rodar workloads.', etapa: 2 },
    'compute node':  { curta: 'Nó onde os jobs realmente rodam. Não tem internet.', etapa: 1 },
    'partição':      { curta: 'Fila de submissão do SLURM. Cada uma agrupa nós de mesmo tipo com regras próprias.', etapa: 1 },
    'fila':          { curta: 'Sinônimo de partição no contexto do SLURM.', etapa: 1 },
    'H100':          { curta: 'NVIDIA H100 SXM 80GB — a GPU principal do SDumont 2nd. 62 nós com 4 H100 cada.', etapa: 1 },
    'GH200':         { curta: 'NVIDIA Grace Hopper GH200 — CPU ARM + GPU integrada. 36 nós no 2nd.', etapa: 1 },
    'MI300A':        { curta: 'AMD Instinct MI300A — APU com CPU+GPU integrada. 18 nós no 2nd.', etapa: 1 },
    'Grace':         { curta: 'CPU ARM da NVIDIA Grace. 4 nós dedicados (CPU-only) + 36 nós GH200.', etapa: 1 },
    'Genoa-X':       { curta: 'AMD EPYC 9684X — o CPU dos nós CPU AMD do 2nd. 192 cores por nó.', etapa: 1 },
    'NVLink':        { curta: 'Conexão rápida entre GPUs dentro do mesmo nó.', etapa: 1 },
    'InfiniBand':    { curta: 'Rede de alta velocidade entre os nós do cluster. No 2nd é NDR 400 Gb/s.', etapa: 1 },
    'NDR':           { curta: 'InfiniBand NDR — 400 Gb/s. A interconexão do SDumont 2nd.', etapa: 1 },
    'VPN':           { curta: 'Virtual Private Network — o "crachá" pra entrar na rede do LNCC. Obrigatória.', etapa: 2 },
    'SSH':           { curta: 'Secure Shell — protocolo pra acessar um computador remoto com criptografia.', etapa: 2 },
    'Sophos':        { curta: 'Cliente VPN usado pelo LNCC (aparece como "Sofos" em vídeos do curso).', etapa: 2 },
    '/scratch':      { curta: '$HOME == $SCRATCH no 2nd. Lustre 3 PB. Visível em TODOS os nós. Sem backup.', etapa: 3 },
    '$HOME':         { curta: 'No 2nd: /scratch/<PROJETO>/<user>. No 2nd, $HOME == $SCRATCH (ambos Lustre).', etapa: 3 },
    '$SCRATCH':      { curta: '/scratch/<PROJETO>/<user>. Área principal de trabalho — igual a $HOME no 2nd.', etapa: 3 },
    'Lustre':        { curta: 'Sistema de arquivos paralelo open-source. Todo o storage do 2nd é Lustre (3 PB).', etapa: 3 },
    'arch_gpu':      { curta: 'Módulo de arquitetura pra nós H100 (x86). Obrigatório carregar antes de module avail.', etapa: 4 },
    'arch_gpu_sc':   { curta: 'Módulo de arquitetura pra nós GH200 (ARM). "sc" = superchip.', etapa: 4 },
    'arch_cpu_amd':  { curta: 'Módulo de arquitetura pra nós CPU AMD Genoa-X.', etapa: 4 },
    'arch_apu_amd':  { curta: 'Módulo de arquitetura pra nós MI300A (APU AMD).', etapa: 4 },
    'módulo':        { curta: 'Pacote de variáveis de ambiente que "acende" um software (module load).', etapa: 4 },
    'module load':   { curta: 'Comando que ativa um software. No 2nd: primeiro a arch, depois o software.', etapa: 4 },
    'conda':         { curta: 'Gerenciador de ambientes Python. No 2nd, o env fica no $SCRATCH (== $HOME).', etapa: 4 },
    'Singularity':   { curta: 'Container runtime pra clusters HPC. Alternativa ao Docker quando conda dá problema.', etapa: 4 },
    'SLURM':         { curta: 'Simple Linux Utility for Resource Management — o gerente que decide quando/onde seu job roda.', etapa: 5 },
    'sbatch':        { curta: 'Comando pra submeter um job script ao SLURM. Ex: sbatch train_palmvein.srm', etapa: 5 },
    '--account':     { curta: 'Diretiva OBRIGATÓRIA no 2nd. Identifica seu projeto (sigla). Sem ela → job rejeitado.', etapa: 5 },
    'squeue':        { curta: 'Mostra a fila de jobs. Com --me, filtra só os seus.', etapa: 6 },
    'sinfo':         { curta: 'Mostra estado das partições e nós (idle/alloc/mix).', etapa: 6 },
    'sacct':         { curta: 'Histórico de accounting — tempo, memória, estado de jobs já terminados.', etapa: 6 },
    'scancel':       { curta: 'Cancela um job seu. Ex: scancel 12345', etapa: 6 },
    'scontrol':      { curta: 'Inspeciona ou modifica jobs. Truque: scontrol update Partition= move job pendente.', etapa: 6 },
    'job':           { curta: 'Um script + pedido de recursos submetido ao SLURM. Tem ID, estado, walltime.', etapa: 5 },
    'walltime':      { curta: 'Tempo máximo que seu job pode rodar (--time). Obrigatório. GPU max 24h no 2nd.', etapa: 5 },
    '--time':        { curta: 'Diretiva SBATCH obrigatória. Define walltime. Sem ela → job rejeitado.', etapa: 5 },
    '--gpus':        { curta: 'Diretiva SBATCH pra pedir GPUs. Estilo LNCC (não --gres=gpu:N).', etapa: 5 },
    'PD':            { curta: 'Pending — job esperando na fila por recursos ou prioridade.', etapa: 6 },
    'R':             { curta: 'Running — job rodando agora.', etapa: 6 },
    'CD':            { curta: 'Completed — job terminou com sucesso.', etapa: 6 },
    'fairshare':     { curta: 'Fator de prioridade: quem usou menos recursos recentemente tem mais prioridade.', etapa: 8 },
    'backfill':      { curta: 'Truque do SLURM tipo Tetris: encaixa jobs curtos nos buracos sem atrasar os grandes.', etapa: 8 },
    'QOS':           { curta: 'Quality of Service. Normal é o padrão. Cai pra Low se gastar UAs demais.', etapa: 8 },
    'UA':            { curta: 'Unidade de Alocação. 1 core-hora CPU = 1 UA. 1 GPU-hora H100 = muitas UAs.', etapa: 8 },
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
