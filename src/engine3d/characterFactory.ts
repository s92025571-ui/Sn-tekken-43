import * as THREE from 'three';
import { FighterId } from '../types/game';
import {
  buildLoftedGeometry,
  buildTaperedSplineMesh,
  createFabricWeaveTexture,
  createFeatherTexture,
  createFurNormalMap,
  createFurTexture,
  createReptileScaleTexture,
} from './proceduralMaterialsAndMesh';

export interface ArticulatedFighterRig {
  fighterId: FighterId;
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  neckAndHead: THREE.Group;
  jaw: THREE.Group | null;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
  ankleL: THREE.Group;
  hipR: THREE.Group;
  kneeR: THREE.Group;
  ankleR: THREE.Group;
  tailBase: THREE.Group | null;
  wingL: THREE.Group | null;
  wingR: THREE.Group | null;
  hipBaseY: number;
  emissiveMaterials: THREE.MeshStandardMaterial[];
  flashMaterials: THREE.MeshStandardMaterial[];
}

interface FighterAnatomyRecipe {
  bodyWidth: number;
  chestDepth: number;
  shoulderSpan: number;
  armThickness: number;
  legThickness: number;
  torsoHeight: number;
  upperArmLen: number;
  forearmLen: number;
  thighLen: number;
  calfLen: number;
  ankleHeight: number;
  skinPrimary: THREE.MeshStandardMaterial;
  skinSecondary: THREE.MeshStandardMaterial;
  attirePrimary: THREE.MeshStandardMaterial;
  attireAccent: THREE.MeshStandardMaterial;
  clawMaterial: THREE.MeshStandardMaterial;
  eyeMaterial: THREE.MeshStandardMaterial;
}

