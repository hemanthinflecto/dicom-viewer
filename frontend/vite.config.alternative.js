import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alternative config - Use this if the regular build still has issues
// Rename to vite.config.js to use this configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: [
      '@cornerstonejs/core',
      '@cornerstonejs/tools',
      '@cornerstonejs/dicom-image-loader',
      'dicom-parser'
    ]
  },
  build: {
    // Use development mode bundling (slower but no circular dependency issues)
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined // Let Vite handle chunking automatically
      }
    }
  }
})
