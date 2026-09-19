// Builds dist/styles.css: Tailwind compiled ahead of time, then scoped under
// `.bsk-root` so it can neither leak into nor be broken by the host's CSS.
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwind from '@tailwindcss/postcss';
import postcss from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = '.bsk-root';
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// --- tokens -> CSS -------------------------------------------------------
const tokens = JSON.parse(
  await readFile(resolve(root, 'src/blogusaurus/tokens.json'), 'utf8')
);
const names = Object.keys(tokens);

const modeVars = (mode, prefix) =>
  names
    .map(
      (n) =>
        `  --bsk-${kebab(n)}: var(--bsk-${prefix}-${kebab(n)}, var(--bsk-c-${kebab(n)}, ${tokens[n][mode]}));`
    )
    .join('\n');

const tokensCss = `
${ROOT} {
  --bsk-radius: var(--bsk-c-radius, 0.625rem);
${modeVars('light', 'l')}
}
${ROOT}[data-bsk-theme="dark"] {
${modeVars('dark', 'd')}
}
${ROOT}[data-bsk-theme="inherit"]:where(.dark *, [data-theme="dark"] *) {
${modeVars('dark', 'd')}
}
@media (prefers-color-scheme: dark) {
  ${ROOT}[data-bsk-theme="system"] {
${modeVars('dark', 'd')}
  }
}
`;

const themeMap = names
  .map((n) => `  --color-${kebab(n)}: var(--bsk-${kebab(n)});`)
  .join('\n');

// --- plugins ---------------------------------------------------------------
// Layered CSS always loses to the host's unlayered CSS, so flatten layers.
const unwrapLayers = () => ({
  postcssPlugin: 'bsk-unwrap-layers',
  OnceExit(css) {
    css.walkAtRules('layer', (rule) => {
      if (rule.nodes?.length) rule.replaceWith(rule.nodes);
      else rule.remove();
    });
  },
});
unwrapLayers.postcss = true;

const scope = prefixSelector({
  prefix: ROOT,
  transform(prefix, selector, prefixed, _file, rule) {
    if (rule?.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) {
      return selector;
    }
    // Already scoped (the token rules above).
    if (selector.startsWith(ROOT)) return selector;
    // Tailwind's `:root, :host` theme block and preflight's html/body rules apply to our root.
    if (/^(:root|:host|html|body)$/.test(selector)) return prefix;
    if (selector === '*') return `${prefix}, ${prefix} *`;

    return prefixed;
  },
});

// --- build -----------------------------------------------------------------
const entry = resolve(root, 'src/styles/index.css');
const source = (await readFile(entry, 'utf8'))
  .replace('/*__TOKENS__*/', tokensCss)
  .replace('/*__THEME_MAP__*/', themeMap);

const result = await postcss([
  tailwind({ base: root, optimize: true }),
  unwrapLayers(),
  scope,
]).process(source, { from: entry });

// KaTeX fonts: keep woff2 only, and point at the copy shipped next to styles.css.
const css = result.css
  .replace(/,\s*url\([^)]*\.(?:woff|ttf)\)\s*format\("[^"]*"\)/g, '')
  .replace(/url\([^)]*\/(KaTeX_[\w-]+\.woff2)\)/g, 'url(./fonts/$1)');

await mkdir(resolve(root, 'dist/fonts'), { recursive: true });
await writeFile(resolve(root, 'dist/styles.css'), css);
await cp(resolve(root, 'node_modules/katex/dist/fonts'), resolve(root, 'dist/fonts'), {
  recursive: true,
  filter: (src) => !/\.(?:woff|ttf)$/.test(src),
});

console.log(`styles.css ${(css.length / 1024).toFixed(0)} kB`);
