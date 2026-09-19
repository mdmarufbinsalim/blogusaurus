'use client';

import type { BlogusaurusTheme, BlogusaurusThemeMode } from '@/blogusaurus';

export type DemoThemeState = {
  mode: BlogusaurusThemeMode;
  primary: string;
  brand: string;
  radius: number;
  font: 'sans' | 'serif' | 'mono';
};

export const defaultThemeState: DemoThemeState = {
  mode: 'light',
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

  const label = 'flex items-center gap-2 text-muted-foreground text-xs';
  const control = 'rounded-md border bg-background px-2 py-1 text-foreground text-sm';

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <label className={label}>
        Mode
        <select
          className={control}
          value={value.mode}
          onChange={(e) => set('mode', e.target.value as BlogusaurusThemeMode)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
          <option value="inherit">Inherit from host</option>
        </select>
      </label>
      <label className={label}>
        Primary
        <input
          type="color"
          value={value.primary}
          onChange={(e) => set('primary', e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border bg-transparent"
        />
      </label>
      <label className={label}>
        Accent
        <input
          type="color"
          value={value.brand}
          onChange={(e) => set('brand', e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border bg-transparent"
        />
      </label>
      <label className={label}>
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
      <label className={label}>
        Font
        <select
          className={control}
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
        className="text-muted-foreground text-xs underline"
        onClick={() => onChange(defaultThemeState)}
      >
        Reset
      </button>
    </div>
  );
}
