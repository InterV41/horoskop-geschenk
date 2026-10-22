// Text leuchtet beim Scrollen Wort für Wort auf. Reine Rechnung, ohne DOM.

/* Deckkraft der noch nicht erreichten Wörter */
export const DUNKEL = 0.28;
/* Über wie viele Wörter der Übergang von dunkel zu hell weich ausläuft */
const WEICH = 2;

/* 0, solange der Text unten im Fenster steht (Oberkante unter 90 % der Höhe),
   1, sobald seine Unterkante die Fenstermitte passiert hat */
export function lesefortschritt(kasten: { top: number; bottom: number }, fensterHoehe: number): number {
  const gelaufen = fensterHoehe * 0.9 - kasten.top;
  if (gelaufen <= 0) return 0;
  const offen = kasten.bottom - fensterHoehe * 0.5;
  if (offen <= 0) return 1;
  return gelaufen / (gelaufen + offen);
}

export function wortHelligkeit(p: number, i: number, n: number): number {
  const t = Math.min(1, Math.max(0, (p * (n + WEICH) - i) / WEICH));
  return t >= 1 ? 1 : t <= 0 ? DUNKEL : DUNKEL + (1 - DUNKEL) * t;
}
