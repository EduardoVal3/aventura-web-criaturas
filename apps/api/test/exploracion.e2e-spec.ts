import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExcepcionesFilter } from '../src/comun/filtros/excepciones.filter';
import { PrismaService } from '../src/comun/prisma/prisma.service';

describe('Exploración, Encuentros e Historial (E2E)', () => {
  let app: INestApplication;
  let urlBase: string;
  let prisma: PrismaService;
  let tokenJwt: string;
  let usuarioId: string;
  let personajeId: string;

  const sufijo = Date.now().toString().slice(-6);
  const nombreUsuario = `explorador_${sufijo}`;
  const correo = `explorador_${sufijo}@aethelgard.com`;
  const contrasena = 'Aventura2026*';

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ExcepcionesFilter());

    await app.listen(0);
    const servidor = app.getHttpServer();
    const direccion = servidor.address();
    const puerto = typeof direccion === 'object' && direccion ? direccion.port : 3000;
    urlBase = `http://localhost:${puerto}/api`;

    prisma = app.get(PrismaService);

    // Crear usuario y personaje de prueba
    const resRegistro = await fetch(`${urlBase}/usuarios/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario,
        correo,
        clave: contrasena,
      }),
    });
    assert.strictEqual(resRegistro.status, 201, 'Registro debe responder 201');
    const datosRegistro = (await resRegistro.json()) as any;
    tokenJwt = datosRegistro.tokenAcceso;
    usuarioId = datosRegistro.usuarioId;

    const resPersonaje = await fetch(`${urlBase}/personajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJwt}`,
      },
      body: JSON.stringify({
        nombre: 'Caminante',
        especieInicialSlug: 'lobo-gris',
      }),
    });
    assert.strictEqual(resPersonaje.status, 201, 'Creación de personaje debe responder 201');
    const datosPersonaje = (await resPersonaje.json()) as any;
    personajeId = datosPersonaje.personajeId;
  });

  after(async () => {
    // Limpieza de datos creados en el test
    if (personajeId) {
      await prisma.historial.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.encuentro.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.criatura.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.inventarioPersonaje.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.zonaDesbloqueada.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.personaje.deleteMany({ where: { id: personajeId } }).catch(() => {});
    }
    if (usuarioId) {
      await prisma.usuario.deleteMany({ where: { id: usuarioId } }).catch(() => {});
    }
    await app.close();
  });

  it('debe rechazar exploración en localidad segura (LOC-01) con 403 ZONA_NO_EXPLORABLE', async () => {
    // El personaje inicia en LOC-01
    const res = await fetch(`${urlBase}/exploracion/explorar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenJwt}` },
    });
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error?.codigo, 'ZONA_NO_EXPLORABLE');
  });

  it('debe permitir explorar tras desplazarse a zona silvestre ZON-01', async () => {
    // Viajar a ZON-01
    const resViaje = await fetch(`${urlBase}/mundo/viajar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJwt}`,
      },
      body: JSON.stringify({ destinoId: 'ZON-01' }),
    });
    assert.strictEqual(resViaje.status, 200);

    // Explorar
    const resExploracion = await fetch(`${urlBase}/exploracion/explorar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenJwt}` },
    });
    assert.strictEqual(resExploracion.status, 200);
    const datosExp = (await resExploracion.json()) as any;

    assert.ok(['ENCUENTRO', 'OBJETO', 'SIN_EVENTO'].includes(datosExp.tipoEvento));

    if (datosExp.tipoEvento === 'ENCUENTRO') {
      assert.ok(datosExp.encuentro);
      assert.strictEqual(datosExp.encuentro.estado, 'EN_CURSO');

      // Comprobar que no permite explorar nuevamente si hay combate activo
      const resConflicto = await fetch(`${urlBase}/exploracion/explorar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenJwt}` },
      });
      assert.strictEqual(resConflicto.status, 409);
      const datosConflicto = (await resConflicto.json()) as any;
      assert.strictEqual(datosConflicto.error?.codigo, 'ENCUENTRO_PREVIO_ACTIVO');

      // Consultar encuentro activo en /api/encuentros/activo
      const resEncuentroActivo = await fetch(`${urlBase}/encuentros/activo`, {
        headers: { Authorization: `Bearer ${tokenJwt}` },
      });
      assert.strictEqual(resEncuentroActivo.status, 200);
      const datosEncuentro = (await resEncuentroActivo.json()) as any;
      assert.strictEqual(datosEncuentro.encuentroId, datosExp.encuentro.encuentroId);
      assert.ok(datosEncuentro.criaturaRival);
    }
  });

  it('debe reflejar eventos registrados en el endpoint paginado GET /api/historial', async () => {
    const resHistorial = await fetch(`${urlBase}/historial?pagina=1&limite=10`, {
      headers: { Authorization: `Bearer ${tokenJwt}` },
    });
    assert.strictEqual(resHistorial.status, 200);
    const datosHistorial = (await resHistorial.json()) as any;
    assert.ok(datosHistorial.eventos);
    assert.ok(datosHistorial.eventos.length > 0);
    assert.ok(datosHistorial.eventos[0].marcaTiempo);
  });
});
