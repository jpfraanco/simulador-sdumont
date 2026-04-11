// js/commands/modules.js
import { register } from './index.js';

const AVAILABLE_MODULES = [
    { name: 'gcc/4.9.3_sequana',                category: 'Compilers', whatis: 'GNU Compiler Collection 4.9.3' },
    { name: 'cuda/11.2_sequana',                category: 'GPU',       whatis: 'NVIDIA CUDA Toolkit 11.2' },
    { name: 'openmpi/gnu/4.1.1_sequana',        category: 'MPI',       whatis: 'OpenMPI 4.1.1 compiled with GCC' },
    { name: 'openmpi/gnu/4.1.4_sequana',        category: 'MPI',       whatis: 'OpenMPI 4.1.4 compiled with GCC' },
    { name: 'openmpi/gnu/4.1.2+cuda-11.2_sequana', category: 'MPI',    whatis: 'OpenMPI 4.1.2 with CUDA support' },
    { name: 'mpich/3.3.2',                      category: 'MPI',       whatis: 'MPICH 3.3.2' },
    { name: 'intel-oneapi/2025.0_sequana',      category: 'Compilers', whatis: 'Intel oneAPI 2025.0 — use icx/icpx/ifx' },
    { name: 'anaconda3/2024.02_sequana',        category: 'Python',    whatis: 'Anaconda Python 3 distribution' },
    { name: 'singularity/3.10',                 category: 'Container', whatis: 'Singularity container runtime' }
];

function findModule(name) { return AVAILABLE_MODULES.find(m => m.name === name); }

register({
    name: 'module',
    help: 'Gerenciador de módulos: avail, load, unload, list, whatis',
    run: (args, ctx) => {
        if (!ctx.state.loadedModules) ctx.state.loadedModules = [];
        const sub = args[0];
        if (!sub) throw new Error('usage: module <avail|load|unload|list|whatis>');

        if (sub === 'avail') {
            const filter = args[1];
            const byCat = new Map();
            for (const m of AVAILABLE_MODULES) {
                if (filter && !m.name.includes(filter)) continue;
                if (!byCat.has(m.category)) byCat.set(m.category, []);
                byCat.get(m.category).push(m.name);
            }
            const out = ['', '------------------ /opt/modules/sdumont ------------------'];
            for (const [cat, names] of byCat.entries()) {
                out.push('');
                out.push(`-- ${cat}`);
                out.push(names.join('  '));
            }
            out.push('');
            return out.join('\n');
        }

        if (sub === 'load') {
            const name = args[1];
            if (!findModule(name)) return { stdout: '', stderr: `module: ERROR: Module '${name}' not found`, exitCode: 1 };
            if (!ctx.state.loadedModules.includes(name)) ctx.state.loadedModules.push(name);
            return '';
        }

        if (sub === 'unload') {
            const name = args[1];
            ctx.state.loadedModules = ctx.state.loadedModules.filter(m => m !== name);
            return '';
        }

        if (sub === 'list') {
            if (ctx.state.loadedModules.length === 0) return 'No modules loaded\n';
            const out = ['', 'Currently Loaded Modulefiles:'];
            ctx.state.loadedModules.forEach((m, i) => out.push(`  ${i + 1}) ${m}`));
            out.push('');
            return out.join('\n');
        }

        if (sub === 'whatis') {
            const name = args[1];
            const mod = findModule(name);
            if (!mod) return { stdout: '', stderr: `module: ERROR: Module '${name}' not found`, exitCode: 1 };
            return `${mod.name}: ${mod.whatis}\n`;
        }

        if (sub === 'purge') {
            return { stdout: '', stderr: "module: ERROR: 'purge' is not supported on SDumont v1. Use 'module unload' instead.", exitCode: 1 };
        }

        if (sub === 'spider') {
            return { stdout: '', stderr: "module: ERROR: 'spider' is not supported on SDumont v1 (Lmod-only).", exitCode: 1 };
        }

        return { stdout: '', stderr: `module: ERROR: unknown subcommand '${sub}'`, exitCode: 1 };
    }
});
