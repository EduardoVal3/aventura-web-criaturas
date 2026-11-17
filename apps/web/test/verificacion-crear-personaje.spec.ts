import test from "node:test";
import assert from "node:assert/strict";
import { esquemaCrearPersonaje } from "../src/lib/esquemas-auth.ts";
import { OPCIONES_CRIATURAS } from "../src/lib/criaturas-iniciales.ts";
import { obtenerImagenCriatura, RUTAS_PLACEHOLDERS } from "../src/lib/assets.ts";

test("Esquema de creación de personaje valida nombres correctamente", () => {
  // Rechaza nombres con menos de 3 caracteres
  const resultadoCorto = esquemaCrearPersonaje.safeParse({
    nombre: "Al",
    especieInicialSlug: "lobo-estepario",
  });
  assert.strictEqual(resultadoCorto.success, false);

  // Rechaza nombres solo con espacios en blanco (gracias a .trim())
  const resultadoEspacios = esquemaCrearPersonaje.safeParse({
    nombre: "   ",
    especieInicialSlug: "lobo-estepario",
  });
  assert.strictEqual(resultadoEspacios.success, false);

  // Acepta nombres válidos y recorta espacios
  const resultadoValido = esquemaCrearPersonaje.safeParse({
    nombre: "  Arturo de Sendas  ",
    especieInicialSlug: "lobo-estepario",
  });
  assert.strictEqual(resultadoValido.success, true);
  if (resultadoValido.success) {
    assert.strictEqual(resultadoValido.data.nombre, "Arturo de Sendas");
  }
});

test("Esquema de creación de personaje valida las 3 criaturas iniciales autorizadas", () => {
  const criaturasValidas = ["lobo-estepario", "vibora-rocosa", "cangrejo-abismal"] as const;

  for (const slug of criaturasValidas) {
    const res = esquemaCrearPersonaje.safeParse({
      nombre: "Guardián Astral",
      especieInicialSlug: slug,
    });
    assert.strictEqual(res.success, true, `Debe aceptar ${slug}`);
  }

  // Rechaza especies que no son criaturas iniciales
  const resultadoInvalido = esquemaCrearPersonaje.safeParse({
    nombre: "Guardián Astral",
    especieInicialSlug: "dragon-rojo",
  });
  assert.strictEqual(resultadoInvalido.success, false);
});

test("Opciones de criaturas iniciales poseen estadísticas completas y sprites válidos", () => {
  assert.strictEqual(OPCIONES_CRIATURAS.length, 3);

  for (const criatura of OPCIONES_CRIATURAS) {
    assert.ok(criatura.hpBase > 0, `${criatura.slug} debe tener HP mayor a 0`);
    assert.ok(criatura.ataqueBase > 0, `${criatura.slug} debe tener ATQ mayor a 0`);
    assert.ok(criatura.defensaBase > 0, `${criatura.slug} debe tener DEF mayor a 0`);
    assert.ok(criatura.velocidadBase > 0, `${criatura.slug} debe tener VEL mayor a 0`);
    assert.ok(criatura.arquetipo.length > 0, `${criatura.slug} debe tener un arquetipo`);

    const rutaSprite = obtenerImagenCriatura(criatura.slug);
    assert.strictEqual(
      rutaSprite,
      `/assets/criaturas/${criatura.slug}.webp`,
      `La ruta del sprite debe ser consistente`,
    );
  }

  // Comprueba resolución de fallback seguro
  assert.strictEqual(obtenerImagenCriatura(null), RUTAS_PLACEHOLDERS.criatura);
});

