import { useEffect, useRef, useState } from 'react';

type Transition = 'entering' | 'exiting' | null;

export function SubTransitionOverlay({ inSub, active }: { inSub: boolean; active: boolean }) {
  const previous = useRef(inSub);
  const timer = useRef<number | null>(null);
  const [transition, setTransition] = useState<Transition>(null);

  useEffect(() => {
    if (!active || previous.current === inSub) return;
    previous.current = inSub;
    setTransition(inSub ? 'entering' : 'exiting');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTransition(null), 2100);
  }, [active, inSub]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  if (!transition) return null;
  return (
    <div className={`sub-transition is-${transition}`} aria-hidden="true">
      <div className="sub-transition-iris" />
      <section>
        <small>{transition === 'entering' ? 'PRESSURE SEAL' : 'EXTERNAL WATER CONTACT'}</small>
        <b>{transition === 'entering' ? 'NEREID // LINKED' : 'DIVER // RELEASED'}</b>
      </section>
    </div>
  );
}
