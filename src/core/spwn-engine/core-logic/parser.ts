/**
 * SPWN Recursive-Descent Parser
 *
 * Converts a Token array into a Statement[] AST.
 * Expression parsing uses a Pratt (top-down operator precedence) strategy
 * for correct associativity and precedence handling.
 */

import type { Token, TokenKind } from "./lexer.js";
import type {
  Argument,
  ArrowStatement,
  AssignStatement,
  AssignTarget,
  BinaryOperator,
  BreakStatement,
  CallExpression,
  CompoundAssignStatement,
  CompoundOperator,
  ContinueStatement,
  ConstructorExpression,
  DictEntry,
  Expression,
  ExtractStatement,
  ForStatement,
  GdIdLiteral,
  IfStatement,
  ImplBlock,
  IncrementStatement,
  MacroExpression,
  MacroParam,
  MatchArm,
  MatchPattern,
  MatchStatement,
  MemberAccess,
  ReturnStatement,
  Statement,
  ThrowStatement,
  TypeDefinition,
  UnaryOperator,
  WhileStatement,
} from "./ast.js";

export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
  ) {
    super(`Parse error at ${line}:${column} — ${message}`);
    this.name = "ParseError";
  }
}

// ─── Operator Precedence (Pratt) ─────────────────────────────────────────────

type Precedence = number;

const PREC_NONE = 0;
const PREC_ASSIGN = 1;
const PREC_OR = 2;
const PREC_AND = 3;
const PREC_COMPARE = 4;
const PREC_RANGE = 5;
const PREC_ADD = 6;
const PREC_MUL = 7;
const PREC_EXP = 8;
const PREC_UNARY = 9;
const PREC_CALL = 10;

function infixPrecedence(kind: TokenKind): Precedence {
  switch (kind) {
    case "PipePipe":
      return PREC_OR;
    case "AmpAmp":
      return PREC_AND;
    case "EqEq":
    case "BangEq":
    case "Lt":
    case "Gt":
    case "LtEq":
    case "GtEq":
      return PREC_COMPARE;
    case "DotDot":
    case "DotDotEq":
      return PREC_RANGE;
    case "Plus":
    case "Minus":
      return PREC_ADD;
    case "Star":
    case "Slash":
    case "Percent":
    case "PercentSlash":
      return PREC_MUL;
    case "Caret":
    case "StarStar":
      return PREC_EXP;
    case "Dot":
    case "LBracket":
    case "LParen":
    case "ColonColon":
      return PREC_CALL;
    default:
      return PREC_NONE;
  }
}

