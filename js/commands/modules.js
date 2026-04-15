// js/commands/modules.js
// SDumont 2nd module system: arch-prefixed. Must load arch first, then module avail.
import { register } from './index.js';

const ARCH_MODULES = [
    { name: 'arch_gpu/current',       category: 'Architecture', whatis: 'H100 (x86_64) — carrega módulos compatíveis com nós H100' },
    { name: 'arch_gpu_sc/current',    category: 'Architecture', whatis: 'GH200 (ARM) — carrega módulos compatíveis com nós GH200' },
    { name: 'arch_cpu_amd/current',   category: 'Architecture', whatis: 'CPU AMD Genoa-X — carrega módulos compatíveis com nós CPU' },
    { name: 'arch_apu_amd/current',   category: 'Architecture', whatis: 'MI300A APU — carrega módulos compatíveis com nós MI300A' },
    { name: 'arch_arm/current',       category: 'Architecture', whatis: 'Grace ARM (CPU only) — carrega módulos compatíveis com nós Grace' }
];

const SOFTWARE_MODULES = {
    'arch_gpu/current': [
        { name: 'gcc/13.2',           category: 'Compilers', whatis: 'GNU Compiler Collection 13.2 (x86)' },
        { name: 'gcc/14.1',           category: 'Compilers', whatis: 'GNU Compiler Collection 14.1 (x86)' },
        { name: 'cuda/12.4',          category: 'GPU',       whatis: 'NVIDIA CUDA Toolkit 12.4' },
        { name: 'cuda/12.6',          category: 'GPU',       whatis: 'NVIDIA CUDA Toolkit 12.6' },
        { name: 'cudnn/9.0-cuda12.4', category: 'GPU',       whatis: 'cuDNN 9.0 for CUDA 12.4' },
        { name: 'nccl/2.20-cuda12.4', category: 'GPU',       whatis: 'NCCL 2.20 for multi-GPU communication' },
        { name: 'openmpi/5.0.3',      category: 'MPI',       whatis: 'OpenMPI 5.0.3 with CUDA-aware support' },
        { name: 'anaconda3/2024.02',   category: 'Python',    whatis: 'Anaconda Python 3 distribution' },
        { name: 'pytorch/2.3.0',      category: 'AI/ML',     whatis: 'PyTorch 2.3.0 with CUDA 12.4' },
        { name: 'intel-oneapi/2025.0', category: 'Compilers', whatis: 'Intel oneAPI Base + HPC 2025.0' },
        { name: 'singularity/4.1',    category: 'Container', whatis: 'Singularity container runtime' }
    ],
    'arch_gpu_sc/current': [
        { name: 'gcc/13.2',           category: 'Compilers', whatis: 'GNU Compiler Collection 13.2 (ARM)' },
        { name: 'cuda/12.4',          category: 'GPU',       whatis: 'NVIDIA CUDA Toolkit 12.4 (ARM)' },
        { name: 'openmpi/5.0.3',      category: 'MPI',       whatis: 'OpenMPI 5.0.3 (ARM)' },
        { name: 'anaconda3/2024.02',   category: 'Python',    whatis: 'Anaconda Python 3 (ARM)' },
        { name: 'pytorch/2.3.0',      category: 'AI/ML',     whatis: 'PyTorch 2.3.0 (ARM + CUDA)' },
        { name: 'singularity/4.1',    category: 'Container', whatis: 'Singularity container runtime (ARM)' }
    ],
    'arch_cpu_amd/current': [
        { name: 'gcc/13.2',           category: 'Compilers', whatis: 'GNU Compiler Collection 13.2 (AMD)' },
        { name: 'gcc/14.1',           category: 'Compilers', whatis: 'GNU Compiler Collection 14.1 (AMD)' },
        { name: 'openmpi/5.0.3',      category: 'MPI',       whatis: 'OpenMPI 5.0.3' },
        { name: 'intel-oneapi/2025.0', category: 'Compilers', whatis: 'Intel oneAPI 2025.0' },
        { name: 'anaconda3/2024.02',   category: 'Python',    whatis: 'Anaconda Python 3' },
        { name: 'singularity/4.1',    category: 'Container', whatis: 'Singularity container runtime' }
    ],
    'arch_apu_amd/current': [
        { name: 'gcc/13.2',           category: 'Compilers', whatis: 'GNU Compiler Collection 13.2 (AMD)' },
        { name: 'rocm/6.0',           category: 'GPU',       whatis: 'AMD ROCm 6.0 for MI300A' },
        { name: 'openmpi/5.0.3',      category: 'MPI',       whatis: 'OpenMPI 5.0.3 (ROCm-aware)' },
        { name: 'anaconda3/2024.02',   category: 'Python',    whatis: 'Anaconda Python 3' },
        { name: 'pytorch/2.3.0',      category: 'AI/ML',     whatis: 'PyTorch 2.3.0 (ROCm)' },
        { name: 'singularity/4.1',    category: 'Container', whatis: 'Singularity container runtime' }
    ],
    'arch_arm/current': [
        { name: 'gcc/13.2',           category: 'Compilers', whatis: 'GNU Compiler Collection 13.2 (ARM)' },
        { name: 'openmpi/5.0.3',      category: 'MPI',       whatis: 'OpenMPI 5.0.3 (ARM)' },
        { name: 'anaconda3/2024.02',   category: 'Python',    whatis: 'Anaconda Python 3 (ARM)' },
        { name: 'singularity/4.1',    category: 'Container', whatis: 'Singularity container runtime (ARM)' }
    ]
};

