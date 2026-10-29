import {
  ArenaId,
  AttackSpec,
  CombatInput,
  CombatSnapshot,
  FighterAction,
  FighterId,
  FighterRuntime,
  GameMode,
  MatchPhase,
  ParticleKind,
  ParticleSpawnEvent,
} from '../types/game';
import { CAMPAIGN_STAGES, FIGHTER_ROSTER, getAttackTable } from '../data/fightersAndStages';
import { BgmMode, SoundCue, soundEngine } from '../services/soundEngine';

const ARENA_BOUND_X = 6.6;
const GRAVITY = -25.0;
const ROUND_TIME_SEC = 60;

export interface MatchStartConfig {
  mode: GameMode;
  playerFighterId: FighterId;
  opponentFighterId: FighterId;
  arenaId: ArenaId;
  stageNumber: number;
  encounterIndex: number;
  totalEncountersInStage: number;
  stageTitle: string;
  aiDifficulty: number;
}

export class CombatEngine {
  private snapshot: CombatSnapshot;
  private config: MatchStartConfig;
  private playerAttackTable: Record<string, AttackSpec>;
  private opponentAttackTable: Record<string, AttackSpec>;

  // Continuous inputs
  public playerMoveDir = 0; // -1 left, 0 neutral, +1 right
  public playerHoldingBlock = false;

  // Input buffer for responsive arcade feel
  private bufferedInput: CombatInput | null = null;
  private bufferedInputTimer = 0;

  // Timing & feel
  private phaseTimer = 0;
  private roundClockAccum = 0;
  private hitStopTimer = 0;
  private prePausePhase: MatchPhase = MatchPhase.FIGHTING;
  private prePauseBanner = '';

  // Particle queue for Three.js viewport
  private nextParticleId = 1;
  private pendingParticles: ParticleSpawnEvent[] = [];

  // AI brain state
  private aiDecisionTimer = 0.25;
  private aiMoveIntent = 0;
  private aiBlockTimer = 0;
  private aiComboFollowup: CombatInput | null = null;

  // Callback on match end
  private onMatchCompleted?: (playerWon: boolean, config: MatchStartConfig, elapsedSec: number) => void;
  private totalMatchFightTime = 0;

  constructor(
    initialConfig: MatchStartConfig,
    onMatchCompleted?: (playerWon: boolean, config: MatchStartConfig, elapsedSec: number) => void
  ) {
    this.config = initialConfig;
    this.onMatchCompleted = onMatchCompleted;
    this.playerAttackTable = getAttackTable(initialConfig.playerFighterId);
    this.opponentAttackTable = getAttackTable(initialConfig.opponentFighterId);
    this.snapshot = this.buildInitialSnapshot(initialConfig);
  }

  public startMatch(config: MatchStartConfig): void {
    this.config = config;
    this.playerAttackTable = getAttackTable(config.playerFighterId);
    this.opponentAttackTable = getAttackTable(config.opponentFighterId);
    this.phaseTimer = 0;
    this.roundClockAccum = 0;
    this.hitStopTimer = 0;
    this.totalMatchFightTime = 0;
    this.bufferedInput = null;
    this.aiComboFollowup = null;
    this.aiDecisionTimer = 0.35;

    this.snapshot = this.buildInitialSnapshot(config);

    soundEngine.setBgmMode(
      config.opponentFighterId === FighterId.DRAGON_BOSS ? BgmMode.DRAGON_BOSS : BgmMode.ARENA
    );
    soundEngine.playFighterRoar(config.opponentFighterId, true);
    const pName = FIGHTER_ROSTER[config.playerFighterId].shortName;
    const oName = FIGHTER_ROSTER[config.opponentFighterId].shortName;
    soundEngine.speakAnnouncerLine(`${pName} versus ${oName}. Round 1.`, 0.84, 1.04);
  }

  private createFighterRuntime(id: FighterId, x: number, facing: 1 | -1): FighterRuntime {
    const spec = FIGHTER_ROSTER[id];
    return {
      id,
      x,
      y: 0,
      vx: 0,
      vy: 0,
      facing,
      health: spec.maxHealth,
      maxHealth: spec.maxHealth,
      specialMeter: 35,
      action: FighterAction.INTRO_POSE,
      prevAction: FighterAction.IDLE,
      stateTime: 0,
      blendAlpha: 1,
      hitRegistered: false,
      comboCount: 0,
      comboTimer: 0,
      comboDamage: 0,
      hitFlashTimer: 0,
      guardFlashTimer: 0,
      specialCooldown: 0,
      fireBreathCooldown: 0,
      aerialCooldown: 0,
      ultimateCooldown: 0,
      dodgeCooldown: 0,
    };
  }

  private buildInitialSnapshot(config: MatchStartConfig): CombatSnapshot {
    const pSpec = FIGHTER_ROSTER[config.playerFighterId];
    const oSpec = FIGHTER_ROSTER[config.opponentFighterId];
    return {
      mode: config.mode,
      stageNumber: config.stageNumber,
      encounterIndex: config.encounterIndex,
      totalEncountersInStage: config.totalEncountersInStage,
      arenaId: config.arenaId,
      stageTitle: config.stageTitle,
      roundNumber: 1,
      playerRoundsWon: 0,
      opponentRoundsWon: 0,
      roundTimer: ROUND_TIME_SEC,
      phase: MatchPhase.INTRO_FACEOFF,
      bannerTitle: `${pSpec.shortName} VS ${oSpec.shortName}`,
      bannerSubtitle: config.stageTitle,
      resultReason: '',
      telegraphText: '',
      player: this.createFighterRuntime(config.playerFighterId, -2.15, 1),
      opponent: this.createFighterRuntime(config.opponentFighterId, 2.15, -1),
      cameraShake: 0,
      hitStopActive: false,
    };
  }

