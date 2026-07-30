import * as THREE from 'three';

function random(seed: number) {
  const x = Math.sin(seed * 9283.13) * 43758.5453;
  return x - Math.floor(x);
}

function makeSurface(
  size: number,
  painter: (context: CanvasRenderingContext2D, size: number) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas textures are not supported');
  painter(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function makeBrushedMetal() {
  const texture = makeSurface(256, (context, size) => {
    context.fillStyle = '#1d2429';
    context.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 1) {
      const light = Math.floor(22 + random(y) * 19);
      context.fillStyle = `rgba(${light},${light + 5},${light + 8},.32)`;
      context.fillRect(0, y, size, 1);
    }
    for (let i = 0; i < 70; i += 1) {
      const x = random(i * 3) * size;
      const y = random(i * 7) * size;
      context.fillStyle = 'rgba(255,255,255,.025)';
      context.fillRect(x, y, random(i) * 65, 1);
    }
  });
  texture.repeat.set(2, 6);
  return texture;
}

export function makeFloorSurface() {
  const texture = makeSurface(256, (context, size) => {
    context.fillStyle = '#10171b';
    context.fillRect(0, 0, size, size);
    context.strokeStyle = '#354047';
    context.lineWidth = 2;
    context.strokeRect(7, 7, size - 14, size - 14);
    context.strokeStyle = 'rgba(192,211,213,.11)';
    for (let i = 20; i < size; i += 28) {
      context.beginPath();
      context.moveTo(i, 9);
      context.lineTo(i - 54, size - 9);
      context.stroke();
    }
    context.fillStyle = 'rgba(0,0,0,.28)';
    context.fillRect(size / 2 - 4, 0, 8, size);
  });
  texture.repeat.set(2, 9);
  return texture;
}

export function makeScreenTexture(title: string, accent = '#f7bc74') {
  return makeSurface(512, (context, size) => {
    context.fillStyle = '#071115';
    context.fillRect(0, 0, size, size);
    const gradient = context.createRadialGradient(270, 220, 0, 270, 220, 290);
    gradient.addColorStop(0, 'rgba(47,136,143,.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    context.strokeStyle = 'rgba(126,202,205,.18)';
    context.lineWidth = 1;
    for (let i = 0; i < size; i += 32) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, size);
      context.stroke();
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(size, i);
      context.stroke();
    }
    context.fillStyle = accent;
    context.font = '600 27px sans-serif';
    context.fillText(title, 34, 54);
    context.fillStyle = 'rgba(207,238,235,.8)';
    context.font = '16px monospace';
    context.fillText('ONLINE  //  NOMINAL', 34, 86);
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.beginPath();
    for (let x = 32; x < 480; x += 5) {
      const y = 260 + Math.sin(x * 0.055) * 42 + Math.sin(x * 0.17) * 12;
      x === 32 ? context.moveTo(x, y) : context.lineTo(x, y);
    }
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.55)';
    context.fillText('KHEPRI EXPLORATION SYSTEMS', 34, 466);
  });
}

export function disposeMaterial(material: THREE.Material) {
  const record = material as THREE.Material & { map?: THREE.Texture };
  record.map?.dispose();
  material.dispose();
}
