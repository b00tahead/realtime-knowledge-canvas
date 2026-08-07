import { useEffect, useRef, useState } from "react";
import {
  CanvasEngine,
  PAINT_BUDGET_MS,
  createStressRects,
  type EngineStats,
  type EngineTool,
  type WorldPoint,
} from "@rkc/canvas-engine";
import type { CanvasDocument } from "@rkc/object-model";
import styles from "./CanvasHost.module.scss";

export interface CanvasHostProps {
  document: CanvasDocument;
  /** When set, replaces document rects with a stress grid of this size. */
  stressCount?: number | null;
  tool?: EngineTool;
  selectedId?: string | null;
  className?: string;
  onSelect?: (id: string | null) => void;
  onStats?: (stats: EngineStats) => void;
  onTransformEnd?: (id: string, position: WorldPoint) => void;
  onEditRequest?: (id: string) => void;
  onPlace?: (world: WorldPoint) => void;
  onDeleteRequest?: (id: string) => void;
  onToolChange?: (tool: EngineTool) => void;
}

export function CanvasHost({
  document,
  stressCount = null,
  tool = "select",
  selectedId = null,
  className,
  onSelect,
  onStats,
  onTransformEnd,
  onEditRequest,
  onPlace,
  onDeleteRequest,
  onToolChange,
}: CanvasHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks without re-creating the engine
  const onSelectRef = useRef(onSelect);
  const onStatsRef = useRef(onStats);
  const onTransformEndRef = useRef(onTransformEnd);
  const onEditRequestRef = useRef(onEditRequest);
  const onPlaceRef = useRef(onPlace);
  const onDeleteRequestRef = useRef(onDeleteRequest);
  const onToolChangeRef = useRef(onToolChange);
  onSelectRef.current = onSelect;
  onStatsRef.current = onStats;
  onTransformEndRef.current = onTransformEnd;
  onEditRequestRef.current = onEditRequest;
  onPlaceRef.current = onPlace;
  onDeleteRequestRef.current = onDeleteRequest;
  onToolChangeRef.current = onToolChange;

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
    engine.setOnTransformEnd((id, pos) =>
      onTransformEndRef.current?.(id, pos),
    );
    engine.setOnEditRequest((id) => onEditRequestRef.current?.(id));
    engine.setOnPlace((world) => onPlaceRef.current?.(world));
    engine.setOnDeleteRequest((id) => onDeleteRequestRef.current?.(id));
    engine.setOnToolChange((next) => onToolChangeRef.current?.(next));
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

  useEffect(() => {
    engineRef.current?.setTool(tool);
  }, [tool]);

  useEffect(() => {
    // Keep engine selection in sync when app changes it (delete, reset, etc.)
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.getSelectedId() !== selectedId) {
      engine.setSelectedId(selectedId);
    }
  }, [selectedId]);

  const hint =
    tool === "note"
      ? "Click empty canvas to place a note · Esc for select · Space-drag to pan"
      : "Scroll zoom · Space/middle-mouse pan · Drag notes · Double-click to edit · Del to delete";

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
      <p className={styles.hint}>{hint}</p>
    </div>
  );
}
