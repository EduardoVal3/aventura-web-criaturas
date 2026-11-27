# Informe Técnico - Fase 11: Extras de Puntos (API Gateway y Auditoría UI)

Este capítulo documenta los extras opcionales implementados tras el cierre de la Fase 10 sobre *Aethelgard: Sendas y Criaturas*. Se divide en dos subfases independientes según el plan de desarrollo:
- **Subfase 11a (`X-API`, +2 pts):** API Gateway en modo DB-less con **Kong Gateway 3.9.5** (`configuracion/fase-11a-api-gateway`). ✅ **Completada.**
- **Subfase 11b (`X-UI`, +3 pts):** Auditoría funcional y lista de verificación de **8bitcn/ui** (`funcionalidad/fase-11b-auditoria-ui`). ✅ **Completada.**

---

## 1. Subfase 11a: API Gateway con Kong DB-less (`X-API`, +2 pts)

### 1.1 Diagnóstico Inicial y Objetivo Arquitectónico

Tras consolidar la seguridad de aplicación (`S-1` a `S-7` en NestJS) y la experiencia interactiva de la Fase 10, toda petición HTTP del cliente (`apps/web`) alcanzaba directamente el servidor `apps/api` sin una capa perimetral de gestión de tráfico, autenticación por cliente consumidor ni control de tasa (*rate limiting*) frente a ráfagas sobre el módulo de exploración probabilística (`/api/exploracion`).

Para cubrir el requisito **`X-API (+2)`** y reforzar **`A-9`** sin penalizar el entorno local directo (`pnpm dev` / `pnpm dev:local`) ni el despliegue gratuito en nube (`Cloudflare Pages + Render Free + Neon`), se integró un **API Gateway declarativo con Kong Gateway OSS (`kong:3.9`, versión verificada `3.9.5`)** en modo **DB-less** (`KONG_DATABASE=off`), precediendo a `apps/api`.

> **Nota de validación académica:** Confirmar con el ingeniero Claudio que un API Gateway declarativo (Kong DB-less con autenticación por clave de consumidor `key-auth`, control de consumo `rate-limiting`, políticas `cors` y trazabilidad de acceso en logs) califica formalmente como «API Manager» dentro del criterio `X-API (+2)`.

---

### 1.2 Arquitectura y Configuración Declarativa Implementada

El diagrama de flujo perimetral validado mediante MCP Mermaid se encuentra en [arquitectura-con-gateway.mmd](../diagramas/arquitectura-con-gateway.mmd).

#### A. Orquestación Docker sin Secretos Versionados (`docker-compose.yml` y `kong/kong.yml.plantilla`)
- **Imagen oficial OSS:** `kong:3.9` (ejecutando `Kong 3.9.5`, Apache 2.0, sin licencia Enterprise).
- **Modo DB-less (`KONG_DATABASE=off`):** toda la topología reside en memoria a partir de configuración declarativa `_format_version: "3.0"`, evitando gestionar una segunda instancia de base de datos exclusiva para el gateway.
- **Conectividad al Back-End:** el contenedor `aventura-kong` expone el proxy en `${KONG_PUERTO_PROXY:-8000}:8000`, acota la Admin API de solo lectura a loopback `127.0.0.1:${KONG_PUERTO_ADMIN:-8001}:8001` y enruta hacia `apps/api` mediante `extra_hosts: ["host.docker.internal:host-gateway"]` y `KONG_UPSTREAM_URL` (por defecto `http://host.docker.internal:3000`).
- **Blindaje de secretos (`S-7` y `R1`):** el archivo versionado [kong/kong.yml.plantilla](../../kong/kong.yml.plantilla) contiene únicamente marcadores (`__KONG_CLAVE_API__`, `__KONG_UPSTREAM_URL__`, `__KONG_CORS_ORIGENES_YAML__`, `__KONG_EXPLORACION_LIMITE_MINUTO__`). Al arrancar `aventura-kong`, su `entrypoint` exige que `KONG_CLAVE_API` esté definida en `.env`, sanea `CORS_ORIGEN` rechazando el comodín `*`, genera `/tmp/kong.yml` efímero dentro del contenedor, lo valida con `kong config parse /tmp/kong.yml` y lanza `kong docker-start`.
- **Compatibilidad total con `pnpm dev`:** en `docker-compose.yml`, `KONG_CLAVE_API` se declara con `${KONG_CLAVE_API:-}` y se valida dentro del propio contenedor `kong`, de modo que `docker compose up -d postgres` nunca falla en equipos que aún no activan el gateway.

