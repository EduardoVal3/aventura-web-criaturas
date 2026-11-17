import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { NotFoundException } from '@nestjs/common';
import { EncuentrosService } from '../src/modulos/encuentros/encuentros.service';

describe('Reanudación Enriquecida de Encuentros (Subfase 10k)', () => {
  it('arroja PERSONAJE_NO_ENCONTRADO si el usuario no tiene personaje activo', async () => {
    const prismaMock: any = {
      personaje: { findUnique: async () => null },
    };
    const servicio = new EncuentrosService(prismaMock);

    await assert.rejects(
      async () => {
        await servicio.obtenerEncuentroActivo('usr-inexistente');
      },
      (err: any) => {
        assert.strictEqual(err instanceof NotFoundException, true);
        assert.strictEqual(err.getResponse().codigo, 'PERSONAJE_NO_ENCONTRADO');
        return true;
      },
    );
  });

  it('arroja ENCUENTRO_NO_ENCONTRADO si no hay encuentro en curso', async () => {
    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({ id: 'pj-1', criaturas: [] }),
      },
      encuentro: {
        findFirst: async () => null,
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
  });

  it('entrega afinidades, efectividad de ventaja, resonancia 0 y slot 4 bloqueado al inicio', async () => {
    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-1',
          criaturas: [
            {
              id: 'cri-aliada-1',
              nivel: 5,
              ataque: 20,
              defensa: 15,
              velocidad: 14,
              hpActual: 50,
              hpMaximo: 50,
              experiencia: 100,
              enEquipo: true,
              ordenEquipo: 1,
              especie: {
                slug: 'lobo-bosque',
                nombre: 'Lobo del Bosque',
                elemento: 'natura',
                movimientos: [
                  { nombre: 'Arañazo', poder: 10, tipoAccion: 'ATAQUE', slot: 1, efecto: null },
                  { nombre: 'Liana', poder: 20, tipoAccion: 'ATAQUE', slot: 2, efecto: null },
                  { nombre: 'Esporas', poder: 0, tipoAccion: 'ESTADO', slot: 3, efecto: 'VENENO' },
                  { nombre: 'Furia de la Selva', poder: 60, tipoAccion: 'INSIGNIA', slot: 4, efecto: null },
                ],
              },
            },
          ],
        }),
      },
      encuentro: {
        findFirst: async () => ({
          id: 'enc-1',
          estado: 'EN_CURSO',
          criaturaRival: {
            id: 'cri-rival-1',
            nivel: 5,
            ataque: 18,
            defensa: 12,
            velocidad: 10,
            hpActual: 45,
            hpMaximo: 45,
            especie: {
              slug: 'salamandra-roca',
              nombre: 'Salamandra de Roca',
              elemento: 'agua',
            },
          },
          combates: [],
        }),
      },
    };

    const servicio = new EncuentrosService(prismaMock);
    const res = await servicio.obtenerEncuentroActivo('usr-1');

    assert.strictEqual(res.encuentroId, 'enc-1');
    assert.strictEqual(res.turno, 1);
    assert.strictEqual(res.criaturaAliada?.afinidad, 'natura');
    assert.strictEqual(res.criaturaRival?.afinidad, 'agua');

    // Natura vs Agua tiene ventaja (1.5x)
    assert.strictEqual(res.efectividadAliadaSobreRival.multiplicador, 1.5);
    assert.strictEqual(res.efectividadAliadaSobreRival.etiqueta, 'VENTAJA');

    // Sin combates: resonancia 0 y estados vacíos
    assert.strictEqual(res.criaturaAliada?.resonancia, 0);
    assert.strictEqual(res.criaturaRival?.resonancia, 0);
    assert.deepStrictEqual(res.criaturaAliada?.estados, []);
    assert.deepStrictEqual(res.criaturaRival?.estados, []);

    // Slot 4 bloqueado (resonancia < 100) y slots 1-3 desbloqueados
    const movs = res.criaturaAliada?.movimientos ?? [];
    assert.strictEqual(movs[0].bloqueado, false);
    assert.strictEqual(movs[1].bloqueado, false);
    assert.strictEqual(movs[2].bloqueado, false);
    assert.strictEqual(movs[3].bloqueado, true);
  });

  it('reconstruye estados activos, bitácora de mensajes y desbloquea slot 4 con resonancia 100', async () => {
    const prismaMock: any = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-1',
          criaturas: [
            {
              id: 'cri-aliada-1',
              nivel: 6,
              ataque: 25,
              defensa: 20,
              velocidad: 16,
              hpActual: 35,
              hpMaximo: 60,
              experiencia: 250,
              enEquipo: true,
              ordenEquipo: 1,
              especie: {
                slug: 'lobo-bosque',
                nombre: 'Lobo del Bosque',
                elemento: 'planta',
                movimientos: [
                  { nombre: 'Arañazo', poder: 10, tipoAccion: 'ATAQUE', slot: 1, efecto: null },
                  { nombre: 'Liana', poder: 20, tipoAccion: 'ATAQUE', slot: 2, efecto: null },
                  { nombre: 'Esporas', poder: 0, tipoAccion: 'ESTADO', slot: 3, efecto: 'VENENO' },
                  { nombre: 'Furia de la Selva', poder: 60, tipoAccion: 'INSIGNIA', slot: 4, efecto: null },
                ],
              },
            },
          ],
        }),
      },
      encuentro: {
        findFirst: async () => ({
          id: 'enc-2',
          estado: 'EN_CURSO',
          criaturaRival: {
            id: 'cri-rival-1',
            nivel: 6,
            ataque: 22,
            defensa: 16,
            velocidad: 12,
            hpActual: 20,
            hpMaximo: 50,
            especie: {
              slug: 'salamandra-roca',
              nombre: 'Salamandra de Roca',
              elemento: 'tierra',
            },
          },
          combates: [
            {
              turno: 1,
              esTurnoJugador: true,
              detalleJson: {
                mensajes: ['¡Lobo del Bosque usó Liana causando 25 de daño!'],
                estadoBatalla: {
                  turno: 1,
                  aliada: {
                    criaturaId: 'cri-aliada-1',
                    estados: [],
                    inmunidades: [],
                    resonancia: 100, // Carga completa
                  },
                  rival: {
                    estados: [
                      { codigo: 'QUEMADURA', turnosRestantes: 2, valor: 6 },
                    ],
                    inmunidades: [],
                    resonancia: 40,
                  },
                },
              },
            },
          ],
        }),
      },
    };

    const servicio = new EncuentrosService(prismaMock);
    const res = await servicio.obtenerEncuentroActivo('usr-1');

    assert.strictEqual(res.turno, 2);
    assert.strictEqual(res.criaturaAliada?.resonancia, 100);
    assert.strictEqual(res.criaturaRival?.resonancia, 40);

    // Estados reflejados
    assert.strictEqual(res.criaturaRival?.estados.length, 1);
    assert.strictEqual(res.criaturaRival?.estados[0].codigo, 'QUEMADURA');

    // Slot 4 desbloqueado por resonancia >= 100
    const movs = res.criaturaAliada?.movimientos ?? [];
    assert.strictEqual(movs[3].bloqueado, false);

    // Bitácora enriquecida con los mensajes del combate previo
    assert.strictEqual(
      res.bitacora.includes('¡Lobo del Bosque usó Liana causando 25 de daño!'),
      true,
    );
  });
});
