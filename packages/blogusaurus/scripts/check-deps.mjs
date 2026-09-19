// Fails the build if the published package would break for a consumer that does
// not auto-install peer dependencies (npm/yarn setups, Vite's dep optimizer, ...).
// Inside this monorepo pnpm auto-installs missing peers, which hides these bugs.
import { existsSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);
const problems = [];

// 1. Every bare import in the built output is declared.
const imports = new Set();
for (const file of ['dist/index.js', 'dist/render.js']) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/(?:from|import) "([^".][^"]*)"/g)) {
    const s = m[1];
    imports.add(s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);
  }
}
for (const name of imports) {
  if (!declared.has(name)) problems.push(`built code imports "${name}" but it is not a dependency`);
}

// 2. Every required (non-optional, non-@types) peer of our dependencies is declared.
for (const dep of Object.keys(pkg.dependencies ?? {})) {
  const file = `node_modules/${dep}/package.json`;
  if (!existsSync(file)) continue;
  const m = JSON.parse(readFileSync(file, 'utf8'));
  for (const peer of Object.keys(m.peerDependencies ?? {})) {
    const optional = m.peerDependenciesMeta?.[peer]?.optional;
    if (!optional && !peer.startsWith('@types/') && !declared.has(peer)) {
      problems.push(`"${dep}" requires peer "${peer}", which blogusaurus does not declare`);
    }
  }
}

if (problems.length) {
  console.error('Dependency check failed:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log('dependency check ok');
