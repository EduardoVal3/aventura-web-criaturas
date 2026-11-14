import test from "node:test";
import assert from "node:assert/strict";
import {
  SERVICIOS_HUB,
  estaServicioHabilitadoEnZona,
  formatearRangoFauna,
  evaluarRiesgoFauna,
  TOPOLOGIA_AETHELGARD,
  construirNodosMapaFallback,
} from "../src/lib/servicios-hub.ts";
import {
  obtenerImagenZona,
  sanitizarSlugZona,
  RUTAS_PLACEHOLDERS,
} from "../src/lib/assets.ts";

test("Los 8 servicios del Hub de localidad están configurados con rutas e iconos válidos", () => {
  assert.strictEqual(SERVICIOS_HUB.length, 8, "Debe contener exactamente 8 servicios");

  const rutasEsperadas = [
    "/exploracion",
    "/equipo",
    "/almacen",
    "/inventario",
    "/tienda",
    "/curacion",
    "/catalogo",
    "/historial",
  ];

  const rutasRegistradas = SERVICIOS_HUB.map((s) => s.ruta);
  for (const ruta of rutasEsperadas) {
    assert.ok(
      rutasRegistradas.includes(ruta),
      `El servicio para ${ruta} debe estar presente en el Hub`,
    );
  }

  // Verifica que ningún título o descripción esté vacío
  for (const servicio of SERVICIOS_HUB) {
    assert.ok(servicio.id.length > 0, "El ID del servicio no debe estar vacío");
    assert.ok(servicio.titulo.length > 0, "El título del servicio no debe estar vacío");
    assert.ok(servicio.descripcion.length > 0, "La descripción no debe estar vacía");
    assert.ok(servicio.icono.length > 0, "El icono debe estar definido");
  }
});

test("La habilitación de servicios responde a los servicios declarados por la zona", () => {
  const servicioExploracion = SERVICIOS_HUB.find((s) => s.id === "exploracion")!;
  const servicioCuracion = SERVICIOS_HUB.find((s) => s.id === "curacion")!;
  const servicioTienda = SERVICIOS_HUB.find((s) => s.id === "tienda")!;

  // Servicios globales (como exploración) siempre están disponibles
  assert.strictEqual(estaServicioHabilitadoEnZona(servicioExploracion, ["TIENDA"]), true);
  assert.strictEqual(estaServicioHabilitadoEnZona(servicioExploracion, []), true);
  assert.strictEqual(estaServicioHabilitadoEnZona(servicioExploracion, null), true);

  // Servicios con código de localidad responden a la lista
  const serviciosVillaSerena = ["CURACION", "ALMACEN", "HISTORIAL"];
  assert.strictEqual(estaServicioHabilitadoEnZona(servicioCuracion, serviciosVillaSerena), true);
  assert.strictEqual(estaServicioHabilitadoEnZona(servicioTienda, serviciosVillaSerena), false);
});

test("Sanitización de nombres de zonas y resolución de paisajes retro WebP con fallback", () => {
  // Conversión a kebab-case limpia acentos y caracteres especiales
  assert.strictEqual(sanitizarSlugZona("Villa Serena"), "villa-serena");
  assert.strictEqual(sanitizarSlugZona("Bastión del Norte"), "bastion-del-norte");
  assert.strictEqual(sanitizarSlugZona("Puesto Fronterizo del Río"), "puesto-fronterizo-del-rio");
  assert.strictEqual(sanitizarSlugZona(null), "zona");
  assert.strictEqual(sanitizarSlugZona(""), "zona");

  // Resolución de ruta WebP
  assert.strictEqual(obtenerImagenZona("villa-serena"), "/assets/zonas/villa-serena.webp");
  assert.strictEqual(obtenerImagenZona("bastion-del-norte"), "/assets/zonas/bastion-del-norte.webp");

  // Fallback seguro ante slug nulo o indefinido
  assert.strictEqual(obtenerImagenZona(null), RUTAS_PLACEHOLDERS.zona);
  assert.strictEqual(obtenerImagenZona(undefined), RUTAS_PLACEHOLDERS.zona);
});

