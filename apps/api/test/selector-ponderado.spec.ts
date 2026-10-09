import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { GeneradorAleatorioFijo } from '../src/comun/azar/generador-aleatorio.interface';
import { SelectorPonderado, ElementoPonderado } from '../src/comun/azar/selector-ponderado.util';

describe('SelectorPonderado e invariante INV-01', () => {
  const tablaEjemplo: ElementoPonderado<string>[] = [
    { elemento: 'ENCUENTRO', peso: 60 },
    { elemento: 'OBJETO', peso: 25 },
    { elemento: 'SIN_EVENTO', peso: 15 },
  ];

  it('debe rechazar colecciones vacías o con suma de pesos igual a cero (INV-01)', () => {
    assert.throws(() => new SelectorPonderado([]));
    assert.throws(
      () =>
        new SelectorPonderado([
          { elemento: 'A', peso: 0 },
          { elemento: 'B', peso: 0 },
        ]),
      /INV-01/,
    );
  });

  it('debe seleccionar de forma exacta y determinista con generador fijo', () => {
    // Suma total = 100
    // [0, 60) -> ENCUENTRO (0.0 a 0.599)
    // [60, 85) -> OBJETO (0.60 a 0.849)
    // [85, 100) -> SIN_EVENTO (0.85 a 0.999)
    const generadorFijo = new GeneradorAleatorioFijo([
      0.0,    // ENCUENTRO
      0.59,   // ENCUENTRO
      0.60,   // OBJETO
      0.84,   // OBJETO
      0.85,   // SIN_EVENTO
      0.999,  // SIN_EVENTO
    ]);

    const selector = new SelectorPonderado(tablaEjemplo, generadorFijo);

    assert.strictEqual(selector.seleccionar(), 'ENCUENTRO');
    assert.strictEqual(selector.seleccionar(), 'ENCUENTRO');
    assert.strictEqual(selector.seleccionar(), 'OBJETO');
    assert.strictEqual(selector.seleccionar(), 'OBJETO');
    assert.strictEqual(selector.seleccionar(), 'SIN_EVENTO');
    assert.strictEqual(selector.seleccionar(), 'SIN_EVENTO');
  });

  it('debe respetar la distribución teórica normalizada en 10,000 iteraciones', () => {
    const selector = new SelectorPonderado(tablaEjemplo);
    const frecuencias: Record<string, number> = {
      ENCUENTRO: 0,
      OBJETO: 0,
      SIN_EVENTO: 0,
    };

    const TOTAL_PRUEBAS = 10000;
    for (let i = 0; i < TOTAL_PRUEBAS; i++) {
      const elegido = selector.seleccionar();
      frecuencias[elegido]++;
    }

    // Tolerancia estadística de +/- 2.5% respecto a 60%, 25% y 15%
    assert.ok(frecuencias.ENCUENTRO / TOTAL_PRUEBAS > 0.575);
    assert.ok(frecuencias.ENCUENTRO / TOTAL_PRUEBAS < 0.625);

    assert.ok(frecuencias.OBJETO / TOTAL_PRUEBAS > 0.225);
    assert.ok(frecuencias.OBJETO / TOTAL_PRUEBAS < 0.275);

    assert.ok(frecuencias.SIN_EVENTO / TOTAL_PRUEBAS > 0.125);
    assert.ok(frecuencias.SIN_EVENTO / TOTAL_PRUEBAS < 0.175);
  });
});
