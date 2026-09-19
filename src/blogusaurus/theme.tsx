'use client';

import * as React from 'react';

import { PortalContainerProvider } from '@/lib/portal-container';
import { cn } from '@/lib/utils';

/** Any valid CSS color: `#4f46e5`, `oklch(...)`, `hsl(...)`, `var(--my-brand)`. */
export type BlogusaurusColorTokens = Partial<
  Record<
    | 'background'
    | 'foreground'
    | 'card'
    | 'cardForeground'
    | 'popover'
    | 'popoverForeground'
    | 'primary'
    | 'primaryForeground'
    | 'secondary'
    | 'secondaryForeground'
    | 'muted'
    | 'mutedForeground'
    | 'accent'
    | 'accentForeground'
    | 'destructive'
    | 'border'
    | 'input'
    | 'ring'
    /** Selection / focus accent used across the editor. */
    | 'brand'
    /** Background of the highlight mark. */
    | 'highlight',
    string
  >
>;

export type BlogusaurusThemeMode = 'light' | 'dark' | 'system' | 'inherit';

export type BlogusaurusTheme = {
  /**
   * `inherit` (default) follows the host app's own `.dark` class.
   * `light` / `dark` force a mode for this component only.
   */
  mode?: BlogusaurusThemeMode;
  /** Applied in both modes. */
  colors?: BlogusaurusColorTokens;
  /** Applied only in light mode (wins over `colors`). */
  light?: BlogusaurusColorTokens;
  /** Applied only in dark mode (wins over `colors`). */
  dark?: BlogusaurusColorTokens;
  /** Corner radius base, e.g. `0.5rem`. */
  radius?: string;
  /** CSS font-family for the editor / article text. */
  fontFamily?: string;
  /** CSS font-family for code. */
  monoFontFamily?: string;
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function subscribeToScheme(cb: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function useSystemDark() {
  return React.useSyncExternalStore(
    subscribeToScheme,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false
  );
}

export function resolveThemeStyle(
  theme: BlogusaurusTheme,
  isDark: boolean
): React.CSSProperties {
  const tokens = {
    ...theme.colors,
    ...(isDark ? theme.dark : theme.light),
  };
  const style: Record<string, string> = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (value) style[`--${kebab(key)}`] = value;
  }
  if (theme.radius) style['--radius'] = theme.radius;
  if (theme.fontFamily) style.fontFamily = theme.fontFamily;
  if (theme.monoFontFamily) style['--font-mono'] = theme.monoFontFamily;

  return style as React.CSSProperties;
}

/**
 * Scopes theme tokens to its subtree. Popovers, menus and dialogs are portaled
 * into this element too, so they pick up the same tokens and dark mode.
 */
export function BlogusaurusThemeProvider({
  theme = {},
  className,
  style,
  children,
}: {
  theme?: BlogusaurusTheme;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  const systemDark = useSystemDark();

  const mode = theme.mode ?? 'inherit';
  const forcedDark = mode === 'dark' || (mode === 'system' && systemDark);
  // With `inherit` we can't know the host mode here; the CSS variables set by
  // `light` / `dark` only apply when the matching class is active, so resolve
  // lazily from the DOM.
  const [hostDark, setHostDark] = React.useState(false);

  React.useEffect(() => {
    if (mode !== 'inherit') return;
    const html = document.documentElement;
    const read = () => setHostDark(html.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mode]);

  const isDark = mode === 'inherit' ? hostDark : forcedDark;

  return (
    <div
      ref={setRoot}
      data-blogusaurus=""
      data-theme={isDark ? 'dark' : 'light'}
      className={cn(
        'blogusaurus relative bg-background text-foreground',
        mode !== 'inherit' && (forcedDark ? 'dark' : 'light'),
        className
      )}
      style={{ ...resolveThemeStyle(theme, isDark), ...style }}
    >
      <PortalContainerProvider value={root ?? undefined}>
        {children}
      </PortalContainerProvider>
    </div>
  );
}
