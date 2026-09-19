'use client';

import * as React from 'react';

import type { BlogusaurusTheme, BlogusaurusThemeMode } from 'blogusaurus';

export type DemoThemeState = {
  mode: BlogusaurusThemeMode;
  /** Simulates a host app that toggles `dark` on <html>; `inherit` mode follows it. */
  hostDark: boolean;
  primary: string;
  brand: string;
  radius: number;
  font: 'sans' | 'serif' | 'mono';
};

export const defaultThemeState: DemoThemeState = {
  mode: 'inherit',
  hostDark: false,
  primary: '#18181b',
  brand: '#3b82f6',
  radius: 0.625,
  font: 'sans',
};

const FONTS = {
  sans: undefined,
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
} as const;

// Pick black/white text for a hex background.
function contrastOn(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#18181b' : '#fafafa';
}

export function toTheme(s: DemoThemeState): BlogusaurusTheme {
  return {
    mode: s.mode,
    radius: `${s.radius}rem`,
    fontFamily: FONTS[s.font],
    // Only override when the user moved off the defaults, so dark mode keeps its own palette.
    colors:
      s.primary === defaultThemeState.primary
        ? { brand: s.brand }
        : {
            primary: s.primary,
            primaryForeground: contrastOn(s.primary),
            brand: s.brand,
          },
  };
}

export function ThemeControls({
  value,
  onChange,
}: {
  value: DemoThemeState;
  onChange: (next: DemoThemeState) => void;
}) {
  const set = <K extends keyof DemoThemeState>(k: K, v: DemoThemeState[K]) =>
    onChange({ ...value, [k]: v });

  // The host toggling its own dark class is exactly what `inherit` mode reacts to.
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', value.hostDark);
  }, [value.hostDark]);

  return (
    <div className="demo-controls">
      <label>
        Mode
        <select
                    value={value.mode}
          onChange={(e) => set('mode', e.target.value as BlogusaurusThemeMode)}
        >
          <option value="inherit">Inherit (host)</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      <label title="Toggles the `dark` class on <html>, like a host app's own theme switch">
        <input
          type="checkbox"
          checked={value.hostDark}
          onChange={(e) => set('hostDark', e.target.checked)}
        />
        Host dark
      </label>
      <label>
        Primary
        <input
          type="color"
          value={value.primary}
          onChange={(e) => set('primary', e.target.value)}
        />
      </label>
      <label>
        Accent
        <input
          type="color"
          value={value.brand}
          onChange={(e) => set('brand', e.target.value)}
        />
      </label>
      <label>
        Radius
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.125}
          value={value.radius}
          onChange={(e) => set('radius', Number(e.target.value))}
        />
      </label>
      <label>
        Font
        <select
                    value={value.font}
          onChange={(e) => set('font', e.target.value as DemoThemeState['font'])}
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <button
        type="button"
        className="demo-link"
        onClick={() => onChange(defaultThemeState)}
      >
        Reset
      </button>
    </div>
  );
}
