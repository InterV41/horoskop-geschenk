// Weltraum in echter 3D-Grafik (three.js): Milchstraße, Sterne, Panorama des Nachthimmels, Leuchten.
// Bauteile, je nach Abstand der Kamera überblendet:
//  · Galaxie als Bild im Raum (ESO/NASA/JPL-Caltech/R. Hurt, CC BY 4.0), aus der Ferne
//  · dieselbe Galaxie als Sternwolke, aus dem Bild gezogen: Farbe und Dichte folgen den Armen
//  · Nachbarsterne der Sonne, die beim Durchflug vorbeiziehen
//  · Panorama des Himmels von der Erde aus (Solar System Scope, CC BY 4.0), sobald wir in der Scheibe sind
//  · ferne Galaxien und Sterne im tiefen Raum
// Einheiten hier: Lichtjahre, Ursprung in der Sonne (so bleibt die Rechnung nahe der Sonne genau).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BREITE, BRENNWEITE, rampe } from './drehbuch';
import { LJ, RG, SONNE, type Kamera } from './galaxie';

const RG_LJ = RG / LJ;
const SONNE_LJ = new THREE.Vector3(SONNE[0] / LJ, SONNE[1] / LJ, SONNE[2] / LJ);
const ZENTRUM = SONNE_LJ.clone().negate(); // Mitte der Galaxie, von der Sonne aus

/* Lage der Sonne im Galaxienbild (Bruchteil der Bildbreite, von der Mitte nach unten) */
const SONNE_IM_BILD = 0.235;
const BILD_BREITE = (Math.hypot(SONNE[0], SONNE[1]) / LJ) / SONNE_IM_BILD;

function zufall(saat: number) {
  let a = saat >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = () => {
    const u = Math.max(1e-9, r()), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { r, g };
}

export function ladeBild(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, fehler) => {
    const b = new Image();
    b.onload = () => ok(b);
    b.onerror = () => fehler(new Error('Bild fehlt: ' + url));
    b.src = url;
  });
}

/* Sterne als Lichtpunkte: Größe und Deckkraft aus Helligkeit und Abstand, scheinbar flächentreu */
const PUNKT_ECKEN = `
attribute vec3 farbe;
attribute float hell;   // Leuchtkraft
attribute float flaeche; // Ausdehnung in Lichtjahren (0 = punktförmiger Stern)
uniform float brenn;     // Bildpunkte bei Abstand 1
uniform float belicht;
uniform float nahAus;    // Sterne näher als dies (Lichtjahre) blenden aus
uniform float dichte;    // Geräte-Bildpunkte je Bildpunkt (höhere Auflösung)
varying vec3 vFarbe;
varying float vDeck;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = max(-mv.z, 1e-6);
  gl_Position = projectionMatrix * mv;
  float px;
  float licht;
  if (flaeche < 0.0) {
    // Hintergrundstern mit fester scheinbarer Helligkeit
    px = 1.4 + 2.2 * hell;
    licht = min(1.0, hell * belicht * 2.4);
  } else if (flaeche > 0.0) {
    // Fleck der Galaxie: Licht verteilt sich auf seine Fläche im Bild
    px = flaeche * brenn / d;
    licht = hell * belicht;
  } else {
    // Stern: scheinbare Helligkeit nimmt mit dem Quadrat des Abstands ab
    float fluss = hell / (d * d);
    float f = fluss * belicht;
    px = 1.3 + 3.4 * pow(min(f, 40.0), 0.34);
    licht = min(1.0, pow(f, 0.42) * 3.0);
  }
  float g = max(px, 1.5);
  vDeck = licht * min(1.0, (px * px) / (g * g)) * smoothstep(nahAus * 0.3, nahAus, d);
  // große Flecken (Wolke von nahem) lösen sich auf, statt als Kleckse durchs Bild zu ziehen
  // von nahem löst sich ein Fleck in einen scharfen Lichtpunkt auf (ein Sternhaufen), statt zum Klecks zu wachsen
  if (flaeche > 0.0 && px > 1.5) { vDeck = licht * (0.55 + 0.08 * min(px, 12.0)); g = 1.5 + 1.4 * smoothstep(1.5, 30.0, px); }
  gl_PointSize = min(g, 48.0) * dichte;
  vFarbe = farbe;
}`;
const PUNKT_FLAECHE = `
varying vec3 vFarbe;
varying float vDeck;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  // weicher Fleck, der am Rand genau auf 0 endet: keine Kanten, keine Kästen
  float a = (exp(-r2 * 4.0) - 0.0183156) / 0.9816844 * vDeck;
  gl_FragColor = vec4(vFarbe * a, a);
}`;

/* Panorama: Richtung → galaktische Länge und Breite → Bildpunkt */
const HIMMEL_ECKEN = `
varying vec3 vRichtung;
void main() {
  vRichtung = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const HIMMEL_FLAECHE = `
