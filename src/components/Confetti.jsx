// Piezas pseudoaleatorias deterministas (generadas una vez al cargar el módulo).
const seeded = (i, salt) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const COLORS = [
  "#f97316",
  "#fbbf24",
  "#a855f7",
  "#22c55e",
  "#f472b6",
  "#fef3c7",
];
const EMOJIS = ["🎃", "👻", "🦇", "🍬", "⭐", "🍭"];

const PIECES = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  left: seeded(i, 1) * 100,
  delay: seeded(i, 2) * 1.2,
  duration: 2.6 + seeded(i, 3) * 2.2,
  drift: (seeded(i, 4) - 0.5) * 240,
  spin: (seeded(i, 5) - 0.5) * 1440,
  size: 8 + seeded(i, 6) * 10,
  color: COLORS[i % COLORS.length],
  emoji: i % 5 === 0 ? EMOJIS[i % EMOJIS.length] : null,
}));

export default function Confetti({ amount = 1 }) {
  const pieces = PIECES.slice(0, Math.round(PIECES.length * amount));
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
            ...(p.emoji
              ? { fontSize: `${p.size * 2}px` }
              : {
                  width: `${p.size}px`,
                  height: `${p.size * 0.45}px`,
                  background: p.color,
                }),
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
