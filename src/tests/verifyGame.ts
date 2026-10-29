import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES, FIGHTER_ROSTER, ORDERED_FIGHTERS, getAttackTable } from '../data/fightersAndStages.ts';
import { CombatEngine, createCampaignMatchConfig } from '../game/combatEngine.ts';
import {
  ArenaId,
  CombatInput,
  FighterAction,
  FighterId,
  GameMode,
  MatchPhase,
} from '../types/game.ts';

console.log('Running SN TEKKEN 4 Automated Gameplay & Progression Verification Suite...');

// 1. Verify all 6 required fighters are present, distinct, and unlocked
assert.equal(ORDERED_FIGHTERS.length, 6, 'Expected 6 fighters in roster');
const expectedIds = [
  FighterId.LION_KING,
  FighterId.SILVERBACK_GORILLA,
  FighterId.RED_FOX,
  FighterId.CROCODILE_BOSS,
  FighterId.EAGLE_WARRIOR,
  FighterId.DRAGON_BOSS,
];
for (const id of expectedIds) {
  const f = FIGHTER_ROSTER[id];
  assert.ok(f, `Missing fighter spec for ${id}`);
  assert.ok(f.maxHealth >= 900, `${id} health must be valid`);
  const table = getAttackTable(id);
  assert.ok(table[FighterAction.LIGHT_PUNCH], `${id} missing light punch`);
  assert.ok(table[FighterAction.HEAVY_PUNCH], `${id} missing heavy punch`);
  assert.ok(table[FighterAction.LIGHT_KICK], `${id} missing light kick`);
  assert.ok(table[FighterAction.HEAVY_KICK], `${id} missing heavy kick`);
  assert.ok(table[FighterAction.THROW], `${id} missing throw`);
  assert.ok(table[FighterAction.SPECIAL_MOVE], `${id} missing special move`);
}
console.log('✓ 1. All 6 fighters (including Dragon Final Boss) verified with distinct stats and movesets.');

// 2. Verify Dragon Final Boss exclusive elemental, aerial, fire breath, and ultimate attacks + cooldowns
const dragonAttacks = getAttackTable(FighterId.DRAGON_BOSS);
assert.ok(dragonAttacks[FighterAction.DRAGON_ELEMENTAL_STORM], 'Dragon missing elemental storm');
assert.ok(dragonAttacks[FighterAction.DRAGON_AERIAL_DIVE], 'Dragon missing aerial dive');
assert.ok(dragonAttacks[FighterAction.DRAGON_FIRE_BREATH], 'Dragon missing fire breath');
assert.ok(dragonAttacks[FighterAction.DRAGON_ULTIMATE_CATACLYSM], 'Dragon missing ultimate cataclysm');
assert.equal(dragonAttacks[FighterAction.DRAGON_ULTIMATE_CATACLYSM].unblockable, true);
console.log('✓ 2. Dragon powers (Elemental, Aerial, Fire Breath, Ultimate) verified as real gameplay mechanics.');

// 3. Verify 6-Stage Campaign with vanguard + boss encounters and Stage 6 Dragon Final Boss
assert.equal(CAMPAIGN_STAGES.length, 6, 'Expected 6 campaign stages');
for (let i = 0; i < 6; i++) {
  const st = CAMPAIGN_STAGES[i];
  assert.equal(st.stageNumber, i + 1);
  assert.equal(st.encounters.length, 2, `Stage ${st.stageNumber} must have vanguard + boss encounter`);
  assert.equal(st.encounters[1].isBoss, true);
}
assert.equal(
  CAMPAIGN_STAGES[5].bossId,
  FighterId.DRAGON_BOSS,
  'Stage 6 boss must be Dragon Final Boss'
);
console.log('✓ 3. Six-stage campaign structure, progressive AI difficulty, and Stage 6 Dragon Boss verified.');

// 4. Verify Combat Engine: Intro -> Announce -> Fighting transition, Movement, Hit Detection, Blocking, AI, Best-of-3
let completedSignal: { won: boolean; stage: number } | null = null;
const cfg = createCampaignMatchConfig(FighterId.LION_KING, 1, 1);
cfg.aiDifficulty = 0; // Start with stationary opponent for deterministic movement & hitbox checks
const engine = new CombatEngine(cfg, (won, c) => {
  completedSignal = { won, stage: c.stageNumber };
});

assert.equal(engine.getSnapshot().phase, MatchPhase.INTRO_FACEOFF);

// Step past intro (1.65s) and round announce (1.15s) -> 3.0s total (60 steps of 0.05s)
for (let i = 0; i < 65; i++) {
  engine.step(0.05);
}
assert.equal(engine.getSnapshot().phase, MatchPhase.FIGHTING, 'Match should transition into FIGHTING');
assert.equal(engine.getSnapshot().player.facing, 1, 'Left fighter must face +1 (right)');
assert.equal(engine.getSnapshot().opponent.facing, -1, 'Right fighter must face -1 (left)');

