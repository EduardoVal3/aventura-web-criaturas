/**
 * Motor puro de combate táctico, afinidades elementales, estados y resonancia.
 * Diseñado conforme a las reglas de Aethelgard (§2.1, §2.2, §2.5, §2.8 y §4).
 * Es autoritativo, determinista y completamente desacoplado de Prisma.
 */

// ============================================================================
// 1. AFINIDADES ELEMENTALES Y DAÑO
// ============================================================================

export const ELEMENTOS = [
  'fisico',
  'fuego',
  'agua',
  'natura',
  'sombra',
  'luz',
] as const;

export type Elemento = (typeof ELEMENTOS)[number];

export type EtiquetaEfectividad = 'VENTAJA' | 'NEUTRAL' | 'DESVENTAJA';

/**
 * Matriz inmutable de afinidades elementales (§3.1).
 * Fila = atacante; Columna = defensor.
 * Valores: ventaja 1.5x, desventaja 0.75x, neutral 1.0x.
 */
const MATRIZ_AFINIDADES_BASE: Record<Elemento, Record<Elemento, number>> = {
  fisico: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 1.0,
    luz: 1.0,
  },
  fuego: {
    fisico: 1.0,
    fuego: 0.75,
    agua: 0.75,
    natura: 1.5,
    sombra: 1.0,
    luz: 1.0,
  },
  agua: {
    fisico: 1.0,
    fuego: 1.5,
    agua: 0.75,
    natura: 0.75,
    sombra: 1.0,
    luz: 1.0,
  },
  natura: {
    fisico: 1.0,
    fuego: 0.75,
    agua: 1.5,
    natura: 0.75,
    sombra: 1.0,
    luz: 1.0,
  },
  sombra: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 0.75,
    luz: 1.5,
  },
  luz: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 1.5,
    luz: 0.75,
  },
};

function congelarMatriz<T extends Record<string, Record<string, number>>>(
  matriz: T,
): Readonly<T> {
  for (const fila of Object.values(matriz)) {
    Object.freeze(fila);
  }
  return Object.freeze(matriz);
}

export const TABLA_AFINIDADES: Readonly<
  Record<Elemento, Readonly<Record<Elemento, number>>>
> = congelarMatriz(MATRIZ_AFINIDADES_BASE);

/**
 * Obtiene el multiplicador de afinidad entre el elemento atacante y el defensor.
 * Si alguno es desconocido o nulo, asume neutralidad (1.0).
 */
// simplificacion: elemento no reconocido o indefinido asume factor neutro 1.0 por compatibilidad con datos legados y mocks.
export function multiplicadorAfinidad(
  atacante?: string | null,
  defensor?: string | null,
): number {
  if (!atacante || !defensor) return 1.0;
  const fila = (TABLA_AFINIDADES as Record<string, Record<string, number>>)[atacante];
  if (!fila) return 1.0;
  return fila[defensor] ?? 1.0;
}

/**
 * Determina la etiqueta textual de efectividad a partir del multiplicador numérico.
 */
export function etiquetaEfectividad(multiplicador: number): EtiquetaEfectividad {
  if (multiplicador > 1.0) return 'VENTAJA';
  if (multiplicador < 1.0) return 'DESVENTAJA';
  return 'NEUTRAL';
}

/**
 * Calcula el daño final según la fórmula de equilibrio del juego (§2.1).
 * danoBruto = floor((ataque / max(1, defensa)) * poder * 0.8 + nivel * 0.5)
 * danoFinal = max(1, danoBruto) -> Cumple INV-04
 */
// simplificacion: factor base 1.0 para compatibilidad con tests unitarios existentes
export function calcularDano(
  ataque: number,
  defensa: number,
  poder: number,
  nivel: number,
  factorVariacion: number = 1.0,
): number {
  const danoBruto = (ataque / Math.max(1, defensa)) * poder * 0.8 + nivel * 0.5;
  const danoConVariacion = Math.floor(danoBruto * factorVariacion);
  return Math.max(1, danoConVariacion); // Cumple INV-04
}

/**
 * Aplica daño al HP respetando el intervalo [0, hpMaximo] (§2.1 e INV-03).
 */
export function aplicarDano(
  hpPrevio: number,
  danoFinal: number,
  hpMaximo: number,
): number {
  return Math.max(0, Math.min(hpMaximo, hpPrevio - danoFinal));
}

/**
 * Calcula el daño final aplicando factor de variación y efectividad elemental (§3.2).
 * Garantiza INV-04 (danoFinal >= 1).
 */
export function calcularDanoElemental(
  ataque: number,
  defensa: number,
  poder: number,
  nivel: number,
  factorVariacion: number = 1.0,
  elementoAtacante?: Elemento | string | null,
  elementoDefensor?: Elemento | string | null,
): number {
  const m = multiplicadorAfinidad(elementoAtacante, elementoDefensor);
  return calcularDano(ataque, defensa, poder, nivel, factorVariacion * m);
}
