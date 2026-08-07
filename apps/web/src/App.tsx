import { useMemo, useState } from "react";
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
  upsertObject,
} from "@rkc/object-model";
import {
  ENGINE_NAME,
  PAINT_BUDGET_MS,
  type EngineStats,
} from "@rkc/canvas-engine";
import { createInitialOfflineStatus } from "@rkc/offline";
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
  { value: "0", label: "Document (2 notes)" },
  { value: "100", label: "Stress 100" },
  { value: "1000", label: "Stress 1k" },
  { value: "5000", label: "Stress 5k" },
] as const;

function buildDemoDocument() {
  let d = createEmptyDocument("local-demo", "Personal research board");
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
    createNote("Space-drag to pan · scroll to zoom · paint HUD top-left", {
      transform: { x: 120, y: 260, w: 300, h: 130 },
      color: "#7dcea0",
    }),
  );
  return d;
}

export function App() {
  const [density, setDensity] = useState<DensityMode>("focus");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [announce, setAnnounce] = useState("");
  const [stress, setStress] = useState("0");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);

  const doc = useMemo(() => buildDemoDocument(), []);
  const readingOrder = useMemo(
    () => listInReadingOrder(doc).map((o) => o.a11y.name),
    [doc],
  );
  const offline = useMemo(() => createInitialOfflineStatus(), []);
  const stressCount = stress === "0" ? null : Number(stress);
  const selected = selectedId ? getObject(doc, selectedId) : undefined;

  const shellClass = [
    styles.app,
    themeClassName(theme),
    densityClassName(density),
  ].join(" ");

  return (
    <div className={shellClass}>
      <SkipLink />

      <Toolbar
        title="Realtime Knowledge Canvas"
        subtitle="Slice 1 · engine spike"
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
                    ? "Showing document objects"
                    : `Stress test ${e.target.value} objects`,
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
            <Badge tone={offline.online ? "success" : "warning"} dot>
              {offline.online ? "Online" : "Offline"}
            </Badge>
          </>
        }
      />

      <main id="main" className={styles.main}>
        <section className={styles.canvasStage} aria-label="Canvas stage">
          <CanvasHost
            document={doc}
            stressCount={stressCount}
            onSelect={(id) => {
              setSelectedId(id);
              if (id) {
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
        </section>

        <Panel
          title="Engine"
          label="Inspector"
          footer={
            <>
              Budget <code className="rkc-code">{PAINT_BUDGET_MS}ms</code> ·{" "}
              <code className="rkc-code">{ENGINE_NAME}</code>
            </>
          }
        >
          <div className="rkc-stack rkc-stack--sm">
            <p className="m-0 text-rkc-sm text-rkc-muted">
              Dual-surface spike: WebGL batches rects; SVG overlays labels and
              hit targets. Cull uses world-space AABB.
            </p>
            <dl className={styles.meta}>
              <div>
                <dt>Schema</dt>
                <dd>v{OBJECT_MODEL_VERSION}</dd>
              </div>
              <div>
                <dt>Doc objects</dt>
                <dd>{objectCount(doc)}</dd>
              </div>
              <div>
                <dt>Last paint</dt>
                <dd>
                  {stats
                    ? `${stats.lastPaintMs.toFixed(2)} ms`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Visible</dt>
                <dd>
                  {stats
                    ? `${stats.visibleCount} / ${stats.objectCount}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Sync</dt>
                <dd>v{PROTOCOL_VERSION} (Slice 2)</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>
                  {stats ? (
                    <Badge tone={stats.withinBudget ? "success" : "warning"}>
                      {stats.withinBudget ? "OK" : "Over"}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>

            {selected && !stressCount ? (
              <div className="rkc-stack rkc-stack--sm">
                <p className="rkc-text-xs rkc-text-muted" style={{ margin: 0 }}>
                  Selection
                </p>
                <p className="m-0 text-rkc-sm">{selected.a11y.name}</p>
                <p className="m-0 text-rkc-xs text-rkc-muted">
                  {selected.type} · ({selected.transform.x},{" "}
                  {selected.transform.y})
                </p>
              </div>
            ) : null}

            {!stressCount ? (
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
              <Button
                variant="secondary"
                onClick={() => {
                  setStress("1000");
                  setAnnounce("Loaded 1000 stress objects");
                }}
              >
                Load 1k
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStress("0");
                  setAnnounce("Restored document scene");
                }}
              >
                Reset scene
              </Button>
            </div>

            <ol className={styles.steps}>
              <li>Design tokens + density</li>
              <li>Object model (Zod)</li>
              <li>
                <strong>Engine spike</strong>
              </li>
              <li>Local persistence</li>
            </ol>
          </div>
        </Panel>
      </main>

      <LiveRegion>{announce}</LiveRegion>
    </div>
  );
}
