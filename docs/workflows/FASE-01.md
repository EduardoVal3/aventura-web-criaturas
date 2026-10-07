# Workflow Fase 1: Concepto y diseño (AV1)

> Lo ejecuta la IA flash del IDE, **una tarea a la vez y en orden**. Fuente de verdad: `Plan_Desarrollo_ISC305_Entregable1.md` (§8 Fase 1 y §10 Anexo A).
> Si un paso falla, si un dato de Open5e no coincide con este documento o si una decisión no está escrita aquí: **detente y pregunta al usuario**. No inventes ni te adelantes a otras fases.
> Esta fase **no escribe código**: todo lo que produce son documentos en `docs/`.

## 1. Objetivo y requisitos cubiertos

**Objetivo:** dejar el juego diseñado por completo sobre papel, sin ambigüedades abiertas: historia, mundo, catálogo de criaturas basado en Open5e (`srd-2024`), fórmulas con invariantes numéricos, wireframes, modelo conceptual y contrato REST. Con esto se cierra el **Avance 1**.

**IDs cubiertos:** `AV1`, `§1`, `FLUJO`, `§4`, los **13 módulos** (definidos sobre papel, incluido `M-PRO`), `A-4`, `A-5`, `A-6`, `CFG` (tablas diseñadas), `§9`, `PI`, `§15`.

Cuando necesites el texto de un ID, búscalo en el plan con `grep_search` (por ejemplo `Query: "FLUJO"` o, para los módulos, `Query: "M-[A-Z]+"` con `IsRegex: true`) y lee solo las líneas que devuelva con `view_file` + `StartLine`/`EndLine`. **Nunca leas el plan completo.**

**Entregables de la fase:**

| # | Entregable | Archivo |
| --- | --- | --- |
| 1 | Documento de diseño: nombre, historia breve, reglas generales y glosario | `docs/diseno-juego.md` |
| 2 | Mundo: ≥3 localidades, ≥5 rutas/zonas, grafo de conexiones y ≥1 zona con requisito de desbloqueo (`M-PRO`) | `docs/diseno-juego.md` |
| 3 | Catálogo de 20 a 30 criaturas de `srd-2024`, tablas de aparición y tablas de eventos por zona con pesos relativos | `docs/catalogo-criaturas.md` |
| 4 | Fórmulas de daño, captura, XP y huida, con sus invariantes numéricos | `docs/reglas-juego.md` |
| 5 | Decisiones sobre las ambigüedades del enunciado y verificación de Open5e (licencia y atribución) | `docs/decisiones.md` |
| 6 | Wireframes de todas las pantallas del flujo (bocetos ASCII) | `docs/wireframes.md` |
| 7 | Modelo conceptual ER preliminar | `docs/diagramas/modelo-conceptual.mmd` |
| 8 | Contrato REST (endpoints en español y sus JSON) | `docs/contrato-api.md` |
| — | Flujo de pantallas | `docs/diagramas/flujo-pantallas.mmd` |
| — | Sección del informe | `docs/informe/01-concepto-y-diseno.md` |

## 2. Rama y precondiciones

| Dato | Valor |
| --- | --- |
| Rama de la fase | `documentacion/fase-01-diseno` (sale de `desarrollo`) |
| PR de la fase | `documentacion/fase-01-diseno → desarrollo`, merge commit |
| Cierre de avance | PR `desarrollo → main`, merge commit, y tag `avance-1` sobre el merge commit en `main` |
| API externa | Open5e v2, documento `srd-2024`, endpoint `https://api.open5e.com/v2/creatures/` |
| Formato de wireframes | Bocetos ASCII en `docs/wireframes.md` (decisión del usuario) |
| Formato de la planilla | Tablas Markdown en `docs/catalogo-criaturas.md` (decisión del usuario) |

**Precondiciones (verifícalas antes de T1; si alguna falla, detente):**

1. La Fase 0 está mergeada en `desarrollo` y el tag existe: `git ls-remote --tags origin version-0.0.0` lista `version-0.0.0`.
2. Árbol de trabajo limpio: `git status --short` no muestra archivos versionables modificados.
3. Existen `docs/diagramas/` y `docs/informe/` (con su `.gitkeep`) y `.github/pull_request_template.md`.
4. Los MCP `fetch`, `context7`, `sequential-thinking`, `mermaid` y `github` responden (ver `docs/mcp.md`).
5. No existen todavía `docs/decisiones.md`, `docs/reglas-juego.md`, `docs/contrato-api.md` ni `docs/informe/01-concepto-y-diseno.md`.

