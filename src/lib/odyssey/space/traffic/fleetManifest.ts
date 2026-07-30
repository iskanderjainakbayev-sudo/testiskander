import * as THREE from 'three';
import type { HullId, HullProfile, VesselSpec } from './types';

const v = (x: number, y: number, z: number): THREE.Vector3 =>
  new THREE.Vector3(x, y, z);

export const HULL_IDS: readonly HullId[] = [
  'arkose', 'caravel', 'orison', 'kestrel', 'manta', 'lancer',
];

export const HULL_PROFILES: Record<HullId, HullProfile> = {
  arkose: {
    length: 22, engines: [v(-3.3, 0, -10), v(3.3, 0, -10)],
    portStrobe: v(-6.1, 0, -1), starboardStrobe: v(6.1, 0, -1),
  },
  caravel: {
    length: 26, engines: [v(-4.2, 0.1, -12), v(4.2, 0.1, -12)],
    portStrobe: v(-7.4, 0.2, -2), starboardStrobe: v(7.4, 0.2, -2),
  },
  orison: {
    length: 14, engines: [v(0, -0.5, -6.8)],
    portStrobe: v(-5.2, 0, 0), starboardStrobe: v(5.2, 0, 0),
  },
  kestrel: {
    length: 17, engines: [v(-2.2, -0.3, -7.8), v(2.2, -0.3, -7.8)],
    portStrobe: v(-6.2, 0, -0.5), starboardStrobe: v(6.2, 0, -0.5),
  },
  manta: {
    length: 16, engines: [v(-2.7, -0.2, -7.4), v(2.7, -0.2, -7.4)],
    portStrobe: v(-7.2, 0, -1.5), starboardStrobe: v(7.2, 0, -1.5),
  },
  lancer: {
    length: 19, engines: [v(-1.8, -0.4, -8.6), v(1.8, -0.4, -8.6)],
    portStrobe: v(-5.1, 0.1, -2), starboardStrobe: v(5.1, 0.1, -2),
  },
};

export const VESSELS: readonly VesselSpec[] = [
  { name: 'MV Cinderwake', class: 'freighter', hull: 'arkose', route: 'long-haul', phase: .03, speed: .0022, scale: 1.35, tint: 0x87929a, transmission: 'Cinderwake acknowledges. Carrying seed vaults to Pilgrim.' },
  { name: 'Khepri Heavy Lift', class: 'freighter', hull: 'caravel', route: 'solace-high', phase: .18, speed: .0065, scale: 1.2, tint: 0x9b8770, transmission: 'Khepri requests a clear burn corridor above Solace.' },
  { name: 'MV Blue Calyx', class: 'freighter', hull: 'arkose', route: 'pilgrim-supply', phase: .55, speed: .0042, scale: 1.08, tint: 0x738794, transmission: 'Blue Calyx shares fresh Pilgrim approach vectors.' },
  { name: 'Tern Reliquary', class: 'freighter', hull: 'caravel', route: 'long-haul', phase: .63, speed: .0018, scale: 1.48, tint: 0x827b74, transmission: 'Tern Reliquary reports quiet skies on the long-haul lane.' },
  { name: 'Prospector Ilex', class: 'surveyor', hull: 'orison', route: 'solace-low', phase: .10, speed: .011, scale: .88, tint: 0x89a3a2, transmission: 'Ilex: subglacial songs are repeating in prime-number intervals.' },
  { name: 'Vesper Cartographic', class: 'surveyor', hull: 'kestrel', route: 'veil-perimeter', phase: .37, speed: .0068, scale: .94, tint: 0x7d879c, transmission: 'Vesper warns: hold outside the Veil photon ring.' },
  { name: 'Surveyor Argo', class: 'surveyor', hull: 'orison', route: 'pilgrim-watch', phase: .72, speed: .009, scale: 1.0, tint: 0x8b9a89, transmission: 'Argo has mapped warm chambers inside the silent ark.' },
  { name: 'CS Nacre', class: 'surveyor', hull: 'kestrel', route: 'atlas-approach', phase: .07, speed: .0052, scale: .9, tint: 0xa09182, transmission: 'Nacre records impossible parallax beyond the Atlas aperture.' },
  { name: 'Peregrine Nine', class: 'surveyor', hull: 'orison', route: 'long-haul', phase: .82, speed: .0028, scale: .78, tint: 0x7696a0, transmission: 'Peregrine Nine relays a low-power greeting.' },
  { name: 'ESV Halcyon', class: 'escort', hull: 'manta', route: 'solace-low', phase: .44, speed: .014, scale: .84, tint: 0x667c8d, transmission: 'Halcyon escort wing identifies you as friendly.' },
  { name: 'Aegis Rook', class: 'escort', hull: 'lancer', route: 'solace-high', phase: .77, speed: .011, scale: .9, tint: 0x787f87, transmission: 'Rook control: traffic lane is yours.' },
  { name: 'ESV Quiet Knife', class: 'escort', hull: 'manta', route: 'veil-perimeter', phase: .84, speed: .0105, scale: .76, tint: 0x606b78, transmission: 'Quiet Knife is shadowing an unidentified echo.' },
  { name: 'Lancer Antares', class: 'escort', hull: 'lancer', route: 'pilgrim-watch', phase: .20, speed: .013, scale: .92, tint: 0x736e69, transmission: 'Antares keeps watch while Pilgrim sleeps.' },
  { name: 'ESV Thistledown', class: 'escort', hull: 'manta', route: 'pilgrim-supply', phase: .32, speed: .008, scale: .8, tint: 0x71838a, transmission: 'Thistledown: convoy intact, no pursuit detected.' },
  { name: 'Aegis Meridian', class: 'escort', hull: 'lancer', route: 'atlas-approach', phase: .48, speed: .0085, scale: 1.0, tint: 0x8d806e, transmission: 'Meridian holds position at the last human beacon.' },
  { name: 'ESV Lantern', class: 'escort', hull: 'manta', route: 'atlas-approach', phase: .76, speed: .0097, scale: .74, tint: 0x6e7a70, transmission: 'Lantern transmits the old passage blessing.' },
];
