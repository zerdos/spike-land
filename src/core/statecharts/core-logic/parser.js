/**
 * Guard Expression Parser
 *
 * Safe recursive-descent parser for guard expressions used by the statechart
 * engine. Supports arithmetic, comparison, logical operators, string/number
 * literals, boolean/null keywords, and context field access.
 */
// ---------------------------------------------------------------------------
// Tokenizer helpers
// ---------------------------------------------------------------------------
function createParser(expression, context) {
    return { input: expression, pos: 0, context };
}
function skipWhitespace(p) {
    while (p.pos < p.input.length && /\s/.test(p.input.charAt(p.pos))) {
        p.pos++;
    }
}
function peek(p, expected) {
    skipWhitespace(p);
    return p.input.startsWith(expected, p.pos);
}
function consume(p, expected) {
    skipWhitespace(p);
    if (!p.input.startsWith(expected, p.pos)) {
        throw new Error(`Guard parse error at position ${p.pos}: expected "${expected}", found "${p.input.slice(p.pos, p.pos + 10)}"`);
    }
    p.pos += expected.length;
}
// ---------------------------------------------------------------------------
// Recursive descent grammar
// ---------------------------------------------------------------------------
function parseExpr(p) {
    return parseOrExpr(p);
}
function parseOrExpr(p) {
    let left = parseAndExpr(p);
    while (peek(p, "||")) {
        consume(p, "||");
        const right = parseAndExpr(p);
        left = Boolean(left) || Boolean(right);
    }
    return left;
}
function parseAndExpr(p) {
    let left = parseNotExpr(p);
    while (peek(p, "&&")) {
        consume(p, "&&");
        const right = parseNotExpr(p);
        left = Boolean(left) && Boolean(right);
    }
    return left;
}
function parseNotExpr(p) {
    skipWhitespace(p);
    if (peek(p, "!") && !peek(p, "!=")) {
        consume(p, "!");
        const val = parseNotExpr(p);
        return !val;
    }
    return parseCompare(p);
}
function parseCompare(p) {
    const left = parseAddSub(p);
    skipWhitespace(p);
    const ops = ["==", "!=", ">=", "<=", ">", "<"];
    for (const op of ops) {
        if (peek(p, op)) {
            consume(p, op);
            const right = parseAddSub(p);
            switch (op) {
                case "==":
                    return left === right;
                case "!=":
                    return left !== right;
                case ">":
                    return left > right;
                case "<":
                    return left < right;
                case ">=":
                    return left >= right;
                case "<=":
                    return left <= right;
            }
        }
    }
    return left;
}
function parseAddSub(p) {
    let left = parseMulDiv(p);
    while (peek(p, "+") || peek(p, "-")) {
        if (peek(p, "+")) {
            consume(p, "+");
            const right = parseMulDiv(p);
            left = left + right;
        }
        else {
            consume(p, "-");
            const right = parseMulDiv(p);
            left = left - right;
        }
    }
    return left;
}
function parseMulDiv(p) {
    let left = parsePow(p);
    while (peek(p, "*") || peek(p, "/")) {
        if (peek(p, "*")) {
            consume(p, "*");
            const right = parsePow(p);
            left = left * right;
        }
        else {
            consume(p, "/");
            const right = parsePow(p);
            if (right === 0) {
                throw new Error("Division by zero in guard expression");
            }
            left = left / right;
        }
    }
    return left;
}
function parsePow(p) {
    let left = parsePrimary(p);
    while (peek(p, "**")) {
        consume(p, "**");
        const right = parsePrimary(p);
        left = Math.pow(left, right);
    }
    return left;
}
function resolvePath(obj, path) {
    let value = obj;
    for (const key of path) {
        if (value === null || value === undefined)
            return undefined;
        if (typeof value === "object") {
            value = value[key];
        }
        else {
            return undefined;
        }
    }
    return value;
}
function parseStringLiteral(p, quote) {
    p.pos++; // skip opening quote
    let str = "";
    while (p.pos < p.input.length && p.input[p.pos] !== quote) {
        if (p.input[p.pos] === "\\") {
            p.pos++;
            if (p.pos >= p.input.length) {
                throw new Error("Guard parse error: unterminated string escape");
            }
        }
        str += p.input[p.pos];
        p.pos++;
    }
    if (p.pos >= p.input.length) {
        throw new Error("Guard parse error: unterminated string literal");
    }
    p.pos++; // skip closing quote
    return str;
}
function parsePrimary(p) {
    skipWhitespace(p);
    // Parenthesized expression
    if (peek(p, "(")) {
        consume(p, "(");
        const val = parseExpr(p);
        consume(p, ")");
        return val;
    }
    // String literal (double- or single-quoted)
    if (p.pos < p.input.length && (p.input[p.pos] === '"' || p.input[p.pos] === "'")) {
        return parseStringLiteral(p, p.input[p.pos]);
    }
    // Number literal
    if (p.pos < p.input.length &&
        (/\d/.test(p.input.charAt(p.pos)) ||
            (p.input.charAt(p.pos) === "-" &&
                p.pos + 1 < p.input.length &&
                /\d/.test(p.input.charAt(p.pos + 1))))) {
        let numStr = "";
        if (p.input[p.pos] === "-") {
            numStr += "-";
            p.pos++;
        }
        while (p.pos < p.input.length && /[\d.]/.test(p.input.charAt(p.pos))) {
            numStr += p.input[p.pos];
            p.pos++;
        }
        const num = Number(numStr);
        if (isNaN(num)) {
            throw new Error(`Guard parse error: invalid number "${numStr}"`);
        }
        return num;
    }
    // Boolean / null keywords and context access
    skipWhitespace(p);
    const identStart = p.pos;
    while (p.pos < p.input.length && /[a-zA-Z0-9_.]/.test(p.input.charAt(p.pos))) {
        p.pos++;
    }
    const ident = p.input.slice(identStart, p.pos);
    if (ident === "") {
        throw new Error(`Guard parse error at position ${p.pos}: unexpected character "${p.input[p.pos] ?? "EOF"}"`);
    }
    if (ident === "true")
        return true;
    if (ident === "false")
        return false;
    if (ident === "null")
        return null;
    // Context access: context.field.subfield
    if (ident.startsWith("context.")) {
        const path = ident.slice("context.".length).split(".");
        return resolvePath(p.context, path);
    }
    // Event access: event.field.subfield (maps to context._event.field.subfield)
    if (ident.startsWith("event.")) {
        const path = ["_event", ...ident.slice("event.".length).split(".")];
        return resolvePath(p.context, path);
    }
    throw new Error(`Guard parse error: unknown identifier "${ident}". Use "context.fieldName" or "event.fieldName" for access.`);
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Evaluate a guard expression string against a context object.
 * Returns true if the expression evaluates to a truthy value.
 */
export function evaluateGuard(expression, context) {
    return Boolean(evaluateExpression(expression, context));
}
/**
 * Evaluate an arbitrary expression string against a context object.
 * Returns the raw result value (may be string, number, boolean, null, etc.).
 */
export function evaluateExpression(expression, context) {
    const p = createParser(expression, context);
    const result = parseExpr(p);
    skipWhitespace(p);
    if (p.pos < p.input.length) {
        throw new Error(`Expression parse error: unexpected trailing content at position ${p.pos}: "${p.input.slice(p.pos)}"`);
    }
    return result;
}
//# sourceMappingURL=parser.js.map