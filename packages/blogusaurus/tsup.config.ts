import { defineConfig } from 'tsup';

// tsup externalizes `dependencies` and `peerDependencies` automatically.
const common = {
  format: ['esm'] as ['esm'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: false,
};

export default defineConfig([
  // Interactive editor: a client bundle. The directive must be on every emitted file.
  {
    ...common,
    entry: { index: 'src/index.ts' },
    banner: { js: '"use client";' },
  },
  // Renderer + helpers: no directive, so it can run in React Server Components.
  {
    ...common,
    entry: { render: 'src/render.ts' },
  },
]);
