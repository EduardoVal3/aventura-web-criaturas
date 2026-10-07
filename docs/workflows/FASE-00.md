# Workflow Fase 0: Cimientos del repositorio y entorno

> Lo ejecuta la IA flash del IDE, **una tarea a la vez y en orden**. Fuente de verdad: `Plan_Desarrollo_ISC305_Entregable1.md` (§1, §7 y §8 Fase 0).
> Si un paso falla o algo no encaja con este documento: **detente y pregunta al usuario**. No improvises ni te adelantes a otras fases.

## 0. Datos fijos y decisiones ya tomadas

| Dato | Valor |
| --- | --- |
| Repositorio | `EduardoVal3/aventura-web-criaturas`, **público** |
| URL remota | `https://github.com/EduardoVal3/aventura-web-criaturas.git` |
| Rama de la fase | `configuracion/fase-00-cimientos` (sale de `desarrollo`) |
| Gestor de paquetes | pnpm workspaces (`pnpm@10.28.1`), Node 24 |
| Apps en esta fase | Andamiaje **provisional sin dependencias** (`node:http`). Vite (Fase 2) y NestJS (Fase 4) lo reemplazan |
| Puertos | web `5173`, API `3000`, PostgreSQL `5432` |
| Imagen BD | `postgres:17-alpine`, contenedor `aventura-postgres` |
| Tag | `version-0.0.0` sobre el merge commit de la fase **en `desarrollo`**. No hay PR a `main` en esta fase |
| `.agents/` | **No se versiona** (contiene el token de GitHub). Va completo en `.gitignore` |

**Terminal:** PowerShell 5.1. No uses `&&`. Ejecuta un comando por línea y revisa la salida antes de seguir.

**Reglas que aplican siempre (R1, R2 y R3):**

- Código, comentarios, commits y textos en español.
- Nunca hagas commits en `main` ni en `master`.
- Un commit por tarea, con el mensaje exacto indicado.
- No uses `--no-verify`, `push --force`, `rebase -i` ni `--date`.
- No borres ramas de fase después del merge: son evidencia.
- **Antes de cada commit** ejecuta `git diff --cached --name-only` y verifica que no aparecen `.agents/`, `.env`, `Plan_Desarrollo_ISC305_Entregable1.md` ni `Proyecto Integrador ISC305 Aventura Web Criaturas.md`. Agrega archivos por ruta explícita, nunca `git add .`.

## 1. Objetivo y requisitos cubiertos

Dejar el repositorio, el entorno local y las reglas de trabajo listos para que las Fases 1 a 12 solo agreguen funcionalidad.
Cubre: **T-1, T-11, ARQ, S-7, R1, R2, R3**.

## 2. Precondiciones (verificar antes de T0)

1. Docker Desktop está corriendo: `docker info` responde sin error. Si falla, **pide al usuario que abra Docker Desktop** y espera.
2. `gh auth status` muestra la cuenta `EduardoVal3`.
3. `node --version` da v24.x y `pnpm --version` da 10.28.1.
4. La raíz del workspace **no** tiene `.git` (`Test-Path .git` debe dar `False`).
5. El repo no existe todavía: `gh repo view EduardoVal3/aventura-web-criaturas` debe fallar con "Could not resolve". Si ya existe, **detente y pregunta**.
6. Los MCP `github`, `docker` y `postgres` aparecen conectados en el IDE.

## 3. Tareas

### T0. GitHub y Git local (sin commit propio)

1. **MCP GitHub, `create_repository`:** `name: "aventura-web-criaturas"`, `description: "Aventura web de exploración y criaturas · Proyecto Integrador ISC-305"`, `private: false`, `autoInit: true`.
   - Resultado esperado: `full_name` igual a `EduardoVal3/aventura-web-criaturas` y un único commit raíz con el README en `main`. Si el `owner` es otro, detente y pregunta.
2. **Merge solo con "merge commit"** (el MCP no tiene esta herramienta, así que se hace con `gh`):

   ```powershell
   gh api -X PATCH repos/EduardoVal3/aventura-web-criaturas -F allow_merge_commit=true -F allow_squash_merge=false -F allow_rebase_merge=false -F delete_branch_on_merge=false
   ```

3. **Proteger `main`** (solo PR, sin push directo, también para el administrador):

   ```powershell
   $proteccion = @'
   {
     "required_status_checks": null,
     "enforce_admins": true,
     "required_pull_request_reviews": { "required_approving_review_count": 0 },
     "restrictions": null,
     "allow_force_pushes": false,
     "allow_deletions": false
   }
   '@
   $proteccion | gh api -X PUT repos/EduardoVal3/aventura-web-criaturas/branches/main/protection --input -
   ```

