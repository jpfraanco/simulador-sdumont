# Simulador Educativo SDumont — Spec v2

**Data:** 2026-04-14
**Autor:** Pedro Cormann + Claude
**Status:** spec atualizado pós-reunião com equipe LNCC. Foco migra de v1 para **SDumont 2nd**.

---

## 0. Changelog vs spec v1

| Mudança | Motivo |
|---|---|
| **Foco muda de SDumont v1 para SDumont 2nd** | Reunião 14/abr confirmou que o projeto palm vein usará o 2nd |
| **Remover §15 "Perguntas para reunião"** | Reunião já aconteceu |
| **Custom tooltips nos nós do dashboard** | `title` genérico do browser é feio; tooltip estilizado com info rica |
| **Sistema de módulos (OpenMP, GPU/CUDA, MPI)** | Expandir simulador além de "operar o cluster" para "entender programação paralela" |
| **Multi-user selection** | Já implementado (João/Pedro/Gui/David) — documentar no spec |
| **Speed control (1×-50×)** | Já implementado — documentar |

---

## 1. Visão geral e objetivo (atualizado)

Simulador educativo interativo do **supercomputador Santos Dumont 2nd** (2024, Bull Sequana XH3000), rodando 100% no navegador como site estático. O simulador ensina:

1. **Módulo 1 — Fundamentos HPC:** como operar o SDumont 2nd (SSH, partições, SLURM, storage, submissão, monitoramento) — **JÁ IMPLEMENTADO para v1, precisa migrar dados para 2nd**
2. **Módulo 2 — OpenMP/Multicore:** paralelismo em CPU com memória compartilhada, diretivas, exemplos no SDumont
3. **Módulo 3 — GPU/CUDA:** programação de aceleradores, host/device, kernels, multi-GPU
4. **Módulo 4 — MPI/Distribuídos:** troca de mensagens entre nós, comunicação coletiva

Cada módulo é um **tour interativo independente** com narrador, passos com gating por comando, e código simulado.

---

## 2. Migração v1 → SDumont 2nd

### 2.1 O que muda no cluster simulado

| Aspecto | v1 (atual) | 2nd (target) |
|---|---|---|
| Frame | Bull Sequana X1000/X1120 | **Bull Sequana XH3000** |
| Nós computacionais | 377 (246 CPU + 36 BIGMEM + 94 GPU + 1 GDL) | **180** (60 CPU + 62 H100 + 36 GH200 + 18 MI300A + 4 Grace) |
| CPU | Intel Cascade/Skylake | **AMD Genoa-X 9684X** (192 cores/nó CPU), **Intel Sapphire Rapids** (H100), **Grace ARM** (GH200) |
| GPU | 384× V100 | **248× H100 SXM 80GB** + **144× GH200** + **36× MI300A APU** |
| Interconnect | InfiniBand EDR 100 Gb/s | **InfiniBand NDR 400 Gb/s** |
| Partições | sequana_cpu*, sequana_gpu*, gdl | **lncc-cpu_amd, lncc-h100, lncc-h100_shared, lncc-gh200, lncc-gh200_shared, lncc-mi300a, lncc-mi300a_shared, lncc-grace** + dev variants |
| Walltime max GPU | 96h (48h gdl) | **24h** (capped em todas GPU queues) |
| $HOME | /prj/<PROJETO>/<user> (NFS, login-only) | **$HOME == $SCRATCH** (ambos Lustre) |
| $SCRATCH | /scratch/<PROJETO>/<user> (Lustre 1.1 PB) | /scratch/<PROJETO>/<user> (**Lustre 3 PB**) |
| Login node | sdumont15-18 | **login.sdumont2nd.lncc.br** (sdumont2nd4-7) |
| Slurm | 23.11.1 | **24.05.3** |
| --account= | não exigido | **OBRIGATÓRIO em todo job** |
| Módulos | flat (cuda/11.2_sequana) | **arch-prefixed** (arch_gpu/current → module avail) |

