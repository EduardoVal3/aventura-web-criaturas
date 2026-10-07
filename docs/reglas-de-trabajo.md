# Reglas de trabajo

## 1. Reglas globales

### R1. Código en español

Todo lo que nombramos nosotros va en español: variables, funciones, clases, DTO, modelos, tablas, columnas, rutas, archivos, ramas, commits, comentarios y textos de la interfaz.

**Reglas de nombres**

1. Los identificadores no llevan tildes ni ñ (`exploracion`, `contrasena`); los comentarios y textos de UI sí.
2. Variables y funciones en `camelCase`, clases en `PascalCase`, constantes en `MAYUSCULAS_CON_GUION_BAJO`, archivos en `kebab-case` con el sufijo del framework (`captura.service.ts`).
3. Estados y valores de enumeración en español y mayúsculas (`ACTIVO`, `CAPTURADO`).
4. Rutas REST en español, sin tildes: `/api/exploracion`, `/api/encuentros/{id}/capturar`.
5. Modelos de Prisma en `PascalCase` español, con `@@map` a tablas en minúsculas (`Especie` → `especie`).
6. Los comentarios explican el porqué, no repiten el código. El código debe ser autodocumentado.
7. Hooks propios de React: `use` + nombre en español (`useSesion`), porque `use` lo impone React.

**Se escriben tal cual**

- Palabras reservadas y APIs del lenguaje o la plataforma (`if`, `const`, `function`, `fetch`, `Promise`).
- Nombres impuestos por una librería (`findMany`, `useState`, `@Controller`, `ValidationPipe`, `CanActivate`, claves de `package.json`, y los componentes de 8bitcn/ui y shadcn/ui tal como los genera el CLI: `Button`, `Card`, `HealthBar`).
- Siglas técnicas: HP, XP, JWT, API, DTO, HTTP, JSON, SQL, ID, CORS, CRUD, REST, URL.
- Términos que se conocen por su nombre en inglés (ajuste tuyo):

| Término                               | Uso                                | Ejemplo                                                        |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| Guard                                 | Protección de rutas en NestJS      | `AutenticacionGuard`                                           |
| Controller, Service, Module           | Bloques de NestJS                  | `ExploracionController`, `CapturaService`, `ExploracionModule` |
| Pipe, Filter, Interceptor, Middleware | Bloques de NestJS                  | `ExcepcionesFilter`, `RegistroInterceptor`                     |
| Gateway                               | WebSocket Gateway y API Gateway    | `ZonaGateway`                                                  |
| Layout                                | Estructura base de páginas         | `LayoutPrincipal`                                              |
| seed                                  | Datos iniciales (Prisma lo impone) | `prisma/seed.ts`                                               |
| token, payload                        | Autenticación                      | `token`, `payload`                                             |

```ts
// Nombres propios en español; bloques de NestJS en inglés.
@Injectable()
export class CapturaService {
  // Devuelve la probabilidad de captura entre 0.05 y 0.95.
  calcularProbabilidadCaptura(criatura: Criatura, objeto: Objeto): number {
    const hpActual = criatura.hpActual;
    // ...
  }
}
```

**Verificación:** la plantilla de PR incluye la casilla "¿todo nombre propio está en español y todo término en inglés está en el glosario?".

### R2. Versionamiento estricto (Git)

El profesor exige evidenciar la evolución progresiva. El historial debe reflejar el trabajo real, en su orden real.

1. **Prohibido commitear en `main` o `master`.** El único commit permitido en `main` es el raíz que crea el repositorio (README inicial desde GitHub); desde ahí, todo entra por Pull Request.
2. **Una rama por fase, entregable o característica:** `<tipo>/fase-NN-nombre`, con tipos `funcionalidad`, `correccion`, `documentacion`, `configuracion` y `pruebas`. Las fases L y XL se dividen en sub-ramas (`fase-07a-combate`).
3. **Flujo de ramas:** `main` (solo recibe PR de cierre de avance, con tag), `desarrollo` (integración) y las ramas de fase.
4. **Commits pequeños, descriptivos y frecuentes:** un commit por tarea del workflow; si una tarea toca más de unos 10 archivos o mezcla temas, se divide. Formato: `tipo(alcance): descripción en español` (por ejemplo `funcionalidad(exploracion): agrega selector ponderado con generador inyectable`).
5. **Los PR se integran con "merge commit"**, nunca con squash, para conservar los commits individuales como evidencia.
6. **Historial honesto:** no se alteran fechas (`--date`, `GIT_AUTHOR_DATE`), no se usa `push --force` ni `rebase -i` sobre ramas ya subidas, y no se reescribe historia para aparentar días que no ocurrieron.
7. **Tags:** `version-0.0.0`, `avance-1` … `avance-5`, `version-1.0.0`.

