# 10. Extras Técnicos: Gestión de APIs con Kong API Gateway (Subfase 11a)

> **Requisitos cubiertos:** `X-API` (+2 puntos opcionales — Gestión de APIs mediante API Manager).  
> **Rama de trabajo:** `configuracion/fase-11a-api-gateway` (originada desde `desarrollo`).  
> **Diagrama asociado:** [`docs/diagramas/arquitectura-con-gateway.mmd`](../diagramas/arquitectura-con-gateway.mmd).

---

## 1. Problema que Resuelve
En la arquitectura base (Fases 4 a 10), el Front-End (`http://localhost:5173`) consumía directamente los endpoints del servidor NestJS (`http://localhost:3000`). Exponer el servidor de aplicación sin una capa intermedia de *API Management* presentaba tres limitaciones:
1. **Ausencia de límites de consumo:** Un cliente o script automatizado podía enviar ráfagas de peticiones repetidas a rutas costosas (como `POST /api/exploracion`) saturando el servidor y PostgreSQL.
2. **Sin control de acceso por consumidor:** No existía validación previa de clave de aplicación (`apikey`) antes de alcanzar los controladores de NestJS.
3. **Administración y monitoreo acoplados:** Políticas transversales como CORS, trazabilidad de peticiones (`X-Request-ID`) y registro centralizado de tráfico dependían únicamente del código de aplicación.

---

## 2. Solución Implementada: Kong API Gateway en Modo DB-less
Se integró **Kong 3.8** en modo **DB-less** (configuración declarativa versionada en `kong.yml`, sin requerir una segunda base de datos) dentro de `docker-compose.yml` bajo el perfil opcional `gateway`.

### 2.1 Flujo de Peticiones
1. El cliente web (`apps/web`) apunta al puerto del Gateway mediante `VITE_URL_API=http://localhost:8000` y envía el encabezado `apikey` configurado en `VITE_API_KEY`.
2. **Kong (`:8000`)** intercepta toda petición dirigida a `/api/*` y evalúa sus políticas antes de reenviarla a NestJS (`http://host.docker.internal:3000`).
3. **Admin API (`http://127.0.0.1:8001`)** permite consultar en vivo los servicios, rutas, consumidores y plugins activos.
4. **Compatibilidad sin conflictos:** Al usar `profiles: ["gateway"]` en `docker-compose.yml` y hacer opcional `VITE_API_KEY` en `apiHttp.ts`, cualquier integrante del equipo puede seguir ejecutando `pnpm dev` directo contra `:3000` sin verse afectado.

---

## 3. Políticas Activas en `kong.yml`

| Política / Plugin | Alcance | Configuración Aplicada | Propósito en el Proyecto |
| :--- | :--- | :--- | :--- |
| **`key-auth`** | Servicio `aethelgard-api` | Header `apikey` (`consumidor: web-aethelgard`), `run_on_preflight: false` | Bloquea peticiones externas sin clave válida con `401 Unauthorized` sin tocar NestJS ni romper `OPTIONS` CORS. |
| **`rate-limiting`** (estricto) | Ruta `/api/exploracion` | `10` peticiones por minuto (`policy: local`, `hide_client_headers: false`) | Previene abuso/spam en exploración y permite demostrar `429 Too Many Requests` y cabeceras `X-RateLimit-*`. |
| **`rate-limiting`** (general) | Ruta `/api` | `120` peticiones por minuto (`policy: local`) | Protege el resto de la API REST sin afectar la fluidez normal del juego. |
| **`cors`** | Servicio `aethelgard-api` | Origen `http://localhost:5173`, expone `X-RateLimit-*` y `X-Request-ID` | Permite que el navegador lea las cabeceras de cuota y trazabilidad emitidas por Kong. |
| **`correlation-id`** | Servicio `aethelgard-api` | Header `X-Request-ID` (`uuid#counter`, `echo_downstream: true`) | Asigna un identificador único a cada petición para trazabilidad de extremo a extremo. |
| **`file-log`** | Servicio `aethelgard-api` | Salida `/dev/stdout` | Centraliza los logs JSON de acceso, estado HTTP y latencia en la salida del contenedor `aventura-kong`. |

