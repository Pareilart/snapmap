import { Injectable, inject } from '@angular/core';
import { Camera, CameraDirection } from '@capacitor/camera';
import type { MediaResult } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { GeolocationService } from './geolocation.service';
import type { UserPhoto } from '../models';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private geolocation = inject(GeolocationService);

  /** Collection des selfies, la plus récente en tête. */
  public photos: UserPhoto[] = [];
  private readonly PHOTO_STORAGE = 'photos';

  /** Prend un selfie (caméra avant), capture la position, l'écrit sur le disque et persiste. */
  public async takePhoto(): Promise<void> {
    const result = await Camera.takePhoto({
      quality: 100,
      cameraDirection: CameraDirection.Front, // selfies
    });

    // Position au moment de la prise (null si géoloc refusée — Défi 5).
    const position = await this.geolocation.getCurrentPosition();

    const savedPhoto = await this.savePhoto(result, position);
    this.photos.unshift(savedPhoto);
    await this.persist();
  }

  /** Recharge la collection depuis Preferences puis relit chaque image sur le disque (base64). */
  public async loadSaved(): Promise<void> {
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    const stored = (value ? JSON.parse(value) : []) as UserPhoto[];

    const loaded: UserPhoto[] = [];
    for (const photo of stored) {
      try {
        const file = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        loaded.push(photo);
      } catch {
        // Fichier disparu : on ignore au lieu de crasher.
      }
    }
    this.photos = loaded;
  }

  /** Marque une photo comme achetée (après paiement Stripe) et persiste. */
  public async markAsPurchased(filepath: string): Promise<void> {
    const photo = this.photos.find((p) => p.filepath === filepath);
    if (photo) {
      photo.purchased = true;
      await this.persist();
    }
  }

  /** Supprime une photo (tableau + fichier disque) et persiste. (Défi 1) */
  public async deletePhoto(filepath: string): Promise<void> {
    this.photos = this.photos.filter((p) => p.filepath !== filepath);
    await this.persist();
    try {
      await Filesystem.deleteFile({ path: filepath, directory: Directory.Data });
    } catch {
      // Fichier déjà absent : on ignore.
    }
  }

  /** Bascule le « like » d'une photo et persiste (rechargé au démarrage). (Défi 1) */
  public async toggleLike(filepath: string): Promise<void> {
    const photo = this.photos.find((p) => p.filepath === filepath);
    if (photo) {
      photo.liked = !photo.liked;
      await this.persist();
    }
  }

  /** blob:// → base64 → écriture disque ; retourne un UserPhoto persistable. */
  private async savePhoto(
    cameraPhoto: MediaResult,
    position: { lat: number; lng: number } | null,
  ): Promise<UserPhoto> {
    const base64Data = await this.readAsBase64(cameraPhoto); // base64 BRUT (sans préfixe data:)
    const fileName = `${new Date().getTime()}.jpeg`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    return {
      filepath: fileName,
      webviewPath: `data:image/jpeg;base64,${base64Data}`,
      purchased: false,
      liked: false,
      takenAt: new Date().toISOString(),
      lat: position?.lat,
      lng: position?.lng,
    };
  }

  /** Photo en base64 BRUT (sans préfixe), gère le WEB et le NATIF. */
  private async readAsBase64(cameraPhoto: MediaResult): Promise<string> {
    if (Capacitor.getPlatform() === 'web') {
      // Web : webPath est une URL blob:// → fetch + FileReader
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();
      const dataUrl = await this.convertBlobToBase64(blob);
      return dataUrl.split(',')[1]; // retire "data:image/...;base64,"
    }
    // Natif (iOS/Android) : lire le fichier capturé via son uri
    const file = await Filesystem.readFile({ path: cameraPhoto.uri! });
    return file.data as string;
  }

  private convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  private async persist(): Promise<void> {
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }
}
