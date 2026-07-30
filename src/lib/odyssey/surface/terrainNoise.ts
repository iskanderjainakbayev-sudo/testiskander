function hash(x: number, z: number) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function smooth(value: number) {
  return value * value * (3 - 2 * value);
}

function valueNoise(x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
}

function fbm(x: number, z: number) {
  let value = 0;
  let amplitude = 0.54;
  let frequency = 0.009;
  for (let octave = 0; octave < 5; octave += 1) {
    value += valueNoise(x * frequency, z * frequency) * amplitude;
    frequency *= 2.07;
    amplitude *= 0.48;
  }
  return value;
}

export function surfaceHeight(x: number, z: number) {
  const broad = fbm(x, z);
  const ridges = 1 - Math.abs(fbm(x + 610, z - 430) * 2 - 1);
  const fractured = Math.pow(Math.max(0, ridges - 0.46), 2) * 38;
  const basin = Math.hypot(x * 0.0012, z * 0.0012) * 5;
  const natural = (broad - 0.49) * 27 + fractured - basin;
  const landingShelf = Math.exp(-(x * x / 780 + (z - 70) ** 2 / 1_850));
  return natural * (1 - landingShelf) + 3.2 * landingShelf;
}

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}