  public getSnapshot(): CombatSnapshot {
    return this.snapshot;
  }

  public getConfig(): MatchStartConfig {
    return this.config;
  }

  public drainParticles(): ParticleSpawnEvent[] {
    if (this.pendingParticles.length === 0) return [];
    const out = this.pendingParticles.slice();
    this.pendingParticles.length = 0;
    return out;
  }

  private emitParticles(
    kind: ParticleKind,
    x: number,
    y: number,
    z: number,
    dirX: number,
    count: number
  ): void {
    this.pendingParticles.push({
      id: this.nextParticleId++,
      kind,
      x,
      y,
      z,
      dirX,
      count,
    });
  }

  public queuePlayerInput(input: CombatInput): void {
    if (
      this.snapshot.phase !== MatchPhase.FIGHTING &&
      this.snapshot.phase !== MatchPhase.ROUND_ANNOUNCE
    ) {
      return;
    }
    this.bufferedInput = input;
    this.bufferedInputTimer = 0.26;
  }

  public setPaused(paused: boolean): void {
    const p = this.snapshot.phase;
    if (
      paused &&
      (p === MatchPhase.FIGHTING ||
        p === MatchPhase.INTRO_FACEOFF ||
        p === MatchPhase.ROUND_ANNOUNCE)
    ) {
      this.prePausePhase = p;
      this.prePauseBanner = this.snapshot.bannerTitle;
      this.snapshot = {
        ...this.snapshot,
        phase: MatchPhase.PAUSED,
        bannerTitle: 'PAUSED',
      };
    } else if (!paused && p === MatchPhase.PAUSED) {
      this.snapshot = {
        ...this.snapshot,
        phase: this.prePausePhase,
        bannerTitle: this.prePauseBanner,
      };
    }
  }

  public step(rawDt: number): CombatSnapshot {
    const dt = Math.min(rawDt, 0.05);
    const s = this.snapshot;
    if (s.phase === MatchPhase.PAUSED) return s;

    // Decay camera shake
    s.cameraShake = Math.max(0, s.cameraShake - dt * 2.8);

    // Hitstop freeze for heavy arcade impact
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      s.hitStopActive = this.hitStopTimer > 0;
      return s;
    }
    s.hitStopActive = false;

    this.phaseTimer += dt;

    if (s.phase === MatchPhase.INTRO_FACEOFF) {
      this.advanceFighterTimersOnly(s.player, dt);
      this.advanceFighterTimersOnly(s.opponent, dt);
      if (this.phaseTimer >= 1.65) {
        this.phaseTimer = 0;
        s.phase = MatchPhase.ROUND_ANNOUNCE;
        s.bannerTitle = `ROUND ${s.roundNumber}`;
        s.bannerSubtitle = 'READY';
        this.setAction(s.player, FighterAction.IDLE);
        this.setAction(s.opponent, FighterAction.IDLE);
        soundEngine.playCue(SoundCue.ROUND_START);
      }
      return s;
    }

    if (s.phase === MatchPhase.ROUND_ANNOUNCE) {
      this.advanceFighterTimersOnly(s.player, dt);
      this.advanceFighterTimersOnly(s.opponent, dt);
      if (this.phaseTimer >= 0.65 && s.bannerTitle !== 'FIGHT!') {
        s.bannerTitle = 'FIGHT!';
        s.bannerSubtitle = '';
        soundEngine.speakAnnouncerLine('Fight!', 0.92, 1.15);
      }
      if (this.phaseTimer >= 1.15) {
        this.phaseTimer = 0;
        s.phase = MatchPhase.FIGHTING;
        s.bannerTitle = '';
        s.bannerSubtitle = '';
      }
      return s;
    }

    if (s.phase === MatchPhase.ROUND_OVER) {
      this.advanceFighterPhysicsAndState(s.player, this.playerAttackTable, dt);
      this.advanceFighterPhysicsAndState(s.opponent, this.opponentAttackTable, dt);
      if (this.phaseTimer >= 2.2) {
        if (s.playerRoundsWon >= 2) {
          s.phase = MatchPhase.MATCH_VICTORY;
          s.bannerTitle = 'VICTORY';
          s.bannerSubtitle = FIGHTER_ROSTER[s.player.id].victoryQuote;
          this.setAction(s.player, FighterAction.VICTORY);
          soundEngine.playCue(SoundCue.VICTORY_CHORD);
          soundEngine.playVictoryVoice(s.player.id);
          this.onMatchCompleted?.(true, this.config, this.totalMatchFightTime);
        } else if (s.opponentRoundsWon >= 2) {
          s.phase = MatchPhase.MATCH_DEFEAT;
          s.bannerTitle = 'DEFEAT';
          s.bannerSubtitle = `${FIGHTER_ROSTER[s.opponent.id].shortName} CLAIMS VICTORY`;
          this.setAction(s.opponent, FighterAction.VICTORY);
          soundEngine.playVictoryVoice(s.opponent.id);
          this.onMatchCompleted?.(false, this.config, this.totalMatchFightTime);
        } else {
          this.startNextRound();
        }
      }
      return s;
    }

