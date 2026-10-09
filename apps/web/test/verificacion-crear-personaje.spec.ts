import test from "node:test";
import assert from "node:assert/strict";
import { esquemaCrearPersonaje } from "../src/lib/esquemas-auth.ts";
import { OPCIONES_CRIATURAS } from "../src/lib/criaturas-iniciales.ts";
import { obtenerImagenCriatura, RUTAS_PLACEHOLDERS } from "../src/lib/assets.ts";

test("Esquema de creación de personaje valida nombres correctamente", () => {
  // Rechaza nombres con menos de 3 caracteres
  const resultadoCorto = esquemaCrearPersonaje.safeParse({
    nombre: "Al",
    especieInicialSlug: "lobo-gris",
  });
  assert.strictEqual(resultadoCorto.success, false);

  // Rechaza nombres solo con espacios en blanco (gracias a .trim())
  const resultadoEspacios = esquemaCrearPersonaje.safeParse({
    nombre: "   ",
    especieInicialSlug: "lobo-gris",
  });
  assert.strictEqual(resultadoEspacios.success, false);

  // Acepta nombres válidos y recorta espacios
  const resultadoValido = esquemaCrearPersonaje.safeParse({
    nombre: "  Arturo de Sendas  ",
    especieInicialSlug: "lobo-gris",
  });
  assert.strictEqual(resultadoValido.success, true);
  if (resultadoValido.success) {
    assert.strictEqual(resultadoValido.data.nombre, "Arturo de Sendas");
  }
});

test("Esquema de creación de personaje valida las 3 criaturas iniciales autorizadas", () => {
  const criaturasValidas = ["lobo-gris", "pico-de-hacha", "arana-lobo-gigante"] as const;

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
