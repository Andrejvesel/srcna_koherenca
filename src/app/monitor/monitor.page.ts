import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { PolarDeviceService } from '../services/polar-device.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-monitor',
  templateUrl: 'monitor.page.html',
  styleUrls: ['monitor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MonitorPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('hrvChart') hrvChartElement: ElementRef;
  @ViewChild('coherenceChart') coherenceChartElement: ElementRef;
  
  currentHeartRate = 0;
  averageHeartRate = 0;
  coherenceScore = 0;
  coherencePoints = 0;
  isRecording = false;
  sessionTime = '00:00';
  sessionSeconds = 0;
  
  // For SVG path data
  hrvPathData = '';
  coherencePathData = '';
  
  // Data arrays
  private heartRates: number[] = [];
  private rrIntervals: number[] = [];
  private coherenceScores: number[] = [];
  private hrvValues: number[] = [];
  
  private sessionTimer: any;
  private coherenceTimer: any;
  private chartUpdateTimer: any;
  private subscription: Subscription = new Subscription();

  constructor(private polarDeviceService: PolarDeviceService) {}

  ngOnInit() {
    // Subscribe to heart rate updates
    this.subscription.add(
      this.polarDeviceService.heartRate$.subscribe(heartRate => {
        this.currentHeartRate = heartRate;
        
        if (this.isRecording) {
          this.heartRates.push(heartRate);
          this.updateAverageHeartRate();
        }
      })
    );
    
    // Subscribe to RR intervals
    this.subscription.add(
      this.polarDeviceService.rrIntervals$.subscribe(intervals => {
        if (intervals.length > 0 && this.isRecording) {
          this.rrIntervals = [...this.rrIntervals, ...intervals].slice(-300); // Keep last 5 minutes
          this.calculateHRV();
        }
      })
    );
    
    // Set up coherence calculation timer (every 5 seconds)
    this.coherenceTimer = setInterval(() => {
      if (this.isRecording) {
        this.calculateCoherence();
      }
    }, 5000);
  }

  ngAfterViewInit() {
    // Initialize charts with empty data
    this.initializeCharts();
    
    // Set up chart update timer
    this.chartUpdateTimer = setInterval(() => {
      if (this.isRecording) {
        this.updateCharts();
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
    if (this.coherenceTimer) {
      clearInterval(this.coherenceTimer);
    }
    if (this.chartUpdateTimer) {
      clearInterval(this.chartUpdateTimer);
    }
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    
    if (this.isRecording) {
      // Start new session
      this.sessionSeconds = 0;
      this.sessionTime = '00:00';
      this.heartRates = [];
      this.rrIntervals = [];
      this.coherenceScores = [];
      this.hrvValues = [];
      this.coherencePoints = 0;
      this.averageHeartRate = 0;
      
      this.sessionTimer = setInterval(() => {
        this.sessionSeconds++;
        const minutes = Math.floor(this.sessionSeconds / 60);
        const seconds = this.sessionSeconds % 60;
        this.sessionTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }, 1000);
    } else {
      // End session
      if (this.sessionTimer) {
        clearInterval(this.sessionTimer);
      }
      // Here we would save the session data
    }
  }

  calculateHRV() {
    if (this.rrIntervals.length < 10) {
      return;
    }
    
    // Calculate RMSSD (Root Mean Square of Successive Differences)
    // This is a common time-domain measure of HRV
    let sumSquaredDiff = 0;
    for (let i = 1; i < this.rrIntervals.length; i++) {
      const diff = this.rrIntervals[i] - this.rrIntervals[i-1];
      sumSquaredDiff += diff * diff;
    }
    
    const rmssd = Math.sqrt(sumSquaredDiff / (this.rrIntervals.length - 1));
    
    // Store HRV value
    this.hrvValues.push(rmssd);
    
    // Keep only the last 60 values (1 minute at 1 value per second)
    if (this.hrvValues.length > 60) {
      this.hrvValues = this.hrvValues.slice(-60);
    }
  }

  calculateCoherence() {
    if (this.rrIntervals.length < 32) {
      // Not enough data yet
      this.coherenceScore = 0;
      return;
    }
    
    // Advanced coherence calculation based on HeartMath methodology
    
    // 1. Calculate the power spectrum using FFT
    const fftData = this.calculateFFT(this.rrIntervals.slice(-32));
    
    // 2. Find the peak in the LF band (0.04-0.15 Hz)
    const lfBandPower = this.calculateBandPower(fftData, 0.04, 0.15);
    
    // 3. Calculate total power
    const totalPower = this.calculateTotalPower(fftData);
    
    // 4. Calculate coherence ratio (peak power / total power)
    const coherenceRatio = lfBandPower / totalPower;
    
    // 5. Scale to 0-10 range
    const newCoherenceScore = Math.min(10, coherenceRatio * 100);
    
    // 6. Smooth the transition to the new score
    this.coherenceScore = this.coherenceScore * 0.7 + newCoherenceScore * 0.3;
    
    // 7. Store coherence score
    this.coherenceScores.push(this.coherenceScore);
    
    // 8. Keep only the last 30 values (2.5 minutes at 1 value per 5 seconds)
    if (this.coherenceScores.length > 30) {
      this.coherenceScores = this.coherenceScores.slice(-30);
    }
    
    // 9. Update coherence points
    // Higher coherence scores earn more points
    if (this.coherenceScore >= 6.5) {
      this.coherencePoints += 3;
    } else if (this.coherenceScore >= 3.5) {
      this.coherencePoints += 1;
    }
  }

  // Simplified FFT calculation for demonstration
  // In a real app, you would use a proper FFT library
  calculateFFT(rrIntervals: number[]): number[] {
    // This is a placeholder - in a real app, use a proper FFT implementation
    // For demonstration, we'll return random frequency data
    return Array(32).fill(0).map(() => Math.random() * 10);
  }

  calculateBandPower(fftData: number[], minFreq: number, maxFreq: number): number {
    // This is a placeholder - in a real app, calculate actual band power
    // For demonstration, we'll return a random value
    return 5 + Math.random() * 5;
  }

  calculateTotalPower(fftData: number[]): number {
    // This is a placeholder - in a real app, calculate actual total power
    // For demonstration, we'll return a random value
    return 20 + Math.random() * 10;
  }

  updateAverageHeartRate() {
    if (this.heartRates.length === 0) {
      this.averageHeartRate = 0;
      return;
    }
    
    const sum = this.heartRates.reduce((a, b) => a + b, 0);
    this.averageHeartRate = Math.round(sum / this.heartRates.length);
  }

  getCoherenceClass(): string {
    if (this.coherenceScore >= 6.5) return 'high';
    if (this.coherenceScore >= 3.5) return 'medium';
    return 'low';
  }

  getCoherenceStatus(): string {
    if (this.coherenceScore >= 6.5) return 'High Coherence';
    if (this.coherenceScore >= 3.5) return 'Medium Coherence';
    return 'Low Coherence';
  }

  initializeCharts() {
    // Initialize HRV chart with placeholder data
    const hrvData = Array(60).fill(0).map(() => 40 + Math.random() * 40);
    this.updateHrvChart(hrvData);
    
    // Initialize coherence chart with placeholder data
    const coherenceData = Array(30).fill(0).map(() => 1 + Math.random() * 5);
    this.updateCoherenceChart(coherenceData);
  }

  updateCharts() {
    // Update HRV chart
    if (this.hrvValues.length > 0) {
      this.updateHrvChart(this.hrvValues);
    }
    
    // Update coherence chart
    if (this.coherenceScores.length > 0) {
      this.updateCoherenceChart(this.coherenceScores);
    }
  }

  updateHrvChart(data: number[]) {
    // Create SVG path data for HRV line
    const width = this.hrvChartElement?.nativeElement.clientWidth || 300;
    const height = 150;
    const xStep = width / (data.length - 1);
    
    let path = `M 0,${height - (data[0] / 100 * height)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = i * xStep;
      const y = height - (data[i] / 100 * height);
      path += ` L ${x},${y}`;
    }
    
    this.hrvPathData = path;
  }

  updateCoherenceChart(data: number[]) {
    // Create SVG path data for coherence line
    const width = this.coherenceChartElement?.nativeElement.clientWidth || 300;
    const height = 150;
    const xStep = width / (data.length - 1);
    
    let path = `M 0,${height - (data[0] / 10 * height)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = i * xStep;
      const y = height - (data[i] / 10 * height);
      path += ` L ${x},${y}`;
    }
    
    this.coherencePathData = path;
  }
}
