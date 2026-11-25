import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  construirEncabezadosApi,
  normalizarUrlBaseApi,
  resolverErrorRespuestaHttp,
} from "../src/api/apiHttp.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = join(__dirname, "../../..");

test("apiHttp omite cabecera apikey cuando VITE_CLAVE_GATEWAY no está definida (local directo y nube)", () => {
  const sinClave = construirEncabezadosApi(null, undefined);
  assert.deepStrictEqual(sinClave, { "Content-Type": "application/json" });
  assert.strictEqual("apikey" in sinClave, false);

  const claveVacia = construirEncabezadosApi("jwt-demo", "   ");
  assert.deepStrictEqual(claveVacia, {
    "Content-Type": "application/json",
    Authorization: "Bearer jwt-demo",
  });
  assert.strictEqual("apikey" in claveVacia, false);
});

test("apiHttp incluye cabecera apikey recortada cuando VITE_CLAVE_GATEWAY está definida", () => {
  const conClave = construirEncabezadosApi("jwt-demo", "  clave-gateway-prueba  ");
  assert.deepStrictEqual(conClave, {
    "Content-Type": "application/json",
    apikey: "clave-gateway-prueba",
    Authorization: "Bearer jwt-demo",
  });
});

test("apiHttp normaliza VITE_URL_API y traduce respuestas HTTP 429 de Kong a español", () => {
  assert.strictEqual(normalizarUrlBaseApi("http://localhost:8000///"), "http://localhost:8000");

  const errorLimite = resolverErrorRespuestaHttp(429, { message: "API rate limit exceeded" });
  assert.strictEqual(errorLimite.codigo, "LIMITE_SOLICITUDES");
  assert.ok(errorLimite.mensaje.toLowerCase().includes("límite"));

  const errorApiNest = resolverErrorRespuestaHttp(409, {
    error: { codigo: "ENCUENTRO_ACTIVO", mensaje: "Ya tienes un encuentro en curso." },
  });
  assert.deepStrictEqual(errorApiNest, {
    codigo: "ENCUENTRO_ACTIVO",
    mensaje: "Ya tienes un encuentro en curso.",
  });
});

test("Infraestructura Kong DB-less está declarada sin secretos hardcodeados y sin romper postgres", () => {
  const compose = readFileSync(join(RAIZ_REPO, "docker-compose.yml"), "utf-8");
  assert.ok(compose.includes("kong:"));
  assert.ok(compose.includes("image: kong:3.9"));
  assert.ok(compose.includes('KONG_DATABASE: "off"'));
  assert.ok(compose.includes("host.docker.internal:host-gateway"));
  // No usar :? en KONG_CLAVE_API para no bloquear `docker compose up -d postgres` en pnpm dev
  assert.strictEqual(compose.includes("${KONG_CLAVE_API:?"), false);

  const rutaPlantilla = join(RAIZ_REPO, "kong/kong.yml.plantilla");
  assert.strictEqual(existsSync(rutaPlantilla), true);
  const plantilla = readFileSync(rutaPlantilla, "utf-8");
  assert.ok(plantilla.includes('_format_version: "3.0"'));
  assert.ok(plantilla.includes("/api/exploracion"));
  assert.ok(plantilla.includes("strip_path: false"));
  assert.ok(plantilla.includes("name: key-auth"));
  assert.ok(plantilla.includes("run_on_preflight: false"));
  assert.ok(plantilla.includes("hide_credentials: true"));
  assert.ok(plantilla.includes("name: rate-limiting"));
  assert.ok(plantilla.includes("policy: local"));
  assert.ok(plantilla.includes("hide_client_headers: false"));
  assert.ok(plantilla.includes("name: cors"));
  assert.ok(plantilla.includes('key: "__KONG_CLAVE_API__"'));

  const envRaiz = readFileSync(join(RAIZ_REPO, ".env.example"), "utf-8");
  assert.ok(envRaiz.includes("KONG_CLAVE_API="));
  assert.ok(envRaiz.includes("KONG_EXPLORACION_LIMITE_MINUTO="));

  const envWeb = readFileSync(join(RAIZ_REPO, "apps/web/.env.example"), "utf-8");
  assert.ok(envWeb.includes("VITE_CLAVE_GATEWAY"));
});
