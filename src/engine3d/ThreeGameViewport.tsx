import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArenaId,
  CombatSnapshot,
  FighterAction,
  FighterId,
  GraphicsQuality,
  MatchPhase,
  ParticleKind,
  ScreenRoute,
} from '../types/game';
import { FIGHTER_ROSTER } from '../data/fightersAndStages';
import {
  ArticulatedFighterRig,
  createArticulatedFighterRig,
} from './characterFactory';
import { applyFighterAnimation, applyPreviewAnimation } from './skeletalAnimator';
import { ArenaEnvironmentBundle, buildArenaEnvironment } from './arenaBuilder';
import { CombatEngine } from '../game/combatEngine';

export interface ThreeGameViewportProps {
  route: ScreenRoute;
  graphicsQuality: GraphicsQuality;
  selectedFighterId: FighterId;
  previewYawRad: number;
  previewVictory: boolean;
  activeArenaId: ArenaId;
  combatEngineRef: React.MutableRefObject<CombatEngine>;
  onHudTick: (snapshot: CombatSnapshot) => void;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  age: number;
  maxLife: number;
  color: THREE.Color;
}

const MAX_PARTICLES = 140;

const _dummyObj = new THREE.Object3D();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.68)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ThreeGameViewport: React.FC<ThreeGameViewportProps> = ({
  route,
  graphicsQuality,
  selectedFighterId,
  previewYawRad,
  previewVictory,
  activeArenaId,
  combatEngineRef,
  onHudTick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so React UI updates never reset the WebGL context
  const stateRef = useRef({
    route,
    graphicsQuality,
    selectedFighterId,
    previewYawRad,
    previewVictory,
    activeArenaId,
    onHudTick,
  });

  useEffect(() => {
    stateRef.current = {
      route,
      graphicsQuality,
      selectedFighterId,
      previewYawRad,
      previewVictory,
      activeArenaId,
      onHudTick,
    };
  }, [
    route,
    graphicsQuality,
    selectedFighterId,
    previewYawRad,
    previewVictory,
    activeArenaId,
    onHudTick,
  ]);

  useEffect(() => {
    const mountEl = containerRef.current;
    if (!mountEl) return;

    const isSoftwareGl = detectSoftwareGl();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setSize(mountEl.clientWidth || window.innerWidth, mountEl.clientHeight || window.innerHeight);

    const applyQualitySettings = (q: GraphicsQuality) => {
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        return;
      }
      const dprCap = q === GraphicsQuality.LOW ? 1.0 : q === GraphicsQuality.MEDIUM ? 1.5 : 2.0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
      renderer.shadowMap.enabled = q !== GraphicsQuality.LOW;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    };
    applyQualitySettings(stateRef.current.graphicsQuality);

    renderer.domElement.className = 'block w-full h-full outline-none';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181210);
    scene.fog = new THREE.FogExp2(0x201512, 0.022);

    // Studio IBL via RoomEnvironment + PMREMGenerator (zero external HDR 404s)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      (mountEl.clientWidth || window.innerWidth) / (mountEl.clientHeight || window.innerHeight),
      0.1,
      140
    );
    camera.position.set(0, 1.9, 6.8);
    const currentLookAt = new THREE.Vector3(0, 1.15, 0);

    // 3-Point Arena Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfdba74, 0x451a03, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
    keyLight.position.set(5.5, 9.5, 6.5);
    keyLight.castShadow = !isSoftwareGl && stateRef.current.graphicsQuality !== GraphicsQuality.LOW;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 28;
    const d = 8.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.35);
    rimLight.position.set(-4.5, 5.2, -6.5);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Pre-build & cache all 6 Realistic 3D Animal Fighter Rigs (player & opponent slots)
    const playerRigs = new Map<FighterId, ArticulatedFighterRig>();
    const opponentRigs = new Map<FighterId, ArticulatedFighterRig>();
    const segCount = isSoftwareGl ? 12 : 16;

    for (const id of Object.values(FighterId)) {
      const pRig = createArticulatedFighterRig(id, segCount, maxAniso);
      const spec = FIGHTER_ROSTER[id];
      pRig.root.scale.setScalar(spec.heightScale);
      pRig.root.visible = false;
      scene.add(pRig.root);
      playerRigs.set(id, pRig);

      const oRig = createArticulatedFighterRig(id, segCount, maxAniso);
      oRig.root.scale.setScalar(spec.heightScale);
      oRig.root.visible = false;
      scene.add(oRig.root);
      opponentRigs.set(id, oRig);
    }

    // Grounded Contact Shadows beneath both fighters
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const shadowGeo = new THREE.PlaneGeometry(1.65, 1.25);
    const contactShadowP1 = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadowP1.rotation.x = -Math.PI * 0.5;
    contactShadowP1.position.y = 0.015;
    scene.add(contactShadowP1);

    const contactShadowP2 = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadowP2.rotation.x = -Math.PI * 0.5;
    contactShadowP2.position.y = 0.015;
    scene.add(contactShadowP2);

    // Dragon Fire Breath / Cataclysm Beam Volumetric Cone Mesh
    const dragonBeamGeo = new THREE.CylinderGeometry(0.18, 0.72, 4.6, 14, 1, true);
    dragonBeamGeo.rotateZ(-Math.PI * 0.5);
    dragonBeamGeo.translate(2.3, 0, 0);
    const dragonBeamMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const dragonBeamMesh = new THREE.Mesh(dragonBeamGeo, dragonBeamMat);
    dragonBeamMesh.visible = false;
    scene.add(dragonBeamMesh);

    // Pooled InstancedMesh Particle System (Sparks, Flames, Feathers, Lightning)
    const particlePool: PooledParticle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 0.08,
      age: 0,
      maxLife: 0.4,
      color: new THREE.Color(0xffffff),
    }));

    const particleGeo = new THREE.OctahedronGeometry(1, 0);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
    particleInstanced.frustumCulled = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      _dummyObj.position.set(0, -50, 0);
      _dummyObj.scale.setScalar(0.001);
      _dummyObj.updateMatrix();
      particleInstanced.setMatrixAt(i, _dummyObj.matrix);
      particleInstanced.setColorAt(i, new THREE.Color(0xffffff));
    }
    scene.add(particleInstanced);

    let particleCursor = 0;
    const spawnBurst = (
      kind: ParticleKind,
      wx: number,
      wy: number,
      wz: number,
      dirX: number,
      count: number
    ) => {
      for (let n = 0; n < count; n++) {
        const slot = particlePool[particleCursor];
        particleCursor = (particleCursor + 1) % MAX_PARTICLES;
        slot.active = true;
        slot.age = 0;
        slot.x = wx + (Math.random() - 0.5) * 0.25;
        slot.y = wy + (Math.random() - 0.5) * 0.28;
        slot.z = wz + (Math.random() - 0.5) * 0.25;

        const spread = 2.8;
        slot.vx = dirX * (2.5 + Math.random() * 4.5) + (Math.random() - 0.5) * spread;
        slot.vy = 1.2 + Math.random() * 3.8;
        slot.vz = (Math.random() - 0.5) * spread;
        slot.size = 0.06 + Math.random() * 0.08;
        slot.maxLife = 0.28 + Math.random() * 0.24;

        switch (kind) {
          case ParticleKind.BLOCK_SPARK:
            slot.color.setHex(0x38bdf8);
            break;
          case ParticleKind.HEAVY_IMPACT:
            slot.color.setHex(0xfef08a);
            slot.size = 0.11 + Math.random() * 0.09;
            break;
          case ParticleKind.ROYAL_GOLD_FLARE:
            slot.color.setHex(0xf59e0b);
            break;
          case ParticleKind.SEISMIC_SHOCKWAVE:
            slot.color.setHex(0xe2e8f0);
            slot.vy = 0.6 + Math.random() * 2.2;
            break;
          case ParticleKind.CRIMSON_FOX_TRAIL:
            slot.color.setHex(0xf97316);
            break;
          case ParticleKind.VENOM_WATER_SPLASH:
            slot.color.setHex(0x10b981);
            break;
          case ParticleKind.STORM_FEATHER_GALE:
            slot.color.setHex(0x7dd3fc);
            break;
          case ParticleKind.DRAGON_HELLFIRE:
            slot.color.setHex(Math.random() > 0.4 ? 0xf97316 : 0xef4444);
            slot.vx = dirX * (6.5 + Math.random() * 5.0);
            slot.vy = (Math.random() - 0.35) * 2.2;
            slot.size = 0.13 + Math.random() * 0.10;
            break;
          case ParticleKind.DRAGON_LIGHTNING:
            slot.color.setHex(0xc084fc);
            slot.size = 0.10 + Math.random() * 0.09;
            break;
          case ParticleKind.ULTIMATE_NOVA:
            slot.color.setHex(Math.random() > 0.5 ? 0xfef08a : 0xef4444);
            slot.size = 0.16 + Math.random() * 0.14;
            slot.maxLife = 0.48;
            break;
          case ParticleKind.DUST_PUFF:
            slot.color.setHex(0xa8a29e);
            slot.vy = 0.4 + Math.random() * 1.1;
            break;
          default:
            slot.color.setHex(0xfbbf24);
            break;
        }
      }
    };

    // Active Arena Environment Management
    let builtArenaId: ArenaId | null = null;
    let arenaBundle: ArenaEnvironmentBundle | null = null;
    let prevQuality = stateRef.current.graphicsQuality;

    const rebuildArenaIfNeeded = (targetArena: ArenaId) => {
      if (builtArenaId === targetArena && arenaBundle) return;
      if (arenaBundle) {
        scene.remove(arenaBundle.group);
        arenaBundle.dispose();
      }
      arenaBundle = buildArenaEnvironment(targetArena, maxAniso);
      builtArenaId = targetArena;
      scene.add(arenaBundle.group);

      scene.background = new THREE.Color(arenaBundle.skyColor);
      scene.fog = new THREE.FogExp2(arenaBundle.fogColor, arenaBundle.fogDensity);
      keyLight.color.setHex(arenaBundle.keyLightColor);
      keyLight.intensity = arenaBundle.keyLightIntensity;
      hemiLight.color.setHex(arenaBundle.hemiSkyColor);
      hemiLight.groundColor.setHex(arenaBundle.hemiGroundColor);
      rimLight.color.setHex(arenaBundle.rimLightColor);
    };

    rebuildArenaIfNeeded(stateRef.current.activeArenaId);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize Observer
    const handleResize = () => {
      const w = mountEl.clientWidth || window.innerWidth;
      const h = mountEl.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // WebGL Context Loss Safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const clock = new THREE.Clock();
    let frameId = 0;
    let hudEmitAccum = 0;

    // Paced software WebGL fence sync per Three.js skill directive
    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();
      const cur = stateRef.current;

      if (cur.graphicsQuality !== prevQuality) {
        prevQuality = cur.graphicsQuality;
        applyQualitySettings(cur.graphicsQuality);
        keyLight.castShadow = !isSoftwareGl && cur.graphicsQuality !== GraphicsQuality.LOW;
      }

      // Hide all rigs first, then enable active ones cleanly
      playerRigs.forEach((r) => {
        r.root.visible = false;
      });
      opponentRigs.forEach((r) => {
        r.root.visible = false;
      });
      dragonBeamMesh.visible = false;

      if (cur.route === ScreenRoute.COMBAT) {
        const snap = combatEngineRef.current.step(dt);
        rebuildArenaIfNeeded(snap.arenaId);

        const pRig = playerRigs.get(snap.player.id)!;
        const oRig = opponentRigs.get(snap.opponent.id)!;
        pRig.root.visible = true;
        oRig.root.visible = true;

        applyFighterAnimation(pRig, snap.player, elapsed);
        applyFighterAnimation(oRig, snap.opponent, elapsed);

        // Update contact shadows grounded at Y=0.015
        contactShadowP1.visible = true;
        contactShadowP2.visible = true;
        contactShadowP1.position.set(snap.player.x, 0.015, 0);
        contactShadowP1.scale.setScalar(Math.max(0.45, 1 - snap.player.y * 0.25));
        contactShadowP2.position.set(snap.opponent.x, 0.015, 0);
        contactShadowP2.scale.setScalar(Math.max(0.45, 1 - snap.opponent.y * 0.25));

        // Dragon Fire Breath / Ultimate Beam visual mesh
        const checkDragonBeam = (f: typeof snap.player) => {
          if (
            f.id === FighterId.DRAGON_BOSS &&
            (f.action === FighterAction.DRAGON_FIRE_BREATH ||
              f.action === FighterAction.DRAGON_ULTIMATE_CATACLYSM) &&
            f.stateTime >= 0.34 &&
            f.stateTime <= 0.78
          ) {
            dragonBeamMesh.visible = true;
            dragonBeamMesh.position.set(f.x + f.facing * 0.45, 1.52 + f.y, 0);
            dragonBeamMesh.scale.set(
              f.facing,
              f.action === FighterAction.DRAGON_ULTIMATE_CATACLYSM ? 1.65 : 1.0,
              1.0
            );
            dragonBeamMat.color.setHex(
              f.action === FighterAction.DRAGON_ULTIMATE_CATACLYSM ? 0xfef08a : 0xf97316
            );
          }
        };
        checkDragonBeam(snap.player);
        checkDragonBeam(snap.opponent);

        // Drain particle bursts from combat engine
        const bursts = combatEngineRef.current.drainParticles();
        for (const b of bursts) {
          spawnBurst(b.kind, b.x, b.y, b.z, b.dirX, b.count);
        }

        // Tekken-style fixed side-view framing keeping BOTH fighters clearly visible
        const midX = (snap.player.x + snap.opponent.x) * 0.5;
        const separation = Math.abs(snap.player.x - snap.opponent.x);
        const aspectFactor = camera.aspect < 1.3 ? 1.35 / Math.max(0.55, camera.aspect) : 1.0;

        if (snap.phase === MatchPhase.INTRO_FACEOFF) {
          // Brief cinematic face-off camera framing
          _targetCamPos.set(midX + Math.sin(elapsed * 0.8) * 0.4, 1.65, 5.2 * aspectFactor);
          _targetLookAt.set(midX, 1.25, 0);
        } else if (snap.phase === MatchPhase.MATCH_VICTORY || snap.phase === MatchPhase.MATCH_DEFEAT) {
          const winner = snap.phase === MatchPhase.MATCH_VICTORY ? snap.player : snap.opponent;
          _targetCamPos.set(winner.x + winner.facing * 0.65, 1.52, 4.1 * aspectFactor);
          _targetLookAt.set(winner.x, 1.28, 0);
        } else {
          const desiredZ = THREE.MathUtils.clamp((4.9 + separation * 0.56) * aspectFactor, 5.2, 10.6);
          _targetCamPos.set(midX, 1.82 + Math.max(snap.player.y, snap.opponent.y) * 0.25, desiredZ);
          _targetLookAt.set(midX, 1.18 + Math.max(snap.player.y, snap.opponent.y) * 0.22, 0);
        }

        // Smooth exponential camera damping + decaying hit shake
        const dampLambda = 9.5;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, dampLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, dampLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, dampLambda, dt);

        if (snap.cameraShake > 0.01) {
          camera.position.x += (Math.random() - 0.5) * snap.cameraShake * 0.24;
          camera.position.y += (Math.random() - 0.5) * snap.cameraShake * 0.22;
        }

        currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-11 * dt));
        camera.lookAt(currentLookAt);

        // Throttle React HUD state sync (~30Hz) while WebGL runs at native 60fps
        hudEmitAccum += dt;
        if (hudEmitAccum >= 0.032) {
          hudEmitAccum = 0;
          cur.onHudTick({
            ...snap,
            player: { ...snap.player },
            opponent: { ...snap.opponent },
          });
        }
      } else if (cur.route === ScreenRoute.CHARACTER_SELECT) {
        // Real 360-degree rotatable 3D character model preview in Fighter's Home Arena
        const fSpec = FIGHTER_ROSTER[cur.selectedFighterId];
        rebuildArenaIfNeeded(fSpec.homeArena);

        const pRig = playerRigs.get(cur.selectedFighterId)!;
        pRig.root.visible = true;
        applyPreviewAnimation(
          pRig,
          cur.selectedFighterId,
          cur.previewYawRad,
          elapsed,
          cur.previewVictory
        );
        // Position fighter slightly right-of-center on desktop so roster controls never occlude
        const offsetX = camera.aspect >= 1.25 ? 0.65 : 0;
        pRig.root.position.set(offsetX, 0, 0);

        contactShadowP1.visible = true;
        contactShadowP1.position.set(offsetX, 0.015, 0);
        contactShadowP1.scale.setScalar(1.05);
        contactShadowP2.visible = false;

        const aspectAdjust = camera.aspect < 1.1 ? 1.28 : 1.0;
        _targetCamPos.set(0, 1.38, 3.85 * aspectAdjust);
        _targetLookAt.set(0, 1.12, 0);
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-8 * dt));
        currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-8 * dt));
        camera.lookAt(currentLookAt);
      } else {
        // MAIN MENU / CAMPAIGN LADDER / SETTINGS: Live 3D Face-Off Showcase
        rebuildArenaIfNeeded(cur.activeArenaId);

        const heroP1 = playerRigs.get(cur.selectedFighterId)!;
        const rivalId =
          cur.selectedFighterId === FighterId.DRAGON_BOSS
            ? FighterId.LION_KING
            : FighterId.DRAGON_BOSS;
        const heroP2 = opponentRigs.get(rivalId)!;

        heroP1.root.visible = true;
        heroP2.root.visible = true;

        applyPreviewAnimation(heroP1, cur.selectedFighterId, Math.PI * 0.36, elapsed, false);
        heroP1.root.position.set(-1.35, 0, 0.25);

        applyPreviewAnimation(heroP2, rivalId, -Math.PI * 0.38, elapsed + 0.9, false);
        heroP2.root.position.set(1.45, 0, -0.15);

        contactShadowP1.visible = true;
        contactShadowP1.position.set(-1.35, 0.015, 0.25);
        contactShadowP2.visible = true;
        contactShadowP2.position.set(1.45, 0.015, -0.15);

        // Slow atmospheric camera pan around the face-off
        const orbitX = Math.sin(elapsed * 0.28) * 0.85;
        const aspectAdjust = camera.aspect < 1.15 ? 1.32 : 1.0;
        _targetCamPos.set(orbitX, 1.58, 5.25 * aspectAdjust);
        _targetLookAt.set(0.05, 1.22, 0);
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-5 * dt));
        currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-5 * dt));
        camera.lookAt(currentLookAt);
      }

      // Advance pooled 3D particles
      let anyParticleChanged = false;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const pt = particlePool[i];
        if (!pt.active) continue;
        anyParticleChanged = true;
        pt.age += dt;
        if (pt.age >= pt.maxLife) {
          pt.active = false;
          _dummyObj.position.set(0, -50, 0);
          _dummyObj.scale.setScalar(0.001);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        pt.vy -= 9.5 * dt;
        pt.x += pt.vx * dt;
        pt.y = Math.max(0.03, pt.y + pt.vy * dt);
        pt.z += pt.vz * dt;

        const lifeFrac = 1 - pt.age / pt.maxLife;
        _dummyObj.position.set(pt.x, pt.y, pt.z);
        _dummyObj.rotation.set(pt.age * 8, pt.age * 6, 0);
        _dummyObj.scale.setScalar(pt.size * lifeFrac);
        _dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, _dummyObj.matrix);
        particleInstanced.setColorAt(i, pt.color);
      }
      if (anyParticleChanged) {
        particleInstanced.instanceMatrix.needsUpdate = true;
        if (particleInstanced.instanceColor) {
          particleInstanced.instanceColor.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      if (arenaBundle) arenaBundle.dispose();
      envTarget.dispose();
      shadowTex.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      dragonBeamGeo.dispose();
      dragonBeamMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [combatEngineRef]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 w-full h-full bg-[#090a0f]"
      aria-label="SN TEKKEN 4 3D Arena Viewport"
    />
  );
};
