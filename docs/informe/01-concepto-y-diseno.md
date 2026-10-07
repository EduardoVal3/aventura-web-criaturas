# Informe Técnico - Fase 1: Concepto y Diseño (Avance 1)

Este documento constituye la sección correspondiente a la **Fase 1 (Concepto y Diseño)** del Informe Técnico del Proyecto Integrador ISC-305, consolidando la arquitectura conceptual, las especificaciones matemáticas, el catálogo de especies y el contrato de interfaz previa a la implementación de código.

---

## 1. Concepto del juego
- **Nombre:** *Aethelgard: Sendas y Criaturas*
- **Premisa:** Como explorador novato del gremio de Villa Serena, recorres caminos y tierras salvajes forjando lazos con criaturas míticas para superar desafíos territoriales y desentrañar los secretos ancestrales de Aethelgard.
- **Historia breve:** Tras la fractura del Velo Astral en el continente de Aethelgard, energías primordiales despertaron a criaturas míticas que ahora rondan valles, bosques y ruinas antiguas. Las villas humanas, antes aisladas, dependen de los Guardianes de Sendas: exploradores capaces de comprender el comportamiento de estas criaturas, vincularse con ellas mediante talismanes resonantes y defender los caminos comerciales. Como nuevo recluta del gremio en Villa Serena, inicias tu viaje con una criatura compañera. Deberás explorar las tierras agrestes, vencer y calmar bestias hostiles, adquirir provisiones en los puestos de avanzada y descubrir los secretos de la Cueva Umbría, cuyo sello ancestral solo cederá ante un explorador de probada destreza y progreso en su equipo.
- **Documento fuente:** [docs/diseno-juego.md](../diseno-juego.md).

---

## 2. Mundo de Aethelgard
El mundo prescinde de mapas con coordenadas continuas o motores gráficos (`A-2`), modelándose como una red topológica de nodos seguros y rutas silvestres (`A-4`):
- **Localidades principales (3):** `LOC-01` Villa Serena (asentamiento inicial), `LOC-02` Puesto Fronterizo del Río (comercio y almacén) y `LOC-03` Bastión del Norte (fortaleza avanzada).
- **Rutas y zonas explorables (6):** `ZON-01` Praderas del Amanecer, `ZON-02` Bosque Susurrante, `ZON-03` Riberas del Lago Espejo, `ZON-04` Paso de los Riscos, `ZON-05` Cueva Umbría y `ZON-06` Pico de la Cumbre.
- **Zonas con requisito de desbloqueo (`M-PRO`):**
  - `ZON-05` Cueva Umbría: Bloqueada hasta contar con al menos 3 criaturas en el equipo de nivel $\ge 5$ y haber alcanzado el Puesto Fronterizo.
  - `ZON-06` Pico de la Cumbre: Bloqueada hasta superar la expedición en la Cueva Umbría.
