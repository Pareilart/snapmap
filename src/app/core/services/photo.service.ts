import { Injectable, inject } from '@angular/core';
import { Camera, CameraDirection } from '@capacitor/camera';
import type { MediaResult } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { GeolocationService } from './geolocation.service';
import { GeocodingService } from './geocoding.service';
import { DEMO_PHOTOS } from '../data/demo-photos';
import type { UserPhoto } from '../models';

/** Erreur typée : la permission caméra a été refusée (Défi 5). */
export class CameraPermissionError extends Error {
  constructor() {
    super('CAMERA_PERMISSION_DENIED');
    this.name = 'CameraPermissionError';
  }
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private geolocation = inject(GeolocationService);
  private geocoding = inject(GeocodingService);

  /** Mes selfies, le plus récent en tête. */
  public photos: UserPhoto[] = [];
  /** Photos « de la communauté » (démo) — floutées/achetables sur la carte. */
  public demoPhotos: UserPhoto[] = [];
  private readonly PHOTO_STORAGE = 'photos';
  private readonly DEMO_PURCHASED_STORAGE = 'demo_purchased';
  private readonly DEMO_LIKED_STORAGE = 'demo_liked';

  /** Stat — nombre total de likes (mes photos + communauté). */
  get totalLikes(): number {
    return [...this.photos, ...this.demoPhotos].filter((p) => p.liked).length;
  }

  /** Toutes les photos géolocalisées de la carte : les miennes + la communauté. */
  get mapPhotos(): UserPhoto[] {
    return [...this.photos, ...this.demoPhotos].filter((p) => p.lat != null && p.lng != null);
  }

  /** « Verrouillée » = photo de la communauté non achetée → floutée + achetable. */
  isLocked(photo: UserPhoto): boolean {
    return photo.own === false && !photo.purchased;
  }

  /** Photos partageant ~la même position qu'une photo donnée (pour le feed du lieu). */
  photosAt(target: UserPhoto): UserPhoto[] {
    const near = (a?: number, b?: number) => a != null && b != null && Math.abs(a - b) < 0.0005;
    return this.mapPhotos.filter((p) => near(p.lat, target.lat) && near(p.lng, target.lng));
  }

  /** Prend un selfie (caméra avant), capture la position, l'écrit sur le disque et persiste. */
  public async takePhoto(): Promise<void> {
    // Défi 5 — vérifier/demander la permission caméra AVANT d'ouvrir l'appareil,
    // pour pouvoir afficher un message clair plutôt que de planter.
    await this.ensureCameraPermission();

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
    await this.loadDemoPhotos();
  }

  /** Charge les photos de démo (communauté) et restaure leur état « acheté ». */
  public async loadDemoPhotos(): Promise<void> {
    const purchased = await this.readIdSet(this.DEMO_PURCHASED_STORAGE);
    const liked = await this.readIdSet(this.DEMO_LIKED_STORAGE);
    this.demoPhotos = DEMO_PHOTOS.map((p) => ({
      ...p,
      purchased: purchased.has(p.filepath),
      liked: liked.has(p.filepath),
    }));
  }

  private async readIdSet(key: string): Promise<Set<string>> {
    const { value } = await Preferences.get({ key });
    return new Set<string>(value ? (JSON.parse(value) as string[]) : []);
  }

  /** Marque une photo comme achetée et persiste — la mienne OU une photo communauté. */
  public async markAsPurchased(filepath: string): Promise<void> {
    const own = this.photos.find((p) => p.filepath === filepath);
    if (own) {
      own.purchased = true;
      await this.persist();
      return;
    }
    const demo = this.demoPhotos.find((p) => p.filepath === filepath);
    if (demo) {
      demo.purchased = true;
      await this.persistDemoPurchased();
    }
  }

  private async persistDemoPurchased(): Promise<void> {
    const ids = this.demoPhotos.filter((p) => p.purchased).map((p) => p.filepath);
    await Preferences.set({ key: this.DEMO_PURCHASED_STORAGE, value: JSON.stringify(ids) });
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

  /** Bascule le « like » d'une photo et persiste — la mienne OU une photo communauté. (Défi 1) */
  public async toggleLike(filepath: string): Promise<void> {
    const own = this.photos.find((p) => p.filepath === filepath);
    if (own) {
      own.liked = !own.liked;
      await this.persist();
      return;
    }
    const demo = this.demoPhotos.find((p) => p.filepath === filepath);
    if (demo) {
      demo.liked = !demo.liked;
      await this.persistDemoLiked();
    }
  }

  private async persistDemoLiked(): Promise<void> {
    const ids = this.demoPhotos.filter((p) => p.liked).map((p) => p.filepath);
    await Preferences.set({ key: this.DEMO_LIKED_STORAGE, value: JSON.stringify(ids) });
  }

  /** Résout le nom de lieu (reverse geocoding) des photos géolocalisées, puis persiste. (Défi 2) */
  public async ensureLocationNames(): Promise<void> {
    let changed = false;
    for (const photo of this.photos) {
      if (photo.lat != null && photo.lng != null && !photo.locationName) {
        photo.locationName = await this.geocoding.reverseGeocode(photo.lat, photo.lng);
        changed = true;
      }
    }
    if (changed) {
      await this.persist();
    }
  }

  /**
   * Défi 5 — s'assure que la permission caméra est accordée (natif uniquement).
   * Sur le web, c'est le navigateur (getUserMedia) qui gère le prompt → on ne fait rien.
   * Lève {@link CameraPermissionError} si l'utilisateur refuse.
   */
  private async ensureCameraPermission(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    let status = await Camera.checkPermissions();
    if (status.camera === 'prompt' || status.camera === 'prompt-with-rationale') {
      status = await Camera.requestPermissions({ permissions: ['camera'] });
    }
    if (status.camera !== 'granted' && status.camera !== 'limited') {
      throw new CameraPermissionError();
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
