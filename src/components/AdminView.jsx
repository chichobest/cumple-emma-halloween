import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faFlagCheckered,
  faMagnifyingGlass,
  faMinus,
  faPen,
  faPlus,
  faRotateLeft,
  faSliders,
  faTrashCan,
  faTv,
  faUserPlus,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import {
  avatarFor,
  countBallots,
  isOnPodium,
  MEDALS,
  rankParticipants,
} from "../lib/ranking";
import { playUndo, playVote, unlockAudio } from "../lib/sound";
import { useGoalReached, usePersistentState } from "../lib/hooks";
import ParticipantModal from "./ParticipantModal";

const HISTORY_KEY = "emma_halloween_history";
const BALLOT_VALUES = [3, 2, 1];

// Una papeleta se completa cuando se han dado +1, +2 y +3.
function ballotProgress(history) {
  let count = 0;
  let current = [];
  for (const entry of [...history].reverse()) {
    current.push(entry);
    if (new Set(current.map((e) => e.delta)).size === 3) {
      count += 1;
      current = [];
    }
  }
  return { count, current };
}

function StatusNotice({ status, errorMessage }) {
  if (status === "local") {
    return (
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
        <p className="font-bold">Modo local (sin Firebase)</p>
        <p className="text-sky-200/80">
          El marcador solo se actualiza en otra pestaña de{" "}
          <b>este mismo navegador</b>. Para votar desde el móvil y verlo en la
          TV, configura Firebase (ver README).
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
        <p className="font-bold">No se puede conectar con Firestore</p>
        <p className="break-words text-red-200/80">{errorMessage}</p>
      </div>
    );
  }
  return null;
}

function BallotTargetInput({ value, onChange }) {
  // Texto mientras se escribe; fuera de edición se muestra el valor guardado.
  const [draft, setDraft] = useState(null);

  const commit = (next) => {
    const clean = Math.max(0, Math.floor(Number(next) || 0));
    setDraft(null);
    if (clean !== value) onChange(clean);
  };

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
        <FontAwesomeIcon icon={faFlagCheckered} className="text-sm" /> Papeletas
        a recontar
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => commit(value - 1)}
          disabled={value <= 0}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-slate-200 active:scale-95 disabled:opacity-40"
          aria-label="Una papeleta menos"
        >
          <FontAwesomeIcon icon={faMinus} className="text-base" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="—"
          value={draft ?? String(value || "")}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== null && commit(draft)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="h-11 w-20 rounded-lg border border-slate-800 bg-slate-950 text-center font-mono text-xl font-black text-white focus:border-orange-500 focus:outline-none"
          aria-label="Número de papeletas a recontar"
        />
        <button
          onClick={() => commit(value + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-slate-200 active:scale-95"
          aria-label="Una papeleta más"
        >
          <FontAwesomeIcon icon={faPlus} className="text-base" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {value > 0
          ? `La celebración saltará sola en la TV al completar la papeleta ${value}.`
          : "Sin meta: la celebración solo se lanza con el botón de la TV."}
      </p>
    </div>
  );
}

