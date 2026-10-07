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
