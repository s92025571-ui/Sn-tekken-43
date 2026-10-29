import { FighterId, GameSettings } from '../types/game';
import { FIGHTER_ROSTER } from '../data/fightersAndStages';

export enum SoundCue {
  UI_SELECT = 'UI_SELECT',
  UI_CONFIRM = 'UI_CONFIRM',
  LIGHT_HIT = 'LIGHT_HIT',
  HEAVY_HIT = 'HEAVY_HIT',
  BLOCK_GUARD = 'BLOCK_GUARD',
  DODGE_SWISH = 'DODGE_SWISH',
  JUMP_WHOOSH = 'JUMP_WHOOSH',
  THROW_SLAM = 'THROW_SLAM',
  SPECIAL_FLASH = 'SPECIAL_FLASH',
  DRAGON_FIRE_BREATH = 'DRAGON_FIRE_BREATH',
  DRAGON_LIGHTNING = 'DRAGON_LIGHTNING',
  ULTIMATE_BLAST = 'ULTIMATE_BLAST',
  KO_GONG = 'KO_GONG',
  ROUND_START = 'ROUND_START',
  VICTORY_CHORD = 'VICTORY_CHORD',
}

export enum BgmMode {
  NONE = 'NONE',
  MENU = 'MENU',
  ARENA = 'ARENA',
  DRAGON_BOSS = 'DRAGON_BOSS',
}

class ArcadeSoundService {
  private ctx: AudioContext | null = null;
  private settings: GameSettings | null = null;
  private bgmMode: BgmMode = BgmMode.NONE;
  private bgmTimer: number | null = null;
  private stepIndex = 0;