**Terminal:** PowerShell 5.1. No uses `&&`. Un comando por línea y revisa la salida antes de seguir.

**Reglas que aplican siempre (R1, R2 y R3):**

- Documentos, commits y textos en español. Los nombres de campos de Open5e (`key`, `challenge_rating`, etc.) se citan tal cual porque son datos externos.
- Nunca hagas commits en `main` ni en `master`. Un commit por tarea, con el mensaje exacto indicado.
- No uses `--no-verify`, `push --force`, `rebase -i` ni `--date`. No borres la rama de la fase después del merge.
- **Antes de cada commit** ejecuta `git diff --cached --name-only` y verifica que no aparecen `.agents/`, `.env`, `Plan_Desarrollo_ISC305_Entregable1.md` ni `Proyecto Integrador ISC305 Aventura Web Criaturas.md`. Agrega archivos por ruta explícita, nunca `git add .`.
- Toda afirmación técnica sobre Open5e cita URL y fecha de consulta. Si no se puede confirmar, se escribe **"sin verificar"** y se pregunta al usuario; no se da por hecho.

## 3. Tareas

### T1. Crear la rama y versionar este workflow

```powershell
git switch desarrollo
git pull
git switch -c documentacion/fase-01-diseno
git add docs/workflows/FASE-01.md
git diff --cached --name-only
git commit -m "documentacion(workflow): agrega workflow de la fase 1"
```

**Commit:** `documentacion(workflow): agrega workflow de la fase 1`

### T2. Gate de la API externa: verificar Open5e y su licencia

1. **MCP Fetch, `fetch_json`** con la consulta de lista del Anexo A.5:

   ```text
   https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&ordering=challenge_rating_decimal&fields=key,name,type,challenge_rating,hit_points,armor_class
   ```

   Esperado: `count` = 331 (si difiere, anota el valor real y la fecha). Recorre las páginas con `&page=N` hasta que una responda 404; guarda los resultados solo en tu contexto, **no** los versiones.
2. **MCP Fetch, `fetch_json`** con la consulta de detalle del Anexo A.5:

   ```text
   https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&name__icontains=wolf&fields=key,name,type,challenge_rating,hit_points,armor_class,speed_all,ability_scores,actions
   ```

   Confirma para `srd-2024` (la muestra del plan era de `a5e-mm`): forma de `type` (¿objeto con `key`?), `speed_all` (claves de caminar/volar/nadar/trepar/excavar), `actions[].attacks[]` con `damage_die_count`, `damage_die_type` (texto tipo `"D6"`), `damage_bonus`, `to_hit_mod`, y qué campos llegan en `null`.
3. **MCP Context7:** `resolve-library-id` con `"Open5e"` y, si existe, `query-docs` sobre licencia y atribución. Si Context7 no tiene Open5e, usa **MCP Fetch, `fetch_readable`** sobre `https://open5e.com/api-docs` y `https://open5e.com/legal`. Como la página Legal carga su lista de forma dinámica (Anexo A.1), intenta también `fetch_json` sobre `https://api.open5e.com/v2/documents/?key=srd-2024` y lee sus campos de licencia y de editor, si existen.
4. Crea `docs/decisiones.md` con este esqueleto y llena la primera sección:

   ```markdown
   # Decisiones del proyecto

   ## D-01. API externa: Open5e v2, documento srd-2024
   - Fuente y fecha de consulta: <URLs> (<fecha>)
   - Total de criaturas en srd-2024: <n>
   - Campos confirmados: <lista>
   - Campos que llegan en null: <lista>
   - Diferencias con el Anexo A.1 del plan: <ninguna | detalle>
   - Licencia de srd-2024: <nombre y URL> | sin verificar
   - Atribución exigida (texto literal): <texto>
   - Límites de uso: no documentados; se hará una sola importación con `fields`.
   ```

   Para esta fase el texto de atribución esperado es el de **SRD 5.2 de Wizards of the Coast bajo CC BY 4.0**, pero solo se escribe si lo confirmas en una fuente; si no, queda "sin verificar" y **preguntas al usuario** antes de seguir.

