'use client';

import * as React from 'react';

import { Plate, usePlateEditor } from 'platejs/react';
import {
  CheckIcon,
  EyeIcon,
  ImageIcon,
  LinkIcon,
  Loader2Icon,
  PencilIcon,
  TagIcon,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

import { BlogusaurusHandlersProvider, useBlogusaurusHandlers } from './context';
import { BlogusaurusEditorKit } from './kit';
import { BlogusaurusRender } from './render';
import { countWords, parseContent, readingTime, slugify } from './serialize';
import { PortalContainerProvider } from '@/lib/portal-container';

import { type BlogusaurusTheme, themeProps } from './theme';
import type {
  BlogusaurusContent,
  BlogusaurusHandlers,
  BlogusaurusPost,
} from './types';
import { BLOGUSAURUS_SCHEMA_VERSION } from './types';

export type BlogusaurusCreatorProps = BlogusaurusHandlers & {
  /** Load an existing post (edit flow). Read once on mount; remount with a `key` to swap posts. */
  initialPost?: Partial<Omit<BlogusaurusPost, 'content'>> & {
    content?: BlogusaurusContent | string | null;
  };
  theme?: BlogusaurusTheme;
  /** Debounced autosave through `onSave`. `false` disables it. Default: 2s. */
  autosave?: false | { delayMs?: number };
  /** Toggle post fields. All on by default. */
  fields?: {
    cover?: boolean;
    excerpt?: boolean;
    tags?: boolean;
    slug?: boolean;
  };
  placeholder?: string;
  className?: string;
};

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function BlogusaurusCreator({
  theme,
  className,
  onSave,
  onPublish,
  onUploadFile,
  onChange,
  onError,
  ...props
}: BlogusaurusCreatorProps) {
  return (
    <BlogusaurusHandlersProvider
      handlers={{ onSave, onPublish, onUploadFile, onChange, onError }}
    >
      <ThemeRoot theme={theme} className={className}>
        <TooltipProvider>
          <CreatorInner
            {...props}
            theme={theme}
            hasSave={!!onSave}
            hasPublish={!!(onPublish || onSave)}
            hasUpload={!!onUploadFile}
          />
          <Toaster richColors />
        </TooltipProvider>
      </ThemeRoot>
    </BlogusaurusHandlersProvider>
  );
}

/**
 * The scoped root. Popovers, menus and dialogs portal into it (instead of
 * document.body) so they inherit the theme variables and mode.
 */
function ThemeRoot({
  theme,
  className,
  children,
}: {
  theme?: BlogusaurusTheme;
  className?: string;
  children: React.ReactNode;
}) {
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  const { className: rootClass, style, ...attrs } = themeProps(theme);

  return (
    <div
      {...attrs}
      ref={setRoot}
      className={cn(rootClass, 'bsk-surface bsk-fill', className)}
      style={style}
    >
      <PortalContainerProvider value={root ?? undefined}>
        {children}
      </PortalContainerProvider>
    </div>
  );
}

function CreatorInner({
  initialPost,
  autosave,
  fields,
  theme,
  placeholder = 'Tell your story… type / for commands',
  hasSave,
  hasPublish,
  hasUpload,
}: Omit<BlogusaurusCreatorProps, keyof BlogusaurusHandlers | 'className'> & {
  hasSave: boolean;
  hasPublish: boolean;
  hasUpload: boolean;
}) {
  const handlers = useBlogusaurusHandlers();
  const show = { cover: true, excerpt: true, tags: true, slug: true, ...fields };

  const [id, setId] = React.useState(initialPost?.id);
  const [title, setTitle] = React.useState(initialPost?.title ?? '');
  const [excerpt, setExcerpt] = React.useState(initialPost?.excerpt ?? '');
  const [slug, setSlug] = React.useState(initialPost?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!initialPost?.slug);
  const [tags, setTags] = React.useState<string[]>(initialPost?.tags ?? []);
  const [cover, setCover] = React.useState(initialPost?.coverImage);
  const [status, setStatus] = React.useState(initialPost?.status ?? 'draft');
  const [content, setContent] = React.useState(() =>
    parseContent(initialPost?.content)
  );
  const [view, setView] = React.useState<'edit' | 'preview'>('edit');
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [savedAt, setSavedAt] = React.useState<Date>();

  const editor = usePlateEditor(
    { plugins: BlogusaurusEditorKit, value: content },
    []
  );

  const post = React.useMemo<BlogusaurusPost>(
    () => ({
      version: BLOGUSAURUS_SCHEMA_VERSION,
      id,
      title: title.trim(),
      excerpt: excerpt.trim(),
      slug: slug || slugify(title),
      tags,
      coverImage: cover,
      status,
      content,
    }),
    [id, title, excerpt, slug, tags, cover, status, content]
  );

  // Fields that make a post "dirty". id/status are excluded: they change as a
  // result of saving and must not re-trigger a save.
  const snapshot = (p: BlogusaurusPost) => [
    p.title,
    p.excerpt,
    p.slug,
    p.tags,
    p.coverImage,
    p.content,
  ];
  const savedRef = React.useRef(snapshot(post));

  React.useEffect(() => {
    const current = snapshot(post);
    if (current.every((v, i) => v === savedRef.current[i])) return;

    setSaveState('dirty');
    handlers.onChange?.(post);
  }, [post, handlers]);

  const persist = React.useCallback(
    async (next: BlogusaurusPost, publish: boolean) => {
      const fn = publish ? (handlers.onPublish ?? handlers.onSave) : handlers.onSave;
      if (!fn) return;

      setSaveState('saving');
      try {
        const saved = await fn(next);
        const merged = { ...next, ...(saved || {}) };

        savedRef.current = snapshot(merged);
        if (saved) {
          setId(saved.id ?? next.id);
          setSlug(saved.slug);
        }
        if (publish) setStatus('published');
        setSavedAt(new Date());
        // Edits made while the request was in flight stay dirty.
        setSaveState((s) => (s === 'saving' ? 'saved' : s));
      } catch (error) {
        setSaveState('error');
        handlers.onError?.(error);
      }
    },
    [handlers]
  );

  const autosaveDelay =
    autosave === false || !hasSave ? null : (autosave?.delayMs ?? 2000);

  React.useEffect(() => {
    if (saveState !== 'dirty' || autosaveDelay === null) return;
    const timer = setTimeout(() => void persist(post, false), autosaveDelay);

    return () => clearTimeout(timer);
  }, [post, saveState, autosaveDelay, persist]);

  const words = countWords(content);
  const editing = view === 'edit';

  return (
    <Plate editor={editor} onValueChange={({ value }) => setContent(value)}>
      {/* Fills whatever height the host gives it and scrolls internally; with no
          fixed height it simply grows and the bar sticks to the page instead. */}
      <div className="flex h-full min-h-0 flex-col">
        <div className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur-sm">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
            <SaveStatus
              state={saveState}
              savedAt={savedAt}
              published={status === 'published'}
            />

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-muted/50 p-0.5">
                <Button
                  size="sm"
                  variant={editing ? 'secondary' : 'ghost'}
                  className={cn(editing && 'bg-background shadow-sm')}
                  onClick={() => setView('edit')}
                >
                  <PencilIcon /> Edit
                </Button>
                <Button
                  size="sm"
                  variant={!editing ? 'secondary' : 'ghost'}
                  className={cn(!editing && 'bg-background shadow-sm')}
                  onClick={() => setView('preview')}
                >
                  <EyeIcon /> Preview
                </Button>
              </div>
              {hasSave && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saveState === 'saving'}
                  onClick={() => void persist(post, false)}
                >
                  Save draft
                </Button>
              )}
              {hasPublish && (
                <Button
                  size="sm"
                  disabled={saveState === 'saving' || !post.title}
                  onClick={() =>
                    void persist({ ...post, status: 'published' }, true)
                  }
                >
                  {status === 'published' ? 'Update' : 'Publish'}
                </Button>
              )}
            </div>
          </header>

          <div className={cn(!editing && 'hidden')}>
            <FixedToolbar className="static rounded-none border-t border-b-0 bg-transparent px-3 py-1.5 backdrop-blur-none">
              <FixedToolbarButtons />
            </FixedToolbar>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Both views stay mounted so editor state (undo history, selection) survives toggling. */}
          <div className={cn(!editing && 'hidden')}>
            <div className="mx-auto w-full max-w-3xl px-6 pt-10 sm:px-12">
              {show.cover && (
                <CoverField
                  cover={cover}
                  onChange={setCover}
                  canUpload={hasUpload}
                />
              )}
              <textarea
                value={title}
                rows={1}
                placeholder="Title"
                aria-label="Title"
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                className="field-sizing-content mt-2 block w-full resize-none overflow-hidden bg-transparent font-bold text-4xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40"
              />
              {show.excerpt && (
                <textarea
                  value={excerpt}
                  rows={1}
                  placeholder="Add a short summary…"
                  aria-label="Excerpt"
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="field-sizing-content mt-3 block w-full resize-none overflow-hidden bg-transparent text-lg text-muted-foreground leading-relaxed outline-none placeholder:text-muted-foreground/40"
                />
              )}
              {(show.tags || show.slug) && (
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4 text-sm">
                  {show.tags && <TagsField tags={tags} onChange={setTags} />}
                  {show.slug && (
                    <label className="flex items-center gap-1 text-muted-foreground">
                      <span className="font-mono text-xs">/</span>
                      <input
                        value={slug}
                        aria-label="Slug"
                        placeholder="post-slug"
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(slugify(e.target.value));
                        }}
                        className="w-44 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/40"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-3xl px-6 sm:px-12">
              <EditorContainer className="h-auto overflow-visible">
                <Editor
                  variant="none"
                  placeholder={placeholder}
                  className="min-h-[320px] px-0 pt-6 pb-40 text-base"
                />
              </EditorContainer>
            </div>
          </div>

          {!editing && <BlogusaurusRender post={post} theme={theme} />}
        </div>

        <footer className="shrink-0 border-t px-4 py-1.5 text-muted-foreground text-xs">
          {words} {words === 1 ? 'word' : 'words'} · {readingTime(content)} min
          read
        </footer>
      </div>
    </Plate>
  );
}

