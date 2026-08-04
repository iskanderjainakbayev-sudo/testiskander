import { TouchJoystick } from './TouchJoystick';
import type { OceanWeapon } from '../../lib/ocean/types';
import { MULTITOOL_MODULES } from '../../lib/ocean/multitoolCatalog';

interface TouchControlsProps {
  activeWeapon: OceanWeapon;
  onKey: (code: string, active: boolean) => void;
  onMove: (x: number, forward: number) => void;
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

export function TouchControls({ activeWeapon, onKey, onMove, onPause }: TouchControlsProps) {
  const activeIndex = MULTITOOL_MODULES.findIndex((module) => module.id === activeWeapon);
  const nextIndex = (activeIndex + 1) % MULTITOOL_MODULES.length;
  const nextWeapon = `Digit${nextIndex + 1}`;
  return (
    <div className="ocean-touch-controls" aria-label="Touch game controls">
      <div className="touch-look-hint">SWIPE TO LOOK · HIGH SENSITIVITY</div>
      <button className="touch-menu" onPointerDown={onPause} aria-label="Pause game">Ⅱ</button>
      <div className="touch-utility">
        <button {...bind(nextWeapon, onKey)} aria-label="Switch tool module">MOD</button>
        <button {...bind('KeyH', onKey)} aria-label="Eat food">EAT</button>
      </div>
      <div className="touch-depth">
        <button {...bind('Space', onKey)} aria-label="Swim upward"><span>▲</span>RISE</button>
        <button {...bind('ControlLeft', onKey)} aria-label="Swim downward"><span>▼</span>DIVE</button>
      </div>
      <TouchJoystick
        onMove={onMove}
        onBoost={(active) => onKey('ShiftLeft', active)}
      />
      <div className="touch-actions" aria-label="Action buttons">
        <button className="special-fire" {...bind('KeyX', onKey)}>PULSE</button>
        <button className="interact" {...bind('KeyE', onKey)}>USE</button>
        <button className="fire" {...bind('Mouse0', onKey)}>TOOL</button>
      </div>
    </div>
  );
}
