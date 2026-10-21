// Doppelradix: gemeinsamer Tierkreis, Häuser von A, innen die Planeten von A, außen die von B,
// Aspekte nur zwischen A und B. Gleicher Aufbau wie die Kosmos-Szene, damit beide gleich aussehen.
import { R, pt, zerlegeAmKreis } from '../kosmos/layout';
import { RADIX_REIHE, norm, type RadixId } from '../kosmos/modell';
import { texte, type Sprache } from '../kosmos/texte';
import { C, VS, ZEICHEN, el, f2, setze, sicht, baueTierkreis, baueHaeuser } from '../kosmos/tierkreis';
import { synastrie, entzerre } from './paar';
import { SPUR_INNEN, SPUR_AUSSEN, R_TRENN } from './sand';

export interface Doppel {
  zeichne(la: Record<RadixId, number>, lb: Record<RadixId, number>, asc: number, aspektAnteil: number): void;
  setzeStrich(faktor: number): void;
}

const klemm = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function baueDoppel(host: HTMLElement, nr: number, sprache: Sprache, beschreibung: string): Doppel {
  const id = (s: string) => `dx${nr}-${s}`;
  const tx = texte(sprache);
  const ebene = (cls: string, attrs: Record<string, string> = { 'aria-hidden': 'true' }) => el('svg', { viewBox: '-470 -470 940 940', class: cls, ...attrs }, host);
  const ringSvg = ebene('kx-ebene-ring');
  const svg = ebene('kx-ebene-haupt', { role: 'img', 'aria-label': beschreibung });

  const { namen } = baueTierkreis(ringSvg, id, tx);
  const radix = el('g', {}, svg);
  baueHaeuser(radix);
  /* Trennkreis zwischen A innen und B außen */
  el('circle', { r: R_TRENN, fill: 'none', stroke: C, 'stroke-width': 0.5, 'data-w': 0.5, opacity: 0.7 }, radix);

  /* Aspekte A×B: je Paar zwei Stücke, die Mitte bleibt frei */
  const aspGroup = el('g', {}, svg);
  const paare = RADIX_REIHE.length * RADIX_REIHE.length;
  const aspLinien: [Element, Element][] = [];
  for (let i = 0; i < paare; i++) aspLinien.push([el('line', { stroke: C }, aspGroup), el('line', { stroke: C }, aspGroup)]);

  /* Markierungen am Aspektring: A gefüllt, B als Ring */
  const punkte = el('g', {}, svg);
  const punktA = RADIX_REIHE.map(() => el('circle', { r: 3, fill: C }, punkte));
  const punktB = RADIX_REIHE.map(() => el('circle', { r: 3.2, fill: 'none', stroke: 'var(--rx-partner)', 'stroke-width': 1.2 }, punkte));

  /* Zeichen als HTML-Elemente, damit sie beim Drehen nicht zittern (wie in der Kosmos-Szene) */
  const zeichenEbene = document.createElement('div');
  zeichenEbene.className = 'kx-ebene-zeichen';
  zeichenEbene.setAttribute('aria-hidden', 'true');
  host.appendChild(zeichenEbene);
  const span = (cls: string, inhalt: string) => {
    const e = document.createElement('span');
    e.className = 'kx-zeichen ' + cls;
    e.textContent = inhalt;
    zeichenEbene.appendChild(e);
    return e;
  };
  const zeichen = ZEICHEN.map((z) => span('rx-zeichen', z + VS));
  const glyphA = RADIX_REIHE.map((r) => span('rx-planet klein', r.glyph));
  const glyphB = RADIX_REIHE.map((r) => span('rx-planet klein rx-partner', r.glyph));

  let einheit = host.clientWidth / 940 || 1;
  const stelle = (e: HTMLElement, x: number, y: number) => {
    e.style.transform = `translate3d(${(x * einheit).toFixed(3)}px, ${(y * einheit).toFixed(3)}px, 0) translate(-50%, -50%)`;
  };
  let strich = 1;
  let letztes: Parameters<Doppel['zeichne']> | null = null;

  function zeichne(la: Record<RadixId, number>, lb: Record<RadixId, number>, asc: number, aspektAnteil: number) {
    letztes = [la, lb, asc, aspektAnteil];
    const rot = 180 - asc;
    const scr = (lon: number) => norm(lon + rot);

    (ringSvg as SVGSVGElement).style.transform = `rotate(${(-rot).toFixed(3)}deg)`;
    namen.forEach((n, i) => {
      const oben = klemm(0.5 + Math.sin((scr(i * 30 + 15) * Math.PI) / 180) * 14);
      setze(n.top, 'opacity', oben.toFixed(2));
      setze(n.bot, 'opacity', (1 - oben).toFixed(2));
    });
    zeichen.forEach((z, i) => stelle(z, ...pt(R.band - 25, scr(i * 30 + 15))));

    const wa = RADIX_REIHE.map((r) => scr(la[r.id])), wb = RADIX_REIHE.map((r) => scr(lb[r.id]));
    const za = entzerre(wa), zb = entzerre(wb);
    RADIX_REIHE.forEach((_, i) => {
      stelle(glyphA[i], ...pt(SPUR_INNEN, za[i]));
      stelle(glyphB[i], ...pt(SPUR_AUSSEN, zb[i]));
      const pa = pt(R.asp + 2, wa[i]), pb = pt(R.asp + 2, wb[i]);
      punktA[i].setAttribute('cx', f2(pa[0])); punktA[i].setAttribute('cy', f2(pa[1]));
      punktB[i].setAttribute('cx', f2(pb[0])); punktB[i].setAttribute('cy', f2(pb[1]));
    });

    const gefunden = new Map(synastrie(la, lb).map((a) => [a.a + '|' + a.b, a]));
    let n = 0;
    for (let i = 0; i < RADIX_REIHE.length; i++)
      for (let j = 0; j < RADIX_REIHE.length; j++, n++) {
        const [e1, e2] = aspLinien[n];
        const g = gefunden.get(RADIX_REIHE[i].id + '|' + RADIX_REIHE[j].id);
        // nur deutliche Aspekte, schwache blenden aus: die Doppelradix bleibt lesbar
        const o = g ? klemm((g.staerke - 0.3) * 3) * aspektAnteil : 0;
        if (!sicht(e1, o)) { sicht(e2, 0); continue; }
        const [x1, y1] = pt(R.asp, wa[i]), [x2, y2] = pt(R.asp, wb[j]);
        const st = zerlegeAmKreis(x1, y1, x2, y2, R.hub);
        [e1, e2].forEach((e, k) => {
          const s = st[k];
          if (!s) { sicht(e, 0); return; }
          sicht(e, o);
          e.setAttribute('x1', f2(s[0])); e.setAttribute('y1', f2(s[1]));
          e.setAttribute('x2', f2(s[2])); e.setAttribute('y2', f2(s[3]));
          setze(e, 'stroke-width', f2((0.55 + 0.55 * g!.staerke) * strich));
          if (g!.hart) setze(e, 'stroke-dasharray', '5 3.5');
          else if (e.hasAttribute('stroke-dasharray')) e.removeAttribute('stroke-dasharray');
        });
      }
  }

  new ResizeObserver(() => {
    einheit = host.clientWidth / 940 || 1;
    host.style.setProperty('--kx-einheit', einheit.toFixed(5) + 'px');
    if (letztes) zeichne(...letztes);
  }).observe(host);
  host.style.setProperty('--kx-einheit', einheit.toFixed(5) + 'px');

  function setzeStrich(faktor: number) {
    strich = faktor;
    host.querySelectorAll('[data-w]').forEach((e) => e.setAttribute('stroke-width', (Number(e.getAttribute('data-w')) * strich).toFixed(2)));
    if (letztes) zeichne(...letztes);
  }

  return { zeichne, setzeStrich };
}
