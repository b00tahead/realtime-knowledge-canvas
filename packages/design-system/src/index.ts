/**
 * @rkc/design-system
 *
 * Tokens (CSS) + density/theme helpers + React primitives.
 * Import styles once in the app entry:
 *   import "@rkc/design-system/tokens.css"
 *   import "@rkc/design-system/components.css"
 */

export {
  DENSITY_LABELS,
  DENSITY_MODES,
  densityClassName,
  isDensityMode,
  type DensityMode,
} from "./density.js";

export {
  THEME_LABELS,
  THEME_MODES,
  isThemeMode,
  resolveInitialTheme,
  themeClassName,
  type ThemeMode,
} from "./theme.js";

export {
  COLOR_TOKEN_NAMES,
  GALLERY_COLOR_TOKENS,
  NOTE_COLOR_TOKEN_NAMES,
  colorCssVar,
  noteColorCssVar,
  type ColorTokenName,
  type NoteColorTokenName,
} from "./tokens.js";

export { cn } from "./cn.js";

export {
  Badge,
  Button,
  LiveRegion,
  Panel,
  Select,
  SkipLink,
  TokenSwatchGrid,
  Toolbar,
  type BadgeProps,
  type BadgeTone,
  type ButtonProps,
  type ButtonVariant,
  type LiveRegionProps,
  type PanelProps,
  type SelectOption,
  type SelectProps,
  type SkipLinkProps,
  type ToolbarProps,
} from "./react/index.js";
