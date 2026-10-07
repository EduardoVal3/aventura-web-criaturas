# Wireframes de la interfaz: Aethelgard: Sendas y Criaturas

Este documento contiene los bocetos ASCII de todas las pantallas del flujo del juego, respetando la regla de interfaz declarativa (tarjetas, botones, texto y formularios en ≤ 80 columnas) y especificando identificadores únicos (`id`) para pruebas automatizadas y navegación.

---

## 1. PantallaIngreso y PantallaRegistro
- **Módulo cubierto:** `M-USR` (Usuarios).
- **Propósito:** Autenticación y creación de cuenta de explorador.

```text
+-----------------------------------------------------------------------+
|                 AETHELGARD: SENDAS Y CRIATURAS                        |
|                     [Portal de Exploradores]                          |
+-----------------------------------------------------------------------+
|                                                                       |
|   +-- [Iniciar Sesión] -------------------------------------------+   |
|   | Correo:     [campo-correo-ingreso                           ] |   |
|   | Contraseña: [campo-clave-ingreso                            ] |   |
|   |                                                               |   |
|   | [boton-ingresar]                [enlace-ir-registro]          |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
|   O si eres nuevo en el reino:                                        |
|   +-- [Crear Cuenta de Recluta] ----------------------------------+   |
|   | Nombre de Usuario: [campo-nombre-registro                   ] |   |
|   | Correo Electrónico:[campo-correo-registro                   ] |   |
|   | Contraseña:        [campo-clave-registro                    ] |   |
|   |                                                               |   |
|   | [boton-registrarse]             [enlace-ver-creditos]         |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `campo-correo-ingreso`: Entrada de texto.
  - `campo-clave-ingreso`: Entrada de contraseña.
  - `boton-ingresar`: Envía credenciales; tras éxito lleva a `PantallaHubUbicacion` (o `PantallaCrearPersonaje` si no posee personaje).
  - `enlace-ir-registro`: Alterna a la vista de registro.
  - `campo-nombre-registro`, `campo-correo-registro`, `campo-clave-registro`: Datos de registro.
  - `boton-registrarse`: Registra usuario; tras éxito lleva a `PantallaCrearPersonaje`.
  - `enlace-ver-creditos`: Navega a `PantallaCreditos`.

---

## 2. PantallaCrearPersonaje
- **Módulos cubiertos:** `M-PJ` (Personaje), `M-CRI` (Criaturas).
- **Propósito:** Creación del avatar de explorador y selección de criatura compañera inicial.

```text
+-----------------------------------------------------------------------+
|  NUEVA EXPEDICIÓN: CREACIÓN DE PERSONAJE                              |
+-----------------------------------------------------------------------+
|  Nombre del Explorador: [campo-nombre-personaje                     ] |
|                                                                       |
|  Selecciona tu criatura inicial:                                      |
|  +--------------------+ +--------------------+ +--------------------+ |
|  | [tarjeta-ini-1]    | | [tarjeta-ini-2]    | | [tarjeta-ini-3]    | |
|  | Lobo Gris          | | Oso Negro          | | Pico de Hacha      | |
|  | Tipo: Bestia       | | Tipo: Bestia       | | Tipo: Monstruosidad| |
|  | HP: 30  ATK: 42    | | HP: 33  ATK: 42    | | HP: 33  ATK: 42    | |
|  | DEF: 58 SPD: 50    | | DEF: 51 SPD: 40    | | DEF: 51 SPD: 60    | |
|  | [opcion-inicial-1] | | [opcion-inicial-2] | | [opcion-inicial-3] | |
|  +--------------------+ +--------------------+ +--------------------+ |
|                                                                       |
|  [boton-confirmar-personaje]                  [boton-cancelar-salida] |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `campo-nombre-personaje`: Nombre del explorador.
  - `opcion-inicial-1`, `opcion-inicial-2`, `opcion-inicial-3`: Radio buttons para seleccionar compañero inicial.
  - `boton-confirmar-personaje`: Crea el personaje con 100 monedas y la criatura en nivel 1; lleva a `PantallaHubUbicacion`.
  - `boton-cancelar-salida`: Cancela y regresa a `PantallaIngreso`.

