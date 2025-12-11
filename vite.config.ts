import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { resolve } from 'path';

// Custom plugin to fix AMD define calls that get bundled as (void 0)
function amdDefineShim(): Plugin {
  return {
    name: 'amd-define-shim',
    enforce: 'post',
    generateBundle(options, bundle) {
      // AMD define shim - stores exports in __amdExports__ for retrieval
      const shimCode = `var __amdExports__={};var define=function(d,f){if(typeof d==="function"){f=d;d=[]}var e={},m={exports:e};if(typeof f==="function"){f(function(){},e,m)}var result=m.exports&&Object.keys(m.exports).length?m.exports:e;__amdExports__[Math.random()]=result;return result};define.amd=true;`;

      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          let modified = false;

          // Pattern 1: (void 0)([ - AMD define converted to void 0
          if (chunk.code.includes('(void 0)([')) {
            chunk.code = chunk.code.replace(/\(void 0\)\(\[/g, 'define([');
            modified = true;
            console.log(`[amd-define-shim] Fixed (void 0)([ pattern in: ${fileName}`);
          }

          // Pattern 2: Fix the wrapper that returns empty sf object instead of define result
          // Pattern: })()), sf}var becomes proper export capture
          if (chunk.code.includes('),sf}var')) {
            // The pattern is: var sf={},af;function Mh(){return af||(af=1,(function(){define(...)})()),sf}var
            // We need to make define populate sf instead of returning empty object
            chunk.code = chunk.code.replace(
              /var sf=\{\},af;(function \w+\(\)\{return af\|\|\(af=1,\(function\(\)\{)(define\()/g,
              'var sf={},af;$1sf=$2'
            );
            modified = true;
            console.log(`[amd-define-shim] Fixed sf return pattern in: ${fileName}`);
          }

          // Add shim if any AMD patterns were found
          if (modified) {
            chunk.code = shimCode + chunk.code;
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    amdDefineShim(),
    viteCommonjs(),
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
