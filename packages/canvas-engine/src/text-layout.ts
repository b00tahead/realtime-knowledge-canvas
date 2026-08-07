/**
 * Approximate word-wrap for canvas labels without measuring glyphs each frame.
 * Tuned for sketch/hand fonts (~0.52em average advance).
 */

export interface WrapResult {
  lines: string[];
  /** True when content was cut to fit maxLines */
  truncated: boolean;
}

/**
 * Wrap `text` into lines that fit `maxWidth` at `fontSize`.
 * Honors explicit `\n`. Soft-wraps on spaces; long tokens are force-broken.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
  charWidthFactor = 0.52,
): WrapResult {
  if (maxWidth <= 0 || maxLines <= 0 || fontSize <= 0) {
    return { lines: [], truncated: text.trim().length > 0 };
  }

  const avgChar = Math.max(4, fontSize * charWidthFactor);
  const maxChars = Math.max(1, Math.floor(maxWidth / avgChar));
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  let remaining = false;

  for (let p = 0; p < paragraphs.length; p += 1) {
    if (lines.length >= maxLines) {
      remaining = true;
      break;
    }

    const raw = paragraphs[p]!;
    // Preserve blank lines from explicit newlines
    if (raw.length === 0) {
      lines.push("");
      continue;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    let current = "";

    for (let w = 0; w < words.length; w += 1) {
      const pieces = splitLongToken(words[w]!, maxChars);
      for (let pi = 0; pi < pieces.length; pi += 1) {
        const piece = pieces[pi]!;
        const next = current ? `${current} ${piece}` : piece;
        if (next.length <= maxChars) {
          current = next;
          continue;
        }
        // flush current line
        if (current) {
          lines.push(current);
          current = "";
          if (lines.length >= maxLines) {
            remaining = true;
            // leftover includes this piece and rest
            break;
          }
        }
        if (piece.length <= maxChars) {
          current = piece;
        } else {
          // should not happen after splitLongToken
          current = piece.slice(0, maxChars);
        }
      }
      if (remaining) break;
    }

    if (remaining) break;

    if (current) {
      if (lines.length >= maxLines) {
        remaining = true;
        break;
      }
      lines.push(current);
    }
  }

  if (lines.length > maxLines) {
    remaining = true;
    lines.length = maxLines;
  }

  if (remaining && lines.length > 0) {
    const last = lines[lines.length - 1]!;
    const budget = Math.max(1, maxChars - 1);
    const base = last.length > budget ? last.slice(0, budget) : last;
    lines[lines.length - 1] = `${base.replace(/\s+$/, "")}…`;
  }

  return { lines, truncated: remaining };
}

function splitLongToken(token: string, maxChars: number): string[] {
  if (token.length <= maxChars) return [token];
  const out: string[] = [];
  for (let i = 0; i < token.length; i += maxChars) {
    out.push(token.slice(i, i + maxChars));
  }
  return out;
}

/** How many lines fit in `height` given font size and line-height factor. */
export function maxLinesForHeight(
  height: number,
  fontSize: number,
  lineHeight = 1.3,
  paddingY = 0,
): number {
  const usable = Math.max(0, height - paddingY * 2);
  if (usable < fontSize * 0.8) return 0;
  return Math.max(1, Math.floor(usable / (fontSize * lineHeight)));
}
