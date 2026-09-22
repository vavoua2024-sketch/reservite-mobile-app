# Inventaire des immobilisations par QR code

Logiciel SaaS pour cabinets comptables (UEMOA / SYSCOHADA) : chaque immobilisation
reçoit un QR code imprimable, collé sur le bien physique. Lors d'une campagne
d'inventaire, un agent scanne les biens avec son téléphone — l'application
fonctionne même sans réseau (les scans sont mis en file locale et synchronisés
dès que la connexion revient). Le responsable du cabinet suit la progression en
temps réel et obtient un rapport d'écarts (conformes / déplacés / manquants /
inconnus) à la fin de la campagne, pour plusieurs dossiers clients à la fois.

## Architecture

- **Un cabinet** (`cabinets`) gère **plusieurs dossiers clients** (`companies`) —
  c'est le point que ne couvre aucun concurrent étudié dans la recherche de marché.
- **Mobile (scan)** : `/`, `/scan/:campaignId` — pensé pour aller vite sur le
  terrain, sans réseau.
- **Backoffice** : `/backoffice` — gestion des immobilisations, génération des
  étiquettes QR, suivi des campagnes, rapport d'écarts.
- **Isolation des données** par cabinet via Row Level Security Postgres
  (voir `supabase/migrations/0001_init.sql`).

## Installation locale

```bash
cd immobilisations-qrcode
cp .env.example .env   # renseigner VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Base de données

Le schéma est dans `supabase/migrations/0001_init.sql` — à appliquer sur le
projet Supabase avant le premier lancement (création d'un cabinet, d'un profil
responsable, d'un premier dossier client).

## Ce qui reste à faire

- Écran de création de compte / invitation d'agents (pour l'instant les
  comptes se créent directement dans Supabase Auth)
- Upload des photos de constat (le champ `photo_url` existe déjà en base)
- Icônes PWA définitives (`public/icon-192.png`, `public/icon-512.png`)
- Import en masse depuis Excel du fichier d'inventaire existant
