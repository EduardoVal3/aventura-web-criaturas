/**
 * Diorama volcánico y arcano animado a 60 FPS para "Cueva Umbría" (ZON-05) en el mapa de Aethelgard (espacio lógico 1616x897).
 * Todas las coordenadas fueron medidas píxel a píxel sobre apps/web/public/assets/mapa-mundo-aethelgard.webp:
 * envolvente exterior sin invadir ZON-04, ZON-06 ni ZON-03; arco cavernoso con presencia umbría y grieta superior;
 * poza central y 3 ramales de lava en meseta; 3 cascadas de acantilado (con bifurcación central en 3 hebras) y vapor costero;
 * y los 3 cúmulos de cristales amatista con descargas eléctricas orgánicas bifurcadas.
 * Utiliza sprites fuera de pantalla cacheados una sola vez para sostener 60 FPS sin crear gradientes ni arreglos por cuadro.
 */
import type { Punto2D } from "./mapa-dioramas.ts";
import type { MascaraOceano } from "./oceano-vivo.ts";

export interface CascadaAcantiladoCueva {
  id: string;
  labio: Punto2D;
  poza: Punto2D;
  hebras: readonly (readonly Punto2D[])[];
  anchoChorro: number;
  fase: number;
}

export interface AgujaCristalCueva {
  punta: Punto2D;
  base: Punto2D;
  ancho: number;
}

export interface CumuloCristalCueva {
  id: string;
  baseCentro: Punto2D;
  radioBase: number;
  fase: number;
  esColosal: boolean;
  agujas: readonly AgujaCristalCueva[];
}

export interface ArcoCristalCueva {
  origen: Punto2D;
  destino: Punto2D;
  fase: number;
  amplitud: number;
  conRama: boolean;
}

/**
 * Envolvente exterior calibrada píxel a píxel alrededor de ZON-05 (x: 1246..1602, y: 206..505),
 * respetando el puente de ZON-04 al oeste, ZON-06 al noroeste y el dosel de ZON-03 (Bosque) desde y >= 510.
 */
export const SILUETA_ENVOLVENTE_CUEVA: readonly Punto2D[] = [
  { x: 1246, y: 396 },
  { x: 1254, y: 362 },
  { x: 1274, y: 336 },
  { x: 1298, y: 304 },
  { x: 1312, y: 286 },
  { x: 1338, y: 286 },
  { x: 1366, y: 272 },
  { x: 1398, y: 250 },
  { x: 1430, y: 224 },
  { x: 1454, y: 218 },
  { x: 1474, y: 220 },
  { x: 1516, y: 206 },
  { x: 1550, y: 226 },
  { x: 1584, y: 240 },
  { x: 1588, y: 266 },
  { x: 1574, y: 294 },
  { x: 1584, y: 326 },
  { x: 1588, y: 356 },
  { x: 1600, y: 386 },
  { x: 1602, y: 422 },
  { x: 1590, y: 456 },
  { x: 1562, y: 480 },
  { x: 1536, y: 494 },
  { x: 1504, y: 496 },
  { x: 1472, y: 502 },
  { x: 1434, y: 505 },
  { x: 1404, y: 505 },
  { x: 1372, y: 500 },
  { x: 1340, y: 494 },
  { x: 1314, y: 488 },
  { x: 1286, y: 476 },
  { x: 1262, y: 454 },
  { x: 1248, y: 428 },
];

/**
 * Arco interior oscuro de la gran caverna central para confinar la presencia umbría sin manchar las rocas exteriores.
 */
export const ARCO_CAVERNA_CUEVA: readonly Punto2D[] = [
  { x: 1380, y: 354 },
  { x: 1384, y: 326 },
  { x: 1398, y: 304 },
  { x: 1418, y: 290 },
  { x: 1438, y: 282 },
  { x: 1454, y: 280 },
  { x: 1472, y: 292 },
  { x: 1488, y: 312 },
  { x: 1496, y: 338 },
  { x: 1482, y: 352 },
  { x: 1448, y: 356 },
  { x: 1408, y: 358 },
];

/**
 * Grieta superior del techo cavernoso, caída vertical interior y poza central de magma.
 */
export const CASCADA_TECHO_CUEVA = {
  grietaSuperior: { x: 1453, y: 294 } as Punto2D,
  pozaImpacto: { x: 1453, y: 353 } as Punto2D,
  radioPozaX: 22,
  radioPozaY: 7,
  anchoChorro: 10,
};

/**
 * Coordenadas dentro de la oquedad izquierda oscura de la caverna para la bruma y ojos abisales esporádicos.
 */
export const PRESENCIA_UMBRIA_CUEVA = {
  ojoIzquierdo: { x: 1410, y: 326 } as Punto2D,
  ojoDerecho: { x: 1418, y: 326 } as Punto2D,
  centroUmbral: { x: 1398, y: 345 } as Punto2D,
};

/**
 * Cauce principal desde la poza interior hacia los 3 ramales de lava que recorren la meseta de basalto hasta cada cornisa.
 */
export const CAUCES_LAVA_MESETA: readonly (readonly Punto2D[])[] = [
  // Ramal Oeste dentro del cauce expuesto hasta el labio izquierdo (1330, 405)
  [
    { x: 1372, y: 382 },
    { x: 1358, y: 389 },
    { x: 1344, y: 397 },
    { x: 1330, y: 405 },
  ],
  // Cauce central desde debajo del puente de basalto hasta el labio central (1410, 415)
  [
    { x: 1432, y: 386 },
    { x: 1422, y: 400 },
    { x: 1410, y: 415 },
  ],
  // Bifurcación izquierda corta tras la roca central hasta el acantilado
  [
    { x: 1396, y: 394 },
    { x: 1397, y: 405 },
    { x: 1398, y: 415 },
  ],
  // Ramal Este hasta el labio derecho (1523, 413)
  [
    { x: 1463, y: 359 },
    { x: 1476, y: 374 },
    { x: 1481, y: 391 },
    { x: 1497, y: 403 },
    { x: 1514, y: 409 },
    { x: 1523, y: 413 },
  ],
];

/**
 * Puntos calientes sobre la poza interior y canales de la meseta donde las burbujas de magma se hinchan y estallan.
 */
export const BURBUJAS_LAVA_MESETA: readonly Punto2D[] = [
  { x: 1444, y: 356 },
  { x: 1426, y: 368 },
  { x: 1382, y: 378 },
  { x: 1432, y: 388 },
  { x: 1484, y: 392 },
  { x: 1414, y: 407 },
];

/**
 * Las 3 cascadas frontales del acantilado medidas de labio superior a poza en el borde del mar.
 * La cascada central respeta las 3 hebras divididas por las estrías reales de basalto.
 */
