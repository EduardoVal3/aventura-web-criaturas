/**
 * Motor cinemático y perfiles visuales 16-bit por bioma para la transición de viaje entre zonas.
 * Módulo puro sin dependencias DOM para permitir pruebas deterministas en Node.
 */
import type { ConfiguracionIslaMapa } from "./mapa-mundo.ts";

export type BiomaAethelgard = ConfiguracionIslaMapa["bioma"];

export type TipoClimaViaje =
  | "chispas_puerto"
  | "polen_pradera"
  | "gotas_lago"
  | "brasas_puesto"
  | "luciernagas_bosque"
  | "viento_riscos"
  | "nieve_bastion"
  | "ceniza_volcan"
  | "ventisca_glaciar";

export type TipoBajoPuente = "oceano" | "lago" | "valle" | "abismo" | "magma" | "glaciar";

export interface PerfilVisualBiomaViaje {
  bioma: BiomaAethelgard;
  tituloRegion: string;
  colorCieloTinte: string;
  colorAcento: string;
  colorSecundario: string;
  colorPiedraBase: string;
  colorPiedraLuz: string;
  colorPiedraSombra: string;
  colorPiedraDetalle: string;
  colorAbismoSuperior: string;
  colorAbismoInferior: string;
  colorReflejo: string;
  colorParticula: string;
  colorPolvoPaso: string;
  tipoClima: TipoClimaViaje;
  tipoBajoPuente: TipoBajoPuente;
  tieneAurora?: boolean;
  tieneHacesLuz?: boolean;
}

export interface ResultadoRumboBrujula {
  etiqueta: string;
  sigla: string;
  anguloGrados: number;
}

export interface EstadoCinematicoViaje {
  t: number;
  progresoSuave: number;
  posicionVeloNormX: number;
  intensidadCruceVelo: number;
  criaturaNormX: number;
  saltoPx: number;
  escalaX: number;
  escalaY: number;
  inclinacionRad: number;
  desplazamientoPuenteNorm: number;
  intensidadPortal: number;
  opacidadCriatura: number;
  opacidadTituloDestino: number;
  desplazamientoTituloPx: number;
  opacidadCortinaEntrada: number;
  opacidadCortinaSalida: number;
  faseEtiqueta: "saliendo" | "cruzando" | "llegando";
}

