import type { LayoutPoint } from './layout.worker';

export function loadDecorationLayout() {
  return new Promise<LayoutPoint[]>((resolve) => {
    if (!('Worker' in window)) {
      resolve([]);
      return;
    }
    const worker = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<LayoutPoint[]>) => {
      resolve(event.data);
      worker.terminate();
    };
    worker.onerror = () => {
      resolve([]);
      worker.terminate();
    };
    worker.postMessage({ seed: 42077, count: 155 });
  });
}
