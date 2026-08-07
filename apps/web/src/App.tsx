import { useMemo, useState } from "react";
import {
  densityClassName,
  type DensityMode,
  isDensityMode,
} from "@rkc/design-system";
import { createEmptyDocument, OBJECT_MODEL_VERSION } from "@rkc/object-model";
import { createCamera, ENGINE_NAME } from "@rkc/canvas-engine";
import { createInitialOfflineStatus } from "@rkc/offline";
import { PROTOCOL_VERSION } from "@rkc/sync-protocol";
import styles from "./App.module.scss";

export function App() {
  const [density, setDensity] = useState<DensityMode>("focus");
  const doc = useMemo(
    () => createEmptyDocument("local-demo", "Personal research board"),
    [],
  );
  const camera = useMemo(() => createCamera(), []);
  const offline = useMemo(() => createInitialOfflineStatus(), []);

  return (
    <div className={`${styles.app} ${densityClassName(density)}`}>
      <a className={styles.skipLink} href="#main">
        Skip to canvas
      </a>

      <header className={styles.toolbar} role="banner">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            ◇
          </span>
          <div>
            <h1 className={styles.title}>Realtime Knowledge Canvas</h1>
            <p className={styles.subtitle}>Slice 1 scaffold · solo canvas</p>
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <label className={styles.densityLabel}>
            <span className={styles.srOnly}>Density mode</span>
            <select
              className={styles.select}
              value={density}
              onChange={(e) => {
                const value = e.target.value;
                if (isDensityMode(value)) setDensity(value);
              }}
              aria-label="Density mode"
            >
              <option value="focus">Focus</option>
              <option value="research">Research</option>
            </select>
          </label>
          <span
            className={styles.status}
            title={offline.online ? "Online" : "Offline"}
          >
            {offline.online ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <section
          className={styles.canvasStage}
          aria-label="Canvas stage"
          tabIndex={0}
        >
          <div className={styles.canvasPlaceholder}>
            <p className={styles.placeholderTitle}>{doc.title}</p>
            <p className={styles.placeholderBody}>
              Infinite canvas engine lands next. This shell wires the monorepo
              packages, design tokens, and accessibility landmarks.
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
          </div>
        </section>

        <aside className={styles.panel} aria-label="Inspector">
          <h2 className={styles.panelTitle}>Getting started</h2>
          <ol className={styles.steps}>
            <li>Design tokens + density modes</li>
            <li>WebGL + SVG engine spike</li>
            <li>Notes, selection, offline store</li>
            <li>Keyboard object graph</li>
          </ol>
          <p className={styles.panelNote}>
            See <code>docs/roadmap.md</code> for the full Slice 1–3 plan.
          </p>
        </aside>
      </main>

      <div className={styles.liveRegion} role="status" aria-live="polite">
        {/* Presence and AI announcements will stream here */}
      </div>
    </div>
  );
}