```powershell
git add docs/decisiones.md
git diff --cached --name-only
git commit -m "documentacion(decisiones): registra verificación y licencia de Open5e"
```

**Commit:** `documentacion(decisiones): registra verificación y licencia de Open5e`

### T3. Documento de diseño: historia, mundo y glosario

Crea `docs/diseno-juego.md` con estas secciones:

1. **Nombre del juego** y **premisa** en una línea.
2. **Historia breve** (≤ 200 palabras).
3. **Reglas generales** en prosa (cómo se explora, se combate, se captura y se progresa). Las fórmulas **no** van aquí: van en `docs/reglas-juego.md` (T5).
4. **Mundo:**
   - Tabla de **≥3 localidades** (`id`, nombre, descripción, servicios: tienda, curación, etc.).
   - Tabla de **≥5 rutas/zonas** (`id`, nombre, conecta, nivel sugerido, requisito de desbloqueo).
   - **≥1 zona con requisito de desbloqueo** explícito y verificable (por ejemplo, una condición de progreso), que es lo que cubre `M-PRO`.
   - **Grafo de conexiones** en un bloque ```` ```mermaid ```` (`flowchart LR`) dentro del mismo documento. La zona bloqueada se marca con un estilo distinto. Valida que renderiza con **MCP Mermaid, `generate`** (sin `folder` dentro del repo; el PNG no se versiona).
5. **Los 13 módulos sobre papel:** una tabla `ID | Nombre | Qué hace en el juego | Pantallas | Endpoints`. Obtén los IDs y su alcance con `grep_search` en el plan (`M-[A-Z]+`, regex). Las columnas de pantallas y endpoints se completan en T7 y T8; aquí deja el nombre previsto.
6. **Glosario** en español (término, definición). Incluye como mínimo: criatura, especie, equipo, almacén, zona, localidad, encuentro, captura, huida, nivel, XP y los términos de Open5e que aparezcan en el diseño (`key`, `challenge_rating`).

```powershell
git add docs/diseno-juego.md
git diff --cached --name-only
git commit -m "documentacion(diseno): agrega historia, mundo y glosario"
```

**Commit (guía del plan):** `documentacion(diseno): agrega historia, mundo y glosario`

### T4. Decisiones sobre las ambigüedades del enunciado

Agrega a `docs/decisiones.md` una entrada por ambigüedad, con el formato `Contexto · Decisión · Justificación · Impacto (módulos, pantallas, tablas)`:

| ID | Ambigüedad | Decisión ya fijada por el plan |
| --- | --- | --- |
| D-02 | Tamaño del equipo | Equipo de **máximo 6** criaturas; el resto va al **almacén** |
| D-03 | Alcance de la tienda | **Tienda mínima** (lista corta de objetos; define cuáles y su precio) |
| D-04 | Momento de la captura | La captura ocurre **dentro del combate** como una acción más del turno |
| D-05 | Qué cuenta como "localidad" | **Sin fijar:** redacta una propuesta coherente con el mundo de T3 y **pregunta al usuario** antes de commitear |

Si al leer los IDs del §1 encuentras otra ambigüedad, agrégala como D-06 en adelante y pregunta al usuario por su decisión.

```powershell
git add docs/decisiones.md
git diff --cached --name-only
git commit -m "documentacion(decisiones): resuelve ambigüedades del enunciado"
```

**Commit:** `documentacion(decisiones): resuelve ambigüedades del enunciado`

### T5. Reglas del juego: fórmulas e invariantes

Usa **MCP Sequential Thinking, `sequentialthinking`** para derivar las fórmulas de forma coherente entre sí (los valores de juego salen en la escala 30–100 de la normalización del Anexo A.3). Opcional: **MCP Memory** (`create_entities`, `add_observations`) como apoyo de contexto; la fuente de verdad es el archivo.

Crea `docs/reglas-juego.md` con:

1. **Normalización (Anexo A.3), tal cual:**
   - `valorJuego = 30 + 70 × (valor − minimo) / (maximo − minimo)`, aplicada sobre el catálogo elegido a `hpBase` (`hit_points`), `ataqueBase` (promedio del mejor ataque), `defensaBase` (`armor_class`) y `velocidadBase` (máximo de `speed_all`).
   - Promedio de un ataque: `damage_die_count × (lados / 2 + 0.5) + damage_bonus`; `"D6"` → 6 lados; `damage_bonus = null` → 0.
   - `tasaCaptura = clamp(0.10, 0.90, 0.90 − 0.07 × challenge_rating)`.
   - **Caso borde obligatorio:** define qué pasa si `maximo = minimo` (división entre cero) y escríbelo.
2. **Fórmulas** de **daño**, **probabilidad de captura**, **XP ganada**, **XP necesaria por nivel** y **probabilidad de huida**. Para cada una: variables, rango de cada variable, fórmula, un ejemplo numérico resuelto y qué invariante cumple.
3. **Tablas ponderadas:** cómo se elige una entrada a partir de pesos relativos (probabilidad = peso / suma de pesos).
4. **Invariantes numéricos** con ID estable (se vuelven pruebas en las Fases 6 y 7):

   | ID | Invariante |
   | --- | --- |
   | INV-01 | La suma de pesos de cada tabla de aparición y de eventos es > 0 |
   | INV-02 | La probabilidad final de captura está entre 0.05 y 0.95 |
   | INV-03 | El HP está siempre entre 0 y `hpMaximo` |
   | INV-04 | El daño mínimo de un golpe es 1 |
   | INV-05 | La XP necesaria es estrictamente creciente con el nivel |

   Aclara la relación entre `tasaCaptura` (0.10–0.90, propia de la especie) y la probabilidad final de captura (acotada a 0.05–0.95 por INV-02).

```powershell
git add docs/reglas-juego.md
git diff --cached --name-only
git commit -m "documentacion(reglas): define fórmulas e invariantes numéricos"
```

**Commit (guía del plan):** `documentacion(reglas): define fórmulas e invariantes numéricos`

### T6. Catálogo de criaturas y tablas por zona (planilla)

Con los datos de T2 (vuelve a usar **MCP Fetch, `fetch_json`** con `name__icontains=<nombre>` y los `fields` de la consulta de detalle para cada candidata) crea `docs/catalogo-criaturas.md`:

1. **Criterios de selección (Anexo A.3):** 20 a 30 criaturas de `srd-2024`, variedad de `type` y `challenge_rating` bajo a medio, más 1 o 2 de CR alto como "criatura especial". Se descartan las de mecánicas imposibles para un combate simple (por ejemplo dragones ancianos) y las que no tengan al menos una `action` con `attacks` y dado definido.
2. **Tabla del catálogo**, una fila por especie:

   `key` · nombre en español · `slug` (kebab-case, sin tildes) · `type.key` · `challenge_rating` · `hit_points` · `armor_class` · velocidad máx. · promedio del mejor ataque · `hpBase` · `ataqueBase` · `defensaBase` · `velocidadBase` · `tasaCaptura` · especial (sí/no)

   Debajo, los `minimo`/`maximo` usados en la normalización.
3. **Movimientos:** hasta 3 por especie, tomados de `actions` con `attacks` no vacío: nombre original (solo como referencia interna), **nombre en español**, `poder` (promedio de daño del ataque). Las acciones sin `attacks` se ignoran.
4. **Tablas de aparición por zona** (una por cada zona de T3): especie (`slug`), peso relativo, nivel mínimo–máximo, probabilidad resultante. La criatura especial aparece con **≈5 %**. Cada tabla cumple INV-01.
5. **Tablas de eventos por zona:** evento, peso relativo, probabilidad resultante. Los tipos de evento salen de `§4`/`§9` del plan (búscalos con `grep_search`); no inventes tipos. Cada tabla cumple INV-01.
6. Nota de origen de cada dato según el Anexo A.2 (Open5e / propio / mixto). El nombre en inglés **no** se muestra al jugador. Las imágenes no bloquean: se nombran por `slug` y usan placeholder.

```powershell
git add docs/catalogo-criaturas.md
git diff --cached --name-only
git commit -m "documentacion(catalogo): agrega catálogo de criaturas y tablas por zona"
```

**Commit:** `documentacion(catalogo): agrega catálogo de criaturas y tablas por zona`

### T7. Wireframes de todas las pantallas

Obtén la lista de pantallas de `FLUJO` en el plan (`grep_search`). Crea `docs/wireframes.md` con, por pantalla:

- Nombre y módulo(s) que cubre.
- Boceto ASCII dentro de un bloque ```` ```text ```` (≤ 80 columnas).
- Elementos interactivos con su `id` previsto (por ejemplo `boton-capturar`), datos que muestra y a qué pantalla lleva cada acción.