### 2.2 Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `data/initial-cluster.js` | Reescrever: 180 nós, partições 2nd, hardware 2nd |
| `data/tour.js` | Atualizar todas as 9 etapas: nomes de partição, paths, comandos, números |
| `data/v1-vs-2nd.js` | Inverter perspectiva: agora o 2nd é "você", v1 é referência histórica |
| `data/initial-fs.js` | $HOME == $SCRATCH (Lustre), paths /scratch/<PROJETO>/<user> |
| `js/commands/ssh.js` | Login node: `login.sdumont2nd.lncc.br` → sdumont2nd4-7 |
| `js/commands/modules.js` | Arch-prefixed: `module load arch_gpu/current` primeiro, depois `module avail` |
| `js/commands/slurm.js` | `--account=<SIGLA>` obrigatório; walltime 24h cap em GPU queues |
| `js/glossario.js` | Atualizar termos: H100, GH200, MI300A, Grace, NDR, arch_gpu |
| `content/fake-files/train_palmvein_srm.txt` | Partição lncc-h100_shared, --account=palmvein |

### 2.3 O que NÃO muda

- Arquitetura do simulador (3 painéis, ES modules, localStorage)
- Sistema de narrador/progress/terminal/commands
- Multi-user (João/Pedro/Gui/David)
- Speed control
- Glossário inline + modais
- Highlight system

---

## 3. Custom tooltips nos nós do dashboard

### Problema
Os nós usam `title="..."` nativo do browser — tooltip genérico, sem estilização, desaparece rápido, sem formatação.

### Solução
Substituir por tooltip CSS custom:
- Div posicionada absoluta que aparece no hover
- Background escuro com borda accent, border-radius, sombra
- Conteúdo rico em HTML: nome do nó, estado, cores/GPUs/RAM usados, jobs rodando
- Transição suave (opacity + transform)
- Seta apontando pro nó

### Implementação
- Novo componente `js/ui/node-tooltip.js`
- Listener `mouseover`/`mouseout` no container `.nodegrid-root` (event delegation)
- Um único elemento tooltip reutilizado (não cria/destrói por nó)
- Position calculada pelo boundingRect do nó hovered

### Estilo proposto
```css
.node-tooltip {
    position: fixed;
    background: #151b23;
    border: 1px solid #58a6ff;
    border-radius: 8px;
    padding: 12px 16px;
    color: #e6edf3;
    font-size: 13px;
    max-width: 280px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.15s, transform 0.15s;
    z-index: 500;
}
.node-tooltip.visible {
    opacity: 1;
    transform: translateY(0);
}
```

---

## 4. Sistema de módulos (novo)

### 4.1 Arquitetura

Cada módulo é um **tour independente** com seus próprios ETAPAS e STEPS. O simulador detecta qual módulo está ativo e carrega o tour correspondente.

```
data/
  tour-sdumont.js      (módulo 1 — atual tour.js renomeado + migrado pro 2nd)
  tour-openmp.js        (módulo 2)
  tour-gpu.js           (módulo 3)
  tour-mpi.js           (módulo 4)
  modules-index.js      (registry: lista dos módulos disponíveis)
```

### 4.2 Fluxo do usuário

1. Tela de seleção de **usuário** (João/Pedro/Gui/David) — já existe
2. **NOVA** tela de seleção de **módulo** (com cards mostrando progresso por módulo)
3. Tour do módulo selecionado (narrador + terminal + dashboard)
4. Botão "Trocar módulo" no topo (volta pra seleção)

### 4.3 Estado per-user per-module

```javascript
const DEFAULT_STATE = {
    version: 2,
    activeModule: 'sdumont',
    modules: {
        sdumont: { tourStepId: '0.1-bem-vindo', etapaAtual: 0, etapasConcluidas: [], sandboxDesbloqueado: false },
        openmp:  { tourStepId: null, etapaAtual: 0, etapasConcluidas: [], sandboxDesbloqueado: false },
        gpu:     { tourStepId: null, etapaAtual: 0, etapasConcluidas: [], sandboxDesbloqueado: false },
        mpi:     { tourStepId: null, etapaAtual: 0, etapasConcluidas: [], sandboxDesbloqueado: false }
    },
    loadedModules: [],
    preferencias: { som: false, velocidadeTick: 1 }
};
```

