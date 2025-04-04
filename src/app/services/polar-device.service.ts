import { Injectable } from '@angular/core';
import { BleClient, BleDevice, dataViewToText, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject, Observable } from 'rxjs';

// Polar H10 specific UUIDs
const POLAR_H10_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb'; // Heart Rate Service
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate Measurement Characteristic

@Injectable({
  providedIn: 'root'
})
export class PolarDeviceService {
  private device: BleDevice | null = null;
  private _isConnected = new BehaviorSubject<boolean>(false);
  private _heartRate = new BehaviorSubject<number>(0);
  private _rrIntervals = new BehaviorSubject<number[]>([]);

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      await BleClient.initialize();
      console.log('Bluetooth initialized');
    } catch (error) {
      console.error('Error initializing Bluetooth', error);
    }
  }

  get isConnected$(): Observable<boolean> {
    return this._isConnected.asObservable();
  }

  get heartRate$(): Observable<number> {
    return this._heartRate.asObservable();
  }

  get rrIntervals$(): Observable<number[]> {
    return this._rrIntervals.asObservable();
  }

  async scanForDevices(): Promise<BleDevice[]> {
    try {
      const discoveredDevices: BleDevice[] = [];
      
      // Request permissions first
      await BleClient.requestLEScan(
        {
          services: [POLAR_H10_SERVICE],
          namePrefix: 'Polar'
        },
        (result) => {
          console.log('Scan result:', result);
          if (result.device) {
            discoveredDevices.push(result.device);
          }
        }
      );

      // Scan for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop scanning
      await BleClient.stopLEScan();
      
      return discoveredDevices;
    } catch (error) {
      console.error('Error scanning for devices', error);
      return [];
    }
  }

  async connect(deviceId: string): Promise<boolean> {
    try {
      await BleClient.connect(deviceId);
      // Store the device ID
      this.device = { deviceId } as BleDevice;
      console.log('Connected to device:', deviceId);
      
      // Subscribe to heart rate measurements
      await this.subscribeToHeartRate();
      
      this._isConnected.next(true);
      return true;
    } catch (error) {
      console.error('Error connecting to device', error);
      this._isConnected.next(false);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await BleClient.disconnect(this.device.deviceId);
        console.log('Disconnected from device');
        this._isConnected.next(false);
        this.device = null;
      } catch (error) {
        console.error('Error disconnecting from device', error);
      }
    }
  }

  private async subscribeToHeartRate(): Promise<void> {
    if (!this.device) return;

    try {
      await BleClient.startNotifications(
        this.device.deviceId,
        POLAR_H10_SERVICE,
        HEART_RATE_MEASUREMENT,
        (value) => {
          // Parse heart rate data according to Bluetooth GATT specification
          const dataView = new DataView(value.buffer);
          const flags = dataView.getUint8(0);
          const heartRateFormat = (flags & 0x01) === 0;
          
          // Heart rate value format (8 or 16 bit)
          let heartRate: number;
          if (heartRateFormat) {
            heartRate = dataView.getUint8(1);
          } else {
            heartRate = dataView.getUint16(1, true);
          }
          
          this._heartRate.next(heartRate);
          
          // Check if RR intervals are present
          const rrPresent = (flags & 0x10) !== 0;
          if (rrPresent) {
            const rrIntervals: number[] = [];
            let offset = 2;
            
            // If energy expenditure is present, skip it
            if ((flags & 0x08) !== 0) {
              offset += 2;
            }
            
            // Parse RR intervals (each is 2 bytes)
            while (offset < dataView.byteLength) {
              // RR intervals are in 1/1024 second format
              const rrInterval = dataView.getUint16(offset, true) * (1000 / 1024);
              rrIntervals.push(rrInterval);
              offset += 2;
            }
            
            if (rrIntervals.length > 0) {
              this._rrIntervals.next(rrIntervals);
            }
          }
        }
      );
      
      console.log('Subscribed to heart rate notifications');
    } catch (error) {
      console.error('Error subscribing to heart rate', error);
    }
  }
}
