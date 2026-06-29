import type { UserPhoto } from '../models';

/**
 * Photos « de la communauté » (autres utilisateurs) — données de DÉMO.
 * Pas de backend : elles simulent une marketplace (floutées + achetables) sur la carte.
 * Images réelles servies par Unsplash (CDN). Les 3 premières sont regroupées autour du
 * château de Pau (clustering), les 2 autres ailleurs dans Pau. `likes` = social proof.
 * ⚠️ Les images Unsplash nécessitent le réseau (et peuvent être bloquées par un adblock
 *    agressif sur navigateur — OK sur émulateur/appareil).
 */
const UNSPLASH = (id: string) => `https://images.unsplash.com/photo-${id}?w=600`;

export const DEMO_PHOTOS: UserPhoto[] = [
  {
    filepath: 'demo-1', webviewPath: UNSPLASH('1499856871958-5b9627545d1a'), own: false,
    purchased: false, liked: false, likes: 128, takenAt: '2026-06-20T10:15:00.000Z',
    lat: 43.2944, lng: -0.3705, locationName: 'Pau, Château de Pau',
  },
  {
    filepath: 'demo-2', webviewPath: UNSPLASH('1506905925346-21bda4d32df4'), own: false,
    purchased: false, liked: false, likes: 87, takenAt: '2026-06-21T17:40:00.000Z',
    lat: 43.2948, lng: -0.3710, locationName: 'Pau, Boulevard des Pyrénées',
  },
  {
    filepath: 'demo-3', webviewPath: UNSPLASH('1441974231531-c6227db76b6e'), own: false,
    purchased: false, liked: false, likes: 256, takenAt: '2026-06-22T09:05:00.000Z',
    lat: 43.2942, lng: -0.3699, locationName: 'Pau, Place Royale',
  },
  {
    filepath: 'demo-4', webviewPath: UNSPLASH('1469474968028-56623f02e42e'), own: false,
    purchased: false, liked: false, likes: 42, takenAt: '2026-06-23T14:20:00.000Z',
    lat: 43.3018, lng: -0.3642, locationName: 'Pau, Gare',
  },
  {
    filepath: 'demo-5', webviewPath: UNSPLASH('1418065460487-3e41a6c84dc5'), own: false,
    purchased: false, liked: false, likes: 19, takenAt: '2026-06-24T19:30:00.000Z',
    lat: 43.2895, lng: -0.3785, locationName: 'Pau, Parc Beaumont',
  },
];