### 4.4 Módulo 2: OpenMP/Multicore (próximo a implementar)

**Baseado em:** SD02I "Introdução ao OpenMP" (Profª Rafaela Brum, UERJ), 127 páginas.

**Etapas planejadas (~12 passos):**

| # | Etapa | Conteúdo | Interação terminal |
|---|---|---|---|
| 0 | Por que paralelismo? | Problema sequencial, gargalo de Von Neumann, speedup | Nenhuma |
| 1 | Modelos de memória | Compartilhada vs distribuída vs aceleradores. Onde OpenMP se encaixa. | Nenhuma |
| 2 | O que é OpenMP | API de diretivas, fork-join, SPMD | Nenhuma |
| 3 | Primeiro #pragma | `#pragma omp parallel` — código C mostrado + "compilação" simulada: `gcc -fopenmp hello.c -o hello` | `gcc -fopenmp hello.c -o hello` + `srun -c4 ./hello` |
| 4 | Parallel for | `#pragma omp parallel for` — loop dividido entre threads | `cat parallel_for.c` + compilar + rodar |
| 5 | Escopo de variáveis | `private`, `shared`, `firstprivate`, `reduction` — erro clássico de race condition | `cat race_bug.c` + rodar (output não-determinístico simulado) |
| 6 | Reduction | `#pragma omp parallel for reduction(+:sum)` — corrige o bug | Compilar + rodar versão corrigida |
| 7 | Sincronização | `critical`, `atomic`, `barrier` — proteger regiões críticas | Exemplo com `critical` |
| 8 | Scheduling | `schedule(static)`, `schedule(dynamic)` — balanceamento de carga | Comparar output com static vs dynamic |
| 9 | No SDumont | Como --cpus-per-task=16 se conecta com OMP_NUM_THREADS. Socket topology 2×24. Job script real. | `sbatch openmp_job.srm` + `squeue --me` |
| 10 | Speedup na prática | Tabela de speedup simulada (1-48 threads), lei de Amdahl, eficiência | `cat speedup_results.txt` |

**Arquivos fake pro módulo OpenMP:**
```
/prj/palmvein/unseen/openmp/
├── hello.c              (primeiro programa paralelo)
├── parallel_for.c       (loop paralelo)
├── race_bug.c           (bug clássico de race condition)
├── race_fixed.c         (versão corrigida com reduction)
├── scheduling.c         (static vs dynamic)
├── openmp_job.srm       (job script pro SDumont)
└── speedup_results.txt  (tabela de resultados)
```

### 4.5 Módulo 3: GPU/CUDA (futuro)

**Baseado em:** SD03 materiais (CUDA, ROCm, SYCL, OpenACC).

Etapas: host vs device, kernel launch, memory management, multi-GPU, PyTorch sob os panos, job no SDumont com --gpus.

### 4.6 Módulo 4: MPI/Distribuídos (futuro)

**Baseado em:** SD04 materiais (MPI, híbrido MPI+OpenMP).

Etapas: processos vs threads, send/recv, collective ops, ring topology, job multi-nó no SDumont com --nodes.

---

## 5. O que está implementado vs o que falta

### ✅ Implementado (estado atual no GitHub)

| Feature | Commit |
|---|---|
| HTML shell 3 painéis + CSS dark | 0762469 |
| Cluster 377 nós v1 + tick loop + 7 fictional users | 0762469 |
| Terminal ~25 comandos (fs, ssh, slurm, modules, utils) | 0762469 |
| Narrator 9 etapas / 35 passos | 59678ee |
| Progress stepper | 59678ee |
| Glossário 50 termos + inline hydration | 0e71a97 |
| Modal v1 vs 2nd (15 linhas) | 0e71a97 |
| Highlight system (halo) | 0e71a97 |
| Sandbox mode (cheatsheet) | 0e71a97 |
| 48 testes unitários | 0e71a97 |
| Multi-user (João/Pedro/Gui/David) per-user localStorage | ee1561c |
| Fonte narrador padronizada 17px | b59b87a |
| Correções factuais dos PDFs (GDL=sdumont4000, node ranges reais) | eb792aa |
| Speed control 1×-50× + rich tooltips em nós e queue | e7c4d7e |