#### B. Rutas y Plugins Declarativos (`kong/kong.yml.plantilla`)

| Entidad / Plugin | Ámbito | Configuración clave | Propósito |
| :--- | :--- | :--- | :--- |
| Servicio `aethelgard-api` | Global API | `url: __KONG_UPSTREAM_URL__` | Apunta a `apps/api` (`:3000`). |
| Ruta `ruta-exploracion` | Servicio | `paths: ["/api/exploracion"]`, `strip_path: false` | Cubre `POST /api/exploracion` y `POST /api/exploracion/explorar` conservando el prefijo `/api`. |
| Ruta `ruta-api-general` | Servicio | `paths: ["/api"]`, `strip_path: false` | Enruta el resto de endpoints REST sin alterar rutas de NestJS. |
| Plugin `cors` | Servicio | `origins: [__KONG_CORS_ORIGENES_YAML__]`, `credentials: true`, `headers: [Accept, Authorization, Content-Type, apikey]`, `exposed_headers: [X-RateLimit-*, RateLimit-*, Retry-After]`, `preflight_continue: false` | Permite peticiones desde Vite (`http://localhost:5173`) sin comodín `*` y responde `OPTIONS` preflight sin consumir cuota. |
| Plugin `key-auth` | Servicio | `key_names: [apikey]`, `key_in_header: true`, `key_in_query: false`, `key_in_body: false`, `hide_credentials: true`, `run_on_preflight: false` | Autentica al consumidor `cliente-web-aethelgard`, rechaza peticiones sin clave con `401` y oculta la credencial antes de reenviar a NestJS. |
| Plugin `rate-limiting` | `ruta-exploracion` | `minute: 5` (configurable vía `KONG_EXPLORACION_LIMITE_MINUTO`), `policy: local`, `limit_by: consumer`, `hide_client_headers: false`, `fault_tolerant: true` | Limita ráfagas de exploración por consumidor, emite cabeceras `X-RateLimit-*` / `RateLimit-*` y bloquea con `HTTP 429` + `Retry-After`. |
| Observabilidad | Contenedor | `KONG_PROXY_ACCESS_LOG=/dev/stdout`, `KONG_PROXY_ERROR_LOG=/dev/stderr`, `healthcheck: ["CMD", "kong", "health"]` | Trazabilidad por `kong_request_id` inspeccionable con `docker compose logs kong` y MCP Docker. |

#### C. Integración Opcional en Front-End (`apps/web`)
- [apps/web/src/api/apiHttp.ts](../../apps/web/src/api/apiHttp.ts): se extrajeron los helpers puros `normalizarUrlBaseApi`, `construirEncabezadosApi` y `resolverErrorRespuestaHttp`.
  - Cuando `VITE_CLAVE_GATEWAY` está definida, `construirEncabezadosApi` adjunta `apikey: <clave>` junto con `Authorization: Bearer <token>`.
  - Cuando `VITE_CLAVE_GATEWAY` no está definida (modo directo `:3000` o despliegue nube Cloudflare Pages + Render Free), la cabecera `apikey` **no se emite**, preservando compatibilidad 100 %.
  - Ante una respuesta `HTTP 429 Too Many Requests` emitida por Kong (`{"message":"API rate limit exceeded"}`), `resolverErrorRespuestaHttp` la traduce a `codigo: "LIMITE_SOLICITUDES"` y mensaje en español para la interfaz (`R1`).
- Tipado actualizado en [apps/web/src/vite-env.d.ts](../../apps/web/src/vite-env.d.ts) y variables documentadas en [.env.example](../../.env.example) y [apps/web/.env.example](../../apps/web/.env.example).

---

### 1.3 Evidencia Reproducible (Estado Docker, HTTP 429, Cabeceras y Logs de Kong)

