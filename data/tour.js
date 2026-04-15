// data/tour.js
// Tour de 9 etapas (0-8) com todas as sub-etapas inline.
// SDumont 2nd focus (migrado de v1 em 2026-04-14).
// Voz: português brasileiro conversacional, siglas definidas na primeira aparição,
// "porquê" antes do "como", clareza para leigo > fidelidade a instrutor.
//
// Cada passo: { id, etapa, subpasso, titulo, narracao (HTML string),
//   esperaComando (regex opcional), destaque (seletor CSS opcional) }

export const ETAPAS = [
    { num: 0, id: 'v1-vs-2nd',     titulo: 'v1 vs 2nd',      descricao: 'Entenda qual Santos Dumont você vai usar' },
    { num: 1, id: 'arquitetura',   titulo: 'Arquitetura',    descricao: 'O que é HPC, cluster, nó, partição' },
    { num: 2, id: 'acesso',        titulo: 'Acesso',         descricao: 'VPN + SSH para entrar no cluster' },
    { num: 3, id: 'dados',         titulo: 'Dados',          descricao: 'Storage unificado no 2nd' },
    { num: 4, id: 'ambiente',      titulo: 'Ambiente',       descricao: 'Arch modules + conda env' },
    { num: 5, id: 'submissao',     titulo: 'Submissão',      descricao: 'Escrever e submeter um job script' },
    { num: 6, id: 'monitoramento', titulo: 'Monitoramento',  descricao: 'squeue, sinfo, scontrol, sacct' },
    { num: 7, id: 'resultados',    titulo: 'Resultados',     descricao: 'Ver output, baixar checkpoints' },
    { num: 8, id: 'convivencia',   titulo: 'Convivência',    descricao: 'Fairshare, fila lotada, backfill' }
];

