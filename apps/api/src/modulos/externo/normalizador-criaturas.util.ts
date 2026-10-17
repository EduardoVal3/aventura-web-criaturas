/**
 * Extremos calibrados según docs/catalogo-criaturas.md §2.1 y Anexo A.3
 */
export const EXTREMOS_CALIBRADOS = {
  HP: { min: 11, max: 184 },
  ATAQUE: { min: 3.5, max: 15.0 },
  DEFENSA: { min: 8, max: 18 },
  VELOCIDAD: { min: 20, max: 90 },
};

export function calcularHpBase(hitPoints: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.HP;
  return Math.round(30 + (70 * (hitPoints - min)) / (max - min));
}

export function calcularAtaqueBase(mejorAtaque: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.ATAQUE;
  return Math.round(30 + (70 * (mejorAtaque - min)) / (max - min));
}

export function calcularDefensaBase(armorClass: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.DEFENSA;
  return Math.round(30 + (70 * (armorClass - min)) / (max - min));
}

export function calcularVelocidadBase(speedMax: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.VELOCIDAD;
  return Math.round(30 + (70 * (speedMax - min)) / (max - min));
}

export function calcularTasaCaptura(challengeRating: number): number {
  const valor = 0.90 - 0.07 * challengeRating;
  const redondeado = Number(valor.toFixed(2));
  return Math.max(0.10, Math.min(0.90, redondeado));
}

export function extraerLadosDelDado(damageDieType: string): number {
  const match = damageDieType.match(/\d+/);
  return match ? parseInt(match[0], 10) : 6;
}

export function calcularPoderAtaque(
  damageDieCount: number,
  damageDieType: string,
  damageBonus: number | null,
): number {
  const lados = extraerLadosDelDado(damageDieType);
  const promedioDado = lados / 2 + 0.5;
  const bono = damageBonus ?? 0;
  return damageDieCount * promedioDado + bono;
}

export function extraerVelocidadMaxima(speedAll: Record<string, unknown>): number {
  if (!speedAll || typeof speedAll !== 'object') {
    return 30;
  }
  let max = 0;
  for (const [key, value] of Object.entries(speedAll)) {
    if (key !== 'unit' && key !== 'hover' && typeof value === 'number') {
      if (value > max) {
        max = value;
      }
    }
  }
  return max > 0 ? max : 30;
}

import { BESTIARIO } from './bestiario-canonico';

/**
 * Diccionario canónico de las 30 especies derivado directamente del bestiario soberano
 */
export const CATALOGO_ESPECIES_PROPENSO: Record<
  string,
  {
    nombre: string;
    slug: string;
    tipo: string;
    esEspecial: boolean;
    descripcion: string;
  }
> = Object.fromEntries(
  BESTIARIO.map((esp) => [
    esp.idExterno,
    {
      nombre: esp.nombre,
      slug: esp.slug,
      tipo: esp.tipo,
      esEspecial: esp.esEspecial,
      descripcion: esp.descripcion,
    },
  ]),
);

/**
 * Tabla de correspondencia oficial de movimientos (obsoleta, los movimientos ahora residen en BESTIARIO)
 */
export const TRADUCCION_MOVIMIENTOS: Record<
  string,
  Record<string, { nombre: string; tipoAccion: string }>
> = {};

