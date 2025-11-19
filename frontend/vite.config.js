import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
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
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Don't bundle cornerstone libraries together to avoid circular dependency issues
        manualChunks(id) {
          if (id.includes('@cornerstonejs/core')) {
            return 'cornerstone-core'
          }
          if (id.includes('@cornerstonejs/tools')) {
            return 'cornerstone-tools'
          }
          if (id.includes('@cornerstonejs/dicom-image-loader')) {
            return 'cornerstone-loader'
          }
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
})
