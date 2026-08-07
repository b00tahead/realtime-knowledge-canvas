import { cn } from "../cn.js";
import type { ToolbarProps } from "./types.js";

export function Toolbar({
  title,
  subtitle,
  logo = "◇",
  end,
  className,
}: ToolbarProps) {
  return (
    <header className={cn("rkc-toolbar", className)} role="banner">
      <div className="rkc-toolbar__start">
        <div className="rkc-toolbar__brand">
          <span className="rkc-toolbar__logo" aria-hidden="true">
            {logo}
          </span>
          <div>
            <h1 className="rkc-toolbar__title">{title}</h1>
            {subtitle ? (
              <p className="rkc-toolbar__subtitle">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      {end ? <div className="rkc-toolbar__end">{end}</div> : null}
    </header>
  );
}
