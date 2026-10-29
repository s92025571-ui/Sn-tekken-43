import React, { useRef, useState } from 'react';
import {
  CombatInput,
  FighterId,
  FighterRuntime,
  TouchControlLayout,
} from '../types/game';

interface MobileTouchControlsProps {
  layout: TouchControlLayout;
  player: FighterRuntime;
  onMoveDirChange: (dir: number) => void;
  onBlockHeldChange: (held: boolean) => void;
  onCombatInput: (input: CombatInput) => void;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  layout,
  player,
  onMoveDirChange,
  onBlockHeldChange,
  onCombatInput,
}) => {
  const stickRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const jumpTriggeredInDrag = useRef(false);

  const scale = layout.buttonScale;
  const stickSize = Math.round(132 * scale);
  const knobSize = Math.round(52 * scale);
  const btnSize = Math.round(56 * scale);
  const smallBtnSize = Math.round(46 * scale);

  const updateStickFromClient = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const maxR = rect.width * 0.38;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    setKnobOffset({ x: dx, y: dy });

    const normX = dx / maxR;
    const normY = dy / maxR;

    if (normX < -0.26) {
      onMoveDirChange(-1);
    } else if (normX > 0.26) {
      onMoveDirChange(1);
    } else {
      onMoveDirChange(0);
    }

    if (normY < -0.58 && !jumpTriggeredInDrag.current) {
      jumpTriggeredInDrag.current = true;
      onCombatInput(CombatInput.JUMP);
    } else if (normY > -0.3) {
      jumpTriggeredInDrag.current = false;
    }
  };

  const resetStick = () => {
    activePointerId.current = null;
    jumpTriggeredInDrag.current = false;
    setKnobOffset({ x: 0, y: 0 });
    onMoveDirChange(0);
  };

  const isDragon = player.id === FighterId.DRAGON_BOSS;
  const specialReady = isDragon ? player.specialMeter >= 35 : player.specialMeter >= 50;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 pointer-events-none select-none"
      style={{ opacity: layout.opacity }}
    >
      {/* LEFT: Analog Virtual Joystick + Quick Step / Jump Buttons */}
      <div
        className="absolute pointer-events-auto flex items-end gap-3"
        style={{
          left: `${layout.dpadOffsetX}px`,
          bottom: `${layout.dpadOffsetY}px`,
        }}
      >
        <div
          ref={stickRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            activePointerId.current = e.pointerId;
            updateStickFromClient(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (activePointerId.current === e.pointerId) {
              updateStickFromClient(e.clientX, e.clientY);
            }
          }}
          onPointerUp={resetStick}
          onPointerCancel={resetStick}
          className="relative rounded-full border-2 border-slate-500/50 bg-[#0d1018]/80 flex items-center justify-center touch-none"
          style={{ width: `${stickSize}px`, height: `${stickSize}px` }}
          aria-label="Movement Virtual Joystick"
        >
          {/* Directional Chevrons */}
          <span className="absolute top-1.5 text-[10px] font-bold text-slate-400">JUMP</span>
          <span className="absolute left-2 text-xs font-bold text-slate-400">◀</span>
          <span className="absolute right-2 text-xs font-bold text-slate-400">▶</span>

          {/* Thumb Knob */}
          <div
            className="rounded-full border border-amber-400/80 bg-amber-500/30 shadow-md"
            style={{
              width: `${knobSize}px`,
              height: `${knobSize}px`,
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
          />
        </div>

        {/* Dedicated Dodge Back / Dash Forward Micro-Buttons */}
        <div className="flex flex-col gap-2 pb-1">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onCombatInput(CombatInput.JUMP);
            }}
            style={{ width: `${smallBtnSize}px`, height: `${smallBtnSize}px` }}
            className="rounded-xl border border-slate-600 bg-[#121622]/90 text-[11px] font-bold text-slate-200 active:scale-95 transition-transform"
          >
            JMP
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.DODGE_BACK);
              }}
              style={{ width: `${smallBtnSize}px`, height: `${smallBtnSize}px` }}
              className="rounded-xl border border-slate-600 bg-[#121622]/90 text-[11px] font-bold text-slate-200 active:scale-95 transition-transform"
              title="Evade Back"
            >
              EVD
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.DODGE_FORWARD);
              }}
              style={{ width: `${smallBtnSize}px`, height: `${smallBtnSize}px` }}
              className="rounded-xl border border-slate-600 bg-[#121622]/90 text-[11px] font-bold text-slate-200 active:scale-95 transition-transform"
              title="Dash Step"
            >
              DSH
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Tekken 4-Limb Arcade Diamond + Block, Throw, Counter & Special/Dragon Powers */}
      <div
        className="absolute pointer-events-auto flex flex-col items-end gap-2.5"
        style={{
          right: `${layout.buttonsOffsetX}px`,
          bottom: `${layout.buttonsOffsetY}px`,
        }}
      >
        {/* Dragon Elemental Extra Row when playing Dragon Final Boss */}
        {isDragon && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={player.specialMeter < 30 || player.fireBreathCooldown > 0}
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.DRAGON_FIRE);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono-num transition-transform active:scale-95 whitespace-nowrap ${
                player.specialMeter >= 30 && player.fireBreathCooldown <= 0
                  ? 'border-orange-400 bg-orange-950/90 text-orange-200'
                  : 'border-slate-700 bg-[#11141e]/75 text-slate-500'
              }`}
            >
              FIRE {player.fireBreathCooldown > 0 ? `${Math.ceil(player.fireBreathCooldown)}s` : '30%'}
            </button>
            <button
              type="button"
              disabled={player.specialMeter < 25 || player.aerialCooldown > 0}
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.DRAGON_AERIAL);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono-num transition-transform active:scale-95 whitespace-nowrap ${
                player.specialMeter >= 25 && player.aerialCooldown <= 0
                  ? 'border-red-400 bg-red-950/90 text-red-200'
                  : 'border-slate-700 bg-[#11141e]/75 text-slate-500'
              }`}
            >
              DIVE {player.aerialCooldown > 0 ? `${Math.ceil(player.aerialCooldown)}s` : '25%'}
            </button>
            <button
              type="button"
              disabled={player.specialMeter < 100 || player.ultimateCooldown > 0}
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.DRAGON_ULTIMATE);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono-num transition-transform active:scale-95 whitespace-nowrap ${
                player.specialMeter >= 100 && player.ultimateCooldown <= 0
                  ? 'border-amber-300 bg-red-700 text-white'
                  : 'border-slate-700 bg-[#11141e]/75 text-slate-500'
              }`}
            >
              NOVA 100%
            </button>
          </div>
        )}

        <div className="flex items-end gap-2.5">
          {/* Tactical Utility Column: Block, Throw, Counter */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                onBlockHeldChange(true);
              }}
              onPointerUp={() => onBlockHeldChange(false)}
              onPointerCancel={() => onBlockHeldChange(false)}
              style={{ width: `${btnSize}px`, height: `${smallBtnSize}px` }}
              className="rounded-xl border-2 border-sky-400/75 bg-sky-950/85 text-xs font-bold text-sky-200 active:scale-95 transition-transform"
            >
              BLK
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onCombatInput(CombatInput.THROW);
                }}
                style={{ width: `${smallBtnSize}px`, height: `${smallBtnSize}px` }}
                className="rounded-xl border border-emerald-500/70 bg-emerald-950/85 text-[11px] font-bold text-emerald-200 active:scale-95 transition-transform"
                title="Unblockable Clinch Throw"
              >
                THW
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onCombatInput(CombatInput.COUNTER);
                }}
                style={{ width: `${smallBtnSize}px`, height: `${smallBtnSize}px` }}
                className="rounded-xl border border-purple-400/70 bg-purple-950/85 text-[11px] font-bold text-purple-200 active:scale-95 transition-transform"
                title="Parry Counter Reversal"
              >
                CTR
              </button>
            </div>
          </div>

          {/* Primary 2x2 Strike Grid + Special Button */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.LIGHT_PUNCH);
              }}
              style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
              className="rounded-full border-2 border-amber-400/80 bg-[#1a1814]/90 text-xs font-extrabold text-amber-300 active:scale-95 transition-transform"
            >
              LP
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.HEAVY_PUNCH);
              }}
              style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
              className="rounded-full border-2 border-red-500/85 bg-[#221316]/90 text-xs font-extrabold text-red-300 active:scale-95 transition-transform"
            >
              HP
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.LIGHT_KICK);
              }}
              style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
              className="rounded-full border-2 border-cyan-400/80 bg-[#111c24]/90 text-xs font-extrabold text-cyan-200 active:scale-95 transition-transform"
            >
              LK
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onCombatInput(CombatInput.HEAVY_KICK);
              }}
              style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
              className="rounded-full border-2 border-orange-500/85 bg-[#241812]/90 text-xs font-extrabold text-orange-300 active:scale-95 transition-transform"
            >
              HK
            </button>
          </div>

          {/* Special Attack / Ultimate Trigger */}
          <button
            type="button"
            disabled={!specialReady || player.specialCooldown > 0}
            onPointerDown={(e) => {
              e.preventDefault();
              onCombatInput(CombatInput.SPECIAL);
            }}
            style={{
              width: `${Math.round(btnSize * 1.12)}px`,
              height: `${Math.round(btnSize * 1.12)}px`,
            }}
            className={`rounded-2xl border-2 text-xs font-extrabold tracking-tight transition-transform active:scale-95 flex flex-col items-center justify-center ${
              specialReady && player.specialCooldown <= 0
                ? 'border-amber-300 bg-amber-500 text-slate-950 shadow-lg'
                : 'border-slate-700 bg-[#121520]/80 text-slate-500'
            }`}
          >
            <span>SPEC</span>
            <span className="text-[10px] font-mono-num">
              {player.specialCooldown > 0
                ? `${Math.ceil(player.specialCooldown)}s`
                : `${Math.floor(player.specialMeter)}%`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
