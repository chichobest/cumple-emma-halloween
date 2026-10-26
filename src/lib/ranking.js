/**
 * Ordena por puntos (desc) y asigna ranking "denso": los empates comparten
 * puesto y el siguiente marcador distinto ocupa el puesto inmediato.
 * Así el podio (oro/plata/bronce) siempre se llena si hay 3 marcadores distintos.
 */
export function rankParticipants(list) {
  const sorted = [...list].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"),
  );
  let rank = 0;
  let previous = null;
  return sorted.map((p) => {
    if (p.points !== previous) {
      rank += 1;
      previous = p.points;
    }
    return { ...p, rank };
  });
}

export const isOnPodium = (p) => p.points > 0 && p.rank <= 3;

// Devuelve [oro[], plata[], bronce[]]; cada puesto puede tener empates.
export function buildPodium(ranked) {
  return [1, 2, 3].map((rank) =>
    ranked.filter((p) => isOnPodium(p) && p.rank === rank),
  );
}

export const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const COSTUME_EMOJIS = [
  [/vampir|dr[aá]cula/i, "🧛"],
  [/bruj|hechicer/i, "🧙‍♀️"],
  [/mago/i, "🧙"],
  [/lobo/i, "🐺"],
  [/zombi|momia/i, "🧟"],
  [/esquelet|calavera|catrin/i, "💀"],
  [/fantasma/i, "👻"],
  [/calabaza/i, "🎃"],
  [/murci[eé]lago/i, "🦇"],
  [/ara[ñn]a/i, "🕷️"],
  [/gat[oa]/i, "🐈‍⬛"],
  [/princes|reina/i, "👸"],
  [/pirata/i, "🏴‍☠️"],
  [/h[eé]roe|spider|bat ?man|super/i, "🦸"],
  [/drag[oó]n/i, "🐉"],
  [/dino/i, "🦖"],
  [/hada/i, "🧚"],
  [/diabl|demoni/i, "😈"],
  [/robot/i, "🤖"],
  [/monstru|ogro|frankenstein/i, "👹"],
  [/alien|extraterrestre/i, "👽"],
  [/payas/i, "🤡"],
];
const FALLBACK_EMOJIS = ["🎃", "👻", "🦇", "🕸️", "🍬", "🌙", "🔮", "🕯️"];

export function avatarFor(kid) {
  const match = COSTUME_EMOJIS.find(([regex]) => regex.test(kid.costume));
  if (match) return match[1];
  let hash = 0;
  for (const char of kid.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_EMOJIS[hash % FALLBACK_EMOJIS.length];
}
