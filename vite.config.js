import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El SDK de Firestore va en un chunk aparte que solo se carga si está configurado.
  build: { chunkSizeWarningLimit: 700 },
})
