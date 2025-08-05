/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
// const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  /* base: '/potential-adventure/' */
  build: {
    // Increase chunk size warning limit to 1000kB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@heroui/react'],
          'vendor-spine': ['@esotericsoftware/spine-webgl'],
          'vendor-gif': ['gif.js'],
          // Separate large application modules
          'spine-viewer': ['./src/ViewerMain.jsx'],
          'webview-ui': ['./src/temp_webview.tsx', './src/WebView.tsx'],
        },
        // Generate smaller chunks with descriptive names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '')
            : 'chunk';
          return `${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Enable source maps for better debugging in production
    sourcemap: true,
    // Optimize minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@heroui/react',
      '@esotericsoftware/spine-webgl',
      'gif.js'
    ],
    exclude: ['@tailwindcss/vite'],
  },
});