import { inject, Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

/**
 * Service transverse de feedback utilisateur (Défi 4).
 *
 * Centralise les retours d'action de l'app pour rester DRY et cohérent :
 * - **toasts** (succès / info / erreur) avec position et durée bien choisies
 *   (`top` → ne masque ni la barre d'onglets ni le FAB de capture) ;
 * - **alertes** d'erreur et de confirmation (`AlertController`).
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  /** Toast vert court : action réussie. */
  success(message: string): Promise<void> {
    return this.toast(message, 'success', 2000, 'checkmark-circle');
  }

  /** Toast neutre : information (ex. repli géoloc). */
  info(message: string): Promise<void> {
    return this.toast(message, 'medium', 2800, 'information-circle');
  }

  /** Toast rouge plus long : quelque chose a échoué. */
  error(message: string): Promise<void> {
    return this.toast(message, 'danger', 4000, 'alert-circle');
  }

  /** Alerte bloquante avec un seul bouton (gestion d'erreur explicite). */
  async alert(header: string, message: string, okText = 'OK'): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [{ text: okText, role: 'cancel' }],
    });
    await alert.present();
  }

  /**
   * Alerte de confirmation. Résout `true` si l'utilisateur confirme.
   * `destructive` colore l'action de confirmation en rouge (suppression…).
   */
  async confirm(
    header: string,
    message: string,
    confirmText = 'Confirmer',
    destructive = false,
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          { text: 'Annuler', role: 'cancel', handler: () => resolve(false) },
          {
            text: confirmText,
            role: destructive ? 'destructive' : 'confirm',
            handler: () => resolve(true),
          },
        ],
      });
      // Fermeture par tap sur le fond / Echap = annulation.
      alert.onDidDismiss().then((d) => {
        if (d.role !== 'confirm' && d.role !== 'destructive') {
          resolve(false);
        }
      });
      await alert.present();
    });
  }

  private async toast(
    message: string,
    color: string,
    duration: number,
    icon: string,
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      icon,
      position: 'top',
    });
    await toast.present();
  }
}