4. **MCP GitHub, `create_branch`:** `owner: "EduardoVal3"`, `repo: "aventura-web-criaturas"`, `branch: "desarrollo"`, `from_branch: "main"`.
5. **Git local** en la raíz del workspace (los archivos sin seguimiento que ya existen se conservan):

   ```powershell
   git init -b main
   git remote add origin https://github.com/EduardoVal3/aventura-web-criaturas.git
   git pull origin main
   git branch --set-upstream-to=origin/main main
   git fetch origin
   git switch desarrollo
   git switch -c configuracion/fase-00-cimientos
   ```

   - Si el push o el pull piden credenciales, ejecuta `gh auth setup-git` y repite.
   - Resultado esperado: `git status` muestra la rama `configuracion/fase-00-cimientos`. Entre los archivos sin seguimiento aparecen `.agents/`, los dos `.md` de planificación y `docs/`. Todavía no hay `.gitignore`: **no agregues nada** hasta T1.

### T1. Estructura del monorepo y gitignore

Crea estos archivos con este contenido exacto:

`.gitignore`

```gitignore
# Dependencias
node_modules/

# Variables de entorno: solo se versiona la plantilla
.env
.env.*
!.env.example

# Configuración local del agente del IDE (contiene credenciales)
.agents/

# Documentos de planificación que no se versionan (regla R3)
Plan_Desarrollo_ISC305_Entregable1.md
Proyecto Integrador ISC305 Aventura Web Criaturas.md

# Registros y archivos del sistema
*.log
.DS_Store
Thumbs.db
```

`.gitattributes` (los hooks de `sh` se rompen con CRLF en Windows):

```gitattributes
* text=auto
.githooks/* text eol=lf
```

`package.json`

```json
{
  "name": "aventura-web-criaturas",
  "private": true,
  "packageManager": "pnpm@10.28.1",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "prepare": "git config core.hooksPath .githooks",
    "dev": "docker compose up -d postgres && pnpm -r --parallel run dev"
  }
}
```

`pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
```

Crea también `docs/diagramas/.gitkeep` y `docs/informe/.gitkeep` vacíos. `docs/workflows/` ya contiene este archivo.

Verifica y haz el commit:

```powershell
git check-ignore -v .agents/mcp_config.json "Plan_Desarrollo_ISC305_Entregable1.md" "Proyecto Integrador ISC305 Aventura Web Criaturas.md"
pnpm install
git config core.hooksPath
git add .gitignore .gitattributes package.json pnpm-workspace.yaml docs/diagramas/.gitkeep docs/informe/.gitkeep docs/workflows/FASE-00.md
git diff --cached --name-only
git commit -m "configuracion: agrega estructura de monorepo y gitignore"
```

- `check-ignore` debe listar los 3 archivos como ignorados.
- `git config core.hooksPath` debe responder `.githooks` (lo pone el script `prepare`). Si sale vacío, ejecuta `git config core.hooksPath .githooks`.
- Si `pnpm install` generó `pnpm-lock.yaml`, agrégalo a este commit.

### T2. Apps provisionales con página y endpoint de salud

`apps/web/package.json`

```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "node --watch servidor.mjs"
  }
}
```

`apps/web/servidor.mjs`

```js
// simplificacion: servidor estático provisional con node:http; la Fase 2 lo reemplaza por Vite.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const PUERTO = 5173;
const pagina = new URL('./index.html', import.meta.url);

createServer(async (_peticion, respuesta) => {
  respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  respuesta.end(await readFile(pagina));
}).listen(PUERTO, () => console.log(`Web en http://localhost:${PUERTO}`));
```

`apps/web/index.html`

```html
<!doctype html>
<!-- simplificacion: página provisional; la Fase 2 la reemplaza por React + Vite. -->
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Aventura web de exploración y captura de criaturas. Proyecto Integrador ISC-305." />
    <title>Aventura Web de Criaturas</title>
  </head>
  <body>
    <main>
      <h1>Aventura Web de Criaturas</h1>
      <p>Página provisional de la Fase 0. La interfaz real llega en la Fase 2.</p>
    </main>
  </body>
</html>
```

`apps/api/package.json`

```json
{
  "name": "api",
  "private": true,
  "scripts": {
    "dev": "node --watch servidor.mjs"
  }
}
```

`apps/api/servidor.mjs`

```js
// simplificacion: servidor provisional con node:http; la Fase 4 lo reemplaza por NestJS.
import { createServer } from 'node:http';

