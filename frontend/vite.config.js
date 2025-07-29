import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd());
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
    ],
    // Base public path when served in production
    base: '/',
    // Build options
    build: {
      // Output directory
      outDir: 'dist',
      // Enable minification using esbuild (faster and built-in)
      minify: isProd ? 'esbuild' : false,
      // Generate sourcemaps based on environment
      sourcemap: mode === 'development',
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // CSS code splitting
      cssCodeSplit: true,
      // Enable CSS minification
      cssMinify: isProd,
      // Asset file name format
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Create separate chunks for major dependencies
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animations';
              }
              if (id.includes('axios')) {
                return 'vendor-network';
              }
              return 'vendor'; // All other dependencies
            }
          },
          // Ensure assets are placed in appropriate directories
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
              extType = 'img';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // Report on build performance
      reportCompressedSize: true,
    },
    // Server options
    server: {
      port: 3001,
      strictPort: false,
      host: true,
      // Proxy API requests in development
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // Preview options for `vite preview` command
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', 'axios'],
    },
  };
});
