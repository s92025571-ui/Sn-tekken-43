import React from 'react';
import {
  ArenaId,
  FighterId,
  GameMode,
  SaveProgress,
  ScreenRoute,
} from '../types/game';
import { CAMPAIGN_STAGES, FIGHTER_ROSTER, ORDERED_FIGHTERS } from '../data/fightersAndStages';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  RotateCw,
  Settings,
  Swords,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface MainMenuOverlayProps {
  save: SaveProgress;
  muted: boolean;
  onToggleMute: () => void;
  onStartCampaign: () => void;
  onStartFreeFight: () => void;
  onOpenCharacterSelect: () => void;
  onOpenSettings: () => void;
  onExitResetView: () => void;
}

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  save,
  muted,
  onToggleMute,
  onStartCampaign,
  onStartFreeFight,
  onOpenCharacterSelect,
  onOpenSettings,
  onExitResetView,
}) => {
  const chosenSpec = FIGHTER_ROSTER[save.lastSelectedFighter];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-5 sm:p-8 bg-gradient-to-r from-black/85 via-black/35 to-transparent">
      {/* Top Bar: Bespoke Inline SVG Title Lockup + Audio & PWA Install */}
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-lg">
          <svg
            viewBox="0 0 460 92"
            className="w-64 sm:w-88 h-auto drop-shadow-lg"
            role="img"
            aria-label="SN TEKKEN 4"
          >
            <defs>
              <linearGradient id="snGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="snRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <text
              x="2"
              y="62"
              fill="#f8fafc"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontStyle="italic"
              fontSize="66"
              letterSpacing="2"
            >
              SN TEKKEN
            </text>
            <text
              x="318"
              y="66"
              fill="url(#snRed)"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontStyle="italic"
              fontSize="78"
            >
              4
            </text>
            <rect x="4" y="74" width="286" height="4" fill="url(#snGold)" rx="2" />
            <text
              x="300"
              y="81"
              fill="#fbbf24"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="11"
              letterSpacing="2.5"
            >
              ANIMAL WARRIORS
            </text>
          </svg>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-md">
            Active Champion: <span className="text-amber-300 font-semibold">{chosenSpec.name}</span> · Campaign Stage{' '}
            <span className="font-mono-num text-white font-semibold">{save.unlockedStage}/6</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 pointer-events-auto">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2.5 rounded-xl border border-slate-700 bg-[#121622]/90 text-slate-200 hover:text-white transition-colors"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Left-Aligned Main Menu Stack (keeps 70%+ of live 3D arena centerpiece unobstructed) */}
      <div className="my-auto w-full max-w-xs sm:max-w-sm flex flex-col gap-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={onStartCampaign}
          className="group w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-display font-extrabold text-xl tracking-wide hover:bg-amber-400 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5" />
            <span>CAMPAIGN</span>
          </span>
          <span className="text-xs font-mono-num font-bold opacity-80">
            STG {save.unlockedStage}/6
          </span>
        </button>

        <button
          type="button"
          onClick={onStartFreeFight}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-slate-700/90 bg-[#111521]/90 text-white font-display font-bold text-lg tracking-wide hover:border-amber-400/70 hover:bg-[#171d2e] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>FREE FIGHT</span>
          </span>
          <span className="text-xs text-slate-400 font-sans font-medium">All 6 Unlocked</span>
        </button>

        <button
          type="button"
          onClick={onOpenCharacterSelect}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-slate-700/90 bg-[#111521]/90 text-white font-display font-bold text-lg tracking-wide hover:border-amber-400/70 hover:bg-[#171d2e] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>CHARACTER SELECT</span>
          </span>
          <span className="text-xs text-slate-400 font-sans font-medium">3D Rotate</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-slate-700/90 bg-[#111521]/90 text-white font-display font-bold text-lg tracking-wide hover:border-amber-400/70 hover:bg-[#171d2e] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-slate-300" />
            <span>SETTINGS</span>
          </span>
          <span className="text-xs text-slate-400 font-sans font-medium">Controls · GFX</span>
        </button>

        <button
          type="button"
          onClick={onExitResetView}
          className="w-full flex items-center justify-between px-5 py-2.5 rounded-xl border border-slate-800 bg-[#0d1019]/85 text-slate-300 font-display font-bold text-base tracking-wide hover:text-white hover:border-slate-600 transition-colors"
        >
          <span>EXIT / STANDBY</span>
          <span className="text-xs text-slate-500 font-sans">Fullscreen Toggle</span>
        </button>
      </div>

      {/* Single Flat Control-Hint Footer Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Enter / Space Start Campaign · Touch or Keyboard Supported · 100% Offline Save</span>
        <span className="font-mono-num">
          Record: {save.totalWins}W / {save.totalMatches}M
        </span>
      </div>
    </div>
  );
};

interface CharacterSelectOverlayProps {
  modeIntent: GameMode | 'SHOWCASE';
  selectedPlayerId: FighterId;
  selectedOpponentId: FighterId;
  selectedArenaId: ArenaId;
  previewYawRad: number;
  previewVictory: boolean;
  onSelectPlayer: (id: FighterId) => void;
  onSelectOpponent: (id: FighterId) => void;
  onSelectArena: (id: ArenaId) => void;
  onChangeYaw: (yawRad: number) => void;
  onToggleVictoryPose: () => void;
  onConfirmProceed: () => void;
  onBack: () => void;
}

export const CharacterSelectOverlay: React.FC<CharacterSelectOverlayProps> = ({
  modeIntent,
  selectedPlayerId,
  selectedOpponentId,
  selectedArenaId,
  previewYawRad,
  previewVictory,
  onSelectPlayer,
  onSelectOpponent,
  onSelectArena,
  onChangeYaw,
  onToggleVictoryPose,
  onConfirmProceed,
  onBack,
}) => {
  const dragStartRef = React.useRef<{ x: number; startYaw: number } | null>(null);
  const spec = FIGHTER_ROSTER[selectedPlayerId];
  const oppSpec = FIGHTER_ROSTER[selectedOpponentId];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Interactive Drag Zone over 3D Viewport to rotate actual 3D character model */}
      <div
        className="fixed inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          dragStartRef.current = { x: e.clientX, startYaw: previewYawRad };
        }}
        onPointerMove={(e) => {
          if (!dragStartRef.current) return;
          const dx = e.clientX - dragStartRef.current.x;
          onChangeYaw(dragStartRef.current.startYaw + dx * 0.014);
        }}
        onPointerUp={() => {
          dragStartRef.current = null;
        }}
        onPointerCancel={() => {
          dragStartRef.current = null;
        }}
        title="Drag horizontally to rotate 3D fighter model"
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-[#111521]/90 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Main Menu</span>
        </button>

        <div className="text-center bg-[#0d1019]/80 px-4 py-1.5 rounded-xl border border-slate-800">
          <h1 className="font-display font-extrabold text-xl sm:text-2xl tracking-wider text-white">
            {modeIntent === GameMode.FREE_FIGHT
              ? 'FREE FIGHT · SELECT FIGHTERS & ARENA'
              : modeIntent === GameMode.CAMPAIGN
              ? 'CAMPAIGN · SELECT YOUR CHAMPION'
              : '3D WARRIOR ROSTER · DRAG MODEL TO ROTATE'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onToggleVictoryPose}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-[#141824]/90 text-xs font-semibold text-amber-300 hover:bg-[#1c2233] transition-colors whitespace-nowrap"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{previewVictory ? 'Stance Pose' : 'Victory Pose'}</span>
        </button>
      </div>

      {/* Left Fighter Stats Card (keeps right/center 3D model open and rotatable) */}
      <div className="relative z-10 my-auto w-full max-w-sm rounded-2xl border border-slate-700/80 bg-[#0e121d]/90 p-5 pointer-events-auto">
        <div className="text-xs font-semibold text-amber-400 tracking-wide">
          {spec.epithet}
        </div>
        <h2 className="font-display font-extrabold text-3xl text-white tracking-wide mt-0.5">
          {spec.name}
        </h2>
        <div className="text-xs text-slate-300 mt-1">
          Style: <span className="text-white font-medium">{spec.fightingStyle}</span>
        </div>
        <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{spec.bio}</p>

        {/* Stats Bars */}
        <div className="mt-4 space-y-2">
          {(
            [
              ['Power', spec.stats.power, 'bg-red-500'],
              ['Speed', spec.stats.speed, 'bg-amber-400'],
              ['Reach', spec.stats.reach, 'bg-cyan-400'],
              ['Defense', spec.stats.defense, 'bg-emerald-400'],
            ] as const
          ).map(([label, val, barColor]) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="w-14 text-slate-400">{label}</span>
              <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono-num text-slate-200">{val}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span>Signature: {spec.specialMoveName}</span>
          <span className="font-mono-num text-slate-400">{spec.maxHealth} HP</span>
        </div>

        {/* Free Fight Opponent & Arena Pickers */}
        {modeIntent === GameMode.FREE_FIGHT && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Opponent: <strong className="text-red-300">{oppSpec.shortName}</strong>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ORDERED_FIGHTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectOpponent(f.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold truncate border transition-colors ${
                      selectedOpponentId === f.id
                        ? 'border-red-400 bg-red-950/70 text-red-200'
                        : 'border-slate-700 bg-[#151a28] text-slate-300 hover:text-white'
                    }`}
                  >
                    {f.shortName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Arena Stage</label>
              <select
                value={selectedArenaId}
                onChange={(e) => onSelectArena(e.target.value as ArenaId)}
                className="w-full rounded-lg border border-slate-700 bg-[#151a28] px-2.5 py-1.5 text-xs text-white outline-none"
              >
                {CAMPAIGN_STAGES.map((st) => (
                  <option key={st.arenaId} value={st.arenaId}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dock: All 6 Unlocked Fighters + Rotation Slider + Confirm CTA */}
      <div className="relative z-10 w-full max-w-5xl mx-auto rounded-2xl border border-slate-700/90 bg-[#0d111c]/95 p-3 sm:p-4 pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full md:flex-1">
          {ORDERED_FIGHTERS.map((f) => {
            const active = f.id === selectedPlayerId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectPlayer(f.id)}
                className={`px-2.5 py-2 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-slate-800 bg-[#141927] text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-display font-bold text-sm leading-tight truncate">
                  {f.shortName}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {f.id === FighterId.DRAGON_BOSS ? 'Playable Boss' : `PWR ${f.stats.power}`}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">360° Spin</span>
            <input
              type="range"
              min={-3.14}
              max={3.14}
              step={0.02}
              value={((previewYawRad + Math.PI) % (Math.PI * 2)) - Math.PI}
              onChange={(e) => onChangeYaw(Number(e.target.value))}
              className="w-24 accent-amber-400"
              aria-label="Rotate 3D fighter preview"
            />
          </div>

          <button
            type="button"
            onClick={onConfirmProceed}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            {modeIntent === GameMode.FREE_FIGHT
              ? 'Start Free Fight'
              : modeIntent === GameMode.CAMPAIGN
              ? 'Continue to Campaign'
              : 'Select Champion'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CampaignLadderOverlayProps {
  save: SaveProgress;
  selectedFighterId: FighterId;
  onSelectStage: (stageNumber: number) => void;
  onChangeFighter: () => void;
  onBack: () => void;
}

export const CampaignLadderOverlay: React.FC<CampaignLadderOverlayProps> = ({
  save,
  selectedFighterId,
  onSelectStage,
  onChangeFighter,
  onBack,
}) => {
  const playerSpec = FIGHTER_ROSTER[selectedFighterId];

  return (
    <div className="fixed inset-0 z-10 pointer-events-auto flex flex-col justify-between p-4 sm:p-8 bg-black/75 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-[#121622] text-sm font-semibold text-slate-200 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Main Menu</span>
        </button>

        <div className="text-center">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-wider text-white">
            SIX-STAGE KING OF BEASTS CAMPAIGN
          </h1>
          <p className="text-xs text-slate-400">
            Defeat each arena vanguard and stage boss to unlock the next citadel.
          </p>
        </div>

        <button
          type="button"
          onClick={onChangeFighter}
          className="px-4 py-2 rounded-xl border border-amber-500/50 bg-[#161b2a] text-xs font-semibold text-amber-300 hover:bg-[#1e2538]"
        >
          Fighter: {playerSpec.shortName} (Change)
        </button>
      </div>

      {/* 6 Progressive Stages Grid */}
      <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMPAIGN_STAGES.map((stage) => {
          const isUnlocked = stage.stageNumber <= save.unlockedStage;
          const isCompleted = save.completedStages.includes(stage.stageNumber);
          const bossSpec = FIGHTER_ROSTER[stage.bossId];
          const bestTime = save.stageBestTimeSec[stage.stageNumber];

          return (
            <div
              key={stage.stageNumber}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
                isUnlocked
                  ? 'border-slate-700 bg-[#101420]/95'
                  : 'border-slate-800/80 bg-[#0b0e17]/80 opacity-65'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-mono-num font-semibold text-amber-400">
                    0{stage.stageNumber} · {stage.locationSubtitle}
                  </span>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cleared
                    </span>
                  ) : !isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  ) : (
                    <span className="text-amber-300 font-semibold">Available</span>
                  )}
                </div>

                <h2 className="mt-2 font-display font-extrabold text-xl text-white tracking-wide">
                  {stage.name}
                </h2>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  {stage.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>
                    Encounter 1:{' '}
                    <span className="text-slate-200">
                      {FIGHTER_ROSTER[stage.encounters[0].opponentId].shortName} ({stage.encounters[0].label})
                    </span>
                  </div>
                  <div>
                    Stage Boss:{' '}
                    <span className="text-red-300 font-semibold">{bossSpec.name}</span>
                  </div>
                  {bestTime && (
                    <div className="font-mono-num text-emerald-300">
                      Best Clear Time: {bestTime}s
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!isUnlocked}
                onClick={() => onSelectStage(stage.stageNumber)}
                className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isUnlocked
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isUnlocked ? `Enter Stage ${stage.stageNumber}` : `Clear Stage ${stage.stageNumber - 1} First`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-6xl w-full mx-auto text-xs text-slate-400 flex items-center justify-between">
        <span>Campaign progress saves automatically offline after every stage boss victory.</span>
        <span className="font-mono-num">Stages Cleared: {save.completedStages.length}/6</span>
      </div>
    </div>
  );
};

export interface SettingsScreenProps {
  routeReturnLabel: string;
  settings: import('../types/game').GameSettings;
  onUpdateSettings: (next: import('../types/game').GameSettings) => void;
  onResetControls: () => void;
  onResetCampaignSave: () => void;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsScreenProps> = ({
  routeReturnLabel,
  settings,
  onUpdateSettings,
  onResetControls,
  onResetCampaignSave,
  onClose,
}) => {
  const [confirmResetSave, setConfirmResetSave] = React.useState(false);
  const tc = settings.touchControls;

  const setTc = (patch: Partial<typeof tc>) => {
    onUpdateSettings({
      ...settings,
      touchControls: {
        ...tc,
        ...patch,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#0f131f] p-6 text-slate-100 my-auto">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-wide text-white">
              SETTINGS & ANDROID CONTROLS
            </h2>
            <p className="text-xs text-slate-400">
              All audio, graphics, vibration, and touch button layout settings persist offline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 hover:bg-amber-400 whitespace-nowrap"
          >
            {routeReturnLabel}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Audio, Graphics & Vibration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-300">Audio, Graphics & Device</h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Music Volume</span>
                <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, musicVolume: Number(e.target.value) })
                }
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Combat Sound Effects</span>
                <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sfxVolume: Number(e.target.value) })
                }
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Character Voice & Announcer</span>
                <span className="font-mono-num">{Math.round(settings.voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.voiceVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, voiceVolume: Number(e.target.value) })
                }
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Adaptive 3D Graphics Quality
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        graphicsQuality: q as import('../types/game').GraphicsQuality,
                      })
                    }
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      settings.graphicsQuality === q
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700 bg-[#151a28] text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Free Fight AI Challenge
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['Challenger', 0.42],
                    ['Veteran', 0.65],
                    ['Master', 0.90],
                  ] as const
                ).map(([lbl, val]) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, aiFreeFightDifficulty: val })
                    }
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      Math.abs(settings.aiFreeFightDifficulty - val) < 0.08
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-[#151a28] text-slate-400 hover:text-white'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Haptic Vibration Feedback</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    vibrationEnabled: !settings.vibrationEnabled,
                  })
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
                  settings.vibrationEnabled
                    ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {settings.vibrationEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Column 2: Mobile Touch Controls Position & Scale */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-300">
                Touch Button Layout & Size
              </h3>
              <button
                type="button"
                onClick={onResetControls}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Reset Layout
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Button & Stick Size</span>
                <span className="font-mono-num">{Math.round(tc.buttonScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={tc.buttonScale}
                onChange={(e) => setTc({ buttonScale: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Joystick Horizontal Margin</span>
                <span className="font-mono-num">{tc.dpadOffsetX}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={130}
                step={4}
                value={tc.dpadOffsetX}
                onChange={(e) => setTc({ dpadOffsetX: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Joystick Bottom Height</span>
                <span className="font-mono-num">{tc.dpadOffsetY}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={110}
                step={4}
                value={tc.dpadOffsetY}
                onChange={(e) => setTc({ dpadOffsetY: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Attack Pad Horizontal Margin</span>
                <span className="font-mono-num">{tc.buttonsOffsetX}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={130}
                step={4}
                value={tc.buttonsOffsetX}
                onChange={(e) => setTc({ buttonsOffsetX: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Attack Pad Bottom Height</span>
                <span className="font-mono-num">{tc.buttonsOffsetY}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={110}
                step={4}
                value={tc.buttonsOffsetY}
                onChange={(e) => setTc({ buttonsOffsetY: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <PWAInstallButton compact />
              {!confirmResetSave ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetSave(true)}
                  className="px-3 py-1.5 rounded-lg border border-red-900/60 text-xs text-red-300 hover:bg-red-950/50"
                >
                  Reset Save Data
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onResetCampaignSave();
                    setConfirmResetSave(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-xs font-bold text-white"
                >
                  Confirm Wipe Progress
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
