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
    minify: 'terser',
    terserOptions: {
      compress: {
        // Prevent variable name mangling that causes initialization issues
        keep_fnames: true,
        keep_classnames: true
      },
      mangle: false
    },
    rollupOptions: {
      output: {
        // Preserve module structure to avoid hoisting issues
        preserveModules: false,
        hoistTransitiveImports: false,
        manualChunks(id) {
          // Keep each cornerstone package separate
          if (id.includes('node_modules/@cornerstonejs/core')) {
            return 'cornerstone-core'
          }
          if (id.includes('node_modules/@cornerstonejs/tools')) {
            return 'cornerstone-tools'
          }
          if (id.includes('node_modules/@cornerstonejs/dicom-image-loader')) {
            return 'cornerstone-loader'
          }
          if (id.includes('node_modules/dicom-parser')) {
            return 'dicom-parser'
          }
          // Separate vendor chunk for other dependencies
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
})
