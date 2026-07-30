import * as THREE from 'three';

function seeded(seed: number): number {
  const value = Math.sin(seed * 9283.13) * 43758.5453;
  return value - Math.floor(value);
}

function canvasTexture(
  size: number,
  painter: (context: CanvasRenderingContext2D, size: number) => void,
  color = true,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas textures are not supported');
  painter(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function makeBrushedMetal(): THREE.CanvasTexture {
  const texture = canvasTexture(256, (context, size) => {
    context.fillStyle = '#747a79';
    context.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 1) {
      const value = Math.floor(65 + seeded(y * 11) * 48);
      context.fillStyle = `rgba(${value},${value + 4},${value + 3},.17)`;
      context.fillRect(0, y, size, 1);
    }
    for (let index = 0; index < 95; index += 1) {
      const x = seeded(index * 3) * size;
      const y = seeded(index * 7) * size;
      context.fillStyle = index % 4 ? 'rgba(255,255,250,.055)' : 'rgba(14,18,18,.12)';
      context.fillRect(x, y, 18 + seeded(index) * 82, index % 7 ? 1 : 2);
    }
  });
  texture.repeat.set(2, 7);
  return texture;
}

export function makeFloorSurface(): THREE.CanvasTexture {
  const texture = canvasTexture(256, (context, size) => {
    context.fillStyle = '#535a57';
    context.fillRect(0, 0, size, size);
    context.strokeStyle = 'rgba(9,13,13,.72)';
    context.lineWidth = 5;
    context.strokeRect(7, 7, size - 14, size - 14);
    context.strokeStyle = 'rgba(205,211,198,.12)';
    context.lineWidth = 1;
    context.strokeRect(13, 13, size - 26, size - 26);
    for (let x = 24; x < size; x += 34) {
      context.beginPath();
      context.moveTo(x, 15);
      context.lineTo(x - 42, size - 15);
      context.stroke();
    }
    context.fillStyle = 'rgba(4,7,7,.38)';
    context.fillRect(size / 2 - 4, 0, 8, size);
  });
  texture.repeat.set(1.7, 1);
  return texture;
}

export function makeMicroNormal(): THREE.CanvasTexture {
  const texture = canvasTexture(128, (context, size) => {
    const image = context.createImageData(size, size);
    for (let index = 0; index < size * size; index += 1) {
      const grain = Math.floor((seeded(index * 17) - 0.5) * 18);
      image.data[index * 4] = 128 + grain;
      image.data[index * 4 + 1] = 128 + Math.floor(grain * 0.55);
      image.data[index * 4 + 2] = 246;
      image.data[index * 4 + 3] = 255;
    }
    context.putImageData(image, 0, 0);
  }, false);
  texture.repeat.set(7, 7);
  return texture;
}

export function makeScreenTexture(title: string, accent = '#eab16d'): THREE.CanvasTexture {
  return canvasTexture(512, (context, size) => {
    context.fillStyle = '#061014';
    context.fillRect(0, 0, size, size);
    const glow = context.createRadialGradient(260, 230, 0, 260, 230, 320);
    glow.addColorStop(0, 'rgba(42,137,142,.3)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, size, size);
    context.strokeStyle = 'rgba(127,196,197,.14)';
    for (let value = 0; value < size; value += 32) {
      context.beginPath();
      context.moveTo(value, 0);
      context.lineTo(value, size);
      context.moveTo(0, value);
      context.lineTo(size, value);
      context.stroke();
    }
    context.fillStyle = accent;
    context.font = '600 25px sans-serif';
    context.fillText(title, 32, 48);
    context.fillStyle = 'rgba(204,232,229,.74)';
    context.font = '15px monospace';
    context.fillText('ONLINE // NOMINAL // 07', 32, 79);
    drawTelemetry(context, accent);
    context.fillStyle = 'rgba(226,237,233,.48)';
    context.fillText('LYRA DEEP RANGE SYSTEMS', 32, 470);
  });
}

function drawTelemetry(context: CanvasRenderingContext2D, accent: string): void {
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 30; x < 482; x += 4) {
    const y = 275 + Math.sin(x * 0.052) * 40 + Math.sin(x * 0.173) * 10;
    if (x === 30) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
  context.fillStyle = 'rgba(142,204,204,.17)';
  context.fillRect(32, 112, 136, 76);
  context.fillRect(184, 112, 296, 22);
  context.fillRect(184, 148, 216, 40);
}
