import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolarDeviceService } from '../services/polar-device.service';
import { BleDevice } from '@capacitor-community/bluetooth-le';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit, OnDestroy {
  isConnected = false;
  isScanning = false;
  discoveredDevices: BleDevice[] = [];
  connectedDeviceId = '';
  
  // App settings
  darkMode = false;
  soundEffects = true;
  vibration = true;
  
  private subscription: Subscription = new Subscription();

  constructor(private polarDeviceService: PolarDeviceService) {}

  ngOnInit() {
    this.subscription.add(
      this.polarDeviceService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );
    
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkMode = prefersDark.matches;
    this.applyDarkMode();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async scanForDevices() {
    this.isScanning = true;
    this.discoveredDevices = [];
    
    try {
      this.discoveredDevices = await this.polarDeviceService.scanForDevices();
      
      if (this.discoveredDevices.length === 0) {
        console.log('No Polar devices found');
      }
    } catch (error) {
      console.error('Error scanning for devices', error);
    } finally {
      this.isScanning = false;
    }
  }

  async connect(deviceId: string) {
    try {
      const success = await this.polarDeviceService.connect(deviceId);
      
      if (success) {
        this.connectedDeviceId = deviceId;
      }
    } catch (error) {
      console.error('Error connecting to device', error);
    }
  }

  async disconnect() {
    try {
      await this.polarDeviceService.disconnect();
      this.connectedDeviceId = '';
    } catch (error) {
      console.error('Error disconnecting from device', error);
    }
  }

  toggleDarkMode() {
    this.applyDarkMode();
  }

  private applyDarkMode() {
    document.body.classList.toggle('dark', this.darkMode);
  }
}
