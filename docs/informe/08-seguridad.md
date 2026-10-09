# Informe Técnico - Fase 9: Seguridad, Blindaje Defensivo y Auditoría de Vulnerabilidades (S-1 a S-7)

Este documento corresponde al capítulo de la **Fase 9 (Seguridad y Auditoría de Salvaguardas)** del Informe Técnico del Proyecto Integrador ISC-305. Establece la postura defensiva del sistema *Aethelgard: Sendas y Criaturas*, la implementación técnica de las salvaguardas **S-1 a S-7**, la suite automatizada de pruebas negativas de penetración y la evidencia de auditoría directa sobre PostgreSQL y la configuración del servidor NestJS.

---

## 1. Resumen ejecutivo de seguridad

El diseño arquitectónico de *Aethelgard* parte de un principio estricto de **confianza cero (Zero Trust)** respecto a los datos provenientes del cliente (Front-End SPA) y la regla de diseño **A-8**:
> *Todas las reglas de combate, azar, validaciones de inventario y progreso se computan y gobiernan de manera íntegra y exclusiva en el servidor.*

El navegador web del usuario es considerado un entorno hostil y susceptible de manipulación (vía herramientas de desarrollo, interceptores HTTP o clientes automatizados maliciosos). En consecuencia:
1. **El cliente nunca decide:** El Front-End no calcula daño, no descuenta monedas, no asigna experiencia ni decrece cantidades de consumibles de forma autoritativa; únicamente envía intenciones y renderiza los estados emitidos por el servidor con una cadencia visual adecuada (~800 ms).
2. **Defensa en profundidad:** Toda petición que ingresa al servidor atraviesa secuencialmente filtros globales de manejo de excepciones (`ExcepcionesFilter`), tuberías de saneamiento y rechazo de payloads (`ValidationPipe`), guardias de autenticación JWT (`JwtAuthGuard`), validaciones de lógica de dominio y transacciones atómicas de base de datos (`prisma.$transaction`).
3. **Aislamiento multiusuario:** La identidad del explorador se deriva exclusivamente del reclamo `sub` verificado dentro del token JWT firmado; ningún endpoint privado acepta que el cliente especifique arbitrariamente el identificador de usuario o personaje sobre el cual desea operar.

---

## 2. Matriz de salvaguardas de seguridad (S-1 a S-7)

A continuación se detalla la matriz integral de salvaguardas implementadas en la API REST, su mecanismo de mitigación y su correspondiente validación automatizada:

| Salvaguarda | Descripción del riesgo atacado | Código HTTP emitido | Mecanismo de mitigación en Back-End (NestJS / Prisma) | Prueba automatizada |
| --- | --- | --- | --- | --- |
| **Sin Token / Token Inválido** | Acceso no autenticado a rutas privadas o falsificación de credenciales | `401 Unauthorized` | `JwtAuthGuard` aplicado globalmente vía `APP_GUARD` o en controladores privados, verificando firma con `JWT_SECRETO`. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-1** | Mutación o acceso a personajes, criaturas, encuentros o inventarios pertenecientes a otro usuario | `403 Forbidden` / `404 Not Found` | Extracción estricta del `usuarioId` desde el JWT (`sub`). Verificación de propiedad `encuentro.personajeId === personaje.id` arrojando `ENCUENTRO_NO_AUTORIZADO`. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-2** | Desplazamiento ilegal a zonas inexistentes o no conectadas topológicamente en el mapa | `400 Bad Request` / `403 Forbidden` | Verificación del grafo relacional `ConexionZona` (`CONEXION_INVALIDA`) y consulta de prerequisitos en `ZonaDesbloqueada` (`ZONA_BLOQUEADA`). | `seguridad-s1-s7.e2e-spec.ts` |
| **S-3** | Invocación de captura sin encuentro activo o sobre combates ajenos | `404 Not Found` / `403 Forbidden` | Consulta en tabla `encuentro` verificando coincidencia de identificador y estado `EN_CURSO`; rechazo con `ENCUENTRO_NO_ENCONTRADO`. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-4** | Uso de talismanes, pociones o recursos que el explorador no posee en su inventario | `400 Bad Request` | Consulta y deducción dentro de `prisma.$transaction`. Verificación de `cantidad >= 1`; rechazo con `ITEM_NO_DISPONIBLE`. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-5** | Ataque fuera de turno o interacción con encuentros previamente resueltos | `400 Bad Request` / `409 Conflict` | Candado de estado con `esEstadoTerminal(encuentro.estado)`. Verificación de alternancia de turnos `ultimoCombate.esTurnoJugador`. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-6** | Inyección de monedas, experiencia, niveles o estadísticas arbitrarias en payloads JSON | `400 Bad Request` | `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`, rechazando cualquier propiedad no declarada explícitamente en el DTO. | `seguridad-s1-s7.e2e-spec.ts` |
| **S-7** | Exposición de secretos en repositorio o almacenamiento de contraseñas en texto claro | N/A (Defensa arquitectónica) | Hash criptográfico con `bcrypt` (factor de costo 10), variables de entorno aisladas en `.env` y CORS restringido sin comodín abierto. | Auditoría directa SQL con MCP PostgreSQL |

