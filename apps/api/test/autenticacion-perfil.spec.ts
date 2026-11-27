import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { AutenticacionService } from '../src/modulos/autenticacion/autenticacion.service';

describe('AutenticacionService.obtenerPerfil (arranque de sesión sin 404)', () => {
  it('devuelve tienePersonaje=false y personaje=null cuando la cuenta aún no tiene explorador', async () => {
    const prismaMock = {
      personaje: {
        findUnique: async () => null,
      },
    } as any;

    const servicio = new AutenticacionService(prismaMock, {} as any);
    const perfil = await servicio.obtenerPerfil({
      sub: 'usr-nuevo',
      nombreUsuario: 'nuevo_explorador',
      correo: 'nuevo@aethelgard.com',
    });

    assert.strictEqual(perfil.usuarioId, 'usr-nuevo');
    assert.strictEqual(perfil.nombreUsuario, 'nuevo_explorador');
    assert.strictEqual(perfil.tienePersonaje, false);
    assert.strictEqual(perfil.personaje, null);
  });

  it('devuelve tienePersonaje=true con resumen completo de equipo y almacén cuando existe personaje', async () => {
    const prismaMock = {
      personaje: {
        findUnique: async () => ({
          id: 'pj-1',
          nombre: 'Arturo',
          monedas: 250,
          ubicacionActualId: 'LOC-01',
          criaturas: [
            { enEquipo: true },
            { enEquipo: true },
            { enEquipo: false },
          ],
        }),
      },
    } as any;

    const servicio = new AutenticacionService(prismaMock, {} as any);
    const perfil = await servicio.obtenerPerfil({
      sub: 'usr-1',
      nombreUsuario: 'arturo_sendas',
      correo: 'arturo@aethelgard.com',
    });

    assert.strictEqual(perfil.tienePersonaje, true);
    assert.deepStrictEqual(perfil.personaje, {
      personajeId: 'pj-1',
      nombre: 'Arturo',
      monedas: 250,
      ubicacionActualId: 'LOC-01',
      totalCriaturasEquipo: 2,
      totalCriaturasAlmacen: 1,
    });
  });
});
