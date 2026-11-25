#!/usr/bin/env node
/**
 * Script reproducible de verificación del API Gateway (Kong DB-less, Subfase 11a).
 * Valida:
 *  1. Rechazo 401 sin cabecera `apikey` (plugin key-auth).
 *  2. Respuesta de preflight CORS OPTIONS desde el origen autorizado de Vite.
 *  3. Proxy autenticado hacia /api/salud en NestJS.
 *  4. Activación de HTTP 429 Too Many Requests y cabeceras X-RateLimit-* en /api/exploracion.
 *
 * Uso:
 *   node scripts/verificar-gateway.mjs
 * Variables opcionales:
 *   URL_GATEWAY (default: http://localhost:8000)
 *   KONG_CLAVE_API (se lee de entorno o .env sin imprimir su valor completo)
 *   ORIGEN_CORS (default: primer origen de CORS_ORIGEN o http://localhost:5173)
 *   LIMITE_MINUTO (default: KONG_EXPLORACION_LIMITE_MINUTO o 5)
 *   TOKEN_JWT (opcional: si se proporciona, envía Authorization: Bearer <TOKEN_JWT>)
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = join(__dirname, "..");

function cargarEnvLocal() {
  const rutaEnv = join(RAIZ_REPO, ".env");
  if (!existsSync(rutaEnv)) return {};

  const resultado = {};
  for (const lineaCruda of readFileSync(rutaEnv, "utf-8").split(/\r?\n/)) {
    const linea = lineaCruda.trim();
    if (!linea || linea.startsWith("#")) continue;
    const indice = linea.indexOf("=");
    if (indice <= 0) continue;
    const clave = linea.slice(0, indice).trim();
    let valor = linea.slice(indice + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    resultado[clave] = valor;
  }
  return resultado;
}

const envLocal = cargarEnvLocal();
const puertoProxy = process.env.KONG_PUERTO_PROXY ?? envLocal.KONG_PUERTO_PROXY ?? "8000";
const urlGateway = (process.env.URL_GATEWAY ?? `http://localhost:${puertoProxy}`).replace(
  /\/+$/,
  "",
);
const claveApi = (process.env.KONG_CLAVE_API ?? envLocal.KONG_CLAVE_API ?? "").trim();
const origenCorsCrudo =
  process.env.ORIGEN_CORS ?? envLocal.CORS_ORIGEN ?? "http://localhost:5173";
const origenCors = origenCorsCrudo.split(",")[0].trim().replace(/\/+$/, "");
const limiteMinuto = Number(
  process.env.LIMITE_MINUTO ?? envLocal.KONG_EXPLORACION_LIMITE_MINUTO ?? "5",
);
const tokenJwt = (process.env.TOKEN_JWT ?? "").trim();

if (!claveApi) {
  console.error("Error: define KONG_CLAVE_API en el entorno o en .env antes de ejecutar este script.");
  process.exit(1);
}

function extraerCabecerasRelevantes(headers) {
  const nombres = [
    "x-ratelimit-limit-minute",
    "x-ratelimit-remaining-minute",
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "retry-after",
    "access-control-allow-origin",
    "access-control-allow-headers",
    "access-control-allow-credentials",
    "access-control-expose-headers",
    "via",
  ];
  const salida = {};
  for (const nombre of nombres) {
    const valor = headers.get(nombre);
    if (valor !== null) {
      salida[nombre] = valor;
    }
  }
  return salida;
}

async function ejecutar() {
  console.log(`=== Verificación Kong DB-less (${urlGateway}) ===`);
  console.log(`Origen CORS probado: ${origenCors}`);
  console.log(`Límite esperado en /api/exploracion: ${limiteMinuto} solicitudes/minuto\n`);

  // 1. key-auth: petición sin cabecera apikey debe responder 401
  const respSinClave = await fetch(`${urlGateway}/api/salud`, {
    method: "GET",
    headers: { Origin: origenCors },
  });
  const cuerpoSinClave = await respSinClave.text();
  console.log(`[1] GET /api/salud SIN apikey -> HTTP ${respSinClave.status}`);
  console.log(`    Cuerpo: ${cuerpoSinClave.trim()}`);
  console.log(
    `    CORS: ${respSinClave.headers.get("access-control-allow-origin") ?? "(no presente)"}\n`,
  );
  if (respSinClave.status !== 401) {
    throw new Error(`Se esperaba HTTP 401 sin apikey, se obtuvo ${respSinClave.status}`);
  }

  // 2. CORS preflight OPTIONS desde Vite sin apikey
  const respPreflight = await fetch(`${urlGateway}/api/exploracion/explorar`, {
    method: "OPTIONS",
    headers: {
      Origin: origenCors,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type,apikey",
    },
  });
  const cabecerasPreflight = extraerCabecerasRelevantes(respPreflight.headers);
  console.log(`[2] OPTIONS /api/exploracion/explorar (preflight) -> HTTP ${respPreflight.status}`);
  console.log(`    Cabeceras CORS: ${JSON.stringify(cabecerasPreflight)}\n`);
  if (respPreflight.status < 200 || respPreflight.status >= 300) {
    throw new Error(`Preflight CORS falló con HTTP ${respPreflight.status}`);
  }
  if (respPreflight.headers.get("access-control-allow-origin") !== origenCors) {
    throw new Error(`Access-Control-Allow-Origin no coincide con ${origenCors}`);
  }

  // 3. Proxy autenticado con apikey hacia /api/salud
  const respSalud = await fetch(`${urlGateway}/api/salud`, {
    method: "GET",
    headers: {
      Origin: origenCors,
      apikey: claveApi,
    },
  });
  const cuerpoSalud = await respSalud.text();
  console.log(`[3] GET /api/salud CON apikey -> HTTP ${respSalud.status}`);
  console.log(`    Cuerpo: ${cuerpoSalud.trim()}`);
  console.log(`    Cabeceras: ${JSON.stringify(extraerCabecerasRelevantes(respSalud.headers))}\n`);
  if (respSalud.status !== 200) {
    throw new Error(
      `Se esperaba HTTP 200 en /api/salud vía Kong (verifica que apps/api esté ejecutándose). Recibido: ${respSalud.status}`,
    );
  }

  // 4. Rate-limiting sobre /api/exploracion (N + 1 solicitudes para provocar 429)
  console.log(`[4] Ráfaga de ${limiteMinuto + 1} solicitudes POST /api/exploracion CON apikey:`);
  let obtuvo429 = false;
  let cabeceras429 = null;

  for (let intento = 1; intento <= limiteMinuto + 1; intento += 1) {
    const headers = {
      "Content-Type": "application/json",
      Origin: origenCors,
      apikey: claveApi,
    };
    if (tokenJwt) {
      headers.Authorization = `Bearer ${tokenJwt}`;
    }

    const resp = await fetch(`${urlGateway}/api/exploracion`, {
      method: "POST",
      headers,
      body: "{}",
    });
    const cuerpo = (await resp.text()).trim();
    const cabeceras = extraerCabecerasRelevantes(resp.headers);

    console.log(
      `    Intento ${intento}/${limiteMinuto + 1} -> HTTP ${resp.status} | X-RateLimit-Limit-Minute=${cabeceras["x-ratelimit-limit-minute"] ?? "-"} | X-RateLimit-Remaining-Minute=${cabeceras["x-ratelimit-remaining-minute"] ?? "-"} | Retry-After=${cabeceras["retry-after"] ?? "-"} | Cuerpo=${cuerpo}`,
    );

    if (resp.status === 429) {
      obtuvo429 = true;
      cabeceras429 = cabeceras;
    }
  }

  if (!obtuvo429) {
    throw new Error("No se activó HTTP 429 Too Many Requests tras superar el límite configurado.");
  }

  console.log("\n=== Resumen HTTP 429 confirmado ===");
  console.log(JSON.stringify(cabeceras429, null, 2));
  console.log("\nVerificación completada correctamente.");
}

ejecutar().catch((error) => {
  console.error(`\nFallo en verificación de gateway: ${error.message}`);
  process.exit(1);
});
