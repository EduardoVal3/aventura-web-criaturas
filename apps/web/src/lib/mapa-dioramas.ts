/**
 * Motor híbrido 2D de océano vivo, oleaje costero e iluminación a 60 FPS sobre el mapa transparente (3232x1794 -> 1616x897).
 * Dibuja el océano abisal completo entre las islas y bajo los puentes, espumas costeras animadas,
 * sombras de altura 2.5D y efectos calibrados píxel a píxel sobre los 9 biomas y 10 puentes Bezier.
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
 * Curvas Bezier cuadráticas calibradas sobre los 10 puentes reales en el espacio lógico 1616x897.
 */
export const TRAYECTOS_PUENTES_AETHELGARD: readonly TrayectoPuenteMapa[] = [
  {
    origenId: "LOC-01",
    destinoId: "ZON-01",
    inicio: { x: 146, y: 582 },
    control: { x: 148, y: 514 },
    fin: { x: 250, y: 488 },
  },
  {
    origenId: "LOC-01",
    destinoId: "ZON-02",
    inicio: { x: 412, y: 704 },
    control: { x: 516, y: 702 },
    fin: { x: 622, y: 704 },
  },
  {
    origenId: "ZON-01",
    destinoId: "LOC-02",
    inicio: { x: 332, y: 466 },
    control: { x: 412, y: 432 },
    fin: { x: 474, y: 462 },
  },
  {
    origenId: "ZON-02",
    destinoId: "ZON-03",
    inicio: { x: 1016, y: 716 },
    control: { x: 1074, y: 696 },
    fin: { x: 1134, y: 716 },
  },
  {
    origenId: "LOC-02",
    destinoId: "ZON-03",
    inicio: { x: 768, y: 514 },
    control: { x: 942, y: 434 },
    fin: { x: 1128, y: 608 },
  },
  {
    origenId: "LOC-02",
    destinoId: "ZON-04",
    inicio: { x: 740, y: 422 },
    control: { x: 820, y: 386 },
    fin: { x: 892, y: 348 },
  },
  {
    origenId: "ZON-04",
    destinoId: "LOC-03",
    inicio: { x: 744, y: 286 },
    control: { x: 684, y: 242 },
    fin: { x: 614, y: 248 },
  },
  {
    origenId: "ZON-04",
    destinoId: "ZON-05",
    inicio: { x: 1116, y: 336 },
    control: { x: 1190, y: 312 },
    fin: { x: 1262, y: 344 },
  },
  {
    origenId: "LOC-03",
    destinoId: "ZON-06",
    inicio: { x: 622, y: 166 },
    control: { x: 697, y: 104 },
    fin: { x: 784, y: 98 },
  },
  {
    origenId: "ZON-05",
    destinoId: "ZON-06",
    inicio: { x: 1326, y: 224 },
    control: { x: 1268, y: 152 },
    fin: { x: 1194, y: 150 },
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
 * Calcula el factor radial orgánico multi-lóbulo de una isla para trazar aros y nieblas naturales.
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
 * Construye la geometría base determinista de una isla (segura en Node para pruebas unitarias).
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
  escalaX = 1,
  escalaY = escalaX,
): void {
  ctx.beginPath();
  for (let i = 0; i < puntos.length; i++) {
    const px = puntos[i].x * escalaX + dx;
    const py = puntos[i].y * escalaY + dy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * Dibuja el océano abisal completo por debajo de todo el archipiélago y hasta el horizonte infinito,
 * con corrientes marinas, brillos lunares y crestas de olas visibles incluso bajo los arcos de los puentes.
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

  const gradMar = ctx.createLinearGradient(0, -140, 0, DIMENSIONES_MAPA_MUNDO.alto + 160);
  gradMar.addColorStop(0, "#021327");
  gradMar.addColorStop(0.28, "#042342");
  gradMar.addColorStop(0.55, "#052a4e");
  gradMar.addColorStop(0.82, "#031e3a");
  gradMar.addColorStop(1, "#011224");
  ctx.fillStyle = gradMar;
  ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);

  // Reflejo abisal tenue entre canales internos y zona volcánica/glacial
  ctx.save();
  const canalCentral = ctx.createRadialGradient(808, 480, 90, 808, 480, 780);
  canalCentral.addColorStop(0, "rgba(14, 116, 144, 0.2)");
  canalCentral.addColorStop(0.55, "rgba(6, 78, 115, 0.1)");
  canalCentral.addColorStop(1, "rgba(2, 19, 39, 0)");
  ctx.fillStyle = canalCentral;
  ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);

  // Crestas pixel-art continuas en todo el mar visible (visibles entre islas y bajo puentes)
  const pasoX = 112;
  const pasoY = 64;
  const colIni = Math.floor(xMin / pasoX) * pasoX;
  const rowIni = Math.floor(yMin / pasoY) * pasoY;

  for (let oy = rowIni; oy <= yMax; oy += pasoY) {
    const filaIdx = Math.round(oy / pasoY);
    const vaiven = Math.sin(t * 0.0014 + filaIdx * 0.85) * 14;
    for (let ox = colIni; ox <= xMax; ox += pasoX) {
      const colIdx = Math.round(ox / pasoX);
      const desfase = ((colIdx * 37 + filaIdx * 19) % 29) * 0.6;
      const brillo = 0.09 + 0.06 * Math.sin(t * 0.002 + colIdx + filaIdx);
      ctx.fillStyle = `rgba(125, 211, 252, ${brillo.toFixed(3)})`;
      ctx.fillRect(Math.round(ox + vaiven + desfase), oy, 18, 2);
      ctx.fillRect(Math.round(ox + 48 - vaiven * 0.7), oy + 30, 12, 2);
    }
  }
  ctx.restore();
}

