# Simulador Educativo do SDumont — Design

**Data:** 2026-04-11
**Autor:** brainstorming com Pedro Cormann (`unseen`)
**Status:** draft, aguardando revisão do usuário antes do plano de implementação

---

## 1. Visão geral e objetivo

Criar um **simulador educativo interativo do supercomputador Santos Dumont** (SDumont Expansão, 2019 — também chamado "v1"), rodando 100% no navegador como site estático, publicável no portfólio pessoal do usuário. O simulador ensina do zero como operar o SDumont ponta a ponta, com narrador em português conversacional, dashboard do cluster ao vivo e terminal SSH simulado onde o usuário digita comandos reais.

O público primário é o próprio usuário, que tem **zero experiência com HPC** e precisa sair do simulador preparado para uma reunião com a equipe do LNCC sobre rodar um projeto de palm vein biometrics. O público secundário são visitantes do portfólio que queiram entender SDumont.

## 2. Não-objetivos (o que o simulador NÃO é)

- Não é uma reimplementação funcional do SLURM. É uma simulação didática com estado controlado.
- Não executa código de verdade (sem Python, sem CUDA, sem PyTorch).
- Não se conecta ao SDumont real. É offline, sem back-end, sem autenticação.
- Não cobre SDumont 2nd como alvo de aprendizagem — o 2nd aparece só como **contraste didático** num card comparativo.
- Não tenta ser uma referência canônica do manual. Para fontes autoritativas, o simulador linka para o wiki oficial.

## 3. Perfil do usuário e premissas

- **Primário:** Pedro Cormann. Zero base em HPC/SLURM/Linux-cluster. Projeto de ML em biometria de veias palmares. Vai usar o **SDumont v1 (Expansão)**, não o 2nd.
- **Idioma:** português brasileiro conversacional.
- **Plataforma:** navegador desktop moderno, resolução ≥ 1280 px. Funciona em tablet/mobile com layout colapsado, mas a experiência ideal é desktop.
- **Persistência:** `localStorage` local. Sem autenticação, sem back-end, sem sync entre dispositivos em v1.

## 4. Arquitetura de alto nível

### 4.1 Stack

- **HTML + CSS + JavaScript vanilla** (ES modules). Sem frameworks (React/Vue/Svelte), sem bundler, sem build step. Abre-se com duplo clique no `index.html` ou servindo a pasta como estático.
- **Sem dependências externas** em runtime (ou no máximo uma única lib CDN opcional para syntax highlight dentro do editor nano/vim modal — a decidir na implementação).
- Código organizado em módulos ES (`import`/`export`) para manter arquivos pequenos e responsabilidades isoladas.

### 4.2 Layout principal

Grid CSS de 3 painéis dentro de uma shell de largura total:

```
┌─────────────────────────────────────────────────────────────┐
│ TOPO: Barra de progresso (9 etapas) + selo v1 fixo          │
├──────────────┬──────────────────────────────────────────────┤
│              │  DASHBOARD DO CLUSTER                        │
│  NARRADOR    │  ┌────────────────────────────────────────┐  │
│  (esquerda   │  │ Partições, nós (grid denso), fila       │  │
│  ~30% largura│  │ de jobs, outros usuários, selo v1      │  │
│              │  └────────────────────────────────────────┘  │
│              ├──────────────────────────────────────────────┤
│  Texto       │  TERMINAL SSH SIMULADO                       │
│  + glossário │  pedro@local:~$ ssh unseen@sdumont15.lncc   │
│  + botões    │  ...                                         │
│              │  unseen@sdumont15:~$ _                       │
└──────────────┴──────────────────────────────────────────────┘
```

Breakpoint principal: ≥ 1280 px → 3 painéis lado a lado. Abaixo → abas `[Narrador] [Dashboard] [Terminal]` com aviso para usar tela maior.

### 4.3 Estrutura de arquivos

```
simulador-sdumont/
├── index.html
├── style.css
├── assets/
│   ├── favicon.svg
│   └── icons/                       (SVG inline: nó, gpu, cpu, seta, halo)
├── js/
│   ├── main.js                      (entry point; monta a app)
│   ├── state.js                     (store global + localStorage glue)
│   ├── cluster.js                   (modelo do cluster, tick loop)
│   ├── filesystem.js                (árvore FS simulada + operações)
│   ├── narrator.js                  (motor do tour, render, progresso)
│   ├── progress.js                  (barra de progresso topo)
│   ├── terminal.js                  (parser, prompt, histórico, autocomplete)
│   ├── commands/
│   │   ├── index.js                 (registry)
│   │   ├── parser.js                (tokenizer + dispatcher)
│   │   ├── fs.js                    (ls, cd, pwd, cat, mkdir, nano/vim)
│   │   ├── ssh.js                   (ssh, scp, rsync, exit)
│   │   ├── modules.js               (module avail/load/list/unload/whatis)
│   │   ├── slurm.js                 (sbatch, squeue, sinfo, sacct, scancel,
│   │   │                             scontrol, salloc, srun, sprio, sacctmgr)
│   │   ├── lustre.js                (lfs quota, lfs df, lfs getstripe)
│   │   └── utils.js                 (nvidia-smi, whoami, hostname, date,
│   │                                 nodeset, clear, help, history)
│   ├── users.js                     (usuários fictícios recorrentes)
│   └── ui/
│       ├── dashboard.js             (orquestra render do painel central)
│       ├── nodegrid.js              (visualização densa dos 377 nós)
│       ├── queueview.js             (tabela da fila com fairshare)
│       ├── highlight.js             (halo + seta animada de destaque)
│       ├── modals.js                (editor nano, glossário, help,
│       │                             card v1 vs 2nd, reset)
│       └── glossario.js             (dropdown + tooltip de termos)
├── data/
│   ├── tour.js                      (array de 9 etapas + sub-passos)
│   ├── initial-cluster.js           (377 nós proceduralmente, partições)
│   ├── initial-fs.js                (árvore inicial /prj /scratch)
│   ├── initial-users.js             (jobs recorrentes de outros usuários)
│   ├── job-templates.js             (train_palmvein.srm e outros)
│   └── v1-vs-2nd.js                 (tabela comparativa SDumont v1 vs 2nd)
├── content/
│   ├── narration/
│   │   ├── 00-v1-vs-2nd.js
│   │   ├── 01-arquitetura.js
│   │   ├── 02-acesso.js
│   │   ├── 03-dados.js
│   │   ├── 04-ambiente.js
│   │   ├── 05-submissao.js
│   │   ├── 06-monitoramento.js
│   │   ├── 07-resultados.js
│   │   └── 08-convivencia.js
│   └── fake-files/                  (conteúdo dos arquivos do FS simulado)
│       ├── train_py.txt
│       ├── model_py.txt
│       ├── requirements_txt.txt
│       ├── train_palmvein_srm.txt
│       └── readme_palmvein_md.txt
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-11-simulador-sdumont-design.md   (este arquivo)
├── research/                        (.gitignore — não publicado)
│   ├── manual-sdumont/
│   ├── manual-sdumont-wiki/
│   ├── manual-sdumont2nd/
│   ├── manual-sdumont2nd-wiki/
│   ├── site_unflat_2026/
│   ├── findings.md
│   └── narrator-voice.md            (gerado por agente durante brainstorming)
├── .gitignore
└── README.md                        (como abrir, publicar, creditos)
```

## 5. Modelo de dados do cluster simulado

### 5.1 Fontes ancoradas no material real

Baseado no `manual-sdumont` wiki oficial e nos slides do curso "Escola Santos Dumont — 26 de Janeiro de 2026" compartilhados pelo usuário. **Tudo sem especulação** — onde o manual não publica um dado (ex: quotas fixas), o simulador mostra valores plausíveis e marca-os como "ilustrativos".

### 5.2 Hardware (SDumont Expansão v1, 2019)

- **Frame:** Bull Sequana X1000, blades Bull Sequana X1120.
- **Pico teórico:** ~5.1 PFlops (slide oficial do LNCC, 2026).
- **Interconnect:** InfiniBand EDR 100 Gb/s.
- **Nós computacionais:** 377 no total
  - **246 nós CPU:** 2× Intel Xeon Cascade Lake Gold 6252 (48 cores totais), 384 GB RAM, sem GPU
  - **36 nós CPU BIGMEM:** 2× Intel Xeon Cascade Lake Gold 6252 (48 cores), 768 GB RAM, sem GPU
  - **94 nós GPU:** 2× Intel Xeon Skylake 6252 (48 cores), 384 GB RAM, **4× NVIDIA Tesla V100**
  - **1 nó GDL (deep learning dedicado):** 2× Intel Xeon Skylake Gold 6148 (40 cores), 384 GB RAM, **8× NVIDIA Tesla V100-SXM2-16GB com NVLink**
