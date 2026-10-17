# Decisiones del proyecto

## D-01. API externa: Open5e v2, documento srd-2024
- Fuente y fecha de consulta:
  - `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&ordering=challenge_rating_decimal&fields=key,name,type,challenge_rating,hit_points,armor_class` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&name__icontains=wolf&fields=key,name,type,challenge_rating,hit_points,armor_class,speed_all,ability_scores,actions` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/documents/?key=srd-2024` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/licenses/` (7 de octubre de 2026)
- Total de criaturas en srd-2024: 331
- Campos confirmados:
  - `key` (cadena única con prefijo `srd-2024_`, p. ej. `srd-2024_wolf`)
  - `name` (cadena en inglés, p. ej. `Wolf`)
  - `type` (objeto `{ name: string, key: string }`, p. ej. `{ "name": "Beast", "key": "beast" }`)
  - `challenge_rating` (numérico entero o decimal, p. ej. `0.25`, `1`, `3`)
  - `armor_class` (entero)
  - `hit_points` (entero)
  - `speed_all` (objeto con `unit`, `walk`, `crawl`, `fly`, `swim`, `climb`, `burrow`, `hover`)
  - `ability_scores` (objeto con `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`)
  - `actions` (lista de acciones con `name`, `desc`, `action_type`, `attacks`)
  - `actions[].attacks` (lista de ataques con `name`, `attack_type`, `to_hit_mod`, `damage_die_count`, `damage_die_type` como `"D6"`, `damage_bonus`, `extra_damage_type`)
- Campos que llegan en null:
  - En ataques: `damage_type` (a menudo null; el tipo principal suele reportarse en `extra_damage_type`), `extra_damage_die_count`, `extra_damage_die_type`, `extra_damage_bonus`, `range` (en ataques cuerpo a cuerpo), `long_range` y `reach` (en ataques a distancia).
  - En acciones: `attacks` (llega vacío `[]` en acciones de soporte, cambio de forma o alientos de área como `Multiattack` o `Cold Breath`), `legendary_action_cost`, `limited_to_form`, `usage_limits`.
- Diferencias con el Anexo A.1 del plan: ninguna a nivel de esquema; la estructura de campos de `srd-2024` coincide con la prevista. Como particularidad técnica de la API, las peticiones deben especificar `format=json` o cabecera `Accept: application/json` para no recibir la interfaz navegable HTML de Django REST Framework.
- Licencia de srd-2024: Creative Commons Attribution 4.0 International (CC BY 4.0), verificada en `https://api.open5e.com/v2/documents/?key=srd-2024` y `https://dnd.wizards.com/resources/systems-reference-document`.
- Atribución exigida (texto literal):
  "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
  (Traducción de cortesía: "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode.")
- Límites de uso: no documentados; se hará una sola importación con `fields`.

## D-02. Tamaño del equipo activo y almacén
- **Contexto:** El requisito `A-6` establece un límite de hasta 6 criaturas activas, pero el jugador puede capturar más criaturas durante su aventura.
- **Decisión:** El equipo activo tendrá un máximo estricto de 6 criaturas (`A-6`). Toda criatura adicional capturada cuando el equipo activo esté completo (6 miembros) se transferirá automáticamente al almacén de reserva. El jugador podrá intercambiar libremente criaturas entre su equipo y el almacén al visitar localidades seguras con dicho servicio.
- **Justificación:** Previene desequilibrios en el combate, respeta la regla de alcance `A-6` y garantiza que el jugador nunca pierda una criatura capturada por falta de espacio en su equipo activo.
- **Impacto:**
  - Módulos: `M-EQU`, `M-CAP`.
  - Pantallas: `PantallaEquipo`, `PantallaAlmacen`, `PantallaCombate`.
  - Tablas/Entidades: `Criatura` (atributos `enEquipo: boolean`, `enAlmacen: boolean`, `ordenEquipo: int | null`).

## D-03. Alcance del catálogo de la tienda
- **Contexto:** El enunciado exige un módulo de inventario con elementos básicos de captura y recuperación (`M-INV`), requiriendo acotar los objetos disponibles y su economía.
- **Decisión:** Se define una tienda mínima con 4 objetos consumibles esenciales clasificados en captura y recuperación, tasados en monedas:
  1. *Talismán Básico de Captura* (50 monedas): Objeto de captura estándar (multiplicador x1.0).
  2. *Talismán Resonante de Captura* (150 monedas): Objeto de captura avanzado con mayor afinidad arcana (multiplicador x1.5).
  3. *Poción de Curación Menor* (30 monedas): Consumible que restablece 20 HP a una criatura aliada.
  4. *Poción de Curación Mayor* (80 monedas): Consumible que restablece 50 HP a una criatura aliada.
