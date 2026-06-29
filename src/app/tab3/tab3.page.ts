import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonContent, IonIcon, IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosed, lockOpen, bagHandle, checkmarkCircle } from 'ionicons/icons';
import { Stripe } from '@capacitor-community/stripe';
import { PhotoService } from '../core/services/photo.service';
import { PaymentService } from '../core/services/payment.service';
import { FeedbackService } from '../core/services/feedback.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonContent, IonIcon, IonButton,
  ],
})
export class Tab3Page implements OnInit {
  photoService = inject(PhotoService);
  private paymentService = inject(PaymentService);
  private feedback = inject(FeedbackService);
  /** Google Pay n'est disponible que sur Android (avec Google Pay configuré). */
  protected googlePayAvailable = false;

  constructor() {
    addIcons({ lockClosed, lockOpen, bagHandle, checkmarkCircle });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    try {
      await Stripe.isGooglePayAvailable();
      this.googlePayAvailable = true;
    } catch {
      // Web / iOS / Android sans Google Pay → on masque le bouton (createGooglePay y planterait).
      this.googlePayAvailable = false;
    }
  }

  async buyPhoto(filepath: string): Promise<void> {
    await this.runPayment(() => this.paymentService.buyPhoto(), filepath);
  }

  async buyPhotoWithGooglePay(filepath: string): Promise<void> {
    await this.runPayment(() => this.paymentService.buyPhotoWithGooglePay(), filepath);
  }

  /** Défi 4 — exécute un paiement et renvoie un feedback clair (succès / annulation / erreur). */
  private async runPayment(pay: () => Promise<boolean>, filepath: string): Promise<void> {
    try {
      const success = await pay();
      if (success) {
        await this.photoService.markAsPurchased(filepath);
        await this.feedback.success('Paiement réussi — photo débloquée');
      } else {
        await this.feedback.info('Paiement annulé.');
      }
    } catch (err) {
      console.error('Paiement échoué:', err);
      await this.feedback.error('Le paiement a échoué. Réessayez plus tard.');
    }
  }
}