- **Login nodes:** 4 — `sdumont15`, `sdumont16`, `sdumont17`, `sdumont18`
- **Compute node naming:** `sdumontNNNN` (4 dígitos, exemplos reais do manual: `sdumont1468`, faixa `sdumont6000`–`sdumont6089`). O simulador gera proceduralmente nomes plausíveis.

### 5.3 Partições SLURM (nomes reais do manual)

| Partição | Walltime max | Hardware | GPU | Obs |
|---|---|---|---|---|
| `sequana_cpu` | 96h | CPU Cascade Lake | — | principal CPU |
| `sequana_cpu_dev` | 20min | CPU Cascade Lake | — | prioridade alta |
| `sequana_cpu_long` | 744h (31 dias) | CPU Cascade Lake | — | compartilha nós com `sequana_cpu` |
| `sequana_cpu_bigmem` | 96h | CPU BIGMEM (768GB) | — | |
| `sequana_cpu_bigmem_long` | 744h | CPU BIGMEM | — | |
| `sequana_gpu` | 96h | GPU Skylake | 4× V100/nó | compartilhado (até 4 jobs/nó) |
| `sequana_gpu_dev` | 20min | GPU Skylake | 4× V100 | prioridade alta |
| `sequana_gpu_long` | 744h | GPU Skylake | 4× V100 | |
| `gdl` | 48h | AI node | 8× V100-SXM2 NVLink | 1 nó único, deep learning |

Regras do manual que o simulador enforce:
- `--time=HH:MM:SS` obrigatório em todas, exceto `*_dev`.
- `--exclusive` proibido nas partições compartilhadas (`sequana_cpu`, `sequana_cpu_long`, `sequana_gpu*`).
- Partições `*_dev` têm prioridade maior.
- GPU requests no estilo `--gpus=N` / `--gpus-per-node=N` / `--cpus-per-gpu=N` / `--mem-per-gpu=N` (estilo LNCC; `--gres=gpu:N` também aceito mas não preferido).
- Cap global: **100 jobs simultâneos por projeto** cluster-wide (running + pending).
- UA costs: 1 UA/core-hora CPU, 100 UAs/GPU-hora.

### 5.4 Filesystem simulado

Estrutura real do v1 (diferente do modelo inicial que eu assumi):

```
/prj/<PROJETO>/<login.name>/    ← $HOME
    ↓ NFS DellEMC Isilon, 650 TB total
    ↓ Visível APENAS nos login nodes
    ↓ Sem backup
    ↓ Onde você edita/compila código, guarda resultados

/scratch/<PROJETO>/<login.name>/  ← $SCRATCH
    ↓ Lustre CRAY/HPE ClusterStor L300, 1.1 PB total
    ↓ Visível em todos os nós (login + compute)
    ↓ Sem backup
    ↓ Purga automática de arquivos não-tocados há 60 dias
    ↓ Onde o job roda de verdade
```

Para o projeto palm vein do usuário, o simulador usa `<PROJETO> = palmvein` e `<login.name> = unseen`. Paths resultantes: `/prj/palmvein/unseen` e `/scratch/palmvein/unseen`.

Quotas: o manual não publica números fixos (depende de tier Standard/Premium/Ambassador/Educational). O simulador mostra valores ilustrativos configuráveis (ex: `/prj` 100 GB, `/scratch` 2 TB para o projeto fictício) e um tooltip explicando que quotas reais são negociadas com o LNCC.

### 5.5 Usuários fictícios (outros projetos no cluster)

Inspirados em workloads reais do LNCC (mencionados no manual, nos scripts de exemplo, e em snippets do curso):

| Login | Projeto/afiliação | Partição | Recurso | Código fictício |
|---|---|---|---|---|
| `slima` | Dinâmica molecular de proteínas (LNCC) | `sequana_cpu` | 8 nós CPU | GROMACS |
| `rmartins` | Fine-tuning de LLM (UFRJ) | `gdl` | 8× V100 NVLink | PyTorch + DeepSpeed |
| `bioinfo01` | Genômica de arboviroses (FioCruz) | `sequana_cpu_bigmem` | 4 nós BIGMEM | STAR + DESeq2 |
| `cfdteam` | CFD oceânico (INPE) | `sequana_cpu_long` | 16 nós CPU (240h) | OpenFOAM |
| `astrolab` | Cosmologia N-corpos (ON) | `sequana_gpu` | 1 nó, 4× V100 | GADGET-4 |
| `hemodin` | Hemodinâmica computacional (LNCC) | `sequana_cpu` | 4 nós CPU | FEniCS |
| **`unseen`** | **Palm vein biometrics (você)** | **`gdl`** | **1 nó, 8× V100** | **PyTorch** |

A lista é configurável em `data/initial-users.js`. O simulador ciclicamente submete, roda e termina jobs desses usuários para dar vida ao cluster.

### 5.6 Tick loop do cluster

Um timer JavaScript avança o estado do cluster a cada 2 segundos (ajustável com botão "⏩ Acelerar 10×"):

1. Incrementa `elapsed` de todos os jobs em estado `R`.
2. Move jobs `R` para `CG` → `CD` quando `elapsed >= walltimeRequested` ou quando o script sintético termina.
3. Libera recursos dos nós quando jobs completam.
4. Avalia fila de `PD` e promove para `R` o job de maior prioridade que couber nos recursos disponíveis.
5. Ocasionalmente submete um job novo de um usuário fictício aleatório (para dar movimento).
6. Aplica flutuações de prioridade baseadas em fairshare simulado.

Estados de job: `PD`, `R`, `CG`, `CD`, `F`, `TO`, `CA`, `NF` (todos os códigos reais do manual).

Razões de pendência: `Resources`, `Priority`, `QOSMinGRES`, `PartitionTimeLimit`, `AssociationJobLimit`, `Dependency`, `BeginTime`.

## 6. Motor do narrador e estrutura do tour

### 6.1 Estrutura de um passo do tour

Cada passo é um objeto declarativo em `data/tour.js`:

```js
{
  id: "2.3-ssh-login",
  etapa: 2,                    // qual das 9 etapas
  subpasso: 3,                 // ordinal dentro da etapa
  titulo: "Conectando no SDumont",
  narracao: "<html>...",       // texto didático, com <term> inline
  destaque: "#terminal",       // seletor CSS para halo/seta
  esperaComando: /^ssh /,      // regex que libera o "Próximo"
  autoExecutar: null,          // ou comando auto-digitado
  efeitoCluster: fn,           // ou função que altera estado
  glossario: ["SSH", "VPN"],   // termos ativados neste passo
  narrador: "unlocked"         // controla visibilidade do botão Próximo
}
```

### 6.2 As 9 etapas do tour

**Etapa 0 — SDumont vs SDumont 2nd** (nova, crítica para a reunião do usuário)
- Timeline visual: Base (2015, descomissionado em 2025), **Expansão (2019, usado pelo usuário)**, 2nd (2024).
- Tabela de contraste lado-a-lado.
- Três frases-guardião que se repetem ao longo do tour.

**Etapa 1 — Conceitos e arquitetura do v1**
- O que é HPC (High Performance Computing — computação de alto desempenho), o que é cluster, nó, partição, fairshare, UA.
- **Abre com a imagem física:** o SDumont mora dentro de dois contêineres marítimos portáteis, refrigerados por um loop de glicol (líquido), conectados por um corredor. Não é um rack numa sala — é um data center em container ("pega e pluga em qualquer lugar com energia e água").
- Bull Sequana X1120, V100, Cascade Lake, InfiniBand EDR — explicados do zero, cada termo.
- **Os 48 cores por nó são 2 sockets × 24 cores** — detalhe que só o Roberto menciona (não está na wiki). Relevante depois quando explicar `--cpus-per-task`.
- 377 nós: quantos de cada tipo (CPU, BIGMEM, GPU, GDL), onde moram.
- Por que o cluster é "compartilhado" e não "seu" — a ideia de fairshare vem daqui.
- **Por que arquiteturas heterogêneas:** o LNCC prioriza atender muitos projetos diferentes, então compra hardware variado — isso explica por que não tem um "benchmark único" do SDumont.