export interface RectanguloProyeccionCover {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const DURACION_VIAJE_MS = 2250;
export const DURACION_VIAJE_REDUCIDO_MS = 750;

export const PERFILES_BIOMA_VIAJE: Record<BiomaAethelgard, PerfilVisualBiomaViaje> = {
  puerto: {
    bioma: "puerto",
    tituloRegion: "Puerto del Alba",
    colorCieloTinte: "#0c182c",
    colorAcento: "#f59e0b",
    colorSecundario: "#38bdf8",
    colorPiedraBase: "#473c32",
    colorPiedraLuz: "#7a6856",
    colorPiedraSombra: "#231c17",
    colorPiedraDetalle: "#d97706",
    colorAbismoSuperior: "#071b30",
    colorAbismoInferior: "#030c18",
    colorReflejo: "#fbbf24",
    colorParticula: "#fde68a",
    colorPolvoPaso: "#d6b88d",
    tipoClima: "chispas_puerto",
    tipoBajoPuente: "oceano",
  },
  pradera: {
    bioma: "pradera",
    tituloRegion: "Sendas de Pradera",
    colorCieloTinte: "#191229",
    colorAcento: "#eab308",
    colorSecundario: "#84cc16",
    colorPiedraBase: "#4b473a",
    colorPiedraLuz: "#78715d",
    colorPiedraSombra: "#23211a",
    colorPiedraDetalle: "#65a30d",
    colorAbismoSuperior: "#101b14",
    colorAbismoInferior: "#060c09",
    colorReflejo: "#a3e635",
    colorParticula: "#fef08a",
    colorPolvoPaso: "#bef264",
    tipoClima: "polen_pradera",
    tipoBajoPuente: "valle",
    tieneHacesLuz: true,
  },
  lago: {
    bioma: "lago",
    tituloRegion: "Riberas Bioluminiscentes",
    colorCieloTinte: "#14102b",
    colorAcento: "#14d1e8",
    colorSecundario: "#a855f7",
    colorPiedraBase: "#2b3d48",
    colorPiedraLuz: "#4e6d7d",
    colorPiedraSombra: "#121d24",
    colorPiedraDetalle: "#22d3ee",
    colorAbismoSuperior: "#0c1c31",
    colorAbismoInferior: "#050b18",
    colorReflejo: "#22d3ee",
    colorParticula: "#67e8f9",
    colorPolvoPaso: "#67e8f9",
    tipoClima: "gotas_lago",
    tipoBajoPuente: "lago",
  },
  puesto: {
    bioma: "puesto",
    tituloRegion: "Frontera del Río",
    colorCieloTinte: "#101926",
    colorAcento: "#f59e0b",
    colorSecundario: "#2dd4bf",
    colorPiedraBase: "#45392d",
    colorPiedraLuz: "#6e5c4a",
    colorPiedraSombra: "#201913",
    colorPiedraDetalle: "#f59e0b",
    colorAbismoSuperior: "#091c2b",
    colorAbismoInferior: "#040d16",
    colorReflejo: "#38bdf8",
    colorParticula: "#fdba74",
    colorPolvoPaso: "#d6c3a5",
    tipoClima: "brasas_puesto",
    tipoBajoPuente: "oceano",
  },
  bosque: {
    bioma: "bosque",
    tituloRegion: "Espesura Ancestral",
    colorCieloTinte: "#071813",
    colorAcento: "#22c55e",
    colorSecundario: "#86efac",
    colorPiedraBase: "#2b3a30",
    colorPiedraLuz: "#4a6352",
    colorPiedraSombra: "#111b15",
    colorPiedraDetalle: "#4ade80",
    colorAbismoSuperior: "#081711",
    colorAbismoInferior: "#030907",
    colorReflejo: "#4ade80",
    colorParticula: "#86efac",
    colorPolvoPaso: "#86efac",
    tipoClima: "luciernagas_bosque",
    tipoBajoPuente: "valle",
    tieneHacesLuz: true,
  },
  riscos: {
    bioma: "riscos",
    tituloRegion: "Desfiladero de Obsidiana",
    colorCieloTinte: "#181020",
    colorAcento: "#a855f7",
    colorSecundario: "#f97316",
    colorPiedraBase: "#3b353c",
    colorPiedraLuz: "#625864",
    colorPiedraSombra: "#1b171d",
    colorPiedraDetalle: "#c084fc",
    colorAbismoSuperior: "#180d1a",
    colorAbismoInferior: "#09040a",
    colorReflejo: "#c084fc",
    colorParticula: "#d8b4fe",
    colorPolvoPaso: "#a78bfa",
    tipoClima: "viento_riscos",
    tipoBajoPuente: "abismo",
  },
  bastion: {
    bioma: "bastion",
    tituloRegion: "Murallas del Norte",
    colorCieloTinte: "#0a1324",
    colorAcento: "#38bdf8",
    colorSecundario: "#f59e0b",
    colorPiedraBase: "#3a4554",
    colorPiedraLuz: "#64768d",
    colorPiedraSombra: "#19202a",
    colorPiedraDetalle: "#7dd3fc",
    colorAbismoSuperior: "#0a1526",
    colorAbismoInferior: "#040812",
    colorReflejo: "#7dd3fc",
    colorParticula: "#e0f2fe",
    colorPolvoPaso: "#bae6fd",
    tipoClima: "nieve_bastion",
    tipoBajoPuente: "glaciar",
  },
  volcan: {
    bioma: "volcan",
    tituloRegion: "Caverna de Magma",
    colorCieloTinte: "#1e0910",
    colorAcento: "#f97316",
    colorSecundario: "#c084fc",
    colorPiedraBase: "#2f2228",
    colorPiedraLuz: "#543b43",
    colorPiedraSombra: "#140c10",
    colorPiedraDetalle: "#fb923c",
    colorAbismoSuperior: "#2b0a0a",
    colorAbismoInferior: "#120406",
    colorReflejo: "#fb923c",
    colorParticula: "#fdba74",
    colorPolvoPaso: "#fb923c",
    tipoClima: "ceniza_volcan",
    tipoBajoPuente: "magma",
  },
  glaciar: {
    bioma: "glaciar",
    tituloRegion: "Cumbres Glaciales",
    colorCieloTinte: "#071426",
    colorAcento: "#7dd3fc",
    colorSecundario: "#2dd4bf",
    colorPiedraBase: "#3b536b",
    colorPiedraLuz: "#7ea7cc",
    colorPiedraSombra: "#192838",
    colorPiedraDetalle: "#bae6fd",
    colorAbismoSuperior: "#081c30",
    colorAbismoInferior: "#030b16",
    colorReflejo: "#7dd3fc",
    colorParticula: "#e0f2fe",
    colorPolvoPaso: "#e0f2fe",
    tipoClima: "ventisca_glaciar",
    tipoBajoPuente: "glaciar",
    tieneAurora: true,
  },
};

export function obtenerPerfilBiomaViaje(bioma: BiomaAethelgard): PerfilVisualBiomaViaje {
  return PERFILES_BIOMA_VIAJE[bioma] ?? PERFILES_BIOMA_VIAJE.pradera;
}

function limitar01(valor: number): number {
  return Math.max(0, Math.min(1, valor));
}

function easeOutCubic(x: number): number {
  const v = limitar01(x);
  return 1 - Math.pow(1 - v, 3);
}

function easeInOutCubic(x: number): number {
  const v = limitar01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
}

function easeOutExpo(x: number): number {
  const v = limitar01(x);
  return v === 1 ? 1 : 1 - Math.pow(2, -10 * v);
}

function parsearHex(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "").trim();
  if (limpio.length === 3) {
    return [
      parseInt(limpio[0] + limpio[0], 16),
      parseInt(limpio[1] + limpio[1], 16),
      parseInt(limpio[2] + limpio[2], 16),
    ];
  }
  if (limpio.length >= 6) {
    return [
      parseInt(limpio.slice(0, 2), 16),
      parseInt(limpio.slice(2, 4), 16),
      parseInt(limpio.slice(4, 6), 16),
    ];
  }
  return [20, 209, 232];
}

