import { GeneradorAleatorio, GeneradorAleatorioNativo } from './generador-aleatorio.interface';

export interface ElementoPonderado<T> {
  elemento: T;
  peso: number;
}

export class SelectorPonderado<T> {
  private readonly sumaPesos: number;

  constructor(
    private readonly items: ElementoPonderado<T>[],
    private readonly generador: GeneradorAleatorio = new GeneradorAleatorioNativo(),
  ) {
    if (!items || items.length === 0) {
      throw new Error('La lista de elementos a ponderar no puede estar vacía.');
    }

    // Invariante INV-01: Suma de pesos estrictamente positiva
    this.sumaPesos = items.reduce((acumulado, actual) => {
      if (actual.peso < 0) {
        throw new Error(`El peso de un elemento no puede ser negativo: ${actual.peso}`);
      }
      return acumulado + actual.peso;
    }, 0);

    if (this.sumaPesos <= 0) {
      throw new Error('INV-01: La suma total de pesos debe ser estrictamente positiva (> 0).');
    }
  }

  /**
   * Selecciona un elemento evaluando el valor del generador [0, 1)
   * normalizado sobre la suma total de pesos.
   */
  seleccionar(): T {
    // simplificacion: búsqueda acumulada lineal O(k); óptima para k <= 20 elementos de tablas de zona.
    const valorSorteado = this.generador.generar() * this.sumaPesos;
    let acumulado = 0;

    for (const item of this.items) {
      acumulado += item.peso;
      if (valorSorteado < acumulado) {
        return item.elemento;
      }
    }

    // Salvaguarda matemática para redondeos en el límite superior exacto
    return this.items[this.items.length - 1].elemento;
  }

  obtenerSumaPesos(): number {
    return this.sumaPesos;
  }
}
