// js/commands/ssh.js
import { register } from './index.js';

const LOGIN_NODES = ['sdumont2nd4', 'sdumont2nd5', 'sdumont2nd6', 'sdumont2nd7'];

function parseHost(spec) {
    const m = spec.match(/^([^@]+)@(.+)$/);
    if (!m) return null;
    const [, user, host] = m;
    if (host === 'login.sdumont2nd.lncc.br' || host === 'sdumont2nd') {
        const landed = LOGIN_NODES[Math.floor(Math.random() * 4)];
        return { user, host: landed };
    }
    if (LOGIN_NODES.includes(host)) return { user, host };
    return { user, host, unknown: true };
}

register({
    name: 'ssh',
    help: 'Conecta via SSH (ex: ssh unseen@login.sdumont2nd.lncc.br)',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('usage: ssh user@host');
        const parsed = parseHost(args[0]);
        if (!parsed) throw new Error(`ssh: invalid argument '${args[0]}'`);
        if (parsed.unknown) {
            return { stdout: '', stderr: `ssh: Could not resolve hostname ${parsed.host}: unknown host`, exitCode: 1 };
        }
        ctx.hostname = parsed.host;
        ctx.currentUser = parsed.user;
        ctx.filesystem.setHost(parsed.host);
        ctx.filesystem.setUser(parsed.user);
        const home = ctx.filesystem.getHome();
        ctx.filesystem.setCwd(home);
        const banner = [
            '',
            `Last login: Fri Apr 11 15:42:01 2026 from user-local`,
            `Welcome to Santos Dumont 2nd (Bull Sequana XH3000 — 2024)`,
            `Login node: ${parsed.host}`,
            ``,
            `Importante: não execute workloads neste nó — use sbatch para submeter jobs.`,
            `Manual: https://github.com/lncc-sered/manual-sdumont2nd/wiki`,
            ''
        ].join('\n');
        return { stdout: banner, signal: 'ssh-connected' };
    }
});

register({
    name: 'scp',
    help: 'Copia arquivos para/de host remoto',
    run: (args, ctx) => {
        if (args.length < 2) throw new Error('usage: scp SOURCE DEST');
        const dst = args[args.length - 1];
        const remote = dst.match(/^([^@]+)@([^:]+):(.+)$/);
        if (!remote) return '';
        const [, , host] = remote;
        if (host !== 'login.sdumont2nd.lncc.br' && !LOGIN_NODES.includes(host)) {
            return { stdout: '', stderr: `ssh: Could not resolve hostname ${host}: unknown host`, exitCode: 1 };
        }
        return [
            `${args[0]}                                    100%  850MB  42.5MB/s   00:20`,
            ''
        ].join('\n');
    }
});

register({
    name: 'rsync',
    help: 'Sincroniza arquivos',
    run: () => {
        return [
            'sending incremental file list',
            './',
            'dataset/image_001.png',
            'dataset/image_002.png',
            '(... 12484 files ...)',
            '',
            'sent 843,221,505 bytes  received 245,120 bytes  24,101,904 bytes/sec',
            'total size is 843,001,220  speedup is 1.00',
            ''
        ].join('\n');
    }
});
