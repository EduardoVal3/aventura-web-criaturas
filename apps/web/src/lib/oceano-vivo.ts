/**
 * Motor oceánico multicapa 2.5D a 60 FPS para el mapa interactivo de Aethelgard (1616x897).
 * Extrae una sola vez la máscara real de tierra y puentes desde el canal alfa del WebP maestro,
 * cachea batimetría y cáusticas fuera de pantalla sin asignaciones por cuadro y anima corrientes,
 * oleaje, resaca por clima regional, hielo glacial, estelas portuarias, vapor térmico y fauna marina.
 */
import { CONFIGURACION_ISLAS_MAPA, DIMENSIONES_MAPA_MUNDO } from "./mapa-mundo.ts";
import { TRAYECTOS_PUENTES_AETHELGARD, type Punto2D, type VistaCamaraMundo } from "./mapa-dioramas.ts";

export const MASCARA_OCEANO_ANCHO = 808;
export const MASCARA_OCEANO_ALTO = 449;
export const ESCALA_MASCARA_OCEANO = 0.5;
const UMBRAL_ALFA_TIERRA = 110;
const DISTANCIA_MAXIMA_CAMPO = 255;

export type ClimaCostero = "glacial" | "templado" | "mistico" | "volcanico";

const CODIGO_A_CLIMA: readonly ClimaCostero[] = ["glacial", "templado", "mistico", "volcanico"];

const BIOMA_A_CLIMA: Record<string, number> = {
  bastion: 0,
  glaciar: 0,
  puerto: 1,
  pradera: 1,
  puesto: 1,
  lago: 2,
  bosque: 2,
  riscos: 3,
  volcan: 3,
};

export interface MascaraOceano {
  ancho: number;
  alto: number;
  escala: number;
  tierra: Uint8Array;
  distanciaMar: Uint8Array;
  distanciaSinPuentes: Uint8Array;
  esFrenteAcantilado: Uint8Array;
  climaPorCelda: Uint8Array;
}

export interface PuntoEspuma {
  x: number;
  y: number;
  nx: number;
  ny: number;
  clima: ClimaCostero;
  fase: number;
  ancho: number;
}

export interface MuestraCorriente {
  x: number;
  y: number;
  tx: number;
  ty: number;
}

export interface CorrienteMarina {
  muestras: MuestraCorriente[];
  ancho: number;
  fase: number;
  velocidad: number;
}

export interface CardumenPeces {
  centro: Punto2D;
  radioX: number;
  radioY: number;
  velocidad: number;
  fase: number;
  cantidad: number;
  tono: "cian" | "turquesa";
}

export interface BloqueHielo {
  x: number;
  y: number;
  radio: number;
  fase: number;
  amplitudX: number;
  amplitudY: number;
  variante: number;
}

export interface MedusaMistica {
  x: number;
  y: number;
  radio: number;
  fase: number;
  amplitudY: number;
  color: "cian" | "violeta";
}

export interface MotaPlancton {
  x: number;
  y: number;
  fase: number;
  tamano: number;
  esmeralda: boolean;
}

export interface EstelaSuperficie {
  x: number;
  y: number;
  dx: number;
  dy: number;
  fase: number;
  tamano: number;
}

export interface AveMarina {
  centro: Punto2D;
  radioX: number;
  radioY: number;
  velocidad: number;
  fase: number;
  cantidad: number;
}

export type EspecieSiluetaSubmarina =
  | "mosasaurus"
  | "plesiosaurio"
  | "mantarraya"
  | "kraken"
  | "ballena";

export interface SiluetaSubmarina {
  especie: EspecieSiluetaSubmarina;
  centro: Punto2D;
  radioX: number;
  radioY: number;
  escala: number;
  velocidad: number;
  fase: number;
  permitirBajoPuente: boolean;
  matiz: "abisal" | "glacial" | "mistico";
}

export type EspecieAvistamientoAbisal = "leviatan" | "mosasaurus" | "kraken";

export interface AvistamientoAbisal {
  especie: EspecieAvistamientoAbisal;
  centro: Punto2D;
  escala: number;
  duracionCiclo: number;
  duracionAparicion: number;
  desfase: number;
  direccion: 1 | -1;
}

export interface DatosOceanoVivo {
  puntosEspuma: PuntoEspuma[];
  corrientes: CorrienteMarina[];
  cardumenes: CardumenPeces[];
  bloquesHielo: BloqueHielo[];
  medusas: MedusaMistica[];
  plancton: MotaPlancton[];
  estelasV: EstelaSuperficie[];
  aves: AveMarina[];
  zonasLeviatan: Punto2D[];
  siluetasSubmarinas: SiluetaSubmarina[];
  avistamientosAbisales: AvistamientoAbisal[];
}

export interface RecursosOceanoVivo {
  mascara: MascaraOceano;
  datos: DatosOceanoVivo;
  canvasBatimetria: HTMLCanvasElement;
  canvasCausticas: HTMLCanvasElement;
}