**Etapa 2 — Acesso (VPN + SSH)**
- **Abre com analogia:** VPN é o "crachá" que te deixa entrar na rede interna do LNCC. Sem VPN, você nem consegue ver que o SDumont existe.
- O que é VPN (Virtual Private Network — rede privada virtual). Exemplo de cliente real usado pelo curso: Sophos (transcrito como "Sofos" pelo instrutor). Não precisa ser Sophos — qualquer cliente VPN configurado pelo LNCC funciona.
- O que é SSH (Secure Shell — acesso remoto criptografado). Como uma "porta de entrada".
- **Cena dramatizada (tirada do curso):** o simulador reproduz o momento em que a VPN cai silenciosamente e o SSH fica travado sem erro claro. O narrador explica: *"Opa, travou. Isso acontece quando a VPN desconectou e você nem percebeu. Vamos reconectar o cliente VPN primeiro, depois tentar o SSH de novo."* Ensina o aluno a reconhecer o sintoma.
- Login nodes: `sdumont15`, `sdumont16`, `sdumont17`, `sdumont18`. A wiki diz 4 nós; a demo ao vivo do curso só mostrou 2 respondendo (17 e 18) — o simulador menciona a discrepância como um "vale confirmar na reunião".
- Comando típico (usado pelo instrutor): `ssh <usuario>@login.sdumont.lncc.br` — esse fqdn aparece no curso mas NÃO está explícito na wiki v1. O simulador usa ele com nota "confirmar na reunião".
- **Observação honesta:** cada vez que você faz SSH, pode cair num login node diferente (não é determinístico). Seu histórico de shell pode divergir entre sessões.
- A regra de 30 minutos: login nodes matam automaticamente qualquer processo do usuário que passe de 30 min de CPU. **Por quê?** Porque login node é pra preparar coisas, não pra rodar treino.
- O que acontece se você roda workload no login node (cenário didático): mostra o aviso do sistema e o processo sendo morto.

**Etapa 3 — Transferência de dados e a pegadinha /prj vs /scratch**
- **Abre pelo problema prático:** seu dataset de imagens palm vein (centenas de MB ou GB) está no seu computador local. Como fazer ele chegar no SDumont? E depois de chegar, onde **exatamente** ele deve morar?
- **Duas áreas de armazenamento, com finalidades diferentes:**
  - **`/prj/<PROJETO>/<login>`** (`$HOME`) — NFS DellEMC Isilon, 650 TB. Menos rápida, mas é onde você **guarda coisas que quer preservar**: código-fonte, scripts, resultados finais. **Só visível nos login nodes.** Pensa nela como "armário de arquivo morto".
  - **`/scratch/<PROJETO>/<login>`** (`$SCRATCH`) — Lustre ClusterStor L300, 1.1 PB. Muito rápida, desenhada pra throughput massivo. **Visível em todos os nós** (login + compute). Pensa nela como "bancada de trabalho": seu job trabalha aqui.
- **A "pegadinha" principal do curso** (o instrutor volta nisso várias vezes): `/prj` NÃO É VISÍVEL dentro do job! Se você deixar o dataset em `/prj/palmvein/unseen/dataset/`, quando o SLURM mandar seu job pra um compute node, o compute node não vai enxergar esse caminho e o job vai falhar com `No such file or directory`. **Solução:** copiar/mover tudo o que o job precisa pra `/scratch` antes de submeter.
- **Fluxo canônico (ensinado pelo manual):** (1) edita código em `/prj`, (2) copia código + dataset + input pra `/scratch`, (3) `sbatch` apontando pra `/scratch`, (4) depois que termina, copia resultados que quer preservar de volta pra `/prj` (ou pra fora do cluster).
- **Comandos para subir dados do seu computador local pro SDumont:**
  - `scp dataset.tar.gz unseen@sdumont15:/scratch/palmvein/unseen/` — simples, lento para arquivos grandes
  - `rsync -avz --progress dataset/ unseen@sdumont15:/scratch/palmvein/unseen/dataset/` — mais rápido, resume em caso de falha, recomendado pra dataset grande
- **Dois avisos críticos — lembra que não é backup:**
  - **Nada em `/prj` ou `/scratch` tem backup no LNCC.** Se você apagar por acidente, não tem como recuperar. Responsabilidade é 100% sua.
  - **`/scratch` apaga automaticamente** arquivos não tocados há mais de 60 dias. Se você sair de férias deixando checkpoint importante lá, volta e o arquivo sumiu. Mova pra `/prj` ou pra fora antes.
- **Cenário didático interativo:** o simulador pede pra você tentar rodar um job que referencia um arquivo em `/prj` a partir de um compute node. O job falha com erro claro. Aí o narrador explica a pegadinha e mostra a correção: copia tudo pra `/scratch` e resubmete.

**Etapa 4 — Ambiente (Environment Modules + conda)**
- **Analogia para começar:** num cluster compartilhado, você não pode instalar software como faria no seu computador (`apt install`). O LNCC já instalou um monte de software — você só "acende" o que precisa via `module load`. Um módulo é só um conjunto de variáveis de ambiente (PATH, LD_LIBRARY_PATH) que apontam pra instalação certa.
- Comandos: `module avail` (lista tudo), `module whatis <nome>` (descreve), `module load <nome>/<versão>` (acende), `module list` (mostra ativos), `module unload <nome>` (apaga).
- **Importante:** no SDumont v1, `module purge` e `module spider` NÃO existem. Só estão no SDumont 2nd. Se tentar, dá erro.
- Módulos reais usados no curso: `cuda/11.2_sequana`, `anaconda3/2024.02_sequana`, `openmpi/gnu/4.1.1_sequana`, `intel-oneapi/2025.0_sequana`.
- **Decomposição do nome do módulo** (importante para leigo): `openmpi/gnu/4.1.4_sequana` = software OpenMPI + compilado com GCC + versão 4.1.4 + sufixo `_sequana` significa "compilado especificamente para esse cluster". Se você carregar um módulo do tipo errado, pode crashar por incompatibilidade.
- Por que NÃO existe `module load pytorch` no v1 — ML vai em conda env (Anaconda). Não é limitação, é escolha: o usuário controla as versões do PyTorch/TensorFlow dele.
- Criar conda env dentro do `$SCRATCH` (regra do manual): `module load anaconda3/2024.02_sequana` → `conda create --prefix $SCRATCH/envs/palmvein python=3.11` → `conda activate $SCRATCH/envs/palmvein` → `pip install torch torchvision`.
- **A regra crítica (o curso bate nisso 3 vezes):** quando você for submeter seu job com `sbatch`, o conda env NÃO pode estar ativo no seu shell do login node. O `module load` e o `conda activate` vão dentro do job script, não fora. Senão dá conflito de ambiente.
- **Alternativa:** Singularity (containers). `singularity pull docker://nvcr.io/nvidia/pytorch:24.12-py3` baixa uma imagem Docker do NVIDIA NGC e roda ela num ambiente isolado. Útil quando conda dá dor de cabeça.

**Etapa 5 — Submissão SLURM (sbatch)**
- **Começar pelo conceito de "batch":** o narrador explica do zero — "batch" significa "um monte de coisas feitas uma depois da outra, sem parar pra perguntar nada". Daí vem o nome `sbatch` = Slurm batch.
- O que é SLURM (Simple Linux Utility for Resource Management — sistema para gerenciar recursos de clusters Linux). Em português simples: é o "gerente" que decide quando e onde seu job vai rodar.
- Anatomia de um job script (no SDumont a convenção é extensão `.srm`, não `.slurm` nem `.sh`): começa com `#!/bin/bash`, depois linhas `#SBATCH ...` que pedem recursos, depois os comandos shell que vão executar.
- **Decomposição do `train_palmvein.srm`** (linha por linha, em plain português):
  - `#SBATCH -p gdl` — "use a partição chamada gdl, que é a dedicada a deep learning"
  - `#SBATCH --nodes=1` — "quero 1 nó"
  - `#SBATCH --gpus=8` — "quero 8 GPUs"
  - `#SBATCH --cpus-per-gpu=5` — "quero 5 cores de CPU por GPU (total 40)"
  - `#SBATCH --time=08:00:00` — "estimo que vai levar 8 horas"
  - etc.