test("Estructura de conexión de viaje valida destinos y estados de bloqueo", () => {
  interface ConexionPrueba {
    ubicacionDestinoId: string;
    nombre: string;
    nivelSugerido: string | null;
    estaBloqueada: boolean;
    requisito: string | null;
  }

  const conexionAccesible: ConexionPrueba = {
    ubicacionDestinoId: "ZON-01",
    nombre: "Praderas del Amanecer",
    nivelSugerido: "1-3",
    estaBloqueada: false,
    requisito: null,
  };

  const conexionBloqueada: ConexionPrueba = {
    ubicacionDestinoId: "LOC-03",
    nombre: "Bastión del Norte",
    nivelSugerido: "10-15",
    estaBloqueada: true,
    requisito: "Requiere nivel de gremio rango Oro",
  };

  assert.strictEqual(conexionAccesible.estaBloqueada, false);
  assert.strictEqual(conexionAccesible.nivelSugerido, "1-3");

  assert.strictEqual(conexionBloqueada.estaBloqueada, true);
  assert.ok(conexionBloqueada.requisito && conexionBloqueada.requisito.length > 0);
});

test("Regla R1: PantallaHubUbicacion.tsx no contiene emojis unicode", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");

  const regexEmoji = /\p{Extended_Pictographic}/u;
  const lineas = hubCodigo.split("\n");

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    assert.strictEqual(
      regexEmoji.test(linea),
      false,
      `Emoji unicode no permitido en línea ${i + 1} de PantallaHubUbicacion: "${linea.trim()}"`,
    );
  }
});

test("Hardening y Ergonomía: PantallaHubUbicacion cuenta con estética retro 8bitcn, aria-busy, hero 8-bit y modales sellados", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");

  // Hardening antirrebote y prevención de doble viaje
  assert.ok(
    hubCodigo.includes("aria-busy={viajando}"),
    "El botón de viaje debe declarar aria-busy={viajando}",
  );
  assert.ok(
    hubCodigo.includes("if (viajando) return;"),
    "handleViajar debe protegerse con guarda inmediata si ya está viajando",
  );
  assert.ok(
    hubCodigo.includes("disabled={viajando}"),
    "Los botones de acción de viaje deben deshabilitarse mientras viaja",
  );
  assert.ok(
    hubCodigo.includes("VIAJANDO..."),
    "El botón debe desplegar el estado retro 'VIAJANDO...' durante la mutación",
  );

  // Hero panorámico con marco 8-bit de alto contraste
  assert.ok(
    hubCodigo.includes("border-4 border-black shadow-[6px_6px_0_0_#000]"),
    "El hero del asentamiento debe utilizar el marco pixelado de 8bitcn",
  );

  // Panel táctil de métricas del aventurero
  assert.ok(
    hubCodigo.includes("border-2 border-black shadow-[4px_4px_0_0_#000]"),
    "Las cajas de métricas y servicios deben emplear el marco retro táctil con sombra pixelada",
  );

  // Modales de confirmación con marco retro de 8bitcn
  assert.ok(
    hubCodigo.includes("border-4 border-black shadow-[8px_8px_0_0_#000]"),
    "Los modales AlertDialog deben contar con el marco pixelado grueso de 8bitcn",
  );

  // Sellado contra desbordamiento horizontal
  assert.ok(
    hubCodigo.includes("w-[calc(100vw-2rem)]"),
    "Los modales deben acotarse al ancho de la ventana para prevenir desbordamiento en móviles",
  );
  assert.ok(
    hubCodigo.includes("pointer-events-none opacity-50"),
    "Los enlaces y botones secundarios deben protegerse durante la mutación de viaje",
  );
});


test("Auditoría Impeccable: Erradicación de truncamientos, modales retro-brutalistas 8-bit y espaciado de botones en PantallaHubUbicacion", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");

  // 1. Erradicación de truncamiento rígido en servicios
  assert.strictEqual(
    hubCodigo.includes("block truncate mb-1"),
    false,
    "Los títulos de servicios no deben contener la clase 'truncate'",
  );
  assert.ok(
    hubCodigo.includes("leading-tight break-words mb-1.5"),
    "Los títulos de servicios deben permitir dos líneas fluidas con break-words",
  );

  // 2. Modales de viaje con marco retro de consola RPG (8-bit box) y superficie de Bastión
  assert.ok(
    hubCodigo.includes("bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100"),
    "AlertDialogContent debe renderizarse como caja de diálogo 8-bit con superficie bg-bastion",
  );

  // 3. Ficha interior retro de destino
  assert.ok(
    hubCodigo.includes("border-2 border-black bg-black/60 p-3 space-y-1.5 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]"),
    "Los modales deben enmarcar el destino en una ficha interior de alto contraste",
  );

  // 4. Separación táctil y holgada en la botonera de los modales
  assert.ok(
    hubCodigo.includes("gap-3 sm:gap-4 w-full mt-4"),
    "AlertDialogFooter debe proporcionar un espaciado generoso entre botones",
  );
  assert.ok(
    hubCodigo.includes("EMPRENDER CAMINO"),
    "El botón de confirmación debe desplegar 'EMPRENDER CAMINO'",
  );
  assert.ok(
    hubCodigo.includes("PERMANECER"),
    "El botón secundario de cancelación debe desplegar 'PERMANECER'",
  );

  // 5. Separación clara en tarjetas/acciones de destino
  assert.ok(
    hubCodigo.includes("border-t-2 border-black"),
    "El modal de destino debe separar los requisitos con borde superior visible",
  );

  // 6. Confinamiento móvil sin overflow horizontal
  assert.ok(
    hubCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe incluir overflow-x-hidden para móviles estrechos",
  );
});

