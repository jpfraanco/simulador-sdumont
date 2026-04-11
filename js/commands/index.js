// js/commands/index.js
// Central registry for all shell commands.
const REGISTRY = new Map();

export function register(cmd) {
    REGISTRY.set(cmd.name, cmd);
    if (cmd.aliases) for (const a of cmd.aliases) REGISTRY.set(a, cmd);
}

export function listCommands() {
    return [...new Set(REGISTRY.values())].map(c => ({ name: c.name, help: c.help }));
}

export function dispatch(tokens, ctx) {
    if (tokens.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
    const [name, ...args] = tokens;
    const cmd = REGISTRY.get(name);
    if (!cmd) {
        return { stdout: '', stderr: `bash: ${name}: comando não encontrado`, exitCode: 127 };
    }
    try {
        const result = cmd.run(args, ctx);
        if (typeof result === 'string') return { stdout: result, stderr: '', exitCode: 0 };
        return {
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            exitCode: result.exitCode || 0,
            signal: result.signal
        };
    } catch (e) {
        return { stdout: '', stderr: e.message, exitCode: 1 };
    }
}
