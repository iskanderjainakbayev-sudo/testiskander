import type { GraphicsQuality } from '../../lib/ocean/types';

interface GraphicsSettingsProps {
  quality: GraphicsQuality;
  onChange: (quality: GraphicsQuality) => void;
  onClose: () => void;
}

const LEVELS: GraphicsQuality[] = ['Low', 'Medium', 'High', 'Ultra'];

export function GraphicsSettings({ quality, onChange, onClose }: GraphicsSettingsProps) {
  return (
    <div className="ocean-overlay">
      <section className="ocean-panel settings-panel">
        <header>
          <div><small>DISPLAY & PERFORMANCE</small><h2>Graphics quality</h2></div>
          <button onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="quality-options">
          {LEVELS.map((level) => (
            <button
              key={level}
              className={quality === level ? 'active' : ''}
              onClick={() => onChange(level)}
            >
              <b>{level.toUpperCase()}</b>
              <span>{level === 'Low' ? 'Maximum performance'
                : level === 'Medium' ? 'Balanced detail'
                  : level === 'High' ? 'Soft shadows and bloom' : 'Full ocean atmosphere'}</span>
            </button>
          ))}
        </div>
        <footer>CHANGES APPLY IMMEDIATELY · SETTING SAVED ON THIS DEVICE</footer>
      </section>
    </div>
  );
}
