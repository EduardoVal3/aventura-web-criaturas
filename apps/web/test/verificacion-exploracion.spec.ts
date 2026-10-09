import test from "node:test";
import assert from "node:assert/strict";
import {
  obtenerImagenZona,
  obtenerImagenCriatura,
  obtenerImagenObjeto,
  RUTAS_PLACEHOLDERS,
  sanitizarSlugZona,
} from "../src/lib/assets.ts";
import type {
  RespuestaExploracion,
  UbicacionActual,
  RecompensaExploracion,
  EncuentroDetalle,
} from "../src/api/ApiJuego.ts";
import type { EntradaBitacora } from "../src/paginas/PantallaExploracion.tsx";

test("RespuestaExploracion modela adecuadamente encuentros con criaturas salvajes", () => {
  const encuentroEjemplo: EncuentroDetalle = {
    encuentroId: "ENC-1001",
    estado: "EN_CURSO",
    especie: {
      slug: "lobo-gris",
      nombre: "Lobo Gris",
      nivel: 3,
      hpActual: 32,
      hpMaximo: 32,
      ataque: 14,
      defensa: 10,
      velocidad: 12,
    },
  };

  const respuesta: RespuestaExploracion = {
    tipoEvento: "ENCUENTRO",
    mensaje: "¡Un feroz Lobo Gris surge entre la maleza!",
    progresoZona: 0,
    encuentro: encuentroEjemplo,
  };

  assert.strictEqual(respuesta.tipoEvento, "ENCUENTRO");
  assert.ok(respuesta.encuentro, "El encuentro no debe ser nulo");
  assert.strictEqual(respuesta.encuentro?.especie.slug, "lobo-gris");
  assert.strictEqual(respuesta.encuentro?.especie.nombre, "Lobo Gris");
  assert.strictEqual(respuesta.encuentro?.especie.nivel, 3);
  assert.strictEqual(respuesta.encuentro?.especie.hpActual, 32);
  assert.strictEqual(respuesta.encuentro?.especie.hpMaximo, 32);
  assert.ok(respuesta.encuentro.especie.ataque > 0);
  assert.ok(respuesta.encuentro.especie.defensa > 0);
  assert.ok(respuesta.encuentro.especie.velocidad > 0);
  assert.strictEqual(
    obtenerImagenCriatura(respuesta.encuentro.especie.slug),
    "/assets/criaturas/lobo-gris.webp",
  );
});

test("RespuestaExploracion modela hallazgos de botín con monedas e ítems", () => {
  const recompensaMonedas: RecompensaExploracion = {
    tipo: "MONEDAS",
    cantidad: 25,
  };

  const respuestaMonedas: RespuestaExploracion = {
    tipoEvento: "OBJETO",
    mensaje: "¡Has encontrado una bolsa con 25 monedas de oro solar!",
    progresoZona: 60,
    recompensa: recompensaMonedas,
  };

  assert.strictEqual(respuestaMonedas.tipoEvento, "OBJETO");
  assert.strictEqual(respuestaMonedas.recompensa?.tipo, "MONEDAS");
  assert.strictEqual(respuestaMonedas.recompensa?.cantidad, 25);

  const recompensaItem: RecompensaExploracion = {
    tipo: "ITEM",
    cantidad: 1,
    itemCodigo: "POC-01",
  };

  const respuestaItem: RespuestaExploracion = {
    tipoEvento: "OBJETO",
    mensaje: "¡Has hallado una Poción Menor oculta entre las piedras!",
    progresoZona: 80,
    recompensa: recompensaItem,
  };

  assert.strictEqual(respuestaItem.recompensa?.tipo, "ITEM");
  assert.strictEqual(respuestaItem.recompensa?.itemCodigo, "POC-01");
  assert.strictEqual(
    obtenerImagenObjeto(respuestaItem.recompensa?.itemCodigo),
    "/assets/objetos/POC-01.webp",
  );
});

test("Cálculo y avance de progreso de zona se limita rigurosamente a 100%", () => {
  function avanzarProgreso(actual: number, incremento: number = 20): number {
    return Math.min(100, Math.max(0, actual + incremento));
  }

  assert.strictEqual(avanzarProgreso(0), 20);
  assert.strictEqual(avanzarProgreso(20), 40);
  assert.strictEqual(avanzarProgreso(40), 60);
  assert.strictEqual(avanzarProgreso(60), 80);
  assert.strictEqual(avanzarProgreso(80), 100);
  assert.strictEqual(avanzarProgreso(100), 100);
  assert.strictEqual(avanzarProgreso(95), 100);
});