- **Justificación:** Cumple la regla YAGNI y la simplificación de alcance pactada, sincronizando con los valores canónicos sembrados en `prisma/seed.ts`, evitando complejidades innecesarias de equipamiento o estadísticas pasivas, garantizando un flujo económico claro y funcional para el jugador.
- **Impacto:**
  - Módulos: `M-INV`, `M-COM`, `M-CAP`.
  - Pantallas: `PantallaTienda`, `PantallaInventario`, `PantallaCombate`.
  - Tablas/Entidades: `Item` (catálogo base seed), `InventarioItem` (relación jugador-ítem con cantidad).

## D-04. Momento y mecánica de la captura
- **Contexto:** El flujo del jugador indica "Combatir, capturar o escapar" (`FLUJO`), lo cual permitía interpretar si la captura se realizaba en una pantalla independiente o integrada en el combate.
- **Decisión:** La captura ocurre **dentro del combate** como una acción táctica del turno del jugador. Al seleccionar "Capturar", el jugador elige un talismán de su inventario; el servidor evalúa la probabilidad con base en la fórmula de captura (`docs/reglas-juego.md`), consume el talismán y determina si el intento tuvo éxito (cerrando el encuentro victoriosamente) o si falló (cediendo el turno para el contraataque de la criatura salvaje).
- **Justificación:** Ofrece una experiencia táctica interactiva donde el jugador asume el riesgo de intentar capturar a una criatura herida sin debilitarla por completo, manteniendo la consistencia de las máquinas de estados de combate por turnos (`S-3`, `S-5`).
- **Impacto:**
  - Módulos: `M-CAP`, `M-COM`, `M-INV`, `M-EQU`.
  - Pantallas: `PantallaCombate`.
  - Tablas/Entidades: `Encuentro` (estados `EN_CURSO`, `CAPTURADO`, `HUIDO`, `VICTORIA`, `DERROTA`).

## D-05. Definición formal de Localidad versus Ruta/Zona
- **Contexto:** El enunciado y el mapa conceptual diferencian "localidades principales" de "rutas o zonas explorables" (`A-4`), requiriendo una frontera conceptual clara en la arquitectura.
- **Decisión:** Se establece una distinción estructural formal aprobada por el usuario:
  - **Localidad:** Asentamiento civilizado y seguro (`esSegura: true`). En las localidades **no** se generan encuentros hostiles ni eventos aleatorios de daño. Albergan servicios permanentes del sistema: Centro de Curación (gratuito), Tienda/Bazar de provisiones y Almacén de criaturas.
  - **Ruta o Zona:** Entorno silvestre o peligroso (`esSegura: false`). Es el único tipo de ubicación donde el jugador puede invocar la acción de "Explorar", resolviendo probabilidades de encuentros con criaturas salvajes, hallazgo de botines o eventos ambientales. Pueden tener requisitos de desbloqueo asociados (`M-PRO`).
  - Ambas entidades comparten el modelo base de localización espacial (`Ubicacion`), con aristas de conexión bidireccionales o condicionadas.
- **Justificación:** Otorga claridad absoluta a la máquina de estados de navegación, previene la ambigüedad sobre dónde se puede combatir o curar, y simplifica la validación de seguridad de movimientos en el servidor (`S-2`).
- **Impacto:**
  - Módulos: `M-MUN`, `M-EXP`, `M-CUR`, `M-PRO`.
  - Pantallas: `PantallaLocalidad`, `PantallaZonaExploracion`, `PantallaMapaMundo`.
  - Tablas/Entidades: `Ubicacion`, `ConexionUbicacion`, `TablaAparicionZona`, `TablaEventoZona`.

## D-06. Sistema de diseño Front-End: 8bitcn/ui sobre shadcn/ui y Tailwind CSS v4
- **Fuentes y documentación consultada:**
  - 8bitcn/ui: `https://www.8bitcn.com/docs` y `https://github.com/TheOrcDev/8bitcn-ui` (Licencia MIT, Copyright (c) 2025 8bitcn).
  - shadcn/ui para Vite: `https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/installation/vite.mdx`.
  - React Router (modo biblioteca): `https://github.com/remix-run/react-router/blob/main/docs/start/modes.md`.
