import { createSlateEditor } from 'platejs';

import { EditorStatic } from '@/components/ui/editor-static';
import { cn } from '@/lib/utils';

import { parseContent, readingTime } from './serialize';
import { BlogusaurusStaticKit } from './static-kit';
import { type BlogusaurusTheme, themeProps } from './theme';
import type { BlogusaurusContent, BlogusaurusPost } from './types';

export type BlogusaurusRenderProps = {
  /** A stored post. Renders cover, title, excerpt, tags and the body. */
  post?: Partial<Omit<BlogusaurusPost, 'content'>> & {
    content?: BlogusaurusContent | string | null;
  };
  /** Just the body. Use instead of `post` when you have your own page chrome. */
  content?: BlogusaurusContent | string | null;
  /** Set to false to render only the body of `post`. */
  showHeader?: boolean;
  /** Wraps the output in a scoped theme. Omit to inherit the surrounding theme. */
  theme?: BlogusaurusTheme;
  className?: string;
};

/**
 * Server-safe: renders stored content to static HTML with no editor runtime,
 * so it works in React Server Components and costs no client JS.
 */
export function BlogusaurusRender({
  post,
  content,
  showHeader = true,
  theme,
  className,
}: BlogusaurusRenderProps) {
  const value = parseContent(content ?? post?.content);
  const editor = createSlateEditor({
    plugins: BlogusaurusStaticKit,
    value,
  });

  const { className: rootClass, style, ...attrs } = themeProps(theme);
  // Transparent and inheriting the host's color by default; an explicit mode
  // means "make it look like this", so it gets an opaque themed surface.
  const surface = !!theme?.mode && theme.mode !== 'inherit';

  // Every package style is scoped to `.bsk-root`, so the wrapper is required.
  return (
    <div
      {...attrs}
      className={cn(rootClass, surface && 'bsk-surface', className)}
      style={style}
    >
      <article className="mx-auto w-full max-w-3xl px-4 py-8">
        {showHeader && post && <PostHeader post={post} content={value} />}
        <EditorStatic editor={editor} variant="none" className="text-base" />
      </article>
    </div>
  );
}

function PostHeader({
  post,
  content,
}: {
  post: NonNullable<BlogusaurusRenderProps['post']>;
  content: BlogusaurusContent;
}) {
  return (
    <header className="mb-8 space-y-4">
      {post.coverImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage.url}
          alt={post.coverImage.alt ?? ''}
          className="aspect-[2/1] w-full rounded-xl object-cover"
        />
      )}
      {post.title && (
        <h1 className="font-bold text-4xl tracking-tight">{post.title}</h1>
      )}
      {post.excerpt && (
        <p className="text-lg text-muted-foreground">{post.excerpt}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
        <span>{readingTime(content)} min read</span>
        {post.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2.5 py-0.5 text-foreground text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </header>
  );
}