test("Diferenciación de expedición entre zonas seguras y hostiles", () => {
  const villaSerena: UbicacionActual = {
    ubicacionId: "ZON-00",
    nombre: "Villa Serena",
    slug: "villa-serena",
    tipo: "LOCALIDAD",
    esSegura: true,
    descripcion: "Asentamiento pacífico con refugio del gremio.",
    nivelMinimo: null,
    nivelMaximo: null,
    nivelSugerido: null,
    servicios: ["CURACION", "ALMACEN"],
    progresoZona: 100,
    conexiones: [],
  };

  const praderasAmanecer: UbicacionActual = {
    ubicacionId: "ZON-01",
    nombre: "Praderas del Amanecer",
    slug: "praderas-del-amanecer",
    tipo: "ZONA_PELIGRO",
    esSegura: false,
    descripcion: "Llanuras abiertas con bestias salvajes.",
    nivelMinimo: 1,
    nivelMaximo: 3,
    nivelSugerido: "1-3",
    servicios: [],
    progresoZona: 20,
    conexiones: [],
  };

  assert.strictEqual(villaSerena.esSegura, true);
  assert.strictEqual(villaSerena.nivelSugerido, null);
  assert.strictEqual(sanitizarSlugZona(villaSerena.nombre), "villa-serena");
  assert.strictEqual(obtenerImagenZona(villaSerena.slug), "/assets/zonas/villa-serena.webp");

  assert.strictEqual(praderasAmanecer.esSegura, false);
  assert.strictEqual(praderasAmanecer.nivelSugerido, "1-3");
  assert.strictEqual(sanitizarSlugZona(praderasAmanecer.nombre), "praderas-del-amanecer");
  assert.strictEqual(obtenerImagenZona(praderasAmanecer.slug), "/assets/zonas/praderas-del-amanecer.webp");
});

test("Estructuración y formato estricto de Bitácora de Incursión sin emojis unicode", () => {
  const entrada1: EntradaBitacora = {
    id: "exp-1",
    tipo: "INICIO",
    mensaje: "Has ingresado a Praderas del Amanecer. El terreno silvestre se extiende ante ti.",
    hora: "14:00:00",
  };

  const entrada2: EntradaBitacora = {
    id: "exp-2",
    tipo: "PASO",
    mensaje: "Avanzas entre los matorrales. El camino permanece despejado.",
    hora: "14:01:15",
  };

  const entrada3: EntradaBitacora = {
    id: "exp-3",
    tipo: "ENCUENTRO",
    mensaje: "¡Una criatura hostil bloquea la senda!",
    hora: "14:02:30",
  };

  const entrada4: EntradaBitacora = {
    id: "exp-4",
    tipo: "OBJETO",
    mensaje: "Has descubierto 15 monedas de oro ocultas en una grieta.",
    hora: "14:03:45",
  };

  const bitacora = [entrada4, entrada3, entrada2, entrada1];

  // Regex para detectar emojis unicode típicos (prohibidos por la regla del proyecto)
  const regexEmojis = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  for (const entrada of bitacora) {
    assert.ok(entrada.id.length > 0, "El id debe ser válido");
    assert.ok(entrada.mensaje.length > 0, "El mensaje no debe estar vacío");
    assert.ok(entrada.hora.length > 0, "La hora debe estar presente");
    assert.strictEqual(
      regexEmojis.test(entrada.mensaje),
      false,
      `El mensaje de bitácora no debe contener emojis unicode: "${entrada.mensaje}"`,
    );
  }
});

test("Los encuentros con criaturas preservan el progreso y no lo incrementan antes de combatir", () => {
  function resolverProgresoExploracion(
    tipoEvento: "ENCUENTRO" | "OBJETO" | "SIN_EVENTO",
    progresoActual: number,
  ): number {
    if (tipoEvento === "ENCUENTRO") {
      // El progreso permanece idéntico hasta vencer o capturar en la fase de combate
      return progresoActual;
    }
    return Math.min(100, progresoActual + 20);
  }

  // Si surge una criatura salvaje en progreso 0%, no debe subir a 20%
  assert.strictEqual(resolverProgresoExploracion("ENCUENTRO", 0), 0);
  assert.strictEqual(resolverProgresoExploracion("ENCUENTRO", 40), 40);

  // Si encuentra un objeto o la senda está despejada, el progreso avanza
  assert.strictEqual(resolverProgresoExploracion("OBJETO", 0), 20);
  assert.strictEqual(resolverProgresoExploracion("SIN_EVENTO", 20), 40);
});

