# Informe Técnico - Fase 12: Pruebas Integrales, Guion de Demostración y Defensa Final (`v1.0.1`)

Este capítulo cierra la **Fase 12 (Entrega Final y Consolidación)** de *Aethelgard: Sendas y Criaturas* (ISC-305 · Programación Web · III PAC 2026 · Ing. Claudio Paz), actualizado tras la auditoría integral de coherencia documental (`version-1.0.1`). Consolida los resultados de verificación automatizada, la evidencia de evolución en Git, el guion paso a paso de demostración de ~10 minutos y la guía de defensa técnica para los 8 integrantes del equipo.

---

## 1. Resumen Integral de Calidad y Pruebas Automatizadas

Al cierre de la versión **`1.0.1`** (consolidación documental sobre **`version-1.0.0`**), el proyecto supera **268 pruebas automatizadas** sin fallos y compilación estricta en ambos paquetes:

| Capa / Suite | Comando reproducible | Resultado verificado |
| :--- | :--- | :--- |
| Pruebas unitarias Back-End (`apps/api`) | `pnpm --filter api test` | **134 / 134 aprobadas** (42 suites, 0 fallos) |
| Pruebas E2E Back-End + Seguridad `S-1`..`S-7` | `pnpm --filter api test:e2e` | **24 / 24 aprobadas** (10 suites, 0 fallos) |
| Pruebas unitarias Front-End (`apps/web`, incluye `8bitcn/ui`, assets, despliegue y gateway) | `pnpm --filter web test` | **110 / 110 aprobadas** (0 fallos) |
| Compilación TypeScript + Vite Front-End | `pnpm --filter web build` | **Exitosa** (`tsc -b && vite build`) |
| Linter estático Front-End | `pnpm --filter web lint` | **0 errores** (`oxlint`) |
| Compilación Back-End NestJS + Prisma | `pnpm --filter api build` | **Exitosa** (`prisma generate && nest build`) |
| Verificación en vivo API Gateway Kong `3.9.5` DB-less | `node scripts/verificar-gateway.mjs` | **`401` sin clave, CORS `200`, `/api/salud` `200`, `429` + `X-RateLimit-*` + logs reales** |
| Contrato Swagger / OpenAPI exportado | [docs/swagger-openapi.json](../swagger-openapi.json) | **44 rutas REST (46 operaciones HTTP)** documentadas en OpenAPI 3.0 |
| Diagramas Mermaid exportados a PNG | [docs/diagramas/](../diagramas/) | **10 / 10 diagramas `.mmd` y `.png`** sincronizados a `v1.0.1` vía MCP Mermaid |

---

## 2. Evidencia de Evolución Progresiva en Git (`T-11`)

El desarrollo siguió estrictamente el flujo `funcionalidad|configuracion|correccion|documentacion|pruebas/* → desarrollo (merge commit --no-ff) → main (cierres y tags)`:

- **Volumen real de historial:** >520 commits atómicos en español validados por `.githooks/commit-msg` y `.githooks/pre-commit`.
- **Pull Requests integrados con merge commit:** >60 PRs revisados e integrados en `desarrollo` (conservando el grafo real de ramas sin *squash* ni *rebase*).
- **Etiquetas de hitos:** `version-0.0.0`, `avance-1`, `avance-2`, `avance-3`, `avance-4`, cierre **`version-1.0.0`** y auditoría documental **`version-1.0.1`**.
- **Regla `S-7` verificada:** ningún archivo `.env`, secreto real de JWT/PostgreSQL/Kong ni configuración local de agentes está versionado en Git.

---

## 3. Preparación del Entorno para la Demostración en Vivo

Para presentar sin depender del Wi-Fi del aula ni de arranques en frío (*cold start*), se recomienda correr el **entorno local precompilado con Kong integrado** y mantener la **nube gratuita (`Cloudflare Pages + Render Free + Neon`)** abierta en una pestaña adicional como evidencia de despliegue productivo.

### 3.1 Arranque previo (2 minutos antes de exponer)
1. Verificar `.env` raíz con `KONG_CLAVE_API=<tu_clave_local>` y `apps/web/.env` con:
   ```env
   VITE_URL_API=http://localhost:8000
   VITE_CLAVE_GATEWAY=<tu_clave_local>
   ```
2. Levantar infraestructura, base sembrada y builds precompilados:
   ```bash
   docker compose up -d postgres kong
   pnpm --filter api exec prisma migrate deploy
   pnpm --filter api exec prisma db seed
   pnpm --filter api build
   pnpm --filter web build
   ```
3. Iniciar servicios en terminales separadas:
   - **Terminal 1 (Back-End compilado):** `pnpm --filter api start:prod` (`http://localhost:3000`, Swagger en `http://localhost:3000/docs`).
   - **Terminal 2 (Front-End compilado sin esperas):** `pnpm --filter web preview --port 5173` (`http://localhost:5173`).
   - **Terminal 3 (Inspector de BD):** `pnpm --filter api exec prisma studio` (`http://localhost:5555`).

