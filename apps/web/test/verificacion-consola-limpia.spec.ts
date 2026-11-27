import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  apiHttp,
  debeNotificarSesionExpirada,
  esRutaAutenticacionPublica,
} from "../src/api/apiHttp.ts";
import {
  detenerMusicaAmbiente,
  iniciarMusicaAmbiente,
  puedeIniciarAudioWeb,
  reproducirSonido,
} from "../src/lib/assets.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("apiHttp no dispara aethelgard:no-autorizado en 401 de rutas públicas ni sin token previo", () => {
  assert.strictEqual(esRutaAutenticacionPublica("/usuarios/login"), true);
  assert.strictEqual(esRutaAutenticacionPublica("/usuarios/registro"), true);
  assert.strictEqual(esRutaAutenticacionPublica("/autenticacion/ingreso"), true);
  assert.strictEqual(esRutaAutenticacionPublica("/personajes/activo"), false);

  // Error 401 por credenciales inválidas en login jamás debe cerrar sesión ni disparar /logout
  assert.strictEqual(debeNotificarSesionExpirada(401, "/usuarios/login", false), false);
  assert.strictEqual(debeNotificarSesionExpirada(401, "/usuarios/login", true), false);
  assert.strictEqual(debeNotificarSesionExpirada(401, "/usuarios/registro", true), false);

  // Error 401 sin token enviado (p. ej. recurso protegido sin sesión) no debe disparar expiración
  assert.strictEqual(debeNotificarSesionExpirada(401, "/personajes/activo", false), false);

  // Error 401 en ruta protegida CON token activo sí notifica expiración real
  assert.strictEqual(debeNotificarSesionExpirada(401, "/personajes/activo", true), true);
  assert.strictEqual(debeNotificarSesionExpirada(401, "/usuarios/perfil", true), true);

  // Otros estados HTTP nunca disparan expiración
  assert.strictEqual(debeNotificarSesionExpirada(404, "/encuentros/activo", true), false);
  assert.strictEqual(debeNotificarSesionExpirada(500, "/mundo/ubicacion-actual", true), false);
});

test("apiHttp.cerrarSesion purga la sesión localmente sin emitir POST /api/usuarios/logout 404", async () => {
  const fetchOriginal = globalThis.fetch;
  let llamadasFetch = 0;

  globalThis.fetch = (async () => {
    llamadasFetch += 1;
    throw new Error("No debe invocarse fetch al cerrar sesión JWT stateless");
  }) as typeof fetch;

  try {
    apiHttp.establecerToken("jwt-prueba-local");
    const respuesta = await apiHttp.cerrarSesion();
    assert.strictEqual(llamadasFetch, 0, "cerrarSesion no debe hacer peticiones HTTP inexistentes");
    assert.ok(respuesta.mensaje.length > 0);
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test("Web Audio no instancia AudioContext antes de un gesto del usuario (cero warnings autoplay)", () => {
  const windowOriginal = (globalThis as { window?: unknown }).window;
  let contextosCreados = 0;

  class AudioContextSimulado {
    state = "suspended";
    currentTime = 0;
    constructor() {
      contextosCreados += 1;
    }
    resume() {
      return Promise.resolve();
    }
  }

  (globalThis as { window?: unknown }).window = {
    AudioContext: AudioContextSimulado,
    localStorage: { getItem: () => "0", setItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
  };

  try {
    assert.strictEqual(puedeIniciarAudioWeb(), false);
    iniciarMusicaAmbiente("hub");
    reproducirSonido("click", 0.4);
    assert.strictEqual(
      contextosCreados,
      0,
      "No se debe construir AudioContext antes de la primera interacción del usuario",
    );
  } finally {
    detenerMusicaAmbiente();
    (globalThis as { window?: unknown }).window = windowOriginal;
  }
});

test("Regresión de pantallas: ContextoAutenticacion, PaginaKitUi, PantallaExploracion y PantallaCombate evitan 401/404 injustificados", () => {
  const contextoCodigo = readFileSync(
    join(__dirname, "../src/contextos/ContextoAutenticacion.tsx"),
    "utf-8",
  );
  const kitUiCodigo = readFileSync(join(__dirname, "../src/paginas/PaginaKitUi.tsx"), "utf-8");
  const exploracionCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaExploracion.tsx"),
    "utf-8",
  );
  const combateCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaCombate.tsx"),
    "utf-8",
  );

  assert.ok(
    /\bapi\s*\.\s*obtenerPerfil\(\)/.test(contextoCodigo),
    "ContextoAutenticacion debe consultar /usuarios/perfil en lugar de forzar 404 en /personajes/activo",
  );
  assert.ok(
    contextoCodigo.includes("omitirBootstrapTokenRef"),
    "ContextoAutenticacion debe evitar doble carga inmediata tras login/registro",
  );

  assert.strictEqual(
    kitUiCodigo.includes("api.obtenerPersonajeActivo()"),
    false,
    "PaginaKitUi (ruta pública) no debe invocar /personajes/activo sin sesión o personaje",
  );
  assert.ok(
    kitUiCodigo.includes("useAutenticacion"),
    "PaginaKitUi debe reutilizar el estado de ContextoAutenticacion",
  );

  assert.ok(
    exploracionCodigo.includes("tieneEncuentroActivo"),
    "PantallaExploracion debe verificar tieneEncuentroActivo antes de pedir /encuentros/activo",
  );
  assert.strictEqual(
    /<Link[\s\S]{0,160}<Button/m.test(exploracionCodigo),
    false,
    "PantallaExploracion no debe anidar <Button> dentro de <Link>",
  );

  assert.ok(
    combateCodigo.includes("tieneEncuentroActivo"),
    "PantallaCombate debe evitar 404 en acceso directo sin combate activo",
  );
});
