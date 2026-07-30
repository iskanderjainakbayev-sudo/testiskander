import { useEffect, useRef, useState } from "react";
import { loadCampaign, saveCampaign, type CampaignSave } from "../lib/shooter/save";
import { getWeaponFinish, type WeaponFinish } from "../lib/shooter/armory";
import { ShooterWorld } from "../lib/shooter/ShooterWorld";
import type { ShooterSnapshot } from "../lib/shooter/types";
import { ShooterHud } from "./ShooterHud";
import { ShooterMenu, type Screen } from "./ShooterMenu";
import "../styles/shooter-ui.css";
import "../styles/shooter-armory.css";
import "../styles/shooter-color.css";

const initialState: ShooterSnapshot = {
  score: 0, health: 160, maxHealth: 160, enemies: 0, ammo: 24, reserveAmmo: 96,
  isReloading: false, isAiming: false, weapon: "AR-9", fireMode: "AUTO", level: 1, levelName: "KESTREL RANGE // TRAINING",
  missionName: "TRAINING", missionBoss: false, bossHealth: 0, objective: "Clear the training patrol.",
  mapName: "SUNBURST ISLAND", mapSubtitle: "Brightwater Basin // clear skies",
  gameOver: false, gameComplete: false,
};

export function GameArena() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<ShooterWorld>();
  const mission = useRef(1);
  const [screen, setScreen] = useState<Screen>("menu");
  const [state, setState] = useState(initialState);
  const [campaign, setCampaign] = useState<CampaignSave>(loadCampaign);
  const [mapId, setMapId] = useState("sunburst-island");
  const [selectedMission, setSelectedMission] = useState(1);

  useEffect(() => saveCampaign(campaign), [campaign]);
  const completeMission = (missionId: number, score: number) => setCampaign((saved) => ({
    ...saved,
    bestScore: Math.max(saved.bestScore, score),
    unlockedMission: Math.min(10, Math.max(saved.unlockedMission, missionId + 1)),
    completed: saved.completed.includes(missionId) ? saved.completed : [...saved.completed, missionId],
  }));
  const addCrateReward = (finish: WeaponFinish) => setCampaign((saved) => ({
    ...saved,
    crateTokens: Math.max(0, saved.crateTokens - 1),
    ownedFinishes: saved.ownedFinishes.includes(finish.id) ? saved.ownedFinishes : [...saved.ownedFinishes, finish.id],
    equippedFinishId: finish.id,
  }));
  const equipFinish = (finishId: string) => {
    const finish = getWeaponFinish(finishId);
    if (!campaign.ownedFinishes.includes(finish.id)) return;
    setCampaign((saved) => ({ ...saved, equippedFinishId: finish.id }));
    world.current?.setWeaponFinish(finish);
  };
  useEffect(() => {
    if (!canvas.current) return;
    world.current = new ShooterWorld({ canvas: canvas.current, mapId, onUpdate: (next) => {
      setState(next);
      if (next.gameOver || next.gameComplete) {
        if (next.gameComplete) {
          completeMission(mission.current, next.score);
          setCampaign((saved) => ({ ...saved, crateTokens: saved.crateTokens + 1 }));
        }
        else setCampaign((saved) => ({ ...saved, bestScore: Math.max(saved.bestScore, next.score) }));
        setScreen(next.gameComplete ? "win" : "over");
        document.exitPointerLock();
      }
    }});
    return () => world.current?.dispose();
  }, [mapId]);

  const start = (missionId = selectedMission) => {
    mission.current = missionId;
    setSelectedMission(missionId);
    setState(initialState);
    setScreen("play");
    world.current?.setQuality(campaign.quality);
    world.current?.setMasterVolume(campaign.masterVolume);
    world.current?.setWeaponFinish(getWeaponFinish(campaign.equippedFinishId));
    world.current?.start(missionId);
    canvas.current?.requestPointerLock();
  };
  const resume = () => { setScreen("play"); world.current?.pause(false); canvas.current?.requestPointerLock(); };
  const pause = () => { setScreen("pause"); world.current?.pause(true); document.exitPointerLock(); };

  return <section className="shooter-shell">
    <canvas ref={canvas} className="world-canvas" aria-label="Shadow Strike tactical shooter" />
    {screen === "play" && <ShooterHud state={state} onPause={pause} />}
    {screen !== "play" && <ShooterMenu
      screen={screen} score={state.score} campaign={campaign} selectedMission={selectedMission}
      mapId={mapId} onMapSelect={setMapId} onStart={start} onResume={resume} onScreen={setScreen}
      onMissionSelect={setSelectedMission}
      onOpenCrate={(finish) => addCrateReward(finish)}
      onEquipFinish={(finishId) => equipFinish(finishId)}
      onSettings={(settings) => {
        world.current?.setMasterVolume(settings.masterVolume);
        world.current?.setQuality(settings.quality);
        setCampaign((saved) => ({ ...saved, ...settings }));
      }}
    />}
  </section>;
}
