import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule]
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  async initializeApp() {
    if (this.platform.is('capacitor')) {
      try {
        // Set status bar to be transparent with white text
        await StatusBar.setStyle({ style: Style.Dark });
        // Set the overlay to false to prevent content from appearing under the status bar
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.error('Error initializing status bar', err);
      }
    }
  }
}
