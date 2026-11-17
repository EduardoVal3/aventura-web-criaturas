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
| | [boton-viajar-zon02] -> Riberas Lago Espejo   (Nv. 2-4) [Abierta] | |
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
- **Propósito:** Administración de criaturas activas (máximo 6), relevo táctico del líder de combate, ranuras libres e intercambio atómico directo con el almacén.

```text
+-----------------------------------------------------------------------+
| EQUIPO ACTIVO (3/6)                   [Ir al Almacén] [Asentamiento] |
| Localidad Segura: Activa (Transferencias autorizadas)                 |
+-----------------------------------------------------------------------+
| 1. [Lobo Alfa] [LÍDER] Nv.5 | HP: 45/45 | ATK:14 DEF:10 VEL:12        |
|    Sprite 8-bit | [Subir ^ (off)] [Bajar v] | [boton-enviar-almacen]  |
|                                                                       |
| 2. [Gólem Roca]        Nv.4 | HP: 60/60 | ATK:16 DEF:20 VEL:6         |
|    Sprite 8-bit | [Subir ^] [Bajar v] [Designar Líder] | [almacén]    |
|                                                                       |
| 3. [Fénix Menor]       Nv.3 | HP:  0/35 | [DEBILITADA] (omite combate)|
|    Sprite 8-bit | [Subir ^] [Bajar v (off)] [Líder (off)] | [almacén] |
|                                                                       |
| [ RANURA LIBRE 4 de 6 ]   [ RANURA LIBRE 5 de 6 ]   [ RANURA LIBRE 6] |
+-----------------------------------------------------------------------+
| ALMACÉN DE CRIATURAS (2 en reserva)   [Ver Equipo (3/6)] [Asentamiento|
+-----------------------------------------------------------------------+
| - [Araña Lobo]  Nv.1 | HP:11/11 | ATK:35 DEF:40 VEL:48 | [Mover Equipo]|
| - [Cocatriza]   Nv.2 | HP:22/22 | ATK:40 DEF:30 VEL:52 | [Mover Equipo]|
| (Si equipo está lleno 6/6: Botón muta a [Intercambiar] -> Modal)      |
+-----------------------------------------------------------------------+
| MODAL TÁCTICO: "Elegir relevo" (Dialog sellado sin scroll horizontal) |
| "Cocatriza ocupará el puesto de la criatura que elijas:"              |
| [o] Lobo Alfa [LÍDER] (Nv. 5 • 45/45 HP)                             |
| ( ) Gólem Roca        (Nv. 4 • 60/60 HP)                             |
| [ Confirmar intercambio (PROCESANDO...) ] [ Cancelar ]                |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `Subir ^` / `Bajar v`: Reordena interactivamente la criatura en la formación activa invocando `PATCH /api/equipo/orden`.
  - `Designar Líder`: Coloca a la criatura en la posición 1 (`orden === 1`), convirtiéndola en quien abre el combate.
  - `boton-enviar-almacen`: Transfiere criatura al almacén si el equipo cuenta con más de 1 integrante y está en localidad segura.
  - `Mover al equipo`: Pasa la criatura al equipo si hay ranuras libres ($< 6$).
  - `Intercambiar`: Despliega el modal "Elegir relevo" cuando el equipo está completo ($6/6$), realizando una sustitución atómica directa que preserva la posición táctica original.
  - `[Ir al Almacén]`, `[Ver Equipo]`, `[Asentamiento]`: Navegación accesible con `Button asChild` hacia `/almacen`, `/equipo` y `/hub`.

---

## 7. PantallaInventario y PantallaTienda
- **Módulos cubiertos:** `M-INV` (Inventario y Comercio), `M-CUR` (Curación fuera de combate).
- **Propósito:** Gestión táctica de la bolsa por categorías con capacidad de ranuras, y comercio mercantil con lotes autoritativo desde servidor.

```text
+-----------------------------------------------------------------------+
| BAZAR DE PROVISIONES | Oro: 120 G | Ubicación: Puesto Fronterizo      |
| [boton-ir-inventario]                             [boton-ir-asentamiento] |
+-----------------------------------------------------------------------+
| CATÁLOGO MERCANTIL (Precios oficiales desde servidor):                |
| +-----------------------------------+ +-------------------------------+ |
| | [img] Poción Menor (+20 HP)       | | [img] Talismán Básico (Nv.1)  | |
| | 30 Oro | En bolsa: x2             | | 50 Oro | En bolsa: x3         | |
| | Lote: [x1] [x5] [x10]  [-] 1x [+] | | Lote: [x1] [x5] [x10]  [-]1x[+] |
| | Costo: 30 Oro                     | | Costo: 50 Oro                 | |
| | [boton-adquirir-lote-poc-menor]   | | [boton-adquirir-lote-tal-bas] | |
| +-----------------------------------+ +-------------------------------+ |
|                                                                       |
| >> MODAL SELLADO DE CONFIRMACIÓN DE COMPRA [overflow-hidden]:        |
|    "Confirmar adquisición de 5x Poción Menor por 150 Oro"             |
|    Saldo actual: 200 Oro -> Saldo proyectado: 50 Oro                  |
|    [BOTON-CONFIRMAR-ADQUISICION]   [BOTON-CANCELAR]                   |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| BOLSA E INVENTARIO | Oro: 120 G | Ranuras: 2/20 (10%) • 5 uds.       |
| Barra de carga: [==------------------] 10% de ocupación               |
| [boton-ir-bazar]                                  [boton-ir-asentamiento] |
+-----------------------------------------------------------------------+
| Filtros: [TODOS (2)] [CURACIÓN (1)] [CAPTURA (1)] [ESPECIAL (0)]      |
|                                                                       |
| +-----------------------------------+ +-------------------------------+ |
| | [img] Poción de Curación Menor    | | [img] Talismán Básico Captura | |
| | Cód: pocion-menor | Restaura +20HP| | Cód: talisman-basico | Bono x1| |
| | Cantidad en bolsa: x2 unidades    | | Cantidad en bolsa: x3 unidades| |
| | [BOTON-APLICAR-A-CRIATURA]        | | [BOTON-USO-EN-COMBATE]        | |
| +-----------------------------------+ +-------------------------------+ |
|                                                                       |
| >> MODAL SELLADO DE CURACIÓN REACTIVA [INV-03, overflow-hidden]:      |
|    Poción Menor (+20 HP) | Disponibles: x2                            |
|    - Lobo Alfa Nv.3 | [====------] 15/30 HP (+15 HP) -> [SANAR +15 HP]|
|    - Oso Pardo Nv.2 | [==========] 33/33 HP ---------> [SALUD COMPLETA|
|    [BOTON-CERRAR-MODAL]                                               |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `boton-adquirir-lote`: Despliega el modal sellado de confirmación con desglose de saldo actual y proyectado; previene dobles clics con `aria-busy`.
  - `BOTON-APLICAR-A-CRIATURA`: Abre el modal reactivo de equipo con vista previa de incremento de HP (`INV-03`) y animación `anim-restauracion-salud`.
  - `BOTON-USO-EN-COMBATE`: Notifica al explorador que los talismanes de captura solo se aplican durante los encuentros tácticos de combate.
  - `boton-ir-bazar` / `boton-ir-inventario` / `boton-ir-asentamiento`: Enlaces accesibles mediante `<Button asChild>`.

---

## 8. PantallaCuracion
- **Módulos cubiertos:** `M-CUR` (Curación y Santuario).
- **Propósito:** Restaurar la vitalidad del equipo activo y revivir compañeros caídos en centros de servicio seguros.

```text
+-----------------------------------------------------------------------+
| [img-paisaje-villa-serena .pixelated opacity-40]                      |
| [SANTUARIO ANCESTRAL]                             [SERVICIO GRATUITO] |
|                                                                       |
|                       SANTUARIO DE CURACIÓN                           |
| "Las aguas místicas del manantial sagrado en Villa Serena restauran   |
| la vitalidad, alivian la fatiga y reviven a las criaturas caídas."    |
+-----------------------------------------------------------------------+
| TOTAL: 3/6 | PLENA SALUD: 1 | HERIDAS: 1 | CAÍDAS: 1 | DÉFICIT: +51 HP|
+-----------------------------------------------------------------------+
| [RESTAURAR TODO EL EQUIPO]                     [Volver al Asentamiento|
| (aria-busy / CANALIZANDO BENDICIÓN...)                                |
+-----------------------------------------------------------------------+
| DESGLOSE TÁCTICO DEL EQUIPO:                                          |
|                                                                       |
| +-----------------------------------+ +-------------------------------+ |
| | [img] Lobo Alfa           [LÍDER] | | [img] Oso Pardo               | |
| | Nv. 3 • Posición #1     [HERIDA]  | | Nv. 2 • Posición #2 [CAÍDA]   | |
| | Vitalidad: 12/30 HP (40%)         | | Vitalidad: 0/35 HP (0%)       | |
| | [====------]        (+18 HP ^)    | | [----------] (¡REVIVIDA!+35HP^| |
| +-----------------------------------+ +-------------------------------+ |
| +-----------------------------------+                                 |
| | [img] Pico de Hacha               |                                 |
| | Nv. 1 • Posición #3 [PLENA SALUD] |                                 |
| | Vitalidad: 19/19 HP (100%)        |                                 |
| | [==========]                      |                                 |
| +-----------------------------------+                                 |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `RESTAURAR TODO EL EQUIPO`: Dispara `POST /api/curacion/restaurar`; previene doble clic con `aria-busy` y estado `CANALIZANDO BENDICIÓN...`, activa secuencia cinemática esmeralda (`anim-curacion`), despliega cifras flotantes `+XX HP` / `¡REVIVIDA! +XX HP` (`anim-curacion-flotante`) y reproduce fanfarria de 8-bit sintetizada en Web Audio (`santuario`).
  - `Volver al Asentamiento`: Navegación directa con `useNavigate("/hub")` sin anidar controles interactivos.

---

## 9. PantallaCatalogo y Modal de Inspección Táctica
- **Módulos cubiertos:** `M-CRI` (Criaturas).
- **Propósito:** Compendio biológico de las 30 especies del juego sin ráfagas N+1, clasificación de arquetipos, afinidad elemental retro, consagración de criaturas legendarias con corona dorada y modal de inspección con 4 slots tácticos.

```text
+-----------------------------------------------------------------------+
| COMPENDIO DE CRIATURAS                 [ACTUALIZAR] [Asentamiento]    |
| [BookOpen] 30 ESPECIES SRD 5.2                                        |
+-----------------------------------------------------------------------+
| AVISTAMIENTO: Registradas: 30 | En Vista: 30 | Legendarias: 2 | Tipos:6|
+-----------------------------------------------------------------------+
| [Buscar especie por nombre...]                [Tipo: Todos los tipos v]|
| Arquetipo: [TODOS] [ATACANTE] [TANQUE] [VELOZ] [EQUILIBRADO] [ESPECIAL]|
|            [Crown LEGENDARIAS]                        [Limpiar filtros]|
+-----------------------------------------------------------------------+
| TARJETAS DE CRIATURA (Grid 3 columnas):                               |
| +-----------------------------------+ +-------------------------------+ |
| | Lobo Estepario  [Bestia][FÍSICO]  | | Behir del Abismo [Crown LEGEND] |
| | srd-2024_wolf           [VELOZ]   | | srd-2024_behir [SOMBRA][ATAC] | |
| | ================================= | | ============================= | |
| |       [ VITRINA SPRITE 128x128 ]  | |    [ VITRINA SPRITE DORADA ]  | |
| | ================================= | | ============================= | |
| | HP: 38 | ATQ: 44 | DEF: 38|VEL: 52| | HP: 94 | ATQ: 94 | DEF: 88|VEL:79| |
| | CR: 0.25      Captura: 88%        | | CR: 11.00     Captura: 15%    | |
| | [INSPECCIONAR FICHA]              | | [INSPECCIONAR FICHA]          | |
| +-----------------------------------+ +-------------------------------+ |
+-----------------------------------------------------------------------+
| MODAL DE INSPECCIÓN TÁCTICA (Dialog 8bitcn sellado max-h-[85vh]):     |
| +-------------------------------------------------------------------+ |
| | [ VITRINA HEROICA SPRITE 112x112 pixelated ]  [Crown LEGENDARIO]  | |
| | Behir del Abismo · CR: 11.00 · Tasa Captura: 15%                  | |
| | srd-2024_behir · [Monstruosidad] [Sombra] [ATACANTE]              | |
| | Lore: Serpentina criatura colosal que domina las profundidades.   | |
| | HP Base:   94 [=========--]  | Ataque Base: 94 [=========--]      | |
| | Def Base:  88 [========---]  | Vel Base:    79 [=======----]      | |
| | Movimientos Tácticos (4 Slots Canónicos):                         | |
| | - M1 Descarga Eléctrica (Ataque elemental · Pot. 20 · PARALISIS)  | |
| | - M2 Mordedura Titánica (Ataque melé · Pot. 24 · CRITICO)         | |
| | - M3 Constricción Relámpago (Control · Pot. 22 · ATURDIMIENTO)    | |
| | - M4 Relámpago del Abismo (Furia · Pot. 38 · SOBRECARGA_LEGEND)   | |
| | [Cerrar Ficha Táctica]                                            | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `campo-buscar-especie`, `selector-tipo`, botones de arquetipo y filtro `LEGENDARIAS`: Filtrado instantáneo en cliente.
  - `INSPECCIONAR FICHA`: Abre modal retro sellado (`w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none`) con lore, barras comparativas sobre 100, badges de afinidad elemental y lista completa de los 4 movimientos tácticos con slots M1..M4.
  - `ACTUALIZAR`: Recarga el compendio en una única petición O(1) con hardening `aria-busy`.
  - `Asentamiento`: Navegación con `useNavigate("/hub")`.

---

## 10. PantallaHistorial
- **Módulos cubiertos:** `M-HIS` (Historial).
- **Propósito:** Bitácora transversal categorizada por iconografía Lucide SVG y filtros rápidos.

```text
+-----------------------------------------------------------------------+
| BITÁCORA DE EXPEDICIONES               [ACTUALIZAR] [Asentamiento]    |
| [BookOpen] 45 CRÓNICAS REGISTRADAS                                    |
+-----------------------------------------------------------------------+
| FILTROS RÁPIDOS POR CATEGORÍA:                                        |
| [TODOS (45)] [COMBATE (20)] [CAPTURA (8)] [EXPLORACIÓN (10)]          |
| [TIENDA (5)] [CURACIÓN (2)]                                           |
| [Buscar crónica por palabra clave...]              [Limpiar filtros]  |
+-----------------------------------------------------------------------+
| CRÓNICAS CRONOLÓGICAS (Estilo retro):                                 |
| +-------------------------------------------------------------------+ |
| | [12:45 | 16/10] [Swords COMBATE]                                  | |
| | Victoria frente a Pico de Hacha en Praderas del Amanecer (+45 XP) | |
| +-------------------------------------------------------------------+ |
| | [12:42 | 16/10] [Sparkles CAPTURA]                                | |
| | Capturaste un Lobo Gris con Talismán Básico (Nv. 1)                | |
| +-------------------------------------------------------------------+ |
| | [12:30 | 16/10] [ShoppingBag TIENDA]                              | |
| | Compraste Poción de Curación Mayor x5 en Puesto Ribereño (-200 O) | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - Botones de categoría: Filtro instantáneo por `COMBATE`, `CAPTURA`, `EXPLORACIÓN`, `TIENDA` y `CURACIÓN`.
  - `Limpiar filtros`: Restablece categoría y buscador a sus valores por defecto.
  - `ACTUALIZAR`: Refresca la bitácora con protección `aria-busy`.
  - `Asentamiento`: Retorna al Hub mediante `useNavigate("/hub")`.

---

## 11. PantallaCreditos (Salón de la Fama 16-bit)
- **Módulos cubiertos:** Requisito legal y académico (Anexo A.4).
- **Propósito:** Salón de la Fama retro 16-bit, homenaje académico al Ingeniero Claudio y atribución obligatoria de Open5e, SRD 5.2 y 8bitcn/ui.

```text
+-----------------------------------------------------------------------+
| [Crown SALÓN DE LA FAMA] [Trophy ISC-305 · III PAC 2026]              |
| AETHELGARD: CRÉDITOS Y HONOR           [CELEBRAR FANFARRIA]           |
|                                        [boton-volver-inicio-creditos] |
| Bestiario Victorioso: [Lobo] [Grifo] [Quimera] [Hidra]                |
+-----------------------------------------------------------------------+
| [GraduationCap] HOMENAJE ACADÉMICO — INGENIERO CLAUDIO                 |
| Cátedra de Programación Web y Arquitectura de Sistemas de Información |
| Reconocimiento al rigor metodológico, erradicación de N+1,             |
| validación en servidor y trazabilidad en ISC-305.                     |
+-----------------------------------------------------------------------+
| [Code2] EQUIPO DE DESARROLLO Y ARQUITECTURA FULL-STACK (FASE 10 · AV5)|
| React 19 + Tailwind CSS v4 + NestJS 11 + Prisma + PostgreSQL          |
| Salvaguarda de invariantes estocásticas y seguridad S-1 a S-7.        |
+-----------------------------------------------------------------------+
| [BookOpen] CATÁLOGO DE CRIATURAS: OPEN5E Y SRD 5.2 (CC BY 4.0)        |
| Atribución literal obligatoria a Wizards of the Coast LLC.            |
+-----------------------------------------------------------------------+
| [Sparkles] SISTEMA DE DISEÑO 8BITCN/UI (MIT) Y WEB AUDIO API          |
| Licencia MIT completa y motor nativo de síntesis 8-bit.               |
|                                        [Regresar al Asentamiento]     |
+-----------------------------------------------------------------------+
```

- **Elementos interactivos y navegación:**
  - `CELEBRAR FANFARRIA`: Dispara síntesis Web Audio retro (`assets.ts`).
  - `boton-volver-inicio-creditos` / `Regresar al Asentamiento`: Retorna a `PantallaHubUbicacion` con sonido de victoria.
