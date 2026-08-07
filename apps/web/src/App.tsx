import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  DENSITY_LABELS,
  DENSITY_MODES,
  LiveRegion,
  Panel,
  Select,
  SkipLink,
  THEME_LABELS,
  THEME_MODES,
  Toolbar,
  densityClassName,
  isDensityMode,
  isThemeMode,
  themeClassName,
  type DensityMode,
  type ThemeMode,
} from "@rkc/design-system";
import {
  OBJECT_MODEL_VERSION,
  createEmptyDocument,
  createNote,
  getObject,
  listInReadingOrder,
  objectCount,
  renameDocument,
  upsertObject,
  type CanvasDocument,
} from "@rkc/object-model";
import {
  ENGINE_NAME,
  PAINT_BUDGET_MS,
  type EngineStats,
} from "@rkc/canvas-engine";
import {
  DEFAULT_LOCAL_CANVAS_ID,
  PersistenceSession,
  createInitialOfflineStatus,
  getDefaultCanvasStore,
  saveStatusLabel,
  type SaveStatus,
} from "@rkc/offline";
import { PROTOCOL_VERSION } from "@rkc/sync-protocol";
import { CanvasHost } from "./components/CanvasHost";
import styles from "./App.module.scss";

const DENSITY_OPTIONS = DENSITY_MODES.map((value) => ({
  value,
  label: DENSITY_LABELS[value],
}));

const THEME_OPTIONS = THEME_MODES.map((value) => ({
  value,
  label: THEME_LABELS[value],
}));

const STRESS_OPTIONS = [
  { value: "0", label: "Document (saved)" },
  { value: "100", label: "Stress 100" },
  { value: "1000", label: "Stress 1k" },
  { value: "5000", label: "Stress 5k" },
] as const;

const NOTE_COLORS = ["#f5d76e", "#7eb6ff", "#7dcea0", "#f5a3c7", "#c4a1ff", "#f0a06a"];

function buildDemoDocument(): CanvasDocument {
  let d = createEmptyDocument(DEFAULT_LOCAL_CANVAS_ID, "Personal research board");
  d = upsertObject(
    d,
    createNote("Schema-validated notes live in @rkc/object-model", {
      transform: { x: 40, y: 40, w: 260, h: 140 },
      color: "#f5d76e",
    }),
  );
  d = upsertObject(
    d,
    createNote("WebGL draws bulk geometry; SVG handles hit targets & labels", {
      transform: { x: 340, y: 80, w: 280, h: 150 },
      color: "#7eb6ff",
    }),
  );
  d = upsertObject(
    d,
    createNote("Edits autosave to IndexedDB — reload to verify", {
      transform: { x: 120, y: 260, w: 300, h: 130 },
      color: "#7dcea0",
    }),
  );
  return d;
}

function saveBadgeTone(
  status: SaveStatus,
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "saved":
      return "success";
    case "dirty":
    case "saving":
      return "warning";
    case "error":
      return "danger";
    case "loading":
      return "info";
    default:
      return "neutral";
  }
}