Incluye obligatoriamente la **pantalla de créditos** (atribución de `srd-2024` y aviso MIT de 8bitcn/ui, Anexo A.4). Al terminar, completa la columna "Pantallas" de la tabla de módulos en `docs/diseno-juego.md`.

```powershell
git add docs/wireframes.md docs/diseno-juego.md
git diff --cached --name-only
git commit -m "documentacion(wireframes): agrega bocetos de todas las pantallas"
```

**Commit:** `documentacion(wireframes): agrega bocetos de todas las pantallas`

### T8. Contrato REST preliminar

Crea `docs/contrato-api.md`:

1. Convenciones: prefijo `/api`, rutas y campos JSON en español (`camelCase`), códigos HTTP usados y **formato único de error** (`{ "error": { "codigo": "...", "mensaje": "..." } }` o el que fijes, pero uno solo).
2. Por endpoint: método, ruta, módulo, descripción, cuerpo de petición (JSON de ejemplo), respuesta exitosa (JSON de ejemplo) y errores posibles. Incluye `GET /api/salud` (ya existe desde la Fase 0).
3. Cubre todas las acciones de los wireframes de T7: cada botón que cambia estado tiene su endpoint.
4. Regla del Anexo A.4: **ningún endpoint llama a Open5e en tiempo de juego**; la API solo lee de la BD. La importación (`importar:especies`) es un script, no un endpoint público.

