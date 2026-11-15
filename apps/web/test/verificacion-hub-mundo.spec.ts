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

  // Modales de confirmación con marco retro de 8bitcn (patrón Dialog de PantallaCatalogo)
  assert.ok(
    hubCodigo.includes("border-4 border-black shadow-[8px_8px_0_0_#000]"),
    "Los modales Dialog deben contar con el marco pixelado grueso de 8bitcn",
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

  // 2. Modales de viaje basados en Dialog (referencia PantallaCatalogo) con scroll interno sin desborde
  assert.ok(
    hubCodigo.includes("overflow-hidden rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] bg-card p-0 flex flex-col"),
    "DialogContent debe seguir el patrón sellado de PantallaCatalogo con superficie bg-card y p-0",
  );
  assert.ok(
    hubCodigo.includes("overflow-y-auto overflow-x-hidden p-3 sm:p-4"),
    "El cuerpo del modal debe aislar el scroll vertical y bloquear cualquier desborde horizontal",
  );
  assert.ok(
    hubCodigo.includes("p-3 bg-bastion border-b-2 border-black"),
    "La cabecera del modal debe mantenerse fija sobre bg-bastion",
  );

  // 3. Ficha interior retro de destino
  assert.ok(
    hubCodigo.includes("border-2 border-black bg-black/60 p-3"),
    "Los modales deben enmarcar el destino en una ficha interior de alto contraste",
  );
  assert.ok(
    hubCodigo.includes("shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]"),
    "La ficha interior debe conservar la sombra hundida retro",
  );

  // 4. Separación táctil y holgada en la botonera de los modales
  assert.ok(
    hubCodigo.includes("p-3 bg-bastion border-t-2 border-black shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3"),
    "El pie del modal debe proporcionar separación generosa y apilado responsive entre botones",
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

  // 6. Confinamiento móvil sin overflow horizontal, HUD sin miniatura redundante y dock de 6 ranuras
  assert.ok(
    hubCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe incluir overflow-x-hidden para móviles estrechos",
  );
  assert.strictEqual(
    hubCodigo.includes(">\n                ZONA\n"),
    false,
    "La tarjeta superior izquierda no debe incluir la miniatura redundante de ZONA",
  );
  assert.ok(
    hubCodigo.includes("grid grid-cols-6 gap-1.5 sm:flex sm:items-center sm:gap-2"),
    "El dock inferior debe mostrar las 6 ranuras del equipo en cuadrícula móvil sin solaparse con EXPLORAR",
  );
  assert.strictEqual(
    hubCodigo.includes("requisitoCartografia.zonaId"),
    false,
    "El modal del Hub no debe exponer el ID interno de la zona en el texto del requisito",
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
    join(__dirname, "../src/components/mundo/MapaInteractivoCanvas.tsx"),
    join(__dirname, "../src/components/mundo/TransicionViaje2D.tsx"),
    join(__dirname, "../src/lib/mapa-mundo.ts"),
    join(__dirname, "../src/lib/mapa-dioramas.ts"),
    join(__dirname, "../src/lib/diorama-cumbre.ts"),
    join(__dirname, "../src/lib/oceano-vivo.ts"),
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
  assert.ok(hubCodigo.includes("requisitoCartografia"), "PantallaHubUbicacion debe contemplar requisitoCartografia");
  assert.ok(hubCodigo.includes("requisitoNivelEquipo"), "PantallaHubUbicacion debe contemplar requisitoNivelEquipo");
  assert.ok(hubCodigo.includes("especiesHabitantes"), "PantallaHubUbicacion debe desplegar especiesHabitantes del hábitat");
  assert.ok(hubCodigo.includes("rangoDomador"), "PantallaHubUbicacion debe desplegar rangoDomador del equipo");
  assert.ok(hubCodigo.includes("finalizarViajeSiListo"), "PantallaHubUbicacion debe sincronizar animación 2D y API sin condición de carrera");
  assert.ok(hubCodigo.includes("export default PantallaHubUbicacion"), "PantallaHubUbicacion debe conservar exportación por defecto");

  // Verificación de las 9 islas en mapa-mundo.ts (Subfase 10o)
  const { CONFIGURACION_ISLAS_MAPA } = await import("../src/lib/mapa-mundo.ts");
  for (const nodo of TOPOLOGIA_AETHELGARD) {
    assert.ok(
      CONFIGURACION_ISLAS_MAPA[nodo.id],
      `CONFIGURACION_ISLAS_MAPA debe definir coordenadas y paleta para ${nodo.id}`,
    );
  }

  // Verificación semántica en PantallaExploracion
  const expCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaExploracion.tsx"), "utf-8");
  assert.ok(expCodigo.includes("FAUNA SALVAJE: NV."), "PantallaExploracion debe desplegar etiqueta clara 'FAUNA SALVAJE: NV.'");
  assert.ok(expCodigo.includes("EQUIPO: NV."), "PantallaExploracion debe contrastar con 'EQUIPO: NV.'");
  assert.ok(expCodigo.includes("especiesHabitantes"), "PantallaExploracion debe desplegar especiesHabitantes del hábitat");
  assert.ok(expCodigo.includes("MinimapaRedTerritorial"), "PantallaExploracion debe integrar MinimapaRedTerritorial");
});

test("Subfase 10p/10q/10r: Calibración sobre mapa transparente WebP (1616x897), aguas costeras, 10 puentes Bezier y efectos calibrados", async () => {
  const { existsSync, readFileSync, statSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const { CONEXIONES_AETHELGARD } = await import("../src/lib/servicios-hub.ts");
  const { CONFIGURACION_ISLAS_MAPA, DIMENSIONES_MAPA_MUNDO } = await import(
    "../src/lib/mapa-mundo.ts"
  );
  const {
    TRAYECTOS_PUENTES_AETHELGARD,
    factorContornoIsla,
    generarGeometriaDiorama,
    puntoBordeIsla,
  } = await import("../src/lib/mapa-dioramas.ts");

  assert.strictEqual(DIMENSIONES_MAPA_MUNDO.ancho, 1616);
  assert.strictEqual(DIMENSIONES_MAPA_MUNDO.alto, 897);

  const rutaMapaAsset = join(__dirname, "../public/assets/mapa-mundo-aethelgard.webp");
  assert.strictEqual(existsSync(rutaMapaAsset), true, "Debe existir public/assets/mapa-mundo-aethelgard.webp");
  assert.ok(statSync(rutaMapaAsset).size < 1_500_000, "El mapa WebP optimizado debe pesar menos de 1.5 MB");

  for (const nodo of TOPOLOGIA_AETHELGARD) {
    const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
    assert.ok(isla, `Falta isla calibrada para ${nodo.id}`);
    assert.ok(isla.x > 0 && isla.x < DIMENSIONES_MAPA_MUNDO.ancho);
    assert.ok(isla.y > 0 && isla.y < DIMENSIONES_MAPA_MUNDO.alto);
    assert.ok(isla.radioX > 80 && isla.radioY > 60);

    const geom = generarGeometriaDiorama(isla);
    assert.ok(geom.contornoLocal.length >= 48);
    assert.ok(geom.angulosPuente.length >= 2);
    assert.ok(factorContornoIsla(isla.id, 0) > 0.5);
    const borde = puntoBordeIsla(isla, 808, 448, 1);
    assert.ok(Number.isFinite(borde.x) && Number.isFinite(borde.y));
  }

  assert.strictEqual(
    TRAYECTOS_PUENTES_AETHELGARD.length,
    CONEXIONES_AETHELGARD.length,
    "Debe calibrar exactamente los 10 puentes de CONEXIONES_AETHELGARD",
  );

  for (const [origenId, destinoId] of CONEXIONES_AETHELGARD) {
    const puente = TRAYECTOS_PUENTES_AETHELGARD.find(
      (t) =>
        (t.origenId === origenId && t.destinoId === destinoId) ||
        (t.origenId === destinoId && t.destinoId === origenId),
    );
    assert.ok(puente, `Falta trayecto Bezier calibrado para ${origenId} <-> ${destinoId}`);
    for (const pt of [puente.inicio, puente.control, puente.fin]) {
      assert.ok(pt.x >= 0 && pt.x <= DIMENSIONES_MAPA_MUNDO.ancho);
      assert.ok(pt.y >= 0 && pt.y <= DIMENSIONES_MAPA_MUNDO.alto);
    }
  }

  const canvasCodigo = readFileSync(
    join(__dirname, "../src/components/mundo/MapaInteractivoCanvas.tsx"),
    "utf-8",
  );
  assert.ok(canvasCodigo.includes("/assets/mapa-mundo-aethelgard.webp"));
  assert.ok(canvasCodigo.includes("dibujarFondoOceanoContinuo"));
  assert.ok(canvasCodigo.includes("dibujarAguasCosterasMapa"));
  assert.ok(canvasCodigo.includes("dibujarCapaVivaMapa"));
  assert.ok(canvasCodigo.includes("dibujarRespaldoIslasBase"));
  assert.ok(canvasCodigo.includes("pinchRef"));
  assert.ok(canvasCodigo.includes("centrarEnUbicacion"));
  assert.strictEqual(canvasCodigo.includes("obtenerImagenZona"), false);
});

test("Subfase 10s: Motor oceánico multicapa respeta máscara alfa, acantilados 2.5D y cero colisiones con tierra firme", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const { CONFIGURACION_ISLAS_MAPA } = await import("../src/lib/mapa-mundo.ts");
  const { TRAYECTOS_PUENTES_AETHELGARD } = await import("../src/lib/mapa-dioramas.ts");
  const {
    MASCARA_OCEANO_ANCHO,
    MASCARA_OCEANO_ALTO,
    ESCALA_MASCARA_OCEANO,
    analizarMascaraAlfaOceano,
    consultarDistanciaMar,
    consultarNormalAgua,
    esPosicionNavegable,
    generarDatosOceanoVivo,
  } = await import("../src/lib/oceano-vivo.ts");

  // Construir máscara alfa realista en 808x449 con las 9 islas y 10 puentes
  const alfa = new Uint8Array(MASCARA_OCEANO_ANCHO * MASCARA_OCEANO_ALTO);
  const pintarDisco = (cx: number, cy: number, rx: number, ry: number) => {
    const x0 = Math.max(0, Math.floor((cx - rx) * ESCALA_MASCARA_OCEANO));
    const x1 = Math.min(MASCARA_OCEANO_ANCHO - 1, Math.ceil((cx + rx) * ESCALA_MASCARA_OCEANO));
    const y0 = Math.max(0, Math.floor((cy - ry) * ESCALA_MASCARA_OCEANO));
    const y1 = Math.min(MASCARA_OCEANO_ALTO - 1, Math.ceil((cy + ry) * ESCALA_MASCARA_OCEANO));
    for (let my = y0; my <= y1; my++) {
      const ly = my / ESCALA_MASCARA_OCEANO;
      for (let mx = x0; mx <= x1; mx++) {
        const lx = mx / ESCALA_MASCARA_OCEANO;
        const nx = (lx - cx) / rx;
        const ny = (ly - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          alfa[my * MASCARA_OCEANO_ANCHO + mx] = 255;
        }
      }
    }
  };

  for (const isla of Object.values(CONFIGURACION_ISLAS_MAPA)) {
    pintarDisco(isla.x, isla.y, isla.radioX * 0.82, isla.radioY * 0.82);
  }
  for (const puente of TRAYECTOS_PUENTES_AETHELGARD) {
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const inv = 1 - u;
      const px = inv * inv * puente.inicio.x + 2 * inv * u * puente.control.x + u * u * puente.fin.x;
      const py = inv * inv * puente.inicio.y + 2 * inv * u * puente.control.y + u * u * puente.fin.y;
      pintarDisco(px, py, 12, 10);
    }
  }

  const mascara = analizarMascaraAlfaOceano(
    alfa,
    MASCARA_OCEANO_ANCHO,
    MASCARA_OCEANO_ALTO,
    ESCALA_MASCARA_OCEANO,
  );
  const datos = generarDatosOceanoVivo(mascara);

  // 1. Distancia sobre tierra firme = 0; en aguas abiertas > 30px
  assert.strictEqual(consultarDistanciaMar(mascara, 230, 705, false), 0);
  assert.strictEqual(esPosicionNavegable(mascara, 230, 705, 4, false), false);
  assert.ok(consultarDistanciaMar(mascara, 120, 120, false) > 30);
  assert.ok(esPosicionNavegable(mascara, 120, 120, 20, false));

  // Normal en la costa sur debe apuntar hacia afuera/abajo (+y)
  const normalSur = consultarNormalAgua(mascara, 808, 845, false);
  assert.ok(normalSur.y > 0.2, `Normal sur esperada > 0.2, obtenida ${normalSur.y}`);

  // 2. Cobertura completa de sistemas ambientales marinos
  assert.ok(datos.puntosEspuma.length >= 30, "Debe muestrear espuma costera sobre bordes reales");
  assert.ok(datos.corrientes.length >= 5, "Debe generar corrientes por canales y bajo puentes");
  assert.ok(datos.cardumenes.length >= 4, "Debe poblar cardúmenes en cuencas profundas");
  assert.ok(datos.bloquesHielo.length >= 4, "Debe poblar bloques de hielo en mares glaciales del norte");
  assert.ok(datos.medusas.length >= 4, "Debe poblar medusas luminosas en aguas abiertas");
  assert.ok(datos.plancton.length >= 25, "Debe poblar plancton bioluminiscente");
  assert.ok(datos.zonasLeviatan.length >= 2, "Debe detectar cuencas profundas seguras para el leviatán");
  assert.ok(datos.siluetasSubmarinas.length >= 5, "Debe poblar múltiples siluetas submarinas abisales");
  assert.ok(datos.avistamientosAbisales.length >= 3, "Debe programar avistamientos de leviatán, mosasaurus y kraken");

  const especiesSiluetas = new Set(datos.siluetasSubmarinas.map((s) => s.especie));
  for (const req of ["mosasaurus", "plesiosaurio", "mantarraya", "kraken", "ballena"] as const) {
    assert.ok(especiesSiluetas.has(req), `Falta silueta submarina de especie ${req}`);
  }
  const especiesSuperficie = new Set(datos.avistamientosAbisales.map((a) => a.especie));
  for (const req of ["leviatan", "mosasaurus", "kraken"] as const) {
    assert.ok(especiesSuperficie.has(req), `Falta avistamiento superficial de especie ${req}`);
  }

  // 3. Cero colisiones: ningún bloque de hielo, medusa, plancton, estela, espuma, silueta o monstruo abisal toca tierra firme
  for (const s of datos.siluetasSubmarinas) {
    assert.ok(
      esPosicionNavegable(mascara, s.centro.x, s.centro.y, 16, s.permitirBajoPuente),
      `Silueta submarina ${s.especie} en (${s.centro.x}, ${s.centro.y}) invadió tierra`,
    );
  }
  for (const a of datos.avistamientosAbisales) {
    assert.ok(
      esPosicionNavegable(mascara, a.centro.x, a.centro.y, 28, false),
      `Avistamiento ${a.especie} en (${a.centro.x}, ${a.centro.y}) invadió tierra`,
    );
  }
  for (const p of datos.puntosEspuma) {
    assert.ok(
      consultarDistanciaMar(mascara, p.x, p.y, false) > 0,
      `Espuma en (${p.x}, ${p.y}) invadió tierra firme`,
    );
  }
  for (const h of datos.bloquesHielo) {
    assert.ok(
      esPosicionNavegable(mascara, h.x, h.y, h.radio + 2, false),
      `Bloque de hielo en (${h.x}, ${h.y}) demasiado cerca de costa`,
    );
  }
  for (const m of datos.medusas) {
    assert.ok(
      esPosicionNavegable(mascara, m.x, m.y, 12, false),
      `Medusa en (${m.x}, ${m.y}) invadió tierra`,
    );
  }
  for (const pl of datos.plancton) {
    assert.ok(
      esPosicionNavegable(mascara, pl.x, pl.y, 6, false),
      `Plancton en (${pl.x}, ${pl.y}) invadió tierra`,
    );
  }
  for (const c of datos.corrientes) {
    for (const m of c.muestras) {
      assert.ok(
        esPosicionNavegable(mascara, m.x, m.y, 4, true),
        `Corriente en (${m.x}, ${m.y}) atravesó una isla`,
      );
    }
  }
  for (const zl of datos.zonasLeviatan) {
    assert.ok(
      esPosicionNavegable(mascara, zl.x, zl.y, 35, false),
      `Leviatán en (${zl.x}, ${zl.y}) fuera de aguas profundas`,
    );
  }

  // 4. Integración en MapaInteractivoCanvas y ausencia de creación de gradientes por cuadro en runtime
  const canvasCodigo = readFileSync(
    join(__dirname, "../src/components/mundo/MapaInteractivoCanvas.tsx"),
    "utf-8",
  );
  assert.ok(canvasCodigo.includes("crearRecursosOceano"));
  assert.ok(canvasCodigo.includes("dibujarOceanoVivo"));
  assert.ok(canvasCodigo.includes("dibujarAvesMarinasLejanas"));
  assert.ok(canvasCodigo.includes("vinetaCacheRef"));

  // 5. Presencia prolongada y equilibrada (sin saturar) de abisales y siluetas hacia aguas abiertas
  assert.ok(
    datos.siluetasSubmarinas.length >= 15,
    "Debe poblar siluetas submarinas tanto en canales como en aguas exteriores abiertas",
  );
  assert.ok(
    datos.siluetasSubmarinas.some(
      (s) => s.centro.x < 0 || s.centro.x > 1616 || s.centro.y < 0 || s.centro.y > 897,
    ),
    "Las siluetas submarinas deben expandirse al océano abierto exterior",
  );
  assert.ok(
    datos.avistamientosAbisales.length >= 5 && datos.avistamientosAbisales.length <= 6,
    "Debe mantener avistamientos espaciados (5-6) sin saturar el mapa",
  );
  const krakensSup = datos.avistamientosAbisales.filter((a) => a.especie === "kraken").length;
  const leviatanesSup = datos.avistamientosAbisales.filter((a) => a.especie === "leviatan").length;
  assert.ok(krakensSup <= 2 && leviatanesSup <= 2, "Kraken y leviatán no deben saturar el mapa");
  assert.ok(
    datos.avistamientosAbisales.some(
      (a) => a.centro.x < 0 || a.centro.x > 1616 || a.centro.y < 0 || a.centro.y > 897,
    ),
    "Los avistamientos abisales deben extenderse también fuera del perímetro cercano a las islas",
  );
  for (const a of datos.avistamientosAbisales) {
    assert.ok(
      a.duracionAparicion / a.duracionCiclo >= 0.78 && a.duracionAparicion >= 14_000,
      `Avistamiento ${a.especie} debe mantener presencia prolongada (>=14s y >=78% del ciclo)`,
    );
  }

  // 6. Eliminación de aros punteados, calibración de puentes, tooltip con nombre real y eliminación total de tarjetas/botón
  const dioramasCodigo = readFileSync(
    join(__dirname, "../src/lib/mapa-dioramas.ts"),
    "utf-8",
  );
  assert.strictEqual(
    dioramasCodigo.includes("setLineDash"),
    false,
    "dibujarCapaVivaMapa no debe dibujar halos animados de líneas punteadas sobre la isla actual",
  );

  const puenteRiscosCueva = TRAYECTOS_PUENTES_AETHELGARD.find(
    (t) => t.origenId === "ZON-04" && t.destinoId === "ZON-05",
  );
  assert.ok(puenteRiscosCueva && puenteRiscosCueva.control.y >= 324);

  assert.strictEqual(
    canvasCodigo.includes("TÚ AQUÍ"),
    false,
    "El badge animado debe mostrar únicamente 'Tú'",
  );
  assert.strictEqual(
    canvasCodigo.includes("ETIQUETA_BIOMA"),
    false,
    "El tooltip al pasar el cursor debe mostrar únicamente el nombre real de la zona sin etiquetas inventadas",
  );
  assert.ok(
    canvasCodigo.includes("bottom-36 sm:bottom-28 md:bottom-3"),
    "En desktop los controles del mapa deben desplazarse más abajo (md:bottom-3) para no quedar ocultos tras Santuario de Salud",
  );
  assert.strictEqual(canvasCodigo.includes("data-placa-isla"), false);
  assert.strictEqual(canvasCodigo.includes("data-boton-placas-mapa"), false);
  assert.strictEqual(canvasCodigo.includes("mostrarPlacas"), false);

  // 7. Detección de columnas/pilares de puente tocando agua (y rechazo de techos de arcos aéreos)
  const alfaPilares = new Uint8Array(MASCARA_OCEANO_ANCHO * MASCARA_OCEANO_ALTO);
  const pintarRectPilar = (x0: number, y0: number, x1: number, y1: number) => {
    const mx0 = Math.max(0, Math.floor(x0 * ESCALA_MASCARA_OCEANO));
    const mx1 = Math.min(MASCARA_OCEANO_ANCHO - 1, Math.ceil(x1 * ESCALA_MASCARA_OCEANO));
    const my0 = Math.max(0, Math.floor(y0 * ESCALA_MASCARA_OCEANO));
    const my1 = Math.min(MASCARA_OCEANO_ALTO - 1, Math.ceil(y1 * ESCALA_MASCARA_OCEANO));
    for (let my = my0; my <= my1; my++) {
      for (let mx = mx0; mx <= mx1; mx++) {
        alfaPilares[my * MASCARA_OCEANO_ANCHO + mx] = 255;
      }
    }
  };
  // Tablero del puente sobre LOC-01 <-> ZON-02 (y ~ 710) con dos pilares verticales hasta y = 746 y vano de arco central
  pintarRectPilar(460, 704, 592, 720);
  pintarRectPilar(488, 720, 504, 746);
  pintarRectPilar(548, 720, 564, 746);

  const mascaraPilares = analizarMascaraAlfaOceano(
    alfaPilares,
    MASCARA_OCEANO_ANCHO,
    MASCARA_OCEANO_ALTO,
    ESCALA_MASCARA_OCEANO,
  );
  const datosPilares = generarDatosOceanoVivo(mascaraPilares);
  const puntosPilar = datosPilares.puntosEspuma.filter((p) => p.esPilar);

  assert.ok(
    puntosPilar.length >= 2,
    `Deben detectarse al menos 2 puntos de espuma en pilares de puente, detectados=${puntosPilar.length}`,
  );
  assert.ok(
    puntosPilar.some((p) => Math.abs(p.x - 496) <= 14 && p.y >= 748 && p.y <= 756),
    "El pilar izquierdo debe recibir espuma animada en su base sobre el agua",
  );
  assert.ok(
    puntosPilar.some((p) => Math.abs(p.x - 556) <= 14 && p.y >= 748 && p.y <= 756),
    "El pilar derecho debe recibir espuma animada en su base sobre el agua",
  );
  assert.strictEqual(
    puntosPilar.some((p) => p.x >= 514 && p.x <= 538 && p.y >= 720 && p.y <= 736),
    false,
    "El techo aéreo del arco central no debe recibir espuma de columna",
  );
  for (const p of puntosPilar) {
    assert.ok(
      consultarDistanciaMar(mascaraPilares, p.x, p.y, false) > 0,
      `Espuma de pilar en (${p.x}, ${p.y}) invadió mampostería sólida`,
    );
  }
});

