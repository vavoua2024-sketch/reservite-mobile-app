import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA : installable sur le téléphone de l'agent de terrain, fonctionne
// hors-ligne pendant une campagne de scan (les scans sont mis en file
// locale et synchronisés dès que la connexion revient — voir src/lib/sync.js).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // on enregistre nous-mêmes dans main.jsx (voir registerSW)
      manifest: {
        name: "Inventaire Immobilisations",
        short_name: "Inventaire",
        description: "Inventaire physique des immobilisations par QR code",
        theme_color: "#4F46E5",
        background_color: "#F7F7FB",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Une nouvelle version prend le contrôle immédiatement (au lieu
        // d'attendre que tous les onglets soient fermés) — évite qu'un
        // agent/responsable reste bloqué sur une version périmée en cache.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5174,
  },
});