---

## 3. PantallaHubUbicacion
- **Módulos cubiertos:** `M-MUN` (Mundo), `M-PJ` (Personaje), `M-PRO` (Progreso).
- **Propósito:** Vista central según la ubicación actual (localidad segura o zona), permitiendo acceso a servicios y viajes.

```text
+-----------------------------------------------------------------------+
| Explorador: [texto-nombre-pj] | Monedas: [texto-oro] | Ubic: [texto-ubic]
| Equipo: 3/6 criaturas activas | [boton-menu-equipo] [boton-menu-inv]  |
+-----------------------------------------------------------------------+
| UBICACIÓN ACTUAL: VILLA SERENA (Localidad Segura)                     |
| "Aldea pacífica en el valle donde inician los reclutas del gremio."   |
|                                                                       |
| Servicios de la Localidad:                                            |
| [boton-ir-curacion] Centro de Curación (Restauración gratuita)        |
| [boton-ir-tienda]   Tienda de Provisiones del Gremio                  |
| [boton-ir-almacen]  Almacén y Gestión de Criaturas                    |
| [boton-ir-historial]Bitácora de Expediciones                          |
|                                                                       |
| Conexiones y Rutas Disponibles:                                       |
| +-------------------------------------------------------------------+ |
| | [boton-viajar-zon01] -> Praderas del Amanecer (Nv. 1-3) [Abierta] | |
| | [boton-viajar-zon02] -> Bosque Susurrante    (Nv. 2-4) [Abierta] | |
| | [indicador-bloqueado]-> Cueva Umbría (Nv. 7-10) [BLOQUEADA - M-PRO] |
| +-------------------------------------------------------------------+ |
| [boton-ver-catalogo]                      [boton-cerrar-sesion]       |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-menu-equipo`: Lleva a `PantallaEquipo`.
  - `boton-menu-inv`: Lleva a `PantallaInventario`.
  - `boton-ir-curacion`: Lleva a `PantallaCuracion`.
  - `boton-ir-tienda`: Lleva a `PantallaTienda`.
  - `boton-ir-almacen`: Lleva a `PantallaAlmacen`.
  - `boton-ir-historial`: Lleva a `PantallaHistorial`.
  - `boton-viajar-zon01`, `boton-viajar-zon02`: Desplaza al explorador y abre `PantallaExploracion`.
  - `indicador-bloqueado`: Etiqueta no interactiva que muestra el requisito pendiente para desbloquear la zona.
  - `boton-ver-catalogo`: Lleva a `PantallaCatalogo`.
  - `boton-cerrar-sesion`: Cierra sesión y retorna a `PantallaIngreso`.

---

## 4. PantallaExploracion
- **Módulos cubiertos:** `M-EXP` (Exploración), `M-MUN` (Mundo).
- **Propósito:** Ejecutar la acción de explorar en rutas salvajes con resolución probabilística.

```text
+-----------------------------------------------------------------------+
| ZONA SILVESTRE: PRADERAS DEL AMANECER (Nivel 1 - 3)                   |
| Salud del Líder: Lobo Gris [====================] 30/30 HP            |
+-----------------------------------------------------------------------+
|                                                                       |
|   +-- [Bitácora de la Zona] --------------------------------------+   |
|   | [texto-resultado-exploracion]                                 |   |
|   | "Avanzas entre los pastizales mecidos por la brisa matutina...|   |
|   |  ¡Una criatura salvaje salta desde la maleza!"                |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
|   Acciones de Expedición:                                             |
|   [boton-explorar-zona]      Explorar la zona (Consume energía de ruta|
|   [boton-volver-localidad]   Regresar a Villa Serena (Retirada segura)|
|   [boton-viajar-puesto]      Continuar hacia Puesto Fronterizo        |
|                                                                       |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-explorar-zona`: Ejecuta `POST /api/exploracion/explorar`. Si el evento es `ENCUENTRO`, navega a `PantallaCombate`. Si es `OBJETO`, añade el objeto al inventario y actualiza `texto-resultado-exploracion`. Si es `SIN_EVENTO`, muestra mensaje ambiental.
  - `boton-volver-localidad`: Regresa a la localidad previa (`PantallaHubUbicacion`).
  - `boton-viajar-puesto`: Desplaza al jugador a otra ubicación conectada.

