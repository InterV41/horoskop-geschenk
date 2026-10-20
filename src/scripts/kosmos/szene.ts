// Szene: baut das SVG einmal auf und überträgt pro Bild ein Layout auf die Elemente.
// Farben kommen aus CSS-Variablen der Komponente, so folgt alles der Ansicht hell oder dunkel.
import { R, pt, K_SCHRAEG, type Layout } from './layout';
import { PLANETEN, RADIX_REIHE, type RadixId } from './modell';
import { texte, type Sprache } from './texte';

const NS = 'http://www.w3.org/2000/svg';
const XL = 'http://www.w3.org/1999/xlink';
const C = 'currentColor';
const VS = '︎'; // Textdarstellung statt Emoji

type Attrs = Record<string, string | number>;
function el(tag: string, attrs: Attrs, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
const f2 = (x: number) => x.toFixed(2);
const fp = (p: [number, number]) => f2(p[0]) + ' ' + f2(p[1]);
function line(g: Element, r1: number, a1: number, r2: number, a2: number, w: number, extra: Attrs = {}) {
  const p = pt(r1, a1), q = pt(r2, a2);
  return el('line', { x1: f2(p[0]), y1: f2(p[1]), x2: f2(q[0]), y2: f2(q[1]), stroke: C, 'stroke-width': w, 'data-w': w, ...extra }, g);
}
function txt(g: Element, cls: string, s: string) {
  const t = el('text', { class: cls }, g);
  t.textContent = s;
  return t;
}
/* Deckkraft setzen, bei 0 ganz ausblenden, damit der Browser nichts zeichnet */
function sicht(e: Element, o: number) {
  if (o <= 0.001) { e.setAttribute('visibility', 'hidden'); return false; }
  e.removeAttribute('visibility');
  e.setAttribute('opacity', o.toFixed(3));
  return true;
}
/* Planetenfarbe Richtung Gold ziehen */
function mischeGold(farbe: string, t: number) {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const a = h(farbe), b = h('#e0c27e');
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export interface Szene {
  zeichne(l: Layout): void;
  setzeStrich(faktor: number): void;
}

export function baueSzene(host: HTMLElement, nr: number, sprache: Sprache = 'de'): Szene {
  const id = (s: string) => `kx${nr}-${s}`;
  const tx = texte(sprache);
  const svg = el('svg', { viewBox: '-470 -470 940 940', role: 'img', 'aria-label': tx.beschreibung }, host);
  const defs = el('defs', {}, svg);
  const verlauf = (gid: string, stops: [number, string, string?][], attrs: Attrs = {}) => {
    const g = el('radialGradient', { id: id(gid), ...attrs }, defs);
    stops.forEach(([o, farbe, deck]) => el('stop', { offset: o, style: `stop-color:${farbe};stop-opacity:${deck ?? 1}` }, g));
    return `url(#${id(gid)})`;
  };

  /* Scheibe unter der Radix */
  const scheibe = el('circle', { r: R.out, style: 'fill:var(--rx-disk)' }, svg);

  /* Sterne in drei Tiefenebenen: klein und fern, mittel, groß und nah. Die Ebenen treiben
     unterschiedlich weit (über CSS), das gibt Tiefe. Feste Saat: bei jedem Besuch gleich. */
  let saat = 7;
  const rnd = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
  /* Himmel (Sterne und Nebel) läuft zum Rand weich ins Durchsichtige aus: keine Kante zur Seite */
  const himmelMaske = el('mask', { id: id('himmel'), maskUnits: 'userSpaceOnUse', x: -470, y: -470, width: 940, height: 940 }, defs);
  el('rect', { x: -470, y: -470, width: 940, height: 940, fill: verlauf('vig', [[0, '#fff'], [0.3, '#fff'], [0.7, '#5a5a5a'], [1, '#000']], { r: '50%' }) }, himmelMaske);
  const himmel = el('g', { mask: `url(#${id('himmel')})` }, svg);
  const sterne = el('g', { class: 'kx-sterne' }, himmel);
  const EBENEN = [
    { n: 110, r0: 0.6, r1: 1.2, o0: 0.2, o1: 0.55 },
    { n: 60, r0: 1.1, r1: 1.9, o0: 0.35, o1: 0.75 },
    { n: 22, r0: 1.8, r1: 2.8, o0: 0.55, o1: 1 },
  ];
  EBENEN.forEach((e, i) => {
    const g = el('g', { class: `kx-ebene kx-ebene${i + 1}` }, sterne);
    for (let k = 0; k < e.n; k++) {
      const o = e.o0 + rnd() * (e.o1 - e.o0);
      const st = el('circle', { cx: f2(rnd() * 940 - 470), cy: f2(rnd() * 940 - 470), r: (e.r0 + rnd() * (e.r1 - e.r0)).toFixed(2), opacity: o.toFixed(2) }, g);
      if (rnd() < 0.35) {
        st.setAttribute('class', 'kx-funkeln');
        st.setAttribute('style', `--o:${o.toFixed(2)};animation-duration:${(3 + rnd() * 4).toFixed(2)}s;animation-delay:-${(rnd() * 7).toFixed(2)}s`);
      }
    }
  });

  /* Nebel (dunkel) und warmer Schleier (hell): treiben und atmen langsam, über CSS */
  const nebel = el('g', {}, himmel);
  el('ellipse', { class: 'kx-nebel kx-nebel-a', cx: -157, cy: -90, rx: 425, ry: 200, fill: verlauf('n1', [[0, 'var(--kx-nebel1)', '0.5'], [1, 'var(--kx-nebel1)', '0']]) }, nebel);
  el('ellipse', { class: 'kx-nebel kx-nebel-b', cx: 200, cy: 135, rx: 380, ry: 180, fill: verlauf('n2', [[0, 'var(--kx-nebel2)', '0.4'], [1, 'var(--kx-nebel2)', '0']]) }, nebel);
  el('ellipse', { class: 'kx-nebel kx-nebel-c', cx: 40, cy: -200, rx: 320, ry: 220, fill: verlauf('n4', [[0, 'var(--kx-nebel3)', '0.45'], [1, 'var(--kx-nebel3)', '0']]) }, nebel);
  el('ellipse', { class: 'kx-schleier', rx: 515, ry: 270, fill: verlauf('n3', [[0, 'var(--kx-schleier)', '0.7'], [1, 'var(--kx-schleier)', '0']]) }, nebel);

  /* Bahnen, die zu den Ringen der Radix werden. Tiefe: hinten (oben) zart, vorne kräftig,
     in der Draufsicht gleichmäßig wie die Ringe der Radix. */
  const tiefe = el('linearGradient', { id: id('bahn'), x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const tiefeHinten = el('stop', { offset: 0, style: 'stop-color:currentColor', 'stop-opacity': 1 }, tiefe);
  el('stop', { offset: 1, style: 'stop-color:currentColor', 'stop-opacity': 1 }, tiefe);
  const ringe = PLANETEN.map(() => el('ellipse', { fill: 'none', stroke: `url(#${id('bahn')})` }, svg));

  /* Planetenkugeln: hinten liegen sie unter der Sonne, vorne darüber */
  const hinten = el('g', {}, svg);
  type Kugel = { g: Element; kreis: Element; ring?: Element; hinten: boolean };
  const kugeln = {} as Record<Exclude<RadixId, 'sonne'> | 'erde', Kugel>;
  const baueKugel = (kid: string, farbe: string, ring?: boolean): Kugel => {
    const g = el('g', {}, hinten);
    const fuell = verlauf('p-' + kid, [[0, '#ffffff', '0.9'], [0.18, mischeGold(farbe, 0.35)], [1, 'var(--kx-schatten)']], { cx: '35%', cy: '35%', r: '75%' });
    const r = ring ? el('ellipse', { fill: 'none', stroke: mischeGold(farbe, 0.35), 'stroke-width': 2.4, opacity: 0.8 }, g) : undefined;
    const kreis = el('circle', { fill: fuell }, g);
    return { g, kreis, ring: r, hinten: true };
  };
  for (const pl of PLANETEN) kugeln[pl.id] = baueKugel(pl.id, pl.farbe, pl.ring);
  kugeln.mond = baueKugel('mond', '#cfc8b8');

  /* Sonne: Lichthof und Kern, ohne Strahlen */
  const hof = el('circle', { fill: verlauf('hof', [[0, 'var(--kx-hof)', 'var(--kx-hof-o)'], [0.35, 'var(--kx-hof2)', 'var(--kx-hof2-o)'], [1, 'var(--kx-hof2)', '0']]) }, svg);
  const kern = el('circle', { fill: verlauf('kern', [[0, '#fffbea'], [0.55, '#f6d27a'], [1, '#d99a3a']]) }, svg);

  /* Radix: alles, was erst mit der Verwandlung erscheint */
  const radix = el('g', {}, svg);
  const BAND_MID = (R.out + R.band) / 2;
  const zodiac = el('g', {}, radix);
  for (let k = 0; k < 360; k++) {
    const major = k % 10 === 0, mid = k % 5 === 0;
    line(zodiac, R.band, k, R.band - (major ? 16 : mid ? 10 : 5), k, major ? 0.7 : 0.45, major ? {} : { opacity: 0.7 });
  }
  for (let i = 0; i < 12; i++) line(zodiac, R.out, i * 30, R.ring, i * 30, 0.9);
  const namen = tx.tierkreis.map((n, i) => {
    const m = i * 30 + 15, off = 15 * 0.34;
    const rt = BAND_MID - off, rb = BAND_MID + off;
    // oberer Bogen im Uhrzeigersinn, unterer dagegen: so steht die Schrift immer lesbar
    el('path', { id: id('nt' + i), d: 'M' + fp(pt(rt, m + 15)) + ' A' + rt + ' ' + rt + ' 0 0 1 ' + fp(pt(rt, m - 15)) }, defs);
    el('path', { id: id('nb' + i), d: 'M' + fp(pt(rb, m - 15)) + ' A' + rb + ' ' + rb + ' 0 0 0 ' + fp(pt(rb, m + 15)) }, defs);
    const mk = (pid: string) => {
      const t = el('text', { class: 'rx-name' }, zodiac);
      const tp = el('textPath', { href: '#' + pid, startOffset: '50%' }, t);
      tp.setAttributeNS(XL, 'xlink:href', '#' + pid);
      tp.textContent = n;
      return t;
    };
    return { top: mk(id('nt' + i)), bot: mk(id('nb' + i)) };
  });
  const ZEICHEN = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const zeichen = ZEICHEN.map((z) => txt(radix, 'rx-glyph rx-zeichen', z + VS));

  /* Häuser: stehen fest, Aszendent links */
  const CUSPS = [0, 31, 60, 88, 119, 151, 180, 211, 240, 268, 299, 331];
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

  /* Aspektlinien enden am Rand der Mitte: Maske statt deckender Fläche, die Mitte bleibt durchsichtig */
  const maske = el('mask', { id: id('mitte') }, defs);
  el('rect', { x: -470, y: -470, width: 940, height: 940, fill: '#fff' }, maske);
  el('circle', { r: R.hub, fill: '#000' }, maske);
  const aspGroup = el('g', { mask: `url(#${id('mitte')})` }, svg);
  const aspLinien: Element[] = [];
  for (let i = 0; i < (RADIX_REIHE.length * (RADIX_REIHE.length - 1)) / 2; i++) aspLinien.push(el('line', { stroke: C }, aspGroup));

  const vorne = el('g', {}, svg);
  for (const k of Object.values(kugeln)) vorne.appendChild(k.g), (k.hinten = false);

  /* Planetenzeichen und Punkte auf dem Aspektring */
  const oben = el('g', {}, svg);
  const glyphen = RADIX_REIHE.map((r) => ({
    id: r.id,
    text: txt(oben, 'rx-glyph rx-planet' + (r.gross ? ' gross' : ''), r.glyph),
    punkt: el('circle', { r: 3, fill: C }, oben),
  }));

  let strich = 1;
  let letztes: Layout | null = null;

  function zeichne(l: Layout) {
    letztes = l;
    const schraeg = (1 - l.K) / (1 - K_SCHRAEG); // 1 im Sonnensystem, 0 in der Radix
    tiefeHinten.setAttribute('stop-opacity', (1 - 0.75 * schraeg).toFixed(3));

    l.ringe.forEach((r, i) => {
      const e = ringe[i];
      if (!sicht(e, r.deckkraft)) return;
      e.setAttribute('rx', f2(r.rx));
      e.setAttribute('ry', f2(r.ry));
      e.setAttribute('stroke-width', f2(r.breite * strich));
    });

    sicht(nebel, l.nebel);

    for (const kid of Object.keys(kugeln) as (keyof typeof kugeln)[]) {
      const k = kugeln[kid], kl = l.koerper[kid];
      if (kl.hinten !== k.hinten) { (kl.hinten ? hinten : vorne).appendChild(k.g); k.hinten = kl.hinten; }
      if (!sicht(k.g, kl.kugelDeckkraft)) continue;
      k.g.setAttribute('transform', `translate(${f2(kl.x)} ${f2(kl.y)})`);
      k.kreis.setAttribute('r', f2(kl.kugelR));
      if (k.ring) { k.ring.setAttribute('rx', f2(kl.kugelR * 2.1)); k.ring.setAttribute('ry', f2(kl.kugelR * 0.6)); }
    }

    const so = l.koerper.sonne;
    if (sicht(hof, l.sonnenHof.deckkraft)) {
      hof.setAttribute('cx', f2(so.x)); hof.setAttribute('cy', f2(so.y)); hof.setAttribute('r', f2(l.sonnenHof.r));
    }
    if (sicht(kern, so.kugelDeckkraft) && so.kugelR > 0.05) {
      kern.setAttribute('cx', f2(so.x)); kern.setAttribute('cy', f2(so.y)); kern.setAttribute('r', f2(so.kugelR));
    }

    if (sicht(radix, l.radix)) {
      sicht(scheibe, l.radix);
      zodiac.setAttribute('transform', `rotate(${l.tierkreisDrehung.toFixed(3)})`);
      namen.forEach((n, i) => {
        n.top.setAttribute('opacity', l.namenOben[i].toFixed(3));
        n.bot.setAttribute('opacity', (1 - l.namenOben[i]).toFixed(3));
      });
      zeichen.forEach((z, i) => { z.setAttribute('x', f2(l.zeichen[i].x)); z.setAttribute('y', f2(l.zeichen[i].y)); });
    } else sicht(scheibe, 0);

    l.aspekte.forEach((a, i) => {
      const e = aspLinien[i];
      if (!sicht(e, a.deckkraft)) return;
      e.setAttribute('x1', f2(a.x1)); e.setAttribute('y1', f2(a.y1));
      e.setAttribute('x2', f2(a.x2)); e.setAttribute('y2', f2(a.y2));
      e.setAttribute('stroke-width', f2(a.breite * strich));
      if (a.hart) e.setAttribute('stroke-dasharray', '5 3.5');
      else e.removeAttribute('stroke-dasharray');
    });

    glyphen.forEach((g) => {
      const kl = l.koerper[g.id];
      if (sicht(g.text, kl.zeichenDeckkraft)) { g.text.setAttribute('x', f2(kl.x)); g.text.setAttribute('y', f2(kl.y)); }
      if (sicht(g.punkt, kl.zeichenDeckkraft)) { g.punkt.setAttribute('cx', f2(kl.punktX)); g.punkt.setAttribute('cy', f2(kl.punktY)); }
    });
  }

  /* Linienstärke je Ansicht: Faktor aus --rx-dick */
  function setzeStrich(faktor: number) {
    strich = faktor;
    svg.querySelectorAll('[data-w]').forEach((e) => e.setAttribute('stroke-width', (Number(e.getAttribute('data-w')) * strich).toFixed(2)));
    if (letztes) zeichne(letztes);
  }

  return { zeichne, setzeStrich };
}
