import type { LiveRegionProps } from "./types.js";

export function LiveRegion({
  children,
  atomic = true,
  politeness = "polite",
}: LiveRegionProps) {
  return (
    <div
      className="rkc-live-region"
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
    >
      {children}
    </div>
  );
}
