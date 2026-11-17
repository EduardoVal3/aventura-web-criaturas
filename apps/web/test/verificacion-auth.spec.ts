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
  assert.strictEqual(obtenerImagenCriatura("lobo-estepario"), "/assets/criaturas/lobo-estepario.webp");
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

test("Ergonomía y Libertad de Usuario: PantallaCrearPersonaje y PantallaHubUbicacion incluyen escape hatch con LogOut, y LayoutPrincipal es responsive", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const crearPersonajeCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaCrearPersonaje.tsx"), "utf-8");
  const hubCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaHubUbicacion.tsx"), "utf-8");
  const layoutCodigo = readFileSync(join(__dirname, "../src/components/LayoutPrincipal.tsx"), "utf-8");

  // PantallaCrearPersonaje debe ofrecer salida al ingreso
  assert.ok(crearPersonajeCodigo.includes("LogOut"), "PantallaCrearPersonaje debe importar el icono LogOut");
  assert.ok(crearPersonajeCodigo.includes("cerrarSesion"), "PantallaCrearPersonaje debe usar cerrarSesion");
  assert.ok(
    crearPersonajeCodigo.includes('SALIR AL INGRESO') || crearPersonajeCodigo.includes('Cerrar sesión'),
    "PantallaCrearPersonaje debe incluir botón de salida visible",
  );

  // PantallaHubUbicacion debe ofrecer salida de la localidad
  assert.ok(hubCodigo.includes("LogOut"), "PantallaHubUbicacion debe importar LogOut");
  assert.ok(hubCodigo.includes("handleCerrarSesion"), "PantallaHubUbicacion debe proveer función para cerrar sesión");

  // LayoutPrincipal debe ser responsive sin flex-wrap, sin botón de logout y con Kit de interfaz accesible en móvil
  assert.ok(!layoutCodigo.includes("flex-wrap"), "LayoutPrincipal no debe usar flex-wrap en el header para evitar apilamiento vertical");
  assert.ok(!layoutCodigo.includes("LogOut"), "LayoutPrincipal no debe incluir botón de salir para no saturar la cabecera");
  assert.ok(layoutCodigo.includes('to="/kit-ui"'), "LayoutPrincipal debe incluir enlace a Kit de interfaz accesible desde celular");
});

test("Regla R1: Cero emojis unicode en PantallaIngreso.tsx, PantallaRegistro.tsx, PantallaCrearPersonaje.tsx y LayoutPrincipal.tsx", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const regexEmoji = /\p{Extended_Pictographic}/u;

  const archivos = [
    join(__dirname, "../src/paginas/PantallaIngreso.tsx"),
    join(__dirname, "../src/paginas/PantallaRegistro.tsx"),
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

test("Hardening y Ergonomía: PantallaIngreso cuenta con aria-busy, estética retro 8bitcn y protección de carga", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const contenido = readFileSync(join(__dirname, "../src/paginas/PantallaIngreso.tsx"), "utf-8");

  assert.ok(contenido.includes('aria-busy={enviando}'), "PantallaIngreso debe declarar aria-busy en el formulario y botón");
  assert.ok(contenido.includes("retro text-[10px]"), "PantallaIngreso debe aplicar estética retro en inputs y controles");
  assert.ok(contenido.includes("Sparkles"), "PantallaIngreso debe usar iconos Lucide en lugar de emojis");
  assert.ok(contenido.includes("reproducirSonido"), "PantallaIngreso debe reproducir efectos de sonido retro");
});

test("Hardening y Ergonomía: PantallaRegistro cuenta con aria-busy, estética retro 8bitcn y protección de carga", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const contenido = readFileSync(join(__dirname, "../src/paginas/PantallaRegistro.tsx"), "utf-8");

  assert.ok(contenido.includes('aria-busy={enviando}'), "PantallaRegistro debe declarar aria-busy en el formulario y botón");
  assert.ok(contenido.includes("retro text-[10px]"), "PantallaRegistro debe aplicar estética retro en inputs y controles");
  assert.ok(contenido.includes("Swords"), "PantallaRegistro debe usar iconos Lucide Swords en lugar de emojis");
  assert.ok(contenido.includes("reproducirSonido"), "PantallaRegistro debe reproducir efectos de sonido retro");
  assert.ok(contenido.includes("requisitos-clave"), "PantallaRegistro debe incluir panel de requisitos de clave");
  assert.ok(contenido.includes("pointer-events-none opacity-50"), "PantallaRegistro debe proteger enlaces secundarios durante el envío");
});