export function App() {
  const [density, setDensity] = useState<DensityMode>("focus");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [announce, setAnnounce] = useState("");
  const [stress, setStress] = useState("0");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [doc, setDoc] = useState<CanvasDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const sessionRef = useRef<PersistenceSession | null>(null);
  const offline = useMemo(() => createInitialOfflineStatus(), []);

  const commitDoc = useCallback(
    (next: CanvasDocument, opts?: { immediate?: boolean; announce?: string }) => {
      setDoc(next);
      sessionRef.current?.update(next, { immediate: opts?.immediate });
      if (opts?.announce) setAnnounce(opts.announce);
    },
    [],
  );

  // Boot: open persistence session and load/create local canvas
  useEffect(() => {
    const store = getDefaultCanvasStore();
    const session = new PersistenceSession({
      store,
      debounceMs: 400,
      onStatus: (status, detail) => {
        setSaveStatus(status);
        if (detail?.at) setLastSavedAt(detail.at);
        if (status === "error" && detail?.error) {
          setAnnounce(`Save failed: ${detail.error}`);
        }
      },
    });
    sessionRef.current = session;

    let cancelled = false;
    (async () => {
      try {
        const loaded = await session.loadOrCreate(
          DEFAULT_LOCAL_CANVAS_ID,
          buildDemoDocument,
        );
        if (!cancelled) {
          setDoc(loaded);
          setLastSavedAt(loaded.updatedAt);
          setAnnounce(
            objectCount(loaded) > 0
              ? "Loaded canvas from local storage"
              : "Created new local canvas",
          );
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setBootError(message);
          setSaveStatus("error");
          // Fallback in-memory demo so the engine still works
          setDoc(buildDemoDocument());
        }
      }
    })();

    const onUnload = () => {
      void session.flush();
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onUnload);
      void session.flush().finally(() => session.dispose());
      sessionRef.current = null;
    };
  }, []);

  const readingOrder = useMemo(
    () => (doc ? listInReadingOrder(doc).map((o) => o.a11y.name) : []),
    [doc],
  );
  const stressCount = stress === "0" ? null : Number(stress);
  const selected =
    doc && selectedId && !stressCount ? getObject(doc, selectedId) : undefined;

  const shellClass = [
    styles.app,
    themeClassName(theme),
    densityClassName(density),
  ].join(" ");

  const addNote = () => {
    if (!doc) return;
    const n = objectCount(doc);
    const color = NOTE_COLORS[n % NOTE_COLORS.length];
    const note = createNote(`Note ${n + 1}`, {
      transform: {
        x: 80 + (n % 5) * 40,
        y: 80 + (n % 4) * 50,
        w: 220,
        h: 120,
      },
      color,
    });
    commitDoc(upsertObject(doc, note), {
      announce: `Added ${note.a11y.name} (saving locally)`,
    });
  };

  const resetDemo = () => {
    const fresh = buildDemoDocument();
    commitDoc(fresh, {
      immediate: true,
      announce: "Reset demo canvas and saved",
    });
    setSelectedId(null);
    setStress("0");
  };

  const onTitleBlur = (title: string) => {
    if (!doc) return;
    const trimmed = title.trim() || "Untitled canvas";
    if (trimmed === doc.title) return;
    commitDoc(renameDocument(doc, trimmed), {
      announce: `Renamed canvas to ${trimmed}`,
    });
  };

  return (
    <div className={shellClass}>
      <SkipLink />

      <Toolbar
        title="Realtime Knowledge Canvas"
        subtitle="Slice 1 · local-first"
        end={
          <>
            <Select
              label="Scene"
              hideLabel
              options={[...STRESS_OPTIONS]}
              value={stress}
              onChange={(e) => {
                setStress(e.target.value);
                setSelectedId(null);
                setAnnounce(
                  e.target.value === "0"
                    ? "Showing saved document"
                    : `Stress test ${e.target.value} objects (not saved)`,
                );
              }}
            />
            <Select
              label="Theme"
              hideLabel
              options={THEME_OPTIONS}
              value={theme}
              onChange={(e) => {
                const value = e.target.value;
                if (isThemeMode(value)) {
                  setTheme(value);
                  setAnnounce(`Theme ${THEME_LABELS[value]}`);
                }
              }}
            />
            <Select
              label="Density mode"
              hideLabel
              options={DENSITY_OPTIONS}
              value={density}
              onChange={(e) => {
                const value = e.target.value;
                if (isDensityMode(value)) {
                  setDensity(value);
                  setAnnounce(`Density ${DENSITY_LABELS[value]}`);
                }
              }}
            />
            <Badge tone={saveBadgeTone(saveStatus)} dot>
              {saveStatusLabel(saveStatus)}
            </Badge>
            <Badge tone={offline.online ? "success" : "warning"} dot>
              {offline.online ? "Online" : "Offline"}
            </Badge>
          </>
        }
      />

      <main id="main" className={styles.main}>
        <section className={styles.canvasStage} aria-label="Canvas stage">
          {doc ? (
            <CanvasHost
              document={doc}
              stressCount={stressCount}
              onSelect={(id) => {
                setSelectedId(id);
                if (id && doc) {
                  const obj = getObject(doc, id);
                  setAnnounce(
                    obj ? `Selected ${obj.a11y.name}` : `Selected ${id}`,
                  );
                } else {
                  setAnnounce("Selection cleared");
                }
              }}
              onStats={setStats}
            />
          ) : (
            <div className={styles.loading} role="status">
              Loading canvas…
            </div>
          )}
        </section>

        <Panel
          title="Local store"
          label="Inspector"
          footer={
            <>
              IDB <code className="rkc-code">{DEFAULT_LOCAL_CANVAS_ID}</code> ·{" "}
              <code className="rkc-code">{ENGINE_NAME}</code>
            </>
          }
        >
          <div className="rkc-stack rkc-stack--sm">
            {bootError ? (
              <p className="m-0 text-rkc-sm" style={{ color: "var(--rkc-color-danger)" }}>
                Storage error: {bootError}. Using in-memory fallback.
              </p>
            ) : (
              <p className="m-0 text-rkc-sm text-rkc-muted">
                Document autosaves to IndexedDB. Stress scenes stay in memory
                only. Reload the page to verify persistence.
              </p>
            )}

            {doc ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Title</span>
                <input
                  className={styles.input}
                  key={doc.id + doc.updatedAt}
                  defaultValue={doc.title}
                  onBlur={(e) => onTitleBlur(e.target.value)}
                  aria-label="Canvas title"
                />
              </label>
            ) : null}

            <dl className={styles.meta}>
              <div>
                <dt>Schema</dt>
                <dd>v{OBJECT_MODEL_VERSION}</dd>
              </div>
              <div>
                <dt>Objects</dt>
                <dd>{doc ? objectCount(doc) : "—"}</dd>
              </div>
              <div>
                <dt>Save</dt>
                <dd>
                  <Badge tone={saveBadgeTone(saveStatus)}>
                    {saveStatusLabel(saveStatus)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Last saved</dt>
                <dd>
                  {lastSavedAt
                    ? new Date(lastSavedAt).toLocaleTimeString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Paint</dt>
                <dd>
                  {stats ? `${stats.lastPaintMs.toFixed(2)} ms` : "—"}
                </dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>
                  {stats ? (
                    <Badge tone={stats.withinBudget ? "success" : "warning"}>
                      {stats.withinBudget ? "OK" : "Over"} {PAINT_BUDGET_MS}ms
                    </Badge>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Sync protocol</dt>
                <dd>v{PROTOCOL_VERSION} (Slice 2)</dd>
              </div>
            </dl>

            {selected ? (
              <div className="rkc-stack rkc-stack--sm">
                <p className="rkc-text-xs rkc-text-muted" style={{ margin: 0 }}>
                  Selection
                </p>
                <p className="m-0 text-rkc-sm">{selected.a11y.name}</p>
              </div>
            ) : null}

            {!stressCount && readingOrder.length > 0 ? (
              <div className="rkc-stack rkc-stack--sm">
                <p className="rkc-text-xs rkc-text-muted" style={{ margin: 0 }}>
                  Reading order
                </p>
                <p className="m-0 text-rkc-xs text-rkc-muted">
                  {readingOrder.join(" → ")}
                </p>
              </div>
            ) : null}

            <div className={styles.cardActions}>
              <Button variant="primary" onClick={addNote} disabled={!doc || !!stressCount}>
                Add note
              </Button>
              <Button variant="secondary" onClick={resetDemo} disabled={!doc}>
                Reset demo
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  void sessionRef.current?.flush().then(() => {
                    setAnnounce("Flushed save to IndexedDB");
                  });
                }}
                disabled={!doc}
              >
                Save now
              </Button>
            </div>

            <ol className={styles.steps}>
              <li>Design tokens + density</li>
              <li>Object model (Zod)</li>
              <li>Engine spike</li>
              <li>
                <strong>Local persistence</strong>
              </li>
              <li>Note tools + a11y</li>
            </ol>
          </div>
        </Panel>
      </main>

      <LiveRegion>{announce}</LiveRegion>
    </div>
  );
}
