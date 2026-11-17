import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EquipoService, LIMITE_EQUIPO } from '../src/modulos/equipo/equipo.service';

describe('Gestión de Equipo y Almacén (Subfase 10f)', () => {
  describe('actualizarOrden y validación de permutación completa', () => {
    it('debe rechazar lista parcial con BadRequestException (ORDEN_INVALIDO)', async () => {
      const criaturasBD = [
        { id: 'c-1', nombre: 'Ignis', enEquipo: true, ordenEquipo: 1, nivel: 5, experiencia: 1000, especie: { slug: 'ignis', nombre: 'Ignis' } },
        { id: 'c-2', nombre: 'Aqua', enEquipo: true, ordenEquipo: 2, nivel: 5, experiencia: 1000, especie: { slug: 'aqua', nombre: 'Aqua' } },
        { id: 'c-3', nombre: 'Terra', enEquipo: true, ordenEquipo: 3, nivel: 5, experiencia: 1000, especie: { slug: 'terra', nombre: 'Terra' } },
      ];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findMany: async () => criaturasBD,
          update: async () => ({}),
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          // Solo envía 2 de las 3 criaturas
          await servicio.actualizarOrden('usr-1', {
            criaturaIds: ['c-1', 'c-2'],
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'ORDEN_INVALIDO');
          return true;
        },
      );
    });

    it('debe rechazar IDs duplicados con BadRequestException (ORDEN_INVALIDO)', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findMany: async () => [],
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.actualizarOrden('usr-1', {
            criaturaIds: ['c-1', 'c-1'],
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'ORDEN_INVALIDO');
          return true;
        },
      );
    });

    it('debe rechazar órdenes repetidos o no consecutivos con BadRequestException (ORDEN_INVALIDO)', async () => {
      const criaturasBD = [
        { id: 'c-1', enEquipo: true, ordenEquipo: 1, nivel: 5, experiencia: 1000, especie: { slug: 'ignis', nombre: 'Ignis' } },
        { id: 'c-2', enEquipo: true, ordenEquipo: 2, nivel: 5, experiencia: 1000, especie: { slug: 'aqua', nombre: 'Aqua' } },
      ];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({ id: 'pj-1', usuarioId: 'usr-1' }),
        },
        criatura: {
          findMany: async () => criaturasBD,
          update: async () => ({}),
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.actualizarOrden('usr-1', {
            orden: [
              { criaturaId: 'c-1', orden: 1 },
              { criaturaId: 'c-2', orden: 1 },
            ],
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'ORDEN_INVALIDO');
          return true;
        },
      );
    });

    it('debe aceptar permutación completa válida y actualizar cada posición', async () => {
      const criaturasBD = [
        { id: 'c-1', enEquipo: true, ordenEquipo: 1, nivel: 5, experiencia: 1000, hpActual: 50, hpMaximo: 50, ataque: 10, defensa: 10, velocidad: 10, especie: { slug: 'ignis', nombre: 'Ignis' } },
        { id: 'c-2', enEquipo: true, ordenEquipo: 2, nivel: 5, experiencia: 1000, hpActual: 50, hpMaximo: 50, ataque: 10, defensa: 10, velocidad: 10, especie: { slug: 'aqua', nombre: 'Aqua' } },
        { id: 'c-3', enEquipo: true, ordenEquipo: 3, nivel: 5, experiencia: 1000, hpActual: 50, hpMaximo: 50, ataque: 10, defensa: 10, velocidad: 10, especie: { slug: 'terra', nombre: 'Terra' } },
      ];

      const actualizaciones: { id: string; orden: number }[] = [];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            usuarioId: 'usr-1',
            ubicacionActual: { esSegura: true },
          }),
        },
        criatura: {
          findMany: async () => criaturasBD,
          update: async ({ where, data }: any) => {
            actualizaciones.push({ id: where.id, orden: data.ordenEquipo });
            return {};
          },
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      // Reubicar: c-3 primero, luego c-1, luego c-2
      const resultado = await servicio.actualizarOrden('usr-1', {
        criaturaIds: ['c-3', 'c-1', 'c-2'],
      });

      assert.strictEqual(actualizaciones.length, 3);
      assert.deepStrictEqual(actualizaciones, [
        { id: 'c-3', orden: 1 },
        { id: 'c-1', orden: 2 },
        { id: 'c-2', orden: 3 },
      ]);
      assert.strictEqual(resultado.limiteEquipo, LIMITE_EQUIPO);
      assert.strictEqual(resultado.enLocalidadSegura, true);
    });
  });

  describe('moverCriatura: Intercambio atómico y regla A-6', () => {
    it('debe intercambiar atómicamente una criatura del almacén por una del equipo preservando su orden', async () => {
      const entranteAlmacen = {
        id: 'c-entrante',
        enEquipo: false,
        ordenEquipo: null,
        especie: { nombre: 'Gólem de Roca' },
      };
      const salienteEquipo = {
        id: 'c-saliente',
        enEquipo: true,
        ordenEquipo: 1, // Líder
        especie: { nombre: 'Lobo Alfa' },
      };

      const actualizaciones: any[] = [];

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: { esSegura: true },
          }),
        },
        criatura: {
          findFirst: async ({ where }: any) => {
            if (where.id === 'c-entrante') return entranteAlmacen;
            if (where.id === 'c-saliente') return salienteEquipo;
            return null;
          },
          update: async ({ where, data }: any) => {
            actualizaciones.push({ id: where.id, data });
            return {};
          },
          count: async ({ where }: any) => {
            if (where.enEquipo) return 6; // Equipo completo
            return 10;
          },
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      const res = await servicio.moverCriatura('usr-1', {
        criaturaId: 'c-entrante',
        haciaEquipo: true,
        intercambiarConId: 'c-saliente',
      });

      assert.strictEqual(
        res.mensaje,
        'Intercambio completado: Gólem de Roca ocupa el puesto de Lobo Alfa.',
      );
      assert.strictEqual(res.totalEnEquipo, 6);
      assert.strictEqual(actualizaciones.length, 2);

      // Saliente al almacén
      assert.strictEqual(actualizaciones[0].id, 'c-saliente');
      assert.strictEqual(actualizaciones[0].data.enEquipo, false);
      assert.strictEqual(actualizaciones[0].data.ordenEquipo, null);

      // Entrante al equipo con el orden de la saliente (orden 1 = líder)
      assert.strictEqual(actualizaciones[1].id, 'c-entrante');
      assert.strictEqual(actualizaciones[1].data.enEquipo, true);
      assert.strictEqual(actualizaciones[1].data.ordenEquipo, 1);
    });

    it('debe rechazar transferir al equipo sin intercambio si ya cuenta con 6 criaturas (Regla A-6)', async () => {
      const criaturaAlmacen = {
        id: 'c-nueva',
        enEquipo: false,
        especie: { nombre: 'Draco' },
      };

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: { esSegura: true },
          }),
        },
        criatura: {
          findFirst: async () => criaturaAlmacen,
          count: async () => 6, // Ya está lleno
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.moverCriatura('usr-1', {
            criaturaId: 'c-nueva',
            haciaEquipo: true,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof ConflictException, true);
          assert.strictEqual(error.getResponse().codigo, 'EQUIPO_COMPLETO');
          return true;
        },
      );
    });

    it('debe rechazar enviar al almacén si el equipo tiene solo 1 criatura (Equipo mínimo)', async () => {
      const criaturaEquipo = {
        id: 'c-unica',
        enEquipo: true,
        especie: { nombre: 'Fénix' },
      };

      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: { esSegura: true },
          }),
        },
        criatura: {
          findFirst: async () => criaturaEquipo,
          count: async () => 1, // Solo queda 1
        },
        $queryRaw: async () => [],
        $transaction: async (fn: any) => fn(prismaMock),
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.moverCriatura('usr-1', {
            criaturaId: 'c-unica',
            haciaEquipo: false,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof BadRequestException, true);
          assert.strictEqual(error.getResponse().codigo, 'EQUIPO_MINIMO_REQUERIDO');
          return true;
        },
      );
    });

    it('debe rechazar transferencias fuera de una localidad segura con ForbiddenException', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: { esSegura: false },
          }),
        },
      };

      const servicio = new EquipoService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.moverCriatura('usr-1', {
            criaturaId: 'c-1',
            haciaEquipo: true,
          });
        },
        (error: any) => {
          assert.strictEqual(error instanceof ForbiddenException, true);
          assert.strictEqual(error.getResponse().codigo, 'ACCION_NO_PERMITIDA');
          return true;
        },
      );
    });
  });

  describe('obtenerEquipo y obtenerAlmacen enriquecidos', () => {
    it('debe entregar estadísticas completas, limiteEquipo, enLocalidadSegura y totalEnEquipo', async () => {
      const prismaMock: any = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-1',
            ubicacionActual: { esSegura: true },
          }),
        },
        criatura: {
          findMany: async () => [
            {
              id: 'c-1',
              nivel: 2,
              hpActual: 20,
              hpMaximo: 20,
              ataque: 5,
              defensa: 4,
              velocidad: 6,
              experiencia: 150,
              ordenEquipo: null,
              especie: { slug: 'bestia', nombre: 'Bestia' },
            },
          ],
          count: async () => 4,
        },
      };

      const servicio = new EquipoService(prismaMock);

      const almacen = await servicio.obtenerAlmacen('usr-1');
      assert.strictEqual(almacen.limiteEquipo, 6);
      assert.strictEqual(almacen.enLocalidadSegura, true);
      assert.strictEqual(almacen.totalEnEquipo, 4);
      assert.strictEqual(almacen.criaturas[0].ataque, 5);
      assert.strictEqual(almacen.criaturas[0].defensa, 4);
      assert.strictEqual(almacen.criaturas[0].velocidad, 6);
      assert.strictEqual(almacen.criaturas[0].orden, null);
    });
  });
});
