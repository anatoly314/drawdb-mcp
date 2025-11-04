import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read backend version at build time
const backendPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../backend/package.json'), 'utf-8')
)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(backendPackageJson.version),
  },
})