export const CASCADAS_ACANTILADO_CUEVA: readonly CascadaAcantiladoCueva[] = [
  {
    id: "cascada-oeste",
    labio: { x: 1327, y: 405 },
    poza: { x: 1321, y: 476 },
    anchoChorro: 7,
    fase: 0.2,
    hebras: [
      [
        { x: 1328, y: 405 },
        { x: 1325, y: 426 },
        { x: 1325, y: 452 },
        { x: 1322, y: 475 },
      ],
    ],
  },
  {
    id: "cascada-central",
    labio: { x: 1409, y: 415 },
    poza: { x: 1408, y: 488 },
    anchoChorro: 14,
    fase: 1.5,
    hebras: [
      [
        { x: 1397, y: 415 },
        { x: 1392, y: 432 },
        { x: 1395, y: 455 },
        { x: 1393, y: 484 },
      ],
      [
        { x: 1409, y: 416 },
        { x: 1407, y: 436 },
        { x: 1406, y: 458 },
        { x: 1408, y: 487 },
      ],
      [
        { x: 1421, y: 416 },
        { x: 1421, y: 438 },
        { x: 1421, y: 462 },
        { x: 1422, y: 486 },
      ],
    ],
  },
  {
    id: "cascada-este",
    labio: { x: 1523, y: 413 },
    poza: { x: 1526, y: 483 },
    anchoChorro: 8,
    fase: 2.9,
    hebras: [
      [
        { x: 1522, y: 413 },
        { x: 1525, y: 436 },
        { x: 1525, y: 460 },
        { x: 1526, y: 482 },
      ],
    ],
  },
];

/**
 * Los 3 cúmulos reales de cristales violeta con cada aguja medida desde su base en roca negra hasta la punta.
 */
export const CUMULOS_CRISTALES_CUEVA: readonly CumuloCristalCueva[] = [
  {
    id: "cumulo-oeste",
    baseCentro: { x: 1313, y: 362 },
    radioBase: 32,
    fase: 0.4,
    esColosal: false,
    agujas: [
      { punta: { x: 1312, y: 299 }, base: { x: 1314, y: 362 }, ancho: 9 },
      { punta: { x: 1297, y: 323 }, base: { x: 1305, y: 361 }, ancho: 5 },
      { punta: { x: 1330, y: 326 }, base: { x: 1323, y: 361 }, ancho: 5 },
      { punta: { x: 1289, y: 342 }, base: { x: 1298, y: 360 }, ancho: 4 },
    ],
  },
  {
    id: "cumulo-colosal",
    baseCentro: { x: 1522, y: 304 },
    radioBase: 48,
    fase: 1.9,
    esColosal: true,
    agujas: [
      { punta: { x: 1536, y: 225 }, base: { x: 1526, y: 302 }, ancho: 13 },
      { punta: { x: 1496, y: 247 }, base: { x: 1506, y: 298 }, ancho: 8 },
      { punta: { x: 1485, y: 256 }, base: { x: 1497, y: 298 }, ancho: 6 },
      { punta: { x: 1560, y: 266 }, base: { x: 1542, y: 302 }, ancho: 7 },
      { punta: { x: 1551, y: 278 }, base: { x: 1545, y: 304 }, ancho: 5 },
      { punta: { x: 1492, y: 316 }, base: { x: 1505, y: 302 }, ancho: 4 },
    ],
  },
  {
    id: "cumulo-este",
    baseCentro: { x: 1548, y: 378 },
    radioBase: 28,
    fase: 3.4,
    esColosal: false,
    agujas: [
      { punta: { x: 1553, y: 328 }, base: { x: 1549, y: 378 }, ancho: 8 },
      { punta: { x: 1528, y: 351 }, base: { x: 1536, y: 378 }, ancho: 5 },
      { punta: { x: 1571, y: 351 }, base: { x: 1560, y: 378 }, ancho: 5 },
      { punta: { x: 1519, y: 366 }, base: { x: 1530, y: 378 }, ancho: 4 },
    ],
  },
];

/**
 * Trayectorias de arcos eléctricos orgánicos entre las puntas reales y zarcillos del cúmulo colosal
 * y saltos secundarios en los cúmulos laterales.
 */
export const ARCOS_CRISTAL_COLOSAL: readonly ArcoCristalCueva[] = [
  { origen: { x: 1496, y: 247 }, destino: { x: 1536, y: 225 }, fase: 0.0, amplitud: 9.0, conRama: true },
  { origen: { x: 1536, y: 225 }, destino: { x: 1560, y: 266 }, fase: 0.9, amplitud: 8.5, conRama: true },
  { origen: { x: 1496, y: 247 }, destino: { x: 1477, y: 232 }, fase: 1.7, amplitud: 6.5, conRama: true },
  { origen: { x: 1560, y: 266 }, destino: { x: 1574, y: 246 }, fase: 2.4, amplitud: 6.0, conRama: false },
  { origen: { x: 1485, y: 256 }, destino: { x: 1492, y: 316 }, fase: 3.1, amplitud: 8.5, conRama: true },
  { origen: { x: 1551, y: 278 }, destino: { x: 1553, y: 328 }, fase: 3.9, amplitud: 7.5, conRama: true },
  { origen: { x: 1496, y: 247 }, destino: { x: 1560, y: 266 }, fase: 4.7, amplitud: 10.0, conRama: true },
  // Descargas vivas en cúmulos oeste y este
  { origen: { x: 1297, y: 323 }, destino: { x: 1312, y: 299 }, fase: 0.6, amplitud: 6.0, conRama: true },
  { origen: { x: 1312, y: 299 }, destino: { x: 1330, y: 326 }, fase: 2.3, amplitud: 6.0, conRama: true },
  { origen: { x: 1289, y: 342 }, destino: { x: 1297, y: 323 }, fase: 3.8, amplitud: 4.5, conRama: false },
  { origen: { x: 1528, y: 351 }, destino: { x: 1553, y: 328 }, fase: 1.4, amplitud: 6.0, conRama: true },
  { origen: { x: 1553, y: 328 }, destino: { x: 1571, y: 351 }, fase: 3.2, amplitud: 5.5, conRama: false },
];

interface ParticulaVolcanica {
  xBase: number;
  yBase: number;
  fase: number;
  velocidad: number;
  amplitud: number;
  tamano: number;
}

const CENIZA_VOLCANICA_CUEVA: readonly ParticulaVolcanica[] = Array.from({ length: 24 }, (_, i) => ({
  xBase: 1265 + ((i * 53 + 17) % 320),
  yBase: 245 + ((i * 37 + 13) % 235),
  fase: i * 0.91,
  velocidad: 0.011 + (i % 4) * 0.0028,
  amplitud: 5 + (i % 3) * 3,
  tamano: i % 4 === 0 ? 2 : 1.5,
}));

const PAVESAS_ESPIRAL_CUEVA: readonly ParticulaVolcanica[] = Array.from({ length: 18 }, (_, i) => ({
  xBase: 1320 + ((i * 41 + 29) % 235),
  yBase: 345 + ((i * 29 + 11) % 135),
  fase: i * 1.23,
  velocidad: 0.00038 + (i % 5) * 0.00007,
  amplitud: 6 + (i % 4) * 2.5,
  tamano: i % 3 === 0 ? 2 : 1.5,
}));

const MOTAS_ETER_CRISTALES: readonly ParticulaVolcanica[] = Array.from({ length: 18 }, (_, i) => ({
  xBase: i < 6 ? 1312 : i < 14 ? 1526 : 1548,
  yBase: i < 6 ? 335 : i < 14 ? 268 : 358,
  fase: i * 1.17,
  velocidad: 0.00042 + (i % 4) * 0.00009,
  amplitud: i < 14 && i >= 6 ? 26 : 16,
  tamano: i % 3 === 0 ? 2 : 1.5,
}));