function SaveStatus({
  state,
  savedAt,
  published,
}: {
  state: SaveState;
  savedAt?: Date;
  published: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 text-muted-foreground text-sm"
      aria-live="polite"
    >
      <span
        className={cn(
          'rounded-full px-2 py-0.5 font-medium text-xs',
          published
            ? 'bg-brand/15 text-brand'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {published ? 'Published' : 'Draft'}
      </span>
      {state === 'saving' && (
        <span className="flex items-center gap-1.5">
          <Loader2Icon className="size-3.5 animate-spin" /> Saving…
        </span>
      )}
      {state === 'saved' && (
        <span className="flex items-center gap-1.5">
          <CheckIcon className="size-3.5" /> Saved
          {savedAt &&
            ` ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </span>
      )}
      {state === 'dirty' && <span>Unsaved changes</span>}
      {state === 'error' && (
        <span className="text-destructive">Save failed</span>
      )}
    </div>
  );
}

function CoverField({
  cover,
  onChange,
  canUpload,
}: {
  cover?: { url: string; alt?: string };
  onChange: (cover?: { url: string; alt?: string }) => void;
  canUpload: boolean;
}) {
  const { onUploadFile, onError } = useBlogusaurusHandlers();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [urlOpen, setUrlOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');

  async function upload(file: File) {
    setBusy(true);
    try {
      const res = await onUploadFile!(file, {
        kind: 'cover',
        onProgress: () => {},
      });
      onChange({ url: res.url, alt: cover?.alt });
    } catch (error) {
      onError?.(error);
    } finally {
      setBusy(false);
    }
  }

  if (cover) {
    return (
      <div className="group relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover.url}
          alt={cover.alt ?? ''}
          className="aspect-[2/1] w-full rounded-xl border object-cover"
        />
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Remove cover image"
          className="absolute top-3 right-3 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={() => onChange(undefined)}
        >
          <XIcon />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="-ml-2 flex items-center gap-1 text-muted-foreground">
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = '';
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2Icon className="animate-spin" /> : <ImageIcon />}
              Add cover
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => setUrlOpen((o) => !o)}>
          <LinkIcon /> Cover from URL
        </Button>
      </div>
      {urlOpen && (
        <form
          className="mt-1 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!url.trim()) return;
            onChange({ url: url.trim() });
            setUrl('');
            setUrlOpen(false);
          }}
        >
          <Input
            autoFocus
            value={url}
            placeholder="https://…/image.jpg"
            aria-label="Cover image URL"
            onChange={(e) => setUrl(e.target.value)}
            className="h-8"
          />
          <Button size="sm" type="submit">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}

function TagsField({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    const tag = draft.trim().replace(/,$/, '');
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setDraft('');
  };

  return (
    <div className="flex min-w-48 flex-1 flex-wrap items-center gap-2">
      <TagIcon className="size-4 text-muted-foreground" />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-1 pl-2.5 text-xs"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            className="rounded-full p-0.5 hover:bg-background"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={tags.length ? 'Add tag' : 'Add tags…'}
        aria-label="Add tag"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
