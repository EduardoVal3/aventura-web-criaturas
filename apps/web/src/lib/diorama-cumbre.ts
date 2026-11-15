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
  rayoPilar: HTMLCanvasElement;
  haloAuroraPolar: HTMLCanvasElement;
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

  // 2. Cortina de aurora principal: borde inferior menta-esmeralda luminoso hacia corona cian-violeta
  const cortinaEsmeralda = crearCanvasAuxiliar(20, 96);
  const eCtx = cortinaEsmeralda.getContext("2d");
  if (eCtx) {
    const gradV = eCtx.createLinearGradient(0, 0, 0, 96);
    gradV.addColorStop(0, "rgba(139, 92, 246, 0)");
    gradV.addColorStop(0.2, "rgba(139, 92, 246, 0.36)");
    gradV.addColorStop(0.48, "rgba(34, 211, 238, 0.72)");
    gradV.addColorStop(0.74, "rgba(52, 211, 153, 0.96)");
    gradV.addColorStop(0.86, "rgba(167, 243, 208, 1)");
    gradV.addColorStop(0.94, "rgba(52, 211, 153, 0.45)");
    gradV.addColorStop(1, "rgba(16, 185, 129, 0)");
    eCtx.fillStyle = gradV;
    eCtx.fillRect(1, 0, 18, 96);

    eCtx.globalCompositeOperation = "destination-in";
    const gradH = eCtx.createLinearGradient(0, 0, 20, 0);
    gradH.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradH.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradH.addColorStop(1, "rgba(255, 255, 255, 0)");
    eCtx.fillStyle = gradH;
    eCtx.fillRect(0, 0, 20, 96);
  }

  // 3. Cortina alta de aurora amatista-violeta -> borde inferior cian eléctrico
  const cortinaVioleta = crearCanvasAuxiliar(20, 96);
  const vCtx = cortinaVioleta.getContext("2d");
  if (vCtx) {
    const gradV = vCtx.createLinearGradient(0, 0, 0, 96);
    gradV.addColorStop(0, "rgba(168, 85, 247, 0)");
    gradV.addColorStop(0.22, "rgba(192, 132, 252, 0.84)");
    gradV.addColorStop(0.54, "rgba(129, 140, 248, 0.76)");
    gradV.addColorStop(0.78, "rgba(34, 211, 238, 0.94)");
    gradV.addColorStop(0.88, "rgba(165, 243, 252, 0.98)");
    gradV.addColorStop(0.95, "rgba(56, 189, 248, 0.38)");
    gradV.addColorStop(1, "rgba(56, 189, 248, 0)");
    vCtx.fillStyle = gradV;
    vCtx.fillRect(1, 0, 18, 96);

    vCtx.globalCompositeOperation = "destination-in";
    const gradH = vCtx.createLinearGradient(0, 0, 20, 0);
    gradH.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradH.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradH.addColorStop(1, "rgba(255, 255, 255, 0)");
    vCtx.fillStyle = gradH;
    vCtx.fillRect(0, 0, 20, 96);
  }

  // 3b. Pilar luminoso fino para estriaciones verticales nítidas de la aurora
  const rayoPilar = crearCanvasAuxiliar(8, 96);
  const rCtx = rayoPilar.getContext("2d");
  if (rCtx) {
    const gradV = rCtx.createLinearGradient(0, 0, 0, 96);
    gradV.addColorStop(0, "rgba(192, 132, 252, 0)");
    gradV.addColorStop(0.24, "rgba(192, 132, 252, 0.55)");
    gradV.addColorStop(0.58, "rgba(56, 189, 248, 0.8)");
    gradV.addColorStop(0.84, "rgba(209, 250, 229, 1)");
    gradV.addColorStop(0.95, "rgba(110, 231, 183, 0.4)");
    gradV.addColorStop(1, "rgba(52, 211, 153, 0)");
    rCtx.fillStyle = gradV;
    rCtx.fillRect(1, 0, 6, 96);

    rCtx.globalCompositeOperation = "destination-in";
    const gradH = rCtx.createLinearGradient(0, 0, 8, 0);
    gradH.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradH.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradH.addColorStop(1, "rgba(255, 255, 255, 0)");
    rCtx.fillStyle = gradH;
    rCtx.fillRect(0, 0, 8, 96);
  }

  // 3c. Halo atmosférico polar esmeralda-cian para bañar el cielo nocturno tras los picos
  const haloAuroraPolar = crearCanvasAuxiliar(128, 64);
  const hCtx = haloAuroraPolar.getContext("2d");
  if (hCtx) {
    hCtx.save();
    hCtx.scale(2, 1);
    const grad = hCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(52, 211, 153, 0.85)");
    grad.addColorStop(0.38, "rgba(34, 211, 238, 0.52)");
    grad.addColorStop(0.72, "rgba(139, 92, 246, 0.2)");
    grad.addColorStop(1, "rgba(15, 23, 42, 0)");
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 64, 64);
    hCtx.restore();
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
    rayoPilar,
    haloAuroraPolar,
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

