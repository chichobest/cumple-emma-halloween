import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCakeCandles,
  faMobileScreen,
  faTv,
  faVolumeHigh,
  faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import AdminView from "./components/AdminView";
import ScoreboardView from "./components/ScoreboardView";
import StatusPill from "./components/StatusPill";
import { useHashView, usePersistentState } from "./lib/hooks";
import { unlockAudio } from "./lib/sound";
import { useParticipants } from "./lib/useParticipants";

export default function App() {
  const store = useParticipants();
  const [view, setView] = useHashView();
  const [soundEnabled, setSoundEnabled] = usePersistentState(
    "emma_halloween_sound",
    true,
  );
  const toggleSound = () => setSoundEnabled((on) => !on);

  if (view === "tv") {
    return (
      <ScoreboardView
        store={store}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onSwitchView={setView}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-orange-500/20 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">🎃</span>
            <div className="min-w-0 overflow-hidden">
              <h1 className="flex items-center gap-1.5 whitespace-nowrap font-display text-lg leading-none tracking-wide text-orange-400">
                <span className="truncate">Cumple de Emma</span>
                <FontAwesomeIcon
                  icon={faCakeCandles}
                  className="hidden text-base text-pink-400 min-[400px]:inline-block"
                />
              </h1>
              <StatusPill
                status={store.status}
                className="mt-1 !px-2 !py-0 !text-[10px]"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <nav className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1">
              <span className="flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1.5 text-xs font-black text-slate-950">
                <FontAwesomeIcon icon={faMobileScreen} className="text-xs" />{" "}
                Votos
              </span>
              <button
                onClick={() => setView("tv")}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTv} className="text-xs" /> TV
              </button>
            </nav>
            <button
              onClick={() => {
                unlockAudio();
                toggleSound();
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white"
              aria-label={
                soundEnabled ? "Silenciar sonidos" : "Activar sonidos"
              }
            >
              {soundEnabled ? (
                <FontAwesomeIcon
                  icon={faVolumeHigh}
                  className="text-base text-orange-400"
                />
              ) : (
                <FontAwesomeIcon icon={faVolumeXmark} className="text-base" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AdminView store={store} soundEnabled={soundEnabled} />
    </div>
  );
}