test("Auditoría Impeccable: PantallaIngreso consolida estética retro-brutalist 8-bit, tipografía integral, confinamiento móvil y espaciado ergonómico", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const ingresoCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaIngreso.tsx"), "utf-8");

  // 1. Estética retro-brutalist 8-bit (8bitcn/ui)
  assert.ok(
    ingresoCodigo.includes("border-4 border-black"),
    "La tarjeta principal y el botón deben usar marcos negros sólidos de 4px",
  );
  assert.ok(
    ingresoCodigo.includes("shadow-[6px_6px_0_0_#000]"),
    "La tarjeta principal debe proyectar sombra ortogonal sólida de 6px",
  );
  assert.ok(
    ingresoCodigo.includes("shadow-[2px_2px_0_0_#000]"),
    "Insignia y campos de entrada deben tener sombras ortogonales sólidas de 2px",
  );
  assert.ok(
    ingresoCodigo.includes("shadow-[4px_4px_0_0_#000]"),
    "El botón arcade principal debe tener sombra ortogonal de 4px",
  );
  assert.ok(
    ingresoCodigo.includes("rounded-none"),
    "Los componentes deben preservar esquinas ortogonales vivas estilo 8-bit",
  );

  // 2. Confinamiento móvil y erradicación de desbordamiento horizontal (360px-420px)
  assert.ok(
    ingresoCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe confinar el ancho con overflow-x-hidden",
  );
  assert.ok(
    ingresoCodigo.includes("pr-10 sm:pr-12"),
    "El campo de contraseña debe tener margen interior derecho adecuado para evitar superposición con el botón de ojo",
  );
  assert.ok(
    ingresoCodigo.includes("size-8"),
    "El botón de visibilidad de contraseña debe tener área táctil ergonómica de 32px (size-8)",
  );

  // 3. Ergonomía táctil y separación de controles
  assert.ok(
    ingresoCodigo.includes("space-y-4 sm:space-y-5"),
    "Los campos de formulario deben contar con separación vertical holgada",
  );
  assert.ok(
    ingresoCodigo.includes("h-12 sm:h-14"),
    "El botón de acción principal debe disponer de altura táctil ergonómica de 48px-56px",
  );
  assert.ok(
    ingresoCodigo.includes("border-black/40 gap-3 sm:gap-4"),
    "El pie de navegación secundaria debe contar con divisor físico claro y espaciado generoso",
  );
  assert.ok(
    ingresoCodigo.includes("flex-col sm:flex-row items-center justify-between"),
    "Los enlaces del pie deben usar disposición adaptativa en columna/fila para móviles estrechos",
  );
});

test("Auditoría Impeccable: PantallaRegistro consolida estética retro-brutalist 8-bit, tipografía integral, micro-inspección y espaciado ergonómico", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const registroCodigo = readFileSync(join(__dirname, "../src/paginas/PantallaRegistro.tsx"), "utf-8");

  // 1. Estética retro-brutalist 8-bit (8bitcn/ui)
  assert.ok(
    registroCodigo.includes("border-4 border-black"),
    "La tarjeta principal y el botón deben usar marcos negros sólidos de 4px",
  );
  assert.ok(
    registroCodigo.includes("shadow-[6px_6px_0_0_#000]"),
    "La tarjeta principal debe proyectar sombra ortogonal sólida de 6px",
  );
  assert.ok(
    registroCodigo.includes("shadow-[2px_2px_0_0_#000]"),
    "Insignia, campos de entrada y panel de requisitos deben tener sombras ortogonales sólidas de 2px",
  );
  assert.ok(
    registroCodigo.includes("shadow-[4px_4px_0_0_#000]"),
    "El botón arcade principal debe tener sombra ortogonal de 4px",
  );
  assert.ok(
    registroCodigo.includes("rounded-none"),
    "Los componentes deben preservar esquinas ortogonales vivas estilo 8-bit",
  );

  // 2. Confinamiento móvil y erradicación de desbordamiento horizontal (360px-420px)
  assert.ok(
    registroCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe confinar el ancho con overflow-x-hidden",
  );
  assert.ok(
    registroCodigo.includes("pr-10 sm:pr-12"),
    "El campo de contraseña debe tener margen interior derecho adecuado para evitar superposición con el botón de ojo",
  );
  assert.ok(
    registroCodigo.includes("size-8"),
    "El botón de visibilidad de contraseña debe tener área táctil ergonómica de 32px (size-8)",
  );
  assert.ok(
    registroCodigo.includes("grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2"),
    "El panel de criterios de contraseña debe fluir en cuadrícula adaptable de 1 a 3 columnas sin desbordamiento",
  );

  // 3. Ergonomía táctil y separación de controles
  assert.ok(
    registroCodigo.includes("space-y-4 sm:space-y-5"),
    "Los campos de formulario deben contar con separación vertical holgada",
  );
  assert.ok(
    registroCodigo.includes("h-12 sm:h-14"),
    "El botón de acción principal debe disponer de altura táctil ergonómica de 48px-56px",
  );
  assert.ok(
    registroCodigo.includes("border-black/40 gap-3 sm:gap-4"),
    "El pie de navegación secundaria debe contar con divisor físico claro y espaciado generoso",
  );
  assert.ok(
    registroCodigo.includes("flex-col sm:flex-row items-center justify-between"),
    "Los enlaces del pie deben usar disposición adaptativa en columna/fila para móviles estrechos",
  );
});

