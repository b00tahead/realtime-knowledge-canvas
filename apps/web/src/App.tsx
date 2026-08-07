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
  TokenSwatchGrid,
  Toolbar,
  densityClassName,
  isDensityMode,
  isThemeMode,
  themeClassName,
  type DensityMode,
  type ThemeMode,
} from "@rkc/design-system";
import { createEmptyDocument, OBJECT_MODEL_VERSION } from "@rkc/object-model";
import { createCamera, ENGINE_NAME } from "@rkc/canvas-engine";
import { createInitialOfflineStatus } from "@rkc/offline";
import { PROTOCOL_VERSION } from "@rkc/sync-protocol";
import styles from "./App.module.scss";

const DENSITY_OPTIONS = DENSITY_MODES.map((value) => ({
  value,
  label: DENSITY_LABELS[value],
}));

const THEME_OPTIONS = THEME_MODES.map((value) => ({
  value,
  label: THEME_LABELS[value],
}));

export function App() {
  const [density, setDensity] = useState<DensityMode>("focus");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [announce, setAnnounce] = useState("");

  const doc = useMemo(
    () => createEmptyDocument("local-demo", "Personal research board"),
    [],
  );
  const camera = useMemo(() => createCamera(), []);
  const offline = useMemo(() => createInitialOfflineStatus(), []);

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
        subtitle="Slice 1 · design system"
        end={
          <>
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
        <section
          className={styles.canvasStage}
          aria-label="Canvas stage"
          tabIndex={0}
        >
          <div className={`rkc-card ${styles.canvasPlaceholder}`}>
            <p className="rkc-card__title">{doc.title}</p>
            <p className="rkc-card__body">
              Design tokens, density modes, and chrome primitives are live.
              Theme and density controls remap the whole shell without restyling
              components.
            </p>
            <dl className={styles.meta}>
              <div>
                <dt>Document schema</dt>
                <dd>v{OBJECT_MODEL_VERSION}</dd>
              </div>
              <div>
                <dt>Engine</dt>
                <dd>{ENGINE_NAME}</dd>
              </div>
              <div>
                <dt>Camera</dt>
                <dd>
                  ({camera.x}, {camera.y}) ×{camera.zoom}
                </dd>
              </div>
              <div>
                <dt>Sync protocol</dt>
                <dd>v{PROTOCOL_VERSION} (Slice 2)</dd>
              </div>
            </dl>
            <div className={styles.cardActions}>
              <Button
                variant="primary"
                onClick={() => setAnnounce("Primary action ready for tools")}
              >
                Primary
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAnnounce("Secondary action")}
              >
                Secondary
              </Button>
              <Button variant="ghost" onClick={() => setAnnounce("Ghost action")}>
                Ghost
              </Button>
            </div>
          </div>
        </section>

        <Panel
          title="Design system"
          label="Inspector"
          footer={
            <>
              See <code className="rkc-code">docs/design-system.md</code>
            </>
          }
        >
          <p className="m-0 text-rkc-sm text-rkc-muted">
            Live token gallery. Switch theme or density in the toolbar to see
            remapping. Tailwind utilities map to the same CSS variables.
          </p>
          <TokenSwatchGrid />
          <div className="rkc-stack rkc-stack--sm">
            <p className="rkc-text-xs rkc-text-muted" style={{ margin: 0 }}>
              Badge tones
            </p>
            <div className={styles.badgeRow}>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="info" dot>
                Info
              </Badge>
              <Badge tone="success" dot>
                Ready
              </Badge>
              <Badge tone="warning" dot>
                Sync
              </Badge>
              <Badge tone="danger" dot>
                Error
              </Badge>
            </div>
          </div>
          <ol className={styles.steps}>
            <li>Design tokens + density modes</li>
            <li>WebGL + SVG engine spike</li>
            <li>Notes, selection, offline store</li>
            <li>Keyboard object graph</li>
          </ol>
        </Panel>
      </main>

      <LiveRegion>{announce}</LiveRegion>
    </div>
  );
}
