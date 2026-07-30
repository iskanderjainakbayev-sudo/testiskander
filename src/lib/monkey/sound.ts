let audioContext: AudioContext | undefined;

export function playTone(kind: 'banana' | 'chest' | 'hurt' | 'buy') {
  const context = audioContext ??= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencies = { banana: 740, chest: 380, hurt: 130, buy: 560 };
  oscillator.frequency.value = frequencies[kind];
  oscillator.type = kind === 'hurt' ? 'sawtooth' : 'sine';
  gain.gain.setValueAtTime(0.06, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}