/**
 * Interpola linealmente entre dos colores hexadecimales retornando formato rgba(...) válido para Canvas 2D.
 */
export function mezclarColorRgba(hexA: string, hexB: string, factor: number, alfa = 1): string {
  const f = limitar01(factor);
  const [r1, g1, b1] = parsearHex(hexA);
  const [r2, g2, b2] = parsearHex(hexB);
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);
  return `rgba(${r}, ${g}, ${b}, ${limitar01(alfa).toFixed(3)})`;
}

const RUMBOS_BRUJULA: readonly { etiqueta: string; sigla: string }[] = [
  { etiqueta: "Rumbo Este", sigla: "E" },
  { etiqueta: "Rumbo Sureste", sigla: "SE" },
  { etiqueta: "Rumbo Sur", sigla: "S" },
  { etiqueta: "Rumbo Suroeste", sigla: "SO" },
  { etiqueta: "Rumbo Oeste", sigla: "O" },
  { etiqueta: "Rumbo Noroeste", sigla: "NO" },
  { etiqueta: "Rumbo Norte", sigla: "N" },
  { etiqueta: "Rumbo Noreste", sigla: "NE" },
];

/**
 * Calcula el rumbo cardinal real sobre el archipiélago de Aethelgard entre dos islas.
 */
export function calcularRumboBrujula(
  origen: Pick<ConfiguracionIslaMapa, "x" | "y">,
  destino: Pick<ConfiguracionIslaMapa, "x" | "y">,
): ResultadoRumboBrujula {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return { etiqueta: "Senda Directa", sigla: "E", anguloGrados: 90 };
  }
  const rad = Math.atan2(dy, dx);
  const degMat = ((rad * 180) / Math.PI + 360) % 360;
  const indice = Math.round(degMat / 45) % 8;
  const rumbo = RUMBOS_BRUJULA[indice] ?? RUMBOS_BRUJULA[0];
  // Ángulo de brújula respecto al norte (0° = arriba) para rotar el icono de flecha/aguja
  const anguloBrujula = (degMat + 90) % 360;
  return {
    etiqueta: rumbo.etiqueta,
    sigla: rumbo.sigla,
    anguloGrados: Math.round(anguloBrujula),
  };
}

/**
 * Calcula el recorte estilo `object-cover` con paneo horizontal suave dentro de la ilustración de zona.
 * Garantiza proporción exacta sin deformaciones tanto en móvil vertical como en escritorio panorámico.
 */
export function calcularProyeccionCover(
  anchoImagen: number,
  altoImagen: number,
  anchoCanvas: number,
  altoCanvas: number,
  paneoNorm = 0.5,
  zoom = 1.06,
): RectanguloProyeccionCover {
  const wImg = Math.max(1, anchoImagen);
  const hImg = Math.max(1, altoImagen);
  const wCan = Math.max(1, anchoCanvas);
  const hCan = Math.max(1, altoCanvas);
  const z = Math.max(1, zoom);

  const ratioImg = wImg / hImg;
  const ratioCan = wCan / hCan;

  let swBase: number;
  let shBase: number;
  if (ratioImg > ratioCan) {
    shBase = hImg;
    swBase = hImg * ratioCan;
  } else {
    swBase = wImg;
    shBase = wImg / ratioCan;
  }

  const sw = swBase / z;
  const sh = shBase / z;
  const margenX = Math.max(0, wImg - sw);
  const margenY = Math.max(0, hImg - sh);

  return {
    sx: margenX * limitar01(paneoNorm),
    sy: margenY * 0.42,
    sw,
    sh,
  };
}

