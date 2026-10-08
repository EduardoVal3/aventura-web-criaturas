# Informe Técnico - Fase 3: Prototipo Navegable Completo (Avance 2, Parte 2)

Este documento corresponde al capítulo de la **Fase 3 (Prototipo Navegable Completo)** del Informe Técnico del Proyecto Integrador ISC-305. Registra la implementación de las 13 pantallas funcionales del juego en `apps/web`, el flujo interactivo integral sin recargas de página, la validación estricta en el cliente con React Hook Form y Zod, la integración de datos de Open5e (`srd-2024`), y el cumplimiento de los criterios formales para el cierre del **Avance 2** (`avance-2`).

---

## 1. Introducción y objetivos del prototipo

**Objetivo general:** Consolidar en `apps/web` el prototipo navegable completo de Aethelgard conectando la totalidad de vistas y servicios a la interfaz `ApiJuego` en modo simulado, validando todas las entradas de usuario en el cliente, integrando datos reales de especies desde Open5e y aplicando el sistema retro de 8bitcn/ui sin cálculos de combate en la presentación.

**Hitos y requisitos cubiertos:**
- `AV2`: Segundo avance de evaluación formal del proyecto integrador, que abarca la arquitectura front-end y el prototipo interactivo navegable.
- `FLUJO`: Ciclo completo de navegación entre todas las pantallas del sistema definido en `docs/diagramas/flujo-pantallas.mmd`.
- `T-4`: Desarrollo de vistas interactivas completas para el usuario final sin placeholders ni pantallas pendientes.
- `T-7`: Validación estricta y accesible en el navegador utilizando esquemas tipados con `zod` y `react-hook-form`.
- `EXT`: Integración con la API externa Open5e mediante consulta al documento `srd-2024` y respaldo local estructurado en `apps/web/src/api/datos-simulados/open5e-muestras.json`.
- `ARQ`: Aislamiento arquitectónico estricto donde la interfaz de usuario actúa como consumidor puro de `ApiJuego` sin calcular daño, salud ni fórmulas probabilísticas.

---

## 2. Mapa de pantallas y navegación

El prototipo implementa de forma navegable los 13 módulos del sistema a través de rutas declarativas en React Router (modo biblioteca). Todas las rutas comparten el encabezado retro y el pie legal provistos por `LayoutPrincipal`:

| # | Ruta URL | Pantalla | Módulos asociados | Propósito funcional en el juego |
| - | --- | --- | --- | --- |
| 1 | `/ingreso` | `PantallaIngreso` | `M-USR` | Autenticación con correo y contraseña, validación Zod y redirección inteligente según posesión de explorador. |
| 2 | `/registro` | `PantallaRegistro` | `M-USR` | Alta de cuenta con requisitos de formato (longitud, caracteres especiales) y transición a creación de explorador. |
| 3 | `/crear-personaje` | `PantallaCrearPersonaje` | `M-PJ` | Definición del nombre del aventurero y elección interactiva entre las 3 criaturas iniciales (`lobo-gris`, `pico-de-hacha`, `arana-lobo-gigante`). |
| 4 | `/hub` | `PantallaHubUbicacion` | `M-WLD`, `M-PJ` | Centro neurálgico del asentamiento (`Villa Serena`), saldo en monedas, acceso a servicios y selección de rutas de viaje (con bloqueo visual). |
| 5 | `/exploracion` | `PantallaExploracion` | `M-EXP` | Expedición por zonas silvestres con barra retro de progreso, bitácora de eventos y activación de encuentros hostiles vía modal. |
| 6 | `/combate` | `PantallaCombate` | `M-ENC`, `M-BAT`, `M-CAP` | Enfrentamiento por turnos: visualización de vida del rival (`EnemyHealthDisplay`), salud del aliado (`HealthBar`), experiencia (`XpBar`), acciones de atacar, capturar y huir. |
| 7 | `/equipo` | `PantallaEquipo` | `M-EQP` | Gestión de los hasta 6 miembros activos, estadísticas de combate, barras de vida y transferencia directa hacia el almacén. |
| 8 | `/almacen` | `PantallaAlmacen` | `M-ALM` | Depósito y reserva de criaturas capturadas, con control visual del cupo máximo de 6 criaturas en el equipo activo. |
| 9 | `/inventario` | `PantallaInventario` | `M-INV` | Tabla retro de objetos y talismanes, saldo en monedas y modal para aplicar pociones curativas sobre miembros heridos. |
| 10 | `/tienda` | `PantallaTienda` | `M-ECO` | Bazar de provisiones según decisión `D-03`, selector interactivo de cantidades, cálculo dinámico de costo y validación de saldo. |
| 11 | `/curacion` | `PantallaCuracion` | `M-PRG` | Santuario de salud con servicio gratuito de restauración total para todo el equipo y confirmación con notificación animada. |
| 12 | `/catalogo` | `PantallaCatalogo` | `M-CAT`, `EXT` | Compendio de especies biológicas con datos de Open5e (`srd-2024`), filtros por tipo (`beast`, `monstrosity`, `undead`) y atribución CC BY 4.0. |
| 13 | `/historial` | `PantallaHistorial` | `M-PRG` | Bitácora cronológica en tabla retro con marcas de tiempo y etiquetas de victorias, capturas y compras. |
| - | `/kit-ui` | `PaginaKitUi` | `X-UI` | Muestrario de los componentes retro de `8bitcn/ui` y paleta de colores. |
| - | `/creditos` | `PaginaCreditos` | `M-INF` | Diagnóstico de salud de la API (`GET /api/salud`), licencias y créditos legales. |

