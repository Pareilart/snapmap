# SnapMap — cycle de développement web → natif

Projet **Ionic + Capacitor + Angular standalone** (template tabs). Stack : Mapbox + Stripe.

## Commandes du cycle de dev
| Quand | Commande |
|-------|----------|
| Dev navigateur (live reload) | `ionic serve` |
| Builder le web (génère `www/`) | `ionic build` |
| Après un changement de **code web** | `npx cap copy` |
| Après l'ajout d'un **plugin natif** | `npx cap sync` |
| Ouvrir Android Studio | `npx cap open android` |
| Ouvrir Xcode | `npx cap open ios` |

> Règle : **plugin natif → `npx cap sync`** ; **code web seul → `ionic build` puis `npx cap copy`** (ou `npx cap sync`).

## Lancer sur un appareil / émulateur
```bash
ionic build
npx cap sync
npx cap open android   # ou : npx cap open ios
```
Puis **Build & Run** depuis Android Studio / Xcode (device ou émulateur sélectionné).

## Debugger la WebView sur un vrai appareil
1. Brancher le téléphone en USB, lancer l'app.
2. Ouvrir `chrome://inspect#devices` dans Chrome → **inspect** la WebView → DevTools complets.

## Architecture (core / features / shared)
- `src/app/core/` — services transverses, modèles, guards, interceptors (singletons de l'app).
- `src/app/features/` — un dossier par fonctionnalité : `camera`, `map`, `boutique`.
- `src/app/shared/` — composants, pipes, directives réutilisables.

## À renseigner avant de coder
Dans `src/environments/environment.ts` **et** `environment.prod.ts` :
- `mapBox.accessToken` → token **public** Mapbox (`pk_...`)
- `stripe.publishableKey` → clé **publique** Stripe test (`pk_test_...`)
- `stripe.apiUrl` → URL du backend Express (port **4000** ; sur device, IP locale type `http://192.168.1.x:4000`)

> ⚠️ **Jamais** de clé secrète Stripe (`sk_...`) côté app — uniquement sur le backend Express.

## Note caméra (web)
`src/app/components/camera-modal/camera-modal.element.ts` enregistre `<pwa-camera-modal>` (compatible Camera 8,
**sans** `@ionic/pwa-elements`). Importé en effet de bord dans `src/main.ts`. Sur natif Android/iOS, la caméra
native prend le relais. Si le concours fournit son propre fichier, le substituer.
