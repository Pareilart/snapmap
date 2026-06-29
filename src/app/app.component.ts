import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Stripe } from '@capacitor-community/stripe';
import { addIcons } from 'ionicons';
import { alertCircle, checkmarkCircle, informationCircle } from 'ionicons/icons';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Icônes utilisées par les toasts du FeedbackService (Défi 4) — enregistrées
    // globalement car les toasts sont créés par un contrôleur (hors composant).
    addIcons({ checkmarkCircle, informationCircle, alertCircle });

    // Clé PUBLIQUE uniquement (jamais la sk_ côté front).
    Stripe.initialize({
      publishableKey: environment.stripe.publishableKey,
    });
  }
}
