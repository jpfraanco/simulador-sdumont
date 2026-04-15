// js/commands/cuda.js
// Simulated nvcc (NVIDIA CUDA Compiler) and CUDA executable outputs.
import { register } from './index.js';
import { EXECUTABLES } from './compile.js';

// Simulated CUDA compilation outputs
const CUDA_OUTPUTS = {
    'hello_gpu.cu': { exe: 'hello_gpu', output: () => {
        const lines = [
            'GPU 0: NVIDIA H100 SXM — CUDA 12.4',
            ''
        ];
        for (let b = 0; b < 2; b++) {
            for (let t = 0; t < 4; t++) {
                lines.push(`Oi da GPU! Block ${b}, Thread ${t}`);
            }
        }
        lines.push('');
        lines.push('Kernel executou com 2 blocks × 4 threads = 8 threads GPU');
        return lines.join('\n') + '\n';
    }},
    'palm_normalize.cu': { exe: 'palm_normalize', output: () => {
        const time = (0.42 + Math.random() * 0.08).toFixed(2);
        return [
            'Normalizando 16800 imagens IR (128×128) na GPU...',
            `  Alocados 330 MB na GPU (16800 × 128 × 128 × float)`,
            `  cudaMemcpy Host→Device: 12.3 ms`,
            `  Kernel normalize_ir<<<132, 128>>>: ${time} ms`,
            `  cudaMemcpy Device→Host: 11.8 ms`,
            `  Total GPU: ${(parseFloat(time) + 24.1).toFixed(1)} ms`,
            '',
            'Comparação:',
            `  CPU (1 core):   33600 ms`,
            `  CPU (48 cores):  1150 ms  (OpenMP)`,
            `  GPU (H100):       ${(parseFloat(time) + 24.1).toFixed(1)} ms  (CUDA)`,
            `  Speedup GPU vs CPU-seq: ${(33600 / (parseFloat(time) + 24.1)).toFixed(0)}×`,
            ''
        ].join('\n');
    }},
    'multi_gpu.cu': { exe: 'multi_gpu', output: () => {
        const lines = ['Distribuindo 16800 imagens entre 4 GPUs H100...', ''];
        for (let g = 0; g < 4; g++) {
            const imgs = 4200;
            const time = (0.11 + Math.random() * 0.03).toFixed(2);
            lines.push(`  GPU ${g}: ${imgs} imagens processadas em ${time} ms`);
        }
        const total = (0.15 + Math.random() * 0.03).toFixed(2);
        lines.push('');
        lines.push(`Total (4 GPUs paralelo): ${total} ms`);
        lines.push(`Speedup vs 1 GPU: 3.7×  (overhead de sincronização ~8%)`);
        lines.push('');
        return lines.join('\n');
    }},
    'pytorch_check.py': { exe: null, output: () => {
        return [
            'PyTorch 2.3.0+cu124',
            'CUDA disponível: True',
            'Dispositivos: 4',
            '  GPU 0: NVIDIA H100 SXM (81920 MB)',
            '  GPU 1: NVIDIA H100 SXM (81920 MB)',
            '  GPU 2: NVIDIA H100 SXM (81920 MB)',
            '  GPU 3: NVIDIA H100 SXM (81920 MB)',
            '',
            'Teste: tensor([1., 2., 3.], device=\'cuda:0\')',
            'model.to(\'cuda\') → move pesos para GPU 0',
            ''
        ].join('\n');
    }}
};

register({
    name: 'nvcc',
    help: 'Compilador NVIDIA CUDA (simulado). Use: nvcc arquivo.cu -o saida',
    run: (args, ctx) => {
        const srcIdx = args.findIndex(a => a.endsWith('.cu'));
        const outIdx = args.indexOf('-o');
        if (srcIdx < 0) return { stderr: 'nvcc fatal: No input file specified; use option --help for more information\n', exitCode: 1 };

        const srcFile = args[srcIdx];
        const srcName = srcFile.split('/').pop();
        const outName = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : 'a.out';

        // Check if source exists in filesystem
        try {
            ctx.filesystem.cat(srcFile);
        } catch (e) {
            return { stderr: `nvcc fatal: ${srcFile}: No such file or directory\n`, exitCode: 1 };
        }

        const info = CUDA_OUTPUTS[srcName];
        if (!info) {
            EXECUTABLES.set(`./${outName}`, () => `(programa ${outName} executou com sucesso)\n`);
            return '';
        }

        EXECUTABLES.set(`./${outName}`, info.output);
        return '';
    }
});

// python command for pytorch_check.py
register({
    name: 'python',
    aliases: ['python3'],
    help: 'Interpretador Python (simulado)',
    run: (args, ctx) => {
        const script = args[0];
        if (!script) return { stderr: 'Python 3.11.5\n', exitCode: 0 };
        const scriptName = script.split('/').pop();
        const info = CUDA_OUTPUTS[scriptName];
        if (info) return info.output();

        // Check if file exists
        try {
            ctx.filesystem.cat(script);
        } catch (e) {
            return { stderr: `python: can't open file '${script}': [Errno 2] No such file or directory\n`, exitCode: 2 };
        }
        return `(script ${scriptName} executou com sucesso)\n`;
    }
});
