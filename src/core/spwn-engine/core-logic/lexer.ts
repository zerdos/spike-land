/**
 * SPWN Lexer
 *
 * Tokenizes SPWN source code into a flat Token array.
 * Handles all SPWN syntax: GD IDs, binary/hex/octal literals,
 * escape sequences in strings, and multi-char operators.
 */

// ─── Token Types ─────────────────────────────────────────────────────────────

export type TokenKind =
  // Literals
  | "Number"
  | "String"
  | "GdId"
  // Identifiers & Keywords
  | "Identifier"
  | "Let"
  | "Return"
  | "If"
  | "Else"
  | "For"
  | "In"
  | "While"
  | "Break"
  | "Continue"
  | "Import"
  | "Extract"
  | "Type"
  | "Impl"
  | "Match"
  | "Null"
  | "True"
  | "False"
  | "Self"
  | "Obj"
  | "Trigger"
  | "Throw"
  | "Sync"
  | "As"
  | "Is"
  | "Has"
  // Operators
  | "Plus"
  | "Minus"
  | "Star"
  | "Slash"
  | "Percent"
  | "Caret"
  | "StarStar"
  | "PercentSlash"
  | "Bang"
  | "Eq"
  | "EqEq"
  | "BangEq"
  | "Gt"
  | "Lt"
  | "GtEq"
  | "LtEq"
  | "AmpAmp"
  | "PipePipe"
  | "PlusEq"
  | "MinusEq"
  | "StarEq"
  | "SlashEq"
  | "CaretEq"
  | "PercentEq"
  | "PlusPlus"
  | "MinusMinus"
  | "Arrow" // ->
  | "FatArrow" // =>
  | "Spaceship" // <=>
  | "DotDot" // ..
  | "DotDotEq" // ..=
  // Delimiters
  | "LParen"
  | "RParen"
  | "LBrace"
  | "RBrace"
  | "LBracket"
  | "RBracket"
  | "Comma"
  | "Colon"
  | "ColonColon" // ::
  | "Dot"
  | "At"
  | "Hash"
  | "Amp"
  // Structural
  | "Newline"
  | "Semicolon"
  | "EOF";

export interface Token {
  kind: TokenKind;
  value: string;
  line: number;
  column: number;
}

/** GD ID suffix characters and their kind mapping */
const GD_SUFFIX: Record<string, "group" | "color" | "item" | "block"> = {
  g: "group",
  c: "color",
  i: "item",
  b: "block",
};

const KEYWORDS: Record<string, TokenKind> = {
  let: "Let",
  return: "Return",
  if: "If",
  else: "Else",
  for: "For",
  in: "In",
  while: "While",
  break: "Break",
  continue: "Continue",
  import: "Import",
  extract: "Extract",
  type: "Type",
  impl: "Impl",
  match: "Match",
  null: "Null",
  true: "True",
  false: "False",
  self: "Self",
  obj: "Obj",
  trigger: "Trigger",
  throw: "Throw",
  sync: "Sync",
  as: "As",
  is: "Is",
  has: "Has",
};

