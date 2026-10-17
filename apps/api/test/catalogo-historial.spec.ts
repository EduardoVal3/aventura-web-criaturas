import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { NotFoundException } from '@nestjs/common';
import {
  CriaturasService,
  determinarArquetipoEspecie,
} from '../src/modulos/criaturas/criaturas.service';
import {
  HistorialService,
  normalizarCategoriaHistorial,
} from '../src/modulos/historial/historial.service';
import { PrismaService } from '../src/comun/prisma/prisma.service';

describe('Compendio de Criaturas (M-CRI) y Bitácora de Historial (M-HIS)', () => {
  describe('CriaturasService: catálogo unificado sin ráfagas N+1', () => {
    it('determinarArquetipoEspecie clasifica correctamente las 4 vertientes tácticas', () => {
      // TANQUE (defensaBase >= 75 o hpBase >= 65 como atributo dominante)
      const armaduraAnimada = determinarArquetipoEspecie({
        hpBase: 40,
        ataqueBase: 42,
        defensaBase: 100,
        velocidadBase: 41,
      });
      assert.strictEqual(armaduraAnimada, 'TANQUE', 'Armadura Animada debe ser TANQUE');

      const hidra = determinarArquetipoEspecie({
        hpBase: 95,
        ataqueBase: 72,
        defensaBase: 68,
        velocidadBase: 47,
      });
      assert.strictEqual(hidra, 'TANQUE', 'Hidra debe ser TANQUE por HP predominante');

      // ATACANTE (ataqueBase >= 70 superando a defensa y velocidad)
      const alosaurio = determinarArquetipoEspecie({
        hpBase: 51,
        ataqueBase: 100,
        defensaBase: 58,
        velocidadBase: 67,
      });
      assert.strictEqual(alosaurio, 'ATACANTE', 'Alosaurio debe ser ATACANTE');

      const osobuho = determinarArquetipoEspecie({
        hpBase: 53,
        ataqueBase: 76,
        defensaBase: 58,
        velocidadBase: 50,
      });
      assert.strictEqual(osobuho, 'ATACANTE', 'Osobuho debe ser ATACANTE');

      // VELOZ (velocidadBase >= 70 superando a ataque)
      const grifo = determinarArquetipoEspecie({
        hpBase: 53,
        ataqueBase: 68,
        defensaBase: 51,
        velocidadBase: 89,
      });
      assert.strictEqual(grifo, 'VELOZ', 'Grifo debe ser VELOZ');

      const elementalAire = determinarArquetipoEspecie({
        hpBase: 62,
        ataqueBase: 68,
        defensaBase: 68,
        velocidadBase: 100,
      });
      assert.strictEqual(elementalAire, 'VELOZ', 'Elemental de Aire debe ser VELOZ');

      // EQUILIBRADO (sin ningún atributo desbordado)
      const loboGris = determinarArquetipoEspecie({
        hpBase: 30,
        ataqueBase: 42,
        defensaBase: 58,
        velocidadBase: 50,
      });
      assert.strictEqual(loboGris, 'EQUILIBRADO', 'Lobo Gris debe ser EQUILIBRADO');
    });

    it('obtenerEspecies entrega las 30 especies enriquecidas con movimientos y arquetipo en una sola llamada', async () => {
      // Mock de Prisma con especies sembradas
      const prismaMock = {
        especie: {
          findMany: async () => [
            {
              id: 'esp-01',
              idExterno: 'srd-2024_wolf',
              nombre: 'Lobo Gris',
              slug: 'lobo-gris',
              tipo: 'beast',
              challengeRating: 0.25,
              hpBase: 30,
              ataqueBase: 42,
              defensaBase: 58,
              velocidadBase: 50,
              tasaCaptura: 0.88,
              esEspecial: false,
              descripcion: 'Cazador en manada ágil y coordinado.',
              movimientos: [
                {
                  id: 'mov-01',
                  nombreOriginal: 'Bite',
                  nombre: 'Mordisco Feroz',
                  tipoAccion: 'Ataque melé',
                  poder: 5.5,
                },
              ],
            },
          ],
          count: async () => 1,
        },
      } as unknown as PrismaService;

      const servicio = new CriaturasService(prismaMock);
      const respuesta = await servicio.obtenerEspecies();

      assert.strictEqual(respuesta.total, 1);
      assert.strictEqual(respuesta.especies.length, 1);
      const esp = respuesta.especies[0];
      assert.strictEqual(esp.slug, 'lobo-gris');
      assert.strictEqual(esp.keyExterna, 'srd-2024_wolf');
      assert.strictEqual(esp.arquetipo, 'EQUILIBRADO');
      assert.strictEqual(esp.movimientos.length, 1);
      assert.strictEqual(esp.movimientos[0].nombre, 'Mordisco Feroz');
      assert.strictEqual(esp.movimientos[0].tipoAccion, 'Ataque melé');
      assert.strictEqual(esp.movimientos[0].poder, 5.5);
    });

    it('obtenerEspecies filtra por tipo biológico y activa fallback determinista si la BD está vacía', async () => {
      // Prisma mock simulando base vacía
      const prismaVacio = {
        especie: {
          findMany: async () => [],
          findUnique: async () => null,
          count: async () => 0,
        },
      } as unknown as PrismaService;

      const servicio = new CriaturasService(prismaVacio);

      // Consulta de todas las especies vía fallback
      const todas = await servicio.obtenerEspecies();
      assert.strictEqual(todas.total, 30, 'Debe cargar las 30 especies del bestiario');
      assert.strictEqual(todas.especies.length, 30);

      // Consulta filtrada por tipo elemental
      const elementales = await servicio.obtenerEspecies('elemental');
      assert.strictEqual(elementales.total, 5, 'Debe retornar exactamente las 5 especies elementales');
      for (const e of elementales.especies) {
        assert.strictEqual(e.tipo, 'elemental');
      }

      // Consulta de detalle por slug
      const lobo = await servicio.obtenerEspeciePorSlug('lobo-gris');
      assert.strictEqual(lobo.slug, 'lobo-gris');
      assert.strictEqual(lobo.nombre, 'Lobo Gris');
      assert.ok(lobo.movimientos.length >= 1, 'Lobo debe tener movimientos');
    });

    it('obtenerEspeciePorSlug arroja 404 ESPECIE_NO_ENCONTRADA ante un slug inexistente', async () => {
      const prismaMock = {
        especie: {
          findUnique: async () => null,
          count: async () => 25,
        },
      } as unknown as PrismaService;

      const servicio = new CriaturasService(prismaMock);

      await assert.rejects(
        async () => {
          await servicio.obtenerEspeciePorSlug('dragon-desconocido');
        },
        (error: any) => {
          assert.ok(error instanceof NotFoundException);
          const respuesta = error.getResponse() as any;
          assert.strictEqual(respuesta.codigo, 'ESPECIE_NO_ENCONTRADA');
          return true;
        },
      );
    });
  });

  describe('HistorialService: normalización de categorías y bitácora paginada', () => {
    it('normalizarCategoriaHistorial mapea coherentemente todos los tipos del servidor', () => {
      assert.strictEqual(normalizarCategoriaHistorial('CAPTURA'), 'CAPTURA');

      assert.strictEqual(normalizarCategoriaHistorial('COMERCIO'), 'TIENDA');
      assert.strictEqual(normalizarCategoriaHistorial('TIENDA'), 'TIENDA');
      assert.strictEqual(normalizarCategoriaHistorial('COMPRA'), 'TIENDA');

      assert.strictEqual(normalizarCategoriaHistorial('CURACION'), 'CURACION');
      assert.strictEqual(normalizarCategoriaHistorial('SANTUARIO'), 'CURACION');

      assert.strictEqual(normalizarCategoriaHistorial('COMBATE'), 'COMBATE');
      assert.strictEqual(normalizarCategoriaHistorial('VICTORIA_COMBATE'), 'COMBATE');
      assert.strictEqual(normalizarCategoriaHistorial('DERROTA_COMBATE'), 'COMBATE');
      assert.strictEqual(normalizarCategoriaHistorial('HUIDA'), 'COMBATE');
      assert.strictEqual(normalizarCategoriaHistorial('PROGRESO'), 'COMBATE');

      assert.strictEqual(normalizarCategoriaHistorial('EXPLORACION'), 'EXPLORACION');
      assert.strictEqual(normalizarCategoriaHistorial('ENCUENTRO'), 'EXPLORACION');
      assert.strictEqual(normalizarCategoriaHistorial('OBJETO'), 'EXPLORACION');
      assert.strictEqual(normalizarCategoriaHistorial('VIAJE'), 'EXPLORACION');
      assert.strictEqual(normalizarCategoriaHistorial('TIPO_DESCONOCIDO'), 'EXPLORACION');
    });

    it('obtenerHistorial entrega eventos enriquecidos con categoria y datosJson, soportando filtros', async () => {
      const registrosSimulados = [
        {
          id: 'ev-1',
          personajeId: 'per-1',
          tipo: 'VICTORIA_COMBATE',
          descripcion: 'Victoria frente a Lobo Gris',
          datosJson: { monedas: 25, xp: 50 },
          fechaRegistro: new Date('2026-10-16T12:00:00.000Z'),
        },
        {
          id: 'ev-2',
          personajeId: 'per-1',
          tipo: 'CAPTURA',
          descripcion: 'Capturaste un Lobo Gris',
          datosJson: { criaturaId: 'c-1' },
          fechaRegistro: new Date('2026-10-16T12:05:00.000Z'),
        },
      ];

      const prismaMock = {
        personaje: {
          findUnique: async () => ({ id: 'per-1' }),
        },
        historial: {
          count: async (args: any) => {
            if (args.where?.tipo?.in) {
              return registrosSimulados.filter((r) => args.where.tipo.in.includes(r.tipo)).length;
            }
            return registrosSimulados.length;
          },
          findMany: async (args: any) => {
            if (args.where?.tipo?.in) {
              return registrosSimulados.filter((r) => args.where.tipo.in.includes(r.tipo));
            }
            return registrosSimulados;
          },
        },
      } as unknown as PrismaService;

      const servicio = new HistorialService(prismaMock);

      // Consulta general
      const resTodos = await servicio.obtenerHistorial('usr-1', { pagina: 1, limite: 10 });
      assert.strictEqual(resTodos.total, 2);
      assert.strictEqual(resTodos.eventos.length, 2);
      assert.strictEqual(resTodos.eventos[0].categoria, 'COMBATE');
      assert.strictEqual((resTodos.eventos[0].datosJson as any).monedas, 25);
      assert.strictEqual(resTodos.eventos[1].categoria, 'CAPTURA');

      // Consulta con filtro de categoría
      const resFiltro = await servicio.obtenerHistorial('usr-1', {
        pagina: 1,
        limite: 10,
        categoria: 'CAPTURA',
      });
      assert.strictEqual(resFiltro.total, 1);
      assert.strictEqual(resFiltro.eventos[0].tipo, 'CAPTURA');
      assert.strictEqual(resFiltro.eventos[0].categoria, 'CAPTURA');
    });
  });
});
