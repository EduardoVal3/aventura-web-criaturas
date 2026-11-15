/**
 * Diorama glaciar animado 60 FPS para "La Cumbre" (ZON-06) en el mapa de Aethelgard (espacio lógico 1616x897).
 * Todas las coordenadas fueron medidas directamente sobre apps/web/public/assets/mapa-mundo-aethelgard.webp:
 * silueta real de acantilados y cumbres, 8 vértices de cordillera, 4 cúmulos de cristales + 2 agujas de acantilado,
 * esqueleto del dragón ancestral congelado y cornisa sur de carámbanos.
 * Usa sprites fuera de pantalla cacheados una sola vez para mantener 60 FPS sin basura de gradientes por cuadro.
 */
import type { Punto2D } from "./mapa-dioramas.ts";
import type { MascaraOceano } from "./oceano-vivo.ts";

export interface PicoCordilleraCumbre {
  x: number;
  y: number;
  longitudPluma: number;
  intensidad: number;
  fase: number;
}

export interface CristalGlaciarCumbre {
  id: string;
  punta: Punto2D;
  arista: Punto2D;
  base: Punto2D;
  radioBase: number;
  fase: number;
  satelites: readonly Punto2D[];
}

export interface EsqueletoDragonCumbre {
  fauces: Punto2D;
  cuencaOcular: Punto2D;
  costillasCentro: Punto2D;
  vertebras: readonly Punto2D[];
  basePatas: readonly Punto2D[];
}

/**
 * Envolvente exterior calibrada píxel a píxel alrededor de ZON-06 (sin invadir ZON-04, LOC-03 ni ZON-05).
 */
export const SILUETA_ENVOLVENTE_CUMBRE: readonly Punto2D[] = [
  { x: 768, y: 168 },
  { x: 770, y: 128 },
  { x: 794, y: 96 },
  { x: 824, y: 72 },
  { x: 849, y: 24 },
  { x: 882, y: 66 },
  { x: 927, y: 58 },
  { x: 962, y: 54 },
  { x: 996, y: 22 },
  { x: 1034, y: 8 },
  { x: 1070, y: 0 },
  { x: 1112, y: 16 },
  { x: 1146, y: 24 },
  { x: 1184, y: 22 },
  { x: 1218, y: 66 },
  { x: 1249, y: 56 },
  { x: 1288, y: 102 },
  { x: 1306, y: 148 },
  { x: 1298, y: 178 },
  { x: 1260, y: 186 },
  { x: 1224, y: 212 },
  { x: 1202, y: 242 },
  { x: 1156, y: 240 },
  { x: 1105, y: 224 },
  { x: 1055, y: 208 },
  { x: 1012, y: 196 },
  { x: 982, y: 190 },
  { x: 944, y: 198 },
  { x: 904, y: 202 },
  { x: 868, y: 214 },
  { x: 824, y: 208 },
  { x: 788, y: 190 },
];

/**
 * Meseta nevada interior de La Cumbre para confinar neblina rasante sobre la nieve.
 */
export const CONTORNO_MESETA_CUMBRE: readonly Punto2D[] = [
  { x: 778, y: 128 },
  { x: 822, y: 98 },
  { x: 892, y: 92 },
  { x: 960, y: 96 },
  { x: 1022, y: 108 },
  { x: 1096, y: 92 },
  { x: 1176, y: 98 },
  { x: 1236, y: 118 },
  { x: 1286, y: 148 },
  { x: 1260, y: 178 },
  { x: 1196, y: 180 },
  { x: 1116, y: 168 },
  { x: 1030, y: 174 },
  { x: 954, y: 166 },
  { x: 894, y: 148 },
  { x: 824, y: 142 },
  { x: 778, y: 134 },
];

export const PICOS_CORDILLERA_CUMBRE: readonly PicoCordilleraCumbre[] = [
  { x: 964, y: 72, longitudPluma: 18, intensidad: 0.6, fase: 0.4 },
  { x: 1004, y: 34, longitudPluma: 24, intensidad: 0.85, fase: 1.3 },
  { x: 1032, y: 24, longitudPluma: 26, intensidad: 0.9, fase: 2.5 },
  { x: 1070, y: 3, longitudPluma: 34, intensidad: 1.0, fase: 0.0 },
  { x: 1096, y: 36, longitudPluma: 22, intensidad: 0.78, fase: 3.7 },
  { x: 1132, y: 42, longitudPluma: 18, intensidad: 0.65, fase: 4.9 },
  { x: 1184, y: 38, longitudPluma: 28, intensidad: 0.92, fase: 2.1 },
  { x: 1206, y: 78, longitudPluma: 16, intensidad: 0.55, fase: 5.4 },
];