### 🔴 A fazer (próximas sessões)

| Prioridade | Item | Estimativa |
|---|---|---|
| **P0** | Custom tooltips estilizados nos nós (substituir `title` nativo) | 1h |
| **P0** | Migrar cluster data de v1 → SDumont 2nd (partições, hardware, paths, login) | 3h |
| **P0** | Atualizar tour narration para SDumont 2nd | 3h |
| **P1** | Sistema de módulos (module selector, state per-module) | 2h |
| **P1** | Módulo 2: OpenMP (~12 passos com código simulado) | 4h |
| **P2** | Módulo 3: GPU/CUDA | 4h |
| **P2** | Módulo 4: MPI/Distribuídos | 4h |
| **P3** | Editor nano/vim modal | 1h |
| **P3** | Tab autocomplete no terminal | 1h |
| **P3** | Responsivo mobile (abas) | 1h |
| **P3** | README completo | 0.5h |

### ❌ Removido do spec

| Item | Motivo |
|---|---|
| §15 "Perguntas para reunião de terça" | Reunião já aconteceu |
| §15.1 "Contradições wiki vs curso" | Resolvido na reunião |
| Foco em v1 como cluster-alvo | Confirmado que usará 2nd |

---

## 6. Dados de referência do SDumont 2nd (pra implementação)

### 6.1 Partições (do manual oficial + slides SD01I)

| Partição | Hardware | Walltime max | Nós | GPUs/nó | --account obrigatório |
|---|---|---|---|---|---|
| lncc-cpu_amd | AMD Genoa-X 9684X (192c) | 72h | 60 | 0 | Sim |
| cpu_amd_dev | AMD Genoa-X | 20min | 4 | 0 | Sim |
| lncc-h100 | Intel Sapphire + 4× H100 SXM 80GB | 24h | 62 (exclusive) | 4 | Sim |
| lncc-h100_shared | idem | 24h | 62 (shared, até 4 jobs/nó) | 1-2 via GRES | Sim |
| lncc-gh200 | Grace ARM + 4× GH200 | 24h | 36 (exclusive) | 4 | Sim |
| lncc-gh200_shared | idem | 24h | 36 (shared) | 1-2 via GRES | Sim |
| lncc-mi300a | 2× MI300A APU | 24h | 18 (exclusive) | 2 | Sim |
| lncc-mi300a_shared | idem | 24h | 18 (shared) | 1 | Sim |
| lncc-grace | Grace-Grace ARM (CPU only) | 72h | 4 | 0 | Sim |
| h100_dev / gh200_dev / mi300a_dev | dev versions | 20min | 2 | varies | Sim |

### 6.2 Login nodes

- `login.sdumont2nd.lncc.br` (load balancer)
- sdumont2nd4 (146.134.176.5) — 2× AMD EPYC 9454, 386GB, 2× H100
- sdumont2nd5 (146.134.176.6) — 2× AMD EPYC 9454, 386GB, 2× H100
- sdumont2nd6 — 2× AMD EPYC 9454, 386GB, 2× L40S (Petrobras)
- sdumont2nd7 — idem (Petrobras)

### 6.3 Module system

Obrigatório carregar arch primeiro:
```bash
module load arch_gpu/current          # H100 (x86)
module load arch_gpu_sc/current       # GH200 (ARM)
module load arch_cpu_amd/current      # CPU AMD
module load arch_apu_amd/current      # MI300A
module load arch_arm/current          # Grace ARM
```
Depois: `module avail` mostra só o que é compatível com a arch carregada.

