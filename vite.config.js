import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// getUserMedia needs a secure context. localhost is fine over HTTP, but testing
// on a tablet over the LAN (`npm run dev:lan`, which passes --host) needs HTTPS.
const lan = process.argv.includes('--host')

export default defineConfig({
  plugins: [react(), ...(lan ? [basicSsl()] : [])],
  base: './',
  // The app bundle is ~770 kB; that's expected, so don't warn on every launch.
  build: { chunkSizeWarningLimit: 1000 },
})