test("Auditoría Impeccable: LayoutPrincipal y Footer consolidan estética retro-brutalist 8-bit, tipografía integral y confinamiento móvil", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const layoutCodigo = readFileSync(join(__dirname, "../src/components/LayoutPrincipal.tsx"), "utf-8");

  // 1. Estética retro-brutalist 8-bit (8bitcn/ui)
  assert.ok(
    layoutCodigo.includes("border-b-4 border-black"),
    "La cabecera superior fija debe lucir un marco negro sólido inferior de 4px",
  );
  assert.ok(
    layoutCodigo.includes("border-t-4 border-black"),
    "El pie de página debe lucir un marco negro sólido superior de 4px",
  );
  assert.ok(
    layoutCodigo.includes("shadow-[0_4px_0_0_#000]"),
    "La cabecera superior debe proyectar sombra sólida ortogonal de 4px",
  );
  assert.ok(
    layoutCodigo.includes("shadow-[2px_2px_0_0_#000]"),
    "Los botones de navegación de la cabecera deben comportarse como cartuchos con sombra sólida de 2px",
  );
  assert.ok(
    layoutCodigo.includes("border-2 border-black"),
    "Los botones de navegación superior deben enmarcarse con bordes negros de 2px",
  );

  // 2. Confinamiento móvil y erradicación de desbordamiento horizontal (360px-420px)
  assert.ok(
    layoutCodigo.includes("overflow-x-hidden"),
    "El cascarón principal debe confinar el ancho con overflow-x-hidden",
  );
  assert.ok(
    !layoutCodigo.includes("flex-wrap"),
    "LayoutPrincipal no debe usar flex-wrap en la cabecera ni romper la barra fija en móvil",
  );
  assert.ok(
    layoutCodigo.includes("flex flex-col sm:flex-row items-center justify-between"),
    "El pie de página debe organizarse con apilamiento fluido flex-col sm:flex-row",
  );
  assert.ok(
    layoutCodigo.includes("break-words"),
    "La leyenda de derechos debe permitir quiebre de palabras para evitar amputación en pantallas estrechas",
  );

  // 3. Ergonomía táctil y separación de controles
  assert.ok(
    layoutCodigo.includes("gap-2 sm:gap-3"),
    "Los botones de navegación superior deben contar con separación táctil explícita",
  );
  assert.ok(
    layoutCodigo.includes("gap-3 sm:gap-4"),
    "El pie debe separar la leyenda institucional del bloque de enlaces",
  );
  assert.ok(
    layoutCodigo.includes("gap-4 sm:gap-6"),
    "Los enlaces del pie deben contar con espaciado generoso",
  );
  assert.ok(
    layoutCodigo.includes("p-3 sm:p-6 lg:p-8"),
    "El contenedor principal <main> debe mantener un relleno interior confortable",
  );

  // 4. Tipografía retro integral y audio
  assert.ok(
    layoutCodigo.includes("reproducirSonido"),
    "LayoutPrincipal debe incorporar retroalimentación táctil de audio Web Audio",
  );
  assert.ok(
    layoutCodigo.includes("drop-shadow-[1px_1px_0_#000]"),
    "El logo de la marca debe contar con relieve de alto contraste 8-bit",
  );
});

