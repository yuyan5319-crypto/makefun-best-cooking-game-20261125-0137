// Sizzle & Serve — sound: tiny WebAudio synth effects, generated at run
// time. No audio files, no network, nothing to download. Every effect is a
// short oscillator or filtered-noise burst so the game stays silent until
// the player first interacts (browsers require a gesture first).

export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, seconds, type = 'sine', slideTo = null) {
    if (!ensure() || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + seconds);
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  function noise(seconds, filterFreq) {
    if (!ensure() || ctx.state !== 'running') return;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    source.connect(filter);
    filter.connect(master);
    source.start();
  }

  return {
    resume() {
      if (ensure() && ctx.state === 'suspended') void ctx.resume();
    },
    click() { tone(660, 0.06, 'triangle'); },
    sizzle() { noise(0.5, 3200); tone(180, 0.3, 'sawtooth', 90); },
    serve() { tone(523, 0.12, 'sine'); setTimeout(() => tone(784, 0.18, 'sine'), 90); },
    buy() { tone(440, 0.1, 'square'); setTimeout(() => tone(660, 0.1, 'square'), 80); setTimeout(() => tone(880, 0.16, 'square'), 160); },
    alarm() { tone(220, 0.25, 'sawtooth', 160); },
  };
}
