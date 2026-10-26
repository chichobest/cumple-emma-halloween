const STATUS = {
  live: {
    label: "En directo",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-500/40 bg-emerald-500/10",
    pulse: true,
  },
  connecting: {
    label: "Conectando…",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-500/40 bg-amber-500/10",
    pulse: true,
  },
  local: {
    label: "Modo local",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "border-sky-500/40 bg-sky-500/10",
    pulse: false,
  },
  error: {
    label: "Sin conexión",
    dot: "bg-red-500",
    text: "text-red-300",
    ring: "border-red-500/40 bg-red-500/10",
    pulse: false,
  },
};

export default function StatusPill({ status, className = "" }) {
  const s = STATUS[status] ?? STATUS.local;
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${s.ring} ${s.text} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${s.dot}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`}
        />
      </span>
      {s.label}
    </span>
  );
}