export const CRISTALES_GLACIARES_CUMBRE: readonly CristalGlaciarCumbre[] = [
  {
    id: "cristal-oeste",
    punta: { x: 849, y: 35 },
    arista: { x: 849, y: 54 },
    base: { x: 848, y: 96 },
    radioBase: 34,
    fase: 0.1,
    satelites: [
      { x: 828, y: 70 },
      { x: 868, y: 66 },
      { x: 819, y: 86 },
    ],
  },
  {
    id: "cristal-centro-oeste",
    punta: { x: 927, y: 72 },
    arista: { x: 927, y: 88 },
    base: { x: 927, y: 120 },
    radioBase: 25,
    fase: 1.7,
    satelites: [
      { x: 911, y: 106 },
      { x: 942, y: 104 },
    ],
  },
  {
    id: "cristal-este",
    punta: { x: 1249, y: 69 },
    arista: { x: 1249, y: 86 },
    base: { x: 1248, y: 132 },
    radioBase: 32,
    fase: 3.1,
    satelites: [
      { x: 1229, y: 108 },
      { x: 1269, y: 105 },
    ],
  },
  {
    id: "cristal-cornisa",
    punta: { x: 1172, y: 154 },
    arista: { x: 1172, y: 169 },
    base: { x: 1172, y: 206 },
    radioBase: 22,
    fase: 4.6,
    satelites: [
      { x: 1160, y: 195 },
      { x: 1184, y: 198 },
    ],
  },
];

export const AGUJAS_ACANTILADO_CUMBRE: readonly Punto2D[] = [
  { x: 863, y: 128 },
  { x: 886, y: 150 },
];

export const ESQUELETO_DRAGON_CUMBRE: EsqueletoDragonCumbre = {
  fauces: { x: 1024, y: 143 },
  cuencaOcular: { x: 1046, y: 130 },
  costillasCentro: { x: 1114, y: 124 },
  vertebras: [
    { x: 1068, y: 122 },
    { x: 1084, y: 114 },
    { x: 1098, y: 105 },
    { x: 1114, y: 98 },
    { x: 1132, y: 102 },
    { x: 1148, y: 111 },
    { x: 1165, y: 118 },
    { x: 1176, y: 128 },
    { x: 1172, y: 142 },
    { x: 1152, y: 152 },
    { x: 1130, y: 159 },
  ],
  basePatas: [
    { x: 1082, y: 145 },
    { x: 1152, y: 138 },
  ],
};

export const DESTELLOS_CORNISA_CUMBRE: readonly Punto2D[] = [
  { x: 796, y: 176 },
  { x: 824, y: 144 },
  { x: 863, y: 128 },
  { x: 886, y: 150 },
  { x: 918, y: 154 },
  { x: 956, y: 166 },
  { x: 1002, y: 172 },
  { x: 1052, y: 174 },
  { x: 1104, y: 168 },
  { x: 1148, y: 164 },
  { x: 1220, y: 176 },
  { x: 1268, y: 184 },
];

export const FRAGMENTOS_ESCARCHA_ACANTILADO: readonly Punto2D[] = [
  { x: 805, y: 186 },
  { x: 842, y: 200 },
  { x: 1112, y: 216 },
  { x: 1148, y: 226 },
  { x: 1192, y: 232 },
];

interface CopoVentisca {
  xBase: number;
  yBase: number;
  velocidadX: number;
  velocidadY: number;
  tamano: number;
  fase: number;
  alfaBase: number;
  conEstela: boolean;
}

const COPOS_LEJANOS: readonly CopoVentisca[] = Array.from({ length: 22 }, (_, i) => ({
  xBase: 778 + ((i * 61 + 19) % 514),
  yBase: 4 + ((i * 37 + 11) % 154),
  velocidadX: 0.013 + (i % 4) * 0.0028,
  velocidadY: 0.009 + (i % 3) * 0.0024,
  tamano: i % 4 === 0 ? 2 : 1.5,
  fase: i * 0.85,
  alfaBase: 0.44 + (i % 3) * 0.1,
  conEstela: false,
}));

const COPOS_VENTISCA: readonly CopoVentisca[] = Array.from({ length: 34 }, (_, i) => ({
  xBase: 772 + ((i * 47 + 23) % 528),
  yBase: 10 + ((i * 41 + 7) % 206),
  velocidadX: 0.044 + (i % 5) * 0.007,
  velocidadY: 0.018 + (i % 4) * 0.0035,
  tamano: i % 3 === 0 ? 2.5 : 2,
  fase: i * 1.13,
  alfaBase: 0.66 + (i % 3) * 0.12,
  conEstela: i % 2 === 0,
}));

