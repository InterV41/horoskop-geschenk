// Bausteine der Radix, die Kosmos-Szene und Doppelradix teilen: SVG-Helfer, Tierkreis-Ring, Häuser.
import { R, pt, CUSPS } from './layout';
import type { texte } from './texte';

export const NS = 'http://www.w3.org/2000/svg';
export const XL = 'http://www.w3.org/1999/xlink';
export const C = 'currentColor';
export const VS = '︎'; // Textdarstellung statt Emoji
export const ZEICHEN = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export type Attrs = Record<string, string | number>;
export function el(tag: string, attrs: Attrs, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
export const f2 = (x: number) => x.toFixed(2);
export const fp = (p: [number, number]) => f2(p[0]) + ' ' + f2(p[1]);
export function line(g: Element, r1: number, a1: number, r2: number, a2: number, w: number, extra: Attrs = {}) {
  const p = pt(r1, a1), q = pt(r2, a2);
  return el('line', { x1: f2(p[0]), y1: f2(p[1]), x2: f2(q[0]), y2: f2(q[1]), stroke: C, 'stroke-width': w, 'data-w': w, ...extra }, g);
}
export function txt(g: Element, cls: string, s: string) {
  const t = el('text', { class: cls }, g);
  t.textContent = s;
  return t;
}
/* Attribut nur schreiben, wenn es sich ändert: jeder Schreibzugriff kann Neuzeichnen auslösen */
export function setze(e: Element, name: string, wert: string) {
  if (e.getAttribute(name) !== wert) e.setAttribute(name, wert);
}
/* Deckkraft setzen, bei 0 ganz ausblenden, damit der Browser nichts zeichnet */
export function sicht(e: Element, o: number) {
  if (o <= 0.001) { setze(e, 'visibility', 'hidden'); return false; }
  if (e.hasAttribute('visibility')) e.removeAttribute('visibility');
  setze(e, 'opacity', o.toFixed(3));
  return true;
}

/* Tierkreis-Ring: eigene Ebene mit Scheibe, Gradskala, Grenzen und Namen. Sie dreht sich als
   Ganzes per CSS, ihr Inhalt muss dafür nicht neu gezeichnet werden. */
export function baueTierkreis(ringSvg: Element, id: (s: string) => string, tx: ReturnType<typeof texte>) {
  const ringDefs = el('defs', {}, ringSvg);
  el('circle', { r: R.out, style: 'fill:var(--rx-disk)' }, ringSvg);
  /* Ringe von innen nach außen, weiß auf Creme (im Dunkeln durchsichtig).
     Grenzen sind alle Kreise der Radix: Nabe innen, Nabe, Aspektring, Planetenring, Zeichenring, Namensring, Rand.
     Weiß sind: Mitte (1.), Aspektbereich (3.), Planetenring (4.), Symbolring (5.), Außenrand (7.). */
  const GRENZEN = [0, R.hub - 26, R.hub, R.asp, R.ring, R.band, R.out - 7, R.out];
  for (const i of [0, 2, 3, 4, 6]) {
    const innen = GRENZEN[i], aussen = GRENZEN[i + 1];
    if (innen === 0) el('circle', { r: aussen, style: 'fill:var(--kx-nabe)' }, ringSvg);
    else el('circle', { r: (innen + aussen) / 2, fill: 'none', 'stroke-width': aussen - innen, style: 'stroke:var(--kx-nabe)' }, ringSvg);
  }
  const zodiac = el('g', {}, ringSvg);
  const BAND_MID = (R.out + R.band) / 2;
  for (let k = 0; k < 360; k++) {
    const major = k % 10 === 0, mid = k % 5 === 0;
    line(zodiac, R.band, k, R.band - (major ? 16 : mid ? 10 : 5), k, major ? 0.7 : 0.45, major ? {} : { opacity: 0.7 });
  }
  for (let i = 0; i < 12; i++) line(zodiac, R.out, i * 30, R.ring, i * 30, 0.9);
  const namen = tx.tierkreis.map((n, i) => {
    const m = i * 30 + 15, off = 15 * 0.34;
    const rt = BAND_MID - off, rb = BAND_MID + off;
    // oberer Bogen im Uhrzeigersinn, unterer dagegen: so steht die Schrift immer lesbar
    el('path', { id: id('nt' + i), d: 'M' + fp(pt(rt, m + 15)) + ' A' + rt + ' ' + rt + ' 0 0 1 ' + fp(pt(rt, m - 15)) }, ringDefs);
    el('path', { id: id('nb' + i), d: 'M' + fp(pt(rb, m - 15)) + ' A' + rb + ' ' + rb + ' 0 0 0 ' + fp(pt(rb, m + 15)) }, ringDefs);
    const mk = (pid: string) => {
      const t = el('text', { class: 'rx-name' }, zodiac);
      const tp = el('textPath', { href: '#' + pid, startOffset: '50%' }, t);
      tp.setAttributeNS(XL, 'xlink:href', '#' + pid);
      tp.textContent = n;
      return t;
    };
    return { top: mk(id('nt' + i)), bot: mk(id('nb' + i)) };
  });
  return { namen };
}

/* Häuser: stehen fest, Aszendent links. Dazu Achsen und Nabe mit Hausnummern. */
export function baueHaeuser(radix: Element) {
  CUSPS.forEach((o, i) => {
    const axis = i % 3 === 0;
    line(radix, R.ring, 180 + o, R.hub, 180 + o, axis ? 1.1 : 0.6, axis ? {} : { 'stroke-dasharray': '3 4' });
  });
  ([['ASC', 0], ['IC', 3], ['DC', 6], ['MC', 9]] as const).forEach(([label, i]) => {
    const p = pt(R.out + 24, 180 + CUSPS[i]);
    const t = txt(radix, 'rx-achse', label);
    t.setAttribute('x', f2(p[0]));
    t.setAttribute('y', f2(p[1]));
  });
  /* Nabe mit Hausnummern. Die beiden Kreise der Nabe sind die Bahnen von Mars und Erde. */
  CUSPS.forEach((o, i) => {
    line(radix, R.hub, 180 + o, R.hub - 26, 180 + o, 0.5);
    const next = i === 11 ? 360 : CUSPS[i + 1];
    const p = pt(R.hub - 13, 180 + (o + next) / 2);
    const t = txt(radix, 'rx-haus', String(i + 1));
    t.setAttribute('x', f2(p[0]));
    t.setAttribute('y', f2(p[1]));
  });
}
