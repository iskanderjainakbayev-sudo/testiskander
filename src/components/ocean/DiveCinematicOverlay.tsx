interface DiveCinematicOverlayProps {
  visible: boolean;
}

export function DiveCinematicOverlay({ visible }: DiveCinematicOverlayProps) {
  if (!visible) return null;
  return (
    <div className="dive-cinematic" aria-hidden="true">
      <div className="cinematic-letterbox cinematic-letterbox-top" />
      <section>
        <small>KEPLER SURVEY // PLANETARY OCEAN 07</small>
        <h2>PELAGOS</h2>
        <p>Atmosphere breached · descent vector locked</p>
      </section>
      <div className="cinematic-depth-line"><i /><span>ENTERING THALASSIC ZONE</span></div>
      <div className="cinematic-letterbox cinematic-letterbox-bottom" />
    </div>
  );
}