    if (s.phase === MatchPhase.MATCH_VICTORY || s.phase === MatchPhase.MATCH_DEFEAT) {
      this.advanceFighterTimersOnly(s.player, dt);
      this.advanceFighterTimersOnly(s.opponent, dt);
      return s;
    }

    // === ACTIVE FIGHTING SIMULATION ===
    this.totalMatchFightTime += dt;

    // Update facing so fighters always face each other when not locked in mid-attack
    this.updateFighterFacing(s.player, s.opponent);

    // Buffered player input
    if (this.bufferedInputTimer > 0) {
      this.bufferedInputTimer = Math.max(0, this.bufferedInputTimer - dt);
      if (this.bufferedInputTimer === 0) {
        this.bufferedInput = null;
      }
    }

    this.processPlayerControls(s.player, this.playerAttackTable);
    this.processOpponentAI(s.opponent, s.player, this.opponentAttackTable, dt);

    this.advanceFighterPhysicsAndState(s.player, this.playerAttackTable, dt);
    this.advanceFighterPhysicsAndState(s.opponent, this.opponentAttackTable, dt);

    // Resolve pushbox collision so bodies never overlap or walk through one another
    this.resolveBodyPushbox(s.player, s.opponent);

    // Active attack hit detection
    this.evaluateHitbox(s.player, s.opponent, this.playerAttackTable);
    this.evaluateHitbox(s.opponent, s.player, this.opponentAttackTable);

    // Update Dragon / Boss windup telegraph indicator
    s.telegraphText = this.computeTelegraphBanner(s.opponent);

    // Check KO
    if (s.player.health <= 0 || s.opponent.health <= 0) {
      this.resolveRoundEnd(false);
      return s;
    }

    // Round Clock
    this.roundClockAccum += dt;
    if (this.roundClockAccum >= 1.0) {
      this.roundClockAccum -= 1.0;
      s.roundTimer = Math.max(0, s.roundTimer - 1);
      if (s.roundTimer === 0) {
        this.resolveRoundEnd(true);
      }
    }

