# Informe Técnico - Fase 3: Prototipo Navegable Completo (Avance 2, Parte 2)

Este documento corresponde al capítulo de la **Fase 3 (Prototipo Navegable Completo)** del Informe Técnico del Proyecto Integrador ISC-305. Registra la implementación de las 13 pantallas funcionales del juego en `apps/web`, el flujo interactivo integral sin recargas de página, la validación estricta en el cliente con React Hook Form y Zod, la integración de datos de Open5e (`srd-2024`), y el cumplimiento de los criterios formales para el cierre del **Avance 2** (`avance-2`).

---

## 1. Introducción y objetivos del prototipo

**Objetivo general:** Consolidar en `apps/web` las 13 pantallas funcionales de juego (+ `/kit-ui` y `/creditos`) validando todas las entradas de usuario en el cliente con React Hook Form + Zod, conectando la interfaz exclusivamente al contrato `ApiJuego` sin cálculos de combate en la presentación y aplicando el sistema retro `8bitcn/ui`.

> **Contexto histórico (`Fase 3` → `v1.0`):** Durante el cierre del Avance 2 (Fase 3), las vistas se validaron inicialmente contra un proveedor temporal en memoria (`apiSimulada.ts` y `open5e-muestras.json`). En la **Fase 8** dicha simulación fue eliminada por completo en favor de `apiHttp.ts` y PostgreSQL 17, y en la **Subfase 10j** las 3 especies iniciales se consolidaron en el Bestiario Canónico de 30 criaturas (`lobo-estepario`, `vibora-rocosa`, `cangrejo-abismal`).

**Hitos y requisitos cubiertos:**
- `AV2`: Segundo avance de evaluación formal del proyecto integrador, que abarca la arquitectura front-end y el prototipo interactivo navegable.
- `FLUJO`: Ciclo completo de navegación entre todas las pantallas del sistema definido en `docs/diagramas/flujo-pantallas.mmd`.
- `T-4`: Desarrollo de vistas interactivas completas para el usuario final.
- `T-7`: Validación estricta y accesible en el navegador utilizando esquemas tipados con `zod` y `react-hook-form`.
- `EXT`: Verificación temprana de la API externa Open5e (`srd-2024`), consolidada definitivamente en el servidor mediante `datos/open5e-srd-2024-seleccion.json` (30 especies) en Fase 5 y Subfase 10j.
- `ARQ`: Aislamiento arquitectónico estricto donde la interfaz de usuario actúa como consumidor puro de `ApiJuego` sin calcular daño, salud ni fórmulas probabilísticas.

---

## 2. Mapa de pantallas y navegación

El cliente implementa de forma navegable los 13 módulos funcionales obligatorios a través de **15 pantallas activas** declaradas en React Router (`apps/web/src/App.tsx`). Todas las rutas comparten el cascarón retro provisto por `LayoutPrincipal`:

