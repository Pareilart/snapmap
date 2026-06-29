import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonGrid, IonRow, IonCol, IonButton,
  ToastController, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, heart, heartOutline, trash } from 'ionicons/icons';
import { PhotoService } from '../core/services/photo.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
    IonIcon, IonGrid, IonRow, IonCol, IonButton,
  ],
})
export class Tab1Page implements OnInit {
  public photoService = inject(PhotoService);
  private toast = inject(ToastController);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({ camera, heart, heartOutline, trash });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
  }

  async takePhoto(): Promise<void> {
    try {
      await this.photoService.takePhoto();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(msg)) {
        return; // annulation volontaire → silencieux
      }
      console.error('takePhoto error:', err);
      const t = await this.toast.create({
        message: 'Échec de la prise de photo : ' + msg,
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
      await t.present();
    }
  }

  /** Défi 1 — like persistant. */
  toggleLike(filepath: string): void {
    this.photoService.toggleLike(filepath);
  }

  /** Défi 1 — suppression confirmée par une alerte (jamais sans demander). */
  async confirmDelete(filepath: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer la photo ?',
      message: 'Cette action est définitive.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.photoService.deletePhoto(filepath);
          },
        },
      ],
    });
    await alert.present();
  }
}
