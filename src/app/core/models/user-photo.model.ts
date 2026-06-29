/**
 * Modèle d'une photo SnapMap.
 * - filepath / webviewPath : gérés par la caméra + Filesystem (Partie 1)
 * - purchased / liked       : états persistés (Stripe + Défi 1)
 * - lat / lng / takenAt      : métadonnées de géolocalisation/capture (Défi 2 & 3)
 * - locationName             : nom de lieu via reverse geocoding Mapbox (Défi 2)
 */
export interface UserPhoto {
  filepath: string;
  webviewPath: string;
  purchased: boolean;
  liked: boolean;
  lat: number;
  lng: number;
  takenAt: string; // date ISO — new Date().toISOString()
  locationName?: string;
}
