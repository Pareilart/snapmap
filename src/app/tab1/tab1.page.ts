import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonGrid, IonRow, IonCol, IonImg, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { PhotoService } from '../core/services/photo.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
    IonIcon, IonGrid, IonRow, IonCol, IonImg,
  ],
})
export class Tab1Page implements OnInit {
  public photoService = inject(PhotoService);
  private toast = inject(ToastController);

  constructor() {
    addIcons({ camera });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
  }

  async takePhoto(): Promise<void> {
    try {
      await this.photoService.takePhoto();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Annulation volontaire de l'utilisateur → on ne montre rien.
      if (/cancel/i.test(msg)) {
        return;
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
}
