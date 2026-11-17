/**
 * Diorama vivo animado a 60 FPS para "Paso de los Riscos" (ZON-04) en el mapa de Aethelgard (espacio lógico 1616x897).
 * Todas las coordenadas fueron medidas píxel a píxel sobre apps/web/public/assets/mapa-mundo-aethelgard.webp:
 * envolvente exterior sin invadir LOC-03, ZON-06, ZON-05 ni LOC-02; dos fumarolas superiores tras las agujas;
 * los tres arcos góticos en ruinas azotados por corrientes de viento del paso; fisuras tectónicas sinuosas con
 * respiración subterránea de izquierda a derecha; cascada ígnea en el acantilado sureste y poza basal; y
 * micro-vida geológica (desprendimientos de gravilla y polvo rasante en el sendero).
 * Utiliza sprites fuera de pantalla cacheados una sola vez y búferes estáticos para sostener 60 FPS sin basura en memoria.
 */
import type { Punto2D } from "./mapa-dioramas.ts";
import type { MascaraOceano } from "./oceano-vivo.ts";

export interface FumarolaRiscos {
  id: string;
  respiradero: Punto2D;
  radioPlumaX: number;
  radioPlumaY: number;
  limiteSuperiorY: number;
  fase: number;
}

export interface ArcoRuinaRiscos {
  id: string;
  pilarIzqBase: Punto2D;
  pilarDerBase: Punto2D;
  vanoCentro: Punto2D;
  clave: Punto2D;
  anchoVano: number;
  altoVano: number;
  fase: number;
  runasPilares: readonly Punto2D[];
}

export interface FisuraTectonicaRiscos {
  id: string;
  trazo: readonly Punto2D[];
  anchoBase: number;
  intensidad: number;
  fase: number;
  junturaChispa: Punto2D | null;
}

export interface CascadaIgneaRiscos {
  labio: Punto2D;
  poza: Punto2D;
  radioPozaX: number;
  radioPozaY: number;
  trayecto: readonly Punto2D[];
}

export interface DesprendimientoAcantiladoRiscos {
  id: string;
  origen: Punto2D;
  finY: number;
  derivaX: number;
  periodoMs: number;
  fase: number;
}

/**
 * Envolvente exterior calibrada píxel a píxel alrededor de ZON-04 (x: 746..1170, y: 198..470),
 * respetando LOC-03 al noroeste, ZON-06 al norte, ZON-05 al este y los puentes de LOC-02 / ZON-03 al sur.
 */
export const SILUETA_ENVOLVENTE_RISCOS: readonly Punto2D[] = [
  { x: 754, y: 296 },
  { x: 780, y: 282 },
  { x: 810, y: 268 },
  { x: 834, y: 242 },
  { x: 852, y: 232 },
  { x: 882, y: 256 },
  { x: 922, y: 240 },
  { x: 945, y: 244 },
  { x: 964, y: 224 },
  { x: 984, y: 198 },
  { x: 998, y: 204 },
  { x: 1018, y: 228 },
  { x: 1046, y: 246 },
  { x: 1084, y: 260 },
  { x: 1114, y: 260 },
  { x: 1126, y: 254 },
  { x: 1152, y: 286 },
  { x: 1168, y: 318 },
  { x: 1168, y: 338 },
  { x: 1156, y: 356 },
  { x: 1162, y: 382 },
  { x: 1158, y: 406 },
  { x: 1142, y: 426 },
  { x: 1116, y: 444 },
  { x: 1084, y: 460 },
  { x: 1054, y: 468 },
  { x: 1024, y: 470 },
  { x: 996, y: 470 },
  { x: 970, y: 465 },
  { x: 950, y: 454 },
  { x: 932, y: 440 },
  { x: 912, y: 428 },
  { x: 900, y: 402 },
  { x: 886, y: 372 },
  { x: 860, y: 366 },
  { x: 832, y: 374 },
  { x: 806, y: 386 },
  { x: 780, y: 386 },
  { x: 756, y: 370 },
  { x: 746, y: 344 },
  { x: 746, y: 318 },
];

/**
 * Las dos fumarolas sulfurosas superiores tras las crestas oscuras de ZON-04,
 * calibradas con límites superiores estrictos para no rozar el hielo sur de ZON-06.
 */
export const FUMAROLAS_RISCOS: readonly FumarolaRiscos[] = [
  {
    id: "fumarola-oeste",
    respiradero: { x: 905, y: 254 },
    radioPlumaX: 56,
    radioPlumaY: 28,
    limiteSuperiorY: 208,
    fase: 0.2,
  },
  {
    id: "fumarola-este",
    respiradero: { x: 1072, y: 274 },
    radioPlumaX: 58,
    radioPlumaY: 28,
    limiteSuperiorY: 230,
    fase: 2.3,
  },
];

/**
 * Los tres arcos góticos en ruinas de la explanada central de Paso de los Riscos.
 */
export const ARCOS_RUINAS_RISCOS: readonly ArcoRuinaRiscos[] = [
  {
    id: "arco-oeste",
    pilarIzqBase: { x: 885, y: 342 },
    pilarDerBase: { x: 915, y: 335 },
    vanoCentro: { x: 900, y: 312 },
    clave: { x: 902, y: 286 },
    anchoVano: 22,
    altoVano: 52,
    fase: 0.0,
    runasPilares: [
      { x: 887, y: 318 },
      { x: 913, y: 312 },
    ],
  },
  {
    id: "arco-central",
    pilarIzqBase: { x: 928, y: 326 },
    pilarDerBase: { x: 956, y: 314 },
    vanoCentro: { x: 943, y: 298 },
    clave: { x: 944, y: 274 },
    anchoVano: 18,
    altoVano: 46,
    fase: 1.7,
    runasPilares: [
      { x: 930, y: 304 },
      { x: 954, y: 296 },
    ],
  },
  {
    id: "arco-este",
    pilarIzqBase: { x: 1038, y: 342 },
    pilarDerBase: { x: 1068, y: 345 },
    vanoCentro: { x: 1053, y: 320 },
    clave: { x: 1053, y: 296 },
    anchoVano: 20,
    altoVano: 46,
    fase: 3.4,
    runasPilares: [
      { x: 1040, y: 322 },
      { x: 1066, y: 326 },
    ],
  },
];

