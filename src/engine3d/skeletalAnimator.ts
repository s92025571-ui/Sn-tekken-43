import * as THREE from 'three';
import { FighterAction, FighterId, FighterRuntime } from '../types/game';
import { ArticulatedFighterRig } from './characterFactory';

export interface JointPose {
  rootOffsetY: number;
  pelvisPitch: number;
  pelvisYaw: number;
  pelvisRoll: number;
  torsoPitch: number;
  torsoYaw: number;
  torsoRoll: number;
  headPitch: number;
  headYaw: number;
  jawOpen: number;
  // Arm angles in radians: pitch (- = swing forward along +Z), roll (outward), elbowFlex (- = bend forward)
  lShoulderPitch: number;
  lShoulderRoll: number;
  lElbowPitch: number;
  rShoulderPitch: number;
  rShoulderRoll: number;
  rElbowPitch: number;
  // Leg angles in radians: pitch (- = lift forward +Z), roll, kneePitch (+ = bend knee backward -Z)
  lHipPitch: number;
  lHipRoll: number;
  lKneePitch: number;
  lAnklePitch: number;
  rHipPitch: number;
  rHipRoll: number;
  rKneePitch: number;
  rAnklePitch: number;
  // Tail & Wings
  tailPitch: number;
  tailYaw: number;
  wingSpread: number;
  wingFlap: number;
}

const DEG = Math.PI / 180;

