/*
 * Génère src/environments/environment.ts et environment.prod.ts à partir de .env
 * Exécuté automatiquement avant `ionic build` / `ionic serve` (hooks package.json),
 * et avant `npm start` / `npm run build`.
 *
 * ⚠️ Seule la clé PUBLIQUE Stripe (pk_) est injectée côté front. La carte (Leaflet + OpenStreetMap)
 *    ne nécessite AUCUNE clé. La clé secrète STRIPE_SECRET_KEY (sk_) reste dans .env pour le backend Express.
 */
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

const env = loadEnv(path.resolve(__dirname, '.env'));

const STRIPE_PK = env.STRIPE_PUBLISHABLE_KEY || 'pk_test_VOTRE_CLE_PUBLIQUE';
const API_URL = env.STRIPE_API_URL || 'http://localhost:4000';

const content = (production) => `// ⚠️ FICHIER GÉNÉRÉ par set-env.js depuis .env — NE PAS éditer à la main.
// Modifier les valeurs dans .env (non commité), puis : node set-env.js (auto avant ionic build/serve).
export const environment = {
  production: ${production},
  stripe: {
    publishableKey: '${STRIPE_PK}',
    apiUrl: '${API_URL}',
  },
};
`;

const dir = path.resolve(__dirname, 'src/environments');
fs.writeFileSync(path.join(dir, 'environment.ts'), content(false));
fs.writeFileSync(path.join(dir, 'environment.prod.ts'), content(true));
console.log('[set-env] environment.ts & environment.prod.ts générés depuis .env ✅');