- `nodeset -e $SLURM_JOB_NODELIST` — explica o que faz (expande `sdumont[6000-6003]` para `sdumont6000 sdumont6001 sdumont6002 sdumont6003`). É boilerplate que aparece em todo script do manual.
- **Cena dramatizada (do curso):** o instrutor Roberto demonstra ao vivo: submete um job com `srun -N 1 --ntasks 6 --cpus-per-task 1` e vê que o SLURM coloca 5 tarefas no primeiro nó e 1 no segundo (distribuição "BLOCK" = padrão). Um aluno pergunta por que, ele explica, refaz com `--ntasks-per-node 3` e corrige. **O simulador replica essa cena** como subtarefa opcional — ensina que o SLURM tem um default que pode surpreender.
- **Detalhe do socket topology:** os 48 cores por nó são 2 sockets físicos × 24 cores. Se você pede `--cpus-per-task=16`, o SLURM pode alocar cores que cruzam os 2 sockets, o que degrada performance por causa de tráfego L3. O simulador menciona isso como dica avançada (não obrigatória para leigo, mas bom de saber).
- Submissão com `sbatch train_palmvein.srm` → retorna `Submitted batch job 12903`.
- **Gotcha 1:** esquecer `--time` → `error: Job submit/allocate failed: Requested time limit is invalid (missing or exceeds some limit)` — narrador explica por que o SLURM exige walltime (pra fazer backfill, ver etapa 8).
- **Gotcha 2:** esquecer `--gpus` em partição GPU → job vira PD com razão `QOSMinGRES` — narrador explica o que é esse código.
- **Gotcha 3:** pedir mais GPUs do que a partição tem (`--gpus=20` no `gdl` que só tem 8) → `Requested node configuration is not available`.

**Etapa 6 — Monitoramento (squeue, sacct, sinfo)**
- **Abre pela pergunta do aluno:** "submeti o job, e agora?". Você quer saber: ele tá na fila? Rodando? Acabou? Quebrou?
- `squeue --me` — seus jobs. Explica cada coluna (JOBID, PARTITION, NAME, USER, ST, TIME, NODES, NODELIST). Os estados ST: `PD` = pending (esperando na fila), `R` = running, `CG` = completing (finalizando), `CD` = completed (deu certo), `F` = failed (falhou), `TO` = timeout (passou do walltime).
- `squeue --start` — estimativa de quando seu job vai começar a rodar.
- `sinfo` — estado das partições. Ensina o formato `CPUS(A/I/O/T)` — Allocated / Idle / Other / Total. Mostra ao vivo no dashboard.
- `sinfo -p gdl` — filtra por partição.
- `scontrol show jobid <ID>` — informações detalhadas: quantos nós alocados, quantos cores, quais são, razão se estiver pending.
- `sacct -lj <ID>` — histórico do job depois que ele terminou (gasto de CPU, memória, walltime real).
- `sprio -l` — mostra os fatores de prioridade do seu job.
- **Razões de pending explicadas em português simples:**
  - `Resources` — não tem hardware disponível ainda
  - `Priority` — outros jobs estão na frente na ordem de prioridade
  - `QOSMinGRES` — você esqueceu de pedir GPU numa partição GPU
  - `PartitionTimeLimit` — seu `--time` passa do máximo da partição
  - `AssociationJobLimit` — seu projeto já bateu o limite de 100 jobs simultâneos
- **Cena dramatizada (do curso):** o instrutor Roberto mostra um truque avançado — **mudar a partição de um job que já está pendente** com `scontrol update JobId=<ID> Partition=sequana_cpu_dev`. Serve pra "resgatar" um job preso numa fila cheia movendo ele pra fila de dev. O simulador replica isso como cena opcional na etapa 6.
- **Identidade do processo:** o instrutor Bidu faz outra demo útil — roda um `sleep 300 &` em background, olha no `top`, copia o PID, mata com `kill -9 <PID>`. Ensina que "job" e "processo" são coisas parecidas mas não iguais. O simulador inclui essa cena como opcional.
- `scancel <JOBID>` — cancela seu job. Só funciona em jobs seus. O simulador demonstra cancelando um job ainda rodando para mostrar o estado mudar de `R` → `CA` (cancelled).

**Etapa 7 — Resultados e logs**
- **Abre pela pergunta natural:** "o job rodou — onde estão os resultados? Como eu vejo se deu certo?".
- **O arquivo de output do SLURM:** por padrão, cada job escreve em `slurm-<JOBID>.out` no diretório onde você deu `sbatch`. Se o seu `sbatch` foi em `/scratch/palmvein/unseen/`, o arquivo vai aparecer lá como `slurm-12903.out`. O `#SBATCH --output=slurm-%j.out` no job script controla esse nome (`%j` vira o JOBID).
- **Lendo o output:** `cat slurm-12903.out` despeja tudo no terminal. Pra ver só o final em tempo real, `tail -f slurm-12903.out` (mas o simulador só suporta `cat`, suficiente pro didático). No simulador, o narrador mostra o output sendo preenchido linha por linha conforme o treino avança: carregando módulos, inicializando modelo, loss da época 1, checkpoint salvo, loss da época 2…
- **Onde ficam os checkpoints do treino:** o `train.py` (fake) grava em `/scratch/palmvein/unseen/checkpoints/epoch_01.pt`, `epoch_02.pt`, etc. O narrador explica que a decisão de onde salvar é do próprio código Python — o SLURM não faz isso automaticamente.
- **`sacct -lj <ID>` depois que o job terminou:** mostra estatísticas reais — quanto tempo rodou, quanto de memória usou, estado final (`CD` completed vs `F` failed vs `TO` timeout). Útil pra saber se você pediu recursos demais ou de menos (e ajustar no próximo job).
- **Baixando resultado de volta pra máquina local:** de fora do cluster, depois de ligar a VPN: `scp unseen@sdumont15:/scratch/palmvein/unseen/checkpoints/best_model.pt ./`. Ou em lote: `rsync -avz unseen@sdumont15:/scratch/palmvein/unseen/checkpoints/ ./local_checkpoints/`.
- **Movendo resultado pra /prj pra preservar:** o scratch apaga em 60 dias, então antes de "terminar" o projeto você move checkpoints importantes pra `/prj/palmvein/unseen/results/` com `mv` ou `cp -r`. Essa é a hora de curar o que você quer guardar.
- **Cenário didático:** o narrador mostra o ciclo completo — job submetido, roda, gera `slurm-12903.out` + checkpoints, você inspeciona com `cat` e `sacct`, baixa o modelo final com `scp`, move os intermediários pra `/prj`. Esse é o "fim" de uma iteração de treino no cluster.

**Etapa 8 — Convivência multi-usuário e fairshare**
- **Abre pela realidade:** o SDumont tem **centenas de projetos** rodando ao mesmo tempo. Você não está sozinho. Entender como o cluster decide quem roda primeiro é essencial pra não ficar frustrado.
- Mostra a fila cheia: seu job entra como `PD` com razão `Resources`. Outros 4 jobs GPU estão na frente.
- `squeue --start` para ver estimativa de início do seu job.
- **Fórmula de prioridade em português simples:** `prioridade = Age + Fairshare + Partition + QOS`. Cada fator explicado:
  - **Age** — quanto tempo seu job já esperou. Cresce devagar, evita starvation (jobs que nunca rodam).
  - **Fairshare** — quanto seu projeto usou recentemente. Quanto mais você usou, mais baixa fica sua prioridade (pra outros terem vez). Quanto menos, mais alta.
  - **Partition** — cada partição tem um peso. `*_dev` tem peso alto (prioridade garantida pra testes rápidos).
  - **QOS** — Quality of Service. O default é `Normal`. Se seu projeto ficou sem UAs, cai pra `Low` (−5%).
