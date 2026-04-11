// js/terminal.js
// Headless terminal state: prompt, output buffer, history.
export function createTerminal() {
    let prompt = 'pedro@local:~$ ';
    let userHost = 'pedro@local';
    let cwdDisplay = '~';
    const output = [];
    const history = [];
    let historyIndex = -1;

    function buildPrompt() {
        prompt = `${userHost}:${cwdDisplay}$ `;
    }

    return {
        getPrompt() { return prompt; },
        setPrompt(uh, realCwd, home) {
            userHost = uh;
            cwdDisplay = realCwd === home ? '~'
                : (realCwd.startsWith(home + '/') ? '~' + realCwd.slice(home.length) : realCwd);
            buildPrompt();
        },
        appendOutput(line) { output.push(line); },
        appendOutputError(line) { output.push({ kind: 'err', text: line }); },
        appendCommandLine(promptStr, input) { output.push({ kind: 'prompt', text: promptStr + input }); },
        getOutput() { return [...output]; },
        clear() { output.length = 0; },
        addToHistory(cmd) {
            if (!cmd) return;
            if (history.length > 0 && history[history.length - 1] === cmd) return;
            history.push(cmd);
            historyIndex = history.length;
        },
        getHistory() { return [...history]; },
        historyUp() {
            if (history.length === 0) return '';
            historyIndex = Math.max(0, historyIndex - 1);
            return history[historyIndex];
        },
        historyDown() {
            if (history.length === 0) return '';
            historyIndex = Math.min(history.length, historyIndex + 1);
            if (historyIndex >= history.length) return '';
            return history[historyIndex];
        }
    };
}