La verificación completa puede reproducirse en cualquier entorno ejecutando:
```bash
docker compose up -d postgres kong
docker compose ps
node scripts/verificar-gateway.mjs
docker compose logs --tail=20 kong
```

#### 1. Contenedores saludables (`docker compose ps` y MCP Docker `list_containers`)
```text
NAME                IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
aventura-kong       kong:3.9             "/bin/sh -eu -c 'if …"   kong       56 seconds ago   Up 55 seconds (healthy)   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 127.0.0.1:8001->8001/tcp
aventura-postgres   postgres:17-alpine   "docker-entrypoint.s…"   postgres   9 days ago       Up 54 seconds (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

Verificación de modo DB-less en Admin API local (`http://localhost:8001/`):
```text
Kong version: 3.9.5 | database: off
```

#### 2. Captura real de `key-auth`, CORS preflight, proxy `/api/salud` y `HTTP 429` (`node scripts/verificar-gateway.mjs`)
```text
=== Verificación Kong DB-less (http://localhost:8000) ===
Origen CORS probado: http://localhost:5173
Límite esperado en /api/exploracion: 5 solicitudes/minuto

[1] GET /api/salud SIN apikey -> HTTP 401
    Cuerpo: {
  "message":"No API key found in request",
  "request_id":"aa728102cc684a0b1c6bf03bb5d9b173"
}
    CORS: http://localhost:5173

[2] OPTIONS /api/exploracion/explorar (preflight) -> HTTP 200
    Cabeceras CORS: {"access-control-allow-origin":"http://localhost:5173","access-control-allow-headers":"Accept,Authorization,Content-Type,apikey","access-control-allow-credentials":"true"}

[3] GET /api/salud CON apikey -> HTTP 200
    Cuerpo: {"estado":"disponible","marcaTiempo":"2026-11-25T17:51:25.763Z","version":"0.1.0"}
    Cabeceras: {"access-control-allow-origin":"http://localhost:5173","access-control-allow-credentials":"true","access-control-expose-headers":"X-RateLimit-Limit-Minute,X-RateLimit-Remaining-Minute,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset,Retry-After","via":"1.1 kong/3.9.5"}

[4] Ráfaga de 6 solicitudes POST /api/exploracion CON apikey:
    Intento 1/6 -> HTTP 401 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=4 | Retry-After=- | Cuerpo={"error":{"codigo":"NO_AUTORIZADO","mensaje":"Token de autenticación faltante o no provisto."}}
    Intento 2/6 -> HTTP 401 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=3 | Retry-After=- | Cuerpo={"error":{"codigo":"NO_AUTORIZADO","mensaje":"Token de autenticación faltante o no provisto."}}
    Intento 3/6 -> HTTP 401 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=2 | Retry-After=- | Cuerpo={"error":{"codigo":"NO_AUTORIZADO","mensaje":"Token de autenticación faltante o no provisto."}}
    Intento 4/6 -> HTTP 401 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=1 | Retry-After=- | Cuerpo={"error":{"codigo":"NO_AUTORIZADO","mensaje":"Token de autenticación faltante o no provisto."}}
    Intento 5/6 -> HTTP 401 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=0 | Retry-After=- | Cuerpo={"error":{"codigo":"NO_AUTORIZADO","mensaje":"Token de autenticación faltante o no provisto."}}
    Intento 6/6 -> HTTP 429 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=0 | Retry-After=35 | Cuerpo={
  "message":"API rate limit exceeded",
  "request_id":"9e34972eca612a48a9dce86369b94932"
}

=== Resumen HTTP 429 confirmado ===
{
  "x-ratelimit-limit-minute": "5",
  "x-ratelimit-remaining-minute": "0",
  "ratelimit-limit": "5",
  "ratelimit-remaining": "0",
  "ratelimit-reset": "35",
  "retry-after": "35",
  "access-control-allow-origin": "http://localhost:5173",
  "access-control-allow-credentials": "true",
  "access-control-expose-headers": "X-RateLimit-Limit-Minute,X-RateLimit-Remaining-Minute,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset,Retry-After"
}
```

