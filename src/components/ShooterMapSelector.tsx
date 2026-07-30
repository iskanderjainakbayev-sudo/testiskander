import { tacticalMaps } from "../lib/shooter/maps/mapRegistry";
import type { MenuProps } from "./shooterMenuTypes";

type MapSelectorProps = Pick<MenuProps, "mapId" | "onMapSelect" | "onScreen">;

export function ShooterMapSelector({ mapId, onMapSelect, onScreen }: MapSelectorProps) {
  const map = tacticalMaps.find((item) => item.id === mapId) ?? tacticalMaps[0];
  return <>
    <div className="selector-heading"><span>BATTLEFIELD DATABASE</span><strong>SELECT DEPLOYMENT ZONE</strong></div>
    <section className="map-selector">
      <div className="map-list">{tacticalMaps.map((item) => <button key={item.id} className={item.id === map.id ? "map-option selected-map" : "map-option"} onClick={() => onMapSelect(item.id)} aria-pressed={item.id === map.id}>
        <span>{item.name}</span><small>{item.subtitle}</small>
      </button>)}</div>
      <aside className="map-intel">
        <span>LIVE INTEL // {map.weather.toUpperCase()}</span>
        <h2>{map.name}</h2>
        <p>{map.subtitle}</p>
        <div>{map.routes.map((route) => <article key={route.id}><b>{route.style}</b><span>{route.description}</span></article>)}</div>
      </aside>
    </section>
    <button className="menu-back" onClick={() => onScreen("menu")}>← CONFIRM DEPLOYMENT</button>
  </>;
}
