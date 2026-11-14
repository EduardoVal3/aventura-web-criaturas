import { sanitizarSlugZona } from "@/lib/assets";

export interface PuntoPlataforma {
  /** Posición horizontal (%) dentro del escenario 16:9 donde apoya el centro de la criatura. */
  x: number;
  /** Posición vertical (%) desde arriba donde tocan los pies de la criatura sobre la plataforma. */
  y: number;
}

export interface CalibracionArenaZona {
  /** Plataforma en primer plano (abajo-izquierda) para la criatura aliada. */
  aliado: PuntoPlataforma;
  /** Plataforma elevada (arriba-derecha) para la criatura rival. */
  rival: PuntoPlataforma;
  /** Anclaje (%) de la carta HUD del rival (arriba-izquierda sin cubrir al rival). */
  cartaRival: { top: number; left: number };
  /** Anclaje (%) de la carta HUD del aliado (abajo-derecha sin cubrir al aliado). */
  cartaAliado: { bottom: number; right: number };
}

/**
 * Calibración milimétrica por escenario real (800x450, 16:9).
 * Cada coordenada corresponde al centro de apoyo de la plataforma dibujada en `/assets/battlegrounds/*.webp`.
 */
export const CALIBRACION_ARENAS_ZONA: Record<string, CalibracionArenaZona> = {
  "bosque-susurrante": {
    aliado: { x: 37, y: 84 },
    rival: { x: 72, y: 41 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "cueva-umbria": {
    aliado: { x: 29, y: 86 },
    rival: { x: 77, y: 41 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "paso-de-los-riscos": {
    aliado: { x: 30, y: 85 },
    rival: { x: 63, y: 38 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "pico-de-la-cumbre": {
    aliado: { x: 34, y: 84 },
    rival: { x: 74, y: 44 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "praderas-del-amanecer": {
    aliado: { x: 34, y: 84 },
    rival: { x: 72, y: 42 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
  "riberas-del-lago-espejo": {
    aliado: { x: 22, y: 89 },
    rival: { x: 77, y: 51 },
    cartaRival: { top: 4, left: 3 },
    cartaAliado: { bottom: 4, right: 3 },
  },
};

const CALIBRACION_POR_DEFECTO: CalibracionArenaZona = {
  aliado: { x: 32, y: 85 },
  rival: { x: 73, y: 43 },
  cartaRival: { top: 4, left: 3 },
  cartaAliado: { bottom: 4, right: 3 },
};

/**
 * Devuelve la calibración exacta de plataformas y cartas HUD para una zona de combate.
 */
export function obtenerCalibracionArena(zoneId?: string | null): CalibracionArenaZona {
  if (!zoneId) return CALIBRACION_POR_DEFECTO;
  const slug = sanitizarSlugZona(zoneId);
  return CALIBRACION_ARENAS_ZONA[slug] ?? CALIBRACION_POR_DEFECTO;
}
