import { Component, Input, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, calendarOutline, locationOutline, lockClosed, heart, heartOutline,
} from 'ionicons/icons';
import { PhotoService } from '../../../core/services/photo.service';
import { PaymentService } from '../../../core/services/payment.service';
import type { UserPhoto } from '../../../core/models';

/** Feed vertical (style Instagram) des photos d'un lieu : floutées + achetables si « communauté ». */
@Component({
  selector: 'app-photo-feed',
  templateUrl: './photo-feed.component.html',
  styleUrls: ['./photo-feed.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
})
export class PhotoFeedComponent implements OnInit {
  @Input() photos: UserPhoto[] = [];

  private modalCtrl = inject(ModalController);
  private photoService = inject(PhotoService);
  private paymentService = inject(PaymentService);

  constructor() {
    addIcons({ close, calendarOutline, locationOutline, lockClosed, heart, heartOutline });
  }

  async ngOnInit(): Promise<void> {
    // Nom de lieu (reverse geocoding) pour les photos perso ; les démo l'ont déjà.
    await this.photoService.ensureLocationNames();
  }

  isLocked(photo: UserPhoto): boolean {
    return this.photoService.isLocked(photo);
  }

  /** Nombre de « j'aime » d'une photo : base communauté + mon like éventuel. */
  likeCount(photo: UserPhoto): number {
    return (photo.likes ?? 0) + (photo.liked ? 1 : 0);
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  toggleLike(photo: UserPhoto): void {
    this.photoService.toggleLike(photo.filepath);
  }

  /** Achat d'une photo communauté → déblocage (déflou). */
  async buy(photo: UserPhoto): Promise<void> {
    try {
      const ok = await this.paymentService.buyPhoto();
      if (ok) {
        await this.photoService.markAsPurchased(photo.filepath);
      }
    } catch (err) {
      console.error('buy (feed) failed:', err);
    }
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
