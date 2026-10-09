export interface GeneradorAleatorio {
  /**
   * Genera un número pseudoaleatorio en el intervalo uniforme [0, 1).
   */
  generar(): number;
}

/**
 * Implementación predeterminada para producción basada en la plataforma nativa.
 */
export class GeneradorAleatorioNativo implements GeneradorAleatorio {
  generar(): number {
    return Math.random();
  }
}

/**
 * Generador determinista para pruebas automatizadas con secuencia fija de valores.
 */
export class GeneradorAleatorioFijo implements GeneradorAleatorio {
  private indice = 0;

  constructor(private readonly secuencia: number[]) {
    if (!secuencia || secuencia.length === 0) {
      throw new Error('La secuencia fija no puede estar vacía.');
    }
  }

  generar(): number {
    const valor = this.secuencia[this.indice % this.secuencia.length];
    this.indice++;
    return valor;
  }
}
