# blogusaurus

A rich-text blog **creator** and **renderer** for Next.js / React. Install it and it works: no Tailwind, no shadcn, no design tokens to set up.

```bash
pnpm add blogusaurus
```

## Use it

Import the stylesheet once (e.g. in `app/layout.tsx`):

```tsx
import "blogusaurus/styles.css";
```

**Write** (client component):

```tsx
"use client";
import { BlogusaurusCreator } from "blogusaurus";

export default function NewPost() {
  return (
    <BlogusaurusCreator
      onSave={async (post) => (await api.savePost(post)) /* return the saved post to merge back an id */}
      onPublish={async (post) => api.publishPost(post)}
      onUploadFile={async (file, { kind, onProgress }) => ({ url: await api.upload(file) })}
    />
  );
}
```

**Read** (works in Server Components, ships no editor JS):

```tsx
import { BlogusaurusRender } from "blogusaurus/render";

export default async function Post({ params }) {
  const post = await db.posts.find(params.slug);
  return <BlogusaurusRender post={post} />; // or content={post.content}
}
```

`content` can be the stored JSON value or a JSON string of it.

## Creator props

| Prop | |
|---|---|
| `onSave(post)` | Save draft. Also called by autosave. May return the saved post. |
| `onPublish(post)` | Publish. Falls back to `onSave` with `status: "published"`. |
| `onUploadFile(file, { kind, onProgress })` | Upload to your storage, return `{ url }`. Without it, media can only be embedded by URL. |
| `onChange(post)` / `onError(err)` | Every edit / any handler failure. |
| `initialPost` | Load a post to edit (read once; remount with `key` to swap). |
| `autosave` | `false`, or `{ delayMs }`. Default 2s, only when `onSave` is set. |
| `fields` | Hide `cover`, `excerpt`, `tags` or `slug`. |
| `theme`, `className`, `placeholder` | See below. |

## Theming

```tsx
<BlogusaurusCreator
  theme={{
    mode: "inherit", // "inherit" (default) | "light" | "dark" | "system"
    colors: { primary: "#4f46e5", brand: "#4f46e5" }, // both modes
    dark: { background: "#0b0b12" },                  // dark only (`light` also exists)
    radius: "0.5rem",
    fontFamily: "Georgia, serif",
  }}
/>
```

`inherit` follows your app: dark when an ancestor has the `dark` class or `data-theme="dark"`.
The same `theme` prop works on `BlogusaurusRender`. Tokens: `background foreground card popover primary secondary muted accent destructive border input ring brand highlight` (plus `*Foreground` variants).

## Stored data

A post is plain JSON (`BlogusaurusPost`, with `version: 1`), safe to keep in any JSON/text column. Helpers: `parseContent`, `contentToMarkdown`, `markdownToContent`, `contentToText`, `countWords`, `readingTime`, `slugify`.

## How the styles stay out of your way

`styles.css` is precompiled and every rule is scoped under `.bsk-root`, with no global resets and no cascade layers, so it can't affect your app and your app's CSS can't break it. Popovers and menus render inside that root, not `document.body`. Requires React 19.

## Develop

From the repo root: `pnpm dev` (package watch + demo app), `pnpm build`, `pnpm typecheck`, `pnpm lint`.