---

## 5. PantallaCombate y Captura
- **Módulos cubiertos:** `M-COM` (Combate), `M-CAP` (Captura), `M-ENC` (Encuentros), `M-INV` (Inventario).
- **Propósito:** Resolución del combate por turnos y captura de criaturas salvajes.

```text
+-----------------------------------------------------------------------+
| COMBATE EN CURSO: TURNO DEL JUGADOR [badge-turno: 1]                  |
+-----------------------------------------------------------------------+
|  RIVAL SALVAJE:                                                       |
|  [tarjeta-rival] Pico de Hacha (Nivel 2)                              |
|  HP: [barra-hp-rival   ] 14/19 HP [texto-hp-rival]                   |
|                                                                       |
|  TU COMPAÑERO:                                                        |
|  [tarjeta-aliado] Lobo Gris (Nivel 2)                                 |
|  HP: [barra-hp-aliado  ] 25/30 HP [texto-hp-aliado]   XP: 45/150      |
+-----------------------------------------------------------------------+
|  Registro de Combate:                                                 |
|  [caja-registro-combate: "¡Lobo Gris usó Mordisco Feroz! Causa 5 daño"]
+-----------------------------------------------------------------------+
|  Acciones de Turno:                                                   |
|  [boton-atacar-mov1: Mordisco Feroz (Poder 5.5)]                      |
|  [boton-atacar-mov2: Quijada Feroz  (Poder 8.5)]                      |
|  [boton-accion-capturar] Intentar Capturar (Usar Talismán)            |
|  [boton-usar-pocion]     Usar Poción de Curación                      |
|  [boton-intentar-huir]   Intentar Huir del Encuentro                  |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-atacar-mov1`, `boton-atacar-mov2`: Envía acción de ataque; resuelve daño y contraataque rival. Si el rival cae a 0 HP, muestra modal de victoria con XP ganada y regresa a `PantallaExploracion`.
  - `boton-accion-capturar`: Despliega selector de talismán (`talisman-basico` o `talisman-resonante`). Al confirmar, envía intento de captura. Si tiene éxito, navega a `PantallaEquipo` (o confirma captura y vuelve a `PantallaExploracion`); si falla, el rival contraataca.
  - `boton-usar-pocion`: Aplica curación a la criatura aliada.
  - `boton-intentar-huir`: Resuelve la tirada de huida. Si tiene éxito, regresa a `PantallaExploracion`; si falla, el rival ataca.

---

## 6. PantallaEquipo y PantallaAlmacen
- **Módulos cubiertos:** `M-EQU` (Equipo y Almacén).
- **Propósito:** Administración de criaturas activas (máximo 6) y reserva en almacén.

