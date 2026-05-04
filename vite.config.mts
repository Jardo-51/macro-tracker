import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Fonts from 'unplugin-fonts/vite'
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Macro Tracker',
        short_name: 'Macros',
        description: 'Track your daily macro nutrients offline',
        theme_color: '#1E88E5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    // unplugin-fonts emits a `<link rel=preload>` for every bundled font file.
    // The mdi CSS ships 4 formats and @fontsource/roboto bundles many subsets
    // and weights — the browser ends up racing the preloads against the
    // @font-face rules in CSS and warns that the preloads aren't used in time.
    // Strip them all; the font files stay bundled and load on demand via CSS.
    {
      name: 'remove-unused-font-preloads',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler: (html) => html
          .replace(/\s*<link[^>]+materialdesignicons[^>]+>/g, '')
          .replace(/\s*<link[^>]+\/roboto-[^>]+>/g, ''),
      },
    },
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})