### 3.2 Datos semilla (`seed.ts` + `importar-especies.ts`) disponibles tras el arranque
- **Mundo:** 3 localidades seguras (`LOC-01` Villa Serena, `LOC-02` Puesto Fronterizo del Río, `LOC-03` Bastión del Norte) y 6 zonas explorables (`ZON-01` Praderas del Amanecer, `ZON-02` Riberas del Lago Espejo, `ZON-03` Bosque Susurrante, `ZON-04` Paso de los Riscos, `ZON-05` Cueva Umbría, `ZON-06` Pico de la Cumbre).
- **Bestiario canónico:** 30 especies normalizadas desde Open5e SRD 5.2 con 4 movimientos tácticos cada una (incluyendo 2 legendarias: `behir-abismo` y `remorhaz-glaciar`).
- **Bazar / Tienda:** 4 ítems (`talisman-basico`, `talisman-avanzado`, `pocion-menor`, `pocion-mayor`).
- **Cuenta demo reproducible:** registrar en vivo `demo_aethelgard@correo.com` (o crear un explorador nuevo con `lobo-estepario`, `100` monedas iniciales, `3` talismanes básicos y `2` pociones menores).

---

## 4. Guion de Demostración en Vivo (~10 minutos)

| Minuto | Escena / Ruta | Qué se ejecuta en vivo | Qué requisito demuestra |
| :---: | :--- | :--- | :--- |
| **0:00–1:00** | Arquitectura + `/kit-ui` | Mostrar diagrama [arquitectura-con-gateway.png](../diagramas/arquitectura-con-gateway.png) y abrir `http://localhost:5173/kit-ui` exhibiendo los 17 componentes `8bitcn/ui`. | `A-9`, **`X-UI (+3)`** |
| **1:00–2:00** | `/registro` → `/crear-personaje` | Registrar un explorador nuevo, iniciar sesión (mostrar token JWT en DevTools) y crear personaje eligiendo criatura inicial (`lobo-estepario`, `vibora-rocosa` o `cangrejo-abismal`). | `M-USR`, `M-PJ`, `S-7` |
| **2:00–3:30** | `/hub` → `/exploracion` | Mostrar mapa interactivo Canvas/WebP de Aethelgard, viajar a `ZON-01` (Praderas del Amanecer) e intentar viajar a zona bloqueada (rechazo del servidor). Ejecutar **Explorar** varias veces mostrando eventos/botín/encuentro y avance cartográfico (+20 %). | `M-MUN`, `M-EXP`, `M-ENC`, `M-PRO`, `S-2` |
| **3:30–5:30** | `/combate` | Ejecutar ataque con ventaja/desventaja elemental, observar estados alterados y Resonancia; recargar navegador (`F5`) para comprobar reanudación desde PostgreSQL; lanzar talismán de captura y resolver el encuentro. | `M-COM`, `M-CAP`, `A-8`, `S-3`, `S-5` |
| **5:30–7:00** | `/equipo`, `/almacen`, `/tienda`, `/inventario`, `/curacion`, `/catalogo`, `/historial` | Ver equipo (máx. 6), comprar poción por lote en tienda, usar poción en inventario (`INV-03`), curar en santuario, revisar compendio de 30 especies e historial paginado. Mostrar filas actualizadas en **Prisma Studio**. | `M-EQU`, `M-INV`, `M-CUR`, `M-CRI`, `M-HIS`, `A-6`, `S-4` |
| **7:00–8:30** | Extra **`X-API (+2)`** (Kong DB-less) | Mostrar en DevTools → Network `apikey` y `X-RateLimit-Remaining-Minute` sobre `:8000`; ejecutar `node scripts/verificar-gateway.mjs` para disparar `401` sin clave, preflight CORS `200` y **`429 Too Many Requests`** + `docker compose logs --tail=15 kong`. | **`X-API (+2)`**, `S-7` |
| **8:30–9:30** | Swagger, Pruebas y Nube | Abrir `http://localhost:3000/docs` (44 rutas / 46 operaciones), mostrar salida verde de pruebas (`pnpm --filter api test:e2e`) y pestaña en vivo en **Cloudflare Pages + Render Free + Neon**. | `T-1`, `S-1`..`S-6`, `FIN` |
| **9:30–10:00** | GitHub + Preguntas | Mostrar historial de ramas, PRs integrados con merge commit y tags `version-1.0.0` / `version-1.0.1`. Abrir turno de preguntas técnicas. | `T-11`, `T-12` |

---

## 5. Distribución de Defensa para los 8 Integrantes y Banco de Preguntas

### 5.1 Asignación de módulos (cada integrante domina vista React + servicio NestJS + tabla Prisma)