/**
 * Venas y fisuras tectónicas reales medidas píxel a píxel sobre las grietas de la meseta, crestas y acantilados,
 * respetando intacta la calzada del puente suroeste hacia LOC-02.
 */
export const FISURAS_TECTONICAS_RISCOS: readonly FisuraTectonicaRiscos[] = [
  {
    id: "fisura-pico-central",
    trazo: [
      { x: 1000, y: 233 },
      { x: 1000, y: 245 },
      { x: 1006, y: 255 },
      { x: 1013, y: 268 },
    ],
    anchoBase: 1.8,
    intensidad: 0.8,
    fase: 0.4,
    junturaChispa: { x: 1000, y: 242 },
  },
  {
    id: "fisura-fumarola-oeste",
    trazo: [
      { x: 900, y: 249 },
      { x: 905, y: 255 },
      { x: 912, y: 247 },
    ],
    anchoBase: 1.9,
    intensidad: 0.82,
    fase: 0.0,
    junturaChispa: { x: 905, y: 255 },
  },
  {
    id: "fisura-fumarola-este",
    trazo: [
      { x: 1064, y: 270 },
      { x: 1072, y: 277 },
      { x: 1079, y: 270 },
    ],
    anchoBase: 2.0,
    intensidad: 0.84,
    fase: 2.0,
    junturaChispa: { x: 1072, y: 276 },
  },
  {
    id: "fisura-explanada-oeste",
    trazo: [
      { x: 875, y: 349 },
      { x: 886, y: 351 },
      { x: 896, y: 348 },
      { x: 904, y: 352 },
      { x: 912, y: 348 },
    ],
    anchoBase: 1.8,
    intensidad: 0.78,
    fase: 0.8,
    junturaChispa: { x: 904, y: 352 },
  },
  {
    id: "fisura-explanada-este",
    trazo: [
      { x: 996, y: 331 },
      { x: 1006, y: 333 },
      { x: 1016, y: 341 },
      { x: 1024, y: 348 },
      { x: 1034, y: 350 },
      { x: 1044, y: 356 },
      { x: 1055, y: 368 },
      { x: 1065, y: 378 },
      { x: 1070, y: 386 },
    ],
    anchoBase: 2.2,
    intensidad: 0.88,
    fase: 1.6,
    junturaChispa: { x: 1024, y: 348 },
  },
  {
    id: "fisura-arco-este",
    trazo: [
      { x: 1020, y: 340 },
      { x: 1026, y: 332 },
      { x: 1035, y: 326 },
    ],
    anchoBase: 1.5,
    intensidad: 0.68,
    fase: 2.6,
    junturaChispa: null,
  },
  {
    id: "fisura-acantilado-oeste",
    trazo: [
      { x: 778, y: 360 },
      { x: 786, y: 367 },
      { x: 794, y: 372 },
      { x: 806, y: 370 },
      { x: 815, y: 364 },
    ],
    anchoBase: 1.7,
    intensidad: 0.72,
    fase: 0.5,
    junturaChispa: null,
  },
  {
    id: "fisura-acantilado-centro-sup",
    trazo: [
      { x: 940, y: 426 },
      { x: 950, y: 434 },
      { x: 958, y: 424 },
      { x: 962, y: 412 },
      { x: 968, y: 405 },
    ],
    anchoBase: 1.6,
    intensidad: 0.72,
    fase: 1.3,
    junturaChispa: null,
  },
  {
    id: "fisura-acantilado-centro-inf",
    trazo: [
      { x: 974, y: 430 },
      { x: 980, y: 422 },
      { x: 988, y: 432 },
      { x: 994, y: 444 },
      { x: 1002, y: 456 },
      { x: 1014, y: 464 },
      { x: 1028, y: 462 },
      { x: 1038, y: 454 },
      { x: 1048, y: 448 },
    ],
    anchoBase: 1.7,
    intensidad: 0.76,
    fase: 2.1,
    junturaChispa: { x: 994, y: 444 },
  },
  {
    id: "fisura-acantilado-mid-der",
    trazo: [
      { x: 1012, y: 438 },
      { x: 1024, y: 436 },
      { x: 1030, y: 444 },
    ],
    anchoBase: 1.5,
    intensidad: 0.68,
    fase: 2.8,
    junturaChispa: null,
  },
  {
    id: "fisura-acantilado-este",
    trazo: [
      { x: 1084, y: 444 },
      { x: 1094, y: 438 },
      { x: 1106, y: 434 },
    ],
    anchoBase: 1.6,
    intensidad: 0.72,
    fase: 3.1,
    junturaChispa: null,
  },
];

/**
 * Cascada estrecha de magma viscoso en el acantilado sureste y su poza basal en la roca.
 */
export const CASCADA_IGNEA_RISCOS: CascadaIgneaRiscos = {
  labio: { x: 1070, y: 386 },
  poza: { x: 1072, y: 443 },
  radioPozaX: 11,
  radioPozaY: 4.5,
  trayecto: [
    { x: 1070, y: 386 },
    { x: 1072, y: 400 },
    { x: 1072, y: 416 },
    { x: 1071, y: 430 },
    { x: 1072, y: 442 },
  ],
};

