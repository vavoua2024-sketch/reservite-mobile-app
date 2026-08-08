# RESERVITE — App mobile (vraie application, PWA)

C'est la **vraie version** de l'app client, connectée au backend réel (`reservite-backend/`)
au lieu de `window.storage`. Elle fonctionne comme une application normale : installable
sur l'écran d'accueil d'un téléphone, indépendante de Claude.

## 1. Avant de commencer

Il faut que le backend (`reservite-backend/`) tourne déjà — voir son propre README.
Cette app lui envoie toutes ses requêtes.

## 2. Installation locale

```bash
cd reservite-mobile-app
cp .env.example .env
npm install
npm run dev
```

Ouvrez `http://localhost:5173` — vous verrez l'app tourner avec de vraies données,
venant du vrai serveur (pas de démo, pas de `window.storage`).

Connectez-vous avec le compte de démo : `aya.ndri@gmail.com` / `client2024`
(ou créez un nouveau compte — l'inscription est réelle, enregistrée en base).

## 3. L'installer comme une vraie app sur un téléphone

Une fois le site en ligne (voir déploiement ci-dessous), ouvrez son adresse depuis
le navigateur du téléphone (Chrome sur Android, Safari sur iPhone) :
- **Android (Chrome)** : un bandeau "Ajouter à l'écran d'accueil" apparaît automatiquement
- **iPhone (Safari)** : bouton Partager → "Sur l'écran d'accueil"

L'app s'installe alors avec sa propre icône, s'ouvre en plein écran, sans barre de
navigateur — exactement comme une app téléchargée sur un store.

## 4. Déployer en ligne

```bash
npm run build
```
Ça génère un dossier `dist/` — un site statique classique, à héberger sur :
- [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) (gratuit, très simple : glissez le dossier `dist/`)
- N'importe quel hébergement web classique

**Important** : avant de builder pour la production, mettez la vraie adresse de
votre backend déployé dans `.env` (`VITE_API_URL="https://votre-api.com"`).

## 5. Ce qui est déjà connecté au vrai serveur

- Inscription / connexion (vrais comptes, vrais mots de passe chiffrés)
- Mot de passe oublié
- Recherche de trajets par compagnie
- Réservation avec vérification des places en temps réel (le serveur refuse si
  quelqu'un d'autre vient de prendre la dernière place)
- Mes billets, détail, annulation (règle des 2h appliquée par le serveur)
- Modification du profil

## 6. Ce qui n'est pas encore porté depuis la démo

La démo Claude avait aussi : la demande de location de véhicules multi-compagnies,
le rôle Contrôleur (scan des billets), et le calcul détaillé des frais affiché
étape par étape. Le backend les supporte déjà tous (voir `reservite-backend/README.md`) —
il reste à créer les écrans correspondants ici, en suivant exactement le même
modèle que les écrans déjà faits (`src/screens/`). Dites-le-moi si vous voulez
que je les ajoute.
