import { sanitizarSlugZona } from "./assets.ts";

/** Relación de aspecto nativa de las 6 ilustraciones canónicas de batalla (800×450, 16:9). */
export const ASPECTO_ESCENARIO_CANONICO = 800 / 450;

export interface PuntoPlataforma {
  /** Posición horizontal (%) sobre la ilustración original 800×450 donde apoya el centro de la criatura. */
  x: number;
  /** Posición vertical (%) desde arriba sobre la ilustración original 800×450 donde tocan los pies/sombra. */
  y: number;
}

export interface CalibracionArenaZona {
  /** Plataforma en primer plano (abajo-izquierda) para la criatura aliada en coordenadas de la imagen 800×450. */
  aliado: PuntoPlataforma;
  /** Plataforma elevada (arriba-derecha) para la criatura rival en coordenadas de la imagen 800×450. */
  rival: PuntoPlataforma;
  /** Punto focal (%) aplicado a CSS object-position para mantener ambas plataformas encuadradas en desktop y móvil. */
  foco: PuntoPlataforma;
  /** Anclaje (%) de la carta HUD del rival (arriba-izquierda sin cubrir al rival). */
  cartaRival: { top: number; left: number };
  /** Anclaje (%) de la carta HUD del aliado (abajo-derecha sin cubrir al aliado). */
  cartaAliado: { bottom: number; right: number };
}

export interface DimensionesArenaProyeccion {
  /** Ancho total renderizado de BattlefieldBackground (px). */
  anchoFondo: number;
  /** Alto total renderizado de BattlefieldBackground (px). */
  altoFondo: number;
  /** Ancho del contenedor interno de sprites de arena (px). */
  anchoArena: number;
  /** Alto del contenedor interno de sprites de arena (px). */
  altoArena: number;
  /** Desplazamiento vertical (px) entre el tope del fondo y el tope del contenedor de arena (altura de la barra de turno). */
  offsetSuperior: number;
}

export interface PosicionProyectadaArena {
  xPx: number;
  yPx: number;
  xPct: number;
  yPct: number;
}

/**
 * Calibración medida píxel a píxel sobre cada ilustración real (800×450, 16:9) en `/assets/battlegrounds/*.webp`.
 * Cada punto (x, y) corresponde al centro de apoyo exacto de la plataforma dibujada en la imagen fuente.
 */
export const CALIBRACION_ARENAS_ZONA: Record<string, CalibracionArenaZona> = {
  "bosque-susurrante": {
    aliado: { x: 38, y: 76 },
    rival: { x: 70, y: 41 },
    foco: { x: 54, y: 56 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "cueva-umbria": {
    aliado: { x: 34, y: 76 },
    rival: { x: 73, y: 41 },
    foco: { x: 55, y: 55 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "paso-de-los-riscos": {
    aliado: { x: 32, y: 76 },
    rival: { x: 64, y: 37 },
    foco: { x: 48, y: 55 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "pico-de-la-cumbre": {
    aliado: { x: 38, y: 77 },
    rival: { x: 71, y: 42 },
    foco: { x: 54, y: 57 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "praderas-del-amanecer": {
    aliado: { x: 36, y: 76 },
    rival: { x: 70, y: 42 },
    foco: { x: 53, y: 56 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "riberas-del-lago-espejo": {
    aliado: { x: 26, y: 87 },
    rival: { x: 73, y: 51 },
    foco: { x: 54, y: 66 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
};

const CALIBRACION_POR_DEFECTO: CalibracionArenaZona = {
  aliado: { x: 34, y: 76 },
  rival: { x: 70, y: 41 },
  foco: { x: 52, y: 56 },
  cartaRival: { top: 4, left: 3 },
  cartaAliado: { bottom: 4, right: 3 },
};

/**
 * Devuelve la calibración exacta de plataformas, foco object-position y cartas HUD para una zona de combate.
 */
export function obtenerCalibracionArena(zoneId?: string | null): CalibracionArenaZona {
  if (!zoneId) return CALIBRACION_POR_DEFECTO;
  const slug = sanitizarSlugZona(zoneId);
  return CALIBRACION_ARENAS_ZONA[slug] ?? CALIBRACION_POR_DEFECTO;
}

/**
 * Proyecta un punto (x%, y%) de la ilustración nativa 16:9 al espacio real del contenedor de arena,
 * compensando el recorte de CSS `object-cover`, `object-position` y la altura de la barra superior de turno.
 */
export function proyectarPlataformaEnArena(
  punto: PuntoPlataforma,
  foco: PuntoPlataforma,
  dimensiones: DimensionesArenaProyeccion | null,
  limites: {
    margenX: number;
    margenSuperior: number;
    margenInferior: number;
  },
  aspectoImagen = ASPECTO_ESCENARIO_CANONICO,
): PosicionProyectadaArena {
  if (
    !dimensiones ||
    dimensiones.anchoFondo <= 0 ||
    dimensiones.altoFondo <= 0 ||
    dimensiones.anchoArena <= 0 ||
    dimensiones.altoArena <= 0
  ) {
    return {
      xPx: 0,
      yPx: 0,
      xPct: punto.x,
      yPct: punto.y,
    };
  }

  const { anchoFondo, altoFondo, anchoArena, altoArena, offsetSuperior } = dimensiones;
  const aspectoContenedor = anchoFondo / altoFondo;

  // Cálculo exacto de dimensiones renderizadas por CSS object-fit: cover
  let anchoRenderizado: number;
  let altoRenderizado: number;
  if (aspectoContenedor >= aspectoImagen) {
    anchoRenderizado = anchoFondo;
    altoRenderizado = anchoFondo / aspectoImagen;
  } else {
    altoRenderizado = altoFondo;
    anchoRenderizado = altoFondo * aspectoImagen;
  }

  const desplazamientoX = (anchoFondo - anchoRenderizado) * (foco.x / 100);
  const desplazamientoY = (altoFondo - altoRenderizado) * (foco.y / 100);

  const xCrudo = desplazamientoX + (punto.x / 100) * anchoRenderizado;
  const yCrudo = desplazamientoY + (punto.y / 100) * altoRenderizado - offsetSuperior;

  const minX = Math.min(limites.margenX, anchoArena / 2);
  const maxX = Math.max(minX, anchoArena - limites.margenX);
  const minY = Math.min(limites.margenSuperior, altoArena);
  const maxY = Math.max(minY, altoArena - limites.margenInferior);

  const xPx = Math.max(minX, Math.min(maxX, xCrudo));
  const yPx = Math.max(minY, Math.min(maxY, yCrudo));

  return {
    xPx,
    yPx,
    xPct: (xPx / anchoArena) * 100,
    yPct: (yPx / altoArena) * 100,
  };
}