- **Metáfora do backfill:** *"pensa no SLURM como um Tetris. Ele tenta preencher os espaços vazios com jobs pequenos e rápidos sem atrasar os jobs grandes que já estavam no fim da fila. Por isso pedir `--time` curto aumenta a chance do seu job ser encaixado."*
- **O cap de 100 jobs por projeto:** se você tentar submeter o job 101, razão `AssociationJobLimit`. O narrador explica por que esse cap existe (fairness entre projetos).
- **UAs (Unidades de Alocação) — o "dinheiro" do cluster:** 1 core-hora de CPU = 1 UA. 1 GPU-hora de V100 = 100 UAs. Um treino de 8h em 8 GPUs consome 8 × 8 × 100 = 6400 UAs. Quando você fica sem UA, cai pra QOS Low — continua rodando, só que com prioridade menor.
- Botão "⏩ Acelerar 10×" para ver a fila andando sem esperar de verdade.
- **Cenários interativos no dashboard:**
  - Job do `rmartins` (LLM em `gdl`) está ocupando as 8 V100 que você quer → seu job fica PD.
  - Quando o job do `rmartins` termina, as GPUs liberam, seu job pula de `PD` pra `R` — animação no dashboard.
  - Se você tenta submeter um segundo job igual → o primeiro segura o recurso, o segundo entra em `PD` com `Resources`.
- **A "pegadinha" do scratch sem backup:** o narrador encerra a etapa 8 lembrando que nada em `/scratch` tem backup, e arquivos sem modificação por 60 dias **são apagados automaticamente**. Se seu checkpoint é importante, copia pra `/prj` antes de ir embora.
- **Encerramento:** parabéns, você passou pelas 9 etapas. Desbloqueia **modo sandbox**.

### 6.3 Voz do narrador

**Princípio fundamental:** o narrador fala para alguém com **zero base em HPC, SLURM ou Linux-cluster**. A meta é clareza didática para leigo, não fidelidade a nenhum instrutor. A voz dos instrutores do curso (ver §6.4) é **fonte de inspiração de tom e padrões didáticos**, não um gabarito para imitar literalmente. Quando houver conflito entre "soa como o instrutor" e "fica claro para leigo", **sempre escolhe clareza**.

**Regras de tom:**

1. **Português brasileiro conversacional.** Usa "a gente" como pronome padrão ("a gente vai submeter o job"). "Você" quando dá instrução direta ("agora você digita..."). Evita "o usuário" (distante, impessoal).
2. **Check-ins amigáveis.** Termina blocos de explicação com "tá?", "tá bom?", "beleza?" ocasionalmente — uma vez por conceito, não por frase. Sensação de conversa, não de parágrafo de manual.
3. **Sem intimidação.** Nunca assume que o aluno "deveria saber". Nunca usa "obviamente", "basta", "é só". Ninguém tem obrigação de já conhecer nada aqui.
4. **Humor leve quando algo dá errado.** Falhas simuladas (VPN caída, esqueceu `--time`) viram "Opa, deu ruim aqui" em vez de traceback seco. Erros são oportunidade de aprender, não falha pessoal.

**Padrões didáticos obrigatórios (estes são PARA leigo, não contra):**

5. **Definir sigla na primeira aparição — sempre.** Padrão de três partes: `SIGLA` → o que significa em inglês → o que faz em português. Exemplo: *"SSH (Secure Shell) é um protocolo de acesso remoto — é como você entra no computador de outra pessoa pela rede, com criptografia."* Tag `<term title="...">SIGLA</term>` vira tooltip persistente depois.
6. **Descrever o comportamento antes de nomear a técnica.** Ex: primeiro explica "vamos dividir um arquivo grande em pedaços salvos em servidores diferentes pra acelerar leitura"; **depois** nomeia "isso se chama striping". Nunca o contrário.
7. **Explicar o "porquê" antes do "como".** Se uma regra existe (ex: `--time` obrigatório), o narrador primeiro conta por que ela existe (*"se o SLURM não soubesse quanto tempo seu job vai levar, ele não conseguiria encaixar outros jobs depois"*), e só depois mostra o comando.
8. **Decompor comandos em fragmentos.** Quando mostra `module load openmpi/gnu/4.1.4_sequana`, o narrador separa: *"`module load` = carregar. `openmpi` = o software. `gnu` = compilado com o GCC. `4.1.4` = versão. `_sequana` = compilado especificamente para esse cluster"*. Um fragmento por vez, não uma wall of text.
9. **Gotchas como histórias, não como regras.** Em vez de "não rode no login node", o narrador diz *"teve uma galera que tentou rodar o treino direto no login node, travou tudo por 30 minutos, aí o sistema matou automaticamente. Não faz isso — por quê? Porque..."*.
10. **Pace desacelera em 3 momentos críticos:** (a) definir escopo de uma partição (o que ela é, quem pode usar), (b) explicar quota/UA (custo real), (c) transição do job de pending para running (o aha-moment). Em outros momentos pode passar mais rápido.
11. **Admite incerteza.** Quando o simulador depende de um dado que a wiki não documenta (ex: fqdn real de login), o narrador fala isso: *"isso aqui eu coloquei baseado no que o instrutor mostrou no curso — na sua reunião de terça, vale confirmar com o time"*.
12. **Ancora em hardware físico.** Em vez de só falar abstrato, cita onde as coisas estão fisicamente: *"quando você dá `sbatch`, seu job vai pra uma blade física dentro de um contêiner — sim, o Santos Dumont é um data center dentro de um contêiner portátil, tipo um container de navio"*.

### 6.4 Fontes da voz (instrutores do curso)

Os transcripts do Módulo 1 do curso "Escola Santos Dumont 2026" (`research/site_unflat_2026/docs/quiz-sources/transcripts/sd*.txt`, consolidados em `research/narrator-voice.md`) contêm material de 4 instrutores:

- **Bruno** — tecnologista do LNCC, administrador do SDumont. Responsável pela parte de arquitetura, hardware e conceitos de SLURM. Fala pausado, explica o porquê das decisões de infraestrutura. Fonte principal para as etapas 0, 1 e 8.
- **Roberto** — tecnologista HPC do LNCC. Faz as demos ao vivo de SLURM. Fonte principal para as etapas 5 e 6.
- **André Carneiro** — co-administrador com o Bruno. Dono do conteúdo de Lustre/storage. Fonte para a etapa 3 (parte Lustre) e glossário avançado.
- **Prof. Eduardo "Bidu" Garcia** — 35+ anos no LNCC, ensina também a pós-graduação. Demo ao vivo de shell + VPN + SSH. É a voz mais memorável: confessional, autodepreciativo, conta histórias. Fonte principal para a etapa 2.

O narrador do simulador **NÃO é nenhum deles em particular**. É um personagem neutro que *aprendeu com eles* e reescreveu o conteúdo para um aluno iniciante que nunca chegou perto de HPC. Usa o tom informal + padrões didáticos deles, mas **sem copiar frases literais** e **sem manter jargão que só faz sentido para quem já conhece o ambiente**.

### 6.5 Barra de progresso (topo)

9 etapas numeradas (`0` a `8`) + ícone de sandbox:

```
[0] v1 vs 2nd → [1] Arq → [2] Acesso → [3] Dados → [4] Ambiente → 
[5] sbatch → [6] Monit → [7] Result → [8] Convivência → [🏖️ Sandbox]
```

- Etapas concluídas: verde com ✓, clicáveis (permite revisitar).
- Etapa atual: azul pulsando.
- Etapas futuras: cinza, não-clicáveis (força ordem didática).
- Sub-indicador "3/5" dentro de cada etapa mostrando posição nos sub-passos.
- Hover exibe tooltip com o que aquela etapa cobre.

### 6.6 Destaque visual

O elemento apontado por `destaque` (seletor CSS) recebe halo pulsante + seta animada apontando. Respeita `prefers-reduced-motion`: desativa pulso/seta, usa borda estática.

### 6.7 Persistência em localStorage

```js
{
  version: 1,
  tourStepId: "5.2-sbatch-primeira-submissao",
  etapasConcluidas: [0, 1, 2, 3, 4],
  clusterSnapshot: {...},       // estado para restaurar ao voltar
  sistemaArquivos: {...},       // árvore FS atual
  sandboxDesbloqueado: false,
  historicoTerminal: [...],
  glossarioVisto: ["SLURM","SSH","VPN","partition"],
  preferencias: { som: false, velocidadeTick: 1 }
}
```

Botão "🔁 Reiniciar tour" com confirmação limpa o storage. Migração de versão: se `version` estiver defasada, backup automático + reset.

## 7. Terminal simulado e comandos suportados

### 7.1 Parser

Tokenizer simples respeitando aspas e escapes. Dispatch por nome de comando. Cada comando é um módulo em `js/commands/*.js` que recebe `(args, state, output)` e retorna output string + side effects no state global.