/**
 * Evalúa la cinemática determinista completa de la travesía para un instante normalizado t ∈ [0, 1].
 */
export function evaluarEstadoViaje(tCrudo: number): EstadoCinematicoViaje {
  const t = limitar01(tCrudo);
  const progresoSuave = easeInOutCubic(t);

  // El Velo Astral entra desde el borde derecho (1.18) y barre hasta la izquierda (-0.18) entre t=0.18 y t=0.72
  const tVelo = limitar01((t - 0.18) / 0.54);
  const posicionVeloNormX = 1.18 - easeInOutCubic(tVelo) * 1.36;

  // Posición horizontal de la criatura líder: irrupción ágil -> avance heroico -> impulso final al portal
  let criaturaNormX: number;
  if (t < 0.16) {
    criaturaNormX = -0.08 + easeOutCubic(t / 0.16) * 0.34;
  } else if (t < 0.80) {
    const u = (t - 0.16) / 0.64;
    criaturaNormX = 0.26 + u * 0.34 + Math.sin(u * Math.PI) * 0.03;
  } else {
    const u = (t - 0.80) / 0.20;
    criaturaNormX = 0.60 + easeInOutCubic(u) * 0.27;
  }

  // Distancia entre la criatura y el Velo Astral para detonar el destello de cruce de bioma
  const distanciaVelo = Math.abs(criaturaNormX - posicionVeloNormX);
  const intensidadCruceVelo =
    t >= 0.22 && t <= 0.72 ? limitar01(1 - distanciaVelo / 0.16) : 0;

  // Zancada física con gravedad aparente y deformación elástica sutil (squash & stretch)
  const frecuenciaZancadas = 8.5;
  const faseZancada = (t * frecuenciaZancadas) % 1;
  // Curva parabólica de salto (4u(1-u)) más viva que una senoide plana
  const arcoSalto = Math.max(0, 4 * faseZancada * (1 - faseZancada));
  const atenuacionFinal = t > 0.86 ? limitar01(1 - (t - 0.86) / 0.14) : 1;
  const saltoPx = Math.pow(arcoSalto, 0.82) * 18 * atenuacionFinal;

  const contactoSuelo = faseZancada < 0.14 || faseZancada > 0.88 ? 1 : 0;
  const escalaX = contactoSuelo ? 1.06 : 1 - arcoSalto * 0.045;
  const escalaY = contactoSuelo ? 0.94 : 1 + arcoSalto * 0.055;
  const inclinacionRad =
    (0.05 + arcoSalto * 0.055 + intensidadCruceVelo * 0.04) * atenuacionFinal;

  // Desplazamiento acumulado del puente y pilares en parallax
  const desplazamientoPuenteNorm = t * 2.35 + easeInOutCubic(t) * 0.55;

  // Encendido del arco rúnico de llegada y disolución suave de la criatura al entrar al portal
  const intensidadPortal = t > 0.68 ? easeOutCubic((t - 0.68) / 0.24) : 0;
  const opacidadCriatura =
    t > 0.89 ? limitar01(1 - (t - 0.89) / 0.09) : 1;

  // Aparición del estandarte JRPG de la zona destino justo después de cruzar el Velo
  let opacidadTituloDestino = 0;
  let desplazamientoTituloPx = 14;
  if (t >= 0.45 && t < 0.88) {
    const entrada = easeOutExpo((t - 0.45) / 0.16);
    opacidadTituloDestino = entrada;
    desplazamientoTituloPx = (1 - entrada) * 14;
  } else if (t >= 0.88) {
    const salida = limitar01((t - 0.88) / 0.10);
    opacidadTituloDestino = 1 - salida;
    desplazamientoTituloPx = -salida * 6;
  }

  // Cortinas oscuras hacia/desde Abismo Astral (nunca destellos blancos, docs/DESIGN.md §8)
  const opacidadCortinaEntrada = t < 0.12 ? 1 - easeOutCubic(t / 0.12) : 0;
  const opacidadCortinaSalida = t > 0.88 ? easeInOutCubic((t - 0.88) / 0.12) : 0;

  const faseEtiqueta =
    t < 0.34 ? "saliendo" : t < 0.66 ? "cruzando" : "llegando";

  return {
    t,
    progresoSuave,
    posicionVeloNormX,
    intensidadCruceVelo,
    criaturaNormX,
    saltoPx,
    escalaX,
    escalaY,
    inclinacionRad,
    desplazamientoPuenteNorm,
    intensidadPortal,
    opacidadCriatura,
    opacidadTituloDestino,
    desplazamientoTituloPx,
    opacidadCortinaEntrada,
    opacidadCortinaSalida,
    faseEtiqueta,
  };
}
