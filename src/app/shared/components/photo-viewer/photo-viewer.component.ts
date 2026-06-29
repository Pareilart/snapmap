import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, calendarOutline, locationOutline } from 'ionicons/icons';
import { PhotoService } from '../../../core/services/photo.service';
import type { UserPhoto } from '../../../core/models';

/** Défi 2 — visualisation plein écran : carrousel (swipe) + date + lieu réel. */
@Component({
  selector: 'app-photo-viewer',
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // pour <swiper-container>/<swiper-slide>
})
export class PhotoViewerComponent implements OnInit {
  @Input() photos: UserPhoto[] = [];
  @Input() index = 0;

  private modalCtrl = inject(ModalController);
  private photoService = inject(PhotoService);

  constructor() {
    addIcons({ close, calendarOutline, locationOutline });
  }

  async ngOnInit(): Promise<void> {
    // Reverse geocoding (Nominatim) des photos géolocalisées sans nom de lieu.
    await this.photoService.ensureLocationNames();
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