uniform sampler2D bild;
uniform vec3 zumZentrum;
uniform vec3 seite;
uniform float deck;
uniform float belicht;
varying vec3 vRichtung;
void main() {
  vec3 d = normalize(vRichtung);
  float l = atan(dot(d, seite), dot(d, zumZentrum));
  float b = asin(clamp(d.z, -1.0, 1.0));
  vec2 uv = vec2(0.5 - l / 6.2831853, 0.5 + b / 3.1415927);
  vec3 c = texture2D(bild, uv).rgb;
  c = max(c - 0.025, 0.0);
  c = pow(c, vec3(1.15)) * belicht;
  gl_FragColor = vec4(c * deck, 1.0);
}`;

export interface Weltraum {
  zeichne(k: Kamera, t: number): void;
}

export async function baueWeltraum(canvas: HTMLCanvasElement, quelle: (pfad: string) => string, dichte = 1): Promise<Weltraum> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dichte);
  renderer.setSize(BREITE, BREITE, false);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const szene = new THREE.Scene();
  const fov = (2 * Math.atan(BREITE / 2 / BRENNWEITE) * 180) / Math.PI;
  const kam = new THREE.PerspectiveCamera(fov, 1, 1e-6, 1e9);

  const [galaxieBild, panorama] = await Promise.all([ladeBild(quelle('texturen/milchstrasse.jpg')), ladeBild(quelle('texturen/8k_stars_milky_way.jpg'))]);

  /* Grundlinien der Galaxie: zur Mitte, quer dazu in der Ebene, Norden */
  const zumZentrum = ZENTRUM.clone().normalize();
  const seite = new THREE.Vector3(0, 0, 1).cross(zumZentrum).normalize();

  /* 1 · Galaxie als Bild im Raum */
  const bildTex = new THREE.Texture(galaxieBild);
  bildTex.colorSpace = THREE.SRGBColorSpace;
  bildTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  bildTex.needsUpdate = true;
  const ebeneMat = new THREE.MeshBasicMaterial({ map: bildTex, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide, opacity: 1 });
  const ebene = new THREE.Mesh(new THREE.PlaneGeometry(BILD_BREITE, BILD_BREITE), ebeneMat);
  // Bild drehen, bis die Richtung Sonne → Mitte im Bild (nach oben) zur echten zeigt
  ebene.rotation.z = Math.atan2(zumZentrum.y, zumZentrum.x) - Math.PI / 2;
  ebene.position.copy(ZENTRUM);
  szene.add(ebene);

  /* Hilfe: Bildpunkt des Galaxienbilds an einem Ort der Ebene (relativ zur Mitte, Lichtjahre) */
  const probe = document.createElement('canvas');
  const PB = 1400;
  probe.width = probe.height = PB;
  const pctx = probe.getContext('2d', { willReadFrequently: true })!;
  pctx.drawImage(galaxieBild, 0, 0, PB, PB);
  const pdaten = pctx.getImageData(0, 0, PB, PB).data;
  const cosR = Math.cos(-ebene.rotation.z), sinR = Math.sin(-ebene.rotation.z);
  const pixel = (x: number, y: number): [number, number, number] | null => {
    // in Bildkoordinaten zurückdrehen
    const lx = x * cosR - y * sinR, ly = x * sinR + y * cosR;
    const u = lx / BILD_BREITE + 0.5, v = 0.5 - ly / BILD_BREITE;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
    const i = (Math.floor(v * PB) * PB + Math.floor(u * PB)) * 4;
    return [pdaten[i] / 255, pdaten[i + 1] / 255, pdaten[i + 2] / 255];
  };

  /* 2 · Galaxie als Sternwolke, verteilt nach der Helligkeit des Bildes */
  const { r, g } = zufall(1339);
  const N = 900000;
  const pos = new Float32Array(N * 3), farbe = new Float32Array(N * 3), hell = new Float32Array(N), flaeche = new Float32Array(N);
  let n = 0;
  const lin = (c: number) => Math.pow(c, 2.2);
  for (let versuch = 0; n < N && versuch < N * 30; versuch++) {
    const rr = Math.sqrt(r()) * 1.08 * RG_LJ, w = r() * Math.PI * 2;
    const x = Math.cos(w) * rr, y = Math.sin(w) * rr;
    const p = pixel(x, y);
    if (!p) continue;
    const L = Math.max(p[0], p[1], p[2]);
    if (r() > Math.pow(L, 1.6)) continue;
    const kern = Math.max(0, 1 - rr / (0.16 * RG_LJ));
    const dicke = 0.012 * RG_LJ + 0.09 * RG_LJ * kern * kern;
    pos[n * 3] = ZENTRUM.x + x;
    pos[n * 3 + 1] = ZENTRUM.y + y;
    pos[n * 3 + 2] = ZENTRUM.z + g() * dicke * 0.5;
    // Farbe aus dem Bild, etwas gesättigter; ein paar Sterne stechen heraus
    const funkeln = r() < 0.04 ? 2.5 : 1;
    farbe[n * 3] = lin(p[0]) * funkeln; farbe[n * 3 + 1] = lin(p[1]) * funkeln; farbe[n * 3 + 2] = lin(p[2]) * funkeln;
    hell[n] = 1;
    flaeche[n] = 0.0022 * RG_LJ;
    n++;
  }
  const wolke = new THREE.BufferGeometry();
  wolke.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3));
  wolke.setAttribute('farbe', new THREE.BufferAttribute(farbe.subarray(0, n * 3), 3));
  wolke.setAttribute('hell', new THREE.BufferAttribute(hell.subarray(0, n), 1));
  wolke.setAttribute('flaeche', new THREE.BufferAttribute(flaeche.subarray(0, n), 1));
  const punktMat = (nahAus: number) =>
    new THREE.ShaderMaterial({
      vertexShader: PUNKT_ECKEN, fragmentShader: PUNKT_FLAECHE,
      uniforms: { brenn: { value: BRENNWEITE }, belicht: { value: 1 }, nahAus: { value: nahAus }, dichte: { value: dichte } },
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
  const wolkeMat = punktMat(30);
  const wolkePunkte = new THREE.Points(wolke, wolkeMat);
  wolkePunkte.frustumCulled = false;
  szene.add(wolkePunkte);

  /* 3 · Nachbarsterne: echte Farben der Sternklassen, Leuchtkraft nach Potenzgesetz */
  const KLASSEN: [number, number, number, number][] = [
    // Anteil, r, g, b
    [0.02, 0.62, 0.72, 1.0],
    [0.08, 0.8, 0.86, 1.0],
    [0.2, 1.0, 0.97, 0.94],
    [0.3, 1.0, 0.9, 0.75],
    [0.4, 1.0, 0.76, 0.55],
  ];
  const NN = 22000;
  const npos = new Float32Array(NN * 3), nfarbe = new Float32Array(NN * 3), nhell = new Float32Array(NN), nfl = new Float32Array(NN);
  for (let i = 0; i < NN; i++) {
    // halb nah um die Sonne gestaffelt (für den Anflug), halb gleichmäßig im Raum (sonst sähe man von fern einen Haufen)
    // gleichmäßig im Raum: kein Haufen um die Sonne, der beim Heranzoomen als helle Ellipse in der Mitte stünde
    const d = 60000 * Math.cbrt(r());
    let ux = g(), uy = g(), uz = g();
    const l = Math.hypot(ux, uy, uz) || 1;
    ux /= l; uy /= l; uz /= l;
    // in alle Richtungen, ohne Scheibe: so entsteht beim Heranfliegen kein Band
    npos[i * 3] = ux * d; npos[i * 3 + 1] = uy * d; npos[i * 3 + 2] = uz * d;
    let s = r(), k = 0;
    while (k < KLASSEN.length - 1 && s > KLASSEN[k][0]) { s -= KLASSEN[k][0]; k++; }
    nfarbe[i * 3] = KLASSEN[k][1]; nfarbe[i * 3 + 1] = KLASSEN[k][2]; nfarbe[i * 3 + 2] = KLASSEN[k][3];
    // Leuchtkraft (Sonne = 1), heiße Sterne heller; je weiter, desto mehr helle (sonst sähe man sie nicht)
    // scheinbare Helligkeit: wenige helle, viele schwache
    nhell[i] = 0.18 + 0.82 * Math.pow(r(), 3.5);
    nfl[i] = -1;
  }
  const nachbarn = new THREE.BufferGeometry();
  nachbarn.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  nachbarn.setAttribute('farbe', new THREE.BufferAttribute(nfarbe, 3));
  nachbarn.setAttribute('hell', new THREE.BufferAttribute(nhell, 1));
  nachbarn.setAttribute('flaeche', new THREE.BufferAttribute(nfl, 1));
  const nachbarMat = punktMat(0.02);
  const nachbarPunkte = new THREE.Points(nachbarn, nachbarMat);
  nachbarPunkte.frustumCulled = false;
  szene.add(nachbarPunkte);

  /* 4 · Tiefer Raum: ferne Galaxien als zarte Flecken */
  const NF = 2400;
  const fpos = new Float32Array(NF * 3), ffarbe = new Float32Array(NF * 3), fhell = new Float32Array(NF), ffl = new Float32Array(NF);
  for (let i = 0; i < NF; i++) {
    const d = (3 + r() * 30) * 1e6;
    let ux = g(), uy = g(), uz = g();
    const l = Math.hypot(ux, uy, uz) || 1;
    fpos[i * 3] = ZENTRUM.x + (ux / l) * d; fpos[i * 3 + 1] = ZENTRUM.y + (uy / l) * d; fpos[i * 3 + 2] = (uz / l) * d;
    const warm = r();
    ffarbe[i * 3] = 1; ffarbe[i * 3 + 1] = 0.85 + 0.1 * warm; ffarbe[i * 3 + 2] = 0.7 + 0.3 * warm;
    fhell[i] = 0.25 + 0.75 * r() ** 3;
    ffl[i] = (0.4 + 2.6 * r() ** 4) * RG_LJ * 0.1;
  }
  const fern = new THREE.BufferGeometry();
  fern.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  fern.setAttribute('farbe', new THREE.BufferAttribute(ffarbe, 3));
  fern.setAttribute('hell', new THREE.BufferAttribute(fhell, 1));
  fern.setAttribute('flaeche', new THREE.BufferAttribute(ffl, 1));
  const fernMat = punktMat(0);
  const fernPunkte = new THREE.Points(fern, fernMat);
  fernPunkte.frustumCulled = false;
  szene.add(fernPunkte);

  /* 5 · Panorama des Himmels: eine große Kugel um die Kamera */
  const panoTex = new THREE.Texture(panorama);
  panoTex.colorSpace = THREE.SRGBColorSpace;
  panoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  panoTex.needsUpdate = true;
  const himmelMat = new THREE.ShaderMaterial({
    vertexShader: HIMMEL_ECKEN, fragmentShader: HIMMEL_FLAECHE,
    uniforms: { bild: { value: panoTex }, zumZentrum: { value: zumZentrum }, seite: { value: seite }, deck: { value: 0 }, belicht: { value: 6 } },
    side: THREE.BackSide, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
  });
  const himmel = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), himmelMat);
  himmel.renderOrder = -1;
  himmel.frustumCulled = false;
  szene.add(himmel);

  /* Leuchten wie bei einer echten Kamera: Helles strahlt weich in die Umgebung */
  const komp = new EffectComposer(renderer);
  komp.setPixelRatio(dichte);
  komp.setSize(BREITE, BREITE);
  komp.addPass(new RenderPass(szene, kam));
  // Leuchten aus: Es rechnet auf grob verkleinerten Stufen und macht Lichthöfe eckig
  komp.addPass(new OutputPass());
  /* Schwarzer Grund muss exakt schwarz sein: Die Seite macht aus jedem Grau Deckkraft, schwaches Grau
     würde als Schleier oder Kästchen sichtbar. Unter der Schwelle wird alles 0, darüber weich gestreckt. */
  komp.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float m = max(c.r, max(c.g, c.b));
        float k = smoothstep(${(12 / 255).toFixed(4)}, ${(30 / 255).toFixed(4)}, m);
        gl_FragColor = vec4(c * k, 1.0);
      }`,
  }));

  function zeichne(k: Kamera, t: number) {
    const ort = new THREE.Vector3(k.ox / LJ, k.oy / LJ, k.oz / LJ).sub(SONNE_LJ);
    const d = k.abstand / LJ;
    kam.position.copy(ort);
    kam.up.set(k.ux, k.uy, k.uz);
    kam.lookAt(ort.x + k.fx, ort.y + k.fy, ort.z + k.fz);
    kam.near = Math.max(1e-7, d * 1e-4);
    kam.far = 1e9;
    kam.updateProjectionMatrix();

    const ld = Math.log(d / RG_LJ);
    // Bild aus der Ferne, Sternwolke aus mittlerer Nähe, Panorama in der Scheibe
    const bildAnteil = rampe(ld, Math.log(0.16), Math.log(0.5));
    // Ab dem Einstieg auf der Seite (Filmzeit 6 s) ist die Milchstraße weg: nur noch einzelne Sterne
    const band = 1 - rampe(t, 4.6, 5.8);
    ebeneMat.opacity = 0.95 * bildAnteil * band;
    ebene.visible = bildAnteil > 0.002;
    wolkeMat.uniforms.belicht.value = (0.35 + 1.1 * (1 - bildAnteil)) * rampe(ld, Math.log(0.0035), Math.log(0.03)) * band;
        himmelMat.uniforms.deck.value = 0; // Panorama trägt das Milchstraßenband, deshalb aus
    himmel.position.copy(ort);
    himmel.scale.setScalar(Math.max(10, d * 100));
    // Nachbarsterne tragen jetzt allein den Durchflug: aus der Ferne heller, damit sie sichtbar heranrasen
    nachbarMat.uniforms.belicht.value = 0.9 * Math.max(1 - rampe(ld, Math.log(0.12), Math.log(0.45)), 1 - band);
    fernMat.uniforms.belicht.value = 0.06;
    komp.render();
  }

  return { zeichne };
}
