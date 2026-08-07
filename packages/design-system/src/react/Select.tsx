import { useId } from "react";
import { cn } from "../cn.js";
import type { SelectProps } from "./types.js";

export function Select({
  label,
  options,
  hideLabel = false,
  className,
  id,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={cn("rkc-field", className)}>
      {label ? (
        <label
          className={cn("rkc-field__label", hideLabel && "rkc-sr-only")}
          htmlFor={selectId}
        >
          {label}
        </label>
      ) : null}
      <select id={selectId} className="rkc-select" {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
