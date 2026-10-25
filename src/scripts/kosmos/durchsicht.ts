// Durchsichtigkeit für den Kosmos-Film: Videos haben keine, deshalb wird der Film auf Schwarz (dunkel)
// bzw. Weiß (hell) gerendert und beim Abspielen zurückgerechnet. So liegt er ohne Kasten auf der Seite.
// Die Rechnung läuft als WebGL-Shader auf der Grafikkarte; dieselbe Formel liegt als reine Funktion vor.

export type Grund = 'schwarz' | 'weiss';

/* Kompressionsrauschen und leicht graue Bildecken im Grund (gemessen bis 14 von 255): darunter ganz
   durchsichtig, bis OBEN weich hochgezogen. Sonst zeichnen sich um Sterne und Planeten Vierecke ab. */
export const SCHWELLE = 0.06;
const OBEN = 0.16;

const klemm = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = klemm((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/* Farbe (0…1) vor dem Grund → Farbe und Deckkraft ohne Grund */
export function entmische(r: number, g: number, b: number, grund: Grund): [number, number, number, number] {
  const weiss = grund === 'weiss';
  let a = weiss ? 1 - Math.min(r, g, b) : Math.max(r, g, b);
  const roh = a;
  if (roh <= 0) return [0, 0, 0, 0];
  const farbe = (c: number) => klemm(weiss ? (c - (1 - roh)) / roh : c / roh);
  a = roh * smoothstep(SCHWELLE, OBEN, roh);
  if (a <= 0) return [0, 0, 0, 0];
  return [farbe(r), farbe(g), farbe(b), a];
}

export interface Durchsicht {
  zeichne(quelle: HTMLVideoElement | HTMLImageElement): void;
  setzeGrund(g: Grund): void;
  frei(): void;
}

const ECKEN = `attribute vec2 p; varying vec2 uv;
void main() { uv = vec2((p.x + 1.0) / 2.0, (1.0 - p.y) / 2.0); gl_Position = vec4(p, 0.0, 1.0); }`;

const FLAECHE = `precision mediump float;
uniform sampler2D bild; uniform float weiss; varying vec2 uv;
void main() {
  vec3 c = texture2D(bild, uv).rgb;
  float a = weiss > 0.5 ? 1.0 - min(c.r, min(c.g, c.b)) : max(c.r, max(c.g, c.b));
  vec3 f = weiss > 0.5 ? (c - (1.0 - a)) / max(a, 1e-4) : c / max(a, 1e-4);
  a *= smoothstep(${SCHWELLE.toFixed(3)}, ${OBEN.toFixed(3)}, a);
  gl_FragColor = vec4(clamp(f, 0.0, 1.0) * a, a);
}`;

/* WebGL-Abspieler: zeichnet Video oder Bild durchsichtig gerechnet auf den Canvas. Ohne WebGL: null */
export function erzeugeDurchsicht(canvas: HTMLCanvasElement, grund: Grund): Durchsicht | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const shader = (art: number, quelle: string) => {
    const s = gl.createShader(art)!;
    gl.shaderSource(s, quelle);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const v = shader(gl.VERTEX_SHADER, ECKEN), f = shader(gl.FRAGMENT_SHADER, FLAECHE);
  if (!v || !f) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const puffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, puffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ort = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(ort);
  gl.vertexAttribPointer(ort, 2, gl.FLOAT, false, 0, 0);

  const textur = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textur);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const weissOrt = gl.getUniformLocation(prog, 'weiss');
  const setzeGrund = (g: Grund) => gl.uniform1f(weissOrt, g === 'weiss' ? 1 : 0);
  setzeGrund(grund);

  return {
    zeichne(quelle) {
      const w = quelle instanceof HTMLVideoElement ? quelle.videoWidth : quelle.naturalWidth;
      if (!w) return; // noch nichts geladen
      if (canvas.width !== w) { canvas.width = w; canvas.height = w; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, quelle);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    setzeGrund,
    frei() {
      gl.deleteTexture(textur);
      gl.deleteBuffer(puffer);
      gl.deleteProgram(prog);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
