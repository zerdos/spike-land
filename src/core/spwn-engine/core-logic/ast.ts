/**
 * SPWN Abstract Syntax Tree Node Types
 *
 * Discriminated unions for every node kind produced by the parser.
 * Expressions produce a value; Statements produce side effects.
 */

// ─── Literals ────────────────────────────────────────────────────────────────

export interface NumberLiteral {
  kind: "NumberLiteral";
  value: number;
}

export interface StringLiteral {
  kind: "StringLiteral";
  value: string;
}

export interface BoolLiteral {
  kind: "BoolLiteral";
  value: boolean;
}

export interface NullLiteral {
  kind: "NullLiteral";
}

export interface ArrayLiteral {
  kind: "ArrayLiteral";
  elements: Expression[];
}

export interface DictEntry {
  key: string;
  value: Expression;
}

export interface DictLiteral {
  kind: "DictLiteral";
  entries: DictEntry[];
}

/** GD ID literals: 10g, ?g, 10c, ?c, 10i, ?i, 10b, ?b */
export interface GdIdLiteral {
  kind: "GdIdLiteral";
  idKind: "group" | "color" | "item" | "block";
  value: number | null; // null means auto (?g)
}

/** Type indicator: @typename */
export interface TypeIndicator {
  kind: "TypeIndicator";
  name: string;
}

// ─── Complex Expressions ──────────────────────────────────────────────────────

export interface Identifier {
  kind: "Identifier";
  name: string;
}

export interface BinaryExpression {
  kind: "BinaryExpression";
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "^"
  | "**"
  | "/%"
  | "=="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "&&"
  | "||"
  | ".."
  | "..=";

export interface UnaryExpression {
  kind: "UnaryExpression";
  operator: UnaryOperator;
  operand: Expression;
}

export type UnaryOperator = "-" | "!" | "++" | "--";

export interface MemberAccess {
  kind: "MemberAccess";
  object: Expression;
  property: string;
}

export interface IndexAccess {
  kind: "IndexAccess";
  object: Expression;
  index: Expression;
}

export interface CallExpression {
  kind: "CallExpression";
  callee: Expression;
  args: Argument[];
}

export interface Argument {
  name: string | null; // named arg: name: value
  value: Expression;
}

/** Constructor call: @TypeName::{ k: v, ... } or expr::{ k: v } */
export interface ConstructorExpression {
  kind: "ConstructorExpression";
  typeName: Expression;
  fields: DictEntry[];
}

/** Macro (anonymous function): (params) { body } or param => expr */
export interface MacroExpression {
  kind: "MacroExpression";
  params: MacroParam[];
  body: Statement[] | Expression; // block body OR single expression (arrow)
  isTrigger: boolean; // !{ ... } syntax
}

export interface MacroParam {
  name: string;
  defaultValue: Expression | null;
}

/** List comprehension: [expr for x in iter] or [expr for x in iter if cond] */
export interface ListComprehension {
  kind: "ListComprehension";
  expression: Expression;
  variable: string;
  iterable: Expression;
  condition: Expression | null;
}

/** GD Object literal: obj { prop: value, ... } */
export interface ObjectExpression {
  kind: "ObjectExpression";
  properties: DictEntry[];
}

/** Trigger-function call using `!` suffix: func! */
export interface TriggerCall {
  kind: "TriggerCall";
  callee: Expression;
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | BoolLiteral
  | NullLiteral
  | ArrayLiteral
  | DictLiteral
  | GdIdLiteral
  | TypeIndicator
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | MemberAccess
  | IndexAccess
  | CallExpression
  | ConstructorExpression
  | MacroExpression
  | ListComprehension
  | ObjectExpression
  | TriggerCall;

// ─── Statements ───────────────────────────────────────────────────────────────

export interface AssignStatement {
  kind: "AssignStatement";
  target: AssignTarget;
  value: Expression;
  mutable: boolean; // let x = ...  vs  x = ...
}

export interface CompoundAssignStatement {
  kind: "CompoundAssignStatement";
  target: AssignTarget;
  operator: CompoundOperator;
  value: Expression;
}

export type CompoundOperator = "+=" | "-=" | "*=" | "/=" | "^=" | "%=";

/** Target of an assignment: bare identifier, member, or index */
export type AssignTarget =
  | { kind: "IdentTarget"; name: string }
  | { kind: "MemberTarget"; object: Expression; property: string }
  | { kind: "IndexTarget"; object: Expression; index: Expression };

export interface IncrementStatement {
  kind: "IncrementStatement";
  target: AssignTarget;
  operator: "++" | "--";
}

export interface ExpressionStatement {
  kind: "ExpressionStatement";
  expression: Expression;
}

export interface ReturnStatement {
  kind: "ReturnStatement";
  value: Expression | null;
}

export interface BreakStatement {
  kind: "BreakStatement";
}

export interface ContinueStatement {
  kind: "ContinueStatement";
}

export interface ThrowStatement {
  kind: "ThrowStatement";
  value: Expression;
}

export interface IfStatement {
  kind: "IfStatement";
  condition: Expression;
  consequent: Statement[];
  alternate: Statement[] | null;
}

export interface ForStatement {
  kind: "ForStatement";
  variable: string;
  iterable: Expression;
  body: Statement[];
}

export interface WhileStatement {
  kind: "WhileStatement";
  condition: Expression;
  body: Statement[];
}

export interface ExtractStatement {
  kind: "ExtractStatement";
  value: Expression;
}

export interface TypeDefinition {
  kind: "TypeDefinition";
  name: string;
}

export interface ImplBlock {
  kind: "ImplBlock";
  typeName: string;
  methods: DictEntry[];
}

export interface MatchArm {
  pattern: MatchPattern;
  body: Statement[];
}

export type MatchPattern =
  | { kind: "WildcardPattern" }
  | { kind: "ComparePattern"; operator: BinaryOperator; value: Expression }
  | { kind: "LiteralPattern"; value: Expression };

export interface MatchStatement {
  kind: "MatchStatement";
  subject: Expression;
  arms: MatchArm[];
}

/** Arrow statement: -> stmt (fire and forget) */
export interface ArrowStatement {
  kind: "ArrowStatement";
  body: Statement;
}

export type Statement =
  | AssignStatement
  | CompoundAssignStatement
  | IncrementStatement
  | ExpressionStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | ThrowStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | ExtractStatement
  | TypeDefinition
  | ImplBlock
  | MatchStatement
  | ArrowStatement;