function baseFightingStance(id: FighterId, globalTime: number): JointPose {
  const breath = Math.sin(globalTime * 3.1) * 0.025;
  const sway = Math.cos(globalTime * 2.2) * 0.03;

  // Distinct species fighting stances
  if (id === FighterId.SILVERBACK_GORILLA) {
    // Low heavy brawler crouch, massive arms forward
    return {
      rootOffsetY: -0.07 + breath * 0.5,
      pelvisPitch: 14 * DEG,
      pelvisYaw: -12 * DEG,
      pelvisRoll: 0,
      torsoPitch: 18 * DEG + breath,
      torsoYaw: 10 * DEG,
      torsoRoll: sway,
      headPitch: -16 * DEG,
      headYaw: -8 * DEG,
      jawOpen: 0.08 + Math.max(0, Math.sin(globalTime * 2.5)) * 0.08,
      lShoulderPitch: -42 * DEG,
      lShoulderRoll: 22 * DEG,
      lElbowPitch: -78 * DEG,
      rShoulderPitch: -54 * DEG,
      rShoulderRoll: -22 * DEG,
      rElbowPitch: -88 * DEG,
      lHipPitch: -24 * DEG,
      lHipRoll: 10 * DEG,
      lKneePitch: 36 * DEG,
      lAnklePitch: -12 * DEG,
      rHipPitch: 14 * DEG,
      rHipRoll: -10 * DEG,
      rKneePitch: 28 * DEG,
      rAnklePitch: -24 * DEG,
      tailPitch: 0,
      tailYaw: 0,
      wingSpread: 0,
      wingFlap: 0,
    };
  }

  if (id === FighterId.RED_FOX) {
    // Agile bouncy Kitsune kenpo guard
    const bounce = Math.abs(Math.sin(globalTime * 5.2)) * 0.038;
    return {
      rootOffsetY: -0.03 + bounce,
      pelvisPitch: 8 * DEG,
      pelvisYaw: -22 * DEG,
      pelvisRoll: 0,
      torsoPitch: 10 * DEG,
      torsoYaw: 18 * DEG,
      torsoRoll: sway,
      headPitch: -8 * DEG,
      headYaw: -12 * DEG,
      jawOpen: 0.02,
      lShoulderPitch: -58 * DEG,
      lShoulderRoll: 15 * DEG,
      lElbowPitch: -105 * DEG,
      rShoulderPitch: -44 * DEG,
      rShoulderRoll: -18 * DEG,
      rElbowPitch: -96 * DEG,
      lHipPitch: -22 * DEG,
      lHipRoll: 8 * DEG,
      lKneePitch: 30 * DEG,
      lAnklePitch: -8 * DEG,
      rHipPitch: 18 * DEG,
      rHipRoll: -8 * DEG,
      rKneePitch: 26 * DEG,
      rAnklePitch: -22 * DEG,
      tailPitch: 12 * DEG + Math.sin(globalTime * 4) * 0.12,
      tailYaw: Math.cos(globalTime * 3.4) * 0.25,
      wingSpread: 0,
      wingFlap: 0,
    };
  }

  if (id === FighterId.EAGLE_WARRIOR) {
    // Upright high-guard Taekwondo raptor stance
    return {
      rootOffsetY: -0.015 + breath,
      pelvisPitch: 4 * DEG,
      pelvisYaw: -26 * DEG,
      pelvisRoll: 0,
      torsoPitch: 5 * DEG,
      torsoYaw: 22 * DEG,
      torsoRoll: 0,
      headPitch: -4 * DEG,
      headYaw: -16 * DEG,
      jawOpen: 0,
      lShoulderPitch: -64 * DEG,
      lShoulderRoll: 24 * DEG,
      lElbowPitch: -95 * DEG,
      rShoulderPitch: -48 * DEG,
      rShoulderRoll: -20 * DEG,
      rElbowPitch: -102 * DEG,
      lHipPitch: -18 * DEG,
      lHipRoll: 7 * DEG,
      lKneePitch: 22 * DEG,
      lAnklePitch: -4 * DEG,
      rHipPitch: 16 * DEG,
      rHipRoll: -7 * DEG,
      rKneePitch: 20 * DEG,
      rAnklePitch: -18 * DEG,
      tailPitch: -6 * DEG,
      tailYaw: 0,
      wingSpread: 0.22 + Math.sin(globalTime * 2.8) * 0.08,
      wingFlap: Math.cos(globalTime * 2.8) * 0.1,
    };
  }

  if (id === FighterId.CROCODILE_BOSS) {
    // Heavy Muay-Thai armored stalker stance with swaying tail
    return {
      rootOffsetY: -0.045 + breath * 0.6,
      pelvisPitch: 10 * DEG,
      pelvisYaw: -15 * DEG,
      pelvisRoll: 0,
      torsoPitch: 12 * DEG,
      torsoYaw: 14 * DEG,
      torsoRoll: 0,
      headPitch: -10 * DEG,
      headYaw: -8 * DEG,
      jawOpen: 0.12 + Math.sin(globalTime * 2.2) * 0.06,
      lShoulderPitch: -54 * DEG,
      lShoulderRoll: 18 * DEG,
      lElbowPitch: -98 * DEG,
      rShoulderPitch: -50 * DEG,
      rShoulderRoll: -18 * DEG,
      rElbowPitch: -98 * DEG,
      lHipPitch: -20 * DEG,
      lHipRoll: 9 * DEG,
      lKneePitch: 28 * DEG,
      lAnklePitch: -8 * DEG,
      rHipPitch: 15 * DEG,
      rHipRoll: -9 * DEG,
      rKneePitch: 24 * DEG,
      rAnklePitch: -20 * DEG,
      tailPitch: 4 * DEG,
      tailYaw: Math.sin(globalTime * 2.6) * 0.32,
      wingSpread: 0,
      wingFlap: 0,
    };
  }

  if (id === FighterId.DRAGON_BOSS) {
    // Intimidating Sovereign Draconic stance with breathing wings & glowing chest
    return {
      rootOffsetY: -0.02 + breath,
      pelvisPitch: 6 * DEG,
      pelvisYaw: -16 * DEG,
      pelvisRoll: 0,
      torsoPitch: 8 * DEG + breath,
      torsoYaw: 14 * DEG,
      torsoRoll: 0,
      headPitch: -6 * DEG,
      headYaw: -10 * DEG,
      jawOpen: 0.10 + Math.max(0, Math.sin(globalTime * 2.4)) * 0.08,
      lShoulderPitch: -46 * DEG,
      lShoulderRoll: 24 * DEG,
      lElbowPitch: -86 * DEG,
      rShoulderPitch: -52 * DEG,
      rShoulderRoll: -24 * DEG,
      rElbowPitch: -92 * DEG,
      lHipPitch: -18 * DEG,
      lHipRoll: 9 * DEG,
      lKneePitch: 24 * DEG,
      lAnklePitch: -6 * DEG,
      rHipPitch: 16 * DEG,
      rHipRoll: -9 * DEG,
      rKneePitch: 22 * DEG,
      rAnklePitch: -18 * DEG,
      tailPitch: 6 * DEG,
      tailYaw: Math.sin(globalTime * 2.2) * 0.28,
      wingSpread: 0.35 + Math.sin(globalTime * 2.4) * 0.12,
      wingFlap: Math.cos(globalTime * 2.4) * 0.14,
    };
  }

  // LION_KING: Proud Imperium Royal Pankration Guard
  return {
    rootOffsetY: -0.025 + breath,
    pelvisPitch: 6 * DEG,
    pelvisYaw: -18 * DEG,
    pelvisRoll: 0,
    torsoPitch: 8 * DEG + breath,
    torsoYaw: 16 * DEG,
    torsoRoll: sway * 0.6,
    headPitch: -6 * DEG,
    headYaw: -12 * DEG,
    jawOpen: 0.04,
    lShoulderPitch: -52 * DEG,
    lShoulderRoll: 18 * DEG,
    lElbowPitch: -94 * DEG,
    rShoulderPitch: -58 * DEG,
    rShoulderRoll: -18 * DEG,
    rElbowPitch: -102 * DEG,
    lHipPitch: -20 * DEG,
    lHipRoll: 8 * DEG,
    lKneePitch: 25 * DEG,
    lAnklePitch: -5 * DEG,
    rHipPitch: 16 * DEG,
    rHipRoll: -8 * DEG,
    rKneePitch: 22 * DEG,
    rAnklePitch: -18 * DEG,
    tailPitch: 8 * DEG,
    tailYaw: Math.sin(globalTime * 2.7) * 0.22,
    wingSpread: 0,
    wingFlap: 0,
  };
}