- **Grafo de conexiones:** Modelado mediante diagrama de flujo Mermaid e integrado directamente en [docs/diseno-juego.md](../diseno-juego.md#43-grafo-de-conexiones-del-mundo).

---

## 3. Módulos obligatorios sobre papel
Los 13 componentes funcionales obligatorios del enunciado han sido especificados formalmente con sus pantallas previstas y endpoints correspondientes:

| ID | Módulo | Alcance en el juego | Pantallas clave | Endpoints principales |
| --- | --- | --- | --- | --- |
| `M-USR` | Usuarios | Registro, inicio de sesión y sesión persistente | `PantallaIngreso`, `PantallaRegistro` | `POST /api/usuarios/login`, `POST /api/usuarios/registro` |
| `M-PJ` | Personaje | Creación de explorador, saldo de monedas y estado | `PantallaCrearPersonaje`, `PantallaHubUbicacion` | `POST /api/personajes`, `GET /api/personajes/activo` |
| `M-MUN` | Mundo | Conexiones entre ubicaciones y desplazamientos válidos | `PantallaHubUbicacion` | `GET /api/mundo/ubicacion-actual`, `POST /api/mundo/viajar` |
| `M-EXP` | Exploración | Acción de explorar con resultados probabilísticos | `PantallaExploracion` | `POST /api/exploracion/explorar` |
| `M-CRI` | Criaturas | Catálogo de especies y fichas de estadísticas | `PantallaCatalogo`, `PantallaCrearPersonaje` | `GET /api/especies`, `GET /api/especies/:slug` |
| `M-ENC` | Encuentros | Generación de encuentros según tablas por zona | `PantallaExploracion`, `PantallaCombate` | `GET /api/encuentros/activo` |
| `M-COM` | Combate | Combate por turnos, cálculo de daño y huida | `PantallaCombate` | `POST /api/combate/atacar`, `POST /api/combate/huir` |
| `M-CAP` | Captura | Intento de captura con talismanes durante combate | `PantallaCombate` | `POST /api/combate/capturar` |
| `M-EQU` | Equipo | Equipo activo ($\le 6$) y reserva en almacén | `PantallaEquipo`, `PantallaAlmacen` | `GET /api/equipo`, `POST /api/equipo/transferir` |
| `M-INV` | Inventario | Posesión de consumibles y tienda en localidades | `PantallaInventario`, `PantallaTienda` | `GET /api/inventario`, `POST /api/tienda/comprar` |
| `M-CUR` | Curación | Restauración completa y gratuita del equipo | `PantallaCuracion` | `POST /api/curacion/restaurar` |
| `M-PRO` | Progreso | Recompensas y desbloqueo de zonas condicionadas | `PantallaHubUbicacion` | `GET /api/progreso/desbloqueos`, `POST /api/progreso/verificar-zona` |
| `M-HIS` | Historial | Registro cronológico de expediciones y combates | `PantallaHistorial` | `GET /api/historial` |

- **Documento fuente:** [docs/diseno-juego.md](../diseno-juego.md#5-los-13-módulos-obligatorios-sobre-papel).

---

## 4. Criaturas y API externa (Open5e `srd-2024`)

1. **Justificación de Open5e y documento `srd-2024`:**
   Se eligió Open5e v2 filtrando estrictamente por `document__key__in=srd-2024` porque contiene exactamente **331 criaturas oficiales** del System Reference Document 5.2 de D&D, publicadas formalmente bajo licencia libre **Creative Commons Attribution 4.0 International (CC BY 4.0)**, permitiendo su uso, adaptación y traducción académica sin riesgos de infracción de propiedad intelectual (`PI`).
2. **Criterios de selección:**
   Se seleccionaron 25 especies con amplia diversidad de tipos (bestias, elementales, no-muertos, monstruosidades, autómatas y plantas) y retos entre CR 0.25 y CR 5, incorporando 2 especies de CR alto (`quimera-tricefala` CR 6 e `hidra-de-las-marismas` CR 8) asignadas como criaturas especiales con probabilidad del $5\,\%$ en tablas de aparición. Se descartaron criaturas sin ataques con dados o con mecánicas intratables para un motor por turnos simple.
3. **Mapeo y normalización (Anexo A.3):**
   Las estadísticas originales de D&D se transforman a la escala del juego $[30, 100]$:
   $$\text{valorJuego} = 30 + 70 \times \frac{\text{valor} - \text{minimo}}{\text{maximo} - \text{minimo}}$$
   - **Ejemplo resuelto (`srd-2024_wolf` / Lobo Gris):**
     - $\text{HP}: 11 \rightarrow 30 + 70 \times (11 - 11) / (184 - 11) = \mathbf{30}$
     - $\text{Mejor Ataque} (1d6+2): 5.5 \rightarrow 30 + 70 \times (5.5 - 3.5) / (15.0 - 3.5) = 30 + 70 \times (2 / 11.5) = \mathbf{42}$
     - $\text{AC}: 12 \rightarrow 30 + 70 \times (12 - 8) / (18 - 8) = 30 + 70 \times 0.40 = \mathbf{58}$
     - $\text{Velocidad}: 40 \rightarrow 30 + 70 \times (40 - 20) / (90 - 20) = 30 + 70 \times (20 / 70) = \mathbf{50}$
     - $\text{tasaCaptura}: \text{clamp}(0.10, 0.90, 0.90 - 0.07 \times 0.25) = \mathbf{0.88}$
4. **Frontera de datos (Anexo A.2):**
   - *Externo (Open5e):* `key`, `type.key`, tiradas de dados de ataque, velocidad, clase de armadura y puntos de golpe originales.
   - *Propio:* Nombres en español, `slug`, estadísticas normalizadas, tasa de captura, nivel, experiencia, propietario, estado y tablas por zona.
   - *Mixto:* Movimientos (potencia de dados de Open5e, nombre en español propio).
- **Documento fuente:** [docs/catalogo-criaturas.md](../catalogo-criaturas.md).

---

## 5. Reglas del juego e invariantes numéricos

Las reglas del motor de combate y progresión han sido formuladas con precisión matemática para su implementación en el servidor:
- **Daño:** $\lfloor (\text{ataque} / \max(1, \text{defensa}) \times \text{poder} \times 0.8) + (\text{nivel} \times 0.5) \rfloor$, garantizando daño mínimo de 1 mediante $\max(1, \text{danoBruto})$ (**INV-04**).
- **Captura:** $\text{clamp}(0.05, 0.95, \text{tasaCaptura} \times [1.0 - 0.5 \times (\text{hpActual} / \text{hpMaximo})] \times \text{multiplicadorTalisman})$ (**INV-02**).
- **Experiencia y progresión:** XP por combate escalada por nivel y CR del rival; XP necesaria monótona creciente $\lfloor 50 \times (n-1)^{1.8} + 100 \times (n-1) \rfloor$ (**INV-05**).
- **Huida:** Probabilidad acotada en $[0.10, 0.90]$ basada en velocidades relativas e intentos acumulados.
- **Caso borde de normalización:** En caso de $\text{maximo} = \text{minimo}$, se define por regla $\text{valorJuego} = 65$ para evitar división entre cero.
- **Invariantes:** **INV-01** ($\sum \text{pesos} > 0$), **INV-02** ($\text{probFinal} \in [0.05, 0.95]$), **INV-03** ($0 \le \text{hp} \le \text{hpMax}$), **INV-04** ($\text{daño} \ge 1$), **INV-05** ($\text{XP}(n+1) > \text{XP}(n)$).
- **Documento fuente:** [docs/reglas-juego.md](../reglas-juego.md).

---

## 6. Decisiones de diseño adoptadas
Se resolvieron formalmente las ambigüedades del enunciado y la integración con aprobación escrita del usuario:
- **D-01 (API externa):** Open5e v2 `srd-2024` validada con 331 criaturas, licencia CC BY 4.0 confirmada y límite de una sola importación mediante script (`importar:especies`).
- **D-02 (Tamaño del equipo):** Equipo activo estrictamente limitado a 6 criaturas (`A-6`); criaturas capturadas con equipo lleno van al almacén de forma transparente.
- **D-03 (Alcance de tienda):** Tienda mínima compuesta por 4 consumibles esenciales (Talismán Básico a 50 monedas, Talismán Resonante a 150 monedas, Poción Menor a 40 monedas y Poción Mayor a 100 monedas).
- **D-04 (Momento de captura):** La captura ocurre dentro del combate como acción táctica del turno consumiendo un talismán, evaluada en el servidor.
- **D-05 (Definición de localidad):** Las localidades son asentamientos seguros (`esSegura: true`) sin encuentros hostiles que ofrecen servicios permanentes; las rutas o zonas son salvajes y permiten la acción de explorar.
- **Documento fuente:** [docs/decisiones.md](../decisiones.md).

---

## 7. Pantallas y wireframes
Se elaboraron los wireframes de todas las vistas del flujo en formato ASCII (ancho $\le 80$ columnas) identificando cada control interactivo por su `id` semántico previsto:
- `PantallaIngreso` y `PantallaRegistro` (acceso y cuentas)
- `PantallaCrearPersonaje` (nombre y selección de criatura inicial)
- `PantallaHubUbicacion` (panel de la localidad/zona con destinos y zonas bloqueadas)
- `PantallaExploracion` (exploración probabilística en zonas salvajes)
- `PantallaCombate` (combate táctico por turnos, acciones de ataque, huida y captura)
- `PantallaEquipo` y `PantallaAlmacen` (administración de compañeros y transferencias)
- `PantallaInventario` y `PantallaTienda` (consumibles y comercio de provisiones)
- `PantallaCuracion` (recuperación gratuita del equipo)
- `PantallaCatalogo` (enciclopedia de especies registradas)
- `PantallaHistorial` (bitácora de expediciones)
- `PantallaCreditos` (atribuciones legales obligatorias)
- **Documentos fuente:** [docs/wireframes.md](../wireframes.md) y diagrama Mermaid [docs/diagramas/flujo-pantallas.mmd](../diagramas/flujo-pantallas.mmd).

---

## 8. Modelo conceptual y contrato REST
1. **Modelo conceptual ER preliminar:**
   Define las entidades clave (`Usuario`, `Personaje`, `Ubicacion`, `ConexionUbicacion`, `Especie`, `Movimiento`, `Criatura`, `Item`, `InventarioItem`, `Encuentro`, `TablaAparicion`, `TablaEvento`, `HistorialEvento`), sus relaciones y atributos estructurales sin atarse todavía a sintaxis SQL o Prisma.
   - **Diagrama Mermaid:** [docs/diagramas/modelo-conceptual.mmd](../diagramas/modelo-conceptual.mmd).
2. **Contrato REST preliminar:**
   Estandariza los endpoints con prefijo `/api`, nombres y payloads en español (`camelCase`), respuestas tipificadas, códigos HTTP semánticos y una estructura unificada para el reporte de errores (`{ "error": { "codigo", "mensaje" } }`).
   - **Documento fuente:** [docs/contrato-api.md](../contrato-api.md).

---

## 9. Uso de MCP en la fase
Durante la ejecución de la Fase 1 se aprovecharon los siguientes Model Context Protocols (MCP):
- **Fetch:** Permitió consultar de forma real los endpoints de Open5e (`fetch_json` y `fetch_readable`), validando el conteo de 331 criaturas en `srd-2024`, la estructura de campos `actions[].attacks[]`, la presencia de valores `null` y la ficha legal de `https://api.open5e.com/v2/documents/?key=srd-2024`.
- **Context7:** Empleado con `resolve-library-id` para investigar repositorios de documentación externa sobre la API.
- **Sequential Thinking:** Utilizado para estructurar paso a paso la derivación de fórmulas de combate, probabilidades de captura, curvas de experiencia y verificación exhaustiva de los invariantes INV-01 a INV-05.
- **Mermaid:** Empleado con `generate` para validar la compilación sintáctica a SVG del modelo conceptual ER, del flujo de pantallas y del grafo del mundo.

---

## 10. Atribución y licencias

### Atribución exigida para Open5e (`srd-2024`)
En cumplimiento de la licencia **Creative Commons Attribution 4.0 International (CC BY 4.0)** bajo la cual Wizards of the Coast LLC publicó el System Reference Document 5.2:

> *"This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."*

*Traducción informativa:*
> "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode."

### Licencia del sistema de interfaz (8bitcn/ui)
La biblioteca de componentes UI retro pixel-art `8bitcn/ui` se encuentra protegida bajo la licencia **MIT**:
> *Copyright (c) 2024 8bitcn. Licensed under the MIT License.*