- **Versiones exactas instaladas (sin rangos `^` ni `~`):**
  - `react`: 19.3.0
  - `react-dom`: 19.3.0
  - `vite`: 8.3.3
  - `typescript`: 6.0.3
  - `tailwindcss`: 4.3.3
  - `@tailwindcss/vite`: 4.3.3
  - `shadcn` (CLI): 4.21.4
  - `react-router`: 8.4.0
  - `radix-ui`: 1.7.0
  - `lucide-react`: 1.52.0
  - `class-variance-authority`: 0.7.1
  - `cn`: 0.4.0
  - `sonner`: 2.0.8
  - `next-themes`: 0.4.6
  - `tw-animate-css`: 1.4.0
- **Ruta real de los componentes generada por el CLI:**
  - Los componentes de 8bitcn se ubican en `apps/web/src/components/ui/8bit/`, acompañados de sus envoltorios base de shadcn en `apps/web/src/components/ui/`.
  - *Nota:* Esta ruta en inglés (`components/ui/8bit/`) la impone la herramienta y el registro oficial de shadcn/8bitcn como excepción técnica aceptada por el glosario (§1 y R1).
- **Tabla de uso de componentes en el juego:**
  | Elemento del juego | Componente 8bitcn/ui | Función en la interfaz |
  | --- | --- | --- |
  | HP de criatura aliada | `health-bar` | Barra de salud con valor porcentual en equipo y combate |
  | HP de enemigo en encuentro | `enemy-health-display` | Panel con nombre, nivel y barra de salud del rival |
  | Experiencia acumulada | `xp-bar` | Barra de XP con animación de ¡SUBIÓ DE NIVEL! |
  | Progreso general de zona | `progress` | Porcentaje de avance de expedición en el área |
  | Tarjetas de equipo y criaturas | `card` y `badge` | Fichas de criaturas, estadísticas y distintivos de tipo |
  | Encuentro y confirmaciones | `dialog` y `alert-dialog` | Modales de encuentro silvestre y confirmación de huida |
  | Inventario e historial | `table` | Tablas con encabezados, subtítulos y datos de eventos |
  | Mensajes de eventos | `toast` | Notificaciones emergentes de capturas y subidas de nivel |
  | Carga y esperas | `skeleton` y `spinner` | Bloques animados y rueda retro durante consultas asíncronas |
  | Acciones principales | `button` | Interacciones, ataques, opciones y navegación |
  | Formulario de expedición | `form` + `input`, `label`, `select` | Captura y validación nativa de datos de usuario |
  | Pestañas de pantalla | `tabs` | Separación de vistas de equipo, almacén y ajustes |
- **Compatibilidad con Vite y dependencias extra:**
  - Reemplazos de `next/*`: ninguno (`Get-ChildItem` no detectó imports de Next.js en el código copiado).
  - Componentes que requirieron dependencias extra para tipado estricto en TypeScript:
    - `@radix-ui/react-alert-dialog`: 1.1.24 (para tipos de `AlertDialogPrimitive`)
    - `@radix-ui/react-label`: 2.1.16 (para tipos de `LabelPrimitive`)
    - `@radix-ui/react-select`: 2.3.8 (para tipos de `SelectPrimitive`)
    - `@radix-ui/react-tabs`: 1.1.22 (para tipos de `TabsPrimitive`)
- **Modo de API:**
  - Controlado por la variable de entorno `VITE_MODO_API` (`simulado` por defecto, o `http`).
  - URL base configurable mediante `VITE_URL_API` (prefijo `/api`).
  - La interfaz `ApiJuego` aísla por completo la capa de presentación de la implementación de datos (`ARQ`).

---

## 5. Persistencia del progreso de exploración en base de datos relacional (Fase 9)

