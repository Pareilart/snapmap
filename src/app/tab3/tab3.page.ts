import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonIcon, IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosed, lockOpen } from 'ionicons/icons';
import { PhotoService } from '../core/services/photo.service';
import { PaymentService } from '../core/services/payment.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonIcon, IonButton,
  ],
})
export class Tab3Page implements OnInit {
  photoService = inject(PhotoService);
  private paymentService = inject(PaymentService);

  constructor() {
    addIcons({ lockClosed, lockOpen });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
  }

  async buyPhoto(filepath: string): Promise<void> {
    const success = await this.paymentService.buyPhoto();
    if (success) {
      await this.photoService.markAsPurchased(filepath);
    }
  }

  async buyPhotoWithGooglePay(filepath: string): Promise<void> {
    const success = await this.paymentService.buyPhotoWithGooglePay();
    if (success) {
      await this.photoService.markAsPurchased(filepath);
    }
  }
}
