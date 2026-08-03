import { useRef, useState } from 'react';

interface TouchJoystickProps {
  onMove: (x: number, forward: number) => void;
  onBoost: (active: boolean) => void;
}

const STICK_RADIUS = 48;

export function TouchJoystick({ onMove, onBoost }: TouchJoystickProps) {
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const rawX = event.clientX - bounds.left - bounds.width / 2;
    const rawY = event.clientY - bounds.top - bounds.height / 2;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > STICK_RADIUS ? STICK_RADIUS / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    const strength = Math.min(1, distance / STICK_RADIUS);
    const deadZone = strength < 0.1;
    setKnob(deadZone ? { x: 0, y: 0 } : { x, y });
    onMove(deadZone ? 0 : x / STICK_RADIUS, deadZone ? 0 : -y / STICK_RADIUS);
    onBoost(!deadZone && strength > 0.88);
  };

  const release = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
    onBoost(false);
  };

  return (
    <div
      className="touch-joystick"
      role="application"
      aria-label="Movement joystick"
      onPointerDown={(event) => {
        event.preventDefault();
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (pointerId.current === event.pointerId) update(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <i className="joystick-ring" />
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