```text
+-----------------------------------------------------------------------+
| GESTIÓN DE CRIATURAS: EQUIPO ACTIVO Y ALMACÉN                         |
+-----------------------------------------------------------------------+
| EQUIPO ACTIVO (Máximo 6 criaturas):                                   |
| 1. [Lobo Gris]    Nv. 2 | HP: 25/30 | ATK: 42 | [boton-enviar-almacen]|
| 2. [Oso Negro]    Nv. 2 | HP: 33/33 | ATK: 42 | [boton-enviar-almacen]|
| 3. [Pico Hacha]   Nv. 1 | HP: 19/19 | ATK: 42 | [boton-enviar-almacen]|
| (Espacios 4, 5 y 6 vacíos)                                            |
+-----------------------------------------------------------------------+
| ALMACÉN CENTRAL (Villa Serena):                                       |
| - [Araña Lobo]    Nv. 1 | HP: 11/11 | [boton-mover-equipo-1]          |
| - [Cocatriza]     Nv. 2 | HP: 22/22 | [boton-mover-equipo-2]          |
|                                                                       |
| [boton-ordenar-equipo]                    [boton-volver-hub]          |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-enviar-almacen`: Transfiere criatura del equipo al almacén (deshabilitado si solo queda 1 criatura activa).
  - `boton-mover-equipo-1`, `boton-mover-equipo-2`: Pasa criatura del almacén al equipo (deshabilitado si el equipo tiene 6).
  - `boton-volver-hub`: Regresa a `PantallaHubUbicacion`.

---

## 7. PantallaInventario y PantallaTienda
- **Módulos cubiertos:** `M-INV` (Inventario y Comercio).
- **Propósito:** Consulta de objetos poseídos y adquisición de consumibles en localidades.

```text
+-----------------------------------------------------------------------+
| BAZAR DE PROVISIONES: PUESTO FRONTERIZO | Monedas: [texto-oro-tienda] |
+-----------------------------------------------------------------------+
| Artículos en Venta:                                                   |
| 1. Talismán Básico de Captura   | 50 Monedas  | [boton-comprar-tal-bas] |
| 2. Talismán Resonante Captura   | 150 Monedas | [boton-comprar-tal-res] |
| 3. Poción de Curación Menor     | 40 Monedas  | [boton-comprar-poc-men] |
| 4. Poción de Curación Mayor     | 100 Monedas | [boton-comprar-poc-may] |
+-----------------------------------------------------------------------+
| Tu Inventario Actual:                                                 |
| - Talismán Básico: 3 unidades                 [boton-usar-item-1]     |
| - Poción de Curación Menor: 2 unidades        [boton-usar-item-2]     |
|                                                                       |
| [boton-volver-hub-tienda]                                             |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-comprar-tal-bas`, `boton-comprar-tal-res`, etc.: Descuenta monedas y añade el ítem al inventario.
  - `boton-usar-item-2`: Permite consumir poción fuera de combate para sanar al equipo.
  - `boton-volver-hub-tienda`: Regresa a `PantallaHubUbicacion`.

---

## 8. PantallaCuracion
- **Módulos cubiertos:** `M-CUR` (Curación).
- **Propósito:** Restaurar la vitalidad del equipo activo en centros de servicio.

```text
+-----------------------------------------------------------------------+
| SANTUARIO DE RECUPERACIÓN - VILLA SERENA                              |
+-----------------------------------------------------------------------+
| Estado de tu Equipo:                                                  |
| 1. Lobo Gris      Nv. 2 | HP Actual: 12/30 [====------] Herido        |
| 2. Oso Negro      Nv. 2 | HP Actual: 0/33  [----------] Debilitado    |
| 3. Pico de Hacha  Nv. 1 | HP Actual: 19/19 [==========] Saludable     |
|                                                                       |
| "Las aguas termales del santuario restauran la fuerza vital de tus    |
| compañeros de viaje sin coste alguno."                                |
|                                                                       |
| [boton-sanar-equipo-completo]                 [boton-volver-santuario]|
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-sanar-equipo-completo`: Ejecuta `POST /api/curacion/restaurar`; restaura el HP de todas las criaturas activas a su `hpMaximo` y actualiza las barras de estado.
  - `boton-volver-santuario`: Retorna a `PantallaHubUbicacion`.

---

## 9. PantallaCatalogo y PantallaFichaCriatura
- **Módulos cubiertos:** `M-CRI` (Criaturas).
- **Propósito:** Enciclopedia de las 25 especies del juego y visualización de atributos detallados.

