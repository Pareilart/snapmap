import { Injectable } from '@angular/core';
import { Camera, CameraDirection } from '@capacitor/camera';
import type { MediaResult } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import type { UserPhoto } from '../models';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  /** Collection des selfies, la plus récente en tête. */
  public photos: UserPhoto[] = [];
  private readonly PHOTO_STORAGE = 'photos';

  /** Prend un selfie (caméra avant), l'écrit sur le disque et persiste la collection. */
  public async takePhoto(): Promise<void> {
    const result = await Camera.takePhoto({
      quality: 100,
      cameraDirection: CameraDirection.Front, // selfies
    });

    const savedPhoto = await this.savePhoto(result);
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

  /** blob:// → base64 → écriture disque ; retourne un UserPhoto persistable. */
  private async savePhoto(cameraPhoto: MediaResult): Promise<UserPhoto> {
    const base64Data = await this.readAsBase64(cameraPhoto);
    const fileName = `${new Date().getTime()}.jpeg`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    return {
      filepath: fileName,
      webviewPath: base64Data,
      purchased: false,
      liked: false,
      takenAt: new Date().toISOString(),
    };
  }

  private async readAsBase64(cameraPhoto: MediaResult): Promise<string> {
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
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
