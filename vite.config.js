import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Cette configuration transforme l'app en Progressive Web App (PWA) : le
// client peut l'"installer" depuis son navigateur (Chrome propose
// automatiquement "Ajouter à l'écran d'accueil"), et elle se comporte alors
// comme une vraie application — icône, plein écran, fonctionne même avec une
// connexion instable grâce au service worker.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "RESERVITE",
        short_name: "RESERVITE",
        description: "Réservez vos trajets et vos locations de véhicules en Côte d'Ivoire",
        theme_color: "#E8871C",
        background_color: "#FBEADA",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Permet à l'app de continuer à s'afficher même hors-ligne (les
        // données restent à jour dès que la connexion revient).
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
