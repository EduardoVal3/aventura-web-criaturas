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
  calcularProgresoXp,
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

    it('debe calcular el porcentaje de progreso de XP exactamente en el servidor (§2.4)', () => {
      // Nivel 1 (0 a 150 XP)
      const inicio = calcularProgresoXp(1, 0);
      assert.strictEqual(inicio.porcentajeXp, 0);
      assert.strictEqual(inicio.xpNivelActual, 0);
      assert.strictEqual(inicio.xpSiguienteNivel, 150);

      const medio = calcularProgresoXp(1, 75);
      assert.strictEqual(medio.porcentajeXp, 50);

      // Nivel 2 (150 a 374 XP, rango 224 XP)
      const justoSubido = calcularProgresoXp(2, 150);
      assert.strictEqual(justoSubido.porcentajeXp, 0);
      assert.strictEqual(justoSubido.xpNivelActual, 150);
      assert.strictEqual(justoSubido.xpSiguienteNivel, 374);

      // Nivel 50 (máximo nivel del juego)
      const nivelMaximo = calcularProgresoXp(50, 999999);
      assert.strictEqual(nivelMaximo.porcentajeXp, 100);
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

    it('debe rechazar usarObjeto si el objeto no es de tipo CURACION (OBJETO_NO_CONSUMIBLE)', async () => {
      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1' }) },
        criatura: {
          findUnique: async () => ({
            id: 'cri-1',
            personajeId: 'pj-1',
            hpActual: 10,
            hpMaximo: 30,
            especie: { nombre: 'Lobo' },
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-talisman',
            codigo: 'talisman-basico',
            nombre: 'Talismán Básico',
            tipo: 'CAPTURA',
            efectoValor: 1,
          }),
        },
      };

      const servicio = new InventarioService(prismaMock);
      await assert.rejects(
        async () => {
          await servicio.usarObjeto('usr-1', 'talisman-basico', 'cri-1');
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'OBJETO_NO_CONSUMIBLE');
          return true;
        },
      );
    });

    it('debe rechazar curación si la criatura ya tiene la salud al máximo (SALUD_COMPLETA)', async () => {
      const prismaMock: any = {
        personaje: { findUnique: async () => ({ id: 'pj-1' }) },
        criatura: {
          findUnique: async () => ({
            id: 'cri-1',
            personajeId: 'pj-1',
            hpActual: 30,
            hpMaximo: 30,
            especie: { nombre: 'Lobo' },
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-pocion',
            codigo: 'pocion-menor',
            nombre: 'Poción Menor',
            tipo: 'CURACION',
            efectoValor: 20,
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            criatura: {
              findUnique: async () => ({
                id: 'cri-1',
                personajeId: 'pj-1',
                hpActual: 30,
                hpMaximo: 30,
                especie: { nombre: 'Lobo' },
              }),
            },
          };
          return cb(txMock);
        },
      };

      const servicio = new InventarioService(prismaMock);
      await assert.rejects(
        async () => {
          await servicio.usarObjeto('usr-1', 'pocion-menor', 'cri-1');
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'SALUD_COMPLETA');
          return true;
        },
      );
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

    it('debe rechazar curación si la ubicación tiene el servicio pero no es una localidad segura (esSegura: false)', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: {
              id: 'ZON-02',
              esSegura: false,
              servicios: ['CURACION'],
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

    it('debe restaurar atómicamente criaturas heridas y revivir criaturas caídas (HP=0) al 100% sin exceder hpMaximo (INV-03)', async () => {
      const criaturasActualizadas: any[] = [];
      let historialCreado: any = null;

      const criaturasMock = [
        {
          id: 'cri-sana',
          hpActual: 30,
          hpMaximo: 30,
          apodo: 'Lobo Alfa',
          ordenEquipo: 1,
          especie: { nombre: 'Lobo' },
        },
        {
          id: 'cri-herida',
          hpActual: 12,
          hpMaximo: 30,
          apodo: 'Águila Veloz',
          ordenEquipo: 2,
          especie: { nombre: 'Águila' },
        },
        {
          id: 'cri-debilitada',
          hpActual: 0,
          hpMaximo: 35,
          apodo: 'Oso Pardo',
          ordenEquipo: 3,
          especie: { nombre: 'Oso' },
        },
      ];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-serena',
            ubicacionActual: {
              id: 'LOC-01',
              nombre: 'Villa Serena',
              esSegura: true,
              servicios: ['CURACION'],
            },
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            $queryRaw: async () => [{ id: 'pj-serena' }],
            criatura: {
              findMany: async () => criaturasMock,
              update: async ({ where, data }: any) => {
                criaturasActualizadas.push({ id: where.id, ...data });
                return { id: where.id, ...data };
              },
            },
            historial: {
              create: async ({ data }: any) => {
                historialCreado = data;
                return { id: 'hist-1', ...data };
              },
            },
          };
          return cb(txMock);
        },
      };

      const servicio = new CuracionService(prismaMock);
      const resultado = await servicio.restaurarEquipo('usr-1');

      // Validaciones cuantitativas globales
      assert.strictEqual(resultado.criaturasRestauradas, 3);
      assert.strictEqual(resultado.criaturasCuradas, 2);
      assert.strictEqual(resultado.criaturasRevividas, 1);
      assert.strictEqual(resultado.hpTotalRestaurado, 53); // (30 - 12) + (35 - 0) = 18 + 35 = 53
      assert.strictEqual(resultado.ubicacionNombre, 'Villa Serena');

      // Solo se actualizan cri-herida y cri-debilitada en base de datos
      assert.strictEqual(criaturasActualizadas.length, 2);
      assert.deepStrictEqual(criaturasActualizadas[0], { id: 'cri-herida', hpActual: 30 });
      assert.deepStrictEqual(criaturasActualizadas[1], { id: 'cri-debilitada', hpActual: 35 });

      // Verificación de detalles tácticos individuales acotados por INV-03
      assert.strictEqual(resultado.detalles.length, 3);

      assert.deepStrictEqual(resultado.detalles[0], {
        criaturaId: 'cri-sana',
        nombre: 'Lobo Alfa',
        hpPrevio: 30,
        hpNuevo: 30,
        hpMaximo: 30,
        hpRestaurado: 0,
        fueRevivida: false,
      });

      assert.deepStrictEqual(resultado.detalles[1], {
        criaturaId: 'cri-herida',
        nombre: 'Águila Veloz',
        hpPrevio: 12,
        hpNuevo: 30,
        hpMaximo: 30,
        hpRestaurado: 18,
        fueRevivida: false,
      });

      assert.deepStrictEqual(resultado.detalles[2], {
        criaturaId: 'cri-debilitada',
        nombre: 'Oso Pardo',
        hpPrevio: 0,
        hpNuevo: 35,
        hpMaximo: 35,
        hpRestaurado: 35,
        fueRevivida: true,
      });

      // Verificación del historial transaccional
      assert.strictEqual(historialCreado.tipo, 'CURACION');
      assert.strictEqual(historialCreado.datosJson.criaturasCuradas, 2);
      assert.strictEqual(historialCreado.datosJson.criaturasRevividas, 1);
      assert.strictEqual(historialCreado.datosJson.hpTotalRestaurado, 53);
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

    it('debe calcular compra por lotes (x5 y x10) en el servidor y actualizar saldo e inventario', async () => {
      let saldoPersistido = 500;
      let cantidadInventarioPersistida = 0;

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            monedas: saldoPersistido,
            ubicacionActual: { id: 'LOC-02', servicios: ['TIENDA'] },
          }),
        },
        objeto: {
          findUnique: async () => ({
            id: 'obj-pocion',
            codigo: 'pocion-menor',
            nombre: 'Poción Menor',
            precioCompra: 30,
          }),
        },
        $transaction: async (cb: any) => {
          const txMock: any = {
            personaje: {
              findUnique: async () => ({ id: 'pj-1', monedas: saldoPersistido }),
              update: async ({ data }: any) => {
                saldoPersistido -= data.monedas.decrement;
                return { id: 'pj-1', monedas: saldoPersistido };
              },
            },
            inventarioPersonaje: {
              upsert: async ({ update }: any) => {
                cantidadInventarioPersistida += update.cantidad.increment;
                return { id: 'inv-1', cantidad: cantidadInventarioPersistida };
              },
            },
            historial: { create: async () => ({ id: 'h-1' }) },
          };
          return cb(txMock);
        },
      };

      const servicio = new TiendaService(prismaMock);

      // Compra lote x5: 5 * 30 = 150 monedas
      const res5 = await servicio.comprar('usr-1', 'pocion-menor', 5);
      assert.strictEqual(res5.cantidadComprada, 5);
      assert.strictEqual(res5.precioUnitario, 30);
      assert.strictEqual(res5.costoTotal, 150);
      assert.strictEqual(res5.saldoRestante, 350);
      assert.strictEqual(res5.cantidadEnInventario, 5);

      // Compra lote x10: 10 * 30 = 300 monedas
      const res10 = await servicio.comprar('usr-1', 'pocion-menor', 10);
      assert.strictEqual(res10.cantidadComprada, 10);
      assert.strictEqual(res10.precioUnitario, 30);
      assert.strictEqual(res10.costoTotal, 300);
      assert.strictEqual(res10.saldoRestante, 50);
      assert.strictEqual(res10.cantidadEnInventario, 15);
    });

    it('debe exponer catálogo oficial con servicioDisponible y existencias en bolsa', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            monedas: 250,
            ubicacionActual: { id: 'LOC-01', nombre: 'Villa Serena', esSegura: true, servicios: ['POSADA'] },
          }),
        },
        objeto: {
          findMany: async () => [
            { id: 'o-1', codigo: 'pocion-menor', nombre: 'Poción Menor', descripcion: 'Cura 20 HP', tipo: 'CURACION', precioCompra: 30, efectoValor: 20 },
          ],
        },
        inventarioPersonaje: {
          findMany: async () => [
            { objetoId: 'o-1', cantidad: 3 },
          ],
        },
      };

      const servicio = new TiendaService(prismaMock);
      const catalogo = await servicio.obtenerCatalogo('usr-1');

      assert.strictEqual(catalogo.saldoMonedas, 250);
      assert.strictEqual(catalogo.servicioDisponible, false); // Villa Serena no tiene TIENDA
      assert.strictEqual(catalogo.ubicacionActual.nombre, 'Villa Serena');
      assert.strictEqual(catalogo.items.length, 1);
      assert.strictEqual(catalogo.items[0].cantidadEnInventario, 3);
      assert.strictEqual(catalogo.items[0].efectoValor, 20);
    });
  });

  describe('Seguridad S-6: Integridad de datos y rechazo de campos inyectados', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('debe rechazar cantidad fuera de rango en ComprarDto (cantidad: 100 y cantidad: 0)', async () => {
      // Intento con cantidad > 99
      await assert.rejects(
        async () => {
          await pipe.transform(
            { itemCodigo: 'pocion-menor', cantidad: 100 },
            { type: 'body', metatype: ComprarDto },
          );
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const msg = JSON.stringify(error.getResponse());
          assert.strictEqual(msg.includes('cantidad'), true);
          return true;
        },
      );

      // Intento con cantidad < 1
      await assert.rejects(
        async () => {
          await pipe.transform(
            { itemCodigo: 'pocion-menor', cantidad: 0 },
            { type: 'body', metatype: ComprarDto },
          );
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          const msg = JSON.stringify(error.getResponse());
          assert.strictEqual(msg.includes('cantidad'), true);
          return true;
        },
      );
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

  describe('Aislamiento por Personaje y entrega de recompensas (§2.4)', () => {
    it('debe rechazar otorgar XP a una criatura que pertenece a otro personaje con ForbiddenException', async () => {
      const mockPrisma = {
        criatura: {
          findUnique: async () => ({
            id: 'cri-otra',
            personajeId: 'personaje-ajeno', // Pertenencia ajena
            nivel: 2,
            experiencia: 150,
            especie: { hpBase: 30, ataqueBase: 40, defensaBase: 40, velocidadBase: 40 },
          }),
        },
      } as any;

      const servicio = new ProgresoService(mockPrisma);
      await assert.rejects(
        async () => {
          await servicio.aplicarRecompensaVictoria(
            mockPrisma,
            'mi-personaje-autenticado',
            'cri-otra',
            {
              nivel: 2,
              especie: {
                challengeRating: 0.5,
                nombre: 'Lobo',
                hpBase: 30,
                ataqueBase: 40,
                defensaBase: 40,
                velocidadBase: 40,
              },
            },
          );
        },
        (error: any) => {
          assert.strictEqual(error instanceof ForbiddenException, true);
          return true;
        },
      );
    });

    it('debe otorgar XP y acumular sobre la base canónica del nivel a la criatura propia', async () => {
      let datosActualizados: any = null;
      let monedasActualizadas: any = null;

      const mockPrisma = {
        criatura: {
          findUnique: async () => ({
            id: 'mi-criatura',
            personajeId: 'mi-personaje',
            nivel: 3,
            experiencia: 10, // Desfasada previamente, base de nivel 3 es 374
            especie: { hpBase: 30, ataqueBase: 40, defensaBase: 40, velocidadBase: 40, nombre: 'Lobo' },
          }),
          update: async ({ data }: any) => {
            datosActualizados = data;
            return { id: 'mi-criatura', ...data };
          },
        },
        personaje: {
          update: async ({ data }: any) => {
            monedasActualizadas = data;
            return { id: 'mi-personaje', monedas: 150 };
          },
        },
        historial: {
          create: async () => ({ id: 'his-1' }),
        },
      } as any;

      const servicio = new ProgresoService(mockPrisma);
      const resultado = await servicio.aplicarRecompensaVictoria(
        mockPrisma,
        'mi-personaje',
        'mi-criatura',
        {
          nivel: 2,
          especie: {
            challengeRating: 0.5,
            nombre: 'Lobo',
            hpBase: 30,
            ataqueBase: 40,
            defensaBase: 40,
            velocidadBase: 40,
          },
        },
      );

      // 374 (base nivel 3) + 10 (previa) + 46 (xpGanada para rival nv 2 con cr 0.5) = 430
      assert.strictEqual(datosActualizados.experiencia >= 374, true);
      assert.strictEqual(resultado.porcentajeXp > 0, true);
    });
  });
});