test("Subfase 10m: Desbloqueo territorial en PantallaHubUbicacion incluye api.verificarZona, DESBLOQUEAR SENDA y barra de progreso", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");

  // 1. Integración con el motor de desbloqueo autoritativo
  assert.ok(
    hubCodigo.includes("api.verificarZona"),
    "PantallaHubUbicacion debe invocar api.verificarZona para desbloquear sendas territoriales",
  );

  // 2. Botón táctil retro de desbloqueo y feedback de estado
  assert.ok(
    hubCodigo.includes("DESBLOQUEAR SENDA"),
    "Debe existir el botón o acción retro 'DESBLOQUEAR SENDA'",
  );
  assert.ok(
    hubCodigo.includes("LISTA PARA DESBLOQUEAR"),
    "Debe desplegar la insignia 'LISTA PARA DESBLOQUEAR' cuando cumple requisitos",
  );
  assert.ok(
    hubCodigo.includes("DESBLOQUEANDO..."),
    "Debe mostrar estado retro 'DESBLOQUEANDO...' durante la mutación de desbloqueo",
  );

  // 3. Barra de progreso de cartografía territorial con 8bitcn
  assert.ok(
    hubCodigo.includes("<Progress"),
    "Debe utilizar el componente Progress de 8bitcn para la cartografía territorial",
  );

  // 4. Hardening contra doble clic en desbloqueo
  assert.ok(
    hubCodigo.includes("desbloqueandoId"),
    "Debe gestionar el estado desbloqueandoId para hardening de concurrencia",
  );
  assert.ok(
    hubCodigo.includes("if (desbloqueandoId || viajando) return;"),
    "handleDesbloquearRuta debe protegerse contra ejecuciones simultáneas",
  );
});

test("Subfase 10n: formatearRangoFauna y evaluarRiesgoFauna distinguen asentamientos pacíficos y modulan riesgo táctico", () => {
  // Asentamientos pacíficos
  assert.strictEqual(
    formatearRangoFauna(null, null, null, true),
    "Asentamiento Pacífico (Sin Fauna Hostil)",
  );
  assert.strictEqual(
    formatearRangoFauna(null, null, "Rango libre", true),
    "Asentamiento Pacífico (Sin Fauna Hostil)",
  );

  // Zonas silvestres con fauna
  assert.strictEqual(
    formatearRangoFauna(1, 3, "1-3", false),
    "Fauna Salvaje: Nivel 1 - 3",
  );
  assert.strictEqual(
    formatearRangoFauna(5, 7, "5-7", false),
    "Fauna Salvaje: Nivel 5 - 7",
  );
  assert.strictEqual(
    formatearRangoFauna(null, null, "8-12", false),
    "Fauna Salvaje: Nivel 8-12",
  );

  // Evaluación de riesgo táctico
  const seguro = evaluarRiesgoFauna(5, null, null);
  assert.strictEqual(seguro.codigo, "PACIFICO");
  assert.strictEqual(seguro.etiqueta, "ZONA SEGURA");

  const controlado = evaluarRiesgoFauna(7, 3, 5);
  assert.strictEqual(controlado.codigo, "CONTROLADO");
  assert.strictEqual(controlado.etiqueta, "RIESGO CONTROLADO");

  const equilibrado = evaluarRiesgoFauna(4, 3, 5);
  assert.strictEqual(equilibrado.codigo, "EQUILIBRADO");
  assert.strictEqual(equilibrado.etiqueta, "DESAFÍO EQUILIBRADO");

  const peligroso = evaluarRiesgoFauna(2, 3, 5);
  assert.strictEqual(peligroso.codigo, "PELIGROSO");
  assert.strictEqual(peligroso.etiqueta, "PELIGRO ELEVADO");
});