const PUERTO = 3000;
const JSON_UTF8 = { 'Content-Type': 'application/json; charset=utf-8' };

createServer((peticion, respuesta) => {
  if (peticion.method === 'GET' && peticion.url === '/api/salud') {
    respuesta.writeHead(200, JSON_UTF8);
    respuesta.end(JSON.stringify({ estado: 'ok' }));
    return;
  }
  respuesta.writeHead(404, JSON_UTF8);
  respuesta.end(JSON.stringify({ error: 'Ruta no encontrada' }));
}).listen(PUERTO, () => console.log(`API en http://localhost:${PUERTO}/api/salud`));
```

```powershell
pnpm install
git add apps/web/package.json apps/web/servidor.mjs apps/web/index.html apps/api/package.json apps/api/servidor.mjs
git diff --cached --name-only
git commit -m "configuracion: agrega apps web y api provisionales con endpoint de salud"
```

Si `pnpm-lock.yaml` cambió, agrégalo a este commit.

### T3. docker-compose con PostgreSQL

`docker-compose.yml`

```yaml
# Las credenciales salen de .env; si falta alguna, compose se detiene con el mensaje indicado.
services:
  postgres:
    image: postgres:17-alpine
    container_name: aventura-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Define POSTGRES_USER en .env}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD en .env}
      POSTGRES_DB: ${POSTGRES_DB:?Define POSTGRES_DB en .env}
    ports:
      - "${POSTGRES_PUERTO:-5432}:5432"
    volumes:
      - datos-postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  datos-postgres:
```

`.env.example`

```dotenv
# Copia este archivo a .env y ajusta los valores. .env nunca se commitea.
# Usuario, contraseña, BD y puerto deben coincidir con la cadena de conexión del MCP de PostgreSQL.
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambiar_esta_contrasena
POSTGRES_DB=aventura_criaturas
POSTGRES_PUERTO=5432
```

Crea `.env` local (**no se commitea**) copiando `.env.example`. Toma usuario, contraseña, BD y puerto de la cadena de conexión del servidor `postgres` en `.agents/mcp_config.json`, para que el MCP pueda conectarse. No escribas esa contraseña en ningún archivo versionado.

Levanta la BD y verifica:

```powershell
docker compose up -d postgres
docker compose ps
```

- Terminal: `docker compose ps` muestra `aventura-postgres` con estado `(healthy)`. Espera unos segundos y repite si sale `starting`.
- **MCP Docker:** `list_containers` con `all: false` incluye `aventura-postgres`. `container_logs` con `id: "aventura-postgres"` y `tail: 50` contiene `database system is ready to accept connections`.
- **MCP PostgreSQL:** `query` con `sql: "SELECT version();"` devuelve `PostgreSQL 17.x`. Si el MCP no conecta, pide al usuario que reinicie el servidor MCP `postgres` en el IDE. Si el puerto 5432 está ocupado, pregunta antes de cambiar `POSTGRES_PUERTO`.

```powershell
git add docker-compose.yml .env.example
git diff --cached --name-only
git commit -m "configuracion: agrega docker-compose con PostgreSQL"
```

### T4. Hooks que bloquean main y validan mensajes

Copia el contenido exacto de §1 R2 del plan:

`.githooks/pre-commit`

```sh
#!/bin/sh
# .githooks/pre-commit: bloquea commits directos en main o master
rama=$(git rev-parse --abbrev-ref HEAD)
if [ "$rama" = "main" ] || [ "$rama" = "master" ]; then
  echo "Prohibido hacer commits directos en $rama. Crea una rama: git switch -c funcionalidad/<nombre>"
  exit 1
fi
```

`.githooks/commit-msg`

```sh
#!/bin/sh
# .githooks/commit-msg: exige el formato tipo(alcance): descripción
mensaje=$(head -n 1 "$1")
case "$mensaje" in Merge*) exit 0 ;; esac
if ! echo "$mensaje" | grep -Eq '^(funcionalidad|correccion|documentacion|configuracion|pruebas|refactorizacion)(\([a-z0-9-]+\))?: .{10,}'; then
  echo "Mensaje inválido. Formato: tipo(alcance): descripción en español (mínimo 10 caracteres)"
  exit 1
