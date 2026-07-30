const key = "shadow-strike-save";

export type CampaignSave = {
  bestScore: number;
  unlockedMission: number;
  completed: number[];
  masterVolume: number;
  quality: "balanced" | "high";
  crateTokens: number;
  ownedFinishes: string[];
  equippedFinishId: string;
};

const fresh: CampaignSave = {
  bestScore: 0,
  unlockedMission: 1,
  completed: [],
  masterVolume: 0.65,
  quality: "high",
  crateTokens: 3,
  ownedFinishes: [],
  equippedFinishId: "field-standard",
};

export function loadCampaign(): CampaignSave {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as Partial<CampaignSave>;
    return { ...fresh, ...saved };
  } catch {
    return fresh;
  }
}

export function saveCampaign(save: CampaignSave) {
  localStorage.setItem(key, JSON.stringify(save));
}
