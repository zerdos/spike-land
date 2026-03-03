/**
 * Schema DSL for defining block storage tables.
 *
 * Generates SQL DDL for D1 and object store configs for IDB.
 */

/** Column type definitions */
export type ColumnType = "string" | "number" | "boolean" | "u64";

/** Column definition builder */
export interface ColumnDef {
  type: ColumnType;
  primary: boolean;
  optional: boolean;
  enumValues?: string[];
}

/** Fluent column builder */
export interface ColumnBuilder {
  /** Mark this column as the primary key */
  primaryKey(): ColumnBuilder;
  /** Mark this column as optional (nullable) */
  optional(): ColumnBuilder;
  /** Get the final column definition */
  _def: ColumnDef;
}

/** Table definition */
export interface TableDef {
  name: string;
  columns: Record<string, ColumnDef>;
}

/** Schema definition — a collection of tables */
export type SchemaDef = Record<string, TableDef>;

function createColumnBuilder(type: ColumnType, enumValues?: string[]): ColumnBuilder {
  const def: ColumnDef = { type, primary: false, optional: false, enumValues };
  const builder: ColumnBuilder = {
    primaryKey() {
      def.primary = true;
      return builder;
    },
    optional() {
      def.optional = true;
      return builder;
    },
    _def: def,
  };
  // Make _def always return current state
  Object.defineProperty(builder, "_def", { get: () => def });
  return builder;
}

/** Column type factories — the `t` namespace passed to defineTable */
export const t = {
  string: () => createColumnBuilder("string"),
  number: () => createColumnBuilder("number"),
  boolean: () => createColumnBuilder("boolean"),
  u64: () => createColumnBuilder("u64"),
  enum: (values: string[]) => createColumnBuilder("string", values),
};

/** Define a table with a name and column schema */
export function defineTable(
  name: string,
  columns: Record<string, ColumnBuilder>,
): TableDef {
  const resolvedColumns: Record<string, ColumnDef> = {};
  for (const [key, builder] of Object.entries(columns)) {
    resolvedColumns[key] = builder._def;
  }
  return { name, columns: resolvedColumns };
}

/** Map ColumnType to SQL type */
function toSQLType(col: ColumnDef): string {
  switch (col.type) {
    case "string":
      return "TEXT";
    case "number":
    case "u64":
      return "INTEGER";
    case "boolean":
      return "INTEGER"; // 0/1
    default:
      return "TEXT";
  }
}

/** Generate CREATE TABLE SQL from a TableDef */
export function tableToSQL(table: TableDef): string {
  const cols: string[] = [];
  for (const [name, def] of Object.entries(table.columns)) {
    let line = `  ${name} ${toSQLType(def)}`;
    if (def.primary) line += " PRIMARY KEY";
    if (!def.optional && !def.primary) line += " NOT NULL";
    cols.push(line);
  }
  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${cols.join(",\n")}\n)`;
}

/** Generate all CREATE TABLE statements for a schema */
export function schemaToSQL(schema: SchemaDef): string[] {
  return Object.values(schema).map(tableToSQL);
}

/** Extract table names from a schema (for IDB object store creation) */
export function schemaTableNames(schema: SchemaDef): string[] {
  return Object.values(schema).map((t) => t.name);
}