fi
```

Los archivos deben quedar en **UTF-8 sin BOM y con finales LF**:

```powershell
git add .githooks/pre-commit .githooks/commit-msg
git update-index --chmod=+x .githooks/pre-commit .githooks/commit-msg
git ls-files --eol -s .githooks
```

- Cada archivo debe mostrar modo `100755`, `i/lf` y `w/lf`.
- Si aparece `w/crlf`, corrige con el comando de abajo y repite `git add` y `git update-index`:

  ```powershell
  foreach ($f in Get-ChildItem .githooks -File) { $t = [IO.File]::ReadAllText($f.FullName) -replace "`r`n", "`n"; [IO.File]::WriteAllText($f.FullName, $t) }
  ```

```powershell
git diff --cached --name-only
git commit -m "configuracion: agrega hooks que bloquean main y validan mensajes"
```

Este mismo commit ya pasa por `commit-msg`, así que también prueba el caso válido.

**Prueba de los hooks.** Es el chequeo que queda de esta lógica. `main` todavía no contiene `.githooks/` (llega en el avance 1), así que el bloqueo se prueba con una rama local temporal `master`:

```powershell
git commit --allow-empty -m "cambios varios"
git switch -c master
git commit --allow-empty -m "configuracion: prueba de bloqueo en rama master"
git switch configuracion/fase-00-cimientos
git branch -d master
```

- El primer commit debe **fallar** con `Mensaje inválido…`.
- El segundo debe **fallar** con `Prohibido hacer commits directos en master…`.
- Si alguno se crea por error, **no hagas push**. Borra la rama temporal con `git branch -D master` o descarta el commit local, corrige el hook y repite. Nunca subas ese commit.

### T5. Reglas de trabajo y plantilla de PR

`docs/reglas-de-trabajo.md`:

- Copia **literalmente** del plan las secciones §1 (R1 con el glosario, R2 con los dos hooks y R3 con su tabla) y §3 (reglas transversales).
- Encabezado: `# Reglas de trabajo`.
- Después de los hooks de R2, añade esta nota de adaptación:

  > En este repo los hooks se activan solos con `pnpm install` (script `prepare`). En Windows no hace falta `chmod`, porque el bit ejecutable ya está guardado en Git. Los hooks viven en las ramas, así que `main` queda protegida en local desde el avance 1; en remoto, GitHub ya bloquea el push directo a `main`.

`.github/pull_request_template.md`

```markdown
## Resumen

<!-- Qué cambia y por qué. -->

## Fase y requisitos

- Fase:
- IDs del MD cubiertos:

## Lista de verificación

- [ ] ¿Todo nombre propio está en español y todo término en inglés está en el glosario? (R1)
- [ ] Commits pequeños con formato `tipo(alcance): descripción`, sin historia reescrita (R2)
- [ ] Sin credenciales en el repo; los secretos solo están en `.env` (R3, S-7)
- [ ] Pruebas y verificaciones de la fase ejecutadas y en verde
- [ ] Sección del informe (`docs/informe/`) y diagramas actualizados, o "n/a" justificado
- [ ] Se integra con **merge commit** (sin squash ni rebase)

## Evidencia

<!-- Salidas de comandos, consultas o capturas. -->
```

```powershell
git add docs/reglas-de-trabajo.md .github/pull_request_template.md
git diff --cached --name-only
git commit -m "documentacion: agrega reglas de trabajo y plantilla de PR"
```

### T6. Documentación de MCP (sin credenciales)

`docs/mcp.md`:

````markdown
# Servidores MCP del proyecto

La IA del IDE usa estos servidores MCP al ejecutar cada workflow (`docs/workflows/FASE-NN.md`).
La configuración real vive en `.agents/mcp_config.json`, que **no se versiona** (`.agents/` está en `.gitignore`) porque el IDE no lee `.env` y esa configuración lleva credenciales.

## Servidores

| ID | Paquete | Uso | Fases |
| --- | --- | --- | --- |
| `postgres` | `@modelcontextprotocol/server-postgres` | Consultas de solo lectura a la BD local (esquema, seeds, verificaciones) | 0, 4 a 7, 9 |
| `fetch` | `mcp-fetch-server` | GET a la API externa (Open5e) y al Back-End local | 1, 3, 5 a 10 |
| `docker` | `mcp-docker-server` | Estado y logs de contenedores | 0, 10 |
| `mermaid` | `@peng-shawn/mermaid-mcp-server` | Generar diagramas de `docs/diagramas/` | 1, 5, 7, 10, 11 |
| `context7` | `@upstash/context7-mcp` | Documentación oficial (8bitcn/ui, shadcn/ui, Tailwind, Kong, Open5e, NestJS) | 1, 2, 9, 10 |
| `sequential-thinking` | `@modelcontextprotocol/server-sequential-thinking` | Razonar fórmulas y máquinas de estado | 1, 6, 7 |
| `memory` | `@modelcontextprotocol/server-memory` | Apoyo de contexto; la fuente de verdad es `docs/reglas-juego.md` | 1, 6, 7 |
| `github` | `@modelcontextprotocol/server-github` | Crear repo y ramas, abrir PR y mergear con merge commit | 0 a 11 |

