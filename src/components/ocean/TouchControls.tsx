interface TouchControlsProps {
  onKey: (code: string, active: boolean) => void;
}

function bind(code: string, onKey: TouchControlsProps['onKey']) {
  return {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      onKey(code, true);
    },
    onPointerUp: () => onKey(code, false),
    onPointerCancel: () => onKey(code, false),
  };
}

export function TouchControls({ onKey }: TouchControlsProps) {
  return (
    <div className="ocean-touch-controls">
      <div className="touch-move">
        <button className="up" {...bind('KeyW', onKey)}>▲</button>
        <button className="left" {...bind('KeyA', onKey)}>◀</button>
        <button className="down" {...bind('KeyS', onKey)}>▼</button>
        <button className="right" {...bind('KeyD', onKey)}>▶</button>
      </div>
      <div className="touch-actions">
        <button {...bind('Space', onKey)}>RISE</button>
        <button {...bind('ControlLeft', onKey)}>DIVE</button>
        <button className="interact" {...bind('KeyE', onKey)}>E</button>
        <button className="fire" {...bind('Mouse0', onKey)}>FIRE</button>
        <button className="special-fire" {...bind('KeyX', onKey)}>PULSE</button>
        <button {...bind('Digit1', onKey)}>GUN</button>
        <button {...bind('Digit2', onKey)}>KNIFE</button>
        <button {...bind('KeyH', onKey)}>EAT</button>
        <button {...bind('KeyC', onKey)}>CRAFT</button>
        <button {...bind('ShiftLeft', onKey)}>BOOST</button>
      </div>
    </div>
  );
}
