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

// Lazy import — set by compile.js / cuda.js via setExecutables()
let EXECUTABLES = null;
export function setExecutables(map) { EXECUTABLES = map; }

export function dispatch(tokens, ctx) {
    if (tokens.length === 0) return { stdout: '', stderr: '', exitCode: 0 };

    // Initialise env bag if missing
    if (!ctx.env) ctx.env = {};

    let [name, ...args] = tokens;

    // --- Handle: export VAR=VAL ---
    if (name === 'export') {
        const assign = args[0];
        if (!assign || !assign.includes('=')) {
            return { stdout: '', stderr: 'export: usage: export VAR=value\n', exitCode: 1 };
        }
        const [varName, ...rest] = assign.split('=');
        ctx.env[varName] = rest.join('=');
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    // --- Handle: VAR=VAL command ... (env prefix) ---
    const envMatch = name.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (envMatch) {
        const [, varName, varVal] = envMatch;
        if (args.length === 0) {
            // bare assignment like OMP_NUM_THREADS=4 (no command after)
            ctx.env[varName] = varVal;
            return { stdout: '', stderr: '', exitCode: 0 };
        }
        // Run the remaining tokens with the env var set temporarily
        const prevVal = ctx.env[varName];
        ctx.env[varName] = varVal;
        const result = dispatch(args, ctx);
        // Restore (env prefix is per-command, not persistent)
        if (prevVal === undefined) delete ctx.env[varName];
        else ctx.env[varName] = prevVal;
        return result;
    }

    // --- Handle: ./executable (dynamic lookup) ---
    if (name.startsWith('./') && !REGISTRY.has(name)) {
        if (!EXECUTABLES) {
            return { stdout: '', stderr: `bash: ${name}: No such file or directory\n`, exitCode: 127 };
        }
        const fn = EXECUTABLES.get(name);
        if (!fn) {
            return { stdout: '', stderr: `bash: ${name}: No such file or directory\n`, exitCode: 127 };
        }
        const threads = parseInt(ctx.env.OMP_NUM_THREADS) || 4;
        const output = fn(threads);
        if (typeof output === 'string') return { stdout: output, stderr: '', exitCode: 0 };
        return output;
    }

    // --- Standard dispatch ---
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
