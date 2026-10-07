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
  3. *Poción de Curación Menor* (40 monedas): Consumible que restablece 30 HP a una criatura aliada.
  4. *Poción de Curación Mayor* (100 monedas): Consumible que restablece 70 HP a una criatura aliada.
- **Justificación:** Cumple la regla YAGNI y la simplificación de alcance pactada, evitando complejidades innecesarias de equipamiento o estadísticas pasivas, garantizando un flujo económico claro y funcional para el jugador.
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
