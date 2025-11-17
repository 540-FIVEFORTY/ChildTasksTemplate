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

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',

    rollupOptions: {
      input: {
        extension: resolve(__dirname, 'src/extension/index.html'),
        settings: resolve(__dirname, 'src/settings/index.html'),
        chooseTemplate: resolve(__dirname, 'src/chooseTemplatePanel/index.html'),
      },

      output: {
        // Noms de fichiers pour les entry points
        entryFileNames: '[name].js',

        // Chunks avec hash pour cache busting
        chunkFileNames: 'chunks/[name]-[hash].js',

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

        // Optimisation des chunks
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('azure-devops')) {
              return 'vendor-azure';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'vendor-state';
            }
            return 'vendor';
          }
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
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@features': resolve(__dirname, 'src/features'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@config': resolve(__dirname, 'src/config'),
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
