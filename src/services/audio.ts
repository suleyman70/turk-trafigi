"use client";

import { storageService } from "./storage";

class AudioService {
  private ctx: AudioContext | null = null;
  
  // Motor oscillator variables
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  private init() {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      // Lazy instantiation
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }
    // Resume context if suspended (browser security autostart block)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  private isEnabled(): boolean {
    const settings = storageService.getSettings();
    return settings.soundEnabled;
  }

  private getVolume(): number {
    const settings = storageService.getSettings();
    return settings.volume;
  }

  // --- MOTOR SOUND (Continuous Sawtooth with low-pass filter) ---
  public startMotor() {
    if (!this.init() || !this.isEnabled()) return;
    if (this.motorOsc) return; // already running

    try {
      const ctx = this.ctx!;
      
      this.motorOsc = ctx.createOscillator();
      this.motorGain = ctx.createGain();
      this.motorFilter = ctx.createBiquadFilter();

      // Sawtooth gives a nice engine rasp
      this.motorOsc.type = "sawtooth";
      this.motorOsc.frequency.setValueAtTime(45, ctx.currentTime); // Low idling sound

      // Filter out high-frequency screech to sound like a motor rumble
      this.motorFilter.type = "lowpass";
      this.motorFilter.frequency.setValueAtTime(140, ctx.currentTime);
      this.motorFilter.Q.setValueAtTime(4, ctx.currentTime);

      // Volume level
      this.motorGain.gain.setValueAtTime(this.getVolume() * 0.25, ctx.currentTime);

      // Connections: Osc -> Filter -> Gain -> Destination
      this.motorOsc.connect(this.motorFilter);
      this.motorFilter.connect(this.motorGain);
      this.motorGain.connect(ctx.destination);

      this.motorOsc.start(0);
    } catch (e) {
      console.error("Failed to start motor sound:", e);
    }
  }

  public updateMotorPitch(speedPercent: number) {
    if (!this.motorOsc || !this.ctx || !this.isEnabled()) return;
    
    // Clamp speedPercent between 0 and 1
    const p = Math.max(0, Math.min(1, speedPercent));
    
    const ctx = this.ctx;
    const now = ctx.currentTime;
    
    // Pitch goes from 45Hz (idle) to 95Hz (high revs)
    const targetFreq = 45 + p * 50;
    this.motorOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    
    // Filter frequency opens up with speed
    const targetFilter = 140 + p * 150;
    if (this.motorFilter) {
      this.motorFilter.frequency.setTargetAtTime(targetFilter, now, 0.1);
    }

    // Gain matches volume settings
    if (this.motorGain) {
      this.motorGain.gain.setTargetAtTime(this.getVolume() * 0.25, now, 0.1);
    }
  }

  public stopMotor() {
    try {
      if (this.motorOsc) {
        this.motorOsc.stop();
        this.motorOsc.disconnect();
        this.motorOsc = null;
      }
      if (this.motorGain) {
        this.motorGain.disconnect();
        this.motorGain = null;
      }
      if (this.motorFilter) {
        this.motorFilter.disconnect();
        this.motorFilter = null;
      }
    } catch (e) {
      // ignore
    }
  }

  // --- MAKAS (Ding Pop effect) ---
  public playMakas() {
    if (!this.init() || !this.isEnabled()) return;
    
    try {
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // High pitch bell tone
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5 (musical arpeggio)
      
      gain.gain.setValueAtTime(this.getVolume() * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // ignore
    }
  }

  // --- CRASH (White Noise Explosion) ---
  public playCrash() {
    if (!this.init() || !this.isEnabled()) return;
    this.stopMotor(); // turn off motor on crash

    try {
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      
      // Generate 1 second of white noise
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      // Starts high and sweeps down (simulating explosion decay)
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.getVolume() * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noiseNode.start(now);
      noiseNode.stop(now + 0.8);
    } catch (e) {
      // ignore
    }
  }

  // --- HORN (Typical dual-tone İstanbul horn "dat-dat") ---
  public playHorn() {
    if (!this.init() || !this.isEnabled()) return;
    
    try {
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      
      const playBeep = (startTime: number, duration: number) => {
        // Dual oscillators for discordant, loud horn sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(435, startTime);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(445, startTime); // slightly detuned
        
        gain.gain.setValueAtTime(this.getVolume() * 0.4, startTime);
        gain.gain.setValueAtTime(this.getVolume() * 0.4, startTime + duration - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(startTime);
        osc2.start(startTime);
        
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      // Dat-dat double beep
      playBeep(now, 0.12);
      playBeep(now + 0.18, 0.12);
    } catch (e) {
      // ignore
    }
  }

  // --- NITRO (Gas Swoosh effect) ---
  public playNitro() {
    if (!this.init() || !this.isEnabled()) return;

    try {
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      // 0.6s of white noise sweep
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.getVolume() * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.6);

      // Igniter sine sweep
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

      oscGain.gain.setValueAtTime(this.getVolume() * 0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // ignore
    }
  }

  // --- SIREN (Dual-Tone alternating beeps) ---
  public playSirenTone(isHigh: boolean) {
    if (!this.init() || !this.isEnabled()) return;

    try {
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(isHigh ? 880 : 660, now);

      gain.gain.setValueAtTime(this.getVolume() * 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      // ignore
    }
  }
}

export const audioService = new AudioService();
