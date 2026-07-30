interface CinematicFrameProps {
  frameRate: number;
  frameTimeP95: number;
  frameTimeP99: number;
  longFramePercent: number;
  drawCalls: number;
  triangles: number;
}

export function CinematicFrame({
  frameRate,
  frameTimeP95,
  frameTimeP99,
  longFramePercent,
  drawCalls,
  triangles,
}: CinematicFrameProps) {
  const performanceClass = frameRate > 0 && frameRate < 44 ? ' is-warm' : '';

  return (
    <div className="odx-cinematic" aria-hidden="true">
      <div className="odx-cinematic__vignette" />
      <div className="odx-cinematic__grain" />
      <div className="odx-cinematic__bloom" />
      <i className="odx-corner odx-corner--tl" />
      <i className="odx-corner odx-corner--tr" />
      <i className="odx-corner odx-corner--bl" />
      <i className="odx-corner odx-corner--br" />
      <span
        className={`odx-performance${performanceClass}`}
        data-average-fps={frameRate.toFixed(2)}
        data-p95-ms={frameTimeP95.toFixed(2)}
        data-p99-ms={frameTimeP99.toFixed(2)}
        data-long-frame-percent={longFramePercent.toFixed(3)}
        data-draw-calls={drawCalls}
        data-triangles={triangles}
      >
        LYRA // {Math.round(frameRate || 60)} FPS
      </span>
    </div>
  );
}
