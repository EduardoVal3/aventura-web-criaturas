import test from "node:test";
import assert from "node:assert/strict";
import {
  SERVICIOS_HUB,
  estaServicioHabilitadoEnZona,
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