  public applySettings(settings: GameSettings): void {
    this.settings = settings;
    if (settings.muted && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe fallback
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio(): void {
    this.ensureContext();
  }

  private getSfxGain(): number {
    if (!this.settings || this.settings.muted) return 0;
    return this.settings.sfxVolume;
  }

  private getVoiceGain(): number {
    if (!this.settings || this.settings.muted) return 0;
    return this.settings.voiceVolume;
  }

  private getMusicGain(): number {
    if (!this.settings || this.settings.muted) return 0;
    return this.settings.musicVolume;
  }

  public vibrate(pattern: number | number[]): void {
    if (!this.settings || !this.settings.vibrationEnabled || this.settings.muted) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  public playCue(cue: SoundCue): void {
    const vol = this.getSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (cue) {
      case SoundCue.UI_SELECT: {
        this.playTone(ctx, 540, 760, 0.06, 'triangle', vol * 0.25, now);
        break;
      }
      case SoundCue.UI_CONFIRM: {
        this.playTone(ctx, 440, 880, 0.12, 'sawtooth', vol * 0.3, now);
        break;
      }
      case SoundCue.LIGHT_HIT: {
        this.vibrate(18);
        this.playNoiseBurst(ctx, 0.08, 1200, vol * 0.55, now);
        this.playTone(ctx, 210, 75, 0.09, 'triangle', vol * 0.5, now);
        break;
      }
      case SoundCue.HEAVY_HIT: {
        this.vibrate([32, 20, 40]);
        this.playNoiseBurst(ctx, 0.16, 850, vol * 0.8, now);
        this.playTone(ctx, 155, 42, 0.18, 'sawtooth', vol * 0.75, now);
        break;
      }
      case SoundCue.BLOCK_GUARD: {
        this.vibrate(14);
        this.playTone(ctx, 980, 620, 0.09, 'square', vol * 0.35, now);
        this.playTone(ctx, 1460, 1120, 0.07, 'triangle', vol * 0.28, now);
        break;
      }
      case SoundCue.DODGE_SWISH:
      case SoundCue.JUMP_WHOOSH: {
        this.playNoiseBurst(ctx, 0.14, 620, vol * 0.32, now);
        break;
      }
      case SoundCue.THROW_SLAM: {
        this.vibrate([45, 25, 65]);
        this.playNoiseBurst(ctx, 0.24, 480, vol * 0.85, now);
        this.playTone(ctx, 115, 34, 0.26, 'sine', vol * 0.85, now);
        break;
      }
      case SoundCue.SPECIAL_FLASH: {
        this.vibrate([25, 20, 50]);
        this.playTone(ctx, 280, 960, 0.24, 'sawtooth', vol * 0.45, now);
        this.playTone(ctx, 420, 1280, 0.24, 'triangle', vol * 0.35, now + 0.04);
        break;
      }
      case SoundCue.DRAGON_FIRE_BREATH: {
        this.vibrate([30, 30, 60]);
        this.playNoiseBurst(ctx, 0.52, 540, vol * 0.78, now);
        this.playTone(ctx, 130, 68, 0.48, 'sawtooth', vol * 0.5, now);
        break;
      }
      case SoundCue.DRAGON_LIGHTNING: {
        this.vibrate([20, 15, 35, 15, 50]);
        this.playNoiseBurst(ctx, 0.28, 2400, vol * 0.7, now);
        this.playTone(ctx, 1320, 180, 0.25, 'sawtooth', vol * 0.5, now);
        break;
      }
      case SoundCue.ULTIMATE_BLAST: {
        this.vibrate([60, 30, 90, 30, 110]);
        this.playNoiseBurst(ctx, 0.68, 720, vol * 0.9, now);
        this.playTone(ctx, 96, 28, 0.65, 'sawtooth', vol * 0.85, now);
        this.playTone(ctx, 320, 880, 0.35, 'triangle', vol * 0.45, now);
        break;
      }
      case SoundCue.ROUND_START: {
        this.playTone(ctx, 330, 440, 0.18, 'triangle', vol * 0.4, now);
        this.playTone(ctx, 440, 660, 0.24, 'sawtooth', vol * 0.45, now + 0.14);
        break;
      }
      case SoundCue.KO_GONG: {
        this.vibrate([80, 40, 120]);
        this.playNoiseBurst(ctx, 0.45, 520, vol * 0.8, now);
        this.playTone(ctx, 164, 55, 0.75, 'sawtooth', vol * 0.7, now);
        this.playTone(ctx, 246, 123, 0.65, 'triangle', vol * 0.45, now);
        break;
      }
      case SoundCue.VICTORY_CHORD: {
        const notes = [261.63, 329.63, 392.0, 523.25];
        notes.forEach((freq, idx) => {
          this.playTone(ctx, freq, freq * 1.005, 0.48, 'triangle', vol * 0.28, now + idx * 0.08);
        });
        break;
      }
    }
  }

  public playFighterRoar(fighterId: FighterId, isHeavyOrSpecial = false): void {
    const voiceVol = this.getVoiceGain();
    if (voiceVol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = isHeavyOrSpecial ? 0.36 : 0.18;

    switch (fighterId) {
      case FighterId.LION_KING: {
        // Deep royal lion roar formant
        this.playTone(ctx, 145, 78, dur, 'sawtooth', voiceVol * 0.55, now);
        this.playNoiseBurst(ctx, dur, 480, voiceVol * 0.42, now);
        break;
      }
      case FighterId.SILVERBACK_GORILLA: {
        // Chest-thumping sub-bass gorilla grunt
        this.playTone(ctx, 98, 54, dur, 'square', voiceVol * 0.52, now);
        this.playTone(ctx, 130, 72, dur * 0.8, 'sawtooth', voiceVol * 0.4, now + 0.05);
        break;
      }
      case FighterId.RED_FOX: {
        // Sharp agile kitsune kiai bark
        this.playTone(ctx, 520, 310, dur * 0.75, 'triangle', voiceVol * 0.48, now);
        this.playNoiseBurst(ctx, dur * 0.6, 1500, voiceVol * 0.25, now);
        break;
      }
      case FighterId.CROCODILE_BOSS: {
        // Guttural reptilian bellow hiss
        this.playTone(ctx, 82, 48, dur * 1.15, 'sawtooth', voiceVol * 0.58, now);
        this.playNoiseBurst(ctx, dur, 920, voiceVol * 0.42, now);
        break;
      }
      case FighterId.EAGLE_WARRIOR: {
        // High raptor shriek cry
        this.playTone(ctx, 1280, 790, dur * 0.9, 'sawtooth', voiceVol * 0.36, now);
        this.playTone(ctx, 960, 640, dur * 0.8, 'triangle', voiceVol * 0.3, now + 0.03);
        break;
      }
      case FighterId.DRAGON_BOSS: {
        // Mythic multi-layered draconic roar
        this.playTone(ctx, 118, 44, dur * 1.35, 'sawtooth', voiceVol * 0.65, now);
        this.playTone(ctx, 236, 88, dur * 1.2, 'square', voiceVol * 0.35, now);
        this.playNoiseBurst(ctx, dur * 1.25, 680, voiceVol * 0.5, now);
        break;
      }
    }
  }

  public speakAnnouncerLine(text: string, pitch = 0.85, rate = 1.04): void {
    const voiceVol = this.getVoiceGain();
    if (voiceVol <= 0.02) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.volume = Math.min(1, voiceVol);
      utter.pitch = pitch;
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
    } catch {
      // Safe offline/headless fallback
    }
  }

  public playVictoryVoice(fighterId: FighterId): void {
    this.playFighterRoar(fighterId, true);
    const spec = FIGHTER_ROSTER[fighterId];
    const pitchMap: Record<FighterId, number> = {
      [FighterId.LION_KING]: 0.78,
      [FighterId.SILVERBACK_GORILLA]: 0.62,
      [FighterId.RED_FOX]: 1.18,
      [FighterId.CROCODILE_BOSS]: 0.66,
      [FighterId.EAGLE_WARRIOR]: 1.08,
      [FighterId.DRAGON_BOSS]: 0.55,
    };
    setTimeout(() => {
      this.speakAnnouncerLine(`${spec.shortName} Wins! ${spec.victoryQuote}`, pitchMap[fighterId], 0.98);
    }, 320);
  }

  public setBgmMode(mode: BgmMode): void {
    if (this.bgmMode === mode) return;
    this.bgmMode = mode;
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (mode === BgmMode.NONE) return;

    this.stepIndex = 0;
    const tempoMs = mode === BgmMode.DRAGON_BOSS ? 175 : mode === BgmMode.ARENA ? 205 : 280;

    this.bgmTimer = window.setInterval(() => {
      const musicVol = this.getMusicGain();
      if (musicVol <= 0.01) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      const i = this.stepIndex % 16;
      this.stepIndex++;

      if (mode === BgmMode.MENU) {
        const bassScale = [65.41, 65.41, 77.78, 73.42, 65.41, 65.41, 87.31, 77.78];
        const note = bassScale[Math.floor(i / 2) % bassScale.length];
        if (i % 2 === 0) {
          this.playTone(ctx, note, note, 0.24, 'triangle', musicVol * 0.16, now);
        }
        if (i === 0 || i === 8) {
          this.playTone(ctx, 55, 32, 0.18, 'sine', musicVol * 0.22, now);
        }
      } else if (mode === BgmMode.ARENA) {
        const riff = [73.42, 73.42, 87.31, 98.0, 73.42, 110.0, 103.83, 87.31];
        const freq = riff[i % riff.length];
        this.playTone(ctx, freq, freq * 0.99, 0.16, 'sawtooth', musicVol * 0.13, now);
        if (i % 4 === 0) {
          this.playTone(ctx, 90, 36, 0.14, 'sine', musicVol * 0.24, now);
        } else if (i % 4 === 2) {
          this.playNoiseBurst(ctx, 0.06, 1800, musicVol * 0.1, now);
        }
      } else if (mode === BgmMode.DRAGON_BOSS) {
        const bossRiff = [65.41, 69.3, 65.41, 98.0, 65.41, 69.3, 103.83, 98.0];
        const freq = bossRiff[i % bossRiff.length];
        this.playTone(ctx, freq, freq * 0.98, 0.15, 'sawtooth', musicVol * 0.16, now);
        if (i % 2 === 0) {
          this.playTone(ctx, 88, 32, 0.12, 'sine', musicVol * 0.26, now);
        }
        if (i % 4 === 3) {
          this.playNoiseBurst(ctx, 0.08, 2100, musicVol * 0.13, now);
        }
      }
    }, tempoMs);
  }

  private playTone(
    ctx: AudioContext,
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    startTime: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, startFreq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(0.9, gainPeak), startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playNoiseBurst(
    ctx: AudioContext,
    duration: number,
    cutoffHz: number,
    gainPeak: number,
    startTime: number
  ): void {
    const sampleCount = Math.max(256, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.45));
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoffHz, startTime);
    filter.Q.setValueAtTime(1.2, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.9, gainPeak), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(startTime);
  }
}

export const soundEngine = new ArcadeSoundService();
