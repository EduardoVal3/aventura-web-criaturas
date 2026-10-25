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

