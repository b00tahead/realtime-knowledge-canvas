import { useEffect, useRef, useState } from "react";
import {
  CanvasEngine,
  PAINT_BUDGET_MS,
  createStressRects,
  type EngineStats,
} from "@rkc/canvas-engine";
import type { CanvasDocument } from "@rkc/object-model";
import styles from "./CanvasHost.module.scss";

export interface CanvasHostProps {
  document: CanvasDocument;
  /** When set, replaces document rects with a stress grid of this size. */
  stressCount?: number | null;
  className?: string;
  onSelect?: (id: string | null) => void;
  onStats?: (stats: EngineStats) => void;
}

export function CanvasHost({
  document,
  stressCount = null,
  className,
  onSelect,
  onStats,
}: CanvasHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks without re-creating the engine
  const onSelectRef = useRef(onSelect);
  const onStatsRef = useRef(onStats);
  onSelectRef.current = onSelect;
  onStatsRef.current = onStats;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let engine: CanvasEngine;
    try {
      engine = new CanvasEngine({
        container: el,
        onStats: (s) => {
          setStats(s);
          onStatsRef.current?.(s);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start canvas");
      return;
    }

    engine.setOnSelect((id) => onSelectRef.current?.(id));
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (stressCount && stressCount > 0) {
      engine.setRects(createStressRects(stressCount));
    } else {
      engine.setDocument(document);
    }
  }, [document, stressCount]);

  return (
    <div className={`${styles.host} ${className ?? ""}`.trim()}>
      <div ref={containerRef} className={styles.viewport} />
      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}
      {stats ? (
        <div className={styles.hud} aria-live="polite">
          <span
            className={
              stats.withinBudget ? styles.hudOk : styles.hudWarn
            }
            title={`Budget ${PAINT_BUDGET_MS}ms`}
          >
            paint {stats.lastPaintMs.toFixed(2)}ms
            {stats.avgPaintMs ? ` · avg ${stats.avgPaintMs.toFixed(2)}ms` : ""}
          </span>
          <span>
            {stats.visibleCount}/{stats.objectCount} objs
          </span>
          <span>{stats.fps ? `${stats.fps.toFixed(0)} fps` : "— fps"}</span>
        </div>
      ) : null}
      <p className={styles.hint}>
        Scroll to zoom · Space-drag or middle-mouse to pan · Click a card to
        select
      </p>
    </div>
  );
}
