function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class NeonAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.ready = false;
    this.music = null;
    this.soundFiles = {};
  }

  ensure() {
    if (this.ready) {
      return true;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.context.destination);
    this.setupMedia();
    this.ready = true;
    return true;
  }

  async unlock() {
    if (!this.ensure()) {
      return;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    if (this.music && this.music.paused) {
      this.music.play().catch(() => {});
    }
  }

  setupMedia() {
    if (this.music) {
      return;
    }

    this.music = new Audio("/assets/music/neon-drive.wav");
    this.music.loop = true;
    this.music.volume = 0.22;

    this.soundFiles = {
      swapWeapon: "/assets/sounds/swap-weapon.wav",
      doorOpen: "/assets/sounds/door-open.wav",
      powerup: "/assets/sounds/powerup.wav",
      bossAlert: "/assets/sounds/boss-alert.wav",
    };
  }

  playFile(path, volume = 0.35) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  startMusic() {
    if (!this.ensure() || !this.music) {
      return;
    }

    this.music.play().catch(() => {});
  }

  playSwapWeapon() {
    this.playFile(this.soundFiles.swapWeapon, 0.42);
  }

  playDoorOpen() {
    this.playFile(this.soundFiles.doorOpen, 0.38);
  }

  playPowerupFx() {
    this.playFile(this.soundFiles.powerup, 0.4);
  }

  playBossAlert() {
    this.playFile(this.soundFiles.bossAlert, 0.48);
  }

  pulse({ frequency, duration = 0.08, type = "sawtooth", volume = 0.18, slide = 0.75 }) {
    if (!this.ensure()) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      clamp(frequency * slide, 40, 4200),
      now + duration,
    );

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  noiseBurst({ duration = 0.12, volume = 0.12, highpass = 600 }) {
    if (!this.ensure()) {
      return;
    }

    const now = this.context.currentTime;
    const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(highpass, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    source.start(now);
    source.stop(now + duration + 0.02);
  }

  playShot(profile = "repeater") {
    const profiles = {
      repeater: () => {
        this.pulse({ frequency: 320, duration: 0.09, type: "square", volume: 0.18, slide: 1.8 });
        this.noiseBurst({ duration: 0.06, volume: 0.05, highpass: 1400 });
      },
      shotgun: () => {
        this.pulse({ frequency: 120, duration: 0.16, type: "sawtooth", volume: 0.2, slide: 0.62 });
        this.pulse({ frequency: 210, duration: 0.08, type: "square", volume: 0.14, slide: 0.78 });
        this.noiseBurst({ duration: 0.11, volume: 0.1, highpass: 520 });
      },
      carbine: () => {
        this.pulse({ frequency: 420, duration: 0.12, type: "triangle", volume: 0.16, slide: 0.74 });
        this.pulse({ frequency: 860, duration: 0.05, type: "sine", volume: 0.08, slide: 0.66 });
        this.noiseBurst({ duration: 0.05, volume: 0.04, highpass: 1800 });
      },
      hellburst: () => {
        this.pulse({ frequency: 150, duration: 0.2, type: "sawtooth", volume: 0.24, slide: 0.46 });
        this.pulse({ frequency: 74, duration: 0.24, type: "square", volume: 0.12, slide: 0.58 });
        this.noiseBurst({ duration: 0.14, volume: 0.12, highpass: 340 });
      },
    };

    (profiles[profile] || profiles.repeater)();
  }

  playHit() {
    this.pulse({ frequency: 240, duration: 0.08, type: "triangle", volume: 0.1, slide: 0.65 });
  }

  playKill() {
    this.pulse({ frequency: 180, duration: 0.18, type: "sawtooth", volume: 0.16, slide: 0.42 });
  }

  playPickup(type) {
    const frequencies = {
      ammo: 520,
      health: 460,
      overcharge: 620,
      fury: 680,
      shield: 540,
      arsenal: 760,
    };

    this.pulse({
      frequency: frequencies[type] || 500,
      duration: 0.12,
      type: "triangle",
      volume: 0.12,
      slide: 1.24,
    });

    if (type === "fury" || type === "shield" || type === "arsenal" || type === "overcharge") {
      this.playPowerupFx();
    }
  }

  playWaveStart() {
    this.pulse({ frequency: 220, duration: 0.16, type: "sawtooth", volume: 0.14, slide: 1.5 });
    this.pulse({ frequency: 330, duration: 0.2, type: "triangle", volume: 0.1, slide: 1.22 });
  }

  playPlayerDamage() {
    this.noiseBurst({ duration: 0.08, volume: 0.08, highpass: 300 });
  }

  playGameOver() {
    this.pulse({ frequency: 220, duration: 0.24, type: "square", volume: 0.14, slide: 0.6 });
    this.pulse({ frequency: 120, duration: 0.28, type: "triangle", volume: 0.12, slide: 0.55 });
  }
}
