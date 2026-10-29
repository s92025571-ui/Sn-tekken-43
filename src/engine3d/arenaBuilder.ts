import * as THREE from 'three';
import { ArenaId } from '../types/game';

export interface ArenaEnvironmentBundle {
  group: THREE.Group;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  keyLightColor: number;
  keyLightIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  rimLightColor: number;
  dispose: () => void;
}

function createStoneFloorTexture(
  baseHex: string,
  veinHex: string,
  ringHex: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle weathered stone noise
  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = i % 2 === 0 ? veinHex : '#000000';
    ctx.globalAlpha = 0.05 + Math.random() * 0.08;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 8, 2 + Math.random() * 5);
  }

  // Concentric martial arena rings
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = ringHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 145, 0, Math.PI * 2);
  ctx.stroke();

  // Radial masonry joints
  ctx.globalAlpha = 0.22;
  for (let a = 0; a < 12; a++) {
    const rad = (a / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(rad) * 55, 256 + Math.sin(rad) * 55);
    ctx.lineTo(256 + Math.cos(rad) * 248, 256 + Math.sin(rad) * 248);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function buildArenaEnvironment(
  arenaId: ArenaId,
  maxAnisotropy = 4
): ArenaEnvironmentBundle {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  let skyColor = 0x1e1612;
  let fogColor = 0x241914;
  let fogDensity = 0.022;
  let keyLightColor = 0xffedd5;
  let keyLightIntensity = 2.4;
  let hemiSkyColor = 0x93c5fd;
  let hemiGroundColor = 0x451a03;
  let rimLightColor = 0xf59e0b;

  let floorBase = '#292524';
  let floorVein = '#57534e';
  let floorRing = '#f59e0b';

  if (arenaId === ArenaId.SAVANNA_CITADEL) {
    skyColor = 0x2b1810;
    fogColor = 0x3b2114;
    fogDensity = 0.020;
    keyLightColor = 0xfde68a;
    keyLightIntensity = 2.6;
    hemiSkyColor = 0xfdba74;
    hemiGroundColor = 0x451a03;
    rimLightColor = 0xf59e0b;
    floorBase = '#443322';
    floorVein = '#785a3c';
    floorRing = '#fbbf24';
  } else if (arenaId === ArenaId.MIST_JUNGLE_RUINS) {
    skyColor = 0x0f1f1c;
    fogColor = 0x132a25;
    fogDensity = 0.025;
    keyLightColor = 0xd1fae5;
    keyLightIntensity = 2.3;
    hemiSkyColor = 0x6ee7b7;
    hemiGroundColor = 0x064e3b;
    rimLightColor = 0x34d399;
    floorBase = '#1f2924';
    floorVein = '#374b43';
    floorRing = '#34d399';
  } else if (arenaId === ArenaId.CRIMSON_BAMBOO_SHRINE) {
    skyColor = 0x161124;
    fogColor = 0x1e1530;
    fogDensity = 0.022;
    keyLightColor = 0xffedd5;
    keyLightIntensity = 2.35;
    hemiSkyColor = 0xa5b4fc;
    hemiGroundColor = 0x450a0a;
    rimLightColor = 0xf97316;
    floorBase = '#271f2b';
    floorVein = '#4c384e';
    floorRing = '#ef4444';
  } else if (arenaId === ArenaId.SUNKEN_SWAMP_FORTRESS) {
    skyColor = 0x0b1917;
    fogColor = 0x0f2420;
    fogDensity = 0.026;
    keyLightColor = 0xecfccb;
    keyLightIntensity = 2.25;
    hemiSkyColor = 0x5eead4;
    hemiGroundColor = 0x042f2e;
    rimLightColor = 0x10b981;
    floorBase = '#182622';
    floorVein = '#2d473e';
    floorRing = '#10b981';
  } else if (arenaId === ArenaId.SKY_AERIE_PEAK) {
    skyColor = 0x112238;
    fogColor = 0x1a3352;
    fogDensity = 0.018;
    keyLightColor = 0xf0f9ff;
    keyLightIntensity = 2.65;
    hemiSkyColor = 0x7dd3fc;
    hemiGroundColor = 0x1e293b;
    rimLightColor = 0x38bdf8;
    floorBase = '#334155';
    floorVein = '#64748b';
    floorRing = '#38bdf8';
  } else {
    // OBSIDIAN_DRAGON_VOLCANO
    skyColor = 0x180808;
    fogColor = 0x260b0b;
    fogDensity = 0.024;
    keyLightColor = 0xfed7aa;
    keyLightIntensity = 2.55;
    hemiSkyColor = 0xf87171;
    hemiGroundColor = 0x450a0a;
    rimLightColor = 0xef4444;
    floorBase = '#181416';
    floorVein = '#7f1d1d';
    floorRing = '#ef4444';
  }

  // Extended natural outer terrain floor (no floating box walls)
  const outerGroundMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: fogColor,
      roughness: 0.94,
      metalness: 0.05,
    })
  );
  const outerGround = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(75, 48)),
    outerGroundMat
  );
  outerGround.rotation.x = -Math.PI * 0.5;
  outerGround.position.y = -0.06;
  outerGround.receiveShadow = true;
  group.add(outerGround);

  // Main Sculpted Octagonal/Circular Combat Platform at Y=0
  const floorTex = createStoneFloorTexture(floorBase, floorVein, floorRing, maxAnisotropy);
  textures.push(floorTex);
  const arenaFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.58,
      metalness: 0.16,
    })
  );
  const platformMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(8.5, 9.2, 0.36, 36)),
    arenaFloorMat
  );
  platformMesh.position.y = -0.18;
  platformMesh.receiveShadow = true;
  group.add(platformMesh);

  // Beveled stone curb border ring
  const curbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: rimLightColor,
      roughness: 0.42,
      metalness: 0.65,
    })
  );
  const curbRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(8.42, 0.09, 10, 48)),
    curbMat
  );
  curbRing.rotation.x = Math.PI * 0.5;
  curbRing.position.y = 0.01;
  group.add(curbRing);

  // Background Architectural Landmarks & Natural Perimeter (-Z behind fighters, never blocking camera)
  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: floorBase,
      roughness: 0.78,
      metalness: 0.12,
    })
  );
  const flameEmissiveMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: rimLightColor,
      emissive: rimLightColor,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );

  // Colonade of 6 background pillars/monoliths with glowing braziers in semicircular arc behind stage
  for (let i = 0; i < 6; i++) {
    const frac = i / 5;
    const angle = THREE.MathUtils.lerp(-Math.PI * 0.42, Math.PI * 0.42, frac);
    const radius = 9.4;
    const px = Math.sin(angle) * radius;
    const pz = -Math.cos(angle) * radius - 1.2;

    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(px, 0, pz);

    const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.6, 0.95)), stoneMat);
    plinth.position.y = 0.3;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    pillarGroup.add(plinth);

    const colHeight = arenaId === ArenaId.CRIMSON_BAMBOO_SHRINE ? 3.8 : 4.4;
    const shaft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.38, colHeight, 12)),
      arenaId === ArenaId.CRIMSON_BAMBOO_SHRINE ? curbMat : stoneMat
    );
    shaft.position.y = 0.6 + colHeight * 0.5;
    shaft.castShadow = true;
    pillarGroup.add(shaft);

    // Brazier Bowl + Ember Core
    const bowl = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.52, 0.26, 0.34, 12)),
      curbMat
    );
    bowl.position.y = 0.6 + colHeight + 0.17;
    pillarGroup.add(bowl);

    const flame = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.28, 1)),
      flameEmissiveMat
    );
    flame.position.y = 0.6 + colHeight + 0.48;
    pillarGroup.add(flame);

    group.add(pillarGroup);
  }

  // Crimson Torii Crossbeam for Shrine Arena
  if (arenaId === ArenaId.CRIMSON_BAMBOO_SHRINE) {
    const kasagi = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.8, 0.34, 0.52)), curbMat);
    kasagi.position.set(0, 4.9, -9.8);
    group.add(kasagi);
    const nuki = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.6, 0.24, 0.38)), curbMat);
    nuki.position.set(0, 4.1, -9.8);
    group.add(nuki);
  }

  // Distant jagged mountain/crag silhouettes using InstancedMesh (>20 rocks)
  const cragCount = 28;
  const cragGeo = trackGeo(new THREE.ConeGeometry(2.8, 7.5, 6));
  const cragMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: fogColor,
      roughness: 0.92,
      metalness: 0.08,
    })
  );
  const cragInstances = new THREE.InstancedMesh(cragGeo, cragMat, cragCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < cragCount; i++) {
    const a = THREE.MathUtils.lerp(-Math.PI * 0.72, Math.PI * 0.72, i / (cragCount - 1));
    const dist = 18 + (i % 3) * 5.5;
    dummy.position.set(Math.sin(a) * dist, 2.2 + (i % 4) * 0.8, -Math.cos(a) * dist - 4);
    const s = 0.85 + ((i * 7) % 5) * 0.18;
    dummy.scale.set(s * 1.3, s, s);
    dummy.rotation.y = i * 0.7;
    dummy.updateMatrix();
    cragInstances.setMatrixAt(i, dummy.matrix);
  }
  cragInstances.instanceMatrix.needsUpdate = true;
  cragInstances.computeBoundingSphere();
  group.add(cragInstances);

  // Obsidian Volcano glowing magma river ring around platform
  if (arenaId === ArenaId.OBSIDIAN_DRAGON_VOLCANO) {
    const lavaRing = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(9.2, 13.5, 48)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xea580c,
          side: THREE.DoubleSide,
        })
      )
    );
    lavaRing.rotation.x = -Math.PI * 0.5;
    lavaRing.position.y = -0.04;
    group.add(lavaRing);
  }

  return {
    group,
    skyColor,
    fogColor,
    fogDensity,
    keyLightColor,
    keyLightIntensity,
    hemiSkyColor,
    hemiGroundColor,
    rimLightColor,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
