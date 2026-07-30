import type { CampaignSave } from "../lib/shooter/save";

type ShooterSettingsProps = {
  campaign: CampaignSave;
  onSettings: (settings: Pick<CampaignSave, "masterVolume" | "quality">) => void;
  onBack: () => void;
};

export function ShooterSettings({ campaign, onSettings, onBack }: ShooterSettingsProps) {
  const update = (settings: Partial<Pick<CampaignSave, "masterVolume" | "quality">>) => onSettings({
    masterVolume: settings.masterVolume ?? campaign.masterVolume,
    quality: settings.quality ?? campaign.quality,
  });
  return <>
    <div className="selector-heading"><span>OPERATIVE PREFERENCES</span><strong>FIELD SETTINGS</strong></div>
    <section className="settings-panel">
      <label>MASTER VOLUME <output>{Math.round(campaign.masterVolume * 100)}%</output><input type="range" min="0" max="1" step="0.05" value={campaign.masterVolume} onChange={(event) => update({ masterVolume: Number(event.target.value) })} /></label>
      <fieldset><legend>GRAPHICS PRESET</legend>{(["balanced", "high"] as const).map((quality) => <button type="button" key={quality} className={campaign.quality === quality ? "selected-setting" : ""} onClick={() => update({ quality })}>{quality === "high" ? "HIGH FIDELITY" : "BALANCED"}<small>{quality === "high" ? "Sharper lighting · higher GPU load" : "Smooth gameplay · lower GPU load"}</small></button>)}</fieldset>
    </section>
    <button className="menu-back" onClick={onBack}>← SAVE AND RETURN</button>
  </>;
}
