import React, { useState } from 'react';
import {
  CombatInput,
  CombatSnapshot,
  GameMode,
  GameSettings,
  MatchPhase,
} from '../types/game';
import { CAMPAIGN_STAGES, FIGHTER_ROSTER } from '../data/fightersAndStages';
import { MobileTouchControls } from './MobileTouchControls';
import { Pause, RotateCcw, Settings, Shield, Trophy, Volume2, VolumeX } from 'lucide-react';

interface CombatHudOverlayProps {
  snapshot: CombatSnapshot;
  settings: GameSettings;
  onMoveDirChange: (dir: number) => void;
  onBlockHeldChange: (held: boolean) => void;
  onCombatInput: (input: CombatInput) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onRestartMatch: () => void;
  onNextEncounterOrStage: () => void;
  onOpenSettingsModal: () => void;
  onExitToMainMenu: () => void;
}

export const CombatHudOverlay: React.FC<CombatHudOverlayProps> = ({
  snapshot,
  settings,
  onMoveDirChange,
  onBlockHeldChange,
  onCombatInput,
  onTogglePause,
  onToggleMute,
  onRestartMatch,
  onNextEncounterOrStage,
  onOpenSettingsModal,
  onExitToMainMenu,
}) => {
  const [showControlsGuide, setShowControlsGuide] = useState(false);

  const pSpec = FIGHTER_ROSTER[snapshot.player.id];
  const oSpec = FIGHTER_ROSTER[snapshot.opponent.id];

  const pHpPct = Math.max(0, Math.min(100, (snapshot.player.health / snapshot.player.maxHealth) * 100));
  const oHpPct = Math.max(0, Math.min(100, (snapshot.opponent.health / snapshot.opponent.maxHealth) * 100));

  const isCampaign = snapshot.mode === GameMode.CAMPAIGN;
  const hasMoreInCampaign =
    isCampaign &&
    (snapshot.encounterIndex + 1 < snapshot.totalEncountersInStage ||
      snapshot.stageNumber < CAMPAIGN_STAGES.length);

  const nextButtonLabel = !isCampaign
    ? 'New Free Fight'
    : snapshot.encounterIndex + 1 < snapshot.totalEncountersInStage
    ? 'Challenge Stage Boss'
    : snapshot.stageNumber < CAMPAIGN_STAGES.length
    ? `Proceed to Stage ${snapshot.stageNumber + 1}`
    : 'Campaign Complete · Play Again';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      {/* TOP PERIMETER HUD: Health Bars, Round Win Indicators, Timer, Special Meters, Stage Name */}
      <div className="w-full px-3 sm:px-6 pt-2.5 pb-2 bg-gradient-to-b from-black/85 via-black/45 to-transparent">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-2 sm:gap-4">
          {/* PLAYER 1 CLUSTER */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="font-display font-extrabold text-base sm:text-xl tracking-wide text-white truncate">
                {pSpec.shortName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono-num text-slate-300">
                  {Math.ceil(snapshot.player.health)}/{snapshot.player.maxHealth}
                </span>
                {/* Best-of-3 Round Win Diamonds */}
                <div className="flex items-center gap-1" aria-label="Player rounds won">
                  {[0, 1].map((idx) => (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rotate-45 border ${
                        snapshot.playerRoundsWon > idx
                          ? 'bg-amber-400 border-amber-200'
                          : 'bg-slate-900 border-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* P1 Health Bar */}
            <div className="h-3.5 sm:h-4 w-full rounded bg-[#141824] border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-sm transition-transform duration-100 origin-left ${
                  pHpPct <= 25
                    ? 'bg-red-500'
                    : pHpPct <= 55
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ transform: `scaleX(${pHpPct / 100})` }}
              />
            </div>

            {/* P1 Special Meter */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 max-w-[220px] rounded bg-[#111520] border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 origin-left transition-transform duration-75"
                  style={{ transform: `scaleX(${snapshot.player.specialMeter / 100})` }}
                />
              </div>
              <span className="text-[11px] font-mono-num text-cyan-300">
                SP {Math.floor(snapshot.player.specialMeter)}%
              </span>
            </div>
          </div>

          {/* CENTER ROUND CLOCK & CONTROLS */}
          <div className="flex flex-col items-center shrink-0 px-1 sm:px-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="pointer-events-auto p-1.5 rounded-lg bg-[#121622]/90 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label={settings.muted ? 'Unmute audio' : 'Mute audio'}
              >
                {settings.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <div className="px-3 py-1 rounded-lg bg-[#10131e]/95 border border-amber-500/40 text-center min-w-[58px]">
                <div className="font-mono-num font-bold text-xl sm:text-2xl leading-none text-amber-300">
                  {String(snapshot.roundTimer).padStart(2, '0')}
                </div>
              </div>

              <button
                type="button"
                onClick={onTogglePause}
                className="pointer-events-auto p-1.5 rounded-lg bg-[#121622]/90 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Pause match"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-slate-300 font-medium tracking-wide truncate max-w-[180px] sm:max-w-[260px]">
              R{snapshot.roundNumber} · {snapshot.stageTitle}
            </div>
          </div>

          {/* OPPONENT CLUSTER */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1" aria-label="Opponent rounds won">
                  {[0, 1].map((idx) => (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rotate-45 border ${
                        snapshot.opponentRoundsWon > idx
                          ? 'bg-red-500 border-red-200'
                          : 'bg-slate-900 border-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono-num text-slate-300">
                  {Math.ceil(snapshot.opponent.health)}/{snapshot.opponent.maxHealth}
                </span>
              </div>
              <span className="font-display font-extrabold text-base sm:text-xl tracking-wide text-white truncate">
                {oSpec.shortName}
              </span>
            </div>

            {/* Opponent Health Bar */}
            <div className="h-3.5 sm:h-4 w-full rounded bg-[#141824] border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-sm transition-transform duration-100 origin-right ${
                  oHpPct <= 25
                    ? 'bg-red-500'
                    : oHpPct <= 55
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ transform: `scaleX(${oHpPct / 100})` }}
              />
            </div>

            {/* Opponent Special Meter */}
            <div className="mt-1.5 flex items-center justify-end gap-2">
              <span className="text-[11px] font-mono-num text-orange-300">
                SP {Math.floor(snapshot.opponent.specialMeter)}%
              </span>
              <div className="h-2 flex-1 max-w-[220px] rounded bg-[#111520] border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-orange-400 origin-right transition-transform duration-75"
                  style={{ transform: `scaleX(${snapshot.opponent.specialMeter / 100})` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COMBO READOUTS & BOSS TELEGRAPH WARNING */}
        <div className="max-w-6xl mx-auto mt-2 flex items-center justify-between min-h-[28px]">
          <div>
            {snapshot.player.comboCount >= 2 && (
              <div className="font-display italic font-extrabold text-xl sm:text-2xl text-amber-300 tracking-wide">
                {snapshot.player.comboCount} HIT COMBO ·{' '}
                <span className="font-mono-num text-base not-italic text-white">
                  {snapshot.player.comboDamage} DMG
                </span>
              </div>
            )}
          </div>

          {snapshot.telegraphText && (
            <div className="px-3 py-1 rounded bg-red-950/90 border border-red-500/70 text-xs font-bold text-red-200 tracking-wider">
              {snapshot.telegraphText}
            </div>
          )}

          <div>
            {snapshot.opponent.comboCount >= 2 && (
              <div className="font-display italic font-extrabold text-xl sm:text-2xl text-red-400 tracking-wide">
                {snapshot.opponent.comboCount} HIT COMBO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER PHASE ANNOUNCEMENT BANNER (FACE-OFF / FIGHT! / K.O.!) */}
      {snapshot.bannerTitle &&
        snapshot.phase !== MatchPhase.PAUSED &&
        snapshot.phase !== MatchPhase.MATCH_VICTORY &&
        snapshot.phase !== MatchPhase.MATCH_DEFEAT && (
          <div className="self-center my-auto text-center px-6 py-3 rounded-xl bg-[#0b0e17]/85 border border-amber-500/40">
            <div className="font-display italic font-extrabold text-4xl sm:text-6xl tracking-wider text-amber-300">
              {snapshot.bannerTitle}
            </div>
            {snapshot.bannerSubtitle && (
              <div className="mt-1 text-xs sm:text-sm font-medium text-slate-300 tracking-wide">
                {snapshot.bannerSubtitle}
              </div>
            )}
          </div>
        )}

      {/* TOUCH CONTROLS WHEN FIGHTING */}
      {(snapshot.phase === MatchPhase.FIGHTING ||
        snapshot.phase === MatchPhase.ROUND_ANNOUNCE) && (
        <>
          <MobileTouchControls
            layout={settings.touchControls}
            player={snapshot.player}
            onMoveDirChange={onMoveDirChange}
            onBlockHeldChange={onBlockHeldChange}
            onCombatInput={onCombatInput}
          />
          {/* Subtle Desktop Keyboard Hint Line at Very Bottom Center */}
          <div className="hidden lg:block self-center mb-2 text-[11px] text-slate-400/90 bg-[#0b0d14]/75 px-3 py-1 rounded">
            A/D Move · W Jump · S Block · J/U Punch · K/I Kick · H Throw · L Counter · Space Special · Esc Pause
          </div>
        </>
      )}

      {/* PAUSE MODAL */}
      {snapshot.phase === MatchPhase.PAUSED && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#101420] p-6 text-slate-100">
            <h2 className="font-display font-extrabold text-3xl tracking-wide text-white">
              MATCH PAUSED
            </h2>
            <p className="mt-1 text-xs text-slate-400">{snapshot.stageTitle}</p>

            {showControlsGuide ? (
              <div className="mt-4 space-y-2 text-xs text-slate-300 border-t border-b border-slate-800 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Move / Jump</span>
                  <span className="font-mono-num">Left Stick or A / D / W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Block / Evade / Dash</span>
                  <span className="font-mono-num">BLK / EVD / DSH or S / Q / E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Light & Heavy Punches</span>
                  <span className="font-mono-num">LP / HP or J / U</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Light & Heavy Kicks</span>
                  <span className="font-mono-num">LK / HK or K / I</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unblockable Throw / Counter</span>
                  <span className="font-mono-num">THW / CTR or H / L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Special / Dragon Powers</span>
                  <span className="font-mono-num">SPEC or Space (1/2/3 Dragon)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowControlsGuide(false)}
                  className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Back to Pause Menu
                </button>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Resume Fight
                </button>
                <button
                  type="button"
                  onClick={onRestartMatch}
                  className="w-full rounded-xl border border-slate-700 bg-[#171c2b] py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#1e2538] transition-colors"
                >
                  Restart Match
                </button>
                <button
                  type="button"
                  onClick={() => setShowControlsGuide(true)}
                  className="w-full rounded-xl border border-slate-700 bg-[#171c2b] py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#1e2538] transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Controls & Moves</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSettingsModal}
                  className="w-full rounded-xl border border-slate-700 bg-[#171c2b] py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#1e2538] transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings & Button Layout</span>
                </button>
                <button
                  type="button"
                  onClick={onExitToMainMenu}
                  className="w-full rounded-xl border border-red-900/60 bg-red-950/40 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-950/70 transition-colors"
                >
                  Exit to Main Menu
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY / DEFEAT RESULTS OVERLAY (positioned lower-right/bottom so live 3D victory animation stays visible!) */}
      {(snapshot.phase === MatchPhase.MATCH_VICTORY ||
        snapshot.phase === MatchPhase.MATCH_DEFEAT) && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-auto">
          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-700/90 bg-[#0e121d]/95 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Trophy
                  className={`w-6 h-6 shrink-0 ${
                    snapshot.phase === MatchPhase.MATCH_VICTORY ? 'text-amber-400' : 'text-red-400'
                  }`}
                />
                <h2
                  className={`font-display italic font-extrabold text-3xl sm:text-4xl tracking-wide ${
                    snapshot.phase === MatchPhase.MATCH_VICTORY ? 'text-amber-300' : 'text-red-400'
                  }`}
                >
                  {snapshot.phase === MatchPhase.MATCH_VICTORY ? 'STAGE VICTORY' : 'MATCH DEFEAT'}
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-200 font-medium">
                {snapshot.bannerSubtitle}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono-num">
                <span>
                  Score {snapshot.playerRoundsWon} - {snapshot.opponentRoundsWon}
                </span>
                <span>·</span>
                <span>{snapshot.stageTitle}</span>
                {isCampaign && snapshot.phase === MatchPhase.MATCH_VICTORY && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400">
                      {snapshot.encounterIndex + 1 < snapshot.totalEncountersInStage
                        ? 'Boss Unlocked'
                        : snapshot.stageNumber < 6
                        ? `Stage ${snapshot.stageNumber + 1} Unlocked & Saved`
                        : 'Champion of SN TEKKEN 4!'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto shrink-0">
              {snapshot.phase === MatchPhase.MATCH_VICTORY && (isCampaign ? hasMoreInCampaign || snapshot.stageNumber === 6 : true) && (
                <button
                  type="button"
                  onClick={onNextEncounterOrStage}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
                >
                  {nextButtonLabel}
                </button>
              )}

              <button
                type="button"
                onClick={onRestartMatch}
                className="px-4 py-3 rounded-xl border border-slate-600 bg-[#171c2b] text-sm font-semibold text-white hover:bg-[#20273b] transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay</span>
              </button>

              <button
                type="button"
                onClick={onExitToMainMenu}
                className="px-4 py-3 rounded-xl border border-slate-700 bg-[#121622] text-sm font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
