import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExcepcionesFilter } from '../src/comun/filtros/excepciones.filter';
import { PrismaService } from '../src/comun/prisma/prisma.service';

describe('Batería de seguridad S-1 a S-7 (E2E)', () => {
  let app: INestApplication;
  let urlBase: string;
  let prisma: PrismaService;

  let tokenUsuarioA: string;
  let usuarioAId: string;
  let personajeAId: string;

  let tokenUsuarioB: string;
  let usuarioBId: string;
  let personajeBId: string;

  let encuentroIdA: string;

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

    const ts = Date.now().toString().slice(-6);

    // Registro Usuario A
    const resRegA = await fetch(`${urlBase}/usuarios/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario: `seg_usrA_${ts}`,
        correo: `seg_usrA_${ts}@aethelgard.com`,
        clave: 'ClaveSegura2026A*',
      }),
    });
    assert.strictEqual(resRegA.status, 201);
    const datosRegA = (await resRegA.json()) as any;
    tokenUsuarioA = datosRegA.tokenAcceso;
    usuarioAId = datosRegA.usuarioId;

    const resPjA = await fetch(`${urlBase}/personajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUsuarioA}`,
      },
      body: JSON.stringify({
        nombre: `HeroeA_${ts}`,
        especieInicialSlug: 'lobo-gris',
      }),
    });
    assert.strictEqual(resPjA.status, 201);
    const datosPjA = (await resPjA.json()) as any;
    personajeAId = datosPjA.personajeId;

    // Registro Usuario B
    const resRegB = await fetch(`${urlBase}/usuarios/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario: `seg_usrB_${ts}`,
        correo: `seg_usrB_${ts}@aethelgard.com`,
        clave: 'ClaveSegura2026B*',
      }),
    });
    assert.strictEqual(resRegB.status, 201);
    const datosRegB = (await resRegB.json()) as any;
    tokenUsuarioB = datosRegB.tokenAcceso;
    usuarioBId = datosRegB.usuarioId;

    const resPjB = await fetch(`${urlBase}/personajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUsuarioB}`,
      },
      body: JSON.stringify({
        nombre: `HeroeB_${ts}`,
        especieInicialSlug: 'lobo-gris',
      }),
    });
    assert.strictEqual(resPjB.status, 201);
    const datosPjB = (await resPjB.json()) as any;
    personajeBId = datosPjB.personajeId;

    // Crear encuentro activo para Usuario A
    const especieLobo = await prisma.especie.findFirstOrThrow({
      where: { slug: 'lobo-gris' },
    });

    const criaturaRival = await prisma.criatura.create({
      data: {
        personajeId: null,
        especieId: especieLobo.id,
        nivel: 2,
        hpActual: 30,
        hpMaximo: 30,
        ataque: 40,
        defensa: 40,
        velocidad: 40,
      },
    });

    const encuentro = await prisma.encuentro.create({
      data: {
        personajeId: personajeAId,
        zonaId: 'ZON-01',
        criaturaRivalId: criaturaRival.id,
        estado: 'EN_CURSO',
      },
    });
    encuentroIdA = encuentro.id;
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Tokens y Autenticación (Sin Token / Token Inválido)', () => {
    it('debe rechazar GET /api/personajes/activo sin cabecera Authorization con 401', async () => {
      const res = await fetch(`${urlBase}/personajes/activo`);
      assert.strictEqual(res.status, 401);
    });

    it('debe rechazar POST /api/combate/atacar con token JWT malformado con 401', async () => {
      const res = await fetch(`${urlBase}/combate/atacar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token_invalido_malformado',
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          movimientoIndice: 0,
        }),
      });
      assert.strictEqual(res.status, 401);
    });
  });

  describe('S-1: Aislamiento estricto de recursos y personajes', () => {
    it('debe rechazar con 403 cuando Usuario B intenta atacar en el encuentro de Usuario A', async () => {
      const res = await fetch(`${urlBase}/combate/atacar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioB}`,
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          movimientoIndice: 0,
        }),
      });
      assert.strictEqual(res.status, 403);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'ENCUENTRO_NO_AUTORIZADO');
    });

    it('debe rechazar con 403 cuando Usuario B intenta capturar en el encuentro de Usuario A', async () => {
      const res = await fetch(`${urlBase}/combate/capturar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioB}`,
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          itemCodigo: 'talisman-basico',
        }),
      });
      assert.strictEqual(res.status, 403);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'ENCUENTRO_NO_AUTORIZADO');
    });

    it('debe aislar los datos del personaje activo según el JWT (sub)', async () => {
      const resA = await fetch(`${urlBase}/personajes/activo`, {
        headers: { Authorization: `Bearer ${tokenUsuarioA}` },
      });
      const datosA = (await resA.json()) as any;
      assert.strictEqual(datosA.personajeId, personajeAId);

      const resB = await fetch(`${urlBase}/personajes/activo`, {
        headers: { Authorization: `Bearer ${tokenUsuarioB}` },
      });
      const datosB = (await resB.json()) as any;
      assert.strictEqual(datosB.personajeId, personajeBId);
      assert.notStrictEqual(datosA.personajeId, datosB.personajeId);
    });
  });

  describe('S-2: Restricción territorial estricta (grafo y zonas)', () => {
    it('debe rechazar viaje a una zona inexistente ZON-99 con 400', async () => {
      const res = await fetch(`${urlBase}/mundo/viajar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          destinoId: 'ZON-99',
        }),
      });
      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'CONEXION_INVALIDA');
    });

    it('debe rechazar viaje hacia una zona no conectada directamente con 400', async () => {
      // LOC-01 conecta a ZON-01 y ZON-02, pero no a ZON-05
      const res = await fetch(`${urlBase}/mundo/viajar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          destinoId: 'ZON-05',
        }),
      });
      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'CONEXION_INVALIDA');
    });
  });

  describe('S-3: Restricción de captura sin encuentro activo', () => {
    it('debe rechazar intento de captura con ID de encuentro inexistente con 404', async () => {
      const res = await fetch(`${urlBase}/combate/capturar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          encuentroId: '00000000-0000-0000-0000-000000000000',
          itemCodigo: 'talisman-basico',
        }),
      });
      assert.strictEqual(res.status, 404);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'ENCUENTRO_NO_ENCONTRADO');
    });
  });

  describe('S-4: Validación de inventario consumible', () => {
    it('debe rechazar uso de talismán no poseído en el inventario con 400 ITEM_NO_DISPONIBLE', async () => {
      // Aseguramos que Usuario A no posea 'talisman-avanzado'
      const talismanAvanzado = await prisma.objeto.findUnique({
        where: { codigo: 'talisman-avanzado' },
      });
      if (talismanAvanzado) {
        await prisma.inventarioPersonaje.deleteMany({
          where: {
            personajeId: personajeAId,
            objetoId: talismanAvanzado.id,
          },
        });
      }

      const res = await fetch(`${urlBase}/combate/capturar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          itemCodigo: 'talisman-avanzado',
        }),
      });
      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'ITEM_NO_DISPONIBLE');
    });
  });

  describe('S-5: Validación de estado de combate (combate resuelto)', () => {
    it('debe rechazar ataque en un encuentro resuelto con 400 ENCUENTRO_NO_ACTIVO', async () => {
      // Marcamos el encuentro como resuelto (VICTORIA)
      await prisma.encuentro.update({
        where: { id: encuentroIdA },
        data: { estado: 'VICTORIA', fechaResolucion: new Date() },
      });

      const res = await fetch(`${urlBase}/combate/atacar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          movimientoIndice: 0,
        }),
      });
      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      const codigoError = json.error?.codigo ?? json.codigo;
      assert.strictEqual(codigoError, 'ENCUENTRO_NO_ACTIVO');
    });
  });

  describe('S-6: Inmunidad ante manipulación de payloads (whitelist & forbidNonWhitelisted)', () => {
    it('debe rechazar campos arbitrarios inyectados en POST /api/personajes con 400 Bad Request', async () => {
      const ts = Date.now().toString().slice(-6);
      const resRegC = await fetch(`${urlBase}/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreUsuario: `seg_usrC_${ts}`,
          correo: `seg_usrC_${ts}@aethelgard.com`,
          clave: 'ClaveSegura2026C*',
        }),
      });
      const datosRegC = (await resRegC.json()) as any;
      const tokenC = datosRegC.tokenAcceso;

      const resInyeccion = await fetch(`${urlBase}/personajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenC}`,
        },
        body: JSON.stringify({
          nombre: 'Hacker',
          especieInicialSlug: 'lobo-gris',
          monedas: 999999, // Campo prohibido
          nivel: 99, // Campo prohibido
          experiencia: 50000, // Campo prohibido
        }),
      });

      assert.strictEqual(resInyeccion.status, 400);
      const json = (await resInyeccion.json()) as any;
      const mensajeTexto = JSON.stringify(json);
      assert.strictEqual(
        mensajeTexto.includes('monedas') ||
          mensajeTexto.includes('nivel') ||
          mensajeTexto.includes('should not exist'),
        true,
      );
    });

    it('debe rechazar campos arbitrarios inyectados en POST /api/combate/atacar con 400 Bad Request', async () => {
      const res = await fetch(`${urlBase}/combate/atacar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUsuarioA}`,
        },
        body: JSON.stringify({
          encuentroId: encuentroIdA,
          movimientoIndice: 0,
          danoCausado: 9999, // Campo inyectado arbitrario
        }),
      });

      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      const mensajeTexto = JSON.stringify(json);
      assert.strictEqual(
        mensajeTexto.includes('danoCausado') || mensajeTexto.includes('should not exist'),
        true,
      );
    });
  });
});
