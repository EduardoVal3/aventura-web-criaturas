# Informe Técnico Final — *Aethelgard: Sendas y Criaturas* (`v1.0.0`)

- **Asignatura:** ISC-305 · Programación Web · III PAC 2026
- **Docente:** Ing. Claudio Paz
- **Versión de cierre:** `version-1.0.0`
- **Repositorio:** `https://github.com/EduardoVal3/aventura-web-criaturas`
- **Stack principal:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + `8bitcn/ui` | NestJS 10 + Prisma 6 + PostgreSQL 17 + JWT | Kong Gateway `3.9.5` DB-less (Docker) | Despliegue en nube: Cloudflare Pages + Render Free + Neon.

---

## 1. Resumen Ejecutivo

*Aethelgard: Sendas y Criaturas* es una aplicación web RPG de exploración, combate táctico por turnos, captura y progresión territorial construida incrementalmente bajo arquitectura cliente-servidor desacoplada (`A-9`) y principio estricto de soberanía del servidor (`A-8`).

El proyecto cumple el **100 % de los módulos funcionales obligatorios** (`M-USR` a `M-HIS`), las **7 salvaguardas de seguridad** (`S-1` a `S-7`), la integración con API externa con respaldo local (**Open5e SRD 5.2**, CC BY 4.0), la producción completa de assets pixel-art WebP, el despliegue gratuito operativo en la nube y los **dos entregables de puntos adicionales** (`X-API +2` con Kong DB-less y `X-UI +3` con `8bitcn/ui`), respaldados por **268 pruebas automatizadas en verde**.

---

## 2. Matriz de Cobertura de Requisitos

| Categoría | Requisitos cubiertos | Evidencia principal en repositorio |
| :--- | :--- | :--- |
| **Módulos funcionales** | `M-USR`, `M-PJ`, `M-MUN`, `M-EXP`, `M-CRI`, `M-ENC`, `M-COM`, `M-CAP`, `M-EQU`, `M-INV`, `M-CUR`, `M-PRO`, `M-HIS` | `apps/api/src/modulos/*`, `apps/web/src/paginas/*`, [04-backend-y-api-rest.md](04-backend-y-api-rest.md), [06-reglas-de-juego.md](06-reglas-de-juego.md) |
| **Reglas de alcance** | `A-1`..`A-9` (web sin motor de videojuegos, 3 localidades + 6 zonas, 30 criaturas canónicas, máx. 6 en equipo, turnos en servidor, separación de capas) | [01-concepto-y-diseno.md](01-concepto-y-diseno.md), [catalogo-criaturas.md](../catalogo-criaturas.md), [reglas-juego.md](../reglas-juego.md) |
| **Seguridad** | `S-1`..`S-7` (aislamiento JWT `sub`, grafo territorial, encuentro activo, inventario atómico, máquina de turnos `FOR UPDATE`, `ValidationPipe` estricto, `bcrypt`, CORS sin `*`, cero secretos en Git) | [08-seguridad.md](08-seguridad.md), `apps/api/test/seguridad-s1-s7.e2e-spec.ts` |
| **API Externa** | Integración Open5e v2 (`srd-2024`) + normalización matemática + fallback local + atribución CC BY 4.0 | [07-integracion-externa.md](07-integracion-externa.md), `datos/open5e-srd-2024-seleccion.json`, `PaginaCreditos.tsx` |
| **Extra `X-API (+2)`** | Kong Gateway `3.9.5` DB-less en `docker-compose.yml`, plantilla `kong/kong.yml.plantilla` sin secretos, plugins `cors`, `key-auth`, `rate-limiting` (`429` + `X-RateLimit-*`) y logs trazables | [10-extras.md](10-extras.md), [arquitectura-con-gateway.png](../diagramas/arquitectura-con-gateway.png), `scripts/verificar-gateway.mjs` |
| **Extra `X-UI (+3)`** | Librería especializada `8bitcn/ui` (17 componentes integrados en 15 pantallas + 4 componentes de mundo), diseño responsive `320 px`+, cero emojis unicode (`R1`), audio Web Audio y vitrina `/kit-ui` | [10-extras.md](10-extras.md), [09-experiencia-usuario.md](09-experiencia-usuario.md), [DESIGN.md](../DESIGN.md) |
| **Entrega y calidad** | `FIN`, `T-1`, `T-11`, `T-12` (268 pruebas automatizadas, OpenAPI JSON exportado, 10 diagramas PNG, historial Git limpio, guion de demo y defensa de 8 integrantes) | [11-pruebas-y-demo.md](11-pruebas-y-demo.md), [swagger-openapi.json](../swagger-openapi.json) |

---

## 3. Índice Consolidado de Capítulos del Informe Técnico

