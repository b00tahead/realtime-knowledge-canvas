import {
  GALLERY_COLOR_TOKENS,
  NOTE_COLOR_TOKEN_NAMES,
  colorCssVar,
  noteColorCssVar,
} from "../tokens.js";

export function TokenSwatchGrid() {
  return (
    <div className="rkc-stack">
      <div>
        <p className="rkc-text-xs rkc-text-muted" style={{ margin: "0 0 0.5rem" }}>
          Semantic colors
        </p>
        <div className="rkc-swatch-grid">
          {GALLERY_COLOR_TOKENS.map((token) => (
            <div key={token.name} className="rkc-swatch">
              <div
                className="rkc-swatch__chip"
                style={{ background: colorCssVar(token.name) }}
                title={`--rkc-color-${token.name}`}
              />
              <span className="rkc-swatch__label">{token.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="rkc-text-xs rkc-text-muted" style={{ margin: "0 0 0.5rem" }}>
          Note accents
        </p>
        <div className="rkc-swatch-grid">
          {NOTE_COLOR_TOKEN_NAMES.map((name) => (
            <div key={name} className="rkc-swatch">
              <div
                className="rkc-swatch__chip"
                style={{ background: noteColorCssVar(name) }}
                title={`--rkc-note-${name}`}
              />
              <span className="rkc-swatch__label">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