interface SpritesCuevaCache {
  haloVolcanico: HTMLCanvasElement;
  haloAbisalPurpura: HTMLCanvasElement;
  haloMagmaNucleo: HTMLCanvasElement;
  haloArcanoCristal: HTMLCanvasElement;
  humoOscuro: HTMLCanvasElement;
  vaporCaliente: HTMLCanvasElement;
  brumaUmbria: HTMLCanvasElement;
}

let spritesCuevaCache: SpritesCuevaCache | null = null;

// Búferes reutilizables sin asignaciones por cuadro para arcos eléctricos bifurcados y corrientes de lava
const arcoBufferX = new Float32Array(17);
const arcoBufferY = new Float32Array(17);
const ramaBufferX = new Float32Array(6);
const ramaBufferY = new Float32Array(6);
const flujoBufferX = new Float32Array(21);
const flujoBufferY = new Float32Array(21);

function crearCanvasAuxiliar(ancho: number, alto: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  return canvas;
}

function obtenerSpritesCueva(): SpritesCuevaCache | null {
  if (typeof document === "undefined") return null;
  if (spritesCuevaCache) return spritesCuevaCache;

  // 1. Halo volcánico naranja-carmesí para atmósfera trasera, meseta y pozas de magma
  const haloVolcanico = crearCanvasAuxiliar(128, 64);
  const vCtx = haloVolcanico.getContext("2d");
  if (vCtx) {
    vCtx.save();
    vCtx.scale(2, 1);
    const grad = vCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(251, 146, 60, 0.92)");
    grad.addColorStop(0.35, "rgba(234, 88, 12, 0.62)");
    grad.addColorStop(0.7, "rgba(185, 28, 28, 0.24)");
    grad.addColorStop(1, "rgba(69, 10, 10, 0)");
    vCtx.fillStyle = grad;
    vCtx.fillRect(0, 0, 64, 64);
    vCtx.restore();
  }

  // 2. Halo abisal púrpura detrás del gran cúmulo cristalino y proyección sobre roca negra
  const haloAbisalPurpura = crearCanvasAuxiliar(128, 96);
  const pCtx = haloAbisalPurpura.getContext("2d");
  if (pCtx) {
    pCtx.save();
    pCtx.scale(1.333, 1);
    const grad = pCtx.createRadialGradient(48, 48, 3, 48, 48, 46);
    grad.addColorStop(0, "rgba(217, 70, 239, 0.85)");
    grad.addColorStop(0.36, "rgba(147, 51, 234, 0.56)");
    grad.addColorStop(0.72, "rgba(88, 28, 135, 0.22)");
    grad.addColorStop(1, "rgba(30, 10, 60, 0)");
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 96, 96);
    pCtx.restore();
  }

  // 3. Núcleo incandescente blanco-dorado para grieta superior, burbujas y salpicaduras
  const haloMagmaNucleo = crearCanvasAuxiliar(64, 64);
  const mCtx = haloMagmaNucleo.getContext("2d");
  if (mCtx) {
    const grad = mCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(254, 249, 195, 0.98)");
    grad.addColorStop(0.28, "rgba(253, 224, 71, 0.85)");
    grad.addColorStop(0.6, "rgba(249, 115, 22, 0.36)");
    grad.addColorStop(1, "rgba(234, 88, 12, 0)");
    mCtx.fillStyle = grad;
    mCtx.fillRect(0, 0, 64, 64);
  }

  // 4. Núcleo arcano fucsia-lila para extremos de arcos y puntas cristalinas
  const haloArcanoCristal = crearCanvasAuxiliar(64, 64);
  const aCtx = haloArcanoCristal.getContext("2d");
  if (aCtx) {
    const grad = aCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(250, 232, 255, 0.98)");
    grad.addColorStop(0.32, "rgba(232, 121, 249, 0.78)");
    grad.addColorStop(0.68, "rgba(147, 51, 234, 0.28)");
    grad.addColorStop(1, "rgba(88, 28, 135, 0)");
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, 64, 64);
  }

  // 5. Columna de humo oscuro volcánico con leve reflejo cálido inferior
  const humoOscuro = crearCanvasAuxiliar(64, 48);
  const hCtx = humoOscuro.getContext("2d");
  if (hCtx) {
    hCtx.save();
    hCtx.scale(1.333, 1);
    const grad = hCtx.createRadialGradient(24, 24, 2, 24, 24, 23);
    grad.addColorStop(0, "rgba(41, 37, 36, 0.86)");
    grad.addColorStop(0.5, "rgba(28, 25, 23, 0.56)");
    grad.addColorStop(0.82, "rgba(67, 20, 7, 0.2)");
    grad.addColorStop(1, "rgba(12, 10, 9, 0)");
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 48, 48);
    hCtx.restore();
  }

  // 6. Vapor hirviente para el choque de lava contra el agua del mar
  const vaporCaliente = crearCanvasAuxiliar(48, 32);
  const vcCtx = vaporCaliente.getContext("2d");
  if (vcCtx) {
    vcCtx.save();
    vcCtx.scale(1.5, 1);
    const grad = vcCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(254, 215, 170, 0.88)");
    grad.addColorStop(0.45, "rgba(226, 232, 240, 0.56)");
    grad.addColorStop(0.78, "rgba(148, 163, 184, 0.2)");
    grad.addColorStop(1, "rgba(148, 163, 184, 0)");
    vcCtx.fillStyle = grad;
    vcCtx.fillRect(0, 0, 32, 32);
    vcCtx.restore();
  }

  // 7. Bruma umbría densa violeta-azabache derramándose desde la boca de la caverna
  const brumaUmbria = crearCanvasAuxiliar(64, 32);
  const buCtx = brumaUmbria.getContext("2d");
  if (buCtx) {
    buCtx.save();
    buCtx.scale(2, 1);
    const grad = buCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(9, 4, 20, 0.94)");
    grad.addColorStop(0.45, "rgba(46, 16, 101, 0.62)");
    grad.addColorStop(0.8, "rgba(88, 28, 135, 0.22)");
    grad.addColorStop(1, "rgba(9, 4, 20, 0)");
    buCtx.fillStyle = grad;
    buCtx.fillRect(0, 0, 32, 32);
    buCtx.restore();
  }

  spritesCuevaCache = {
    haloVolcanico,
    haloAbisalPurpura,
    haloMagmaNucleo,
    haloArcanoCristal,
    humoOscuro,
    vaporCaliente,
    brumaUmbria,
  };
  return spritesCuevaCache;
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

