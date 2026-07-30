import { useState } from "react";
import { getWeaponFinish, openFieldCrate, weaponFinishes, type WeaponFinish } from "../lib/shooter/armory";
import type { CampaignSave } from "../lib/shooter/save";

type ShooterArmoryProps = {
  campaign: CampaignSave;
  onOpenCrate: (finish: WeaponFinish) => void;
  onEquipFinish: (finishId: string) => void;
  onBack: () => void;
};

export function ShooterArmory({ campaign, onOpenCrate, onEquipFinish, onBack }: ShooterArmoryProps) {
  const [reward, setReward] = useState<WeaponFinish>();
  const equipped = getWeaponFinish(campaign.equippedFinishId);
  const openCrate = () => {
    const nextReward = openFieldCrate(campaign.ownedFinishes);
    if (!nextReward || !campaign.crateTokens) return;
    setReward(nextReward);
    onOpenCrate(nextReward);
  };
  return <>
    <div className="selector-heading"><span>OPERATIVE ARMORY</span><strong>FIELD CRATES</strong></div>
    <section className="armory-layout">
      <div className={`field-crate ${reward ? `rarity-${reward.rarity}` : ""}`}><span>FREE FIELD CRATE</span><b>◈</b><small>NO PURCHASE REQUIRED</small></div>
      <div className="crate-console">
        <span>AVAILABLE CRATES <b>{campaign.crateTokens}</b></span>
        <h2>{reward ? reward.name : "UNLOCK A WEAPON FINISH"}</h2>
        <p>{reward ? `${reward.weapon} · ${reward.description}` : "Earn crates from completed missions. Every reward is cosmetic and has no gameplay advantage."}</p>
        <button className="shooter-primary" onClick={openCrate} disabled={!campaign.crateTokens}>OPEN FREE CRATE <i>→</i></button>
        <small>DROP RATES: COMMON 32% · RARE 44% · EPIC 22% · LEGENDARY 2%</small>
      </div>
    </section>
    <section className="finish-collection" aria-label="Weapon finish collection">
      <div><span>COLLECTION</span><b>{campaign.ownedFinishes.length}/{weaponFinishes.length - 1} FOUND</b><small>EQUIPPED · {equipped.name}</small></div>
      <div className="finish-grid">{weaponFinishes.filter((finish) => finish.odds > 0).map((finish) => {
        const owned = campaign.ownedFinishes.includes(finish.id);
        const active = finish.id === campaign.equippedFinishId;
        return <button key={finish.id} disabled={!owned} className={`finish-card rarity-${finish.rarity} ${active ? "equipped" : ""}`} onClick={() => onEquipFinish(finish.id)}>
          <i style={{ background: `#${finish.color.toString(16).padStart(6, "0")}` }} /><span>{owned ? finish.rarity.toUpperCase() : "CLASSIFIED"}</span><b>{owned ? finish.name : "LOCKED"}</b><small>{owned ? finish.weapon : "OPEN FIELD CRATES"}</small>
        </button>;
      })}</div>
    </section>
    <button className="menu-back" onClick={onBack}>← RETURN TO COMMAND</button>
  </>;
}
