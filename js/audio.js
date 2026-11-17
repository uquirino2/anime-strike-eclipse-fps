// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - PROCEDURAL WEBAUDIO ENGINE
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterVol = 0.7;
    this.sfxVol = 0.85;
    this.bgmVol = 0.35;
    this.bgmInterval = null;
    this.isBgmPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getGain(mult = 1) {
    if (!this.ctx) return null;
    const g = this.ctx.createGain();
    g.gain.value = Math.max(0.0001, this.masterVol * this.sfxVol * mult);
    g.connect(this.ctx.destination);
    return g;
  }

  playUI(type = 'click') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.getGain(0.25);
    osc.type = type === 'hover' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(type === 'hover' ? 680 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(type === 'hover' ? 880 : 1040, now + 0.065);
    g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  playShoot(weaponId = 'pulse_rifle') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise burst for percussive gunshot
    const bufferSize = Math.floor(this.ctx.sampleRate * (weaponId === 'glacier_sniper' ? 0.28 : 0.11));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.32));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = weaponId === 'glacier_sniper' ? 900 : weaponId === 'stardust_smg' ? 2200 : 1400;

    const g = this.getGain(weaponId === 'glacier_sniper' ? 0.55 : 0.35);
    noise.connect(filter);
    filter.connect(g);
    noise.start(now);

    // Anime laser/plasma transient punch
    const osc = this.ctx.createOscillator();
    const og = this.getGain(0.3);
    osc.type = weaponId === 'glacier_sniper' ? 'sawtooth' : 'square';
    const startFreq = weaponId === 'glacier_sniper' ? 420 : weaponId === 'stardust_smg' ? 660 : 320;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + (weaponId === 'glacier_sniper' ? 0.24 : 0.09));
    og.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.28, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + (weaponId === 'glacier_sniper' ? 0.25 : 0.095));
    osc.connect(og);
    osc.start(now);
    osc.stop(now + (weaponId === 'glacier_sniper' ? 0.26 : 0.1));
  }

  playHit(isHeadshot = false) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.getGain(isHeadshot ? 0.45 : 0.28);
    osc.type = isHeadshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1350 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2200 : 220, now + (isHeadshot ? 0.14 : 0.06));
    g.gain.setValueAtTime(this.masterVol * this.sfxVol * (isHeadshot ? 0.45 : 0.25), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isHeadshot ? 0.15 : 0.065));
    osc.connect(g);
    osc.start(now);
    osc.stop(now + (isHeadshot ? 0.16 : 0.07));
  }

  playKillStreak(streak = 1) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const freq = baseNotes[Math.min(streak - 1, baseNotes.length - 1)];

    [freq, freq * 1.25].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.getGain(0.32);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.3, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.32);
      osc.connect(g);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.34);
    });
  }

  playAbility(slot = 'q') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.getGain(slot === 'x' ? 0.5 : 0.35);

    if (slot === 'x') {
      // Ultimate power chord sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);
      g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(g);
      osc.start(now);
      osc.stop(now + 0.56);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.18);
      g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(g);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  playReload() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.22].forEach((offset, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.getGain(0.2);
      osc.type = 'square';
      osc.frequency.setValueAtTime(i === 0 ? 290 : 440, now + offset);
      g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.18, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);
      osc.connect(g);
      osc.start(now + offset);
      osc.stop(now + offset + 0.055);
    });
  }

  playSpikeBeep(urgent = false) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.getGain(0.28);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 1280 : 960, now);
    g.gain.setValueAtTime(this.masterVol * this.sfxVol * 0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}

window.SOUND = new SoundEngine();
