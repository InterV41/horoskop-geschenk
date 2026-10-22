// Doppelradix: gemeinsamer Tierkreis, Häuser von A, innen die Planeten von A, außen die von B,
// Aspekte nur zwischen A und B. Gleicher Aufbau wie die Kosmos-Szene, damit beide gleich aussehen.
import { R, pt, zerlegeAmKreis } from '../kosmos/layout';
import { RADIX_REIHE, norm, type RadixId } from '../kosmos/modell';
import { texte, type Sprache } from '../kosmos/texte';
import { C, VS, ZEICHEN, el, f2, setze, sicht, baueTierkreis, baueHaeuser } from '../kosmos/tierkreis';
import { synastrie, radialVersatz } from './paar';
import { SPUR_INNEN, SPUR_AUSSEN, R_TRENN } from './sand';

export interface Doppel {
  zeichne(la: Record<RadixId, number>, lb: Record<RadixId, number>, asc: number, aspektAnteil: number): void;
  setzeStrich(faktor: number): void;
  /* Nachzeichnen der scharfen Radix, 0 = nichts, 1 = fertig: erst die Kreise von außen nach innen wie mit
     der Feder, dann Tierkreis, Häuser und Beschriftung, dann die Planetenzeichen */
  einzeichnen(q: number): void;
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
  /* Kreise der Radix wie in der Kosmos-Radix (dort aus den Planetenbahnen): Radius, Strich */
  for (const [r, w] of [[R.out, 1.1], [R.out - 7, 0.45], [R.band, 0.85], [R.ring, 0.6], [R.asp, 0.6], [R.hub, 0.9], [R.hub - 26, 0.5]])
    el('circle', { r, fill: 'none', stroke: C, 'stroke-width': w, 'data-w': w }, radix);
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

  /* Was beim Nachzeichnen wann erscheint, als Fenster in q. Durchgezogene Striche zeichnen sich
     per stroke-dashoffset, gestrichelte und Schrift blenden ein. */
  type Schritt = { e: SVGElement; laenge: number; von: number; bis: number; zeichnen: boolean };
  const schritte: Schritt[] = [];
  let kreisNr = 0, linieNr = 0;
  radix.querySelectorAll<SVGElement>('circle, line, text').forEach((e) => {
    if (e.tagName === 'text') { schritte.push({ e, laenge: 0, von: 0.4, bis: 0.65, zeichnen: false }); return; }
    const zeichnen = !e.hasAttribute('stroke-dasharray');
    if (e.tagName === 'circle') {
      const von = 0.04 * kreisNr++;
      schritte.push({ e, laenge: 2 * Math.PI * Number(e.getAttribute('r')), von, bis: von + 0.35, zeichnen });
    } else {
      const g = (a: string) => Number(e.getAttribute(a));
      const von = 0.3 + 0.008 * linieNr++;
      schritte.push({ e, laenge: Math.hypot(g('x2') - g('x1'), g('y2') - g('y1')), von, bis: von + 0.2, zeichnen });
    }
  });
  let stand = -1;
  function einzeichnen(q: number) {
    if (q === stand) return;
    stand = q;
    const fertig = q >= 1;
    for (const st of schritte) {
      const t = fertig ? 1 : klemm((q - st.von) / (st.bis - st.von));
      const stil = st.e.style;
      if (fertig) { stil.strokeDasharray = ''; stil.strokeDashoffset = ''; stil.opacity = ''; continue; }
      if (st.zeichnen) {
        stil.strokeDasharray = st.laenge.toFixed(1);
        stil.strokeDashoffset = (st.laenge * (1 - t)).toFixed(1);
        stil.opacity = t > 0 ? '' : '0';
      } else stil.opacity = t.toFixed(3);
    }
    (ringSvg as SVGSVGElement).style.opacity = fertig ? '' : klemm((q - 0.15) / 0.35).toFixed(3);
    const z = fertig ? '' : klemm((q - 0.45) / 0.3).toFixed(3);
    zeichenEbene.style.opacity = z;
    (punkte as SVGElement).style.opacity = z;
  }

  let einheit = host.clientWidth / 940 || 1;
  const stelle = (e: HTMLElement, x: number, y: number) => {
    e.style.transform = `translate3d(${(x * einheit).toFixed(3)}px, ${(y * einheit).toFixed(3)}px, 0) translate(-50%, -50%)`;
  };
  let strich = 1;
  let aspekteSichtbar = true;
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
    const va = radialVersatz(wa, SPUR_INNEN), vb = radialVersatz(wb, SPUR_AUSSEN);
    RADIX_REIHE.forEach((_, i) => {
      stelle(glyphA[i], ...pt(SPUR_INNEN + va[i], wa[i]));
      stelle(glyphB[i], ...pt(SPUR_AUSSEN + vb[i], wb[i]));
      const pa = pt(R.asp + 2, wa[i]), pb = pt(R.asp + 2, wb[i]);
      punktA[i].setAttribute('cx', f2(pa[0])); punktA[i].setAttribute('cy', f2(pa[1]));
      punktB[i].setAttribute('cx', f2(pb[0])); punktB[i].setAttribute('cy', f2(pb[1]));
    });

    // vor dem Einblenden nichts rechnen; einmal noch, um ausgeblendete Linien zu verstecken
    if (aspektAnteil <= 0 && !aspekteSichtbar) return;
    aspekteSichtbar = aspektAnteil > 0;
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

  return { zeichne, setzeStrich, einzeichnen };
}