---

## 3. Batería de pruebas negativas automatizadas (E2E)

Para garantizar que el sistema repele activamente intentos de intrusión y manipulación, se diseñó la suite end-to-end `apps/api/test/seguridad-s1-s7.e2e-spec.ts` utilizando el motor nativo de pruebas de Node.js (`node:test`, `node:assert`) y levantando la aplicación NestJS en un puerto efímero aislado.

### 3.1 Escenarios evaluados y resultados

1. **Pruebas de autenticación y tokens:**
   - Consulta a `GET /api/personajes/activo` sin cabecera `Authorization` $\rightarrow$ Responde `401 Unauthorized`.
   - Invocación de `POST /api/combate/atacar` enviando un Bearer token malformado o firmado con clave inválida $\rightarrow$ Responde `401 Unauthorized`.
2. **Pruebas de aislamiento multiusuario (S-1):**
   - Se crean dos cuentas independientes (`Usuario A` y `Usuario B`) con sus respectivos personajes y un encuentro activo perteneciente exclusivamente a `Usuario A`.
   - `Usuario B` intenta enviar una orden de ataque sobre el encuentro de `Usuario A` $\rightarrow$ El servidor intercepta la discrepancia de pertenencia y responde `403 Forbidden` con código `ENCUENTRO_NO_AUTORIZADO`.
   - `Usuario B` intenta lanzar un talismán de captura en el encuentro de `Usuario A` $\rightarrow$ Responde `403 Forbidden` con código `ENCUENTRO_NO_AUTORIZADO`.
   - `Usuario A` y `Usuario B` consultan `/api/personajes/activo` $\rightarrow$ Cada usuario recibe única y estrictamente sus propios identificadores y progreso, sin filtración cruzada.
3. **Pruebas de restricción territorial (S-2):**
   - Intento de desplazamiento hacia una zona inexistente (`ZON-99`) $\rightarrow$ Responde `400 Bad Request` con código `CONEXION_INVALIDA`.
   - Intento de desplazamiento desde `LOC-01` hacia `ZON-05` (zona existente pero no conectada en el grafo directo) $\rightarrow$ Responde `400 Bad Request` con código `CONEXION_INVALIDA`.
4. **Pruebas de captura ilegal (S-3 y S-4):**
   - Envío de solicitud de captura hacia un UUID de encuentro inexistente $\rightarrow$ Responde `404 Not Found` con código `ENCUENTRO_NO_ENCONTRADO`.
   - Envío de captura con un talismán que el personaje no posee en inventario (`talisman-avanzado`) $\rightarrow$ La transacción relacional aborta la operación y responde `400 Bad Request` con código `ITEM_NO_DISPONIBLE`.
5. **Pruebas de máquina de estados de combate (S-5):**
   - Se actualiza el encuentro a estado terminal `VICTORIA`.
   - El explorador intenta emitir un ataque adicional $\rightarrow$ El servidor detecta la condición terminal y rechaza la acción con `400 Bad Request` y código `ENCUENTRO_NO_ACTIVO`.