    return s;
  }

  private startNextRound(): void {
    const s = this.snapshot;
    s.roundNumber += 1;
    s.roundTimer = ROUND_TIME_SEC;
    this.phaseTimer = 0;
    this.roundClockAccum = 0;

    const pMeter = Math.min(100, s.player.specialMeter + 15);
    const oMeter = Math.min(100, s.opponent.specialMeter + 15);

    s.player = this.createFighterRuntime(s.player.id, -2.15, 1);
    s.player.specialMeter = pMeter;
    s.player.action = FighterAction.IDLE;

    s.opponent = this.createFighterRuntime(s.opponent.id, 2.15, -1);
    s.opponent.specialMeter = oMeter;
    s.opponent.action = FighterAction.IDLE;

    s.phase = MatchPhase.ROUND_ANNOUNCE;
    s.bannerTitle = `ROUND ${s.roundNumber}`;
    s.bannerSubtitle = 'READY';
    s.resultReason = '';
    s.telegraphText = '';

    soundEngine.playCue(SoundCue.ROUND_START);
    soundEngine.speakAnnouncerLine(`Round ${s.roundNumber}`, 0.85, 1.05);
  }

  private resolveRoundEnd(isTimeout: boolean): void {
    const s = this.snapshot;
    s.phase = MatchPhase.ROUND_OVER;
    this.phaseTimer = 0;
    s.telegraphText = '';
    soundEngine.playCue(SoundCue.KO_GONG);

    const pPct = s.player.health / s.player.maxHealth;
    const oPct = s.opponent.health / s.opponent.maxHealth;

    if (!isTimeout) {
      if (s.player.health <= 0 && s.opponent.health <= 0) {
        // Double KO
        s.bannerTitle = 'DOUBLE K.O.';
        s.resultReason = 'DOUBLE KNOCKOUT';
        if (s.playerRoundsWon < 1) s.playerRoundsWon++;
        if (s.opponentRoundsWon < 1) s.opponentRoundsWon++;
        this.setAction(s.player, FighterAction.KNOCKDOWN);
        this.setAction(s.opponent, FighterAction.KNOCKDOWN);
        soundEngine.speakAnnouncerLine('Double Knockout!', 0.82, 1.0);
      } else if (s.opponent.health <= 0) {
        s.playerRoundsWon += 1;
        const isPerfect = s.player.health >= s.player.maxHealth * 0.99;
        s.bannerTitle = isPerfect ? 'PERFECT K.O.!' : 'K.O.!';
        s.resultReason = isPerfect ? 'FLAWLESS ROUND' : 'KNOCKOUT';
        this.setAction(s.opponent, FighterAction.DEFEAT);
        this.setAction(s.player, FighterAction.VICTORY);
        soundEngine.speakAnnouncerLine(isPerfect ? 'Perfect! K. O.!' : 'K. O.!', 0.86, 1.04);
      } else {
        s.opponentRoundsWon += 1;
        s.bannerTitle = 'K.O.!';
        s.resultReason = 'KNOCKOUT';
        this.setAction(s.player, FighterAction.DEFEAT);
        this.setAction(s.opponent, FighterAction.VICTORY);
        soundEngine.speakAnnouncerLine('K. O.!', 0.78, 1.0);
      }
    } else {
      // Timeout decision
      if (Math.abs(pPct - oPct) < 0.015) {
        s.bannerTitle = 'TIME OVER · DRAW';
        s.resultReason = 'DRAW ROUND';
        soundEngine.speakAnnouncerLine('Time Over. Draw game.', 0.82, 1.0);
      } else if (pPct > oPct) {
        s.playerRoundsWon += 1;
        s.bannerTitle = 'TIME OVER';
        s.resultReason = `${FIGHTER_ROSTER[s.player.id].shortName} LEADS ON VITALITY`;
        this.setAction(s.player, FighterAction.VICTORY);
        soundEngine.speakAnnouncerLine('Time Over!', 0.85, 1.02);
      } else {
        s.opponentRoundsWon += 1;
        s.bannerTitle = 'TIME OVER';
        s.resultReason = `${FIGHTER_ROSTER[s.opponent.id].shortName} LEADS ON VITALITY`;
        this.setAction(s.opponent, FighterAction.VICTORY);
        soundEngine.speakAnnouncerLine('Time Over!', 0.8, 1.0);
      }
    }
  }

  private setAction(f: FighterRuntime, next: FighterAction): void {
    if (f.action === next) return;
    f.prevAction = f.action;
    f.action = next;
    f.stateTime = 0;
    f.blendAlpha = 0;
    f.hitRegistered = false;
  }

  private isIncapacitated(a: FighterAction): boolean {
    return (
      a === FighterAction.HIT_LIGHT ||
      a === FighterAction.HIT_HEAVY ||
      a === FighterAction.KNOCKDOWN ||
      a === FighterAction.GET_UP ||
      a === FighterAction.DEFEAT
    );
  }

  private isAttacking(a: FighterAction, table: Record<string, AttackSpec>): boolean {
    return Boolean(table[a]);
  }

  private canActFreely(f: FighterRuntime, table: Record<string, AttackSpec>): boolean {
    if (this.isIncapacitated(f.action)) return false;
    if (
      f.action === FighterAction.DODGE_BACK ||
      f.action === FighterAction.DODGE_FORWARD ||
      f.action === FighterAction.COUNTER_STANCE ||
      f.action === FighterAction.BLOCK_STUN
    ) {
      return false;
    }
    if (this.isAttacking(f.action, table)) return false;
    return true;
  }

  private updateFighterFacing(a: FighterRuntime, b: FighterRuntime): void {
    if (this.canActFreely(a, this.playerAttackTable) && a.y <= 0.05) {
      a.facing = b.x >= a.x ? 1 : -1;
    }
    if (this.canActFreely(b, this.opponentAttackTable) && b.y <= 0.05) {
      b.facing = a.x >= b.x ? 1 : -1;
    }
  }

  private processPlayerControls(
    p: FighterRuntime,
    table: Record<string, AttackSpec>
  ): void {
    // Allow 1-2-3 Tekken combo cancel window from Light Punch -> Light Punch 2 -> Heavy Punch / Heavy Kick / Special
    if (this.bufferedInput) {
      const consumed = this.tryExecuteInput(p, this.bufferedInput, table);
      if (consumed) {
        this.bufferedInput = null;
        this.bufferedInputTimer = 0;
        return;
      }
    }

    if (!this.canActFreely(p, table)) return;

    if (p.y > 0.02) {
      // Airborne movement control
      const spec = FIGHTER_ROSTER[p.id];
      p.vx = this.playerMoveDir * spec.walkSpeed * 0.85;
      return;
    }

    // Grounded continuous block or walk
    if (this.playerHoldingBlock) {
      p.vx = 0;
      this.setAction(p, FighterAction.BLOCK);
      return;
    }

    if (this.playerMoveDir !== 0) {
      const spec = FIGHTER_ROSTER[p.id];
      const movingForward = Math.sign(this.playerMoveDir) === p.facing;
      p.vx = this.playerMoveDir * spec.walkSpeed * (movingForward ? 1.0 : 0.82);
      this.setAction(p, movingForward ? FighterAction.WALK_FORWARD : FighterAction.WALK_BACKWARD);
    } else {
      p.vx = 0;
      this.setAction(p, FighterAction.IDLE);
    }
  }

  private tryExecuteInput(
    f: FighterRuntime,
    input: CombatInput,
    table: Record<string, AttackSpec>
  ): boolean {
    // Combo chain cancel check
    const inComboCancelWindow =
      f.hitRegistered &&
      ((f.action === FighterAction.LIGHT_PUNCH && f.stateTime >= 0.14) ||
        (f.action === FighterAction.LIGHT_PUNCH_2 && f.stateTime >= 0.14) ||
        (f.action === FighterAction.LIGHT_KICK && f.stateTime >= 0.16));

    const free = this.canActFreely(f, table);
    if (!free && !inComboCancelWindow) return false;

    const spec = FIGHTER_ROSTER[f.id];

    if (input === CombatInput.JUMP) {
      if (f.y > 0.02 || !free) return false;
      f.vy = spec.jumpImpulse;
      this.setAction(f, FighterAction.JUMP);
      soundEngine.playCue(SoundCue.JUMP_WHOOSH);
      this.emitParticles(ParticleKind.DUST_PUFF, f.x, 0.05, 0, -f.facing, 8);
      return true;
    }

    if (input === CombatInput.DODGE_BACK || input === CombatInput.DODGE_FORWARD) {
      if (f.dodgeCooldown > 0 || f.y > 0.05) return false;
      f.dodgeCooldown = 0.65;
      const dir = input === CombatInput.DODGE_FORWARD ? f.facing : -f.facing;
      f.vx = dir * (spec.walkSpeed * 2.15);
      this.setAction(
        f,
        input === CombatInput.DODGE_FORWARD ? FighterAction.DODGE_FORWARD : FighterAction.DODGE_BACK
      );
      soundEngine.playCue(SoundCue.DODGE_SWISH);
      this.emitParticles(ParticleKind.DUST_PUFF, f.x, 0.05, 0, -dir, 10);
      return true;
    }

    if (input === CombatInput.COUNTER) {
      if (!free || f.y > 0.05) return false;
      f.vx = 0;
      this.setAction(f, FighterAction.COUNTER_STANCE);
      soundEngine.playCue(SoundCue.DODGE_SWISH);
      return true;
    }

    // Map combat button to FighterAction
    let targetAction: FighterAction | null = null;

    if (input === CombatInput.LIGHT_PUNCH) {
      targetAction =
        f.action === FighterAction.LIGHT_PUNCH
          ? FighterAction.LIGHT_PUNCH_2
          : f.action === FighterAction.LIGHT_PUNCH_2
          ? FighterAction.HEAVY_PUNCH
          : FighterAction.LIGHT_PUNCH;
    } else if (input === CombatInput.HEAVY_PUNCH) {
      targetAction = FighterAction.HEAVY_PUNCH;
    } else if (input === CombatInput.LIGHT_KICK) {
      targetAction =
        f.action === FighterAction.LIGHT_KICK ? FighterAction.HEAVY_KICK : FighterAction.LIGHT_KICK;
    } else if (input === CombatInput.HEAVY_KICK) {
      targetAction = FighterAction.HEAVY_KICK;
    } else if (input === CombatInput.THROW) {
      targetAction = FighterAction.THROW;
    } else if (input === CombatInput.SPECIAL) {
      if (f.id === FighterId.DRAGON_BOSS) {
        if (f.specialMeter >= 100 && f.ultimateCooldown <= 0) {
          targetAction = FighterAction.DRAGON_ULTIMATE_CATACLYSM;
        } else if (f.specialMeter >= 35 && f.specialCooldown <= 0) {
          targetAction = FighterAction.DRAGON_ELEMENTAL_STORM;
        }
      } else if (f.specialMeter >= 50 && f.specialCooldown <= 0) {
        targetAction = FighterAction.SPECIAL_MOVE;
      }
    } else if (input === CombatInput.DRAGON_FIRE && f.id === FighterId.DRAGON_BOSS) {
      if (f.specialMeter >= 30 && f.fireBreathCooldown <= 0) {
        targetAction = FighterAction.DRAGON_FIRE_BREATH;
      }
    } else if (input === CombatInput.DRAGON_AERIAL && f.id === FighterId.DRAGON_BOSS) {
      if (f.specialMeter >= 25 && f.aerialCooldown <= 0) {
        targetAction = FighterAction.DRAGON_AERIAL_DIVE;
      }
    } else if (input === CombatInput.DRAGON_ULTIMATE && f.id === FighterId.DRAGON_BOSS) {
      if (f.specialMeter >= 100 && f.ultimateCooldown <= 0) {
        targetAction = FighterAction.DRAGON_ULTIMATE_CATACLYSM;
      }
    }

    if (!targetAction) return false;
    const atk = table[targetAction];
    if (!atk) return false;
    if (f.specialMeter < atk.meterCost) return false;

    // Deduct meter & trigger cooldowns
    f.specialMeter = Math.max(0, f.specialMeter - atk.meterCost);
    if (targetAction === FighterAction.SPECIAL_MOVE || targetAction === FighterAction.DRAGON_ELEMENTAL_STORM) {
      f.specialCooldown = atk.cooldownSec ?? 2.5;
      soundEngine.playCue(
        targetAction === FighterAction.DRAGON_ELEMENTAL_STORM
          ? SoundCue.DRAGON_LIGHTNING
          : SoundCue.SPECIAL_FLASH
      );
      soundEngine.playFighterRoar(f.id, true);
    } else if (targetAction === FighterAction.DRAGON_FIRE_BREATH) {
      f.fireBreathCooldown = atk.cooldownSec ?? 5.0;
      soundEngine.playCue(SoundCue.DRAGON_FIRE_BREATH);
      soundEngine.playFighterRoar(f.id, true);
    } else if (targetAction === FighterAction.DRAGON_AERIAL_DIVE) {
      f.aerialCooldown = atk.cooldownSec ?? 4.2;
      f.vy = atk.upwardImpulse ?? 5.5;
      soundEngine.playCue(SoundCue.SPECIAL_FLASH);
      soundEngine.playFighterRoar(f.id, true);
    } else if (targetAction === FighterAction.DRAGON_ULTIMATE_CATACLYSM) {
      f.ultimateCooldown = atk.cooldownSec ?? 9.0;
      soundEngine.playCue(SoundCue.ULTIMATE_BLAST);
      soundEngine.playFighterRoar(f.id, true);
    } else if (atk.isHeavy) {
      soundEngine.playFighterRoar(f.id, false);
    }

    f.vx = f.facing * atk.forwardImpulse;
    this.setAction(f, targetAction);
    return true;
  }

  private processOpponentAI(
    ai: FighterRuntime,
    player: FighterRuntime,
    table: Record<string, AttackSpec>,
    dt: number
  ): void {
    const diff = this.config.aiDifficulty; // 0.30 .. 0.96
    if (diff <= 0) return;
    const dist = Math.abs(player.x - ai.x);

    // Execute queued AI combo followup if hit connected
    if (this.aiComboFollowup && ai.hitRegistered && ai.stateTime >= 0.15) {
      const next = this.aiComboFollowup;
      this.aiComboFollowup = null;
      this.tryExecuteInput(ai, next, table);
      return;
    }

    if (this.aiBlockTimer > 0) {
      this.aiBlockTimer = Math.max(0, this.aiBlockTimer - dt);
      if (this.canActFreely(ai, table) && ai.y <= 0.02) {
        ai.vx = 0;
        this.setAction(ai, FighterAction.BLOCK);
        return;
      }
    }

    this.aiDecisionTimer -= dt;
    if (this.aiDecisionTimer <= 0) {
      // Higher difficulty reacts faster
      this.aiDecisionTimer = 0.42 - diff * 0.26 + Math.random() * 0.14;

      const playerAttacking = this.isAttacking(player.action, this.playerAttackTable);

      // Defensive reaction to incoming player attack
      if (playerAttacking && dist < 2.6 && Math.random() < 0.25 + diff * 0.52) {
        const defRoll = Math.random();
        if (defRoll < 0.62) {
          this.aiBlockTimer = 0.35 + diff * 0.25;
          return;
        } else if (defRoll < 0.85) {
          this.tryExecuteInput(ai, CombatInput.DODGE_BACK, table);
          return;
        } else if (diff > 0.55) {
          this.tryExecuteInput(ai, CombatInput.COUNTER, table);
          return;
        }
      }

      // Dragon Final Boss specialized tactical AI
      if (ai.id === FighterId.DRAGON_BOSS) {
        if (ai.specialMeter >= 100 && ai.ultimateCooldown <= 0 && dist < 4.8 && Math.random() < 0.65) {
          this.tryExecuteInput(ai, CombatInput.DRAGON_ULTIMATE, table);
          return;
        }
        if (dist > 2.4 && dist < 4.7 && ai.specialMeter >= 30 && ai.fireBreathCooldown <= 0 && Math.random() < 0.55) {
          this.tryExecuteInput(ai, CombatInput.DRAGON_FIRE, table);
          return;
        }
        if (dist > 2.2 && ai.specialMeter >= 25 && ai.aerialCooldown <= 0 && Math.random() < 0.5) {
          this.tryExecuteInput(ai, CombatInput.DRAGON_AERIAL, table);
          return;
        }
        if (dist < 2.7 && ai.specialMeter >= 35 && ai.specialCooldown <= 0 && Math.random() < 0.45) {
          this.tryExecuteInput(ai, CombatInput.SPECIAL, table);
          return;
        }
      }

      // Standard Fighter Special Move Usage
      if (
        ai.id !== FighterId.DRAGON_BOSS &&
        ai.specialMeter >= 50 &&
        ai.specialCooldown <= 0 &&
        dist < 2.5 &&
        Math.random() < 0.22 + diff * 0.45
      ) {
        this.tryExecuteInput(ai, CombatInput.SPECIAL, table);
        return;
      }

      // Close/Mid-range Offense
      if (dist <= 2.15) {
        const roll = Math.random();
        if (player.action === FighterAction.BLOCK && dist < 1.45 && roll < 0.25 + diff * 0.35) {
          // Guard break throw against turtling player
          this.tryExecuteInput(ai, CombatInput.THROW, table);
          return;
        }
        if (roll < 0.36) {
          if (this.tryExecuteInput(ai, CombatInput.LIGHT_PUNCH, table) && Math.random() < diff) {
            this.aiComboFollowup = CombatInput.LIGHT_PUNCH;
          }
          return;
        } else if (roll < 0.62) {
          if (this.tryExecuteInput(ai, CombatInput.LIGHT_KICK, table) && Math.random() < diff * 0.85) {
            this.aiComboFollowup = CombatInput.HEAVY_KICK;
          }
          return;
        } else if (roll < 0.82) {
          this.tryExecuteInput(ai, CombatInput.HEAVY_PUNCH, table);
          return;
        } else {
          this.tryExecuteInput(ai, CombatInput.HEAVY_KICK, table);
          return;
        }
      }

      // Footsies & Spacing when out of range
      if (dist > 2.15) {
        if (dist > 3.4 && Math.random() < 0.25 + diff * 0.3) {
          this.tryExecuteInput(ai, CombatInput.DODGE_FORWARD, table);
          return;
        }
        this.aiMoveIntent = ai.facing; // Advance toward player
      } else {
        this.aiMoveIntent = Math.random() < 0.25 ? -ai.facing : 0;
      }
    }

    if (this.canActFreely(ai, table) && ai.y <= 0.02) {
      const spec = FIGHTER_ROSTER[ai.id];
      if (dist > 1.85 && this.aiMoveIntent !== 0) {
        const forward = Math.sign(this.aiMoveIntent) === ai.facing;
        ai.vx = this.aiMoveIntent * spec.walkSpeed * (forward ? 0.95 : 0.78);
        this.setAction(ai, forward ? FighterAction.WALK_FORWARD : FighterAction.WALK_BACKWARD);
      } else {
        ai.vx = 0;
        this.setAction(ai, FighterAction.IDLE);
      }
    }
  }

  private advanceFighterTimersOnly(f: FighterRuntime, dt: number): void {
    f.stateTime += dt;
    f.blendAlpha = Math.min(1, f.blendAlpha + dt * 9.0);
    f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
    f.guardFlashTimer = Math.max(0, f.guardFlashTimer - dt);
  }

  private advanceFighterPhysicsAndState(
    f: FighterRuntime,
    table: Record<string, AttackSpec>,
    dt: number
  ): void {
    this.advanceFighterTimersOnly(f, dt);

    // Cooldowns
    f.specialCooldown = Math.max(0, f.specialCooldown - dt);
    f.fireBreathCooldown = Math.max(0, f.fireBreathCooldown - dt);
    f.aerialCooldown = Math.max(0, f.aerialCooldown - dt);
    f.ultimateCooldown = Math.max(0, f.ultimateCooldown - dt);
    f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt);

    if (f.comboTimer > 0) {
      f.comboTimer = Math.max(0, f.comboTimer - dt);
      if (f.comboTimer === 0) {
        f.comboCount = 0;
        f.comboDamage = 0;
      }
    }

    // Horizontal damping during attacks/hits
    if (
      f.action !== FighterAction.WALK_FORWARD &&
      f.action !== FighterAction.WALK_BACKWARD &&
      f.y <= 0.02
    ) {
      f.vx *= Math.pow(0.008, dt);
    }

    f.x += f.vx * dt;
    f.x = Math.max(-ARENA_BOUND_X, Math.min(ARENA_BOUND_X, f.x));

    // Vertical gravity & landing
    if (f.y > 0 || f.vy !== 0) {
      f.vy += GRAVITY * dt;
      f.y += f.vy * dt;
      if (f.y <= 0) {
        f.y = 0;
        f.vy = 0;
        if (f.action === FighterAction.JUMP) {
          this.setAction(f, FighterAction.IDLE);
          this.emitParticles(ParticleKind.DUST_PUFF, f.x, 0.04, 0, 0, 8);
        }
      }
    }

    // Continuous Dragon Fire Breath / Ultimate particle stream during active frames
    const atk = table[f.action];
    if (atk) {
      if (
        (f.action === FighterAction.DRAGON_FIRE_BREATH ||
          f.action === FighterAction.DRAGON_ULTIMATE_CATACLYSM) &&
        f.stateTime >= atk.startup &&
        f.stateTime <= atk.startup + atk.active
      ) {
        this.emitParticles(
          atk.particleKind,
          f.x + f.facing * 0.9,
          1.45,
          0,
          f.facing,
          3
        );
      }

      const total = atk.startup + atk.active + atk.recovery;
      if (f.stateTime >= total) {
        this.setAction(f, FighterAction.IDLE);
      }
      return;
    }

    // Timed non-attack state recoveries
    if (
      (f.action === FighterAction.DODGE_BACK || f.action === FighterAction.DODGE_FORWARD) &&
      f.stateTime >= 0.28
    ) {
      this.setAction(f, FighterAction.IDLE);
    } else if (f.action === FighterAction.COUNTER_STANCE && f.stateTime >= 0.42) {
      this.setAction(f, FighterAction.IDLE);
    } else if (f.action === FighterAction.BLOCK_STUN && f.stateTime >= 0.20) {
      this.setAction(f, FighterAction.BLOCK);
    } else if (f.action === FighterAction.HIT_LIGHT && f.stateTime >= 0.26) {
      this.setAction(f, FighterAction.IDLE);
    } else if (f.action === FighterAction.HIT_HEAVY && f.stateTime >= 0.40) {
      this.setAction(f, FighterAction.IDLE);
    } else if (f.action === FighterAction.KNOCKDOWN && f.stateTime >= 0.72) {
      this.setAction(f, FighterAction.GET_UP);
    } else if (f.action === FighterAction.GET_UP && f.stateTime >= 0.38) {
      this.setAction(f, FighterAction.IDLE);
    }
  }

  private resolveBodyPushbox(a: FighterRuntime, b: FighterRuntime): void {
    const rA = FIGHTER_ROSTER[a.id].bodyRadius;
    const rB = FIGHTER_ROSTER[b.id].bodyRadius;
    const minDist = rA + rB;
    const dx = b.x - a.x;
    const absDx = Math.abs(dx);
    if (absDx < minDist) {
      const push = (minDist - absDx) * 0.5;
      const sign = dx >= 0 ? 1 : -1;
      a.x = Math.max(-ARENA_BOUND_X, Math.min(ARENA_BOUND_X, a.x - sign * push));
      b.x = Math.max(-ARENA_BOUND_X, Math.min(ARENA_BOUND_X, b.x + sign * push));
    }
  }

  private evaluateHitbox(
    attacker: FighterRuntime,
    defender: FighterRuntime,
    table: Record<string, AttackSpec>
  ): void {
    if (attacker.hitRegistered) return;
    const atk = table[attacker.action];
    if (!atk) return;

    if (attacker.stateTime < atk.startup || attacker.stateTime > atk.startup + atk.active) {
      return;
    }

    // Invulnerable states (dodge i-frames, knockdown, wakeup)
    if (
      defender.action === FighterAction.DODGE_BACK ||
      defender.action === FighterAction.DODGE_FORWARD ||
      defender.action === FighterAction.KNOCKDOWN ||
      defender.action === FighterAction.GET_UP ||
      defender.action === FighterAction.DEFEAT
    ) {
      return;
    }

    // Directional range check
    const dx = defender.x - attacker.x;
    if (Math.sign(dx) !== 0 && Math.sign(dx) !== attacker.facing) {
      return;
    }

    const effectiveDist = Math.abs(dx) - FIGHTER_ROSTER[defender.id].bodyRadius * 0.55;
    if (effectiveDist > atk.reach) return;

    // Vertical check (jumping over low attacks unless projectile/aerial)
    if (defender.y > 0.95 && attacker.y < 0.3 && !atk.isProjectileOrBeam) {
      return;
    }

    attacker.hitRegistered = true;

    // Check Counter Reversal!
    if (defender.action === FighterAction.COUNTER_STANCE && !atk.unblockable) {
      defender.guardFlashTimer = 0.25;
      this.setAction(defender, FighterAction.COUNTER_STRIKE);
      soundEngine.playCue(SoundCue.SPECIAL_FLASH);
      soundEngine.playFighterRoar(defender.id, true);
      this.emitParticles(ParticleKind.ROYAL_GOLD_FLARE, defender.x, 1.25, 0.2, defender.facing, 18);
      return;
    }

    // Check Guard Block
    const isBlocking =
      (defender.action === FighterAction.BLOCK || defender.action === FighterAction.BLOCK_STUN) &&
      !atk.unblockable;

    const hitX = (attacker.x + defender.x) * 0.5;
    const hitY = 1.18;

    if (isBlocking) {
      const defScale = 88 / FIGHTER_ROSTER[defender.id].stats.defense;
      const chip = Math.max(2, Math.round(atk.chipDamage * defScale));
      defender.health = Math.max(1, defender.health - chip);
      defender.guardFlashTimer = 0.16;
      defender.vx = attacker.facing * atk.knockback * 2.4;
      defender.specialMeter = Math.min(100, defender.specialMeter + 6);
      attacker.specialMeter = Math.min(100, attacker.specialMeter + Math.round(atk.meterGain * 0.4));
      this.setAction(defender, FighterAction.BLOCK_STUN);
      this.hitStopTimer = 0.035;
      soundEngine.playCue(SoundCue.BLOCK_GUARD);
      this.emitParticles(ParticleKind.BLOCK_SPARK, hitX, hitY, 0.22, attacker.facing, 14);
      return;
    }

    // Clean Hit! Calculate defense-scaled & combo-scaled damage
    const defFactor = 88 / FIGHTER_ROSTER[defender.id].stats.defense;
    const comboScale = Math.max(0.55, 1 - attacker.comboCount * 0.09);
    const dmg = Math.max(8, Math.round(atk.damage * defFactor * comboScale));

    defender.health = Math.max(0, defender.health - dmg);
    defender.hitFlashTimer = 0.14;
    defender.vx = attacker.facing * atk.knockback * 4.2;

    attacker.comboCount += 1;
    attacker.comboDamage += dmg;
    attacker.comboTimer = 1.65;
    attacker.specialMeter = Math.min(100, attacker.specialMeter + atk.meterGain);
    defender.specialMeter = Math.min(100, defender.specialMeter + 10);

    if (atk.causesKnockdown) {
      this.setAction(defender, FighterAction.KNOCKDOWN);
      this.snapshot.cameraShake = Math.min(1.0, 0.55);
      this.hitStopTimer = 0.068;
      soundEngine.playCue(
        atk.action === FighterAction.THROW ? SoundCue.THROW_SLAM : SoundCue.HEAVY_HIT
      );
    } else if (atk.isHeavy) {
      this.setAction(defender, FighterAction.HIT_HEAVY);
      this.snapshot.cameraShake = Math.min(1.0, 0.36);
      this.hitStopTimer = 0.052;
      soundEngine.playCue(SoundCue.HEAVY_HIT);
    } else {
      this.setAction(defender, FighterAction.HIT_LIGHT);
      this.snapshot.cameraShake = Math.min(1.0, 0.14);
      this.hitStopTimer = 0.032;
      soundEngine.playCue(SoundCue.LIGHT_HIT);
    }

    this.emitParticles(
      atk.particleKind,
      hitX,
      hitY,
      0.24,
      attacker.facing,
      atk.isHeavy ? 22 : 12
    );
  }

  private computeTelegraphBanner(opp: FighterRuntime): string {
    const atk = this.opponentAttackTable[opp.action];
    if (!atk || opp.stateTime > atk.startup) return '';
    if (opp.action === FighterAction.DRAGON_FIRE_BREATH) {
      return 'HELLFIRE BREATH · BLOCK OR JUMP';
    }
    if (opp.action === FighterAction.DRAGON_AERIAL_DIVE) {
      return 'WINGED METEOR DIVE · DODGE BACK';
    }
    if (opp.action === FighterAction.DRAGON_ULTIMATE_CATACLYSM) {
      return 'UNBLOCKABLE CATACLYSM NOVA · EVADE NOW!';
    }
    if (opp.action === FighterAction.SPECIAL_MOVE || opp.action === FighterAction.DRAGON_ELEMENTAL_STORM) {
      return `${atk.label.toUpperCase()} INCOMING`;
    }
    return '';
  }
}

export function createCampaignMatchConfig(
  playerFighterId: FighterId,
  stageNumber: number,
  encounterIndex: number
): MatchStartConfig {
  const stage =
    CAMPAIGN_STAGES.find((s) => s.stageNumber === stageNumber) ?? CAMPAIGN_STAGES[0];
  const enc = stage.encounters[encounterIndex] ?? stage.encounters[0];

  // Ensure Vanguard doesn't duplicate player if avoidable, though mirror fights are valid in Tekken
  return {
    mode: GameMode.CAMPAIGN,
    playerFighterId,
    opponentFighterId: enc.opponentId,
    arenaId: stage.arenaId,
    stageNumber: stage.stageNumber,
    encounterIndex: enc.encounterIndex,
    totalEncountersInStage: stage.encounters.length,
    stageTitle: `${stage.name} · ${enc.label.toUpperCase()}`,
    aiDifficulty: enc.aiDifficulty,
  };
}
