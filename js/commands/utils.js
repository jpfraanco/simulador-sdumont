// js/commands/utils.js
import { register } from './index.js';

register({
    name: 'nvidia-smi',
    help: 'Estado das GPUs no nó atual',
    run: (args, ctx) => {
        const h = ctx.hostname || '';
        // H100 nodes and login nodes (sdumont2nd4-5 have H100)
        if (h.includes('h100') || h === 'sdumont2nd4' || h === 'sdumont2nd5') {
            const gpuCount = h.includes('h100') ? 4 : 2;
            const lines = [
                '+-----------------------------------------------------------------------------+',
                '| NVIDIA-SMI 550.54.15    Driver Version: 550.54.15    CUDA Version: 12.4     |',
                '|-------------------------------+----------------------+----------------------+',
                '| GPU  Name            Bus-Id        Memory-Usage | GPU-Util  Compute M. |',
                '|===============================+======================+======================|'
            ];
            for (let i = 0; i < gpuCount; i++) {
                lines.push(`|   ${i}  NVIDIA H100 SXM | 00000000:0${i}:00.0 | 65280MiB/81920MiB |     94%      Default |`);
            }
            lines.push('+-----------------------------------------------------------------------------+');
            return lines.join('\n') + '\n';
        }
        // GH200 nodes
        if (h.includes('gh200')) {
            const lines = [
                '+-----------------------------------------------------------------------------+',
                '| NVIDIA-SMI 550.54.15    Driver Version: 550.54.15    CUDA Version: 12.4     |',
                '|-------------------------------+----------------------+----------------------+',
                '| GPU  Name            Bus-Id        Memory-Usage | GPU-Util  Compute M. |',
                '|===============================+======================+======================|'
            ];
            for (let i = 0; i < 4; i++) {
                lines.push(`|   ${i}  NVIDIA GH200    | 00000000:0${i}:00.0 | 72000MiB/96000MiB |     88%      Default |`);
            }
            lines.push('+-----------------------------------------------------------------------------+');
            return lines.join('\n') + '\n';
        }
        // MI300A nodes
        if (h.includes('mi300a')) {
            return '(2x AMD Instinct MI300A APU, ~85% util — use rocm-smi para MI300A)\n';
        }
        // Login nodes sdumont2nd6-7 have L40S
        if (h === 'sdumont2nd6' || h === 'sdumont2nd7') {
            return '(2x NVIDIA L40S — login node Petrobras, não para compute)\n';
        }
        return { stdout: '', stderr: 'No devices were found.', exitCode: 1 };
    }
});

register({
    name: 'nodeset',
    help: 'Expande notação sdumont[NNNN-MMMM]',
    run: (args) => {
        if (args[0] === '-e' && args[1]) {
            const m = args[1].match(/^(.+?)\[(\d+)-(\d+)\]$/);
            if (m) {
                const [, prefix, start, end] = m;
                const padLen = start.length;
                const nodes = [];
                for (let i = parseInt(start); i <= parseInt(end); i++) {
                    nodes.push(prefix + String(i).padStart(padLen, '0'));
                }
                return nodes.join(' ') + '\n';
            }
            return args[1] + '\n';
        }
        return '';
    }
});

register({
    name: 'df',
    help: 'Uso de disco',
    run: (args) => {
        if (args.some(a => a.includes('/scratch'))) {
            return [
                `Filesystem                              Size  Used Avail Use% Mounted on`,
                `lustre-mdt.sdumont2nd.lncc.br:/scratch   3.0P  1.2P  1.8P  40% /scratch`,
                ''
            ].join('\n');
        }
        return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   12G   38G  24% /\n`;
    }
});

register({
    name: 'lfs',
    help: 'Lustre fs utility (quota, df)',
    run: (args) => {
        const sub = args[0];
        if (sub === 'quota') {
            return [
                `Disk quotas for prj palmvein:`,
                `     Filesystem    used    quota   limit    files    quota   limit`,
                `      /scratch   124.5G        0   2000G     1842        0  100000`,
                ''
            ].join('\n');
        }
        if (sub === 'df') {
            return [
                `UUID                    bytes      Used   Available Use%`,
                `scratch-OST0000         3072T     1200T      1872T  39% /scratch[OST:0]`,
                `filesystem_summary:     3.0P      1.2P       1.8P  40% /scratch`,
                ''
            ].join('\n');
        }
        return '';
    }
});
