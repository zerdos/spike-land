/**
 * TypeScript/TSX tokenizer producing token types that match Monaco Editor's
 * Monarch tokenizer for TypeScript. Designed for syntax highlighting that is
 * visually identical to Monaco's vs-dark and light themes.
 */

export interface Token {
  /** Monaco token type: 'keyword', 'string', 'comment', 'identifier', etc. */
  type: string;
  /** The actual source text for this token. */
  value: string;
}

// ---------------------------------------------------------------------------
// Keyword set — matches Monaco Monarch typescript.ts
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
  "abstract",
  "any",
  "as",
  "asserts",
  "async",
  "await",
  "bigint",
  "boolean",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "constructor",
  "continue",
  "debugger",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "global",
  "if",
  "implements",
  "import",
  "in",
  "infer",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "module",
  "namespace",
  "never",
  "new",
  "null",
  "number",
  "object",
  "of",
  "out",
  "override",
  "package",
  "private",
  "protected",
  "public",
  "readonly",
  "require",
  "return",
  "satisfies",
  "set",
  "static",
  "string",
  "super",
  "switch",
  "symbol",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "unique",
  "unknown",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

// Characters that can appear right before a regex literal (heuristic).
const REGEX_PREV_TOKENS = new Set([
  "=",
  "(",
  "[",
  "!",
  "&",
  "|",
  "?",
  ":",
  ",",
  ";",
  "{",
  "}",
  "^",
  "~",
  "+",
  "-",
  "*",
  "/",
  "%",
  "<",
  ">",
]);

// Single-char operators / delimiters
const OPERATOR_CHARS = new Set([
  "=",
  "+",
  "-",
  "*",
  "%",
  "&",
  "|",
  "^",
  "!",
  "~",
  "<",
  ">",
  "?",
  ":",
  ".",
  ";",
  ",",
  "@",
]);

// Three-character operators
const TRI_OPS = new Set([
  "===",
  "!==",
  ">>>",
  "&&=",
  "||=",
  "??=",
  "<<=",
  ">>=",
  "...",
  "**=",
]);

// Two-character operators
const BI_OPS = new Set([
  "==",
  "!=",
  "<=",
  ">=",
  "=>",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "++",
  "--",
  "&&",
  "||",
  "??",
  "**",
  "<<",
  ">>",
  "?.",
  "::",
]);

// ---------------------------------------------------------------------------
// Character classification helpers
// ---------------------------------------------------------------------------

function isIdentStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_" ||
    ch === "$"
  );
}

function isIdentPart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    (ch >= "0" && ch <= "9") ||
    ch === "_" ||
    ch === "$"
  );
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\r";
}

// ---------------------------------------------------------------------------
// Scanner — mutable state object threaded through helpers
// ---------------------------------------------------------------------------

interface ScanState {
  /** Current line text. */
  line: string;
  /** Current position within the line. */
  pos: number;
  /** Last non-whitespace token value on the current line. */
  lastSigValue: string;
  /** Multi-line state carried across lines. 0=normal, 1=block comment, 2=doc comment, 3=template literal. */
  mlState: number;
  /** Nesting depth inside `${...}` within template literals. */
  templateDepth: number;
  /** Brace depth tracker per template nesting level. */
  templateBraceStack: number[];
}

const ML_NORMAL = 0;
const ML_BLOCK_COMMENT = 1;
const ML_DOC_COMMENT = 2;
const ML_TEMPLATE_LITERAL = 3;

function peek(s: ScanState, offset: number = 0): string {
  const idx = s.pos + offset;
  return idx < s.line.length ? s.line[idx] : "";
}

function pushToken(
  tokens: Token[],
  s: ScanState,
  type: string,
  value: string,
): void {
  tokens.push({ type, value });
  if (type !== "") {
    s.lastSigValue = value;
  }
  s.pos += value.length;
}

// ---------------------------------------------------------------------------
// Regex start heuristic
// ---------------------------------------------------------------------------