interface EstrellaPolar {
  x: number;
  y: number;
  tamano: number;
  fase: number;
  violeta: boolean;
}

const ESTRELLAS_POLARES_CUMBRE: readonly EstrellaPolar[] = Array.from({ length: 18 }, (_, i) => ({
  x: 752 + ((i * 79 + 23) % 586),
  y: -18 + ((i * 31 + 7) % 78),
  tamano: i % 5 === 0 ? 1.5 : 1,
  fase: i * 1.37,
  violeta: i % 4 === 0,
}));

function dibujarEstrellasPolaresCumbre(
  ctx: CanvasRenderingContext2D,
  t: number,
  reducirMovimiento: boolean,
): void {
  for (let i = 0; i < ESTRELLAS_POLARES_CUMBRE.length; i++) {
    const est = ESTRELLAS_POLARES_CUMBRE[i];
    const destello = reducirMovimiento
      ? 0.45 + (i % 3) * 0.15
      : 0.25 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 0.0022 + est.fase)), 2);
    ctx.globalAlpha = destello;
    ctx.fillStyle = est.violeta ? "#e9d5ff" : "#e0f2fe";
    ctx.fillRect(Math.round(est.x), Math.round(est.y), est.tamano, est.tamano);
  }
}

function dibujarAuroraBorealCumbre(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // 1. Baño atmosférico polar sobre el cielo nocturno y reflejo leve en aguas flanqueantes
  const pulsoPolar = 0.22 + Math.sin(t * 0.0011) * 0.05;
  dibujarResplandorSprite(ctx, sprites.haloAuroraPolar, 955, 22, 190, 56, pulsoPolar);
  dibujarResplandorSprite(ctx, sprites.haloAuroraPolar, 1175, 24, 185, 54, pulsoPolar * 0.92);
  dibujarEstrellasPolaresCumbre(ctx, t, reducirMovimiento);

  // 2. Cortina Profunda (alta altitud, violeta amatista -> cian, inclinación magnética orgánica)
  const colsProf = 46;
  for (let i = 0; i < colsProf; i++) {
    const u = i / (colsProf - 1);
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.62);
    const x = 744 + u * 602;
    const onda =
      Math.sin(u * 4.8 - t * 0.001) * 11 +
      Math.cos(u * 8.4 + t * 0.0015) * 4.5;
    const yInferior = 66 - envolvente * 32 + onda * 0.72;
    const altoCol = 74 + Math.sin(u * 6.5 + t * 0.0014) * 16;
    const ondaViajera = 0.52 + 0.48 * Math.sin(u * 10.5 - t * 0.0019 + i * 0.25);
    const alfa = envolvente * (0.14 + ondaViajera * 0.18);
    const inclinacion = (u - 0.5) * 0.16;

    ctx.save();
    ctx.translate(x, yInferior);
    ctx.transform(1, 0, inclinacion, 1, 0, 0);
    ctx.globalAlpha = alfa;
    ctx.drawImage(sprites.cortinaVioleta, -11, -altoCol * 0.88, 22, altoCol);
    ctx.restore();
  }

  // 3. Cortina Principal Plegada en "S" (borde inferior menta-esmeralda luminoso + corona violeta)
  const colsPrinc = 56;
  for (let i = 0; i < colsPrinc; i++) {
    const u = i / (colsPrinc - 1);
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.66);
    // Desplazamiento horizontal sutil del pliegue en S para sensación de tela flotante
    const pliegueX = Math.sin(u * 7.0 - t * 0.0013) * 8;
    const x = 764 + u * 558 + pliegueX;
    const onda =
      Math.sin(u * 6.8 - t * 0.0016) * 13 +
      Math.cos(u * 12.2 + t * 0.0022) * 5.5;
    const yInferior = 62 - envolvente * 28 + onda * 0.76;
    const altoCol = 62 + Math.sin(u * 9.2 + t * 0.002) * 15;
    const ondaViajera = 0.48 + 0.52 * Math.sin(u * 14.0 - t * 0.0028);
    const alfa = envolvente * (0.2 + ondaViajera * 0.28);
    const inclinacion = (u - 0.5) * 0.14 - 0.04;

    ctx.save();
    ctx.translate(x, yInferior);
    ctx.transform(1, 0, inclinacion, 1, 0, 0);
    ctx.globalAlpha = alfa;
    ctx.drawImage(sprites.cortinaEsmeralda, -10, -altoCol * 0.88, 20, altoCol);

    // Borde inferior luminoso reforzado donde el pliegue gira
    if (ondaViajera > 0.62) {
      ctx.globalAlpha = envolvente * (ondaViajera - 0.62) * 0.85;
      ctx.drawImage(sprites.rayoPilar, -5, -altoCol * 0.92, 10, altoCol * 0.92);
    }
    ctx.restore();
  }

  // 4. Cortina Frontal Danzante (cian eléctrico -> violeta en contrafase sobre valles laterales)
  const colsFront = 38;
  for (let i = 0; i < colsFront; i++) {
    const u = i / (colsFront - 1);
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.72);
    const x = 815 + u * 462 + Math.cos(u * 6.0 + t * 0.0017) * 6;
    const onda =
      Math.cos(u * 5.8 + t * 0.0019) * 11 +
      Math.sin(u * 10.6 - t * 0.0025) * 4;
    const yInferior = 52 - envolvente * 22 + onda * 0.68;
    const altoCol = 48 + Math.cos(u * 8.1 - t * 0.0023) * 12;
    const ondaViajera = 0.45 + 0.55 * Math.cos(u * 12.6 + t * 0.0031);
    const alfa = envolvente * (0.14 + ondaViajera * 0.22);
    const inclinacion = (u - 0.5) * 0.12 + 0.03;

    ctx.save();
    ctx.translate(x, yInferior);
    ctx.transform(1, 0, inclinacion, 1, 0, 0);
    ctx.globalAlpha = alfa;
    ctx.drawImage(
      i % 2 === 0 ? sprites.cortinaEsmeralda : sprites.cortinaVioleta,
      -9,
      -altoCol * 0.88,
      18,
      altoCol,
    );
    ctx.restore();
  }

  // 5. Pilares luminosos viajeros (rayos de luz nítidos danzando en racimos orgánicos)
  for (let p = 0; p < 22; p++) {
    const uBase = (p * 0.6180339) % 1;
    const u = (uBase + (reducirMovimiento ? 0 : t * 0.000018)) % 1;
    const envolvente = Math.pow(Math.sin(u * Math.PI), 0.75);
    const x = 782 + u * 524;
    const onda = Math.sin(u * 6.8 - t * 0.0016) * 11;
    const yInferior = 58 - envolvente * 26 + onda * 0.72;
    const altoPilar = 46 + (p % 4) * 12 + Math.sin(t * 0.0027 + p * 1.4) * 8;
    const pulsoPilar = Math.pow(Math.max(0, Math.sin(u * 13.5 - t * 0.0032 + p * 0.7)), 1.6);
    const alfa = envolvente * (0.12 + pulsoPilar * 0.36);

    ctx.save();
    ctx.translate(x, yInferior);
    ctx.transform(1, 0, (u - 0.5) * 0.15, 1, 0, 0);
    ctx.globalAlpha = alfa;
    ctx.drawImage(sprites.rayoPilar, -4, -altoPilar * 0.9, 8, altoPilar);
    ctx.restore();
  }

  // 6. Reflejo polar tenue sobre el mar abierto flanqueando la isla al oeste y este
  dibujarResplandorSprite(ctx, sprites.haloAuroraPolar, 742, 178, 42, 12, 0.085);
  dibujarResplandorSprite(ctx, sprites.haloAuroraPolar, 1325, 186, 42, 12, 0.075);

  ctx.restore();
}

