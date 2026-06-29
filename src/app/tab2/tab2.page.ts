import { AfterViewInit, Component, inject } from '@angular/core';
import { IonContent, IonSpinner, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { location } from 'ionicons/icons';
import { GeolocationService } from '../core/services/geolocation.service';
import { MapService } from '../core/services/map.service';
import { PhotoService } from '../core/services/photo.service';
import { FeedbackService } from '../core/services/feedback.service';
import { PhotoFeedComponent } from '../shared/components/photo-feed/photo-feed.component';
import type { UserPhoto } from '../core/models';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonContent, IonSpinner, IonIcon],
})
export class Tab2Page implements AfterViewInit {
  private geolocationService = inject(GeolocationService);
  private mapService = inject(MapService);
  private photoService = inject(PhotoService);
  private feedback = inject(FeedbackService);
  private modalCtrl = inject(ModalController);
  protected mapLoaded = false;

  constructor() {
    addIcons({ location });
  }

  async ngAfterViewInit(): Promise<void> {
    const position = await this.geolocationService.getCurrentPosition();
    // Fallback (Défi 5) : un refus de géolocalisation ne doit pas bloquer la carte.
    const coords = position ?? MapService.DEFAULT_POSITION;
    await this.mapService.initMap('map', coords.lat, coords.lng);
    this.mapLoaded = true;
    if (!position) {
      // Défi 5 — message informatif clair plutôt qu'un blocage silencieux.
      await this.feedback.info('Position indisponible — carte centrée sur Paris par défaut.');
    }
    await this.refreshPhotos();
  }

  /** Recharge les pins à chaque (re)venue sur l'onglet (de nouvelles photos ont pu être prises). */
  async ionViewWillEnter(): Promise<void> {
    if (this.mapLoaded) {
      await this.refreshPhotos();
    }
  }

  private async refreshPhotos(): Promise<void> {
    await this.photoService.loadSaved();
    // Carte = mes photos + celles de la communauté (floutées/achetables).
    this.mapService.renderPhotoMarkers(this.photoService.mapPhotos, (photos) => this.openFeed(photos));
  }

  /** Clic sur un pin / cluster → feed vertical (style Instagram) des photos du lieu. */
  private async openFeed(photos: UserPhoto[]): Promise<void> {
    if (photos.length === 0) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: PhotoFeedComponent,
      componentProps: { photos },
    });
    await modal.present();
  }
}
