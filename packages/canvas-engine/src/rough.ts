/**
 * Lightweight rough / hand-drawn geometry (inspired by Rough.js / Excalidraw).
 * Deterministic per seed so shapes stay stable across frames.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface RoughRectOptions {
  /** 0 = clean, ~1 default sketch, higher = messier */
  roughness?: number;
  /** Curve bowing on edges */
  bowing?: number;
  /** Stable seed (from object id hash) */
  seed?: number;
  /** Outline passes (1–2 typical) */
  strokePasses?: number;
  /** Midpoints along each edge for wiggle */
  density?: number;
}

export interface RoughRectGeometry {
  /** Closed polygon for soft fill (screen or world units) */
  fillPoints: Vec2[];
  /** One or more closed stroke polylines */
  strokePasses: Vec2[][];
}

/** FNV-1a style hash → 32-bit seed. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — returns [0, 1). */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function offsetPoint(
  a: Vec2,
  b: Vec2,
  t: number,
  offset: number,
  bow: number,
): Vec2 {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // bow pulls midpoints slightly toward center of the segment perpendicular
  const bowFactor = Math.sin(t * Math.PI) * bow;
  return {
    x: a.x + dx * t + nx * (offset + bowFactor),
    y: a.y + dy * t + ny * (offset + bowFactor),
  };
}

function roughEdge(
  a: Vec2,
  b: Vec2,
  rng: () => number,
  roughness: number,
  bowing: number,
  density: number,
): Vec2[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(2, Math.round((len / 28) * density));
  const maxOffset = Math.min(4.5, 0.9 + roughness * 1.6);
  const bow = bowing * (0.4 + rng() * 0.8);
  const pts: Vec2[] = [a];
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const jitter = (rng() - 0.5) * 2 * maxOffset * roughness;
    pts.push(offsetPoint(a, b, t, jitter, bow * (rng() - 0.5)));
  }
  pts.push(b);
  return pts;
}

function closeRing(points: Vec2[]): Vec2[] {
  if (points.length === 0) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (first.x === last.x && first.y === last.y) return points;
  return [...points, first];
}

/**
 * Build a hand-drawn rectangle in the given coordinate space.
 * Corners stay near the AABB; edges wiggle deterministically.
 */
export function roughRectangle(
  x: number,
  y: number,
  w: number,
  h: number,
  options: RoughRectOptions = {},
): RoughRectGeometry {
  const roughness = options.roughness ?? 1.15;
  const bowing = options.bowing ?? 1;
  const seed = options.seed ?? 1;
  const strokePasses = Math.max(1, Math.min(2, options.strokePasses ?? 2));
  const density = options.density ?? 1;

  const tl: Vec2 = { x, y };
  const tr: Vec2 = { x: x + w, y };
  const br: Vec2 = { x: x + w, y: y + h };
  const bl: Vec2 = { x, y: y + h };

  const corners: [Vec2, Vec2, Vec2, Vec2] = [tl, tr, br, bl];

  const buildPass = (passSeed: number): Vec2[] => {
    const rng = createRng(passSeed);
    // Slight corner nibble so boxes aren't perfect
    const nibble = (p: Vec2, toward: Vec2): Vec2 => {
      const dx = toward.x - p.x;
      const dy = toward.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const amt = (0.4 + rng() * 1.2) * roughness;
      return {
        x: p.x + (dx / len) * amt * 0.15,
        y: p.y + (dy / len) * amt * 0.15,
      };
    };

    const c0 = nibble(corners[0], corners[1]);
    const c1 = nibble(corners[1], corners[2]);
    const c2 = nibble(corners[2], corners[3]);
    const c3 = nibble(corners[3], corners[0]);

    const top = roughEdge(c0, c1, rng, roughness, bowing, density);
    const right = roughEdge(c1, c2, rng, roughness, bowing, density).slice(1);
    const bottom = roughEdge(c2, c3, rng, roughness, bowing, density).slice(1);
    const left = roughEdge(c3, c0, rng, roughness, bowing, density).slice(1);
    return closeRing([...top, ...right, ...bottom, ...left]);
  };

  const fillPoints = buildPass(seed);
  const strokes: Vec2[][] = [];
  for (let p = 0; p < strokePasses; p += 1) {
    strokes.push(buildPass(seed + 17 * (p + 1) + p * 9973));
  }

  return { fillPoints, strokePasses: strokes };
}

/** SVG path `d` from polyline (optionally closed). */
export function pointsToPath(points: readonly Vec2[], close = false): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i]!.x.toFixed(2)} ${points[i]!.y.toFixed(2)}`;
  }
  if (close) d += " Z";
  return d;
}

/**
 * Hachure lines inside a rect for sketch-fill (Excalidraw-ish).
 * Line equation: -sin·x + cos·y = p  (perpendicular coordinate).
 */
export function roughHachure(
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    seed?: number;
    spacing?: number;
    angle?: number;
    roughness?: number;
  } = {},
): Vec2[][] {
  const seed = options.seed ?? 1;
  const spacing = options.spacing ?? 8;
  const angle = options.angle ?? -0.55;
  const roughness = options.roughness ?? 0.9;
  const rng = createRng(seed ^ 0x9e3779b9);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
  let minP = Infinity;
  let maxP = -Infinity;
  for (const c of corners) {
    const p = -sin * c.x + cos * c.y;
    minP = Math.min(minP, p);
    maxP = Math.max(maxP, p);
  }

  const x0 = x;
  const x1 = x + w;
  const y0 = y;
  const y1 = y + h;
  const lines: Vec2[][] = [];

  for (let p = minP - spacing; p <= maxP + spacing; p += spacing) {
    const hits: Vec2[] = [];
    // Intersect with vertical sides
    if (Math.abs(cos) > 1e-6) {
      for (const px of [x0, x1]) {
        const py = (p + sin * px) / cos;
        if (py >= y0 - 0.01 && py <= y1 + 0.01) hits.push({ x: px, y: py });
      }
    }
    // Intersect with horizontal sides
    if (Math.abs(sin) > 1e-6) {
      for (const py of [y0, y1]) {
        const px = (cos * py - p) / sin;
        if (px >= x0 - 0.01 && px <= x1 + 0.01) hits.push({ x: px, y: py });
      }
    }
    if (hits.length < 2) continue;
    // Unique-ish extremes
    hits.sort((a, b) => a.x - b.x || a.y - b.y);
    const a = hits[0]!;
    const b = hits[hits.length - 1]!;
    if (Math.hypot(b.x - a.x, b.y - a.y) < 3) continue;
    const j = (rng() - 0.5) * roughness;
    lines.push([
      { x: a.x + j * 0.4, y: a.y + j * 0.4 },
      { x: b.x - j * 0.4, y: b.y - j * 0.4 },
    ]);
  }
  return lines;
}
