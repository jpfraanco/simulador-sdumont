# CLAUDE.md — Context for Claude Code sessions

## Project summary

Simulador educativo interativo do supercomputador Santos Dumont (LNCC, Brasil). Static site (HTML/CSS/vanilla JS, zero deps). Teaches HPC from zero with narrated interactive tours, live cluster dashboard, and simulated SSH terminal.

## Current state (2026-04-14, commit 5983b60)

**Two working modules:**
- **Module 1 — Fundamentos HPC:** 9 etapas / 35 steps covering SDumont operation (SSH, SLURM, storage, submission, monitoring). Currently uses v1 data — needs migration to SDumont 2nd.
- **Module 2 — OpenMP / Multicore:** 9 etapas / 20 steps with interactive C code examples themed around palm vein biometrics. Covers: parallel for, race conditions, reduction, critical/atomic, job submission with --cpus-per-task, speedup & Amdahl's law.
- **Module 3 — GPU/CUDA:** planned, card shows "em breve"
- **Module 4 — MPI/Distribuídos:** planned, card shows "em breve"

**Infrastructure:**
- 377 simulated nodes with SLURM lifecycle, 2s tick loop, 7 fictional users cycling jobs
- ~30 terminal commands (ls, cd, cat, ssh, sbatch, squeue, sinfo, scancel, scontrol, module, nvidia-smi, gcc -fopenmp, ./executables, OMP_NUM_THREADS=N)
- 50-term glossary with inline hover tooltips in narrator text
- Multi-user selection (João, Pedro, Gui, David) with per-user localStorage progress
- Module selector screen (pick module → pick user → boot)
- Speed control (1×/5×/10×/25×/50×) in dashboard
- Modals: v1 vs 2nd comparison (15 rows), glossary browser
- Highlight system (pulsing halo on destaque elements)
- Sandbox mode (cheatsheet after tour completion)
- 48 unit tests passing (tests.html)

## Key decision: SDumont 2nd (not v1)

As of the April 14 meeting with the LNCC team, the palm vein project will use **SDumont 2nd** (2024, H100/GH200/MI300A), not v1. Module 1 data needs migration. See spec v2: `docs/superpowers/specs/2026-04-14-spec-v2-sdumont2nd.md`

## Next priorities (in order)

1. **P0:** Custom styled tooltips on dashboard nodes (replace browser native `title` with styled popup)
2. **P0:** Migrate Module 1 cluster data from v1 → SDumont 2nd (partitions, hardware, paths, login, --account mandatory)
3. **P0:** Update Module 1 tour narration for 2nd (all 35 steps reference v1 data)
4. **P1:** Module 3 — GPU/CUDA interactive tour (~15 steps, host/device, kernels, multi-GPU, PyTorch under the hood)
5. **P1:** Module 4 — MPI/Distribuídos interactive tour (~12 steps, send/recv, collectives, multi-node jobs)
6. **P2:** Editor nano/vim modal (command exists but not wired to UI)
7. **P2:** Tab autocomplete in terminal
8. **P2:** Responsive mobile layout (tab switcher)

## How to run

```bash
cd simulador-sdumont
python -m http.server 8765
# Open http://localhost:8765
```

**Important:** Browser may cache old JS modules aggressively. If modules don't load correctly after code changes, do Ctrl+Shift+R (hard refresh). For production (Hostinger), consider adding cache-control headers in .htaccess.

## Testing

Open `http://localhost:8765/tests.html` — 48 tests, all should pass.

## Git log (key commits)

```
5983b60 feat: module system + OpenMP interactive tour (20 steps)
06d456a docs: spec v2 (SDumont 2nd focus) + CLAUDE.md
e7c4d7e feat: speed control (1×-50×) + rich tooltips everywhere
eb792aa fix: correct facts from SD01I/II/III course PDFs
b59b87a fix: padronizar fonte narrador 17px
ee1561c feat: multi-user selection (João, Pedro, Gui, David)
0e71a97 feat: glossary, modals, highlight, sandbox, 48 tests
59678ee feat: narrator 9-etapa tour with 35 steps
0762469 feat: minimum viable simulator (21 files)
```

## User preferences