Comprobación adicional del alias utilizado por `apiHttp.ts` (`POST /api/exploracion/explorar`):
```text
POST /api/exploracion/explorar -> HTTP 429 | X-RateLimit-Limit-Minute=5 | X-RateLimit-Remaining-Minute=0 | Retry-After=16
```

> **Observación de arquitectura:** Los intentos 1 a 5 demuestran la doble capa de defensa: Kong valida `apikey`, descuenta la cuota (`4 → 0`) y reenvía la petición a NestJS, donde `AutenticacionGuard` exige el Bearer JWT (`401 NO_AUTORIZADO`). Al 6.º intento, Kong intercepta el tráfico antes de tocar NestJS respondiendo `HTTP 429 Too Many Requests`.

#### 3. Logs reales capturados desde `aventura-kong` (vía MCP Docker `container_logs`)
```text
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "GET /api/salud HTTP/1.1" 401 96 "-" "node" kong_request_id: "aa728102cc684a0b1c6bf03bb5d9b173"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "OPTIONS /api/exploracion/explorar HTTP/1.1" 200 0 "-" "node" kong_request_id: "ca84b203cb14ae383a638f213ecf1958"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "GET /api/salud HTTP/1.1" 200 82 "-" "node" kong_request_id: "c02dea408968b50fc2b06d2054efe259"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 401 96 "-" "node" kong_request_id: "f58a1f43c518886a08814403ba4bd005"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 401 96 "-" "node" kong_request_id: "be79997e6f5391275b807e315d1f894c"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 401 96 "-" "node" kong_request_id: "c0d3871cdba0c45653aaba405aa8b518"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 401 96 "-" "node" kong_request_id: "7b36f3277bfb1872b30d2c728156c56a"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 401 96 "-" "node" kong_request_id: "4990b56dd2cb4c23adf6390cf4023770"
172.23.0.1 - - [25/Nov/2026:17:51:25 +0000] "POST /api/exploracion HTTP/1.1" 429 92 "-" "node" kong_request_id: "9e34972eca612a48a9dce86369b94932"
```

Nótese la correlación exacta entre el `request_id: "9e34972eca612a48a9dce86369b94932"` del cuerpo JSON `429` y el campo `kong_request_id` del registro de acceso en `aventura-kong`.

---

### 1.4 Verificación de Calidad y Cero Regresiones

| Validación | Comando ejecutado | Resultado |
| :--- | :--- | :--- |
| Pruebas unitarias Front-End (incluye [verificacion-gateway.spec.ts](../../apps/web/test/verificacion-gateway.spec.ts) y [verificacion-despliegue.spec.ts](../../apps/web/test/verificacion-despliegue.spec.ts)) | `pnpm --filter web test` | **110 / 110 aprobadas** (0 fallos) |
| Compilación TypeScript estricta y empaquetado Vite | `pnpm --filter web build` | **Exitosa** (`tsc -b && vite build`, 8.22 s) |
| Linter estático Front-End | `pnpm --filter web lint` | **0 errores** |
| Pruebas unitarias Back-End (reglas de negocio, bestiario, combate y progreso) | `pnpm --filter api test` | **134 / 134 aprobadas** (42 suites, 0 fallos) |
| Compilación Back-End NestJS + Prisma | `pnpm --filter api build` | **Exitosa** (`prisma generate && nest build`) |
| Validación sintáctica y renderizado del diagrama Mermaid | MCP `mermaid` (`generate`) sobre `docs/diagramas/arquitectura-con-gateway.mmd` | **SVG válido generado sin errores** |
| Verificación en vivo de Kong DB-less (`401`, CORS, `200`, `429`, logs) | `docker compose up -d postgres kong` + `node scripts/verificar-gateway.mjs` + MCP Docker | **Aprobada integralmente** |

---

## 2. Subfase 11b: Auditoría Funcional de Interfaz Estilo Videojuego con `8bitcn/ui` (`X-UI`, +3 pts)

### 2.1 Justificación de la Librería Especializada (`8bitcn/ui`)

El requisito adicional **`X-UI (+3 puntos)`** (§19 del enunciado oficial) solicita desarrollar una interfaz cercana a un videojuego utilizando una librería o framework CSS especializado —citando como ejemplos *RPGUI*, *NES.css* o una alternativa equivalente— integrada funcionalmente al juego, visualmente consistente y responsive.

