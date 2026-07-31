import type { Mission } from "../lib/shooter/levels";
import type { TacticalMapDefinition } from "../lib/shooter/maps/types";
import { missionCount } from "../lib/shooter/levels";

type MissionBriefingProps = { mission: Mission; map: TacticalMapDefinition; unlockedMission: number };

export function ShooterMissionBriefing({ mission, map, unlockedMission }: MissionBriefingProps) {
  return <section className="mission-briefing">
    <div className="briefing-title">
      <span>OP {String(mission.id).padStart(2, "0")} · {mission.location.toUpperCase()}</span>
      <b>{mission.name}</b>
      <p>{mission.briefing}</p>
    </div>
    <div className="briefing-grid">
      <article><span>OBJECTIVE</span><b>{mission.objective}</b></article>
      <article><span>DEPLOYMENT</span><b>{map.name}</b><small>{map.subtitle}</small></article>
      <article><span>REWARD</span><b>{mission.reward}</b></article>
      <article><span>CAMPAIGN</span><b>{unlockedMission}/{missionCount} OPS OPEN</b></article>
    </div>
  </section>;
}
