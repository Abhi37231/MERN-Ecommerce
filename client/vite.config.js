import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sitemap-middleware',
      configureServer(server) {
        server.middlewares.use('/sitemap.xml', async (req, res, next) => {
          try {
            // Use Vite's ssrLoadModule to execute the Vercel function
            const module = await server.ssrLoadModule('/api/sitemap.js');
            const handler = module.default;
            
            // Polyfill Express/Vercel response methods for the native Node.js HTTP response
            res.status = (code) => { res.statusCode = code; return res; };
            res.send = (data) => { res.end(data); };
            res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
            
            await handler(req, res);
          } catch (error) {
            console.error('Sitemap middleware error:', error);
            next(error);
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor';
            if (id.includes('@reduxjs/toolkit') || id.includes('redux')) return 'redux';
            if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('react-icons')) return 'ui';
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
