import { Injectable } from '@angular/core';
import * as L from 'leaflet';

// Icônes Leaflet servies en LOCAL (copiées dans assets/leaflet via angular.json).
// On définit une icône CUSTOM (L.icon) comme marqueur par défaut, au lieu de
// L.Icon.Default.mergeOptions : `Default` préfixe l'URL avec un `imagePath` auto-détecté
// (réécrit par esbuild) qui casse le chemin. Une `L.icon` utilise l'URL telle quelle.
const defaultIcon = L.icon({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

@Injectable({ providedIn: 'root' })
export class MapService {
  /** Position de repli si la géoloc échoue/est refusée (Défi 5) : Paris. */
  static readonly DEFAULT_POSITION = { lat: 48.8566, lng: 2.3522 };

  map: L.Map | undefined;
  private readonly tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  private readonly attribution = '© OpenStreetMap contributors';

  /** Initialise la carte centrée sur (lat, lng) et y pose un marqueur. */
  initMap(container: string, lat: number, lng: number): Promise<void> {
    return new Promise((resolve) => {
      this.map = L.map(container).setView([lat, lng], 13);

      L.tileLayer(this.tileUrl, {
        attribution: this.attribution,
        maxZoom: 19,
      }).addTo(this.map);

      this.addMarker(lat, lng);

      // Recalcule la taille une fois le conteneur visible (onglet Ionic) → évite la carte « grise ».
      setTimeout(() => this.map?.invalidateSize(), 0);
      resolve();
    });
  }

  /** Leaflet attend [lat, lng] (≠ Mapbox). */
  addMarker(lat: number, lng: number): L.Marker {
    return L.marker([lat, lng]).addTo(this.map!);
  }
}
