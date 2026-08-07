import { cn } from "../cn.js";
import type { ButtonProps } from "./types.js";

export function Button({
  variant = "secondary",
  iconOnly = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "rkc-button",
        `rkc-button--${variant}`,
        iconOnly && "rkc-button--icon",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