/**
 * Desprendimientos diminutos de gravilla y polvo seco en acantilados verticales frontales,
 * apartados de la calzada del puente hacia LOC-02 y del puente morado hacia ZON-05.
 */
export const DESPRENDIMIENTOS_RISCOS: readonly DesprendimientoAcantiladoRiscos[] = [
  { id: "gravilla-oeste", origen: { x: 766, y: 328 }, finY: 368, derivaX: -2, periodoMs: 4900, fase: 0.1 },
  { id: "gravilla-centro-izq", origen: { x: 916, y: 378 }, finY: 422, derivaX: 2.5, periodoMs: 5600, fase: 1.8 },
  { id: "gravilla-centro", origen: { x: 960, y: 384 }, finY: 432, derivaX: -1.5, periodoMs: 6300, fase: 3.2 },
  { id: "gravilla-este", origen: { x: 1094, y: 392 }, finY: 432, derivaX: 1.5, periodoMs: 5200, fase: 4.5 },
];

/**
 * Puntos guía del sendero de grava que une el puente de LOC-02 con el puente hacia ZON-05.
 */
export const RACHAS_POLVO_SENDERO_RISCOS: readonly Punto2D[] = [
  { x: 896, y: 356 },
  { x: 938, y: 352 },
  { x: 984, y: 344 },
  { x: 1024, y: 336 },
  { x: 1076, y: 348 },
  { x: 1114, y: 352 },
];

interface CenizaMineralRisco {
  xBase: number;
  yBase: number;
  velocidadX: number;
  velocidadY: number;
  amplitud: number;
  fase: number;
  tamano: number;
}

const CENIZA_MINERAL_RISCOS: readonly CenizaMineralRisco[] = Array.from({ length: 18 }, (_, i) => ({
  xBase: 790 + ((i * 59 + 13) % 340),
  yBase: 238 + ((i * 41 + 19) % 190),
  velocidadX: 0.011 + (i % 4) * 0.0025,
  velocidadY: 0.0045 + (i % 3) * 0.0018,
  amplitud: 3.5 + (i % 4) * 1.4,
  fase: i * 1.07,
  tamano: i % 3 === 0 ? 2 : 1.5,
}));

interface SpritesRiscosCache {
  haloRescoldo: HTMLCanvasElement;
  haloMagmaNucleo: HTMLCanvasElement;
  humoSulfuroso: HTMLCanvasElement;
  neblinaAltura: HTMLCanvasElement;
  haloRunaAntigua: HTMLCanvasElement;
  polvoRoca: HTMLCanvasElement;
}

let spritesRiscosCache: SpritesRiscosCache | null = null;

// Búferes estáticos reutilizados por cuadro para evitar basura en el recolector
const fisuraBufferX = new Float32Array(18);
const fisuraBufferY = new Float32Array(18);
const vientoBufferX = new Float32Array(10);
const vientoBufferY = new Float32Array(10);
const cascadaBufferX = new Float32Array(14);
const cascadaBufferY = new Float32Array(14);

function crearCanvasAuxiliar(ancho: number, alto: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  return canvas;
}