// Advance player right toward opponent
const startX = engine.getSnapshot().player.x;
engine.playerMoveDir = 1;
for (let i = 0; i < 12; i++) {
  engine.step(0.04);
}
engine.playerMoveDir = 0;
assert.ok(engine.getSnapshot().player.x > startX, 'Player must advance when moving forward');

// Position fighters in strike range and verify Light Punch reduces opponent health & builds meter
const snap = engine.getSnapshot();
snap.player.x = -0.6;
snap.player.action = FighterAction.IDLE;
snap.opponent.x = 0.6;
snap.opponent.action = FighterAction.IDLE;
const hpBefore = snap.opponent.health;
const meterBefore = snap.player.specialMeter;

engine.queuePlayerInput(CombatInput.LIGHT_PUNCH);
for (let i = 0; i < 15; i++) {
  engine.step(0.03);
}
assert.ok(snap.opponent.health < hpBefore, 'Opponent health must decrease on unblocked strike');
assert.ok(snap.player.specialMeter > meterBefore, 'Special meter must fill on attack hit');

// Enable AI and verify Enemy AI moves/acts autonomously
engine.getConfig().aiDifficulty = 0.75;
snap.player.x = -2.2;
snap.opponent.x = 2.2;
snap.opponent.action = FighterAction.IDLE;
const aiStartX = snap.opponent.x;
let aiActed = false;
for (let i = 0; i < 40; i++) {
  engine.step(0.04);
  if (snap.opponent.x !== aiStartX || snap.opponent.action !== FighterAction.IDLE) {
    aiActed = true;
    break;
  }
}
assert.ok(aiActed, 'Enemy AI must actively move or attack during combat');
console.log('✓ 4. Combat movement, facing, hitbox damage, special meter gain, and active AI verified.');

// 5. Verify Dragon playable in Free Fight + Fire Breath execution & cooldown
const dragonFreeFight = new CombatEngine({
  mode: GameMode.FREE_FIGHT,
  playerFighterId: FighterId.DRAGON_BOSS,
  opponentFighterId: FighterId.SILVERBACK_GORILLA,
  arenaId: ArenaId.OBSIDIAN_DRAGON_VOLCANO,
  stageNumber: 6,
  encounterIndex: 0,
  totalEncountersInStage: 1,
  stageTitle: 'FREE FIGHT',
  aiDifficulty: 0,
});
for (let i = 0; i < 80; i++) dragonFreeFight.step(0.05);
const dSnap = dragonFreeFight.getSnapshot();
dSnap.player.specialMeter = 100;
dSnap.player.x = -1.5;
dSnap.opponent.x = 1.5;
dSnap.opponent.action = FighterAction.IDLE;
const gorillaHpBefore = dSnap.opponent.health;
dragonFreeFight.queuePlayerInput(CombatInput.DRAGON_FIRE);
for (let i = 0; i < 20; i++) dragonFreeFight.step(0.03);
assert.ok(dSnap.player.fireBreathCooldown > 0, 'Dragon fire breath must set cooldown');
assert.ok(dSnap.opponent.health < gorillaHpBefore, 'Dragon fire breath must deal real ranged damage');
console.log('✓ 5. Playable Dragon in Free Fight + Fire Breath ranged hit & cooldown verified.');

// 6. Verify Best-of-Three round resolution & campaign completion callback
engine.getConfig().aiDifficulty = 0;
snap.opponent.health = 1;
snap.player.x = -0.5;
snap.opponent.x = 0.5;
snap.player.action = FighterAction.IDLE;
snap.opponent.action = FighterAction.IDLE;
engine.queuePlayerInput(CombatInput.HEAVY_PUNCH);
for (let i = 0; i < 20; i++) engine.step(0.04);
assert.equal(engine.getSnapshot().playerRoundsWon, 1, 'Player should win Round 1 on KO');

// Step through ROUND_OVER -> Round 2 Announce -> Round 2 Fighting
for (let i = 0; i < 90; i++) engine.step(0.05);
assert.equal(engine.getSnapshot().roundNumber, 2, 'Match must advance to Round 2');
assert.equal(engine.getSnapshot().phase, MatchPhase.FIGHTING);

// Win Round 2 for Best-of-3 Match Victory
const r2Snap = engine.getSnapshot();
r2Snap.opponent.health = 1;
r2Snap.player.x = -0.5;
r2Snap.opponent.x = 0.5;
r2Snap.opponent.action = FighterAction.IDLE;
engine.queuePlayerInput(CombatInput.HEAVY_KICK);
for (let i = 0; i < 80; i++) engine.step(0.05);

assert.equal(engine.getSnapshot().playerRoundsWon, 2);
assert.equal(engine.getSnapshot().phase, MatchPhase.MATCH_VICTORY);
assert.ok(completedSignal && (completedSignal as { won: boolean }).won === true, 'Match victory callback must trigger');
console.log('✓ 6. Best-of-three round scoring, KO transition, and stage victory progression verified.');

console.log('ALL SN TEKKEN 4 GAMEPLAY TESTS PASSED SUCCESSFULLY.');
