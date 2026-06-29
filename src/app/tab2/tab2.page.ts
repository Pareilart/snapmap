import { AfterViewInit, Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { GeolocationService } from '../core/services/geolocation.service';
import { MapService } from '../core/services/map.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner],
})
export class Tab2Page implements AfterViewInit {
  private geolocationService = inject(GeolocationService);
  private mapService = inject(MapService);
  protected mapLoaded = false;

  ngAfterViewInit(): void {
    this.geolocationService.getCurrentPosition().then(async (position) => {
      // Fallback (Défi 5) : un refus de géolocalisation ne doit pas bloquer la carte.
      const coords = position ?? MapService.DEFAULT_POSITION;
      await this.mapService.initMap('map', coords.lat, coords.lng);
      this.mapLoaded = true;
    });
  }
}
