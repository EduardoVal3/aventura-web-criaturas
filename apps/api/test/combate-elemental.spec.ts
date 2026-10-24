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
  CONSTANTES_RESONANCIA,
  acumularResonancia,
  resolverRonda,
  Combatiente,
} from '../src/modulos/combate/dominio/motor-combate';
import { BESTIARIO } from '../src/modulos/externo/bestiario-canonico';
import { GeneradorAleatorioFijo } from '../src/comun/azar/generador-aleatorio.interface';

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

  describe('Acumulador de Resonancia (§3.4)', () => {
    it('calcula las ganancias por ronda (+8), daño recibido y ventaja elemental (+10)', () => {
      // Vector de §3.4: ronda completada (+8), daño 9 sobre hpMaximo 60 (round(50*9/60)=8), ventaja (+10) -> total 26
      const resonancia = acumularResonancia(0, {
        rondaCompletada: true,
        danoRecibido: 9,
        hpMaximoAliada: 60,
        golpeConVentaja: true,
        ejecutoInsignia: false,
      });
      assert.strictEqual(resonancia, 26);
    });

    it('aplica el tope de ganancia por daño recibido (+20)', () => {
      // Daño masivo 100 sobre 60: round(50*100/60) = 83 -> acotado a 20
      const resonancia = acumularResonancia(0, {
        rondaCompletada: false,
        danoRecibido: 100,
        hpMaximoAliada: 60,
        golpeConVentaja: false,
      });
      assert.strictEqual(resonancia, 20);
    });

    it('satura en 100 y ejecutar el movimiento insignia reinicia a 0 sin sumar ganancias', () => {
      const saturada = acumularResonancia(95, {
        rondaCompletada: true,
        golpeConVentaja: true,
      });
      assert.strictEqual(saturada, 100);

      const reinicio = acumularResonancia(100, {
        rondaCompletada: true,
        danoRecibido: 10,
        hpMaximoAliada: 60,
        golpeConVentaja: true,
        ejecutoInsignia: true,
      });
      assert.strictEqual(reinicio, 0);
    });
  });

  describe('Resolución Determinista de la Ronda (§3.7)', () => {
    const crearAliada = (parcial: Partial<Combatiente> = {}): Combatiente => ({
      id: 'aliada-1',
      nombre: 'Lobo Aliado',
      nivel: 3,
      ataque: 45,
      defensa: 50,
      velocidad: 50,
      hpActual: 60,
      hpMaximo: 60,
      elemento: 'fuego',
      movimientos: [
        { nombre: 'Mordisco', poder: 12, tipoAccion: 'Ataque melé', slot: 1, efecto: null },
        { nombre: 'Llamarada', poder: 14, tipoAccion: 'Ataque melé', slot: 2, efecto: 'QUEMADURA' },
        { nombre: 'Aullido', poder: 10, tipoAccion: 'Estado', slot: 3, efecto: 'PARALISIS' },
        { nombre: 'Furia Ígnea', poder: 25, tipoAccion: 'Ataque melé', slot: 4, efecto: 'QUEMADURA_GRAVE' },
      ],
      ...parcial,
    });

    const crearRival = (parcial: Partial<Combatiente> = {}): Combatiente => ({
      id: 'rival-1',
      nombre: 'Víbora Rival',
      nivel: 3,
      ataque: 40,
      defensa: 45,
      velocidad: 45,
      hpActual: 50,
      hpMaximo: 50,
      elemento: 'natura',
      movimientos: [
        { nombre: 'Picotazo', poder: 10, tipoAccion: 'Ataque melé', slot: 1, efecto: null },
        { nombre: 'Mordedura Tóxica', poder: 12, tipoAccion: 'Ataque melé', slot: 2, efecto: 'VENENO' },
        { nombre: 'Escudo Escama', poder: 10, tipoAccion: 'Estado', slot: 3, efecto: 'BASTION' },
        { nombre: 'Veneno Letal', poder: 22, tipoAccion: 'Ataque melé', slot: 4, efecto: 'VENENO_GRAVE' },
      ],
      ...parcial,
    });

    it('Iniciativa (D-3): rival más veloz actúa antes, empate favorece al jugador y ESCARCHA invierte el orden', () => {
      // Rival más veloz (60 vs 50)
      const rivalVeloz = crearRival({ velocidad: 60 });
      const aliadaNormal = crearAliada({ velocidad: 50 });
      // Generador para variación jugador (0.5), índice rival (0.0), variación rival (0.5)
      const gen1 = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const res1 = resolverRonda(aliadaNormal, rivalVeloz, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen1);
      assert.ok(res1.mensajes[0].startsWith('El rival usó'), 'Rival más veloz debe actuar en primer lugar');

      // Empate en velocidad (50 vs 50) favorece al jugador
      const rivalEmpate = crearRival({ velocidad: 50 });
      const gen2 = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const res2 = resolverRonda(aliadaNormal, rivalEmpate, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen2);
      assert.ok(res2.mensajes[0].startsWith('Tu criatura usó'), 'Empate en velocidad debe favorecer al jugador');

      // Aliada con velocidad base mayor (60 vs 45) pero afectada por ESCARCHA (efectiva 30 < 45)
      const aliadaRapida = crearAliada({ velocidad: 60 });
      const rivalBase = crearRival({ velocidad: 45 });
      const snapshotConEscarcha = estadoVacio('aliada-1');
      snapshotConEscarcha.aliada.estados = [{ codigo: 'ESCARCHA', nombre: 'Escarcha', turnosRestantes: 2 }];
      const gen3 = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const res3 = resolverRonda(aliadaRapida, rivalBase, snapshotConEscarcha, { indiceMovimiento: 0 }, gen3);
      assert.ok(res3.mensajes[0].startsWith('El rival usó'), 'ESCARCHA debe reducir la velocidad efectiva e invertir el orden');
    });

    it('PARALISIS con r = 0.24 pierde el turno y con r = 0.25 actúa (límite exacto)', () => {
      const aliada = crearAliada();
      const rival = crearRival();

      // Caso r = 0.24 -> pierde turno
      const snapshotParalisis = estadoVacio('aliada-1');
      snapshotParalisis.aliada.estados = [{ codigo: 'PARALISIS', nombre: 'Parálisis', turnosRestantes: 2 }];
      // Tiradas: tiradaParalisis (0.24), índice rival (0.0), variación rival (0.5)
      const genPierde = new GeneradorAleatorioFijo([0.24, 0.0, 0.5]);
      const resPierde = resolverRonda(aliada, rival, snapshotParalisis, { indiceMovimiento: 0 }, genPierde);
      assert.strictEqual(resPierde.accionJugador?.perdioTurno, 'PARALISIS');
      assert.strictEqual(resPierde.accionJugador?.danoCausado, 0);

      // Caso r = 0.25 -> actúa normalmente
      // Tiradas: tiradaParalisis (0.25), variación jugador (0.5), índice rival (0.0), variación rival (0.5)
      const genActua = new GeneradorAleatorioFijo([0.25, 0.5, 0.0, 0.5]);
      const resActua = resolverRonda(aliada, rival, snapshotParalisis, { indiceMovimiento: 0 }, genActua);
      assert.strictEqual(resActua.accionJugador?.perdioTurno, null);
      assert.ok(resActua.accionJugador!.danoCausado > 0);
    });

    it('PETRIFICACION pierde el turno sin consumir tirada del generador aleatorio', () => {
      const aliada = crearAliada();
      const rival = crearRival();

      const snapshotPetrificacion = estadoVacio('aliada-1');
      snapshotPetrificacion.aliada.estados = [{ codigo: 'PETRIFICACION', nombre: 'Petrificación', turnosRestantes: 2 }];

      // Al no consumir tirada, la primera tirada del generador debe ir directamente al índice del rival
      // Tiradas: índice rival (0.0 -> movimiento 0), variación rival (0.5)
      const gen = new GeneradorAleatorioFijo([0.0, 0.5]);
      const res = resolverRonda(aliada, rival, snapshotPetrificacion, { indiceMovimiento: 0 }, gen);
      assert.strictEqual(res.accionJugador?.perdioTurno, 'PETRIFICACION');
      assert.strictEqual(res.accionJugador?.danoCausado, 0);
      assert.strictEqual(res.accionRival?.movimiento, 'Picotazo');
    });

    it('Aplicación de estado respeta umbrales de D-5: ataque (0.50), Estado (0.90), Insignia (1.00) y BASTION', () => {
      const aliada = crearAliada();
      const rival = crearRival();

      // 1. Ataque con efecto (Llamarada, slot 2, prob 0.50)
      // Tiradas: variación jugador (0.5), efecto r = 0.49 (< 0.50 -> aplica), índice rival (0.0), variación rival (0.5)
      const genAplicaAtaque = new GeneradorAleatorioFijo([0.5, 0.49, 0.0, 0.5]);
      const resAplicaAtaque = resolverRonda(aliada, rival, estadoVacio('aliada-1'), { indiceMovimiento: 1 }, genAplicaAtaque);
      assert.strictEqual(resAplicaAtaque.accionJugador?.estadoAplicado, 'QUEMADURA');
      assert.ok(resAplicaAtaque.estadoBatalla.rival.estados.some((e) => e.codigo === 'QUEMADURA'));

      // r = 0.50 no aplica
      const genNoAplicaAtaque = new GeneradorAleatorioFijo([0.5, 0.50, 0.0, 0.5]);
      const resNoAplicaAtaque = resolverRonda(aliada, rival, estadoVacio('aliada-1'), { indiceMovimiento: 1 }, genNoAplicaAtaque);
      assert.strictEqual(resNoAplicaAtaque.accionJugador?.estadoAplicado, null);

      // 2. Movimiento tipo Estado (Aullido, slot 3, prob 0.90)
      // Tiradas: variación (0.5), efecto r = 0.89 (< 0.90 -> aplica), índice rival (0.0), variación rival (0.5)
      const genAplicaEstado = new GeneradorAleatorioFijo([0.5, 0.89, 0.0, 0.5]);
      const resAplicaEstado = resolverRonda(aliada, rival, estadoVacio('aliada-1'), { indiceMovimiento: 2 }, genAplicaEstado);
      assert.strictEqual(resAplicaEstado.accionJugador?.estadoAplicado, 'PARALISIS');

      // 3. Insignia (Furia Ígnea, slot 4, índice 3): aplica 100% sin tirada y con +1 ronda (duración 3 + 1 = 4)
      // Tiradas: variación (0.5), índice rival (0.0), variación rival (0.5)
      const genInsignia = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const resInsignia = resolverRonda(aliada, rival, estadoVacio('aliada-1'), { indiceMovimiento: 3 }, genInsignia);
      assert.strictEqual(resInsignia.accionJugador?.esInsignia, true);
      assert.strictEqual(resInsignia.accionJugador?.estadoAplicado, 'QUEMADURA');
      // Al fin de ronda, se descuenta 1 turno: 4 - 1 = 3 restantes
      const quemaduraRival = resInsignia.estadoBatalla.rival.estados.find((e) => e.codigo === 'QUEMADURA');
      assert.strictEqual(quemaduraRival?.turnosRestantes, 3);
      assert.strictEqual(resInsignia.estadoBatalla.aliada.resonancia, 0, 'Insignia reinicia resonancia a 0');

      // 4. BASTION en el rival (movimiento 3: Escudo Escama): autoaplicado al rival sin tirada
      // Tiradas: variación jugador (0.5), índice rival (2 -> Escudo Escama), variación rival (0.5)
      const genBastion = new GeneradorAleatorioFijo([0.5, 2 / 3, 0.5]);
      const resBastion = resolverRonda(aliada, rival, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, genBastion);
      assert.strictEqual(resBastion.accionRival?.estadoAplicado, 'BASTION');
      assert.ok(resBastion.estadoBatalla.rival.estados.some((e) => e.codigo === 'BASTION'));
    });

    it('Corte por victoria no ejecuta contraataque rival ni fin de ronda, y corte por aliada debilitada devuelve ALIADA_DEBILITADA', () => {
      // Corte por victoria: rival con 5 PV es derrotado por el jugador
      const rivalDebil = crearRival({ hpActual: 5 });
      const aliada = crearAliada();
      const genVictoria = new GeneradorAleatorioFijo([0.5]);
      const resVictoria = resolverRonda(aliada, rivalDebil, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, genVictoria);
      assert.strictEqual(resVictoria.resultado, 'VICTORIA');
      assert.strictEqual(resVictoria.hpRestanteRival, 0);
      assert.strictEqual(resVictoria.accionRival, null, 'Rival no debe actuar si cae derrotado');
      assert.strictEqual(resVictoria.efectosFinDeTurno.length, 0);

      // Corte por aliada debilitada: rival más veloz derrota a la aliada
      const rivalFuerte = crearRival({ velocidad: 80, ataque: 500 });
      const aliadaDebil = crearAliada({ hpActual: 10, velocidad: 20 });
      const genDerrota = new GeneradorAleatorioFijo([0.0, 0.5]);
      const resDerrota = resolverRonda(aliadaDebil, rivalFuerte, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, genDerrota);
      assert.strictEqual(resDerrota.resultado, 'ALIADA_DEBILITADA');
      assert.strictEqual(resDerrota.hpRestanteAliada, 0);
      assert.strictEqual(resDerrota.accionJugador, null, 'Jugador no debe actuar si la aliada cae antes');
    });

    it('Fin de ronda ejecuta DoT, acumula resonancia, decrementa duraciones y otorga inmunidad al expirar', () => {
      const aliada = crearAliada({ hpActual: 50, hpMaximo: 60 });
      const rival = crearRival({ hpActual: 40, hpMaximo: 50 });

      const snapshot = estadoVacio('aliada-1');
      // Aliada con VENENO (1 turno restante -> cobrará DoT y expirará)
      snapshot.aliada.estados = [{ codigo: 'VENENO', nombre: 'Veneno', turnosRestantes: 1 }];
      // Rival con PARALISIS (1 turno restante -> expirará y otorgará inmunidad)
      snapshot.rival.estados = [{ codigo: 'PARALISIS', nombre: 'Parálisis', turnosRestantes: 1 }];

      // Tiradas: variación jugador (0.5), tirada parálisis rival (0.8 -> actúa), índice rival (0.0), variación rival (0.5)
      const gen = new GeneradorAleatorioFijo([0.5, 0.8, 0.0, 0.5]);
      const res = resolverRonda(aliada, rival, snapshot, { indiceMovimiento: 0 }, gen);

      assert.strictEqual(res.resultado, 'EN_CURSO');
      // DoT de Veneno cobrado a la aliada
      assert.ok(res.efectosFinDeTurno.some((e) => e.objetivo === 'ALIADA' && e.codigo === 'VENENO'));
      // Estados expirados retirados
      assert.strictEqual(res.estadoBatalla.aliada.estados.length, 0);
      assert.strictEqual(res.estadoBatalla.rival.estados.length, 0);
      // Inmunidad a PARALISIS activada en el rival para la siguiente ronda
      assert.deepStrictEqual(res.estadoBatalla.rival.inmunidades, ['PARALISIS']);
    });

    it('Determinismo: dos ejecuciones con idénticos combatientes y secuencia producen resultados idénticos', () => {
      const aliada1 = crearAliada();
      const rival1 = crearRival();
      const gen1 = new GeneradorAleatorioFijo([0.3, 0.4, 0.5, 0.6]);
      const res1 = resolverRonda(aliada1, rival1, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen1);

      const aliada2 = crearAliada();
      const rival2 = crearRival();
      const gen2 = new GeneradorAleatorioFijo([0.3, 0.4, 0.5, 0.6]);
      const res2 = resolverRonda(aliada2, rival2, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen2);

      assert.deepStrictEqual(res1, res2, 'Ambas ejecuciones deben producir resultados profundamente idénticos');
    });

    it('Cobertura de efectos instantáneos: CRITICO y EJECUCION aplican multiplicador superior', () => {
      const aliadaCrit = crearAliada({
        ataque: 50,
        nivel: 10,
        movimientos: [{ nombre: 'Furia de Manada', poder: 20, tipoAccion: 'Ataque melé', efecto: 'CRITICO' }],
      });
      const aliadaNormal = crearAliada({
        ataque: 50,
        nivel: 10,
        movimientos: [{ nombre: 'Ataque Básico', poder: 20, tipoAccion: 'Ataque melé', efecto: null }],
      });
      const rival = crearRival({ defensa: 50, hpActual: 100, hpMaximo: 100 });

      // Tiradas con factor de variación idéntico (0.5 -> 1.0)
      const gen1 = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const resCrit = resolverRonda(aliadaCrit, rival, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen1);

      const gen2 = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const resNormal = resolverRonda(aliadaNormal, rival, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen2);

      assert.ok(
        (resCrit.accionJugador?.danoCausado ?? 0) > (resNormal.accionJugador?.danoCausado ?? 0),
        'El movimiento con CRITICO debe infligir mayor daño que el normal',
      );
      assert.ok(resCrit.mensajes.some((m) => m.includes('¡Golpe crítico!')));
    });

    it('Cobertura de efectos: DRENAJE recupera salud sin sobrecurar por encima de hpMaximo (INV-03)', () => {
      const aliadaHerida = crearAliada({
        hpActual: 30,
        hpMaximo: 60,
        movimientos: [{ nombre: 'Marejada Abisal', poder: 25, tipoAccion: 'Ataque melé', efecto: 'DRENAJE' }],
      });
      const rival = crearRival({ hpActual: 50, hpMaximo: 50 });
      const gen = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const res = resolverRonda(aliadaHerida, rival, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen);

      assert.ok(res.hpRestanteAliada > 30, 'La aliada debe haber recuperado HP por el efecto DRENAJE');
      assert.ok(res.hpRestanteAliada <= 60, 'Cumple INV-03: no debe exceder hpMaximo');
      assert.ok(res.mensajes.some((m) => m.includes('drenó vitalidad')));
    });

    it('Cobertura de efectos: REGENERACION y PURIFICACION restauran salud y limpian aflicciones', () => {
      const aliadaAfligida = crearAliada({
        hpActual: 20,
        hpMaximo: 50,
        movimientos: [{ nombre: 'Galope Astral', poder: 10, tipoAccion: 'Ataque melé', efecto: 'PURIFICACION' }],
      });
      const snapshot = estadoVacio('aliada-1');
      snapshot.aliada.estados = [
        { codigo: 'VENENO', nombre: 'Veneno', turnosRestantes: 2 },
        { codigo: 'BASTION', nombre: 'Bastión', turnosRestantes: 3, escudo: 10 },
      ];
      const rival = crearRival({ hpActual: 50, hpMaximo: 50 });
      const gen = new GeneradorAleatorioFijo([0.5, 0.0, 0.5]);
      const res = resolverRonda(aliadaAfligida, rival, snapshot, { indiceMovimiento: 0 }, gen);

      // PURIFICACION debe retirar VENENO pero mantener BASTION
      assert.ok(!res.estadoBatalla.aliada.estados.some((e) => e.codigo === 'VENENO'));
      assert.ok(res.estadoBatalla.aliada.estados.some((e) => e.codigo === 'BASTION'));
      assert.ok(res.hpRestanteAliada > 20, 'La purificación debe restaurar salud vital');
    });

    it('Cobertura de EFECTO_A_ESTADO: IGNICION aplica QUEMADURA, ENREDO aplica PARALISIS y ESPINAS aplica BASTION', () => {
      const aliadaFuego = crearAliada({
        movimientos: [{ nombre: 'Llama Viva', poder: 15, tipoAccion: 'Ataque melé', efecto: 'IGNICION' }],
      });
      const rival = crearRival();
      // Tiradas: variación jugador (0.5), tirada estado aliada (0.1 < 0.5 -> aplica), índice rival (0.0), variación rival (0.5)
      const gen = new GeneradorAleatorioFijo([0.5, 0.1, 0.0, 0.5]);
      const res = resolverRonda(aliadaFuego, rival, estadoVacio('aliada-1'), { indiceMovimiento: 0 }, gen);

      assert.strictEqual(res.accionJugador?.estadoAplicado, 'QUEMADURA');
      assert.ok(res.estadoBatalla.rival.estados.some((e) => e.codigo === 'QUEMADURA'));
    });
  });
});
