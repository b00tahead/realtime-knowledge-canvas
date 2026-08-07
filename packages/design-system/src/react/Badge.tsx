import { cn } from "../cn.js";
import type { BadgeProps } from "./types.js";

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span className={cn("rkc-badge", `rkc-badge--${tone}`, className)}>
      {dot ? <span className="rkc-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
