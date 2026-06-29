import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonGrid, IonRow, IonCol, IonImg,
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

  constructor() {
    addIcons({ camera });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
  }

  takePhoto(): void {
    this.photoService.takePhoto();
  }
}
