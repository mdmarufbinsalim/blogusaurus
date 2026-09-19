# Blogusaurus

Monorepo:

- [`packages/blogusaurus`](packages/blogusaurus): the package (`Creator`, `Render`, styles). See its README.
- [`apps/demo`](apps/demo): a plain Next.js app (no Tailwind, no shadcn) that consumes the package like any host would. Includes a Server Component route (`/ssr`).

```bash
pnpm install
pnpm dev        # rebuilds the package on change + runs the demo
pnpm build      # package, then demo
```
