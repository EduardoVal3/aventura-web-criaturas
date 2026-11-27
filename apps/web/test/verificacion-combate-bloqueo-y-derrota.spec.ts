import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const leerFuente = (rutaRelativa: string) =>
  readFileSync(join(__dirname, "../src", rutaRelativa), "utf-8");

test("Bloqueo centralizado de navegación en combate activo: ContextoAutenticacion, RutaProtegida y App", () => {
  const contextoCodigo = leerFuente("contextos/ContextoAutenticacion.tsx");
  const rutaProtegidaCodigo = leerFuente("components/RutaProtegida.tsx");
  const appCodigo = leerFuente("App.tsx");

  assert.ok(
    contextoCodigo.includes("combateActivo") &&
      contextoCodigo.includes("establecerCombateActivo"),
    "ContextoAutenticacion debe exponer combateActivo y establecerCombateActivo",
  );
  assert.ok(
    contextoCodigo.includes("perfil.tieneEncuentroActivo"),
    "ContextoAutenticacion debe hidratar combateActivo desde /usuarios/perfil",
  );

  assert.ok(
    rutaProtegidaCodigo.includes("permitirEnCombate") &&
      rutaProtegidaCodigo.includes("bloqueadoPorCombate") &&
      rutaProtegidaCodigo.includes('to="/combate"'),
    "RutaProtegida debe redirigir a /combate cuando combateActivo es true y la ruta no lo permite",
  );
  assert.ok(
    rutaProtegidaCodigo.includes("bloqueo-combate-activo"),
    "RutaProtegida debe mostrar un toast deduplicado al bloquear el cambio de pantalla",
  );

  const coincidenciasPermitir = appCodigo.match(/permitirEnCombate/g) ?? [];
  assert.strictEqual(
    coincidenciasPermitir.length,
    1,
    "Solo la ruta /combate debe declarar permitirEnCombate en App.tsx",
  );
  assert.ok(
    appCodigo.includes('path: "/creditos"') &&
      appCodigo.includes('path: "/kit-ui"'),
    "Las rutas informativas /creditos y /kit-ui deben mantenerse accesibles desde el menú de pausa",
  );
});

test("Retorno directo al combate desde vistas informativas (LayoutPrincipal y PaginaCreditos)", () => {
  const layoutCodigo = leerFuente("components/LayoutPrincipal.tsx");
  const creditosCodigo = leerFuente("paginas/PaginaCreditos.tsx");
  const regexEmoji = /\p{Extended_Pictographic}/u;

  assert.ok(
    layoutCodigo.includes("combateActivo") &&
      layoutCodigo.includes("COMBATE EN PAUSA") &&
      layoutCodigo.includes("VOLVER AL COMBATE") &&
      layoutCodigo.includes("flex-col sm:flex-row") &&
      !layoutCodigo.includes("truncate"),
    "LayoutPrincipal debe mostrar una franja retro responsive sin truncamiento en móvil para regresar directo a /combate",
  );
  assert.strictEqual(
    layoutCodigo.includes("flex-wrap"),
    false,
    "LayoutPrincipal debe conservar ausencia de flex-wrap",
  );
  assert.strictEqual(
    layoutCodigo.includes("LogOut"),
    false,
    "LayoutPrincipal debe conservar ausencia de LogOut",
  );
  assert.strictEqual(
    regexEmoji.test(layoutCodigo),
    false,
    "LayoutPrincipal no debe contener emojis unicode (Regla R1)",
  );

  assert.ok(
    creditosCodigo.includes("combateActivo") &&
      creditosCodigo.includes("Volver al Combate") &&
      creditosCodigo.includes('navigate("/combate"'),
    "PaginaCreditos debe regresar directo a /combate cuando hay un encuentro en pausa",
  );
});

test("Prevención de bucle en 0 HP y sincronización de estado en PantallaExploracion y PantallaCombate", () => {
  const exploracionCodigo = leerFuente("paginas/PantallaExploracion.tsx");
  const combateCodigo = leerFuente("paginas/PantallaCombate.tsx");

  assert.ok(
    exploracionCodigo.includes("ubicacion?.equipoDebilitado") &&
      exploracionCodigo.includes("EQUIPO_DEBILITADO"),
    "PantallaExploracion debe bloquear exploración y reaccionar a EQUIPO_DEBILITADO cuando el equipo está en 0 HP",
  );
  assert.ok(
    exploracionCodigo.includes('to="/inventario"') &&
      exploracionCodigo.includes('to="/hub"'),
    "PantallaExploracion debe ofrecer salidas claras a Bolsa (/inventario) y Mapa (/hub) cuando el equipo está debilitado",
  );
  assert.strictEqual(
    exploracionCodigo.includes("truncate"),
    false,
    "PantallaExploracion no debe introducir la clase truncate",
  );

  assert.ok(
    combateCodigo.includes("establecerCombateActivo(datos.estado === \"EN_CURSO\")"),
    "PantallaCombate debe activar el cerrojo de navegación al sincronizar un encuentro EN_CURSO",
  );
  assert.ok(
    (combateCodigo.match(/establecerCombateActivo\(false\)/g) ?? []).length >= 7,
    "PantallaCombate debe liberar el bloqueo de navegación en victoria, derrota, captura, huida y ausencia de encuentro",
  );
  assert.ok(
    combateCodigo.includes('navigate("/inventario")') &&
      combateCodigo.includes("Ir al Mapa (Viajar a Santuario)"),
    "Tras derrota en zona silvestre, PantallaCombate debe dirigir a Mapa/Santuario o Bolsa en lugar de /curacion sin servicio",
  );
  assert.strictEqual(
    combateCodigo.includes("max-w-5xl"),
    false,
    "PantallaCombate debe ocupar todo el ancho del viewport en escritorio sin márgenes laterales vacíos",
  );
  assert.ok(
    combateCodigo.includes("w-[min(194px,54vw)]") &&
      combateCodigo.includes("grid-cols-10") &&
      combateCodigo.includes("h-3 sm:h-2.5") &&
      !combateCodigo.includes("font-sans"),
    "Las placas HUD de PantallaCombate deben preservar tipografía .retro integral, ancho fluido anti-desborde y barra de Resonancia de 10 bloques visibles en móvil",
  );
});