Al terminar, completa la columna "Endpoints" de la tabla de módulos en `docs/diseno-juego.md`.

```powershell
git add docs/contrato-api.md docs/diseno-juego.md
git diff --cached --name-only
git commit -m "documentacion(api): agrega contrato REST preliminar"
```

**Commit (guía del plan):** `documentacion(api): agrega contrato REST preliminar`

### T9. Diagramas: modelo conceptual y flujo de pantallas

1. `docs/diagramas/modelo-conceptual.mmd` con `erDiagram`: como mínimo las entidades que implica el Anexo A.2 (especie, movimiento, criatura capturada con propietario/nivel/HP actual/XP/estado, jugador, zona, localidad, tabla de aparición, evento) más las que exijan los módulos (equipo/almacén, objetos/tienda, desbloqueos). Atributos clave y cardinalidades. Es **preliminar**: no incluye tipos SQL ni índices (eso es de la Fase 5).
2. `docs/diagramas/flujo-pantallas.mmd` con `flowchart`: un nodo por pantalla de T7 y una arista por acción de navegación, con la etiqueta de la acción.
3. Valida ambos con **MCP Mermaid, `generate`** (`code`: contenido del `.mmd`, `outputFormat: "svg"`, sin `folder` dentro del repo). Si falla el render, corrige la sintaxis; solo se versionan los `.mmd`.

```powershell
git add docs/diagramas/modelo-conceptual.mmd docs/diagramas/flujo-pantallas.mmd
git diff --cached --name-only
git commit -m "documentacion(diagramas): agrega modelo conceptual y flujo de pantallas"
```

**Commit (guía del plan):** `documentacion(diagramas): agrega modelo conceptual y flujo de pantallas`

### T10. Sección del informe

Redacta `docs/informe/01-concepto-y-diseno.md` según la sección 6 de este workflow.

```powershell
git add docs/informe/01-concepto-y-diseno.md
git diff --cached --name-only
git commit -m "documentacion(informe): agrega sección de concepto y diseño"
```

**Commit:** `documentacion(informe): agrega sección de concepto y diseño`

### T11. Verificación de salida (sin commit)

