import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import type { UserPhoto } from '../models';

/** Options de marqueur enrichies : miniature + photo (lues par le cluster / le clic). */
type PhotoMarkerOptions = L.MarkerOptions & { photoThumb?: string; photo?: UserPhoto };

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
  private photoCluster: L.MarkerClusterGroup | undefined;
  // Tuiles SOMBRES (CARTO dark matter) → rendu immersif "Snap Map". Gratuit, sans clé.
  private readonly tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  private readonly attribution = '© OpenStreetMap · © CARTO';

  /** Initialise la carte centrée sur (lat, lng) et y pose un marqueur. */
  initMap(container: string, lat: number, lng: number): Promise<void> {
    return new Promise((resolve) => {
      this.map = L.map(container, { zoomControl: false }).setView([lat, lng], 13);

      L.tileLayer(this.tileUrl, {
        attribution: this.attribution,
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(this.map);

      this.addMarker(lat, lng);

      // Recalcule la taille une fois le conteneur visible (onglet Ionic) → évite la carte « grise ».
      setTimeout(() => this.map?.invalidateSize(), 0);
      resolve();
    });
  }

  /** Position de l'utilisateur — point lumineux pulsé (style "Snap Map"), pas le pin rouge par défaut. */
  addMarker(lat: number, lng: number): L.Marker {
    const icon = L.divIcon({
      html: '<div class="user-dot"></div>',
      className: 'user-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    return L.marker([lat, lng], { icon }).addTo(this.map!);
  }

  /**
   * Affiche chaque photo géolocalisée en pin rond (miniature), **floutée si verrouillée**
   * (photo communauté non achetée), avec clustering (badge du nombre, « 99+ »).
   * Clic sur un **pin** ou un **cluster** → ouvre le **feed du lieu** via `onOpenFeed`. (Défi 3 + marketplace)
   */
  renderPhotoMarkers(photos: UserPhoto[], onOpenFeed: (photos: UserPhoto[]) => void): void {
    if (!this.map) {
      return;
    }

    // Reset : on retire l'ancien groupe avant de redessiner (évite les doublons).
    if (this.photoCluster) {
      this.map.removeLayer(this.photoCluster);
    }

    this.photoCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, // clic cluster → feed du lieu (pas un simple zoom)
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const first = cluster.getAllChildMarkers()[0]?.options as PhotoMarkerOptions | undefined;
        const thumb = first?.photoThumb ?? '';
        const locked = first?.photo ? this.isLocked(first.photo) : false;
        const label = count > 99 ? '99+' : String(count); // « 99+ » pour éviter un nombre trop gros
        return L.divIcon({
          html: `<div class="cluster-pin${locked ? ' locked' : ''}" style="background-image:url('${thumb}')"><span class="badge">${label}</span></div>`,
          className: 'photo-cluster',
          iconSize: [54, 54],
          iconAnchor: [27, 27],
        });
      },
    });

    // Clic sur un cluster → feed de toutes ses photos.
    this.photoCluster.on('clusterclick', (e) => {
      const cluster = (e as unknown as { layer: L.MarkerCluster }).layer;
      const list = cluster
        .getAllChildMarkers()
        .map((m) => (m.options as PhotoMarkerOptions).photo)
        .filter((p): p is UserPhoto => !!p);
      onOpenFeed(list);
    });

    for (const photo of photos) {
      if (photo.lat == null || photo.lng == null) {
        continue; // photo sans localisation → pas sur la carte
      }
      const locked = this.isLocked(photo);
      const own = photo.own !== false; // mes photos vs communauté
      const cls = `photo-pin ${own ? 'own' : 'community'}${locked ? ' locked' : ''}`;
      const icon = L.divIcon({
        html: `<div class="${cls}" style="background-image:url('${photo.webviewPath}')">${
          locked ? '<span class="pin-lock"></span>' : ''
        }</div>`,
        className: 'photo-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const marker = L.marker([photo.lat, photo.lng], { icon });
      const opts = marker.options as PhotoMarkerOptions;
      opts.photoThumb = photo.webviewPath;
      opts.photo = photo;
      marker.on('click', () => onOpenFeed([photo]));
      this.photoCluster.addLayer(marker);
    }

    this.map.addLayer(this.photoCluster);
  }

  /** Verrouillée = photo communauté non achetée (floutée + achetable). */
  private isLocked(photo: UserPhoto): boolean {
    return photo.own === false && !photo.purchased;
  }
}
