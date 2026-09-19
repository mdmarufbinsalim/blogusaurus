import type { CSSProperties } from 'react';

import type tokens from './tokens.json';

/** Any valid CSS color: `#4f46e5`, `oklch(...)`, `hsl(...)`, `var(--my-brand)`. */
export type BlogusaurusColorTokens = Partial<
  Record<keyof typeof tokens, string>
>;

export type BlogusaurusThemeMode =
  /** Follow the host app: dark when an ancestor has the `dark` class or `data-theme="dark"`. Default. */
  | 'inherit'
  | 'light'
  | 'dark'
  /** Follow the OS `prefers-color-scheme`. */
  | 'system';

export type BlogusaurusTheme = {
  mode?: BlogusaurusThemeMode;
  /** Applied in both modes. */
  colors?: BlogusaurusColorTokens;
  /** Light mode only (wins over `colors`). */
  light?: BlogusaurusColorTokens;
  /** Dark mode only (wins over `colors`). */
  dark?: BlogusaurusColorTokens;
  /** Corner radius base, e.g. `0.5rem`. */
  radius?: string;
  /** CSS font-family for editor and article text. Default: inherit from the host. */
  fontFamily?: string;
  /** CSS font-family for code. */
  monoFontFamily?: string;
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Pure and server-safe. All theming is CSS variables plus a data attribute,
 * resolved by the package stylesheet, so it needs no JS, no context and no
 * hydration: the same props work in server and client components.
 *
 * `--bsk-c-*` applies to both modes, `--bsk-l-*` / `--bsk-d-*` to one; the
 * stylesheet falls back from mode-specific to shared to built-in default.
 */
export function themeProps(theme: BlogusaurusTheme = {}) {
  const style: Record<string, string> = {};
  const add = (prefix: string, tokens?: BlogusaurusColorTokens) => {
    for (const [key, value] of Object.entries(tokens ?? {})) {
      if (value) style[`--bsk-${prefix}-${kebab(key)}`] = value;
    }
  };

  add('c', theme.colors);
  add('l', theme.light);
  add('d', theme.dark);
  if (theme.radius) style['--bsk-c-radius'] = theme.radius;
  if (theme.fontFamily) style['--bsk-c-font'] = theme.fontFamily;
  if (theme.monoFontFamily) style['--bsk-c-font-mono'] = theme.monoFontFamily;

  return {
    className: 'bsk-root',
    'data-bsk-theme': theme.mode ?? 'inherit',
    style: style as CSSProperties,
  };
}
