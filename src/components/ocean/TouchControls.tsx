interface TouchControlsProps {
  activeWeapon: 'gun' | 'knife';
  onKey: (code: string, active: boolean) => void;
  onPause: () => void;
}

function bind(code: string, onKey: TouchControlsProps['onKey']) {
  return {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onKey(code, true);
    },
    onPointerUp: () => onKey(code, false),
    onPointerCancel: () => onKey(code, false),
    onLostPointerCapture: () => onKey(code, false),
  };
}

export function TouchControls({ activeWeapon, onKey, onPause }: TouchControlsProps) {
  const nextWeapon = activeWeapon === 'gun' ? 'Digit2' : 'Digit1';
  return (
    <div className="ocean-touch-controls" aria-label="Touch game controls">
      <div className="touch-look-hint">SWIPE TO LOOK</div>
      <button className="touch-menu" onPointerDown={onPause} aria-label="Pause game">Ⅱ</button>
      <div className="touch-utility">
        <button {...bind(nextWeapon, onKey)} aria-label="Switch weapon">WPN</button>
        <button {...bind('KeyH', onKey)} aria-label="Eat food">EAT</button>
        <button {...bind('KeyC', onKey)} aria-label="Open crafting">CRAFT</button>
      </div>
      <div className="touch-depth">
        <button {...bind('Space', onKey)} aria-label="Swim upward"><span>▲</span>RISE</button>
        <button {...bind('ControlLeft', onKey)} aria-label="Swim downward"><span>▼</span>DIVE</button>
      </div>
      <div className="touch-move" aria-label="Movement pad">
        <button className="up" {...bind('KeyW', onKey)} aria-label="Move forward">▲</button>
        <button className="left" {...bind('KeyA', onKey)} aria-label="Move left">◀</button>
        <i />
        <button className="right" {...bind('KeyD', onKey)} aria-label="Move right">▶</button>
        <button className="down" {...bind('KeyS', onKey)} aria-label="Move backward">▼</button>
      </div>
      <div className="touch-actions" aria-label="Action buttons">
        <button className="boost" {...bind('ShiftLeft', onKey)}>BOOST</button>
        <button className="special-fire" {...bind('KeyX', onKey)}>PULSE</button>
        <button className="interact" {...bind('KeyE', onKey)}>USE</button>
        <button className="fire" {...bind('Mouse0', onKey)}>FIRE</button>
      </div>
    </div>
  );
}
