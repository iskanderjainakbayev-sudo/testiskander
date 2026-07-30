import type { CampaignSave } from "../lib/shooter/save";
import type { WeaponFinish } from "../lib/shooter/armory";

export type Screen = "menu" | "maps" | "missions" | "armory" | "settings" | "play" | "pause" | "over" | "win";

export type MenuProps = {
  screen: Screen;
  score: number;
  campaign: CampaignSave;
  selectedMission: number;
  mapId: string;
  onMapSelect: (mapId: string) => void;
  onMissionSelect: (missionId: number) => void;
  onOpenCrate: (finish: WeaponFinish) => void;
  onEquipFinish: (finishId: string) => void;
  onStart: (missionId?: number) => void;
  onResume: () => void;
  onScreen: (screen: Screen) => void;
  onSettings: (settings: Pick<CampaignSave, "masterVolume" | "quality">) => void;
};
