import {
  ArenaId,
  FighterId,
  GameSettings,
  GraphicsQuality,
  SaveProgress,
} from '../types/game';

const PROGRESS_STORAGE_KEY = 'sn_tekken_4_save_v1';
const SETTINGS_STORAGE_KEY = 'sn_tekken_4_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.55,
  sfxVolume: 0.85,
  voiceVolume: 0.90,
  muted: false,
  vibrationEnabled: true,
  graphicsQuality: GraphicsQuality.HIGH,
  aiFreeFightDifficulty: 0.65,
  touchControls: {
    buttonScale: 1.0,
    dpadOffsetX: 28,
    dpadOffsetY: 28,
    buttonsOffsetX: 28,
    buttonsOffsetY: 28,
    opacity: 0.88,
  },
};

export const DEFAULT_PROGRESS: SaveProgress = {
  version: 1,
  unlockedStage: 1,
  completedStages: [],
  stageBestTimeSec: {},
  totalWins: 0,
  totalMatches: 0,
  lastSelectedFighter: FighterId.LION_KING,
  lastFreeFightOpponent: FighterId.SILVERBACK_GORILLA,
  lastFreeFightArena: ArenaId.SAVANNA_CITADEL,
};

function isValidFighterId(val: unknown): val is FighterId {
  return typeof val === 'string' && Object.values(FighterId).includes(val as FighterId);
}

function isValidArenaId(val: unknown): val is ArenaId {
  return typeof val === 'string' && Object.values(ArenaId).includes(val as ArenaId);
}

function isValidGraphicsQuality(val: unknown): val is GraphicsQuality {
  return typeof val === 'string' && Object.values(GraphicsQuality).includes(val as GraphicsQuality);
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function loadSaveProgress(): SaveProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PROGRESS };

    const unlockedStage = Math.round(clamp(parsed.unlockedStage, 1, 6, 1));
    const completedStages = Array.isArray(parsed.completedStages)
      ? parsed.completedStages
          .filter((x: unknown): x is number => typeof x === 'number' && x >= 1 && x <= 6)
          .map((x: number) => Math.round(x))
      : [];

    const stageBestTimeSec: Record<number, number> = {};
    if (parsed.stageBestTimeSec && typeof parsed.stageBestTimeSec === 'object') {
      for (const [k, v] of Object.entries(parsed.stageBestTimeSec)) {
        const numK = Number(k);
        if (numK >= 1 && numK <= 6 && typeof v === 'number' && v > 0) {
          stageBestTimeSec[numK] = Math.round(v);
        }
      }
    }

    return {
      version: 1,
      unlockedStage,
      completedStages: Array.from(new Set<number>(completedStages)).sort((a, b) => a - b),
      stageBestTimeSec,
      totalWins: Math.max(0, Math.round(clamp(parsed.totalWins, 0, 999999, 0))),
      totalMatches: Math.max(0, Math.round(clamp(parsed.totalMatches, 0, 999999, 0))),
      lastSelectedFighter: isValidFighterId(parsed.lastSelectedFighter)
        ? parsed.lastSelectedFighter
        : DEFAULT_PROGRESS.lastSelectedFighter,
      lastFreeFightOpponent: isValidFighterId(parsed.lastFreeFightOpponent)
        ? parsed.lastFreeFightOpponent
        : DEFAULT_PROGRESS.lastFreeFightOpponent,
      lastFreeFightArena: isValidArenaId(parsed.lastFreeFightArena)
        ? parsed.lastFreeFightArena
        : DEFAULT_PROGRESS.lastFreeFightArena,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function persistSaveProgress(progress: SaveProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors safely offline
  }
}

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, touchControls: { ...DEFAULT_SETTINGS.touchControls } };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_SETTINGS, touchControls: { ...DEFAULT_SETTINGS.touchControls } };
    }

    const tc = parsed.touchControls && typeof parsed.touchControls === 'object' ? parsed.touchControls : {};

    return {
      musicVolume: clamp(parsed.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp(parsed.sfxVolume, 0, 1, DEFAULT_SETTINGS.sfxVolume),
      voiceVolume: clamp(parsed.voiceVolume, 0, 1, DEFAULT_SETTINGS.voiceVolume),
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted,
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : DEFAULT_SETTINGS.vibrationEnabled,
      graphicsQuality: isValidGraphicsQuality(parsed.graphicsQuality)
        ? parsed.graphicsQuality
        : DEFAULT_SETTINGS.graphicsQuality,
      aiFreeFightDifficulty: clamp(
        parsed.aiFreeFightDifficulty,
        0.2,
        1.0,
        DEFAULT_SETTINGS.aiFreeFightDifficulty
      ),
      touchControls: {
        buttonScale: clamp(tc.buttonScale, 0.75, 1.35, DEFAULT_SETTINGS.touchControls.buttonScale),
        dpadOffsetX: clamp(tc.dpadOffsetX, 12, 160, DEFAULT_SETTINGS.touchControls.dpadOffsetX),
        dpadOffsetY: clamp(tc.dpadOffsetY, 12, 140, DEFAULT_SETTINGS.touchControls.dpadOffsetY),
        buttonsOffsetX: clamp(
          tc.buttonsOffsetX,
          12,
          160,
          DEFAULT_SETTINGS.touchControls.buttonsOffsetX
        ),
        buttonsOffsetY: clamp(
          tc.buttonsOffsetY,
          12,
          140,
          DEFAULT_SETTINGS.touchControls.buttonsOffsetY
        ),
        opacity: clamp(tc.opacity, 0.45, 1.0, DEFAULT_SETTINGS.touchControls.opacity),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, touchControls: { ...DEFAULT_SETTINGS.touchControls } };
  }
}

export function persistGameSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors safely offline
  }
}

export function resetSaveProgress(): SaveProgress {
  const clean = { ...DEFAULT_PROGRESS };
  persistSaveProgress(clean);
  return clean;
}
