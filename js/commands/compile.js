// js/commands/compile.js
// Simulated gcc compilation and execution of compiled binaries.
import { register } from './index.js';

// Registry of "compiled" executables and their fake output
const EXECUTABLES = new Map();

// Simulated compilation outputs
const COMPILE_OUTPUTS = {
    'hello.c': { exe: 'hello', output: (threads) => {
        const lines = [];
        const t = threads || 4;
        for (let i = 0; i < t; i++) lines.push(`Oi do thread ${i} de ${t}`);
        lines.sort(() => Math.random() - 0.5); // random order (parallel!)
        lines.push('Fim — voltou pra thread master.');
        return lines.join('\n') + '\n';
    }},
    'palm_preprocess.c': { exe: 'palm_preprocess', output: (threads) => {
        const t = threads || 4;
        const baseTime = 33.6;
        const speedup = Math.min(t * 0.88, t * 0.95 - (t > 16 ? t * 0.1 : 0));
        const time = (baseTime / speedup).toFixed(2);
        return `Processadas 16800 imagens em ${time}s com ${t} threads\nSpeedup estimado: ${speedup.toFixed(1)}x\n`;
    }},
    'race_bug.c': { exe: 'race_bug', output: () => {
        // Non-deterministic! Different each time
        const tp = 16667 - Math.floor(Math.random() * 3000);
        const fp = 33333 - Math.floor(Math.random() * 5000);
        return `True Positives:  ${tp}  (esperado: ~16667)\nFalse Positives: ${fp}  (esperado: ~33333)\nTotal matches:   ${tp + fp}  (esperado: 50000)\n`;
    }},
    'race_fixed.c': { exe: 'race_fixed', output: () => {
        // Deterministic!
        return `True Positives:  16667  (esperado: 16667)\nFalse Positives: 33333  (esperado: 33333)\nTotal matches:   50000  (esperado: 50000)\nResultado DETERMINISTICO — sempre o mesmo.\n`;
    }}
};

register({
    name: 'gcc',
    help: 'Compilador GNU C (simulado). Use: gcc -fopenmp arquivo.c -o saida',
    run: (args, ctx) => {
        const hasOpenMP = args.includes('-fopenmp');
        const srcIdx = args.findIndex(a => a.endsWith('.c'));
        const outIdx = args.indexOf('-o');
        if (srcIdx < 0) return { stderr: 'gcc: fatal error: no input files\ncompilation terminated.\n', exitCode: 1 };

        const srcFile = args[srcIdx];
        const srcName = srcFile.split('/').pop();
        const outName = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : 'a.out';

        // Check if source exists in filesystem
        try {
            ctx.filesystem.cat(srcFile);
        } catch (e) {
            return { stderr: `gcc: error: ${srcFile}: No such file or directory\n`, exitCode: 1 };
        }

        const info = COMPILE_OUTPUTS[srcName];
        if (!info) {
            // Generic compilation success
            EXECUTABLES.set(`./${outName}`, () => `(programa ${outName} executou com sucesso)\n`);
            return '';
        }

        if (!hasOpenMP && srcName !== 'a.out') {
            // Without -fopenmp, pragmas are ignored — runs with 1 thread
            EXECUTABLES.set(`./${outName}`, () => info.output(1));
        } else {
            EXECUTABLES.set(`./${outName}`, (threads) => info.output(threads));
        }
        return '';
    }
});

// Run compiled executables: ./hello, ./palm_preprocess, etc.
register({
    name: './',
    help: 'Executa um programa compilado (ex: ./hello)',
    run: (args, ctx) => {
        // The command name is './' — reconstruct the full path
        // Actually the parser splits './hello' into one token
        return { stderr: 'Use o formato: ./nome_do_executavel', exitCode: 1 };
    }
});

// Override dispatch to handle './' prefix commands
// This is done by registering a catch-all in the main dispatcher
// Instead, we register common executable names:
function registerExeRunner(name) {
    register({
        name: `./${name}`,
        help: `Executa o programa ${name}`,
        run: (args, ctx) => {
            const fn = EXECUTABLES.get(`./${name}`);
            if (!fn) return { stderr: `bash: ./${name}: No such file or directory\n`, exitCode: 127 };
            // Check for OMP_NUM_THREADS in environment prefix
            return fn(4); // default 4 threads
        }
    });
}

// Pre-register expected executables
['hello', 'palm_preprocess', 'race_bug', 'race_fixed', 'a.out'].forEach(registerExeRunner);

// Handle OMP_NUM_THREADS=N ./exe pattern
register({
    name: 'OMP_NUM_THREADS=1',
    run: (args, ctx) => runWithThreads(1, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=2',
    run: (args, ctx) => runWithThreads(2, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=4',
    run: (args, ctx) => runWithThreads(4, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=8',
    run: (args, ctx) => runWithThreads(8, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=16',
    run: (args, ctx) => runWithThreads(16, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=24',
    run: (args, ctx) => runWithThreads(24, args, ctx)
});
register({
    name: 'OMP_NUM_THREADS=48',
    run: (args, ctx) => runWithThreads(48, args, ctx)
});

function runWithThreads(n, args, ctx) {
    const exe = args[0];
    if (!exe) return { stderr: 'missing executable after OMP_NUM_THREADS=N\n', exitCode: 1 };
    const fn = EXECUTABLES.get(exe);
    if (!fn) return { stderr: `bash: ${exe}: No such file or directory\n`, exitCode: 127 };
    return fn(n);
}
