import type { ItemInventario, CategoriaObjeto } from '../api/ApiJuego';

/**
 * Lotes predeterminados de aprovisionamiento rápido para la tienda y bazar.
 */
export const LOTES_COMPRA = [1, 5, 10] as const;
export type LoteCompra = (typeof LOTES_COMPRA)[number];

export interface ResumenCompra {
  cantidad: number;
  costoTotal: number;
  saldoRestante: number;
  puedeComprar: boolean;
}

export interface VistaPreviaCuracion {
  hpNuevo: number;
  curacionEfectiva: number;
  yaSaludCompleta: boolean;
}

/**
 * Normaliza y acota una cantidad de compra numérica a un entero en el rango [1, maximo].
 */
export function normalizarCantidadCompra(valor: number, maximo = 99): number {
  if (!Number.isFinite(valor) || valor < 1) {
    return 1;
  }
  return Math.max(1, Math.min(maximo, Math.trunc(valor)));
}

/**
 * Calcula el desglose económico de una compra de artículos para proyección reactiva en la UI.
 * Nota: El servidor recalcula unilateralmente el costo y saldo oficial en POST /api/tienda/comprar (S-6).
 */
export function calcularResumenCompra(
  precioUnitario: number,
  cantidad: number,
  saldoMonedas: number,
): ResumenCompra {
  const cantidadNormalizada = normalizarCantidadCompra(cantidad);
  const precioValido = Math.max(0, Math.trunc(precioUnitario));
  const costoTotal = precioValido * cantidadNormalizada;
  const saldoRestante = saldoMonedas - costoTotal;
  const puedeComprar = saldoRestante >= 0;

  return {
    cantidad: cantidadNormalizada,
    costoTotal,
    saldoRestante,
    puedeComprar,
  };
}

/**
 * Filtra la colección de posesiones del inventario por categoría seleccionada sin mutar el arreglo original.
 */
export function filtrarItemsPorCategoria(
  items: readonly ItemInventario[],
  categoria: 'TODOS' | CategoriaObjeto,
): ItemInventario[] {
  if (categoria === 'TODOS') {
    return [...items];
  }
  return items.filter((item) => item.tipo === categoria);
}

/**
 * Proyecta la restauración de salud según la regla matemática INV-03 sin sobrecuración.
 */
export function calcularVistaPreviaCuracion(
  hpActual: number,
  hpMaximo: number,
  efectoValor: number,
): VistaPreviaCuracion {
  const hpBase = Math.max(0, hpActual);
  const hpTope = Math.max(1, hpMaximo);
  const yaSaludCompleta = hpBase >= hpTope;
  const hpNuevo = Math.min(hpTope, hpBase + Math.max(0, efectoValor));
  const curacionEfectiva = yaSaludCompleta ? 0 : Math.max(0, hpNuevo - hpBase);

  return {
    hpNuevo,
    curacionEfectiva,
    yaSaludCompleta,
  };
}
