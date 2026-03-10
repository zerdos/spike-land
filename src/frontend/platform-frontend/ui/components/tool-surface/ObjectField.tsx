import type { FieldSpec } from "../../../core-logic/derive-surface";
import { FieldRenderer } from "./FieldRenderer";
import { formatIdentifier } from "./formatting";

interface ObjectFieldProps {
  fields: FieldSpec[];
  value: Record<string, unknown>;
  onChange: (value: unknown) => void;
}

export function ObjectField({ fields, value, onChange }: ObjectFieldProps) {
  const handleChange = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/25 p-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label htmlFor={field.name} className="block text-xs font-semibold text-foreground">
            {formatIdentifier(field.name)}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {field.description && (
            <p className="text-[11px] leading-5 text-muted-foreground">{field.description}</p>
          )}
          <FieldRenderer
            field={field}
            value={value[field.name]}
            onChange={(val) => handleChange(field.name, val)}
          />
        </div>
      ))}
    </div>
  );
}