- **Language:** Brazilian Portuguese, conversational, for a complete HPC beginner
- **Clarity over fidelity:** Rewrite from scratch for beginners; expert sources are inspiration, not templates
- **Detail over concision:** When in doubt, include more context — user prefers absorbing extra info over missing a concept
- **Interactivity:** Every module should have terminal commands the user must type to advance (gating via esperaComando regex)
- **Palm vein intersection:** All code examples should use the user's palm vein biometrics project as the running example

## Architecture

```
simulador-sdumont/
├── index.html                     (entry + inline CSS for preview compat)
├── style.css                      (external CSS with vars)
├── data/
│   ├── modules-index.js           (registry: 4 modules with metadata)
│   ├── tour.js                    (Module 1: SDumont — 35 steps)
│   ├── tour-openmp.js             (Module 2: OpenMP — 20 steps)
│   ├── openmp-files.js            (fake C files for OpenMP module)
│   ├── initial-cluster.js         (377 nodes, 9 partitions)
│   ├── initial-fs.js              (simulated filesystem with fake palm vein project)
│   ├── initial-users.js           (7 fictional users)
│   └── v1-vs-2nd.js               (comparison table data)
├── js/
│   ├── main.js                    (boot: user select → module select → simulator)
│   ├── state.js                   (per-user localStorage, module tracking)
│   ├── cluster.js                 (SLURM lifecycle, tick loop, job scheduling)
│   ├── filesystem.js              (FS with /prj /scratch visibility rules)
│   ├── terminal.js                (prompt, history, output buffer)
│   ├── narrator.js                (tour engine — accepts dynamic tourData)
│   ├── progress.js                (stepper — accepts dynamic etapas)
│   ├── glossario.js               (50 terms + inline hydration)
│   ├── users.js                   (fictional user job cycling)
│   ├── commands/
│   │   ├── index.js               (dispatch registry)
│   │   ├── parser.js              (tokenizer)
│   │   ├── fs.js                  (ls, cd, pwd, cat, mkdir, echo, help...)
│   │   ├── ssh.js                 (ssh, scp, rsync)
│   │   ├── modules.js             (module avail/load/unload/spider)
│   │   ├── slurm.js               (sbatch, squeue, sinfo, sacct, scancel, scontrol, sprio, salloc)
│   │   ├── utils.js               (nvidia-smi, nodeset, df, lfs, top, kill)
│   │   └── compile.js             (gcc -fopenmp, ./executables, OMP_NUM_THREADS)
│   └── ui/
│       ├── dashboard.js           (nodegrid + queueview + speed control + tick)
│       ├── nodegrid.js            (377-node color grid with rich tooltips)
│       ├── queueview.js           (job queue table with state/reason tooltips)
│       ├── modals.js              (base modal system)
│       ├── v1-vs-2nd-modal.js     (comparison card)
│       ├── glossary-modal.js      (browseable glossary)
│       ├── highlight.js           (pulsing halo on elements)
│       └── sandbox.js             (cheatsheet view)
├── tests/                         (cluster, filesystem, commands — 48 tests)
├── tests.html                     (in-browser test runner)
├── docs/superpowers/specs/        (spec v1 + spec v2)
└── research/                      (.gitignore — cloned wikis, transcripts, findings)
```

## How to add a new module

1. Create `data/tour-<name>.js` with same structure as `tour-openmp.js` (ETAPAS + STEPS + helper functions)
2. If the module has fake files, create `data/<name>-files.js` and load them in `bootSimulator()` in main.js
3. If it needs new terminal commands, create `js/commands/<name>.js` with self-registering `register()` calls, and import it in main.js
4. Add entry in `data/modules-index.js` (remove `comingSoon: true`)
5. Add `import * as tour<Name> from '../data/tour-<name>.js'` in main.js and register in `TOUR_MODULES`

## Research materials (not in repo)

- `research/findings.md` — authoritative extract from official SDumont v1 and v2 wikis
- `research/narrator-voice.md` — didactic patterns from 4 course instructors (Bruno, Roberto, André, Bidu)
- `research/manual-sdumont-wiki/` and `research/manual-sdumont2nd-wiki/` — cloned official docs
- Course materials at local path: `C:\Users\jpfra\Downloads\materialESD-*/materialESD/` (PDFs of SD01I-SD05I)
- Course transcripts: `research/site_unflat_2026/docs/quiz-sources/transcripts/sd*.txt`
