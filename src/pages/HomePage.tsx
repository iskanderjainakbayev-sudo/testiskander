import { Link } from 'wouter';
import '../styles/eclipse.css';

export function HomePage() {
  return <main className="eclipse-home">
    <div className="eclipse-home__orbit eclipse-home__orbit--one" /><div className="eclipse-home__orbit eclipse-home__orbit--two" />
    <section className="eclipse-home__content"><p>RIFTFALL EXPEDITION // SINGLE-PLAYER ACTION RPG</p><h1>PROJECT<br /><i>ECLIPSE</i></h1><b>Cross the fractured frontier, awaken an ancient beacon, and face the force holding the sky open.</b><Link href="/game">ENTER THE RIFTLANDS <span>→</span></Link><small>THREE.JS WEBGL · OFFLINE AUTOSAVE · PWA READY</small></section>
    <section className="eclipse-home__features" aria-label="Game features"><article><b>✦</b><span>Explore</span><small>Six connected frontier zones</small></article><article><b>⚔</b><span>Adapt</span><small>Blade, bolt, pulse and parkour</small></article><article><b>◈</b><span>Restore</span><small>Craft, upgrade, and seal the breach</small></article></section>
  </main>;
}