/**
 * Dibuja debajo de la lámina transparente las sombras de profundidad marina bajo puentes y acantilados,
 * anillos animados de espuma costera ajustados a la base rocosa inferior y salpicaduras en cascadas/lava.
 */
export function dibujarAguasCosterasMapa(
  ctx: CanvasRenderingContext2D,
  nodos: NodoMapaTerritorial[],
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  const t = reducirMovimiento ? 0 : tiempo;
  const pulsoMar = Math.sin(t * 0.0024);

  // 1. Sombra profunda proyectada por los 10 puentes sobre el agua
  ctx.save();
  ctx.strokeStyle = "rgba(1, 8, 20, 0.5)";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  for (const ruta of TRAYECTOS_PUENTES_AETHELGARD) {
    ctx.beginPath();
    ctx.moveTo(ruta.inicio.x, ruta.inicio.y + 18);
    ctx.quadraticCurveTo(ruta.control.x, ruta.control.y + 20, ruta.fin.x, ruta.fin.y + 18);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Sombra marina inferior y espuma de marea únicamente alrededor de la base rocosa de cada isla
  for (const nodo of nodos) {
    const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
    if (!isla) continue;

    // Anclar el agua en la mitad inferior de cada isla para no invadir picos ni cielos del norte
    const baseY = isla.y + isla.radioY * 0.36;
    const rxBase = isla.radioX * 0.94;
    const ryBase = isla.radioY * 0.62;

    ctx.save();
    const sombra = ctx.createRadialGradient(
      isla.x,
      baseY + 12,
      rxBase * 0.35,
      isla.x,
      baseY + 14,
      rxBase * 1.14,
    );
    sombra.addColorStop(0, "rgba(1, 8, 22, 0.68)");
    sombra.addColorStop(0.7, "rgba(1, 12, 30, 0.38)");
    sombra.addColorStop(1, "rgba(1, 14, 34, 0)");
    ctx.fillStyle = sombra;
    ctx.beginPath();
    ctx.ellipse(isla.x, baseY + 14, rxBase * 1.14, ryBase * 1.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Estela de espuma costera respirando junto al acantilado
    const expansion = 1.02 + pulsoMar * 0.018;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.22 + (pulsoMar + 1) * 0.05})`;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(isla.x, baseY + 6, rxBase * expansion, ryBase * expansion, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 + (1 - pulsoMar) * 0.04})`;
    ctx.lineWidth = 1.6;
    const expansionExterna = 1.08 + ((t * 0.00028) % 0.06);
    ctx.beginPath();
    ctx.ellipse(
      isla.x,
      baseY + 8,
      rxBase * expansionExterna,
      ryBase * expansionExterna,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }

  // 3. Interacciones térmicas e hidráulicas donde cascadas y magma tocan el océano (1616x897)
  // Espuma en caída de cascada de Puesto del Río (742, 548)
  ctx.save();
  const faseCascada = (t * 0.0012) % 1;
  ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - faseCascada) * 0.56})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(742, 550, 16 + faseCascada * 18, 6 + faseCascada * 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vapor cálido donde caen las cascadas de magma de Cueva Umbría al mar
  for (const [vx, vy] of [
    [1323, 482],
    [1408, 492],
    [1528, 486],
  ]) {
    dibujarHaloFuego(ctx, vx, vy, 28, 0.34, "rgba(251, 146, 60, 0.72)", "rgba(234, 88, 12, 0.2)");
  }
  ctx.restore();
}

