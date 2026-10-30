import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// Vista según el hash de la URL: "#tv" abre el marcador, cualquier otro el panel de votos.
const subscribeHash = (cb) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getView = () =>
  window.location.hash.replace("#", "") === "tv" ? "tv" : "votes";

export function useHashView() {
  const view = useSyncExternalStore(subscribeHash, getView);
  const setView = useCallback((next) => {
    window.location.hash = next === "tv" ? "tv" : "";
  }, []);
  return [view, setView];
}

const subscribeFullscreen = (cb) => {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
};

export function useFullscreen() {
  const isFullscreen = useSyncExternalStore(subscribeFullscreen, () =>
    Boolean(document.fullscreenElement),
  );
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  return [
    isFullscreen,
    toggle,
    Boolean(document.documentElement.requestFullscreen),
  ];
}

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialValue : JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento: el valor solo vive en esta sesión
    }
  }, [key, value]);
  return [value, setValue];
}

/**
 * Animación FLIP: los elementos con `data-flip-id` dentro del contenedor se
 * deslizan desde su posición anterior cuando cambia el orden (incluido
 * subir de la lista al podio).
 */
export function useFlip(containerRef) {
  const rects = useRef(new Map());

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return new Map();
    const next = new Map();
    container.querySelectorAll("[data-flip-id]").forEach((node) => {
      next.set(node.dataset.flipId, {
        node,
        rect: node.getBoundingClientRect(),
      });
    });
    return next;
  }, [containerRef]);

  useLayoutEffect(() => {
    const next = measure();
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduceMotion) {
      next.forEach(({ node, rect }, id) => {
        const prev = rects.current.get(id);
        if (!prev) return;
        const dx = prev.rect.left - rect.left;
        const dy = prev.rect.top - rect.top;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        node.animate?.(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 800, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      });
    }
    rects.current = next;
  });

  useEffect(() => {
    const refresh = () => {
      rects.current = measure();
    };
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [measure]);
}

/**
 * Llama a `onReach` cuando `value` sube hasta alcanzar `target` (> 0).
 * No dispara con la carga inicial (`ready` false) ni si la meta se fija
 * por debajo de un valor ya alcanzado.
 */
export function useGoalReached(value, target, ready, onReach) {
  const prevRef = useRef(null);
  const onReachRef = useRef(onReach);
  useLayoutEffect(() => {
    onReachRef.current = onReach;
  });
  useEffect(() => {
    if (!ready) return;
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev !== null && target > 0 && prev < target && value >= target) {
      onReachRef.current();
    }
  }, [value, target, ready]);
}
