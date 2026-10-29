import * as THREE from 'three';

export interface LoftStation {
  cy: number;
  cx?: number;
  cz?: number;
  rx: number;
  rzFront: number;
  rzBack: number;
  muscleHarmonic2?: number;
  muscleHarmonic4?: number;
}

export function createFurTexture(
  baseHex: string,
  secondaryHex: string,
  stripeHex?: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Fine directional hair strands
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 6 + Math.random() * 14;
    ctx.strokeStyle = i % 3 === 0 ? secondaryHex : baseHex;
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.lineWidth = 1 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y + len);
    ctx.stroke();
  }

  if (stripeHex) {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = stripeHex;
    for (let y = 16; y < 256; y += 36) {
      ctx.beginPath();
      ctx.ellipse(128, y, 96, 6, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFurNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const nx = 110 + Math.floor(Math.random() * 36);
    const ny = 108 + Math.floor(Math.random() * 40);
    ctx.strokeStyle = `rgb(${nx}, ${ny}, 245)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y + 10);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function createReptileScaleTexture(
  baseHex: string,
  ridgeHex: string,
  bellyHex: string,
  maxAnisotropy = 4
): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  const nCanvas = document.createElement('canvas');
  nCanvas.width = 256;
  nCanvas.height = 256;
  const nCtx = nCanvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  nCtx.fillStyle = 'rgb(128,128,255)';
  nCtx.fillRect(0, 0, 256, 256);

  const rows = 14;
  const cols = 12;
  const cellW = 256 / cols;
  const cellH = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (r % 2) * (cellW * 0.5);
      const cx = (col * cellW + offsetX) % 256;
      const cy = r * cellH + cellH * 0.5;

      // Scale scute plate
      const grad = ctx.createRadialGradient(cx, cy - 2, 1, cx, cy, cellW * 0.52);
      grad.addColorStop(0, ridgeHex);
      grad.addColorStop(0.75, baseHex);
      grad.addColorStop(1, bellyHex);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cellW * 0.46, cellH * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();

      // Normal bevel bump
      const nGrad = nCtx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, cellW * 0.48);
      nGrad.addColorStop(0, 'rgb(155, 162, 255)');
      nGrad.addColorStop(0.7, 'rgb(128, 128, 250)');
      nGrad.addColorStop(1, 'rgb(96, 96, 225)');
      nCtx.fillStyle = nGrad;
      nCtx.beginPath();
      nCtx.ellipse(cx, cy, cellW * 0.46, cellH * 0.44, 0, 0, Math.PI * 2);
      nCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.colorSpace = THREE.NoColorSpace;

  return { map, normalMap };
}

export function createFeatherTexture(
  primaryHex: string,
  tipHex: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 256, 256);

  const rows = 12;
  const cols = 10;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * 25.6 + (r % 2) * 12.8;
      const cy = r * 21.3;
      ctx.fillStyle = r % 2 === 0 ? primaryHex : tipHex;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.quadraticCurveTo(cx + 11, cy + 4, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 11, cy + 4, cx, cy - 10);
      ctx.fill();
      ctx.strokeStyle = tipHex;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFabricWeaveTexture(
  baseHex: string,
  trimHex: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = trimHex;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1;
  for (let i = 0; i < 128; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Builds a smooth, closed anatomical muscle loft BufferGeometry along Y (or arbitrary centers)
 * where +Z is anatomical front (chest/face/shins) and -Z is back.
 */
export function buildLoftedGeometry(
  stations: LoftStation[],
  radialSegments = 18
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const ringStride = radialSegments + 1;

  for (let sIdx = 0; sIdx < stations.length; sIdx++) {
    const st = stations[sIdx];
    const cx = st.cx ?? 0;
    const cz = st.cz ?? 0;
    const v = stations.length > 1 ? sIdx / (stations.length - 1) : 0;

    for (let r = 0; r <= radialSegments; r++) {
      const u = r / radialSegments;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta); // +1 at +Z (front), -1 at -Z (back)

      const rz = cosT >= 0 ? st.rzFront : st.rzBack;
      const h2 = st.muscleHarmonic2 ? st.muscleHarmonic2 * Math.cos(2 * theta) : 0;
      const h4 = st.muscleHarmonic4 ? st.muscleHarmonic4 * Math.cos(4 * theta) : 0;
      const mod = 1 + h2 + h4;

      const px = cx + sinT * st.rx * mod;
      const py = st.cy;
      const pz = cz + cosT * rz * mod;

      positions.push(px, py, pz);
      uvs.push(u * 2, v * 2);
    }
  }

  for (let s = 0; s < stations.length - 1; s++) {
    const rowA = s * ringStride;
    const rowB = (s + 1) * ringStride;
    for (let r = 0; r < radialSegments; r++) {
      const a = rowA + r;
      const b = rowA + r + 1;
      const c = rowB + r;
      const d = rowB + r + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  // Bottom cap
  const firstSt = stations[0];
  const bottomCenterIndex = positions.length / 3;
  positions.push(firstSt.cx ?? 0, firstSt.cy, firstSt.cz ?? 0);
  uvs.push(0.5, 0);
  for (let r = 0; r < radialSegments; r++) {
    indices.push(bottomCenterIndex, r + 1, r);
  }

  // Top cap
  const lastSt = stations[stations.length - 1];
  const topRingStart = (stations.length - 1) * ringStride;
  const topCenterIndex = positions.length / 3;
  positions.push(lastSt.cx ?? 0, lastSt.cy, lastSt.cz ?? 0);
  uvs.push(0.5, 1);
  for (let r = 0; r < radialSegments; r++) {
    indices.push(topCenterIndex, topRingStart + r, topRingStart + r + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a tapered horn, tail, claw, or crest along a 3D CatmullRomCurve3 spline.
 */
export function buildTaperedSplineMesh(
  points: THREE.Vector3[],
  startRadius: number,
  endRadius: number,
  tubularSegments: number,
  radialSegments: number,
  material: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stride = radialSegments + 1;

  const p = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, p);
    const radius = THREE.MathUtils.lerp(startRadius, endRadius, Math.pow(t, 0.85));
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const u = j / radialSegments;
      const angle = u * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = -Math.cos(angle);

      normal.copy(N).multiplyScalar(cos);
      binormal.copy(B).multiplyScalar(sin);

      positions.push(
        p.x + radius * (normal.x + binormal.x),
        p.y + radius * (normal.y + binormal.y),
        p.z + radius * (normal.z + binormal.z)
      );
      uvs.push(u, t * 2);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Tip cap
  const tipCenter = positions.length / 3;
  const endPt = points[points.length - 1];
  positions.push(endPt.x, endPt.y, endPt.z);
  uvs.push(0.5, 1);
  const lastRow = tubularSegments * stride;
  for (let j = 0; j < radialSegments; j++) {
    indices.push(tipCenter, lastRow + j + 1, lastRow + j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
