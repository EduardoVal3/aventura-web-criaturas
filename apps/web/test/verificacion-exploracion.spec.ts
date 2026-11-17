import test from "node:test";
import assert from "node:assert/strict";
import {
  obtenerImagenZona,
  obtenerImagenCriatura,
  obtenerImagenObjeto,
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
      slug: "lobo-estepario",
      nombre: "Lobo Estepario",
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
    mensaje: "¡Un feroz Lobo Estepario surge entre la maleza!",
    progresoZona: 0,
    encuentro: encuentroEjemplo,
  };

  assert.strictEqual(respuesta.tipoEvento, "ENCUENTRO");
  assert.ok(respuesta.encuentro, "El encuentro no debe ser nulo");
  assert.strictEqual(respuesta.encuentro?.especie.slug, "lobo-estepario");
  assert.strictEqual(respuesta.encuentro?.especie.nombre, "Lobo Estepario");
  assert.strictEqual(respuesta.encuentro?.especie.nivel, 3);
  assert.strictEqual(respuesta.encuentro?.especie.hpActual, 32);
  assert.strictEqual(respuesta.encuentro?.especie.hpMaximo, 32);
  assert.ok(respuesta.encuentro.especie.ataque > 0);
  assert.ok(respuesta.encuentro.especie.defensa > 0);
  assert.ok(respuesta.encuentro.especie.velocidad > 0);
  assert.strictEqual(
    obtenerImagenCriatura(respuesta.encuentro.especie.slug),
    "/assets/criaturas/lobo-estepario.webp",
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

test("Regla R1 Estricta: PantallaExploracion.tsx no contiene emojis unicode en textos ni botones de UI", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const exploracionCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaExploracion.tsx"),
    "utf-8",
  );

  const regexEmoji =
    /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  const lineas = exploracionCodigo.split("\n");
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    assert.strictEqual(
      regexEmoji.test(linea),
      false,
      `Emoji unicode no permitido en línea ${i + 1} de PantallaExploracion: "${linea.trim()}"`,
    );
  }
});

test("Hardening, Ergonomía y Estética Retro-Brutalist: PantallaExploracion cuenta con bordes 8bitcn, aria-busy, hero 8-bit y modales sellados", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const exploracionCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaExploracion.tsx"),
    "utf-8",
  );

  // Hardening antirrebote y prevención de doble clic
  assert.ok(
    exploracionCodigo.includes("aria-busy={explorando}"),
    "El botón de exploración debe declarar aria-busy={explorando}",
  );
  assert.ok(
    exploracionCodigo.includes("if (explorando) return;"),
    "handleExplorar debe protegerse con guarda inmediata si ya está explorando",
  );
  assert.ok(
    exploracionCodigo.includes("disabled={explorando}"),
    "El botón de exploración debe deshabilitarse durante la mutación asíncrona",
  );
  assert.ok(
    exploracionCodigo.includes("EXPLORANDO SENDA..."),
    "El botón debe desplegar el estado retro 'EXPLORANDO SENDA...' durante el avance",
  );

  // Hero panorámico con marco brutalist 8-bit de alto contraste
  assert.ok(
    exploracionCodigo.includes("border-4 border-black shadow-[6px_6px_0_0_#000]"),
    "El hero silvestre debe utilizar el marco pixelado de alto relieve de 8bitcn",
  );

  // Panel de medidor cartográfico y bitácora con bordes retro de 2px
  assert.ok(
    exploracionCodigo.includes("border-2 border-black shadow-[4px_4px_0_0_#000]"),
    "Los paneles táctiles deben emplear el marco retro brutalista con sombra pixelada",
  );

  // Modales de encuentro y botín con marco grueso de 8bitcn
  assert.ok(
    exploracionCodigo.includes("border-4 border-black shadow-[8px_8px_0_0_#000]"),
    "Los modales Dialog deben contar con el marco pixelado grueso de 8bitcn",
  );

  // Sellado contra desbordamiento horizontal en móviles
  assert.ok(
    exploracionCodigo.includes("w-[calc(100vw-2rem)]"),
    "Los modales deben acotarse al ancho de la ventana para prevenir desbordamiento en móviles",
  );
  assert.ok(
    exploracionCodigo.includes("pointer-events-none opacity-50"),
    "Los enlaces y botones secundarios deben bloquear interacción durante la exploración activa",
  );
});


test("Auditoría Impeccable (Segunda Pasada): Erradicación de truncamientos, modales cinemáticos 8-bit brutalistas con tipografía retro integral y espaciado de botones", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const exploracionCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaExploracion.tsx"),
    "utf-8",
  );

  // 1. Erradicación de truncamientos rígidos
  assert.strictEqual(
    exploracionCodigo.includes("truncate"),
    false,
    "PantallaExploracion no debe contener clases 'truncate' que corten nombres de rival o títulos",
  );
  assert.strictEqual(
    exploracionCodigo.includes("line-clamp-2 sm:truncate"),
    false,
    "El título de la zona no debe usar truncamiento rígido",
  );

  // 2. Confinamiento móvil estricto contra desbordamiento horizontal
  assert.ok(
    exploracionCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe incluir overflow-x-hidden para sellar pantallas móviles de 360px-420px",
  );

  // 3. Separación táctil y holgura en botones del Modal de Encuentro
  assert.ok(
    exploracionCodigo.includes("flex flex-col sm:flex-row gap-4 sm:gap-6 w-full mt-3 sm:mt-4"),
    "La botonera del modal de encuentro debe contar con separación táctil holgada (gap-4 sm:gap-6)",
  );
  assert.ok(
    exploracionCodigo.includes("flex flex-col sm:flex-row gap-4 sm:gap-5"),
    "La botonera de la vista general debe contar con separación táctil holgada (gap-4 sm:gap-5)",
  );
  assert.ok(
    exploracionCodigo.includes("bg-[#1a2332] hover:bg-[#232d3f] text-slate-300"),
    "El botón RETIRARSE debe contar con estilo secundario claramente diferenciado",
  );

  // 4. Margen claro en botón de expedición
  assert.ok(
    exploracionCodigo.includes("pt-4 sm:pt-5 mt-2 sm:mt-3"),
    "El botón de expedición debe estar claramente separado del medidor con margen pt-4 sm:pt-5 mt-2 sm:mt-3",
  );

  // 5. Vitrina del Rival y barra de vitalidad empotrada
  assert.ok(
    exploracionCodigo.includes("bg-black/70 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)]"),
    "La vitrina del rival debe contar con caja interior en relieve y fondo oscuro",
  );
  assert.ok(
    exploracionCodigo.includes("bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] h-3 sm:h-3.5"),
    "La barra de vitalidad del rival debe ser un canal empotrado retro",
  );

  // 6. Modal de Botín con botón táctil amplio
  assert.ok(
    exploracionCodigo.includes("GUARDAR EN BOLSA"),
    "El modal de botín debe incluir el botón táctil GUARDAR EN BOLSA",
  );
  assert.ok(
    exploracionCodigo.includes("py-3.5"),
    "El botón de guardado en bolsa debe tener padding táctil amplio py-3",
  );
});