Dois prompts distintos:
- `pedro@local:~$` — máquina local simulada (antes do SSH). `pedro` é só um placeholder para "você no seu computador"; o simulador pode tornar isso configurável.
- `unseen@sdumont15:~$` (ou `sdumont16`/`17`/`18` aleatório após SSH) — após SSH, no login node. O `~` expande para `/prj/palmvein/unseen` porque esse é o `$HOME` do usuário no v1.

### 7.2 Comandos suportados

**Shell básico**
- `ls`, `ls -la`, `ls <path>`
- `cd <path>` (com suporte a `cd ~`, `cd -`)
- `pwd`
- `cat <arquivo>`
- `mkdir <path>`
- `nano <arquivo>` / `vim <arquivo>` — abre modal de editor (textarea estilizada, syntax highlight básico para bash/python)
- `whoami`, `hostname`, `date`, `uptime`
- `clear`, `history`, `help`
- `exit`

**Transferência**
- `ssh unseen@sdumont15` (ou qualquer login node 15-18; faltando fqdn, usa nome do nó + banner indicando que o fqdn real vem da reunião)
- `scp <arquivo> unseen@sdumont15:<path>` — mostra barra de progresso fake
- `rsync -avz <src> unseen@sdumont15:<dst>`

**Environment Modules**
- `module avail` / `module avail <nome>`
- `module whatis <nome>`
- `module help <nome>`
- `module load <nome>/<versão>`
- `module list`
- `module unload <nome>`
- `module purge` retorna `ERROR: module purge is not supported on this system. Use 'module unload' instead.` (comportamento documentado do v1)

**SLURM**
- `sbatch <script>` — valida `#SBATCH`, cria job no estado do cluster, retorna `Submitted batch job <ID>`
- `squeue [params]`, `squeue --me`, `squeue -u <user>`, `squeue --start`
- `sinfo`, `sinfo -p <fila>`, `sinfo -N -p <fila>`, `sinfo -o "<format>"`
- `sacct -lj <ID>`, `sacct -S <data> -E <data> -X -A <projeto>`
- `sstat <ID>` (uso ao vivo para jobs running)
- `scontrol show jobid <ID>`, `scontrol show jobid <ID> -dd`
- `scancel <ID>` (só jobs do usuário)
- `salloc <params>` — aloca interativo, muda prompt; `exit` libera
- `srun <cmd>` — execução inline (uso didático, mostrando diferença para sbatch)
- `sprio -l`
- `sacctmgr list user $USER -s format=...`
- `sacctmgr list account <PROJETO> format=...`

**Lustre**
- `lfs quota -h -g <PROJETO> /scratch`
- `lfs quota -h -u <USER> /scratch`
- `lfs df`
- `lfs getstripe <path>` (nível avançado)
- `df -h /prj/<PROJETO>`

**Utilitários**
- `nvidia-smi` — só quando rodando num nó alocado; mostra GPUs V100 com uso fake
- `nodeset -e <expressão>` — expande `sdumont[6000-6003]` → hostnames
- `$ echo $SLURM_JOB_NODELIST` — variáveis de ambiente do SLURM dentro de job running
- `source activate <path>` / `conda activate <path>`
- `top` — visualização de processos na máquina atual (só funciona em login node ou shell interativo em compute node). Mostra processos fake do `unseen`, CPU/mem de uso.
- `kill -9 <PID>` — mata um processo local pelo PID. Usado na cena didática do Bidu (sleep em background → top → kill).
- `ps aux` — lista de processos, alternativa ao `top`.
- `sleep <N>` — dorme N segundos. Útil para demonstrar processos em background (`sleep 300 &`).

**Cenas avançadas de SLURM** (reproduzindo cenas do curso):
- `scontrol update JobId=<ID> Partition=<nova>` — move um job pendente para outra partição. Cena do Roberto (etapa 6).
- `srun --partition=sequana_cpu_dev -N 2 --ntasks 6 <cmd>` — interativo com distribuição desbalanceada. Cena do Roberto (etapa 5, antes da correção).
- `srun ... --ntasks-per-node 3 <cmd>` — versão corrigida. Cena do Roberto (etapa 5, depois da correção).

### 7.3 Autocomplete

Tab reconhece: nomes de comandos, paths do FS atual, nomes de módulos carregáveis, IDs de job em curso. Implementação simples com `prefix matching`.

### 7.4 Histórico

Setas ↑/↓ navegam pelo histórico. Persistido no `localStorage`.

### 7.5 Mensagens de erro autênticas

Reproduzidas **verbatim** do manual para ensinar o usuário a reconhecê-las:
- `error: Job submit/allocate failed: Requested time limit is invalid (missing or exceeds some limit)`
- `*** JOB <ID> ON sdumont1468 CANCELLED AT YYYY-MM-DDTHH:MM:SS DUE TO TIME LIMIT ***`
- `Invalid generic resource (gres) specification`
- `Requested node configuration is not available`
- `-bash: <cmd>: comando não encontrado`
- Reason codes: `QOSMinGRES`, `PartitionTimeLimit`, `AssociationJobLimit`, `AssociationResourceLimit`, `Resources`, `Priority`

## 8. Integração do projeto palm vein biometrics

### 8.1 Filesystem inicial do projeto

```
/prj/palmvein/unseen/                 ($HOME — só login nodes)
├── README.md                          (descrição do projeto)
├── code/
│   ├── train.py                       (fake, visível com cat)
│   ├── model.py                       (CNN siamese para matching)
│   ├── dataset.py                     (loader de imagens IR)
│   └── requirements.txt
├── train_palmvein.srm                 (job script, editável no nano)
└── envs_readme.md                     (como criar conda env no scratch)

/scratch/palmvein/unseen/              ($SCRATCH — todos os nós)
├── datasets/palm_vein/                (imagens IR fake)
├── envs/palmvein/                     (conda env placeholder)
├── checkpoints/                       (preenchido durante "treino")
└── runs/                              (tensorboard logs fake)
```

Conteúdo dos arquivos fake (visíveis via `cat`) tematizado em palm vein biometrics: CNN siamese, triplet loss, métricas EER/FAR/FRR, augmentação para imagens infravermelhas, split train/val/test. Não executa nada — só alimenta a sensação de estar lidando com o próprio código.

### 8.2 Job script padrão

`train_palmvein.srm`:

```bash
#!/bin/bash
#SBATCH --job-name=palmvein-train
#SBATCH -p gdl
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --gpus=8
#SBATCH --cpus-per-gpu=5
#SBATCH --time=08:00:00
#SBATCH --output=slurm-%j.out

echo $SLURM_JOB_NODELIST
nodeset -e $SLURM_JOB_NODELIST
cd $SLURM_SUBMIT_DIR

module load cuda/11.2_sequana
module load anaconda3/2024.02_sequana
source activate $SCRATCH/envs/palmvein

srun python code/train.py \
    --data $SCRATCH/datasets/palm_vein \
    --checkpoints $SCRATCH/checkpoints \
    --epochs 50 \
    --batch-size 128
```

Observações didáticas integradas no narrador:
- `-p gdl`: a partição canônica para deep learning no v1 (1 nó único, 8× V100 NVLink).
- `--gpus=8 --cpus-per-gpu=5`: estilo LNCC.
- `--time=08:00:00`: obrigatório, 48h é o limite do `gdl`.
- Sem `--mem`: defaults do `gdl` cobrem.
- `nodeset -e`: boilerplate do manual em todo script.
- Sem `--account`: v1 não exige (lembrete: no 2nd é obrigatório).
- `source activate` dentro do script (não fora).

### 8.3 Execução simulada

Quando o job entra em `R`, o simulador preenche progressivamente `slurm-<ID>.out`:

```
SLURM_JOB_NODELIST=sdumont2200
sdumont2200
Loading cuda/11.2_sequana... ok
Loading anaconda3/2024.02_sequana... ok
Activating conda env /scratch/palmvein/unseen/envs/palmvein... ok
[2026-04-14 15:12:03] Starting palmvein training
[2026-04-14 15:12:05] Device: 8x NVIDIA V100-SXM2-16GB (NVLink)
[2026-04-14 15:12:08] Dataset: 12484 train / 2140 val / 2141 test
[2026-04-14 15:12:11] Model: SiameseCNN (params: 8.3M)
[2026-04-14 15:12:14] Epoch  1/50  loss=1.237  triplet=0.82  EER=12.4%
[2026-04-14 15:14:22] Epoch  2/50  loss=0.891  triplet=0.71  EER=10.8%
...
[2026-04-14 15:43:55] Saved checkpoint: $SCRATCH/checkpoints/epoch_02.pt
...
```