- **Decisión arquitectónica:**
  - Se descarta formalmente el almacenamiento del progreso de exploración en el cliente (`localStorage` o estado volátil del navegador) para dar cumplimiento estricto a las salvaguardas **S-6** (inmunidad ante manipulación de estado por el cliente) y **A-8** (la lógica de progresión y mundo se computa y valida exclusivamente en el servidor).
  - El porcentaje de avance exploratorio se persiste en la tabla relacional `zona_desbloqueada`, agregando la columna `progreso INTEGER NOT NULL DEFAULT 0` mediante la migración `20261009042525_agrega_progreso_zona_desbloqueada`.
  - Cada acción de exploración (`POST /api/exploracion/explorar`) incrementa en el Back-End el progreso de la zona en $+20\,\%$ hasta un tope de $100\,\%$.
  - Los endpoints `GET /api/mundo/ubicacion-actual` y `POST /api/exploracion/explorar` devuelven el atributo `progresoZona`, permitiendo al Front-End reflejar de forma reactiva y fidedigna el avance cartográfico y desplegar la insignia de "Zona 100% Explorada / Cartografiada".

---

## 6. Progresión condicionada y resiliencia UX en Exploración y Encuentros (Subfase 10d)

- **Decisión arquitectónica:**
  - **Desacoplamiento de Progreso ante Encuentros Hostiles:** En `exploracion.service.ts`, los eventos de tipo `ENCUENTRO` no incrementan el progreso de la ruta de manera anticipada. El avance cartográfico (+20% hasta 100%) se reserva para exploraciones pacíficas (`OBJETO` o `SIN_EVENTO`) o para la resolución favorable del combate mediante victoria (`CombateService`) o captura exitosa (`CapturaService`). Esto asegura consistencia lógica: una senda silvestre no se considera cartografiada hasta superar el peligro que la bloquea.
  - **Estado Reactivo de Combate Activo y Banner Permanente:** Para prevenir desorientación del explorador si cierra el modal o elige inspeccionar la criatura, `PantallaExploracion.tsx` mantiene un banner de alerta con los datos del rival (`rivalActivo`) y muta el botón principal a `RESOLVER COMBATE CON [RIVAL]`. Esto erradica bloqueos de flujo y previene errores `409 Conflict` por reintentos de exploración no permitidos.
  - **Arquitectura de Interfaz Responsive y Sellado de Modales:** El Hero Panorámico de la ruta separa la ilustración visual superior de la descripción y metadatos inferiores, garantizando cero colisiones entre insignias de cabecera y tipografías en viewports compactos (`320px–425px`). Asimismo, los modales incorporan `overflow-hidden` en el contenedor `DialogContent` para neutralizar desbordes horizontales causados por pseudobordes 8-bit (`-mx-1.5`), delegando el scroll vertical exclusivamente a un contenedor interior, y apilando las acciones tácticas verticalmente a ancho completo para evitar truncamientos de la tipografía `Press Start 2P`.

---

## 7. Bloqueo por fila de personaje e intercambio atómico equipo-almacén (Subfase 10f)

- **Decisión arquitectónica:**
  - **Bloqueo pesimista por fila de personaje (`FOR UPDATE`) frente a aislamiento Serializable:** En `equipo.service.ts` (`actualizarOrden` y `moverCriatura`), para neutralizar condiciones de carrera concurrentes (ej. dobles clics rápidos o dos pestañas abiertas) que pudieran violar la regla `A-6` (máximo 6 criaturas en equipo) o dejar al equipo vacío (< 1 criatura), se ejecuta `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE` como primera instrucción dentro de la transacción interactiva de Prisma. Esto serializa estrictamente las mutaciones del equipo de un mismo jugador sin incurrir en la sobrecarga de bloqueos a nivel de tabla ni en la complejidad de capturar y reintentar fallos de concurrencia optimista `P2034` en PostgreSQL.
  - **Intercambio atómico directo en `POST /api/equipo/transferir` frente a endpoint independiente:** En lugar de multiplicar la superficie de la API con una ruta separada (`POST /api/equipo/intercambiar`), se enriqueció `MoverCriaturaEquipoDto` con el parámetro opcional `intercambiarConId`. Cuando el equipo está lleno (6/6), el jugador puede relevar directamente a un compañero: la criatura saliente pasa a `{ enEquipo: false, ordenEquipo: null }` y la entrante hereda `{ enEquipo: true, ordenEquipo: <orden de la saliente> }` dentro de la misma transacción interactiva. Esto garantiza que la posición táctica se conserve intacta (si la saliente era líder, la entrante asume la jefatura de combate de inmediato) y elimina la ventana de vulnerabilidad donde el equipo quedaba transitoriamente reducido a 5 miembros.
  - **Permutación íntegra y estricta en `PATCH /api/equipo/orden`:** Se reforzó el reordenamiento táctico para exigir que la lista enviada represente una biyección exacta del conjunto de criaturas del equipo activo (mismo tamaño, sin IDs duplicados ni ajenos, y con órdenes consecutivos $1..n$). Como `CombateService` determina al líder como la primera criatura viva con `ordenEquipo asc`, esta garantía estructural en el servidor previene estados corruptos o indeterminados en la apertura de batallas.

