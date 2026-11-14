/**
 * Motor híbrido 2D de atmósfera, iluminación viva y rutas costeras sobre el mapa maestro de Aethelgard (1679x937).
 * Combina geometría orgánica costera y trayectos exactos de los 10 puentes con efectos 16-bit a 60 FPS:
 * océano continuo sin bordes negros, cascadas animadas, antorchas, fuente rúnica, magma, rayos violetas,
 * aurora boreal, esporas de bosque, velo de zonas bloqueadas y orbes guiados de navegación.
 */
import type { ConexionUbicacion, NodoMapaTerritorial } from "../api/ApiJuego";
import { CONEXIONES_AETHELGARD } from "./servicios-hub.ts";
import {
  CONFIGURACION_ISLAS_MAPA,
  DIMENSIONES_MAPA_MUNDO,
  type ConfiguracionIslaMapa,
} from "./mapa-mundo.ts";

const PASOS_CONTORNO = 72;

export interface Punto2D {
  x: number;
  y: number;
}

export interface VistaCamaraMundo {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TrayectoPuenteMapa {
  origenId: string;
  destinoId: string;
  inicio: Punto2D;
  control: Punto2D;
  fin: Punto2D;
}

export interface GeometriaDioramaIsla {
  id: string;
  bioma: ConfiguracionIslaMapa["bioma"];
  contornoLocal: Punto2D[];
  angulosPuente: number[];
}

/**
 * Curvas Bezier cuadráticas calibradas sobre los 10 puentes reales dibujados en el mapa maestro (1679x937).
 */
export const TRAYECTOS_PUENTES_AETHELGARD: readonly TrayectoPuenteMapa[] = [
  {
    origenId: "LOC-01",
    destinoId: "ZON-01",
    inicio: { x: 206, y: 590 },
    control: { x: 254, y: 556 },
    fin: { x: 306, y: 522 },
  },
  {
    origenId: "LOC-01",
    destinoId: "ZON-02",
    inicio: { x: 465, y: 714 },
    control: { x: 585, y: 706 },
    fin: { x: 702, y: 714 },
  },
  {
    origenId: "ZON-01",
    destinoId: "LOC-02",
    inicio: { x: 396, y: 514 },
    control: { x: 468, y: 418 },
    fin: { x: 540, y: 520 },
  },
  {
    origenId: "ZON-02",
    destinoId: "ZON-03",
    inicio: { x: 1020, y: 708 },
    control: { x: 1090, y: 696 },
    fin: { x: 1162, y: 714 },
  },
  {
    origenId: "LOC-02",
    destinoId: "ZON-03",
    inicio: { x: 796, y: 534 },
    control: { x: 948, y: 412 },
    fin: { x: 1170, y: 648 },
  },
  {
    origenId: "LOC-02",
    destinoId: "ZON-04",
    inicio: { x: 750, y: 435 },
    control: { x: 825, y: 405 },
    fin: { x: 905, y: 375 },
  },
  {
    origenId: "ZON-04",
    destinoId: "LOC-03",
    inicio: { x: 830, y: 320 },
    control: { x: 755, y: 295 },
    fin: { x: 680, y: 295 },
  },
  {
    origenId: "ZON-04",
    destinoId: "ZON-05",
    inicio: { x: 1154, y: 376 },
    control: { x: 1238, y: 332 },
    fin: { x: 1326, y: 386 },
  },
  {
    origenId: "LOC-03",
    destinoId: "ZON-06",
    inicio: { x: 655, y: 202 },
    control: { x: 730, y: 144 },
    fin: { x: 820, y: 128 },
  },
  {
    origenId: "ZON-05",
    destinoId: "ZON-06",
    inicio: { x: 1385, y: 260 },
    control: { x: 1325, y: 215 },
    fin: { x: 1255, y: 185 },
  },
];

function semillaDesdeTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function crearPrng(semillaInicial: number): () => number {
  let estado = semillaInicial >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function armonicosIsla(id: string): [number, number, number, number] {
  const r = crearPrng(semillaDesdeTexto(id));
  return [r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2];
}

/**
 * Calcula el factor radial orgánico multi-lóbulo de una isla para trazar aros costeros naturales.
 */
export function factorContornoIsla(id: string, angulo: number): number {
  const [f1, f2, f3, f4] = armonicosIsla(id);
  const ondaBase =
    0.075 * Math.sin(angulo * 2 + f1) +
    0.052 * Math.cos(angulo * 3 + f2) +
    0.032 * Math.sin(angulo * 5 + f3) +
    0.018 * Math.cos(angulo * 7 + f4);
  return 0.96 + ondaBase;
}

/**
 * Proyecta un vértice local del perímetro de una isla para un ángulo polar dado.
 */
export function puntoContornoLocal(
  isla: ConfiguracionIslaMapa,
  angulo: number,
  escalaRadial = 1,
): Punto2D {
  const factor = factorContornoIsla(isla.id, angulo) * escalaRadial;
  return {
    x: Math.cos(angulo) * isla.radioX * factor,
    y: Math.sin(angulo) * isla.radioY * factor,
  };
}

/**
 * Calcula el punto del borde costero orientado hacia una coordenada objetivo.
 */
export function puntoBordeIsla(
  isla: ConfiguracionIslaMapa,
  objetivoX: number,
  objetivoY: number,
  holguraRadial = 0.98,
): Punto2D {
  const dx = (objetivoX - isla.x) / Math.max(1, isla.radioX);
  const dy = (objetivoY - isla.y) / Math.max(1, isla.radioY);
  const angulo = Math.atan2(dy, dx);
  const local = puntoContornoLocal(isla, angulo, holguraRadial);
  return {
    x: isla.x + local.x,
    y: isla.y + local.y,
  };
}

/**
 * Construye la geometría base determinista de una isla (pure-Node safe para pruebas unitarias).
 */
export function generarGeometriaDiorama(isla: ConfiguracionIslaMapa): GeometriaDioramaIsla {
  const contornoLocal: Punto2D[] = [];
  for (let i = 0; i < PASOS_CONTORNO; i++) {
    const ang = (i / PASOS_CONTORNO) * Math.PI * 2;
    contornoLocal.push(puntoContornoLocal(isla, ang, 1));
  }

  const angulosPuente: number[] = [];
  for (const [origenId, destinoId] of CONEXIONES_AETHELGARD) {
    const otroId = origenId === isla.id ? destinoId : destinoId === isla.id ? origenId : null;
    if (!otroId) continue;
    const otro = CONFIGURACION_ISLAS_MAPA[otroId];
    if (!otro) continue;
    angulosPuente.push(
      Math.atan2(
        (otro.y - isla.y) / Math.max(1, isla.radioY),
        (otro.x - isla.x) / Math.max(1, isla.radioX),
      ),
    );
  }

  return { id: isla.id, bioma: isla.bioma, contornoLocal, angulosPuente };
}

function trazarPoligonoLocal(
  ctx: CanvasRenderingContext2D,
  puntos: Punto2D[],
  dx = 0,
  dy = 0,
  escala = 1,
): void {
  ctx.beginPath();
  for (let i = 0; i < puntos.length; i++) {
    const px = puntos[i].x * escala + dx;
    const py = puntos[i].y * escala + dy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * Rellena el océano continuo fuera y debajo del mapa maestro (#002040 -> #002e53 -> #002345)
 * con olas animadas sutiles para evitar bordes negros o cortes rectangulares al hacer zoom/paneo.
 */
export function dibujarFondoOceanoContinuo(
  ctx: CanvasRenderingContext2D,
  tiempo: number,
  reducirMovimiento: boolean,
  vistaMundo?: VistaCamaraMundo,
): void {
  const t = reducirMovimiento ? 0 : tiempo;
  const xMin = Math.floor((vistaMundo?.minX ?? -400) - 240);
  const yMin = Math.floor((vistaMundo?.minY ?? -300) - 240);
  const xMax = Math.ceil((vistaMundo?.maxX ?? DIMENSIONES_MAPA_MUNDO.ancho + 400) + 240);
  const yMax = Math.ceil((vistaMundo?.maxY ?? DIMENSIONES_MAPA_MUNDO.alto + 300) + 240);

  const gradMar = ctx.createLinearGradient(0, -120, 0, DIMENSIONES_MAPA_MUNDO.alto + 120);
  gradMar.addColorStop(0, "#002040");
  gradMar.addColorStop(0.5, "#002c50");
  gradMar.addColorStop(1, "#002345");
  ctx.fillStyle = gradMar;
  ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);

  // Destellos suaves de oleaje fuera del recuadro maestro
  const pasoX = 140;
  const pasoY = 82;
  const colIni = Math.floor(xMin / pasoX) * pasoX;
  const rowIni = Math.floor(yMin / pasoY) * pasoY;
  const vaiven = Math.sin(t * 0.0014) * 14;

  ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
  for (let oy = rowIni; oy <= yMax; oy += pasoY) {
    for (let ox = colIni; ox <= xMax; ox += pasoX) {
      if (
        ox > 30 &&
        ox < DIMENSIONES_MAPA_MUNDO.ancho - 30 &&
        oy > 30 &&
        oy < DIMENSIONES_MAPA_MUNDO.alto - 30
      ) {
        continue;
      }
      ctx.fillRect(Math.round(ox + vaiven), oy, 22, 2);
      ctx.fillRect(Math.round(ox + 64 - vaiven), oy + 36, 14, 2);
    }
  }
}

/**
 * Difumina los 4 bordes externos de la imagen maestra hacia el azul oceánico continuo.
 */
export function dibujarFusionBordesMapa(ctx: CanvasRenderingContext2D): void {
  const W = DIMENSIONES_MAPA_MUNDO.ancho;
  const H = DIMENSIONES_MAPA_MUNDO.alto;
  const margen = 44;

  const gIzq = ctx.createLinearGradient(0, 0, margen, 0);
  gIzq.addColorStop(0, "rgba(0, 38, 75, 0.92)");
  gIzq.addColorStop(1, "rgba(0, 38, 75, 0)");
  ctx.fillStyle = gIzq;
  ctx.fillRect(0, 0, margen, H);

  const gDer = ctx.createLinearGradient(W, 0, W - margen, 0);
  gDer.addColorStop(0, "rgba(0, 38, 75, 0.92)");
  gDer.addColorStop(1, "rgba(0, 38, 75, 0)");
  ctx.fillStyle = gDer;
  ctx.fillRect(W - margen, 0, margen, H);

  const gSup = ctx.createLinearGradient(0, 0, 0, margen);
  gSup.addColorStop(0, "rgba(0, 34, 68, 0.92)");
  gSup.addColorStop(1, "rgba(0, 34, 68, 0)");
  ctx.fillStyle = gSup;
  ctx.fillRect(0, 0, W, margen);

  const gInf = ctx.createLinearGradient(0, H, 0, H - margen);
  gInf.addColorStop(0, "rgba(0, 35, 69, 0.92)");
  gInf.addColorStop(1, "rgba(0, 35, 69, 0)");
  ctx.fillStyle = gInf;
  ctx.fillRect(0, H - margen, W, margen);
}

/**
 * Respaldo limpio mientras carga o decodifica el asset principal de mapa.
 */
export function dibujarRespaldoIslasBase(
  ctx: CanvasRenderingContext2D,
  nodos: NodoMapaTerritorial[],
): void {
  for (const nodo of nodos) {
    const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
    if (!isla) continue;
    const geom = generarGeometriaDiorama(isla);
    ctx.save();
    ctx.translate(isla.x, isla.y);
    ctx.fillStyle = isla.colorBorde;
    trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 18, 0.95);
    ctx.fill();
    ctx.fillStyle = isla.colorSuelo;
    trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 0.95);
    ctx.fill();
    ctx.strokeStyle = "#040812";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function dibujarHaloFuego(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radio: number,
  intensidad: number,
  colorCentro: string,
  colorBorde: string,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const grad = ctx.createRadialGradient(x, y, 1, x, y, radio);
  grad.addColorStop(0, colorCentro);
  grad.addColorStop(0.5, colorBorde);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = intensidad;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarChispasAscendentes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cantidad: number,
  dispersionX: number,
  altura: number,
  t: number,
  color: string,
): void {
  for (let i = 0; i < cantidad; i++) {
    const fase = (t * 0.0005 + i * (1 / cantidad) + x * 0.003) % 1;
    const cx = x + Math.sin(t * 0.0028 + i * 2.1) * dispersionX;
    const cy = y - fase * altura;
    const alpha = Math.sin(fase * Math.PI);
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx), Math.round(cy), 3, 3);
    ctx.restore();
  }
}

function dibujarHumoChimenea(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  esOscuro = false,
): void {
  for (let i = 0; i < 4; i++) {
    const fase = (t * 0.00038 + i * 0.25 + x * 0.01) % 1;
    const hx = x + Math.sin(fase * 5 + i) * 7 + fase * 8;
    const hy = y - fase * 34;
    ctx.fillStyle = esOscuro
      ? `rgba(148, 163, 184, ${(1 - fase) * 0.34})`
      : `rgba(226, 232, 240, ${(1 - fase) * 0.3})`;
    ctx.beginPath();
    ctx.arc(hx, hy, 4 + fase * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarPuentesYRutasVivas(
  ctx: CanvasRenderingContext2D,
  nodosPorId: Map<string, NodoMapaTerritorial>,
  conexionesPorId: Map<string, ConexionUbicacion>,
  ubicacionActualId: string,
  t: number,
): void {
  for (const ruta of TRAYECTOS_PUENTES_AETHELGARD) {
    const nOrig = nodosPorId.get(ruta.origenId);
    const nDest = nodosPorId.get(ruta.destinoId);
    const rutaDesbloqueada = Boolean(nOrig?.desbloqueada && nDest?.desbloqueada);

    if (!rutaDesbloqueada) {
      ctx.save();
      ctx.strokeStyle = "rgba(4, 9, 22, 0.56)";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ruta.inicio.x, ruta.inicio.y);
      ctx.quadraticCurveTo(ruta.control.x, ruta.control.y, ruta.fin.x, ruta.fin.y);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const otroId =
      ruta.origenId === ubicacionActualId
        ? ruta.destinoId
        : ruta.destinoId === ubicacionActualId
          ? ruta.origenId
          : null;

    if (!otroId) continue;
    const conexionActiva = conexionesPorId.get(otroId);
    const esAlcanzable = Boolean(conexionActiva && !conexionActiva.estaBloqueada);
    const esDesbloqueable = Boolean(
      conexionActiva?.estaBloqueada && conexionActiva.cumpleRequisito,
    );
    if (!esAlcanzable && !esDesbloqueable) continue;

    const invertir = ruta.destinoId === ubicacionActualId;
    const p0 = invertir ? ruta.fin : ruta.inicio;
    const p1 = ruta.control;
    const p2 = invertir ? ruta.inicio : ruta.fin;
    const colorHalo = esAlcanzable
      ? "rgba(52, 211, 153, 0.34)"
      : "rgba(251, 191, 36, 0.36)";
    const colorOrbe = esAlcanzable ? "#6ee7b7" : "#fde047";

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorHalo;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.stroke();

    for (let k = 0; k < 4; k++) {
      const u = (t * 0.00048 + k * 0.25) % 1;
      const inv = 1 - u;
      const ox = inv * inv * p0.x + 2 * inv * u * p1.x + u * u * p2.x;
      const oy = inv * inv * p0.y + 2 * inv * u * p1.y + u * u * p2.y;
      ctx.fillStyle = colorOrbe;
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Superpone toda la capa viva 60 FPS calibrada sobre la ilustración maestra:
 * velos de niebla en zonas bloqueadas, orbes de navegación sobre los 10 puentes,
 * anillo de posición actual y efectos ambientales animados por cada bioma.
 */
export function dibujarCapaVivaMapa(
  ctx: CanvasRenderingContext2D,
  nodos: NodoMapaTerritorial[],
  conexionesPorId: Map<string, ConexionUbicacion>,
  ubicacionActualId: string,
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  const t = reducirMovimiento ? 0 : tiempo;
  const nodosPorId = new Map(nodos.map((n) => [n.id, n]));

  // 1. Velo oscuro en islas aún bloqueadas y aro rúnico de ubicación actual
  for (const nodo of nodos) {
    const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
    if (!isla) continue;

    if (!nodo.desbloqueada) {
      ctx.save();
      const gradNiebla = ctx.createRadialGradient(
        isla.x,
        isla.y,
        isla.radioX * 0.25,
        isla.x,
        isla.y,
        isla.radioX * 1.15,
      );
      gradNiebla.addColorStop(0, "rgba(4, 10, 24, 0.56)");
      gradNiebla.addColorStop(0.75, "rgba(4, 10, 24, 0.44)");
      gradNiebla.addColorStop(1, "rgba(4, 10, 24, 0)");
      ctx.fillStyle = gradNiebla;
      ctx.beginPath();
      ctx.ellipse(isla.x, isla.y, isla.radioX * 1.15, isla.radioY * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (nodo.id === ubicacionActualId) {
      const geom = generarGeometriaDiorama(isla);
      const pulso = 0.72 + Math.sin(t * 0.004) * 0.28;
      ctx.save();
      ctx.translate(isla.x, isla.y + 8);
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -(t * 0.032);
      ctx.strokeStyle = `rgba(20, 209, 232, ${0.88 * pulso})`;
      ctx.lineWidth = 3.2;
      trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 1.03);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.26 * pulso})`;
      ctx.lineWidth = 8;
      trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 1.05);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. Puentes activos y flujo guiado
  dibujarPuentesYRutasVivas(ctx, nodosPorId, conexionesPorId, ubicacionActualId, t);

  // 3. Efectos ambientales por región desbloqueada
  const desbloqueada = (id: string) => Boolean(nodosPorId.get(id)?.desbloqueada);

  // LOC-01: Villa Serena — fuente mágica cian, faroles cálidos y humo de chimeneas
  if (desbloqueada("LOC-01")) {
    const pulsoFuente = 0.7 + Math.sin(t * 0.005) * 0.3;
    dibujarHaloFuego(ctx, 288, 690, 34, 0.42 * pulsoFuente, "rgba(165, 243, 252, 0.9)", "rgba(20, 209, 232, 0.35)");
    dibujarChispasAscendentes(ctx, 288, 686, 4, 6, 18, t, "#a5f3fc");

    const faroles: [number, number][] = [
      [248, 700],
      [308, 672],
      [352, 700],
      [226, 756],
      [294, 772],
      [338, 760],
    ];
    for (const [fx, fy] of faroles) {
      const f = 0.72 + Math.sin(t * 0.009 + fx) * 0.28;
      dibujarHaloFuego(ctx, fx, fy, 18, 0.42 * f, "rgba(254, 240, 138, 0.9)", "rgba(245, 158, 11, 0.3)");
    }
    dibujarHumoChimenea(ctx, 198, 608, t);
    dibujarHumoChimenea(ctx, 255, 594, t + 900);
    dibujarHumoChimenea(ctx, 322, 614, t + 1800);
  }

  // ZON-01: Praderas — runas cian/esmeralda vibrantes y motas doradas
  if (desbloqueada("ZON-01")) {
    const runas: [number, number][] = [
      [193, 358],
      [110, 415],
      [264, 386],
      [354, 376],
    ];
    for (const [rx, ry] of runas) {
      const p = 0.45 + Math.sin(t * 0.0038 + rx * 0.05) * 0.45;
      dibujarHaloFuego(ctx, rx, ry, 24, 0.45 * p, "rgba(110, 231, 183, 0.9)", "rgba(20, 209, 232, 0.35)");
    }
    dibujarChispasAscendentes(ctx, 240, 445, 6, 85, 42, t * 0.7, "#fde047");
  }

  // LOC-02: Puesto del Río — pebeteros encendidos y cascada frontal espumosa
  if (desbloqueada("LOC-02")) {
    const pebeteros: [number, number][] = [
      [566, 426],
      [658, 372],
      [645, 474],
      [752, 426],
    ];
    for (const [bx, by] of pebeteros) {
      const f = 0.75 + Math.sin(t * 0.013 + bx) * 0.25;
      dibujarHaloFuego(ctx, bx, by, 26, 0.62 * f, "rgba(254, 240, 138, 0.95)", "rgba(249, 115, 22, 0.45)");
      dibujarChispasAscendentes(ctx, bx, by - 4, 3, 5, 22, t, "#fdba74");
    }

    // Estela luminosa sobre el caudal de la cascada del puesto
    const despRio = (t * 0.045) % 16;
    ctx.save();
    ctx.fillStyle = "rgba(224, 242, 254, 0.62)";
    for (let w = 0; w < 38; w += 10) {
      ctx.fillRect(694 + (w % 3) * 4, 515 + ((w + despRio) % 44), 3, 7);
    }
    const espuma = 0.65 + Math.sin(t * 0.006) * 0.35;
    ctx.fillStyle = `rgba(224, 242, 254, ${0.55 * espuma})`;
    ctx.beginPath();
    ctx.ellipse(715, 574, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ZON-02: Lago Espejo — destellos cristalinos cian y neblina arcana
  if (desbloqueada("ZON-02")) {
    const reflejo = 0.55 + Math.sin(t * 0.0032) * 0.35;
    dibujarHaloFuego(ctx, 865, 735, 62, 0.26 * reflejo, "rgba(103, 232, 249, 0.7)", "rgba(168, 85, 247, 0.25)");
    const cristales: [number, number][] = [
      [755, 745],
      [970, 748],
      [912, 650],
      [885, 815],
    ];
    for (const [cx, cy] of cristales) {
      const k = 0.5 + Math.sin(t * 0.0045 + cx * 0.1) * 0.45;
      dibujarHaloFuego(ctx, cx, cy, 22, 0.45 * k, "rgba(165, 243, 252, 0.9)", "rgba(6, 182, 212, 0.3)");
    }
    dibujarChispasAscendentes(ctx, 865, 765, 6, 75, 45, t * 0.6, "#a5f3fc");
  }

  // ZON-03: Bosque — luciérnagas verde esmeralda en torno al trono del claro
  if (desbloqueada("ZON-03")) {
    for (let i = 0; i < 11; i++) {
      const ang = t * 0.001 + i * 0.9;
      const lx = 1368 + Math.cos(ang) * (42 + (i % 5) * 26);
      const ly = 710 + Math.sin(ang * 1.4 + i) * (24 + (i % 4) * 14);
      const brillo = 0.45 + Math.sin(t * 0.005 + i) * 0.45;
      ctx.fillStyle = `rgba(74, 222, 128, ${brillo})`;
      ctx.fillRect(Math.round(lx), Math.round(ly), 3, 3);
    }
    dibujarHaloFuego(ctx, 1410, 725, 42, 0.26, "rgba(74, 222, 128, 0.85)", "rgba(16, 185, 129, 0.2)");
  }

  // ZON-04: Riscos — humo en cresta rocosa, grietas ardientes y pavesas
  if (desbloqueada("ZON-04")) {
    const brasa = 0.55 + Math.sin(t * 0.0045) * 0.38;
    dibujarHaloFuego(ctx, 985, 355, 36, 0.28 * brasa, "rgba(251, 146, 60, 0.85)", "rgba(220, 38, 38, 0.25)");
    dibujarHaloFuego(ctx, 1075, 392, 30, 0.26 * brasa, "rgba(251, 146, 60, 0.85)", "rgba(220, 38, 38, 0.25)");
    dibujarHumoChimenea(ctx, 935, 285, t, true);
    dibujarChispasAscendentes(ctx, 1015, 410, 6, 70, 56, t * 0.8, "#fb923c");
  }

  // LOC-03: Bastión del Norte — pebeteros de almenas y nieve ligera
  if (desbloqueada("LOC-03")) {
    const torres: [number, number][] = [
      [399, 108],
      [500, 146],
      [612, 108],
    ];
    for (const [tx, ty] of torres) {
      const f = 0.72 + Math.sin(t * 0.011 + tx) * 0.28;
      dibujarHaloFuego(ctx, tx, ty, 32, 0.65 * f, "rgba(254, 240, 138, 0.95)", "rgba(249, 115, 22, 0.45)");
      dibujarChispasAscendentes(ctx, tx, ty - 6, 4, 6, 26, t, "#fde047");
    }
    ctx.fillStyle = "rgba(224, 242, 254, 0.62)";
    for (let s = 0; s < 10; s++) {
      const fs = (t * 0.00035 + s * 0.11) % 1;
      const sx = 350 + ((s * 57 + t * 0.018) % 300);
      const sy = 90 + fs * 210;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2.5, 2.5);
    }
  }

  // ZON-05: Cueva Umbría — cascadas de magma viva y arcos eléctricos violetas
  if (desbloqueada("ZON-05")) {
    const magma = 0.62 + Math.sin(t * 0.0052) * 0.35;
    dibujarHaloFuego(ctx, 1472, 345, 36, 0.48 * magma, "rgba(253, 224, 71, 0.9)", "rgba(234, 88, 12, 0.35)");
    dibujarHaloFuego(ctx, 1412, 470, 42, 0.42 * magma, "rgba(251, 146, 60, 0.9)", "rgba(220, 38, 38, 0.3)");
    dibujarHaloFuego(ctx, 1492, 465, 38, 0.42 * magma, "rgba(251, 146, 60, 0.9)", "rgba(220, 38, 38, 0.3)");

    const flujo = (t * 0.036) % 28;
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(1470, Math.round(315 + flujo * 2.2), 3, 5);
    ctx.fillRect(1402, Math.round(455 + (flujo % 24) * 1.9), 3, 5);
    ctx.fillRect(1484, Math.round(448 + ((flujo + 12) % 24) * 1.9), 3, 5);
    dibujarChispasAscendentes(ctx, 1455, 480, 9, 80, 82, t * 0.95, "#fdba74");

    // Pulso violeta + arco eléctrico sutil sobre el cristal norte
    const arc = Math.max(0, Math.sin(t * 0.008));
    dibujarHaloFuego(ctx, 1518, 298, 46, 0.42 + arc * 0.25, "rgba(232, 121, 249, 0.9)", "rgba(147, 51, 234, 0.35)");
    dibujarHaloFuego(ctx, 1344, 368, 32, 0.35 + arc * 0.2, "rgba(216, 180, 254, 0.85)", "rgba(147, 51, 234, 0.3)");
    if (Math.sin(t * 0.017) > 0.72) {
      ctx.save();
      ctx.strokeStyle = "rgba(245, 208, 254, 0.88)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(1468, 266);
      ctx.lineTo(1494, 248);
      ctx.lineTo(1522, 264);
      ctx.lineTo(1552, 244);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ZON-06: La Cumbre — cortinas ondulantes de aurora boreal, cristales glaciares y nevada ártica
  if (desbloqueada("ZON-06")) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const onda = Math.sin(t * 0.0018) * 14;
    const gradAurora = ctx.createLinearGradient(890, 16, 1280, 72);
    gradAurora.addColorStop(0, "rgba(16, 185, 129, 0)");
    gradAurora.addColorStop(0.35, `rgba(52, 211, 153, ${0.22 + Math.sin(t * 0.003) * 0.08})`);
    gradAurora.addColorStop(0.68, `rgba(56, 189, 248, ${0.24 + Math.cos(t * 0.0025) * 0.08})`);
    gradAurora.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.strokeStyle = gradAurora;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(890, 48 + onda * 0.4);
    ctx.quadraticCurveTo(1085, 16 - onda * 0.6, 1290, 44 + onda * 0.3);
    ctx.stroke();
    ctx.restore();

    for (const [cx, cy] of [
      [878, 62],
      [986, 125],
      [1242, 130],
    ]) {
      const d = 0.55 + Math.sin(t * 0.004 + cx) * 0.4;
      dibujarHaloFuego(ctx, cx, cy, 28, 0.36 * d, "rgba(224, 242, 254, 0.9)", "rgba(56, 189, 248, 0.35)");
    }

    ctx.fillStyle = "rgba(224, 242, 254, 0.72)";
    for (let n = 0; n < 14; n++) {
      const fn = (t * 0.00042 + n * 0.09) % 1;
      const sx = 830 + ((n * 47 + t * 0.022) % 440);
      const sy = 18 + fn * 185;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2.5, 2.5);
    }
  }
}
