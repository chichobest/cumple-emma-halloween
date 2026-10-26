import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChampagneGlasses,
  faCompress,
  faExpand,
  faMobileScreen,
  faVolumeHigh,
  faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  avatarFor,
  buildPodium,
  isOnPodium,
  rankParticipants,
} from "../lib/ranking";
import { playFanfare, playVote, unlockAudio } from "../lib/sound";
import { useFitToScreen, useFlip, useFullscreen } from "../lib/hooks";
import Confetti from "./Confetti";
import Podium from "./Podium";
import StatusPill from "./StatusPill";

const DECOR = [
  {
    emoji: "🦇",
    className: "left-[6%] top-[12%] text-4xl [animation-delay:-1s]",
  },
  {
    emoji: "👻",
    className: "right-[8%] top-[22%] text-5xl [animation-delay:-2.5s]",
  },
  {
    emoji: "🕸️",
    className: "left-[3%] bottom-[18%] text-5xl [animation-delay:-0.5s]",
  },
  {
    emoji: "🎃",
    className: "right-[4%] bottom-[10%] text-4xl [animation-delay:-3s]",
  },
  {
    emoji: "🦇",
    className: "left-[45%] top-[4%] text-2xl [animation-delay:-1.8s]",
  },
];

function IconButton({ onClick, title, children, highlight = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold backdrop-blur transition active:scale-95 ${
        highlight
          ? "border-orange-400/60 bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-lg shadow-purple-900/40 hover:from-purple-500 hover:to-orange-400"
          : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RankingRow({ kid, change }) {
  return (
    <li
      data-flip-id={kid.id}
      className={`relative flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-colors duration-700 ${
        change
          ? "border-emerald-400/70 bg-emerald-500/10"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <span className="w-8 shrink-0 text-center font-mono text-lg font-black text-slate-500">
        {kid.rank}º
      </span>
      <span className="text-2xl">{avatarFor(kid)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-black leading-tight text-white">
          {kid.name}
        </p>
        <p className="truncate text-sm font-semibold text-purple-300">
          {kid.costume}
        </p>
      </div>
      <span
        key={kid.points}
        className="inline-block animate-pop font-mono text-3xl font-black text-orange-400"
      >
        {kid.points}
      </span>
      <span className="text-xs font-bold uppercase text-slate-500">pts</span>
      {change && (
        <span
          key={change.key}
          className="pointer-events-none absolute -top-3 right-6 animate-bubble rounded-full bg-emerald-400 px-3 py-0.5 text-base font-black text-slate-950"
        >
          {change.delta > 0 ? `+${change.delta}` : change.delta}
        </span>
      )}
    </li>
  );
}

export default function ScoreboardView({
  store,
  soundEnabled,
  onToggleSound,
  onSwitchView,
}) {
  const { participants, status, changes } = store;
  const [celebration, setCelebration] = useState(null);
  const [isFullscreen, toggleFullscreen, canFullscreen] = useFullscreen();
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const playedRef = useRef(new Set());
  const scale = useFitToScreen(contentRef);

  const ranked = useMemo(() => rankParticipants(participants), [participants]);
  const podium = useMemo(() => buildPodium(ranked), [ranked]);
  const rest = ranked.filter((p) => !isOnPodium(p));
  const totalPoints = participants.reduce((sum, p) => sum + p.points, 0);
  const winners = podium[0];

  // Último cambio por participante, para las burbujas "+N".
  const changesById = useMemo(
    () => new Map(changes.map((c) => [c.id, c])),
    [changes],
  );
  const leaderChange = [...changes].reverse().find((c) => c.newLeader);

  useFlip(containerRef);

  // Sonido para cada voto entrante (los cambios llegan en tiempo real desde el móvil).
  useEffect(() => {
    const fresh = changes.filter((c) => !playedRef.current.has(c.key));
    fresh.forEach((c) => playedRef.current.add(c.key));
    if (!soundEnabled || !fresh.length) return;
    if (fresh.some((c) => c.newLeader)) playFanfare();
    else if (fresh.some((c) => c.delta > 0))
      playVote(Math.max(...fresh.map((c) => c.delta)));
  }, [changes, soundEnabled]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(null), 7000);
    return () => clearTimeout(timer);
  }, [celebration]);

  const celebrate = () => {
    unlockAudio();
    if (soundEnabled) playFanfare();
    setCelebration({ key: Date.now() });
  };

  const toggleSound = () => {
    unlockAudio();
    onToggleSound();
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#3b0764_0%,_#0f0a1e_45%,_#020617_100%)] md:h-screen"
    >
      {DECOR.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute animate-float opacity-20 ${d.className}`}
        >
          {d.emoji}
        </span>
      ))}

      {/* En TV todo el contenido se escala para caber en pantalla sin scroll. */}
      <div
        ref={contentRef}
        className="flex min-h-screen flex-col px-4 pb-6 pt-4 sm:px-8"
        style={
          scale < 1
            ? { transform: `scale(${scale})`, transformOrigin: "top center" }
            : undefined
        }
      >
        {/* Controles */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2">
          <StatusPill status={status} />
          <div className="flex flex-wrap items-center gap-2 opacity-70 transition-opacity hover:opacity-100 focus-within:opacity-100">
            <IconButton
              onClick={() => onSwitchView("votes")}
              title="Ir al panel de votos"
            >
              <FontAwesomeIcon icon={faMobileScreen} className="text-base" />
              <span className="hidden md:inline">Votos</span>
            </IconButton>
            <IconButton
              onClick={toggleSound}
              title={soundEnabled ? "Silenciar" : "Activar sonido"}
            >
              {soundEnabled ? (
                <FontAwesomeIcon
                  icon={faVolumeHigh}
                  className="text-base text-orange-400"
                />
              ) : (
                <FontAwesomeIcon icon={faVolumeXmark} className="text-base" />
              )}
            </IconButton>
            {canFullscreen && (
              <IconButton
                onClick={toggleFullscreen}
                title={
                  isFullscreen
                    ? "Salir de pantalla completa"
                    : "Pantalla completa"
                }
              >
                {isFullscreen ? (
                  <FontAwesomeIcon icon={faCompress} className="text-base" />
                ) : (
                  <FontAwesomeIcon icon={faExpand} className="text-base" />
                )}
              </IconButton>
            )}
            <IconButton onClick={celebrate} title="¡Celebrar podio!" highlight>
              <FontAwesomeIcon
                icon={faChampagneGlasses}
                className="text-base"
              />
              <span>¡Celebrar!</span>
            </IconButton>
          </div>
        </div>

        {/* Título */}
        <header className="relative z-10 mt-2 text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-400/90">
            🎃 El cumpleaños monstruoso de Emma 🎂
          </p>
          <h1 className="mt-1 bg-gradient-to-r from-orange-400 via-amber-200 to-purple-400 bg-clip-text font-display text-[clamp(2.5rem,min(7vw,11vh),6rem)] leading-none tracking-wide text-transparent drop-shadow-[0_4px_24px_rgba(249,115,22,0.35)]">
            Podio de Disfraces
          </h1>
        </header>

        {participants.length === 0 ? (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="text-7xl animate-float">👻</span>
            <p className="text-2xl font-black text-slate-300">
              Aún no hay participantes
            </p>
            <p className="text-slate-500">
              Añádelos desde el panel de votos del móvil.
            </p>
          </div>
        ) : (
          <>
            <section className="relative z-10 mt-[clamp(2rem,6vh,4.5rem)] flex flex-1 flex-col justify-end">
              <Podium podium={podium} changesById={changesById} />
            </section>

            {rest.length > 0 && (
              <section className="relative z-10 mx-auto mt-5 w-full max-w-6xl">
                <h2 className="mb-3 text-center text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                  {totalPoints === 0 ? "Participantes" : "Clasificación"}
                </h2>
                <ol
                  className={`grid gap-3 ${rest.length > 4 ? "md:grid-cols-2 lg:grid-cols-3" : rest.length > 1 ? "md:grid-cols-2" : ""}`}
                >
                  {rest.map((kid) => (
                    <RankingRow
                      key={kid.id}
                      kid={kid}
                      change={changesById.get(kid.id)}
                    />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}

        <footer className="relative z-10 mt-6 text-center text-sm font-semibold text-slate-500">
          {participants.length} participantes · {totalPoints} puntos repartidos
          {totalPoints > 0 && <> · {Math.floor(totalPoints / 6)} papeletas</>}
        </footer>
      </div>

      {/* Nuevo líder (automático) */}
      {leaderChange && !celebration && (
        <>
          <Confetti key={leaderChange.key} amount={0.45} />
          <div
            key={`banner-${leaderChange.key}`}
            className="pointer-events-none fixed inset-x-0 top-[6%] z-40 flex justify-center px-4"
          >
            <div className="animate-banner rounded-3xl border-2 border-amber-300/70 bg-slate-950/90 px-8 py-4 text-center shadow-2xl shadow-amber-500/30">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">
                ¡Nuevo líder!
              </p>
              <p className="font-display text-[clamp(2rem,5vw,4rem)] leading-tight text-white">
                👑 {leaderChange.name}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Celebración final (botón) */}
      {celebration && (
        <>
          <Confetti key={celebration.key} />
          <button
            onClick={() => setCelebration(null)}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm"
            aria-label="Cerrar celebración"
          >
            <div className="animate-banner text-center">
              <p className="text-[clamp(4rem,12vw,9rem)] leading-none">🏆</p>
              <p className="mt-2 text-lg font-black uppercase tracking-[0.35em] text-amber-300">
                {winners.length > 1
                  ? "¡Ganadores!"
                  : winners.length
                    ? "¡Ganador/a!"
                    : "¡Feliz Halloween!"}
              </p>
              {winners.length > 0 ? (
                winners.map((kid) => (
                  <div key={kid.id} className="mt-2">
                    <p className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-none text-white drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                      {avatarFor(kid)} {kid.name}
                    </p>
                    <p className="text-[clamp(1rem,2vw,1.75rem)] font-bold text-purple-200">
                      {kid.costume} · {kid.points} pts
                    </p>
                  </div>
                ))
              ) : (
                <p className="mt-2 font-display text-[clamp(3rem,9vw,7rem)] text-white">
                  ¡Cumpleaños feliz, Emma!
                </p>
              )}
            </div>
          </button>
        </>
      )}
    </div>
  );
}