## Plantilla de configuración

Copia esto a `.agents/mcp_config.json` y reemplaza los marcadores `<...>`. Usuario, contraseña, BD y puerto deben coincidir con tu `.env`.

```json
{
  "mcpServers": {
    "postgres": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://<usuario>:<contrasena>@localhost:5432/aventura_criaturas"] },
    "fetch": { "command": "npx", "args": ["-y", "mcp-fetch-server"] },
    "docker": { "command": "npx", "args": ["-y", "mcp-docker-server"] },
    "mermaid": { "command": "npx", "args": ["-y", "@peng-shawn/mermaid-mcp-server"] },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] },
    "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] },
    "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<token-personal>" } }
  }
}
```

## Límites conocidos y cómo se cubren

- **GitHub:** el MCP no protege ramas, no cambia los ajustes de merge y no crea tags. Eso se hace con `gh api` y `git tag` (ver `docs/workflows/FASE-00.md`).
- **Docker:** el MCP no ejecuta `docker compose`. Se usa la terminal para `docker compose up -d` y `docker compose ps`, y el MCP para `list_containers` y `container_logs`.
- **PostgreSQL:** el MCP solo ejecuta consultas de lectura. Las tablas y los datos se crean con migraciones y `prisma/seed.ts` versionados.
- **Fetch:** solo hace GET. Los POST con JWT se prueban con `curl` o con pruebas e2e (supertest).

## Reglas

- Ninguna credencial en archivos versionados. Los tokens y contraseñas viven solo en `.env` y en `.agents/mcp_config.json` local.
- El MCP `postgres` apunta solo a la BD local de desarrollo.
````

```powershell
git add docs/mcp.md
git diff --cached --name-only
git commit -m "documentacion(mcp): documenta los servidores MCP sin credenciales"
```

### T7. README con arranque en un comando

Reemplaza el `README.md` que creó GitHub:

````markdown
# Aventura Web de Criaturas

Aplicación web tipo RPG de exploración, captura y combate por turnos. Proyecto Integrador de ISC-305 Programación Web (III PAC 2026).

> Estado: Fase 0. Las apps son provisionales; la web pasa a React + Vite en la Fase 2 y la API a NestJS en la Fase 4.

## Requisitos

- Node.js 24 o superior
- pnpm 10.28.1
- Docker Desktop
- Git

## Arranque

Solo la primera vez:

```bash
cp .env.example .env   # ajusta la contraseña
pnpm install           # además activa los hooks de Git
```

Después, un solo comando levanta PostgreSQL, la web y la API:

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api/salud

## Estructura

```text
apps/web     Front-End
apps/api     Back-End
docs/        Reglas de trabajo, MCP, workflows por fase, informe y diagramas
```

## Flujo de trabajo

Antes de contribuir lee [docs/reglas-de-trabajo.md](docs/reglas-de-trabajo.md). En resumen:

- Una rama por fase.
- Commits `tipo(alcance): descripción`.
- PR hacia `desarrollo` con merge commit.
- Nunca se hacen commits en `main`.
````

```powershell
git add README.md
git diff --cached --name-only
git commit -m "documentacion(readme): agrega arranque en un comando"
```

### T8. Verificación de salida (sin commit)

1. Ejecuta `pnpm dev` como **proceso en segundo plano** y, en otra terminal:

   ```powershell
   Invoke-RestMethod http://localhost:3000/api/salud
   (Invoke-WebRequest http://localhost:5173 -UseBasicParsing).StatusCode
   docker compose ps
   ```

   Resultado esperado: `estado = ok`, `200` y `aventura-postgres (healthy)`. Después detén el proceso de `pnpm dev`.
