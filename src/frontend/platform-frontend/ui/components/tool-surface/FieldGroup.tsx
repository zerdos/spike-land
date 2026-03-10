import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FieldSpec } from "../../../core-logic/derive-surface";
import { FieldRenderer } from "./FieldRenderer";
import { formatIdentifier } from "./formatting";

interface FieldGroupProps {
  label: string;
  fields: FieldSpec[];
  formData: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  defaultCollapsed?: boolean;
}

export function FieldGroup({
  label,
  fields,
  formData,
  onChange,
  defaultCollapsed = false,
}: FieldGroupProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        {label}
        <span className="text-[10px] font-normal normal-case tracking-normal">
          ({fields.length} field{fields.length !== 1 ? "s" : ""})
        </span>
      </button>

      {!collapsed && (
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={`space-y-2 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm shadow-black/[0.03] ${
                field.inputType === "textarea" ||
                field.inputType === "array" ||
                field.inputType === "object"
                  ? "md:col-span-2"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <label
                  htmlFor={field.name}
                  className="block text-sm font-semibold tracking-[-0.02em] text-foreground"
                >
                  {formatIdentifier(field.name)}
                </label>
                {field.required && (
                  <span className="rubik-chip px-2 py-0.5 text-[10px] text-primary bg-primary/10 border-primary/15">
                    Required
                  </span>
                )}
              </div>
              {field.description && (
                <p className="text-xs leading-5 text-muted-foreground">{field.description}</p>
              )}
              <FieldRenderer
                field={field}
                value={formData[field.name]}
                onChange={(val) => onChange(field.name, val)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