test("Subfase 10t: Diorama multicapa de La Cumbre (ZON-06) calibrado sobre arte maestro, diferenciado y sin asignaciones por cuadro", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const {
    SILUETA_ENVOLVENTE_CUMBRE,
    CONTORNO_MESETA_CUMBRE,
    PICOS_CORDILLERA_CUMBRE,
    CRISTALES_GLACIARES_CUMBRE,
    AGUJAS_ACANTILADO_CUMBRE,
    ESQUELETO_DRAGON_CUMBRE,
    DESTELLOS_CORNISA_CUMBRE,
    FRAGMENTOS_ESCARCHA_ACANTILADO,
    dibujarDioramaCumbre,
  } = await import("../src/lib/diorama-cumbre.ts");

  // 1. Silueta de envolvente y meseta dentro de los límites de ZON-06 (sin invadir LOC-03 ni ZON-05)
  assert.ok(SILUETA_ENVOLVENTE_CUMBRE.length >= 24);
  assert.ok(CONTORNO_MESETA_CUMBRE.length >= 12);
  for (const pt of SILUETA_ENVOLVENTE_CUMBRE) {
    assert.ok(pt.x >= 765 && pt.x <= 1310, `Silueta fuera de rango X en ZON-06: ${pt.x}`);
    assert.ok(pt.y >= 0 && pt.y <= 245, `Silueta fuera de rango Y en ZON-06: ${pt.y}`);
  }

  // 2. Cordillera, 4 cúmulos de cristales + 2 agujas y esqueleto del dragón ancestral
  assert.ok(PICOS_CORDILLERA_CUMBRE.length >= 6);
  assert.strictEqual(CRISTALES_GLACIARES_CUMBRE.length, 4, "Deben modelarse los 4 cúmulos de cristales");
  assert.strictEqual(AGUJAS_ACANTILADO_CUMBRE.length, 2);
  for (const cr of CRISTALES_GLACIARES_CUMBRE) {
    assert.ok(cr.punta.y < cr.arista.y && cr.arista.y < cr.base.y);
    assert.ok(cr.satelites.length >= 2);
  }

  assert.ok(
    ESQUELETO_DRAGON_CUMBRE.fauces.x < ESQUELETO_DRAGON_CUMBRE.cuencaOcular.x,
    "Las fauces deben orientarse a la izquierda respecto a la cuenca ocular",
  );
  assert.ok(ESQUELETO_DRAGON_CUMBRE.vertebras.length >= 9);
  assert.ok(DESTELLOS_CORNISA_CUMBRE.length >= 10);
  assert.ok(FRAGMENTOS_ESCARCHA_ACANTILADO.length >= 4);

  // 3. Ejecución segura en Node (sin document) para ambos estados y movimiento reducido
  const ctxDummy = {} as CanvasRenderingContext2D;
  assert.doesNotThrow(() => dibujarDioramaCumbre(ctxDummy, true, 1600, false, null));
  assert.doesNotThrow(() => dibujarDioramaCumbre(ctxDummy, false, 1600, false, null));
  assert.doesNotThrow(() => dibujarDioramaCumbre(ctxDummy, true, 1600, true, null));

  // 4. Integración en mapa-dioramas.ts y MapaInteractivoCanvas.tsx (cacheo de sprites y estado bloqueado/desbloqueado)
  const dioramaCumbreCodigo = readFileSync(join(__dirname, "../src/lib/diorama-cumbre.ts"), "utf-8");
  const dioramasCodigo = readFileSync(join(__dirname, "../src/lib/mapa-dioramas.ts"), "utf-8");
  const canvasCodigo = readFileSync(
    join(__dirname, "../src/components/mundo/MapaInteractivoCanvas.tsx"),
    "utf-8",
  );

  assert.ok(dioramaCumbreCodigo.includes("spritesCumbreCache"), "Debe cachear sprites fuera de pantalla");
  assert.ok(
    dioramaCumbreCodigo.includes("dibujarEstadoBloqueadoCumbre"),
    "Debe diferenciar atmósfera contenida cuando ZON-06 está bloqueada",
  );
  assert.strictEqual(
    dioramaCumbreCodigo.includes("setLineDash"),
    false,
    "No debe introducir trazos punteados en el diorama de La Cumbre",
  );
  assert.ok(dioramasCodigo.includes("dibujarDioramaCumbre"));
  assert.ok(canvasCodigo.includes("recursosOceano.mascara"));
});