function obtenerSpritesRiscos(): SpritesRiscosCache | null {
  if (typeof document === "undefined") return null;
  if (spritesRiscosCache) return spritesRiscosCache;

  // 1. Resplandor térmico contenido en terracota/ámbar oscuro (más sobrio que Cueva Umbría)
  const haloRescoldo = crearCanvasAuxiliar(128, 64);
  const rCtx = haloRescoldo.getContext("2d");
  if (rCtx) {
    rCtx.save();
    rCtx.scale(2, 1);
    const grad = rCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(217, 119, 6, 0.78)");
    grad.addColorStop(0.38, "rgba(180, 83, 9, 0.46)");
    grad.addColorStop(0.72, "rgba(124, 45, 18, 0.18)");
    grad.addColorStop(1, "rgba(69, 10, 10, 0)");
    rCtx.fillStyle = grad;
    rCtx.fillRect(0, 0, 64, 64);
    rCtx.restore();
  }

  // 2. Núcleo cálido ámbar-oro para crestas de fisura y cascada ígnea
  const haloMagmaNucleo = crearCanvasAuxiliar(64, 64);
  const mCtx = haloMagmaNucleo.getContext("2d");
  if (mCtx) {
    const grad = mCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(254, 240, 138, 0.94)");
    grad.addColorStop(0.32, "rgba(245, 158, 11, 0.72)");
    grad.addColorStop(0.66, "rgba(194, 65, 12, 0.28)");
    grad.addColorStop(1, "rgba(124, 45, 18, 0)");
    mCtx.fillStyle = grad;
    mCtx.fillRect(0, 0, 64, 64);
  }

  // 3. Penacho de humo sulfuroso ocre-pardo fiel al arte original de Riscos
  const humoSulfuroso = crearCanvasAuxiliar(64, 48);
  const hsCtx = humoSulfuroso.getContext("2d");
  if (hsCtx) {
    hsCtx.save();
    hsCtx.scale(1.333, 1);
    const grad = hsCtx.createRadialGradient(24, 24, 2, 24, 24, 23);
    grad.addColorStop(0, "rgba(146, 118, 86, 0.8)");
    grad.addColorStop(0.45, "rgba(108, 92, 78, 0.5)");
    grad.addColorStop(0.78, "rgba(68, 60, 56, 0.2)");
    grad.addColorStop(1, "rgba(28, 25, 23, 0)");
    hsCtx.fillStyle = grad;
    hsCtx.fillRect(0, 0, 48, 48);
    hsCtx.restore();
  }

  // 4. Neblina fría de altura para crestas y corrientes del desfiladero
  const neblinaAltura = crearCanvasAuxiliar(64, 48);
  const naCtx = neblinaAltura.getContext("2d");
  if (naCtx) {
    naCtx.save();
    naCtx.scale(1.333, 1);
    const grad = naCtx.createRadialGradient(24, 24, 2, 24, 24, 23);
    grad.addColorStop(0, "rgba(148, 163, 184, 0.62)");
    grad.addColorStop(0.48, "rgba(100, 116, 139, 0.36)");
    grad.addColorStop(0.82, "rgba(51, 65, 85, 0.14)");
    grad.addColorStop(1, "rgba(15, 23, 42, 0)");
    naCtx.fillStyle = grad;
    naCtx.fillRect(0, 0, 48, 48);
    naCtx.restore();
  }

  // 5. Brillo tenue de runas desgastadas y polvo iluminado bajo los arcos antiguos
  const haloRunaAntigua = crearCanvasAuxiliar(48, 48);
  const raCtx = haloRunaAntigua.getContext("2d");
  if (raCtx) {
    const grad = raCtx.createRadialGradient(24, 24, 1, 24, 24, 22);
    grad.addColorStop(0, "rgba(253, 230, 138, 0.88)");
    grad.addColorStop(0.36, "rgba(217, 119, 6, 0.44)");
    grad.addColorStop(0.76, "rgba(146, 64, 14, 0.14)");
    grad.addColorStop(1, "rgba(69, 26, 3, 0)");
    raCtx.fillStyle = grad;
    raCtx.fillRect(0, 0, 48, 48);
  }

  // 6. Nube seca de polvo mineral para desprendimientos de gravilla y rachas en el sendero
  const polvoRoca = crearCanvasAuxiliar(48, 32);
  const prCtx = polvoRoca.getContext("2d");
  if (prCtx) {
    prCtx.save();
    prCtx.scale(1.5, 1);
    const grad = prCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(180, 168, 156, 0.7)");
    grad.addColorStop(0.48, "rgba(130, 120, 112, 0.38)");
    grad.addColorStop(0.82, "rgba(87, 83, 78, 0.12)");
    grad.addColorStop(1, "rgba(41, 37, 36, 0)");
    prCtx.fillStyle = grad;
    prCtx.fillRect(0, 0, 32, 32);
    prCtx.restore();
  }

  spritesRiscosCache = {
    haloRescoldo,
    haloMagmaNucleo,
    humoSulfuroso,
    neblinaAltura,
    haloRunaAntigua,
    polvoRoca,
  };
  return spritesRiscosCache;
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

function dibujarSpriteCentrado(
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

function esTierraFirmeEnMascara(
  mascara: MascaraOceano | null | undefined,
  lx: number,
  ly: number,
): boolean {
  if (!mascara) return true;
  const gx = Math.floor(lx * mascara.escala);
  const gy = Math.floor(ly * mascara.escala);
  if (gx < 0 || gx >= mascara.ancho || gy < 0 || gy >= mascara.alto) return false;
  return mascara.distanciaSinPuentes[gy * mascara.ancho + gx] === 0;
}

function muestrearPolilinea(
  puntos: readonly Punto2D[],
  u: number,
  salida: Punto2D,
): void {
  const totalTramos = puntos.length - 1;
  if (totalTramos <= 0) {
    salida.x = puntos[0]?.x ?? 0;
    salida.y = puntos[0]?.y ?? 0;
    return;
  }
  const escalado = Math.max(0, Math.min(0.9999, u)) * totalTramos;
  const idx = Math.floor(escalado);
  const frac = escalado - idx;
  const a = puntos[idx];
  const b = puntos[idx + 1];
  salida.x = a.x + (b.x - a.x) * frac;
  salida.y = a.y + (b.y - a.y) * frac;
}

/**
 * 1. Atmósfera trasera tras los dientes rocosos superiores (invocada antes del WebP maestro):
 * resplandor térmico contenido en terracota/ámbar profundo y penachos volumétricos de humo sulfuroso
 * con neblina de altura disipándose al noreste sin invadir ZON-06 ni ZON-05.
 */
function dibujarAtmosferaTraseraRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();

  // Resplandor térmico apagado y contenido detrás de ambas fumarolas y aguja central
  ctx.globalCompositeOperation = "lighter";
  const pulsoOeste = 0.22 + Math.sin(t * 0.0014) * 0.05;
  const pulsoEste = 0.24 + Math.cos(t * 0.0013 + 1.2) * 0.05;
  dibujarSpriteCentrado(ctx, sprites.haloRescoldo, 904, 248, 56, 26, pulsoOeste);
  dibujarSpriteCentrado(ctx, sprites.haloRescoldo, 1068, 260, 60, 28, pulsoEste);
  dibujarSpriteCentrado(ctx, sprites.haloRescoldo, 996, 232, 38, 18, 0.14 + Math.sin(t * 0.0011) * 0.03);

  // Penachos sulfurosos pardo-cálidos y neblina grisácea de altura detrás de los picos
  ctx.globalCompositeOperation = "source-over";
  const capasPorFumarola = reducirMovimiento ? 3 : 6;
  for (let f = 0; f < FUMAROLAS_RISCOS.length; f++) {
    const fum = FUMAROLAS_RISCOS[f];
    for (let k = 0; k < capasPorFumarola; k++) {
      const progreso = (t * 0.00012 + k / capasPorFumarola + fum.fase * 0.2) % 1;
      const env = Math.sin(progreso * Math.PI);
      const derivaNoreste = progreso * 24;
      const vaiven = Math.sin(progreso * 4.2 + k * 1.7 + fum.fase) * 7;
      const px = fum.respiradero.x - 10 + derivaNoreste + vaiven;
      const py = Math.max(fum.limiteSuperiorY, fum.respiradero.y - 12 - progreso * 40);
      const rx = 20 + progreso * (fum.radioPlumaX * 0.44);
      const ry = 11 + progreso * (fum.radioPlumaY * 0.4);

      // Penacho ocre-pardo sulfuroso cerca del foco y neblina gris-pizarra al ascender
      dibujarSpriteCentrado(
        ctx,
        sprites.humoSulfuroso,
        px,
        py,
        rx,
        ry,
        env * (0.64 - progreso * 0.16),
      );
      if (progreso > 0.22) {
        dibujarSpriteCentrado(
          ctx,
          sprites.neblinaAltura,
          px + 6,
          Math.max(fum.limiteSuperiorY, py - 6),
          rx * 0.94,
          ry * 0.8,
          env * 0.48,
        );
      }
    }
  }

  ctx.restore();
}

/**
 * 2. Los Tres Arcos de Ruinas Antiguas (elemento protagonista):
 * filetes finos de viento cortante y polvo mineral serpenteando por los 3 vanos,
 * motas suspendidas bajo los arcos captando la luz cálida y parpadeo sutil de runas en los pilares.
 */
function dibujarArcosVivosRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const pasosViento = 9;
  const cintasPorArco = reducirMovimiento ? 2 : 3;

  for (let a = 0; a < ARCOS_RUINAS_RISCOS.length; a++) {
    const arco = ARCOS_RUINAS_RISCOS[a];

    // A. Corrientes de viento cortante atravesando el vano de cada arco (WSW -> ENE)
    for (let c = 0; c < cintasPorArco; c++) {
      const ciclo = (t * 0.00055 + c * 0.333 + arco.fase * 0.17) % 1;
      const env = Math.sin(ciclo * Math.PI);
      if (env <= 0.05) continue;

      const despX = (ciclo - 0.5) * 26;
      const baseY = arco.vanoCentro.y - 10 + c * 9;
      const semiancho = arco.anchoVano * 0.85;

      for (let s = 0; s < pasosViento; s++) {
        const u = s / (pasosViento - 1);
        const lx = arco.vanoCentro.x - semiancho + u * semiancho * 2 + despX;
        const onda = Math.sin(u * Math.PI * 1.6 - t * 0.0055 + c * 2.1 + arco.fase);
        vientoBufferX[s] = lx;
        vientoBufferY[s] = baseY - u * 4.5 + onda * 2.4;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = env * (c % 2 === 0 ? 0.34 : 0.24);
      ctx.strokeStyle = c % 2 === 0 ? "#cbd5e1" : "#d6c7a9";
      ctx.lineWidth = c === 0 ? 1.25 : 0.95;
      ctx.beginPath();
      ctx.moveTo(vientoBufferX[0], vientoBufferY[0]);
      for (let s = 1; s < pasosViento; s++) {
        ctx.lineTo(vientoBufferX[s], vientoBufferY[s]);
      }
      ctx.stroke();
    }

    // B. Motas minerales atrapadas en el viento dentro del vano e iluminadas desde abajo
    const totalMotas = reducirMovimiento ? 2 : 5;
    for (let m = 0; m < totalMotas; m++) {
      const fm = (t * 0.00068 + m * (1 / totalMotas) + arco.fase * 0.21) % 1;
      const mx = Math.round(
        arco.vanoCentro.x - arco.anchoVano * 0.55 + fm * arco.anchoVano * 1.35,
      );
      const my = Math.round(
        arco.vanoCentro.y + 12 - fm * 20 + Math.sin(fm * Math.PI * 2 + m * 1.9) * 3.5,
      );
      const alfaMota = Math.sin(fm * Math.PI) * 0.72;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alfaMota;
      ctx.fillStyle = m % 2 === 0 ? "#fde68a" : "#e2e8f0";
      ctx.fillRect(mx, my, 1.5, 1.5);
    }

    // C. Pulso tenue de polvo iluminado en la base del vano y parpadeo sutil en runas de pilares
    ctx.globalCompositeOperation = "lighter";
    const calidezBase = 0.16 + Math.sin(t * 0.0024 + arco.fase) * 0.06;
    dibujarSpriteCentrado(
      ctx,
      sprites.haloRunaAntigua,
      arco.vanoCentro.x,
      Math.max(arco.pilarIzqBase.y, arco.pilarDerBase.y) - 6,
      arco.anchoVano * 0.65,
      9,
      calidezBase,
    );

    for (let p = 0; p < arco.runasPilares.length; p++) {
      const runa = arco.runasPilares[p];
      const destello = reducirMovimiento
        ? 0.24
        : 0.1 + 0.34 * Math.pow(Math.max(0, Math.sin(t * 0.0026 + arco.fase * 1.4 + p * 2.7)), 3);
      dibujarSpriteCentrado(ctx, sprites.haloRunaAntigua, runa.x, runa.y, 7.5, 7.5, destello * 0.55);
      if (destello > 0.22) {
        ctx.globalAlpha = destello * 0.85;
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(Math.round(runa.x), Math.round(runa.y), 1.5, 1.5);
      }
    }
  }

  ctx.restore();
}

/**
 * 3. Fisuras tectónicas vivas siguiendo exactamente cada vértice de las grietas reales de la roca:
 * onda térmica lenta viajando como respiración subterránea de izquierda a derecha
 * y chispas puntuales asomando únicamente desde las junturas más profundas.
 */
function dibujarFisurasTectonicasRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";

  for (let f = 0; f < FISURAS_TECTONICAS_RISCOS.length; f++) {
    const fisura = FISURAS_TECTONICAS_RISCOS[f];
    const trazo = fisura.trazo;
    const totalVertices = Math.min(trazo.length, fisuraBufferX.length);
    for (let v = 0; v < totalVertices; v++) {
      fisuraBufferX[v] = trazo[v].x;
      fisuraBufferY[v] = trazo[v].y;
    }

    const centroFisuraX = fisuraBufferX[Math.floor(totalVertices / 2)];
    const respiracionLocal = reducirMovimiento
      ? 0.55
      : 0.5 + 0.5 * Math.sin((centroFisuraX - 770) * 0.018 - t * 0.0022 + fisura.fase * 0.15);

    // Aura térmica estrecha en terracota-carmesí ceñida a las hendiduras reales
    ctx.globalAlpha = (0.12 + respiracionLocal * 0.2) * fisura.intensidad;
    ctx.strokeStyle = "#9a3412";
    ctx.lineWidth = fisura.anchoBase * 1.65;
    ctx.beginPath();
    ctx.moveTo(fisuraBufferX[0], fisuraBufferY[0]);
    for (let v = 1; v < totalVertices; v++) {
      ctx.lineTo(fisuraBufferX[v], fisuraBufferY[v]);
    }
    ctx.stroke();

    // Filamento cálido por tramo exacto viajando con la respiración izquierda -> derecha
    for (let v = 0; v < totalVertices - 1; v++) {
      const mx = (fisuraBufferX[v] + fisuraBufferX[v + 1]) * 0.5;
      const ondaSegmento = reducirMovimiento
        ? 0.52
        : 0.5 + 0.5 * Math.sin((mx - 770) * 0.022 - t * 0.0024 + fisura.fase * 0.2);
      if (ondaSegmento < 0.28) continue;

      ctx.globalAlpha = (0.14 + ondaSegmento * 0.42) * fisura.intensidad;
      ctx.strokeStyle = ondaSegmento > 0.8 ? "#fde047" : ondaSegmento > 0.52 ? "#fb923c" : "#ea580c";
      ctx.lineWidth = 0.75 + ondaSegmento * 0.7;
      ctx.beginPath();
      ctx.moveTo(fisuraBufferX[v], fisuraBufferY[v]);
      ctx.lineTo(fisuraBufferX[v + 1], fisuraBufferY[v + 1]);
      ctx.stroke();
    }

    // Chispas puntuales brotando solo desde las junturas más profundas
    if (!reducirMovimiento && fisura.junturaChispa) {
      const j = fisura.junturaChispa;
      for (let c = 0; c < 2; c++) {
        const fc = (t * 0.00058 + c * 0.5 + fisura.fase * 0.23) % 1;
        const cx = Math.round(j.x + fc * 7 + Math.sin(fc * 6 + c * 2.1) * 2.5);
        const cy = Math.round(j.y - fc * 18);
        const alfa = Math.sin(fc * Math.PI) * 0.82;
        ctx.globalAlpha = alfa;
        ctx.fillStyle = fc < 0.4 ? "#fef08a" : "#fb923c";
        ctx.fillRect(cx, cy, 1.5, 1.5);
      }
      dibujarSpriteCentrado(
        ctx,
        sprites.haloMagmaNucleo,
        j.x,
        j.y,
        6.5,
        4.5,
        (0.12 + respiracionLocal * 0.18) * fisura.intensidad,
      );
    }
  }

  ctx.restore();
}