function evaluateActionPose(
  id: FighterId,
  action: FighterAction,
  t: number,
  globalTime: number
): JointPose {
  const base = baseFightingStance(id, globalTime);

  switch (action) {
    case FighterAction.IDLE:
      return base;

    case FighterAction.WALK_FORWARD: {
      const freq = id === FighterId.RED_FOX ? 11.5 : id === FighterId.SILVERBACK_GORILLA ? 7.4 : 9.2;
      const s = Math.sin(t * freq);
      const c = Math.cos(t * freq);
      return {
        ...base,
        rootOffsetY: base.rootOffsetY + Math.abs(c) * 0.035,
        torsoPitch: base.torsoPitch + 6 * DEG,
        torsoYaw: s * 10 * DEG,
        lHipPitch: -s * 34 * DEG - 6 * DEG,
        lKneePitch: Math.max(8 * DEG, (24 - c * 18) * DEG),
        rHipPitch: s * 34 * DEG - 6 * DEG,
        rKneePitch: Math.max(8 * DEG, (24 + c * 18) * DEG),
        lShoulderPitch: base.lShoulderPitch + s * 18 * DEG,
        rShoulderPitch: base.rShoulderPitch - s * 18 * DEG,
      };
    }

    case FighterAction.WALK_BACKWARD: {
      const freq = 8.4;
      const s = Math.sin(t * freq);
      const c = Math.cos(t * freq);
      return {
        ...base,
        rootOffsetY: base.rootOffsetY + Math.abs(c) * 0.025,
        torsoPitch: base.torsoPitch - 4 * DEG,
        lHipPitch: s * 28 * DEG - 4 * DEG,
        lKneePitch: Math.max(10 * DEG, (26 + c * 14) * DEG),
        rHipPitch: -s * 28 * DEG - 4 * DEG,
        rKneePitch: Math.max(10 * DEG, (26 - c * 14) * DEG),
        lShoulderPitch: -62 * DEG,
        rShoulderPitch: -66 * DEG,
      };
    }

    case FighterAction.JUMP: {
      return {
        ...base,
        torsoPitch: 12 * DEG,
        lHipPitch: -48 * DEG,
        lKneePitch: 68 * DEG,
        rHipPitch: -32 * DEG,
        rKneePitch: 54 * DEG,
        lShoulderPitch: -75 * DEG,
        rShoulderPitch: -75 * DEG,
        wingSpread: 0.78,
        wingFlap: Math.sin(t * 14) * 0.35,
      };
    }

    case FighterAction.BLOCK:
    case FighterAction.BLOCK_STUN: {
      const recoil = action === FighterAction.BLOCK_STUN ? 8 * DEG : 0;
      return {
        ...base,
        rootOffsetY: -0.055,
        torsoPitch: 6 * DEG - recoil,
        torsoYaw: 0,
        headPitch: 10 * DEG,
        lShoulderPitch: -82 * DEG,
        lShoulderRoll: -12 * DEG,
        lElbowPitch: -116 * DEG,
        rShoulderPitch: -84 * DEG,
        rShoulderRoll: 12 * DEG,
        rElbowPitch: -116 * DEG,
        wingSpread: 0.15,
      };
    }

    case FighterAction.DODGE_BACK: {
      return {
        ...base,
        rootOffsetY: -0.08,
        torsoPitch: -14 * DEG,
        lHipPitch: -34 * DEG,
        lKneePitch: 44 * DEG,
        rHipPitch: 24 * DEG,
        rKneePitch: 36 * DEG,
        wingSpread: 0.55,
      };
    }

    case FighterAction.DODGE_FORWARD: {
      return {
        ...base,
        rootOffsetY: -0.09,
        torsoPitch: 28 * DEG,
        lHipPitch: -42 * DEG,
        lKneePitch: 48 * DEG,
        rHipPitch: 32 * DEG,
        rKneePitch: 28 * DEG,
        lShoulderPitch: -30 * DEG,
        rShoulderPitch: -30 * DEG,
        wingSpread: 0.6,
      };
    }

    case FighterAction.LIGHT_PUNCH: {
      // Snappy Lead Left Jab (+Z forward extension)
      const ext = Math.sin(Math.min(1, t / 0.22) * Math.PI);
      return {
        ...base,
        torsoYaw: (16 - ext * 38) * DEG,
        torsoPitch: (8 + ext * 10) * DEG,
        lShoulderPitch: (-52 - ext * 44) * DEG,
        lShoulderRoll: (18 - ext * 14) * DEG,
        lElbowPitch: (-94 + ext * 86) * DEG,
        rShoulderPitch: -62 * DEG,
        rElbowPitch: -108 * DEG,
      };
    }

    case FighterAction.LIGHT_PUNCH_2: {
      // Rear Right Cross Straight
      const ext = Math.sin(Math.min(1, t / 0.25) * Math.PI);
      return {
        ...base,
        pelvisYaw: (-18 + ext * 34) * DEG,
        torsoYaw: (16 + ext * 36) * DEG,
        torsoPitch: (10 + ext * 12) * DEG,
        rShoulderPitch: (-58 - ext * 42) * DEG,
        rShoulderRoll: (-18 + ext * 14) * DEG,
        rElbowPitch: (-102 + ext * 92) * DEG,
        jawOpen: 0.22 * ext,
      };
    }

    case FighterAction.HEAVY_PUNCH: {
      const p = Math.min(1, t / 0.55);
      const strike = p < 0.35 ? -p / 0.35 : Math.sin(((p - 0.35) / 0.65) * Math.PI);
      if (id === FighterId.SILVERBACK_GORILLA) {
        // Double Overhead Hammer Smash
        return {
          ...base,
          rootOffsetY: strike < 0 ? 0.04 : -0.10 * strike,
          torsoPitch: (14 + strike * 34) * DEG,
          lShoulderPitch: (-90 - strike * 45) * DEG,
          rShoulderPitch: (-90 - strike * 45) * DEG,
          lElbowPitch: (-65 + Math.max(0, strike) * 45) * DEG,
          rElbowPitch: (-65 + Math.max(0, strike) * 45) * DEG,
          jawOpen: 0.42,
        };
      }
      return {
        ...base,
        rootOffsetY: -0.06,
        pelvisYaw: (-16 + strike * 42) * DEG,
        torsoYaw: (14 + strike * 48) * DEG,
        torsoPitch: (12 + Math.max(0, strike) * 20) * DEG,
        rShoulderPitch: (-55 - strike * 46) * DEG,
        rElbowPitch: (-95 + Math.max(0, strike) * 88) * DEG,
        jawOpen: 0.36,
      };
    }

    case FighterAction.LIGHT_KICK: {
      const ext = Math.sin(Math.min(1, t / 0.32) * Math.PI);
      return {
        ...base,
        torsoPitch: (8 - ext * 12) * DEG,
        lHipPitch: (-20 - ext * 68) * DEG,
        lKneePitch: (25 - ext * 20) * DEG,
        lAnklePitch: (ext * 25) * DEG,
        rKneePitch: 30 * DEG,
      };
    }

    case FighterAction.HEAVY_KICK: {
      const p = Math.min(1, t / 0.58);
      const ext = Math.sin(p * Math.PI);
      if (id === FighterId.CROCODILE_BOSS) {
        // Armored Spinning Tail Cleave
        return {
          ...base,
          pelvisYaw: p * 360 * DEG,
          torsoPitch: 18 * DEG,
          tailYaw: Math.sin(p * Math.PI * 2) * 0.85,
          jawOpen: 0.45,
        };
      }
      return {
        ...base,
        torsoPitch: (-18 * ext) * DEG,
        pelvisRoll: (16 * ext) * DEG,
        rHipPitch: (16 - ext * 112) * DEG,
        rHipRoll: (-8 - ext * 24) * DEG,
        rKneePitch: (22 - ext * 18) * DEG,
        wingSpread: 0.65 * ext,
        jawOpen: 0.32 * ext,
      };
    }

    case FighterAction.THROW: {
      const p = Math.min(1, t / 0.52);
      const grab = Math.sin(p * Math.PI);
      return {
        ...base,
        torsoPitch: (22 * grab) * DEG,
        lShoulderPitch: (-88 * grab - 25) * DEG,
        rShoulderPitch: (-88 * grab - 25) * DEG,
        lShoulderRoll: (-14 * grab + 10) * DEG,
        rShoulderRoll: (14 * grab - 10) * DEG,
        lElbowPitch: -45 * DEG,
        rElbowPitch: -45 * DEG,
        jawOpen: 0.4,
      };
    }

    case FighterAction.COUNTER_STANCE: {
      return {
        ...base,
        rootOffsetY: -0.06,
        torsoYaw: -28 * DEG,
        lShoulderPitch: -72 * DEG,
        lElbowPitch: -110 * DEG,
        rShoulderPitch: -34 * DEG,
        rElbowPitch: -85 * DEG,
      };
    }

    case FighterAction.COUNTER_STRIKE:
    case FighterAction.SPECIAL_MOVE:
    case FighterAction.DRAGON_ELEMENTAL_STORM: {
      const p = Math.min(1, t / 0.72);
      const burst = Math.sin(p * Math.PI);
      return {
        ...base,
        rootOffsetY: -0.05 + burst * 0.06,
        torsoPitch: (24 * burst) * DEG,
        torsoYaw: Math.sin(p * Math.PI * 2) * 42 * DEG,
        lShoulderPitch: (-98 * burst - 20) * DEG,
        rShoulderPitch: (-102 * burst - 20) * DEG,
        lElbowPitch: (-30 * (1 - burst)) * DEG,
        rElbowPitch: (-30 * (1 - burst)) * DEG,
        jawOpen: 0.52 * burst,
        wingSpread: 0.88 * burst,
        wingFlap: Math.sin(t * 18) * 0.42,
      };
    }

    case FighterAction.DRAGON_AERIAL_DIVE: {
      const p = Math.min(1, t / 0.80);
      return {
        ...base,
        torsoPitch: 42 * DEG,
        lShoulderPitch: -115 * DEG,
        rShoulderPitch: -115 * DEG,
        lElbowPitch: -25 * DEG,
        rElbowPitch: -25 * DEG,
        lHipPitch: 24 * DEG,
        rHipPitch: 24 * DEG,
        wingSpread: 1.05,
        wingFlap: Math.sin(p * Math.PI * 3) * 0.55,
        jawOpen: 0.48,
      };
    }

    case FighterAction.DRAGON_FIRE_BREATH:
    case FighterAction.DRAGON_ULTIMATE_CATACLYSM: {
      const p = Math.min(1, t / 1.0);
      const windup = p < 0.32 ? p / 0.32 : 1;
      const blasting = p >= 0.32 ? 1 : 0;
      return {
        ...base,
        rootOffsetY: -0.05,
        torsoPitch: (-16 * (1 - blasting) + 22 * blasting) * DEG,
        headPitch: (-18 * (1 - blasting) + 12 * blasting) * DEG,
        lShoulderPitch: (-30 + blasting * -40) * DEG,
        rShoulderPitch: (-30 + blasting * -40) * DEG,
        lShoulderRoll: 38 * DEG,
        rShoulderRoll: -38 * DEG,
        jawOpen: 0.15 + 0.58 * blasting + 0.1 * windup,
        wingSpread: 0.95,
        wingFlap: blasting ? Math.sin(t * 22) * 0.18 : -0.3 * windup,
      };
    }

    case FighterAction.HIT_LIGHT: {
      const rec = Math.sin(Math.min(1, t / 0.28) * Math.PI);
      return {
        ...base,
        torsoPitch: (-18 * rec) * DEG,
        headPitch: (-24 * rec) * DEG,
        lShoulderPitch: (-30 * rec - 30) * DEG,
        rShoulderPitch: (-30 * rec - 30) * DEG,
        jawOpen: 0.35 * rec,
      };
    }

    case FighterAction.HIT_HEAVY: {
      const rec = Math.sin(Math.min(1, t / 0.42) * Math.PI);
      return {
        ...base,
        rootOffsetY: -0.06,
        torsoPitch: (-32 * rec) * DEG,
        torsoYaw: (24 * rec) * DEG,
        headPitch: (-34 * rec) * DEG,
        jawOpen: 0.48 * rec,
      };
    }

    case FighterAction.KNOCKDOWN:
    case FighterAction.DEFEAT: {
      const fall = Math.min(1, t / 0.38);
      return {
        ...base,
        rootOffsetY: -0.74 * fall,
        pelvisPitch: (-82 * fall) * DEG,
        torsoPitch: (-12 * fall) * DEG,
        lShoulderPitch: (-25 * fall) * DEG,
        rShoulderPitch: (-25 * fall) * DEG,
        lShoulderRoll: 42 * DEG,
        rShoulderRoll: -42 * DEG,
        lElbowPitch: -20 * DEG,
        rElbowPitch: -20 * DEG,
        lHipPitch: (-10 * fall) * DEG,
        rHipPitch: (-6 * fall) * DEG,
        lKneePitch: 14 * DEG,
        rKneePitch: 18 * DEG,
        wingSpread: 0.2,
      };
    }

    case FighterAction.GET_UP: {
      const rise = 1 - Math.min(1, t / 0.42);
      return {
        ...base,
        rootOffsetY: -0.68 * rise,
        pelvisPitch: (-70 * rise) * DEG,
        torsoPitch: (25 * (1 - rise)) * DEG,
      };
    }

    case FighterAction.INTRO_POSE:
    case FighterAction.VICTORY: {
      const pump = Math.sin(t * 4.5);
      if (id === FighterId.LION_KING) {
        // Royal Imperium Roar with raised right fist
        return {
          ...base,
          torsoPitch: -10 * DEG,
          torsoYaw: 0,
          headPitch: -18 * DEG,
          jawOpen: 0.42 + Math.max(0, pump) * 0.15,
          rShoulderPitch: (-148 + pump * 8) * DEG,
          rShoulderRoll: -24 * DEG,
          rElbowPitch: -32 * DEG,
          lShoulderPitch: -35 * DEG,
          lShoulderRoll: 28 * DEG,
        };
      }
      if (id === FighterId.SILVERBACK_GORILLA) {
        // Primal Chest-Beat Victory Pose
        return {
          ...base,
          torsoPitch: -12 * DEG,
          torsoYaw: 0,
          headPitch: -22 * DEG,
          jawOpen: 0.5,
          lShoulderPitch: (-78 + pump * 26) * DEG,
          rShoulderPitch: (-78 - pump * 26) * DEG,
          lElbowPitch: -95 * DEG,
          rElbowPitch: -95 * DEG,
        };
      }
      if (id === FighterId.DRAGON_BOSS) {
        // Wings Fully Unfurled Sovereign Roar
        return {
          ...base,
          torsoPitch: -14 * DEG,
          torsoYaw: 0,
          headPitch: -22 * DEG,
          jawOpen: 0.55,
          lShoulderPitch: -45 * DEG,
          rShoulderPitch: -45 * DEG,
          lShoulderRoll: 48 * DEG,
          rShoulderRoll: -48 * DEG,
          wingSpread: 1.15,
          wingFlap: pump * 0.22,
        };
      }
      return {
        ...base,
        torsoPitch: -8 * DEG,
        torsoYaw: 0,
        rShoulderPitch: (-152 + pump * 6) * DEG,
        rElbowPitch: -24 * DEG,
        lShoulderPitch: -42 * DEG,
        wingSpread: 0.85,
      };
    }
  }
}

