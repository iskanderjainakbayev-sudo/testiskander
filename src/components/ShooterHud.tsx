import type { ShooterSnapshot } from "../lib/shooter/types";

type ShooterHudProps = { state: ShooterSnapshot; onPause: () => void };

export function ShooterHud({ state, onPause }: ShooterHudProps) {
  return (
    <>
      <header className="shooter-top">
        <span><small>OPERATION NIGHTFALL</small>SHADOW <b>STRIKE</b></span>
        <button onClick={onPause} aria-label="Pause game">MENU <i>Ⅱ</i></button>
      </header>
      <aside className="shooter-stats">
        <b>{state.score.toString().padStart(5, "0")}</b>
        <span>SCORE</span>
        <i>◈ {state.enemies} HOSTILES</i>
      </aside>
      <aside className="level-objective">
        <span>OP {String(state.level).padStart(2, "0")} · {state.levelName}</span>
        <b>{state.objective}</b>
        <i><em /> ELIMINATE REMAINING HOSTILES</i>
      </aside>
      <aside className="map-readout">
        <span>MAP // {state.mapName}</span>
        <b>{state.mapSubtitle.toUpperCase()}</b>
      </aside>
      <div className="health-meter">
        <span>VITALS</span>
        <div>
          <b style={{ width: `${(state.health / state.maxHealth) * 100}%` }} />
        </div>
        <strong>
          {state.health}/{state.maxHealth}
        </strong>
      </div>
      <div className="stamina-meter">
        <span>STAMINA</span>
        <div>
          <b style={{ width: `${(state.stamina / state.maxStamina) * 100}%` }} />
        </div>
        <strong>
          {Math.round(state.stamina)}/{state.maxStamina}
        </strong>
      </div>
      <div className="ammo-meter">
        <span>{state.isReloading ? "RELOADING" : `${state.weapon} · ${state.fireMode}`}</span>
        <b>{state.ammo}</b>
        <i>/ {state.reserveAmmo}</i>
      </div>
      {state.missionBoss && <div className="boss-warning">COMMANDER VOSS <b><i style={{ width: `${(state.bossHealth / 18) * 100}%` }} /></b></div>}
      {state.isAiming && <div className="aiming-readout">AIMING</div>}
      <div className={`crosshair ${state.isAiming ? "aiming" : ""}`} aria-hidden="true" />
      <footer className="shooter-controls">1–0 LOADOUT · RMB AIM · E INTERACT · V MELEE · F INSPECT · R RELOAD</footer>
    </>
  );
}