const GD_ID_KIND_MAP: Record<string, "group" | "color" | "item" | "block"> = {
  g: "group",
  c: "color",
  i: "item",
  b: "block",
};

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  parse(tokens: Token[]): Statement[] {
    this.tokens = tokens;
    this.pos = 0;
    const stmts: Statement[] = [];
    this.skipNewlines();
    while (!this.isAtEnd()) {
      stmts.push(this.parseStatement());
      this.skipStatementEnd();
    }
    return stmts;
  }

  // ─── Statement Dispatch ──────────────────────────────────────────────────

  private parseStatement(): Statement {
    const tok = this.current();

    if (tok.kind === "Arrow") {
      return this.parseArrowStatement();
    }
    if (tok.kind === "Let") {
      return this.parseLetStatement();
    }
    if (tok.kind === "Return") {
      return this.parseReturnStatement();
    }
    if (tok.kind === "Break") {
      this.advance();
      return { kind: "BreakStatement" } satisfies BreakStatement;
    }
    if (tok.kind === "Continue") {
      this.advance();
      return { kind: "ContinueStatement" } satisfies ContinueStatement;
    }
    if (tok.kind === "Throw") {
      return this.parseThrowStatement();
    }
    if (tok.kind === "If") {
      return this.parseIfStatement();
    }
    if (tok.kind === "For") {
      return this.parseForStatement();
    }
    if (tok.kind === "While") {
      return this.parseWhileStatement();
    }
    if (tok.kind === "Extract") {
      return this.parseExtractStatement();
    }
    if (tok.kind === "Type") {
      return this.parseTypeDefinition();
    }
    if (tok.kind === "Impl") {
      return this.parseImplBlock();
    }
    if (tok.kind === "Match") {
      return this.parseMatchStatement();
    }

    // Expression or assignment
    return this.parseExpressionOrAssignment();
  }

  private parseArrowStatement(): ArrowStatement {
    this.expect("Arrow");
    this.skipNewlines();
    const body = this.parseStatement();
    return { kind: "ArrowStatement", body };
  }

  private parseLetStatement(): AssignStatement {
    this.expect("Let");
    const name = this.expect("Identifier").value;
    this.expect("Eq");
    const value = this.parseExpression();
    return {
      kind: "AssignStatement",
      target: { kind: "IdentTarget", name },
      value,
      mutable: true,
    };
  }

  private parseReturnStatement(): ReturnStatement {
    this.expect("Return");
    if (this.isStatementEnd()) {
      return { kind: "ReturnStatement", value: null };
    }
    const value = this.parseExpression();
    return { kind: "ReturnStatement", value };
  }

  private parseThrowStatement(): ThrowStatement {
    this.expect("Throw");
    const value = this.parseExpression();
    return { kind: "ThrowStatement", value };
  }

  private parseIfStatement(): IfStatement {
    this.expect("If");
    const condition = this.parseExpression();
    this.skipNewlines();
    const consequent = this.parseBlock();
    let alternate: Statement[] | null = null;
    this.skipNewlines();
    if (this.current().kind === "Else") {
      this.advance();
      this.skipNewlines();
      if (this.current().kind === "If") {
        alternate = [this.parseIfStatement()];
      } else {
        alternate = this.parseBlock();
      }
    }
    return { kind: "IfStatement", condition, consequent, alternate };
  }

  private parseForStatement(): ForStatement {
    this.expect("For");
    const variable = this.expect("Identifier").value;
    this.expect("In");
    const iterable = this.parseExpression();
    this.skipNewlines();
    const body = this.parseBlock();
    return { kind: "ForStatement", variable, iterable, body };
  }

  private parseWhileStatement(): WhileStatement {
    this.expect("While");
    const condition = this.parseExpression();
    this.skipNewlines();
    const body = this.parseBlock();
    return { kind: "WhileStatement", condition, body };
  }

  private parseExtractStatement(): ExtractStatement {
    this.expect("Extract");
    const value = this.parseExpression();
    return { kind: "ExtractStatement", value };
  }

  private parseTypeDefinition(): TypeDefinition {
    this.expect("Type");
    this.expect("At");
    const name = this.expect("Identifier").value;
    return { kind: "TypeDefinition", name };
  }

  private parseImplBlock(): ImplBlock {
    this.expect("Impl");
    this.expect("At");
    const typeName = this.expect("Identifier").value;
    this.skipNewlines();
    this.expect("LBrace");
    this.skipNewlines();
    const methods: DictEntry[] = [];
    while (this.current().kind !== "RBrace" && !this.isAtEnd()) {
      const key = this.expect("Identifier").value;
      this.expect("Colon");
      const value = this.parseExpression();
      methods.push({ key, value });
      if (this.current().kind === "Comma") this.advance();
      this.skipNewlines();
    }
    this.expect("RBrace");
    return { kind: "ImplBlock", typeName, methods };
  }

  private parseMatchStatement(): MatchStatement {
    this.expect("Match");
    const subject = this.parseExpression();
    this.skipNewlines();
    this.expect("LBrace");
    this.skipNewlines();
    const arms: MatchArm[] = [];
    while (this.current().kind !== "RBrace" && !this.isAtEnd()) {
      arms.push(this.parseMatchArm());
      if (this.current().kind === "Comma") this.advance();
      this.skipNewlines();
    }
    this.expect("RBrace");
    return { kind: "MatchStatement", subject, arms };
  }

  private parseMatchArm(): MatchArm {
    const pattern = this.parseMatchPattern();
    this.expect("FatArrow");
    const body = this.parseMatchBody();
    return { pattern, body };
  }

  private parseMatchPattern(): MatchPattern {
    const tok = this.current();
    // Wildcard: _
    if (tok.kind === "Identifier" && tok.value === "_") {
      this.advance();
      return { kind: "WildcardPattern" };
    }
    // Comparison: == value, != value, > value, etc.
    const compareOps: TokenKind[] = ["EqEq", "BangEq", "Gt", "Lt", "GtEq", "LtEq"];
    if (compareOps.includes(tok.kind)) {
      this.advance();
      const value = this.parseExpression(PREC_COMPARE);
      const op = tokenKindToBinaryOp(tok.kind);
      return { kind: "ComparePattern", operator: op, value };
    }
    // Literal pattern
    const value = this.parseExpression(PREC_COMPARE);
    return { kind: "LiteralPattern", value };
  }

  private parseMatchBody(): Statement[] {
    if (this.current().kind === "LBrace") {
      return this.parseBlock();
    }
    const expr = this.parseExpression();
    return [{ kind: "ExpressionStatement", expression: expr }];
  }

  private parseExpressionOrAssignment(): Statement {
    const expr = this.parseExpression();

    // Arrow macro shorthand: ident => expr  (single-param macro)
    if (expr.kind === "Identifier" && this.current().kind === "FatArrow") {
      this.advance(); // =>
      const body = this.parseExpression();
      const macroExpr: MacroExpression = {
        kind: "MacroExpression",
        params: [{ name: expr.name, defaultValue: null }],
        body,
        isTrigger: false,
      };
      // If next token is assignment this is being assigned, otherwise it's a standalone expression
      return { kind: "ExpressionStatement", expression: macroExpr };
    }

    // Compound assignment: +=, -=, *=, /=, ^=, %=
    const compoundOps: TokenKind[] = [
      "PlusEq",
      "MinusEq",
      "StarEq",
      "SlashEq",
      "CaretEq",
      "PercentEq",
    ];
    if (compoundOps.includes(this.current().kind)) {
      const opTok = this.advance();
      const value = this.parseExpression();
      const target = expressionToTarget(expr, opTok);
      return {
        kind: "CompoundAssignStatement",
        target,
        operator: tokenToCompoundOp(opTok.kind),
        value,
      } satisfies CompoundAssignStatement;
    }

    // Increment / Decrement (postfix)
    if (this.current().kind === "PlusPlus" || this.current().kind === "MinusMinus") {
      const opTok = this.advance();
      const target = expressionToTarget(expr, opTok);
      return {
        kind: "IncrementStatement",
        target,
        operator: opTok.kind === "PlusPlus" ? "++" : "--",
      } satisfies IncrementStatement;
    }

    // Simple assignment: target = expr
    if (this.current().kind === "Eq") {
      const eqTok = this.advance();
      const value = this.parseExpression();
      const target = expressionToTarget(expr, eqTok);
      return {
        kind: "AssignStatement",
        target,
        value,
        mutable: false,
      } satisfies AssignStatement;
    }

    return { kind: "ExpressionStatement", expression: expr };
  }

  // ─── Expressions (Pratt) ─────────────────────────────────────────────────

  parseExpression(minPrec: Precedence = PREC_NONE): Expression {
    let left = this.parsePrimary();

    // Arrow macro shorthand: ident => expr (single-param, no parens)
    if (left.kind === "Identifier" && this.current().kind === "FatArrow" && minPrec === PREC_NONE) {
      this.advance(); // =>
      const body = this.parseExpression();
      return {
        kind: "MacroExpression",
        params: [{ name: left.name, defaultValue: null }],
        body,
        isTrigger: false,
      };
    }

    while (true) {
      const tok = this.current();
      const prec = infixPrecedence(tok.kind);
      if (prec <= minPrec) break;

      // Member access
      if (tok.kind === "Dot") {
        this.advance();
        const prop = this.expect("Identifier").value;
        // Check for call immediately following
        left = { kind: "MemberAccess", object: left, property: prop } satisfies MemberAccess;
        continue;
      }

      // Index access
      if (tok.kind === "LBracket") {
        this.advance();
        const index = this.parseExpression();
        this.expect("RBracket");
        left = { kind: "IndexAccess", object: left, index };
        continue;
      }

      // Call expression
      if (tok.kind === "LParen") {
        this.advance();
        const args = this.parseArgList();
        this.expect("RParen");
        left = { kind: "CallExpression", callee: left, args } satisfies CallExpression;
        continue;
      }

      // Constructor: expr::{ ... }
      if (tok.kind === "ColonColon") {
        this.advance();
        if (this.current().kind === "LBrace") {
          this.advance();
          const fields = this.parseDictEntries();
          this.expect("RBrace");
          left = {
            kind: "ConstructorExpression",
            typeName: left,
            fields,
          } satisfies ConstructorExpression;
          continue;
        }
        // method call shorthand  @Type::method(...)
        const methodName = this.expect("Identifier").value;
        const memberExpr: MemberAccess = {
          kind: "MemberAccess",
          object: left,
          property: methodName,
        };
        if (this.current().kind === "LParen") {
          this.advance();
          const args = this.parseArgList();
          this.expect("RParen");
          left = { kind: "CallExpression", callee: memberExpr, args };
        } else {
          left = memberExpr;
        }
        continue;
      }

      // Binary operators
      this.advance();
      const op = tokenKindToBinaryOp(tok.kind);
      // Right associativity for ** and ^
      const rightPrec = tok.kind === "StarStar" || tok.kind === "Caret" ? prec - 1 : prec;
      const right = this.parseExpression(rightPrec);
      left = { kind: "BinaryExpression", operator: op, left, right };
    }

    return left;
  }

  private parsePrimary(): Expression {
    const tok = this.current();

    switch (tok.kind) {
      case "Number": {
        this.advance();
        return { kind: "NumberLiteral", value: parseFloat(tok.value) };
      }
      case "String": {
        this.advance();
        return { kind: "StringLiteral", value: tok.value };
      }
      case "True": {
        this.advance();
        return { kind: "BoolLiteral", value: true };
      }
      case "False": {
        this.advance();
        return { kind: "BoolLiteral", value: false };
      }
      case "Null": {
        this.advance();
        return { kind: "NullLiteral" };
      }
      case "GdId": {
        this.advance();
        return parseGdId(tok.value);
      }
      case "At": {
        this.advance();
        const name = this.expect("Identifier").value;
        return { kind: "TypeIndicator", name };
      }
      case "Identifier":
      case "Self": {
        this.advance();
        return { kind: "Identifier", name: tok.value };
      }
      case "Minus": {
        this.advance();
        const operand = this.parseExpression(PREC_UNARY);
        return { kind: "UnaryExpression", operator: tok.value as UnaryOperator, operand };
      }
      case "Bang": {
        this.advance();
        // Trigger macro: !{ body }
        if (this.current().kind === "LBrace") {
          this.advance();
          const body = this.parseBlockBody();
          this.expect("RBrace");
          return { kind: "MacroExpression", params: [], body, isTrigger: true };
        }
        // Unary logical not: !expr
        const operand = this.parseExpression(PREC_UNARY);
        return { kind: "UnaryExpression", operator: "!" as UnaryOperator, operand };
      }
      case "PlusPlus":
      case "MinusMinus": {
        this.advance();
        const operand = this.parseExpression(PREC_UNARY);
        return { kind: "UnaryExpression", operator: tok.value as UnaryOperator, operand };
      }
      case "LParen": {
        return this.parseParenOrMacro();
      }
      case "LBracket": {
        return this.parseArrayOrComprehension();
      }
      case "LBrace": {
        return this.parseDictLiteral();
      }
      case "Obj": {
        this.advance();
        this.expect("LBrace");
        const entries = this.parseDictEntries();
        this.expect("RBrace");
        return { kind: "ObjectExpression", properties: entries };
      }
      default:
        throw new ParseError(`Unexpected token ${tok.kind} ('${tok.value}')`, tok.line, tok.column);
    }
  }

  /** Parses (params) { body } macros or (expr) grouping */
  private parseParenOrMacro(): Expression {
    const savedPos = this.pos;
    // Try to parse as macro: look for ) { or ) => pattern
    try {
      this.expect("LParen");
      const params = this.tryParseMacroParams();
      if (params !== null && this.current().kind === "RParen") {
        this.advance(); // )
        // Arrow macro: params => expr
        if (this.current().kind === "FatArrow") {
          this.advance();
          const expr = this.parseExpression();
          return { kind: "MacroExpression", params, body: expr, isTrigger: false };
        }
        // Block macro: params { body }
        if (this.current().kind === "LBrace") {
          this.advance();
          const body = this.parseBlockBody();
          this.expect("RBrace");
          return { kind: "MacroExpression", params, body, isTrigger: false };
        }
      }
    } catch (err) {
      if (!(err instanceof ParseError)) throw err;
      // ParseError during speculative parse — fall through to grouped expression
    }

    // Restore and parse as grouped expression
    this.pos = savedPos;
    this.expect("LParen");
    const expr = this.parseExpression();
    this.expect("RParen");

    // Arrow shorthand: ident => expr (single param without parens handled in identifier path)
    // Here we handle: (x) => expr as a macro
    if (this.current().kind === "FatArrow") {
      this.advance();
      const body = this.parseExpression();
      const param: MacroParam = {
        name: expr.kind === "Identifier" ? expr.name : "__arg",
        defaultValue: null,
      };
      return { kind: "MacroExpression", params: [param], body, isTrigger: false };
    }

    return expr;
  }

  /** Returns true if the current token can be used as a parameter name */
  private isParamName(): boolean {
    const kind = this.current().kind;
    // Allow `self` (and any identifier) as parameter names
    return kind === "Identifier" || kind === "Self";
  }

  /** Try to parse comma-separated macro parameters. Returns null if not parseable as params. */
  private tryParseMacroParams(): MacroParam[] | null {
    const params: MacroParam[] = [];
    // Empty params
    if (this.current().kind === "RParen") return params;

    while (true) {
      if (!this.isParamName()) return null;
      const name = this.advance().value;
      let defaultValue: Expression | null = null;
      if (this.current().kind === "Eq") {
        this.advance();
        defaultValue = this.parseExpression(PREC_ASSIGN);
      }
      params.push({ name, defaultValue });
      if (this.current().kind === "Comma") {
        this.advance();
      } else {
        break;
      }
    }
    return params;
  }

  private parseArrayOrComprehension(): Expression {
    this.expect("LBracket");
    this.skipNewlines();

    if (this.current().kind === "RBracket") {
      this.advance();
      return { kind: "ArrayLiteral", elements: [] };
    }

    const first = this.parseExpression();

    // List comprehension: [expr for x in iter (if cond)?]
    if (this.current().kind === "For") {
      this.advance();
      const variable = this.expect("Identifier").value;
      this.expect("In");
      const iterable = this.parseExpression();
      let condition: Expression | null = null;
      if (this.current().kind === "If") {
        this.advance();
        condition = this.parseExpression();
      }
      this.expect("RBracket");
      return { kind: "ListComprehension", expression: first, variable, iterable, condition };
    }

    // Regular array
    const elements: Expression[] = [first];
    while (this.current().kind === "Comma") {
      this.advance();
      this.skipNewlines();
      if (this.current().kind === "RBracket") break;
      elements.push(this.parseExpression());
    }
    this.skipNewlines();
    this.expect("RBracket");
    return { kind: "ArrayLiteral", elements };
  }

  private parseDictLiteral(): Expression {
    this.expect("LBrace");
    this.skipNewlines();
    const entries = this.parseDictEntries();
    this.expect("RBrace");
    return { kind: "DictLiteral", entries };
  }

  private parseDictEntries(): DictEntry[] {
    const entries: DictEntry[] = [];
    while (this.current().kind !== "RBrace" && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.current().kind === "RBrace") break;
      const key = this.expect("Identifier").value;
      this.expect("Colon");
      const value = this.parseExpression();
      entries.push({ key, value });
      if (this.current().kind === "Comma") this.advance();
      this.skipNewlines();
    }
    return entries;
  }

  private parseArgList(): Argument[] {
    const args: Argument[] = [];
    if (this.current().kind === "RParen") return args;

    while (true) {
      // Named argument: name: value
      if (this.current().kind === "Identifier" && this.peek(1).kind === "Colon") {
        const name = this.advance().value;
        this.advance(); // :
        const value = this.parseExpression();
        args.push({ name, value });
      } else {
        const value = this.parseExpression();
        args.push({ name: null, value });
      }
      if (this.current().kind === "Comma") {
        this.advance();
      } else {
        break;
      }
    }
    return args;
  }

  // ─── Block Parsing ────────────────────────────────────────────────────────

  private parseBlock(): Statement[] {
    this.expect("LBrace");
    const body = this.parseBlockBody();
    this.expect("RBrace");
    return body;
  }

  private parseBlockBody(): Statement[] {
    const stmts: Statement[] = [];
    this.skipNewlines();
    while (this.current().kind !== "RBrace" && !this.isAtEnd()) {
      stmts.push(this.parseStatement());
      this.skipStatementEnd();
    }
    return stmts;
  }

  // ─── Token Utilities ──────────────────────────────────────────────────────

  private current(): Token {
    return this.tokens[this.pos] ?? { kind: "EOF", value: "", line: 0, column: 0 };
  }

  private peek(offset: number): Token {
    return this.tokens[this.pos + offset] ?? { kind: "EOF", value: "", line: 0, column: 0 };
  }

  private advance(): Token {
    const tok = this.current();
    if (tok.kind !== "EOF") this.pos++;
    return tok;
  }

  private expect(kind: TokenKind): Token {
    const tok = this.current();
    if (tok.kind !== kind) {
      throw new ParseError(
        `Expected ${kind}, got ${tok.kind} ('${tok.value}')`,
        tok.line,
        tok.column,
      );
    }
    return this.advance();
  }

  private isAtEnd(): boolean {
    return this.current().kind === "EOF";
  }

  private isStatementEnd(): boolean {
    const k = this.current().kind;
    return k === "Newline" || k === "Semicolon" || k === "EOF" || k === "RBrace";
  }

  private skipNewlines(): void {
    while (this.current().kind === "Newline") this.advance();
  }

  private skipStatementEnd(): void {
    while (this.current().kind === "Newline" || this.current().kind === "Semicolon") {
      this.advance();
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tokenKindToBinaryOp(kind: TokenKind): BinaryOperator {
  const map: Partial<Record<TokenKind, BinaryOperator>> = {
    Plus: "+",
    Minus: "-",
    Star: "*",
    Slash: "/",
    Percent: "%",
    Caret: "^",
    StarStar: "**",
    PercentSlash: "/%",
    EqEq: "==",
    BangEq: "!=",
    Gt: ">",
    Lt: "<",
    GtEq: ">=",
    LtEq: "<=",
    AmpAmp: "&&",
    PipePipe: "||",
    DotDot: "..",
    DotDotEq: "..=",
  };
  const op = map[kind];
  if (op === undefined) {
    throw new ParseError(`Not a binary operator: ${kind}`, 0, 0);
  }
  return op;
}

function tokenToCompoundOp(kind: TokenKind): CompoundOperator {
  const map: Partial<Record<TokenKind, CompoundOperator>> = {
    PlusEq: "+=",
    MinusEq: "-=",
    StarEq: "*=",
    SlashEq: "/=",
    CaretEq: "^=",
    PercentEq: "%=",
  };
  const op = map[kind];
  if (op === undefined) throw new ParseError(`Not a compound op: ${kind}`, 0, 0);
  return op;
}

function expressionToTarget(expr: Expression, tok: Token): AssignTarget {
  if (expr.kind === "Identifier") {
    return { kind: "IdentTarget", name: expr.name };
  }
  if (expr.kind === "MemberAccess") {
    return { kind: "MemberTarget", object: expr.object, property: expr.property };
  }
  if (expr.kind === "IndexAccess") {
    return { kind: "IndexTarget", object: expr.object, index: expr.index };
  }
  throw new ParseError(`Invalid assignment target`, tok.line, tok.column);
}

function parseGdId(raw: string): GdIdLiteral {
  const suffix = raw[raw.length - 1] ?? "";
  const idKind = GD_ID_KIND_MAP[suffix];
  if (idKind === undefined) {
    throw new ParseError(`Unknown GD ID suffix: ${suffix}`, 0, 0);
  }
  if (raw.startsWith("?")) {
    return { kind: "GdIdLiteral", idKind, value: null };
  }
  return { kind: "GdIdLiteral", idKind, value: parseInt(raw.slice(0, -1), 10) };
}
