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
