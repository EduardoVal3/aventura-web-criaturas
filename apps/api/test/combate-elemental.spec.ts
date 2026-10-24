import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  TABLA_AFINIDADES,
  ELEMENTOS,
  multiplicadorAfinidad,
  etiquetaEfectividad,
  calcularDanoElemental,
  aplicarDano,
  Elemento,
  CodigoEstado,
  CATALOGO_ESTADOS,
  EFECTO_A_ESTADO,
  EstadoActivo,
  estadoVacio,
  leerEstadoBatalla,
  aplicarEstado,
  defensaEfectiva,
  velocidadEfectiva,
  calcularDot,
  aplicarDot,
  absorberConEscudo,
  tieneEstadoAlterado,
} from '../src/modulos/combate/dominio/motor-combate';
import { BESTIARIO } from '../src/modulos/externo/bestiario-canonico';

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

  describe('Catálogo y Reglas de Estados Alterados (§3.3)', () => {
    it('DoT calcula los daños de Quemadura y Veneno correctamente con piso mínimo de 1', () => {
      // hpMaximo = 60: Quemadura = max(1, floor(0.08 * 60)) = 4, Veneno = max(1, floor(0.06 * 60)) = 3
      assert.strictEqual(calcularDot('QUEMADURA', 60), 4);
      assert.strictEqual(calcularDot('VENENO', 60), 3);

      // hpMaximo = 10: Quemadura = max(1, floor(0.8)) = 1, Veneno = max(1, floor(0.6)) = 1
      assert.strictEqual(calcularDot('QUEMADURA', 10), 1);
      assert.strictEqual(calcularDot('VENENO', 10), 1);

      // Otros estados no tienen DoT
      assert.strictEqual(calcularDot('BASTION', 60), 0);
      assert.strictEqual(calcularDot('PARALISIS', 60), 0);
    });

    it('DoT no letal (D-4): nunca baja de 1 PV garantizando INV-03 y sin derrotar al rival', () => {
      // Con hpActual = 2 y DoT 4 queda en 1
      assert.strictEqual(aplicarDot(2, 4), 1);

      // Con hpActual = 1 y DoT 4 queda en 1
      assert.strictEqual(aplicarDot(1, 4), 1);

      // Con hpActual = 10 y DoT 3 queda en 7
      assert.strictEqual(aplicarDot(10, 3), 7);
    });

    it('Escudo de Bastión absorbe daño directo antes que los PV y se agota al llegar a 0', () => {
      // hpMaximo = 60 -> Escudo base = floor(0.15 * 60) = 9
      const estadoInicial: EstadoActivo[] = [
        { codigo: 'BASTION', nombre: 'Bastión', turnosRestantes: 3, escudo: 9 },
      ];

      // Daño 5: absorbe 5, escudo restante 4, danoRestante 0, PV intactos
      const absorcionParcial = absorberConEscudo(5, estadoInicial);
      assert.strictEqual(absorcionParcial.danoAbsorbido, 5);
      assert.strictEqual(absorcionParcial.danoRestante, 0);
      assert.strictEqual(absorcionParcial.estadosActualizados.length, 1);
      assert.strictEqual(absorcionParcial.estadosActualizados[0].escudo, 4);

      const hpTrasParcial = aplicarDano(50, absorcionParcial.danoRestante, 60);
      assert.strictEqual(hpTrasParcial, 50, 'PV deben quedar intactos tras absorción total');

      // Daño 12 sobre escudo 9: absorbe 9, danoRestante 3, escudo se agota y BASTION se retira
      const absorcionTotal = absorberConEscudo(12, estadoInicial);
      assert.strictEqual(absorcionTotal.danoAbsorbido, 9);
      assert.strictEqual(absorcionTotal.danoRestante, 3);
      assert.strictEqual(absorcionTotal.estadosActualizados.length, 0, 'BASTION agotado debe retirarse');

      const hpTrasTotal = aplicarDano(50, absorcionTotal.danoRestante, 60);
      assert.strictEqual(hpTrasTotal, 47, 'PV debe reducirse exactamente en el daño restante');

      // Daño masivo nunca produce PV negativos (INV-03)
      const hpExtremo = aplicarDano(2, 100, 60);
      assert.strictEqual(hpExtremo, 0);
    });

    it('ESCARCHA reduce la velocidad efectiva a la mitad y PETRIFICACION aumenta la defensa efectiva x1.5', () => {
      // ESCARCHA
      const estadosEscarcha: EstadoActivo[] = [
        { codigo: 'ESCARCHA', nombre: 'Escarcha', turnosRestantes: 2 },
      ];
      assert.strictEqual(velocidadEfectiva(80, estadosEscarcha), 40);
      assert.strictEqual(velocidadEfectiva(1, estadosEscarcha), 1, 'Mínimo de velocidad es 1');
      assert.strictEqual(velocidadEfectiva(80, []), 80);

      // PETRIFICACION
      const estadosPetrificacion: EstadoActivo[] = [
        { codigo: 'PETRIFICACION', nombre: 'Petrificación', turnosRestantes: 2 },
      ];
      assert.strictEqual(defensaEfectiva(50, estadosPetrificacion), 75);
      assert.strictEqual(defensaEfectiva(50, []), 50);
    });

    it('Refresco de estados: reaplicar VENENO actualiza turnosRestantes = max(actual, nuevo) sin duplicar', () => {
      const estadosPrevios: EstadoActivo[] = [
        { codigo: 'VENENO', nombre: 'Veneno', turnosRestantes: 1 },
      ];

      const resultado = aplicarEstado(estadosPrevios, [], 'VENENO', 60);
      assert.strictEqual(resultado.aplicado, true);
      assert.strictEqual(resultado.estados.length, 1, 'No debe duplicar el estado');
      assert.strictEqual(resultado.estados[0].turnosRestantes, 4, 'Debe refrescar a max(1, 4) = 4');

      // Reaplicar Bastión restaura el escudo completo
      const estadosBastionDanado: EstadoActivo[] = [
        { codigo: 'BASTION', nombre: 'Bastión', turnosRestantes: 1, escudo: 2 },
      ];
      const resultadoBastion = aplicarEstado(estadosBastionDanado, [], 'BASTION', 60);
      assert.strictEqual(resultadoBastion.aplicado, true);
      assert.strictEqual(resultadoBastion.estados[0].escudo, 9, 'Debe restaurar el escudo completo de 9');
      assert.strictEqual(resultadoBastion.estados[0].turnosRestantes, 3);
    });

    it('Inmunidad temporal: rechaza aplicar el estado si está en inmunidades activas', () => {
      const inmunidades: CodigoEstado[] = ['PARALISIS'];
      const resultado = aplicarEstado([], inmunidades, 'PARALISIS', 60);
      assert.strictEqual(resultado.aplicado, false);
      assert.strictEqual(resultado.motivo, 'INMUNE');
      assert.strictEqual(resultado.estados.length, 0);

      // Una vez superada la inmunidad, se aplica normalmente
      const resultadoSinInmunidad = aplicarEstado([], [], 'PARALISIS', 60);
      assert.strictEqual(resultadoSinInmunidad.aplicado, true);
      assert.strictEqual(resultadoSinInmunidad.estados.length, 1);
      assert.strictEqual(resultadoSinInmunidad.estados[0].codigo, 'PARALISIS');
    });

    it('tieneEstadoAlterado devuelve true con estados perjudiciales y false solo con BASTION o vacio', () => {
      assert.strictEqual(tieneEstadoAlterado([]), false);
      assert.strictEqual(
        tieneEstadoAlterado([
          { codigo: 'BASTION', nombre: 'Bastión', turnosRestantes: 3, escudo: 9 },
        ]),
        false,
        'BASTION es beneficioso y no cuenta como estado alterado perjudicial',
      );
      assert.strictEqual(
        tieneEstadoAlterado([
          { codigo: 'QUEMADURA', nombre: 'Quemadura', turnosRestantes: 2 },
        ]),
        true,
      );
      assert.strictEqual(
        tieneEstadoAlterado([
          { codigo: 'BASTION', nombre: 'Bastión', turnosRestantes: 3, escudo: 9 },
          { codigo: 'VENENO', nombre: 'Veneno', turnosRestantes: 1 },
        ]),
        true,
      );
    });

    it('leerEstadoBatalla valida forma, sanea límites, descarta desconocidos y respeta cambio de aliada', () => {
      // Nulo o inválido
      const vacio1 = leerEstadoBatalla(null);
      assert.deepStrictEqual(vacio1, estadoVacio());

      const vacio2 = leerEstadoBatalla('texto no json');
      assert.deepStrictEqual(vacio2, estadoVacio());

      // Saneo de resonancia y estados desconocidos
      const payloadConAnomalias = {
        estadoBatalla: {
          aliada: {
            criaturaId: 'cri-001',
            resonancia: 250,
            estados: [
              { codigo: 'INVALIDO_XYZ', turnosRestantes: 5 },
              { codigo: 'QUEMADURA', turnosRestantes: -2 },
            ],
            inmunidades: ['PARALISIS', 'CODIGO_INVENTADO'],
          },
          rival: {
            resonancia: -50,
            estados: [{ codigo: 'BASTION', turnosRestantes: 2, escudo: 15 }],
            inmunidades: [],
          },
        },
      };

      const saneado = leerEstadoBatalla(payloadConAnomalias, 'cri-001');
      assert.strictEqual(saneado.aliada.resonancia, 100, 'Resonancia aliada debe acotarse a 100');
      assert.strictEqual(saneado.aliada.estados.length, 1, 'Debe descartar estados desconocidos');
      assert.strictEqual(saneado.aliada.estados[0].codigo, 'QUEMADURA');
      assert.strictEqual(saneado.aliada.estados[0].turnosRestantes, 1, 'Turnos restantes mínimos deben ser 1');
      assert.deepStrictEqual(saneado.aliada.inmunidades, ['PARALISIS']);

      assert.strictEqual(saneado.rival.resonancia, 0, 'Resonancia negativa debe acotarse a 0');
      assert.strictEqual(saneado.rival.estados[0].escudo, 15);

      // D-11: si la aliada cambió, su estado se reinicia pero se preserva el rival
      const relevo = leerEstadoBatalla(payloadConAnomalias, 'cri-002');
      assert.strictEqual(relevo.aliada.criaturaId, 'cri-002');
      assert.strictEqual(relevo.aliada.resonancia, 0, 'Resonancia de nueva aliada debe ser 0');
      assert.strictEqual(relevo.aliada.estados.length, 0, 'Estados de nueva aliada deben estar vacíos');
      assert.strictEqual(relevo.rival.estados.length, 1, 'Estados del rival deben preservarse tras relevo');
      assert.strictEqual(relevo.rival.estados[0].codigo, 'BASTION');
    });

    it('Guarda del catálogo: toda clave de EFECTO_A_ESTADO existe en algún efecto del BESTIARIO', () => {
      const efectosEnBestiario = new Set<string>();
      for (const especie of BESTIARIO) {
        for (const mov of especie.movimientos) {
          if (mov.efecto) {
            efectosEnBestiario.add(mov.efecto);
          }
        }
      }

      for (const clave of Object.keys(EFECTO_A_ESTADO)) {
        assert.ok(
          efectosEnBestiario.has(clave),
          `La clave '${clave}' mapeada en EFECTO_A_ESTADO no existe en ningún movimiento de BESTIARIO`,
        );
      }
    });
  });
});
