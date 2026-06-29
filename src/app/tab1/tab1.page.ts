import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonContent, IonFab, IonFabButton,
  IonIcon, IonSkeletonText, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, heart, heartOutline, trash } from 'ionicons/icons';
import { PhotoService, CameraPermissionError } from '../core/services/photo.service';
import { FeedbackService } from '../core/services/feedback.service';
import { PhotoViewerComponent } from '../shared/components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonContent, IonFab, IonFabButton,
    IonIcon, IonSkeletonText, IonSpinner,
  ],
})
export class Tab1Page implements OnInit {
  public photoService = inject(PhotoService);
  private feedback = inject(FeedbackService);
  private modalCtrl = inject(ModalController);

  /** Défi 4 — chargement initial de la galerie (affiche une grille de squelettes). */
  protected galleryLoading = true;
  /** Défi 4 — une prise de photo est en cours (affiche une carte squelette en tête). */
  protected processing = false;
  /** Cases squelettes affichées pendant le chargement initial. */
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  constructor() {
    addIcons({ camera, heart, heartOutline, trash });
  }

  async ngOnInit(): Promise<void> {
    // Défi 4 — loader (squelettes) le temps de relire les photos depuis le disque.
    this.galleryLoading = true;
    try {
      await this.photoService.loadSaved();
    } finally {
      this.galleryLoading = false;
    }
  }

  async takePhoto(): Promise<void> {
    // Défi 4 — carte squelette en tête de grille pendant la capture + l'écriture disque.
    this.processing = true;
    try {
      await this.photoService.takePhoto();
      await this.feedback.success('Selfie ajouté à la galerie');
    } catch (err) {
      await this.handleCameraError(err);
    } finally {
      this.processing = false;
    }
  }

  /** Défi 1 — like persistant. */
  toggleLike(filepath: string): void {
    this.photoService.toggleLike(filepath);
  }

  /** Défi 2 — ouvre la photo en plein écran (carrousel) à l'index cliqué. */
  async openViewer(index: number): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PhotoViewerComponent,
      componentProps: { photos: this.photoService.photos, index },
    });
    await modal.present();
  }

  /** Défi 1 + 4 — suppression confirmée par une alerte, puis toast de confirmation. */
  async confirmDelete(filepath: string): Promise<void> {
    const confirmed = await this.feedback.confirm(
      'Supprimer la photo ?',
      'Cette action est définitive.',
      'Supprimer',
      true,
    );
    if (!confirmed) {
      return;
    }
    await this.photoService.deletePhoto(filepath);
    await this.feedback.info('Photo supprimée');
  }

  /** Défi 5 — messages clairs selon la cause (refus de permission, annulation, autre). */
  private async handleCameraError(err: unknown): Promise<void> {
    if (err instanceof CameraPermissionError || this.isPermissionError(err)) {
      await this.feedback.alert(
        'Accès caméra refusé',
        'SnapMap a besoin de la caméra pour prendre vos selfies. Autorisez-la dans les réglages de votre appareil, puis réessayez.',
      );
      return;
    }
    if (this.isCancel(err)) {
      return; // l'utilisateur a fermé l'appareil photo → silencieux
    }
    console.error('takePhoto error:', err);
    await this.feedback.error('Échec de la prise de photo.');
  }

  private isCancel(err: unknown): boolean {
    return /cancel/i.test(this.message(err));
  }

  private isPermissionError(err: unknown): boolean {
    const name = (err as { name?: string })?.name ?? '';
    const msg = this.message(err).toLowerCase();
    return (
      name === 'NotAllowedError' ||
      msg.includes('permission') ||
      msg.includes('denied') ||
      msg.includes('notallowed')
    );
  }

  private message(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
