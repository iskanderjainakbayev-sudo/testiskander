function hash(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43_758.5453;
  return value - Math.floor(value);
}

function smoother(value: number): number {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoother(x - ix);
  const fz = smoother(z - iz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
}

function fbm(x: number, z: number, frequency = 0.006): number {
  let value = 0;
  let amplitude = 0.53;
  for (let octave = 0; octave < 5; octave += 1) {
    value += valueNoise(x * frequency, z * frequency) * amplitude;
    frequency *= 2.13;
    amplitude *= 0.47;
  }
  return value;
}

export function nacreHeight(x: number, z: number): number {
  const broad = (fbm(x, z) - 0.48) * 34;
  const ridgeNoise = 1 - Math.abs(fbm(x + 730, z - 410, 0.008) * 2 - 1);
  const mesas = Math.pow(Math.max(0, ridgeNoise - 0.49), 1.72) * 92;
  const winding = Math.sin(x * 0.011 + fbm(x - 910, z + 270, 0.004) * 8.2);
  const canyon = Math.exp(-winding * winding * 34) * (15 + fbm(x, z, 0.014) * 14);
  const natural = broad + mesas - canyon;
  const shelf = Math.exp(-(x * x / 1_350 + (z - 58) ** 2 / 2_550));
  return natural * (1 - shelf) + 6.4 * shelf;
}

export function nacreRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296;
  };
}
