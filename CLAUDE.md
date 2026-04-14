# CLAUDE.md — Context for Claude Code sessions

## Project summary

Simulador educativo interativo do supercomputador Santos Dumont (LNCC, Brasil). Static site (HTML/CSS/vanilla JS, zero deps). Teaches HPC from zero with a narrated tour, live cluster dashboard, and simulated SSH terminal.

## Current state (2026-04-14)

- **9-step tour** covering SDumont operation (v1 data — needs migration to 2nd)
- **377 simulated nodes** with SLURM lifecycle, tick loop, 7 fictional users
- **~25 terminal commands** (ls, cd, cat, ssh, sbatch, squeue, sinfo, scancel, scontrol, module, nvidia-smi, etc.)
- **50-term glossary** with inline tooltips
- **Multi-user** selection (João, Pedro, Gui, David) with per-user localStorage progress
- **Speed control** (1×/5×/10×/25×/50×) in dashboard
- **48 unit tests** passing (tests.html)
- **Modals:** v1 vs 2nd comparison, glossary browser

## Key decision: SDumont 2nd (not v1)

As of the April 14 meeting with the LNCC team, the palm vein project will use **SDumont 2nd** (2024, H100/GH200/MI300A), not v1. The current simulator data is for v1 and needs migration. See spec v2: `docs/superpowers/specs/2026-04-14-spec-v2-sdumont2nd.md`

## Next priorities (in order)

1. **P0:** Custom styled tooltips on dashboard nodes (replace browser `title`)
2. **P0:** Migrate cluster data from v1 → SDumont 2nd (partitions, hardware, paths, login)
3. **P0:** Update tour narration for 2nd
4. **P1:** Module system (OpenMP, GPU/CUDA, MPI as separate interactive tours)
5. **P1:** OpenMP module (~12 interactive steps with C code)

## How to run

```bash
python -m http.server 8765
# Open http://localhost:8765
```

## Testing

Open `http://localhost:8765/tests.html` — 48 tests, all should pass.

## User preferences (from memory files)

- **Language:** Brazilian Portuguese, conversational, for a complete HPC beginner
- **Clarity over fidelity:** Rewrite from scratch for beginners; expert sources are inspiration, not templates
- **Detail over concision:** When in doubt, include more context — user prefers absorbing extra info over missing concepts
- **Status updates:** Narrate what you're doing — user wants to follow along

## Research materials

- `research/findings.md` — authoritative extract from official SDumont wikis
- `research/narrator-voice.md` — didactic patterns from 4 course instructors
- `research/manual-sdumont-wiki/` and `research/manual-sdumont2nd-wiki/` — cloned official docs
- Course materials at local path (not in repo): `C:\Users\jpfra\Downloads\materialESD-*/materialESD/`

## Architecture notes

- ES modules throughout (requires HTTP server, not file://)
- Tour data in `data/tour.js` (ETAPAS + STEPS arrays, helper functions)
- Narrator in `js/narrator.js` (step rendering, navigation, command gating)
- Commands self-register via `js/commands/index.js` registry
- State persisted per-user in localStorage with versioned schema
- All CSS variables defined in `:root` in both style.css and inline in index.html
