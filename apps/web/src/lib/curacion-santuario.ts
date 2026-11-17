/**
 * Lógica pura, clasificación de estados vitales y cálculos del Santuario de Curación (§2.9, INV-03).
 */

export type EstadoVitalCriatura = "PLENA_VITALIDAD" | "HERIDA" | "DEBILITADA";

/**
 * Clasifica de forma pura el estado de vitalidad táctica de una criatura.
 */
export function clasificarEstadoVital(
  hpActual: number,
  hpMaximo: number,
): EstadoVitalCriatura {
  if (hpActual <= 0) {
    return "DEBILITADA";
  }
  if (hpActual >= hpMaximo) {
    return "PLENA_VITALIDAD";
  }
  return "HERIDA";
}

/**
 * Devuelve la etiqueta de texto en español estricto para cada estado vital táctico.
 */
export function etiquetaEstadoVital(estado: EstadoVitalCriatura): string {
  switch (estado) {
    case "PLENA_VITALIDAD":
      return "PLENA VITALIDAD";
    case "HERIDA":
      return "HERIDA";
    case "DEBILITADA":
      return "DEBILITADA / CAÍDA";
  }
}

/**
 * Calcula el déficit de puntos de vitalidad bajo el invariante INV-03.
 * Garantiza que ninguna criatura sobrecure ni reciba valores negativos.
 */
export function calcularDeltaCuracion(
  hpActual: number,
  hpMaximo: number,
): number {
  const hpBase = Math.max(0, hpActual);
  const hpTope = Math.max(1, hpMaximo);
  return Math.max(0, hpTope - hpBase);
}