function getLoadedArch(state) {
    return (state.loadedModules || []).find(m => m.startsWith('arch_'));
}

function getAvailableModules(state) {
    const arch = getLoadedArch(state);
    if (!arch) return ARCH_MODULES;
    return [...ARCH_MODULES, ...(SOFTWARE_MODULES[arch] || [])];
}

function findModule(name, state) {
    return getAvailableModules(state).find(m => m.name === name);
}

register({
    name: 'module',
    help: 'Gerenciador de módulos: avail, load, unload, list, whatis, spider, purge',
    run: (args, ctx) => {
        if (!ctx.state.loadedModules) ctx.state.loadedModules = [];
        const sub = args[0];
        if (!sub) throw new Error('usage: module <avail|load|unload|list|whatis|spider|purge>');

        if (sub === 'avail') {
            const filter = args[1];
            const arch = getLoadedArch(ctx.state);
            const modules = getAvailableModules(ctx.state);
            const byCat = new Map();
            for (const m of modules) {
                if (filter && !m.name.includes(filter)) continue;
                if (!byCat.has(m.category)) byCat.set(m.category, []);
                byCat.get(m.category).push(m.name);
            }
            const out = [];
            if (!arch) {
                out.push('');
                out.push('⚠  Nenhuma arquitetura carregada. Carregue primeiro:');
                out.push('   module load arch_gpu/current      # H100 (x86)');
                out.push('   module load arch_gpu_sc/current    # GH200 (ARM)');
                out.push('   module load arch_cpu_amd/current   # CPU AMD');
                out.push('');
                out.push('------------------ Architectures ------------------');
                out.push('');
                for (const a of ARCH_MODULES) out.push(`  ${a.name}`);
                out.push('');
            } else {
                out.push('', `---- /opt/modules/sdumont2nd [${arch}] ----`);
                for (const [cat, names] of byCat.entries()) {
                    out.push('', `-- ${cat}`);
                    out.push(names.join('  '));
                }
                out.push('');
            }
            return out.join('\n');
        }

        if (sub === 'load') {
            const name = args[1];
            if (!name) return { stdout: '', stderr: 'module: ERROR: Module name required', exitCode: 1 };
            // Check if it's an arch module
            const isArch = ARCH_MODULES.some(m => m.name === name);
            if (isArch) {
                // Unload any previous arch
                ctx.state.loadedModules = ctx.state.loadedModules.filter(m => !m.startsWith('arch_'));
                if (!ctx.state.loadedModules.includes(name)) ctx.state.loadedModules.push(name);
                return '';
            }
            // For software modules, must have arch loaded
            const arch = getLoadedArch(ctx.state);
            if (!arch) {
                return { stdout: '', stderr: `module: ERROR: Carregue uma arquitetura primeiro (ex: module load arch_gpu/current)`, exitCode: 1 };
            }
            const found = findModule(name, ctx.state);
            if (!found) return { stdout: '', stderr: `module: ERROR: Module '${name}' not found for arch '${arch}'`, exitCode: 1 };
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
            const mod = findModule(name, ctx.state);
            if (!mod) return { stdout: '', stderr: `module: ERROR: Module '${name}' not found`, exitCode: 1 };
            return `${mod.name}: ${mod.whatis}\n`;
        }

        if (sub === 'purge') {
            ctx.state.loadedModules = [];
            return '';
        }

        if (sub === 'spider') {
            const filter = args[1];
            const allModules = [...ARCH_MODULES];
            for (const mods of Object.values(SOFTWARE_MODULES)) {
                for (const m of mods) {
                    if (!allModules.some(e => e.name === m.name)) allModules.push(m);
                }
            }
            const matches = allModules.filter(m => filter ? m.name.match(new RegExp(filter, 'i')) : true);
            if (matches.length === 0) return `No module(s) or extension(s) found matching "${filter || '*'}"\n`;
            const out = ['', `The following modules match your search criteria: "${filter || '*'}"`, ''];
            for (const m of matches) out.push(`  ${m.name}: ${m.whatis}`);
            out.push('');
            return out.join('\n');
        }

        return { stdout: '', stderr: `module: ERROR: unknown subcommand '${sub}'`, exitCode: 1 };
    }
});
