import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CanvasEngine,
  PAINT_BUDGET_MS,
  type CanvasSurface,
  type EngineStats,
  type EngineTool,
  type ScreenRect,
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
  /** When set, shows an in-place text editor over this note. */
  editingId?: string | null;
  editingText?: string;
  /** Matches app theme so ink/fills read correctly. */
  surface?: CanvasSurface;
  className?: string;
  onSelect?: (id: string | null) => void;
  onStats?: (stats: EngineStats) => void;
  onTransformEnd?: (id: string, position: WorldPoint) => void;
  onEditRequest?: (id: string) => void;
  onEditTextChange?: (text: string) => void;
  onEditCommit?: () => void;
  onEditCancel?: () => void;
  onPlace?: (world: WorldPoint) => void;
  onDeleteRequest?: (id: string) => void;
  onToolChange?: (tool: EngineTool) => void;
}

export function CanvasHost({
  document,
  stressCount = null,
  tool = "select",
  selectedId = null,
  editingId = null,
  editingText = "",
  surface = "dark",
  className,
  onSelect,
  onStats,
  onTransformEnd,
  onEditRequest,
  onEditTextChange,
  onEditCommit,
  onEditCancel,
  onPlace,
  onDeleteRequest,
  onToolChange,
}: CanvasHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorBox, setEditorBox] = useState<ScreenRect | null>(null);

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
        surface,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setSurface(surface);
  }, [surface]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (stressCount && stressCount > 0) {
      engine.setStress(stressCount);
    } else {
      engine.setDocument(document);
    }
  }, [document, stressCount, surface]);

  useEffect(() => {
    engineRef.current?.setTool(tool);
  }, [tool]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.getSelectedId() !== selectedId) {
      engine.setSelectedId(selectedId);
    }
  }, [selectedId]);

  // Position the in-place editor over the note
  useLayoutEffect(() => {
    if (!editingId) {
      setEditorBox(null);
      return;
    }
    const engine = engineRef.current;
    if (!engine) return;

    const update = () => {
      const box = engine.getObjectScreenRect(editingId);
      setEditorBox(box);
    };
    update();

    // Keep editor aligned while camera may still settle after select
    const id = window.setInterval(update, 100);
    return () => window.clearInterval(id);
  }, [editingId, document, stats?.lastPaintMs]);

  useEffect(() => {
    if (!editingId || !editorBox) return;
    const el = editorRef.current;
    if (!el) return;
    // Focus after mount — double rAF beats layout of absolutely positioned editor
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.focus();
        el.select();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [editingId, editorBox?.x, editorBox?.y]);

  const hint =
    tool === "note"
      ? "Click empty canvas to place a note · Esc for select · Space-drag to pan"
      : editingId
        ? "Editing note · Esc cancel · blur or ⌘/Ctrl+Enter to save"
        : "Scroll zoom · Space/middle-mouse pan · Drag notes · Double-click to edit · Del to delete";

  return (
    <div
      className={`${styles.host} ${className ?? ""}`.trim()}
      data-surface={surface}
    >
      <div ref={containerRef} className={styles.viewport} />
      {editingId && editorBox ? (
        <textarea
          ref={editorRef}
          className={styles.inlineEditor}
          style={{
            left: editorBox.x,
            top: editorBox.y,
            width: Math.max(80, editorBox.w),
            height: Math.max(48, editorBox.h),
          }}
          value={editingText}
          onChange={(e) => onEditTextChange?.(e.target.value)}
          onBlur={() => onEditCommit?.()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onEditCancel?.();
              return;
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onEditCommit?.();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Edit note text"
        />
      ) : null}
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
