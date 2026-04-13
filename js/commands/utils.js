// js/commands/utils.js
import { register } from './index.js';

register({
    name: 'nvidia-smi',
    help: 'Estado das GPUs no nó atual',
    run: (args, ctx) => {
        if (ctx.hostname === 'sdumont4000') {
            const lines = [
                '+-----------------------------------------------------------------------------+',
                '| NVIDIA-SMI 470.57.02    Driver Version: 470.57.02    CUDA Version: 11.4     |',
                '|-------------------------------+----------------------+----------------------+',
                '| GPU  Name            Bus-Id        Memory-Usage | GPU-Util  Compute M. |',
                '|===============================+======================+======================|'
            ];
            for (let i = 0; i < 8; i++) {
                lines.push(`|   ${i}  Tesla V100-SXM2 | 00000000:0${i}:00.0 | 14235MiB/16160MiB |     92%      Default |`);
            }
            lines.push('+-----------------------------------------------------------------------------+');
            return lines.join('\n') + '\n';
        }
        if (ctx.hostname && /^sdumont6\d{3}$/.test(ctx.hostname)) {
            return '(4x Tesla V100, ~90% util, output abreviado)\n';
        }
        return { stdout: '', stderr: 'No devices were found.', exitCode: 1 };
    }
});

register({
    name: 'nodeset',
    help: 'Expande notação sdumont[NNNN-MMMM]',
    run: (args) => {
        if (args[0] === '-e' && args[1]) {
            const m = args[1].match(/^(\w+?)\[(\d+)-(\d+)\]$/);
            if (m) {
                const [, prefix, start, end] = m;
                const nodes = [];
                for (let i = parseInt(start); i <= parseInt(end); i++) nodes.push(prefix + i);
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
        if (args.some(a => a.includes('/prj'))) {
            return [
                `Filesystem                              Size  Used Avail Use% Mounted on`,
                `isilonsdnfs.sdumont.lncc.br:/ifs/palmvein  100G   12G   88G  12% /prj/palmvein`,
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
                `scratch-OST0000         1024T     467T        557T  45% /scratch[OST:0]`,
                `filesystem_summary:     1.1P      467T        632T  43% /scratch`,
                ''
            ].join('\n');
        }
        return '';
    }
});
