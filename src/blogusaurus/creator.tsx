'use client';

import * as React from 'react';

import { Plate, usePlateEditor } from 'platejs/react';
import {
  CheckIcon,
  EyeIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

import { BlogusaurusHandlersProvider, useBlogusaurusHandlers } from './context';
import { BlogusaurusEditorKit } from './kit';
import { BlogusaurusRender } from './render';
import { countWords, parseContent, readingTime, slugify } from './serialize';
import { type BlogusaurusTheme, BlogusaurusThemeProvider } from './theme';
import type {
  BlogusaurusContent,
  BlogusaurusHandlers,
  BlogusaurusPost,
} from './types';

import 'katex/dist/katex.min.css';

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
  /** Extra Plate plugins appended to the built-in kit: the extension point for custom nodes. */
  plugins?: typeof BlogusaurusEditorKit;
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
      <BlogusaurusThemeProvider theme={theme} className={className}>
        <TooltipProvider>
          <CreatorInner {...props} hasSave={!!onSave} hasPublish={!!(onPublish || onSave)} hasUpload={!!onUploadFile} />
          <Toaster richColors />
        </TooltipProvider>
      </BlogusaurusThemeProvider>
    </BlogusaurusHandlersProvider>
  );
}

function CreatorInner({
  initialPost,
  autosave,
  fields,
  plugins = [],
  placeholder = 'Tell your story… type / for commands',
  hasSave,
  hasPublish,
  hasUpload,
}: Omit<BlogusaurusCreatorProps, keyof BlogusaurusHandlers | 'theme' | 'className'> & {
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
    { plugins: [...BlogusaurusEditorKit, ...plugins], value: content },
    []
  );

  const post = React.useMemo<BlogusaurusPost>(
    () => ({
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

  return (
    <div className="flex min-h-full flex-col [&_[role=toolbar].sticky]:top-[57px]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
        <SaveStatus state={saveState} savedAt={savedAt} published={status === 'published'} />

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={view === 'edit' ? 'secondary' : 'ghost'}
              onClick={() => setView('edit')}
            >
              <PencilIcon /> Edit
            </Button>
            <Button
              size="sm"
              variant={view === 'preview' ? 'secondary' : 'ghost'}
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
              onClick={() => void persist({ ...post, status: 'published' }, true)}
            >
              {status === 'published' ? 'Update' : 'Publish'}
            </Button>
          )}
        </div>
      </header>

      {/* Both views stay mounted so editor state (undo history, selection) survives toggling. */}
      <div className={cn(view === 'preview' && 'hidden')}>
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-8">
          {show.cover && (
            <CoverField cover={cover} onChange={setCover} canUpload={hasUpload} />
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
            className="field-sizing-content w-full resize-none overflow-hidden bg-transparent font-bold text-4xl tracking-tight outline-none placeholder:text-muted-foreground/50"
          />
          {show.excerpt && (
            <textarea
              value={excerpt}
              rows={1}
              placeholder="Short summary (used in listings and meta description)"
              aria-label="Excerpt"
              onChange={(e) => setExcerpt(e.target.value)}
              className="field-sizing-content w-full resize-none overflow-hidden bg-transparent text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/50"
            />
          )}
          {show.tags && <TagsField tags={tags} onChange={setTags} />}
          {show.slug && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>/</span>
              <Input
                value={slug}
                aria-label="Slug"
                placeholder="post-slug"
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="h-7 max-w-xs"
              />
            </div>
          )}
        </div>

        <div className="mx-auto mt-6 w-full max-w-4xl px-2">
          <Plate
            editor={editor}
            onValueChange={({ value }) => setContent(value)}
          >
            <EditorContainer className="h-auto overflow-visible">
              <Editor
                variant="none"
                placeholder={placeholder}
                className="min-h-[420px] px-6 pt-4 pb-40 text-base"
              />
            </EditorContainer>
          </Plate>
        </div>
      </div>

      {view === 'preview' && <BlogusaurusRender post={post} />}

      <footer className="mt-auto border-t px-4 py-2 text-muted-foreground text-xs">
        {words} {words === 1 ? 'word' : 'words'} · {readingTime(content)} min read
      </footer>
    </div>
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
    <div className="flex items-center gap-2 text-muted-foreground text-sm" aria-live="polite">
      <span className="rounded-full bg-muted px-2 py-0.5 text-foreground text-xs">
        {published ? 'Published' : 'Draft'}
      </span>
      {state === 'saving' && (
        <>
          <Loader2Icon className="size-3.5 animate-spin" /> Saving…
        </>
      )}
      {state === 'saved' && (
        <>
          <CheckIcon className="size-3.5" /> Saved{' '}
          {savedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </>
      )}
      {state === 'dirty' && 'Unsaved changes'}
      {state === 'error' && <span className="text-destructive">Save failed</span>}
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
  const [url, setUrl] = React.useState('');

  async function upload(file: File) {
    setBusy(true);
    try {
      const res = await onUploadFile!(file, { kind: 'cover', onProgress: () => {} });
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
          className="aspect-[2/1] w-full rounded-xl object-cover"
        />
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Remove cover image"
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onChange(undefined)}
        >
          <XIcon />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
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
            {busy ? <Loader2Icon className="animate-spin" /> : <ImageIcon />} Add cover image
          </Button>
        </>
      )}
      <Input
        value={url}
        placeholder="or paste an image URL"
        aria-label="Cover image URL"
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && url.trim()) {
            onChange({ url: url.trim() });
            setUrl('');
          }
        }}
        className="h-8 max-w-xs"
      />
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
    <div className="flex flex-wrap items-center gap-2">
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
        placeholder={tags.length ? 'Add tag' : 'Add tags (press Enter)'}
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
        className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