/**
 * Respaldo limpio mientras carga o decodifica el asset principal transparente.
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
    trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 18, 0.94);
    ctx.fill();
    ctx.fillStyle = isla.colorSuelo;
    trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 0.94);
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
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx), Math.round(cy), 2.5, 2.5);
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
    const hx = x + Math.sin(fase * 5 + i) * 6 + fase * 7;
    const hy = y - fase * 32;
    ctx.fillStyle = esOscuro
      ? `rgba(148, 163, 184, ${(1 - fase) * 0.34})`
      : `rgba(226, 232, 240, ${(1 - fase) * 0.3})`;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.5 + fase * 5.5, 0, Math.PI * 2);
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
      ctx.strokeStyle = "rgba(4, 9, 22, 0.52)";
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
    ctx.lineWidth = 5;
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
      ctx.arc(ox, oy, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Superpone toda la capa viva 60 FPS recalibrada píxel a píxel sobre la lámina transparente (1616x897):
 * velos de niebla ceñidos a zonas bloqueadas, aro rúnico de ubicación actual, orbes en 10 puentes
 * y efectos ambientales sincronizados con cada monumento, cascada, cráter, antorcha y cristal.
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

  // 1. Velo oscuro ceñido a islas bloqueadas y aro rúnico costero en la ubicación actual
  for (const nodo of nodos) {
    const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
    if (!isla) continue;

    if (!nodo.desbloqueada) {
      ctx.save();
      const gradNiebla = ctx.createRadialGradient(
        isla.x,
        isla.y,
        isla.radioX * 0.18,
        isla.x,
        isla.y,
        isla.radioX * 1.05,
      );
      gradNiebla.addColorStop(0, "rgba(3, 9, 22, 0.56)");
      gradNiebla.addColorStop(0.7, "rgba(3, 9, 22, 0.4)");
      gradNiebla.addColorStop(1, "rgba(3, 9, 22, 0)");
      ctx.fillStyle = gradNiebla;
      const geomBloq = generarGeometriaDiorama(isla);
      trazarPoligonoLocal(ctx, geomBloq.contornoLocal, isla.x, isla.y, 1.02);
      ctx.fill();
      ctx.restore();
    }

    if (nodo.id === ubicacionActualId) {
      const geom = generarGeometriaDiorama(isla);
      const pulso = 0.72 + Math.sin(t * 0.004) * 0.28;
      ctx.save();
      ctx.translate(isla.x, isla.y + 8);
      ctx.setLineDash([13, 9]);
      ctx.lineDashOffset = -(t * 0.032);
      ctx.strokeStyle = `rgba(20, 209, 232, ${0.88 * pulso})`;
      ctx.lineWidth = 3;
      trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 1.01);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.24 * pulso})`;
      ctx.lineWidth = 7.5;
      trazarPoligonoLocal(ctx, geom.contornoLocal, 0, 0, 1.03);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. Puentes activos y flujo guiado sobre las pasarelas reales
  dibujarPuentesYRutasVivas(ctx, nodosPorId, conexionesPorId, ubicacionActualId, t);

  // 3. Efectos ambientales recalibrados por centroide real sobre la lámina 1616x897
  const desbloqueada = (id: string) => Boolean(nodosPorId.get(id)?.desbloqueada);

  // LOC-01: Villa Serena — fuente central (237, 675), faroles exactos de plaza y 3 chimeneas sobre tejados
  if (desbloqueada("LOC-01")) {
    const pulsoFuente = 0.7 + Math.sin(t * 0.005) * 0.3;
    dibujarHaloFuego(ctx, 237, 675, 32, 0.44 * pulsoFuente, "rgba(165, 243, 252, 0.92)", "rgba(20, 209, 232, 0.35)");
    dibujarChispasAscendentes(ctx, 237, 671, 5, 8, 18, t, "#a5f3fc");

    const faroles: [number, number][] = [
      [153, 675],
      [213, 628],
      [262, 634],
      [217, 750],
      [256, 754],
      [339, 679],
      [179, 650],
      [161, 763],
    ];
    for (const [fx, fy] of faroles) {
      const f = 0.72 + Math.sin(t * 0.009 + fx) * 0.28;
      dibujarHaloFuego(ctx, fx, fy, 16, 0.45 * f, "rgba(254, 240, 138, 0.92)", "rgba(245, 158, 11, 0.32)");
    }
    dibujarHumoChimenea(ctx, 106, 616, t);
    dibujarHumoChimenea(ctx, 262, 578, t + 900);
    dibujarHumoChimenea(ctx, 314, 624, t + 1800);
  }

  // ZON-01: Praderas — los 5 monolitos rúnicos exactos y motas doradas de pradera
  if (desbloqueada("ZON-01")) {
    const runas: [number, number][] = [
      [81, 398],
      [147, 344],
      [133, 451],
      [249, 392],
      [288, 381],
    ];
    for (const [rx, ry] of runas) {
      const p = 0.45 + Math.sin(t * 0.0038 + rx * 0.05) * 0.45;
      dibujarHaloFuego(ctx, rx, ry, 22, 0.46 * p, "rgba(110, 231, 183, 0.92)", "rgba(20, 209, 232, 0.35)");
    }
    dibujarChispasAscendentes(ctx, 195, 425, 6, 80, 40, t * 0.7, "#fde047");
  }

  // LOC-02: Puesto del Río — las 4 atalayas encendidas (525,415 / 637,368 / 638,442 / 762,427), fogatas y cascada (742)
  if (desbloqueada("LOC-02")) {
    const pebeteros: [number, number][] = [
      [525, 415],
      [637, 368],
      [638, 442],
      [762, 427],
    ];
    for (const [bx, by] of pebeteros) {
      const f = 0.75 + Math.sin(t * 0.013 + bx) * 0.25;
      dibujarHaloFuego(ctx, bx, by, 24, 0.62 * f, "rgba(254, 240, 138, 0.95)", "rgba(249, 115, 22, 0.45)");
      dibujarChispasAscendentes(ctx, bx, by - 5, 3, 5, 22, t, "#fdba74");
    }
    for (const [fx, fy] of [
      [589, 466],
      [676, 395],
    ]) {
      const f = 0.65 + Math.sin(t * 0.01 + fx) * 0.35;
      dibujarHaloFuego(ctx, fx, fy, 15, 0.44 * f, "rgba(253, 186, 116, 0.88)", "rgba(234, 88, 12, 0.3)");
    }

    // Estelas blancas animadas centradas en el caudal real de la cascada (x = 732..752)
    const despRio = (t * 0.05) % 18;
    ctx.save();
    ctx.fillStyle = "rgba(224, 242, 254, 0.72)";
    for (let w = 0; w < 52; w += 10) {
      const cx = 733 + (w % 4) * 5;
      const cy = 482 + ((w + despRio) % 62);
      ctx.fillRect(Math.round(cx), Math.round(cy), 2.5, 7);
    }
    const espuma = 0.68 + Math.sin(t * 0.0065) * 0.32;
    ctx.fillStyle = `rgba(224, 242, 254, ${0.6 * espuma})`;
    ctx.beginPath();
    ctx.ellipse(742, 545, 19, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ZON-02: Lago Espejo — espejo lacustre (806, 720) y los 5 grupos de cristales cian/violeta exactos
  if (desbloqueada("ZON-02")) {
    const reflejo = 0.55 + Math.sin(t * 0.0032) * 0.35;
    dibujarHaloFuego(ctx, 806, 720, 56, 0.28 * reflejo, "rgba(103, 232, 249, 0.72)", "rgba(168, 85, 247, 0.28)");

    ctx.save();
    ctx.fillStyle = `rgba(186, 230, 253, ${0.26 * reflejo})`;
    for (let r = 0; r < 3; r++) {
      const rx = 790 + Math.sin(t * 0.002 + r * 2) * 14;
      const ry = 708 + r * 12;
      ctx.fillRect(Math.round(rx), ry, 24 - r * 4, 2);
    }
    ctx.restore();

    const cristales: [number, number][] = [
      [689, 705],
      [839, 652],
      [969, 698],
      [781, 785],
      [942, 775],
    ];
    for (const [cx, cy] of cristales) {
      const k = 0.5 + Math.sin(t * 0.0045 + cx * 0.1) * 0.45;
      dibujarHaloFuego(ctx, cx, cy, 20, 0.46 * k, "rgba(165, 243, 252, 0.92)", "rgba(6, 182, 212, 0.32)");
    }
    dibujarChispasAscendentes(ctx, 806, 738, 6, 68, 44, t * 0.6, "#a5f3fc");
  }

  // ZON-03: Bosque — aura en escalinata/trono de piedra (1392, 672) y luciérnagas esmeralda en el claro
  if (desbloqueada("ZON-03")) {
    const auro = 0.65 + Math.sin(t * 0.0034) * 0.3;
    dibujarHaloFuego(ctx, 1392, 672, 42, 0.32 * auro, "rgba(74, 222, 128, 0.85)", "rgba(16, 185, 129, 0.22)");
    for (let i = 0; i < 12; i++) {
      const ang = t * 0.001 + i * 0.85;
      const lx = 1380 + Math.cos(ang) * (36 + (i % 5) * 24);
      const ly = 684 + Math.sin(ang * 1.4 + i) * (22 + (i % 4) * 13);
      const brillo = 0.45 + Math.sin(t * 0.005 + i) * 0.45;
      ctx.fillStyle = `rgba(74, 222, 128, ${brillo})`;
      ctx.fillRect(Math.round(lx), Math.round(ly), 3, 3);
    }
  }

  // ZON-04: Riscos — grietas ardientes reales (902, 1071, 1018, 905, 1061, 1066, 949) y columnas de humo
  if (desbloqueada("ZON-04")) {
    const brasa = 0.55 + Math.sin(t * 0.0045) * 0.38;
    const grietas: [number, number][] = [
      [902, 255],
      [1071, 266],
      [1018, 341],
      [905, 346],
      [1061, 387],
      [1066, 420],
      [949, 419],
    ];
    for (const [gx, gy] of grietas) {
      dibujarHaloFuego(ctx, gx, gy, 24, 0.3 * brasa, "rgba(251, 146, 60, 0.9)", "rgba(220, 38, 38, 0.28)");
    }
    dibujarHumoChimenea(ctx, 900, 232, t, true);
    dibujarHumoChimenea(ctx, 1002, 224, t + 1100, true);
    dibujarChispasAscendentes(ctx, 985, 348, 6, 72, 52, t * 0.8, "#fb923c");
  }

  // LOC-03: Bastión Norte — las 3 torres exactas (364, 103), (477, 151), (584, 99) y nieve ligera
  if (desbloqueada("LOC-03")) {
    const torres: [number, number][] = [
      [364, 103],
      [477, 151],
      [584, 99],
    ];
    for (const [tx, ty] of torres) {
      const f = 0.72 + Math.sin(t * 0.011 + tx) * 0.28;
      dibujarHaloFuego(ctx, tx, ty, 30, 0.65 * f, "rgba(254, 240, 138, 0.95)", "rgba(249, 115, 22, 0.45)");
      dibujarChispasAscendentes(ctx, tx, ty - 5, 4, 6, 24, t, "#fde047");
    }
    ctx.fillStyle = "rgba(224, 242, 254, 0.62)";
    for (let s = 0; s < 10; s++) {
      const fs = (t * 0.00035 + s * 0.11) % 1;
      const sx = 300 + ((s * 53 + t * 0.018) % 350);
      const sy = 38 + fs * 215;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2.5, 2.5);
    }
  }

  // ZON-05: Cueva Umbría — caída en boca (1452, 314..352), 3 cascadas en acantilado (1326, 1412, 1525) y cristales violetas
  if (desbloqueada("ZON-05")) {
    const magma = 0.62 + Math.sin(t * 0.0052) * 0.35;
    dibujarHaloFuego(ctx, 1452, 352, 36, 0.5 * magma, "rgba(253, 224, 71, 0.92)", "rgba(234, 88, 12, 0.36)");
    dibujarHaloFuego(ctx, 1324, 474, 30, 0.42 * magma, "rgba(251, 146, 60, 0.9)", "rgba(220, 38, 38, 0.3)");
    dibujarHaloFuego(ctx, 1412, 476, 44, 0.46 * magma, "rgba(251, 146, 60, 0.92)", "rgba(220, 38, 38, 0.34)");
    dibujarHaloFuego(ctx, 1526, 478, 30, 0.42 * magma, "rgba(251, 146, 60, 0.9)", "rgba(220, 38, 38, 0.3)");

    const flujo = (t * 0.036) % 28;
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(1451, Math.round(298 + (flujo % 24) * 2.2), 3, 5);
    ctx.fillRect(1325, Math.round(422 + (flujo % 20) * 2.5), 3, 5);
    ctx.fillRect(1408, Math.round(426 + ((flujo + 9) % 22) * 2.7), 3, 6);
    ctx.fillRect(1418, Math.round(428 + ((flujo + 16) % 22) * 2.5), 2.5, 5);
    ctx.fillRect(1524, Math.round(426 + ((flujo + 13) % 20) * 2.6), 3, 5);
    dibujarChispasAscendentes(ctx, 1425, 470, 9, 80, 78, t * 0.95, "#fdba74");

    // Pulsos violetas en los 3 grupos de cristales reales y arco eléctrico en las puntas del cristal gigante
    const arc = Math.max(0, Math.sin(t * 0.008));
    dibujarHaloFuego(ctx, 1317, 328, 34, 0.38 + arc * 0.2, "rgba(216, 180, 254, 0.88)", "rgba(147, 51, 234, 0.32)");
    dibujarHaloFuego(ctx, 1526, 255, 48, 0.46 + arc * 0.25, "rgba(232, 121, 249, 0.92)", "rgba(147, 51, 234, 0.36)");
    dibujarHaloFuego(ctx, 1548, 358, 30, 0.36 + arc * 0.18, "rgba(216, 180, 254, 0.86)", "rgba(147, 51, 234, 0.3)");

    if (Math.sin(t * 0.017) > 0.72) {
      ctx.save();
      ctx.strokeStyle = "rgba(245, 208, 254, 0.92)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(1492, 224);
      ctx.lineTo(1522, 206);
      ctx.lineTo(1546, 226);
      ctx.lineTo(1570, 208);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ZON-06: La Cumbre — aurora boreal sobre los picos nevados y los 4 cristales glaciares exactos
  if (desbloqueada("ZON-06")) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const onda = Math.sin(t * 0.0018) * 10;
    const gradAurora = ctx.createLinearGradient(875, 10, 1245, 58);
    gradAurora.addColorStop(0, "rgba(16, 185, 129, 0)");
    gradAurora.addColorStop(0.32, `rgba(52, 211, 153, ${0.22 + Math.sin(t * 0.003) * 0.07})`);
    gradAurora.addColorStop(0.68, `rgba(56, 189, 248, ${0.24 + Math.cos(t * 0.0025) * 0.07})`);
    gradAurora.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.strokeStyle = gradAurora;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(875, 42 + onda * 0.35);
    ctx.quadraticCurveTo(1055, 8 - onda * 0.55, 1245, 36 + onda * 0.3);
    ctx.stroke();
    ctx.restore();

    for (const [cx, cy] of [
      [848, 72],
      [933, 94],
      [1247, 114],
      [1172, 178],
    ]) {
      const d = 0.55 + Math.sin(t * 0.004 + cx) * 0.4;
      dibujarHaloFuego(ctx, cx, cy, 26, 0.38 * d, "rgba(224, 242, 254, 0.92)", "rgba(56, 189, 248, 0.35)");
    }

    ctx.fillStyle = "rgba(224, 242, 254, 0.72)";
    for (let n = 0; n < 14; n++) {
      const fn = (t * 0.00042 + n * 0.09) % 1;
      const sx = 790 + ((n * 45 + t * 0.022) % 495);
      const sy = 14 + fn * 195;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2.5, 2.5);
    }
  }
}
