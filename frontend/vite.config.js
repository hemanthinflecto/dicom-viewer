import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: [
      'cornerstone-core',
      'cornerstone-tools',
      'cornerstone-wado-image-loader',
      'dicom-parser'
    ]
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks(id) {
          if (id.includes('node_modules/@cornerstonejs') || id.includes('node_modules/dicom-parser')) {
            return 'cornerstone'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
})