function dibujarDestelloCruzPixel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  brazo: number,
  alfa: number,
  colorBrazo = "rgba(232, 121, 249, 0.92)",
): void {
  if (alfa <= 0.04) return;
  const px = Math.round(cx);
  const py = Math.round(cy);
  const largo = Math.max(2, Math.round(brazo));

  ctx.globalAlpha = alfa;
  ctx.fillStyle = colorBrazo;
  ctx.fillRect(px - largo, py, largo * 2 + 1, 1);
  ctx.fillRect(px, py - largo, 1, largo * 2 + 1);
  ctx.fillStyle = "#fdf4ff";
  ctx.fillRect(px - 1, py - 1, 2, 2);
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

function ruidoDeterminista(semilla: number): number {
  const x = Math.sin(semilla * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 1. Atmósfera trasera tras la cresta de basalto (invocada antes del WebP maestro).
 * Combina resplandor cálido naranja-carmesí sobre la cima y aura abisal púrpura tras el gran cristal,
 * además de columnas lentas de humo cálido y ceniza ascendiendo al cielo nocturno.
 */
function dibujarAtmosferaTraseraCueva(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();

  // Resplandor dual detrás de la silueta de basalto y cristal colosal
  ctx.globalCompositeOperation = "lighter";
  const pulsoVolcan = 0.36 + Math.sin(t * 0.0017) * 0.07;
  const pulsoAbisal = 0.38 + Math.cos(t * 0.0015 + 1.1) * 0.07;
  dibujarSpriteCentrado(ctx, sprites.haloVolcanico, 1446, 242, 102, 52, pulsoVolcan);
  dibujarSpriteCentrado(ctx, sprites.haloAbisalPurpura, 1528, 242, 92, 60, pulsoAbisal);

  // Columnas lentas de humo oscuro y cálido ascendiendo tras la cumbre basáltica (sin invadir ZON-06)
  ctx.globalCompositeOperation = "source-over";
  const cantidadHumo = reducirMovimiento ? 5 : 9;
  for (let h = 0; h < cantidadHumo; h++) {
    const progreso = (t * 0.00014 + h * 0.111) % 1;
    const envolvente = Math.sin(progreso * Math.PI);
    const hx = 1428 + (h % 3) * 14 + Math.sin(progreso * 4.5 + h * 1.7) * 8 + progreso * 10;
    const hy = 232 - progreso * 66;
    const radio = 15 + progreso * 18;
    dibujarSpriteCentrado(ctx, sprites.humoOscuro, hx, hy, radio * 1.15, radio * 0.85, envolvente * 0.72);
    if (progreso < 0.5) {
      dibujarSpriteCentrado(
        ctx,
        sprites.haloVolcanico,
        hx,
        hy + 5,
        radio * 0.85,
        radio * 0.55,
        (0.5 - progreso) * 0.36,
      );
    }
  }

  // Pavesas y cenizas lejanas elevándose hacia el cielo detrás de la cresta
  const cantidadCeniza = reducirMovimiento ? 6 : 12;
  for (let c = 0; c < cantidadCeniza; c++) {
    const fc = (t * 0.00024 + c * 0.083) % 1;
    const cx = Math.round(1408 + ((c * 19) % 135) + Math.sin(fc * 6 + c) * 6);
    const cy = Math.round(244 - fc * 74);
    const alfa = Math.sin(fc * Math.PI) * 0.65;
    ctx.globalAlpha = alfa;
    ctx.fillStyle = c % 3 === 0 ? "#fb923c" : "#94a3b8";
    ctx.fillRect(cx, cy, 1.5, 1.5);
  }

  ctx.restore();
}

/**
 * 2. La Gran Caverna Sombría: cascada de magma del techo con núcleo pulsante, poza interior viva,
 * neblina umbría densa derramándose por el umbral y destello esporádico de ojos abisales en la penumbra.
 */
function dibujarCavernaSombria(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  const { grietaSuperior, pozaImpacto, radioPozaX, radioPozaY } = CASCADA_TECHO_CUEVA;
  const { ojoIzquierdo, ojoDerecho, centroUmbral } = PRESENCIA_UMBRIA_CUEVA;

  // A. Presencia umbría y ojos abisales estrictamente confinados al arco oscuro de la caverna
  ctx.save();
  trazarPoligono(ctx, ARCO_CAVERNA_CUEVA);
  ctx.clip();

  // Oscurecimiento respirante muy sutil del fondo cavernoso izquierdo
  const respiroSombra = 0.26 + Math.sin(t * 0.0011) * 0.08;
  dibujarSpriteCentrado(ctx, sprites.brumaUmbria, 1412, 326, 36, 26, respiroSombra);

  // Destello esporádico y misterioso de ojos abisales en la penumbra izquierda cada ~9.6 s
  if (!reducirMovimiento) {
    const cicloOjos = (t % 9600) / 9600;
    if (cicloOjos >= 0.18 && cicloOjos <= 0.44) {
      const faseOjos = (cicloOjos - 0.18) / 0.26;
      const brillo = Math.pow(Math.sin(faseOjos * Math.PI), 1.35);

      // Velo sombrío y leve aura abisal alrededor de la entidad oculta
      dibujarSpriteCentrado(ctx, sprites.brumaUmbria, 1414, 326, 16, 10, brillo * 0.55);
      dibujarSpriteCentrado(
        ctx,
        sprites.haloAbisalPurpura,
        (ojoIzquierdo.x + ojoDerecho.x) * 0.5,
        ojoIzquierdo.y,
        12 - brillo * 2,
        8 - brillo * 1.5,
        brillo * 0.34,
      );

      // Par de rendijas estrechas amatista-carmesí estilo Dark Fantasy (sin bloques blancos planos)
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = brillo * 0.85;
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(ojoIzquierdo.x - 1, ojoIzquierdo.y, 3, 1);
      ctx.fillRect(ojoDerecho.x - 1, ojoDerecho.y, 3, 1);
      ctx.globalAlpha = brillo * 0.92;
      ctx.fillStyle = "#e879f9";
      ctx.fillRect(ojoIzquierdo.x, ojoIzquierdo.y, 1.5, 1);
      ctx.fillRect(ojoDerecho.x, ojoDerecho.y, 1.5, 1);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // Neblina umbría densa arrastrándose por la boca inferior izquierda
  for (let b = 0; b < 3; b++) {
    const u = (t * 0.00014 + b * 0.34) % 1;
    const bx = centroUmbral.x - 4 + Math.sin(u * Math.PI * 2 + b) * 7;
    const by = centroUmbral.y - 3 + b * 3;
    dibujarSpriteCentrado(ctx, sprites.brumaUmbria, bx, by, 20, 8, 0.34 + Math.sin(u * Math.PI) * 0.14);
  }
  ctx.restore();

  // Derrame muy sutil de bruma violeta-azabache sobre las rocas del umbral izquierdo
  ctx.save();
  for (let d = 0; d < 2; d++) {
    const fase = (t * 0.00019 + d * 0.5) % 1;
    const dx = centroUmbral.x - 4 + Math.sin(fase * Math.PI * 2 + d) * 8;
    const dy = centroUmbral.y + 6 + d * 2;
    dibujarSpriteCentrado(ctx, sprites.brumaUmbria, dx, dy, 18, 5.5, 0.24);
  }
  ctx.restore();

  // B. Cascada continua de magma desde la grieta del techo hacia la poza interior
  ctx.save();
  const pulsoGrieta = 0.78 + Math.sin(t * 0.0056) * 0.22;
  ctx.globalCompositeOperation = "lighter";
  dibujarSpriteCentrado(ctx, sprites.haloMagmaNucleo, grietaSuperior.x, grietaSuperior.y, 20, 14, 0.5 * pulsoGrieta);
  dibujarSpriteCentrado(ctx, sprites.haloMagmaNucleo, pozaImpacto.x, pozaImpacto.y, radioPozaX * 1.2, radioPozaY * 2.0, 0.55 * pulsoGrieta);

  // Dos chorros líquidos continuos con crestas térmicas agrupadas por banda cromática (3 strokes por columna en vez de 15)
  const largoCaida = pozaImpacto.y - grietaSuperior.y;
  const segmentosCaida = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let col = 0; col < 2; col++) {
    const xCol = grietaSuperior.x + (col === 0 ? -2.4 : 2.4);
    for (let s = 0; s <= segmentosCaida; s++) {
      const u = s / segmentosCaida;
      const ond = Math.sin(u * 8 - t * 0.0065 + col * 2.1) * 0.55;
      flujoBufferX[s] = xCol + ond;
      flujoBufferY[s] = grietaSuperior.y + 2 + u * (largoCaida - 2);
    }

    // Banda 1: manto exterior incandescente continuo
    ctx.globalAlpha = 0.42 * pulsoGrieta;
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(flujoBufferX[0], flujoBufferY[0]);
    for (let s = 1; s <= segmentosCaida; s++) ctx.lineTo(flujoBufferX[s], flujoBufferY[s]);
    ctx.stroke();

    // Banda 2: crestas líquidas doradas agrupadas en un solo trazado
    ctx.globalAlpha = 0.64;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    for (let s = 0; s < segmentosCaida; s++) {
      const u = (s + 0.5) / segmentosCaida;
      const onda = 0.5 + 0.5 * Math.sin(u * 12.0 - t * 0.0085 + col * 1.8);
      if (onda <= 0.25) continue;
      ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
      ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
    }
    ctx.stroke();

    // Banda 3: núcleos blanco-dorados en las crestas más calientes
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = "#fef9c3";
    ctx.lineWidth = 2.15;
    ctx.beginPath();
    for (let s = 0; s < segmentosCaida; s++) {
      const u = (s + 0.5) / segmentosCaida;
      const onda = 0.5 + 0.5 * Math.sin(u * 12.0 - t * 0.0085 + col * 1.8);
      if (onda <= 0.62) continue;
      ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
      ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
    }
    ctx.stroke();
  }

  // Salpicaduras incandescentes y corona hirviente al impactar la poza central
  if (!reducirMovimiento) {
    for (let g = 0; g < 8; g++) {
      const fg = (t * 0.0013 + g * 0.125) % 1;
      const dir = g % 2 === 0 ? -1 : 1;
      const gx = Math.round(pozaImpacto.x + dir * (2 + fg * 15));
      const gy = Math.round(pozaImpacto.y - Math.sin(fg * Math.PI) * (5.5 + (g % 3) * 2.2));
      ctx.globalAlpha = (1 - fg) * 0.92;
      ctx.fillStyle = fg < 0.45 ? "#fef9c3" : "#fb923c";
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }
  ctx.restore();
}

/**
 * 3. Ríos de lava y poza volcánica vivas sobre la meseta de basalto:
 * corrientes continuas de magma fluido siguiendo los 3 ramales reales y burbujas que se hinchan y estallan.
 */
function dibujarRiosLavaMeseta(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  // simplificacion: las coordenadas de cauces y burbujas ya están calibradas dentro de SILUETA_ENVOLVENTE_CUEVA; omitir ctx.clip() de 33 vértices evita generar máscara stencil en cada cuadro

  // Resplandor térmico sobre la cuenca central de basalto
  ctx.globalCompositeOperation = "lighter";
  const calor = 0.22 + Math.sin(t * 0.0031) * 0.05;
  dibujarSpriteCentrado(ctx, sprites.haloVolcanico, 1435, 384, 62, 26, calor);

  // Corrientes continuas de magma fluido agrupadas por banda térmica (3 strokes por ramal en lugar de 19)
  const muestreado: Punto2D = { x: 0, y: 0 };
  const pasosRio = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let r = 0; r < CAUCES_LAVA_MESETA.length; r++) {
    const cauce = CAUCES_LAVA_MESETA[r];
    for (let s = 0; s <= pasosRio; s++) {
      const u = s / pasosRio;
      muestrearPolilinea(cauce, u, muestreado);
      const serpenteo = Math.sin(u * 8.5 - t * 0.0042 + r * 1.9) * 0.9 * Math.sin(u * Math.PI);
      flujoBufferX[s] = muestreado.x + serpenteo;
      flujoBufferY[s] = muestreado.y + serpenteo * 0.45;
    }

    // Banda 1: aura térmica continua a lo largo de todo el cauce
    ctx.globalAlpha = 0.28 + Math.sin(t * 0.003 + r) * 0.05;
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(flujoBufferX[0], flujoBufferY[0]);
    for (let s = 1; s <= pasosRio; s++) ctx.lineTo(flujoBufferX[s], flujoBufferY[s]);
    ctx.stroke();

    // Banda 2: crestas naranjas-doradas agrupadas
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    for (let s = 1; s < pasosRio - 1; s++) {
      const u = (s + 0.5) / pasosRio;
      const onda = 0.5 + 0.5 * Math.sin(u * 13.0 - t * 0.0046 + r * 1.7);
      if (onda <= 0.35) continue;
      ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
      ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
    }
    ctx.stroke();

    // Banda 3: lenguas incandescentes doradas agrupadas
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let s = 1; s < pasosRio - 1; s++) {
      const u = (s + 0.5) / pasosRio;
      const onda = 0.5 + 0.5 * Math.sin(u * 13.0 - t * 0.0046 + r * 1.7);
      if (onda <= 0.66) continue;
      ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
      ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
    }
    ctx.stroke();
  }

  // Domos de magma incandescente hinchándose en la poza y estallando en micro-chispas
  for (let b = 0; b < BURBUJAS_LAVA_MESETA.length; b++) {
    const pt = BURBUJAS_LAVA_MESETA[b];
    const ciclo = (t * 0.00056 + b * 0.17) % 1;
    if (ciclo < 0.74) {
      const crecimiento = ciclo / 0.74;
      const rx = 1.6 + crecimiento * 2.4;
      const ry = rx * 0.65;
      dibujarSpriteCentrado(ctx, sprites.haloVolcanico, pt.x, pt.y, rx * 2.4, ry * 2.4, 0.28 + crecimiento * 0.36);
      ctx.globalAlpha = 0.38 + crecimiento * 0.45;
      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = crecimiento * 0.78;
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(Math.round(pt.x - 0.8), Math.round(pt.y - 0.8), 1.6, 1.3);
    } else if (!reducirMovimiento) {
      const estallido = (ciclo - 0.74) / 0.26;
      const alfa = (1 - estallido) * 0.92;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(Math.round(pt.x - 2 - estallido * 3.5), Math.round(pt.y - estallido * 5.5), 1.5, 1.5);
      ctx.fillRect(Math.round(pt.x + 1 + estallido * 3.5), Math.round(pt.y - estallido * 6.5), 1.5, 1.5);
      ctx.fillStyle = "#fb923c";
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y - 2 - estallido * 7), 1.5, 1.5);
    }
  }

  ctx.restore();
}

/**
 * 4. Las 3 cascadas frontales de magma (respetando la bifurcación central) y el vapor hirviente
 * elevándose donde la lava entra en contacto con el mar, sin invadir ZON-03 ni chocar con el océano.
 */
function dibujarCascadasYVaporCueva(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  mascara: MascaraOceano | null | undefined,
  t: number,
  reducirMovimiento: boolean,
): void {
  const puntoFlujo: Punto2D = { x: 0, y: 0 };
  const pasosCascada = 14;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < CASCADAS_ACANTILADO_CUEVA.length; i++) {
    const cascada = CASCADAS_ACANTILADO_CUEVA[i];
    const pulso = 0.76 + Math.sin(t * 0.0046 + cascada.fase) * 0.24;

    // Resplandor cálido en labio superior y poza de choque contra el mar (acotado dentro de ZON-05)
    ctx.globalCompositeOperation = "lighter";
    dibujarSpriteCentrado(
      ctx,
      sprites.haloVolcanico,
      cascada.poza.x,
      cascada.poza.y - 2,
      20 + cascada.anchoChorro,
      12,
      0.4 * pulso,
    );
    dibujarSpriteCentrado(
      ctx,
      sprites.haloMagmaNucleo,
      cascada.poza.x,
      cascada.poza.y - 2,
      13 + cascada.anchoChorro * 0.55,
      8.5,
      0.46 * pulso,
    );

    // Flujo líquido continuo y turbulento a lo largo de cada hebra real (sin bloques discontinuos)
    for (let h = 0; h < cascada.hebras.length; h++) {
      const hebra = cascada.hebras[h];
      for (let s = 0; s <= pasosCascada; s++) {
        const u = s / pasosCascada;
        muestrearPolilinea(hebra, u, puntoFlujo);
        const oscilacion = Math.sin(u * 9 - t * 0.006 + h * 2.1 + cascada.fase) * 0.65 * Math.sin(u * Math.PI);
        flujoBufferX[s] = puntoFlujo.x + oscilacion;
        flujoBufferY[s] = puntoFlujo.y;
      }

      // Banda 1: base fluida naranja envolvente
      ctx.globalAlpha = 0.34 * pulso;
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = cascada.hebras.length > 1 ? 3.8 : 5.0;
      ctx.beginPath();
      ctx.moveTo(flujoBufferX[0], flujoBufferY[0]);
      for (let s = 1; s <= pasosCascada; s++) ctx.lineTo(flujoBufferX[s], flujoBufferY[s]);
      ctx.stroke();

      // Banda 2: lenguas doradas agrupadas en un solo trazado
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = cascada.hebras.length > 1 ? 1.55 : 1.9;
      ctx.beginPath();
      for (let s = 0; s < pasosCascada; s++) {
        const u = (s + 0.5) / pasosCascada;
        const onda = 0.5 + 0.5 * Math.sin(u * 13.0 - t * 0.0075 + h * 2.2 + cascada.fase);
        if (onda <= 0.36) continue;
        ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
        ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
      }
      ctx.stroke();

      // Banda 3: núcleos blanco-amarillo en picos térmicos
      ctx.globalAlpha = 0.86;
      ctx.strokeStyle = "#fef9c3";
      ctx.lineWidth = cascada.hebras.length > 1 ? 1.9 : 2.2;
      ctx.beginPath();
      for (let s = 0; s < pasosCascada; s++) {
        const u = (s + 0.5) / pasosCascada;
        const onda = 0.5 + 0.5 * Math.sin(u * 13.0 - t * 0.0075 + h * 2.2 + cascada.fase);
        if (onda <= 0.68) continue;
        ctx.moveTo(flujoBufferX[s], flujoBufferY[s]);
        ctx.lineTo(flujoBufferX[s + 1], flujoBufferY[s + 1]);
      }
      ctx.stroke();
    }

    // Nubes de vapor hirviente subiendo desde la zona de choque sobre el acantilado inferior (nunca sobre Bosque)
    ctx.globalCompositeOperation = "source-over";
    const nubes = reducirMovimiento ? 2 : 5;
    for (let v = 0; v < nubes; v++) {
      const fv = (t * 0.00028 + v / nubes + cascada.fase * 0.2) % 1;
      const vx = cascada.poza.x + Math.sin(fv * 5 + v * 1.9 + cascada.fase) * (7 + cascada.anchoChorro * 0.35);
      const vy = cascada.poza.y - 4 - fv * 36;
      if (vy > 492) continue;
      if (mascara && vy > 485 && !esTierraFirmeEnMascara(mascara, vx, vy - 6)) continue;

      const env = Math.sin(fv * Math.PI);
      const rx = 11 + fv * 10;
      const ry = 6.5 + fv * 6;
      dibujarSpriteCentrado(ctx, sprites.vaporCaliente, vx, vy, rx, ry, env * 0.52);
    }

    // Chispas incandescentes brotando en el choque térmico con el mar
    if (!reducirMovimiento) {
      for (let c = 0; c < 5; c++) {
        const fc = (t * 0.00095 + c * 0.2 + cascada.fase) % 1;
        const cx = Math.round(cascada.poza.x + Math.sin(fc * 7 + c * 2.1) * (9 + cascada.anchoChorro * 0.4));
        const cy = Math.round(cascada.poza.y - 3 - fc * 24);
        ctx.globalAlpha = (1 - fc) * 0.9;
        ctx.fillStyle = fc < 0.4 ? "#fef9c3" : "#fb923c";
        ctx.fillRect(cx, cy, 1.5, 1.5);
      }
    }
  }
  ctx.restore();
}

