'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  BlogusaurusCreator,
  BlogusaurusRender,
  contentToMarkdown,
  parseContent,
  type BlogusaurusPost,
} from 'blogusaurus';

import { clearPost, fakeUpload, savePost, useStoredPostJson } from './storage';
import {
  ThemeControls,
  defaultThemeState,
  toTheme,
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
    <div>
      <div className="demo-bar">
        <div className="demo-bar-inner">
          <div className="demo-brand">
            <h1>Blogusaurus</h1>
            <nav className="demo-nav" aria-label="Sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
              <Link href="/ssr">Server render</Link>
            </nav>
          </div>
          <ThemeControls value={themeState} onChange={setThemeState} />
        </div>
      </div>

      {storedJson === undefined ? null : (
        <main>
          {/* Kept mounted so switching tabs never loses editor state. */}
          <div hidden={tab !== 'write'}>
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

          {tab === 'render' &&
            (stored ? (
              <BlogusaurusRender post={stored} theme={theme} />
            ) : (
              <Empty>Nothing saved yet. Write something in the Creator and hit Save draft.</Empty>
            ))}

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
    <div className="demo-data">
      <div className="demo-data-head">
        <div className="demo-seg">
          {(['json', 'markdown'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button type="button" className="demo-link demo-danger" onClick={onClear}>
          Clear saved post
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="demo-empty">{children}</p>;
}