---

## 3. Validación en cliente con React Hook Form y Zod

Siguiendo el requisito `T-7`, se implementó una capa de validación temprana en el cliente mediante esquemas Zod en `apps/web/src/lib/esquemas-auth.ts`:

1. **Esquema de registro (`esquemaRegistro`):**
   - `nombreUsuario`: Mínimo 3 caracteres, restringido a caracteres alfanuméricos y guión bajo (`/^[a-zA-Z0-9_]+$/`).
   - `correo`: Formato de correo electrónico válido verificado mediante expresión regular estándar de Zod.
   - `clave`: Mínimo 8 caracteres, exigiendo obligatoriamente al menos un dígito numérico (`/\d/`) y un símbolo o carácter especial (`/[^a-zA-Z0-9]/`).
2. **Esquema de ingreso (`esquemaLogin`):**
   - `correo`: Correo con formato válido.
   - `clave`: Contraseña no vacía (mínimo 1 carácter).
3. **Esquema de creación de personaje (`esquemaCrearPersonaje`):**
   - `nombre`: Cadena recortada (`trim()`) de mínimo 3 caracteres, impidiendo nombres conformados únicamente por espacios.
   - `especieInicialSlug`: Enum restringido estrictamente a `"lobo-gris"`, `"pico-de-hacha"` o `"arana-lobo-gigante"`.

**Beneficios arquitectónicos:**
- **Prevención de peticiones inválidas:** Se previene el envío de cargas útiles malformadas hacia el servidor antes de tocar la red.
- **Accesibilidad y retroalimentación inmediata:** Mensajes de error en español vinculados mediante `aria-invalid` y `aria-describedby` para compatibilidad con lectores de pantalla.
- **Rendimiento óptimo:** `useWatch` conectado al controlador de React Hook Form garantiza compatibilidad con las optimizaciones del compilador de React 19.

---

## 4. Sistema de diseño y componentes 8bit

Se integraron de forma práctica los 17 componentes retro de `8bitcn/ui` según la especificación de `docs/decisiones.md`:

- **Barras de salud y experiencia:**
  - `HealthBar`: Empleado en `PantallaCombate`, `PantallaEquipo`, `PantallaAlmacen` y `PantallaCuracion` para reflejar el porcentaje de salud restante en color rojo retro.
  - `EnemyHealthDisplay`: Panel especializado en `PantallaCombate` que combina nombre, nivel y barra de vida del rival en estética clásica de 8 bits.
  - `XpBar`: Barra de experiencia dorada con animación de destello `¡SUBIÓ DE NIVEL!` al alcanzar el 100 % de experiencia tras una victoria.
- **Barras de avance:**
  - `Progress`: Visualiza el porcentaje de exploración completado en `PantallaExploracion` usando bloques cuadriculados pixelados.
- **Estructura y diálogo:**
  - `Card`, `Badge` y `Button`: Proporcionan el marco visual de tarjetas, distintivos de estado/tipo y botones táctiles con esquinas recortadas.
  - `Dialog` y `AlertDialog`: Modales retro para alertar de encuentros silvestres, confirmar la huida de combates y explicar los requisitos de rutas bloqueadas.
