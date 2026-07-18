import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Kcd12b/' : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icons/icon.svg'],
      manifest: {
        name: 'Chronicles of Bohemia',
        short_name: 'Bohemia',
        description: 'Originální 12bitové historické arkádové RPG.',
        theme_color: '#15120d',
        background_color: '#0b0a08',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: 'assets/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  build: {
    target: 'es2022',
    sourcemap: true
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts']
  }
}));
