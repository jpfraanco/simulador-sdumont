// js/commands/fs.js
import { register, listCommands } from './index.js';

register({
    name: 'pwd',
    help: 'Mostra o diretório atual',
    run: (args, ctx) => ctx.filesystem.pwd() + '\n'
});

register({
    name: 'ls',
    help: 'Lista conteúdo do diretório',
    run: (args, ctx) => {
        const flags = args.filter(a => a.startsWith('-')).join('');
        const paths = args.filter(a => !a.startsWith('-'));
        const target = paths[0] || '.';
        const entries = ctx.filesystem.ls(target);
        if (flags.includes('l')) {
            return entries.map(e => {
                const tc = e.type === 'dir' ? 'd' : '-';
                return `${tc}rw-r--r--  1 ${ctx.currentUser}  ${ctx.currentUser}  ${e.type === 'dir' ? '4096' : ' 128'}  Apr 11 17:30  ${e.name}`;
            }).join('\n') + '\n';
        }
        return entries.map(e => e.type === 'dir' ? e.name + '/' : e.name).join('  ') + '\n';
    }
});

register({
    name: 'cd',
    help: 'Muda de diretório',
    run: (args, ctx) => {
        const target = args[0] || '~';
        ctx.filesystem.cd(target);
        return '';
    }
});

register({
    name: 'cat',
    help: 'Mostra o conteúdo de um arquivo',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('cat: faltando operando');
        return ctx.filesystem.cat(args[0]);
    }
});

register({
    name: 'mkdir',
    help: 'Cria um diretório',
    run: (args, ctx) => {
        if (!args[0]) throw new Error('mkdir: faltando operando');
        ctx.filesystem.mkdir(args[0]);
        return '';
    }
});

register({
    name: 'whoami',
    help: 'Mostra o usuário atual',
    run: (args, ctx) => ctx.currentUser + '\n'
});

register({
    name: 'hostname',
    help: 'Mostra o nome da máquina atual',
    run: (args, ctx) => ctx.hostname + '\n'
});

register({
    name: 'date',
    help: 'Mostra data e hora',
    run: () => new Date().toString() + '\n'
});

register({
    name: 'uptime',
    help: 'Tempo de atividade',
    run: () => ' 15:42:11 up 203 days,  4:17,  1 user,  load average: 0.42, 0.31, 0.29\n'
});

register({
    name: 'clear',
    aliases: ['cls'],
    help: 'Limpa o terminal',
    run: (args, ctx) => { ctx.terminal.clear(); return ''; }
});

register({
    name: 'history',
    help: 'Histórico de comandos',
    run: (args, ctx) => {
        const h = ctx.terminal.getHistory();
        return h.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n') + '\n';
    }
});

register({
    name: 'echo',
    help: 'Imprime argumentos',
    run: (args) => args.join(' ') + '\n'
});

register({
    name: 'help',
    aliases: ['?'],
    help: 'Lista os comandos suportados',
    run: () => {
        const cmds = listCommands().sort((a, b) => a.name.localeCompare(b.name));
        const lines = ['Comandos disponíveis neste simulador:', ''];
        for (const c of cmds) lines.push(`  ${c.name.padEnd(14)}  ${c.help || ''}`);
        lines.push('');
        lines.push('Dica: ↑/↓ navega no histórico.');
        return lines.join('\n') + '\n';
    }
});

register({
    name: 'exit',
    help: 'Desconecta (SSH) ou fecha',
    run: (args, ctx) => {
        if (ctx.hostname && ctx.hostname.startsWith('sdumont')) {
            return { stdout: 'logout\nConnection to sdumont closed.\n', signal: 'exit-ssh' };
        }
        return '';
    }
});
