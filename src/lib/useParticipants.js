import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isFirebaseConfigured, loadFirestore } from "./firebase";

export const COLLECTION = "cumple_emma_participants";
const STORAGE_KEY = "emma_halloween_kids";
const CHANGE_TTL_MS = 4500;

export const DEMO_PARTICIPANTS = [
  { name: "Lucas", costume: "Vampiro Clásico" },
  { name: "Sofía", costume: "Brujita Estelar" },
  { name: "Mateo", costume: "Hombre Lobo" },
  { name: "Carla", costume: "Momia Egipcia" },
];

function normalize(raw) {
  return {
    id: String(raw.id),
    name: String(raw.name ?? "").trim() || "Sin nombre",
    costume: String(raw.costume ?? "").trim() || "Disfraz Sorpresa",
    points: Math.max(0, Number(raw.points) || 0),
    createdAt: Number(raw.createdAt) || 0,
  };
}

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Almacenamiento lleno o bloqueado: el estado en memoria sigue funcionando
  }
}

// Id del líder único (sin empate y con puntos), o null.
function uniqueLeaderId(list) {
  let best = null;
  let tied = false;
  for (const p of list) {
    if (!best || p.points > best.points) {
      best = p;
      tied = false;
    } else if (p.points === best.points) {
      tied = true;
    }
  }
  return best && best.points > 0 && !tied ? best.id : null;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/**
 * Fuente única de verdad de los participantes.
 * - Con Firebase: escucha `onSnapshot` y escribe con `increment` (multi-dispositivo).
 * - Sin Firebase: LocalStorage + evento `storage` (sincroniza pestañas del mismo navegador).
 * Además emite `changes`: cambios de puntos recientes para animar el marcador.
 */
export function useParticipants() {
  const [participants, setParticipants] = useState(() =>
    isFirebaseConfigured ? [] : readLocal(),
  );
  const [status, setStatus] = useState(
    isFirebaseConfigured ? "connecting" : "local",
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [changes, setChanges] = useState([]);

  const listRef = useRef(participants);
  const loadedRef = useRef(!isFirebaseConfigured);
  const firestoreRef = useRef(null);

  const applyList = useCallback((next, fromCache = false) => {
    const prev = listRef.current;
    listRef.current = next;
    setParticipants(next);

    // No animamos la carga inicial (ni la primera respuesta del servidor).
    if (!loadedRef.current) {
      if (!fromCache) loadedRef.current = true;
      return;
    }

    const prevPoints = new Map(prev.map((p) => [p.id, p.points]));
    const prevLeader = uniqueLeaderId(prev);
    const nextLeader = uniqueLeaderId(next);
    const now = Date.now();

    const fresh = next
      .filter((p) => prevPoints.has(p.id) && prevPoints.get(p.id) !== p.points)
      .map((p) => ({
        key: `${p.id}-${now}-${Math.random().toString(36).slice(2)}`,
        id: p.id,
        name: p.name,
        delta: p.points - prevPoints.get(p.id),
        newLeader: p.id === nextLeader && nextLeader !== prevLeader,
        at: now,
      }));
    if (!fresh.length) return;

    setChanges((current) => [...current, ...fresh]);
    setTimeout(() => {
      setChanges((current) => current.filter((c) => !fresh.includes(c)));
    }, CHANGE_TTL_MS);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const onStorage = (event) => {
        if (event.key === STORAGE_KEY || event.key === null) {
          applyList(readLocal());
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let unsubscribe = () => {};
    let cancelled = false;

    loadFirestore()
      .then((ctx) => {
        if (cancelled) return;
        firestoreRef.current = ctx;
        const { db, fs } = ctx;
        unsubscribe = fs.onSnapshot(
          fs.collection(db, COLLECTION),
          { includeMetadataChanges: true },
          (snapshot) => {
            const list = snapshot.docs.map((d) =>
              normalize({ ...d.data(), id: d.id }),
            );
            applyList(list, snapshot.metadata.fromCache);
            setStatus(snapshot.metadata.fromCache ? "connecting" : "live");
            setErrorMessage(null);
          },
          (error) => {
            setStatus("error");
            setErrorMessage(error.message);
          },
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error.message);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [applyList]);

  const actions = useMemo(() => {
    const mutateLocal = (fn) => {
      const next = fn(readLocal());
      writeLocal(next);
      applyList(next);
    };
    const withFirestore = async (fn) =>
      fn(firestoreRef.current ?? (await loadFirestore()));

    const addParticipant = async ({ name, costume }) => {
      const kid = normalize({
        id: newId(),
        name,
        costume,
        points: 0,
        createdAt: Date.now(),
      });
      if (!isFirebaseConfigured) {
        mutateLocal((list) => [...list, kid]);
        return;
      }
      await withFirestore(({ db, fs }) => {
        const { id, ...data } = kid;
        return fs.setDoc(fs.doc(db, COLLECTION, id), data);
      });
    };

    return {
      addParticipant,

      async addPoints(id, delta) {
        if (!isFirebaseConfigured) {
          mutateLocal((list) =>
            list.map((p) =>
              p.id === id ? { ...p, points: Math.max(0, p.points + delta) } : p,
            ),
          );
          return;
        }
        await withFirestore(async ({ db, fs }) => {
          const ref = fs.doc(db, COLLECTION, id);
          if (delta >= 0) {
            await fs.updateDoc(ref, { points: fs.increment(delta) });
            return;
          }
          // Restar en transacción para no bajar nunca de 0.
          await fs.runTransaction(db, async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists()) throw new Error("El participante ya no existe");
            const current = Number(snap.data().points) || 0;
            tx.update(ref, { points: Math.max(0, current + delta) });
          });
        });
      },

      async updateParticipant(id, { name, costume }) {
        const patch = {
          name: name.trim() || "Sin nombre",
          costume: costume.trim() || "Disfraz Sorpresa",
        };
        if (!isFirebaseConfigured) {
          mutateLocal((list) =>
            list.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          );
          return;
        }
        await withFirestore(({ db, fs }) =>
          fs.updateDoc(fs.doc(db, COLLECTION, id), patch),
        );
      },

      async removeParticipant(id) {
        if (!isFirebaseConfigured) {
          mutateLocal((list) => list.filter((p) => p.id !== id));
          return;
        }
        await withFirestore(({ db, fs }) =>
          fs.deleteDoc(fs.doc(db, COLLECTION, id)),
        );
      },

      async resetPoints() {
        if (!isFirebaseConfigured) {
          mutateLocal((list) => list.map((p) => ({ ...p, points: 0 })));
          return;
        }
        await withFirestore(({ db, fs }) => {
          const batch = fs.writeBatch(db);
          listRef.current.forEach((p) =>
            batch.update(fs.doc(db, COLLECTION, p.id), { points: 0 }),
          );
          return batch.commit();
        });
      },

      async loadDemo() {
        for (const demo of DEMO_PARTICIPANTS) {
          await addParticipant(demo);
        }
      },
    };
  }, [applyList]);

  return { participants, status, errorMessage, changes, ...actions };
}
