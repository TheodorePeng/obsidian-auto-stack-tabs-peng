import esbuild from 'esbuild';
import { builtinModules } from 'node:module';

const production = process.argv[2] === 'production';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', ...builtinModules],
  format: 'cjs',
  target: 'es2021',
  outfile: 'main.js',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
});