export function createArticulatedFighterRig(
  fighterId: FighterId,
  radialSegments = 16,
  maxAnisotropy = 4
): ArticulatedFighterRig {
  const furNormal = createFurNormalMap();

  const goldMetal = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    metalness: 0.92,
    roughness: 0.2,
    clearcoat: 0.5,
  });

  const darkSteel = new THREE.MeshPhysicalMaterial({
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.28,
  });

  const ivoryClaw = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.26,
    metalness: 0.1,
  });

  const wrapsMat = new THREE.MeshStandardMaterial({
    map: createFabricWeaveTexture('#e2e8f0', '#94a3b8', maxAnisotropy),
    roughness: 0.82,
    metalness: 0.04,
  });

  let recipe: FighterAnatomyRecipe;
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];

  if (fighterId === FighterId.LION_KING) {
    const furTex = createFurTexture('#d97706', '#b45309', undefined, maxAnisotropy);
    const creamTex = createFurTexture('#fde68a', '#f59e0b', undefined, maxAnisotropy);
    const royalCape = new THREE.MeshStandardMaterial({
      map: createFabricWeaveTexture('#991b1b', '#f59e0b', maxAnisotropy),
      roughness: 0.68,
      metalness: 0.08,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.15,
    });
    emissiveMaterials.push(eyeMat);

    recipe = {
      bodyWidth: 1.08,
      chestDepth: 1.06,
      shoulderSpan: 0.31,
      armThickness: 1.08,
      legThickness: 1.05,
      torsoHeight: 0.54,
      upperArmLen: 0.33,
      forearmLen: 0.31,
      thighLen: 0.43,
      calfLen: 0.41,
      ankleHeight: 0.10,
      skinPrimary: new THREE.MeshStandardMaterial({
        map: furTex,
        normalMap: furNormal,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.72,
        metalness: 0.05,
      }),
      skinSecondary: new THREE.MeshStandardMaterial({
        map: creamTex,
        normalMap: furNormal,
        roughness: 0.76,
      }),
      attirePrimary: royalCape,
      attireAccent: goldMetal,
      clawMaterial: ivoryClaw,
      eyeMaterial: eyeMat,
    };
  } else if (fighterId === FighterId.SILVERBACK_GORILLA) {
    const darkFur = createFurTexture('#1e293b', '#0f172a', undefined, maxAnisotropy);
    const silverSaddle = createFurTexture('#cbd5e1', '#94a3b8', undefined, maxAnisotropy);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.2,
    });
    emissiveMaterials.push(eyeMat);

    recipe = {
      bodyWidth: 1.34,
      chestDepth: 1.28,
      shoulderSpan: 0.39,
      armThickness: 1.38,
      legThickness: 1.22,
      torsoHeight: 0.57,
      upperArmLen: 0.38,
      forearmLen: 0.37,
      thighLen: 0.40,
      calfLen: 0.38,
      ankleHeight: 0.10,
      skinPrimary: new THREE.MeshStandardMaterial({
        map: darkFur,
        normalMap: furNormal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.74,
        metalness: 0.06,
      }),
      skinSecondary: new THREE.MeshStandardMaterial({
        map: silverSaddle,
        normalMap: furNormal,
        roughness: 0.66,
        metalness: 0.12,
      }),
      attirePrimary: darkSteel,
      attireAccent: wrapsMat,
      clawMaterial: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
      eyeMaterial: eyeMat,
    };
  } else if (fighterId === FighterId.RED_FOX) {
    const russetFur = createFurTexture('#ea580c', '#c2410c', undefined, maxAnisotropy);
    const whiteFur = createFurTexture('#f8fafc', '#fed7aa', undefined, maxAnisotropy);
    const shinobiCloth = new THREE.MeshStandardMaterial({
      map: createFabricWeaveTexture('#1e1b4b', '#dc2626', maxAnisotropy),
      roughness: 0.65,
      metalness: 0.06,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf97316,
      emissiveIntensity: 0.75,
      roughness: 0.15,
    });
    emissiveMaterials.push(eyeMat);

    recipe = {
      bodyWidth: 0.86,
      chestDepth: 0.85,
      shoulderSpan: 0.25,
      armThickness: 0.84,
      legThickness: 0.90,
      torsoHeight: 0.49,
      upperArmLen: 0.30,
      forearmLen: 0.29,
      thighLen: 0.42,
      calfLen: 0.42,
      ankleHeight: 0.09,
      skinPrimary: new THREE.MeshStandardMaterial({
        map: russetFur,
        normalMap: furNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughness: 0.68,
      }),
      skinSecondary: new THREE.MeshStandardMaterial({
        map: whiteFur,
        normalMap: furNormal,
        roughness: 0.72,
      }),
      attirePrimary: shinobiCloth,
      attireAccent: new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.5,
        metalness: 0.15,
      }),
      clawMaterial: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25 }),
      eyeMaterial: eyeMat,
    };
  } else if (fighterId === FighterId.CROCODILE_BOSS) {
    const scales = createReptileScaleTexture('#065f46', '#10b981', '#064e3b', maxAnisotropy);
    const bellyScales = createReptileScaleTexture('#d9f99d', '#a3e635', '#65a30d', maxAnisotropy);
    const bronzeArmor = new THREE.MeshPhysicalMaterial({
      color: 0x92400e,
      metalness: 0.84,
      roughness: 0.32,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xbef264,
      emissive: 0x84cc16,
      emissiveIntensity: 0.85,
      roughness: 0.12,
    });
    emissiveMaterials.push(eyeMat);

    recipe = {
      bodyWidth: 1.22,
      chestDepth: 1.18,
      shoulderSpan: 0.35,
      armThickness: 1.18,
      legThickness: 1.20,
      torsoHeight: 0.55,
      upperArmLen: 0.34,
      forearmLen: 0.33,
      thighLen: 0.41,
      calfLen: 0.40,
      ankleHeight: 0.10,
      skinPrimary: new THREE.MeshPhysicalMaterial({
        map: scales.map,
        normalMap: scales.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.38,
        metalness: 0.12,
        clearcoat: 0.35,
        clearcoatRoughness: 0.28,
      }),
      skinSecondary: new THREE.MeshStandardMaterial({
        map: bellyScales.map,
        normalMap: bellyScales.normalMap,
        roughness: 0.48,
      }),
      attirePrimary: bronzeArmor,
      attireAccent: darkSteel,
      clawMaterial: ivoryClaw,
      eyeMaterial: eyeMat,
    };
  } else if (fighterId === FighterId.EAGLE_WARRIOR) {
    const brownFeathers = createFeatherTexture('#451a03', '#78350f', maxAnisotropy);
    const whitePlumage = createFeatherTexture('#f8fafc', '#e2e8f0', maxAnisotropy);
    const azureArmor = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.78,
      roughness: 0.26,
      clearcoat: 0.4,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    emissiveMaterials.push(eyeMat);

    recipe = {
      bodyWidth: 0.96,
      chestDepth: 0.98,
      shoulderSpan: 0.29,
      armThickness: 0.94,
      legThickness: 0.95,
      torsoHeight: 0.52,
      upperArmLen: 0.33,
      forearmLen: 0.32,
      thighLen: 0.44,
      calfLen: 0.43,
      ankleHeight: 0.10,
      skinPrimary: new THREE.MeshStandardMaterial({
        map: brownFeathers,
        roughness: 0.58,
        metalness: 0.08,
      }),
      skinSecondary: new THREE.MeshStandardMaterial({
        map: whitePlumage,
        roughness: 0.54,
        metalness: 0.06,
      }),
      attirePrimary: azureArmor,
      attireAccent: goldMetal,
      clawMaterial: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.32,
        metalness: 0.25,
      }),
      eyeMaterial: eyeMat,
    };
  } else {
    // DRAGON_BOSS
    const obsidianScales = createReptileScaleTexture('#18181b', '#7f1d1d', '#09090b', maxAnisotropy);
    const magmaPlates = createReptileScaleTexture('#dc2626', '#f97316', '#7f1d1d', maxAnisotropy);
    const magmaChestMat = new THREE.MeshStandardMaterial({
      map: magmaPlates.map,
      normalMap: magmaPlates.normalMap,
      emissive: new THREE.Color(0xdc2626),
      emissiveIntensity: 0.42,
      roughness: 0.36,
      metalness: 0.22,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf97316,
      emissiveIntensity: 1.35,
      roughness: 0.1,
    });
    emissiveMaterials.push(magmaChestMat, eyeMat);

    recipe = {
      bodyWidth: 1.24,
      chestDepth: 1.20,
      shoulderSpan: 0.36,
      armThickness: 1.16,
      legThickness: 1.18,
      torsoHeight: 0.58,
      upperArmLen: 0.36,
      forearmLen: 0.35,
      thighLen: 0.45,
      calfLen: 0.44,
      ankleHeight: 0.11,
      skinPrimary: new THREE.MeshPhysicalMaterial({
        map: obsidianScales.map,
        normalMap: obsidianScales.normalMap,
        normalScale: new THREE.Vector2(0.95, 0.95),
        roughness: 0.32,
        metalness: 0.35,
        clearcoat: 0.45,
      }),
      skinSecondary: magmaChestMat,
      attirePrimary: new THREE.MeshPhysicalMaterial({
        color: 0x7f1d1d,
        metalness: 0.85,
        roughness: 0.24,
      }),
      attireAccent: goldMetal,
      clawMaterial: new THREE.MeshStandardMaterial({
        color: 0xfca5a5,
        emissive: 0x991b1b,
        emissiveIntensity: 0.25,
        roughness: 0.22,
        metalness: 0.4,
      }),
      eyeMaterial: eyeMat,
    };
  }

  const root = new THREE.Group();
  const hipBaseY = recipe.thighLen + recipe.calfLen + recipe.ankleHeight - 0.03;

  // 1. PELVIS & MARTIAL WAR-BELT
  const pelvis = new THREE.Group();
  pelvis.position.set(0, hipBaseY, 0);
  root.add(pelvis);

  const pelvisGeo = buildLoftedGeometry(
    [
      { cy: -0.11, rx: 0.17 * recipe.bodyWidth, rzFront: 0.13 * recipe.chestDepth, rzBack: 0.15 * recipe.chestDepth },
      { cy: 0.0, rx: 0.20 * recipe.bodyWidth, rzFront: 0.15 * recipe.chestDepth, rzBack: 0.16 * recipe.chestDepth },
      { cy: 0.09, rx: 0.21 * recipe.bodyWidth, rzFront: 0.16 * recipe.chestDepth, rzBack: 0.15 * recipe.chestDepth },
    ],
    radialSegments
  );
  const pelvisMesh = new THREE.Mesh(pelvisGeo, recipe.attirePrimary);
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  pelvis.add(pelvisMesh);

  // Championship Belt Buckle (+Z front)
  const beltRing = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.215 * recipe.bodyWidth,
      0.212 * recipe.bodyWidth,
      0.065,
      radialSegments
    ),
    recipe.attireAccent
  );
  beltRing.scale.set(1, 1, 0.78);
  beltRing.position.set(0, 0.055, 0);
  beltRing.castShadow = true;
  pelvis.add(beltRing);

  // Front armored tasset / sash (+Z front)
  const frontSash = buildTaperedSplineMesh(
    [
      new THREE.Vector3(0, 0.05, 0.165 * recipe.chestDepth),
      new THREE.Vector3(0, -0.11, 0.185 * recipe.chestDepth),
      new THREE.Vector3(0, -0.26, 0.175 * recipe.chestDepth),
    ],
    0.055,
    0.032,
    8,
    8,
    recipe.attireAccent
  );
  frontSash.scale.set(1.5, 1, 0.32);
  pelvis.add(frontSash);

  // 2. MUSCULAR HUMANOID TORSO (+Y up, +Z chest)
  const torso = new THREE.Group();
  torso.position.set(0, 0.07, 0);
  pelvis.add(torso);

  const th = recipe.torsoHeight;
  const torsoGeo = buildLoftedGeometry(
    [
      { cy: -0.02, rx: 0.19 * recipe.bodyWidth, rzFront: 0.14 * recipe.chestDepth, rzBack: 0.14 * recipe.chestDepth },
      { cy: th * 0.28, rx: 0.22 * recipe.bodyWidth, rzFront: 0.16 * recipe.chestDepth, rzBack: 0.16 * recipe.chestDepth, muscleHarmonic2: 0.05 },
      { cy: th * 0.62, rx: 0.28 * recipe.bodyWidth, rzFront: 0.21 * recipe.chestDepth, rzBack: 0.19 * recipe.chestDepth, muscleHarmonic2: 0.08 },
      { cy: th * 0.86, rx: 0.30 * recipe.bodyWidth, rzFront: 0.20 * recipe.chestDepth, rzBack: 0.18 * recipe.chestDepth, muscleHarmonic2: 0.06 },
      { cy: th, cz: 0.015, rx: 0.14 * recipe.bodyWidth, rzFront: 0.13 * recipe.chestDepth, rzBack: 0.13 * recipe.chestDepth },
    ],
    radialSegments
  );
  const torsoMesh = new THREE.Mesh(torsoGeo, recipe.skinPrimary);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torso.add(torsoMesh);

  // Sculpted Pectoral / Ventral Plate (+Z chest)
  const chestPlastronGeo = buildLoftedGeometry(
    [
      { cy: th * 0.18, cz: 0.06 * recipe.chestDepth, rx: 0.13 * recipe.bodyWidth, rzFront: 0.11 * recipe.chestDepth, rzBack: 0.02 },
      { cy: th * 0.56, cz: 0.08 * recipe.chestDepth, rx: 0.21 * recipe.bodyWidth, rzFront: 0.15 * recipe.chestDepth, rzBack: 0.03, muscleHarmonic2: 0.09 },
      { cy: th * 0.88, cz: 0.05 * recipe.chestDepth, rx: 0.16 * recipe.bodyWidth, rzFront: 0.12 * recipe.chestDepth, rzBack: 0.02 },
    ],
    14
  );
  const chestMesh = new THREE.Mesh(
    chestPlastronGeo,
    fighterId === FighterId.SILVERBACK_GORILLA ? recipe.skinPrimary : recipe.skinSecondary
  );
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Silverback Gorilla iconic silver dorsal saddle on back (-Z)
  if (fighterId === FighterId.SILVERBACK_GORILLA) {
    const saddleGeo = buildLoftedGeometry(
      [
        { cy: th * 0.12, cz: -0.06, rx: 0.23, rzFront: 0.04, rzBack: 0.18 },
        { cy: th * 0.55, cz: -0.07, rx: 0.31, rzFront: 0.05, rzBack: 0.21 },
        { cy: th * 0.88, cz: -0.05, rx: 0.26, rzFront: 0.04, rzBack: 0.17 },
      ],
      14
    );
    const saddleMesh = new THREE.Mesh(saddleGeo, recipe.skinSecondary);
    saddleMesh.castShadow = true;
    torso.add(saddleMesh);
  }

  // Fighter-specific torso armor / pauldrons / mane collar
  if (fighterId === FighterId.LION_KING) {
    // Sculpted voluminous royal lion mane around neck & shoulders
    const maneGeo = buildLoftedGeometry(
      [
        { cy: th * 0.58, cz: -0.02, rx: 0.34, rzFront: 0.25, rzBack: 0.29, muscleHarmonic4: 0.08 },
        { cy: th * 0.88, cz: -0.01, rx: 0.36, rzFront: 0.26, rzBack: 0.32, muscleHarmonic4: 0.11 },
        { cy: th * 1.12, cz: -0.02, rx: 0.29, rzFront: 0.18, rzBack: 0.28, muscleHarmonic4: 0.09 },
      ],
      18
    );
    const maneMat = new THREE.MeshStandardMaterial({
      map: createFurTexture('#78350f', '#451a03', '#b45309', maxAnisotropy),
      normalMap: furNormal,
      roughness: 0.78,
    });
    const maneMesh = new THREE.Mesh(maneGeo, maneMat);
    maneMesh.castShadow = true;
    torso.add(maneMesh);

    // Royal shoulder pauldrons
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(
        new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
        goldMetal
      );
      pauldron.position.set(side * (recipe.shoulderSpan + 0.02), th * 0.86, 0);
      pauldron.rotation.z = -side * 0.35;
      pauldron.castShadow = true;
      torso.add(pauldron);
    }
  } else if (fighterId === FighterId.RED_FOX) {
    // Martial Gi Crossed Vest + Shoulder Sash
    for (const side of [-1, 1]) {
      const lapel = buildTaperedSplineMesh(
        [
          new THREE.Vector3(0, th * 0.08, 0.17),
          new THREE.Vector3(side * 0.11, th * 0.52, 0.18),
          new THREE.Vector3(side * 0.18, th * 0.92, 0.04),
        ],
        0.045,
        0.038,
        8,
        8,
        recipe.attirePrimary
      );
      torso.add(lapel);
    }
  } else if (fighterId === FighterId.CROCODILE_BOSS) {
    // Dorsal osteoderm ridge scutes down the spine (-Z)
    for (let i = 0; i < 4; i++) {
      const yOff = th * (0.22 + i * 0.2);
      const scute = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.11, 6), recipe.skinPrimary);
      scute.position.set(0, yOff, -0.22 * recipe.chestDepth);
      scute.rotation.x = -Math.PI * 0.45;
      scute.castShadow = true;
      torso.add(scute);
    }
    // Heavy gladiator shoulder harness
    const chestBand = buildTaperedSplineMesh(
      [
        new THREE.Vector3(-0.31, th * 0.85, 0.04),
        new THREE.Vector3(0, th * 0.48, 0.25),
        new THREE.Vector3(0.31, th * 0.85, 0.04),
      ],
      0.036,
      0.036,
      10,
      8,
      recipe.attirePrimary
    );
    torso.add(chestBand);
  } else if (fighterId === FighterId.EAGLE_WARRIOR) {
    // Winged Sky-Sentinel Breastplate
    for (const side of [-1, 1]) {
      const wingPlate = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.26, 8),
        recipe.attirePrimary
      );
      wingPlate.scale.set(1.2, 1, 0.35);
      wingPlate.position.set(side * 0.14, th * 0.64, 0.18);
      wingPlate.rotation.z = -side * 0.45;
      wingPlate.castShadow = true;
      torso.add(wingPlate);
    }
  }

  // 3. NECK & SPECIES-ACCURATE HEAD (+Z muzzle/beak/eyes)
  const neckAndHead = new THREE.Group();
  neckAndHead.position.set(0, th * 0.94, 0.02);
  torso.add(neckAndHead);

  const jaw = buildSpeciesHead(fighterId, neckAndHead, recipe, radialSegments, furNormal, maxAnisotropy);

  // 4. ARMS, FOREARMS & CONNECTED HANDS/CLAWS
  const buildArmChain = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * recipe.shoulderSpan, th * 0.84, 0);
    torso.add(shoulder);

    // Deltoid + Bicep/Tricep loft extending -Y from joint (0,0,0)
    const uLen = recipe.upperArmLen;
    const upperGeo = buildLoftedGeometry(
      [
        { cy: 0.05, rx: 0.088 * recipe.armThickness, rzFront: 0.088 * recipe.armThickness, rzBack: 0.088 * recipe.armThickness },
        { cy: -uLen * 0.28, rx: 0.098 * recipe.armThickness, rzFront: 0.102 * recipe.armThickness, rzBack: 0.094 * recipe.armThickness, muscleHarmonic2: 0.06 },
        { cy: -uLen * 0.72, rx: 0.082 * recipe.armThickness, rzFront: 0.086 * recipe.armThickness, rzBack: 0.080 * recipe.armThickness },
        { cy: -uLen, rx: 0.068 * recipe.armThickness, rzFront: 0.068 * recipe.armThickness, rzBack: 0.068 * recipe.armThickness },
      ],
      12
    );
    const upperMesh = new THREE.Mesh(upperGeo, recipe.skinPrimary);
    upperMesh.castShadow = true;
    shoulder.add(upperMesh);

    const elbow = new THREE.Group();
    elbow.position.set(0, -uLen + 0.015, 0);
    shoulder.add(elbow);

    const fLen = recipe.forearmLen;
    const forearmGeo = buildLoftedGeometry(
      [
        { cy: 0.03, rx: 0.072 * recipe.armThickness, rzFront: 0.072 * recipe.armThickness, rzBack: 0.072 * recipe.armThickness },
        { cy: -fLen * 0.35, rx: 0.082 * recipe.armThickness, rzFront: 0.082 * recipe.armThickness, rzBack: 0.078 * recipe.armThickness },
        { cy: -fLen * 0.85, rx: 0.062 * recipe.armThickness, rzFront: 0.062 * recipe.armThickness, rzBack: 0.058 * recipe.armThickness },
        // Connected Fighter Fist / Clawed Gauntlet
        { cy: -fLen - 0.04, cz: 0.016, rx: 0.078 * recipe.armThickness, rzFront: 0.082 * recipe.armThickness, rzBack: 0.068 * recipe.armThickness },
        { cy: -fLen - 0.10, cz: 0.020, rx: 0.068 * recipe.armThickness, rzFront: 0.072 * recipe.armThickness, rzBack: 0.058 * recipe.armThickness },
      ],
      12
    );
    const forearmMesh = new THREE.Mesh(forearmGeo, recipe.skinPrimary);
    forearmMesh.castShadow = true;
    elbow.add(forearmMesh);

    // Fitted Bracer / Combat Glove Wrap around wrist
    const bracerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.076 * recipe.armThickness,
        0.068 * recipe.armThickness,
        fLen * 0.48,
        12
      ),
      fighterId === FighterId.LION_KING || fighterId === FighterId.DRAGON_BOSS
        ? recipe.attireAccent
        : wrapsMat
    );
    bracerMesh.position.set(0, -fLen * 0.65, 0);
    bracerMesh.castShadow = true;
    elbow.add(bracerMesh);

    // Sharp anatomical knuckles / claws facing +Z
    for (const fx of [-0.038, -0.013, 0.013, 0.038]) {
      const claw = buildTaperedSplineMesh(
        [
          new THREE.Vector3(fx * recipe.armThickness, -fLen - 0.08, 0.058 * recipe.armThickness),
          new THREE.Vector3(fx * recipe.armThickness, -fLen - 0.135, 0.086 * recipe.armThickness),
        ],
        0.012,
        0.003,
        4,
        6,
        recipe.clawMaterial
      );
      elbow.add(claw);
    }

    return { shoulder, elbow };
  };

  const armL = buildArmChain(1);
  const armR = buildArmChain(-1);

  // 5. LEGS, SHINS & GROUNDED FEET/TALONS
  const buildLegChain = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125 * recipe.bodyWidth, -0.03, 0);
    pelvis.add(hip);

    const tLen = recipe.thighLen;
    const thighGeo = buildLoftedGeometry(
      [
        { cy: 0.05, rx: 0.115 * recipe.legThickness, rzFront: 0.115 * recipe.legThickness, rzBack: 0.115 * recipe.legThickness },
        { cy: -tLen * 0.38, rx: 0.132 * recipe.legThickness, rzFront: 0.136 * recipe.legThickness, rzBack: 0.128 * recipe.legThickness, muscleHarmonic2: 0.05 },
        { cy: -tLen * 0.78, rx: 0.106 * recipe.legThickness, rzFront: 0.108 * recipe.legThickness, rzBack: 0.104 * recipe.legThickness },
        { cy: -tLen, rx: 0.088 * recipe.legThickness, rzFront: 0.090 * recipe.legThickness, rzBack: 0.086 * recipe.legThickness },
      ],
      12
    );
    const thighMesh = new THREE.Mesh(thighGeo, recipe.attirePrimary);
    thighMesh.castShadow = true;
    hip.add(thighMesh);

    const knee = new THREE.Group();
    knee.position.set(0, -tLen + 0.015, 0);
    hip.add(knee);

    const cLen = recipe.calfLen;
    const calfGeo = buildLoftedGeometry(
      [
        { cy: 0.03, rx: 0.088 * recipe.legThickness, rzFront: 0.088 * recipe.legThickness, rzBack: 0.088 * recipe.legThickness },
        { cy: -cLen * 0.34, rx: 0.096 * recipe.legThickness, rzFront: 0.088 * recipe.legThickness, rzBack: 0.105 * recipe.legThickness },
        { cy: -cLen * 0.78, rx: 0.072 * recipe.legThickness, rzFront: 0.072 * recipe.legThickness, rzBack: 0.074 * recipe.legThickness },
        { cy: -cLen, rx: 0.064 * recipe.legThickness, rzFront: 0.066 * recipe.legThickness, rzBack: 0.064 * recipe.legThickness },
      ],
      12
    );
    const calfMesh = new THREE.Mesh(
      calfGeo,
      fighterId === FighterId.EAGLE_WARRIOR ? recipe.clawMaterial : recipe.skinPrimary
    );
    calfMesh.castShadow = true;
    knee.add(calfMesh);

    // Fitted Shin Greave / Wrap
    const greave = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.084 * recipe.legThickness,
        0.070 * recipe.legThickness,
        cLen * 0.45,
        12
      ),
      fighterId === FighterId.RED_FOX ? wrapsMat : recipe.attireAccent
    );
    greave.position.set(0, -cLen * 0.62, 0.01);
    greave.castShadow = true;
    knee.add(greave);

    const ankle = new THREE.Group();
    ankle.position.set(0, -cLen + 0.01, 0);
    knee.add(ankle);

    // Anatomically grounded paw/talon/foot extending +Z forward with flat sole at -ankleHeight
    const aH = recipe.ankleHeight;
    const footGeo = buildLoftedGeometry(
      [
        { cy: 0.02, cz: 0.0, rx: 0.068 * recipe.legThickness, rzFront: 0.075, rzBack: 0.068 },
        { cy: -aH * 0.55, cz: 0.055, rx: 0.084 * recipe.legThickness, rzFront: 0.125, rzBack: 0.075 },
        { cy: -aH, cz: 0.075, rx: 0.088 * recipe.legThickness, rzFront: 0.145, rzBack: 0.080 },
      ],
      12
    );
    const footMesh = new THREE.Mesh(
      footGeo,
      fighterId === FighterId.EAGLE_WARRIOR ? recipe.clawMaterial : recipe.skinPrimary
    );
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    ankle.add(footMesh);

    // Front Toe Claws (+Z)
    for (const tx of [-0.042, 0, 0.042]) {
      const toeClaw = buildTaperedSplineMesh(
        [
          new THREE.Vector3(tx * recipe.legThickness, -aH * 0.72, 0.18),
          new THREE.Vector3(tx * recipe.legThickness, -aH * 0.96, 0.245),
        ],
        0.015,
        0.004,
        4,
        6,
        recipe.clawMaterial
      );
      ankle.add(toeClaw);
    }

    return { hip, knee, ankle };
  };

  const legL = buildLegChain(1);
  const legR = buildLegChain(-1);

  // 6. TAILS & DRAGON/EAGLE WINGS
  let tailBase: THREE.Group | null = null;
  if (fighterId !== FighterId.SILVERBACK_GORILLA) {
    tailBase = new THREE.Group();
    tailBase.position.set(0, -0.02, -0.14 * recipe.chestDepth);
    pelvis.add(tailBase);

    if (fighterId === FighterId.RED_FOX) {
      // Lush Bushy Kitsune Tail with white tip
      const bushyGeo = buildLoftedGeometry(
        [
          { cy: 0, cz: 0, rx: 0.055, rzFront: 0.055, rzBack: 0.055 },
          { cy: -0.08, cz: -0.22, rx: 0.135, rzFront: 0.135, rzBack: 0.135 },
          { cy: 0.02, cz: -0.48, rx: 0.155, rzFront: 0.155, rzBack: 0.155 },
          { cy: 0.18, cz: -0.68, rx: 0.095, rzFront: 0.095, rzBack: 0.095 },
          { cy: 0.30, cz: -0.78, rx: 0.025, rzFront: 0.025, rzBack: 0.025 },
        ],
        12
      );
      const foxTail = new THREE.Mesh(bushyGeo, recipe.skinPrimary);
      foxTail.castShadow = true;
      tailBase.add(foxTail);

      const whiteTip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 10), recipe.skinSecondary);
      whiteTip.position.set(0, 0.27, -0.75);
      whiteTip.rotation.x = -0.75;
      tailBase.add(whiteTip);
    } else if (fighterId === FighterId.CROCODILE_BOSS || fighterId === FighterId.DRAGON_BOSS) {
      // Heavy Armored Reptilian / Draconic Sweeping Tail
      const heavyTail = buildTaperedSplineMesh(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.16, -0.34),
          new THREE.Vector3(0, -0.24, -0.72),
          new THREE.Vector3(0, -0.16, -1.12),
          new THREE.Vector3(0, -0.04, -1.42),
        ],
        0.135,
        0.022,
        14,
        10,
        recipe.skinPrimary
      );
      tailBase.add(heavyTail);

      // Tail ridge scutes
      for (let s = 1; s <= 4; s++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.036, 0.095, 5),
          fighterId === FighterId.DRAGON_BOSS ? recipe.skinSecondary : recipe.skinPrimary
        );
        spike.position.set(0, -0.12 - (s === 2 ? 0.08 : 0), -0.26 * s);
        spike.rotation.x = -0.3;
        tailBase.add(spike);
      }
    } else if (fighterId === FighterId.LION_KING) {
      const lionTail = buildTaperedSplineMesh(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.18, -0.28),
          new THREE.Vector3(0, -0.12, -0.56),
          new THREE.Vector3(0, 0.06, -0.72),
        ],
        0.036,
        0.022,
        10,
        8,
        recipe.skinPrimary
      );
      tailBase.add(lionTail);
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.15, 8), recipe.attirePrimary);
      tuft.position.set(0, 0.09, -0.75);
      tuft.rotation.x = -1.1;
      tailBase.add(tuft);
    } else if (fighterId === FighterId.EAGLE_WARRIOR) {
      // Fan of Tail Feathers
      for (let f = -2; f <= 2; f++) {
        const feather = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, 0.015, 0.38),
          f % 2 === 0 ? recipe.skinSecondary : recipe.skinPrimary
        );
        feather.position.set(f * 0.048, -0.06, -0.18);
        feather.rotation.y = f * 0.14;
        feather.rotation.x = -0.32;
        feather.castShadow = true;
        tailBase.add(feather);
      }
    }
  }

  let wingL: THREE.Group | null = null;
  let wingR: THREE.Group | null = null;

  if (fighterId === FighterId.DRAGON_BOSS || fighterId === FighterId.EAGLE_WARRIOR) {
    const buildWing = (side: -1 | 1) => {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.14, th * 0.74, -0.16);
      torso.add(wingPivot);

      if (fighterId === FighterId.DRAGON_BOSS) {
        // Articulated Dragon Wing Spar + Stretched Magma Membrane
        const sparMain = buildTaperedSplineMesh(
          [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side * 0.42, 0.34, -0.14),
            new THREE.Vector3(side * 0.92, 0.52, -0.24),
            new THREE.Vector3(side * 1.28, 0.22, -0.32),
          ],
          0.045,
          0.014,
          10,
          8,
          recipe.skinPrimary
        );
        wingPivot.add(sparMain);

        // Wing Membrane Shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(side * 0.44, 0.34);
        wingShape.lineTo(side * 0.94, 0.50);
        wingShape.lineTo(side * 1.26, 0.20);
        wingShape.quadraticCurveTo(side * 0.85, -0.08, side * 0.56, -0.26);
        wingShape.quadraticCurveTo(side * 0.28, -0.18, 0, -0.22);
        wingShape.closePath();

        const membraneGeo = new THREE.ShapeGeometry(wingShape);
        const membraneMat = new THREE.MeshStandardMaterial({
          color: 0x991b1b,
          emissive: 0x7f1d1d,
          emissiveIntensity: 0.32,
          roughness: 0.52,
          side: THREE.DoubleSide,
        });
        emissiveMaterials.push(membraneMat);
        const membrane = new THREE.Mesh(membraneGeo, membraneMat);
        membrane.position.z = -0.16;
        membrane.rotation.y = -side * 0.18;
        membrane.castShadow = true;
        wingPivot.add(membrane);
      } else {
        // Feathered Eagle Warrior Mantle Wings
        for (let row = 0; row < 5; row++) {
          const span = 0.48 + row * 0.13;
          const plume = new THREE.Mesh(
            new THREE.ConeGeometry(0.052, span, 6),
            row < 3 ? recipe.skinPrimary : recipe.skinSecondary
          );
          plume.position.set(side * (0.22 + row * 0.09), 0.14 - row * 0.07, -0.12);
          plume.rotation.z = -side * (1.05 + row * 0.12);
          plume.rotation.y = -side * 0.22;
          plume.castShadow = true;
          wingPivot.add(plume);
        }
      }
      return wingPivot;
    };

    wingL = buildWing(1);
    wingR = buildWing(-1);
  }

  // Collect standard materials for hit flash feedback
  const flashMaterials: THREE.MeshStandardMaterial[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = (obj as THREE.Mesh).material;
      if (m instanceof THREE.MeshStandardMaterial && !flashMaterials.includes(m)) {
        flashMaterials.push(m);
      }
    }
  });

  return {
    fighterId,
    root,
    pelvis,
    torso,
    neckAndHead,
    jaw,
    shoulderL: armL.shoulder,
    elbowL: armL.elbow,
    shoulderR: armR.shoulder,
    elbowR: armR.elbow,
    hipL: legL.hip,
    kneeL: legL.knee,
    ankleL: legL.ankle,
    hipR: legR.hip,
    kneeR: legR.knee,
    ankleR: legR.ankle,
    tailBase,
    wingL,
    wingR,
    hipBaseY,
    emissiveMaterials,
    flashMaterials,
  };
}

