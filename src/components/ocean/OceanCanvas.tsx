import type { RefObject } from 'react';

interface OceanCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  onRequestInput: () => void;
}

export function OceanCanvas({ canvasRef, onRequestInput }: OceanCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      className="ocean-canvas"
      tabIndex={0}
      onClick={onRequestInput}
      aria-label="First-person underwater game"
    />
  );
}
