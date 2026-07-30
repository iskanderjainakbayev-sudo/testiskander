export type LayoutPoint = { x: number; z: number; size: number; tone: number };

type LayoutRequest = { seed: number; count: number };

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

self.onmessage = (event: MessageEvent<LayoutRequest>) => {
  const next = random(event.data.seed);
  const points: LayoutPoint[] = Array.from({ length: event.data.count }, () => {
    const angle = next() * Math.PI * 2;
    const radius = 14 + next() * 83;
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, size: .35 + next() * 1.6, tone: next() };
  });
  self.postMessage(points);
};
