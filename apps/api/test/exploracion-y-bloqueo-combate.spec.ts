import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ExploracionService } from '../src/modulos/exploracion/exploracion.service';
import { EncuentrosService } from '../src/modulos/encuentros/encuentros.service';
import { MundoService } from '../src/modulos/mundo/mundo.service';
import { AutenticacionService } from '../src/modulos/autenticacion/autenticacion.service';
import { CuracionService } from '../src/modulos/curacion/curacion.service';
import { TiendaService } from '../src/modulos/tienda/tienda.service';
import { EquipoService } from '../src/modulos/equipo/equipo.service';

describe('Protección contra equipo debilitado (0 HP) y bloqueo durante combate activo', () => {
  it('ExploracionService.explorar rechaza con 400 EQUIPO_DEBILITADO cuando todas las criaturas del equipo tienen 0 HP', async () => {
    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-debilitado',
          ubicacionActual: {
            id: 'ZON-01',
            nombre: 'Praderas del Amanecer',
            esSegura: false,
          },
        }),
      },
      encuentro: {
        findFirst: async () => null,
      },
      criatura: {
        count: async () => 0,
      },
    };

    const servicio = new ExploracionService(prismaMock, {} as any);

    await assert.rejects(
      async () => {
        await servicio.explorar('usr-debilitado');
      },
      (err: any) => {
        assert.strictEqual(err instanceof BadRequestException, true);
        assert.strictEqual(err.getResponse().codigo, 'EQUIPO_DEBILITADO');
        return true;
      },
    );
  });

  it('ExploracionService.explorar autorrepara un encuentro huérfano EN_CURSO con equipo en 0 HP y devuelve EQUIPO_DEBILITADO', async () => {
    let estadoActualizado: string | null = null;

    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-huerfano',
          ubicacionActual: {
            id: 'ZON-01',
            nombre: 'Praderas del Amanecer',
            esSegura: false,
          },
        }),
      },
      encuentro: {
        findFirst: async () => ({ id: 'enc-huerfano' }),
        update: async ({ data }: any) => {
          estadoActualizado = data.estado;
          return { id: 'enc-huerfano', estado: data.estado };
        },
      },
      criatura: {
        count: async ({ where }: any) => {
          if (where.hpActual?.gt === 0) return 0;
          return 2;
        },
      },
    };

    const servicio = new ExploracionService(prismaMock, {} as any);

    await assert.rejects(
      async () => {
        await servicio.explorar('usr-huerfano');
      },
      (err: any) => {
        assert.strictEqual(err instanceof BadRequestException, true);
        assert.strictEqual(err.getResponse().codigo, 'EQUIPO_DEBILITADO');
        return true;
      },
    );

    assert.strictEqual(
      estadoActualizado,
      'DERROTA',
      'Debe cerrar el encuentro huérfano como DERROTA antes de rechazar la exploración',
    );
  });

  it('EncuentrosService.obtenerEncuentroActivo cierra automáticamente un encuentro huérfano cuando todo el equipo está en 0 HP', async () => {
    let encuentroCerradoId: string | null = null;
    let estadoCierre: string | null = null;

    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-1',
          criaturas: [
            { id: 'cri-1', hpActual: 0, hpMaximo: 30, enEquipo: true },
            { id: 'cri-2', hpActual: 0, hpMaximo: 25, enEquipo: true },
          ],
        }),
      },
      encuentro: {
        findFirst: async () => ({
          id: 'enc-bucle',
          estado: 'EN_CURSO',
          criaturaRival: { especie: { slug: 'lobo-estepario', nombre: 'Lobo' } },
          combates: [],
        }),
        update: async ({ where, data }: any) => {
          encuentroCerradoId = where.id;
          estadoCierre = data.estado;
          return { id: where.id, estado: data.estado };
        },
      },
    };

    const servicio = new EncuentrosService(prismaMock);

    await assert.rejects(
      async () => {
        await servicio.obtenerEncuentroActivo('usr-1');
      },
      (err: any) => {
        assert.strictEqual(err instanceof NotFoundException, true);
        assert.strictEqual(err.getResponse().codigo, 'ENCUENTRO_NO_ENCONTRADO');
        return true;
      },
    );

    assert.strictEqual(encuentroCerradoId, 'enc-bucle');
    assert.strictEqual(estadoCierre, 'DERROTA');
  });

  it('MundoService.obtenerUbicacionActual informa equipoDebilitado=true y reconcilia encuentro huérfano en 0 HP', async () => {
    let reconciliado = false;

    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-mundo',
          usuarioId: 'usr-mundo',
          ubicacionActualId: 'ZON-01',
        }),
      },
      zona: {
        findUnique: async () => ({
          id: 'ZON-01',
          nombre: 'Praderas del Amanecer',
          tipo: 'ZONA',
          esSegura: false,
          descripcion: 'Praderas abiertas.',
          nivelMinimo: 1,
          nivelMaximo: 3,
          servicios: [],
        }),
      },
      criatura: {
        findMany: async () => [
          { nivel: 2, enEquipo: true, hpActual: 0 },
          { nivel: 4, enEquipo: false, hpActual: 40 },
        ],
      },
      conexionZona: { findMany: async () => [] },
      zonaDesbloqueada: {
        findMany: async () => [
          { personajeId: 'pj-mundo', zonaId: 'ZON-01', progreso: 40 },
        ],
      },
      encuentro: {
        findFirst: async () => ({ id: 'enc-stuck' }),
        update: async ({ data }: any) => {
          if (data.estado === 'DERROTA') reconciliado = true;
          return { id: 'enc-stuck', estado: data.estado };
        },
      },
    };

    const servicio = new MundoService(prismaMock);
    const ubicacion = await servicio.obtenerUbicacionActual('usr-mundo');

    assert.strictEqual(ubicacion.equipoDebilitado, true);
    assert.strictEqual(ubicacion.tieneEncuentroActivo, false);
    assert.strictEqual(reconciliado, true);
  });

  it('AutenticacionService.obtenerPerfil reporta tieneEncuentroActivo=true cuando hay combate activo con criaturas vivas', async () => {
    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-activo',
          nombre: 'Alden',
          monedas: 120,
          ubicacionActualId: 'ZON-01',
          criaturas: [{ enEquipo: true, hpActual: 18 }],
        }),
      },
      encuentro: {
        findFirst: async () => ({ id: 'enc-activo' }),
      },
    };

    const servicio = new AutenticacionService(prismaMock, {} as any);
    const perfil = await servicio.obtenerPerfil({
      sub: 'usr-activo',
      nombreUsuario: 'alden',
      correo: 'alden@aethelgard.com',
    });

    assert.strictEqual(perfil.tieneEncuentroActivo, true);
  });

  it('CuracionService, TiendaService y EquipoService.moverCriatura rechazan con 409 ENCUENTRO_PREVIO_ACTIVO si hay combate activo', async () => {
    const prismaConCombate: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-en-combate',
          monedas: 500,
          ubicacionActual: {
            id: 'LOC-01',
            nombre: 'Villa Serena',
            esSegura: true,
            servicios: ['CURACION', 'TIENDA', 'ALMACEN'],
          },
        }),
      },
      encuentro: {
        findFirst: async () => ({ id: 'enc-en-curso' }),
      },
      criatura: {
        count: async () => 1,
      },
    };

    const validarConflictoCombate = (err: any) => {
      assert.strictEqual(err instanceof ConflictException, true);
      assert.strictEqual(err.getResponse().codigo, 'ENCUENTRO_PREVIO_ACTIVO');
      return true;
    };

    const curacion = new CuracionService(prismaConCombate);
    await assert.rejects(
      () => curacion.restaurarEquipo('usr-combate'),
      validarConflictoCombate,
    );

    const tienda = new TiendaService(prismaConCombate);
    await assert.rejects(
      () => tienda.comprar('usr-combate', 'pocion-menor', 1),
      validarConflictoCombate,
    );

    const equipo = new EquipoService(prismaConCombate);
    await assert.rejects(
      () =>
        equipo.moverCriatura('usr-combate', {
          criaturaId: 'cri-1',
          haciaEquipo: false,
        }),
      validarConflictoCombate,
    );
  });
});
