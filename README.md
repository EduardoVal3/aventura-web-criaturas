# Aethelgard: Sendas y Criaturas

Aplicación web tipo RPG táctico por turnos de exploración, captura, gestión de equipo y combate elemental.  
**Proyecto Integrador — ISC-305 Programación Web (III PAC 2026).**

> **Estado actual del proyecto:** **Versión `1.0.1` — Fases 0 a 12 completadas + auditoría integral de coherencia documental.**  
> La aplicación cuenta con Front-End en React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + `8bitcn/ui` conectado a un Back-End en NestJS 10 + Prisma 6 + PostgreSQL 17 + JWT (**44 rutas REST / 46 operaciones HTTP**), con 30 especies canónicas (basadas en Open5e SRD 5.2), pipeline completo de assets pixel-art WebP, 6 zonas desbloqueables con dioramas animados, motor de combate táctico con 51 efectos mecánicos únicos, afinidades elementales, captura con talismanes, tienda, inventario, santuario de curación, **API Gateway Kong 3.9.5 DB-less (`X-API +2`)**, **auditoría integral `8bitcn/ui` (`X-UI +3`)** y despliegue gratuito en nube (**Cloudflare Pages + Render Free + Neon**).

---

## Tabla de Contenidos

1. [¿De qué trata el proyecto y cómo está construido?](#1-de-qué-trata-el-proyecto-y-cómo-está-construido)
2. [Requisitos previos](#2-requisitos-previos)
3. [Instalación y arranque paso a paso (Con Docker o con PostgreSQL local)](#3-instalación-y-arranque-paso-a-paso-con-docker-o-con-postgresql-local)
4. [Estructura del monorepo](#4-estructura-del-monorepo)
5. [Reglas de oro para contribuir (Lectura obligatoria para el equipo)](#5-reglas-de-oro-para-contribuir-lectura-obligatoria-para-el-equipo)
6. [Flujo de Git y Pull Requests (Todo va hacia `desarrollo`, NUNCA a `main`)](#6-flujo-de-git-y-pull-requests-todo-va-hacia-desarrollo-nunca-a-main)
7. [Cómo trabajar con Agentes de IA sin cometer errores](#7-cómo-trabajar-con-agentes-de-ia-sin-cometer-errores)
8. [Documentación en `/docs` y qué debes actualizar en cada cambio](#8-documentación-en-docs-y-qué-debes-actualizar-en-cada-cambio)
9. [Estado de entrega (`v1.0.1`) y guía de defensa](#9-estado-de-entrega-v101-y-guía-de-defensa)
10. [Comandos útiles de desarrollo y verificación](#10-comandos-útiles-de-desarrollo-y-verificación)
11. [Créditos y licencias](#11-créditos-y-licencias)

---

## 1. ¿De qué trata el proyecto y cómo está construido?

**Aethelgard: Sendas y Criaturas** es un juego RPG web donde el jugador crea una cuenta con su personaje explorador, elige su criatura inicial y recorre las regiones de Aethelgard descubriendo criaturas salvajes, combatiendo por turnos con ventajas elementales y estados alterados, capturando nuevas especies mediante talismanes, organizando su equipo activo (máximo 6 criaturas) y almacén de reserva, comprando consumibles en el bazar y restaurando a su escuadrón en el santuario.

### Principios arquitectónicos clave

1. **Soberanía total del servidor (`apps/api`):** Toda regla del juego (fórmulas de daño, probabilidades de captura, experiencia, subida de nivel, economía de monedas, desbloqueo de zonas y validación de turnos) se calcula y valida **exclusivamente en el Back-End**. El Front-End jamás decide resultados ni envía modificadores de daño o probabilidades; únicamente representa el estado devuelto por el servidor.
2. **Identidad segura por JWT (`S-1`):** El `personajeId` y `usuarioId` se extraen siempre del token JWT verificado en el servidor (`AutenticacionGuard` + `@UsuarioActual()`), nunca desde el cuerpo (`body`) ni parámetros de la URL.
3. **Aislamiento de la API externa (`Anexo A.4`):** El catálogo de 30 criaturas parte de datos de **Open5e (SRD 5.2)** normalizados e importados a la base de datos local (`prisma/seed.ts` y `bestiario-canonico.ts`). Durante el juego en vivo no se depende de llamadas externas para evitar latencia o caídas de terceros.
4. **Aleatoriedad determinista para pruebas:** Todo cálculo probabilístico utiliza la interfaz `GeneradorAleatorio` inyectable, lo que permite probar casos borde con generadores fijos en las suites unitarias y e2e.
5. **Estética Retro Aethelgard (`8bitcn/ui`):** Interfaz inspirada en clásicos de 8-bit/16-bit con paleta oscura de alto contraste (`docs/DESIGN.md`), tipografía bimodal (`Press Start 2P` para encabezados/controles y `Geist` para lectura fluida), efectos de sonido sintetizados mediante Web Audio API y **cero emojis Unicode** en controles (se usan iconos vectoriales de `lucide-react`).

---

## 2. Requisitos previos

Asegúrate de tener instaladas las siguientes herramientas antes de clonar el proyecto:

- **Node.js:** `v24.0.0` o superior (`node -v`)
- **pnpm:** `v10.28.1` (`corepack enable && corepack prepare pnpm@10.28.1 --activate` o `npm i -g pnpm@10.28.1`)
- **Base de datos PostgreSQL (elige UNA de las dos opciones):**
  - **Opción A (Sin Docker):** Tener **PostgreSQL** (v15, v16 o v17) instalado localmente en tu computadora.
  - **Opción B (Con Docker):** Tener **Docker Desktop** instalado y en ejecución.
- **Git:** Configurado con tu nombre y correo (`git config --global user.name` y `git config --global user.email`)

---

## 3. Instalación y arranque paso a paso (Con Docker o con PostgreSQL local)

> [!IMPORTANT]
> **¡Atención al clonar!** La rama activa de trabajo del equipo es **`desarrollo`**. La rama `main` solo recibe cierres de avance calificados, por lo que al clonar debes cambiarte inmediatamente a `desarrollo`.

### Paso 1: Clonar y ubicarse en la rama `desarrollo`

```bash
git clone https://github.com/EduardoVal3/aventura-web-criaturas.git
cd aventura-web-criaturas
git switch desarrollo
git pull origin desarrollo
```

### Paso 2: Configurar las variables de entorno (`.env`)

Los archivos `.env` contienen credenciales locales y **nunca se suben a GitHub**. Debes crear tres archivos `.env` copiando las plantillas incluidas en el repositorio:

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

**En Linux / macOS / Git Bash:**
```bash
cp .env.example .env
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

- **Si usas PostgreSQL instalado localmente (sin Docker):** Abre `.env` y `apps/api/.env` y reemplaza `cambiar_esta_contrasena` por la contraseña real de tu usuario `postgres` local (tanto en `POSTGRES_PASSWORD` como dentro de la cadena `DATABASE_URL`).
- **Si usas Docker:** Puedes dejar la contraseña que viene en la plantilla o ajustarla (siempre que coincida en `.env` y `apps/api/.env`).

### Paso 3: Instalar dependencias y activar los hooks de protección de Git

```bash
pnpm install
```
> Al ejecutar `pnpm install`, el script `prepare` configura automáticamente `.githooks/` como ruta de hooks de Git. Estos hooks **bloquean cualquier intento de hacer commit directo en `main`** y **validan que todos los mensajes de commit cumplan el formato en español**.

### Paso 4: Preparar la base de datos, migraciones y catálogo (Seed)

Elige **una** de las dos alternativas según tu entorno:

#### Alternativa A: Usando PostgreSQL instalado en local (sin Docker)
1. Asegúrate de que el servicio de PostgreSQL esté corriendo en tu máquina y crea la base de datos `aventura_criaturas` (desde pgAdmin o en terminal con `psql -U postgres -c "CREATE DATABASE aventura_criaturas;"`).
2. Ejecuta las migraciones y el seed:
   ```bash
   pnpm --filter api exec prisma migrate deploy
   pnpm --filter api exec prisma generate
   pnpm --filter api exec prisma db seed
   ```

#### Alternativa B: Usando Docker Desktop
1. Levanta el contenedor de PostgreSQL y aplica las migraciones y el seed:
   ```bash
   docker compose up -d postgres
   pnpm --filter api exec prisma migrate deploy
   pnpm --filter api exec prisma generate
   pnpm --filter api exec prisma db seed
   ```

### Paso 5: Iniciar el entorno de desarrollo

Desde la raíz del monorepo puedes arrancar tanto el Back-End como el Front-End en paralelo:

```bash
# Intenta levantar el contenedor de Docker si tienes Docker activo; si no tienes Docker, usa tu PostgreSQL local automáticamente:
pnpm dev

# O si prefieres saltar por completo la verificación de Docker y usar directo tu PostgreSQL local:
pnpm dev:local
```

- **Aplicación Web (Front-End):** [http://localhost:5173](http://localhost:5173) (vitrina retro en `/kit-ui`)
- **Servidor API (Back-End — Salud):** [http://localhost:3000/api/salud](http://localhost:3000/api/salud)
- **Documentación interactiva Swagger:** [http://localhost:3000/docs](http://localhost:3000/docs) (exportada en [`docs/swagger-openapi.json`](docs/swagger-openapi.json))

#### Modo opcional con API Gateway Kong DB-less (`X-API +2`)
1. Define `KONG_CLAVE_API=<tu_clave_local>` en `.env` (raíz) y en `apps/web/.env` configura `VITE_URL_API=http://localhost:8000` junto con `VITE_CLAVE_GATEWAY=<tu_clave_local>`.
2. Levanta Kong y verifica `401`, CORS `OPTIONS`, proxy `200` y `429 Too Many Requests` en `/api/exploracion`:
   ```bash
   docker compose up -d postgres kong
   node scripts/verificar-gateway.mjs
   docker compose logs --tail=15 kong
   ```

---

## 4. Estructura del monorepo

```text
aventura-web-criaturas/
├── .github/
│   └── pull_request_template.md   # Plantilla obligatoria al abrir cada Pull Request
├── .githooks/
│   ├── pre-commit                 # Bloquea commits directos en main/master
│   └── commit-msg                 # Exige formato: tipo(alcance): descripción en español
├── apps/
│   ├── api/                       # Back-End en NestJS 10 + Prisma 6 + PostgreSQL 17
│   │   ├── prisma/                # schema.prisma, migraciones, seed.ts, importar-especies.ts e inicializar-nube.ts
│   │   ├── src/
│   │   │   ├── comun/             # Guards JWT, filtros de excepción, decoradores, Prisma, azar
│   │   │   └── modulos/           # 15 módulos de dominio (autenticacion, usuarios, personajes, mundo,
│   │   │                          # exploracion, encuentros, combate, criaturas, equipo,
│   │   │                          # inventario, tienda, curacion, progreso, historial, externo)
│   │   └── test/                  # Pruebas unitarias (*.spec.ts) y extremo a extremo (*.e2e-spec.ts)
│   └── web/                       # Front-End en React 19 + TypeScript + Vite 8 + Tailwind v4
│       ├── public/assets/         # Recursos gráficos WebP (criaturas, zonas, battlegrounds, objetos)
│       ├── src/
│       │   ├── api/               # Cliente HTTP único (apiHttp.ts), contrato (ApiJuego.ts) y tipos
│       │   ├── components/        # LayoutPrincipal, RutaProtegida, combate, mundo y 17 componentes 8bitcn/ui
│       │   ├── contextos/         # ContextoAutenticacion (sesión JWT y estado del jugador)
│       │   ├── lib/               # Utilidades de dominio UI, dioramas Canvas, audio Web Audio API y validadores
│       │   └── paginas/           # 15 pantallas activas (Ingreso, Registro, CrearPersonaje, HubUbicacion,
│       │                          # Exploracion, Combate, Equipo, Almacen, Inventario, Tienda, Curacion,
│       │                          # Historial, Catalogo, PaginaKitUi, PaginaCreditos) + PaginaNoEncontrada
│       └── test/                  # Pruebas unitarias de interfaz y lógica cliente (*.spec.ts)
├── datos/
│   └── open5e-srd-2024-seleccion.json # Snapshot base de 30 criaturas SRD 5.2
├── kong/
│   └── kong.yml.plantilla         # Plantilla declarativa DB-less sin secretos (Kong 3.9.5)
├── scripts/
│   └── verificar-gateway.mjs      # Verificación reproducible 401/CORS/200/429 de Kong
├── docs/                          # Documentación técnica, reglas, diagramas PNG e informe final
├── docker-compose.yml             # Contenedores opcionales PostgreSQL 17 y Kong 3.9.5 DB-less
└── package.json                   # Scripts globales del workspace pnpm
```

---

## 5. Reglas de oro para contribuir (Lectura obligatoria para el equipo)

Antes de escribir una sola línea de código, todo integrante debe conocer las 3 reglas transversales detalladas en [`docs/reglas-de-trabajo.md`](docs/reglas-de-trabajo.md):

### R1. Código, rutas, modelos, commits y textos 100% en español

- **Todo lo que nombramos nosotros va en español:** variables, funciones, clases, interfaces, DTOs, modelos y columnas de Prisma, rutas REST (`/api/exploracion`, `/api/combate/atacar`), nombres de archivos (`captura.service.ts`, `PantallaCombate.tsx`), ramas de Git, mensajes de commit, comentarios y textos visibles en pantalla.
- **Convenciones de escritura:**
  - Los identificadores de código **no llevan tildes ni `ñ`** (`exploracion`, `contrasena`, `danio`); los comentarios y los textos de la interfaz de usuario **sí llevan ortografía completa** con tildes y `ñ`.
  - Variables y funciones en `camelCase`, clases/componentes/modelos en `PascalCase`, constantes en `MAYUSCULAS_CON_GUION_BAJO`, archivos de Back-End en `kebab-case` (`motor-combate.ts`) y componentes de React en `PascalCase` (`PanelTactico.tsx`).
  - Hooks propios de React llevan el prefijo `use` seguido del nombre en español (`useAutenticacion`), porque React impone `use`.
- **Cero emojis Unicode en la interfaz:** No uses emojis (`⚔️`, `🧪`, `❤️`, etc.) en botones, etiquetas ni paneles del juego. Usa exclusivamente iconos SVG de `lucide-react`.
- **Únicas palabras en inglés permitidas (Glosario Técnico):**
  - Palabras reservadas del lenguaje/librerías (`const`, `async`, `useState`, `findMany`, `@Controller`, `CanActivate`).
  - Componentes generados por `8bitcn/ui` y `shadcn/ui` (`Button`, `Card`, `HealthBar`, `Badge`, `Dialog`).
  - Siglas universales (`HP`, `XP`, `JWT`, `API`, `DTO`, `HTTP`, `JSON`, `SQL`, `ID`, `CORS`, `CRUD`, `REST`, `URL`).
  - Sufijos arquitectónicos del glosario: `Guard`, `Controller`, `Service`, `Module`, `Pipe`, `Filter`, `Interceptor`, `Middleware`, `Gateway`, `Layout`, `seed`, `token`, `payload`.

### R2. Prohibido subir archivos de configuración de agentes o herramientas

- **En GitHub solo debe vivir el código fuente, las pruebas y la documentación oficial del proyecto.**
- El archivo `.gitignore` ya está configurado para ignorar directorios y archivos de agentes de IA, servidores MCP e IDEs (`.agents/`, `.agent/`, `.gemini/`, `.claude/`, `.cursor/`, `.windsurf/`, `.cline/`, `.roo/`, `.vscode/`, `.idea/`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.mcp.json`, `mcp_config.json`, `graphify-out/`, `docs/workflows/`, etc.).
- **Nunca uses `git add -f`** para forzar la subida de configuraciones personales de tu editor o agente de IA, ni subas jamás archivos `.env`.

### R3. Calidad y cero regresiones antes de subir cambios

Ninguna rama puede abrir Pull Request si rompe la compilación o las pruebas existentes. Antes de hacer `git push`, ejecuta siempre:

```bash
pnpm --filter api test
pnpm --filter web test
pnpm --filter web build
pnpm --filter web lint
```

---

## 6. Flujo de Git y Pull Requests (Todo va hacia `desarrollo`, NUNCA a `main`)

El historial de Git es evaluado directamente por el profesor para verificar la evolución progresiva y el aporte individual de cada miembro del equipo.

```mermaid
flowchart LR
    D1["desarrollo (Rama base del equipo)"] --> R["Crear rama:<br/>tipo/fase-XX-descripcion"]
    R --> C["Commits atómicos en español:<br/>tipo(alcance): descripción"]
    C --> V["Validar:<br/>tests + build + actualizar /docs"]
    V --> PR["Abrir Pull Request<br/>base: desarrollo ← compare: tu-rama"]
    PR --> MC["Integrar con Merge Commit<br/>(NUNCA Squash ni Rebase)"]
    MC --> D2["desarrollo actualizado"]
    D2 -. "Solo en cierres oficiales" .-> M["main (tags: version-1.0.0, version-1.0.1)"]
```

### Reglas estrictas de ramas, commits y PRs

1. **PROHIBIDO hacer commits o Pull Requests directos a `main`:**
   - `main` es únicamente la rama de entregas cerradas.
   - **Todo el trabajo diario sale de `desarrollo` y vuelve a `desarrollo` mediante Pull Request.**
2. **Nomenclatura de ramas:**
   Crea una rama nueva desde `desarrollo` por cada tarea, pantalla, extra o corrección usando uno de los prefijos permitidos:
   - `funcionalidad/<nombre>` (ej. `funcionalidad/fase-11b-auditoria-ui`)
   - `configuracion/<nombre>` (ej. `configuracion/fase-11a-api-gateway`)
   - `correccion/<nombre>` (ej. `correccion/ajuste-responsive-tienda`)
   - `documentacion/<nombre>` (ej. `documentacion/fase-12-entrega-final`)
   - `pruebas/<nombre>` (ej. `pruebas/cobertura-endpoints-progreso`)
3. **Formato obligatorio de commits (validado por `.githooks/commit-msg`):**
   ```text
   tipo(alcance): descripción clara en español de al menos 10 caracteres
   ```
   - **Tipos válidos:** `funcionalidad`, `correccion`, `documentacion`, `configuracion`, `pruebas`, `refactorizacion`, `diseno`.
   - **Ejemplos correctos:**
     - `configuracion(gateway): agrega Kong DB-less al docker-compose`
     - `funcionalidad(ux-combate): agrega indicador visual de turno activo`
     - `documentacion(informe): documenta evidencia de rate-limiting en 10-extras`
   - Haz **commits pequeños y atómicos** (un commit por cada subtarea lógica; no acumules 30 archivos distintos en un solo commit gigante).
   - **Historial honesto:** Prohibido alterar fechas (`--date`, `GIT_AUTHOR_DATE`), prohibido usar `git push --force` y prohibido reescribir la historia.
4. **Cómo abrir e integrar tu Pull Request en GitHub:**
   ```bash
   # 1. Asegúrate de partir de desarrollo actualizado
   git switch desarrollo
   git pull origin desarrollo

   # 2. Crea tu rama de trabajo
   git switch -c <tipo>/<nombre-de-tu-tarea>

   # 3. Realiza tus cambios, corre las pruebas, actualiza /docs y haz commits atómicos
   git add <archivos-modificados>
   git commit -m "tipo(alcance): descripción en español"

   # 4. Sube tu rama al repositorio remoto
   git push -u origin <tipo>/<nombre-de-tu-tarea>
   ```
   - Entra a GitHub y crea el Pull Request asegurándote de seleccionar:
     - **base:** `desarrollo` *(¡Verifica que NO diga `main`!)*
     - **compare:** `<tipo>/<nombre-de-tu-tarea>`
   - Completa todas las secciones y casillas de verificación de la plantilla automática (`.github/pull_request_template.md`).
   - Al integrar el PR, usa **exclusivamente la opción "Create a merge commit"** (`--no-ff`). **Nunca uses "Squash and merge" ni "Rebase and merge"**, porque el squash borra los commits individuales de la historia.

---

## 7. Cómo trabajar con Agentes de IA sin cometer errores

Si utilizas asistentes o agentes de programación con IA (Cursor, Antigravity/Gemini, Claude Code, Windsurf, GitHub Copilot, Cline, Roo Code, etc.), sigue este protocolo para que el agente respete la arquitectura del proyecto y no introduzca errores:

### 7.1 Configuración local de tu agente
- Cualquier archivo de instrucciones de tu agente (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.agents/`, `.cursor/`, `.claude/`, `.mcp.json`, etc.) **es local a tu máquina** y ya está ignorado en `.gitignore`.
- Si deseas configurar servidores **MCP (Model Context Protocol)** en tu IDE (PostgreSQL, Docker, Fetch, Mermaid, Context7, GitHub, Graphify), revisa la guía y plantilla sin credenciales en [`docs/mcp.md`](docs/mcp.md).

### 7.2 Qué contexto darle al agente al iniciar una sesión (Ahorro de tokens)
No le pidas al agente que lea todo el repositorio a ciegas. En tu primer mensaje (o en tus reglas locales del agente), indícale que lea primero estos documentos ligeros:
1. **[`docs/INDICE.md`](docs/INDICE.md):** Es el enrutador maestro (~2 KB) que explica en qué fase estamos y qué documento consultar según el dominio.
2. **[`docs/reglas-de-trabajo.md`](docs/reglas-de-trabajo.md):** Contiene la regla R1 (español estricto y glosario), R2 (commits y ramas) y las 7 reglas transversales de diseño.
3. **Solo el documento del dominio que vayas a tocar:**
   - Si vas a tocar Front-End / UI → [`docs/DESIGN.md`](docs/DESIGN.md)
   - Si vas a tocar endpoints / DTOs → [`docs/contrato-api.md`](docs/contrato-api.md)
   - Si vas a tocar fórmulas / balance / combate → [`docs/reglas-juego.md`](docs/reglas-juego.md) y [`docs/catalogo-criaturas.md`](docs/catalogo-criaturas.md)

### 7.3 Flujo de trabajo en dos tiempos con el agente
1. **Tiempo 1 — Diagnóstico y Planificación:** Pídele al agente que analice los archivos involucrados, verifique que no se rompa ninguna regla del servidor y divida el trabajo en subtareas pequeñas con sus mensajes de commit en español.
2. **Tiempo 2 — Ejecución Quirúrgica y Verificación:**
   - Pídele que implemente una subtarea a la vez.
   - Exígele que verifique que no haya emojis Unicode en la UI, que use los componentes de `src/components/ui/8bit/`, que prevenga el doble clic en botones asíncronos (`disabled` / `aria-busy`) y que mantenga el diseño responsive sin desbordamiento horizontal (`overflow-x`).
   - Pídele que ejecute `pnpm --filter api test`, `pnpm --filter web test` y `pnpm --filter web build` antes de cada commit.
3. **Tiempo 3 — Sincronización Documental Obligatoria:** Pídele al agente que actualice los archivos correspondientes dentro de `/docs` (ver sección 8) antes de dar por terminada la tarea.

---

## 8. Documentación en `/docs` y qué debes actualizar en cada cambio

> [!WARNING]
> **Regla crítica del equipo:** Ningún cambio en el código está completo si no se actualiza su documentación en `/docs`. El informe técnico final para el ingeniero Claudio se construye directamente a partir de `/docs/informe/` y los documentos satélite.

### Mapa completo de `/docs` y cuándo actualizar cada archivo

| Archivo o Carpeta | Qué contiene | ¿Cuándo estás OBLIGADO a actualizarlo? |
| :--- | :--- | :--- |
| [`docs/INDICE.md`](docs/INDICE.md) | Mapa general de fases (0 a 13), estado de cada una y tabla de documentos satélite. | Cuando se inicia o se completa una fase o subfase (cambiar estado a `✅ Completada`). |
| [`docs/reglas-de-trabajo.md`](docs/reglas-de-trabajo.md) | Reglas R1 (español y glosario), R2 (Git y hooks), R3 (MCP) y reglas transversales. | Si el equipo acuerda agregar un término técnico nuevo al glosario permitido. |
| [`docs/contrato-api.md`](docs/contrato-api.md) | Especificación completa de todos los endpoints REST (`/api/...`), parámetros, DTOs, respuestas JSON y códigos de error. | **Siempre** que agregues un endpoint nuevo o modifiques la ruta, cuerpo de petición o respuesta JSON de un endpoint existente. |
| [`docs/reglas-juego.md`](docs/reglas-juego.md) | Todas las fórmulas matemáticas del servidor: normalización, daño elemental, probabilidad de captura, curva de XP, efectos de estado y economía. | **Siempre** que ajustes una fórmula matemática, probabilidad, efecto de combate, precio o invariante numérico (junto con su prueba unitaria). |
| [`docs/catalogo-criaturas.md`](docs/catalogo-criaturas.md) | Bestiario canónico de las 30 criaturas, jerarquías (`J-1` a `J-5`), estadísticas base, sets de 4 movimientos y tablas de aparición por zona. | Si modificas estadísticas base, movimientos asignados o pesos de aparición en `bestiario-canonico.ts` o `seed.ts`. |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Sistema de diseño retro Aethelgard: paleta HSL, tipografía bimodal, bordes pixelados, componentes `8bitcn/ui` y reglas de accesibilidad. | Si creas nuevos tokens de color, estilos globales en `index.css` o patrones visuales reutilizables. |
| [`docs/decisiones.md`](docs/decisiones.md) | Bitácora de decisiones arquitectónicas y técnicas (`D-01` a `D-23`) con justificación, URL oficial y versión verificada. | **Siempre** que incorpores una tecnología o librería nueva (p. ej. Kong en la Fase 11), cambies una regla de alcance o tomes una decisión de arquitectura. |
| [`docs/diseno-juego.md`](docs/diseno-juego.md) y [`docs/wireframes.md`](docs/wireframes.md) | Concepto narrativo del mundo de Aethelgard, bucle principal del jugador y bocetos estructurales de las pantallas. | Si se agrega una pantalla nueva o cambia el flujo de navegación entre vistas. |
| [`docs/mcp.md`](docs/mcp.md) | Documentación y plantilla (sin credenciales) de los servidores MCP de apoyo. | Si se añade un nuevo servidor MCP al flujo de desarrollo. |
| [`docs/diagramas/*.mmd`](docs/diagramas/) | Código fuente Mermaid y exportaciones PNG de los 10 diagramas de arquitectura, modelos de datos, estados, flujos y secuencias. | **Siempre** que cambie el esquema de Prisma (`modelo-datos.mmd`), la arquitectura de contenedores o un flujo de secuencia. |
| [`docs/informe/`](docs/informe/) | Capítulos completos del Informe Técnico académico (`01-concepto-y-diseno.md` hasta `11-pruebas-y-demo.md` e `INFORME-FINAL.md`). | **En cada tarea, mejora de UI o fase.** Todo aporte debe quedar redactado técnicamente en la sección correspondiente de `docs/informe/` detallando qué problema resuelve, cómo se implementó y qué pruebas lo respaldan. |

### Estructura actual de `docs/informe/`

1. `01-concepto-y-diseno.md` — Concepto del juego, mundo, módulos y bucle jugable (Fase 1).
2. `02-frontend-y-sistema-de-diseno.md` — Arquitectura Front-End, React, Tailwind y `8bitcn/ui` (Fase 2).
3. `03-prototipo-frontend.md` — Navegación de pantallas y estados del cliente (Fase 3).
4. `04-backend-y-api-rest.md` — Arquitectura NestJS, controladores, guards JWT e integración Front↔API (Fases 4 y 8).
5. `05-modelo-de-datos.md` — Esquema relacional en PostgreSQL, Prisma y migraciones (Fase 5).
6. `06-reglas-de-juego.md` — Motor de exploración, combate por turnos, captura, progresión y economía (Fases 6 y 7).
7. `07-integracion-externa.md` — Adaptador y normalización del catálogo desde Open5e SRD 5.2 (Fase 5b).
8. `08-seguridad.md` — Cumplimiento y pruebas e2e de los requisitos de seguridad `S-1` a `S-7` (Fase 9).
9. `09-experiencia-usuario.md` — Auditoría y rediseño UX retro pantalla por pantalla, bestiario canónico, dioramas Canvas/WebP y motor táctico (Fase 10).
10. `10-extras.md` — API Gateway Kong 3.9.5 DB-less con evidencia real `429`/logs (`X-API +2`) y auditoría funcional `8bitcn/ui` (`X-UI +3`) (Fase 11).
11. `11-pruebas-y-demo.md` — Resultados de 268 pruebas automatizadas, guion de demo de ~10 min y reparto de defensa para los 8 integrantes (Fase 12).
12. **`INFORME-FINAL.md`** — Índice maestro consolidado de entrega con matriz de cobertura, contrato OpenAPI y galería de los 10 diagramas PNG.

---

## 9. Estado de entrega (`v1.0.1`) y guía de defensa

### 9.1 Todas las fases obligatorias y extras completadas (Fases 0 a 12)

| Fase | Alcance completado | Estado |
| :---: | :--- | :---: |
| **Fases 0 a 3** | Cimientos del monorepo, diseño conceptual, sistema de diseño `8bitcn/ui` y todas las pantallas del cliente. | ✅ Completada |
| **Fases 4 a 7** | Back-End en NestJS 10 + JWT, modelo de datos en PostgreSQL 17/Prisma 6, importación Open5e, exploración ponderada, combate por turnos, captura, equipo/almacén, tienda, inventario, curación e historial. | ✅ Completada |
| **Fases 8 y 9** | Integración completa Front-End ↔ API REST y suite de seguridad `S-1` a `S-7` en verde. | ✅ Completada |
| **Fase 10** | Pulido UX retro integral pantalla por pantalla, audio Web Audio API, bestiario canónico de 30 criaturas, combate táctico con 51 efectos, pipeline WebP completo (30 criaturas, 9 zonas, 6 arenas, 4 objetos), dioramas animados y despliegue gratuito en nube (`Cloudflare Pages + Render Free + Neon`). | ✅ Completada |
| **Fase 11 (`+5 pts`)** | **11a (`X-API +2`):** Kong 3.9.5 DB-less en Docker (`cors`, `key-auth`, `rate-limiting` `429` y logs) con `kong/kong.yml.plantilla` sin secretos. **11b (`X-UI +3`):** Auditoría verificada de los 17 componentes `8bitcn/ui` en 15 pantallas + vitrina `/kit-ui`. | ✅ Completada |
| **Fase 12 (`FIN`)** | Informe consolidado ([`INFORME-FINAL.md`](docs/informe/INFORME-FINAL.md)), 10 diagramas `.mmd`/`.png` sincronizados ([`docs/diagramas/`](docs/diagramas/)), OpenAPI exportado ([`docs/swagger-openapi.json`](docs/swagger-openapi.json)), guion de demo y defensa para 8 integrantes ([`11-pruebas-y-demo.md`](docs/informe/11-pruebas-y-demo.md)), cierre `desarrollo → main` (`version-1.0.0`) y auditoría integral de coherencia documental (`version-1.0.1`). | ✅ Completada |
| **Fase 13 (Opcional)** | Presencia WebSockets sin puntaje extra (explícitamente opcional en el enunciado `A-7`). | Descartada |

---

### 9.2 Guion de demostración y defensa en equipo (8 integrantes)

El guion paso a paso de ~10 minutos (con arranque local precompilado integrado a Kong + respaldo en nube), el reparto de módulos para los 8 integrantes y el banco de preguntas técnicas se encuentran en **[`docs/informe/11-pruebas-y-demo.md`](docs/informe/11-pruebas-y-demo.md)**.

---

## 10. Comandos útiles de desarrollo y verificación

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Intenta levantar PostgreSQL en Docker (si tienes Docker activo) o usa tu PostgreSQL local automáticamente, y arranca en paralelo el Back-End (`:3000`) y el Front-End (`:5173`). |
| `pnpm dev:local` | Arranca directamente el Back-End (`:3000`) y el Front-End (`:5173`) usando tu instalación local de PostgreSQL (sin invocar Docker). |
| `pnpm --filter api test` | Ejecuta todas las pruebas unitarias del servidor NestJS (motor de combate, captura, equipo, progreso, etc.). |
| `pnpm --filter api test:e2e` | Ejecuta las pruebas de integración extremo a extremo (requiere PostgreSQL activo). |
| `pnpm --filter web test` | Ejecuta todas las pruebas unitarias del Front-End. |
| `pnpm --filter web build` | Compila el Front-End con verificación estricta de tipos TypeScript (`tsc -b && vite build`). |
| `pnpm --filter web lint` | Ejecuta el linter ultrarrápido `oxlint` sobre el Front-End. |
| `pnpm --filter api build` | Compila el Back-End de NestJS en `apps/api/dist`. |
| `pnpm --filter api exec prisma migrate deploy` | Aplica las migraciones pendientes en la base de datos PostgreSQL local. |
| `pnpm --filter api exec prisma db seed` | Ejecuta `apps/api/prisma/seed.ts` para sembrar zonas, especies canónicas, movimientos y objetos. |
| `docker compose ps` | Verifica el estado de los contenedores de Docker del proyecto (si usas Docker). |

---

## 11. Créditos y licencias

- **8bitcn/ui:** Componentes retro de interfaz de usuario ([TheOrcDev/8bitcn-ui](https://github.com/TheOrcDev/8bitcn-ui)). Licencia MIT.
  > Copyright (c) 2025 8bitcn
- **Open5e y SRD 5.2:** Datos base del catálogo de criaturas. Licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
  > "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