export const STEPS = [

    // ========== ETAPA 0: v1 vs SDumont 2nd ==========
    {
        id: '0.1-bem-vindo', etapa: 0, subpasso: 1,
        titulo: 'Oi! Respira fundo. Vamos começar do zero.',
        narracao: `
            <p>Antes de qualquer coisa: <strong>respira fundo</strong>. A gente vai aprender a usar um supercomputador do zero, sem assumir que você conhece nada. Toda sigla, todo comando, todo conceito — se algo não fizer sentido, é problema meu, não seu.</p>
            <p>O supercomputador que a gente vai explorar é o <strong>Santos Dumont</strong> (carinhosamente <strong>SDumont</strong>), do <strong>LNCC</strong> (Laboratório Nacional de Computação Científica, em Petrópolis/RJ). Ele existe pra rodar projetos científicos do Brasil inteiro.</p>
            <p>Mas tem uma pegadinha importante que a gente precisa resolver <strong>agora</strong>, antes de qualquer coisa. Clica em "Próximo →" aí embaixo.</p>
        `
    },
    {
        id: '0.2-tres-maquinas', etapa: 0, subpasso: 2,
        titulo: 'Na verdade são três Santos Dumonts',
        narracao: `
            <p>O que a gente chama de "Santos Dumont" é na verdade uma linha do tempo de <strong>três máquinas</strong>:</p>
            <ul>
                <li><strong>SDumont Base (2015)</strong> — a primeira versão, 1.1 PFlops. <strong>Foi descomissionada em 2025. Não existe mais.</strong></li>
                <li><strong>SDumont Expansão / v1 (2019)</strong> — 5.1 PFlops. CPUs Intel Xeon + GPUs NVIDIA V100. Ainda operacional, mas é uma máquina separada.</li>
                <li><strong>SDumont 2nd (2024)</strong> — <strong>ESSA É A QUE VOCÊ VAI USAR</strong>. 25 PFlops. Bull Sequana XH3000, com GPUs H100, GH200, MI300A e CPUs AMD Genoa-X / Grace ARM. Máquina totalmente nova, em outro container, com partições e comandos diferentes.</li>
            </ul>
            <p>Por que isso importa? Porque se você pesquisar "Santos Dumont" no Google, vai encontrar materiais que misturam v1 e 2nd. Partições <code>sequana_*</code> são da v1 — no 2nd, as partições começam com <code>lncc-</code>. <strong>Não confunda.</strong></p>
        `
    },
    {
        id: '0.3-guardian', etapa: 0, subpasso: 3,
        titulo: 'Quatro frases-guardiãs',
        narracao: `
            <p>Leva essas frases na cabeça — vão te salvar sempre que encontrar material ambíguo:</p>
            <ol class="guardian">
                <li>Se aparecer <strong>H100, GH200 ou MI300A</strong>, é o <strong>2nd</strong> — é você.</li>
                <li>Se aparecer <code>lncc-*</code> nas partições, é o <strong>2nd</strong> — é você.</li>
                <li>Se aparecer <code>sequana_*</code> nas partições, é o <strong>v1</strong> — não é você.</li>
                <li><code>--account=</code> é <strong>obrigatório em todo job</strong> no 2nd. Se o material não menciona, é da v1.</li>
            </ol>
            <p>Próxima etapa: conceitos e arquitetura do 2nd.</p>
        `
    },

    // ========== ETAPA 1: Arquitetura ==========
    {
        id: '1.1-container', etapa: 1, subpasso: 1,
        titulo: 'O SDumont 2nd mora num contêiner',
        narracao: `
            <p>Primeira imagem mental: o SDumont 2nd é um <strong>Bull Sequana XH3000</strong> que mora em contêineres refrigerados no campus do LNCC em Petrópolis/RJ.</p>
            <p>A refrigeração é feita por um loop de <strong>glicol</strong> (um líquido). Entra frio na parte de cima, passa perto dos componentes quentes, sai aquecido, e volta pro sistema de resfriamento. É um data center compacto de alta densidade.</p>
            <p>Por que isso importa? Porque quando você submeter um treino, seu código vai parar fisicamente dentro de uma dessas caixas de metal. É bom saber onde.</p>
        `
    },
    {
        id: '1.2-hpc', etapa: 1, subpasso: 2,
        titulo: 'O que é HPC, cluster, nó',
        narracao: `
            <p><strong>HPC</strong> = High Performance Computing (computação de alto desempenho). Soa pomposo, mas a ideia é simples: problemas grandes demais pra um computador só, a gente divide em pedaços e roda em <strong>vários computadores trabalhando juntos</strong>.</p>
            <p>Esses computadores, coordenados por uma rede rápida (<strong>InfiniBand NDR 400 Gb/s</strong>), formam um <strong>cluster</strong>. Cada computador individual é um <strong>nó</strong> (em inglês, <em>node</em>).</p>
            <p>O SDumont 2nd tem <strong>180 nós computacionais</strong>. Você não vai usar todos — quase ninguém usa. Projetos típicos usam entre 1 e 8 nós ao mesmo tempo. Dá uma olhada no dashboard à direita: os quadradinhos coloridos são os nós.</p>
        `,
        destaque: '.nodegrid-root'
    },
    {
        id: '1.3-tipos-de-no', etapa: 1, subpasso: 3,
        titulo: 'Os 5 tipos de nó',
        narracao: `
            <p>Nem todo nó é igual. O 2nd tem 5 "sabores":</p>
            <ul>
                <li><strong>CPU AMD (60 nós)</strong>: AMD EPYC Genoa-X 9684X com <strong>192 cores</strong> + 768 GB RAM. Pra simulações massivas em CPU (dinâmica molecular, CFD...).</li>
                <li><strong>H100 (62 nós)</strong>: Intel Sapphire Rapids + <strong>4× NVIDIA H100 SXM 80GB</strong>. A GPU mais poderosa do cluster. <strong>É nesse tipo que o seu palm vein vai rodar.</strong></li>
                <li><strong>GH200 (36 nós)</strong>: <strong>NVIDIA Grace Hopper</strong> — CPU ARM integrada com GPU. Ótimo pra workloads que precisam de muita memória unificada CPU-GPU.</li>
                <li><strong>MI300A (18 nós)</strong>: <strong>AMD Instinct MI300A</strong> — APU (CPU+GPU no mesmo chip). Alternativa AMD pra aceleração GPU.</li>
                <li><strong>Grace (4 nós)</strong>: CPU ARM NVIDIA Grace, 144 cores. Sem GPU, pra workloads CPU-only em ARM.</li>
            </ul>
            <p>No dashboard: verde = livre, amarelo = parcial, vermelho = cheio. Passa o mouse num quadradinho pra ver detalhes do nó.</p>
        `,
        destaque: '.nodegrid-root'
    },
    {
        id: '1.4-particoes', etapa: 1, subpasso: 4,
        titulo: 'Partições: filas do cluster',
        narracao: `
            <p>Cada grupo de nós é oferecido através de <strong>partições</strong>. Pensa em partição como uma <em>fila do supermercado</em>: cada fila aceita um tipo de pedido e tem regras próprias.</p>
            <p>Principais partições do 2nd:</p>
            <ul>
                <li><code>lncc-cpu_amd</code> — 60 nós CPU AMD, walltime máx 72h</li>
                <li><code>cpu_amd_dev</code> — CPUs, só 20min, prioridade alta (pra testar rápido)</li>
                <li><code>lncc-h100</code> — 62 nós H100 (acesso exclusivo ao nó inteiro)</li>
                <li><code>lncc-h100_shared</code> — mesmos nós H100, <strong>compartilhados</strong> (até 4 jobs por nó, pede GPUs via GRES). <strong>É onde seu palm vein vai.</strong></li>
                <li><code>lncc-gh200</code> / <code>lncc-gh200_shared</code> — nós Grace Hopper</li>
                <li><code>lncc-mi300a</code> / <code>lncc-mi300a_shared</code> — nós MI300A</li>
                <li><code>lncc-grace</code> — 4 nós Grace ARM CPU-only, walltime 72h</li>
                <li><code>h100_dev</code>, <code>gh200_dev</code>, <code>mi300a_dev</code> — dev queues (20min, prioridade alta)</li>
            </ul>
            <p><strong>Regra do 2nd:</strong> todas as partições GPU têm walltime máximo de <strong>24 horas</strong>.</p>
            <p>Experimenta no terminal: digita <code>sinfo</code> e aperta Enter pra ver o estado das partições.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^sinfo\b/
    },

    // ========== ETAPA 2: Acesso (VPN + SSH) ==========
    {
        id: '2.1-duas-chaves', etapa: 2, subpasso: 1,
        titulo: 'Pra entrar, duas chaves: VPN e SSH',
        narracao: `
            <p>Pra usar o cluster, você precisa passar por <strong>dois portões</strong> em sequência:</p>
            <ol>
                <li><strong>VPN</strong> (Virtual Private Network, "rede privada virtual") — é o "crachá" que te deixa entrar na rede interna do LNCC. Sem VPN ativa, você nem consegue ver que o SDumont existe.</li>
                <li><strong>SSH</strong> (Secure Shell, "acesso remoto criptografado") — depois que a VPN te conectou à rede, você usa o SSH pra abrir uma sessão de terminal no cluster.</li>
            </ol>
            <p>Pensa assim: VPN = portão da empresa. SSH = chave da sala. Precisa dos dois, nessa ordem.</p>
        `
    },
    {
        id: '2.2-vpn', etapa: 2, subpasso: 2,
        titulo: 'VPN: o credenciamento',
        narracao: `
            <p>A VPN cria uma rede virtual que te protege (e protege o cluster) de invasões, malware e uso indevido. O cliente que o LNCC usa se chama <strong>Sophos</strong> (às vezes aparece como "Sofos" em vídeos). Qualquer cliente VPN configurado pelo LNCC serve — você recebe as credenciais junto com sua conta no SDumont.</p>
            <p>Detalhe importante: <strong>a VPN não avisa quando cai</strong>. Ela pode desconectar silenciosamente e o seu <code>ssh</code> vai ficar travado esperando resposta, sem erro claro. Se um dia você digitar <code>ssh</code> e ele ficar parado por mais de uns 10 segundos, a primeira coisa a fazer é reconectar a VPN.</p>
            <p>Neste simulador, a VPN está sempre conectada — então você pode ir direto pro SSH.</p>
        `
    },
    {
        id: '2.3-ssh', etapa: 2, subpasso: 3,
        titulo: 'SSH: abrindo a porta',
        narracao: `
            <p>Agora vai. Com a VPN ligada, você faz <strong>SSH</strong> pro SDumont 2nd. O endereço é <code>login.sdumont2nd.lncc.br</code>, que é um load balancer que te joga pra um dos quatro login nodes (<code>sdumont2nd4</code>, <code>sdumont2nd5</code>, <code>sdumont2nd6</code>, <code>sdumont2nd7</code>).</p>
            <p>Comando: <code>ssh &lt;seu-usuário&gt;@login.sdumont2nd.lncc.br</code>. Aqui no simulador seu usuário é <code>unseen</code>.</p>
            <p>Digita agora no terminal:</p>
            <pre><code>ssh unseen@login.sdumont2nd.lncc.br</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^ssh\s+unseen@(login\.sdumont2nd|sdumont2nd)/
    },
    {
        id: '2.4-login-node', etapa: 2, subpasso: 4,
        titulo: 'Você está no login node. NÃO rode nada aqui.',
        narracao: `
            <p>Perceba que o prompt mudou: agora mostra o nome do login node em que você caiu. Você está <strong>dentro</strong> do SDumont 2nd.</p>
            <p><strong>Regra crítica:</strong> o login node serve pra <em>preparar</em> coisas (editar código, carregar módulos, submeter jobs). <strong>Você NÃO roda workloads aqui.</strong> O sistema mata automaticamente qualquer processo que abuse de CPU/memória.</p>
            <p>Por quê? Porque login nodes são compartilhados por <em>todos</em> os usuários simultaneamente. Se você rodar um treino aqui, vai travar a máquina pra todo mundo. Treinos vão pros <strong>compute nodes</strong>, via SLURM (isso é a etapa 5).</p>
            <p>Curiosidade: os login nodes do 2nd têm <strong>2× AMD EPYC 9454, 386GB RAM e 2× H100</strong> cada. Mesmo assim, não é pra rodar nada pesado neles.</p>
        `
    },

    // ========== ETAPA 3: Storage ==========
    {
        id: '3.1-problema', etapa: 3, subpasso: 1,
        titulo: 'Onde botar seu dataset?',
        narracao: `
            <p>Seu dataset de palm vein (vamos dizer, ~800 MB de imagens infravermelhas) está no seu computador local. Como fazer ele chegar no SDumont 2nd? E depois que chegar, <strong>onde exatamente</strong> ele deve morar?</p>
            <p>Boa notícia: no SDumont 2nd, o storage é <strong>mais simples</strong> que no v1. Vamos ver por quê.</p>
        `
    },
    {
        id: '3.2-storage-unificado', etapa: 3, subpasso: 2,
        titulo: '$HOME == $SCRATCH: tudo em Lustre',
        narracao: `
            <p>No v1, existia uma pegadinha clássica: <code>$HOME</code> morava em <code>/prj</code> (NFS, visível só no login) e <code>$SCRATCH</code> morava em <code>/scratch</code> (Lustre, visível em tudo). Seu job falhava se tentasse ler algo do <code>/prj</code> de dentro de um compute node.</p>
            <p>No <strong>2nd, essa pegadinha sumiu</strong>: <code>$HOME</code> e <code>$SCRATCH</code> apontam pro <strong>mesmo lugar</strong>, ambos em <strong>Lustre (3 PB)</strong>, visível em <strong>todos os nós</strong>.</p>
            <p>Caminho: <code>/scratch/&lt;PROJETO&gt;/&lt;usuário&gt;</code>. Exemplo: <code>/scratch/palmvein/unseen</code>.</p>
            <p>Experimenta: digita <code>pwd</code> no terminal pra ver em qual diretório você está agora.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^pwd\b/
    },
    {
        id: '3.3-cuidados', etapa: 3, subpasso: 3,
        titulo: 'Sem backup e purge automático',
        narracao: `
            <p>Simplificou, mas os avisos continuam:</p>
            <ul>
                <li><strong>Nada no cluster tem backup.</strong> Apagou, era. Responsabilidade é 100% sua.</li>
                <li><strong>/scratch apaga arquivos automaticamente</strong> depois de 60 dias sem serem tocados. Saiu de férias? Volta e o checkpoint sumiu. Baixe pro seu computador ou suba pra um storage externo antes de qualquer pausa longa.</li>
            </ul>
            <p>Regra prática: <strong>terminou uma rodada importante? Baixa os resultados imediatamente.</strong></p>
        `
    },
    {
        id: '3.4-scp', etapa: 3, subpasso: 4,
        titulo: 'Subindo dataset com scp/rsync',
        narracao: `
            <p>Pra transferir arquivo do seu computador local pro cluster:</p>
            <ul>
                <li><code>scp dataset.tar.gz unseen@login.sdumont2nd.lncc.br:/scratch/palmvein/unseen/</code> — simples, bom pra arquivo único.</li>
                <li><code>rsync -avz --progress dataset/ unseen@login.sdumont2nd.lncc.br:/scratch/palmvein/unseen/dataset/</code> — mais rápido pra pastas grandes, resume em caso de falha. <strong>Recomendado pra dataset.</strong></li>
            </ul>
            <p>Ambos os comandos passam pela VPN, então a velocidade depende da sua conexão de internet.</p>
        `
    },

    // ========== ETAPA 4: Ambiente (arch modules + conda) ==========
    {
        id: '4.1-modules', etapa: 4, subpasso: 1,
        titulo: 'Você não instala software num cluster compartilhado',
        narracao: `
            <p>Imagina se cada usuário pudesse rodar <code>apt install</code> num cluster compartilhado. Em uma semana, caos total — versões conflitando, dependências quebradas, ninguém sabe o que tem instalado. O SDumont resolve isso com <strong>Environment Modules</strong>.</p>
            <p>A ideia: o LNCC já instalou muito software de antemão (CUDA, GCC, OpenMPI, Anaconda, PyTorch, etc.). Você só "<strong>acende</strong>" o que precisa, via <code>module load</code>. Um módulo é basicamente um conjunto de variáveis de ambiente (PATH, LD_LIBRARY_PATH) que apontam pra instalação correta.</p>
            <p><strong>Diferença importante do 2nd:</strong> no 2nd, antes de carregar qualquer software, você precisa carregar a <strong>arquitetura</strong> do nó que vai usar. Isso porque o 2nd tem nós x86, ARM e APU — software compilado pra um não roda no outro.</p>
        `
    },
    {
        id: '4.2-avail', etapa: 4, subpasso: 2,
        titulo: 'Arch primeiro, software depois',
        narracao: `
            <p>Digita <code>module avail</code> pra ver o que acontece <strong>sem</strong> uma arquitetura carregada.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^module\s+avail\b/
    },
    {
        id: '4.3-load', etapa: 4, subpasso: 3,
        titulo: 'Carregando a arquitetura + CUDA',
        narracao: `
            <p>Viu? Sem arch carregada, só aparecem os módulos de arquitetura. Pra nós H100 (que é o que o palm vein vai usar), carregue:</p>
            <pre><code>module load arch_gpu/current</code></pre>
            <p>Isso "acende" todos os softwares compilados pra x86 + H100. As opções de arch são:</p>
            <ul>
                <li><code>arch_gpu/current</code> — H100 (x86)</li>
                <li><code>arch_gpu_sc/current</code> — GH200 (ARM)</li>
                <li><code>arch_cpu_amd/current</code> — CPU AMD Genoa-X</li>
                <li><code>arch_apu_amd/current</code> — MI300A (APU AMD)</li>
                <li><code>arch_arm/current</code> — Grace ARM (CPU only)</li>
            </ul>
            <p>Carrega agora: <code>module load arch_gpu/current</code></p>
        `,
        destaque: '#terminal',
        esperaComando: /^module\s+load\s+arch_gpu/
    },
    {
        id: '4.4-conda', etapa: 4, subpasso: 4,
        titulo: 'Python + PyTorch: conda env',
        narracao: `
            <p>Agora com a arch carregada, você pode carregar softwares. O 2nd tem PyTorch como módulo! Mas pra projetos de ML é comum criar seu próprio <strong>conda env</strong> pra ter controle total.</p>
            <p>Fluxo canônico:</p>
            <pre><code>module load arch_gpu/current
module load anaconda3/2024.02
conda create --prefix $SCRATCH/envs/palmvein python=3.11 -y
source activate $SCRATCH/envs/palmvein
pip install torch torchvision</code></pre>
            <p>No 2nd, como <code>$HOME == $SCRATCH</code>, o conda env fica visível em todos os nós automaticamente.</p>
            <p><strong>Regra crítica (vale em qualquer cluster):</strong> quando for submeter com <code>sbatch</code>, o conda env <strong>NÃO pode estar ativo</strong> no seu shell. O <code>module load</code> e o <code>conda activate</code> vão <strong>dentro</strong> do job script, não fora.</p>
        `
    },

    // ========== ETAPA 5: Submissão SLURM ==========
    {
        id: '5.1-batch', etapa: 5, subpasso: 1,
        titulo: 'O que é "batch" e o que é "SLURM"',
        narracao: `
            <p>Hora do coração do tour. Dois conceitos pra começar:</p>
            <p><strong>Batch</strong> significa literalmente "um monte de coisas feitas uma depois da outra, sem parar pra perguntar nada". Daí o nome <code>sbatch</code> = <em>SLURM batch</em>.</p>
            <p><strong>SLURM</strong> = Simple Linux Utility for Resource Management. Em português claro: é o <strong>gerente</strong> que decide quando e onde seu job vai rodar. Você não diz "rodar no nó sd2nd-h100-042 agora". Você diz "preciso de 2 GPUs H100, 12 horas, partição lncc-h100_shared — me avisa quando tiver" e o SLURM coordena com todo mundo.</p>
            <p>O SLURM não é opcional. No cluster compartilhado, ele é quem evita que 100 usuários tentem usar o mesmo hardware ao mesmo tempo.</p>
        `
    },
    {
        id: '5.2-script', etapa: 5, subpasso: 2,
        titulo: 'Anatomia de um job script',
        narracao: `
            <p>Um job script é um arquivo shell (<code>.srm</code> é a convenção do LNCC, não <code>.slurm</code>) que começa com <code>#!/bin/bash</code>, depois tem linhas <code>#SBATCH ...</code> pedindo recursos, depois os comandos que vão rodar.</p>
            <p>Digita <code>cat train_palmvein.srm</code> pra ver o script do seu projeto palm vein.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+train_palmvein\.srm/
    },
    {
        id: '5.3-diretivas', etapa: 5, subpasso: 3,
        titulo: 'Decompondo as diretivas #SBATCH',
        narracao: `
            <p>Vamos ler linha por linha:</p>
            <ul>
                <li><code>-p lncc-h100_shared</code> = use a partição de H100 compartilhada</li>
                <li><code>--account=palmvein</code> = <strong>obrigatório no 2nd</strong> — identifica seu projeto (sigla do SIGLA-ID)</li>
                <li><code>--nodes=1</code> = quero 1 nó</li>
                <li><code>--gpus=2</code> = quero 2 GPUs H100 (a _shared deixa pedir 1 ou 2)</li>
                <li><code>--cpus-per-gpu=24</code> = 24 cores de CPU por GPU</li>
                <li><code>--time=12:00:00</code> = estimativa de 12h de duração (máx 24h)</li>
                <li><code>--output=slurm-%j.out</code> = output do job vai pra <code>slurm-&lt;JOBID&gt;.out</code></li>
            </ul>
            <p>Depois vêm os comandos: carregar arch + módulos, ativar conda env (dentro do script!), e rodar <code>torchrun --nproc_per_node=2 code/train.py ...</code>.</p>
        `
    },
    {
        id: '5.4-submete', etapa: 5, subpasso: 4,
        titulo: 'Submetendo o job',
        narracao: `
            <p>Chegou a hora: digita <code>sbatch train_palmvein.srm</code> e aperta Enter.</p>
            <p>Se der certo, o SLURM responde: <code>Submitted batch job &lt;ID&gt;</code>. Esse ID é o seu identificador.</p>
            <p>Se der errado... deu errado porque algum <code>#SBATCH</code> está inválido. Exemplos comuns:</p>
            <ul>
                <li>Esqueceu <code>--time</code> → <code>Requested time limit is invalid</code></li>
                <li>Esqueceu <code>--account</code> → job rejeitado (obrigatório no 2nd!)</li>
                <li>Esqueceu <code>--gpus</code> numa partição GPU → job fica pendente com razão <code>QOSMinGRES</code></li>
                <li>Pediu mais GPUs que o nó tem (ex: <code>--gpus=8</code> em h100 que tem 4) → <code>Requested node configuration is not available</code></li>
            </ul>
            <p>Submete agora.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^sbatch\s+train_palmvein\.srm/
    },
    {
        id: '5.5-fila', etapa: 5, subpasso: 5,
        titulo: 'Seu job está na fila',
        narracao: `
            <p>Olha o dashboard à direita — seu job apareceu. Pode estar como <strong>PD</strong> (pending) se os nós H100 estiverem ocupados.</p>
            <p>Quando recursos liberarem, ele sobe pra <strong>R</strong> (running) automaticamente. O cluster avança a cada 2 segundos no simulador.</p>
            <p>Próxima etapa: como monitorar o estado do seu job.</p>
        `,
        destaque: '.queue-section'
    },

    // ========== ETAPA 6: Monitoramento ==========
    {
        id: '6.1-squeue', etapa: 6, subpasso: 1,
        titulo: 'squeue: a fila de jobs',
        narracao: `
            <p>Submeti o job, e agora? Você quer saber: ele tá na fila? Rodando? Acabou? Falhou?</p>
            <p>O comando é <code>squeue</code> (SLURM queue). Sem argumentos, mostra TODOS os jobs do cluster. Com <code>--me</code>, filtra só os seus.</p>
            <p>Experimenta: <code>squeue --me</code></p>
        `,
        destaque: '#terminal',
        esperaComando: /^squeue/
    },
    {
        id: '6.2-estados', etapa: 6, subpasso: 2,
        titulo: 'Estados que o job pode ter',
        narracao: `
            <p>A coluna <strong>ST</strong> mostra o estado do job:</p>
            <ul>
                <li><strong>PD</strong> (pending) — aguardando recursos ou priority</li>
                <li><strong>R</strong> (running) — rodando agora</li>
                <li><strong>CG</strong> (completing) — terminando, liberando recursos</li>
                <li><strong>CD</strong> (completed) — deu certo</li>
                <li><strong>F</strong> (failed) — falhou (exit code ≠ 0 ou OOM ou crash)</li>
                <li><strong>TO</strong> (timeout) — passou do walltime e foi morto</li>
                <li><strong>CA</strong> (cancelled) — você cancelou com <code>scancel</code></li>
            </ul>
            <p>Se estiver <strong>PD</strong>, a coluna <strong>NODELIST(REASON)</strong> mostra por quê:</p>
            <ul>
                <li><code>Resources</code> — não tem hardware disponível ainda</li>
                <li><code>Priority</code> — outros jobs estão na frente</li>
                <li><code>QOSMinGRES</code> — você esqueceu <code>--gpus</code> numa fila GPU</li>
                <li><code>PartitionTimeLimit</code> — seu <code>--time</code> passa do máximo da fila</li>
                <li><code>AssociationJobLimit</code> — você bateu o cap de jobs por projeto</li>
            </ul>
        `
    },
    {
        id: '6.3-scontrol', etapa: 6, subpasso: 3,
        titulo: 'scontrol: raio-X do job',
        narracao: `
            <p>Pra ver TUDO sobre um job específico (quantos cores, quais nós, razão, command, etc.), usa <code>scontrol show jobid &lt;ID&gt;</code>. Pega o ID do teu job na saída do <code>squeue --me</code> e experimenta.</p>
            <p>Truque avançado: se seu job está preso numa fila lotada, você pode <strong>mover ele pra outra fila</strong> enquanto ainda está pendente:</p>
            <pre><code>scontrol update JobId=&lt;ID&gt; Partition=h100_dev</code></pre>
            <p>Isso é um "resgate" — tira o job da fila cheia e bota na dev queue. Só funciona enquanto o job está em PD.</p>
        `,
        destaque: '#terminal'
    },
    {
        id: '6.4-cancel-sacct', etapa: 6, subpasso: 4,
        titulo: 'Cancelar e histórico',
        narracao: `
            <p>Pra cancelar um job (seu, só seu): <code>scancel &lt;ID&gt;</code>. Pode ser porque você viu um bug no código, porque pediu recursos errados, ou porque desistiu.</p>
            <p>Pra ver <strong>histórico</strong> de jobs já terminados (tempo real de execução, memória usada, etc.): <code>sacct -lj &lt;ID&gt;</code>. Útil pra calibrar recursos do próximo job — se você pediu 12h e o job rodou em 3h, da próxima vez pode pedir 4h e ganhar backfill.</p>
            <p>Próxima etapa: onde encontrar os resultados do treino.</p>
        `
    },

    // ========== ETAPA 7: Resultados ==========
    {
        id: '7.1-output', etapa: 7, subpasso: 1,
        titulo: 'O arquivo slurm-JOBID.out',
        narracao: `
            <p>Quando o job roda, tudo que ele imprime no stdout (prints do Python, logs de treino, etc.) vai pra um arquivo chamado <code>slurm-&lt;JOBID&gt;.out</code>, criado no mesmo diretório onde você deu o <code>sbatch</code>.</p>
            <p>Pra inspecionar durante ou depois da execução: <code>cat slurm-12345.out</code>. Pra ver crescendo em tempo real no SDumont real, você usaria <code>tail -f slurm-12345.out</code> (aqui no simulador só tem <code>cat</code>).</p>
            <p>O <code>#SBATCH --output=slurm-%j.out</code> no script é o que controla esse nome. O <code>%j</code> é substituído pelo JOBID.</p>
        `
    },
    {
        id: '7.2-checkpoints', etapa: 7, subpasso: 2,
        titulo: 'Checkpoints e baixar resultados',
        narracao: `
            <p>Os checkpoints do seu treino ficam onde o <code>train.py</code> manda gravar. No caso do palm vein, fica em <code>$SCRATCH/checkpoints/epoch_XX.pt</code>. O SLURM não controla isso — é responsabilidade do código Python.</p>
            <p>Pra baixar resultados pro seu computador local:</p>
            <pre><code>scp unseen@login.sdumont2nd.lncc.br:/scratch/palmvein/unseen/checkpoints/best_model.pt ./
rsync -avz unseen@login.sdumont2nd.lncc.br:/scratch/palmvein/unseen/checkpoints/ ./local_ckpt/</code></pre>
        `
    },
    {
        id: '7.3-preservar', etapa: 7, subpasso: 3,
        titulo: 'Preservando o que importa',
        narracao: `
            <p><strong>Lembrete crítico:</strong> o <code>/scratch</code> apaga arquivos automaticamente depois de 60 dias sem modificação. Se você terminou uma rodada importante, <strong>baixe os resultados imediatamente</strong>:</p>
            <ul>
                <li>Baixa pro seu computador local via <code>scp</code> ou <code>rsync</code></li>
                <li>Sobe pra um storage externo (Google Drive, S3, etc.) — compute nodes não têm internet, então tem que fazer do login node</li>
            </ul>
            <p>Cemitério de projetos de ML está cheio de gente que deixou checkpoint único no /scratch e foi de férias.</p>
        `
    },

    // ========== ETAPA 8: Convivência ==========
    {
        id: '8.1-centenas', etapa: 8, subpasso: 1,
        titulo: 'Você não está sozinho',
        narracao: `
            <p>O SDumont 2nd tem <strong>dezenas de projetos</strong> ativos simultaneamente — dinâmica molecular, bioinformática, CFD, cosmologia, ML, etc. Entender como o cluster decide quem roda primeiro é essencial pra não ficar frustrado.</p>
            <p>Dá uma olhada no dashboard: os jobs do slima, rmartins, bioinfo01, cfdteam, astrolab, hemodin, quantumlab — todos são usuários fictícios simulados, mas representam o tipo de workload real do LNCC. Alguns rodando, outros esperando.</p>
        `,
        destaque: '.queue-section'
    },
    {
        id: '8.2-prioridade', etapa: 8, subpasso: 2,
        titulo: 'Fórmula de prioridade',
        narracao: `
            <p>O SLURM decide a ordem na fila por uma fórmula (SLURM 24.05.3 no 2nd):</p>
            <pre><code>prioridade = Age + Fairshare + Partition + QOS</code></pre>
            <ul>
                <li><strong>Age</strong> — quanto tempo seu job já esperou. Cresce devagar, evita que jobs fiquem "esquecidos" eternamente.</li>
                <li><strong>Fairshare</strong> — quanto seu projeto já usou recentemente. <strong>Quem usou mais, tem menos prioridade.</strong> Quem usou menos, sobe. É justiça entre projetos.</li>
                <li><strong>Partition</strong> — cada fila tem um peso. <code>*_dev</code> tem peso alto (prioridade garantida pra testes rápidos).</li>
                <li><strong>QOS</strong> (Quality of Service) — o default é <code>Normal</code>. Se seu projeto bate no limite de alocação, cai pra <code>Low</code> (-5%).</li>
            </ul>
        `
    },
    {
        id: '8.3-backfill', etapa: 8, subpasso: 3,
        titulo: 'Backfill: o Tetris do scheduler',
        narracao: `
            <p>Aqui vai o truque mais contra-intuitivo do SLURM: <strong>pedir menos tempo faz seu job rodar antes</strong>.</p>
            <p>Imagina a fila como um <strong>jogo de Tetris</strong>. O SLURM sabe quanto tempo cada job vai levar (por isso o <code>--time</code> é obrigatório) e tenta <strong>encaixar jobs pequenos nos buracos</strong> entre jobs grandes, desde que isso não atrase os grandes.</p>
            <p>Consequência prática: se seu treino de fato vai levar 3 horas, <strong>não peça 24</strong>. Pedir 3.5h aumenta muito a chance de backfill — o SLURM consegue encaixar você num slot que ninguém mais cabe. Pedir 24h te exclui de muita oportunidade.</p>
            <p>Regra prática: <strong>pede 30% a mais do que o tempo esperado</strong>, não mais.</p>
        `
    },
    {
        id: '8.4-fim', etapa: 8, subpasso: 4,
        titulo: 'Fim do tour. Você está pronto.',
        narracao: `
            <p>Parabéns! Você passou pelas 9 etapas. A esta altura você já:</p>
            <ul>
                <li>Sabe distinguir <strong>SDumont v1 da 2nd</strong> (e que você usa o 2nd)</li>
                <li>Entende o que é nó, partição, cluster, HPC</li>
                <li>Sabe entrar no cluster via VPN + SSH e o que pode (e não pode) fazer no login node</li>
                <li>Conhece o storage unificado (<code>$HOME == $SCRATCH</code>) do 2nd</li>
                <li>Sabe como carregar arch + software via <code>module load</code></li>
                <li>Escreve um job script com <code>--account</code>, submete com <code>sbatch</code>, interpreta os erros</li>
                <li>Monitora com <code>squeue</code>, <code>sinfo</code>, <code>scontrol</code>, <code>sacct</code></li>
                <li>Sabe onde achar output, checkpoints, e como preservar antes do purge de 60 dias</li>
                <li>Entende fairshare, backfill e por que pedir menos tempo é vantajoso</li>
            </ul>
            <p>Você pode clicar em qualquer etapa anterior no topo pra revisar, ou continuar praticando livremente no terminal.</p>
        `
    }
];

export function getStepById(id) {
    return STEPS.find(s => s.id === id);
}

export function getStepIndex(id) {
    return STEPS.findIndex(s => s.id === id);
}

export function getNextStep(currentId) {
    const i = getStepIndex(currentId);
    return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
}

export function getPreviousStep(currentId) {
    const i = getStepIndex(currentId);
    return i > 0 ? STEPS[i - 1] : null;
}

export function getFirstStepOfEtapa(etapaNum) {
    return STEPS.find(s => s.etapa === etapaNum);
}