/**
 * 4. Fumigaciones frontales desde los respiraderos superiores reales (inclinadas por el viento lateral)
 * y deriva de ceniza mineral confinada al desfiladero.
 */
function dibujarHumoYCentellasRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_RISCOS);
  ctx.clip();

  // Volutas frontales saliendo de las dos fumarolas y doblándose hacia el noreste por el viento lateral
  const volutas = reducirMovimiento ? 2 : 4;
  for (let f = 0; f < FUMAROLAS_RISCOS.length; f++) {
    const fum = FUMAROLAS_RISCOS[f];
    for (let v = 0; v < volutas; v++) {
      const fv = (t * 0.00024 + v / volutas + fum.fase * 0.19) % 1;
      const env = Math.sin(fv * Math.PI);
      const empujeLateral = fv * fv * 22;
      const giroViento = Math.sin(fv * 5.2 + v * 1.9 + fum.fase) * 4.5;
      const hx = fum.respiradero.x + empujeLateral + giroViento;
      const hy = Math.max(fum.limiteSuperiorY + 4, fum.respiradero.y - fv * 30);
      const rx = 8 + fv * 11;
      const ry = 5 + fv * 7;

      dibujarSpriteCentrado(ctx, sprites.humoSulfuroso, hx, hy, rx, ry, env * 0.46);
    }
  }

  // Ceniza mineral fina cruzando el paso en la corriente del viento
  const totalCeniza = reducirMovimiento ? 6 : CENIZA_MINERAL_RISCOS.length;
  for (let i = 0; i < totalCeniza; i++) {
    const c = CENIZA_MINERAL_RISCOS[i];
    const rx = ((c.xBase + t * c.velocidadX) - 780) % 360;
    const ry = ((c.yBase - t * c.velocidadY + Math.sin(t * 0.0014 + c.fase) * c.amplitud) - 225) % 210;
    const px = Math.round(780 + (rx < 0 ? rx + 360 : rx));
    const py = Math.round(225 + (ry < 0 ? ry + 210 : ry));
    ctx.globalAlpha = i % 3 === 0 ? 0.42 : 0.3;
    ctx.fillStyle = i % 3 === 0 ? "#d6d3d1" : "#a8a29e";
    ctx.fillRect(px, py, c.tamano, c.tamano);
  }

  ctx.restore();
}