interface SpritesCumbreCache {
  resplandorGlacial: HTMLCanvasElement;
  resplandorEspectral: HTMLCanvasElement;
  cortinaEsmeralda: HTMLCanvasElement;
  cortinaVioleta: HTMLCanvasElement;
  brumaFria: HTMLCanvasElement;
  brumaCian: HTMLCanvasElement;
}

let spritesCumbreCache: SpritesCumbreCache | null = null;

function crearCanvasAuxiliar(ancho: number, alto: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  return canvas;
}

function obtenerSpritesCumbre(): SpritesCumbreCache | null {
  if (typeof document === "undefined") return null;
  if (spritesCumbreCache) return spritesCumbreCache;

  // 1. Sprite de resplandor radial glaciar (cristales, ojo y vértebras)
  const resplandorGlacial = crearCanvasAuxiliar(64, 64);
  const gCtx = resplandorGlacial.getContext("2d");
  if (gCtx) {
    const grad = gCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
    grad.addColorStop(0.35, "rgba(125, 211, 252, 0.62)");
    grad.addColorStop(0.7, "rgba(56, 189, 248, 0.2)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 64, 64);
  }

  // 1b. Sprite de resplandor espectral cian intenso (contrasta sobre huesos y nieve clara)
  const resplandorEspectral = crearCanvasAuxiliar(64, 64);
  const sCtx = resplandorEspectral.getContext("2d");
  if (sCtx) {
    const grad = sCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(224, 242, 254, 1)");
    grad.addColorStop(0.28, "rgba(34, 211, 238, 0.88)");
    grad.addColorStop(0.65, "rgba(14, 165, 233, 0.36)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
  }

  // 2. Cortina vertical de aurora esmeralda -> cian
  const cortinaEsmeralda = crearCanvasAuxiliar(32, 64);
  const eCtx = cortinaEsmeralda.getContext("2d");
  if (eCtx) {
    const gradV = eCtx.createLinearGradient(0, 0, 0, 64);
    gradV.addColorStop(0, "rgba(56, 189, 248, 0)");
    gradV.addColorStop(0.24, "rgba(45, 212, 191, 0.72)");
    gradV.addColorStop(0.56, "rgba(52, 211, 153, 1)");
    gradV.addColorStop(0.84, "rgba(110, 231, 183, 0.62)");
    gradV.addColorStop(1, "rgba(16, 185, 129, 0)");
    eCtx.fillStyle = gradV;
    eCtx.fillRect(2, 0, 28, 64);

    // Suavizar flancos laterales con máscara horizontal
    eCtx.globalCompositeOperation = "destination-in";
    const gradH = eCtx.createLinearGradient(0, 0, 32, 0);
    gradH.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradH.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradH.addColorStop(1, "rgba(255, 255, 255, 0)");
    eCtx.fillStyle = gradH;
    eCtx.fillRect(0, 0, 32, 64);
  }

  // 3. Cortina alta de aurora violeta -> cian polar
  const cortinaVioleta = crearCanvasAuxiliar(32, 64);
  const vCtx = cortinaVioleta.getContext("2d");
  if (vCtx) {
    const gradV = vCtx.createLinearGradient(0, 0, 0, 64);
    gradV.addColorStop(0, "rgba(168, 85, 247, 0)");
    gradV.addColorStop(0.28, "rgba(192, 132, 252, 0.92)");
    gradV.addColorStop(0.64, "rgba(56, 189, 248, 0.85)");
    gradV.addColorStop(1, "rgba(56, 189, 248, 0)");
    vCtx.fillStyle = gradV;
    vCtx.fillRect(2, 0, 28, 64);

    vCtx.globalCompositeOperation = "destination-in";
    const gradH = vCtx.createLinearGradient(0, 0, 32, 0);
    gradH.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradH.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradH.addColorStop(1, "rgba(255, 255, 255, 0)");
    vCtx.fillStyle = gradH;
    vCtx.fillRect(0, 0, 32, 64);
  }

  // 4. Jirones de bruma helada (aliento del dragón y neblina rasante)
  const brumaFria = crearCanvasAuxiliar(64, 32);
  const bCtx = brumaFria.getContext("2d");
  if (bCtx) {
    bCtx.save();
    bCtx.scale(2, 1);
    const grad = bCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
    grad.addColorStop(0.5, "rgba(186, 230, 253, 0.5)");
    grad.addColorStop(1, "rgba(186, 230, 253, 0)");
    bCtx.fillStyle = grad;
    bCtx.fillRect(0, 0, 32, 32);
    bCtx.restore();
  }

  // 4b. Bruma glaciar cian (visible sobre nieve blanca en aliento y costillas)
  const brumaCian = crearCanvasAuxiliar(64, 32);
  const bcCtx = brumaCian.getContext("2d");
  if (bcCtx) {
    bcCtx.save();
    bcCtx.scale(2, 1);
    const grad = bcCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(186, 230, 253, 0.92)");
    grad.addColorStop(0.42, "rgba(56, 189, 248, 0.62)");
    grad.addColorStop(0.75, "rgba(14, 165, 233, 0.24)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    bcCtx.fillStyle = grad;
    bcCtx.fillRect(0, 0, 32, 32);
    bcCtx.restore();
  }

  spritesCumbreCache = {
    resplandorGlacial,
    resplandorEspectral,
    cortinaEsmeralda,
    cortinaVioleta,
    brumaFria,
    brumaCian,
  };
  return spritesCumbreCache;
}

function trazarPoligono(
  ctx: CanvasRenderingContext2D,
  puntos: readonly Punto2D[],
): void {
  ctx.beginPath();
  for (let i = 0; i < puntos.length; i++) {
    if (i === 0) ctx.moveTo(puntos[i].x, puntos[i].y);
    else ctx.lineTo(puntos[i].x, puntos[i].y);
  }
  ctx.closePath();
}

function esTierraFirmeEnMascara(
  mascara: MascaraOceano | null | undefined,
  lx: number,
  ly: number,
): boolean {
  if (!mascara) return false;
  const gx = Math.floor(lx * mascara.escala);
  const gy = Math.floor(ly * mascara.escala);
  if (gx < 0 || gx >= mascara.ancho || gy < 0 || gy >= mascara.alto) return false;
  return mascara.distanciaSinPuentes[gy * mascara.ancho + gx] === 0;
}

function dibujarResplandorSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  cx: number,
  cy: number,
  radioX: number,
  radioY: number,
  alfa: number,
): void {
  if (alfa <= 0.005) return;
  ctx.globalAlpha = alfa;
  ctx.drawImage(sprite, cx - radioX, cy - radioY, radioX * 2, radioY * 2);
}

/**
 * Dibuja un destello en cruz pixelada nítido (sin desenfoque artificial) sobre vértices cristalinos.
 */
function dibujarDestelloCruzPixel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  brazo: number,
  alfa: number,
  colorArm = "rgba(125, 211, 252, 0.9)",
): void {
  if (alfa <= 0.04) return;
  const px = Math.round(cx);
  const py = Math.round(cy);
  const largo = Math.max(2, Math.round(brazo));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alfa;
  ctx.fillStyle = colorArm;
  ctx.fillRect(px - largo, py, largo * 2 + 1, 1);
  ctx.fillRect(px, py - largo, 1, largo * 2 + 1);
  ctx.fillStyle = "#f0f9ff";
  ctx.fillRect(px - 1, py - 1, 2, 2);
  ctx.restore();
}

function dibujarAuroraBorealCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Halo polar difuso coronando la cordillera nevada
  const pulsoPolar = 0.14 + Math.sin(t * 0.0011) * 0.04;
  dibujarResplandorSprite(
    ctx,
    sprites.resplandorGlacial,
    1066,
    16,
    175,
    40,
    pulsoPolar,
  );

  // Cortina 1: velo ondulante esmeralda -> cian sobre el cielo norte (x: 786..1292)
  const columnas1 = 34;
  for (let i = 0; i < columnas1; i++) {
    const u = i / (columnas1 - 1);
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.72);
    const x = 786 + u * 506;
    const onda =
      Math.sin(u * 5.2 - t * 0.0014) * 8 +
      Math.cos(u * 9.1 + t * 0.0021) * 4;
    const yBase = 34 - envolvente * 20 + onda * 0.6;
    const altoCol = 44 + Math.sin(u * 7.5 + t * 0.0019) * 10;
    const densidad = 0.55 + 0.45 * Math.sin(u * 12.2 - t * 0.0026 + i * 0.45);
    const alfa = envolvente * (0.14 + densidad * 0.16);

    ctx.globalAlpha = alfa;
    ctx.drawImage(
      sprites.cortinaEsmeralda,
      x - 16 + Math.sin(t * 0.001 + i) * 2,
      yBase - altoCol * 0.52,
      32,
      altoCol,
    );
  }

  // Cortina 2: banda superior violeta-cian con rayos verticales en contrafase
  const columnas2 = 24;
  for (let i = 0; i < columnas2; i++) {
    const u = i / (columnas2 - 1);
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.75);
    const x = 816 + u * 448;
    const onda = Math.cos(u * 4.4 + t * 0.0016) * 7;
    const yBase = 22 - envolvente * 12 + onda * 0.55;
    const altoCol = 34 + Math.cos(u * 6.2 - t * 0.0022) * 8;
    const densidad = 0.5 + 0.5 * Math.cos(u * 9.4 + t * 0.0023);
    const alfa = envolvente * (0.11 + densidad * 0.14);

    ctx.globalAlpha = alfa;
    ctx.drawImage(
      sprites.cortinaVioleta,
      x - 15,
      yBase - altoCol * 0.54,
      30,
      altoCol,
    );
  }

  // Rayos verticales orgánicos suaves (sin postes rígidos uniformes) usando el sprite degradado
  for (let r = 0; r < 16; r++) {
    const u = ((r * 0.6180339) % 1);
    const envolvente = Math.sin(u * Math.PI);
    const rx = 796 + u * 488 + Math.sin(t * 0.0011 + r * 2.1) * 7;
    const ryTop = 4 + (1 - envolvente) * 16 + Math.cos(u * 6 + t * 0.0014) * 3;
    const rAlto = 24 + envolvente * 18 + Math.sin(t * 0.002 + r * 1.7) * 5;
    const brillo = envolvente * (0.09 + 0.14 * Math.max(0, Math.sin(t * 0.0024 + r * 2.3)));
    ctx.globalAlpha = brillo;
    ctx.drawImage(
      r % 3 === 0 ? sprites.cortinaVioleta : sprites.cortinaEsmeralda,
      rx - 5,
      ryTop,
      10,
      rAlto,
    );
  }

  ctx.restore();
}

function dibujarVentiscaYPlumasCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  mascara: MascaraOceano | null | undefined,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_CUMBRE);
  ctx.clip();

  // 1. Plano lejano: copos suaves sobre las laderas y el cielo inmediato
  for (let i = 0; i < COPOS_LEJANOS.length; i++) {
    const c = COPOS_LEJANOS[i];
    const rx = ((c.xBase + t * c.velocidadX + Math.sin(t * 0.0012 + c.fase) * 5) - 775) % 525;
    const ry = ((c.yBase + t * c.velocidadY) - 4) % 162;
    const px = Math.round(775 + (rx < 0 ? rx + 525 : rx));
    const py = Math.round(4 + (ry < 0 ? ry + 162 : ry));
    ctx.fillStyle = `rgba(224, 242, 254, ${c.alfaBase.toFixed(2)})`;
    ctx.fillRect(px, py, c.tamano, c.tamano);
  }

  // 2. Neblina rasante ceñida a la meseta nevada
  ctx.save();
  trazarPoligono(ctx, CONTORNO_MESETA_CUMBRE);
  ctx.clip();
  for (let m = 0; m < 5; m++) {
    const u = ((t * 0.00008 + m * 0.21) % 1);
    const mx = 795 + u * 455;
    const my = 122 + (m % 3) * 16 + Math.sin(t * 0.0008 + m * 1.9) * 4;
    if (mascara && !esTierraFirmeEnMascara(mascara, mx, my)) continue;
    const fade = Math.sin(u * Math.PI);
    dibujarResplandorSprite(ctx, sprites.brumaFria, mx, my, 46, 11, 0.11 * fade);
  }
  ctx.restore();

  // 3. Estelas/plumas de nieve desprendiéndose desde las crestas de los picos hacia la derecha
  if (!reducirMovimiento) {
    const rafagaGlobal = 0.72 + 0.28 * Math.sin(t * 0.0013);
    for (let p = 0; p < PICOS_CORDILLERA_CUMBRE.length; p++) {
      const pico = PICOS_CORDILLERA_CUMBRE[p];
      if (pico.intensidad < 0.7) continue;
      for (let k = 0; k < 5; k++) {
        const progreso = (t * 0.00082 + k * 0.2 + pico.fase * 0.17) % 1;
        const dx = progreso * pico.longitudPluma * rafagaGlobal;
        const dy = progreso * 4.5 + Math.sin(progreso * 5 + pico.fase) * 1.6;
        const alfa = Math.sin(progreso * Math.PI) * 0.62 * pico.intensidad;
        if (alfa <= 0.05) continue;
        const sx = Math.round(pico.x + dx);
        const sy = Math.round(pico.y + dy);
        ctx.fillStyle = `rgba(240, 249, 255, ${alfa.toFixed(2)})`;
        ctx.fillRect(sx, sy, progreso < 0.45 ? 3 : 2, 1.5);
        if (progreso < 0.65) {
          ctx.fillStyle = `rgba(186, 230, 253, ${(alfa * 0.45).toFixed(2)})`;
          ctx.fillRect(sx - 3, sy, 2, 1);
        }
      }
    }
  }

  // 4. Ráfagas diagonales de ventisca en primer plano
  const intensidadRafaga = reducirMovimiento ? 0.5 : 0.78 + 0.22 * Math.sin(t * 0.0017);
  const limiteVentisca = reducirMovimiento ? 12 : COPOS_VENTISCA.length;
  for (let i = 0; i < limiteVentisca; i++) {
    const c = COPOS_VENTISCA[i];
    const desplazamientoX = t * c.velocidadX * (0.85 + intensidadRafaga * 0.35);
    const desplazamientoY = t * c.velocidadY + Math.sin(t * 0.002 + c.fase) * 2.5;
    const rx = (c.xBase + desplazamientoX - 770) % 534;
    const ry = (c.yBase + desplazamientoY - 6) % 228;
    const px = Math.round(770 + (rx < 0 ? rx + 534 : rx));
    const py = Math.round(6 + (ry < 0 ? ry + 228 : ry));

    const alfa = Math.min(0.88, c.alfaBase * (0.7 + 0.3 * intensidadRafaga));
    const sobreNieve = py >= 96 && py <= 176;
    ctx.fillStyle = sobreNieve && i % 2 === 0
      ? `rgba(125, 211, 252, ${(alfa * 0.92).toFixed(2)})`
      : `rgba(240, 249, 255, ${alfa.toFixed(2)})`;
    ctx.fillRect(px, py, c.tamano, 1.5);

    if (c.conEstela && !reducirMovimiento) {
      ctx.fillStyle = sobreNieve
        ? `rgba(56, 189, 248, ${(alfa * 0.42).toFixed(2)})`
        : `rgba(186, 230, 253, ${(alfa * 0.36).toFixed(2)})`;
      ctx.fillRect(px - 3, py - 1, 3, 1);
    }
  }

  ctx.restore();
}

function dibujarCristalesGlaciaresCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  for (let i = 0; i < CRISTALES_GLACIARES_CUMBRE.length; i++) {
    const cr = CRISTALES_GLACIARES_CUMBRE[i];
    const pulso = reducirMovimiento
      ? 0.72
      : 0.6 + 0.4 * Math.sin(t * 0.0032 + cr.fase);

    // 1. Micro-resplandor azul sobre la nieve alrededor de la base
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    dibujarResplandorSprite(
      ctx,
      sprites.resplandorEspectral,
      cr.base.x,
      cr.base.y - 4,
      cr.radioBase * 1.08,
      cr.radioBase * 0.58,
      0.34 * pulso,
    );

    // 2. Pulso de energía interna a lo largo del eje del cristal
    const alfaEje = 0.14 + 0.18 * pulso;
    ctx.globalAlpha = alfaEje;
    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.moveTo(cr.punta.x, cr.punta.y + 5);
    ctx.lineTo(cr.punta.x + 4, cr.arista.y + 4);
    ctx.lineTo(cr.punta.x, cr.base.y - 8);
    ctx.lineTo(cr.punta.x - 4, cr.arista.y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Destellos en cruz pixelada en punta principal y puntas satélite
    const brilloPunta = reducirMovimiento
      ? i % 2 === 0
        ? 0.82
        : 0.32
      : Math.pow(Math.max(0, Math.sin(t * 0.0038 + cr.fase * 1.4)), 2.2);
    dibujarDestelloCruzPixel(ctx, cr.punta.x, cr.punta.y, 4.5, brilloPunta);

    for (let s = 0; s < cr.satelites.length; s++) {
      const sat = cr.satelites[s];
      const brilloSat = reducirMovimiento
        ? s === 0 && i === 0
          ? 0.6
          : 0
        : Math.pow(Math.max(0, Math.sin(t * 0.0044 + cr.fase + s * 2.1)), 3.0);
      dibujarDestelloCruzPixel(ctx, sat.x, sat.y, 3, brilloSat * 0.85);
    }

    // 4. Chispas de escarcha ascendentes muy finas
    if (!reducirMovimiento) {
      for (let k = 0; k < 3; k++) {
        const fc = (t * 0.00055 + k * 0.33 + cr.fase * 0.25) % 1;
        const cx = Math.round(cr.base.x + Math.sin(fc * 7 + k * 2.3 + cr.fase) * 11);
        const cy = Math.round(cr.base.y - 8 - fc * (cr.base.y - cr.punta.y + 6));
        const alfaChispa = Math.sin(fc * Math.PI) * 0.78;
        ctx.fillStyle = `rgba(224, 242, 254, ${alfaChispa.toFixed(2)})`;
        ctx.fillRect(cx, cy, 1.5, 1.5);
      }
    }
  }

  // Agujas cristalinas del acantilado izquierdo
  for (let a = 0; a < AGUJAS_ACANTILADO_CUMBRE.length; a++) {
    const aguja = AGUJAS_ACANTILADO_CUMBRE[a];
    const brillo = reducirMovimiento
      ? a === 0
        ? 0.45
        : 0
      : Math.pow(Math.max(0, Math.sin(t * 0.0034 + a * 2.4 + 0.8)), 3.2);
    dibujarDestelloCruzPixel(ctx, aguja.x, aguja.y, 3, brillo * 0.75);
  }
}

function dibujarEsqueletoDragonCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  const { fauces, cuencaOcular, costillasCentro, vertebras, basePatas } =
    ESQUELETO_DRAGON_CUMBRE;

  // 1. Bruma gélida cian-pálida reptando lentamente entre las costillas y la base del esqueleto
  ctx.save();
  for (let b = 0; b < 3; b++) {
    const fase = reducirMovimiento ? b * 0.31 : (t * 0.00018 + b * 0.34) % 1;
    const bx = costillasCentro.x - 24 + Math.sin(fase * Math.PI * 2 + b) * 14;
    const by = costillasCentro.y + 9 + b * 6.5;
    const alfaBruma = reducirMovimiento
      ? 0.24
      : 0.18 + 0.14 * Math.sin(t * 0.0016 + b * 2.1);
    dibujarResplandorSprite(ctx, sprites.brumaCian, bx, by, 24, 6.5, alfaBruma);
  }
  for (let p = 0; p < basePatas.length; p++) {
    const pata = basePatas[p];
    const alfa = reducirMovimiento ? 0.18 : 0.13 + 0.11 * Math.cos(t * 0.0014 + p * 2.3);
    dibujarResplandorSprite(ctx, sprites.brumaCian, pata.x, pata.y + 2, 17, 5.5, alfa);
  }

  // 2. Aliento helado exhalando lentamente desde las fauces hacia la izquierda sobre la nieve
  const cicloAliento = reducirMovimiento ? 0.34 : (t % 7200) / 7200;
  if (cicloAliento >= 0.06 && cicloAliento <= 0.72) {
    const faseExhalacion = (cicloAliento - 0.06) / 0.66;
    for (let j = 0; j < 4; j++) {
      const local = Math.max(0, Math.min(1, faseExhalacion * 1.28 - j * 0.15));
      if (local <= 0 || local >= 1) continue;
      const envolvente = Math.sin(local * Math.PI);
      const ax = fauces.x - 5 - local * 46;
      const ay = fauces.y + 2 + local * 5 + Math.sin(local * 5 + j) * 1.8;
      const rx = 8 + local * 14;
      const ry = 4 + local * 5;
      dibujarResplandorSprite(ctx, sprites.brumaCian, ax, ay, rx, ry, envolvente * 0.45);
      dibujarResplandorSprite(
        ctx,
        sprites.brumaFria,
        ax + 1,
        ay - 0.5,
        rx * 0.6,
        ry * 0.6,
        envolvente * 0.28,
      );

      if (j < 3) {
        ctx.globalAlpha = envolvente * 0.82;
        ctx.fillStyle = j === 0 ? "#7dd3fc" : "#f0f9ff";
        ctx.fillRect(Math.round(ax - 2), Math.round(ay - 1), 2, 1.5);
      }
    }
  }

  // 3. Pulso espectral glaciar sutil en la cuenca ocular y recorriendo la espina dorsal
  const cicloRuna = reducirMovimiento ? 0.28 : (t % 8400) / 8400;
  const pulsoOjo =
    cicloRuna < 0.6
      ? Math.sin((cicloRuna / 0.6) * Math.PI)
      : 0.16;

  dibujarResplandorSprite(
    ctx,
    sprites.resplandorEspectral,
    cuencaOcular.x,
    cuencaOcular.y,
    7.5,
    7.5,
    0.28 + pulsoOjo * 0.54,
  );
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.48 + pulsoOjo * 0.48;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(cuencaOcular.x - 1.5, cuencaOcular.y - 1.5, 3, 3);
  ctx.fillStyle = "#f0f9ff";
  ctx.fillRect(cuencaOcular.x - 0.5, cuencaOcular.y - 0.5, 1.5, 1.5);

  // Onda rúnica recorriendo suavemente las vértebras desde el cuello hacia la cola
  if (cicloRuna >= 0.1 && cicloRuna <= 0.82) {
    const posOnda = ((cicloRuna - 0.1) / 0.72) * (vertebras.length - 1);
    for (let v = 0; v < vertebras.length; v++) {
      const dist = Math.abs(v - posOnda);
      if (dist > 2.0) continue;
      const peso = 1 - dist / 2.0;
      const vert = vertebras[v];
      ctx.globalCompositeOperation = "source-over";
      dibujarResplandorSprite(
        ctx,
        sprites.resplandorEspectral,
        vert.x,
        vert.y,
        6.5,
        6.5,
        peso * 0.48,
      );
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = peso * 0.8;
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(Math.round(vert.x - 1), Math.round(vert.y - 1), 2.5, 2.5);
    }
  }
  ctx.restore();
}