function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}

function lerpPose(a: JointPose, b: JointPose, t: number): JointPose {
  return {
    rootOffsetY: lerp(a.rootOffsetY, b.rootOffsetY, t),
    pelvisPitch: lerp(a.pelvisPitch, b.pelvisPitch, t),
    pelvisYaw: lerp(a.pelvisYaw, b.pelvisYaw, t),
    pelvisRoll: lerp(a.pelvisRoll, b.pelvisRoll, t),
    torsoPitch: lerp(a.torsoPitch, b.torsoPitch, t),
    torsoYaw: lerp(a.torsoYaw, b.torsoYaw, t),
    torsoRoll: lerp(a.torsoRoll, b.torsoRoll, t),
    headPitch: lerp(a.headPitch, b.headPitch, t),
    headYaw: lerp(a.headYaw, b.headYaw, t),
    jawOpen: lerp(a.jawOpen, b.jawOpen, t),
    lShoulderPitch: lerp(a.lShoulderPitch, b.lShoulderPitch, t),
    lShoulderRoll: lerp(a.lShoulderRoll, b.lShoulderRoll, t),
    lElbowPitch: lerp(a.lElbowPitch, b.lElbowPitch, t),
    rShoulderPitch: lerp(a.rShoulderPitch, b.rShoulderPitch, t),
    rShoulderRoll: lerp(a.rShoulderRoll, b.rShoulderRoll, t),
    rElbowPitch: lerp(a.rElbowPitch, b.rElbowPitch, t),
    lHipPitch: lerp(a.lHipPitch, b.lHipPitch, t),
    lHipRoll: lerp(a.lHipRoll, b.lHipRoll, t),
    lKneePitch: lerp(a.lKneePitch, b.lKneePitch, t),
    lAnklePitch: lerp(a.lAnklePitch, b.lAnklePitch, t),
    rHipPitch: lerp(a.rHipPitch, b.rHipPitch, t),
    rHipRoll: lerp(a.rHipRoll, b.rHipRoll, t),
    rKneePitch: lerp(a.rKneePitch, b.rKneePitch, t),
    rAnklePitch: lerp(a.rAnklePitch, b.rAnklePitch, t),
    tailPitch: lerp(a.tailPitch, b.tailPitch, t),
    tailYaw: lerp(a.tailYaw, b.tailYaw, t),
    wingSpread: lerp(a.wingSpread, b.wingSpread, t),
    wingFlap: lerp(a.wingFlap, b.wingFlap, t),
  };
}