---

## 8. Comercio transaccional por lotes, capacidad de inventario y curación fuera de combate (Subfase 10g)

- **Decisión arquitectónica:**
  - **Catálogo Autorizado Servido desde PostgreSQL (`GET /api/tienda`):** Se eliminó la duplicación y hardcoding de artículos en el cliente, centralizando la consulta oficial de precios, descripciones y tipos en base de datos. El endpoint entrega además `servicioDisponible` (dependiendo de la localidad actual), `saldoMonedas` y `cantidadEnInventario` de cada objeto, garantizando coherencia reactiva sin peticiones redundantes.
  - **Cálculo Unilateral de Costo y Bloqueo Pesimista en Compra (`S-4`, `S-6`):** En `TiendaService.comprar`, el cliente únicamente envía `{ itemCodigo, cantidad }`. El servidor acota estrictamente la cantidad a $[1, 99]$ vía `@Max(99)` en `ComprarDto`, calcula $\text{costoTotal} = \text{precioCompra} \times \text{cantidad}$ desde el registro inmutable de la base de datos (inmunidad contra inyección de costos alterados `S-6`), y serializa la transacción interactiva mediante `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE`. Esto neutraliza carreras de saldo por dobles clics y compra simultánea de lotes.
  - **Salvaguarda Matemática `INV-03` y Rechazo de Curación Plena en Servidor:** En `InventarioService.usarObjeto`, se restringe el consumo fuera de combate estrictamente a objetos con `tipo === 'CURACION'` (`400 OBJETO_NO_CONSUMIBLE`). Si la criatura seleccionada ya cuenta con sus puntos de golpe al máximo ($\text{hpActual} \ge \text{hpMaximo}$), la petición se aborta con `400 SALUD_COMPLETA` sin descontar el consumible del inventario. La salud restaurada se acota reactivamente a $\min(\text{hpMaximo}, \text{hpPrevio} + \text{efectoValor})$.
  - **Capacidad de Bolsa y Ergonomía Responsive en Front-End:** Se estandarizó la capacidad máxima de la bolsa en 20 ranuras distintas, visualizadas mediante un medidor porcentual y una grilla ortogonal de ranuras 8-bit. Para resolver el desborde horizontal en viewports de 320 px, se reemplazó la tabla plana por una cuadrícula de tarjetas responsivas con sprites pixelados (`.pixelated`), filtros táctiles por categoría (`TODOS`, `CURACION`, `CAPTURA`, `ESPECIAL`), selector de lotes rápidos (`x1`, `x5`, `x10`), modales sellados contra overflow (`w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none`) y retroalimentación acústica Web Audio en compras y curaciones.

---

## 9. Bestiario canónico de 30 criaturas, soberanía de atributos, sets de 4 movimientos y consagración de legendarias (Subfase 10j)

