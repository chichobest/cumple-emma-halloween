import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGhost, faXmark } from "@fortawesome/free-solid-svg-icons";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30";

export default function ParticipantModal({
  participant,
  existing,
  onSave,
  onClose,
}) {
  const isEdit = Boolean(participant);
  const [name, setName] = useState(participant?.name ?? "");
  const [costume, setCostume] = useState(participant?.costume ?? "");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmed = name.trim();
  const duplicate =
    trimmed &&
    existing.some(
      (p) =>
        p.id !== participant?.id &&
        p.name.toLocaleLowerCase("es") === trimmed.toLocaleLowerCase("es"),
    );

  const submit = async (event, keepOpen = false) => {
    event.preventDefault();
    if (!trimmed || saving) return;
    setSaving(true);
    const ok = await onSave({ name: trimmed, costume: costume.trim() });
    setSaving(false);
    if (!ok) return;
    if (keepOpen) {
      setName("");
      setCostume("");
      setSavedCount((n) => n + 1);
      nameRef.current?.focus();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl border border-orange-500/30 bg-slate-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black text-orange-400">
              <FontAwesomeIcon icon={faGhost} className="text-xl" />
              {isEdit ? "Editar participante" : "Añadir participante"}
            </h3>
            <p className="text-sm text-slate-400">
              {isEdit
                ? "Corrige el nombre o el disfraz."
                : "Apunta al niño/a con el disfraz que lleva."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-300">
              Nombre
            </span>
            <input
              ref={nameRef}
              type="text"
              required
              maxLength={40}
              placeholder="Ej: Daniel"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            {duplicate && (
              <span className="mt-1 block text-xs font-semibold text-amber-400">
                Ya hay alguien con ese nombre. ¿Añade la inicial del apellido?
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-300">
              Disfraz
            </span>
            <input
              type="text"
              maxLength={60}
              placeholder="Ej: Esqueleto bailarín"
              autoComplete="off"
              value={costume}
              onChange={(e) => setCostume(e.target.value)}
              className={inputClass}
            />
          </label>

          {savedCount > 0 && (
            <p className="text-sm font-semibold text-emerald-400">
              ✓ {savedCount} añadido{savedCount > 1 ? "s" : ""}. Sigue con el
              siguiente.
            </p>
          )}

          <div className="mt-1 flex gap-2">
            {isEdit ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                disabled={!trimmed || saving}
                onClick={(e) => submit(e, true)}
                className="flex-1 rounded-xl border border-orange-500/40 bg-slate-800 py-3 text-sm font-bold text-orange-300 hover:bg-slate-700 disabled:opacity-40"
              >
                Guardar y otro
              </button>
            )}
            <button
              type="submit"
              disabled={!trimmed || saving}
              className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-400 disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
