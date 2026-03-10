import { Plus, Trash2 } from "lucide-react";
import type { FieldSpec } from "../../../core-logic/derive-surface";
import { FieldRenderer } from "./FieldRenderer";
import { formatIdentifier } from "./formatting";

interface ArrayFieldProps {
  fields: FieldSpec[];
  value: Record<string, unknown>[];
  onChange: (value: unknown) => void;
}

export function ArrayField({ fields, value, onChange }: ArrayFieldProps) {
  const addRow = () => {
    const empty: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.inputType === "boolean") empty[f.name] = false;
      else if (f.inputType === "number") empty[f.name] = 0;
      else empty[f.name] = "";
    }
    onChange([...value, empty]);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, key: string, val: unknown) => {
    const updated = value.map((row, i) => (i === index ? { ...row, [key]: val } : row));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {value.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="relative space-y-3 rounded-2xl border border-border/60 bg-muted/25 p-4"
        >
          <button
            type="button"
            onClick={() => removeRow(rowIndex)}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {formatIdentifier(field.name)}
              </label>
              <FieldRenderer
                field={field}
                value={row[field.name]}
                onChange={(val) => updateRow(rowIndex, field.name, val)}
              />
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  );
}
