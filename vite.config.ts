import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Only the data layer is under test here: it is where the envelope, cookie,
    // CSRF and refresh-replay behaviour lives. The pages are covered by the
    // type checker and by the backend's own integration suite.
    include: ['src/**/*.test.ts'],
    // jsdom because the data layer reads the CSRF cookie and the guest bag is
    // held in localStorage; both are browser-only.
    environment: 'jsdom',
    restoreMocks: true,
  },
})