O usuário pode `cat slurm-<ID>.out` a qualquer momento e ver o log crescer. `nvidia-smi` (se abrir shell interativo no nó) mostra 8 GPUs com ~92% de uso.

## 9. Card "SDumont Expansão (v1) vs SDumont 2nd"

Modal acessível pelo selo permanente no canto superior esquerdo. Tabela comparativa de 12 linhas:

| Aspecto | SDumont Expansão (v1) — seu | SDumont 2nd |
|---|---|---|
| Frame | Bull Sequana X1000/X1120 | Bull Sequana XH3000 |
| Ano | 2019 | 2024 |
| Pico (PFlops) | ~5.1 | ~25.0 |
| Nós computacionais | 377 | 180 |
| CPU | Intel Xeon Cascade/Skylake | AMD Genoa-X, Intel Sapphire Rapids, Grace ARM |
| GPU | 384× NVIDIA V100 | 248× H100 SXM + 144× GH200 + 36× MI300A |
| Interconnect | InfiniBand EDR 100 Gb/s | InfiniBand NDR 400 Gb/s |
| Partições | `sequana_cpu*`, `sequana_gpu*`, `gdl` | `lncc-h100`, `lncc-gh200`, `lncc-mi300a`, etc. |
| Walltime max (GPU) | 96h (48h no gdl) | 24h (capped) |
| $HOME | `/prj/<PROJETO>/<user>` (NFS, só login) | `$HOME == $SCRATCH` (Lustre) |
| $SCRATCH | `/scratch/<PROJETO>/<user>` (Lustre 1.1 PB) | `/scratch/<PROJETO>/<user>` (Lustre 3 PB) |
| Login node | `sdumont15-18` | `login.sdumont2nd.lncc.br` |
| Slurm | 23.11.1 | 24.05.3 |
| `--account=` | não exigido | obrigatório |
| Módulos | flat (`cuda/11.2_sequana`) | architecture-prefixed (`arch_gpu/current`) |

**Três frases-guardião** repetidas no topo do card:
1. "Se aparecer H100, GH200 ou MI300A, é o 2nd — não é você."
2. "Se aparecer `sequana_*` nas partições, é o v1 — é você."
3. "Seu `$HOME` mora dentro de `/prj`, não em `/home`."

Card aparece automaticamente na Etapa 0 e fica disponível a qualquer momento.

## 10. UX, estética e acessibilidade

### 10.1 Paleta (tema escuro)

- Fundo: `#0b0f14`
- Superfícies: `#151b23`
- Texto: `#e6edf3`
- Accent primário (verde cluster): `#3fb950`
- Accent secundário (azul links/termos): `#58a6ff`
- Estados de nó: `idle=#3fb950`, `mix=#d29922`, `alloc=#f85149`, `down=#6e7681`

Variáveis CSS para rebranding fácil ao integrar no site pessoal.

### 10.2 Acessibilidade

- Contraste WCAG AA.
- Navegação completa por teclado (tab, setas, enter).
- `aria-live` no terminal para leitores de tela.
- `prefers-reduced-motion` desativa halo pulsante, seta animada, barra de progresso animada.
- Textos do narrador com tamanho ajustável (A− / A / A+).

### 10.3 Atalhos de teclado

- `Enter` — executa comando no terminal
- `↑ / ↓` — histórico
- `Tab` — autocomplete
- `Esc` — fecha modais
- `→ / ←` — próximo/anterior no narrador (quando habilitado)
- `Ctrl+L` — clear no terminal
- `?` — abre ajuda

### 10.4 Cards fixos no canto superior direito

- 🟦 Selo v1 fixo à esquerda (abre card v1 vs 2nd)
- 📘 Glossário dropdown
- ❓ Ajuda (comandos, atalhos)
- 🔁 Reiniciar tour
- 🏖️ Sandbox (cinza até destravar)
- 🔇 Mute (som opcional, desligado por padrão)

### 10.5 Responsividade

- ≥1280 px: layout 3 painéis
- 768–1279 px: abas `[Narrador] [Dashboard] [Terminal]` com banner de aviso
- <768 px: aba única + aviso explícito "experiência otimizada para desktop"

## 11. Modo sandbox

Destravado após conclusão da Etapa 8. Muda o comportamento do simulador:

- Narrador vira painel de referência rápida (cheat sheet de comandos SLURM, módulos, paths).
- Estado do cluster continua vivo (tick loop rodando).
- Terminal aceita qualquer comando suportado sem restrições de `esperaComando`.
- Usuários fictícios continuam ciclando jobs.
- Usuário pode praticar livremente os comandos da reunião.
- Botão "Voltar ao tour" disponível.

## 12. Glossário e conteúdo didático

Glossário é um objeto em `js/glossario.js` contendo 30-40 termos:

- Cada entrada: `{ termo, definicaoCurta, definicaoLonga, fonte, etapaPrincipal }`
- `definicaoCurta`: 1 linha, usada em tooltip inline
- `definicaoLonga`: 2-3 parágrafos, aparece no dropdown
- `fonte`: de onde veio (manual, transcrição, slide do curso)
- `etapaPrincipal`: onde o termo foi introduzido primeiro

Termos obrigatórios (todos em português simples, sem jargão desnecessário):

**Arquitetura e hardware:**
SDumont, SDumont 2nd, Expansão, Base, HPC (High Performance Computing), cluster, nó (node), compute node, login node, partição, fila, Bull Sequana X1120, container data center, glicol (refrigeração), InfiniBand EDR, socket, CPU Cascade Lake, GPU, V100, H100 (para contraste), NVLink, GDL node, blade, rack, 2×24 socket topology.

**SLURM e jobs:**
SLURM, job, job script (arquivo `.srm`), sbatch, srun, salloc, squeue, sinfo, sacct, scancel, scontrol, sprio, sacctmgr, walltime (`--time`), tarefa (SLURM task = processo MPI), `--ntasks`, `--cpus-per-task`, `--gpus`, `--ntasks-per-node`, block vs cyclic distribution, backfill, fairshare, QOS, UA (Unidade de Alocação), prioridade, PD/R/CG/CD/F/TO/CA, reason codes (QOSMinGRES, Resources, Priority, PartitionTimeLimit, AssociationJobLimit), GRES (Generic Resource).

**Storage e ambiente:**
$HOME, $SCRATCH, `/prj`, `/scratch`, Isilon, Lustre, ClusterStor L300, NFS, stripe / striping, MDT, OST, OSS, módulo (Environment Modules), `module load/avail/list/unload/whatis`, suffix `_sequana` (cultura de instrutor), conda, Anaconda, Singularity, `.sif` image.

**Acesso:**
VPN, SSH, Sophos (Sofos), scp, rsync, `login.sdumont.lncc.br` (vem do curso, confirmar), `sdumont15-18`.

**Utilitários shell:**
PID, `top`, `kill`, shell script, `$SLURM_JOB_NODELIST`, `nodeset -e`.

Definições em português claro e direto, adaptadas de `research/narrator-voice.md` (transcrições do curso) e `research/findings.md` (manual oficial). **Nenhuma definição é cópia literal da voz do instrutor** — são reescritas do zero para um aluno leigo, mas mantendo o tom informal.

## 13. Deployment e publicação

Site estático puro. Três opções:

1. **Standalone:** pasta `simulador-sdumont/` publicada como subsite próprio (ex: `simulador.unflat.studio` ou `unflat.studio/simulador-sdumont`).
2. **Sub-rota do site principal:** copiar `index.html`, `style.css`, `js/`, `data/`, `content/`, `assets/` para `site_unflat_2026/public/simulador-sdumont/` (ou equivalente no build do site do usuário).
3. **GitHub Pages:** push em repositório separado, Pages ativado na raiz.

A pasta `research/` fica em `.gitignore` — não é publicada. O spec e o `findings.md` são commitados normalmente (são documentação do projeto, não research bruto de copyright).

`README.md` no root explica: o que é, como abrir local, como publicar, créditos ao LNCC pelo material de referência e ao curso "Escola Santos Dumont 2026".