2. Busca secretos en lo versionado: `git grep -nE "ghp_|gho_"` no debe devolver nada. `git ls-files` no debe incluir `.agents/`, `.env` ni los `.md` de planificación.
3. Protección remota:

   ```powershell
   gh api repos/EduardoVal3/aventura-web-criaturas --jq "[.allow_merge_commit, .allow_squash_merge, .allow_rebase_merge]"
   gh api repos/EduardoVal3/aventura-web-criaturas/branches/main/protection --jq "[.required_pull_request_reviews.required_approving_review_count, .enforce_admins.enabled]"
   ```

   Resultado esperado: `[true,false,false]` y `[0,true]`.
4. Las dos pruebas de hooks de T4 fallaron como se esperaba.
5. `git log --oneline desarrollo..HEAD` muestra 7 commits (T1 a T7), todos con formato válido y sin tildes rotas.

## 4. MCP a usar (resumen)

| MCP | Acción exacta | Resultado esperado |
| --- | --- | --- |
| GitHub | `create_repository`, `create_branch` (`desarrollo`), `create_pull_request`, `merge_pull_request` con `merge_method: "merge"` | Repo público con `main` y `desarrollo`; PR #1 mergeado con merge commit |
| Docker | `list_containers`, `container_logs` (`aventura-postgres`) | Contenedor activo, listo para aceptar conexiones |
| PostgreSQL | `query` con `SELECT version();` | PostgreSQL 17.x |

Lo que estos MCP no cubren (protección de `main`, ajustes de merge, tag y `docker compose`) se hace con `gh` y la terminal, tal como está escrito arriba.

## 5. Criterios de salida

- [ ] `docker compose up -d postgres` levanta la BD (`healthy`) y el MCP PostgreSQL responde `SELECT version();`.
- [ ] `pnpm dev` arranca la web (página en 5173) y la API (`/api/salud` → `{"estado":"ok"}`).
- [ ] Un commit en `master`/`main` falla en local, y un mensaje mal formado también falla.
- [ ] `main` está protegida en GitHub (solo PR, `enforce_admins`) y solo se permite merge commit.
- [ ] Ningún secreto ni archivo prohibido está versionado.
- [ ] PR de la fase mergeado en `desarrollo` con merge commit y tag `version-0.0.0` publicado.

## 6. Informe

n/a: la Fase 0 no tiene sección en `docs/informe/` (plan §6).

## 7. Cierre Git

1. `git push -u origin configuracion/fase-00-cimientos`
2. **MCP GitHub, `create_pull_request`:**
   - `owner: "EduardoVal3"`, `repo: "aventura-web-criaturas"`.
   - `base: "desarrollo"`, `head: "configuracion/fase-00-cimientos"`.
   - `title: "Fase 00: cimientos del repositorio y entorno"`.
   - `body`: la plantilla de `.github/pull_request_template.md` llena con fase 0, IDs `T-1, T-11, ARQ, S-7, R1, R2, R3`, casillas marcadas, informe "n/a" y como evidencia las salidas de T3 y T8. GitHub solo aplica la plantilla automáticamente desde la rama por defecto (`main`), por eso aquí se pega a mano.
3. **MCP GitHub, `merge_pull_request`:** `pull_number` del paso anterior, `merge_method: "merge"`, `commit_title: "Merge del PR #<n>: fase 00, cimientos del repositorio"`. **Nunca** `squash` ni `rebase`.
4. Tag sobre el merge commit en `desarrollo`:

   ```powershell
   git switch desarrollo
   git pull
   git log -1 --format="%h %s"
   git tag -a version-0.0.0 -m "Fase 0: cimientos del repositorio y entorno"
   git push origin version-0.0.0
   git ls-remote --tags origin version-0.0.0
   ```

   El `git log` debe mostrar el merge commit. `ls-remote` debe listar el tag.
5. **No** abras PR `desarrollo → main` (decisión de la fase). **No** borres la rama de la fase.

## 8. No hacer

- No instalar Vite, React, Tailwind, shadcn ni 8bitcn (Fase 2).
- No instalar NestJS ni Prisma, no añadir `DATABASE_URL` ni migraciones (Fases 4 y 5).
- No crear `docs/decisiones.md`, `docs/reglas-juego.md`, `docs/contrato-api.md` ni secciones del informe (Fase 1 en adelante).
- No añadir avisos de licencia de 8bitcn ni atribución de Open5e (Fases 1 y 2).
- No añadir GitHub Actions, Kong ni dependencias que este documento no pida.
- No modificar `.agents/mcp_config.json` ni commitear `.agents/`, `.env` o los `.md` de planificación.
- No hacer commits en `main`, no hacer squash, `push --force` ni `--no-verify`, y no borrar ramas de fase.
