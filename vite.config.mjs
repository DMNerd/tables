import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import checker from 'vite-plugin-checker';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let base = env.VITE_BASE_PATH || '/';
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base = base + '/';

  return {
    base,
    root: __dirname,
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [
      react(),
      tsconfigPaths(),
      checker({ typescript: true }),
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