/**
 * 5. Cascada estrecha de magma viscoso en el acantilado sureste, poza incandescente en la roca,
 * goterones ocasionales y pequeñas volutas cálidas al caer.
 */
function dibujarCascadaIgneaRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  mascara: MascaraOceano | null | undefined,
  t: number,
  reducirMovimiento: boolean,
): void {
  const { labio, poza, radioPozaX, radioPozaY, trayecto } = CASCADA_IGNEA_RISCOS;
  const punto: Punto2D = { x: 0, y: 0 };
  const pasos = 10;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let s = 0; s <= pasos; s++) {
    const u = s / pasos;
    muestrearPolilinea(trayecto, u, punto);
    const vaivenViscoso = Math.sin(u * 7.5 - t * 0.0036) * 0.45 * Math.sin(u * Math.PI);
    cascadaBufferX[s] = punto.x + vaivenViscoso;
    cascadaBufferY[s] = punto.y;
  }

  // Halo contenido en labio y poza rocosa basal
  ctx.globalCompositeOperation = "lighter";
  const pulso = reducirMovimiento ? 0.75 : 0.72 + Math.sin(t * 0.0038) * 0.22;
  dibujarSpriteCentrado(ctx, sprites.haloRescoldo, labio.x, labio.y, 12, 7, 0.36 * pulso);
  dibujarSpriteCentrado(
    ctx,
    sprites.haloRescoldo,
    poza.x,
    poza.y,
    radioPozaX * 1.45,
    radioPozaY * 1.5,
    0.55 * pulso,
  );
  dibujarSpriteCentrado(
    ctx,
    sprites.haloMagmaNucleo,
    poza.x,
    poza.y,
    radioPozaX * 0.85,
    radioPozaY * 0.9,
    0.48 * pulso,
  );

  // Bordes carmesí del hilo viscoso
  ctx.globalAlpha = 0.56 * pulso;
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(cascadaBufferX[0], cascadaBufferY[0]);
  for (let s = 1; s <= pasos; s++) {
    ctx.lineTo(cascadaBufferX[s], cascadaBufferY[s]);
  }
  ctx.stroke();

  // Núcleo brillante descendiendo lentamente como magma espeso
  for (let s = 0; s < pasos; s++) {
    const u = (s + 0.5) / pasos;
    const onda = reducirMovimiento ? 0.7 : 0.5 + 0.5 * Math.sin(u * 10.5 - t * 0.0052);
    ctx.globalAlpha = 0.38 + onda * 0.58;
    ctx.strokeStyle = onda > 0.72 ? "#fef08a" : onda > 0.44 ? "#fbbf24" : "#f97316";
    ctx.lineWidth = 1.0 + onda * 1.1;
    ctx.beginPath();
    ctx.moveTo(cascadaBufferX[s], cascadaBufferY[s]);
    ctx.lineTo(cascadaBufferX[s + 1], cascadaBufferY[s + 1]);
    ctx.stroke();
  }

  // Goterones viscosos ocasionales desprendiéndose en la caída hacia la poza
  if (!reducirMovimiento) {
    for (let g = 0; g < 2; g++) {
      const fg = (t * 0.00052 + g * 0.5) % 1;
      const gx = Math.round(poza.x + (g === 0 ? -2 : 2) + Math.sin(fg * 4) * 1.2);
      const gy = Math.round(labio.y + 8 + fg * fg * 46);
      ctx.globalAlpha = Math.sin(fg * Math.PI) * 0.92;
      ctx.fillStyle = fg < 0.6 ? "#fef08a" : "#fb923c";
      ctx.fillRect(gx, gy, 1.5, 2.5);
    }
  }

  // Pequeñas volutas de humo cálido al caer sobre la poza rocosa (sin tocar el agua)
  ctx.globalCompositeOperation = "source-over";
  const volutasPoza = reducirMovimiento ? 1 : 3;
  for (let v = 0; v < volutasPoza; v++) {
    const fv = (t * 0.00028 + v / volutasPoza) % 1;
    const vx = poza.x + fv * 8 + Math.sin(fv * 5 + v * 2.1) * 4;
    const vy = poza.y - 3 - fv * 22;
    if (mascara && !esTierraFirmeEnMascara(mascara, vx, vy)) continue;
    const env = Math.sin(fv * Math.PI);
    dibujarSpriteCentrado(ctx, sprites.humoSulfuroso, vx, vy, 7 + fv * 5, 4.5 + fv * 3.5, env * 0.42);
  }

  ctx.restore();
}