| Integrante | Módulos asignados | Archivos clave a tener listos en VS Code |
| :---: | :--- | :--- |
| **1** | Arquitectura general, monorepo, Docker, despliegue nube (`Cloudflare + Render + Neon`) y seguridad JWT (`M-USR`, `S-1`..`S-7`) | `apps/api/src/main.ts`, `autenticacion.guard.ts`, `render.yaml` |
| **2** | Creación de personaje, mundo de Aethelgard, mapa topológico y desbloqueo territorial (`M-PJ`, `M-MUN`, `M-PRO`) | `mundo.service.ts`, `progreso.service.ts`, `PantallaHubUbicacion.tsx` |
| **3** | Integración externa Open5e SRD 5.2, fallback local y Bestiario Canónico de 30 criaturas (`M-CRI`, `Anexo A`) | `adaptador-criaturas-externas.service.ts`, `bestiario-canonico.ts`, `seed.ts` |
| **4** | Motor de exploración probabilística, `SelectorPonderado` inyectable y creación de encuentros (`M-EXP`, `M-ENC`) | `exploracion.service.ts`, `selector-ponderado.util.ts`, `PantallaExploracion.tsx` |
| **5** | Motor de combate por turnos, matriz elemental 6×6, 51 efectos, Resonancia y bloqueo `FOR UPDATE` (`M-COM`) | `motor-combate.ts`, `combate.service.ts`, `PantallaCombate.tsx` |
| **6** | Fórmula de captura (`INV-02`), regla de equipo máx. 6 (`A-6`) e intercambio atómico con almacén (`M-CAP`, `M-EQU`) | `captura.service.ts`, `equipo.service.ts`, `PantallaEquipo.tsx` |
| **7** | Economía, tienda por lotes (`S-4`), inventario (`INV-03`) y santuario de curación (`M-INV`, `M-CUR`) | `tienda.service.ts`, `inventario.service.ts`, `curacion.service.ts` |
| **8** | Catálogo, historial, auditoría **`8bitcn/ui` (`X-UI +3`)**, **API Gateway Kong DB-less (`X-API +2`)** y pruebas automatizadas | `kong/kong.yml.plantilla`, `docker-compose.yml`, `apiHttp.ts`, `scripts/verificar-gateway.mjs` |

### 5.2 Preguntas técnicas frecuentes esperadas y respuestas concisas

1. **¿Cómo garantizan que el jugador no haga trampa desde el navegador?** (`§12`, `A-8`)
   - Toda regla (daño, azar, captura, monedas, XP, progreso y permisos) corre únicamente en NestJS. `ValidationPipe` (`whitelist + forbidNonWhitelisted`) rechaza campos extra con `400`, el JWT identifica al dueño (`sub`), y las mutaciones críticas usan transacciones PostgreSQL con `SELECT ... FOR UPDATE`.
2. **¿Qué datos provienen de Open5e y cuáles pertenecen al modelo interno?** (`§11`)
   - De Open5e (`srd-2024`, CC BY 4.0) tomamos la referencia externa de criaturas en un proceso batch con fallback a `datos/open5e-srd-2024-seleccion.json`. El estado vivo de partida (usuarios, personajes, monedas, criaturas capturadas, HP, XP, equipo, encuentros, zonas desbloqueadas e historial) es 100 % interno en PostgreSQL.
3. **¿Cómo prueban mecánicas aleatorias de forma determinista?**
   - Mediante la interfaz `GeneradorAleatorio` inyectable: en producción usa `Math.random()` y en pruebas unitarias se inyectan generadores fijos para validar bordes exactos de captura (`[0.05, 0.95]`), daño mínimo (`INV-04`) y pesos de aparición (`INV-01`).
4. **¿Qué diferencia hay entre la `apikey` de Kong y el `JWT` de NestJS?**
   - `apikey` (Kong `key-auth`) autentica a la **aplicación cliente** en el borde perimetral y controla cuotas (`rate-limiting`); el `JWT` (`AutenticacionGuard` en NestJS) autentica al **usuario jugador** y aísla sus recursos en base de datos.
5. **¿Por qué Kong en modo DB-less y con `kong.yml.plantilla`?**
   - DB-less (`KONG_DATABASE=off`) evita mantener una segunda BD para el gateway y versiona toda la configuración declarativa en Git; usar plantilla sin claves reales cumple `S-7` inyectando `KONG_CLAVE_API` desde `.env` al arrancar el contenedor en `/tmp/kong.yml`.
6. **¿Por qué dejaron Kong en Docker local y no encadenado sobre Render Free?**
   - En Render Free cada servicio duerme tras 15 min y no existe red privada gratuita; encadenar dos servicios Free introduce doble *cold start* sin aislar el upstream. Gracias a que `apiHttp.ts` hace `VITE_CLAVE_GATEWAY` opcional, el sistema funciona tanto con Kong (local o nube con red privada) como directo contra Render Free sin tocar código.