/**
 * Baño frontal sutil de luz polar sobre las crestas nevadas y polvo luminoso de aurora,
 * conectando la aurora del cielo trasero con las cumbres en primer plano.
 */
function dibujarReflejoAuroraEnCumbres(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCumbreCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_CUMBRE);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";

  // Halo sutil besando las crestas superiores de la cordillera
  const pulsoCresta = 0.095 + Math.sin(t * 0.0015) * 0.03;
  dibujarResplandorSprite(ctx, sprites.haloAuroraPolar, 1068, 28, 165, 32, pulsoCresta);

  // Motas luminosas flotantes de la aurora (esmeralda, cian y violeta tenue)
  const limiteMotas = reducirMovimiento ? 8 : 14;
  for (let m = 0; m < limiteMotas; m++) {
    const u = (m * 0.6180339) % 1;
    const mx = Math.round(792 + u * 492 + Math.sin(t * 0.0009 + m * 1.7) * 9);
    const my = Math.round(8 + (m % 5) * 11 + Math.cos(t * 0.0011 + m * 2.1) * 4);
    const brillo = reducirMovimiento
      ? 0.42
      : 0.25 + 0.55 * Math.pow(Math.max(0, Math.sin(t * 0.0026 + m * 1.4)), 2);
    ctx.globalAlpha = brillo;
    ctx.fillStyle = m % 3 === 0 ? "#d8b4fe" : m % 2 === 0 ? "#6ee7b7" : "#67e8f9";
    ctx.fillRect(mx, my, 1.5, 1.5);
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
 * Renderiza únicamente la aurora boreal en el cielo nocturno detrás de la silueta WebP de ZON-06,
 * permitiendo que los picos nevados y los cristales glaciares se recorten con nitidez delante de ella.
 */
export function dibujarCieloAuroraCumbre(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  if (!desbloqueada) return;
  const sprites = obtenerSpritesCumbre();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;
  dibujarAuroraBorealCumbre(ctx, sprites, t, reducirMovimiento);
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
  auroraDetrasDibujada = false,
): void {
  const sprites = obtenerSpritesCumbre();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;

  if (!desbloqueada) {
    dibujarEstadoBloqueadoCumbre(ctx, sprites, t, reducirMovimiento);
    return;
  }

  if (!auroraDetrasDibujada) {
    dibujarAuroraBorealCumbre(ctx, sprites, t, reducirMovimiento);
  }
  dibujarReflejoAuroraEnCumbres(ctx, sprites, t, reducirMovimiento);
  dibujarVentiscaYPlumasCumbre(ctx, sprites, mascaraOceano, t, reducirMovimiento);
  dibujarCristalesGlaciaresCumbre(ctx, sprites, t, reducirMovimiento);
  dibujarEsqueletoDragonCumbre(ctx, sprites, t, reducirMovimiento);
  dibujarAcantiladosYEscarchaCumbre(ctx, mascaraOceano, t, reducirMovimiento);
}