test("Subfase 10n: TOPOLOGIA_AETHELGARD y construirNodosMapaFallback cubren los 9 nodos canónicos de Aethelgard", () => {
  assert.strictEqual(TOPOLOGIA_AETHELGARD.length, 9, "Deben existir exactamente 9 nodos canónicos");
  const idsEsperados = [
    "LOC-01",
    "ZON-01",
    "ZON-02",
    "LOC-02",
    "ZON-03",
    "ZON-04",
    "LOC-03",
    "ZON-05",
    "ZON-06",
  ];

  const idsPresentes = TOPOLOGIA_AETHELGARD.map((n) => n.id);
  assert.deepStrictEqual(idsPresentes, idsEsperados);

  // Fallback de nodos ante respuesta parcial de API
  const ubicacionMock = {
    ubicacionId: "LOC-02",
    nombre: "Puesto Fronterizo del Río",
    tipo: "LOCALIDAD" as const,
    esSegura: true,
    descripcion: "Cruce comercial ribereño.",
    servicios: ["TIENDA", "ALMACEN", "CURACION"],
    progresoZona: 100,
    conexiones: [
      {
        ubicacionDestinoId: "ZON-04",
        nombre: "Paso de los Riscos",
        nivelSugerido: "5-7",
        estaBloqueada: true,
        requisito: "Requisitos pendientes",
      },
    ],
  };

  const nodos = construirNodosMapaFallback(ubicacionMock as any);
  assert.strictEqual(nodos.length, 9);

  const loc02 = nodos.find((n) => n.id === "LOC-02")!;
  assert.ok(loc02);
  assert.strictEqual(loc02.esActual, true);
  assert.strictEqual(loc02.desbloqueada, true);

  const zon04 = nodos.find((n) => n.id === "ZON-04")!;
  assert.ok(zon04);
  assert.strictEqual(zon04.esActual, false);
  assert.strictEqual(zon04.esAdyacente, true);
  assert.strictEqual(zon04.desbloqueada, false);
});

test("Subfase 10n: Cumplimiento de Regla R1 (cero emojis) e inspección de orientación territorial y hábitat", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));

  const archivos = [
    join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"),
    join(__dirname, "../src/paginas/PantallaExploracion.tsx"),
    join(__dirname, "../src/components/mundo/BannerUbicacionActual.tsx"),
    join(__dirname, "../src/components/mundo/TarjetaSenderoConexion.tsx"),
    join(__dirname, "../src/components/mundo/MinimapaRedTerritorial.tsx"),
  ];

  const regexEmoji = /\p{Extended_Pictographic}/u;

  for (const archivo of archivos) {
    const contenido = readFileSync(archivo, "utf-8");
    const lineas = contenido.split("\n");

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      assert.strictEqual(
        regexEmoji.test(linea),
        false,
        `Emoji unicode no permitido en línea ${i + 1} de ${archivo}: "${linea.trim()}"`,
      );
    }
  }

  // Verificación semántica en PantallaHubUbicacion
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");
  assert.ok(hubCodigo.includes("MapaInteractivoCanvas"), "PantallaHubUbicacion debe renderizar MapaInteractivoCanvas");
  assert.ok(hubCodigo.includes("TransicionViaje2D"), "PantallaHubUbicacion debe renderizar TransicionViaje2D");
  assert.ok(hubCodigo.includes("formatearRangoFauna"), "PantallaHubUbicacion debe usar formatearRangoFauna");

  // Verificación semántica en PantallaExploracion
  const expCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaExploracion.tsx"), "utf-8");
  assert.ok(expCodigo.includes("FAUNA SALVAJE: NV."), "PantallaExploracion debe desplegar etiqueta clara 'FAUNA SALVAJE: NV.'");
  assert.ok(expCodigo.includes("EQUIPO: NV."), "PantallaExploracion debe contrastar con 'EQUIPO: NV.'");
  assert.ok(expCodigo.includes("especiesHabitantes"), "PantallaExploracion debe desplegar especiesHabitantes del hábitat");
  assert.ok(expCodigo.includes("MinimapaRedTerritorial"), "PantallaExploracion debe integrar MinimapaRedTerritorial");
});