```text
+-----------------------------------------------------------------------+
| COMPENDIO DE CRIATURAS DE AETHELGARD (25 Especies Registradas)        |
+-----------------------------------------------------------------------+
| Filtro Tipo: [selector-tipo: Todos v] | Buscar: [campo-buscar-especie]|
|                                                                       |
| +-------------------------------------------------------------------+ |
| | [Lobo Gris]        | Bestia       | CR: 0.25 | [boton-ver-ficha-1]| |
| | [Lobo Huargo]      | Bestia       | CR: 1.00 | [boton-ver-ficha-2]| |
| | [Cocatriza]        | Monstruosidad| CR: 0.50 | [boton-ver-ficha-3]| |
| | [Quimera Tricéfala]| Monstruosidad| CR: 6.00 | [boton-ver-ficha-4]| |
| +-------------------------------------------------------------------+ |
|                                                                       |
| [boton-volver-hub-compendio]                                          |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `selector-tipo`, `campo-buscar-especie`: Filtros en cliente.
  - `boton-ver-ficha-1`: Abre modal/vista de detalle con las estadísticas normalizadas (`hpBase`, `ataqueBase`, etc.) y movimientos.
  - `boton-volver-hub-compendio`: Retorna a `PantallaHubUbicacion`.

---

## 10. PantallaHistorial
- **Módulos cubiertos:** `M-HIS` (Historial).
- **Propósito:** Bitácora cronológica de eventos de exploración, capturas y combates.

```text
+-----------------------------------------------------------------------+
| BITÁCORA DE EXPEDICIONES DEL EXPLORADOR                               |
+-----------------------------------------------------------------------+
| Registro de Eventos Recientes:                                        |
| +-------------------------------------------------------------------+ |
| | 12:45 | Victoria contra Pico de Hacha (Nv. 2) en Praderas (+45 XP)| |
| | 12:42 | Captura exitosa de Lobo Gris con Talismán Básico          | |
| | 12:40 | Descubrimiento de 25 monedas en Bosque Susurrante         | |
| | 12:35 | Huida exitosa de encuentro hostil con Oso Pardo           | |
| +-------------------------------------------------------------------+ |
|                                                                       |
| [boton-limpiar-filtros]                       [boton-volver-bitacora] |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-volver-bitacora`: Retorna a `PantallaHubUbicacion`.

---

## 11. PantallaCreditos
- **Módulos cubiertos:** Requisito legal y académico (Anexo A.4).
- **Propósito:** Atribución obligatoria de la API Open5e (`srd-2024` bajo CC BY 4.0) y licencias de dependencias.

```text
+-----------------------------------------------------------------------+
|                     CRÉDITOS Y ATRIBUCIONES LEGALES                   |
+-----------------------------------------------------------------------+
| PROYECTO: Aethelgard: Sendas y Criaturas                              |
| ASIGNATURA: ISC-305 Programación Web · III PAC 2026                   |
|                                                                       |
| DATOS EXTERNOS Y REGLAS DE CRIATURAS:                                 |
| "This work includes material taken from the System Reference          |
|  Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at   |
|  https://dnd.wizards.com/resources/systems-reference-document,        |
|  and licensed under the Creative Commons Attribution 4.0              |
|  International License available at                                   |
|  https://creativecommons.org/licenses/by/4.0/legalcode."              |
|                                                                       |
| API CONSUMIDA:                                                        |
| Open5e API v2 (https://open5e.com)                                    |
|                                                                       |
| SISTEMA DE DISEÑO E INTERFAZ:                                         |
| 8bitcn/ui (shadcn/ui pixel art components)                            |
| Licencia MIT (Copyright (c) 2024 8bitcn)                              |
|                                                                       |
| [boton-volver-inicio-creditos]                                        |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-volver-inicio-creditos`: Retorna a `PantallaIngreso` o `PantallaHubUbicacion`.