function buildSpeciesHead(
  fighterId: FighterId,
  neckAndHead: THREE.Group,
  recipe: FighterAnatomyRecipe,
  seg: number,
  furNormal: THREE.CanvasTexture,
  maxAnisotropy: number
): THREE.Group | null {
  const darkNoseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.28,
    metalness: 0.15,
  });

  // Muscular Neck Base
  const neckMesh = new THREE.Mesh(
    buildLoftedGeometry(
      [
        { cy: -0.02, rx: 0.115 * recipe.bodyWidth, rzFront: 0.11, rzBack: 0.12 },
        { cy: 0.10, cz: 0.02, rx: 0.105 * recipe.bodyWidth, rzFront: 0.105, rzBack: 0.11 },
      ],
      12
    ),
    recipe.skinPrimary
  );
  neckMesh.castShadow = true;
  neckAndHead.add(neckMesh);

  let jawGroup: THREE.Group | null = null;

  if (fighterId === FighterId.LION_KING) {
    // Cranium
    const cranium = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.02, rx: 0.135, rzFront: 0.14, rzBack: 0.15 },
          { cy: 0.20, cz: 0.03, rx: 0.148, rzFront: 0.155, rzBack: 0.15 },
          { cy: 0.30, cz: 0.01, rx: 0.115, rzFront: 0.12, rzBack: 0.13 },
        ],
        seg
      ),
      recipe.skinPrimary
    );
    cranium.castShadow = true;
    neckAndHead.add(cranium);

    // Broad Feline Muzzle (+Z forward)
    const muzzle = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.12, cz: 0.15, rx: 0.092, rzFront: 0.11, rzBack: 0.04 },
          { cy: 0.18, cz: 0.17, rx: 0.098, rzFront: 0.12, rzBack: 0.04 },
          { cy: 0.22, cz: 0.14, rx: 0.072, rzFront: 0.09, rzBack: 0.03 },
        ],
        12
      ),
      recipe.skinSecondary
    );
    muzzle.castShadow = true;
    neckAndHead.add(muzzle);

    // Nose & Jaw
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.042, 6), darkNoseMat);
    nose.position.set(0, 0.20, 0.285);
    nose.rotation.x = Math.PI * 0.5;
    neckAndHead.add(nose);

    jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.12, 0.10);
    neckAndHead.add(jawGroup);
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.16), recipe.skinSecondary);
    chin.position.set(0, -0.02, 0.08);
    jawGroup.add(chin);
    for (const side of [-1, 1]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.055, 6), recipe.clawMaterial);
      fang.position.set(side * 0.045, 0.02, 0.14);
      jawGroup.add(fang);
    }

    // Round Lion Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), recipe.skinPrimary);
      ear.scale.set(0.9, 1.0, 0.45);
      ear.position.set(side * 0.135, 0.29, 0.01);
      neckAndHead.add(ear);
    }

    // Fitted Royal Golden Crown with Crimson Rubies
    const crownBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.112, 0.105, 0.068, 16),
      recipe.attireAccent
    );
    crownBase.position.set(0, 0.325, 0.015);
    crownBase.rotation.x = -0.06;
    crownBase.castShadow = true;
    neckAndHead.add(crownBase);

    for (let p = 0; p < 6; p++) {
      const ang = (p / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.075, 5), recipe.attireAccent);
      spike.position.set(
        Math.sin(ang) * 0.105,
        0.385,
        0.015 + Math.cos(ang) * 0.105
      );
      neckAndHead.add(spike);
    }

    const frontRuby = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.024, 0),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.7,
        roughness: 0.15,
      })
    );
    frontRuby.position.set(0, 0.33, 0.125);
    neckAndHead.add(frontRuby);

    addEyes(neckAndHead, recipe.eyeMaterial, 0.062, 0.225, 0.165, 0.022);
  } else if (fighterId === FighterId.SILVERBACK_GORILLA) {
    // High Sagittal Crest Skull + Heavy Supraorbital Brow Ridge
    const skull = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.07, cz: 0.02, rx: 0.145, rzFront: 0.155, rzBack: 0.145 },
          { cy: 0.19, cz: 0.03, rx: 0.152, rzFront: 0.165, rzBack: 0.15 },
          { cy: 0.32, cz: -0.02, rx: 0.105, rzFront: 0.11, rzBack: 0.135 },
        ],
        seg
      ),
      recipe.skinPrimary
    );
    skull.castShadow = true;
    neckAndHead.add(skull);

    // Heavy Gorilla Brow Ridge (+Z)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.048, 0.09), recipe.skinPrimary);
    brow.position.set(0, 0.235, 0.155);
    neckAndHead.add(brow);

    // Broad Prognathic Ape Muzzle & Nostrils
    const apeMuzzle = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.13, rx: 0.11, rzFront: 0.11, rzBack: 0.04 },
          { cy: 0.16, cz: 0.15, rx: 0.115, rzFront: 0.12, rzBack: 0.04 },
          { cy: 0.20, cz: 0.14, rx: 0.085, rzFront: 0.09, rzBack: 0.03 },
        ],
        12
      ),
      darkNoseMat
    );
    neckAndHead.add(apeMuzzle);

    jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.09, 0.11);
    neckAndHead.add(jawGroup);
    const heavyJaw = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.068, 0.15), darkNoseMat);
    heavyJaw.position.set(0, -0.015, 0.06);
    jawGroup.add(heavyJaw);
    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.045, 6), ivoryClawMat());
      tusk.position.set(side * 0.058, 0.025, 0.11);
      jawGroup.add(tusk);
    }

    addEyes(neckAndHead, recipe.eyeMaterial, 0.056, 0.21, 0.168, 0.019);
  } else if (fighterId === FighterId.RED_FOX) {
    // Sleek Vulpine Head + Long Pointed Snout + White Cheek Ruffs + Tall Fox Ears
    const foxHead = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.02, rx: 0.12, rzFront: 0.125, rzBack: 0.12 },
          { cy: 0.18, cz: 0.03, rx: 0.135, rzFront: 0.135, rzBack: 0.125, muscleHarmonic2: 0.12 },
          { cy: 0.27, cz: 0.01, rx: 0.10, rzFront: 0.105, rzBack: 0.105 },
        ],
        seg
      ),
      recipe.skinPrimary
    );
    foxHead.castShadow = true;
    neckAndHead.add(foxHead);

    // Cheek Ruffs (white fur tufts)
    for (const side of [-1, 1]) {
      const ruff = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.14, 8), recipe.skinSecondary);
      ruff.position.set(side * 0.135, 0.15, 0.04);
      ruff.rotation.z = -side * 1.18;
      neckAndHead.add(ruff);
    }

    // Tapered Fox Snout (+Z)
    const snout = buildTaperedSplineMesh(
      [
        new THREE.Vector3(0, 0.165, 0.11),
        new THREE.Vector3(0, 0.158, 0.22),
        new THREE.Vector3(0, 0.155, 0.31),
      ],
      0.072,
      0.022,
      8,
      10,
      recipe.skinPrimary
    );
    neckAndHead.add(snout);

    const foxNose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkNoseMat);
    foxNose.position.set(0, 0.16, 0.315);
    neckAndHead.add(foxNose);

    // Tall Triangular Fox Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.165, 6), recipe.skinPrimary);
      ear.scale.set(1, 1, 0.45);
      ear.position.set(side * 0.088, 0.335, 0.01);
      ear.rotation.z = -side * 0.18;
      ear.castShadow = true;
      neckAndHead.add(ear);
    }

    // Fitted Crimson Shinobi Headband
    const headband = new THREE.Mesh(
      new THREE.CylinderGeometry(0.108, 0.114, 0.036, 16),
      recipe.attireAccent
    );
    headband.position.set(0, 0.245, 0.018);
    neckAndHead.add(headband);

    addEyes(neckAndHead, recipe.eyeMaterial, 0.055, 0.205, 0.145, 0.021);
  } else if (fighterId === FighterId.CROCODILE_BOSS) {
    // Broad Armored Reptilian Cranium + Long Toothed Snout & Articulated Lower Jaw
    const cranium = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.0, rx: 0.148, rzFront: 0.15, rzBack: 0.15 },
          { cy: 0.21, cz: 0.02, rx: 0.142, rzFront: 0.16, rzBack: 0.14 },
          { cy: 0.27, cz: 0.0, rx: 0.115, rzFront: 0.13, rzBack: 0.12 },
        ],
        seg
      ),
      recipe.skinPrimary
    );
    cranium.castShadow = true;
    neckAndHead.add(cranium);

    // Heavy Elongated Upper Crocodile Jaw (+Z)
    const upperJaw = buildLoftedGeometry(
      [
        { cy: 0.16, cz: 0.12, rx: 0.115, rzFront: 0.06, rzBack: 0.04 },
        { cy: 0.165, cz: 0.28, rx: 0.095, rzFront: 0.06, rzBack: 0.04 },
        { cy: 0.17, cz: 0.44, rx: 0.078, rzFront: 0.055, rzBack: 0.03 },
      ],
      12
    );
    const upperJawMesh = new THREE.Mesh(upperJaw, recipe.skinPrimary);
    upperJawMesh.castShadow = true;
    neckAndHead.add(upperJawMesh);

    // Interlocking Upper Teeth
    for (let z = 0.18; z <= 0.42; z += 0.06) {
      for (const side of [-1, 1]) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.042, 5), recipe.clawMaterial);
        tooth.position.set(side * 0.072, 0.135, z);
        tooth.rotation.x = Math.PI;
        neckAndHead.add(tooth);
      }
    }

    // Articulated Lower Jaw
    jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.125, 0.10);
    neckAndHead.add(jawGroup);

    const lowerJaw = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.052, 0.34),
      recipe.skinSecondary
    );
    lowerJaw.position.set(0, -0.015, 0.17);
    lowerJaw.castShadow = true;
    jawGroup.add(lowerJaw);

    addEyes(neckAndHead, recipe.eyeMaterial, 0.082, 0.245, 0.125, 0.022);
  } else if (fighterId === FighterId.EAGLE_WARRIOR) {
    // Sleek White-Feathered Aquiline Head + Hooked Golden Raptor Beak +Swept Crest Plumes
    const eagleHead = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.01, rx: 0.122, rzFront: 0.13, rzBack: 0.13 },
          { cy: 0.20, cz: 0.03, rx: 0.132, rzFront: 0.145, rzBack: 0.14 },
          { cy: 0.29, cz: 0.0, rx: 0.102, rzFront: 0.115, rzBack: 0.13 },
        ],
        seg
      ),
      recipe.skinSecondary
    );
    eagleHead.castShadow = true;
    neckAndHead.add(eagleHead);

    // Swept Raptor Crest Feathers (-Z)
    for (let c = -1; c <= 1; c++) {
      const crest = buildTaperedSplineMesh(
        [
          new THREE.Vector3(c * 0.042, 0.26, -0.04),
          new THREE.Vector3(c * 0.058, 0.31, -0.18),
          new THREE.Vector3(c * 0.065, 0.28, -0.30),
        ],
        0.034,
        0.006,
        8,
        6,
        recipe.skinSecondary
      );
      neckAndHead.add(crest);
    }

    // Hooked Golden Raptor Beak (+Z)
    const beak = buildTaperedSplineMesh(
      [
        new THREE.Vector3(0, 0.195, 0.13),
        new THREE.Vector3(0, 0.188, 0.25),
        new THREE.Vector3(0, 0.135, 0.31),
      ],
      0.058,
      0.008,
      10,
      8,
      recipe.clawMaterial
    );
    neckAndHead.add(beak);

    addEyes(neckAndHead, recipe.eyeMaterial, 0.068, 0.215, 0.142, 0.021);
  } else {
    // DRAGON_BOSS: Horned Draconic Skull, Fiery Snout, Articulated Jaw, Swept Obsidian Horns
    const dragonSkull = new THREE.Mesh(
      buildLoftedGeometry(
        [
          { cy: 0.08, cz: 0.01, rx: 0.145, rzFront: 0.15, rzBack: 0.15 },
          { cy: 0.22, cz: 0.03, rx: 0.155, rzFront: 0.17, rzBack: 0.155 },
          { cy: 0.31, cz: 0.0, rx: 0.125, rzFront: 0.135, rzBack: 0.14 },
        ],
        seg
      ),
      recipe.skinPrimary
    );
    dragonSkull.castShadow = true;
    neckAndHead.add(dragonSkull);

    // Draconic Snout (+Z)
    const dragonSnout = buildTaperedSplineMesh(
      [
        new THREE.Vector3(0, 0.19, 0.13),
        new THREE.Vector3(0, 0.18, 0.27),
        new THREE.Vector3(0, 0.175, 0.39),
      ],
      0.095,
      0.052,
      8,
      10,
      recipe.skinPrimary
    );
    neckAndHead.add(dragonSnout);

    // Twin Swept Sovereign Dragon Horns
    const hornMat = new THREE.MeshStandardMaterial({
      map: createFurTexture('#450a0a', '#18181b', '#dc2626', maxAnisotropy),
      normalMap: furNormal,
      roughness: 0.32,
      metalness: 0.35,
    });
    for (const side of [-1, 1]) {
      const horn = buildTaperedSplineMesh(
        [
          new THREE.Vector3(side * 0.085, 0.28, 0.02),
          new THREE.Vector3(side * 0.17, 0.42, -0.14),
          new THREE.Vector3(side * 0.22, 0.56, -0.34),
        ],
        0.044,
        0.006,
        10,
        8,
        hornMat
      );
      neckAndHead.add(horn);
    }

    // Articulated Fiery Dragon Jaw
    jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.135, 0.11);
    neckAndHead.add(jawGroup);
    const dJaw = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.048, 0.27), recipe.skinSecondary);
    dJaw.position.set(0, -0.015, 0.13);
    jawGroup.add(dJaw);

    addEyes(neckAndHead, recipe.eyeMaterial, 0.072, 0.235, 0.155, 0.024);
  }

  return jawGroup;
}

function ivoryClawMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 });
}

function addEyes(
  parent: THREE.Group,
  eyeMat: THREE.Material,
  halfX: number,
  y: number,
  z: number,
  radius: number
): void {
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), eyeMat);
    eye.position.set(side * halfX, y, z);
    parent.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.52, 8, 6), pupilMat);
    pupil.position.set(side * halfX, y, z + radius * 0.72);
    parent.add(pupil);
  }
}