test("Hardening y Ergonomía: PantallaCrearPersonaje cuenta con aria-busy, estética retro 8bitcn, mini-barras y protección de envío", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const contenido = readFileSync(
    join(__dirname, "../src/paginas/PantallaCrearPersonaje.tsx"),
    "utf-8",
  );

  assert.ok(
    contenido.includes("aria-busy={enviando}"),
    "PantallaCrearPersonaje debe declarar aria-busy en el formulario y botón",
  );
  assert.ok(
    contenido.includes("retro text-[10px]"),
    "PantallaCrearPersonaje debe aplicar estética retro en inputs y controles",
  );
  assert.ok(
    contenido.includes("border-2") &&
      contenido.includes("border-black") &&
      contenido.includes("shadow-[4px_4px_0_0_#000]"),
    "PantallaCrearPersonaje debe aplicar borde pixelado retro 8bitcn en las tarjetas",
  );
  assert.ok(
    contenido.includes("border-primary bg-primary/10 shadow-[6px_6px_0_0_#000]"),
    "PantallaCrearPersonaje debe aplicar halo luminoso sutil en la tarjeta activa",
  );
  assert.ok(
    contenido.includes("ELEGIDO"),
    "PantallaCrearPersonaje debe exponer insignia ELEGIDO en la criatura activa",
  );
  assert.ok(
    contenido.includes("Heart") &&
      contenido.includes("Swords") &&
      contenido.includes("Shield") &&
      contenido.includes("Zap"),
    "PantallaCrearPersonaje debe renderizar iconos Lucide para HP, ATQ, DEF y VEL",
  );
  assert.ok(
    contenido.includes("pointer-events-none opacity-50"),
    "PantallaCrearPersonaje debe proteger controles de navegación secundaria durante el envío",
  );
  assert.ok(
    contenido.includes("reproducirSonido"),
    "PantallaCrearPersonaje debe reproducir efectos acústicos retro",
  );

  // Verificación estricta de Regla R1: cero emojis unicode
  const regexEmoji = /\p{Extended_Pictographic}/u;
  const lineas = contenido.split("\n");
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    assert.ok(
      !regexEmoji.test(linea),
      `Se encontró emoji unicode prohibido por Regla R1 en PantallaCrearPersonaje.tsx:${i + 1} -> ${linea.trim()}`,
    );
  }
});

test("Auditoría Impeccable: PantallaCrearPersonaje consolida estética retro-brutalist 8-bit, tipografía integral, confinamiento móvil y espaciado de controles", async () => {
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const crearPersonajeCodigo = readFileSync(
    join(__dirname, "../src/paginas/PantallaCrearPersonaje.tsx"),
    "utf-8",
  );

  // 1. Estética retro-brutalist 8-bit (8bitcn/ui)
  assert.ok(
    crearPersonajeCodigo.includes("border-4 border-black"),
    "La tarjeta principal y el botón de inicio deben usar marcos negros sólidos de 4px",
  );
  assert.ok(
    crearPersonajeCodigo.includes("shadow-[6px_6px_0_0_#000]"),
    "La tarjeta principal y la criatura seleccionada deben proyectar sombra ortogonal sólida de 6px",
  );
  assert.ok(
    crearPersonajeCodigo.includes("shadow-[2px_2px_0_0_#000]"),
    "Insignia, botón de escape y campo de entrada deben portar sombras ortogonales sólidas de 2px",
  );
  assert.ok(
    crearPersonajeCodigo.includes("shadow-[4px_4px_0_0_#000]"),
    "Las tarjetas de criatura y el botón de inicio de aventura deben tener sombras ortogonales de 4px",
  );
  assert.ok(
    crearPersonajeCodigo.includes("rounded-none"),
    "Los componentes deben preservar esquinas ortogonales vivas estilo 8-bit",
  );

  // 2. Confinamiento móvil y erradicación de desbordamiento horizontal (360px-420px)
  assert.ok(
    crearPersonajeCodigo.includes("overflow-x-hidden"),
    "El contenedor principal debe confinar el ancho con overflow-x-hidden",
  );
  assert.ok(
    crearPersonajeCodigo.includes("break-words"),
    "Los títulos de criatura deben usar break-words para evitar truncamiento destructivo en móviles",
  );
  assert.ok(
    !crearPersonajeCodigo.includes("truncate"),
    "Se debe erradicar la clase truncate para no amputar nombres de criaturas",
  );

  // 3. Ergonomía táctil y separación de controles
  assert.ok(
    crearPersonajeCodigo.includes("space-y-6 sm:space-y-8"),
    "Las secciones del formulario deben contar con separación vertical clara y holgada",
  );
  assert.ok(
    crearPersonajeCodigo.includes("h-12 sm:h-14"),
    "El botón de acción principal debe disponer de altura táctil ergonómica de 48px-56px",
  );
  assert.ok(
    crearPersonajeCodigo.includes("gap-3 sm:gap-4"),
    "La cabecera superior debe proveer separación generosa entre insignia y botón de escape",
  );
  assert.ok(
    crearPersonajeCodigo.includes("flex-col sm:flex-row items-center justify-between"),
    "El pie de confirmación debe contar con disposición adaptativa en columna/fila para móviles estrechos",
  );
});
