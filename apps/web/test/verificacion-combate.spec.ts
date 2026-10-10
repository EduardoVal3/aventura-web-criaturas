import test from "node:test";
import assert from "node:assert/strict";
import {
  obtenerImagenCriatura,
  obtenerImagenObjeto,
  RUTAS_PLACEHOLDERS,
  reproducirSonido,
} from "../src/lib/assets.ts";
import type {
  EncuentroActivo,
  RespuestaAtacar,
  RespuestaCapturar,
  ProgresoVictoria,
  CriaturaCombateAliada,
} from "../src/api/ApiJuego.ts";

test("EncuentroActivo recupera fielmente el estado, movimientos y bitácora en reanudación", () => {
  const aliada: CriaturaCombateAliada = {
    criaturaId: "criat-01",
    slug: "draco-fuego",
    nombre: "Ignis",
    nombreEspecie: "Draco de Fuego",
    nivel: 5,
    hpActual: 38,
    hpMaximo: 45,
    experiencia: 75,
    movimientos: [
      { nombre: "Llamarada", poder: 20, tipoAccion: "ATAQUE" },
      { nombre: "Arañazo Ígneo", poder: 14, tipoAccion: "ATAQUE" },
    ],
  };

  const encuentro: EncuentroActivo = {
    encuentroId: "enc-99",
    estado: "EN_CURSO",
    turno: 3,
    esTurnoJugador: true,
    criaturaRival: {
      slug: "lobo-gris",
      nombre: "Lobo Gris",
      nivel: 4,
      hpActual: 18,
      hpMaximo: 32,
    },
    criaturaAliada: aliada,
    bitacora: [
      "Turno 2: El rival respondió con Mordisco causando 7 de daño.",
      "Turno 2: Tu criatura usó Llamarada causando 14 de daño.",
      "Turno 1: ¡Un Lobo Gris salvaje (Nv. 4) está frente a ti!",
      "¡Tu aliada es Ignis (Nv. 5)!",
    ],
  };

  assert.strictEqual(encuentro.turno, 3);
  assert.strictEqual(encuentro.esTurnoJugador, true);
  assert.strictEqual(encuentro.criaturaAliada.slug, "draco-fuego");
  assert.strictEqual(encuentro.criaturaAliada.movimientos?.length, 2);
  assert.strictEqual(encuentro.criaturaAliada.movimientos?.[0].nombre, "Llamarada");
  assert.strictEqual(encuentro.criaturaRival.hpActual, 18);
  assert.strictEqual(encuentro.bitacora?.length, 4);
  assert.strictEqual(
    obtenerImagenCriatura(encuentro.criaturaRival.slug),
    "/assets/criaturas/lobo-gris.webp",
  );
  assert.strictEqual(
    obtenerImagenCriatura(encuentro.criaturaAliada.slug),
    "/assets/criaturas/draco-fuego.webp",
  );
});

test("RespuestaAtacar modela victoria con desglose enriquecido de XP, nivel y monedas", () => {
  const progreso: ProgresoVictoria = {
    xpGanada: 45,
    monedasGanadas: 60,
    subioNivel: true,
    nivelAnterior: 4,
    nivelNuevo: 5,
    saldoMonedas: 240,
  };

  const respuesta: RespuestaAtacar = {
    encuentroId: "enc-99",
    estado: "VICTORIA",
    turno: 3,
    accionJugador: {
      movimiento: "Llamarada",
      danoCausado: 22,
      hpRestanteRival: 0,
    },
    accionRival: null,
    resultadoFinal: "VICTORIA",
    progreso,
  };

  assert.strictEqual(respuesta.estado, "VICTORIA");
  assert.ok(respuesta.progreso);
  assert.strictEqual(respuesta.progreso.xpGanada, 45);
  assert.strictEqual(respuesta.progreso.monedasGanadas, 60);
  assert.strictEqual(respuesta.progreso.subioNivel, true);
  assert.strictEqual(respuesta.progreso.nivelNuevo, 5);
  assert.strictEqual(respuesta.accionJugador.hpRestanteRival, 0);
});

test("RespuestaCapturar modela desenlaces probabilísticos de éxito y contraataque rival", () => {
  const capturaExitosa: RespuestaCapturar = {
    exito: true,
    mensaje: "¡Captura exitosa! Lobo Gris ha sido incorporado a tu equipo.",
    encuentroId: "enc-99",
    estado: "CAPTURADO",
    destinoCaptura: "EQUIPO",
    criaturaCapturada: {
      criaturaId: "criat-capt-01",
      nombre: "Lobo Gris",
      nivel: 4,
      hpActual: 18,
      hpMaximo: 32,
    },
  };

  assert.strictEqual(capturaExitosa.exito, true);
  assert.strictEqual(capturaExitosa.estado, "CAPTURADO");
  assert.strictEqual(capturaExitosa.destinoCaptura, "EQUIPO");
  assert.strictEqual(capturaExitosa.criaturaCapturada?.hpActual, 18);

  const capturaFallida: RespuestaCapturar = {
    exito: false,
    mensaje: "La criatura se resistió a la captura.",
    encuentroId: "enc-99",
    estado: "EN_CURSO",
    contraataqueRival: {
      movimiento: "Embestida",
      danoCausado: 8,
      hpRestanteAliado: 30,
    },
  };

  assert.strictEqual(capturaFallida.exito, false);
  assert.strictEqual(capturaFallida.estado, "EN_CURSO");
  assert.ok(capturaFallida.contraataqueRival);
  assert.strictEqual(capturaFallida.contraataqueRival?.danoCausado, 8);
  assert.strictEqual(capturaFallida.contraataqueRival?.hpRestanteAliado, 30);
});

test("Audio y multimedia retro degradan limpiamente y resuelven rutas correctas", () => {
  assert.strictEqual(obtenerImagenCriatura(null), RUTAS_PLACEHOLDERS.criatura);
  assert.strictEqual(obtenerImagenObjeto(null), RUTAS_PLACEHOLDERS.objeto);
  assert.strictEqual(
    obtenerImagenObjeto("talisman-basico"),
    "/assets/objetos/talisman-basico.webp",
  );

  // reproducirSonido tolera entornos sin audio sin lanzar excepciones
  assert.doesNotThrow(() => {
    reproducirSonido("golpe", 0.5);
    reproducirSonido("captura", 0.5);
    reproducirSonido("victoria", 0.5);
  });
});