/**
 * 6. Micro-vida geológica: diminutos desprendimientos de gravilla y polvo seco por los acantilados
 * frontales (disipándose antes del mar) y rachas rasantes de polvo cruzando el sendero entre puentes.
 */
function dibujarMicroVidaGeologicaRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  mascara: MascaraOceano | null | undefined,
  t: number,
  reducirMovimiento: boolean,
): void {
  if (reducirMovimiento) return;

  ctx.save();

  // A. Desprendimientos esporádicos de gravilla por los acantilados frontales
  for (let d = 0; d < DESPRENDIMIENTOS_RISCOS.length; d++) {
    const desp = DESPRENDIMIENTOS_RISCOS[d];
    const ciclo = ((t + desp.fase * 1000) % desp.periodoMs) / desp.periodoMs;
    if (ciclo > 0.42) continue;

    const u = ciclo / 0.42;
    const env = Math.sin(u * Math.PI);
    const caida = u * u * (desp.finY - desp.origen.y);

    for (let g = 0; g < 3; g++) {
      const gu = Math.max(0, u - g * 0.08);
      if (gu <= 0) continue;
      const gx = Math.round(desp.origen.x + desp.derivaX * gu + (g - 1) * 2.2);
      const gy = Math.round(desp.origen.y + gu * gu * (desp.finY - desp.origen.y));
      if (mascara && !esTierraFirmeEnMascara(mascara, gx, gy)) continue;
      ctx.globalAlpha = env * 0.85;
      ctx.fillStyle = g === 0 ? "#78716c" : "#a8a29e";
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }

    // Pequeña nube de polvo seco disipándose antes del agua
    const polvoY = desp.origen.y + caida * 0.86;
    if (!mascara || esTierraFirmeEnMascara(mascara, desp.origen.x, polvoY)) {
      dibujarSpriteCentrado(
        ctx,
        sprites.polvoRoca,
        desp.origen.x + desp.derivaX * u,
        polvoY,
        4.5 + u * 3.5,
        2.8 + u * 2.2,
        env * 0.34,
      );
    }
  }

  // B. Rachas tenues de polvo rasante cruzando el sendero de tierra entre los puentes
  const punto: Punto2D = { x: 0, y: 0 };
  for (let r = 0; r < 3; r++) {
    const fr = (t * 0.00038 + r * 0.333) % 1;
    muestrearPolilinea(RACHAS_POLVO_SENDERO_RISCOS, fr, punto);
    const env = Math.sin(fr * Math.PI);
    dibujarSpriteCentrado(
      ctx,
      sprites.polvoRoca,
      punto.x,
      punto.y + Math.sin(fr * 10 + r) * 1.5,
      11,
      3.5,
      env * 0.24,
    );
  }

  ctx.restore();
}