6. **Pruebas de inyección y manipulación de payload (S-6):**
   - Petición maliciosa a `POST /api/personajes` intentando inyectar `monedas: 999999`, `nivel: 99` y `experiencia: 50000` $\rightarrow$ `ValidationPipe` detecta las propiedades no autorizadas y responde `400 Bad Request`.
   - Petición maliciosa a `POST /api/combate/atacar` intentando enviar `danoCausado: 9999` $\rightarrow$ Responde `400 Bad Request`.

### 3.2 Tasa de éxito de la suite
```
▶ Batería de seguridad S-1 a S-7 (E2E)
  ✔ Tokens y Autenticación (Sin Token / Token Inválido) (9.16ms)
  ✔ S-1: Aislamiento estricto de recursos y personajes (89.21ms)
  ✔ S-2: Restricción territorial estricta (grafo y zonas) (40.39ms)
  ✔ S-3: Restricción de captura sin encuentro activo (11.73ms)
  ✔ S-4: Validación de inventario consumible (20.44ms)
  ✔ S-5: Validación de estado de combate (combate resuelto) (18.07ms)
  ✔ S-6: Inmunidad ante manipulación de payloads (whitelist & forbidNonWhitelisted) (132.56ms)
✔ Batería de seguridad S-1 a S-7 (E2E) (1301.64ms)
ℹ tests 24
ℹ pass 24
ℹ fail 0
```
**Resultado:** 100 % de casos aprobados (24/24 pruebas e2e en el monorepositorio).

---

## 4. Auditoría de persistencia y secretos en PostgreSQL (S-7)

Para certificar la salvaguarda **S-7**, se ejecutó una inspección forense directa sobre el motor relacional PostgreSQL alojado en el contenedor `aventura-postgres`, utilizando la herramienta del servidor MCP `postgres`:

```sql
SELECT id, nombre_usuario, correo, contrasena_hash,
       LENGTH(contrasena_hash) as longitud_hash,
       SUBSTRING(contrasena_hash, 1, 4) as prefijo
FROM usuario
LIMIT 10;
```

### 4.1 Evidencia forense de la base de datos
Los resultados de la consulta confirmaron de forma contundente:
1. **Ausencia total de texto claro:** Ninguna contraseña plana ni reversible se encuentra almacenada en la tabla `usuario`.
2. **Formato estándar bcrypt:** El 100 % de los registros presenta longitud exacta de **60 caracteres**.
3. **Prefijo criptográfico seguro:** Todos los registros inician con el prefijo `$2b$`, confirmando la implementación del algoritmo bcrypt moderno de OpenBSD con correcciones de ataques de longitud.
4. **Factor de trabajo óptimo:** La cabecera `$2b$10$` certifica el uso de un costo de iteración ($2^{10} = 1024$ rondas), proporcionando una sólida resistencia contra ataques de fuerza bruta y diccionarios con GPU sin degradar la latencia de respuesta en el registro e inicio de sesión.

---

## 5. Configuración de CORS y aislamiento de secretos

### 5.1 Política de origen cruzado (CORS)
En `apps/api/src/main.ts`, la configuración de CORS delimita explícitamente el origen de consumo:

```typescript
// Auditoría S-7: CORS restringido al origen web autorizado sin comodín universal
app.enableCors({
  origin: configService.get<string>('CORS_ORIGEN', 'http://localhost:5173'),
  credentials: true,
});
```

- Se prohíbe el uso de comodines universales (`origin: '*'`) en combinación con `credentials: true`.
- Las peticiones provenientes de orígenes no registrados son bloqueadas de forma preventiva a nivel del navegador mediante cabeceras `Access-Control-Allow-Origin`.

### 5.2 Aislamiento de variables de entorno
Se auditó exhaustivamente el archivo de configuración del Front-End (`apps/web/.env`), verificando que únicamente expone variables con el prefijo seguro de Vite:
- `VITE_MODO_API=http`
- `VITE_URL_API=http://localhost:3000`

Las credenciales críticas del sistema (`JWT_SECRETO`, `DATABASE_URL`, credenciales de conexión a Docker y contraseñas maestras) residen exclusivamente en `apps/api/.env`, fuera del árbol de compilación del cliente web y excluidas del historial de control de versiones mediante `.gitignore`.