1. **[01 — Concepto, Historia y Diseño del Mundo](01-concepto-y-diseno.md):** Visión, localidades, rutas, bucle jugable y modelo conceptual.
2. **[02 — Front-End y Sistema de Diseño Retro](02-frontend-y-sistema-de-diseno.md):** React 19, Vite, Tailwind v4, tokens HSL y `8bitcn/ui`.
3. **[03 — Prototipo Navegable y Flujos de Pantalla](03-prototipo-frontend.md):** Rutas protegidas, navegación y desacoplamiento por interfaz `ApiJuego`.
4. **[04 — Back-End NestJS, API REST e Integración](04-backend-y-api-rest.md):** Controladores, DTOs, `ExcepcionesFilter`, JWT e integración real Front↔API.
5. **[05 — Modelo de Datos y Persistencia Relacional](05-modelo-de-datos.md):** Esquema Prisma, PostgreSQL 17, índices, llaves foráneas y migraciones.
6. **[06 — Reglas de Juego y Motor Matemático](06-reglas-de-juego.md):** Exploración ponderada, combate elemental, 52 efectos, captura, XP y economía.
7. **[07 — Integración con API Externa (Open5e SRD 5.2)](07-integracion-externa.md):** Frontera externo/interno, adaptador, normalizador y licencia CC BY 4.0.
8. **[08 — Seguridad y Auditoría `S-1` a `S-7`](08-seguridad.md):** Blindaje defensivo y batería E2E de pruebas negativas.
9. **[09 — Experiencia de Usuario Pantalla por Pantalla (Fase 10)](09-experiencia-usuario.md):** Auditorías Impeccable, dioramas Canvas/WebP, audio Web Audio y hardening móvil.
10. **[10 — Extras de Puntos: Kong DB-less (`+2`) y Auditoría `8bitcn/ui` (`+3`)](10-extras.md):** Configuración declarativa, evidencia real `429`/logs y matriz verificada de los 17 componentes UI.
11. **[11 — Pruebas Integrales, Guion de Demo y Defensa del Equipo](11-pruebas-y-demo.md):** Resultados de las 268 pruebas, guion de 10 minutos, reparto para los 8 integrantes y banco de preguntas técnicas.

---

## 4. Documentación Técnica de Referencia y Artefactos Exportados

- **Especificación OpenAPI 3.0 (Swagger exportado, 44 rutas):** [docs/swagger-openapi.json](../swagger-openapi.json)
- **Contrato REST redactado:** [docs/contrato-api.md](../contrato-api.md)
- **Bitácora de decisiones técnicas (`D-01` a `D-23`):** [docs/decisiones.md](../decisiones.md)
- **Fórmulas y balance autoritativo:** [docs/reglas-juego.md](../reglas-juego.md)
- **Catálogo canónico de las 30 criaturas:** [docs/catalogo-criaturas.md](../catalogo-criaturas.md)
- **Sistema de diseño retro:** [docs/DESIGN.md](../DESIGN.md)

---

## 5. Galería de Diagramas Exportados (Mermaid → PNG)

| Diagrama | Fuente Mermaid | Imagen exportada (PNG) |
| :--- | :--- | :--- |
| Arquitectura por capas (Back-End) | [arquitectura-capas.mmd](../diagramas/arquitectura-capas.mmd) | [arquitectura-capas.png](../diagramas/arquitectura-capas.png) |
| Arquitectura con API Gateway Kong DB-less | [arquitectura-con-gateway.mmd](../diagramas/arquitectura-con-gateway.mmd) | [arquitectura-con-gateway.png](../diagramas/arquitectura-con-gateway.png) |
| Arquitectura Front-End | [arquitectura-frontend.mmd](../diagramas/arquitectura-frontend.mmd) | [arquitectura-frontend.png](../diagramas/arquitectura-frontend.png) |
| Modelo conceptual del dominio | [modelo-conceptual.mmd](../diagramas/modelo-conceptual.mmd) | [modelo-conceptual.png](../diagramas/modelo-conceptual.png) |
| Modelo Entidad-Relación (PostgreSQL/Prisma) | [modelo-datos.mmd](../diagramas/modelo-datos.mmd) | [modelo-datos.png](../diagramas/modelo-datos.png) |
| Flujo de pantallas del jugador | [flujo-pantallas.mmd](../diagramas/flujo-pantallas.mmd) | [flujo-pantallas.png](../diagramas/flujo-pantallas.png) |
| Estados de encuentro y combate | [estados-encuentro.mmd](../diagramas/estados-encuentro.mmd) | [estados-encuentro.png](../diagramas/estados-encuentro.png) |
| Flujo de importación API externa Open5e | [flujo-api-externa.mmd](../diagramas/flujo-api-externa.mmd) | [flujo-api-externa.png](../diagramas/flujo-api-externa.png) |
| Secuencia de captura transaccional | [secuencia-captura.mmd](../diagramas/secuencia-captura.mmd) | [secuencia-captura.png](../diagramas/secuencia-captura.png) |
| Secuencia de integración Front↔API | [secuencia-integracion-front-api.mmd](../diagramas/secuencia-integracion-front-api.mmd) | [secuencia-integracion-front-api.png](../diagramas/secuencia-integracion-front-api.png) |
