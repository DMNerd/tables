import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let base = env.VITE_BASE_PATH || '/';
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base = base + '/';

  return {
    base,
    root: __dirname,
    publicDir: path.resolve(__dirname, 'public'),
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      react(),
      checker({ typescript: true }),
      compression({
        include: [/\.(js|mjs|json|css|html|svg|txt|xml)$/i],
        threshold: 1024,
        skipIfLargerOrEqual: true,
        deleteOriginalAssets: false,
        algorithms: [
          defineAlgorithm('gzip', {
            level: 9,
          }),
          defineAlgorithm('brotliCompress', {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          }),
        ],
      }),
    ],
    server: {
      open: base,
    },
    preview: {
      open: base,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
    },
  };
});