1. Ambigüedades cerradas: `git grep -nE "sin verificar|TODO|PENDIENTE|\?\?\?" -- docs` no devuelve nada (o cada resultado tiene aprobación escrita del usuario en `docs/decisiones.md`).
2. Conteos: 20 a 30 filas en el catálogo, ≥3 localidades, ≥5 zonas, ≥1 zona con desbloqueo, una tabla de aparición y una de eventos por cada zona.
3. Invariantes: recalcula a mano la suma de pesos de cada tabla (INV-01) y la `tasaCaptura` de 3 especies al azar con la fórmula de T5.
4. Los 13 módulos aparecen en la tabla de `docs/diseno-juego.md` con pantallas y endpoints.
5. Los dos `.mmd` y el grafo del mundo renderizan con MCP Mermaid.
6. `git ls-files` no incluye `.agents/`, `.env` ni los `.md` de planificación.
7. `git log --oneline desarrollo..HEAD` muestra 10 commits (T1 a T10), todos con formato válido y sin tildes rotas.

## 4. MCP a usar

| MCP | Acción exacta | Resultado esperado |
| --- | --- | --- |
| Context7 | `resolve-library-id` (`"Open5e"`) y `query-docs` sobre licencia, atribución y parámetros de `/v2/creatures/` | Licencia de `srd-2024` y texto de atribución confirmados, con URL. Si no hay biblioteca, se usa Fetch |
| Fetch | `fetch_json` con las dos consultas del Anexo A.5; `fetch_json` por candidata (`name__icontains`); `fetch_readable` sobre `/api-docs` y `/legal`; `fetch_json` sobre `/v2/documents/?key=srd-2024` | `count` de `srd-2024` (≈331), estructura real de campos y lista de campos `null` registrados en D-01 |
| Sequential Thinking | `sequentialthinking` para derivar daño, captura, XP, XP por nivel y huida, comprobando cada invariante | `docs/reglas-juego.md` coherente, con ejemplos numéricos que cumplen INV-01 a INV-05 |
| Memory (opcional) | `create_entities` / `add_observations` con fórmulas y decisiones | Solo apoyo de contexto; nunca sustituye a los archivos |
| Mermaid | `generate` con el código de `modelo-conceptual.mmd`, `flujo-pantallas.mmd` y el grafo del mundo | Los tres renderizan sin error; no se versionan imágenes |
| GitHub | `create_pull_request` y `merge_pull_request` (`merge_method: "merge"`) | PR de la fase y PR de avance mergeados con merge commit |

## 5. Criterios de salida

- [ ] `docs/decisiones.md` registra Open5e (D-01) con licencia y atribución confirmadas, y las ambigüedades D-02 a D-05 resueltas (D-05 aprobada por el usuario).
- [ ] `docs/diseno-juego.md` tiene nombre, historia, reglas generales, glosario, ≥3 localidades, ≥5 zonas, grafo y ≥1 zona con desbloqueo, y la tabla de los 13 módulos completa.
- [ ] `docs/catalogo-criaturas.md` tiene 20 a 30 especies de `srd-2024` con `key`, nombre en español, `slug` y valores normalizados, y tablas de aparición y eventos por zona que cumplen INV-01.
- [ ] `docs/reglas-juego.md` define daño, captura, XP y huida con ejemplos, el caso borde de la normalización y los invariantes INV-01 a INV-05.
- [ ] `docs/wireframes.md` cubre todas las pantallas de `FLUJO`, incluida la de créditos.
- [ ] `docs/contrato-api.md` cubre cada acción de los wireframes, con JSON de ejemplo y un formato único de error.
- [ ] `modelo-conceptual.mmd` y `flujo-pantallas.mmd` existen y renderizan.
- [ ] `docs/informe/01-concepto-y-diseno.md` existe y enlaza todos los documentos anteriores.
- [ ] Cero ambigüedades abiertas (T11.1).
- [ ] PR de la fase mergeado en `desarrollo`, PR `desarrollo → main` mergeado, ambos con merge commit, y tag `avance-1` publicado.

## 6. Informe y diagramas

**Archivo:** `docs/informe/01-concepto-y-diseno.md`. Resume y **enlaza** (no copia completos) los documentos de la fase:

