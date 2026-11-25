class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0,
    slideTo?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, slideTo),
          now + duration
        );
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignore audio failures in restricted browsers
    }
  }

  private playNoise(duration: number, volume = 0.12, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const sampleRate = ctx.sampleRate;
      const length = Math.max(1, Math.floor(sampleRate * duration));
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime + delay);
      const gain = ctx.createGain();
      const now = ctx.currentTime + delay;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
    } catch {
      // Ignore audio failures
    }
  }

  public click() {
    this.playTone(620, 0.045, 'square', 0.055, 0, 440);
  }

  public boot() {
    // Classic 2-note DMG power-on chime
    this.playTone(987.77, 0.09, 'square', 0.09, 0.05);
    this.playTone(1318.51, 0.42, 'square', 0.09, 0.14);
  }

  public coin() {
    this.playTone(987.77, 0.07, 'square', 0.08, 0);
    this.playTone(1318.51, 0.2, 'square', 0.08, 0.07);
  }

  public tileReveal(step = 0) {
    const pitch = 440 + Math.min(12, step) * 42;
    this.playTone(pitch, 0.075, 'square', 0.07, 0, pitch * 1.15);
  }

  public diceTick() {
    this.playTone(320 + Math.random() * 220, 0.035, 'triangle', 0.06);
  }

  public pegBounce(row = 0) {
    const freq = 520 + row * 28 + (Math.random() * 40 - 20);
    this.playTone(freq, 0.03, 'triangle', 0.045);
  }

  public wheelTick() {
    this.playTone(760, 0.025, 'square', 0.05);
  }

  public slotSpinStep() {
    this.playTone(220, 0.03, 'square', 0.035);
  }

  public slotStop(reelIdx: number) {
    this.playTone(280 + reelIdx * 70, 0.08, 'triangle', 0.09, 0, 140);
  }

  public coinFlip() {
    this.playTone(720, 0.045, 'square', 0.055, 0, 1040);
    this.playTone(880, 0.045, 'square', 0.05, 0.06, 1240);
  }

  public cupSlide() {
    this.playTone(260, 0.05, 'triangle', 0.07, 0, 180);
  }

  public kenoBlip(isHit: boolean, step = 0) {
    if (isHit) {
      this.playTone(740 + step * 35, 0.075, 'square', 0.075, 0, 1120);
    } else {
      this.playTone(340, 0.035, 'triangle', 0.045);
    }
  }

  public win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.12, 'square', 0.08, idx * 0.075);
    });
  }

  public jackpot() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.14, 'square', 0.09, idx * 0.065);
    });
  }

  public lose() {
    this.playTone(300, 0.14, 'sawtooth', 0.075, 0, 210);
    this.playTone(200, 0.24, 'sawtooth', 0.075, 0.14, 110);
  }

  public explosion() {
    this.playNoise(0.32, 0.16, 0);
    this.playTone(140, 0.28, 'sawtooth', 0.1, 0, 42);
  }
}

export const soundEngine = new RetroSoundEngine();