---

## 4. Cómo se Ve Implementado en el Repositorio

### Archivos agregados y modificados
- **[`kong.yml`](../../kong.yml):** Definición declarativa del servicio `aethelgard-api`, rutas (`ruta-exploracion` y `ruta-api-general`), consumidor `web-aethelgard` y los 5 bloques de plugins.
- **[`docker-compose.yml`](../../docker-compose.yml):** Servicio `kong` (`kong:3.8`) con `KONG_DATABASE=off`, montaje read-only de `kong.yml`, puertos `8000:8000` (Proxy) y `127.0.0.1:8001:8001` (Admin API), `host.docker.internal` y *healthcheck*.
- **[`package.json`](../../package.json):** Nuevo script `dev:gateway` que levanta PostgreSQL + Kong (`docker compose --profile gateway up -d`) y arranca `api` y `web` en paralelo.
- **[`apps/web/src/api/apiHttp.ts`](../../apps/web/src/api/apiHttp.ts):** Envía automáticamente el header `apikey` cuando `VITE_API_KEY` está definido y traduce respuestas `429` del Gateway al código `LIMITE_TASA_EXCEDIDO` con mensaje claro en español.
- **[`apps/web/src/vite-env.d.ts`](../../apps/web/src/vite-env.d.ts) y [`apps/web/.env.example`](../../apps/web/.env.example):** Tipado de `VITE_API_KEY` y plantilla documentada para alternar entre `:3000` (directo) y `:8000` (Kong).

---

## 5. Cómo Arrancarlo y Demostrarlo en Vivo (Guía de Verificación)

> **Prerrequisito:** Tener **Docker Desktop** en ejecución.

1. **Configurar `apps/web/.env` para pasar por Kong:**
   ```env
   VITE_MODO_API=http
   VITE_URL_API=http://localhost:8000
   VITE_API_KEY=aethelgard-clave-gateway-dev-2026
   ```

2. **Levantar PostgreSQL + Kong + API + Web:**
   ```powershell
   pnpm.cmd dev:gateway
   ```

3. **Probar Control de Acceso (`401 Unauthorized` sin `apikey`):**
   ```powershell
   curl.exe -i http://localhost:8000/api/salud
   # Respuesta esperada de Kong: HTTP/1.1 401 Unauthorized ("No API key found in request")
   ```

4. **Probar Petición Autorizada + Cabeceras de Cuota y Trazabilidad (`200 OK`):**
   ```powershell
   curl.exe -i -H "apikey: aethelgard-clave-gateway-dev-2026" http://localhost:8000/api/salud
   # Respuesta esperada: HTTP/1.1 200 OK
   # Incluye cabeceras: X-RateLimit-Limit-Minute: 120, X-RateLimit-Remaining-Minute: 119, X-Request-ID: ...
   ```

5. **Probar Límite de Consumo (`429 Too Many Requests` en `/api/exploracion`):**
   ```powershell
   1..12 | ForEach-Object {
     curl.exe -s -o NUL -w "Intento $_ -> HTTP %{http_code}\n" -X POST -H "apikey: aethelgard-clave-gateway-dev-2026" http://localhost:8000/api/exploracion
   }
   # Los primeros 10 intentos pasan hacia NestJS (401 JWT si no hay token);
   # A partir del intento 11, Kong bloquea con: HTTP 429
   ```

6. **Inspeccionar Administración Centralizada y Logs en Tiempo Real:**
   ```powershell
   # Ver servicios y plugins activos desde la Admin API de Kong:
   curl.exe http://localhost:8001/services
   curl.exe http://localhost:8001/plugins

   # Ver monitoreo/logs de tráfico en tiempo real:
   docker compose --profile gateway logs -f kong
   ```
