'use client';

import * as React from 'react';

import {
  BlogusaurusCreator,
  BlogusaurusRender,
  contentToMarkdown,
  parseContent,
  type BlogusaurusPost,
} from '@/blogusaurus';
import { cn } from '@/lib/utils';

import { clearPost, fakeUpload, savePost, useStoredPostJson } from './storage';
import {
  ThemeControls,
  defaultThemeState,
  toTheme,
  type DemoThemeState,
} from './theme-controls';

const TABS = [
  { id: 'write', label: 'Creator' },
  { id: 'render', label: 'Renderer' },
  { id: 'data', label: 'Stored data' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Demo() {
  const [tab, setTab] = React.useState<TabId>('write');
  const [themeState, setThemeState] = React.useState(defaultThemeState);
  const [resetKey, setResetKey] = React.useState(0);
  const storedJson = useStoredPostJson();
  const theme = React.useMemo(() => toTheme(themeState), [themeState]);

  const stored = React.useMemo<BlogusaurusPost | null>(() => {
    if (!storedJson) return null;
    try {
      return JSON.parse(storedJson) as BlogusaurusPost;
    } catch {
      return null;
    }
  }, [storedJson]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold tracking-tight">Blogusaurus</h1>
            <nav className="flex gap-1" aria-label="Sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    tab === t.id
                      ? 'bg-background font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <ThemeControls value={themeState} onChange={setThemeState} />
        </div>
      </div>

      {storedJson === undefined ? null : (
        <main className="flex-1">
          {/* Kept mounted so switching tabs never loses editor state. */}
          <div className={cn(tab !== 'write' && 'hidden')}>
            <BlogusaurusCreator
              key={resetKey}
              theme={theme}
              initialPost={stored ?? undefined}
              onSave={savePost}
              onPublish={savePost}
              onUploadFile={(file, { onProgress }) => fakeUpload(file, onProgress)}
              onError={(e) => console.error('[blogusaurus]', e)}
            />
          </div>

          {tab === 'render' && (
            <RenderTab stored={stored} themeState={themeState} />
          )}

          {tab === 'data' && (
            <DataTab
              stored={stored}
              onClear={() => {
                clearPost();
                setResetKey((k) => k + 1);
              }}
            />
          )}
        </main>
      )}
    </div>
  );
}

function RenderTab({
  stored,
  themeState,
}: {
  stored: BlogusaurusPost | null;
  themeState: DemoThemeState;
}) {
  if (!stored) return <Empty>Nothing saved yet. Write something in the Creator and hit Save draft.</Empty>;

  return (
    <BlogusaurusRender post={stored} theme={toTheme(themeState)} className="py-12" />
  );
}

function DataTab({
  stored,
  onClear,
}: {
  stored: BlogusaurusPost | null;
  onClear: () => void;
}) {
  const [format, setFormat] = React.useState<'json' | 'markdown'>('json');

  if (!stored) return <Empty>Nothing saved yet.</Empty>;

  const text =
    format === 'json'
      ? JSON.stringify(stored, null, 2)
      : contentToMarkdown(parseContent(stored.content));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-md border p-0.5 text-sm">
          {(['json', 'markdown'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={cn(
                'rounded px-3 py-1 capitalize',
                format === f ? 'bg-secondary font-medium' : 'text-muted-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-destructive text-sm underline"
        >
          Clear saved post
        </button>
      </div>
      <pre className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
        {text}
      </pre>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
      {children}
    </p>
  );
}