/**
 * Traza un rayo eléctrico orgánico con desplazamiento de punto medio y bifurcación secundaria opcional,
 * reutilizando búferes estáticos sin crear arreglos en cada cuadro.
 */
function dibujarArcoElectricoBifurcado(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  arco: ArcoCristalCueva,
  t: number,
  intensidad: number,
  indiceArco: number,
): void {
  if (intensidad <= 0.05) return;

  const pasoTemporal = Math.floor(t / 55);
  const dx = arco.destino.x - arco.origen.x;
  const dy = arco.destino.y - arco.origen.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / dist;
  const ny = dx / dist;

  // 12 segmentos angulosos (13 vértices) con desplazamiento nítido de doble octava
  const totalPuntos = 13;
  arcoBufferX[0] = arco.origen.x;
  arcoBufferY[0] = arco.origen.y;
  arcoBufferX[totalPuntos - 1] = arco.destino.x;
  arcoBufferY[totalPuntos - 1] = arco.destino.y;

  for (let i = 1; i < totalPuntos - 1; i++) {
    const frac = i / (totalPuntos - 1);
    const envolvente = Math.sin(frac * Math.PI);
    const j1 = ruidoDeterminista(pasoTemporal * 17.3 + indiceArco * 31 + i * 7.1) - 0.5;
    const j2 = ruidoDeterminista(pasoTemporal * 9.1 + indiceArco * 13 + i * 11.7) - 0.5;
    const diente = i % 2 === 0 ? 1 : -1;
    const desplazamiento = (j1 * 1.45 + j2 * 0.75 + diente * 0.22) * arco.amplitud * envolvente;
    arcoBufferX[i] = arco.origen.x + dx * frac + nx * desplazamiento;
    arcoBufferY[i] = arco.origen.y + dy * frac + ny * desplazamiento;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Fulgor eléctrico en ambos extremos cristalinos
  dibujarSpriteCentrado(ctx, sprites.haloAbisalPurpura, arco.origen.x, arco.origen.y, 16, 16, intensidad * 0.42);
  dibujarSpriteCentrado(ctx, sprites.haloArcanoCristal, arco.origen.x, arco.origen.y, 14, 14, intensidad * 0.58);
  dibujarSpriteCentrado(ctx, sprites.haloArcanoCristal, arco.destino.x, arco.destino.y, 14, 14, intensidad * 0.58);

  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(arcoBufferX[0], arcoBufferY[0]);
  for (let i = 1; i < totalPuntos; i++) {
    ctx.lineTo(arcoBufferX[i], arcoBufferY[i]);
  }

  // Pasada 1: corona púrpura intensa
  ctx.strokeStyle = `rgba(147, 51, 234, ${(intensidad * 0.42).toFixed(2)})`;
  ctx.lineWidth = 5.4;
  ctx.stroke();

  // Pasada 2: halo magenta eléctrico
  ctx.strokeStyle = `rgba(232, 121, 249, ${(intensidad * 0.76).toFixed(2)})`;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Pasada 3: núcleo blanco-lavanda filoso
  ctx.strokeStyle = `rgba(255, 250, 255, ${(intensidad * 0.98).toFixed(2)})`;
  ctx.lineWidth = 1.25;
  ctx.stroke();

  // Bifurcaciones angulosas agrupadas en un solo path (2 strokes totales en lugar de 4)
  if (arco.conRama) {
    const cantidadRamas = dist > 45 ? 2 : 1;
    ctx.beginPath();
    for (let r = 0; r < cantidadRamas; r++) {
      const nodoBif = r === 0 ? 4 + (indiceArco % 2) : 8;
      const bx0 = arcoBufferX[nodoBif];
      const by0 = arcoBufferY[nodoBif];
      const signo = r === 0 ? (ruidoDeterminista(pasoTemporal * 5.7 + indiceArco) > 0.5 ? 1 : -1) : -1;
      const escalaRama = r === 0 ? 0.34 : 0.24;
      const dirX = dx * escalaRama + nx * signo * arco.amplitud * 2.1;
      const dirY = dy * escalaRama + ny * signo * arco.amplitud * 2.1;

      for (let k = 0; k < 6; k++) {
        const f = k / 5;
        const jitter =
          (ruidoDeterminista(pasoTemporal * 11.3 + indiceArco * 19 + k * 3.7 + r * 23) - 0.5) *
          6.0 *
          Math.sin(f * Math.PI);
        ramaBufferX[k] = bx0 + dirX * f + nx * jitter;
        ramaBufferY[k] = by0 + dirY * f + ny * jitter;
      }

      ctx.moveTo(ramaBufferX[0], ramaBufferY[0]);
      for (let k = 1; k < 6; k++) ctx.lineTo(ramaBufferX[k], ramaBufferY[k]);
    }
    ctx.strokeStyle = `rgba(217, 70, 239, ${(intensidad * 0.55).toFixed(2)})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.strokeStyle = `rgba(253, 244, 255, ${(intensidad * 0.92).toFixed(2)})`;
    ctx.lineWidth = 0.95;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 5. Cristales amatista y descargas arcanas:
 * reflejo púrpura sobre roca negra adyacente, pulso mágico ascendente de base a punta,
 * facetas cristalinas, motas de éter violeta y arcos eléctricos orgánicos bifurcados.
 */
function dibujarCristalesYArcosCueva(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  for (let c = 0; c < CUMULOS_CRISTALES_CUEVA.length; c++) {
    const cumulo = CUMULOS_CRISTALES_CUEVA[c];
    const pulsoBase = reducirMovimiento ? 0.72 : 0.65 + 0.35 * Math.sin(t * 0.0028 + cumulo.fase);

    // Reflejo púrpura proyectado sobre las rocas negras adyacentes a la base
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    dibujarSpriteCentrado(
      ctx,
      sprites.haloAbisalPurpura,
      cumulo.baseCentro.x,
      cumulo.baseCentro.y + 4,
      cumulo.radioBase * 1.18,
      cumulo.radioBase * 0.56,
      0.32 * pulsoBase,
    );

    // Pulso mágico recorriendo cada aguja desde la base hacia la punta y reflejos de faceta
    const progresoOnda = (t * 0.00055 + cumulo.fase * 0.25) % 1;
    for (let a = 0; a < cumulo.agujas.length; a++) {
      const aguja = cumulo.agujas[a];
      const u = (progresoOnda + a * 0.16) % 1;
      const hx = aguja.base.x + (aguja.punta.x - aguja.base.x) * u;
      const hy = aguja.base.y + (aguja.punta.y - aguja.base.y) * u;
      const env = Math.sin(u * Math.PI);

      // Banda interna viajera por la arista del cristal
      dibujarSpriteCentrado(
        ctx,
        sprites.haloArcanoCristal,
        hx,
        hy,
        aguja.ancho * 0.9,
        aguja.ancho * 0.9,
        0.24 * env + 0.08,
      );

      // Reflejo especular pixelado en faceta interna
      if (a < 3) {
        const fx = Math.round(aguja.base.x + (aguja.punta.x - aguja.base.x) * 0.58);
        const fy = Math.round(aguja.base.y + (aguja.punta.y - aguja.base.y) * 0.58);
        const brilloFaceta = reducirMovimiento
          ? 0.35
          : Math.pow(Math.max(0, Math.sin(t * 0.0036 + cumulo.fase + a * 1.7)), 3);
        ctx.globalAlpha = brilloFaceta * 0.72;
        ctx.fillStyle = "#fdf4ff";
        ctx.fillRect(fx, fy, 1.5, 3);
      }

      // Destello en cruz pixelada cuando el pulso corona la punta
      const brilloPunta = reducirMovimiento
        ? a === 0
          ? 0.72
          : 0.25
        : Math.pow(Math.max(0, Math.sin(t * 0.0034 + cumulo.fase + a * 1.3)), 2.8);
      dibujarDestelloCruzPixel(
        ctx,
        aguja.punta.x,
        aguja.punta.y,
        cumulo.esColosal && a === 0 ? 5 : 3.5,
        brilloPunta * 0.85,
      );
    }
    ctx.restore();
  }

  // Motas de éter violeta orbitando y ascendiendo suavemente alrededor de los 3 cúmulos
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const totalMotas = reducirMovimiento ? 9 : MOTAS_ETER_CRISTALES.length;
  for (let m = 0; m < totalMotas; m++) {
    const mota = MOTAS_ETER_CRISTALES[m];
    const progreso = (t * mota.velocidad + mota.fase * 0.19) % 1;
    const angulo = progreso * Math.PI * 2 + mota.fase;
    const mx = Math.round(mota.xBase + Math.cos(angulo) * mota.amplitud);
    const my = Math.round(mota.yBase - progreso * 34 + Math.sin(angulo * 2) * 4);
    const alfa = Math.sin(progreso * Math.PI) * 0.78;
    ctx.globalAlpha = alfa;
    ctx.fillStyle = m % 2 === 0 ? "#f0abfc" : "#c084fc";
    ctx.fillRect(mx, my, mota.tamano, mota.tamano);
  }
  ctx.restore();

  // Arcos eléctricos orgánicos bifurcados crepitando sobre los cristales
  if (reducirMovimiento) {
    dibujarArcoElectricoBifurcado(ctx, sprites, ARCOS_CRISTAL_COLOSAL[0], 0, 0.82, 0);
    dibujarArcoElectricoBifurcado(ctx, sprites, ARCOS_CRISTAL_COLOSAL[5], 0, 0.68, 5);
    return;
  }

  for (let i = 0; i < ARCOS_CRISTAL_COLOSAL.length; i++) {
    const arco = ARCOS_CRISTAL_COLOSAL[i];
    // Distribución áurea de fases para evitar ventanas vacías simultáneas en los 3 cúmulos
    const esMenor = i >= 7;
    const periodo = esMenor ? 1950 + (i - 7) * 320 : 1450 + i * 210;
    const cicloActivo = esMenor ? 0.36 : 0.42;
    const indiceGrupo = esMenor ? i - 7 : i;
    const desplazamientoFase = ((indiceGrupo * 0.6180339887) % 1) * periodo;
    const faseLocal = ((t + desplazamientoFase) % periodo) / periodo;
    if (faseLocal > cicloActivo) continue;

    const uVentana = faseLocal / cicloActivo;
    const parpadeo = 0.62 + 0.38 * Math.abs(Math.sin(uVentana * Math.PI * 3.5));
    const intensidad = Math.sin(uVentana * Math.PI) * parpadeo;
    dibujarArcoElectricoBifurcado(ctx, sprites, arco, t, intensidad, i);
  }
}

/**
 * 6. Ceniza gris flotando lento y pavesas naranjas subiendo en espirales suaves confinadas a la isla.
 */
function dibujarCenizaYPavesasCueva(
  ctx: CanvasRenderingContext2D,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  // simplificacion: confinamiento elíptico analítico en lugar de ctx.clip() de 33 vértices para evitar máscara stencil GPU en partículas de 1.5px

  // Ceniza volcánica gris en deriva lenta
  const limiteCeniza = reducirMovimiento ? 10 : CENIZA_VOLCANICA_CUEVA.length;
  for (let i = 0; i < limiteCeniza; i++) {
    const c = CENIZA_VOLCANICA_CUEVA[i];
    const rx = ((c.xBase + t * c.velocidad + Math.sin(t * 0.0011 + c.fase) * c.amplitud) - 1255) % 340;
    const ry = ((c.yBase - t * c.velocidad * 0.65) - 220) % 275;
    const px = Math.round(1255 + (rx < 0 ? rx + 340 : rx));
    const py = Math.round(220 + (ry < 0 ? ry + 275 : ry));
    const dx = (px - 1428) / 162;
    const dy = (py - 360) / 138;
    if (dx * dx + dy * dy > 1) continue;
    ctx.fillStyle = i % 3 === 0 ? "rgba(203, 213, 225, 0.46)" : "rgba(148, 163, 184, 0.38)";
    ctx.fillRect(px, py, c.tamano, c.tamano);
  }

  // Pavesas naranjas ascendiendo en espirales suaves desde la meseta y cascadas
  if (!reducirMovimiento) {
    ctx.globalCompositeOperation = "lighter";
    for (let p = 0; p < PAVESAS_ESPIRAL_CUEVA.length; p++) {
      const pav = PAVESAS_ESPIRAL_CUEVA[p];
      const progreso = (t * pav.velocidad + pav.fase * 0.17) % 1;
      const px = Math.round(pav.xBase + Math.sin(progreso * Math.PI * 3 + pav.fase) * pav.amplitud);
      const py = Math.round(pav.yBase - progreso * 105);
      if (py < 212 || py > 500) continue;
      const alfa = Math.sin(progreso * Math.PI) * 0.85;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = p % 3 === 0 ? "#fef08a" : "#fb923c";
      ctx.fillRect(px, py, pav.tamano, pav.tamano);
    }
  }

  ctx.restore();
}

/**
 * Estado bloqueado de ZON-05: rescoldos apagados, hilo tenue de humo oscuro y pulsos débiles en los cristales.
 */
function dibujarEstadoBloqueadoCueva(
  ctx: CanvasRenderingContext2D,
  sprites: SpritesCuevaCache,
  t: number,
  reducirMovimiento: boolean,
): void {
  ctx.save();
  trazarPoligono(ctx, SILUETA_ENVOLVENTE_CUEVA);
  ctx.clip();

  // Rescoldos apagados en poza de cueva y bases de cascada
  const pulsoRescoldo = reducirMovimiento ? 0.16 : 0.14 + Math.sin(t * 0.0018) * 0.05;
  dibujarSpriteCentrado(ctx, sprites.haloVolcanico, 1453, 353, 24, 10, pulsoRescoldo);
  for (let i = 0; i < CASCADAS_ACANTILADO_CUEVA.length; i++) {
    const poza = CASCADAS_ACANTILADO_CUEVA[i].poza;
    dibujarSpriteCentrado(ctx, sprites.haloVolcanico, poza.x, poza.y - 2, 16, 7, pulsoRescoldo * 0.85);
  }

  // Hilo tenue de humo oscuro ascendiendo despacio desde la caverna dormida
  const pasosHumo = reducirMovimiento ? 2 : 4;
  for (let h = 0; h < pasosHumo; h++) {
    const prog = (t * 0.00011 + h * 0.25) % 1;
    const hx = 1451 + Math.sin(prog * 4 + h) * 5;
    const hy = 296 - prog * 54;
    const env = Math.sin(prog * Math.PI);
    dibujarSpriteCentrado(ctx, sprites.humoOscuro, hx, hy, 10 + prog * 7, 7 + prog * 5, env * 0.34);
  }

  // Pulsos débiles en la base de los 3 cúmulos de cristales (sin arcos eléctricos)
  const pulsoCristal = reducirMovimiento ? 0.16 : 0.12 + 0.1 * Math.sin(t * 0.0016);
  for (let c = 0; c < CUMULOS_CRISTALES_CUEVA.length; c++) {
    const cumulo = CUMULOS_CRISTALES_CUEVA[c];
    dibujarSpriteCentrado(
      ctx,
      sprites.haloAbisalPurpura,
      cumulo.baseCentro.x,
      cumulo.baseCentro.y,
      cumulo.radioBase * 0.72,
      cumulo.radioBase * 0.38,
      pulsoCristal,
    );
  }

  ctx.restore();
}

/**
 * Renderiza el resplandor volcánico/abisal y columnas de humo detrás de la silueta WebP de ZON-05,
 * logrando que las cumbres de basalto y cristales se recorten limpiamente por delante.
 */
export function dibujarFondoCuevaUmbria(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  if (!desbloqueada) return;
  const sprites = obtenerSpritesCueva();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;
  dibujarAtmosferaTraseraCueva(ctx, sprites, t, reducirMovimiento);
}

/**
 * Renderiza el diorama vivo completo de ZON-05 ("Cueva Umbría") respetando el estado bloqueado vs. desbloqueado,
 * los límites de las islas vecinas y la preferencia de movimiento reducido.
 */
export function dibujarDioramaCuevaUmbria(
  ctx: CanvasRenderingContext2D,
  desbloqueada: boolean,
  tiempo: number,
  reducirMovimiento: boolean,
  mascaraOceano?: MascaraOceano | null,
  fondoDetrasDibujado = false,
): void {
  const sprites = obtenerSpritesCueva();
  if (!sprites) return;

  const t = reducirMovimiento ? 0 : tiempo;

  if (!desbloqueada) {
    dibujarEstadoBloqueadoCueva(ctx, sprites, t, reducirMovimiento);
    return;
  }

  if (!fondoDetrasDibujado) {
    dibujarAtmosferaTraseraCueva(ctx, sprites, t, reducirMovimiento);
  }
  dibujarCavernaSombria(ctx, sprites, t, reducirMovimiento);
  dibujarRiosLavaMeseta(ctx, sprites, t, reducirMovimiento);
  dibujarCascadasYVaporCueva(ctx, sprites, mascaraOceano, t, reducirMovimiento);
  dibujarCristalesYArcosCueva(ctx, sprites, t, reducirMovimiento);
  dibujarCenizaYPavesasCueva(ctx, t, reducirMovimiento);
}
