import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honour PORT when something assigns one. Vite otherwise ignores it and
  // auto-increments off 5173, which leaves any tool that assigned a port
  // pointing at nothing. Falls back to the usual 5173 for a plain `npm run dev`.
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
