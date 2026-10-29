export enum FighterId {
  LION_KING = 'LION_KING',
  SILVERBACK_GORILLA = 'SILVERBACK_GORILLA',
  RED_FOX = 'RED_FOX',
  CROCODILE_BOSS = 'CROCODILE_BOSS',
  EAGLE_WARRIOR = 'EAGLE_WARRIOR',
  DRAGON_BOSS = 'DRAGON_BOSS',
}

export enum ArenaId {
  SAVANNA_CITADEL = 'SAVANNA_CITADEL',
  MIST_JUNGLE_RUINS = 'MIST_JUNGLE_RUINS',
  CRIMSON_BAMBOO_SHRINE = 'CRIMSON_BAMBOO_SHRINE',
  SUNKEN_SWAMP_FORTRESS = 'SUNKEN_SWAMP_FORTRESS',
  SKY_AERIE_PEAK = 'SKY_AERIE_PEAK',
  OBSIDIAN_DRAGON_VOLCANO = 'OBSIDIAN_DRAGON_VOLCANO',
}

export enum GameMode {
  CAMPAIGN = 'CAMPAIGN',
  FREE_FIGHT = 'FREE_FIGHT',
}

export enum ScreenRoute {
  MAIN_MENU = 'MAIN_MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  CAMPAIGN_LADDER = 'CAMPAIGN_LADDER',
  COMBAT = 'COMBAT',
  SETTINGS = 'SETTINGS',
}

export enum GraphicsQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum FighterAction {
  IDLE = 'IDLE',
  WALK_FORWARD = 'WALK_FORWARD',
  WALK_BACKWARD = 'WALK_BACKWARD',
  JUMP = 'JUMP',
  BLOCK = 'BLOCK',
  BLOCK_STUN = 'BLOCK_STUN',
  DODGE_BACK = 'DODGE_BACK',
  DODGE_FORWARD = 'DODGE_FORWARD',
  LIGHT_PUNCH = 'LIGHT_PUNCH',
  LIGHT_PUNCH_2 = 'LIGHT_PUNCH_2',
  HEAVY_PUNCH = 'HEAVY_PUNCH',
  LIGHT_KICK = 'LIGHT_KICK',
  HEAVY_KICK = 'HEAVY_KICK',
  THROW = 'THROW',
  COUNTER_STANCE = 'COUNTER_STANCE',
  COUNTER_STRIKE = 'COUNTER_STRIKE',
  SPECIAL_MOVE = 'SPECIAL_MOVE',
  // Dragon Boss & Playable Dragon Elemental Powers
  DRAGON_ELEMENTAL_STORM = 'DRAGON_ELEMENTAL_STORM',
  DRAGON_AERIAL_DIVE = 'DRAGON_AERIAL_DIVE',
  DRAGON_FIRE_BREATH = 'DRAGON_FIRE_BREATH',
  DRAGON_ULTIMATE_CATACLYSM = 'DRAGON_ULTIMATE_CATACLYSM',
  HIT_LIGHT = 'HIT_LIGHT',
  HIT_HEAVY = 'HIT_HEAVY',
  KNOCKDOWN = 'KNOCKDOWN',
  GET_UP = 'GET_UP',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  INTRO_POSE = 'INTRO_POSE',
}

export enum CombatInput {
  LIGHT_PUNCH = 'LIGHT_PUNCH',
  HEAVY_PUNCH = 'HEAVY_PUNCH',
  LIGHT_KICK = 'LIGHT_KICK',
  HEAVY_KICK = 'HEAVY_KICK',
  SPECIAL = 'SPECIAL',
  THROW = 'THROW',
  COUNTER = 'COUNTER',
  DODGE_BACK = 'DODGE_BACK',
  DODGE_FORWARD = 'DODGE_FORWARD',
  JUMP = 'JUMP',
  // Dragon specialized buttons/shortcuts when playing Dragon or triggered by AI
  DRAGON_FIRE = 'DRAGON_FIRE',
  DRAGON_AERIAL = 'DRAGON_AERIAL',
  DRAGON_ULTIMATE = 'DRAGON_ULTIMATE',
}

export enum MatchPhase {
  INTRO_FACEOFF = 'INTRO_FACEOFF',
  ROUND_ANNOUNCE = 'ROUND_ANNOUNCE',
  FIGHTING = 'FIGHTING',
  ROUND_OVER = 'ROUND_OVER',
  MATCH_VICTORY = 'MATCH_VICTORY',
  MATCH_DEFEAT = 'MATCH_DEFEAT',
  PAUSED = 'PAUSED',
}

