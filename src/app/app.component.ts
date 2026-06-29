import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Stripe } from '@capacitor-community/stripe';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Clé PUBLIQUE uniquement (jamais la sk_ côté front).
    Stripe.initialize({
      publishableKey: environment.stripe.publishableKey,
    });
  }
}
