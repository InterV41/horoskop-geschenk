import { describe, it, expect } from 'vitest';
import { layout, mixWinkel, pt, aszendent, SPUR, R } from '../../src/scripts/kosmos/layout';
import { schritt, phase, EINSTIEG, TEMPO_SONNENSYSTEM, TEMPO_RADIX } from '../../src/scripts/kosmos/zeitplan';
import { laengen } from '../../src/scripts/kosmos/modell';

const norm = (x: number) => ((x % 360) + 360) % 360;

describe('layout', () => {
  it('mixWinkel nimmt den kurzen Weg über 0°', () => {
    expect(mixWinkel(350, 10, 0.5)).toBeCloseTo(0);
    expect(mixWinkel(10, 350, 0.25)).toBeCloseTo(5);
    expect(mixWinkel(90, 180, 1)).toBeCloseTo(180);
  });
  it('bei p = 1 stimmt alles mit der bestehenden Radix überein', () => {
    const tau = 2.4, asc = 211, rot = 180 - asc, l = laengen(tau), L = layout(tau, 1, asc);
    for (const id of ['sonne', 'mond', 'mars', 'pluto'] as const) {
      const [x, y] = pt(SPUR, norm(l[id] + rot));
      expect(L.koerper[id].x).toBeCloseTo(x, 6); expect(L.koerper[id].y).toBeCloseTo(y, 6);
      expect(L.koerper[id].zeichenDeckkraft).toBe(1); expect(L.koerper[id].kugelDeckkraft).toBe(0);
    }
    expect(L.K).toBeCloseTo(1, 9); expect(L.radix).toBe(1); expect(L.tierkreisDrehung).toBeCloseTo(-rot);
    expect(L.koerper.erde.x).toBeCloseTo(0); expect(L.koerper.erde.y).toBeCloseTo(0);
    expect(L.ringe.map((r) => r.rx).slice(3)).toEqual([R.hub, R.asp, R.ring, R.band, 411, R.out]);
  });
  it('bei p = 0 ist alles Radix-Spezifische unsichtbar', () => {
    const L = layout(1.1, 0, 170);
    expect(L.radix).toBe(0); expect(L.K).toBeCloseTo(0.42);
    expect(L.aspekte.every((a) => a.deckkraft === 0)).toBe(true);
    expect(Object.values(L.koerper).every((k) => k.zeichenDeckkraft === 0)).toBe(true);
    expect(L.koerper.sonne.x).toBeCloseTo(0); expect(L.koerper.sonne.y).toBeCloseTo(0);
  });
  it('die Sonne verlässt die Mitte schon in ihrer Zielrichtung', () => {
    const tau = 0.7, asc = 180, a = layout(tau, 0.02, asc).koerper.sonne, b = layout(tau, 0.04, asc).koerper.sonne;
    const w = (k: { x: number; y: number }) => norm((Math.atan2(-k.y, k.x) * 180) / Math.PI);
    expect(Math.abs(((w(a) - w(b) + 540) % 360) - 180)).toBeLessThan(0.5);
  });
  it('kein Körper springt zwischen zwei Bildern, auch über die Schleifengrenze', () => {
    let u = { t: 0, tau: 0 }, vorher = layout(0, phase(EINSTIEG), aszendent(0)), max = 0;
    for (let i = 0; i < 60 * 80; i++) {
      u = schritt(u, 1 / 60);
      const L = layout(u.tau, phase(u.t + EINSTIEG), aszendent(u.t));
      for (const id of Object.keys(L.koerper) as (keyof typeof L.koerper)[])
        max = Math.max(max, Math.hypot(L.koerper[id].x - vorher.koerper[id].x, L.koerper[id].y - vorher.koerper[id].y));
      vorher = L;
    }
    // schnellste echte Bewegung in der Verwandlung: rund 10 Einheiten pro Bild; ein Sprung wären Hunderte
    expect(max).toBeLessThan(25);
  });
  it('im Sonnensystem kreisen alle Planeten gleichsinnig gegen den Uhrzeigersinn', () => {
    const K = 0.42, dt = 0.5, ids = ['merkur', 'venus', 'erde', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto'] as const;
    const winkel = (k: { x: number; y: number }) => norm((Math.atan2(-k.y / K, k.x) * 180) / Math.PI);
    for (const t of [0, 7, 23]) {
      const a = layout(t * TEMPO_SONNENSYSTEM, 0, aszendent(t)), b = layout((t + dt) * TEMPO_SONNENSYSTEM, 0, aszendent(t + dt));
      for (const id of ids) {
        const d = ((winkel(b.koerper[id]) - winkel(a.koerper[id]) + 540) % 360) - 180;
        expect(d, id).toBeGreaterThan(0);
      }
    }
  });
  it('in der Radix ziehen alle Zeichen mit der Tagesdrehung im Uhrzeigersinn, auch der Mond', () => {
    const winkel = (k: { x: number; y: number }) => norm((Math.atan2(-k.y, k.x) * 180) / Math.PI);
    for (const t of [14, 20, 30]) {
      for (const tau of [0.2, 1.3, 4.1]) {
        const a = layout(tau, 1, aszendent(t)), b = layout(tau + TEMPO_RADIX, 1, aszendent(t + 1));
        for (const id of ['sonne', 'mond', 'merkur', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto'] as const) {
          const d = ((winkel(b.koerper[id]) - winkel(a.koerper[id]) + 540) % 360) - 180;
          expect(d, id).toBeLessThan(0);
        }
      }
    }
  });
  it('kein Körper kippt mitten in der Verwandlung auf die andere Seite (30 Durchläufe)', () => {
    // Merkur sprang in der Prüfung um Durchlauf 17 und 27, wenn der kurze Weg die Richtung wechselte
    const richtungen = new Map<string, number>();
    let u = { t: 0, tau: 0 }, vorher = layout(0, phase(EINSTIEG), aszendent(0), richtungen), max = 0;
    for (let i = 0; i < 60 * 40 * 30; i++) {
      u = schritt(u, 1 / 60);
      const L = layout(u.tau, phase(u.t + EINSTIEG), aszendent(u.t), richtungen);
      for (const id of Object.keys(L.koerper) as (keyof typeof L.koerper)[])
        max = Math.max(max, Math.hypot(L.koerper[id].x - vorher.koerper[id].x, L.koerper[id].y - vorher.koerper[id].y));
      vorher = L;
    }
    expect(max).toBeLessThan(25);
  }, 60000);
});
