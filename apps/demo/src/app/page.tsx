import {
  FeatherIcon,
  FileJsonIcon,
  PaletteIcon,
  PlugZapIcon,
  ServerIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { BlogusaurusRender } from "blogusaurus/render";

import { CopyButton } from "./_landing/copy-button";
import { Playground } from "./_landing/playground";
import { ThemeToggle } from "./_landing/theme-toggle";
import { samplePost } from "./_landing/sample";
import { theme } from "./_landing/theme";

const INSTALL = "pnpm add blogusaurus";

const CREATE_CODE = `"use client";
import { BlogusaurusCreator } from "blogusaurus";

export default function NewPost() {
  return (
    <BlogusaurusCreator
      onSave={(post) => api.savePost(post)}
      onPublish={(post) => api.publishPost(post)}
      onUploadFile={(file) => api.upload(file)} // resolves to { url }
    />
  );
}`;

const RENDER_CODE = `import { BlogusaurusRender } from "blogusaurus/render";

export default async function Post({ params }) {
  const post = await db.posts.find(params.slug);
  return <BlogusaurusRender post={post} />;
}`;

const THEME_CODE = `<BlogusaurusCreator
  theme={{
    mode: "inherit", // follows your app's dark mode
    colors: { primary: "#4f46e5", brand: "#6366f1" },
    dark: { primary: "#818cf8" },
    radius: "0.75rem",
  }}
/>`;

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ServerIcon,
    title: "Server-safe renderer",
    body: "Render stored posts in React Server Components. No editor runtime, no client JavaScript.",
  },
  {
    icon: PlugZapIcon,
    title: "Bring your own backend",
    body: "You pass save, publish and upload functions. Blogusaurus never talks to a server you didn't choose.",
  },
  {
    icon: FileJsonIcon,
    title: "Portable JSON",
    body: "Posts are plain, versioned JSON. Keep them in any database column and export to Markdown when you need it.",
  },
  {
    icon: PaletteIcon,
    title: "Themeable from code",
    body: "Light, dark, system or follow your app. Change colors, radius and fonts with a single prop.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Styles that stay put",
    body: "Precompiled CSS scoped to its own root. It can't leak into your app, and your app can't break it.",
  },
  {
    icon: FeatherIcon,
    title: "Rich text, batteries included",
    body: "Headings, lists, tables, code, media, math, columns, callouts, slash commands, drag and drop, autosave.",
  },
];

function Code({ file, code }: { file: string; code: string }) {
  return (
    <div className="code">
      <div className="code-bar">
        <span>{file}</span>
        <CopyButton text={code} />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="brand">
            <span className="logo">
              <FeatherIcon size={16} />
            </span>
            Blogusaurus
          </a>
          <nav aria-label="Primary">
            <a href="#demo">Live demo</a>
            <a href="#features">Features</a>
            <a href="#usage">Usage</a>
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <a href="#install" className="btn btn-primary btn-sm">
              Get started
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero wrap">
          <p className="eyebrow">Rich-text blog editor for React and Next.js</p>
          <h1>
            Ship a blog editor in <span className="grad">one import</span>.
          </h1>
          <p className="lede">
            Blogusaurus is a drop-in creator and a server-safe renderer. Bring your own backend.
            No Tailwind, no shadcn, no setup.
          </p>

          <div className="hero-actions" id="install">
            <div className="install">
              <span className="prompt">$</span>
              <code>{INSTALL}</code>
              <CopyButton text={INSTALL} />
            </div>
            <a href="#demo" className="btn btn-primary">
              Try the editor
            </a>
          </div>
        </section>

        <section id="demo" className="wrap section">
          <div className="section-head">
            <h2>Try it right here</h2>
            <p>This is the real package. Edit the post, then switch to the Renderer.</p>
          </div>
          <Playground />
        </section>

        <section id="features" className="wrap section">
          <div className="section-head">
            <h2>Everything a blog needs, nothing to wire up</h2>
          </div>
          <div className="features">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="feature">
                <span className="feature-icon">
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="usage" className="wrap section">
          <div className="section-head">
            <h2>Two components. That&apos;s the whole API.</h2>
            <p>
              Import the stylesheet once, then write with <code>BlogusaurusCreator</code> and read with{" "}
              <code>BlogusaurusRender</code>.
            </p>
          </div>

          <div className="usage">
            <div className="usage-col">
              <Code file="app/layout.tsx" code={`import "blogusaurus/styles.css";`} />
              <Code file="app/blog/[slug]/page.tsx" code={RENDER_CODE} />
              <Code file="theme (optional)" code={THEME_CODE} />
            </div>
            <div className="usage-col">
              <Code file="app/admin/new/page.tsx" code={CREATE_CODE} />
            </div>
          </div>

          <div className="output">
            <p className="output-label">
              <span className="dot" /> Output of <code>BlogusaurusRender</code>, running in a Server
              Component on this page
            </p>
            <BlogusaurusRender post={samplePost} theme={theme} />
          </div>
        </section>

        <section className="wrap section cta">
          <h2>Start writing in minutes</h2>
          <div className="install">
            <span className="prompt">$</span>
            <code>{INSTALL}</code>
            <CopyButton text={INSTALL} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">Blogusaurus</div>
      </footer>
    </>
  );
}