### 6.4 Job script típico pro palm vein no 2nd

```bash
#!/bin/bash
#SBATCH --job-name=palmvein-train
#SBATCH -p lncc-h100_shared
#SBATCH --account=palmvein
#SBATCH --nodes=1
#SBATCH --gpus=2
#SBATCH --cpus-per-gpu=24
#SBATCH --time=12:00:00
#SBATCH --output=slurm-%j.out

module load arch_gpu/current
module load anaconda3/2024.02
source activate $SCRATCH/envs/palmvein

srun torchrun --nproc_per_node=2 \
    code/train.py \
    --data $SCRATCH/datasets/palm_vein \
    --checkpoints $SCRATCH/checkpoints \
    --epochs 50
```

---

## 7. Como continuar o desenvolvimento em outro PC

### Puxar o projeto
```bash
git clone https://github.com/jpfraanco/simulador-sdumont.git
cd simulador-sdumont
```

### Rodar localmente
```bash
python -m http.server 8765
# Abre http://localhost:8765
```

### Estrutura do projeto
```
simulador-sdumont/
├── index.html                    (entry point, CSS inline + externo)
├── style.css                     (estilos com CSS vars)
├── data/
│   ├── initial-cluster.js        (377 nós v1 → MIGRAR PRA 180 nós 2nd)
│   ├── initial-fs.js             (FS com fake files palm vein)
│   ├── initial-users.js          (7 users fictícios)
│   ├── tour.js                   (35 passos em 9 etapas → MIGRAR PRA 2nd)
│   └── v1-vs-2nd.js              (tabela comparativa → INVERTER PERSPECTIVA)
├── js/
│   ├── main.js                   (boot: user selection → simulator)
│   ├── state.js                  (per-user localStorage)
│   ├── cluster.js                (SLURM lifecycle + tick loop)
│   ├── filesystem.js             (FS com visibility rules)
│   ├── terminal.js               (prompt, history, output)
│   ├── narrator.js               (tour engine)
│   ├── progress.js               (stepper)
│   ├── glossario.js              (50 termos + hydration)
│   ├── users.js                  (fictional users cycling)
│   ├── commands/                 (~25 comandos: fs, ssh, slurm, modules, utils)
│   └── ui/                       (dashboard, nodegrid, queueview, modals, highlight, sandbox)
├── tests/                        (48 testes: cluster, filesystem, commands)
├── tests.html                    (runner)
├── docs/superpowers/specs/       (este arquivo)
└── research/                     (.gitignore — materiais de referência)
```

### Ordem recomendada de implementação
1. **Custom tooltips** nos nós do dashboard (P0, 1h) — `js/ui/node-tooltip.js`
2. **Migrar cluster data** pra 2nd (P0, 3h) — `data/initial-cluster.js` reescrever
3. **Migrar tour narration** pra 2nd (P0, 3h) — `data/tour.js` atualizar textos
4. **Sistema de módulos** (P1, 2h) — refatorar state + main + narrator pra aceitar múltiplos tours
5. **Módulo OpenMP** (P1, 4h) — `data/tour-openmp.js` + fake files C

### CLAUDE.md para o próximo Claude

O projeto tem memórias salvas em `~/.claude/projects/C--Users-jpfra-Downloads-simulador-sdumont/memory/`:
- `user_profile.md` — quem é o Pedro, como colaborar
- `feedback_clarity_for_layman.md` — clareza pra leigo > fidelidade a instrutor
- `feedback_completeness_over_concision.md` — na dúvida, mais detalhe

Fontes de pesquisa em `research/`:
- `findings.md` — extrato autoritativo do manual oficial v1 e v2
- `narrator-voice.md` — voz dos instrutores do curso (Bruno, Roberto, André, Bidu)
- `manual-sdumont-wiki/` e `manual-sdumont2nd-wiki/` — wikis oficiais clonadas
- Materiais do curso em `C:\Users\jpfra\Downloads\materialESD-20260411T233913Z-3-001\materialESD\`
