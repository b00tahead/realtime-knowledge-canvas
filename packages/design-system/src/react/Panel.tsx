import { cn } from "../cn.js";
import type { PanelProps } from "./types.js";

export function Panel({
  title,
  headerEnd,
  footer,
  children,
  className,
  labelledBy,
  label,
}: PanelProps) {
  return (
    <aside
      className={cn("rkc-panel", className)}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      {title || headerEnd ? (
        <div className="rkc-panel__header">
          {title ? <h2 className="rkc-panel__title">{title}</h2> : <span />}
          {headerEnd}
        </div>
      ) : null}
      <div className="rkc-panel__body">{children}</div>
      {footer ? <div className="rkc-panel__footer">{footer}</div> : null}
    </aside>
  );
}
