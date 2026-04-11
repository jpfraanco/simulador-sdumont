// js/commands/parser.js
// Tokenizer that respects single/double quotes.
export function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
        while (i < input.length && /\s/.test(input[i])) i++;
        if (i >= input.length) break;
        let token = '';
        if (input[i] === '"' || input[i] === "'") {
            const quote = input[i++];
            while (i < input.length && input[i] !== quote) token += input[i++];
            i++;
        } else {
            while (i < input.length && !/\s/.test(input[i])) token += input[i++];
        }
        tokens.push(token);
    }
    return tokens;
}