## 14. Fora do escopo para v1

- Autenticação / multi-usuário real (cada visitante tem seu próprio localStorage, mas não há sync entre dispositivos).
- Sync na nuvem (pode vir em v2 com Supabase Auth + Postgres — mencionado no `docs/superpowers/specs/` como follow-up).
- Simulação de SDumont 2nd como alvo pedagógico (só aparece no card comparativo).
- Execução real de Python/PyTorch (tudo é output scriptado).
- Simulação fiel de tempos de fila baseada em cargas reais (é didática, não preditiva).
- Análise de código do usuário (o `train.py` é estático).
- Editor nano/vim com features avançadas (só textarea estilizada).
- Internacionalização (só pt-BR em v1).
- Acessibilidade completa WCAG AAA (mira AA em v1).
- Impressão / export de progresso para PDF.

## 15. Perguntas em aberto para a reunião de terça-feira

Coisas que o simulador não conseguiu confirmar sozinho e devem ser perguntadas ao time do LNCC. O simulador mostra essas perguntas num card dedicado (acessível pelo ❓ Ajuda) pra o usuário levar impressas.

1. **Fqdn de login confirmado?** O instrutor do curso usa `login.sdumont.lncc.br` ao vivo numa demo, mas a wiki v1 não documenta esse fqdn oficialmente — só menciona `sdumont[15-18]` como nomes dos nós. É o fqdn canônico ou apenas atalho interno?
2. **Quantos login nodes respondem de fato?** A wiki diz 4 (`sdumont15..18`). A demo ao vivo do Bidu só viu 2 respondendo (17 e 18). A diferença é transitória (nós em manutenção) ou permanente?
3. **Qual tier o projeto palm vein vai entrar?** (Standard/Premium/Ambassador/Educational — define quotas reais de `/prj` e `/scratch` e a prioridade base.)
4. **Qual é a sigla oficial do projeto?** (Define `/prj/<SIGLA>/unseen`, `/scratch/<SIGLA>/unseen`, e o `sacctmgr account` correspondente.)
5. **Usar `gdl` (8× V100 NVLink, 1 nó único) ou `sequana_gpu` (4× V100 por nó)?** GDL é o caminho canônico para DL segundo o manual, mas é um nó único — fila pode ser longa. Sequana_gpu tem 94 nós mas NVLink só entre as 4 GPUs do mesmo nó.
6. **Existe uma política específica de ML no v1 que não está na wiki pública?** Containers Singularity pré-baixados? Conda envs de referência? PyTorch "oficial" do LNCC?
7. **Como transferir o dataset para o cluster?** scp via login node funciona para tamanhos pequenos. Para dataset grande (>100GB) o LNCC recomenda DTN/Globus/algo mais rápido? A wiki v1 não documenta DTN próprio — só o do 2nd.
8. **UAs iniciais do projeto e período de renovação?** Quanto é "o suficiente" para um projeto de palm vein com N épocas × M GPUs?
9. **Jupyter Hub / Open OnDemand no v1?** O manual não menciona — o 2nd tem stub. Se existir, pode simplificar muito o workflow.
10. **Backup fora de `/prj` e `/scratch`?** Ambos sem backup explícito. Existe política interna (snapshots Isilon, Lustre HSM) ou a responsabilidade é 100% do usuário?

## 15.1 Contradições entre wiki e curso (resolver com o time do LNCC)

O simulador encontra algumas inconsistências entre o manual oficial e as demos ao vivo do curso. Não são erros necessariamente — podem ser refinamentos que só quem usa o cluster sabe. O usuário deve perguntar:

- **Socket topology:** os 48 cores por nó são 2×24 ou 1×48? A wiki só cita total de cores; o Roberto afirma que são 2 sockets de 24 cada. Isso afeta `--cpus-per-task`.
- **Default task distribution:** a wiki não documenta. O Roberto afirma que o default do SLURM no SDumont é BLOCK (fica desbalanceado entre nós se você não passar `--ntasks-per-node`). Confirmar.
- **Lustre client/server version mismatch:** o André menciona que o cliente é 2.15 e o servidor é 2.12 no v1 — significa que alguns flags `lfs setstripe` não funcionam. Qual é a lista de flags afetados?
- **Stripe count limit:** `lfs setstripe -c <N>` com N > 10 dá erro no v1 (10 é o número de OSTs). A wiki menciona 10 como máximo prático; confirmar se é hard limit ou só recomendação.
- **`module purge` e `module spider`:** ambos não estão documentados no manual v1 e não foram usados pelo instrutor. Eles existem mesmo ou são artefato do SDumont 2nd que veio junto no pacote Environment Modules?

## 16. Critérios de "pronto" para v1

- Todas as 9 etapas do tour navegáveis do início ao fim sem bugs.
- Todos os comandos listados em §7.2 implementados e produzindo output plausível.
- Estado do cluster evolui corretamente (jobs submetidos → running → completed, recursos liberados).
- Pelo menos 6 usuários fictícios ciclando jobs.
- Persistência em localStorage funcionando (reabrir a aba mantém estado).
- Card v1 vs 2nd completo e acessível.
- Narrador em português claro para leigo — aplica as regras de voz de §6.3 e os padrões didáticos (siglas definidas, comportamento antes do nome, porquê antes do como, comandos decompostos em fragmentos). Teste de aceitação: um aluno sem base em HPC consegue completar as 9 etapas sem consultar outra fonte.
- Todas as cenas dramatizadas mencionadas nas etapas funcionam: VPN reconnect → SSH retry (etapa 2), distribuição BLOCK → correção com `--ntasks-per-node` (etapa 5), scontrol update Partition (etapa 6), top + kill PID (etapa 6).
- Glossário com 30+ termos definidos, todos em português simples (definições reescritas do zero, não copiadas dos instrutores).
- Funciona no Chrome/Firefox/Edge desktop recentes.
- Layout colapsado usável em tablet.
- Publicável como subdiretório do site pessoal do usuário.
- README explicando como abrir e publicar.
- Card de "Perguntas para a reunião" (§15) acessível, imprimível.

## 17. Referências

**Dentro do projeto:**
- `research/findings.md` — extrato da wiki oficial SDumont v1 + contraste SDumont 2nd + blog NVIDIA + slides do curso. Autoritativo para hardware, partições, storage, SLURM, módulos.
- `research/narrator-voice.md` — extrato das 15 transcrições do Módulo 1 do curso ("Fundamentos HPC — Ambiente SDUMONT, SLURM e Shell"). Autoritativo para tom, padrões didáticos, cenas ao vivo, contradições com a wiki, e vocabulário dos 4 instrutores (Bruno, Roberto, André Carneiro, Prof. Eduardo "Bidu" Garcia).

**Fontes externas (clonadas em `research/`, não publicadas):**
- `research/manual-sdumont/` e `research/manual-sdumont-wiki/` — manual oficial do SDumont v1.
- `research/manual-sdumont2nd/` e `research/manual-sdumont2nd-wiki/` — manual oficial do SDumont 2nd (usado só para contraste no card v1 vs 2nd).
- `research/site_unflat_2026/docs/quiz-sources/transcripts/` — 15 arquivos `sd*.txt`, 110-185 KB cada, totalizando ~2 MB de transcrição automática em português do curso Escola Santos Dumont 2026.
- `research/site_unflat_2026/docs/quiz-sources/snippets/` — versão filtrada por keyword, útil para lookup rápido.

**Fontes externas não clonadas:**
- Blog NVIDIA Brasil ("Santos Dumont recebe ampliação 4× maior como primeiro passo do plano brasileiro de IA") — cuidado: este blog é **sobre o SDumont 2nd**, não o v1. Usado só para contextualizar a diferença geracional.
- Slides compartilhados pelo usuário ("Escola Santos Dumont - 26 de Janeiro de 2026") — 5 imagens: timeline, armazenamento v1, plataforma 2nd, login nodes 2nd, armazenamento 2nd. Usados para confirmar números de PFlops, layout de storage, e diferenças entre v1 e 2nd.

**Princípio guia sobre as fontes:** o spec trata `findings.md` como autoritativo para **fatos técnicos** (o que existe, como se chama, quanta quantidade). Trata `narrator-voice.md` como autoritativo para **voz, cenas e pedagogia**. Se houver conflito entre eles, o spec flagra a contradição em §15.1 para resolver na reunião.
