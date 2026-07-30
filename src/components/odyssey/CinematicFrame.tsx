interface CinematicFrameProps {
  frameRate: number;
}

export function CinematicFrame({ frameRate }: CinematicFrameProps) {
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
      <span className={`odx-performance${performanceClass}`}>LYRA // {Math.round(frameRate || 60)} FPS</span>
    </div>
  );
}