export function applyFighterAnimation(
  rig: ArticulatedFighterRig,
  runtime: FighterRuntime,
  globalTime: number
): void {
  const curPose = evaluateActionPose(runtime.id, runtime.action, runtime.stateTime, globalTime);
  const finalPose =
    runtime.blendAlpha < 0.99 && runtime.prevAction !== runtime.action
      ? lerpPose(
          evaluateActionPose(runtime.id, runtime.prevAction, 0.16, globalTime),
          curPose,
          THREE.MathUtils.smoothstep(runtime.blendAlpha, 0, 1)
        )
      : curPose;

  // Position and Facing (+1 = right +X, so +Z forward rotates +90deg around Y; -1 = left -X, -90deg around Y)
  rig.root.position.set(runtime.x, runtime.y, 0);
  rig.root.rotation.set(0, runtime.facing === 1 ? Math.PI * 0.5 : -Math.PI * 0.5, 0);

  applyPoseToRigJoints(rig, finalPose);

  // Hit & Guard Flash feedback
  const hitGlow = runtime.hitFlashTimer > 0 ? 0.65 : 0;
  const guardGlow = runtime.guardFlashTimer > 0 ? 0.45 : 0;
  for (const mat of rig.flashMaterials) {
    if (!rig.emissiveMaterials.includes(mat)) {
      if (hitGlow > 0) {
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = hitGlow;
      } else if (guardGlow > 0) {
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = guardGlow;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  }
}

export function applyPreviewAnimation(
  rig: ArticulatedFighterRig,
  fighterId: FighterId,
  yawRad: number,
  globalTime: number,
  victoryPreview = false
): void {
  const pose = evaluateActionPose(
    fighterId,
    victoryPreview ? FighterAction.VICTORY : FighterAction.IDLE,
    globalTime,
    globalTime
  );
  rig.root.position.set(0, 0, 0);
  rig.root.rotation.set(0, yawRad, 0);
  applyPoseToRigJoints(rig, pose);
}

function applyPoseToRigJoints(rig: ArticulatedFighterRig, p: JointPose): void {
  rig.pelvis.position.set(0, rig.hipBaseY + p.rootOffsetY, 0);
  rig.pelvis.rotation.set(p.pelvisPitch, p.pelvisYaw, p.pelvisRoll);

  rig.torso.rotation.set(p.torsoPitch, p.torsoYaw, p.torsoRoll);
  rig.neckAndHead.rotation.set(p.headPitch, p.headYaw, 0);

  if (rig.jaw) {
    rig.jaw.rotation.set(p.jawOpen, 0, 0);
  }

  rig.shoulderL.rotation.set(p.lShoulderPitch, 0, p.lShoulderRoll);
  rig.elbowL.rotation.set(p.lElbowPitch, 0, 0);

  rig.shoulderR.rotation.set(p.rShoulderPitch, 0, p.rShoulderRoll);
  rig.elbowR.rotation.set(p.rElbowPitch, 0, 0);

  rig.hipL.rotation.set(p.lHipPitch, 0, p.lHipRoll);
  rig.kneeL.rotation.set(p.lKneePitch, 0, 0);
  rig.ankleL.rotation.set(p.lAnklePitch, 0, 0);

  rig.hipR.rotation.set(p.rHipPitch, 0, p.rHipRoll);
  rig.kneeR.rotation.set(p.rKneePitch, 0, 0);
  rig.ankleR.rotation.set(p.rAnklePitch, 0, 0);

  if (rig.tailBase) {
    rig.tailBase.rotation.set(p.tailPitch, p.tailYaw, 0);
  }

  if (rig.wingL && rig.wingR) {
    rig.wingL.rotation.set(0, -0.35 + p.wingFlap, -0.25 + p.wingSpread * 0.45);
    rig.wingR.rotation.set(0, 0.35 - p.wingFlap, 0.25 - p.wingSpread * 0.45);
  }
}
