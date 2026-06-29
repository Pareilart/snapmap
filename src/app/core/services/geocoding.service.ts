import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);
  private readonly cache = new Map<string, string>();

  /**
   * Reverse geocoding via Nominatim / OpenStreetMap (sans clé d'API).
   * Renvoie un nom de lieu lisible (ex. « Pau, Rue Bayard »), ou les coordonnées en repli.
   * ⚠️ Policy Nominatim : faible volume — on met le résultat en cache pour ne pas spammer.
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const url =
      'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1' +
      `&lat=${lat}&lon=${lng}`;
    try {
      const res = await firstValueFrom(this.http.get<NominatimResponse>(url));
      const name = this.format(res) ?? fallback;
      this.cache.set(key, name);
      return name;
    } catch {
      return fallback;
    }
  }

  private format(res: NominatimResponse): string | null {
    const a = res.address;
    if (a) {
      const street = a.road ?? a.pedestrian ?? a.suburb;
      const city = a.city ?? a.town ?? a.village ?? a.municipality;
      if (city && street) {
        return `${city}, ${street}`;
      }
      if (city) {
        return city;
      }
      if (street) {
        return street;
      }
    }
    return res.display_name ?? null;
  }
}