```bash
git switch desarrollo && git pull
git switch -c funcionalidad/fase-06-exploracion
git add <archivos> && git commit -m "funcionalidad(exploracion): agrega selector ponderado con generador inyectable"
git push -u origin funcionalidad/fase-06-exploracion      # luego PR hacia desarrollo
```

**Protección local:** `.githooks/pre-commit` y `.githooks/commit-msg`, activados con `git config core.hooksPath .githooks` y `chmod +x .githooks/*`.

```sh
#!/bin/sh
# .githooks/pre-commit: bloquea commits directos en main o master
rama=$(git rev-parse --abbrev-ref HEAD)
if [ "$rama" = "main" ] || [ "$rama" = "master" ]; then
  echo "Prohibido hacer commits directos en $rama. Crea una rama: git switch -c funcionalidad/<nombre>"
  exit 1
fi
```

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

> En este repo los hooks se activan solos con `pnpm install` (script `prepare`). En Windows no hace falta `chmod`, porque el bit ejecutable ya está guardado en Git. Los hooks viven en las ramas, así que `main` queda protegida en local desde el avance 1; en remoto, GitHub ya bloquea el push directo a `main`.

**Protección remota (GitHub):** `main` exige PR y no admite pushes directos; el merge permitido es "Create a merge commit".

### R3. Herramientas MCP

Los MCP los configura y usa la IA del IDE al ejecutar cada workflow. La configuración se documenta en `docs/mcp.md`, **sin credenciales**.

| MCP                                                                  | Uso en el proyecto                                                                             | Fases           | Reglas de uso                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PostgreSQL                                                           | Inspeccionar el esquema, verificar seeds y transacciones, probar consultas CRUD en la BD local | 0, 4 a 7, 9     | Solo la BD local de desarrollo, con usuario propio. Credenciales en `.env`, nunca en el repo ni en la config versionada del MCP. Tablas y seeds se crean con migraciones y `prisma/seed.ts` versionados; el servidor de referencia que conozco es de solo lectura, verifica el que instales                                    |
| HTTP/Fetch                                                           | GET a la API externa; probar el Back-End de forma aislada antes de conectar el front           | 1, 3, 5 a 9, 10 | El Fetch de referencia solo hace GET (verifícalo en su README). Para POST con JWT usa un MCP de cliente HTTP con métodos, headers y cuerpo, o `curl` y pruebas e2e (supertest), que además quedan versionadas                                                                                                                  |
| Docker                                                               | Levantar PostgreSQL y el gateway; revisar estado y logs                                        | 0, 10           | `docker compose up -d`, `docker compose ps`, `docker compose logs <servicio>`. Sin credenciales en el compose (van en `.env`)                                                                                                                                                                                                  |
| Mermaid                                                              | Generar y versionar diagramas del informe                                                      | 1, 5, 7, 10, 11 | Fuente en `docs/diagramas/*.mmd`; se exporta a PNG para el informe                                                                                                                                                                                                                                                             |
| Docs & Context (Context7 / DevDocs)                                  | Documentación oficial de 8bitcn/ui, shadcn/ui, Tailwind, Kong y Open5e                         | 1, 2, 9, 10     | Toda configuración técnica cita URL y versión en `docs/decisiones.md`. Si no se halla la fuente, se marca "sin verificar" y no se implementa como hecho. La página de 8bitcn/ui ofrece una inicialización de MCP opcional que da a la IA el contexto de todos sus componentes (el comando está en https://www.8bitcn.com/docs) |
| Sequential Thinking / Memory                                         | Razonar paso a paso las fórmulas, las tablas de probabilidad y la máquina de estados           | 1, 6, 7         | La fuente de verdad **no** es la memoria del MCP: es `docs/reglas-juego.md` más las pruebas con generador fijo. Memory solo apoya                                                                                                                                                                                              |
| GitHub                                                               | Crear ramas, abrir PR y mergear                                                                | 0 a 11          | Todo entra por PR a `desarrollo` con merge commit; `main` solo recibe el PR de cierre de avance                                                                                                                                                                                                                                |

---

## 3. Reglas transversales de diseño

Van en `docs/reglas-de-trabajo.md` junto con R1, R2 y R3; la IA flash las lee antes de cada fase.

1. Toda regla del juego vive en el servidor; el front solo muestra el estado que el servidor le devuelve (A-8, S-6).
2. El `personajeId` sale siempre del JWT, nunca del body ni de la URL (S-1).
3. Toda aleatoriedad pasa por un `GeneradorAleatorio` inyectable, para poder probar con valores fijos.
4. Las probabilidades, pesos, requisitos y precios son datos en BD (seed), no constantes en el código (CFG).
5. El contrato de la API (`docs/contrato-api.md`) se escribe antes que el código; la API simulada y el Back-End lo implementan igual.
6. Todo código simulado lleva `// SIMULADO: eliminar en Fase 8`.
7. Las fórmulas viven en `docs/reglas-juego.md` y cada una tiene su prueba unitaria; si el documento y el código difieren, gana el documento y se corrige el código.