| # | Ruta URL | Pantalla | Módulos asociados | Propósito funcional en el juego |
| - | --- | --- | --- | --- |
| 1 | `/ingreso` | `PantallaIngreso` | `M-USR` | Autenticación con correo y contraseña, validación Zod y redirección inteligente según posesión de explorador. |
| 2 | `/registro` | `PantallaRegistro` | `M-USR` | Alta de cuenta con requisitos de formato (longitud, caracteres especiales) y transición a creación de explorador. |
| 3 | `/crear-personaje` | `PantallaCrearPersonaje` | `M-PJ` | Definición del nombre del aventurero y elección interactiva entre las 3 criaturas iniciales canónicas (`lobo-estepario`, `vibora-rocosa`, `cangrejo-abismal`). |
| 4 | `/hub` | `PantallaHubUbicacion` | `M-MUN`, `M-PJ`, `M-PRO` | Centro neurálgico del asentamiento (`Villa Serena`), mapa interactivo Canvas/WebP, saldo en monedas, acceso a servicios y control de sendas desbloqueables. |
| 5 | `/exploracion` | `PantallaExploracion` | `M-EXP`, `M-ENC` | Expedición por zonas silvestres con barra retro de progreso cartográfico, bitácora de eventos y activación de encuentros hostiles vía modal. |
| 6 | `/combate` | `PantallaCombate` | `M-ENC`, `M-COM`, `M-CAP` | Enfrentamiento por turnos: vitalidad, experiencia (`XpBar`), matriz elemental 6×6, 51 efectos, medidor de Resonancia (M4), captura y huida. |
| 7 | `/equipo` | `PantallaEquipo` | `M-EQU` | Gestión de los hasta 6 miembros activos, estadísticas de combate, reordenamiento del líder y transferencia directa hacia el almacén. |
| 8 | `/almacen` | `PantallaAlmacen` | `M-EQU` | Depósito y reserva de criaturas capturadas, con intercambio atómico y control del cupo máximo de 6 criaturas en el equipo activo. |
| 9 | `/inventario` | `PantallaInventario` | `M-INV` | Bolsa de 20 ranuras de objetos y talismanes, saldo en monedas y modal para aplicar pociones curativas sobre miembros heridos (`INV-03`). |
| 10 | `/tienda` | `PantallaTienda` | `M-INV` | Bazar de provisiones según decisión `D-03`, selector interactivo por lotes (`x1`, `x5`, `x10`), cálculo dinámico de costo y validación en servidor (`S-6`). |
| 11 | `/curacion` | `PantallaCuracion` | `M-CUR` | Santuario de salud con servicio gratuito de restauración total y resurrección para todo el equipo con confirmación animada. |
| 12 | `/catalogo` | `PantallaCatalogo` | `M-CRI`, `EXT` | Compendio de las 30 especies canónicas (derivadas de Open5e `srd-2024`), filtros por tipo/zona/rareza y atribución CC BY 4.0. |
| 13 | `/historial` | `PantallaHistorial` | `M-HIS` | Bitácora cronológica categorizada con búsqueda textual y registro de victorias, capturas, exploraciones, curaciones y compras. |
| 14 | `/kit-ui` | `PaginaKitUi` | `X-UI` | Muestrario interactivo de los 17 componentes retro de `8bitcn/ui` y paleta de colores. |
| 15 | `/creditos` | `PaginaCreditos` | `PI` | Salón de la Fama, licencias MIT (`8bitcn/ui`), atribución CC BY 4.0 (`Open5e SRD 5.2`) y arquitectura del proyecto. |

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
   - `especieInicialSlug`: Enum restringido estrictamente a `"lobo-estepario"`, `"vibora-rocosa"` o `"cangrejo-abismal"` *(en el prototipo inicial de Fase 3 se emplearon temporalmente `lobo-gris`, `pico-de-hacha` y `arana-lobo-gigante`, actualizados al bestiario canónico en Subfase 10j)*.

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
  - `Spinner` y `Skeleton`: Indicadores retro que garantizan una experiencia fluida y sin saltos visuales durante cargas asíncronas.

---

## 5. Consumo de la API externa (Evolución Fase 3 → Fase 8)

En cumplimiento de los hitos `EXT` y el Anexo A.5 del plan de desarrollo:

1. **Consulta directa a Open5e (`srd-2024`, verificación temprana en Fase 3):**
   - Se ejecutó consulta HTTP vía MCP a `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&name__icontains=wolf&fields=key,name,type,challenge_rating,hit_points,armor_class`.
   - Se validó la existencia de 331 criaturas bajo licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
2. **Muestra temporal de prototipo (histórico de Fase 3 — retirada en Fase 8):**
   - Durante el prototipo de Fase 3 se creó temporalmente `apps/web/src/api/datos-simulados/open5e-muestras.json` con 3 muestras iniciales para validar el catálogo sin servidor. Al integrarse el Back-End en la Fase 8, toda la carpeta `datos-simulados/` y `apiSimulada.ts` fueron eliminadas del repositorio.
3. **Estrategia definitiva en `v1.0`:**
   - La pantalla de catálogo (`PantallaCatalogo.tsx`) consume exclusivamente `api.obtenerEspecies(tipo)` y `api.obtenerEspecie(slug)` contra PostgreSQL vía `apiHttp.ts`. El respaldo estático oficial de las **30 especies SRD 5.2** reside en el servidor en `datos/open5e-srd-2024-seleccion.json` (ver [07-integracion-externa.md](07-integracion-externa.md)).

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
