// Sonidos sintéticos con Web Audio API (sin ficheros de audio).
let audioCtx = null;

function getContext() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// Llamar desde un gesto del usuario: los navegadores bloquean el audio hasta entonces.
export const unlockAudio = () => getContext();

function tone(
  ctx,
  { freq, start, duration, type = "sine", volume = 0.2, slideTo },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo)
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// Más puntos = notas más agudas y más "brillo".
export function playVote(delta = 1) {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [392, 494, 587].slice(0, Math.min(3, Math.max(1, delta)));
  notes.forEach((freq, i) =>
    tone(ctx, {
      freq,
      start: t + i * 0.08,
      duration: 0.22,
      type: "triangle",
      volume: 0.18,
      slideTo: freq * 1.25,
    }),
  );
}

// "Buuu" descendente para deshacer.
export function playUndo() {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, {
    freq: 330,
    start: ctx.currentTime,
    duration: 0.35,
    type: "sine",
    volume: 0.15,
    slideTo: 140,
  });
}

// Fanfarria: arpegio mayor + acorde final.
export function playFanfare() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) =>
    tone(ctx, {
      freq,
      start: t + i * 0.14,
      duration: 0.18,
      type: "square",
      volume: 0.08,
    }),
  );
  [523.25, 659.25, 783.99, 1046.5].forEach((freq) =>
    tone(ctx, {
      freq,
      start: t + 0.46,
      duration: 1.1,
      type: "triangle",
      volume: 0.12,
    }),
  );
}