export class LexerError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
  ) {
    super(`Lexer error at ${line}:${column} — ${message}`);
    this.name = "LexerError";
  }
}

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(source?: string): Token[] {
    if (source !== undefined) {
      this.source = source;
      this.pos = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
    }

    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const ch = this.current();

      // Line comment
      if (ch === "/" && this.peek(1) === "/") {
        this.skipLineComment();
        continue;
      }

      // Block comment
      if (ch === "/" && this.peek(1) === "*") {
        this.skipBlockComment();
        continue;
      }

      // Newline
      if (ch === "\n") {
        this.emitAt("Newline", "\n");
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }

      // String literals
      if (ch === '"' || ch === "'") {
        this.readString(ch);
        continue;
      }

      // Numbers (and GD IDs)
      if (this.isDigit(ch)) {
        this.readNumber();
        continue;
      }

      // ?g, ?c, ?i, ?b — auto GD IDs
      if (ch === "?" && GD_SUFFIX[this.peek(1) ?? ""] !== undefined) {
        const suffix = this.peek(1) as string;
        const startCol = this.column;
        this.tokens.push({ kind: "GdId", value: `?${suffix}`, line: this.line, column: startCol });
        this.advance();
        this.advance();
        continue;
      }

      // Identifiers and keywords
      if (this.isIdentStart(ch)) {
        this.readIdentifier();
        continue;
      }

      // Operators and delimiters
      this.readOperatorOrDelimiter();
    }

    this.tokens.push({ kind: "EOF", value: "", line: this.line, column: this.column });
    return this.tokens;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private current(): string {
    return this.source[this.pos] ?? "";
  }

  private peek(offset: number): string | undefined {
    return this.source[this.pos + offset];
  }

  private advance(): string {
    const ch = this.source[this.pos] ?? "";
    this.pos++;
    this.column++;
    return ch;
  }

  private emitAt(kind: TokenKind, value: string): void {
    this.tokens.push({ kind, value, line: this.line, column: this.column });
  }

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isHexDigit(ch: string): boolean {
    return (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
  }

  private isIdentStart(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_" || ch === "$";
  }

  private isIdentCont(ch: string): boolean {
    return this.isIdentStart(ch) || this.isDigit(ch);
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos] ?? "";
      if (ch === " " || ch === "\t" || ch === "\r") {
        this.pos++;
        this.column++;
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (this.pos < this.source.length && this.current() !== "\n") {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance(); // /
    this.advance(); // *
    while (this.pos < this.source.length) {
      if (this.current() === "*" && this.peek(1) === "/") {
        this.advance();
        this.advance();
        return;
      }
      if (this.current() === "\n") {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }
    throw new LexerError("Unterminated block comment", this.line, this.column);
  }

  private readString(quote: string): void {
    const startLine = this.line;
    const startCol = this.column;
    this.advance(); // opening quote
    let result = "";
    while (this.pos < this.source.length) {
      const ch = this.current();
      if (ch === quote) {
        this.advance();
        this.tokens.push({ kind: "String", value: result, line: startLine, column: startCol });
        return;
      }
      if (ch === "\n") {
        throw new LexerError("Unterminated string literal", this.line, this.column);
      }
      if (ch === "\\") {
        this.advance();
        result += this.readEscape();
      } else {
        result += ch;
        this.advance();
      }
    }
    throw new LexerError("Unterminated string literal", startLine, startCol);
  }

  private readEscape(): string {
    const ch = this.advance();
    switch (ch) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "\\":
        return "\\";
      case "'":
        return "'";
      case '"':
        return '"';
      case "0":
        return "\0";
      case "u":
        return this.readUnicodeEscape();
      default:
        throw new LexerError(`Unknown escape sequence: \\${ch}`, this.line, this.column);
    }
  }

  private readUnicodeEscape(): string {
    if (this.current() !== "{") {
      throw new LexerError("Expected { after \\u", this.line, this.column);
    }
    this.advance(); // {
    let hex = "";
    while (this.pos < this.source.length && this.current() !== "}") {
      hex += this.advance();
    }
    if (this.current() !== "}") {
      throw new LexerError("Unterminated \\u{...}", this.line, this.column);
    }
    this.advance(); // }
    const code = parseInt(hex, 16);
    if (isNaN(code)) {
      throw new LexerError(`Invalid unicode escape: \\u{${hex}}`, this.line, this.column);
    }
    return String.fromCodePoint(code);
  }

  private readNumber(): void {
    const startLine = this.line;
    const startCol = this.column;
    let raw = "";
    let isFloat = false;

    // Check for base prefix
    if (this.current() === "0") {
      const next = this.peek(1);
      if (next === "x" || next === "X") {
        raw += this.advance() + this.advance(); // 0x
        while (this.pos < this.source.length && this.isHexDigit(this.current())) {
          raw += this.advance();
        }
        this.tokens.push({
          kind: "Number",
          value: String(parseInt(raw, 16)),
          line: startLine,
          column: startCol,
        });
        return;
      }
      if (next === "b" || next === "B") {
        raw += this.advance() + this.advance(); // 0b
        while (
          this.pos < this.source.length &&
          (this.current() === "0" || this.current() === "1")
        ) {
          raw += this.advance();
        }
        this.tokens.push({
          kind: "Number",
          value: String(parseInt(raw.slice(2), 2)),
          line: startLine,
          column: startCol,
        });
        return;
      }
      if (next === "o" || next === "O") {
        raw += this.advance() + this.advance(); // 0o
        while (this.pos < this.source.length && this.current() >= "0" && this.current() <= "7") {
          raw += this.advance();
        }
        this.tokens.push({
          kind: "Number",
          value: String(parseInt(raw.slice(2), 8)),
          line: startLine,
          column: startCol,
        });
        return;
      }
    }

    // Decimal integer or float
    while (this.pos < this.source.length && this.isDigit(this.current())) {
      raw += this.advance();
    }

    if (this.current() === "." && this.peek(1) !== ".") {
      isFloat = true;
      raw += this.advance(); // .
      while (this.pos < this.source.length && this.isDigit(this.current())) {
        raw += this.advance();
      }
    }

    // Scientific notation
    if (this.current() === "e" || this.current() === "E") {
      isFloat = true;
      raw += this.advance();
      if (this.current() === "+" || this.current() === "-") {
        raw += this.advance();
      }
      while (this.pos < this.source.length && this.isDigit(this.current())) {
        raw += this.advance();
      }
    }

    // Check for GD ID suffix immediately after digits (no space)
    if (!isFloat && GD_SUFFIX[this.current()] !== undefined) {
      const suffix = this.current();
      this.advance();
      this.tokens.push({
        kind: "GdId",
        value: `${raw}${suffix}`,
        line: startLine,
        column: startCol,
      });
      return;
    }

    this.tokens.push({ kind: "Number", value: raw, line: startLine, column: startCol });
  }

  private readIdentifier(): void {
    const startLine = this.line;
    const startCol = this.column;
    let name = "";
    while (this.pos < this.source.length && this.isIdentCont(this.current())) {
      name += this.advance();
    }

    const kwKind = KEYWORDS[name];
    if (kwKind !== undefined) {
      this.tokens.push({ kind: kwKind, value: name, line: startLine, column: startCol });
    } else {
      this.tokens.push({ kind: "Identifier", value: name, line: startLine, column: startCol });
    }
  }

  private readOperatorOrDelimiter(): void {
    const startLine = this.line;
    const startCol = this.column;
    const ch = this.advance();

    const emit = (kind: TokenKind, value: string): void => {
      this.tokens.push({ kind, value, line: startLine, column: startCol });
    };

    switch (ch) {
      case "(":
        emit("LParen", ch);
        break;
      case ")":
        emit("RParen", ch);
        break;
      case "{":
        emit("LBrace", ch);
        break;
      case "}":
        emit("RBrace", ch);
        break;
      case "[":
        emit("LBracket", ch);
        break;
      case "]":
        emit("RBracket", ch);
        break;
      case ",":
        emit("Comma", ch);
        break;
      case ";":
        emit("Semicolon", ch);
        break;
      case "@":
        emit("At", ch);
        break;
      case "#":
        emit("Hash", ch);
        break;
      case "~":
        emit("Identifier", ch);
        break; // fallback

      case "+":
        if (this.current() === "+") {
          this.advance();
          emit("PlusPlus", "++");
        } else if (this.current() === "=") {
          this.advance();
          emit("PlusEq", "+=");
        } else emit("Plus", ch);
        break;

      case "-":
        if (this.current() === "-") {
          this.advance();
          emit("MinusMinus", "--");
        } else if (this.current() === "=") {
          this.advance();
          emit("MinusEq", "-=");
        } else if (this.current() === ">") {
          this.advance();
          emit("Arrow", "->");
        } else emit("Minus", ch);
        break;

      case "*":
        if (this.current() === "*") {
          this.advance();
          emit("StarStar", "**");
        } else if (this.current() === "=") {
          this.advance();
          emit("StarEq", "*=");
        } else emit("Star", ch);
        break;

      case "/":
        if (this.current() === "=") {
          this.advance();
          emit("SlashEq", "/=");
        } else if (this.current() === "%") {
          this.advance();
          emit("PercentSlash", "/%");
        } else emit("Slash", ch);
        break;

      case "%":
        if (this.current() === "=") {
          this.advance();
          emit("PercentEq", "%=");
        } else emit("Percent", ch);
        break;

      case "^":
        if (this.current() === "=") {
          this.advance();
          emit("CaretEq", "^=");
        } else emit("Caret", ch);
        break;

      case "!":
        if (this.current() === "=") {
          this.advance();
          emit("BangEq", "!=");
        } else emit("Bang", ch);
        break;

      case "=":
        if (this.current() === "=") {
          this.advance();
          emit("EqEq", "==");
        } else if (this.current() === ">") {
          this.advance();
          emit("FatArrow", "=>");
        } else emit("Eq", ch);
        break;

      case ">":
        if (this.current() === "=") {
          this.advance();
          emit("GtEq", ">=");
        } else emit("Gt", ch);
        break;

      case "<":
        if (this.current() === "=") {
          this.advance();
          if (this.current() === ">") {
            this.advance();
            emit("Spaceship", "<=>");
          } else emit("LtEq", "<=");
        } else emit("Lt", ch);
        break;

      case "&":
        if (this.current() === "&") {
          this.advance();
          emit("AmpAmp", "&&");
        } else emit("Amp", ch);
        break;

      case "|":
        if (this.current() === "|") {
          this.advance();
          emit("PipePipe", "||");
        } else throw new LexerError(`Unexpected character: |`, startLine, startCol);
        break;

      case ".":
        if (this.current() === ".") {
          this.advance();
          if (this.current() === "=") {
            this.advance();
            emit("DotDotEq", "..=");
          } else emit("DotDot", "..");
        } else emit("Dot", ch);
        break;

      case ":":
        if (this.current() === ":") {
          this.advance();
          emit("ColonColon", "::");
        } else emit("Colon", ch);
        break;

      default:
        throw new LexerError(`Unexpected character: ${ch}`, startLine, startCol);
    }
  }
}