interface CajasPlacas {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface CacheGradientesContexto {
  gradMar: CanvasGradient;
  glowCentral: CanvasGradient;
  patronCausticas: CanvasPattern | null;
}

const cacheGradientesPorCtx = new WeakMap<CanvasRenderingContext2D, CacheGradientesContexto>();

const CAJAS_PLACAS_MAPA: readonly CajasPlacas[] = Object.values(CONFIGURACION_ISLAS_MAPA).map((isla) => {
  const px = isla.x + (isla.placaOffsetX ?? 0);
  const py = isla.y + (isla.placaOffsetY ?? isla.radioY + 38);
  return { x0: px - 102, y0: py - 24, x1: px + 102, y1: py + 24 };
});

const MUESTRAS_PUENTES: readonly Punto2D[] = (() => {
  const puntos: Punto2D[] = [];
  for (const ruta of TRAYECTOS_PUENTES_AETHELGARD) {
    const pasos = 18;
    for (let i = 2; i <= pasos - 2; i++) {
      const u = i / pasos;
      const inv = 1 - u;
      puntos.push({
        x: inv * inv * ruta.inicio.x + 2 * inv * u * ruta.control.x + u * u * ruta.fin.x,
        y: inv * inv * ruta.inicio.y + 2 * inv * u * ruta.control.y + u * u * ruta.fin.y,
      });
    }
  }
  return puntos;
})();

function crearPrng(semillaInicial: number): () => number {
  let estado = semillaInicial >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCelda(col: number, fila: number): number {
  let h = (Math.imul(col, 374761393) + Math.imul(fila, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function distanciaMinimaPuenteCuadrada(lx: number, ly: number): number {
  let minD2 = Number.POSITIVE_INFINITY;
  for (let i = 0; i < MUESTRAS_PUENTES.length; i++) {
    const p = MUESTRAS_PUENTES[i];
    const dx = lx - p.x;
    const dy = ly - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < minD2) minD2 = d2;
  }
  return minD2;
}

function estaCercaDePlaca(lx: number, ly: number, holgura = 6): boolean {
  for (let i = 0; i < CAJAS_PLACAS_MAPA.length; i++) {
    const c = CAJAS_PLACAS_MAPA[i];
    if (
      lx >= c.x0 - holgura &&
      lx <= c.x1 + holgura &&
      ly >= c.y0 - holgura &&
      ly <= c.y1 + holgura
    ) {
      return true;
    }
  }
  return false;
}

function resolverIslaMasCercana(lx: number, ly: number): { id: string; codigoClima: number; enZonaAcantilado: boolean } {
  let mejorId = "LOC-01";
  let mejorScore = Number.POSITIVE_INFINITY;
  for (const isla of Object.values(CONFIGURACION_ISLAS_MAPA)) {
    const nx = (lx - isla.x) / Math.max(40, isla.radioX);
    const ny = (ly - isla.y) / Math.max(40, isla.radioY);
    const d2 = nx * nx + ny * ny;
    if (d2 < mejorScore) {
      mejorScore = d2;
      mejorId = isla.id;
    }
  }
  const isla = CONFIGURACION_ISLAS_MAPA[mejorId];
  const bioma = isla?.bioma ?? "pradera";
  const enZonaAcantilado = isla ? ly >= isla.y - isla.radioY * 0.14 : true;
  return { id: mejorId, codigoClima: BIOMA_A_CLIMA[bioma] ?? 1, enZonaAcantilado };
}

function calcularCampoDistancia(
  tierra: Uint8Array,
  ancho: number,
  alto: number,
  escala: number,
): Uint8Array {
  const total = ancho * alto;
  const exacto = new Float32Array(total);
  const pasoOrtho = 1 / escala;
  const pasoDiag = Math.SQRT2 / escala;

  for (let i = 0; i < total; i++) {
    exacto[i] = tierra[i] ? 0 : DISTANCIA_MAXIMA_CAMPO;
  }

  for (let y = 0; y < alto; y++) {
    const fila = y * ancho;
    for (let x = 0; x < ancho; x++) {
      const idx = fila + x;
      let d = exacto[idx];
      if (d === 0) continue;
      if (y > 0) d = Math.min(d, exacto[idx - ancho] + pasoOrtho);
      if (x > 0) d = Math.min(d, exacto[idx - 1] + pasoOrtho);
      if (y > 0 && x > 0) d = Math.min(d, exacto[idx - ancho - 1] + pasoDiag);
      if (y > 0 && x < ancho - 1) d = Math.min(d, exacto[idx - ancho + 1] + pasoDiag);
      exacto[idx] = d;
    }
  }

  const dist = new Uint8Array(total);
  for (let y = alto - 1; y >= 0; y--) {
    const fila = y * ancho;
    for (let x = ancho - 1; x >= 0; x--) {
      const idx = fila + x;
      let d = exacto[idx];
      if (d > 0) {
        if (y < alto - 1) d = Math.min(d, exacto[idx + ancho] + pasoOrtho);
        if (x < ancho - 1) d = Math.min(d, exacto[idx + 1] + pasoOrtho);
        if (y < alto - 1 && x < ancho - 1) d = Math.min(d, exacto[idx + ancho + 1] + pasoDiag);
        if (y < alto - 1 && x > 0) d = Math.min(d, exacto[idx + ancho - 1] + pasoDiag);
      }
      exacto[idx] = d;
      dist[idx] = d >= DISTANCIA_MAXIMA_CAMPO ? DISTANCIA_MAXIMA_CAMPO : Math.round(d);
    }
  }

  return dist;
}

/**
 * Construye la máscara marina, el campo de distancias 2-pass y la detección 2.5D de acantilados
 * a partir de un búfer alfa lineal (seguro en Node para pruebas deterministas).
 */
export function analizarMascaraAlfaOceano(
  alfa: Uint8Array,
  ancho = MASCARA_OCEANO_ANCHO,
  alto = MASCARA_OCEANO_ALTO,
  escala = ESCALA_MASCARA_OCEANO,
): MascaraOceano {
  const total = ancho * alto;
  const tierra = new Uint8Array(total);
  const tierraSinPuentes = new Uint8Array(total);
  const climaPorCelda = new Uint8Array(total);
  const radioPuente2 = 22 * 22;
  const radioEspumaPuente2 = 28 * 28;

  for (let y = 0; y < alto; y++) {
    const ly = y / escala;
    const fila = y * ancho;
    for (let x = 0; x < ancho; x++) {
      const idx = fila + x;
      const lx = x / escala;
      const esSolido = (alfa[idx] ?? 0) >= UMBRAL_ALFA_TIERRA;
      if (esSolido) {
        tierra[idx] = 1;
        if (distanciaMinimaPuenteCuadrada(lx, ly) > radioPuente2) {
          tierraSinPuentes[idx] = 1;
        }
      }
      climaPorCelda[idx] = resolverIslaMasCercana(lx, ly).codigoClima;
    }
  }

  const distanciaMar = calcularCampoDistancia(tierra, ancho, alto, escala);
  const distanciaSinPuentes = calcularCampoDistancia(tierraSinPuentes, ancho, alto, escala);
  const esFrenteAcantilado = new Uint8Array(total);

  // Detectar agua en la base frontal o lateral inferior de los acantilados (evitando cumbres, torres y puentes)
  const alcanceArriba = Math.max(3, Math.round(12 * escala));
  const alcanceLados = Math.max(2, Math.round(5 * escala));
  for (let y = 0; y < alto; y++) {
    const ly = y / escala;
    const fila = y * ancho;
    for (let x = 0; x < ancho; x++) {
      const idx = fila + x;
      const d = distanciaMar[idx];
      if (d === 0 || d > 16) continue;
      const lx = x / escala;
      if (distanciaMinimaPuenteCuadrada(lx, ly) <= radioEspumaPuente2) continue;
      if (!resolverIslaMasCercana(lx, ly).enZonaAcantilado) continue;

      let tieneRocaEncima = false;
      const yIni = Math.max(0, y - alcanceArriba);
      const xIni = Math.max(0, x - alcanceLados);
      const xFin = Math.min(ancho - 1, x + alcanceLados);
      for (let yy = y; yy >= yIni && !tieneRocaEncima; yy--) {
        const base = yy * ancho;
        for (let xx = xIni; xx <= xFin; xx++) {
          if (tierraSinPuentes[base + xx]) {
            tieneRocaEncima = true;
            break;
          }
        }
      }
      if (tieneRocaEncima) {
        esFrenteAcantilado[idx] = 1;
      }
    }
  }

  return {
    ancho,
    alto,
    escala,
    tierra,
    distanciaMar,
    distanciaSinPuentes,
    esFrenteAcantilado,
    climaPorCelda,
  };
}

/**
 * Consulta en O(1) la distancia en píxeles lógicos al borde sólido más cercano (islas y puentes, o solo islas).
 */
export function consultarDistanciaMar(
  mascara: MascaraOceano,
  lx: number,
  ly: number,
  permitirBajoPuente = false,
): number {
  const gx = Math.floor(lx * mascara.escala);
  const gy = Math.floor(ly * mascara.escala);
  const cx = Math.max(0, Math.min(mascara.ancho - 1, gx));
  const cy = Math.max(0, Math.min(mascara.alto - 1, gy));
  const campo = permitirBajoPuente ? mascara.distanciaSinPuentes : mascara.distanciaMar;
  const distBase = campo[cy * mascara.ancho + cx];

  if (gx === cx && gy === cy) return distBase;
  const excesoX = (gx - cx) / mascara.escala;
  const excesoY = (gy - cy) / mascara.escala;
  return Math.min(DISTANCIA_MAXIMA_CAMPO, distBase + Math.hypot(excesoX, excesoY));
}

/**
 * Indica si una coordenada lógica es agua navegable con un margen libre mínimo respecto a tierra firme.
 */
export function esPosicionNavegable(
  mascara: MascaraOceano,
  lx: number,
  ly: number,
  margenPx = 6,
  permitirBajoPuente = false,
): boolean {
  return consultarDistanciaMar(mascara, lx, ly, permitirBajoPuente) >= margenPx;
}

/**
 * Calcula el vector unitario normal que apunta desde la costa hacia aguas más profundas.
 */
export function consultarNormalAgua(
  mascara: MascaraOceano,
  lx: number,
  ly: number,
  permitirBajoPuente = false,
): Punto2D {
  const paso = 1 / mascara.escala;
  const dx =
    consultarDistanciaMar(mascara, lx + paso, ly, permitirBajoPuente) -
    consultarDistanciaMar(mascara, lx - paso, ly, permitirBajoPuente);
  const dy =
    consultarDistanciaMar(mascara, lx, ly + paso, permitirBajoPuente) -
    consultarDistanciaMar(mascara, lx, ly - paso, permitirBajoPuente);
  const mag = Math.hypot(dx, dy);
  if (mag < 0.001) return { x: 0, y: 1 };
  return { x: dx / mag, y: dy / mag };
}

function muestrearCorrientePorTrayecto(
  mascara: MascaraOceano,
  waypoints: readonly Punto2D[],
  ancho: number,
  fase: number,
  velocidad: number,
): CorrienteMarina | null {
  if (waypoints.length < 2) return null;
  const crudos: Punto2D[] = [];
  const pasosPorTramo = 16;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
    for (let s = 0; s < pasosPorTramo; s++) {
      const u = s / pasosPorTramo;
      const u2 = u * u;
      const u3 = u2 * u;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
      crudos.push({ x, y });
    }
  }
  crudos.push(waypoints[waypoints.length - 1]);

  // Ajustar cualquier punto cercano a una isla usando la normal costera
  const muestras: MuestraCorriente[] = [];
  for (let i = 0; i < crudos.length; i++) {
    let px = crudos[i].x;
    let py = crudos[i].y;
    const distIsla = consultarDistanciaMar(mascara, px, py, true);
    if (distIsla < 8) {
      const n = consultarNormalAgua(mascara, px, py, true);
      px += n.x * (10 - distIsla);
      py += n.y * (10 - distIsla);
      if (consultarDistanciaMar(mascara, px, py, true) < 6) continue;
    }
    const prev = crudos[Math.max(0, i - 1)];
    const next = crudos[Math.min(crudos.length - 1, i + 1)];
    const dtx = next.x - prev.x;
    const dty = next.y - prev.y;
    const mag = Math.max(0.001, Math.hypot(dtx, dty));
    muestras.push({ x: px, y: py, tx: dtx / mag, ty: dty / mag });
  }

  if (muestras.length < 8) return null;
  return { muestras, ancho, fase, velocidad };
}

function encontrarCuencaProfunda(
  mascara: MascaraOceano,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  minDist: number,
  permitirBajoPuente: boolean,
  evitarPlacas: boolean,
): (Punto2D & { dist: number }) | null {
  const gx0 = Math.max(2, Math.floor(x0 * mascara.escala));
  const gy0 = Math.max(2, Math.floor(y0 * mascara.escala));
  const gx1 = Math.min(mascara.ancho - 3, Math.ceil(x1 * mascara.escala));
  const gy1 = Math.min(mascara.alto - 3, Math.ceil(y1 * mascara.escala));
  const campo = permitirBajoPuente ? mascara.distanciaSinPuentes : mascara.distanciaMar;

  let mejorDist = minDist - 1;
  let mejorX = 0;
  let mejorY = 0;
  for (let y = gy0; y <= gy1; y += 2) {
    const ly = y / mascara.escala;
    const fila = y * mascara.ancho;
    for (let x = gx0; x <= gx1; x += 2) {
      const d = campo[fila + x];
      if (d <= mejorDist) continue;
      const lx = x / mascara.escala;
      if (evitarPlacas && estaCercaDePlaca(lx, ly, 12)) continue;
      mejorDist = d;
      mejorX = lx;
      mejorY = ly;
    }
  }
  return mejorDist >= minDist ? { x: mejorX, y: mejorY, dist: mejorDist } : null;
}

/**
 * Extrae deterministamente espumas costeras, corrientes de canal, bancos de peces, bloques de hielo,
 * medusas, plancton, estelas en V, gaviotas lejanas y cuencas del leviatán a partir de MascaraOceano.
 */
export function generarDatosOceanoVivo(mascara: MascaraOceano): DatosOceanoVivo {
  const rng = crearPrng(105019);
  const { ancho, alto, escala } = mascara;

  // 1. Puntos de espuma y resaca abrazando las costas reales detectadas en el alfa
  const puntosEspuma: PuntoEspuma[] = [];
  const sepEspuma2 = 12 * 12;
  for (let y = 1; y < alto - 1; y += 2) {
    const fila = y * ancho;
    for (let x = 1; x < ancho - 1; x += 2) {
      const idx = fila + x;
      if (!mascara.esFrenteAcantilado[idx]) continue;
      const d = mascara.distanciaMar[idx];
      if (d < 2 || d > 8) continue;
      const lx = x / escala;
      const ly = y / escala;

      let muyCerca = false;
      for (let k = puntosEspuma.length - 1; k >= 0; k--) {
        const dx = lx - puntosEspuma[k].x;
        const dy = ly - puntosEspuma[k].y;
        if (dx * dx + dy * dy < sepEspuma2) {
          muyCerca = true;
          break;
        }
      }
      if (muyCerca) continue;

      const normal = consultarNormalAgua(mascara, lx, ly, false);
      const clima = CODIGO_A_CLIMA[mascara.climaPorCelda[idx]] ?? "templado";
      puntosEspuma.push({
        x: lx,
        y: ly,
        nx: normal.x,
        ny: normal.y,
        clima,
        fase: (lx * 0.032 + ly * 0.021) % (Math.PI * 2),
        ancho: 7 + rng() * 6,
      });
    }
  }

  // 2. Corrientes marinas por canales internos y bajo los arcos de los puentes
  const rutasCanales: readonly { puntos: readonly Punto2D[]; ancho: number; vel: number }[] = [
    // Canal oeste (entre Praderas, Puesto del Río, Villa Serena y bajo puente LOC-01<->ZON-02)
    {
      puntos: [
        { x: 350, y: 525 },
        { x: 430, y: 558 },
        { x: 495, y: 635 },
        { x: 525, y: 745 },
        { x: 530, y: 855 },
      ],
      ancho: 14,
      vel: 0.00024,
    },
    // Corriente central pasando por debajo de los 4 arcos del gran puente LOC-02 <-> ZON-03
    {
      puntos: [
        { x: 845, y: 562 },
        { x: 965, y: 540 },
        { x: 1095, y: 515 },
        { x: 1210, y: 472 },
      ],
      ancho: 15,
      vel: 0.00026,
    },
    // Canal norte entre Bastión, Cumbre y Riscos (cruzando bajo puente LOC-03<->ZON-06)
    {
      puntos: [
        { x: 645, y: 120 },
        { x: 705, y: 185 },
        { x: 748, y: 245 },
        { x: 685, y: 315 },
      ],
      ancho: 12,
      vel: 0.0002,
    },
    // Canal sureste bajo el puente Lago Espejo <-> Bosque
    {
      puntos: [
        { x: 1055, y: 625 },
        { x: 1088, y: 718 },
        { x: 1105, y: 825 },
        { x: 1135, y: 885 },
      ],
      ancho: 13,
      vel: 0.00022,
    },
    // Corriente abisal noroeste bordeando Bastión y Praderas
    {
      puntos: [
        { x: 45, y: 240 },
        { x: 155, y: 165 },
        { x: 245, y: 105 },
        { x: 345, y: 45 },
      ],
      ancho: 16,
      vel: 0.00018,
    },
    // Corriente abisal noreste bordeando La Cumbre y Cueva Umbría
    {
      puntos: [
        { x: 1315, y: 60 },
        { x: 1445, y: 115 },
        { x: 1545, y: 185 },
      ],
      ancho: 15,
      vel: 0.0002,
    },
    // Corriente exterior este frente a Cueva Umbría y Bosque
    {
      puntos: [
        { x: 1585, y: 515 },
        { x: 1598, y: 625 },
        { x: 1568, y: 790 },
      ],
      ancho: 12,
      vel: 0.00022,
    },
  ];

  const corrientes: CorrienteMarina[] = [];
  for (let i = 0; i < rutasCanales.length; i++) {
    const r = rutasCanales[i];
    const c = muestrearCorrientePorTrayecto(mascara, r.puntos, r.ancho, i * 1.37, r.vel);
    if (c) corrientes.push(c);
  }

  // 3. Cardúmenes submarinos en cuencas profundas verificadas
  const sectoresCardumen: readonly [number, number, number, number][] = [
    [60, 70, 260, 270],
    [350, 500, 560, 680],
    [830, 480, 1180, 620],
    [450, 750, 600, 880],
    [1020, 760, 1180, 880],
    [1340, 40, 1570, 220],
  ];
  const cardumenes: CardumenPeces[] = [];
  for (let i = 0; i < sectoresCardumen.length; i++) {
    const [x0, y0, x1, y1] = sectoresCardumen[i];
    const cuenca = encontrarCuencaProfunda(mascara, x0, y0, x1, y1, 14, true, false);
    if (!cuenca) continue;
    cardumenes.push({
      centro: { x: cuenca.x, y: cuenca.y },
      radioX: Math.min(44, Math.max(16, cuenca.dist * 0.58)),
      radioY: Math.min(28, Math.max(12, cuenca.dist * 0.42)),
      velocidad: 0.00055 + rng() * 0.00035,
      fase: rng() * Math.PI * 2,
      cantidad: 5 + Math.floor(rng() * 3),
      tono: i % 2 === 0 ? "cian" : "turquesa",
    });
  }

  // 4. Bloques de hielo y escarcha en aguas glaciales del norte
  const bloquesHielo: BloqueHielo[] = [];
  const sepHielo2 = 44 * 44;
  for (let intento = 0; intento < 260 && bloquesHielo.length < 13; intento++) {
    const lx = 30 + rng() * (DIMENSIONES_MAPA_MUNDO.ancho - 60);
    const ly = 24 + rng() * 290;
    const gx = Math.floor(lx * escala);
    const gy = Math.floor(ly * escala);
    if (gx < 0 || gy < 0 || gx >= ancho || gy >= alto) continue;
    if (mascara.climaPorCelda[gy * ancho + gx] !== 0) continue;
    if (consultarDistanciaMar(mascara, lx, ly, false) < 15) continue;
    if (estaCercaDePlaca(lx, ly, 16)) continue;

    let choca = false;
    for (const h of bloquesHielo) {
      if ((lx - h.x) ** 2 + (ly - h.y) ** 2 < sepHielo2) {
        choca = true;
        break;
      }
    }
    if (choca) continue;

    bloquesHielo.push({
      x: lx,
      y: ly,
      radio: 6 + rng() * 6,
      fase: rng() * Math.PI * 2,
      amplitudX: 2.5 + rng() * 2.5,
      amplitudY: 1.5 + rng() * 1.5,
      variante: Math.floor(rng() * 3),
    });
  }

  // 5. Medusas luminosas y plancton bioluminiscente
  const medusas: MedusaMistica[] = [];
  const sepMedusa2 = 75 * 75;
  for (let intento = 0; intento < 260 && medusas.length < 8; intento++) {
    const lx = 50 + rng() * (DIMENSIONES_MAPA_MUNDO.ancho - 100);
    const ly = 70 + rng() * (DIMENSIONES_MAPA_MUNDO.alto - 110);
    if (consultarDistanciaMar(mascara, lx, ly, false) < 18) continue;
    if (estaCercaDePlaca(lx, ly, 14)) continue;
    let choca = false;
    for (const m of medusas) {
      if ((lx - m.x) ** 2 + (ly - m.y) ** 2 < sepMedusa2) {
        choca = true;
        break;
      }
    }
    if (choca) continue;
    const gx = Math.min(ancho - 1, Math.max(0, Math.floor(lx * escala)));
    const gy = Math.min(alto - 1, Math.max(0, Math.floor(ly * escala)));
    const clima = mascara.climaPorCelda[gy * ancho + gx];
    medusas.push({
      x: lx,
      y: ly,
      radio: 4.5 + rng() * 2.5,
      fase: rng() * Math.PI * 2,
      amplitudY: 4 + rng() * 3,
      color: clima === 2 && rng() > 0.35 ? "violeta" : "cian",
    });
  }

  const plancton: MotaPlancton[] = [];
  for (let intento = 0; intento < 420 && plancton.length < 62; intento++) {
    const lx = 24 + rng() * (DIMENSIONES_MAPA_MUNDO.ancho - 48);
    const ly = 24 + rng() * (DIMENSIONES_MAPA_MUNDO.alto - 48);
    if (consultarDistanciaMar(mascara, lx, ly, false) < 8) continue;
    const gx = Math.min(ancho - 1, Math.max(0, Math.floor(lx * escala)));
    const gy = Math.min(alto - 1, Math.max(0, Math.floor(ly * escala)));
    const clima = mascara.climaPorCelda[gy * ancho + gx];
    // Priorizar concentración mística en el centro-sur (Lago Espejo / Bosque) y canales templados
    if (clima === 3 && rng() < 0.7) continue;
    if (clima === 0 && rng() < 0.45) continue;
    plancton.push({
      x: lx,
      y: ly,
      fase: rng() * Math.PI * 2,
      tamano: rng() > 0.72 ? 2.5 : 2,
      esmeralda: clima === 2 && rng() > 0.45,
    });
  }

  // 6. Pequeñas estelas en V sobre canales navegables
  const estelasV: EstelaSuperficie[] = [];
  for (let intento = 0; intento < 180 && estelasV.length < 5; intento++) {
    const lx = 80 + rng() * (DIMENSIONES_MAPA_MUNDO.ancho - 160);
    const ly = 70 + rng() * (DIMENSIONES_MAPA_MUNDO.alto - 140);
    if (consultarDistanciaMar(mascara, lx, ly, false) < 26) continue;
    if (estaCercaDePlaca(lx, ly, 18)) continue;
    const ang = (rng() > 0.5 ? 0.25 : -2.85) + (rng() - 0.5) * 0.4;
    estelasV.push({
      x: lx,
      y: ly,
      dx: Math.cos(ang),
      dy: Math.sin(ang),
      fase: rng() * 10,
      tamano: 6 + rng() * 3,
    });
  }

  // 7. Gaviotas altas lejanas en aguas exteriores abiertas (sin tapar islas ni placas)
  const sectoresAves: readonly [number, number, number, number][] = [
    [30, 30, 260, 230],
    [1340, 30, 1590, 200],
    [430, 740, 610, 880],
    [1010, 750, 1200, 880],
  ];
  const aves: AveMarina[] = [];
  for (let i = 0; i < sectoresAves.length; i++) {
    const [x0, y0, x1, y1] = sectoresAves[i];
    const cuenca = encontrarCuencaProfunda(mascara, x0, y0, x1, y1, 34, false, true);
    if (!cuenca) continue;
    aves.push({
      centro: { x: cuenca.x, y: cuenca.y },
      radioX: Math.min(48, cuenca.dist * 0.48),
      radioY: Math.min(26, cuenca.dist * 0.34),
      velocidad: 0.00028 + rng() * 0.00014,
      fase: i * 1.9,
      cantidad: i % 2 === 0 ? 3 : 2,
    });
  }

  // 8. Zonas profundas exteriores escénicas (alejadas de esquinas extremas y placas) para criaturas abisales
  const candidatosLeviatan: readonly [number, number, number, number][] = [
    [90, 95, 255, 250],
    [1355, 70, 1525, 210],
    [455, 745, 595, 860],
    [1035, 745, 1185, 860],
  ];
  const zonasLeviatan: Punto2D[] = [];
  for (const [x0, y0, x1, y1] of candidatosLeviatan) {
    const cuenca = encontrarCuencaProfunda(mascara, x0, y0, x1, y1, 38, false, true);
    if (cuenca) zonasLeviatan.push({ x: cuenca.x, y: cuenca.y });
  }
  if (zonasLeviatan.length === 0) {
    const respaldo = encontrarCuencaProfunda(
      mascara,
      60,
      60,
      DIMENSIONES_MAPA_MUNDO.ancho - 60,
      DIMENSIONES_MAPA_MUNDO.alto - 60,
      24,
      false,
      true,
    );
    if (respaldo) zonasLeviatan.push({ x: respaldo.x, y: respaldo.y });
  }

  // 9. Siluetas submarinas abisales (mosasaurus, plesiosaurios, mantarrayas, krakens y ballenas) bajo las olas
  const recetasSiluetas: readonly {
    especie: EspecieSiluetaSubmarina;
    caja: readonly [number, number, number, number];
    minDist: number;
    permitirBajoPuente: boolean;
    escala: number;
    vel: number;
    matiz: "abisal" | "glacial" | "mistico";
  }[] = [
    {
      especie: "mosasaurus",
      caja: [75, 75, 260, 255],
      minDist: 34,
      permitirBajoPuente: false,
      escala: 1.08,
      vel: 0.00022,
      matiz: "glacial",
    },
    {
      especie: "plesiosaurio",
      caja: [20, 245, 145, 450],
      minDist: 26,
      permitirBajoPuente: false,
      escala: 0.96,
      vel: 0.00024,
      matiz: "abisal",
    },
    {
      especie: "kraken",
      caja: [1345, 55, 1565, 225],
      minDist: 32,
      permitirBajoPuente: false,
      escala: 1.0,
      vel: 0.00018,
      matiz: "glacial",
    },
    {
      especie: "mantarraya",
      caja: [385, 515, 555, 665],
      minDist: 22,
      permitirBajoPuente: true,
      escala: 0.9,
      vel: 0.00028,
      matiz: "abisal",
    },
    {
      especie: "ballena",
      caja: [445, 740, 605, 870],
      minDist: 28,
      permitirBajoPuente: false,
      escala: 1.0,
      vel: 0.00015,
      matiz: "abisal",
    },
    {
      especie: "plesiosaurio",
      caja: [1025, 740, 1190, 870],
      minDist: 28,
      permitirBajoPuente: false,
      escala: 0.92,
      vel: 0.00021,
      matiz: "mistico",
    },
    {
      especie: "mantarraya",
      caja: [880, 480, 1140, 600],
      minDist: 20,
      permitirBajoPuente: true,
      escala: 0.85,
      vel: 0.00025,
      matiz: "mistico",
    },
    {
      especie: "kraken",
      caja: [35, 780, 120, 875],
      minDist: 20,
      permitirBajoPuente: false,
      escala: 0.92,
      vel: 0.0002,
      matiz: "abisal",
    },
    {
      especie: "ballena",
      caja: [585, 25, 720, 115],
      minDist: 22,
      permitirBajoPuente: false,
      escala: 0.96,
      vel: 0.00017,
      matiz: "glacial",
    },
  ];

  const siluetasSubmarinas: SiluetaSubmarina[] = [];
  for (let i = 0; i < recetasSiluetas.length; i++) {
    const r = recetasSiluetas[i];
    const [x0, y0, x1, y1] = r.caja;
    const cuenca = encontrarCuencaProfunda(mascara, x0, y0, x1, y1, r.minDist, r.permitirBajoPuente, false);
    if (!cuenca) continue;
    const margenLibre = Math.max(8, cuenca.dist - 16);
    siluetasSubmarinas.push({
      especie: r.especie,
      centro: { x: cuenca.x, y: cuenca.y },
      radioX: Math.min(46, Math.max(10, margenLibre * 0.62)),
      radioY: Math.min(28, Math.max(8, margenLibre * 0.44)),
      escala: r.escala,
      velocidad: r.vel,
      fase: i * 1.45,
      permitirBajoPuente: r.permitirBajoPuente,
      matiz: r.matiz,
    });
  }

  // 10. Avistamientos periódicos en superficie: leviatán, mosasaurus y kraken en mares exteriores
  const recetasAvistamientos: readonly {
    especie: EspecieAvistamientoAbisal;
    caja: readonly [number, number, number, number];
    minDist: number;
    escala: number;
    duracionCiclo: number;
    duracionAparicion: number;
    desfase: number;
    direccion: 1 | -1;
  }[] = [
    {
      especie: "leviatan",
      caja: [85, 85, 255, 250],
      minDist: 38,
      escala: 1.06,
      duracionCiclo: 15_500,
      duracionAparicion: 6_600,
      desfase: 600,
      direccion: 1,
    },
    {
      especie: "mosasaurus",
      caja: [1345, 60, 1560, 220],
      minDist: 36,
      escala: 1.04,
      duracionCiclo: 16_000,
      duracionAparicion: 6_500,
      desfase: 1_200,
      direccion: -1,
    },
    {
      especie: "kraken",
      caja: [445, 745, 600, 865],
      minDist: 32,
      escala: 0.92,
      duracionCiclo: 17_000,
      duracionAparicion: 7_000,
      desfase: 900,
      direccion: 1,
    },
    {
      especie: "mosasaurus",
      caja: [1025, 745, 1190, 865],
      minDist: 32,
      escala: 0.92,
      duracionCiclo: 18_500,
      duracionAparicion: 6_400,
      desfase: 7_800,
      direccion: 1,
    },
    {
      especie: "kraken",
      caja: [20, 250, 135, 445],
      minDist: 30,
      escala: 0.95,
      duracionCiclo: 19_000,
      duracionAparicion: 6_800,
      desfase: 8_500,
      direccion: -1,
    },
  ];

  const avistamientosAbisales: AvistamientoAbisal[] = [];
  for (const r of recetasAvistamientos) {
    const [x0, y0, x1, y1] = r.caja;
    const cuenca = encontrarCuencaProfunda(mascara, x0, y0, x1, y1, r.minDist, false, true);
    if (!cuenca) continue;
    avistamientosAbisales.push({
      especie: r.especie,
      centro: { x: cuenca.x, y: cuenca.y },
      escala: r.escala,
      duracionCiclo: r.duracionCiclo,
      duracionAparicion: r.duracionAparicion,
      desfase: r.desfase,
      direccion: r.direccion,
    });
  }

  return {
    puntosEspuma,
    corrientes,
    cardumenes,
    bloquesHielo,
    medusas,
    plancton,
    estelasV,
    aves,
    zonasLeviatan,
    siluetasSubmarinas,
    avistamientosAbisales,
  };
}

function suavizarHermite(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function crearCanvasBatimetria(mascara: MascaraOceano): HTMLCanvasElement {
  const { ancho, alto, escala } = mascara;
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(ancho, alto);
  const d = imgData.data;

  // Centros de masa climática para interpolación suave sin costuras tipo Voronoi
  const islotes = Object.values(CONFIGURACION_ISLAS_MAPA);

  for (let y = 0; y < alto; y++) {
    const ly = y / escala;
    const bordeY = Math.min(1, ly / 46, (DIMENSIONES_MAPA_MUNDO.alto - ly) / 46);
    const fila = y * ancho;
    for (let x = 0; x < ancho; x++) {
      const lx = x / escala;
      const borde = Math.max(
        0,
        Math.min(bordeY, lx / 46, (DIMENSIONES_MAPA_MUNDO.ancho - lx) / 46),
      );
      const idx = fila + x;
      const p = idx * 4;

      if (mascara.tierra[idx]) {
        d[p] = 1;
        d[p + 1] = 8;
        d[p + 2] = 20;
        d[p + 3] = 110;
        continue;
      }

      const distIsla = mascara.distanciaSinPuentes[idx];
      const distConPuentes = mascara.distanciaMar[idx];

      // Relieve submarino orgánico multiescala sin cortes bruscos
      const relieve =
        0.5 +
        0.26 * Math.sin(lx * 0.013 + ly * 0.007) +
        0.24 * Math.cos(lx * 0.006 - ly * 0.015);

      let r = 2;
      let g = 24;
      let b = 52;
      let a = Math.round(borde * (26 + relieve * 32));

      // Meseta somera oscura y sutil solo en costados/frentes costeros (sin halo celeste sobre cumbres o copas)
      if (distIsla < 56) {
        const factorDist = Math.pow(suavizarHermite(1 - distIsla / 56), 1.65);

        let pesoGlacial = 0;
        let pesoMistico = 0;
        let pesoVolcan = 0;
        let nyPond = 0;
        let pesoTotal = 0.0001;
        for (let k = 0; k < islotes.length; k++) {
          const isl = islotes[k];
          const nx = (lx - isl.x) / Math.max(70, isl.radioX);
          const ny = (ly - isl.y) / Math.max(70, isl.radioY);
          const w = 1 / (0.35 + nx * nx + ny * ny);
          pesoTotal += w;
          nyPond += w * ny;
          const cod = BIOMA_A_CLIMA[isl.bioma] ?? 1;
          if (cod === 0) pesoGlacial += w;
          else if (cod === 2) pesoMistico += w;
          else if (cod === 3) pesoVolcan += w;
        }
        pesoGlacial /= pesoTotal;
        pesoMistico /= pesoTotal;
        pesoVolcan /= pesoTotal;
        const nyRel = nyPond / pesoTotal;

        const frenteCostero = suavizarHermite((nyRel + 0.08) / 0.72);
        const factor = factorDist * (0.18 + 0.82 * frenteCostero);

        const cercaLava =
          suavizarHermite(1 - Math.hypot((lx - 1435) / 170, (ly - 515) / 72)) * pesoVolcan;

        r = Math.round(4 + (5 * pesoGlacial + 68 * cercaLava) * factor);
        g = Math.round(38 + (28 + 8 * pesoMistico - 8 * pesoVolcan + 18 * cercaLava) * factor);
        b = Math.round(68 + (30 + 12 * pesoGlacial - 30 * pesoVolcan) * factor);
        a = Math.min(165, Math.round(a + 64 * factor * borde));
      }

      // Sombra de contacto oscura bajo acantilados y arcos de puentes para anclar la perspectiva 2.5D
      if (distConPuentes < 13) {
        const distPuente = Math.sqrt(distanciaMinimaPuenteCuadrada(lx, ly));
        const pesoPuente = suavizarHermite(1 - distPuente / 30);
        const s = suavizarHermite(1 - distConPuentes / 13);
        const osc = 1 - s * (0.42 + 0.28 * pesoPuente);
        r = Math.round(r * osc);
        g = Math.round(g * osc);
        b = Math.round(b * osc);
        a = Math.min(220, Math.round(a + s * (58 + 46 * pesoPuente) * borde));
      }

      d[p] = r;
      d[p + 1] = g;
      d[p + 2] = b;
      d[p + 3] = a;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function crearCanvasCausticas(): HTMLCanvasElement {
  const tam = 512;
  const canvas = document.createElement("canvas");
  canvas.width = tam;
  canvas.height = tam;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(tam, tam);
  const d = imgData.data;
  const k = (Math.PI * 2) / tam;

  // Malla periódica multiescala 512x512 suave para evitar patrón repetitivo evidente al alejar zoom
  for (let y = 0; y < tam; y += 2) {
    for (let x = 0; x < tam; x += 2) {
      const wx = x * k;
      const wy = y * k;
      const dx = Math.sin(wy * 2 + Math.cos(wx * 3)) * 0.42;
      const dy = Math.cos(wx * 2 - Math.sin(wy * 3)) * 0.42;
      const v1 = Math.sin((wx + dx) * 4 + wy * 2);
      const v2 = Math.cos((wy + dy) * 5 - wx * 2);
      const v3 = Math.sin((wx * 3 - wy * 4) + dx);
      const cresta = Math.max(0, 1 - Math.abs(v1 + v2 * 0.8 + v3 * 0.55) * 1.65);
      const intensidad = Math.pow(cresta, 2.4);
      const alfa = Math.round(intensidad * 145);

      for (let py = 0; py < 2; py++) {
        for (let px = 0; px < 2; px++) {
          const p = ((y + py) * tam + (x + px)) * 4;
          d[p] = 103;
          d[p + 1] = 212;
          d[p + 2] = 246;
          d[p + 3] = alfa;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Extrae una sola vez la máscara alfa del mapa WebP maestro y construye todos los búferes
 * fuera de pantalla necesarios para animar el océano vivo a 60 FPS sin crear gradientes por cuadro.
 */
export function crearRecursosOceano(imagenMapa: HTMLImageElement): RecursosOceanoVivo | null {
  try {
    const tmp = document.createElement("canvas");
    tmp.width = MASCARA_OCEANO_ANCHO;
    tmp.height = MASCARA_OCEANO_ALTO;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    if (!tctx) return null;

    tctx.clearRect(0, 0, MASCARA_OCEANO_ANCHO, MASCARA_OCEANO_ALTO);
    tctx.drawImage(imagenMapa, 0, 0, MASCARA_OCEANO_ANCHO, MASCARA_OCEANO_ALTO);
    const rgba = tctx.getImageData(0, 0, MASCARA_OCEANO_ANCHO, MASCARA_OCEANO_ALTO).data;

    const total = MASCARA_OCEANO_ANCHO * MASCARA_OCEANO_ALTO;
    const alfa = new Uint8Array(total);
    for (let i = 0; i < total; i++) {
      alfa[i] = rgba[i * 4 + 3];
    }

    const mascara = analizarMascaraAlfaOceano(
      alfa,
      MASCARA_OCEANO_ANCHO,
      MASCARA_OCEANO_ALTO,
      ESCALA_MASCARA_OCEANO,
    );
    const datos = generarDatosOceanoVivo(mascara);
    const canvasBatimetria = crearCanvasBatimetria(mascara);
    const canvasCausticas = crearCanvasCausticas();

    return {
      mascara,
      datos,
      canvasBatimetria,
      canvasCausticas,
    };
  } catch {
    return null;
  }
}

function obtenerCacheContexto(
  ctx: CanvasRenderingContext2D,
  canvasCausticas: HTMLCanvasElement,
): CacheGradientesContexto {
  let cache = cacheGradientesPorCtx.get(ctx);
  if (!cache) {
    const gradMar = ctx.createLinearGradient(0, -140, 0, DIMENSIONES_MAPA_MUNDO.alto + 160);
    gradMar.addColorStop(0, "#021327");
    gradMar.addColorStop(0.28, "#042342");
    gradMar.addColorStop(0.55, "#052a4e");
    gradMar.addColorStop(0.82, "#031e3a");
    gradMar.addColorStop(1, "#011224");

    const glowCentral = ctx.createRadialGradient(808, 480, 90, 808, 480, 780);
    glowCentral.addColorStop(0, "rgba(14, 116, 144, 0.2)");
    glowCentral.addColorStop(0.55, "rgba(6, 78, 115, 0.1)");
    glowCentral.addColorStop(1, "rgba(2, 19, 39, 0)");

    cache = {
      gradMar,
      glowCentral,
      patronCausticas: ctx.createPattern(canvasCausticas, "repeat"),
    };
    cacheGradientesPorCtx.set(ctx, cache);
  }
  return cache;
}

function dibujarFondoAbisalYCausticas(
  ctx: CanvasRenderingContext2D,
  recursos: RecursosOceanoVivo,
  t: number,
  xMin: number,
  yMin: number,
  anchoVista: number,
  altoVista: number,
): void {
  const { gradMar, glowCentral, patronCausticas } = obtenerCacheContexto(
    ctx,
    recursos.canvasCausticas,
  );
  ctx.fillStyle = gradMar;
  ctx.fillRect(xMin, yMin, anchoVista, altoVista);

  ctx.fillStyle = glowCentral;
  ctx.fillRect(xMin, yMin, anchoVista, altoVista);

  // Batimetría costera, fosas abisales y sombras 2.5D en una única transferencia
  ctx.drawImage(
    recursos.canvasBatimetria,
    0,
    0,
    DIMENSIONES_MAPA_MUNDO.ancho,
    DIMENSIONES_MAPA_MUNDO.alto,
  );

  // Cáusticas submarinas continuas de doble capa con desplazamiento opuesto sutil
  if (patronCausticas) {
    ctx.save();
    ctx.fillStyle = patronCausticas;

    const offX1 = (t * 0.008) % 512;
    const offY1 = (t * 0.005) % 512;
    ctx.globalAlpha = 0.052;
    ctx.translate(offX1, offY1);
    ctx.fillRect(xMin - offX1, yMin - offY1, anchoVista, altoVista);

    const offX2 = -(t * 0.0055) % 512;
    const offY2 = (t * 0.0065) % 512;
    ctx.translate(offX2 - offX1, offY2 - offY1);
    ctx.globalAlpha = 0.032;
    ctx.fillRect(xMin - offX2, yMin - offY2, anchoVista, altoVista);
    ctx.restore();
  }
}

function dibujarCorrientesMarinas(
  ctx: CanvasRenderingContext2D,
  corrientes: readonly CorrienteMarina[],
  t: number,
): void {
  ctx.save();
  for (let i = 0; i < corrientes.length; i++) {
    const c = corrientes[i];
    const total = c.muestras.length;
    if (total < 8) continue;

    // Motas y filamentos discontinuos pixel-art fluyendo por canales y bajo arcos de puentes
    for (let pulso = 0; pulso < 5; pulso++) {
      const progresoBase = (t * c.velocidad + c.fase * 0.19 + pulso * 0.2) % 1;
      const envolvente = Math.sin(progresoBase * Math.PI);
      if (envolvente < 0.08) continue;

      const idxF = progresoBase * (total - 1);
      for (let cuenta = 0; cuenta < 5; cuenta++) {
        const idx = Math.round(idxF - cuenta * 1.6);
        if (idx < 0 || idx >= total) continue;
        const m = c.muestras[idx];
        const ondaLat = Math.sin(idx * 0.55 - t * 0.0032 + pulso * 1.7 + i) * 3.5;
        const mx = Math.round(m.x - m.ty * ondaLat);
        const my = Math.round(m.y + m.tx * ondaLat);
        const fade = envolvente * (1 - cuenta * 0.17);

        ctx.fillStyle =
          cuenta === 0
            ? `rgba(186, 230, 253, ${(fade * 0.34).toFixed(3)})`
            : `rgba(56, 189, 248, ${(fade * 0.26).toFixed(3)})`;
        ctx.fillRect(mx - 1, my - 1, cuenta === 0 ? 3 : 2, 2);

        if (cuenta % 2 === 1 && idx + 2 < total) {
          const mPar = c.muestras[idx + 2];
          const px = Math.round(mPar.x + mPar.ty * (2.6 - ondaLat * 0.5));
          const py = Math.round(mPar.y - mPar.tx * (2.6 - ondaLat * 0.5));
          ctx.fillStyle = `rgba(125, 211, 252, ${(fade * 0.18).toFixed(3)})`;
          ctx.fillRect(px, py, 2, 1.5);
        }
      }
    }
  }
  ctx.restore();
}

function dibujarFaunaSubmarina(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  datos: DatosOceanoVivo,
  t: number,
): void {
  // 1. Cardúmenes submarinos evasivos de tierra firme (pueden cruzar bajo arcos de puentes)
  ctx.save();
  for (let cIdx = 0; cIdx < datos.cardumenes.length; cIdx++) {
    const card = datos.cardumenes[cIdx];
    const angBase = t * card.velocidad + card.fase;
    const bx = card.centro.x + Math.cos(angBase) * card.radioX;
    const by = card.centro.y + Math.sin(angBase * 1.5) * card.radioY;
    const vx = -Math.sin(angBase) * card.radioX * card.velocidad;
    const vy = Math.cos(angBase * 1.5) * card.radioY * card.velocidad * 1.5;
    const angulo = Math.atan2(vy, vx);
    const cosA = Math.cos(angulo);
    const sinA = Math.sin(angulo);

    ctx.fillStyle =
      card.tono === "cian" ? "rgba(125, 211, 252, 0.36)" : "rgba(45, 212, 191, 0.32)";

    for (let f = 0; f < card.cantidad; f++) {
      const fila = Math.floor(f / 2);
      const lado = f % 2 === 0 ? -1 : 1;
      const offsetLong = -fila * 6.5 - (f === 0 ? 0 : 2);
      const offsetLat = f === 0 ? 0 : lado * (3.2 + fila * 2.1);
      const coleo = Math.sin(t * 0.012 + f * 1.4 + cIdx) * 1.4;

      let fx = bx + cosA * offsetLong - sinA * (offsetLat + coleo);
      let fy = by + sinA * offsetLong + cosA * (offsetLat + coleo);

      const dist = consultarDistanciaMar(mascara, fx, fy, true);
      if (dist < 8) {
        const n = consultarNormalAgua(mascara, fx, fy, true);
        fx += n.x * (9 - dist);
        fy += n.y * (9 - dist);
        if (!esPosicionNavegable(mascara, fx, fy, 6, true)) continue;
      }

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(angulo);
      ctx.fillRect(-3, -1, 5, 2);
      ctx.fillRect(-5, Math.round(coleo * 0.5) - 1, 2, 2);
      ctx.restore();
    }
  }
  ctx.restore();

  // 2. Medusas luminosas y plancton bioluminiscente
  ctx.save();
  for (let i = 0; i < datos.medusas.length; i++) {
    const m = datos.medusas[i];
    const pulso = Math.sin(t * 0.0026 + m.fase);
    const mx = m.x + Math.sin(t * 0.0008 + m.fase) * 4;
    const my = m.y + Math.cos(t * 0.0011 + m.fase) * m.amplitudY;
    if (!esPosicionNavegable(mascara, mx, my, 10, false)) continue;

    const anchoCampana = m.radio * (1 + pulso * 0.16);
    const alfa = 0.24 + (pulso + 1) * 0.08;
    const esVioleta = m.color === "violeta";
    ctx.fillStyle = esVioleta
      ? `rgba(192, 132, 252, ${(alfa * 0.45).toFixed(3)})`
      : `rgba(56, 189, 248, ${(alfa * 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, anchoCampana * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = esVioleta
      ? `rgba(216, 180, 254, ${alfa.toFixed(3)})`
      : `rgba(165, 243, 252, ${alfa.toFixed(3)})`;
    ctx.fillRect(Math.round(mx - anchoCampana * 0.65), Math.round(my - 2), Math.round(anchoCampana * 1.3), 2);
    ctx.fillRect(Math.round(mx - anchoCampana * 0.4), Math.round(my - 4), Math.round(anchoCampana * 0.8), 2);

    // Tentáculos pixelados ondulantes
    for (let tent = -1; tent <= 1; tent++) {
      const ox = mx + tent * 2.2;
      const vaiven = Math.sin(t * 0.005 + tent * 1.4 + m.fase) * 1.2;
      ctx.fillRect(Math.round(ox), Math.round(my), 1, 3);
      ctx.fillRect(Math.round(ox + vaiven), Math.round(my + 3), 1, 3);
    }
  }

  for (let i = 0; i < datos.plancton.length; i++) {
    const p = datos.plancton[i];
    const px = p.x + Math.sin(t * 0.0009 + p.fase) * 3;
    const py = p.y + Math.cos(t * 0.0008 + p.fase * 1.3) * 2.5;
    if (!esPosicionNavegable(mascara, px, py, 6, false)) continue;
    const brillo = 0.14 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.0034 + p.fase));
    ctx.fillStyle = p.esmeralda
      ? `rgba(52, 211, 153, ${brillo.toFixed(3)})`
      : `rgba(103, 232, 249, ${brillo.toFixed(3)})`;
    ctx.fillRect(Math.round(px), Math.round(py), p.tamano, p.tamano);
  }
  ctx.restore();
}

const ALETAS_MOSASAURUS_SUB: readonly (readonly [number, number, number, number, number])[] = [
  [7, -5.5, 12.5, -0.85, 1],
  [7, 5.5, 12.5, 0.85, -1],
  [-9, -3.8, 8.5, -1.0, -1],
  [-9, 3.8, 8.5, 1.0, 1],
];

const ALETAS_PLESIOSAURIO_SUB: readonly (readonly [number, number, number, number, boolean])[] = [
  [3, -5.5, 14, -1.05, true],
  [3, 5.5, 14, 1.05, false],
  [-7, -4.8, 12, -1.15, true],
  [-7, 4.8, 12, 1.15, false],
];

const LADOS_ALETA_BALLENA: readonly (-1 | 1)[] = [-1, 1];
const TENTACULOS_KRAKEN_SURGIMIENTO: readonly number[] = [-2.65, -2.12, -1.56, -1.02, -0.48, 0.14, -3.02];

/** Dibuja el anillo roto de olas y gotas de espuma alrededor de una irrupción abisal. */
function dibujarEspumaEmergente(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radioX: number,
  radioY: number,
  p: number,
  envolvente: number,
  tinteSpray: string,
): void {
  const faseOnda = (p * 3.2) % 1;
  const rx = radioX + faseOnda * 22;
  const ry = radioY + faseOnda * 8.5;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = `rgba(186, 230, 253, ${(envolvente * (1 - faseOnda) * 0.48).toFixed(3)})`;
  // Segmentos curvos discontinuos en lugar de una elipse uniforme continua
  for (let s = 0; s < 4; s++) {
    const aIni = s * (Math.PI * 0.5) + 0.18 + faseOnda * 0.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 1.5, rx, ry, 0, aIni, aIni + 1.05);
    ctx.stroke();
  }

  // Pixeles dispersos de resaca en la base de ruptura
  const pasos = 7;
  ctx.fillStyle = tinteSpray;
  ctx.globalAlpha = envolvente * 0.72;
  for (let g = 0; g < pasos; g++) {
    const u = g / (pasos - 1) - 0.5;
    const gx = Math.round(x + u * radioX * 1.9 + Math.sin(p * 18 + g * 2.1) * 1.6);
    const gy = Math.round(y + Math.abs(u) * 2.5 + ((g % 2 === 0 ? 0.5 : 1.5)));
    ctx.fillRect(gx, gy, g % 2 === 0 ? 3 : 2, 1.5);
  }
}

function dibujarSiluetaMosasaurusBajoAgua(
  ctx: CanvasRenderingContext2D,
  t: number,
  fase: number,
  colorAcento: string,
): void {
  const braceo = Math.sin(t * 0.0046 + fase) * 0.32;
  const coleo1 = Math.sin(t * 0.0055 + fase) * 3.5;
  const coleo2 = Math.sin(t * 0.0055 + fase - 1.3) * 5.8;

  // Cuerpo hidrodinámico alargado y hocico estrecho
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.quadraticCurveTo(15, -4.8, 4, -6.2);
  ctx.quadraticCurveTo(-8, -5.5, -17, -2.6);
  ctx.lineTo(-28, coleo1 - 1.7);
  ctx.lineTo(-38, coleo2 - 4.0);
  ctx.lineTo(-33.5, coleo2);
  ctx.lineTo(-38, coleo2 + 4.0);
  ctx.lineTo(-28, coleo1 + 1.7);
  ctx.lineTo(-17, 2.6);
  ctx.quadraticCurveTo(-8, 5.5, 4, 6.2);
  ctx.quadraticCurveTo(15, 4.8, 24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cuatro aletas romboidales remando en contrafase
  for (let i = 0; i < ALETAS_MOSASAURUS_SUB.length; i++) {
    const [fx, fy, largo, angBase, inv] = ALETAS_MOSASAURUS_SUB[i];
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(angBase + braceo * inv);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(largo * 0.45, -2.6 * Math.sign(angBase));
    ctx.lineTo(largo, 0);
    ctx.lineTo(largo * 0.35, 2.4 * Math.sign(angBase));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Nodos bioluminiscentes tenues en el espinazo
  ctx.fillStyle = colorAcento;
  for (let d = 0; d < 5; d++) {
    ctx.fillRect(Math.round(10 - d * 5.5), -1, 2, 1.5);
  }
}

function dibujarSiluetaPlesiosaurioBajoAgua(
  ctx: CanvasRenderingContext2D,
  t: number,
  fase: number,
  colorAcento: string,
): void {
  const giroCuello = Math.sin(t * 0.0032 + fase) * 3.4;
  const aleteoA = Math.sin(t * 0.0044 + fase) * 0.34;
  const aleteoP = Math.sin(t * 0.0044 + fase + 1.4) * 0.3;

  // Torso ovalado y cola breve
  ctx.beginPath();
  ctx.ellipse(-2, 0, 12, 6.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-12, -2.4);
  ctx.lineTo(-24, giroCuello * -0.4);
  ctx.lineTo(-12, 2.4);
  ctx.closePath();
  ctx.fill();

  // Cuello largo sinuoso y cabeza pequeña
  const estiloCuerpo = ctx.fillStyle;
  const estiloBorde = ctx.strokeStyle;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = estiloCuerpo;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.quadraticCurveTo(17, giroCuello * 0.7, 27, giroCuello);
  ctx.stroke();
  ctx.strokeStyle = estiloBorde;
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  ctx.ellipse(28.5, giroCuello, 4.2, 2.2, giroCuello * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cuatro grandes aletas tipo remo
  for (let i = 0; i < ALETAS_PLESIOSAURIO_SUB.length; i++) {
    const [fx, fy, largo, ang, esAnterior] = ALETAS_PLESIOSAURIO_SUB[i];
    const oscBase = esAnterior ? aleteoA : aleteoP;
    const osc = ang < 0 ? oscBase : -oscBase;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang + osc);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(largo * 0.6, -2.8, largo, 0);
    ctx.quadraticCurveTo(largo * 0.5, 2.8, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = colorAcento;
  ctx.fillRect(Math.round(27), Math.round(giroCuello - 1), 2, 1.5);
}

function dibujarSiluetaMantarrayaBajoAgua(
  ctx: CanvasRenderingContext2D,
  t: number,
  fase: number,
  colorAcento: string,
): void {
  const flex = Math.sin(t * 0.0042 + fase) * 3.8;
  const cola = Math.sin(t * 0.005 + fase) * 3;

  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(14.5, -3.8);
  ctx.lineTo(9.5, -3.2);
  ctx.quadraticCurveTo(2, -17.5 - flex * 0.4, -7.5, -20.5 + flex);
  ctx.quadraticCurveTo(-5, -6.5, -9.5, -1.6);
  ctx.lineTo(-29, cola);
  ctx.lineTo(-9.5, 1.6);
  ctx.quadraticCurveTo(-5, 6.5, -7.5, 20.5 - flex);
  ctx.quadraticCurveTo(2, 17.5 + flex * 0.4, 9.5, 3.2);
  ctx.lineTo(14.5, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorAcento;
  ctx.fillRect(0, -6.5, 2.5, 1.5);
  ctx.fillRect(0, 5, 2.5, 1.5);
  ctx.fillRect(-4, -9.5, 2, 1.5);
  ctx.fillRect(-4, 8, 2, 1.5);
}

function dibujarSiluetaKrakenBajoAgua(
  ctx: CanvasRenderingContext2D,
  t: number,
  fase: number,
  colorAcento: string,
): void {
  // Manto torpediforme con aleta apical
  ctx.beginPath();
  ctx.moveTo(23, 0);
  ctx.lineTo(13.5, -7.8);
  ctx.lineTo(8.5, -5.0);
  ctx.quadraticCurveTo(-3, -7.2, -10.5, -4.4);
  ctx.lineTo(-10.5, 4.4);
  ctx.quadraticCurveTo(-3, 7.2, 8.5, 5.0);
  ctx.lineTo(13.5, 7.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tentáculos sumergidos ondulando detrás
  const estiloCuerpo = ctx.fillStyle;
  ctx.strokeStyle = estiloCuerpo;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.4;
  for (let k = -2; k <= 2; k++) {
    const oy = k * 2.2;
    const onda = Math.sin(t * 0.0048 + fase + k * 0.9) * 3.4;
    ctx.beginPath();
    ctx.moveTo(-9.5, oy * 0.7);
    ctx.quadraticCurveTo(-19, oy + onda * 0.7, -30 - (Math.abs(k) % 2) * 5.5, oy * 1.35 - onda);
    ctx.stroke();
  }

  ctx.fillStyle = colorAcento;
  ctx.fillRect(-6, -3, 2, 1.5);
  ctx.fillRect(-6, 1.5, 2, 1.5);
}

function dibujarSiluetaBallenaBajoAgua(
  ctx: CanvasRenderingContext2D,
  t: number,
  fase: number,
  colorAcento: string,
): void {
  const coleo = Math.sin(t * 0.0028 + fase) * 3.2;
  // Cuerpo masivo y aletas pectorales amplias
  ctx.beginPath();
  ctx.moveTo(23, 0);
  ctx.quadraticCurveTo(20, -7.8, 4.5, -8.4);
  ctx.quadraticCurveTo(-12, -6.8, -24.5, coleo - 1.6);
  ctx.lineTo(-32, coleo - 7.4);
  ctx.lineTo(-28.5, coleo);
  ctx.lineTo(-32, coleo + 7.4);
  ctx.lineTo(-24.5, coleo + 1.6);
  ctx.quadraticCurveTo(-12, 6.8, 4.5, 8.4);
  ctx.quadraticCurveTo(20, 7.8, 23, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < LADOS_ALETA_BALLENA.length; i++) {
    const lado = LADOS_ALETA_BALLENA[i];
    ctx.beginPath();
    ctx.moveTo(6.5, lado * 6.5);
    ctx.quadraticCurveTo(2.5, lado * 17, -5.5, lado * 15);
    ctx.quadraticCurveTo(-1, lado * 8.5, 1, lado * 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = colorAcento;
  ctx.fillRect(11, -2.5, 3, 1.5);
  ctx.fillRect(5, 1, 2.5, 1.5);
}

function dibujarSiluetasSubmarinas(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  siluetas: readonly SiluetaSubmarina[],
  t: number,
): void {
  if (siluetas.length === 0) return;

  ctx.save();
  for (let i = 0; i < siluetas.length; i++) {
    const s = siluetas[i];
    const angOrbita = t * s.velocidad + s.fase;
    let sx = s.centro.x + Math.cos(angOrbita) * s.radioX;
    let sy = s.centro.y + Math.sin(angOrbita * 1.3) * s.radioY;
    const vx = -Math.sin(angOrbita) * s.radioX * s.velocidad;
    const vy = Math.cos(angOrbita * 1.3) * s.radioY * s.velocidad * 1.3;
    const rumbo = Math.atan2(vy, vx);

    const dist = consultarDistanciaMar(mascara, sx, sy, s.permitirBajoPuente);
    if (dist < 14) {
      const n = consultarNormalAgua(mascara, sx, sy, s.permitirBajoPuente);
      sx += n.x * (16 - dist);
      sy += n.y * (16 - dist);
      if (!esPosicionNavegable(mascara, sx, sy, 12, s.permitirBajoPuente)) continue;
    }

    const pulso = 0.42 + 0.1 * Math.sin(t * 0.0014 + s.fase);
    const colorBorde =
      s.matiz === "mistico"
        ? "rgba(167, 139, 250, 0.34)"
        : s.matiz === "glacial"
          ? "rgba(125, 211, 252, 0.32)"
          : "rgba(56, 189, 248, 0.28)";
    const colorAcento =
      s.matiz === "mistico"
        ? "rgba(196, 181, 253, 0.56)"
        : s.matiz === "glacial"
          ? "rgba(186, 230, 253, 0.52)"
          : "rgba(103, 232, 249, 0.48)";

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rumbo);
    ctx.scale(s.escala, s.escala);

    // Sombra abisal difusa inferior para sensación real de inmersión 2.5D
    ctx.globalAlpha = pulso * 0.46;
    ctx.fillStyle = "#00050e";
    ctx.beginPath();
    ctx.ellipse(-2, 2.5, 25, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = pulso;
    ctx.fillStyle =
      s.matiz === "mistico" ? "#0b1e44" : s.matiz === "glacial" ? "#05223d" : "#041b32";
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 1.1;

    if (s.especie === "mosasaurus") {
      dibujarSiluetaMosasaurusBajoAgua(ctx, t, s.fase, colorAcento);
    } else if (s.especie === "plesiosaurio") {
      dibujarSiluetaPlesiosaurioBajoAgua(ctx, t, s.fase, colorAcento);
    } else if (s.especie === "mantarraya") {
      dibujarSiluetaMantarrayaBajoAgua(ctx, t, s.fase, colorAcento);
    } else if (s.especie === "kraken") {
      dibujarSiluetaKrakenBajoAgua(ctx, t, s.fase, colorAcento);
    } else {
      dibujarSiluetaBallenaBajoAgua(ctx, t, s.fase, colorAcento);
    }

    ctx.restore();
  }
  ctx.restore();
}

function dibujarCuerpoLeviatan(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  centro: Punto2D,
  p: number,
  envolvente: number,
  dir: number,
  escala: number,
): void {
  const avance = (p - 0.5) * 82 * escala;
  dibujarEspumaEmergente(
    ctx,
    centro.x + avance * dir * 0.4,
    centro.y,
    18 * escala,
    7 * escala,
    p,
    envolvente,
    "rgba(224, 242, 254, 0.55)",
  );

  const nodosSombra = 14;
  for (let n = 0; n < nodosSombra; n++) {
    const u = n / (nodosSombra - 1);
    const sx = centro.x + (avance - u * 86 * escala) * dir;
    const sy = centro.y + 3 + Math.sin(u * Math.PI * 2.2 - p * Math.PI * 2) * 3.5;
    if (!esPosicionNavegable(mascara, sx, sy, 16, false) || estaCercaDePlaca(sx, sy, 12)) continue;
    const radioSombra = (10 - u * 5.2) * escala * (0.65 + 0.35 * envolvente);
    ctx.globalAlpha = envolvente * 0.36 * (1 - u * 0.35);
    ctx.fillStyle = "#010c1b";
    ctx.beginPath();
    ctx.ellipse(sx, sy, radioSombra * 1.25, radioSombra * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const segmentos = 6;
  for (let s = 0; s < segmentos; s++) {
    const u = s / (segmentos - 1);
    const sx = centro.x + (avance - s * 16.5 * escala) * dir;
    const arco = Math.sin(p * Math.PI * 2.1 - s * 0.85);
    if (arco <= -0.05) continue;
    const altura = Math.max(0, arco);
    const sy = centro.y - altura * 9 * escala + Math.sin(s * 1.1) * 2;
    if (!esPosicionNavegable(mascara, sx, sy, 16, false) || estaCercaDePlaca(sx, sy, 12)) continue;

    const radio = (s === 0 ? 10.5 : 8.6 - u * 4.2) * escala * (0.72 + 0.28 * envolvente);
    ctx.globalAlpha = envolvente * (0.58 + 0.42 * altura);

    ctx.fillStyle = "#06273c";
    ctx.beginPath();
    ctx.arc(sx, sy, radio, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#0e496b";
    ctx.beginPath();
    ctx.arc(sx - dir * 1.2, sy - 0.8, radio * 0.72, Math.PI * 1.15, -Math.PI * 0.15);
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx, sy, radio, Math.PI * 1.12, -Math.PI * 0.12);
    ctx.stroke();

    const rx = Math.round(sx);
    const ry = Math.round(sy);
    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(rx - 1, Math.round(sy - radio - 3), 2, 3);
    ctx.fillRect(rx - dir * 3, Math.round(sy - radio - 1), 2, 2);

    ctx.fillStyle = "rgba(224, 242, 254, 0.56)";
    ctx.fillRect(Math.round(sx - radio * 0.85), ry, 4, 1.5);
    ctx.fillRect(Math.round(sx + 2), ry + 1, 3, 1.5);

    if (s === 0) {
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(Math.round(sx + 4 * dir), ry - 5, 3, 2);
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(Math.round(sx + 5 * dir), ry - 5, 1.5, 1.5);
    }
  }
}

function dibujarCuerpoMosasaurus(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  centro: Punto2D,
  p: number,
  envolvente: number,
  dir: number,
  escala: number,
): void {
  const avance = (p - 0.5) * 82 * escala;
  const cx = centro.x + avance * dir;
  const cy = centro.y;
  if (!esPosicionNavegable(mascara, cx, cy, 18, false) || estaCercaDePlaca(cx, cy, 12)) return;

  // Sombra abisal larga unificando cabeza, dorso y cola bajo la superficie
  ctx.globalAlpha = envolvente * 0.44;
  ctx.fillStyle = "#010917";
  ctx.beginPath();
  ctx.ellipse(cx - 10 * dir * escala, cy + 4, 34 * escala, 9.5 * escala, 0, 0, Math.PI * 2);
  ctx.fill();

  dibujarEspumaEmergente(
    ctx,
    cx - 8 * dir * escala,
    cy,
    22 * escala,
    7.5 * escala,
    p,
    envolvente,
    "rgba(224, 242, 254, 0.62)",
  );

  // 1. Cabeza reptiliana con fauces acorazadas emergiendo en ángulo
  const saltoCabeza = Math.max(0, Math.sin(p * Math.PI * 1.65)) * 10 * escala;
  const hx = cx + 13 * dir * escala;
  const hy = cy - saltoCabeza;
  if (esPosicionNavegable(mascara, hx, hy, 16, false) && !estaCercaDePlaca(hx, hy, 12)) {
    ctx.globalAlpha = envolvente * 0.96;
    // Cráneo dorsal oscuro
    ctx.fillStyle = "#062135";
    ctx.beginPath();
    ctx.moveTo(hx - 12 * dir * escala, hy + 2);
    ctx.quadraticCurveTo(hx - 2 * dir * escala, hy - 10.5 * escala, hx + 18 * dir * escala, hy - 4 * escala);
    ctx.lineTo(hx + 6 * dir * escala, hy + 1 * escala);
    ctx.closePath();
    ctx.fill();

    // Placa craneal lunar + mandíbula inferior entreabierta
    ctx.fillStyle = "#0e496b";
    ctx.beginPath();
    ctx.moveTo(hx - 7 * dir * escala, hy - 0.5);
    ctx.lineTo(hx + 16 * dir * escala, hy - 4 * escala);
    ctx.lineTo(hx + 2 * dir * escala, hy - 7.5 * escala);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0a3551";
    ctx.beginPath();
    ctx.moveTo(hx - 2 * dir * escala, hy + 1);
    ctx.lineTo(hx + 14 * dir * escala, hy + 0.5 * escala);
    ctx.lineTo(hx + 4 * dir * escala, hy + 4.5 * escala);
    ctx.closePath();
    ctx.fill();

    // Contorno cian lunar y colmillos/ojo luminoso
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hx - 10 * dir * escala, hy + 0.5);
    ctx.quadraticCurveTo(hx + 1 * dir * escala, hy - 9.5 * escala, hx + 17.5 * dir * escala, hy - 4 * escala);
    ctx.stroke();

    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(Math.round(hx + 3 * dir * escala), Math.round(hy - 5.5 * escala), 2.5, 2);
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(Math.round(hx + 10 * dir * escala), Math.round(hy - 2.5 * escala), 1.5, 2);
    ctx.fillRect(Math.round(hx + 14 * dir * escala), Math.round(hy - 3 * escala), 1.5, 1.5);
  }

  // 2. Lomo arqueado con espinas dorsales, aleta pectoral y gotas de salpicadura
  const bx = cx - 12 * dir * escala;
  const by = cy - Math.max(0, Math.sin(p * Math.PI * 1.65 - 0.52)) * 8.2 * escala;
  if (esPosicionNavegable(mascara, bx, by, 16, false) && !estaCercaDePlaca(bx, by, 12)) {
    ctx.globalAlpha = envolvente * 0.92;
    ctx.fillStyle = "#06273c";
    ctx.beginPath();
    ctx.arc(bx, by + 1, 11.5 * escala, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#0e496b";
    ctx.beginPath();
    ctx.arc(bx - dir * 1.2, by, 8.2 * escala, Math.PI * 1.15, -Math.PI * 0.15);
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(bx, by + 1, 11.5 * escala, Math.PI * 1.12, -Math.PI * 0.12);
    ctx.stroke();

    // Espinas dorsales pixeladas sobre el lomo
    ctx.fillStyle = "#67e8f9";
    for (let sp = -1; sp <= 1; sp++) {
      ctx.fillRect(Math.round(bx + sp * 4.5 * escala), Math.round(by - 12.5 * escala + Math.abs(sp) * 2), 2, 3);
    }

    // Aleta lateral amplia rompiendo la superficie
    ctx.fillStyle = "#0b3a56";
    ctx.beginPath();
    ctx.moveTo(bx + 2 * dir * escala, by + 2);
    ctx.lineTo(bx - 5.5 * dir * escala, by - 10 * escala);
    ctx.lineTo(bx - 11.5 * dir * escala, by + 2);
    ctx.closePath();
    ctx.fill();

    // Gotas y espuma quebrada orgánicamente en la línea de flotación (sin barra recta rígida)
    ctx.fillStyle = "rgba(224, 242, 254, 0.72)";
    ctx.fillRect(Math.round(bx - 10 * escala), Math.round(cy + 1), 4, 1.5);
    ctx.fillRect(Math.round(bx - 2 * escala), Math.round(cy + 2), 5, 1.5);
    ctx.fillRect(Math.round(bx + 6 * escala), Math.round(cy + 1), 4, 1.5);
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(Math.round(bx - 8 * dir * escala), Math.round(by - 12 * escala), 1.5, 1.5);
  }

  // 3. Cola bilobada azotando con vórtice detrás del dorso
  const tx = cx - 35 * dir * escala;
  const ty = cy - Math.max(0, Math.sin(p * Math.PI * 2.0 - 1.15)) * 9.5 * escala;
  if (esPosicionNavegable(mascara, tx, ty, 16, false) && !estaCercaDePlaca(tx, ty, 12)) {
    ctx.globalAlpha = envolvente * 0.88;
    ctx.fillStyle = "#07304a";
    ctx.beginPath();
    ctx.moveTo(tx + 5 * dir * escala, ty + 2.5);
    ctx.lineTo(tx - 7 * dir * escala, ty - 13 * escala);
    ctx.lineTo(tx - 1.5 * dir * escala, ty - 3 * escala);
    ctx.lineTo(tx - 4.5 * dir * escala, ty + 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.fillStyle = "rgba(224, 242, 254, 0.68)";
    ctx.fillRect(Math.round(tx - 5), Math.round(cy + 1), 3, 1.5);
    ctx.fillRect(Math.round(tx + 1), Math.round(cy + 2), 3, 1.5);
  }
}

function dibujarCuerpoKraken(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  centro: Punto2D,
  p: number,
  envolvente: number,
  escala: number,
): void {
  if (!esPosicionNavegable(mascara, centro.x, centro.y, 18, false) || estaCercaDePlaca(centro.x, centro.y, 12)) {
    return;
  }

  // Remolino de tinta abisal oscura y espuma fragmentada
  ctx.globalAlpha = envolvente * 0.56;
  ctx.fillStyle = "#010612";
  ctx.beginPath();
  ctx.ellipse(centro.x, centro.y + 3, 33 * escala, 13 * escala, 0, 0, Math.PI * 2);
  ctx.fill();

  dibujarEspumaEmergente(
    ctx,
    centro.x,
    centro.y + 1,
    21 * escala,
    8.5 * escala,
    p,
    envolvente,
    "rgba(186, 230, 253, 0.62)",
  );

  // Siete tentáculos cónicos gruesos retorciéndose con ventosas sin aspecto de alambre
  for (let k = 0; k < TENTACULOS_KRAKEN_SURGIMIENTO.length; k++) {
    const ang = TENTACULOS_KRAKEN_SURGIMIENTO[k];
    const cicloTent = Math.sin(p * Math.PI * 2.25 + k * 0.95);
    if (cicloTent < -0.2) continue;
    const altBase = (0.38 + 0.62 * Math.max(0, cicloTent)) * 24 * escala;
    const bx = centro.x + Math.cos(ang) * 20 * escala;
    const by = centro.y + Math.sin(ang) * 5.8 * escala;
    const lado = Math.cos(ang) >= 0 ? 1 : -1;
    const tipX = bx + lado * 11 * escala + Math.sin(p * Math.PI * 3.8 + k * 1.4) * 5.2;
    const tipY = by - altBase;
    if (!esPosicionNavegable(mascara, tipX, tipY, 14, false) || estaCercaDePlaca(tipX, tipY, 10)) {
      continue;
    }

    const ctrlX = bx + (tipX - bx) * 0.32 + Math.cos(p * Math.PI * 2.9 + k) * 7.5;
    const ctrlY = by - altBase * 0.82;
    const dx = tipX - bx;
    const dy = tipY - by;
    const mag = Math.hypot(dx, dy) || 1;
    const nx = -dy / mag;
    const ny = dx / mag;
    const anchoBase = 3.6 * escala;
    const anchoMedio = 2.0 * escala;

    ctx.globalAlpha = envolvente * (0.72 + 0.28 * Math.max(0, cicloTent));
    // Silueta cónica rellena del tentáculo (gruesa en la ruptura, afilada en el látigo)
    ctx.fillStyle = "#081833";
    ctx.beginPath();
    ctx.moveTo(bx + nx * anchoBase, by + ny * anchoBase);
    ctx.quadraticCurveTo(ctrlX + nx * anchoMedio, ctrlY + ny * anchoMedio, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX - nx * anchoMedio, ctrlY - ny * anchoMedio, bx - nx * anchoBase, by - ny * anchoBase);
    ctx.closePath();
    ctx.fill();

    // Brillo lunar fino sobre el borde exterior y ventosas pálidas en la cara interna
    ctx.strokeStyle = k % 2 === 0 ? "#38bdf8" : "#818cf8";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(bx + nx * (anchoBase * 0.85), by + ny * (anchoBase * 0.85));
    ctx.quadraticCurveTo(ctrlX + nx * (anchoMedio * 0.85), ctrlY + ny * (anchoMedio * 0.85), tipX, tipY);
    ctx.stroke();

    ctx.fillStyle = "#c4b5fd";
    ctx.fillRect(Math.round((bx + ctrlX) * 0.5 - nx * 1.2), Math.round((by + ctrlY) * 0.5 - ny * 1.2), 2, 2);
    ctx.fillRect(
      Math.round((ctrlX + tipX) * 0.5 - nx * 0.6),
      Math.round((ctrlY + tipY) * 0.5 - ny * 0.6),
      1.5,
      1.5,
    );
    ctx.fillStyle = "rgba(224, 242, 254, 0.66)";
    ctx.fillRect(Math.round(bx - 3), Math.round(by), 3, 1.5);
    ctx.fillRect(Math.round(bx + 2), Math.round(by + 1), 2.5, 1.5);
  }

  // Manto cefalópodo picudo con aletas laterales y ojos luminosos abisales
  const asomoManto = Math.max(0, Math.sin(p * Math.PI * 1.25));
  if (asomoManto > 0.08) {
    const hManto = (14 + asomoManto * 9) * escala;
    const wManto = 12 * escala;
    ctx.globalAlpha = envolvente * 0.96;
    ctx.fillStyle = "#091730";
    ctx.beginPath();
    ctx.moveTo(centro.x - wManto, centro.y + 2);
    ctx.quadraticCurveTo(centro.x - wManto * 0.9, centro.y - hManto * 0.62, centro.x, centro.y - hManto);
    ctx.quadraticCurveTo(centro.x + wManto * 0.9, centro.y - hManto * 0.62, centro.x + wManto, centro.y + 2);
    ctx.closePath();
    ctx.fill();

    // Aletas laterales del manto y cresta interior púrpura-añil
    ctx.fillStyle = "#162d59";
    ctx.beginPath();
    ctx.moveTo(centro.x - wManto * 0.65, centro.y - 1);
    ctx.quadraticCurveTo(centro.x, centro.y - hManto * 0.84, centro.x + wManto * 0.35, centro.y - 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(centro.x - wManto * 0.92, centro.y + 1);
    ctx.quadraticCurveTo(centro.x - wManto * 0.85, centro.y - hManto * 0.62, centro.x, centro.y - hManto);
    ctx.quadraticCurveTo(centro.x + wManto * 0.85, centro.y - hManto * 0.62, centro.x + wManto * 0.92, centro.y + 1);
    ctx.stroke();

    // Ojos abisales rasgados
    ctx.fillStyle = "#a5f3fc";
    ctx.fillRect(Math.round(centro.x - 5 * escala), Math.round(centro.y - 4.5 * asomoManto * escala), 3, 2);
    ctx.fillRect(Math.round(centro.x + 2 * escala), Math.round(centro.y - 4.5 * asomoManto * escala), 3, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(centro.x - 4 * escala), Math.round(centro.y - 4.5 * asomoManto * escala), 1, 1);
    ctx.fillRect(Math.round(centro.x + 3 * escala), Math.round(centro.y - 4.5 * asomoManto * escala), 1, 1);
  }
}

function dibujarAvistamientosAbisales(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  datos: DatosOceanoVivo,
  t: number,
  reducirMovimiento: boolean,
): void {
  if (reducirMovimiento) return;

  const lista = datos.avistamientosAbisales;
  ctx.save();
  if (lista.length > 0) {
    for (let i = 0; i < lista.length; i++) {
      const av = lista[i];
      const tiempoLocal = (t + av.desfase) % av.duracionCiclo;
      if (tiempoLocal > av.duracionAparicion) continue;
      const p = tiempoLocal / av.duracionAparicion;
      const envolvente = Math.sin(p * Math.PI);

      ctx.save();
      if (av.especie === "leviatan") {
        dibujarCuerpoLeviatan(ctx, mascara, av.centro, p, envolvente, av.direccion, av.escala);
      } else if (av.especie === "mosasaurus") {
        dibujarCuerpoMosasaurus(ctx, mascara, av.centro, p, envolvente, av.direccion, av.escala);
      } else {
        dibujarCuerpoKraken(ctx, mascara, av.centro, p, envolvente, av.escala);
      }
      ctx.restore();
    }
  } else if (datos.zonasLeviatan.length > 0) {
    // simplificacion: respaldo cuando pruebas sintéticas solo proveen zonasLeviatan
    const duracionCiclo = 18_000;
    const duracionAparicion = 5_800;
    const cicloIdx = Math.floor(t / duracionCiclo);
    const enCiclo = t % duracionCiclo;
    if (enCiclo <= duracionAparicion) {
      const p = enCiclo / duracionAparicion;
      dibujarCuerpoLeviatan(
        ctx,
        mascara,
        datos.zonasLeviatan[cicloIdx % datos.zonasLeviatan.length],
        p,
        Math.sin(p * Math.PI),
        cicloIdx % 2 === 0 ? 1 : -1,
        1,
      );
    }
  }
  ctx.restore();
}

function dibujarOlasYEstelasSuperficie(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  estelasV: readonly EstelaSuperficie[],
  t: number,
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
): void {
  const pasoX = 128;
  const pasoY = 66;
  const colIni = Math.floor(xMin / pasoX) * pasoX;
  const rowIni = Math.floor(yMin / pasoY) * pasoY;

  ctx.save();
  for (let oy = rowIni; oy <= yMax; oy += pasoY) {
    const filaIdx = Math.round(oy / pasoY);
    for (let ox = colIni; ox <= xMax; ox += pasoX) {
      const colIdx = Math.round(ox / pasoX);
      const jx = hashCelda(colIdx, filaIdx);
      const jy = hashCelda(colIdx + 37, filaIdx + 73);
      const fase = jx * Math.PI * 2;
      const wx = ox + (jx - 0.2) * 86 + Math.sin(t * 0.001 + fase + filaIdx * 0.7) * 16;
      const wy = oy + (jy - 0.2) * 42 + Math.cos(t * 0.0008 + fase) * 3;

      const dist = consultarDistanciaMar(mascara, wx, wy, false);
      if (dist < 18) continue;
      if (
        !esPosicionNavegable(mascara, wx - 11, wy, 12, false) ||
        !esPosicionNavegable(mascara, wx + 11, wy, 12, false)
      ) {
        continue;
      }

      const factorCosta = Math.min(1, (dist - 18) / 16);
      const pulso = 0.5 + 0.5 * Math.sin(t * 0.0018 + colIdx * 1.1 + filaIdx * 0.8);
      const alfa = (0.1 + pulso * 0.14) * factorCosta;
      const rx = Math.round(wx);
      const ry = Math.round(wy);

      // Cresta pixelada arqueada en perspectiva 2.5D (sin barras horizontales uniformes)
      ctx.fillStyle = `rgba(2, 19, 39, ${(alfa * 0.92).toFixed(3)})`;
      ctx.fillRect(rx - 7, ry + 2, 14, 1.5);

      ctx.fillStyle = `rgba(125, 211, 252, ${(alfa * 0.88).toFixed(3)})`;
      ctx.fillRect(rx - 8, ry + 1, 4, 1.5);
      ctx.fillRect(rx - 4, ry, 8, 1.5);
      ctx.fillRect(rx + 4, ry + 1, 4, 1.5);

      ctx.fillStyle = `rgba(224, 242, 254, ${(alfa * 0.65).toFixed(3)})`;
      ctx.fillRect(rx - 2, ry - 1, 4, 1);
    }
  }

  // Micro-estelas pixeladas en V disipándose en canales abiertos (cero líneas vectoriales rígidas)
  for (let i = 0; i < estelasV.length; i++) {
    const e = estelasV[i];
    const ciclo = (t * 0.00018 + e.fase) % 1;
    const desplazamiento = (ciclo - 0.5) * 24;
    const ex = e.x + e.dx * desplazamiento;
    const ey = e.y + e.dy * desplazamiento;
    if (!esPosicionNavegable(mascara, ex, ey, 16, false)) continue;

    const alfa = Math.sin(ciclo * Math.PI) * 0.28;
    const px = -e.dy;
    const py = e.dx;
    ctx.fillStyle = `rgba(186, 230, 253, ${alfa.toFixed(3)})`;
    ctx.fillRect(Math.round(ex), Math.round(ey), 2, 2);
    for (let k = 1; k <= 3; k++) {
      const paso = (k / 3) * e.tamano;
      const sep = paso * 0.52;
      const al = alfa * (1 - k * 0.22);
      ctx.fillStyle = `rgba(186, 230, 253, ${al.toFixed(3)})`;
      ctx.fillRect(
        Math.round(ex - e.dx * paso + px * sep),
        Math.round(ey - e.dy * paso + py * sep),
        2,
        1.5,
      );
      ctx.fillRect(
        Math.round(ex - e.dx * paso - px * sep),
        Math.round(ey - e.dy * paso - py * sep),
        2,
        1.5,
      );
    }
  }
  ctx.restore();
}

function dibujarResacaYHitosRegionales(
  ctx: CanvasRenderingContext2D,
  mascara: MascaraOceano,
  datos: DatosOceanoVivo,
  t: number,
): void {
  ctx.save();

  // 1. Resaca rítmica orgánica (cuentas y micro-crestas pixeladas) abrazando la base de los acantilados
  for (let i = 0; i < datos.puntosEspuma.length; i++) {
    const p = datos.puntosEspuma[i];
    const marea = Math.sin(t * 0.0024 + p.fase);
    const alfa = 0.24 + (marea + 1) * 0.11;
    const ex = p.x + p.nx * (1.2 + marea * 2.1);
    const ey = p.y + p.ny * (1.2 + marea * 2.1);
    const tx = -p.ny;
    const ty = p.nx;

    if (p.clima === "glacial") {
      ctx.fillStyle = `rgba(224, 242, 254, ${alfa.toFixed(3)})`;
    } else if (p.clima === "volcanico") {
      ctx.fillStyle = `rgba(253, 186, 116, ${(alfa * 0.85).toFixed(3)})`;
    } else if (p.clima === "mistico") {
      ctx.fillStyle = `rgba(103, 232, 249, ${(alfa * 0.95).toFixed(3)})`;
    } else {
      ctx.fillStyle = `rgba(186, 230, 253, ${alfa.toFixed(3)})`;
    }

    const r = Math.round(p.ancho * 0.35);
    ctx.fillRect(Math.round(ex - 1.5), Math.round(ey - 1), 3, 2);
    ctx.fillRect(Math.round(ex + tx * r - 1), Math.round(ey + ty * r - 1), 2, 2);
    if (marea > -0.2) {
      const fx = ex + p.nx * 3.5;
      const fy = ey + p.ny * 3.5;
      ctx.fillStyle =
        p.clima === "volcanico"
          ? `rgba(254, 215, 170, ${(alfa * 0.52).toFixed(3)})`
          : `rgba(224, 242, 254, ${(alfa * 0.55).toFixed(3)})`;
      ctx.fillRect(Math.round(fx - tx * 2 - 1), Math.round(fy - ty * 2 - 1), 2, 1.5);
    }
  }

  // 2. Norte glacial: bloques de hielo 2.5D con cantos biselados y escarcha a la deriva
  for (let i = 0; i < datos.bloquesHielo.length; i++) {
    const h = datos.bloquesHielo[i];
    const hx = h.x + Math.sin(t * 0.00055 + h.fase) * h.amplitudX;
    const hy = h.y + Math.cos(t * 0.0007 + h.fase) * h.amplitudY;
    if (!esPosicionNavegable(mascara, hx, hy, h.radio + 3, false)) continue;

    const r = h.radio;
    const rx = Math.round(hx);
    const ry = Math.round(hy);

    // Sombra sumergida y anillo de agua fría
    ctx.fillStyle = "rgba(8, 51, 88, 0.52)";
    ctx.beginPath();
    ctx.ellipse(hx, hy + 3, r * 1.18, r * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pared frontal biselada de hielo azul glaciar
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.92, hy + 0.5);
    ctx.lineTo(hx - r * 0.5, hy + r * 0.52);
    ctx.lineTo(hx + r * 0.35, hy + r * 0.58);
    ctx.lineTo(hx + r * 0.95, hy + 1);
    ctx.lineTo(hx + r * 0.3, hy + r * 0.25);
    ctx.lineTo(hx - r * 0.55, hy + r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Plataforma superior nevada y brillos cristalinos pixelados
    ctx.fillStyle = "#bae6fd";
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.92, hy);
    ctx.lineTo(hx - r * 0.35, hy - r * 0.52);
    ctx.lineTo(hx + r * 0.55, hy - r * 0.42);
    ctx.lineTo(hx + r * 0.95, hy);
    ctx.lineTo(hx + r * 0.3, hy + r * 0.28);
    ctx.lineTo(hx - r * 0.55, hy + r * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(240, 249, 255, 0.92)";
    ctx.fillRect(Math.round(rx - r * 0.45), Math.round(ry - r * 0.32), Math.round(r * 0.85), 2);
    ctx.fillRect(rx + Math.round(r * 1.15), ry - 1, 2, 2);
  }

  // 3. Oeste y Sur: estelas portuarias junto a escalinata de Villa Serena y turbulencia en cascada de Puesto del Río
  const fasePuerto = (t * 0.00045) % 1;
  for (const [mx, my] of [
    [406, 853],
    [432, 822],
  ] as const) {
    if (!esPosicionNavegable(mascara, mx, my, 2, false)) continue;
    ctx.strokeStyle = `rgba(186, 230, 253, ${((1 - fasePuerto) * 0.42).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(mx, my, 7 + fasePuerto * 13, 2.8 + fasePuerto * 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let k = 0; k < 2; k++) {
    const fc = (t * 0.0012 + k * 0.5) % 1;
    ctx.strokeStyle = `rgba(224, 242, 254, ${((1 - fc) * 0.66).toFixed(3)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(744, 593 + fc * 4, 15 + fc * 20, 4.5 + fc * 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let g = 0; g < 6; g++) {
    const fg = (t * 0.0016 + g * 0.167) % 1;
    const gx = 744 + Math.sin(g * 2.3 + fg * 4) * (10 + fg * 10);
    const gy = 590 - Math.sin(fg * Math.PI) * 9 + fg * 6;
    ctx.fillStyle = `rgba(224, 242, 254, ${((1 - fg) * 0.82).toFixed(3)})`;
    ctx.fillRect(Math.round(gx), Math.round(gy), 2, 2);
  }

  // 4. Centro-Sur: destellos bioluminiscentes en aguas someras de Lago Espejo y Bosque
  for (const [bx, by, violeta] of [
    [682, 838, true],
    [945, 838, true],
    [1220, 842, false],
    [1515, 815, false],
  ] as const) {
    if (!esPosicionNavegable(mascara, bx, by, 4, false)) continue;
    const br = 0.25 + 0.25 * Math.sin(t * 0.0032 + bx * 0.05);
    ctx.fillStyle = violeta
      ? `rgba(167, 139, 250, ${br.toFixed(3)})`
      : `rgba(52, 211, 153, ${br.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(bx, by, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Este volcánico: reflejo rielante cálido en olas, burbujas hirvientes y vapor pixelado bajo magma
  const pulsoLava = 0.72 + 0.28 * Math.sin(t * 0.0045);
  for (const [vx, vy, rad] of [
    [1324, 502, 26],
    [1475, 558, 28],
    [1536, 548, 28],
  ] as const) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(249, 115, 22, ${(0.28 * pulsoLava).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(vx, vy + 6, rad, rad * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let r = 0; r < 3; r++) {
      const rw = rad * (0.95 - r * 0.22);
      const rx = vx - rw * 0.5 + Math.sin(t * 0.0032 + r * 2.1 + vx) * 4;
      ctx.fillStyle = `rgba(251, 146, 60, ${(0.44 - r * 0.1).toFixed(3)})`;
      ctx.fillRect(Math.round(rx), Math.round(vy + 4 + r * 3.8), Math.round(rw), 2);
    }
    ctx.restore();

    for (let b = 0; b < 4; b++) {
      const fb = (t * 0.00095 + b * 0.25 + vx * 0.01) % 1;
      const bx = vx + Math.sin(fb * 6 + b) * 9;
      const by = vy + 4 - fb * 18;
      ctx.fillStyle = `rgba(254, 215, 170, ${((1 - fb) * 0.7).toFixed(3)})`;
      ctx.fillRect(Math.round(bx), Math.round(by), 2, 2);

      const fv = (t * 0.00046 + b * 0.25 + vx * 0.02) % 1;
      const sx = Math.round(vx + Math.sin(fv * 4 + b) * 7);
      const sy = Math.round(vy - 2 - fv * 19);
      ctx.fillStyle = `rgba(254, 215, 170, ${((1 - fv) * 0.16).toFixed(3)})`;
      ctx.fillRect(sx - 3, sy, 6, 2);
      ctx.fillRect(sx - 1, sy - 2, 3, 2);
    }
  }

  ctx.restore();
}

/**
 * Dibuja todas las capas del océano vivo por debajo de la lámina transparente de islas y puentes.
 */
export function dibujarOceanoVivo(
  ctx: CanvasRenderingContext2D,
  recursos: RecursosOceanoVivo,
  tiempo: number,
  reducirMovimiento: boolean,
  vistaMundo?: VistaCamaraMundo,
): void {
  const t = reducirMovimiento ? 0 : tiempo;
  const xMin = Math.floor((vistaMundo?.minX ?? -400) - 240);
  const yMin = Math.floor((vistaMundo?.minY ?? -300) - 240);
  const xMax = Math.ceil((vistaMundo?.maxX ?? DIMENSIONES_MAPA_MUNDO.ancho + 400) + 240);
  const yMax = Math.ceil((vistaMundo?.maxY ?? DIMENSIONES_MAPA_MUNDO.alto + 300) + 240);

  dibujarFondoAbisalYCausticas(ctx, recursos, t, xMin, yMin, xMax - xMin, yMax - yMin);
  dibujarCorrientesMarinas(ctx, recursos.datos.corrientes, t);
  dibujarSiluetasSubmarinas(ctx, recursos.mascara, recursos.datos.siluetasSubmarinas, t);
  dibujarFaunaSubmarina(ctx, recursos.mascara, recursos.datos, t);
  dibujarOlasYEstelasSuperficie(
    ctx,
    recursos.mascara,
    recursos.datos.estelasV,
    t,
    xMin,
    yMin,
    xMax,
    yMax,
  );
  dibujarAvistamientosAbisales(ctx, recursos.mascara, recursos.datos, t, reducirMovimiento);
  dibujarResacaYHitosRegionales(ctx, recursos.mascara, recursos.datos, t);
}

/**
 * Dibuja detalles atmosféricos superficiales sobre la lámina de islas: rocío de cascada,
 * vapor térmico en la costa volcánica y pequeñas aves marinas lejanas sobre aguas exteriores.
 */
export function dibujarAvesMarinasLejanas(
  ctx: CanvasRenderingContext2D,
  recursos: RecursosOceanoVivo,
  tiempo: number,
  reducirMovimiento: boolean,
): void {
  const t = reducirMovimiento ? 0 : tiempo;
  const { aves } = recursos.datos;

  ctx.save();
  // Rocío en la base donde rompe la cascada de Puesto del Río y jirones pixelados de vapor en costa volcánica
  for (let b = 0; b < 4; b++) {
    const fb = (t * 0.001 + b * 0.25) % 1;
    const rx = 744 + Math.sin(fb * 5 + b * 1.4) * 11;
    const ry = 591 - Math.sin(fb * Math.PI) * 7 + fb * 3;
    ctx.fillStyle = `rgba(224, 242, 254, ${((1 - fb) * 0.45).toFixed(3)})`;
    ctx.fillRect(Math.round(rx), Math.round(ry), 2, 2);

    const fv = (t * 0.00048 + b * 0.25) % 1;
    const vx = Math.round(1324 + Math.sin(fv * 4.5 + b) * 7);
    const vy = Math.round(496 - fv * 22);
    ctx.fillStyle = `rgba(254, 215, 170, ${((1 - fv) * 0.16).toFixed(3)})`;
    ctx.fillRect(vx - 3, vy, 6, 2);
    ctx.fillRect(vx - 1, vy - 2, 3, 2);
  }

  if (aves.length > 0) {
    ctx.strokeStyle = "rgba(226, 232, 240, 0.56)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";

    for (let i = 0; i < aves.length; i++) {
      const bandada = aves[i];
      const ang = t * bandada.velocidad + bandada.fase;
      for (let k = 0; k < bandada.cantidad; k++) {
        const ax = bandada.centro.x + Math.cos(ang - k * 0.25) * bandada.radioX + k * 9;
        const ay = bandada.centro.y + Math.sin(ang * 1.3 - k * 0.25) * bandada.radioY + k * 5;
        if (!esPosicionNavegable(recursos.mascara, ax, ay, 24, false)) continue;
        if (estaCercaDePlaca(ax, ay, 18)) continue;

        const aleteo = Math.sin(t * 0.011 + k * 1.7 + i) * 1.8;
        ctx.beginPath();
        ctx.moveTo(ax - 3.5, ay + aleteo);
        ctx.lineTo(ax, ay - 1.2);
        ctx.lineTo(ax + 3.5, ay + aleteo);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
