import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  GooglePayEventsEnum,
  PaymentSheetEventsEnum,
  Stripe,
} from '@capacitor-community/stripe';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { LoadingController } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

interface PaymentSheetResponse {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    // Écouteurs globaux (utiles pour logs/debug).
    Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
      console.log('PaymentSheetEventsEnum.Completed');
    });
    Stripe.addListener(GooglePayEventsEnum.Completed, () => {
      console.log('GooglePayEventsEnum.Completed');
    });
  }

  /** Achat par carte bancaire (PaymentSheet). Retourne true si le paiement est validé. */
  async buyPhoto(): Promise<boolean> {
    // Loader pendant l'appel API + préparation de la feuille (fermé dès qu'elle est prête).
    const loading = await this.loadingCtrl.create({ message: 'Préparation du paiement…' });
    await loading.present();

    try {
      const { paymentIntent, ephemeralKey, customer } = await this.createIntent();

      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: 'SnapMap — Boutique Photo',
        countryCode: 'FR',
      });

      // Correctif WEB (voir revealWebSheet). No-op sur natif.
      await this.revealWebSheet();
    } catch (err) {
      console.error('buyPhoto: préparation échouée:', err);
      return false;
    } finally {
      await loading.dismiss();
    }

    const result = await Stripe.presentPaymentSheet();
    return result.paymentResult === PaymentSheetEventsEnum.Completed;
  }

  /**
   * Correctif WEB uniquement.
   *
   * Sur navigateur, la PaymentSheet est rendue par `stripe-pwa-elements`. Or, dans
   * cette version, `<stripe-modal>` n'expose AUCUN `@Watch('open')` : son animation
   * d'ouverture (qui passe `renderedOpen` à `true` et ajoute la classe `.open`) n'est
   * déclenchée que par `componentDidLoad()` (si déjà ouvert) ou par sa méthode
   * `openModal()`. Le plugin Capacitor, lui, ouvre la modale en écrivant la prop
   * `open` APRÈS le chargement du composant → l'animation n'est jamais lancée, la
   * `.modal-row` reste `opacity:0; pointer-events:none`. Résultat : le formulaire
   * Stripe est bien dans le DOM (iframes chargées) mais totalement invisible.
   *
   * On déclenche donc nous-mêmes `openModal()` sur l'élément `<stripe-modal>`.
   * Sur natif (iOS/Android) il n'y a pas de DOM Stripe → no-op immédiat.
   */
  private async revealWebSheet(): Promise<void> {
    if (Capacitor.isNativePlatform()) return;

    type StripeModalEl = HTMLElement & { openModal?: () => Promise<void> };

    // L'élément interne peut n'être rendu qu'après quelques frames (hydratation Stencil).
    for (let i = 0; i < 60; i++) {
      const modal = document.querySelector(
        'stripe-card-element-modal stripe-modal',
      ) as StripeModalEl | null;

      if (modal?.openModal) {
        await modal.openModal();
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    console.warn('[PaymentService] <stripe-modal> introuvable : la modale CB n’a pas pu être ouverte.');
  }

  /** Achat via Google Pay (flux dédié). Retourne true si le paiement est validé. */
  async buyPhotoWithGooglePay(): Promise<boolean> {
    const loading = await this.loadingCtrl.create({ message: 'Préparation du paiement…' });
    await loading.present();

    try {
      const { paymentIntent } = await this.createIntent();

      await Stripe.createGooglePay({
        paymentIntentClientSecret: paymentIntent,
        paymentSummaryItems: [{ label: 'Photo', amount: 5.0 }],
        countryCode: 'FR',
        currency: 'EUR',
      });
    } catch (err) {
      console.error('createGooglePay failed:', err);
      return false;
    } finally {
      await loading.dismiss();
    }

    const result = await Stripe.presentGooglePay();
    return result.paymentResult === GooglePayEventsEnum.Completed;
  }

  /**
   * URL du backend selon la plateforme :
   * - émulateur **Android** : `10.0.2.2` = le `localhost` de la machine hôte (le Mac)
   * - web / simulateur iOS : `localhost`
   * (Vrai appareil : remplacer par l'IP locale du Mac dans `.env`.)
   */
  private get apiUrl(): string {
    const base = environment.stripe.apiUrl;
    return Capacitor.getPlatform() === 'android' ? base.replace('localhost', '10.0.2.2') : base;
  }

  /** Appelle le backend Express : crée customer + ephemeralKey + PaymentIntent (5 €). */
  private createIntent(): Promise<PaymentSheetResponse> {
    return firstValueFrom(
      this.http.post<PaymentSheetResponse>(this.apiUrl + '/payment-sheet', {}),
    );
  }
}