- **Tablas de datos:**
  - `Table`: Utilizado en `PantallaInventario` y `PantallaHistorial` con bordes pixelados, encabezados destacados y alineación numérica tipográfica.
- **Estados transitorios:**
  - `Spinner` y `Skeleton`: Indicadores retro que garantizan una experiencia fluida y sin saltos visuales durante cargas asíncronas simuladas.

---

## 5. Consumo de la API externa y datos simulados

En cumplimiento de los hitos `EXT` y el Anexo A.5 del plan de desarrollo:

1. **Consulta directa a Open5e (`srd-2024`):**
   - Se ejecutó consulta HTTP vía MCP a `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&name__icontains=wolf&fields=key,name,type,challenge_rating,hit_points,armor_class`.
   - Se validó la existencia de 331 criaturas bajo licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
2. **Muestra representativa almacenada:**
   - Se creó el archivo `apps/web/src/api/datos-simulados/open5e-muestras.json` conteniendo 3 criaturas representativas con su mapeo al castellano:
     - `srd-2024_wolf` $\rightarrow$ Lobo Gris (CR 0.25, HP 11/30 base, CA 12).
     - `srd-2024_axe-beak` $\rightarrow$ Pico de Hacha (CR 0.25, HP 19 base, CA 11).
     - `srd-2024_giant-wolf-spider` $\rightarrow$ Araña Lobo Gigante (CR 0.25, HP 11 base, CA 13).
3. **Estrategia de consumo desacoplada:**
   - La pantalla de catálogo consume `api.obtenerEspecies(tipo)` y `api.obtenerEspecie(slug)`.
   - En caso de indisponibilidad de la red o modo simulado, el cliente cuenta con la muestra local exacta, garantizando que el juego nunca se bloquee ni degrade su experiencia.

---

## 6. Aislamiento de la lógica de negocio (ARQ)

En cumplimiento de la regla R3 y el principio de separación de capas:

- **Ninguna pantalla del cliente calcula daño ni probabilidades:** En `PantallaCombate`, el daño del ataque, el contraataque rival y el resultado de la captura son devueltos íntegramente por `api.atacar` y `api.capturar`.
- **El cliente únicamente refleja estados devueltos:** La interfaz actualiza sus barras y textos a partir de `hpRestanteRival`, `hpRestanteAliado`, `estado === "VICTORIA"` o `destinoCaptura === "EQUIPO"`.
- **Economía e inventario protegidos:** Los cálculos de saldo restante y transferencias provienen del contrato `ApiJuego`, impidiendo inconsistencias en la capa visual.

---

## 7. Evidencias de responsividad y accesibilidad

Se verificó la navegabilidad y diseño responsivo en los tres anchos de pantalla estipulados:

1. **Móvil vertical (360 px):**
   - El contenedor principal y las tablas retro aplican scroll horizontal contenido (`overflow-x-auto`) sin provocar desbordamiento del documento global (`scrollWidth <= innerWidth`).
   - Los formularios de ingreso, registro y tarjetas de compra se apilan verticalmente con botones táctiles de al menos 44 px de altura.
2. **Tableta (768 px):**
   - Las cuadrículas de servicios y criaturas del equipo se adaptan a disposición de 2 columnas con márgenes equilibrados.
3. **Escritorio (1280 px):**
   - Distribución a 3 y 4 columnas en el bazar, equipo activo y catálogo de especies, manteniendo un ancho máximo centralizado de `6xl` (72 rem).
4. **Semántica y Glosario (R1):**
   - Todos los textos de botones, encabezados, alertas, modales y mensajes de notificación se encuentran redactados en español. Las únicas excepciones son los nombres de paquetes técnicos y la clave externa de Open5e según lo acordado en el glosario del §1.

---

## 8. Conclusión del Avance 2

Con la culminación de la Fase 3, el proyecto alcanza satisfactoriamente el hito **Avance 2**:
- Sistema de diseño completo en `apps/web`.
- 13 pantallas funcionales e interactivas integradas en el enrutador.
- Flujo de juego navegable de inicio a fin (`Ingreso` $\rightarrow$ `Hub` $\rightarrow$ `Exploración` $\rightarrow$ `Combate` $\rightarrow$ `Servicios` $\rightarrow$ `Catálogo`).
- Código tipado al 100 % en TypeScript sin dependencias no autorizadas y validado con 0 errores de compilación y linter.
