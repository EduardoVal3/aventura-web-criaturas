import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  TABLA_AFINIDADES,
  ELEMENTOS,
  multiplicadorAfinidad,
  etiquetaEfectividad,
  calcularDanoElemental,
  Elemento,
} from '../src/modulos/combate/dominio/motor-combate';

describe('Motor de Combate Táctico y Afinidades Elementales (Subfase 10k)', () => {
  describe('Afinidades Elementales y Daño Elemental (§3.1 y §3.2)', () => {
    it('la matriz tiene 6x6 entradas, solo valores {0.75, 1.0, 1.5} y recuentos exactos 5 / 8 / 23', () => {
      const filas = Object.keys(TABLA_AFINIDADES);
      assert.strictEqual(filas.length, 6, 'Debe contener exactamente 6 elementos');

      let ventajas = 0;
      let desventajas = 0;
      let neutrales = 0;

      for (const atacante of ELEMENTOS) {
        const fila = TABLA_AFINIDADES[atacante];
        assert.ok(fila, `La fila del elemento ${atacante} debe existir`);
        const columnas = Object.keys(fila);
        assert.strictEqual(columnas.length, 6, `La fila ${atacante} debe tener 6 columnas`);

        for (const defensor of ELEMENTOS) {
          const mult = fila[defensor];
          assert.ok(
            mult === 0.75 || mult === 1.0 || mult === 1.5,
            `El multiplicador para ${atacante} vs ${defensor} debe ser 0.75, 1.0 o 1.5; recibido ${mult}`,
          );

          if (mult === 1.5) ventajas++;
          else if (mult === 0.75) desventajas++;
          else if (mult === 1.0) neutrales++;
        }
      }

      assert.strictEqual(ventajas, 5, 'Debe haber exactamente 5 ventajas elementales');
      assert.strictEqual(desventajas, 8, 'Debe haber exactamente 8 desventajas elementales');
      assert.strictEqual(neutrales, 23, 'Debe haber exactamente 23 neutralidades elementales');
    });

    it('Object.isFrozen se cumple en la tabla y en cada fila (inmutabilidad estricta)', () => {
      assert.strictEqual(Object.isFrozen(TABLA_AFINIDADES), true, 'TABLA_AFINIDADES debe estar congelada');
      for (const elemento of ELEMENTOS) {
        assert.strictEqual(
          Object.isFrozen(TABLA_AFINIDADES[elemento]),
          true,
          `La fila ${elemento} debe estar congelada`,
        );
      }

      assert.throws(
        () => {
          // @ts-expect-error mutación intencional para verificar inmutabilidad
          TABLA_AFINIDADES.fuego.natura = 2.0;
        },
        TypeError,
        'Mutar una fila congelada debe lanzar TypeError',
      );
    });

    it('las 5 ventajas elementales coinciden con el canon y fisico es neutral con todos', () => {
      // Canon: fuego > natura > agua > fuego; sombra <> luz
      assert.strictEqual(multiplicadorAfinidad('fuego', 'natura'), 1.5);
      assert.strictEqual(etiquetaEfectividad(1.5), 'VENTAJA');

      assert.strictEqual(multiplicadorAfinidad('agua', 'fuego'), 1.5);
      assert.strictEqual(multiplicadorAfinidad('natura', 'agua'), 1.5);
      assert.strictEqual(multiplicadorAfinidad('sombra', 'luz'), 1.5);
      assert.strictEqual(multiplicadorAfinidad('luz', 'sombra'), 1.5);

      // Desventajas
      assert.strictEqual(multiplicadorAfinidad('fuego', 'agua'), 0.75);
      assert.strictEqual(etiquetaEfectividad(0.75), 'DESVENTAJA');
      assert.strictEqual(multiplicadorAfinidad('agua', 'natura'), 0.75);
      assert.strictEqual(multiplicadorAfinidad('natura', 'fuego'), 0.75);
      assert.strictEqual(multiplicadorAfinidad('sombra', 'sombra'), 0.75);
      assert.strictEqual(multiplicadorAfinidad('luz', 'luz'), 0.75);

      // Fisico neutral contra todos
      for (const el of ELEMENTOS) {
        assert.strictEqual(multiplicadorAfinidad('fisico', el), 1.0);
        assert.strictEqual(multiplicadorAfinidad(el, 'fisico'), 1.0);
      }
      assert.strictEqual(etiquetaEfectividad(1.0), 'NEUTRAL');
    });

    it('calcularDanoElemental aplica ventaja (15), desventaja (7) y neutral (10) correctamente', () => {
      // Vector del workflow: Atacante Nv 3, ataque 45, defensa 50, poder 12, factorVariacion 1.0 -> danoBruto = 10.14
      // Ventaja: floor(10.14 * 1.5) = 15
      const danoVentaja = calcularDanoElemental(45, 50, 12, 3, 1.0, 'fuego', 'natura');
      assert.strictEqual(danoVentaja, 15);

      // Desventaja: floor(10.14 * 0.75) = 7
      const danoDesventaja = calcularDanoElemental(45, 50, 12, 3, 1.0, 'fuego', 'agua');
      assert.strictEqual(danoDesventaja, 7);

      // Neutral: floor(10.14 * 1.0) = 10
      const danoNeutral = calcularDanoElemental(45, 50, 12, 3, 1.0, 'fisico', 'fisico');
      assert.strictEqual(danoNeutral, 10);
    });

    it('INV-04: barrido de los 36 pares con factor 0.85 y defensa extrema siempre devuelve >= 1 y entero', () => {
      for (const atacante of ELEMENTOS) {
        for (const defensor of ELEMENTOS) {
          const dano = calcularDanoElemental(1, 999999, 1, 1, 0.85, atacante, defensor);
          assert.strictEqual(dano >= 1, true, `Daño debe ser >= 1 para ${atacante} vs ${defensor}`);
          assert.strictEqual(Number.isInteger(dano), true, `Daño debe ser entero para ${atacante} vs ${defensor}`);
          assert.strictEqual(dano, 1);
        }
      }
    });

    it('elemento desconocido o undefined asume multiplicador 1.0 (neutral)', () => {
      assert.strictEqual(multiplicadorAfinidad('viento', 'fuego'), 1.0);
      assert.strictEqual(multiplicadorAfinidad('fuego', 'viento'), 1.0);
      assert.strictEqual(multiplicadorAfinidad(undefined, 'agua'), 1.0);
      assert.strictEqual(multiplicadorAfinidad(null, null), 1.0);

      const dano = calcularDanoElemental(45, 50, 12, 3, 1.0, undefined, 'agua');
      assert.strictEqual(dano, 10);
    });
  });
});
