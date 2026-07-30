import type { BackroomsLevel } from './types';

export const LEVELS: BackroomsLevel[] = [
  { id: 0, title: 'LEVEL 0', subtitle: 'THE LOBBY', palette: { wall: 0xb8a55b, floor: 0x746c45, light: 0xffe59a, fog: 0x9d9052 }, objective: 'Find the red exit door.' },
  { id: 1, title: 'LEVEL 1', subtitle: 'THE WAREHOUSE', palette: { wall: 0x465157, floor: 0x20272a, light: 0xa7d3dc, fog: 0x18262b }, objective: 'Restore power to the security door.' },
  { id: 2, title: 'LEVEL 2', subtitle: 'PIPE DREAMS', palette: { wall: 0x633f32, floor: 0x241c1b, light: 0xf07d49, fog: 0x301810 }, objective: 'Follow the emergency lights.' },
  { id: 3, title: 'LEVEL 3', subtitle: 'ELECTRICAL STATION', palette: { wall: 0x35393c, floor: 0x121518, light: 0xffbf45, fog: 0x111419 }, objective: 'Find a way out before the lights die.' },
  { id: 4, title: 'LEVEL 4', subtitle: 'ABANDONED OFFICE', palette: { wall: 0x85909a, floor: 0x34404b, light: 0xd8efff, fog: 0x2a343d }, objective: 'Locate the marked archive door.' },
  { id: 5, title: 'LEVEL 5', subtitle: 'THE HOTEL', palette: { wall: 0x69433d, floor: 0x4a2020, light: 0xffa26c, fog: 0x2c1618 }, objective: 'The key is not where you left it.' },
  { id: 6, title: 'LEVEL 6', subtitle: 'DARKNESS', palette: { wall: 0x050609, floor: 0x020204, light: 0xdbeaff, fog: 0x010104 }, objective: 'Do not let the dark hear you.' },
];

export function levelFor(id: number) { return LEVELS[id] ?? LEVELS[0]; }
