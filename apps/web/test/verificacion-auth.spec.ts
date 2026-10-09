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
