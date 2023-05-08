const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16',
    outfile: 'out/extension.js',
    external: ['vscode'],
    format: 'cjs',
    minify: true,
  })
  .catch(() => process.exit(1));
