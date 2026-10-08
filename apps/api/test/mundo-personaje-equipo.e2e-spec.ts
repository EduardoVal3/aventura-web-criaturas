import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExcepcionesFilter } from '../src/comun/filtros/excepciones.filter';
import { PrismaService } from '../src/comun/prisma/prisma.service';

describe('Integración E2E: Mundo, Personaje y Equipo (Fase 5c)', () => {
  let app: INestApplication;
  let urlBase: string;
  let prisma: PrismaService;
  let tokenAcceso: string;
  let criaturaInicialId: string;
  let personajeId: string;

  const sufijo = Date.now().toString().slice(-6);
  const nombreUsuario = `explorador_${sufijo}`;
  const correo = `explorador_${sufijo}@test.com`;
  const clave = 'Password123!';

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
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
  });

  after(async () => {
    if (personajeId) {
      await prisma.historial.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.zonaDesbloqueada.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.inventarioPersonaje.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.criatura.deleteMany({ where: { personajeId } }).catch(() => {});
      await prisma.personaje.delete({ where: { id: personajeId } }).catch(() => {});
    }
    await prisma.usuario.deleteMany({ where: { correo } }).catch(() => {});
    await app.close();
  });

  it('Flujo 1: Registro de usuario nuevo e inicio de sesión', async () => {
    const resRegistro = await fetch(`${urlBase}/usuarios/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario, correo, clave }),
    });

    assert.strictEqual(resRegistro.status, 201, 'Registro debe responder 201');
    const datosRegistro = (await resRegistro.json()) as { tokenAcceso: string };
    assert.ok(datosRegistro.tokenAcceso, 'Debe devolver token de acceso');
    tokenAcceso = datosRegistro.tokenAcceso;
  });

  it('Flujo 2: Creación exitosa de personaje con especie inicial "lobo-gris"', async () => {
    const res = await fetch(`${urlBase}/personajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({
        nombre: 'ArturoFase5',
        especieInicialSlug: 'lobo-gris',
      }),
    });

    assert.strictEqual(res.status, 201, 'Creación de personaje debe responder 201');
    const datos = (await res.json()) as any;
    assert.ok(datos.personajeId);
    personajeId = datos.personajeId;
    assert.strictEqual(datos.monedas, 100);
    assert.strictEqual(datos.ubicacionActualId, 'LOC-01');
    assert.strictEqual(datos.criaturaInicial.especieSlug, 'lobo-gris');
    assert.strictEqual(datos.criaturaInicial.nivel, 1);
    assert.strictEqual(datos.criaturaInicial.hpActual, 30);
    criaturaInicialId = datos.criaturaInicial.criaturaId;
  });

  it('Flujo 3: Intento de crear un segundo personaje con el mismo usuario (409 PERSONAJE_YA_EXISTE)', async () => {
    const res = await fetch(`${urlBase}/personajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({
        nombre: 'ArturoSegundo',
        especieInicialSlug: 'lobo-gris',
      }),
    });

    assert.strictEqual(res.status, 409, 'Segundo personaje debe retornar 409');
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.error.codigo, 'PERSONAJE_YA_EXISTE');
  });

  it('Flujo 4: Consulta de equipo inicial (debe contener 1 criatura de nivel 1)', async () => {
    const res = await fetch(`${urlBase}/equipo`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenAcceso}` },
    });

    assert.strictEqual(res.status, 200);
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.criaturas.length, 1);
    assert.strictEqual(datos.criaturas[0].slug, 'lobo-gris');
    assert.strictEqual(datos.criaturas[0].nivel, 1);
    assert.strictEqual(datos.criaturas[0].orden, 1);
  });

  it('Flujo 5: Intento de mover criatura al almacén siendo la única del equipo (400 EQUIPO_MINIMO_REQUERIDO)', async () => {
    const res = await fetch(`${urlBase}/equipo/mover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({
        criaturaId: criaturaInicialId,
        haciaEquipo: false,
      }),
    });

    assert.strictEqual(res.status, 400, 'Enviar última criatura al almacén debe retornar 400');
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.error.codigo, 'EQUIPO_MINIMO_REQUERIDO');
  });

  it('Flujo 6: Movimiento válido desde LOC-01 hacia ZON-01 (200 OK)', async () => {
    const res = await fetch(`${urlBase}/mundo/viajar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({ destinoId: 'ZON-01' }),
    });

    assert.strictEqual(res.status, 200);
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.ubicacionActualId, 'ZON-01');
  });

  it('Flujo 7: Movimiento inválido desde ZON-01 hacia una zona no conectada ej. ZON-04 (400 CONEXION_INVALIDA)', async () => {
    const res = await fetch(`${urlBase}/mundo/viajar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({ destinoId: 'ZON-04' }),
    });

    assert.strictEqual(res.status, 400);
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.error.codigo, 'CONEXION_INVALIDA');
  });

  it('Flujo 8: Movimiento inválido hacia una zona bloqueada ej. ZON-04 desde LOC-02 (403 ZONA_BLOQUEADA)', async () => {
    // 1. Desplazarse de ZON-01 a LOC-02 (conectada y desbloqueada inicialmente)
    const resHaciaLoc02 = await fetch(`${urlBase}/mundo/viajar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({ destinoId: 'LOC-02' }),
    });
    assert.strictEqual(resHaciaLoc02.status, 200, 'Viaje a LOC-02 debe ser 200');

    // 2. Desde LOC-02 intentar viajar a ZON-04 (conectada topológicamente, pero bloqueada en ZonaDesbloqueada)
    const resHaciaZon04 = await fetch(`${urlBase}/mundo/viajar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({ destinoId: 'ZON-04' }),
    });

    assert.strictEqual(resHaciaZon04.status, 403, 'Viaje a zona bloqueada debe responder 403');
    const datos = (await resHaciaZon04.json()) as any;
    assert.strictEqual(datos.error.codigo, 'ZONA_BLOQUEADA');
  });

  it('Flujo 9: Validación de rechazo del 7mo miembro en el equipo con equipo lleno (409 EQUIPO_COMPLETO)', async () => {
    // Obtener especie para crear criaturas de prueba
    const especie = await prisma.especie.findFirstOrThrow({ where: { slug: 'lobo-gris' } });

    // Llenar el equipo hasta tener 6 criaturas (ya tenemos 1, creamos 5 en equipo)
    for (let i = 2; i <= 6; i++) {
      await prisma.criatura.create({
        data: {
          personajeId,
          especieId: especie.id,
          nivel: 1,
          hpActual: 30,
          hpMaximo: 30,
          ataque: 42,
          defensa: 58,
          velocidad: 50,
          enEquipo: true,
          ordenEquipo: i,
        },
      });
    }

    // Crear 1 criatura en almacén (enEquipo: false)
    const criaturaAlmacen = await prisma.criatura.create({
      data: {
        personajeId,
        especieId: especie.id,
        nivel: 1,
        hpActual: 30,
        hpMaximo: 30,
        ataque: 42,
        defensa: 58,
        velocidad: 50,
        enEquipo: false,
        ordenEquipo: null,
      },
    });

    // Intentar transferir la criatura al equipo lleno (estando en LOC-02 que es segura)
    const res = await fetch(`${urlBase}/equipo/mover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAcceso}`,
      },
      body: JSON.stringify({
        criaturaId: criaturaAlmacen.id,
        haciaEquipo: true,
      }),
    });

    assert.strictEqual(res.status, 409, 'Transferir con 6 en equipo debe responder 409');
    const datos = (await res.json()) as any;
    assert.strictEqual(datos.error.codigo, 'EQUIPO_COMPLETO');
  });
});