function dibujarAcantiladosYEscarchaCumbre(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano | null | undefined,
  t: number,
  reducirMovimiento: boolean,
): void {
  // 1. Destellos especulares intermitentes sobre la cornisa helada y carámbanos
  for (let i = 0; i < DESTELLOS_CORNISA_CUMBRE.length; i++) {
    const pt = DESTELLOS_CORNISA_CUMBRE[i];
    const brillo = reducirMovimiento
      ? i % 4 === 0
        ? 0.45
        : 0
      : Math.pow(Math.max(0, Math.sin(t * 0.0029 + i * 1.85)), 4.0);
    dibujarDestelloCruzPixel(ctx, pt.x, pt.y, 2.5, brillo * 0.78);
  }

  // 2. Micro-fragmentos de escarcha cayendo desde el acantilado hacia el mar gélido
  if (reducirMovimiento) return;

  for (let f = 0; f < FRAGMENTOS_ESCARCHA_ACANTILADO.length; f++) {
    const origen = FRAGMENTOS_ESCARCHA_ACANTILADO[f];
    const progreso = (t * 0.00038 + f * 0.23) % 1;
    const fx = origen.x + Math.sin(progreso * 4 + f) * 1.5;
    const fy = origen.y + progreso * progreso * 24;

    // Verificar que el impacto final no caiga sobre tierra firme vecina (ZON-04)
    if (progreso > 0.45 && esTierraFirmeEnMascara(mascara, fx, fy)) continue;

    if (progreso < 0.88) {
      const alfa = Math.min(1, progreso * 4) * 0.78;
      ctx.fillStyle = `rgba(224, 242, 254, ${alfa.toFixed(2)})`;
      ctx.fillRect(Math.round(fx), Math.round(fy), 1.5, 2.5);
    } else {
      const onda = (progreso - 0.88) / 0.12;
      const alfaOnda = (1 - onda) * 0.55;
      ctx.fillStyle = `rgba(186, 230, 253, ${alfaOnda.toFixed(2)})`;
      ctx.fillRect(Math.round(fx - 2 - onda * 2), Math.round(fy), 4 + Math.round(onda * 4), 1);
    }
  }
}

function dibujarEstadoBloqueadoCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_CUMBRE);
  ctx.clip();

  // Neblina fría contenida sobre la meseta sin energía desbordada
  for (let m = 0; m < 4; m++) {
    const u = ((t * 0.00005 + m * 0.26) % 1);
    const mx = 805 + u * 435;
    const my = 128 + (m % 2) * 18;
    const fade = Math.sin(u * Math.PI);
    dibujarResplandorSprite(ctx, sprites.brumaCian, mx, my, 46, 11, 0.12 * fade);
  }

  // Viento tenue y escasos copos fríos contenidos
  const cantidad = reducirMovimiento ? 8 : 14;
  for (let i = 0; i < cantidad; i++) {
    const c = COPOS_LEJANOS[i];
    const rx = (c.xBase + t * c.velocidadX * 0.85 - 775) % 525;
    const ry = (c.yBase + t * c.velocidadY * 0.75 - 8) % 175;
    const px = Math.round(775 + (rx < 0 ? rx + 525 : rx));
    const py = Math.round(8 + (ry < 0 ? ry + 175 : ry));
    ctx.fillStyle = "rgba(186, 230, 253, 0.38)";
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  ctx.restore();
}

/**
 * Renderiza el diorama completo de ZON-06 ("La Cumbre") respetando el estado bloqueado vs. desbloqueado
 * y la preferencia de movimiento reducido.
 */
export function dibujarDioramaCumbre(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
  mascaraOceano?: MascaraOceano | null,
): void {
  const sprites = obtenerSpritesCumbre();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;

  if (!desbloqueada) {
    dibujarEstadoBloqueadoCumbre(ctx, sprites, t, reducirMovimiento);
    return;
  }

  dibujarAuroraBorealCumbre(ctx, sprites, t);
  dibujarVentiscaYPlumasCumbre(ctx, sprites, mascaraOceano, t, reducirMovimiento);
  dibujarCristalesGlaciaresCumbre(ctx, sprites, t, reducirMovimiento);
  dibujarEsqueletoDragonCumbre(ctx, sprites, t, reducirMovimiento);
  dibujarAcantiladosYEscarchaCumbre(ctx, mascaraOceano, t, reducirMovimiento);
}
