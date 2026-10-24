import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  calcularDano,
  aplicarDano,
  calcularProbabilidadHuida,
  CombateService,
} from '../src/modulos/combate/combate.service';
import { AtacarDto } from '../src/modulos/combate/dto/atacar.dto';
import { AccionCombateDto } from '../src/modulos/combate/dto/accion-combate.dto';
import { GeneradorAleatorioFijo } from '../src/comun/azar/generador-aleatorio.interface';

describe('Motor de combate, daño y huida (Fase 7a)', () => {
  describe('Fórmula de daño y salvaguarda INV-04', () => {
    it('debe calcular correctamente el daño según la fórmula oficial de reglas (§2.1)', () => {
      // Atacante Nv 3, ataque 45, defensor defensa 50, poder 12
      // floor((45 / 50) * 12 * 0.8 + 3 * 0.5) = floor(8.64 + 1.5) = 10
      const dano = calcularDano(45, 50, 12, 3);
      assert.strictEqual(dano, 10);
    });

    it('debe preservar la fórmula base cuando el factor de variación es 1.0 (compatibilidad regresiva)', () => {
      const dano = calcularDano(45, 50, 12, 3, 1.0);
      assert.strictEqual(dano, 10);
    });

    it('debe aplicar la variación de ±15% en los límites inferior (0.85) y superior (1.15)', () => {
      // danoBruto = (45 / 50) * 12 * 0.8 + 3 * 0.5 = 10.14
      // factor 0.85 -> floor(10.14 * 0.85) = floor(8.619) = 8
      const danoInferior = calcularDano(45, 50, 12, 3, 0.85);
      assert.strictEqual(danoInferior, 8);

      // factor 1.15 -> floor(10.14 * 1.15) = floor(11.661) = 11
      const danoSuperior = calcularDano(45, 50, 12, 3, 1.15);
      assert.strictEqual(danoSuperior, 11);
    });

    it('debe garantizar daño mínimo >= 1 incluso ante defensa astronómica y factor mínimo 0.85 (INV-04)', () => {
      const danoConDefensaExtrema = calcularDano(1, 999999, 1, 1, 0.85);
      assert.strictEqual(danoConDefensaExtrema >= 1, true);
      assert.strictEqual(danoConDefensaExtrema, 1);

      const danoPoderMinimo = calcularDano(10, 200, 1, 1, 0.85);
      assert.strictEqual(danoPoderMinimo >= 1, true);
      assert.strictEqual(danoPoderMinimo, 1);
    });

    it('debe mantener HP acotado en [0, hpMaximo] sin valores negativos (INV-03)', () => {
      // Daño mayor al HP actual reduce exactamente a 0
      const hpFinal = aplicarDano(15, 100, 50);
      assert.strictEqual(hpFinal, 0);

      // Daño regular
      const hpNormal = aplicarDano(50, 10, 50);
      assert.strictEqual(hpNormal, 40);
    });
  });

  describe('Sorteo estocástico de movimientos rivales', () => {
    it('debe seleccionar dinámicamente diferentes movimientos del rival según el generador de azar', async () => {
      const movimientosRivales = [
        { id: 'm-1', nombre: 'Placaje Rápido', poder: 10 },
        { id: 'm-2', nombre: 'Llamarada Salvaje', poder: 25 },
      ];

      const crearPrismaMock = () => ({
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findFirst: async () => ({
            id: 'aliado-1',
            personajeId: 'pj-1',
            nivel: 5,
            ataque: 20,
            defensa: 20,
            hpActual: 100,
            hpMaximo: 100,
            velocidad: 30,
            especie: {
              movimientos: [{ id: 'm-al', nombre: 'Arañazo', poder: 10 }],
            },
          }),
          update: async () => ({}),
          count: async () => 1,
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            criaturaRivalId: 'rival-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 20,
              defensa: 20,
              hpActual: 100,
              hpMaximo: 100,
              velocidad: 20,
              especie: {
                nombre: 'Fiera',
                movimientos: movimientosRivales,
              },
            },
            combates: [],
          }),
        },
        combate: {
          create: async () => ({}),
        },
        $transaction: async (cb: any) => cb({
          criatura: {
            update: async () => ({}),
            count: async () => 1,
          },
          combate: {
            create: async () => ({}),
          },
        }),
      });

      const historialMock: any = { registrar: async () => {} };

      // Caso A: generador arroja 0.1 -> debe elegir primer movimiento (Placaje Rápido)
      // Secuencia de azar: 1er valor para factorJugador, 2do valor para indiceRival (0.1 -> 0), 3er valor para factorRival
      const genA = new GeneradorAleatorioFijo([0.5, 0.1, 0.5]);
      const servicioA = new CombateService(crearPrismaMock() as any, historialMock, genA);
      const resA = await servicioA.atacar('usr-1', 'enc-1', 0);
      assert.strictEqual(resA.accionRival?.movimiento, 'Placaje Rápido');

      // Caso B: generador arroja 0.9 -> debe elegir segundo movimiento (Llamarada Salvaje)
      // Secuencia de azar: 1er valor para factorJugador, 2do valor para indiceRival (0.9 -> 1), 3er valor para factorRival
      const genB = new GeneradorAleatorioFijo([0.5, 0.9, 0.5]);
      const servicioB = new CombateService(crearPrismaMock() as any, historialMock, genB);
      const resB = await servicioB.atacar('usr-1', 'enc-1', 0);
      assert.strictEqual(resB.accionRival?.movimiento, 'Llamarada Salvaje');
    });
  });

  describe('Fórmula de huida y generador determinista (§2.5)', () => {
    it('debe calcular la probabilidad de huida acotada en [0.10, 0.90]', () => {
      // velJugador: 40, velRival: 60, intentos: 1 -> 40 / 100 = 0.40
      const prob1 = calcularProbabilidadHuida(40, 60, 1);
      assert.strictEqual(Math.round(prob1 * 100) / 100, 0.4);

      // Si jugador es extremadamente lento, el suelo es 0.10
      const probSuelo = calcularProbabilidadHuida(1, 1000, 1);
      assert.strictEqual(probSuelo, 0.1);

      // Si jugador es extremadamente rápido, el techo es 0.90
      const probTecho = calcularProbabilidadHuida(1000, 1, 1);
      assert.strictEqual(probTecho, 0.9);
    });

    it('debe resolver la huida de forma determinista usando GeneradorAleatorioFijo', () => {
      const prob = calcularProbabilidadHuida(40, 60, 1); // 0.40
      const generadorExito = new GeneradorAleatorioFijo([0.35]);
      const generadorFallo = new GeneradorAleatorioFijo([0.45]);

      assert.strictEqual(generadorExito.generar() < prob, true);
      assert.strictEqual(generadorFallo.generar() < prob, false);
    });
  });

  describe('Seguridad S-5: Validación de turno del jugador', () => {
    it('debe rechazar la acción con ACCION_FUERA_DE_TURNO si no es turno del jugador', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              nivel: 2,
              hpActual: 20,
              hpMaximo: 20,
              ataque: 40,
              defensa: 40,
              especie: { nombre: 'Rival', movimientos: [] },
            },
            combates: [
              {
                turno: 1,
                esTurnoJugador: false, // Turno del rival
              },
            ],
          }),
        },
      };

      const historialMock: any = { registrar: async () => {} };
      const servicio = new CombateService(prismaMock, historialMock);

      await assert.rejects(
        async () => {
          await servicio.atacar('usr-1', 'enc-1', 0);
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const respuesta = error.getResponse();
          assert.strictEqual(respuesta.codigo, 'ACCION_FUERA_DE_TURNO');
          return true;
        },
      );
    });
  });

  describe('Seguridad S-6: Integridad de datos y prohibición de inyección', () => {
    it('debe rechazar campos manipulados (ej. danoCausado) vía ValidationPipe', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      const cuerpoManipulado = {
        encuentroId: 'enc-123',
        movimientoIndice: 0,
        danoCausado: 9999, // Campo prohibido inyectado por cliente
      };

      await assert.rejects(
        async () => {
          await pipe.transform(cuerpoManipulado, {
            type: 'body',
            metatype: AtacarDto,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const mensaje = JSON.stringify(error.getResponse());
          assert.strictEqual(mensaje.includes('danoCausado'), true);
          return true;
        },
      );
    });

    it('debe validar tipos permitidos en AccionCombateDto', async () => {
      const dtoValido = plainToInstance(AccionCombateDto, {
        tipoAccion: 'ATACAR',
        movimientoIndice: 0,
      });
      const erroresValido = await validate(dtoValido);
      assert.strictEqual(erroresValido.length, 0);

      const dtoInvalido = plainToInstance(AccionCombateDto, {
        tipoAccion: 'HACKEAR_SISTEMA',
      });
      const erroresInvalido = await validate(dtoInvalido);
      assert.strictEqual(erroresInvalido.length > 0, true);
    });
  });

  describe('Jerarquía táctica de movimientos y bloqueo de Furia (Subfase 10j, D-4)', () => {
    it('debe rechazar el índice 3 del jugador con MOVIMIENTO_BLOQUEADO hasta tener Resonancia', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              nivel: 2,
              hpActual: 20,
              hpMaximo: 20,
              ataque: 40,
              defensa: 40,
              especie: { nombre: 'Rival', movimientos: [] },
            },
            combates: [],
          }),
        },
        criatura: {
          findFirst: async () => ({
            id: 'aliada-1',
            hpActual: 100,
            hpMaximo: 100,
            ataque: 50,
            defensa: 40,
            nivel: 5,
            especie: {
              movimientos: [
                { id: 'm1', slot: 1, nombre: 'M1', poder: 5 },
                { id: 'm2', slot: 2, nombre: 'M2', poder: 10 },
                { id: 'm3', slot: 3, nombre: 'M3', poder: 4 },
                { id: 'm4', slot: 4, nombre: 'Furia', poder: 16 },
              ],
            },
          }),
        },
      };

      const servicio = new CombateService(prismaMock, { registrar: async () => {} } as any);
      await assert.rejects(
        async () => {
          await servicio.atacar('usr-1', 'enc-1', 3);
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const respuesta = error.getResponse() as any;
          assert.strictEqual(respuesta.codigo, 'MOVIMIENTO_BLOQUEADO');
          assert.ok(respuesta.mensaje.includes('Resonancia'));
          return true;
        },
      );
    });

    it('el rival nunca debe seleccionar el slot 4 (Furia) en su sorteo de contraataque', async () => {
      const movimientosRivales = [
        { id: 'm1', slot: 1, nombre: 'Rival M1', poder: 5 },
        { id: 'm2', slot: 2, nombre: 'Rival M2', poder: 10 },
        { id: 'm3', slot: 3, nombre: 'Rival M3', poder: 4 },
        { id: 'm4', slot: 4, nombre: 'Rival Furia', poder: 20 },
      ];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findFirst: async () => ({
            id: 'aliado-1',
            personajeId: 'pj-1',
            nivel: 5,
            ataque: 10,
            defensa: 30,
            hpActual: 100,
            hpMaximo: 100,
            velocidad: 30,
            especie: {
              movimientos: [{ id: 'm-al', slot: 1, nombre: 'Golpe', poder: 5 }],
            },
          }),
          update: async () => ({}),
          count: async () => 1,
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            criaturaRivalId: 'rival-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 20,
              defensa: 20,
              hpActual: 100,
              hpMaximo: 100,
              velocidad: 20,
              especie: {
                nombre: 'Fiera',
                movimientos: movimientosRivales,
              },
            },
            combates: [],
          }),
        },
        combate: {
          create: async () => ({}),
        },
        $transaction: async (cb: any) => cb({
          criatura: {
            update: async () => ({}),
            count: async () => 1,
          },
          combate: {
            create: async () => ({}),
          },
        }),
      };

      // Probar generador en el extremo superior 0.999 (que seleccionaría el último elemento si fueran 4)
      const genExtremo = new GeneradorAleatorioFijo([0.5, 0.999, 0.5]);
      const servicio = new CombateService(prismaMock, { registrar: async () => {} } as any, genExtremo);

      const res = await servicio.atacar('usr-1', 'enc-1', 0);
      assert.strictEqual(res.accionRival?.movimiento, 'Rival M3', 'Debe seleccionar como máximo el slot 3');
      assert.notStrictEqual(res.accionRival?.movimiento, 'Rival Furia', 'El rival jamás debe sortear el slot 4');
    });

    it('debe rechazar movimientoIndice mayor a 3 en DTOs con ValidationPipe', async () => {
      const dto = plainToInstance(AccionCombateDto, {
        tipoAccion: 'ATACAR',
        movimientoIndice: 4,
      });
      const errores = await validate(dto);
      assert.strictEqual(errores.length, 1);
      assert.ok(errores[0].constraints?.max !== undefined);
    });
  });

  describe('Servicio de combate autoritativo: afinidades, resonancia y concurrencia (Subfase 10k)', () => {
    const mockMovimientos = [
      { id: 'm-1', slot: 1, nombre: 'Golpe', poder: 10, tipoAccion: 'ATAQUE', efecto: null },
      { id: 'm-2', slot: 2, nombre: 'Mordisco', poder: 15, tipoAccion: 'ATAQUE', efecto: null },
      { id: 'm-3', slot: 3, nombre: 'Rugido', poder: 0, tipoAccion: 'ESTADO', efecto: 'PARALISIS' },
      { id: 'm-4', slot: 4, nombre: 'Furia Total', poder: 50, tipoAccion: 'INSIGNIA', efecto: null },
    ];

    it('rechaza movimiento insignia (índice 3) con MOVIMIENTO_BLOQUEADO si la resonancia aliada es < 100', async () => {
      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }) },
        criatura: {
          findFirst: async () => ({
            id: 'aliado-1',
            nivel: 5,
            ataque: 20,
            defensa: 20,
            velocidad: 15,
            hpActual: 50,
            hpMaximo: 50,
            especie: { elemento: 'fuego', movimientos: mockMovimientos },
          }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 20,
              defensa: 20,
              velocidad: 10,
              hpActual: 50,
              hpMaximo: 50,
              especie: { elemento: 'planta', movimientos: mockMovimientos },
            },
            combates: [
              {
                turno: 1,
                esTurnoJugador: true,
                detalleJson: {
                  estadoBatalla: {
                    turno: 1,
                    aliada: { criaturaId: 'aliado-1', resonancia: 75, estados: [], inmunidades: [] },
                    rival: { resonancia: 30, estados: [], inmunidades: [] },
                  },
                },
              },
            ],
          }),
        },
      };

      const servicio = new CombateService(prismaMock, {} as any);

      await assert.rejects(
        async () => {
          await servicio.atacar('usr-1', 'enc-1', 3);
        },
        (err: any) => {
          assert.strictEqual(err instanceof BadRequestException, true);
          assert.strictEqual(err.getResponse().codigo, 'MOVIMIENTO_BLOQUEADO');
          return true;
        },
      );
    });

    it('permite movimiento insignia (índice 3) con resonancia 100, y reinicia la resonancia aliada a 0 en la persistencia', async () => {
      let combatePersistido: any = null;

      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }) },
        criatura: {
          findFirst: async () => ({
            id: 'aliado-1',
            nivel: 5,
            ataque: 30,
            defensa: 20,
            velocidad: 25,
            hpActual: 50,
            hpMaximo: 50,
            especie: { elemento: 'fuego', movimientos: mockMovimientos },
          }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 10,
              defensa: 20,
              velocidad: 10,
              hpActual: 100,
              hpMaximo: 100,
              especie: { elemento: 'planta', movimientos: mockMovimientos },
            },
            combates: [
              {
                turno: 1,
                esTurnoJugador: true,
                detalleJson: {
                  estadoBatalla: {
                    turno: 1,
                    aliada: { criaturaId: 'aliado-1', resonancia: 100, estados: [], inmunidades: [] },
                    rival: { resonancia: 40, estados: [], inmunidades: [] },
                  },
                },
              },
            ],
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            criatura: {
              update: async () => ({}),
              count: async () => 1,
            },
            combate: {
              findFirst: async () => ({ turno: 1 }),
              create: async (args: any) => {
                combatePersistido = args.data;
              },
            },
            encuentro: { update: async () => ({}) },
            historial: { create: async () => ({}) },
          };
          return cb(txMock);
        },
      };

      const gen = new GeneradorAleatorioFijo([0.5, 0.5]);
      const servicio = new CombateService(prismaMock, {} as any, gen);

      const res = await servicio.atacar('usr-1', 'enc-1', 3);

      assert.strictEqual(res.accionJugador?.esInsignia, true);
      assert.strictEqual(res.resonancia.aliada, 0);
      assert.strictEqual(combatePersistido.detalleJson.estadoBatalla.aliada.resonancia, 0);
    });

    it('detecta concurrencia y arroja TURNO_DESACTUALIZADO (409) cuando turnoEsperado no coincide con BD', async () => {
      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }) },
        criatura: {
          findFirst: async () => ({
            id: 'aliado-1',
            nivel: 5,
            ataque: 20,
            defensa: 20,
            velocidad: 15,
            hpActual: 50,
            hpMaximo: 50,
            especie: { elemento: 'fuego', movimientos: mockMovimientos },
          }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 20,
              defensa: 20,
              velocidad: 10,
              hpActual: 50,
              hpMaximo: 50,
              especie: { elemento: 'planta', movimientos: mockMovimientos },
            },
            combates: [{ turno: 1, esTurnoJugador: true, detalleJson: null }],
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            $queryRaw: async () => [],
            combate: {
              // En BD ya hay un combate en turno 2, por lo que el turno actual esperado es 3
              findFirst: async () => ({ turno: 2 }),
            },
          };
          return cb(txMock);
        },
      };

      const servicio = new CombateService(prismaMock, {} as any);

      // Enviamos turnoEsperado = 2, pero en BD ya avanzó a 3
      await assert.rejects(
        async () => {
          await servicio.atacar('usr-1', 'enc-1', 0, 2);
        },
        (err: any) => {
          assert.strictEqual(err instanceof ConflictException, true);
          assert.strictEqual(err.getResponse().codigo, 'TURNO_DESACTUALIZADO');
          return true;
        },
      );
    });

    it('sanea el snapshot ante relevo de aliada debilitada (D-11)', async () => {
      let combatePersistido: any = null;

      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }) },
        criatura: {
          // Nueva aliada activa tras muerte de la anterior
          findFirst: async () => ({
            id: 'aliada-nueva-2',
            nivel: 5,
            ataque: 20,
            defensa: 20,
            velocidad: 20,
            hpActual: 50,
            hpMaximo: 50,
            especie: { elemento: 'natura', movimientos: mockMovimientos },
          }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 10,
              defensa: 20,
              velocidad: 10,
              hpActual: 50,
              hpMaximo: 50,
              especie: { elemento: 'agua', movimientos: mockMovimientos },
            },
            combates: [
              {
                turno: 1,
                esTurnoJugador: true,
                detalleJson: {
                  estadoBatalla: {
                    turno: 1,
                    aliada: {
                      criaturaId: 'aliada-anterior-muerta-1',
                      resonancia: 80,
                      estados: [{ codigo: 'VENENO', turnosRestantes: 2, valor: 5 }],
                      inmunidades: ['QUEMADURA'],
                    },
                    rival: {
                      resonancia: 50,
                      estados: [{ codigo: 'QUEMADURA', turnosRestantes: 2, valor: 4 }],
                      inmunidades: ['VENENO'],
                    },
                  },
                },
              },
            ],
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            criatura: {
              update: async () => ({}),
              count: async () => 1,
            },
            combate: {
              findFirst: async () => ({ turno: 1 }),
              create: async (args: any) => {
                combatePersistido = args.data;
              },
            },
            encuentro: { update: async () => ({}) },
            historial: { create: async () => ({}) },
          };
          return cb(txMock);
        },
      };

      const gen = new GeneradorAleatorioFijo([0.5, 0.5]);
      const servicio = new CombateService(prismaMock, {} as any, gen);

      const res = await servicio.atacar('usr-1', 'enc-1', 0);

      // La nueva aliada inició limpia (sin veneno de la anterior y resonancia reseteada a 0 + ganancias de la ronda)
      assert.strictEqual(
        res.estados.aliada.some((e: any) => e.codigo === 'VENENO'),
        false,
      );
      // El rival preservó su estado previo
      assert.strictEqual(
        combatePersistido.detalleJson.estadoBatalla.rival.estados.some(
          (e: any) => e.codigo === 'QUEMADURA',
        ),
        true,
      );
      assert.strictEqual(
        combatePersistido.detalleJson.estadoBatalla.aliada.criaturaId,
        'aliada-nueva-2',
      );
    });

    it('debe propagar el cliente transaccional tx a historialService.registrar en victoria para evitar deadlocks de PostgreSQL', async () => {
      let llamadaHistorial: any = null;
      let txCapturada: any = null;

      const historialMock: any = {
        registrar: async (
          personajeId: string,
          tipo: string,
          descripcion: string,
          datosJson?: any,
          tx?: any,
        ) => {
          llamadaHistorial = { personajeId, tipo, descripcion, datosJson, tx };
        },
      };

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findFirst: async () => ({
            id: 'aliada-1',
            personajeId: 'pj-1',
            nivel: 5,
            ataque: 50,
            defensa: 30,
            hpActual: 100,
            hpMaximo: 100,
            velocidad: 40,
            especie: {
              elemento: 'fuego',
              movimientos: [
                { id: 'm-1', nombre: 'Golpe Ígneo', poder: 50, slot: 1, efecto: null },
              ],
            },
          }),
          update: async () => ({}),
          count: async () => 1,
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            criaturaRivalId: 'rival-1',
            estado: 'EN_CURSO',
            zonaId: null,
            criaturaRival: {
              id: 'rival-1',
              nivel: 1,
              ataque: 10,
              defensa: 10,
              hpActual: 5,
              hpMaximo: 30,
              velocidad: 10,
              especie: {
                challengeRating: 1,
                nombre: 'Duende Pruebas',
                elemento: 'planta',
                movimientos: [],
              },
            },
            combates: [],
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            idTransaccion: 'tx-activa-123',
            criatura: {
              update: async () => ({}),
              count: async () => 1,
              findUnique: async () => ({
                id: 'aliada-1',
                personajeId: 'pj-1',
                nivel: 5,
                experiencia: 500,
                especie: {
                  hpBase: 40,
                  ataqueBase: 50,
                  defensaBase: 30,
                  velocidadBase: 40,
                },
              }),
            },
            personaje: {
              update: async () => ({ monedas: 100 }),
            },
            historial: { create: async () => ({}) },
            combate: {
              findFirst: async () => null,
              create: async () => ({}),
            },
            encuentro: { update: async () => ({}) },
          };
          txCapturada = txMock;
          return cb(txMock);
        },
      };

      const gen = new GeneradorAleatorioFijo([0.5, 0.5]);
      const servicio = new CombateService(prismaMock, historialMock, gen);

      const res = await servicio.atacar('usr-1', 'enc-1', 0);

      assert.strictEqual(res.resultadoFinal, 'VICTORIA');
      assert.ok(llamadaHistorial, 'Debe haber llamado a historialService.registrar');
      assert.strictEqual(llamadaHistorial.tipo, 'COMBATE');
      assert.strictEqual(
        llamadaHistorial.tx,
        txCapturada,
        'El parámetro tx debe coincidir con el cliente transaccional de $transaction',
      );
    });

    it('debe retornar rivalActuoPrimero: true, accionJugador: null y avanzar el turno si la aliada cae pero el combate continúa', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findFirst: async () => ({
            id: 'aliada-1',
            personajeId: 'pj-1',
            nivel: 1,
            ataque: 10,
            defensa: 10,
            hpActual: 10,
            hpMaximo: 50,
            velocidad: 10, // Menor que el rival
            especie: {
              elemento: 'fuego',
              movimientos: [
                { id: 'm-1', nombre: 'Ascua', poder: 10, slot: 1, efecto: null },
              ],
            },
          }),
          update: async () => ({}),
          count: async () => 2, // Le quedan otras criaturas vivas en el equipo
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            criaturaRivalId: 'rival-1',
            estado: 'EN_CURSO',
            zonaId: null,
            criaturaRival: {
              id: 'rival-1',
              nivel: 5,
              ataque: 80,
              defensa: 30,
              hpActual: 80,
              hpMaximo: 80,
              velocidad: 90, // Mayor que la aliada -> rivalActuaPrimero = true
              especie: {
                challengeRating: 2,
                nombre: 'Halcón Feroz',
                elemento: 'aire',
                movimientos: [
                  { id: 'm-r1', nombre: 'Picotazo', poder: 50, slot: 1, efecto: null },
                ],
              },
            },
            combates: [{ turno: 1, esTurnoJugador: true }],
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            criatura: {
              update: async () => ({}),
              count: async () => 2, // Otras criaturas vivas
            },
            personaje: { update: async () => ({}) },
            historial: { create: async () => ({}) },
            combate: {
              findFirst: async () => ({ turno: 1 }),
              create: async () => ({}),
            },
            encuentro: { update: async () => ({}) },
          };
          return cb(txMock);
        },
      };

      const gen = new GeneradorAleatorioFijo([0.5, 0.5]);
      const servicio = new CombateService(prismaMock, {} as any, gen);

      const res = await servicio.atacar('usr-1', 'enc-1', 0, 2);

      assert.strictEqual(res.rivalActuoPrimero, true);
      assert.strictEqual(res.accionJugador, null);
      assert.strictEqual(res.resultadoFinal, 'ALIADA_DEBILITADA');
      assert.strictEqual(res.estado, 'EN_CURSO');
      assert.strictEqual(res.turno, 3); // 2 + 1 porque el combate continúa
    });
  });
});