function KidCard({ kid, onVote, onEdit, onDelete, flash, ballotIds }) {
  const inBallot = ballotIds.has(kid.id);
  return (
    <li
      className={`rounded-2xl border bg-slate-900/90 p-3 shadow-lg transition-all duration-300 ${
        flash
          ? "border-emerald-400 ring-2 ring-emerald-400/40"
          : "border-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl">
          {avatarFor(kid)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-base font-black text-white">
            <span className="truncate">{kid.name}</span>
            {isOnPodium(kid) && (
              <span className="text-sm">{MEDALS[kid.rank]}</span>
            )}
            {inBallot && (
              <span className="shrink-0 rounded-md bg-purple-500/20 px-1.5 text-[10px] font-bold uppercase text-purple-200">
                en papeleta
              </span>
            )}
          </p>
          <p className="truncate text-xs font-semibold text-purple-300">
            {kid.costume}
          </p>
        </div>
        <div className="text-right">
          <span
            key={kid.points}
            className="inline-block animate-pop font-mono text-2xl font-black text-orange-400"
          >
            {kid.points}
          </span>
          <span className="ml-0.5 text-[10px] font-bold uppercase text-slate-500">
            pts
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[1, 2, 3].map((delta) => (
            <button
              key={delta}
              onClick={() => onVote(kid, delta)}
              className={`h-14 rounded-xl border text-xl font-black transition active:scale-95 ${
                delta === 3
                  ? "border-orange-400/60 bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 active:bg-orange-400"
                  : delta === 2
                    ? "border-orange-500/40 bg-orange-500/20 text-orange-300 active:bg-orange-500/40"
                    : "border-slate-700 bg-slate-800 text-orange-300 active:bg-slate-700"
              }`}
            >
              +{delta}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onEdit(kid)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
            aria-label={`Editar a ${kid.name}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-base" />
          </button>
          <button
            onClick={() => onDelete(kid)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400"
            aria-label={`Eliminar a ${kid.name}`}
          >
            <FontAwesomeIcon icon={faTrashCan} className="text-base" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminView({ store, soundEnabled }) {
  const { participants, settings, status, errorMessage } = store;
  const { ballotTarget } = settings;
  const ballots = countBallots(participants);
  const [history, setHistory] = usePersistentState(HISTORY_KEY, []);
  const [modal, setModal] = useState(null); // null | { participant?: Participant }
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);
  const [copied, setCopied] = useState(false);

  const ranked = useMemo(() => rankParticipants(participants), [participants]);
  const rankById = useMemo(
    () => new Map(ranked.map((p) => [p.id, p.rank])),
    [ranked],
  );

  // Orden alfabético estable: los botones no se mueven mientras Emma vota.
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return [...participants]
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .filter(
        (p) =>
          !q || `${p.name} ${p.costume}`.toLocaleLowerCase("es").includes(q),
      )
      .map((p) => ({ ...p, rank: rankById.get(p.id) }));
  }, [participants, query, rankById]);

  const ballot = useMemo(() => ballotProgress(history), [history]);
  const ballotDeltas = new Set(ballot.current.map((e) => e.delta));
  const ballotIds = new Set(ballot.current.map((e) => e.id));
  const lastAction = history[0];

  useGoalReached(ballots, ballotTarget, status !== "connecting", () =>
    setToast({
      tone: "info",
      text: "¡Recuento completo! 🎉 Celebración en la TV",
    }),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.tone === "error" ? 5000 : 2600,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(timer);
  }, [flash]);

  const fail = (error) =>
    setToast({ tone: "error", text: `No se pudo guardar: ${error.message}` });

  const handleVote = async (kid, delta) => {
    unlockAudio();
    if (soundEnabled) playVote(delta);
    navigator.vibrate?.(15);
    setFlash({ id: kid.id, key: Date.now() });

    if (ballotDeltas.has(delta)) {
      setToast({
        tone: "warn",
        text: `Ojo: esta papeleta ya tenía un +${delta}`,
      });
    } else if (ballotIds.has(kid.id)) {
      setToast({
        tone: "warn",
        text: `Ojo: ${kid.name} ya tiene puntos en esta papeleta`,
      });
    }

    setHistory((prev) =>
      [
        { id: kid.id, delta, name: kid.name, timestamp: Date.now() },
        ...prev,
      ].slice(0, 300),
    );
    try {
      await store.addPoints(kid.id, delta);
    } catch (error) {
      setHistory((prev) => prev.slice(1));
      fail(error);
    }
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    if (soundEnabled) playUndo();
    setHistory((prev) => prev.slice(1));
    try {
      await store.addPoints(lastAction.id, -lastAction.delta);
      setToast({
        tone: "info",
        text: `Deshecho: +${lastAction.delta} a ${lastAction.name}`,
      });
    } catch (error) {
      fail(error);
    }
  };

  const handleSave = useCallback(
    async (data) => {
      try {
        if (modal?.participant)
          await store.updateParticipant(modal.participant.id, data);
        else await store.addParticipant(data);
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    },
    [modal, store],
  );

  const handleDelete = async (kid) => {
    if (!window.confirm(`¿Eliminar a ${kid.name} (${kid.points} pts)?`)) return;
    try {
      await store.removeParticipant(kid.id);
      setHistory((prev) => prev.filter((h) => h.id !== kid.id));
    } catch (error) {
      fail(error);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm("¿Poner a 0 los puntos de todos? No se puede deshacer.")
    )
      return;
    try {
      await store.resetPoints();
      setHistory([]);
      setToast({ tone: "info", text: "Puntos reiniciados" });
    } catch (error) {
      fail(error);
    }
  };

  const tvUrl = `${window.location.origin}${window.location.pathname}#tv`;
  const copyTvUrl = async () => {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copia este enlace para la TV:", tvUrl);
    }
  };

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-32 pt-4">
      <StatusNotice status={status} errorMessage={errorMessage} />

      {/* Papeleta en curso */}
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Papeleta en curso
          </p>
          <p className="text-sm text-orange-200">
            {ballotTarget > 0 ? (
              <>
                {ballots} de {ballotTarget} papeletas
              </>
            ) : (
              <>
                {ballot.count} papeleta{ballot.count === 1 ? "" : "s"} completa
                {ballot.count === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          {BALLOT_VALUES.map((value) => (
            <span
              key={value}
              className={`flex h-9 w-11 items-center justify-center rounded-lg border text-sm font-black transition ${
                ballotDeltas.has(value)
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                  : "border-dashed border-slate-700 text-slate-500"
              }`}
            >
              {ballotDeltas.has(value) ? (
                <FontAwesomeIcon icon={faCheck} className="text-base" />
              ) : (
                `+${value}`
              )}
            </span>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        {participants.length > 5 && (
          <label className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 text-base -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              placeholder="Buscar niño o disfraz…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 text-base text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </label>
        )}
        <button
          onClick={() => setModal({})}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 active:scale-95 ${
            participants.length > 5 ? "" : "flex-1"
          }`}
        >
          <FontAwesomeIcon icon={faUserPlus} className="text-base" />
          <span>Añadir</span>
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
          <span className="text-5xl">👻</span>
          <p className="font-bold text-slate-300">
            Todavía no hay participantes
          </p>
          <button
            onClick={() => store.loadDemo().catch(fail)}
            className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-base" />{" "}
            Cargar participantes de ejemplo
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((kid) => (
            <KidCard
              key={kid.id}
              kid={kid}
              flash={flash?.id === kid.id}
              ballotIds={ballotIds}
              onVote={handleVote}
              onEdit={(p) => setModal({ participant: p })}
              onDelete={handleDelete}
            />
          ))}
          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              Nadie coincide con “{query}”.
            </p>
          )}
        </ul>
      )}

      {/* Opciones */}
      <details className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-300">
          <FontAwesomeIcon icon={faSliders} className="text-base" /> Más
          opciones
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <BallotTargetInput
            value={ballotTarget}
            onChange={(next) => store.setBallotTarget(next).catch(fail)}
          />
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
              <FontAwesomeIcon icon={faTv} className="text-sm" /> Enlace para la
              TV / tablet
            </p>
            <div className="flex gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-300">
                {tvUrl}
              </code>
              <button
                onClick={copyTvUrl}
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 text-xs font-bold text-slate-200"
              >
                {copied ? (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-sm text-emerald-400"
                  />
                ) : (
                  <FontAwesomeIcon icon={faCopy} className="text-sm" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={participants.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 py-2.5 font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="text-base" />{" "}
            Reiniciar todos los puntos
          </button>
        </div>
      </details>

      {/* Barra inferior: último voto + deshacer */}
      {lastAction && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Último voto
              </p>
              <p className="truncate text-base font-black text-white">
                <span className="text-orange-400">+{lastAction.delta}</span>{" "}
                para {lastAction.name}
              </p>
            </div>
            <button
              onClick={handleUndo}
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-bold text-slate-100 active:scale-95"
            >
              <FontAwesomeIcon
                icon={faRotateLeft}
                className="text-base text-amber-400"
              />{" "}
              Deshacer
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 ${lastAction ? "bottom-24" : "bottom-6"}`}
        >
          <p
            key={toast.text}
            className={`animate-slide-up rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl ${
              toast.tone === "error"
                ? "bg-red-600 text-white"
                : toast.tone === "warn"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-200 text-slate-950"
            }`}
          >
            {toast.text}
          </p>
        </div>
      )}

      {modal && (
        <ParticipantModal
          participant={modal.participant}
          existing={participants}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </main>
  );
}