- **Decisiones arquitectónicas tomadas (D-1 a D-8):**
  - **D-1 (Unificación de Slugs):** Se unifica el slug oficial de la quimera como `quimera-tricefala` (descartando `quimera` obsoleto).
  - **D-2 (Semilla de Quelonio Lacustre):** Para mantener la legitimidad y trazabilidad con el SRD 5.2 de Open5e, el `quelonio-lacustre` adopta como clave externa y dados de referencia `srd-2024_plesiosaurus` (suavizado a desafío CR 1 en la Zona 2 de Marismas).
  - **D-3 (Depuración Transaccional de Especies):** El importador (`importar-especies.ts`) opera mediante upsert idempotente por `idExterno` y ejecuta un borrado transaccional de especies obsoletas no pertenecientes al bestiario canónico (`brown-bear`, `werewolf`, etc.), resembrando limpiamente las filas dependientes en `AparicionZona`, `Movimiento` y `Criatura`.
  - **D-4 (Jerarquía de Slots y Bloqueo de Furia en Servidor):** Cada especie cuenta con exactamente 4 movimientos (`slot: 1..4`). El jugador solo puede invocar en combate los slots 1 a 3 (`movimientoIndice: 0..2`). El slot 4 (`movimientoIndice: 3`, Furia) está formalmente bloqueado en el servidor bajo código `400 MOVIMIENTO_BLOQUEADO` hasta que se desarrolle la mecánica de Resonancia. Los rivales salvajes seleccionan aleatoriamente su contraataque exclusivamente entre los slots 1 y 3 (el rival nunca sortea el slot 4).
  - **D-5 (Afinidad Elemental Retro Canónica):** Cada criatura posee una de las 6 afinidades elementales oficiales: `fisico`, `fuego`, `agua`, `natura`, `sombra` o `luz`, expuestas en la base de datos y en la UI con paleta y badges retro.
  - **D-6 (Principio de Soberanía Interna de Atributos):** Las estadísticas de combate de las 30 criaturas (`hpBase`, `ataqueBase`, `defensaBase`, `velocidadBase`) y sus movimientos no se recalculan al vuelo ni quedan a merced de anomalías del SRD externo. Residen de forma inmutable y soberana en `apps/api/src/modulos/externo/bestiario-canonico.ts`, asegurando un presupuesto balanceado de J-1 (160–210) a J-4 (310–380) con estadísticas individuales estrictamente en $[30, 100]$.
  - **D-7 (Estandarización de Tigre Dientes de Sable):** Se estandariza el slug como `tigre-dientes-sable` con clave externa estable `srd-2024_tiger` para la Zona 6.
  - **D-8 (Consagración de Criaturas Legendarias):** Se elevan oficialmente a la categoría de **Criaturas Legendarias** a `behir-abismo` (Zona 5, Presupuesto 355) y `remorhaz-glaciar` (Zona 6, Presupuesto 380), dotándolas de `esLegendaria: true`, insignia `Crown` de Lucide y tratamiento visual dorado retro en el compendio.
  - **Distribución de Aparición Normalizada INV-01:** Las 6 tablas de aparición (`AparicionZona`) cuentan con exactamente 5 especies autóctonas ponderadas como $35\% + 35\% + 15\% + 10\% + 5\% = 100\%$, cumpliendo el invariante **INV-01** de manera estricta y predecible.

---

## 10. Validación de existencia en base de datos para AutenticacionGuard y mitigación de trampas de navegación en Front-End

- **Decisión arquitectónica:**
  - **Defensa contra Tokens Huérfanos en `AutenticacionGuard`:** Un token JWT que supera la verificación de firma criptográfica no garantiza por sí solo que la entidad de dominio siga existiendo en PostgreSQL (por ejemplo, tras un reseteo de base de datos con `prisma migrate reset` o eliminación de cuentas). Para prevenir que peticiones huérfanas alcancen la capa de servicios y provoquen fallos de clave foránea (`P2003`), `AutenticacionGuard` consulta `prisma.usuario.findUnique({ where: { id: cargaUtil.sub } })`. Si no existe, arroja inmediatamente `401 Unauthorized` con código `USUARIO_NO_ENCONTRADO`.
  - **Desbloqueo de `RutaPublica` sin Personaje Activo:** Previamente, `RutaPublica` redirigía a `/crear-personaje` ante cualquier token presente, impidiendo al usuario acceder a `/ingreso` o `/registro` si requería crear una nueva cuenta o iniciar sesión tras un reseteo. Se ajustó la regla para redirigir al `/hub` exclusivamente cuando `token && personajeActivo`. De este modo, los usuarios sin personaje conservan acceso a las vistas de autenticación para conmutar credenciales libremente.
  - **Heurística de Control y Libertad del Usuario (Nielsen #3):** Se incorporaron vías de escape retro accesibles mediante el icono `LogOut` de Lucide:
    1. En `PantallaCrearPersonaje.tsx`: botón "SALIR AL INGRESO" en la cabecera y enlace para conmutar de cuenta en el pie de la tarjeta, con captura preventiva de errores 401 que purgan el almacenamiento local.
    2. En `LayoutPrincipal.tsx`: conmutación reactiva de la barra de navegación que muestra "Ingreso" (`LogIn`) y "Registro" (`UserPlus`) en estado desautenticado, y botón "SALIR" (`LogOut`) cuando hay un token en memoria.
