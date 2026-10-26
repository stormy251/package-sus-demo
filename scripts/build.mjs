import { build } from 'esbuild';
await build({ entryPoints: ['browser/app.js'], bundle: true, format: 'esm', minify: true, outfile: 'app.js', target: 'es2022', platform: 'browser', legalComments: 'none', logLevel: 'info' });
