import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'warn', // Suppress verbose info, show warnings and errors
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});