Como se fundamenta en la decisión técnica **`D-06`** ([decisiones.md](../decisiones.md)) y en el sistema de diseño retro ([DESIGN.md](../DESIGN.md)), se adoptó **`8bitcn/ui`** (`https://www.8bitcn.com/docs`, licencia MIT) sobre **shadcn/ui + Radix UI + Tailwind CSS v4**, instalada en `apps/web/src/components/ui/8bit/`. Frente a librerías CSS estáticas clásicas como NES.css, `8bitcn/ui` aporta:
- **Componentes nativos de RPG** (`health-bar`, `enemy-health-display`, `xp-bar`, `progress`, `dialog`, `alert-dialog`) con estética pixel-art/8-bit y bordes escalonados auténticos.
- **Accesibilidad moderna heredada de Radix UI** (foco de teclado, cierre con `Escape`, atributos ARIA y portales seguros en modales).
- **Integración directa con React 19 y TypeScript estricto** sin sacrificar tipado ni diseño responsive móvil.

---

### 2.2 Matriz Verificada de Integración Funcional por Pantalla

La auditoría directa sobre el árbol de código fuente (`apps/web/src/`) confirma la presencia de **17 componentes `8bitcn/ui`** en `apps/web/src/components/ui/8bit/` integrados de forma funcional a lo largo de **15 pantallas y 4 componentes territoriales**:

| Pantalla / Módulo (`apps/web/src/`) | Componentes `8bitcn/ui` integrados | Uso funcional verificado en el juego |
| :--- | :--- | :--- |
| `paginas/PantallaCombate.tsx` | `health-bar`, `xp-bar`, `dialog`, `alert-dialog`, `badge`, `button`, `spinner` | Arena de combate por turnos: barras de vida aliada y rival, progreso de XP, badges elementales/estados, confirmación de huida (`alert-dialog`), selector modal de captura/pociones (`dialog`) y acciones bloqueadas con `spinner`. |
| `paginas/PantallaExploracion.tsx` | `dialog`, `progress`, `badge`, `button`, `skeleton` | Exploración probabilística de sendas, barra de avance cartográfico (`progress`), modales de avistamiento de criatura/botín (`dialog`) y esqueletos de carga (`skeleton`). |
| `paginas/PantallaHubUbicacion.tsx` + `components/mundo/` (`BannerUbicacionActual`, `TarjetaSenderoConexion`, `MinimapaRedTerritorial`, `TransicionViaje2D`) | `dialog`, `alert-dialog`, `progress`, `badge`, `button`, `skeleton` | Hub central y mapa interactivo de Aethelgard: progreso de zona, tarjetas de conexión, modales de requisitos de desbloqueo y viaje (`alert-dialog`/`dialog`) y chips de riesgo táctico (`badge`). |
| `paginas/PantallaEquipo.tsx` | `card`, `health-bar`, `xp-bar`, `badge`, `button`, `skeleton`, `spinner` | Gestión del equipo activo (máx. 6, `A-6`), tarjetas de criaturas con HP y XP en tiempo real y reordenamiento del líder. |
| `paginas/PantallaAlmacen.tsx` | `card`, `dialog`, `health-bar`, `xp-bar`, `badge`, `button`, `skeleton`, `spinner` | Reserva de criaturas capturadas y modal de intercambio atómico con el equipo activo (`dialog`). |
| `paginas/PantallaInventario.tsx` | `card`, `dialog`, `health-bar`, `badge`, `button`, `spinner` | Bolsa de 20 ranuras, filtros táctiles y modal de curación fuera de combate con vista previa de HP (`health-bar` + `INV-03`). |
| `paginas/PantallaTienda.tsx` | `card`, `dialog`, `badge`, `button`, `spinner` | Bazar de provisiones con selector de lotes (`x1`, `x5`, `x10`) y confirmación modal de compra (`dialog`). |
| `paginas/PantallaCuracion.tsx` | `card`, `health-bar`, `badge`, `button`, `spinner` | Santuario de curación gratuita con estado vital del equipo (`health-bar`) y restauración integral. |
| `paginas/PantallaCatalogo.tsx` | `card`, `dialog`, `progress`, `badge`, `button`, `skeleton` | Compendio de las 30 especies canónicas agrupadas por zona, medidores de estadísticas (`progress`) y ficha detallada (`dialog`). |
| `paginas/PantallaHistorial.tsx` | `card`, `badge`, `button`, `input`, `skeleton` | Crónicas del explorador con búsqueda textual (`input`) y filtros por categoría (`badge`/`button`). |
| `paginas/PantallaIngreso.tsx`, `PantallaRegistro.tsx` y `PantallaCrearPersonaje.tsx` | `card`, `input`, `label`, `badge`, `button`, `spinner` | Flujos de autenticación y selección de criatura inicial con validación nativa y estados de envío protegidos. |
| `paginas/PaginaCreditos.tsx` | `card`, `badge`, `button` | Atribución legal CC BY 4.0 de Open5e SRD 5.2, créditos del equipo y stack retro. |
| `paginas/PaginaKitUi.tsx` (ruta `/kit-ui`) | **Todos los 17 componentes** (incluyendo `enemy-health-display`, `select`, `table`, `tabs`, `toast`) | Vitrina interactiva completa del sistema de diseño retro para inspección rápida durante la demostración. |