function canStartRegex(tokens: Token[], lastValue: string): boolean {
  if (lastValue === "") return true;
  if (REGEX_PREV_TOKENS.has(lastValue)) return true;
  if (KEYWORDS.has(lastValue)) {
    return lastValue !== "this" && lastValue !== "super";
  }
  if (lastValue === ")" || lastValue === "]") return false;
  if (tokens.length > 0) {
    const lastType = tokens[tokens.length - 1].type;
    if (
      lastType === "identifier" ||
      lastType === "type.identifier" ||
      lastType === "number" ||
      lastType === "number.float" ||
      lastType === "number.hex"
    ) {
      return false;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Sub-scanners
// ---------------------------------------------------------------------------

function consumeSimpleString(
  tokens: Token[],
  s: ScanState,
  quote: string,
): void {
  let value = quote;
  s.pos++; // skip opening quote

  while (s.pos < s.line.length) {
    const ch = s.line[s.pos];
    if (ch === "\\") {
      if (value.length > 0) {
        tokens.push({ type: "string", value });
        value = "";
      }
      const esc = s.line.substring(s.pos, s.pos + 2);
      tokens.push({ type: "string.escape", value: esc });
      s.lastSigValue = esc;
      s.pos += 2;
      continue;
    }
    if (ch === quote) {
      value += ch;
      s.pos++;
      tokens.push({ type: "string", value });
      s.lastSigValue = value;
      return;
    }
    value += ch;
    s.pos++;
  }

  // Unterminated string
  if (value.length > 0) {
    tokens.push({ type: "string", value });
    s.lastSigValue = value;
  }
}

/**
 * Consume the body of a template literal. Returns:
 * - "line-end" if we hit end-of-line while still inside the template
 * - "closed" if we hit the closing backtick
 * - "expression" if we entered a `${...}` expression
 */
function consumeTemplateBody(
  tokens: Token[],
  s: ScanState,
): "line-end" | "closed" | "expression" {
  let value = "";

  while (s.pos < s.line.length) {
    const ch = s.line[s.pos];

    if (ch === "\\") {
      if (value.length > 0) {
        tokens.push({ type: "string", value });
        s.lastSigValue = value;
        value = "";
      }
      const esc = s.line.substring(s.pos, s.pos + 2);
      tokens.push({ type: "string.escape", value: esc });
      s.lastSigValue = esc;
      s.pos += 2;
      continue;
    }

    if (ch === "`") {
      value += "`";
      s.pos++;
      if (value.length > 0) {
        tokens.push({ type: "string", value });
        s.lastSigValue = value;
      }
      s.mlState = ML_NORMAL;
      s.templateDepth--;
      s.templateBraceStack.pop();
      return "closed";
    }

    if (ch === "$" && peek(s, 1) === "{") {
      if (value.length > 0) {
        tokens.push({ type: "string", value });
        s.lastSigValue = value;
      }
      tokens.push({ type: "delimiter.bracket", value: "${" });
      s.lastSigValue = "${";
      s.pos += 2;
      s.mlState = ML_NORMAL;
      return "expression";
    }

    value += ch;
    s.pos++;
  }

  // End of line inside template literal
  if (value.length > 0) {
    tokens.push({ type: "string", value });
    s.lastSigValue = value;
  }
  return "line-end";
}

function consumeRegex(tokens: Token[], s: ScanState): void {
  const start = s.pos;
  s.pos++; // skip opening /
  let inCharClass = false;

  while (s.pos < s.line.length) {
    const ch = s.line[s.pos];
    if (ch === "\\") {
      s.pos += 2;
      continue;
    }
    if (ch === "[") {
      inCharClass = true;
      s.pos++;
      continue;
    }
    if (ch === "]") {
      inCharClass = false;
      s.pos++;
      continue;
    }
    if (ch === "/" && !inCharClass) {
      s.pos++; // skip closing /
      // Consume flags
      while (s.pos < s.line.length && /[dgimsuy]/.test(s.line[s.pos])) s.pos++;
      const value = s.line.substring(start, s.pos);
      tokens.push({ type: "regexp", value });
      s.lastSigValue = value;
      return;
    }
    s.pos++;
  }

  // Unterminated regex
  const value = s.line.substring(start, s.pos);
  tokens.push({ type: "regexp", value });
  s.lastSigValue = value;
}

function consumeNumber(tokens: Token[], s: ScanState): void {
  const start = s.pos;
  let tokenType = "number";

  if (s.line[s.pos] === "0" && s.pos + 1 < s.line.length) {
    const next = s.line[s.pos + 1].toLowerCase();
    if (next === "x") {
      tokenType = "number.hex";
      s.pos += 2;
      while (s.pos < s.line.length && /[0-9a-fA-F_]/.test(s.line[s.pos]))
        s.pos++;
      pushNumber(tokens, s, start, tokenType);
      return;
    }
    if (next === "o") {
      s.pos += 2;
      while (s.pos < s.line.length && /[0-7_]/.test(s.line[s.pos])) s.pos++;
      pushNumber(tokens, s, start, tokenType);
      return;
    }
    if (next === "b") {
      s.pos += 2;
      while (s.pos < s.line.length && /[01_]/.test(s.line[s.pos])) s.pos++;
      pushNumber(tokens, s, start, tokenType);
      return;
    }
  }

  // Decimal integer part
  while (s.pos < s.line.length && /[0-9_]/.test(s.line[s.pos])) s.pos++;

  // Fractional part
  if (s.pos < s.line.length && s.line[s.pos] === ".") {
    tokenType = "number.float";
    s.pos++;
    while (s.pos < s.line.length && /[0-9_]/.test(s.line[s.pos])) s.pos++;
  }

  // Exponent part
  if (
    s.pos < s.line.length &&
    (s.line[s.pos] === "e" || s.line[s.pos] === "E")
  ) {
    tokenType = "number.float";
    s.pos++;
    if (
      s.pos < s.line.length &&
      (s.line[s.pos] === "+" || s.line[s.pos] === "-")
    )
      s.pos++;
    while (s.pos < s.line.length && /[0-9_]/.test(s.line[s.pos])) s.pos++;
  }

  // BigInt suffix
  if (s.pos < s.line.length && s.line[s.pos] === "n") {
    s.pos++;
  }

  pushNumber(tokens, s, start, tokenType);
}

function pushNumber(
  tokens: Token[],
  s: ScanState,
  start: number,
  tokenType: string,
): void {
  const value = s.line.substring(start, s.pos);
  tokens.push({ type: tokenType, value });
  s.lastSigValue = value;
}

function consumeIdentifier(tokens: Token[], s: ScanState): void {
  const start = s.pos;
  while (s.pos < s.line.length && isIdentPart(s.line[s.pos])) s.pos++;
  const value = s.line.substring(start, s.pos);

  if (KEYWORDS.has(value)) {
    tokens.push({ type: "keyword", value });
  } else if (value.charCodeAt(0) >= 65 && value.charCodeAt(0) <= 90) {
    // Starts with uppercase A-Z
    tokens.push({ type: "type.identifier", value });
  } else {
    tokens.push({ type: "identifier", value });
  }
  s.lastSigValue = value;
}

function consumeOperator(s: ScanState): string {
  // Three-character operators
  if (s.pos + 2 < s.line.length) {
    const tri = s.line.substring(s.pos, s.pos + 3);
    if (TRI_OPS.has(tri)) {
      s.pos += 3;
      return tri;
    }
  }

  // Two-character operators
  if (s.pos + 1 < s.line.length) {
    const bi = s.line.substring(s.pos, s.pos + 2);
    if (BI_OPS.has(bi)) {
      s.pos += 2;
      return bi;
    }
  }

  // Single character
  const ch = s.line[s.pos];
  s.pos++;
  return ch;
}

// ---------------------------------------------------------------------------
// Core tokenizer
// ---------------------------------------------------------------------------

/**
 * Tokenize TypeScript/TSX source code into lines of tokens, where each token
 * carries a `type` string matching Monaco's Monarch token types.
 *
 * Returns an array of lines; each line is an array of `Token` objects.
 */
export function tokenizeTypeScript(code: string): Token[][] {
  const lines = code.split("\n");
  const result: Token[][] = [];

  const s: ScanState = {
    line: "",
    pos: 0,
    lastSigValue: "",
    mlState: ML_NORMAL,
    templateDepth: 0,
    templateBraceStack: [],
  };

  for (const lineText of lines) {
    const tokens: Token[] = [];
    s.line = lineText;
    s.pos = 0;
    s.lastSigValue = "";

    // ------------------------------------------------------------------
    // Continue multi-line block / doc comment
    // ------------------------------------------------------------------

    if (s.mlState === ML_BLOCK_COMMENT || s.mlState === ML_DOC_COMMENT) {
      const tokenType =
        s.mlState === ML_DOC_COMMENT ? "comment.doc" : "comment";
      const endIdx = s.line.indexOf("*/", s.pos);
      if (endIdx === -1) {
        pushToken(tokens, s, tokenType, s.line.substring(s.pos));
        result.push(tokens);
        continue;
      }
      pushToken(tokens, s, tokenType, s.line.substring(s.pos, endIdx + 2));
      s.mlState = ML_NORMAL;
    }

    // ------------------------------------------------------------------
    // Continue multi-line template literal
    // ------------------------------------------------------------------

    if (s.mlState === ML_TEMPLATE_LITERAL) {
      const consumed = consumeTemplateBody(tokens, s);
      if (consumed === "line-end") {
        result.push(tokens);
        continue;
      }
      // Otherwise we closed the template or entered an expression — fall through
    }

    // ------------------------------------------------------------------
    // Main scan loop
    // ------------------------------------------------------------------

    while (s.pos < s.line.length) {
      const ch = s.line[s.pos];

      // ---- Whitespace ------------------------------------------------
      if (isWhitespace(ch)) {
        let end = s.pos + 1;
        while (end < s.line.length && isWhitespace(s.line[end])) end++;
        pushToken(tokens, s, "", s.line.substring(s.pos, end));
        continue;
      }

      // ---- Single-line comment ---------------------------------------
      if (ch === "/" && peek(s, 1) === "/") {
        pushToken(tokens, s, "comment", s.line.substring(s.pos));
        break; // rest of line is comment
      }

      // ---- Block / JSDoc comment start -------------------------------
      if (ch === "/" && peek(s, 1) === "*") {
        const isDoc = peek(s, 2) === "*" && peek(s, 3) !== "/";
        const tokenType = isDoc ? "comment.doc" : "comment";
        const endIdx = s.line.indexOf("*/", s.pos + 2);
        if (endIdx === -1) {
          pushToken(tokens, s, tokenType, s.line.substring(s.pos));
          s.mlState = isDoc ? ML_DOC_COMMENT : ML_BLOCK_COMMENT;
          break;
        }
        pushToken(
          tokens,
          s,
          tokenType,
          s.line.substring(s.pos, endIdx + 2),
        );
        continue;
      }

      // ---- String: single quote --------------------------------------
      if (ch === "'") {
        consumeSimpleString(tokens, s, "'");
        continue;
      }

      // ---- String: double quote --------------------------------------
      if (ch === '"') {
        consumeSimpleString(tokens, s, '"');
        continue;
      }

      // ---- Template literal (backtick) -------------------------------
      if (ch === "`") {
        pushToken(tokens, s, "string", "`");
        s.mlState = ML_TEMPLATE_LITERAL;
        s.templateDepth++;
        s.templateBraceStack.push(0);
        const consumed = consumeTemplateBody(tokens, s);
        if (consumed === "line-end") break;
        continue;
      }

      // ---- Closing brace: might return to template literal -----------
      if (ch === "}" && s.templateDepth > 0) {
        const stackIdx = s.templateBraceStack.length - 1;
        const currentBraceDepth = s.templateBraceStack[stackIdx];
        if (currentBraceDepth > 0) {
          s.templateBraceStack[stackIdx]--;
          pushToken(tokens, s, "delimiter.bracket", "}");
          continue;
        }
        // End of template expression — back into template string
        pushToken(tokens, s, "delimiter.bracket", "}");
        s.mlState = ML_TEMPLATE_LITERAL;
        const consumed = consumeTemplateBody(tokens, s);
        if (consumed === "line-end") break;
        continue;
      }

      // ---- Opening brace inside template expression ------------------
      if (ch === "{" && s.templateDepth > 0) {
        s.templateBraceStack[s.templateBraceStack.length - 1]++;
        pushToken(tokens, s, "delimiter.bracket", "{");
        continue;
      }

      // ---- JSX closing tag </Component> --------------------------------
      if (ch === "/" && s.lastSigValue === "<") {
        // This is `</` — a JSX closing tag, not a regex or division.
        // Emit `/` as delimiter, then let the next iteration pick up
        // the identifier.
        pushToken(tokens, s, "delimiter", "/");
        continue;
      }

      // ---- Regular expression ----------------------------------------
      if (ch === "/" && canStartRegex(tokens, s.lastSigValue)) {
        consumeRegex(tokens, s);
        continue;
      }

      // ---- Numeric literal -------------------------------------------
      if (isDigit(ch) || (ch === "." && isDigit(peek(s, 1)))) {
        consumeNumber(tokens, s);
        continue;
      }

      // ---- Identifier / keyword --------------------------------------
      if (isIdentStart(ch)) {
        consumeIdentifier(tokens, s);
        continue;
      }

      // ---- Brackets --------------------------------------------------
      if (ch === "(" || ch === ")" || ch === "[" || ch === "]") {
        pushToken(tokens, s, "bracket", ch);
        continue;
      }

      // ---- Braces (outside template context) -------------------------
      if (ch === "{" || ch === "}") {
        pushToken(tokens, s, "delimiter.bracket", ch);
        continue;
      }

      // ---- Operators / delimiters ------------------------------------
      if (OPERATOR_CHARS.has(ch)) {
        const op = consumeOperator(s);
        tokens.push({ type: "delimiter", value: op });
        s.lastSigValue = op;
        continue;
      }

      // ---- Hash (private fields) -------------------------------------
      if (ch === "#" && s.pos + 1 < s.line.length && isIdentStart(peek(s, 1))) {
        const start = s.pos;
        s.pos++; // skip #
        while (s.pos < s.line.length && isIdentPart(s.line[s.pos])) s.pos++;
        const value = s.line.substring(start, s.pos);
        tokens.push({ type: "identifier", value });
        s.lastSigValue = value;
        continue;
      }

      // ---- Fallback: unknown character as delimiter ------------------
      pushToken(tokens, s, "delimiter", ch);
    }

    result.push(tokens);
  }

  return result;
}
