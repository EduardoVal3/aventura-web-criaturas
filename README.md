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

## Créditos y licencias

- **8bitcn/ui:** Componentes retro de interfaz de usuario ([TheOrcDev/8bitcn-ui](https://github.com/TheOrcDev/8bitcn-ui)). Licencia MIT.
  > Copyright (c) 2025 8bitcn
- **Open5e y SRD 5.2:** Datos base del catálogo de criaturas. Licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
  > "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
