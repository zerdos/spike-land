import { type ChangeEvent } from "react";
import { ChevronDown } from "lucide-react";
import type { FieldSpec } from "../../../core-logic/derive-surface";
import { ArrayField } from "./ArrayField";
import { ObjectField } from "./ObjectField";
import { formatValueLabel } from "./formatting";

interface FieldRendererProps {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const inputClasses =
    "block w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm transition outline-none placeholder:text-muted-foreground/75 focus:border-primary/45 focus:ring-4 focus:ring-primary/10";
  const placeholder = field.description.length <= 72 ? field.description : undefined;

  if (field.inputType === "hidden") return null;

  if (field.inputType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={field.name}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-4 focus:ring-primary/10"
        />
        <label htmlFor={field.name} className="text-sm text-muted-foreground">
          Enable
        </label>
      </div>
    );
  }

  if (field.inputType === "enum" && field.enumValues) {
    return (
      <div className="relative">
        <select
          id={field.name}
          value={(value as string) ?? ""}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          required={field.required}
          className={`${inputClasses} appearance-none pr-10`}
        >
          {field.enumValues.map((opt) => (
            <option key={opt} value={opt}>
              {formatValueLabel(opt)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }

  if (field.inputType === "number") {
    return (
      <input
        id={field.name}
        type="number"
        value={(value as number) ?? ""}
        min={field.constraints?.min}
        max={field.constraints?.max}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        placeholder={placeholder}
        required={field.required}
        className={inputClasses}
      />
    );
  }

  if (field.inputType === "textarea") {
    return (
      <textarea
        id={field.name}
        rows={4}
        value={(value as string) ?? ""}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={field.required}
        className={`${inputClasses} min-h-32 resize-y`}
      />
    );
  }

  if (field.inputType === "object" && field.nested) {
    return (
      <ObjectField
        fields={field.nested}
        value={(value as Record<string, unknown>) ?? {}}
        onChange={onChange}
      />
    );
  }

  if (field.inputType === "array" && field.nested) {
    return (
      <ArrayField
        fields={field.nested}
        value={(value as Record<string, unknown>[]) ?? []}
        onChange={onChange}
      />
    );
  }

  // Default: text/email/url/date
  const typeMap: Record<string, string> = {
    email: "email",
    url: "url",
    date: "date",
    text: "text",
  };

  return (
    <input
      id={field.name}
      type={typeMap[field.inputType] ?? "text"}
      value={(value as string) ?? ""}
      maxLength={field.constraints?.maxLength}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      required={field.required}
      className={inputClasses}
    />
  );
}