1. **Concepto:** nombre, premisa e historia breve.
2. **Mundo:** localidades, zonas, grafo de conexiones y la zona con desbloqueo.
3. **Módulos:** tabla de los 13 módulos con sus pantallas y endpoints.
4. **Criaturas y API externa:** por qué Open5e `srd-2024`, criterio de selección, mapeo del Anexo A.3 con un ejemplo resuelto de una especie, y qué es externo y qué es propio (A.2).
5. **Reglas del juego:** resumen de fórmulas e invariantes, con enlace a `docs/reglas-juego.md`.
6. **Decisiones de diseño:** D-02 a D-05 en una línea cada una.
7. **Pantallas:** flujo de pantallas y enlace a `docs/wireframes.md`.
8. **Modelo conceptual** y **contrato REST**: enlaces y párrafo de resumen.
9. **Uso de MCP en la fase:** qué MCP se usó, para qué y qué evidencia produjo.
10. **Atribución y licencias:** texto literal de atribución de `srd-2024` (de D-01).

**Diagramas Mermaid a generar en esta fase:**

| Archivo | Tipo | Contenido |
| --- | --- | --- |
| `docs/diagramas/modelo-conceptual.mmd` | `erDiagram` | Modelo conceptual ER preliminar |
| `docs/diagramas/flujo-pantallas.mmd` | `flowchart` | Navegación entre todas las pantallas |
| Bloque dentro de `docs/diseno-juego.md` | `flowchart LR` | Grafo de localidades y zonas |

## 7. Cierre Git

1. `git push -u origin documentacion/fase-01-diseno`
2. **MCP GitHub, `create_pull_request`:**
   - `owner: "EduardoVal3"`, `repo: "aventura-web-criaturas"`.
   - `base: "desarrollo"`, `head: "documentacion/fase-01-diseno"`.
   - `title: "Fase 01: concepto y diseño"`.
   - `body`: la plantilla de `.github/pull_request_template.md` llena con fase 1, los IDs de la sección 1, casillas marcadas, informe `docs/informe/01-concepto-y-diseno.md` y como evidencia el `count` de Open5e de T2 y la salida de T11.
3. **MCP GitHub, `merge_pull_request`:** `merge_method: "merge"`, `commit_title: "Merge del PR #<n>: fase 01, concepto y diseño"`. **Nunca** `squash` ni `rebase`.
4. **Cierre de avance, MCP GitHub, `create_pull_request`:** `base: "main"`, `head: "desarrollo"`, `title: "Avance 1: concepto y diseño"`, `body` con la plantilla llena y enlace al PR de la fase.
5. **MCP GitHub, `merge_pull_request`:** `merge_method: "merge"`, `commit_title: "Merge del PR #<n>: avance 1"`.
6. Tag sobre el merge commit en `main` (crear un tag no es un commit, así que no rompe R2):

   ```powershell
   git fetch origin
   git switch main
   git pull
   git log -1 --format="%h %s"
   git tag -a avance-1 -m "Avance 1: concepto y diseño"
   git push origin avance-1
   git ls-remote --tags origin avance-1
   git switch desarrollo
   git pull
   ```

   El `git log` debe mostrar el merge commit del PR de avance. `ls-remote` debe listar el tag. Termina en `desarrollo` y **no** hagas ningún commit en `main`.
7. **No** borres la rama de la fase.

## 8. No hacer

- No escribir código: nada en `apps/`, ni scripts, ni `package.json`. El adaptador de Open5e, `importar:especies` y sus pruebas son de fases posteriores.
- No versionar respuestas de Open5e ni crear `datos/open5e-srd-2024-seleccion.json` (el snapshot lo crea la fase del adaptador).
- No instalar Vite, React, Tailwind, shadcn ni 8bitcn (Fase 2), ni NestJS o Prisma (Fases 4 y 5).
- No convertir el modelo conceptual en esquema Prisma, tipos SQL, índices ni migraciones (Fase 5).
- No escribir pruebas de los invariantes: aquí solo se definen; se implementan en las Fases 6 y 7.
- No generar ni versionar imágenes de criaturas ni PNG/SVG de diagramas; solo `.mmd`.
- No añadir el aviso de licencia de 8bitcn al repositorio (Fase 2); en esta fase solo se diseña la pantalla de créditos.
- No modificar `.agents/`, `docs/INDICE.md`, `docs/mcp.md` ni `docs/reglas-de-trabajo.md`, y no commitear `.agents/`, `.env` ni los `.md` de planificación.
- No hacer commits en `main`, ni squash, `push --force` o `--no-verify`, y no borrar ramas de fase.
