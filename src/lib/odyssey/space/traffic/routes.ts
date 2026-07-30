import * as THREE from 'three';
import { DISCOVERIES } from '../../discoveries';
import type { Route } from './types';

const point = (x: number, y: number, z: number): THREE.Vector3 =>
  new THREE.Vector3(x, y, z);

function orbit(
  id: string,
  center: readonly [number, number, number],
  radii: readonly [number, number, number],
  twist: number,
  color: number,
): Route {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    points.push(point(
      center[0] + Math.cos(angle) * radii[0],
      center[1] + Math.sin(angle * 2 + twist) * radii[1],
      center[2] + Math.sin(angle) * radii[2],
    ));
  }
  return {
    id,
    curve: new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5),
    color: new THREE.Color(color),
  };
}

function circuit(
  id: string,
  points: readonly (readonly [number, number, number])[],
  color: number,
): Route {
  return {
    id,
    curve: new THREE.CatmullRomCurve3(
      points.map((value) => point(...value)),
      true,
      'centripetal',
      0.5,
    ),
    color: new THREE.Color(color),
  };
}

export function createTrafficRoutes(): Map<string, Route> {
  const { solace, veil, pilgrim, atlas } = DISCOVERIES;
  const routes = [
    orbit('solace-low', solace.position, [128, 24, 151], 0.3, 0x4da5b5),
    orbit('solace-high', solace.position, [224, 73, 178], 2.2, 0x896d48),
    orbit('veil-perimeter', veil.position, [205, 96, 244], 1.1, 0xa9475d),
    orbit('pilgrim-watch', pilgrim.position, [154, 82, 121], 2.7, 0x7e9d83),
    orbit('atlas-approach', atlas.position, [263, 118, 176], 0.8, 0xc58e4c),
    circuit('long-haul', [
      [-80, 38, -530], [270, -78, -650], [556, 12, -1010],
      [752, 138, -1400], [536, 60, -1810], [8, 50, -2120],
      [-415, 142, -1705], [-692, 70, -1240], [-530, -30, -830],
    ], 0x415f72),
    circuit('pilgrim-supply', [
      [430, 42, -1070], [644, 128, -1310], [836, 205, -1498],
      [665, 94, -1660], [410, 8, -1430], [340, -40, -1190],
    ], 0x776c52),
  ];
  return new Map(routes.map((route) => [route.id, route]));
}