export enum ParticleKind {
  HIT_SPARK = 'HIT_SPARK',
  HEAVY_IMPACT = 'HEAVY_IMPACT',
  BLOCK_SPARK = 'BLOCK_SPARK',
  DUST_PUFF = 'DUST_PUFF',
  ROYAL_GOLD_FLARE = 'ROYAL_GOLD_FLARE',
  SEISMIC_SHOCKWAVE = 'SEISMIC_SHOCKWAVE',
  CRIMSON_FOX_TRAIL = 'CRIMSON_FOX_TRAIL',
  VENOM_WATER_SPLASH = 'VENOM_WATER_SPLASH',
  STORM_FEATHER_GALE = 'STORM_FEATHER_GALE',
  DRAGON_HELLFIRE = 'DRAGON_HELLFIRE',
  DRAGON_LIGHTNING = 'DRAGON_LIGHTNING',
  ULTIMATE_NOVA = 'ULTIMATE_NOVA',
}

export interface FighterSpec {
  id: FighterId;
  name: string;
  shortName: string;
  epithet: string;
  fightingStyle: string;
  specialMoveName: string;
  ultimateName: string;
  accentHex: string;
  secondaryHex: string;
  homeArena: ArenaId;
  maxHealth: number;
  walkSpeed: number;
  jumpImpulse: number;
  bodyRadius: number;
  heightScale: number;
  stats: {
    power: number;
    speed: number;
    reach: number;
    defense: number;
  };
  bio: string;
  victoryQuote: string;
}

export interface AttackSpec {
  action: FighterAction;
  label: string;
  startup: number;
  active: number;
  recovery: number;
  reach: number;
  damage: number;
  chipDamage: number;
  meterGain: number;
  meterCost: number;
  knockback: number;
  forwardImpulse: number;
  upwardImpulse?: number;
  causesKnockdown?: boolean;
  isHeavy?: boolean;
  unblockable?: boolean;
  isProjectileOrBeam?: boolean;
  beamRange?: number;
  cooldownSec?: number;
  particleKind: ParticleKind;
}

export interface CampaignEncounter {
  encounterIndex: number; // 0 = Vanguard Guard, 1 = Stage Boss
  label: string;
  opponentId: FighterId;
  aiDifficulty: number; // 0.25 .. 1.0
  isBoss: boolean;
}

export interface CampaignStageSpec {
  stageNumber: number; // 1..6
  name: string;
  arenaId: ArenaId;
  locationSubtitle: string;
  description: string;
  bossId: FighterId;
  encounters: CampaignEncounter[];
}

export interface FighterRuntime {
  id: FighterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  health: number;
  maxHealth: number;
  specialMeter: number; // 0..100
  action: FighterAction;
  prevAction: FighterAction;
  stateTime: number;
  blendAlpha: number;
  hitRegistered: boolean;
  comboCount: number;
  comboTimer: number;
  comboDamage: number;
  hitFlashTimer: number;
  guardFlashTimer: number;
  // Cooldowns (especially for Dragon elemental powers & special moves)
  specialCooldown: number;
  fireBreathCooldown: number;
  aerialCooldown: number;
  ultimateCooldown: number;
  dodgeCooldown: number;
}

export interface ParticleSpawnEvent {
  id: number;
  kind: ParticleKind;
  x: number;
  y: number;
  z: number;
  dirX: number;
  count: number;
}

export interface CombatSnapshot {
  mode: GameMode;
  stageNumber: number;
  encounterIndex: number;
  totalEncountersInStage: number;
  arenaId: ArenaId;
  stageTitle: string;
  roundNumber: number;
  playerRoundsWon: number;
  opponentRoundsWon: number;
  roundTimer: number;
  phase: MatchPhase;
  bannerTitle: string;
  bannerSubtitle: string;
  resultReason: string;
  telegraphText: string;
  player: FighterRuntime;
  opponent: FighterRuntime;
  cameraShake: number;
  hitStopActive: boolean;
}

export interface TouchControlLayout {
  buttonScale: number; // 0.8 .. 1.35
  dpadOffsetX: number; // px from left (24..140)
  dpadOffsetY: number; // px from bottom (20..120)
  buttonsOffsetX: number; // px from right (24..140)
  buttonsOffsetY: number; // px from bottom (20..120)
  opacity: number; // 0.55 .. 1.0
}

export interface GameSettings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  voiceVolume: number; // 0..1
  muted: boolean;
  vibrationEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  aiFreeFightDifficulty: number; // 0.35 (Normal), 0.65 (Hard), 0.92 (Tekken Master)
  touchControls: TouchControlLayout;
}

export interface SaveProgress {
  version: number;
  unlockedStage: number; // 1..6 (starts at 1; unlocks progressively upon stage boss victory)
  completedStages: number[];
  stageBestTimeSec: Record<number, number>;
  totalWins: number;
  totalMatches: number;
  lastSelectedFighter: FighterId;
  lastFreeFightOpponent: FighterId;
  lastFreeFightArena: ArenaId;
}
