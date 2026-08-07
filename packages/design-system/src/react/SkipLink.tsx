import type { SkipLinkProps } from "./types.js";

export function SkipLink({
  href = "#main",
  children = "Skip to canvas",
}: SkipLinkProps) {
  return (
    <a className="rkc-skip-link" href={href}>
      {children}
    </a>
  );
}
