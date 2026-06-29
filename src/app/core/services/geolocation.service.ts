import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /**
   * Position courante de l'utilisateur, ou `null` si refus/erreur.
   * La carte gère le repli (Défi 5) : un refus ne doit pas bloquer l'affichage.
   */
  async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      const position = await Geolocation.getCurrentPosition();
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