---

### 2.3 Lista de Verificación de Consistencia, Responsive y Ergonomía (Auditada en Fase 10 + 11b)

- [x] **Cohesión estética retro-brutalista (`docs/DESIGN.md`):** paleta Aethelgard HSL unificada, sombras sólidas 8-bit, tipografía `Press Start 2P` para jerarquía arcade y `Geist` para lectura clara.
- [x] **Cero emojis unicode en interfaz (`R1`):** 100 % de la iconografía en controles, estados alterados, insignias legendarias y navegación emplea SVG vectoriales de `lucide-react` (validado automáticamente por pruebas unitarias en todas las pantallas principales).
- [x] **Diseño responsive sin desbordamiento horizontal (`320 px` a escritorio):** modales sellados con `w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden`, cabecera en fila única accesible en móvil, cuadrículas adaptativas y safe-area verificada en Fase 10.
- [x] **Arte multimedia pixel-art optimizado (`D-19` a `D-21`):** 30 sprites de criaturas (`512×512` WebP RGBA con `.pixelated`), 9 escenas de zonas, 6 arenas de combate (`800×450` WebP) y 4 objetos (`256×256` WebP), con fallbacks SVG deterministas.
- [x] **Retroalimentación sensorial y accesibilidad:** síntesis procedural de audio 8-bit vía Web Audio API en `assets.ts` (combate, captura, eficacia elemental, victoria, compra, santuario) y respeto a `@media (prefers-reduced-motion: reduce)`.
- [x] **Hardening de interacción:** protección contra doble clic (`aria-busy`, deshabilitación reactiva y cerrojo `useRef` en combate) y manejo limpio de estados vacíos/carga (`skeleton`, `spinner`).
- [x] **Cero impacto en producción:** esta auditoría documental no modifica código de producción ni archivos de estilos ya pulidos en Fase 10; mantiene intactas las **110 pruebas unitarias web**, las **134 pruebas unitarias API** y el despliegue en Cloudflare Pages + Render Free + Neon.

---

### 2.4 Guía Rápida de Demostración en Vivo para la Defensa (`X-UI`, +3 pts)

1. Abrir `/kit-ui` (`PaginaKitUi.tsx`) para exhibir en un solo vistazo los **17 componentes `8bitcn/ui`** interactivos (incluyendo `health-bar`, `enemy-health-display`, `xp-bar`, `toast`, `dialog`, `alert-dialog` y `table`).
2. Recorrer el flujo real del jugador (`/hub` → `/exploracion` → `/combate` → `/equipo` → `/inventario` → `/catalogo`) mostrando los componentes funcionando conectados a datos reales de PostgreSQL.
3. Activar la vista móvil en DevTools (`375×812` / `360×800`) para demostrar ausencia total de desbordamiento horizontal y usabilidad táctil en modales y tarjetas.