/**
 * Estado bloqueado de ZON-04: fumarolas apenas humeando y fisuras casi dormidas en rescoldo oscuro,
 * respetando el sombreado territorial sin ruido visual.
 */
function dibujarEstadoBloqueadoRiscos(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesRiscosCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_RISCOS);
  ctx.clip();

  const pulsoDormido = reducirMovimiento ? 0.1 : 0.085 + Math.sin(t * 0.0015) * 0.03;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let f = 0; f < FISURAS_TECTONICAS_RISCOS.length; f++) {
    const fisura = FISURAS_TECTONICAS_RISCOS[f];
    ctx.globalAlpha = pulsoDormido * fisura.intensidad;
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = fisura.anchoBase * 0.9;
    ctx.beginPath();
    for (let s = 0; s < fisura.trazo.length; s++) {
      const pt = fisura.trazo[s];
      if (s === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }

  // Rescoldo dormido en la poza basal y fumarolas
  dibujarSpriteCentrado(
    ctx,
    sprites.haloRescoldo,
    CASCADA_IGNEA_RISCOS.poza.x,
    CASCADA_IGNEA_RISCOS.poza.y,
    12,
    6,
    pulsoDormido * 1.2,
  );

  // Hilo muy tenue de humo en las dos fumarolas dormidas
  ctx.globalCompositeOperation = "source-over";
  const pasosHumo = reducirMovimiento ? 1 : 2;
  for (let f = 0; f < FUMAROLAS_RISCOS.length; f++) {
    const fum = FUMAROLAS_RISCOS[f];
    for (let h = 0; h < pasosHumo; h++) {
      const prog = (t * 0.0001 + h * 0.5 + fum.fase * 0.2) % 1;
      const env = Math.sin(prog * Math.PI);
      const hx = fum.respiradero.x + prog * 10 + Math.sin(prog * 4 + h) * 3;
      const hy = Math.max(fum.limiteSuperiorY + 6, fum.respiradero.y - prog * 22);
      dibujarSpriteCentrado(ctx, sprites.humoSulfuroso, hx, hy, 9 + prog * 5, 5 + prog * 4, env * 0.26);
    }
  }

  ctx.restore();
}

/**
 * Renderiza el fondo atmosférico detrás de la lámina WebP de ZON-04 ("Paso de los Riscos"),
 * para que las agujas de roca y los arcos en ruinas se recorten nítidamente por delante.
 */
export function dibujarFondoRiscos(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  if (!desbloqueada) return;
  const sprites = obtenerSpritesRiscos();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;
  dibujarAtmosferaTraseraRiscos(ctx, sprites, t, reducirMovimiento);
}

/**
 * Renderiza el diorama vivo completo de ZON-04 ("Paso de los Riscos") diferenciando estado bloqueado
 * vs. desbloqueado, respetando las islas colindantes, la máscara oceánica y prefers-reduced-motion.
 */
export function dibujarDioramaRiscos(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
  mascaraOceano?: MascaraOceano | null,
  fondoDetrasDibujado = false,
): void {
  const sprites = obtenerSpritesRiscos();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;

  if (!desbloqueada) {
    dibujarEstadoBloqueadoRiscos(ctx, sprites, t, reducirMovimiento);
    return;
  }

  if (!fondoDetrasDibujado) {
    dibujarAtmosferaTraseraRiscos(ctx, sprites, t, reducirMovimiento);
  }
  dibujarFisurasTectonicasRiscos(ctx, sprites, t, reducirMovimiento);
  dibujarCascadaIgneaRiscos(ctx, sprites, mascaraOceano, t, reducirMovimiento);
  dibujarArcosVivosRiscos(ctx, sprites, t, reducirMovimiento);
  dibujarHumoYCentellasRiscos(ctx, sprites, t, reducirMovimiento);
  dibujarMicroVidaGeologicaRiscos(ctx, sprites, mascaraOceano, t, reducirMovimiento);
}
