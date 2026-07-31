import { Link } from "wouter";
import { missionCount, missions } from "../lib/shooter/levels";
import { tacticalMaps } from "../lib/shooter/maps/mapRegistry";
import { ShooterMapSelector } from "./ShooterMapSelector";
import { ShooterMissionBriefing } from "./ShooterMissionBriefing";
import { ShooterMissionSelector } from "./ShooterMissionSelector";
import { ShooterSettings } from "./ShooterSettings";
import { ShooterArmory } from "./ShooterArmory";
import type { MenuProps, Screen } from "./shooterMenuTypes";

export type { Screen } from "./shooterMenuTypes";

export function ShooterMenu(props: MenuProps) {
  return <div className="shooter-overlay"><section className={`shooter-card shooter-card--${props.screen}`}>
    <MenuBrand screen={props.screen} />
    {props.screen === "menu" && <MainMenu {...props} />}
    {props.screen === "maps" && <ShooterMapSelector {...props} />}
    {props.screen === "missions" && <ShooterMissionSelector {...props} />}
    {props.screen === "armory" && <ShooterArmory campaign={props.campaign} onOpenCrate={props.onOpenCrate} onEquipFinish={props.onEquipFinish} onBack={() => props.onScreen("menu")} />}
    {props.screen === "settings" && <ShooterSettings campaign={props.campaign} onSettings={props.onSettings} onBack={() => props.onScreen("menu")} />}
    {props.screen === "pause" && <PauseMenu {...props} />}
    {props.screen === "over" && <EndMenu {...props} failed />}
    {props.screen === "win" && <EndMenu {...props} failed={false} />}
  </section></div>;
}

function MenuBrand({ screen }: { screen: Screen }) {
  return <header className="menu-brand"><span>OPERATION NIGHTFALL // {screen === "menu" ? "COMMAND" : "CLASSIFIED"}</span><h1>SHADOW <i>STRIKE</i></h1></header>;
}

function MainMenu({ onStart, onScreen, selectedMission, campaign, mapId }: MenuProps) {
  const map = tacticalMaps.find((item) => item.id === mapId) ?? tacticalMaps[0];
  const mission = missions.find((item) => item.id === selectedMission) ?? missions[0];
  return <>
    <ShooterMissionBriefing mission={mission} map={map} unlockedMission={campaign.unlockedMission} />
    <button className="shooter-primary deploy-button" onClick={() => onStart(selectedMission)}>DEPLOY TO {mission.name} <span>→</span></button>
    <nav className="menu-actions">
      <button onClick={() => onScreen("maps")}><span>01</span><b>MAPS</b><small>{map.name}</small></button>
      <button onClick={() => onScreen("missions")}><span>02</span><b>OPERATIONS</b><small>{campaign.unlockedMission}/{missionCount} unlocked</small></button>
      <button onClick={() => onScreen("settings")}><span>03</span><b>SETTINGS</b><small>{campaign.quality} graphics</small></button>
      <button onClick={() => onScreen("armory")}><span>04</span><b>ARMORY</b><small>{campaign.crateTokens} free crates</small></button>
    </nav>
    <Link href="/" className="shooter-link">← EXIT TO BASE</Link>
    <small className="menu-hint">WASD MOVE · SHIFT SPRINT · E INTERACT · V MELEE · F INSPECT · R RELOAD</small>
  </>;
}

function PauseMenu({ onStart, onResume, selectedMission, onScreen }: MenuProps) {
  return <section className="result-panel"><span>COMMS PAUSED</span><strong>MISSION PAUSED</strong><p>Take a breath. Your current objective and progress are saved for this run.</p><button className="shooter-primary" onClick={onResume}>RETURN TO FIGHT <i>→</i></button><button onClick={() => onStart(selectedMission)}>RESTART MISSION</button><button className="menu-back" onClick={() => onScreen("menu")}>ABORT TO COMMAND</button></section>;
}

function EndMenu({ score, onStart, selectedMission, onScreen, failed }: MenuProps & { failed: boolean }) {
  return <section className="result-panel"><span>{failed ? "TACTICAL SIGNAL LOST" : "EXTRACTION CONFIRMED"}</span><strong>{failed ? "OPERATIVE DOWN" : "MISSION COMPLETE"}</strong><b className="result">{score.toString().padStart(5, "0")}</b><p>{failed ? "Regroup, adjust your approach, and redeploy." : "Intelligence secured. A new operation is now available."}</p><button className="shooter-primary" onClick={() => onStart(selectedMission)}>{failed ? "REDEPLOY" : "RUN OPERATION AGAIN"} <i>→</i></button><button onClick={() => onScreen("missions")}>MISSION SELECT</button></section>;
}
