import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addRoundedBox,
  roundedInstances,
  type Placement,
} from './interiorGeometry';

const MODULE_Z = [-3.8, -2.05, -0.3, 1.45, 3.2, 4.95, 6.7, 8.45, 10.2];
const CLOSED_WALL_Z = [-3.05, -1.35, 0.35, 7.05, 8.75, 10.15];

export function buildInteriorModules(group: THREE.Group, materials: InteriorMaterials): void {
  buildHullShell(group, materials);
  buildDeck(group, materials);
  buildWallModules(group, materials);
  buildCeiling(group, materials);
}

function buildHullShell(group: THREE.Group, materials: InteriorMaterials): void {
  addRoundedBox(group, [6.22, 0.2, 19.4], materials.frame, {
    position: [0, -0.12, 2],
  }, 0.075);
  addRoundedBox(group, [5.78, 0.14, 18.7], materials.shell, {
    position: [0, 3.22, 2.05],
  }, 0.055);
  for (const side of [-1, 1]) {
    addRoundedBox(group, [0.36, 0.86, 17.6], materials.shell, {
      position: [side * 3.02, 0.36, 2.5],
    }, 0.08);
    addRoundedBox(group, [0.36, 0.66, 17.6], materials.shell, {
      position: [side * 3.02, 2.78, 2.5],
    }, 0.075);
  }
}

function buildDeck(group: THREE.Group, materials: InteriorMaterials): void {
  const centerPanels = MODULE_Z.map((z) => ({ position: [0, 0.015, z] as const }));
  roundedInstances(group, [4.42, 0.085, 1.46], materials.floor, centerPanels, 0.035);
  const trenchPanels: Placement[] = [];
  MODULE_Z.forEach((z) => {
    trenchPanels.push(
      { position: [-2.46, 0.005, z] },
      { position: [2.46, 0.005, z] },
    );
  });
  roundedInstances(group, [0.62, 0.07, 1.46], materials.panel, trenchPanels, 0.025);
  roundedInstances(group, [0.055, 0.085, 16.2], materials.trim, [
    { position: [-2.17, 0.09, 2.55] },
    { position: [2.17, 0.09, 2.55] },
  ], 0.02);
}

function buildWallModules(group: THREE.Group, materials: InteriorMaterials): void {
  const shellPanels: Placement[] = [];
  const recesses: Placement[] = [];
  for (const side of [-1, 1]) {
    CLOSED_WALL_Z.forEach((z) => {
      shellPanels.push({ position: [side * 2.92, 1.62, z] });
      recesses.push({ position: [side * 2.735, 1.62, z] });
    });
  }
  roundedInstances(group, [0.3, 1.46, 1.52], materials.panel, shellPanels, 0.065);
  roundedInstances(group, [0.045, 1.05, 1.16], materials.recess, recesses, 0.018);
  roundedInstances(group, [0.15, 0.18, 16.5], materials.trim, [
    { position: [-2.78, 0.9, 2.65] },
    { position: [2.78, 0.9, 2.65] },
    { position: [-2.78, 2.43, 2.65] },
    { position: [2.78, 2.43, 2.65] },
  ], 0.045);
}

function buildCeiling(group: THREE.Group, materials: InteriorMaterials): void {
  addRoundedBox(group, [0.96, 0.2, 18.25], materials.frame, {
    position: [0, 3.02, 2],
  }, 0.065);
  for (const side of [-1, 1]) {
    addRoundedBox(group, [1.25, 0.22, 18.15], materials.panel, {
      position: [side * 2.11, 3.01, 2],
      rotation: [0, 0, side * 0.16],
    }, 0.07);
    addRoundedBox(group, [0.16, 0.1, 17.7], materials.trim, {
      position: [side * 1.43, 2.94, 2],
    }, 0.035);
  }
}
