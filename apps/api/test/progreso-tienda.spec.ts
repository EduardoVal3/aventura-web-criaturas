import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BadRequestException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import {
  calcularXpBase,
  calcularXpGanada,
  calcularXpRequerida,
  calcularMonedasVictoria,
  calcularNivelDesdeXp,
  ProgresoService,
} from '../src/modulos/progreso/progreso.service';
import { CuracionService } from '../src/modulos/curacion/curacion.service';
import { InventarioService } from '../src/modulos/inventario/inventario.service';
import { TiendaService } from '../src/modulos/tienda/tienda.service';
import { ComprarDto } from '../src/modulos/tienda/dto/comprar.dto';
import { UsarObjetoDto } from '../src/modulos/inventario/dto/usar-objeto.dto';
import { VerificarZonaDto } from '../src/modulos/progreso/dto/verificar-zona.dto';

describe('Progreso, Curación y Tienda (Fase 7c)', () => {
  describe('Invariante INV-05: Progresión monótona creciente de XP', () => {
    it('debe coincidir con los valores canónicos de la especificación (§2.4)', () => {
      assert.strictEqual(calcularXpRequerida(1), 0);
      assert.strictEqual(calcularXpRequerida(2), 150);
      assert.strictEqual(calcularXpRequerida(3), 374);
      assert.strictEqual(calcularXpRequerida(4), 661);
      assert.strictEqual(calcularXpRequerida(5), 1006);
    });

    it('debe ser estrictamente monótona creciente para todo nivel de 1 a 50 (INV-05)', () => {
      for (let n = 1; n < 50; n++) {
        const actual = calcularXpRequerida(n);
        const siguiente = calcularXpRequerida(n + 1);
        assert.strictEqual(
          siguiente > actual,
          true,
          `Fallo de monotonía estricta en nivel ${n}: ${siguiente} no es mayor a ${actual}`,
        );
      }
    });

    it('debe calcular XP ganada y monedas por victoria (§2.3 y §4)', () => {
      // Rival CR 0.5, Nivel 3
      const xpBase = calcularXpBase(0.5); // round(25 * 1.5) = 38
      assert.strictEqual(xpBase, 38);

      const xpGanada = calcularXpGanada(0.5, 3); // round(38 * (1 + 2 * 0.2)) = round(38 * 1.4) = 53
      assert.strictEqual(xpGanada, 53);

      const monedas = calcularMonedasVictoria(3); // round(15 * 3) = 45
      assert.strictEqual(monedas, 45);

      // Subida de nivel al acumular suficiente XP
      assert.strictEqual(calcularNivelDesdeXp(1, 149), 1);
      assert.strictEqual(calcularNivelDesdeXp(1, 150), 2);
      assert.strictEqual(calcularNivelDesdeXp(1, 400), 3);
    });
  });

  describe('Curación médica y salvaguarda INV-03', () => {
    it('debe restaurar HP al máximo sin sobrecuración al usar poción (INV-03)', async () => {
      let hpPersistido: number = 0;
      let cantidadRestantePersistida: number = 0;

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1' }),
        },
        criatura: {
          findUnique: async () => ({
            id: 'cri-1',
            personajeId: 'pj-1',
            hpActual: 20,
            hpMaximo: 30,
            apodo: 'Compañero',
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-pocion',
            codigo: 'pocion-menor',
            nombre: 'Poción Menor',
            efectoValor: 20, // 20 + 20 = 40, pero max es 30
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            inventarioPersonaje: {
              findUnique: async () => ({ id: 'inv-1', cantidad: 2 }),
              update: async (args: any) => {
                cantidadRestantePersistida = 1;
              },
            },
            criatura: {
              update: async (args: any) => {
                hpPersistido = args.data.hpActual;
              },
            },
            historial: { create: async () => {} },
          };
          return cb(txMock);
        },
      };

      const servicio = new InventarioService(prismaMock);
      const resultado = await servicio.usarObjeto('usr-1', 'pocion-menor', 'cri-1');

      assert.strictEqual(resultado.hpPrevio, 20);
      assert.strictEqual(resultado.hpNuevo, 30); // Acotado a hpMaximo (INV-03)
      assert.strictEqual(hpPersistido, 30);
      assert.strictEqual(resultado.cantidadRestante, 1);
    });

    it('debe rechazar curación en zona no autorizada con SERVICIO_NO_DISPONIBLE', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: {
              id: 'ZON-01',
              esSegura: false, // Zona silvestre peligrosa
              servicios: [],
            },
          }),
        },
      };

      const servicio = new CuracionService(prismaMock);
      await assert.rejects(
        async () => {
          await servicio.restaurarEquipo('usr-1');
        },
        (error: any) => {
          assert.strictEqual(error instanceof ForbiddenException, true);
          assert.strictEqual(error.getResponse().codigo, 'SERVICIO_NO_DISPONIBLE');
          return true;
        },
      );
    });
  });

  describe('Seguridad S-4: Control de saldo en tienda', () => {
    it('debe rechazar compra con saldo insuficiente arrojando MONEDAS_INSUFICIENTES', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            monedas: 20, // Saldo insuficiente
            ubicacionActual: {
              id: 'LOC-02',
              servicios: ['TIENDA'],
            },
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-1',
            codigo: 'talisman-basico',
            nombre: 'Talismán Básico',
            precioCompra: 50,
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            personaje: {
              findUnique: async () => ({ id: 'pj-1', monedas: 20 }),
            },
          };
          return cb(txMock);
        },
      };

      const servicio = new TiendaService(prismaMock);
      await assert.rejects(
        async () => {
          await servicio.comprar('usr-1', 'talisman-basico', 1);
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'MONEDAS_INSUFICIENTES');
          return true;
        },
      );
    });
  });

  describe('Seguridad S-6: Integridad de datos y rechazo de campos inyectados', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('debe rechazar campos manipulados en ComprarDto (ej. costoTotal o precio)', async () => {
      const cuerpoManipulado = {
        itemCodigo: 'talisman-basico',
        cantidad: 1,
        costoTotal: 0, // Intento de compra gratis
      };

      await assert.rejects(
        async () => {
          await pipe.transform(cuerpoManipulado, {
            type: 'body',
            metatype: ComprarDto,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const msg = JSON.stringify(error.getResponse());
          assert.strictEqual(msg.includes('costoTotal'), true);
          return true;
        },
      );
    });

    it('debe rechazar campos manipulados en UsarObjetoDto (ej. hpNuevo)', async () => {
      const cuerpoManipulado = {
        itemCodigo: 'pocion-menor',
        criaturaId: 'cri-1',
        hpNuevo: 9999, // Intento de vida infinita
      };

      await assert.rejects(
        async () => {
          await pipe.transform(cuerpoManipulado, {
            type: 'body',
            metatype: UsarObjetoDto,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const msg = JSON.stringify(error.getResponse());
          assert.strictEqual(msg.includes('hpNuevo'), true);
          return true;
        },
      );
    });

    it('debe rechazar campos manipulados en VerificarZonaDto (ej. desbloqueada)', async () => {
      const cuerpoManipulado = {
        zonaId: 'ZON-05',
        desbloqueada: true, // Intento de forzar desbloqueo sin cumplir requisito
      };

      await assert.rejects(
        async () => {
          await pipe.transform(cuerpoManipulado, {
            type: 'body',
            metatype: VerificarZonaDto,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const msg = JSON.stringify(error.getResponse());
          assert.strictEqual(msg.includes('desbloqueada'), true);
          return true;
        },
      );
    });
  });
});
