/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArenaId,
  CombatInput,
  CombatSnapshot,
  FighterId,
  GameMode,
  GameSettings,
  MatchPhase,
  SaveProgress,
  ScreenRoute,
} from './types/game';
import { CAMPAIGN_STAGES, FIGHTER_ROSTER } from './data/fightersAndStages';
import {
  DEFAULT_SETTINGS,
  loadGameSettings,
  loadSaveProgress,
  persistGameSettings,
  persistSaveProgress,
  resetSaveProgress,
} from './services/saveSystem';
import { BgmMode, SoundCue, soundEngine } from './services/soundEngine';
import {
  CombatEngine,
  createCampaignMatchConfig,
  MatchStartConfig,
} from './game/combatEngine';
import { ThreeGameViewport } from './engine3d/ThreeGameViewport';
import { CombatHudOverlay } from './components/CombatHudOverlay';
import {
  CampaignLadderOverlay,
  CharacterSelectOverlay,
  MainMenuOverlay,
  SettingsOverlay,
} from './components/MenuScreens';

export default function App() {
  const [save, setSave] = useState<SaveProgress>(() => loadSaveProgress());
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [route, setRoute] = useState<ScreenRoute>(ScreenRoute.MAIN_MENU);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Character selection & preview state
  const [charSelectIntent, setCharSelectIntent] = useState<GameMode | 'SHOWCASE'>('SHOWCASE');
  const [selectedFighter, setSelectedFighter] = useState<FighterId>(
    () => loadSaveProgress().lastSelectedFighter
  );
  const [freeFightOpponent, setFreeFightOpponent] = useState<FighterId>(
    () => loadSaveProgress().lastFreeFightOpponent
  );
  const [freeFightArena, setFreeFightArena] = useState<ArenaId>(
    () => loadSaveProgress().lastFreeFightArena
  );
  const [previewYawRad, setPreviewYawRad] = useState<number>(0.32);
  const [previewVictory, setPreviewVictory] = useState<boolean>(false);

  // Persistent CombatEngine instance outside React render teardown
  const handleMatchCompleted = useCallback(
    (playerWon: boolean, config: MatchStartConfig, elapsedSec: number) => {
      setSave((prev) => {
        const next: SaveProgress = {
          ...prev,
          totalMatches: prev.totalMatches + 1,
          totalWins: prev.totalWins + (playerWon ? 1 : 0),
          completedStages: [...prev.completedStages],
          stageBestTimeSec: { ...prev.stageBestTimeSec },
        };

        if (playerWon && config.mode === GameMode.CAMPAIGN) {
          const isStageBoss = config.encounterIndex + 1 >= config.totalEncountersInStage;
          if (isStageBoss) {
            if (!next.completedStages.includes(config.stageNumber)) {
              next.completedStages.push(config.stageNumber);
              next.completedStages.sort((a, b) => a - b);
            }
            if (config.stageNumber >= next.unlockedStage && config.stageNumber < 6) {
              next.unlockedStage = config.stageNumber + 1;
            }
            const roundedSec = Math.max(1, Math.round(elapsedSec));
            const existingBest = next.stageBestTimeSec[config.stageNumber];
            if (!existingBest || roundedSec < existingBest) {
              next.stageBestTimeSec[config.stageNumber] = roundedSec;
            }
          }
        }

        persistSaveProgress(next);
        return next;
      });
    },
    []
  );

  const combatEngineRef = useRef<CombatEngine | null>(null);
  if (!combatEngineRef.current) {
    combatEngineRef.current = new CombatEngine(
      createCampaignMatchConfig(selectedFighter, 1, 0),
      handleMatchCompleted
    );
  }

  const [hudSnapshot, setHudSnapshot] = useState<CombatSnapshot>(() =>
    combatEngineRef.current!.getSnapshot()
  );

  // Sync audio engine with settings & active screen route
  useEffect(() => {
    soundEngine.applySettings(settings);
    persistGameSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (route !== ScreenRoute.COMBAT) {
      soundEngine.setBgmMode(BgmMode.MENU);
    }
  }, [route]);

  // Unlock Web Audio on first user pointer/key gesture
  useEffect(() => {
    const unlock = () => {
      soundEngine.unlockAudio();
      if (route !== ScreenRoute.COMBAT) {
        soundEngine.setBgmMode(BgmMode.MENU);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [route]);

  // Responsive Keyboard Controls (separated held keys vs edge-triggered actions + blur safety)
  useEffect(() => {
    const heldKeys = new Set<string>();

    const recomputeHeldMovement = () => {
      const eng = combatEngineRef.current;
      if (!eng) return;
      const left = heldKeys.has('KeyA') || heldKeys.has('ArrowLeft');
      const right = heldKeys.has('KeyD') || heldKeys.has('ArrowRight');
      eng.playerMoveDir = left && !right ? -1 : right && !left ? 1 : 0;
      eng.playerHoldingBlock = heldKeys.has('KeyS') || heldKeys.has('ArrowDown');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (settingsModalOpen) {
        if (e.code === 'Escape') setSettingsModalOpen(false);
        return;
      }

      if (route === ScreenRoute.MAIN_MENU) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundEngine.playCue(SoundCue.UI_CONFIRM);
          setRoute(ScreenRoute.CAMPAIGN_LADDER);
        }
        return;
      }

      if (route !== ScreenRoute.COMBAT) {
        if (e.code === 'Escape') {
          soundEngine.playCue(SoundCue.UI_SELECT);
          setRoute(ScreenRoute.MAIN_MENU);
        }
        return;
      }

      const eng = combatEngineRef.current;
      if (!eng) return;

      if (e.repeat) return;

      heldKeys.add(e.code);
      recomputeHeldMovement();

      switch (e.code) {
        case 'Escape':
        case 'KeyP': {
          const cur = eng.getSnapshot().phase;
          if (cur === MatchPhase.PAUSED) {
            eng.setPaused(false);
          } else if (
            cur === MatchPhase.FIGHTING ||
            cur === MatchPhase.INTRO_FACEOFF ||
            cur === MatchPhase.ROUND_ANNOUNCE
          ) {
            eng.setPaused(true);
          }
          setHudSnapshot({ ...eng.getSnapshot() });
          break;
        }
        case 'KeyW':
        case 'ArrowUp':
          eng.queuePlayerInput(CombatInput.JUMP);
          break;
        case 'KeyQ':
          eng.queuePlayerInput(CombatInput.DODGE_BACK);
          break;
        case 'KeyE':
          eng.queuePlayerInput(CombatInput.DODGE_FORWARD);
          break;
        case 'KeyJ':
          eng.queuePlayerInput(CombatInput.LIGHT_PUNCH);
          break;
        case 'KeyU':
          eng.queuePlayerInput(CombatInput.HEAVY_PUNCH);
          break;
        case 'KeyK':
          eng.queuePlayerInput(CombatInput.LIGHT_KICK);
          break;
        case 'KeyI':
          eng.queuePlayerInput(CombatInput.HEAVY_KICK);
          break;
        case 'KeyH':
          eng.queuePlayerInput(CombatInput.THROW);
          break;
        case 'KeyL':
          eng.queuePlayerInput(CombatInput.COUNTER);
          break;
        case 'Space':
          e.preventDefault();
          eng.queuePlayerInput(CombatInput.SPECIAL);
          break;
        case 'Digit1':
          eng.queuePlayerInput(CombatInput.DRAGON_FIRE);
          break;
        case 'Digit2':
          eng.queuePlayerInput(CombatInput.DRAGON_AERIAL);
          break;
        case 'Digit3':
          eng.queuePlayerInput(CombatInput.DRAGON_ULTIMATE);
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
      recomputeHeldMovement();
    };

    const clearHeld = () => {
      heldKeys.clear();
      const eng = combatEngineRef.current;
      if (eng) {
        eng.playerMoveDir = 0;
        eng.playerHoldingBlock = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [route, settingsModalOpen]);

  const launchMatch = (config: MatchStartConfig) => {
    const eng = combatEngineRef.current!;
    eng.playerMoveDir = 0;
    eng.playerHoldingBlock = false;
    eng.startMatch(config);
    setHudSnapshot({ ...eng.getSnapshot() });
    setRoute(ScreenRoute.COMBAT);
  };

  const handleSelectPlayerFighter = (id: FighterId) => {
    soundEngine.playCue(SoundCue.UI_SELECT);
    soundEngine.playFighterRoar(id, false);
    setSelectedFighter(id);
    setSave((prev) => {
      const next = { ...prev, lastSelectedFighter: id };
      persistSaveProgress(next);
      return next;
    });
  };

  const handleSelectFreeFightOpponent = (id: FighterId) => {
    soundEngine.playCue(SoundCue.UI_SELECT);
    setFreeFightOpponent(id);
    setSave((prev) => {
      const next = { ...prev, lastFreeFightOpponent: id };
      persistSaveProgress(next);
      return next;
    });
  };

  const handleSelectFreeFightArena = (arena: ArenaId) => {
    soundEngine.playCue(SoundCue.UI_SELECT);
    setFreeFightArena(arena);
    setSave((prev) => {
      const next = { ...prev, lastFreeFightArena: arena };
      persistSaveProgress(next);
      return next;
    });
  };

  const activeStageForShowcase =
    CAMPAIGN_STAGES.find((s) => s.stageNumber === save.unlockedStage)?.arenaId ??
    ArenaId.SAVANNA_CITADEL;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#090a0f]">
      {/* Isolated 60fps Three.js WebGL Game Viewport */}
      <ThreeGameViewport
        route={route}
        graphicsQuality={settings.graphicsQuality}
        selectedFighterId={selectedFighter}
        previewYawRad={previewYawRad}
        previewVictory={previewVictory}
        activeArenaId={activeStageForShowcase}
        combatEngineRef={combatEngineRef as React.MutableRefObject<CombatEngine>}
        onHudTick={setHudSnapshot}
      />

      {/* Screen Overlays */}
      {route === ScreenRoute.MAIN_MENU && (
        <MainMenuOverlay
          save={save}
          muted={settings.muted}
          onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
          onStartCampaign={() => {
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            setRoute(ScreenRoute.CAMPAIGN_LADDER);
          }}
          onStartFreeFight={() => {
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            setCharSelectIntent(GameMode.FREE_FIGHT);
            setRoute(ScreenRoute.CHARACTER_SELECT);
          }}
          onOpenCharacterSelect={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setCharSelectIntent('SHOWCASE');
            setRoute(ScreenRoute.CHARACTER_SELECT);
          }}
          onOpenSettings={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setSettingsModalOpen(true);
          }}
          onExitResetView={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
        />
      )}

      {route === ScreenRoute.CHARACTER_SELECT && (
        <CharacterSelectOverlay
          modeIntent={charSelectIntent}
          selectedPlayerId={selectedFighter}
          selectedOpponentId={freeFightOpponent}
          selectedArenaId={freeFightArena}
          previewYawRad={previewYawRad}
          previewVictory={previewVictory}
          onSelectPlayer={handleSelectPlayerFighter}
          onSelectOpponent={handleSelectFreeFightOpponent}
          onSelectArena={handleSelectFreeFightArena}
          onChangeYaw={setPreviewYawRad}
          onToggleVictoryPose={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setPreviewVictory((v) => !v);
          }}
          onConfirmProceed={() => {
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            if (charSelectIntent === GameMode.FREE_FIGHT) {
              const stageMeta = CAMPAIGN_STAGES.find((s) => s.arenaId === freeFightArena);
              launchMatch({
                mode: GameMode.FREE_FIGHT,
                playerFighterId: selectedFighter,
                opponentFighterId: freeFightOpponent,
                arenaId: freeFightArena,
                stageNumber: stageMeta?.stageNumber ?? 1,
                encounterIndex: 0,
                totalEncountersInStage: 1,
                stageTitle: `FREE FIGHT · ${
                  stageMeta?.locationSubtitle.toUpperCase() ?? 'ARENA'
                }`,
                aiDifficulty: settings.aiFreeFightDifficulty,
              });
            } else if (charSelectIntent === GameMode.CAMPAIGN) {
              setRoute(ScreenRoute.CAMPAIGN_LADDER);
            } else {
              setRoute(ScreenRoute.MAIN_MENU);
            }
          }}
          onBack={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setRoute(ScreenRoute.MAIN_MENU);
          }}
        />
      )}

      {route === ScreenRoute.CAMPAIGN_LADDER && (
        <CampaignLadderOverlay
          save={save}
          selectedFighterId={selectedFighter}
          onSelectStage={(stageNum) => {
            if (stageNum > save.unlockedStage) return;
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            launchMatch(createCampaignMatchConfig(selectedFighter, stageNum, 0));
          }}
          onChangeFighter={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setCharSelectIntent(GameMode.CAMPAIGN);
            setRoute(ScreenRoute.CHARACTER_SELECT);
          }}
          onBack={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setRoute(ScreenRoute.MAIN_MENU);
          }}
        />
      )}

      {route === ScreenRoute.COMBAT && (
        <CombatHudOverlay
          snapshot={hudSnapshot}
          settings={settings}
          onMoveDirChange={(dir) => {
            combatEngineRef.current!.playerMoveDir = dir;
          }}
          onBlockHeldChange={(held) => {
            combatEngineRef.current!.playerHoldingBlock = held;
          }}
          onCombatInput={(inp) => {
            combatEngineRef.current!.queuePlayerInput(inp);
          }}
          onTogglePause={() => {
            const eng = combatEngineRef.current!;
            eng.setPaused(eng.getSnapshot().phase !== MatchPhase.PAUSED);
            setHudSnapshot({ ...eng.getSnapshot() });
          }}
          onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
          onRestartMatch={() => {
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            const cfg = combatEngineRef.current!.getConfig();
            launchMatch(cfg);
          }}
          onNextEncounterOrStage={() => {
            soundEngine.playCue(SoundCue.UI_CONFIRM);
            const cfg = combatEngineRef.current!.getConfig();
            if (cfg.mode === GameMode.FREE_FIGHT) {
              setCharSelectIntent(GameMode.FREE_FIGHT);
              setRoute(ScreenRoute.CHARACTER_SELECT);
              return;
            }
            if (cfg.encounterIndex + 1 < cfg.totalEncountersInStage) {
              // Proceed from Stage Vanguard Encounter -> Stage Boss Encounter!
              launchMatch(
                createCampaignMatchConfig(
                  cfg.playerFighterId,
                  cfg.stageNumber,
                  cfg.encounterIndex + 1
                )
              );
            } else if (cfg.stageNumber < CAMPAIGN_STAGES.length) {
              // Proceed to Next Unlocked Stage!
              launchMatch(
                createCampaignMatchConfig(cfg.playerFighterId, cfg.stageNumber + 1, 0)
              );
            } else {
              // Stage 6 Final Boss defeated -> return to Campaign Trophy Ladder
              setRoute(ScreenRoute.CAMPAIGN_LADDER);
            }
          }}
          onOpenSettingsModal={() => setSettingsModalOpen(true)}
          onExitToMainMenu={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setRoute(ScreenRoute.MAIN_MENU);
          }}
        />
      )}

      {/* Settings & Android Control Customization Modal */}
      {settingsModalOpen && (
        <SettingsOverlay
          routeReturnLabel={route === ScreenRoute.COMBAT ? 'Done · Back to Pause' : 'Save & Close'}
          settings={settings}
          onUpdateSettings={setSettings}
          onResetControls={() =>
            setSettings((s) => ({
              ...s,
              touchControls: { ...DEFAULT_SETTINGS.touchControls },
            }))
          }
          onResetCampaignSave={() => {
            const fresh = resetSaveProgress();
            setSave(fresh);
          }}
          onClose={() => {
            soundEngine.playCue(SoundCue.UI_SELECT);
            setSettingsModalOpen(false);
          }}
        />
      )}
    </main>
  );
}
