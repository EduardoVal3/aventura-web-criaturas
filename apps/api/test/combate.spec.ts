import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
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
});
