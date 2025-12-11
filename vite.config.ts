import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
    }),
  ],

  // Use relative paths for Azure DevOps extension compatibility
  base: './',

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',

    rollupOptions: {
      input: {
        extension: resolve(__dirname, 'src-modern/extension/index.html'),
        settings: resolve(__dirname, 'src-modern/settings/index.html'),
        chooseTemplate: resolve(__dirname, 'src-modern/chooseTemplate/index.html'),
      },

      output: {
        // Bundle everything into single files (no code splitting)
        // Azure DevOps iframes have issues with ES module imports
        entryFileNames: '[name].js',

        // Inline all chunks - no separate chunk files
        inlineDynamicImports: false,

        // Assets avec hash
        assetFileNames: (assetInfo) => {
          // Images et fonts dans assets/
          if (/\.(png|jpe?g|svg|gif|ico|webp)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|eot)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          // Autres assets
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Optimisations
    cssCodeSplit: true,
    reportCompressedSize: false, // Plus rapide
    chunkSizeWarningLimit: 1000,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src-modern'),
      '@core': resolve(__dirname, 'src-modern/core'),
      '@features': resolve(__dirname, 'src-modern/features'),
      '@shared': resolve(__dirname, 'src-modern/shared'),
      '@config': resolve(__dirname, 'src-modern/config'),
    },
  },

  server: {
    port: 6221,
    https: true,
    host: true,
    open: false,

    // HMR configuration
    hmr: {
      overlay: true,
    },
  },

  preview: {
    port: 6222,
    https: true,
  },

  // Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'azure-devops-extension-sdk',
      'azure-devops-extension-api',
    ],
    exclude: ['azure-devops-ui'], // Peut causer des problèmes avec le bundling
  },
});
