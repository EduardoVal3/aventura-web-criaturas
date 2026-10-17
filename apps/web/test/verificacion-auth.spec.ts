import test from "node:test";
import assert from "node:assert/strict";
import { esquemaRegistro, esquemaLogin } from "../src/lib/esquemas-auth.ts";
import { obtenerImagenCriatura, obtenerImagenZona, obtenerImagenObjeto, RUTAS_PLACEHOLDERS } from "../src/lib/assets.ts";

test("Esquema de registro valida credenciales correctamente", () => {
  const resultadoInvalido = esquemaRegistro.safeParse({
    nombreUsuario: "ab",
    correo: "correo-invalido",
    clave: "simple",
  });
  assert.strictEqual(resultadoInvalido.success, false);

  const resultadoValido = esquemaRegistro.safeParse({
    nombreUsuario: "arturo_sendas",
    correo: "arturo@aethelgard.com",
    clave: "ClaveSegura123!",
  });
  assert.strictEqual(resultadoValido.success, true);
});

test("Esquema de inicio de sesión valida campos requeridos", () => {
  const resultadoInvalido = esquemaLogin.safeParse({
    correo: "invalido",
    clave: "",
  });
  assert.strictEqual(resultadoInvalido.success, false);

  const resultadoValido = esquemaLogin.safeParse({
    correo: "explorador@aethelgard.com",
    clave: "ClaveSegura123!",
  });
  assert.strictEqual(resultadoValido.success, true);
});

test("Helper de assets resuelve rutas y placeholders seguros", () => {
  assert.strictEqual(obtenerImagenCriatura(null), RUTAS_PLACEHOLDERS.criatura);
  assert.strictEqual(obtenerImagenCriatura("lobo-gris"), "/assets/criaturas/lobo-gris.webp");
  assert.strictEqual(obtenerImagenZona(null), RUTAS_PLACEHOLDERS.zona);
  assert.strictEqual(obtenerImagenObjeto(null), RUTAS_PLACEHOLDERS.objeto);
});

test("Flujo de autenticación y navegación: RutaPublica permite salir de crear-personaje si no hay personaje activo", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const rutaProtegidaCodigo = readFileSync(join(__dirname, "../src/components/RutaProtegida.tsx"), "utf-8");

  const parteRutaPublica = rutaProtegidaCodigo.split("export function RutaPublica")[1] ?? "";

  // Verifica que RutaPublica ya no redirija incondicionalmente a crear-personaje
  assert.ok(
    !parteRutaPublica.includes('return <Navigate to="/crear-personaje" replace />;'),
    "RutaPublica no debe atrapar al usuario redirigiéndolo a crear-personaje sin opción de ingreso/registro",
  );
  assert.ok(
    parteRutaPublica.includes("token && personajeActivo"),
    "RutaPublica solo debe redirigir al hub si existe token y personaje activo",
  );
});

test("Ergonomía y Libertad de Usuario: PantallaCrearPersonaje y LayoutPrincipal incluyen escape hatch con LogOut", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const crearPersonajeCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaCrearPersonaje.tsx"), "utf-8");
  const layoutCodigo = readFileSync(join(__dirname, "../src/components/LayoutPrincipal.tsx"), "utf-8");

  // PantallaCrearPersonaje debe ofrecer salida al ingreso
  assert.ok(crearPersonajeCodigo.includes("LogOut"), "PantallaCrearPersonaje debe importar el icono LogOut");
  assert.ok(crearPersonajeCodigo.includes("cerrarSesion"), "PantallaCrearPersonaje debe usar cerrarSesion");
  assert.ok(
    crearPersonajeCodigo.includes('SALIR AL INGRESO') || crearPersonajeCodigo.includes('Cerrar sesión'),
    "PantallaCrearPersonaje debe incluir botón de salida visible",
  );

  // LayoutPrincipal debe ofrecer controles de sesión
  assert.ok(layoutCodigo.includes("LogOut"), "LayoutPrincipal debe importar LogOut");
  assert.ok(layoutCodigo.includes("LogIn"), "LayoutPrincipal debe importar LogIn");
  assert.ok(layoutCodigo.includes("useAutenticacion"), "LayoutPrincipal debe consumir useAutenticacion");
});

test("Regla R1: Cero emojis unicode en PantallaCrearPersonaje.tsx y LayoutPrincipal.tsx", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const regexEmoji = /\p{Extended_Pictographic}/u;

  const archivos = [
    join(__dirname, "../src/paginas/PantallaCrearPersonaje.tsx"),
    join(__dirname, "../src/components/LayoutPrincipal.tsx"),
  ];

  for (const archivo of archivos) {
    const contenido = readFileSync(archivo, "utf-8");
    const lineas = contenido.split("\n");
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      assert.ok(
        !regexEmoji.test(linea),
        `Se encontró emoji unicode prohibido por Regla R1 en ${archivo}:${i + 1} -> ${linea.trim()}`,
      );
    }
  }
});

