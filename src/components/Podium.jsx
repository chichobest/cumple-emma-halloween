import { avatarFor, MEDALS, visibleOnPlace } from "../lib/ranking";

const PLACES = {
  1: {
    order: "order-2",
    height: "h-[clamp(5rem,21vh,20rem)]",
    block: "from-amber-300 via-amber-500 to-orange-700 shadow-amber-500/40",
    glow: "bg-amber-400/30",
    label: "1º",
  },
  2: {
    order: "order-1",
    height: "h-[clamp(3.75rem,15.5vh,15rem)]",
    block: "from-slate-100 via-slate-300 to-slate-500 shadow-slate-300/30",
    glow: "bg-slate-300/20",
    label: "2º",
  },
  3: {
    order: "order-3",
    height: "h-[clamp(2.75rem,12.5vh,12rem)]",
    block: "from-orange-300 via-orange-600 to-amber-900 shadow-orange-700/30",
    glow: "bg-orange-600/20",
    label: "3º",
  },
};

function PointsBubble({ change }) {
  if (!change) return null;
  return (
    <span
      key={change.key}
      className="pointer-events-none absolute -top-3 left-1/2 z-10 animate-bubble whitespace-nowrap rounded-full bg-emerald-400 px-3 py-1 text-lg font-black text-slate-950 shadow-lg shadow-emerald-500/40"
    >
      {change.delta > 0 ? `+${change.delta}` : change.delta}
    </span>
  );
}

function PodiumKid({ kid, place, compact, change }) {
  return (
    <div
      data-flip-id={kid.id}
      className="relative flex flex-col items-center text-center"
    >
      <PointsBubble change={change} />
      <div
        className={`relative mb-2 flex items-center justify-center rounded-full border-2 bg-slate-900/80 ${
          place === 1
            ? "border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.45)]"
            : "border-slate-600"
        } ${compact ? "h-[clamp(2.75rem,7.5vh,5.5rem)] w-[clamp(2.75rem,7.5vh,5.5rem)] text-[clamp(1.5rem,4.5vh,3.25rem)]" : place === 1 ? "h-[clamp(3.5rem,12vh,10rem)] w-[clamp(3.5rem,12vh,10rem)] text-[clamp(2rem,7.5vh,6rem)]" : "h-[clamp(3rem,9.5vh,7.5rem)] w-[clamp(3rem,9.5vh,7.5rem)] text-[clamp(1.6rem,6vh,4.25rem)]"}`}
      >
        {place === 1 && !compact && (
          <span className="absolute -top-[45%] text-[clamp(1.75rem,6.5vh,4.5rem)] animate-float">
            👑
          </span>
        )}
        <span>{avatarFor(kid)}</span>
      </div>
      <p
        className={`max-w-full truncate font-black leading-tight text-white ${
          compact
            ? "text-[clamp(1.1rem,min(2.2vw,4vh),2.25rem)]"
            : place === 1
              ? "text-[clamp(1.5rem,min(4.5vw,7.5vh),5rem)]"
              : "text-[clamp(1.2rem,min(3.2vw,5.5vh),3.25rem)]"
        }`}
      >
        {kid.name}
      </p>
      <p
        className={`max-w-full truncate font-semibold text-purple-300 ${compact ? "text-xs" : "text-[clamp(0.8rem,1.5vw,1.6rem)]"}`}
      >
        {kid.costume}
      </p>
      <p className="mt-1 flex items-baseline gap-1 leading-none">
        <span
          key={kid.points}
          className={`inline-block animate-pop font-mono font-black text-orange-400 ${
            compact
              ? "text-[clamp(1.4rem,min(2.6vw,5vh),2.75rem)]"
              : place === 1
                ? "text-[clamp(2rem,min(6vw,10vh),6rem)]"
                : "text-[clamp(1.5rem,min(4vw,7vh),4rem)]"
          }`}
        >
          {kid.points}
        </span>
        <span className="text-xs font-bold uppercase text-slate-400">pts</span>
      </p>
    </div>
  );
}

function PodiumColumn({ place, kids, changesById }) {
  const style = PLACES[place];
  const compact = kids.length > 1;
  const visible = visibleOnPlace(kids);
  const hidden = kids.length - visible.length;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center justify-end ${style.order}`}
    >
      <div className="relative mb-3 flex w-full min-w-0 flex-col items-center gap-3 px-1">
        {kids.length === 0 ? (
          <div className="flex flex-col items-center text-slate-500">
            <span className="text-[clamp(2rem,6vh,3.5rem)] opacity-50 animate-float">
              👻
            </span>
            <span className="text-sm font-bold">¿Quién será?</span>
          </div>
        ) : (
          <>
            {compact && (
              <span className="rounded-full border border-purple-400/50 bg-purple-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-widest text-purple-200">
                ¡Empate!
              </span>
            )}
            <div
              className={
                compact
                  ? "flex w-full flex-wrap justify-center gap-x-4 gap-y-2"
                  : "w-full"
              }
            >
              {visible.map((kid) => (
                <PodiumKid
                  key={kid.id}
                  kid={kid}
                  place={place}
                  compact={compact}
                  change={changesById.get(kid.id)}
                />
              ))}
            </div>
            {hidden > 0 && (
              <span className="text-sm font-bold text-slate-400">
                y {hidden} más
              </span>
            )}
          </>
        )}
      </div>

      <div className={`relative w-full ${style.height}`}>
        <div
          className={`absolute -inset-x-2 -top-6 h-12 rounded-full blur-2xl ${style.glow}`}
        />
        <div
          className={`relative flex h-full w-full flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b pt-3 shadow-2xl ${style.block}`}
        >
          <span className="text-[clamp(1.5rem,5vh,4rem)] leading-none drop-shadow">
            {MEDALS[place]}
          </span>
          <span className="font-display text-[clamp(1.25rem,4vh,3.25rem)] leading-none text-slate-950/70">
            {style.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Podium({ podium, changesById }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-end gap-2 sm:gap-4">
      {[1, 2, 3].map((place) => (
        <PodiumColumn
          key={place}
          place={place}
          kids={podium[place - 1]}
          changesById={changesById}
        />
      ))}
    </div>
  );
}
