# Índice Maestro y Enrutador de Contexto (ISC-305)

Este documento es el enrutador ligero (~2 KB) para navegar el proyecto sin necesidad de cargar documentos monolíticos en el contexto del LLM.

---

## 1. Mapa de Fases y Workflows

> **Regla de oro de tokens:** Al trabajar en una fase, carga **únicamente** su archivo de workflow (`docs/workflows/FASE-NN.md`). No cargues el plan general completo en el prompt.

| Fase | Nombre | Estado | Rama | Workflow | Líneas en Plan Maestro |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **0** | Cimientos y entorno | ✅ Completada | `configuracion/fase-00-cimientos` | [FASE-00.md](file:///docs/workflows/FASE-00.md) | L248–L265 |
| **1** | Concepto y diseño (AV1) | ✅ Completada | `documentacion/fase-01-diseno` | [FASE-01.md](file:///docs/workflows/FASE-01.md) | L266–L288 |
| **2** | Front-End base + 8bitcn/ui | ✅ Completada | `funcionalidad/fase-02-base-frontend` | [FASE-02.md](file:///docs/workflows/FASE-02.md) | L289–L306 |
| **3** | Prototipo navegable (AV2) | ✅ Completada | `funcionalidad/fase-03-prototipo` | [FASE-03.md](file:///docs/workflows/FASE-03.md) | L307–L320 |
| **4** | Back-End base + Auth | ✅ Completada | `funcionalidad/fase-04-base-backend` | [FASE-04.md](file:///docs/workflows/FASE-04.md) | L321–L337 |
| **5** | Modelo de datos y catálogo | ✅ Completada | `funcionalidad/fase-05-datos-catalogo` | [FASE-05.md](file:///docs/workflows/FASE-05.md) | L338–L355 |
| **6** | Exploración y encuentros | ✅ Completada | `funcionalidad/fase-06-exploracion` | [FASE-06.md](file:///docs/workflows/FASE-06.md) | L356–L373 |
| **7** | Combate y captura (AV4) | ✅ Completada | `funcionalidad/fase-07-combate` | [FASE-07.md](file:///docs/workflows/FASE-07.md) | L374–L393 |
| **8** | Integración Front↔API | ✅ Completada | `funcionalidad/fase-08-integracion` | [FASE-08.md](file:///docs/workflows/FASE-08.md) | L394–L410 |
| **9** | Seguridad y cierre base | ✅ Completada | `pruebas/fase-09-seguridad` | [FASE-09.md](file:///docs/workflows/FASE-09.md) | L415–L431 |
| **10** | Enriquecimiento UX (Impeccable) | ⏳ Siguiente | Sub-ramas por pantalla | `docs/workflows/fase-10/` | L435–L482 |
| **11** | Extras: Gateway y UI (+5) | Pendiente | `configuracion/fase-11-extras` | `docs/workflows/FASE-11.md` | L483–L501 |
| **12** | Entrega final (FIN) | Pendiente | `documentacion/fase-12-entrega` | `docs/workflows/FASE-12.md` | L502–L516 |
| **13** | Multijugador (opcional) | Opcional | `funcionalidad/fase-13-presencia` | `docs/workflows/FASE-13.md` | L517–L530 |

---

## 2. Documentos Satélite Especializados

Consulta estos archivos solo cuando la tarea toque directamente su dominio:

| Dominio | Archivo | Cuándo consultarlo |
| :--- | :--- | :--- |
| **Reglas transversales** | [docs/reglas-de-trabajo.md](file:///docs/reglas-de-trabajo.md) | Antes de iniciar cualquier fase (R1, R2, R3). |
| **Sistema de Diseño Retro** | [docs/DESIGN.md](file:///docs/DESIGN.md) | Paleta HSL retro, tokens, tipografía 8-bit, contrastes y animaciones con Impeccable (Fase 10 y 11). |
| **Recursos y Multimedia** | [apps/web/public/assets/README.md](file:///apps/web/public/assets/README.md) · [apps/web/src/lib/assets.ts](file:///apps/web/src/lib/assets.ts) | Convención de nombres, resolución de sprites/zonas/objetos con fallback SVG y audio retro. |
| **Servidores MCP** | [docs/mcp.md](file:///docs/mcp.md) | Configuración y límites de MCP. |
| **Fórmulas y Balance** | `docs/reglas-juego.md` | Daño, captura, XP, pesos y progreso. |
| **Contrato REST** | `docs/contrato-api.md` | Rutas, DTOs y payloads. |
| **Decisiones técnicas** | `docs/decisiones.md` | Elección de librerías, versiones y justificaciones. |
| **Diagramas Mermaid** | `docs/diagramas/` | Arquitectura o flujos de interacción. |
| **Informe técnico** | `docs/informe/` | Secciones incrementales por fase. |

---

## 3. Mapa de Secciones del Plan Maestro

Si requieres validar el texto original de [Plan_Desarrollo_ISC305_Entregable1.md](file:///Plan_Desarrollo_ISC305_Entregable1.md), **usa siempre lectura por rangos (`StartLine` y `EndLine`)**:

- **§1 Reglas globales (R1, R2, R3):** Líneas 24 a 129
- **§2 Decisiones de stack:** Líneas 131 a 153
- **§3 Reglas transversales de diseño:** Líneas 156 a 168
- **§4 Leyenda de IDs de requisitos:** Líneas 171 a 189
- **§5 Ruta crítica y Unidades:** Líneas 194 a 216
- **§6 Informe técnico incremental:** Líneas 219 a 237
- **§7 Plantilla de workflow:** Líneas 239 a 252
- **§8 Resumen de Fases:** Líneas 254 a 530
  - Fase 9: Líneas 417 a 434
  - Fase 10 (UX con Impeccable): Líneas 435 a 482
  - Fase 11 (Extras): Líneas 483 a 501
  - Fase 12 (Entrega final): Líneas 502 a 516
  - Fase 13 (Multijugador opcional): Líneas 517 a 530
- **§9 Matriz de cobertura:** Líneas 533 a 552
- **§10 Anexo A (API Externa Open5e):** Líneas 555 a 619

---

## 4. Buenas Prácticas de Prompts para Ahorrar Tokens

1. **Evita el `@` al Plan Maestro:** No menciones `@Plan_Desarrollo_ISC305_Entregable1.md` en los mensajes rutinarios. En su lugar, usa `@docs/workflows/FASE-NN.md`.
2. **Una fase a la vez:** Trabaja y valida cada fase en sesiones o turnos enfocados.
3. **El agente lee quirúrgicamente:** El agente utiliza `view_file` con rangos de líneas o `grep_search`.
