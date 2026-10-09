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

    it('debe garantizar daño mínimo >= 1 incluso ante defensa astronómica (INV-04)', () => {
      const danoConDefensaExtrema = calcularDano(1, 999999, 1, 1);
      assert.strictEqual(danoConDefensaExtrema >= 1, true);
      assert.strictEqual(danoConDefensaExtrema, 1);

      const danoPoderMinimo = calcularDano(10, 200, 1, 1);
      assert.strictEqual(danoPoderMinimo >= 1, true);
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
