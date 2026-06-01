import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': env,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui': ['shadcn', 'lucide-react'],
            'supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      strictPort: false,
      middlewareMode: false,
      fs: {
        strict: true,
      },
    },
    preview: {
      port: 5173,
      host: true,
    },
  };
});
