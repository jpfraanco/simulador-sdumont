// data/tour.js
// Tour de 9 etapas (0-8) com todas as sub-etapas inline.
// Voz: português brasileiro conversacional, siglas definidas na primeira aparição,
// "porquê" antes do "como", clareza para leigo > fidelidade a instrutor.
//
// Cada passo: { id, etapa, subpasso, titulo, narracao (HTML string),
//   esperaComando (regex opcional), destaque (seletor CSS opcional) }

export const ETAPAS = [
    { num: 0, id: 'v1-vs-2nd',     titulo: 'v1 vs 2nd',      descricao: 'Entenda qual Santos Dumont você vai usar antes de tudo' },
    { num: 1, id: 'arquitetura',   titulo: 'Arquitetura',    descricao: 'O que é HPC, cluster, nó, partição' },
    { num: 2, id: 'acesso',        titulo: 'Acesso',         descricao: 'VPN + SSH para entrar no cluster' },
    { num: 3, id: 'dados',         titulo: 'Dados',          descricao: '/prj vs /scratch e a pegadinha principal' },
    { num: 4, id: 'ambiente',      titulo: 'Ambiente',       descricao: 'Module load + conda env' },
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
                <li><strong>SDumont Expansão (2019)</strong> — <strong>ESSA É A QUE VOCÊ VAI USAR</strong>. 5.1 PFlops. Baseada em CPUs Intel Xeon Cascade Lake + GPUs NVIDIA V100. Quando este simulador diz "SDumont" ou "v1", é dessa máquina.</li>
                <li><strong>SDumont 2nd (2024)</strong> — máquina novinha, 25 PFlops, com GPUs H100 e GH200. É outra máquina, em outro container, com partições e comandos diferentes. <strong>Você NÃO vai usar.</strong></li>
            </ul>
            <p>Por que isso importa? Porque se você pesquisar "Santos Dumont" no Google hoje, vai cair num blog da NVIDIA sobre H100 e ampliação 4× maior. Esse blog é sobre o <strong>2nd</strong>, não sobre o que você vai usar. <strong>Não confunda.</strong></p>
        `
    },
    {
        id: '0.3-guardian', etapa: 0, subpasso: 3,
        titulo: 'Três frases-guardiãs pra reunião',
        narracao: `
            <p>Leva essas três frases na cabeça — vão te salvar na reunião com a equipe do LNCC:</p>
            <ol class="guardian">
                <li>Se aparecer <strong>H100, GH200 ou MI300A</strong>, é o <strong>2nd</strong> — não é você.</li>
                <li>Se aparecer <code>sequana_*</code> nas partições, é o <strong>v1</strong> — é você.</li>
                <li>Seu <code>$HOME</code> mora dentro de <code>/prj</code>, não em <code>/home</code>. (A gente explica na etapa 3.)</li>
            </ol>
            <p>Repara que no canto superior esquerdo tem sempre o selo <strong>🟦 SDumont Expansão (v1)</strong>, lembrando onde você está. Próxima etapa: conceitos e arquitetura.</p>
        `
    },

    // ========== ETAPA 1: Arquitetura ==========
    {
        id: '1.1-container', etapa: 1, subpasso: 1,
        titulo: 'O SDumont mora num contêiner',
        narracao: `
            <p>Primeira imagem mental: o SDumont <strong>literalmente cabe dentro de dois contêineres marítimos</strong>. Não é uma sala cheia de racks — são dois contêineres portáteis ligados por um corredor.</p>
            <p>A refrigeração é feita por um loop de <strong>glicol</strong> (um líquido). Entra frio na parte de cima, passa perto dos componentes quentes, sai aquecido, e volta pro sistema de resfriamento. É um data center em miniatura.</p>
            <p>Por que isso importa? Porque quando você submeter um treino, seu código vai parar fisicamente dentro de uma dessas caixas de metal. É bom saber onde.</p>
        `
    },
    {
        id: '1.2-hpc', etapa: 1, subpasso: 2,
        titulo: 'O que é HPC, cluster, nó',
        narracao: `
            <p><strong>HPC</strong> = High Performance Computing (computação de alto desempenho). Soa pomposo, mas a ideia é simples: problemas grandes demais pra um computador só, a gente divide em pedaços e roda em <strong>vários computadores trabalhando juntos</strong>.</p>
            <p>Esses computadores, coordenados por uma rede rápida, formam um <strong>cluster</strong>. Cada computador individual é um <strong>nó</strong> (em inglês, <em>node</em>).</p>
            <p>O SDumont v1 tem <strong>377 nós computacionais</strong>. Você não vai usar todos — quase ninguém usa. Projetos típicos usam entre 1 e 16 nós ao mesmo tempo. Dá uma olhada no dashboard à direita: os quadradinhos coloridos são os nós.</p>
        `,
        destaque: '.nodegrid-root'
    },
    {
        id: '1.3-tipos-de-no', etapa: 1, subpasso: 3,
        titulo: 'Os 4 tipos de nó',
        narracao: `
            <p>Nem todo nó é igual. O v1 tem 4 "sabores":</p>
            <ul>
                <li><strong>CPU (246 nós)</strong>: 48 cores Intel Cascade Lake + 384 GB RAM, sem GPU. Pra simulações em CPU pura (dinâmica molecular, CFD...).</li>
                <li><strong>CPU BIGMEM (36 nós)</strong>: iguais, mas com <strong>768 GB RAM</strong>. Pra quando o dataset é gigante.</li>
                <li><strong>GPU (94 nós)</strong>: 48 cores + <strong>4× NVIDIA Tesla V100</strong>. Pra CUDA e deep learning multi-GPU.</li>
                <li><strong>GDL (1 nó único)</strong>: especial. <strong>8× V100 conectadas por NVLink</strong> num mesmo nó. É o mais cobiçado pra treino de rede neural grande. <strong>É nele que o seu palm vein vai rodar.</strong></li>
            </ul>
            <p>Olha o dashboard: verde = livre, amarelo = parcial, vermelho = cheio. Passa o mouse num quadradinho pra ver o nome do nó e uso atual.</p>
        `,
        destaque: '.nodegrid-root'
    },
    {
        id: '1.4-particoes', etapa: 1, subpasso: 4,
        titulo: 'Partições: filas do cluster',
        narracao: `
            <p>Cada grupo de nós é oferecido através de uma ou mais <strong>partições</strong>. Pensa em partição como uma <em>fila do supermercado</em>: cada fila aceita um tipo de cliente e tem regras próprias.</p>
            <p>As partições do v1:</p>
            <ul>
                <li><code>sequana_cpu</code> — CPUs, walltime máx 96h</li>
                <li><code>sequana_cpu_dev</code> — CPUs, só 20min, prioridade alta (pra testar rápido)</li>
                <li><code>sequana_cpu_long</code> — CPUs, até 744h (31 dias)</li>
                <li><code>sequana_cpu_bigmem</code> / <code>_long</code> — nós BIGMEM</li>
                <li><code>sequana_gpu</code> / <code>_dev</code> / <code>_long</code> — 94 nós GPU</li>
                <li><code>gdl</code> — o nó único de deep learning, walltime 48h máx. <strong>É onde seu job palm vein vai.</strong></li>
            </ul>
            <p>Agora experimenta no terminal: digita <code>sinfo</code> e aperta Enter pra ver o estado real das partições.</p>
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
            <p>Agora vai. Com a VPN ligada, você faz <strong>SSH</strong> pra um dos quatro <em>login nodes</em> do v1 (<code>sdumont15</code>, <code>sdumont16</code>, <code>sdumont17</code>, <code>sdumont18</code>). Cada vez que você faz SSH, pode cair num nó diferente — não é determinístico.</p>
            <p>Comando canônico: <code>ssh &lt;seu-usuário&gt;@login.sdumont.lncc.br</code>. Aqui no simulador seu usuário é <code>unseen</code>.</p>
            <p>Digita agora no terminal:</p>
            <pre><code>ssh unseen@sdumont15</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^ssh\s+unseen@sdumont(15|16|17|18|\.|login)/
    },
    {
        id: '2.4-login-node', etapa: 2, subpasso: 4,
        titulo: 'Você está no login node. NÃO rode nada aqui.',
        narracao: `
            <p>Perceba que o prompt mudou: agora é <code>unseen@sdumont15:~$</code>. Você está <strong>dentro</strong> de um dos login nodes.</p>
            <p><strong>Regra crítica:</strong> o login node serve pra <em>preparar</em> coisas (editar código, carregar módulos, submeter jobs). <strong>Você NÃO roda workloads aqui.</strong> O sistema mata automaticamente qualquer processo seu que passe de <strong>30 minutos de CPU</strong> num login node.</p>
            <p>Por quê? Porque login nodes são compartilhados por <em>todos</em> os usuários simultaneamente. Se você rodar um treino aqui, vai travar a máquina pra todo mundo. Treinos vão pros <strong>compute nodes</strong>, via SLURM (isso é a etapa 5).</p>
            <p>Lá na reunião de terça, anota: "<em>é permitido rodar aplicações no login node?</em>" — a resposta é NÃO. Todo mundo pergunta, e todo mundo ouve a mesma coisa.</p>
        `
    },

    // ========== ETAPA 3: /prj vs /scratch ==========
    {
        id: '3.1-problema', etapa: 3, subpasso: 1,
        titulo: 'Onde botar seu dataset?',
        narracao: `
            <p>Seu dataset de palm vein (vamos dizer, ~800 MB de imagens infravermelhas) está no seu computador local. Como fazer ele chegar no SDumont? E depois que chegar, <strong>onde exatamente</strong> ele deve morar?</p>
            <p>O SDumont v1 tem <strong>duas áreas de armazenamento</strong>, com propósitos bem diferentes. Entender a diferença é a <strong>pegadinha principal</strong> do curso — todo mundo tropeça aqui na primeira semana.</p>
        `
    },
    {
        id: '3.2-duas-areas', etapa: 3, subpasso: 2,
        titulo: '/prj e /scratch: armário vs bancada',
        narracao: `
            <p><strong><code>/prj/&lt;PROJETO&gt;/&lt;usuário&gt;</code></strong> é o <code>$HOME</code>. Mora numa storage DellEMC Isilon via NFS, 650 TB no total. <strong>É onde você guarda o que quer preservar</strong>: código-fonte, scripts, resultados finais. Pensa como "armário de arquivo morto" — menos rápida, mais durável. <strong>Visível SÓ nos login nodes.</strong></p>
            <p><strong><code>/scratch/&lt;PROJETO&gt;/&lt;usuário&gt;</code></strong> é o <code>$SCRATCH</code>. Mora numa Lustre ClusterStor L300, 1.1 PB, feita pra throughput massivo. <strong>É onde seu job efetivamente trabalha</strong>: lê dataset, escreve checkpoint, gera logs. Pensa como "bancada de trabalho". <strong>Visível em TODOS os nós (login + compute).</strong></p>
            <p>Experimenta: digita <code>pwd</code> no terminal pra ver em qual diretório você está agora.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^pwd\b/
    },
    {
        id: '3.3-pegadinha', etapa: 3, subpasso: 3,
        titulo: 'A pegadinha: /prj invisível no compute node',
        narracao: `
            <p>Repara que o <code>pwd</code> retornou <code>/prj/palmvein/unseen</code>. Esse é o seu <code>$HOME</code> aqui no login node.</p>
            <p>Agora a pegadinha: <strong><code>/prj</code> NÃO É VISÍVEL dentro do job</strong>. Quando o SLURM manda seu job pra um compute node, aquele nó não consegue enxergar <code>/prj</code>. Se seu <code>train.py</code> estiver tentando ler <code>/prj/palmvein/unseen/dataset/imagem_001.png</code>, o job vai falhar com <code>No such file or directory</code>.</p>
            <p><strong>Solução canônica:</strong> código editado em <code>/prj</code> (fica preservado), mas dataset e tudo que o job precisa ficam em <code>/scratch</code>. O job roda em <code>/scratch</code>, gera checkpoints em <code>/scratch</code>, e <strong>depois</strong> você copia o que quer guardar de volta pra <code>/prj</code>.</p>
            <p>Resumo: <strong>edita em /prj, roda em /scratch</strong>. Decora isso.</p>
        `
    },
    {
        id: '3.4-scp', etapa: 3, subpasso: 4,
        titulo: 'Subindo dataset com scp/rsync',
        narracao: `
            <p>Pra transferir arquivo do seu computador local pro cluster, dois comandos servem:</p>
            <ul>
                <li><code>scp dataset.tar.gz unseen@sdumont15:/scratch/palmvein/unseen/</code> — simples, bom pra arquivo único.</li>
                <li><code>rsync -avz --progress dataset/ unseen@sdumont15:/scratch/palmvein/unseen/dataset/</code> — mais rápido pra pastas grandes, resume em caso de falha. <strong>Recomendado pra dataset.</strong></li>
            </ul>
            <p><strong>Dois avisos que não podem ser esquecidos:</strong></p>
            <ul>
                <li><strong>Nada em /prj ou /scratch tem backup no LNCC.</strong> Apagou, era. Responsabilidade é 100% sua.</li>
                <li><strong>/scratch apaga arquivos automaticamente</strong> depois de 60 dias sem serem tocados. Saiu de férias? Volta e o checkpoint sumiu. Move pro /prj ou pra fora antes de qualquer pausa longa.</li>
            </ul>
        `
    },

    // ========== ETAPA 4: Ambiente (modules + conda) ==========
    {
        id: '4.1-modules', etapa: 4, subpasso: 1,
        titulo: 'Você não instala software num cluster compartilhado',
        narracao: `
            <p>Imagina se cada usuário pudesse rodar <code>apt install</code> num cluster compartilhado. Em uma semana, caos total — versões conflitando, dependências quebradas, ninguém sabe o que tem instalado. O SDumont resolve isso com <strong>Environment Modules</strong>.</p>
            <p>A ideia: o LNCC já instalou muito software de antemão (CUDA, GCC, OpenMPI, Anaconda, etc.). Você só "<strong>acende</strong>" o que precisa, via <code>module load</code>. Um módulo é basicamente um conjunto de variáveis de ambiente (PATH, LD_LIBRARY_PATH) que apontam pra instalação correta.</p>
            <p>Vantagem: você pode usar CUDA 11.2 enquanto seu colega usa OpenMPI 4.1.4, sem conflito. Cada um "acende" o que precisa no próprio shell.</p>
        `
    },
    {
        id: '4.2-avail', etapa: 4, subpasso: 2,
        titulo: 'Vendo o que tem disponível',
        narracao: `
            <p>Digita agora: <code>module avail</code>. Isso lista todos os módulos que o LNCC tem instalados no v1.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^module\s+avail\b/
    },
    {
        id: '4.3-load', etapa: 4, subpasso: 3,
        titulo: 'Carregando o CUDA',
        narracao: `
            <p>Repare num nome típico: <code>cuda/11.2_sequana</code>. Vamos decompor:</p>
            <ul>
                <li><code>cuda</code> = o software</li>
                <li><code>11.2</code> = a versão</li>
                <li><code>_sequana</code> = "compilado especificamente pra essa máquina" (o v1 é um Bull Sequana). Essa convenção é do LNCC.</li>
            </ul>
            <p>Pra ativar: <code>module load cuda/11.2_sequana</code>. Experimenta agora.</p>
            <p>Depois, confirma que deu certo com <code>module list</code>.</p>
            <p>Nota importante: <strong>o v1 NÃO suporta</strong> <code>module purge</code> nem <code>module spider</code>. Esses só funcionam no 2nd. Se você tentar, dá erro. Use <code>module unload &lt;nome&gt;</code> pra descarregar.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^module\s+load\s+cuda/
    },
    {
        id: '4.4-conda', etapa: 4, subpasso: 4,
        titulo: 'Python + PyTorch: conda env no scratch',
        narracao: `
            <p>Você pode estar se perguntando: "cadê o módulo do PyTorch?" Resposta: <strong>não existe no v1</strong>. Ferramentas de ML não vivem como módulo — cada projeto cria seu próprio <strong>conda env</strong> com a versão que quiser.</p>
            <p>Fluxo canônico:</p>
            <pre><code>module load anaconda3/2024.02_sequana
conda create --prefix $SCRATCH/envs/palmvein python=3.11 -y
source activate $SCRATCH/envs/palmvein
pip install torch torchvision</code></pre>
            <p>Repara que o conda env mora em <code>$SCRATCH</code>, <strong>não em /prj</strong>. Porque o compute node precisa enxergar ele, e já sabemos que <code>/prj</code> não é visível nos compute nodes.</p>
            <p><strong>Regra crítica (o curso bate nisso 3 vezes):</strong> quando você for submeter com <code>sbatch</code>, o conda env <strong>NÃO pode estar ativo</strong> no seu shell do login node. O <code>module load</code> e o <code>conda activate</code> vão <strong>dentro</strong> do job script, não fora. Senão dá conflito de ambiente.</p>
        `
    },

    // ========== ETAPA 5: Submissão SLURM ==========
    {
        id: '5.1-batch', etapa: 5, subpasso: 1,
        titulo: 'O que é "batch" e o que é "SLURM"',
        narracao: `
            <p>Hora do coração do tour. Dois conceitos pra começar:</p>
            <p><strong>Batch</strong> significa literalmente "um monte de coisas feitas uma depois da outra, sem parar pra perguntar nada". Daí o nome <code>sbatch</code> = <em>SLURM batch</em>.</p>
            <p><strong>SLURM</strong> = Simple Linux Utility for Resource Management. Em português claro: é o <strong>gerente</strong> que decide quando e onde seu job vai rodar. Você não diz "rodar no nó sdumont6042 agora". Você diz "preciso de 8 GPUs, 8 horas, partição gdl — me avisa quando tiver" e o SLURM coordena com todo mundo.</p>
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
                <li><code>-p gdl</code> = use a partição <code>gdl</code> (o nó deep learning)</li>
                <li><code>--nodes=1</code> = quero 1 nó</li>
                <li><code>--gpus=8</code> = quero 8 GPUs (o <code>gdl</code> tem exatamente 8 V100 NVLink)</li>
                <li><code>--cpus-per-gpu=5</code> = 5 cores de CPU por GPU (40 total, o máximo do gdl)</li>
                <li><code>--time=08:00:00</code> = estimativa de 8h de duração</li>
                <li><code>--output=slurm-%j.out</code> = o output do job vai pra um arquivo chamado <code>slurm-&lt;JOBID&gt;.out</code></li>
            </ul>
            <p>Depois vêm os comandos: carregar módulos, ativar conda env (dentro do script!), e rodar <code>torchrun --nproc_per_node=8 code/train.py ...</code>.</p>
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
                <li>Esqueceu <code>--gpus</code> numa partição GPU → job fica pendente com razão <code>QOSMinGRES</code></li>
                <li>Pediu mais GPUs que o nó tem (ex: <code>--gpus=20</code> no gdl) → <code>Requested node configuration is not available</code></li>
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
            <p>Olha o dashboard à direita — seu job apareceu. Provavelmente como <strong>PD</strong> (pending), porque o <code>rmartins</code> já está rodando os 8 V100 do GDL (lembra que o GDL é <strong>1 nó único</strong>?).</p>
            <p>Não tem problema. Quando o job do rmartins terminar, as GPUs liberam, e o seu sobe pra <strong>R</strong> (running) automaticamente. Tudo isso acontece em tempo real aqui no simulador — o cluster avança a cada 2 segundos, pra não ficar entediante.</p>
            <p>Próxima etapa: como saber em que estado seu job está.</p>
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
                <li><code>AssociationJobLimit</code> — você bateu o cap de 100 jobs por projeto</li>
            </ul>
        `
    },
    {
        id: '6.3-scontrol', etapa: 6, subpasso: 3,
        titulo: 'scontrol: raio-X do job',
        narracao: `
            <p>Pra ver TUDO sobre um job específico (quantos cores, quais nós, razão, command, etc.), usa <code>scontrol show jobid &lt;ID&gt;</code>. Pega o ID do teu job na saída do <code>squeue --me</code> e experimenta.</p>
            <p>Truque avançado que só os veteranos sabem: se seu job está preso numa fila lotada, você pode <strong>mover ele pra outra fila</strong> enquanto ainda está pendente:</p>
            <pre><code>scontrol update JobId=&lt;ID&gt; Partition=sequana_gpu_dev</code></pre>
            <p>Isso é um "resgate" — tira o job da fila cheia e bota numa vazia. Só funciona enquanto o job está em PD.</p>
        `,
        destaque: '#terminal'
    },
    {
        id: '6.4-cancel-sacct', etapa: 6, subpasso: 4,
        titulo: 'Cancelar e histórico',
        narracao: `
            <p>Pra cancelar um job (seu, só seu): <code>scancel &lt;ID&gt;</code>. Pode ser porque você viu um bug no código, porque pediu recursos errados, ou porque desistiu.</p>
            <p>Pra ver <strong>histórico</strong> de jobs já terminados (tempo real de execução, memória usada, etc.): <code>sacct -lj &lt;ID&gt;</code>. Útil pra calibrar recursos do próximo job — se você pediu 8h e o job rodou em 2h, da próxima vez pode pedir 3h e ganhar backfill.</p>
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
            <p>Pra baixar resultados pro seu computador local (depois de desconectar do SDumont e ativar a VPN local):</p>
            <pre><code>scp unseen@sdumont15:/scratch/palmvein/unseen/checkpoints/best_model.pt ./
rsync -avz unseen@sdumont15:/scratch/palmvein/unseen/checkpoints/ ./local_ckpt/</code></pre>
        `
    },
    {
        id: '7.3-preservar', etapa: 7, subpasso: 3,
        titulo: 'Preservando o que importa',
        narracao: `
            <p><strong>Lembrete crítico:</strong> o <code>/scratch</code> apaga arquivos automaticamente depois de 60 dias sem modificação. Se você terminou uma rodada importante e não quer perder os checkpoints, você tem 3 opções (faça <strong>pelo menos uma</strong>):</p>
            <ul>
                <li>Move pra <code>/prj</code>: <code>mv $SCRATCH/checkpoints/best_model.pt /prj/palmvein/unseen/results/</code> (mas /prj também não tem backup!)</li>
                <li>Baixa pro seu computador local via <code>scp</code></li>
                <li>Sobe pra um storage externo (Google Drive, S3, etc.) via <code>rsync</code> — compute nodes não têm internet, então tem que fazer do login node</li>
            </ul>
            <p>Cemitério de projetos de ML está cheio de gente que deixou checkpoint único no /scratch e foi de férias.</p>
        `
    },

    // ========== ETAPA 8: Convivência ==========
    {
        id: '8.1-centenas', etapa: 8, subpasso: 1,
        titulo: 'Você não está sozinho',
        narracao: `
            <p>O SDumont v1 tem <strong>centenas de projetos</strong> ativos simultaneamente — dinâmica molecular, bioinformática, CFD, cosmologia, ML, etc. Entender como o cluster decide quem roda primeiro é essencial pra não ficar frustrado.</p>
            <p>Dá uma olhada no dashboard: os jobs do slima, rmartins, bioinfo01, cfdteam, astrolab, hemodin, quantumlab — todos são usuários fictícios simulados, mas representam o tipo de workload real do LNCC. Alguns rodando, outros esperando.</p>
        `,
        destaque: '.queue-section'
    },
    {
        id: '8.2-prioridade', etapa: 8, subpasso: 2,
        titulo: 'Fórmula de prioridade',
        narracao: `
            <p>O SLURM decide a ordem na fila por uma fórmula (SLURM 23.11.1 no v1):</p>
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
            <p>Parabéns 🎉 você passou pelas 9 etapas. A esta altura você já:</p>
            <ul>
                <li>Sabe distinguir <strong>SDumont v1 da 2nd</strong> (a reunião de terça não vai te pegar)</li>
                <li>Entende o que é nó, partição, cluster, HPC</li>
                <li>Sabe entrar no cluster via VPN + SSH e o que pode (e não pode) fazer no login node</li>
                <li>Conhece a pegadinha <code>/prj</code> vs <code>/scratch</code> — a mais importante de todas</li>
                <li>Sabe como acender software via <code>module load</code> e por que o conda env vive no scratch</li>
                <li>Escreve um job script, submete com <code>sbatch</code>, interpreta os erros</li>
                <li>Monitora com <code>squeue</code>, <code>sinfo</code>, <code>scontrol</code>, <code>sacct</code></li>
                <li>Sabe onde achar output, checkpoints, e como preservar antes do purge de 60 dias</li>
                <li>Entende fairshare, backfill e por que pedir menos tempo é vantajoso</li>
            </ul>
            <p>Você pode clicar em qualquer etapa anterior no topo pra revisar, ou continuar praticando livremente no terminal. Boa reunião na terça. 🚀</p>
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
