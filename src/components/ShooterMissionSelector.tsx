import { missions } from "../lib/shooter/levels";
import type { MenuProps } from "./shooterMenuTypes";

type MissionSelectorProps = Pick<MenuProps, "campaign" | "selectedMission" | "onMissionSelect" | "onScreen">;

export function ShooterMissionSelector({ campaign, selectedMission, onMissionSelect, onScreen }: MissionSelectorProps) {
  return <>
    <div className="selector-heading"><span>OPERATION ARCHIVE</span><strong>CHOOSE YOUR NEXT OPERATION</strong></div>
    <section className="operation-grid">{missions.map((mission) => {
      const locked = mission.id > campaign.unlockedMission;
      const selected = mission.id === selectedMission;
      return <button key={mission.id} disabled={locked} className={`${mission.boss ? "boss-mission " : ""}${selected ? "selected-mission" : ""}`} onClick={() => { onMissionSelect(mission.id); onScreen("menu"); }}>
        <span>OP {String(mission.id).padStart(2, "0")}</span><b>{locked ? "CLASSIFIED" : mission.name}</b><small>{locked ? "COMPLETE PREVIOUS OPERATION" : mission.location}</small>
      </button>;
    })}</section>
    <button className="menu-back" onClick={() => onScreen("menu")}>← RETURN TO BRIEFING</button>
  </>;
}
