type Props = { coins: number; unlocked: string[]; equipped: string; onBuy: (skin: string, price: number) => void };
const skins = [{ name: 'Jungle Scout', price: 0, tone: 'scout' }, { name: 'Golden Monkey', price: 90, tone: 'gold' }, { name: 'Galaxy Monkey', price: 160, tone: 'galaxy' }];

export function MonkeyShop({ coins, unlocked, equipped, onBuy }: Props) {
  return <section className="overlay-panel shop"><header><p>THE CANOPY MARKET</p><h2>Monkey styles</h2><span>◈ {coins}</span></header><div className="shop-items">{skins.map((skin) => { const owned = unlocked.includes(skin.name); return <article key={skin.name}><div className={`skin-preview ${skin.tone}`}>🐒</div><b>{skin.name}</b><button onClick={() => onBuy(skin.name, skin.price)} disabled={!owned && coins < skin.price}>{equipped === skin.name ? 'Equipped' : owned ? 'Equip' : `◈ ${skin.price}`}</button></article>; })}</div><p className="shop-note">Cosmetics are saved on this device.</p></section>;
}
