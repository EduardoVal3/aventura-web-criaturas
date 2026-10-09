import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  calcularProbabilidadCaptura,
  CapturaService,
} from '../src/modulos/combate/servicios/captura.service';
import { GeneradorAleatorioFijo } from '../src/comun/azar/generador-aleatorio.interface';

describe('Sistema de captura de criaturas (Fase 7b)', () => {
  describe('Fórmula probabilística e invariante INV-02', () => {
    it('debe calcular la probabilidad exacta según el ejemplo de reglas (§2.2)', () => {
      // tasaCaptura: 0.60, hpActual: 15, hpMaximo: 60, talisman: 1.5
      // factorSalud = 1.0 - 0.5 * (15 / 60) = 0.875
      // probBruta = 0.60 * 0.875 * 1.5 = 0.7875
      const prob = calcularProbabilidadCaptura(0.6, 15, 60, 1.5);
      assert.strictEqual(Math.round(prob * 10000) / 10000, 0.7875);
    });

    it('debe cumplir estrictamente INV-02 con clamp entre 0.05 y 0.95', () => {
      // Caso inferior extremo: tasa 0.01, hpActual = hpMaximo, multiplicador 0.5 -> bruto 0.005 -> clamp 0.05
      const probMinima = calcularProbabilidadCaptura(0.01, 100, 100, 0.5);
      assert.strictEqual(probMinima, 0.05);

      // Caso superior extremo: tasa 0.90, hpActual = 1, multiplicador 1.5 -> bruto ~1.34 -> clamp 0.95
      const probMaxima = calcularProbabilidadCaptura(0.9, 1, 100, 1.5);
      assert.strictEqual(probMaxima, 0.95);

      // Muestreo de límites
      for (let tasa = 0.05; tasa <= 1.0; tasa += 0.1) {
        for (let hp = 1; hp <= 100; hp += 20) {
          const res = calcularProbabilidadCaptura(tasa, hp, 100, 1.5);
          assert.strictEqual(res >= 0.05, true, `prob ${res} menor a 0.05`);
          assert.strictEqual(res <= 0.95, true, `prob ${res} mayor a 0.95`);
        }
      }
    });

    it('debe evaluar la tirada determinista con GeneradorAleatorioFijo', () => {
      const prob = 0.5;
      const genExito = new GeneradorAleatorioFijo([0.49]);
      const genFallo = new GeneradorAleatorioFijo([0.51]);

      assert.strictEqual(genExito.generar() < prob, true);
      assert.strictEqual(genFallo.generar() < prob, false);
    });
  });

  describe('Seguridad S-3: Validación de encuentro activo y pertenencia', () => {
    it('debe arrojar ENCUENTRO_NO_ENCONTRADO si el encuentro no existe', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1' }),
        },
        encuentro: {
          findUnique: async () => null,
        },
      };

      const servicio = new CapturaService(prismaMock, {} as any);
      await assert.rejects(
        async () => {
          await servicio.capturar('usr-1', 'enc-inexistente', 'talisman-basico');
        },
        (error: any) => {
          assert.strictEqual(error instanceof NotFoundException, true);
          assert.strictEqual(error.getResponse().codigo, 'ENCUENTRO_NO_ENCONTRADO');
          return true;
        },
      );
    });

    it('debe arrojar ENCUENTRO_NO_AUTORIZADO si el encuentro pertenece a otro explorador', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1' }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'otro-pj',
            estado: 'EN_CURSO',
            criaturaRival: { especie: { tasaCaptura: 0.5, movimientos: [] }, hpActual: 10, hpMaximo: 20 },
          }),
        },
      };

      const servicio = new CapturaService(prismaMock, {} as any);
      await assert.rejects(
        async () => {
          await servicio.capturar('usr-1', 'enc-1', 'talisman-basico');
        },
        (error: any) => {
          assert.strictEqual(error instanceof ForbiddenException, true);
          assert.strictEqual(error.getResponse().codigo, 'ENCUENTRO_NO_AUTORIZADO');
          return true;
        },
      );
    });

    it('debe arrojar ENCUENTRO_NO_ACTIVO si el encuentro ya está en estado terminal', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1' }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'VICTORIA', // Terminal
            criaturaRival: { especie: { tasaCaptura: 0.5, movimientos: [] }, hpActual: 0, hpMaximo: 20 },
          }),
        },
      };

      const servicio = new CapturaService(prismaMock, {} as any);
      await assert.rejects(
        async () => {
          await servicio.capturar('usr-1', 'enc-1', 'talisman-basico');
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'ENCUENTRO_NO_ACTIVO');
          return true;
        },
      );
    });
  });

  describe('Seguridad S-4: Verificación de posesión de talismán en inventario', () => {
    it('debe arrojar ITEM_NO_DISPONIBLE si el jugador no posee el talismán', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1' }),
        },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRival: {
              especie: { tasaCaptura: 0.5, movimientos: [] },
              hpActual: 10,
              hpMaximo: 20,
            },
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-tal-1',
            codigo: 'talisman-basico',
            nombre: 'Talismán Básico',
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            inventarioPersonaje: {
              findUnique: async () => null, // No posee el objeto en inventario
            },
          };
          return cb(txMock);
        },
      };

      const servicio = new CapturaService(prismaMock, {} as any);
      await assert.rejects(
        async () => {
          await servicio.capturar('usr-1', 'enc-1', 'talisman-basico');
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'ITEM_NO_DISPONIBLE');
          return true;
        },
      );
    });
  });

  describe('Transacción atómica y regla A-6 (Asignación a equipo o almacén)', () => {
    it('debe asignar criatura a equipo si cuentaEquipo < 6', async () => {
      let encuentroActualizado: any = null;
      let criaturaActualizada: any = null;
      let inventarioActualizado: boolean = false;

      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1' }) },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRivalId: 'cri-rival-1',
            criaturaRival: {
              id: 'cri-rival-1',
              nivel: 2,
              hpActual: 5,
              hpMaximo: 20,
              especie: { nombre: 'Lobo', tasaCaptura: 0.9, movimientos: [] },
            },
          }),
        },
        objeto: {
          findUnique: async () => ({ id: 'obj-1', codigo: 'talisman-basico', nombre: 'Talismán Básico' }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            inventarioPersonaje: {
              findUnique: async () => ({ id: 'inv-1', cantidad: 2 }),
              update: async () => { inventarioActualizado = true; },
            },
            combate: {
              findFirst: async () => null,
              create: async () => {},
            },
            encuentro: {
              update: async (args: any) => { encuentroActualizado = args.data; },
            },
            criatura: {
              count: async () => 3, // 3 criaturas en equipo (< 6)
              update: async (args: any) => {
                criaturaActualizada = args.data;
                return { id: 'cri-rival-1', ...args.data, especie: { nombre: 'Lobo' } };
              },
            },
            historial: { create: async () => {} },
          };
          return cb(txMock);
        },
      };

      // Generador fijo que siempre tiene éxito (0.01 < prob)
      const genExito = new GeneradorAleatorioFijo([0.01]);
      const servicio = new CapturaService(prismaMock, {} as any, genExito);

      const resultado = await servicio.capturar('usr-1', 'enc-1', 'talisman-basico');

      assert.strictEqual(resultado.exito, true);
      assert.strictEqual(resultado.destinoCaptura, 'EQUIPO');
      assert.strictEqual(inventarioActualizado, true);
      assert.strictEqual(encuentroActualizado.estado, 'CAPTURADO');
      assert.strictEqual(criaturaActualizada.enEquipo, true);
      assert.strictEqual(criaturaActualizada.ordenEquipo, 4);
    });

    it('debe asignar criatura a almacén si cuentaEquipo === 6 (Regla A-6)', async () => {
      let criaturaActualizada: any = null;

      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1' }) },
        encuentro: {
          findUnique: async () => ({
            id: 'enc-1',
            personajeId: 'pj-1',
            estado: 'EN_CURSO',
            criaturaRivalId: 'cri-rival-1',
            criaturaRival: {
              id: 'cri-rival-1',
              nivel: 2,
              hpActual: 5,
              hpMaximo: 20,
              especie: { nombre: 'Lobo', tasaCaptura: 0.9, movimientos: [] },
            },
          }),
        },
        objeto: {
          findUnique: async () => ({ id: 'obj-1', codigo: 'talisman-basico', nombre: 'Talismán Básico' }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            inventarioPersonaje: {
              findUnique: async () => ({ id: 'inv-1', cantidad: 1 }),
              delete: async () => {},
            },
            combate: {
              findFirst: async () => null,
              create: async () => {},
            },
            encuentro: {
              update: async () => {},
            },
            criatura: {
              count: async () => 6, // 6 criaturas en equipo (Lleno!)
              update: async (args: any) => {
                criaturaActualizada = args.data;
                return { id: 'cri-rival-1', ...args.data, especie: { nombre: 'Lobo' } };
              },
            },
            historial: { create: async () => {} },
          };
          return cb(txMock);
        },
      };

      const genExito = new GeneradorAleatorioFijo([0.01]);
      const servicio = new CapturaService(prismaMock, {} as any, genExito);

      const resultado = await servicio.capturar('usr-1', 'enc-1', 'talisman-basico');

      assert.strictEqual(resultado.exito, true);
      assert.strictEqual(resultado.destinoCaptura, 'ALMACEN');
      assert.strictEqual(criaturaActualizada.enEquipo, false);
      assert.strictEqual(criaturaActualizada.ordenEquipo, null);
    });
  });
});
