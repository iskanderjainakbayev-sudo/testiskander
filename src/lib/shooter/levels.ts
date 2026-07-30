export type PlatformSpec = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
};

export type Weather = "clear" | "rain" | "snow" | "shiny" | "sandstorm";

export type Mission = {
  id: number;
  name: string;
  location: string;
  briefing: string;
  objective: string;
  reward: string;
  enemies: number;
  tint: number;
  weather: Weather;
  boss?: boolean;
  platforms: PlatformSpec[];
};

const course = (offset: number, climb = 1): PlatformSpec[] => [
  { x: -5 + offset, z: 6, width: 4, depth: 4, height: 1 },
  { x: -8 + offset, z: 1, width: 3, depth: 3, height: 2 * climb },
  { x: -4 + offset, z: -5, width: 4, depth: 3, height: 3 * climb },
  { x: 2 + offset, z: -8, width: 3, depth: 3, height: 2 * climb },
];

export const missions: Mission[] = [
  { id: 1, name: "TRAINING", location: "Kestrel Range", briefing: "Learn the controls with Captain Vale.", objective: "Clear the training patrol.", reward: "AR-9 rifle", enemies: 4, tint: 0x76e8df, weather: "clear", platforms: course(0) },
  { id: 2, name: "SILENT RELAY", location: "Sirocco Desert", briefing: "Cut the enemy command network.", objective: "Destroy the relay security detail.", reward: "Optic unlock", enemies: 5, tint: 0xf6bd6a, weather: "clear", platforms: course(8) },
  { id: 3, name: "GHOST LINE", location: "Pinefall Forest", briefing: "Reach the prisoners before extraction.", objective: "Eliminate guards and secure the rescue route.", reward: "Armor plate", enemies: 6, tint: 0x71c98a, weather: "rain", platforms: course(-8) },
  { id: 4, name: "BLACK FILE", location: "Orion Harbor", briefing: "Intel is held inside the customs station.", objective: "Clear the harbor security team.", reward: "SMG unlock", enemies: 6, tint: 0x6fa8ef, weather: "rain", platforms: course(5, 1.15) },
  { id: 5, name: "CITYFALL", location: "Vanta City", briefing: "Break through before the cordon closes.", objective: "Open the escape corridor.", reward: "Extended magazine", enemies: 7, tint: 0xce83ef, weather: "clear", platforms: course(-5, 1.1) },
  { id: 6, name: "LAST LIGHT", location: "Echo Base", briefing: "Your home is under siege.", objective: "Repel the assault force.", reward: "Combat shotgun", enemies: 8, tint: 0xff776d, weather: "rain", platforms: course(0, 1.2) },
  { id: 7, name: "CINDERWORKS", location: "Helix Factory", briefing: "Fight through the production line.", objective: "Neutralize the factory command squad.", reward: "Heavy armor", enemies: 8, tint: 0xff8b58, weather: "clear", platforms: course(7, 1.25) },
  { id: 8, name: "DEEP VAULT", location: "Boreal Bunker", briefing: "Infiltrate before they seal the blast doors.", objective: "Clear the bunker defense grid.", reward: "Sniper rifle", enemies: 9, tint: 0x94d4ff, weather: "snow", platforms: course(-7, 1.25) },
  { id: 9, name: "ZERO HOUR", location: "Arclight Silo", briefing: "The launch sequence has begun.", objective: "Stop the missile launch guard.", reward: "Recon visor", enemies: 9, tint: 0xffcf65, weather: "clear", platforms: course(3, 1.35) },
  { id: 10, name: "SHADOW KING", location: "Enemy Citadel", briefing: "End the war at its source.", objective: "Defeat Commander Voss and his elite guard.", reward: "Campaign complete", enemies: 9, tint: 0xff526f, weather: "rain", boss: true, platforms: course(0, 1.5) },
];
