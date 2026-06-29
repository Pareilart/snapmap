import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /**
   * Position courante de l'utilisateur, ou `null` si refus/erreur.
   * La carte gère le repli (Défi 5) : un refus ne doit pas bloquer l'affichage.
   */
  async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      // Sur device : demander explicitement la permission (sinon getCurrentPosition
      // peut échouer en silence) ; sur web, le navigateur gère le prompt.
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
            return null;
          }
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      console.error('Geolocation error:', error);
      return null;
    }
  }
}
