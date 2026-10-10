# 09. Experiencia de Usuario y Enriquecimiento Visual Retro (Fase 10)

Este documento consolida las auditorías heurísticas con la skill `impeccable`, la evolución interactiva de cada pantalla y el cumplimiento de las directrices estéticas establecidas en `docs/DESIGN.md` para *Aethelgard: Sendas y Criaturas*.

---

## 1. Sub-Fase 10a: Autenticación de Exploradores (`PantallaRegistro.tsx` y `PantallaIngreso.tsx`)

### 1.1 Diagnóstico Inicial y Auditoría Impeccable
Previo a la intervención, las vistas de autenticación cumplían con el contrato funcional pero presentaban vacíos de experiencia retro y ergonomía:
1. **Jerarquía y Escala Tipográfica:** Los títulos utilizaban tamaños genéricos que en la fuente `Press Start 2P` generaban desbordamientos en resoluciones móviles reducidas.
2. **Ergonomía de Entrada de Datos:** Ausencia de alternativa para alternar visibilidad de contraseña (`Eye` / `EyeOff`), dificultando la verificación de contraseñas complejas en teclados táctiles o retro.
3. **Validación Preventiva y Feedback:** Los criterios de contraseña (8 caracteres, número, símbolo especial) no ofrecían asistencia visual inmediata, dependiendo exclusivamente del error tras el envío.
4. **Respuesta Táctil y Auditiva:** No existía señalización sonora retro ni retroalimentación física distintiva en los estados de carga.
5. **Protección de Envío:** Existía deshabilitación básica pero sin declarar explícitamente el atributo `aria-busy` ni un estado de carga retro estilizado (`CREANDO CUENTA...`, `INICIANDO SESIÓN...`).

---

### 1.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Insignias Temáticas 8-Bit:** Inclusión de insignias pixeladas (`Badge`) con las leyendas `⚔️ GREMIO DE AVENTUREROS` en registro y `🔮 RETORNO AL REINO` en ingreso.
- **Tipografía Bimodal Equilibrada:**
  - Encabezados principales, insignias y botones renderizados con `Press Start 2P` (`.retro`), respetando una escala contenida (`text-base sm:text-lg`).
  - Etiquetas, mensajes de error y notas descriptivas renderizados con `Geist Sans` para garantizar lectura fluida sin fatiga visual.
- **Micro-inspección de Robustez de Contraseña:** Indicadores visuales en tiempo real para el cumplimiento de longitud mínima, presencia de dígito y carácter especial.

#### B. Componentes Táctiles 8bitcn/ui y Prevención de Doble Clic
- Integración coordinada de `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Input`, `Label`, `Button`, `Badge` y `Spinner`.
- **Prevención Estricta de Doble Clic (Harden):** Guarda inmediata ante mutaciones en vuelo (`if (enviando) return;`), desactivación de inputs, y botones con `disabled={enviando}`, `aria-busy={enviando}` y visualización de `Spinner` retro.
- **Visibilidad Alternable de Contraseña:** Controles accesibles con `aria-label` descriptivo para conmutar entre texto plano y máscara de caracteres con efectos de clic interactivos.

#### C. Integración Multimedia y Audio Retro Centralizado (`assets.ts`)
- Consumo centralizado de la función `reproducirSonido(nombre, volumen)` de `apps/web/src/lib/assets.ts`:
  - `click` (volumen 0.3 - 0.4) al presionar botones y alternar visibilidad.
  - `confirmar` (volumen 0.5) al completar con éxito el registro o inicio de sesión.
  - `error` (volumen 0.5) ante fallas de validación de la API o credenciales erróneas.
- **Sintetizador Web Audio Retro Nativo (Tolerancia a Fallos):** Se dotó a `apps/web/src/lib/assets.ts` de un sintetizador nativo 8-bit mediante ondas cuadradas (`square`) y de sierra (`sawtooth`), asegurando que todos los efectos acústicos funcionen inmediatamente en cualquier navegador sin depender de descargas externas de audio.

#### D. Accesibilidad y Contraste (WCAG AA)
- Todos los mensajes de error utilizan `role="alert"`, identificadores únicos enlazados con `aria-describedby` y el icono `AlertCircle`.
- Relación de contraste superior a 4.5:1 en todos los textos sobre fondos oscuros (`hsl(222, 47%, 7%)` a `hsl(220, 35%, 16%)`).

---

### 1.3 Verificación de Calidad y Cero Regresiones
- **Detector Impeccable:** Ejecutado mecánicamente con 0 defectos reportados (`[]`).
- **Linter Web (`oxlint`):** 0 errores.
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-auth.spec.ts`):** 3 pruebas aprobadas verificando esquemas de validación Zod y helpers de recursos multimedia.
- **Pruebas Backend y Seguridad (`pnpm --filter api test`):** 35 pruebas aprobadas, cubriendo salvaguardas S-1 a S-7 e invariantes del sistema sin regresiones.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa con TypeScript estricto y Vite.

---

## 2. Sub-Fase 10b: Creación de Explorador y Selección de Criatura (`PantallaCrearPersonaje.tsx`)

### 2.1 Diagnóstico Inicial y Auditoría Impeccable
La vista previa permitía el flujo básico pero presentaba carencias visuales y de interacción:
1. **Ausencia de Sprites y Representación Gráfica:** Las criaturas iniciales solo se listaban como texto plano sin renderizar su imagen pixel-art ni degradación a placeholders SVG.
2. **Estadísticas Incompletas y Poco Claras:** La velocidad (`VEL`) estaba ausente en el desglose y las estadísticas no contaban con barras visuales comparativas para entender las fortalezas relativas (defensa vs velocidad vs ataque).
3. **Feedback de Selección Débil:** La selección no ofrecía distinción de borde destacada, badge activo (`ELEGIDO`) ni elevación acentuada.
4. **Validación Reactiva:** La validación del nombre ocurría únicamente al someter el formulario, sin asistencia visual en tiempo real.
5. **Micro-interacciones y Audio Ausentes:** No existía retroalimentación sonora retro al seleccionar criaturas, confirmar creación ni ante errores.

---

### 2.2 Mejoras Implementadas

#### A. Identidad Retro y Tarjetas Interactivas de Criaturas (`docs/DESIGN.md`)
- **Visualizador Pixelado con Fallback SVG:** Sprites integrados con `obtenerImagenCriatura(slug)` y `onError={(e) => manejarErrorImagen(e, "criatura")}`, aplicando la clase `.pixelated` y sombra dinámica en la criatura activa.
- **Tarjetas 8-Bit Interactivas:** Cada criatura (`Lobo Gris`, `Pico de Hacha`, `Araña Lobo Gigante`) dispone de tarjeta con borde biselado, arquetipo de combate, insignia de estado y realce visual (`scale-[1.02]`, `border-primary`, `bg-primary/10`).
- **Desglose Gráfico de Atributos Base:** Integración de los 4 atributos esenciales (HP, ATQ, DEF, VEL) con badges numéricos codificados por color e indicadores de barra comparativa.

#### B. Componentes Táctiles 8bitcn/ui y Prevención de Mutaciones
- Controles construidos con `Card`, `Badge`, `Input`, `Label`, `Button` y `Spinner`.
- **Prevención Estricta de Doble Clic (Harden):** Guarda de seguridad `if (enviando) return;`, inputs deshabilitados durante el envío, formulario con `aria-busy={enviando}` y botón con estado retro de progreso (`INICIANDO AVENTURA...`).
- **Validación en Tiempo Real:** Configuración de `useForm` con modo `onChange` en Zod (`esquemaCrearPersonaje`) y mensajes de error accesibles (`AlertCircle`, `role="alert"`).

#### C. Integración Multimedia y Efectos Sonoros (`assets.ts`)
- Consumo centralizado de la API de audio:
  - `seleccionar` (volumen 0.35) al alternar entre las cartas de criatura inicial.
  - `click` (volumen 0.4) al presionar el botón de inicio de aventura.
  - `confirmar` (volumen 0.5) tras recibir confirmación exitosa de la API y sincronizar el estado de sesión.
  - `error` (volumen 0.5) ante fallas de validación o del servidor.

#### D. Sincronización Robusta con Backend y Sesión
- Conexión con `POST /personajes` vía `api.crearPersonaje(...)`.
- Actualización atómica del contexto de autenticación (`actualizarPersonajeActivo()`), con salvaguarda defensiva mediante `establecerPersonajeActivo(...)` para garantizar consistencia inmediata en la navegación hacia `/hub`.

---

### 2.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-crear-personaje.spec.ts`):** 3 pruebas nuevas cubriendo validaciones del esquema Zod, filtrado de espacios (`trim`), rechazo de slugs no autorizados y consistencia de atributos/sprites.
- **Suite Total Web (`pnpm --filter web test`):** 6 de 6 pruebas aprobadas (100% éxito).
- **Linter Web (`oxlint`):** 0 errores.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa en TypeScript estricto y Vite.
- **Suite Backend (`pnpm --filter api test`):** 35 de 35 pruebas aprobadas.

---

## 3. Sub-Fase 10c: Hub de Ubicación y Navegación del Mundo (`PantallaHubUbicacion.tsx`)

### 3.1 Diagnóstico Inicial y Auditoría Impeccable
La versión previa del Hub de Ubicación cumplía la funcionalidad básica pero presentaba limitaciones significativas de inmersión y ergonomía:
1. **Ausencia de Atmósfera Visual y Paisaje:** La localidad se representaba como una tarjeta genérica con fondo plano, desaprovechando los activos visuales de zonas y reduciendo la inmersión del explorador.
2. **Jerarquía Tipográfica Plana:** Títulos y textos descriptivos carecían de diferenciación entre la estética pixelada (`retro`) y la ergonomía de lectura (`font-sans`), generando saturación visual.
3. **Falta de Micro-interacción en Rutas de Viaje:** El desplazamiento entre zonas ocurría de forma inmediata al hacer clic, con riesgo de viajes accidentales y sin un modal retro accesible que confirmara el destino o detallara los requisitos de zonas bloqueadas.
4. **Respuesta Acústica Ausente:** La navegación entre servicios y la ejecución de viajes no emitían feedback auditivo sincronizado.

---

### 3.2 Mejoras Implementadas

#### A. Atmósfera Oscura Retro y Paisaje Panorámico (`docs/DESIGN.md` §2)
- **Hero de Asentamiento con Ilustración WebP y Fallback SVG:** Integración de la vista panorámica de la zona mediante `obtenerImagenZona(...)` y `sanitizarSlugZona(...)`, con degradado de fusión hacia la base Bastión (`#121927`) y fallback a `placeholder-zona.svg`.
- **Cero Emojis Unicode (Regla Estricta):** Erradicación total de emojis en badges, botones y textos, reemplazándolos por iconografía vectorial SVG de Lucide (`ShieldCheck`, `Skull`, `Coins`, `Users`, `Package`, `Store`, `Map`, `Compass`, `Lock`, `ArrowRight`, `LogOut`, `Loader2`).
- **Insignia de Seguridad de Zona:** Badge temático en la esquina del hero (`LOCALIDAD SEGURA` en verde esmeralda o `ZONA HOSTIL` en rojo alerta).

#### B. Panel Superior de Explorador y Cuadrícula de Servicios
- **Métricas Clave con Iconografía Temática:** Desglose del explorador en 4 tarjetas de datos:
  - Nombre del explorador (`Compass`).
  - Monedas acumuladas con icono `Coins` y color oro solar (`#f5b724`).
  - Equipo activo (`X / 6 aliados`) con icono `Users` en verde vital.
  - Criaturas en almacén con icono `Package`.
- **Cuadrícula Interactiva de 8 Servicios (`SERVICIOS_HUB`):**
  - Módulos para Exploración, Equipo Activo, Almacén, Inventario, Tienda/Bazar, Santuario de Salud, Compendio Open5e y Bitácora.
  - Efectos táctiles de hover (`scale-[1.02]`, borde cian `#14d1e8`, fondo panel `#1a2332`) y retroalimentación sonora `click`.
  - Indicador sutil de disponibilidad según los servicios declarados por la zona.

#### C. Rutas de Viaje y Modal de Confirmación `AlertDialog`
- **Tarjetas de Conexión:** Cada destino muestra nombre, nivel sugerido y badge de estado (`ACCESIBLE` vs `BLOQUEADA`).
- **Micro-interacción de Viaje Seguro:** Los destinos accesibles despliegan un diálogo modal `AlertDialog` retro que solicita confirmación del explorador antes de desplazarse, previniendo viajes no intencionados y mostrando el estado de carga `VIAJANDO...`.
- **Inspección de Rutas Restringidas (M-PRO):** Las zonas bloqueadas cuentan con diálogo explicativo detallando los requisitos de gremio o experiencia requeridos para su acceso.

#### D. Audio Retro Centralizado y Tolerancia a Fallos
- Integración de `reproducirSonido(...)` para eventos de interfaz:
  - Clic al interactuar con servicios y botones (`0.35`).
  - Confirmación al iniciar viaje hacia otra zona (`0.5`).
  - Señalización de error ante bloqueos o fallos de conexión (`0.5`).

---

### 3.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-hub-mundo.spec.ts`):** 4 pruebas nuevas verificando:
  1. Configuración, rutas e iconos de los 8 servicios del Hub.
  2. Lógica de habilitación de servicios según la localidad actual.
  3. Sanitización de nombres y resolución de paisajes WebP con degradación segura.
  4. Estructura y reglas de conexiones de viaje bloqueadas vs accesibles.
- **Suite Total Web (`pnpm --filter web test`):** 10 de 10 pruebas aprobadas (100% éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de TypeScript y empaquetado Vite exitoso.
- **Linter Web (`oxlint`):** 0 errores.
- **Suite Backend (`pnpm --filter api test`):** 35 de 35 pruebas aprobadas sin regresiones.
- **Validación Visual en Navegador (`browser_subagent`):** Flujo completo verificado en vivo sobre `/hub` con captura de pantalla y comprobación de modales, badges y servicios.

---

## 4. Sub-Fase 10d: Enriquecimiento de Exploración y Encuentros en Rutas (`PantallaExploracion.tsx`)

### 4.1 Diagnóstico Inicial y Auditoría Impeccable
La pantalla de exploración inicial requería elevar su nivel de inmersión y robustez técnica:
1. **Falta de Ambientación Visual de Ruta:** Se utilizaban tarjetas estándar sin renderizado del paisaje panorámico de la zona silvestre.
2. **Carencia de Presentación Cinemática de Criaturas:** Ante un encuentro hostil, el modal desplegaba únicamente texto plano sin el sprite pixel-art de la bestia rival ni el desglose táctico de sus estadísticas de combate.
3. **Bitácora Desestructurada:** El registro histórico se basaba en cadenas de texto genéricas sin marcas temporales, categorías de evento ni formato bimodal accesible.
4. **Ausencia de Señalización de Rutas Seguras:** Los asentamientos pacíficos no contaban con advertencia explícita sobre la imposibilidad de cazar dentro de villas seguras, arrojando excepciones en lugar de guiar al usuario hacia las salidas del Hub.

---

### 4.2 Mejoras Implementadas

#### A. Panel de Entorno y Paisaje Panorámico Retro (`docs/DESIGN.md` §2)
- **Hero Silvestre Panorámico:** Paisaje contextual de la ruta actual mediante `obtenerImagenZona(...)` con degradado oscuro de fondo Abismo (`#090d16`) y Bastión (`#121927`), asegurando contraste WCAG AAA.
- **Insignias Dinámicas sin Emojis:** Identificación inmediata de la ruta mediante iconos SVG de Lucide:
  - `ZONA HOSTIL` (`AlertTriangle`) con borde carmesí `#ef4444`.
  - `NV. SUGERIDO: X-Y` (`MapPin`) con acento cian `#14d1e8`.
  - `100% CARTOGRAFIADA` (`Sparkles`) en oro solar `#f5b724`.
  - Botón de retorno rápido hacia el asentamiento (`HUB`).

#### B. Medidor de Progreso y Control Táctil de Expedición
- **Barra de Progreso Segmentada Retro:** Utilización de `Progress` con canal empotrado oscuro `#090d16` y relleno dinámico en cian resonante `#14d1e8` o verde esmeralda `#22c55e` al completar el 100%.
- **Botón de Inmersión "Explorar Senda":** Botón de acción principal con tipografía `Press Start 2P`, micro-animación de pulsación física (`active:translate-y-1`), sombra retro ortogonal y prevención estricta de doble clic (`aria-busy`, deshabilitación inmediata y spinner retro `EXPLORANDO SENDA...`).
- **Manejo Preventivo de Localidades Pacíficas:** Banner informativo con `ShieldCheck` que explica que las localidades están protegidas y provee navegación directa hacia las rutas silvestres conectadas.

#### C. Presentación Cinemática de Criatura Rival (Modal `Dialog` 8-bit)
- **Ilustración Nítida de la Criatura:** Renderizado del sprite pixelado mediante `obtenerImagenCriatura(slug)` con clase `.pixelated` y fallback defensivo con `manejarErrorImagen(e, "criatura")`.
- **Ficha Táctica del Rival:** Despliegue del nombre en `Press Start 2P`, badge de nivel, barra de vitalidad porcentual y desglose de atributos base (**ATQ**, **DEF**, **VEL**) con chips numéricos monoespaciados.
- **Acciones Claras:** Botón destacado `INICIAR COMBATE` en carmesí retro y botón alternativo `RETIRARSE` para volver a la senda.

#### D. Modal de Botín y Reanudación Activa con Banner Persistente
- **Diálogo de Botín Descubierto:** Presentación enriquecida ante eventos de tipo `OBJETO`, desplegando monedas de oro solar (`Coins`) o el icono del ítem obtenido con su cantidad correspondiente.
- **Flujo de Reanudación y Banner Persistente de Rival Activo:** Si el usuario decide "Retirarse" del modal o si existía un combate en curso previo, la interfaz despliega un banner permanente de alerta táctica con los datos de la criatura rival y conmuta el botón principal de exploración a `RESOLVER COMBATE CON [RIVAL]` (con icono `Swords`). Esto elimina la necesidad de abandonar y reingresar a la pantalla y previene errores `409 Conflict` por reintentos de exploración indebidos.

#### E. Bitácora de Incursión Estructurada
- **Registro Cronológico Clasificado:** Entradas tipadas (`INICIO`, `PASO`, `ENCUENTRO`, `OBJETO`) con marcas horarias precisas (`HH:MM:SS`), tipografía legible en `font-sans` (Geist) e iconografía específica de Lucide (`Swords`, `Coins`, `Footprints`, `Compass`).
- **Cero Emojis Unicode:** Cumplimiento total de la directriz de interfaz retro sin glifos unicode no estilizados.

#### F. Audio Retro Centralizado y Web Audio API
- Efectos auditivos sincronizados: `paso` al avanzar por la senda, `alerta` ante detección de bestias hostiles, `botin` al obtener recompensas, `confirmar` al entrar a combate y `error` ante bloqueos.

#### G. Lógica de Progresión Desacoplada y Determinista (A-8 / S-6)
- **Corrección de Avance Prematuro:** El sorteo de un evento de `ENCUENTRO` preserva intacto el porcentaje de cartografía de la ruta silvestre en `exploracion.service.ts`.
- **Acreditación por Mérito Táctico:** El incremento de $+20\,\%$ hasta el tope de $100\,\%$ se acredita exclusivamente en el Back-End tras la resolución victoriosa del combate (`CombateService`) o mediante la captura exitosa de la criatura rival (`CapturaService`).

#### H. Resiliencia Responsive, Cero Overflow y Ergonomía en Modales (Auditoría Impeccable)
- **Hero Panorámico Desacoplado:** Se separó la ilustración visual panorámica superior de los bloques textuales descriptivos y metadatos inferiores, eliminando cualquier superposición o truncamiento tipográfico en anchos reducidos (`320px–425px`).
- **Sellado de Modales contra Overflow Horizontal:** El contenedor principal `DialogContent` aplica `w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-hidden p-0 flex flex-col`. Al contener los bordes decorativos de 8bitcn/ui (`-mx-1.5`) dentro de `overflow-hidden`, se extingue la aparición de barras de scroll horizontal no deseadas.
- **Scroll Vertical Aislado:** El contenido central del diálogo se confina a un sub-panel con `overflow-y-auto overflow-x-hidden flex-1 min-h-0 px-4 sm:px-6 py-2`, manteniendo el encabezado y el pie de acciones anclados y visibles sin recortes.
- **Acciones Tácticas Apiladas a Ancho Completo:** Los botones de decisión en el modal de encuentro (`INICIAR COMBATE` y `CERRAR FICHA`) se estructuran en disposición vertical (`flex flex-col gap-2.5 w-full`), garantizando que la tipografía monoespaciada ancha `Press Start 2P` respire con holgura sin desbordarse hacia la derecha en ningún breakpoint.
- **Sanitización Tipográfica 8-Bit:** El título de botín se normaliza a `¡BOTIN DESCUBIERTO!` para eliminar glifos rotos (`BOTiN`) causados por la ausencia de diacríticos mayúsculos en la fuente retro.

---

### 4.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-exploracion.spec.ts`):** 6 pruebas exhaustivas verificando:
  1. Estructura y contrato de `RespuestaExploracion` ante encuentros con criaturas.
  2. Manejo de recompensas de botín (monedas e ítems).
  3. Lógica de cálculo y límite persistente del 100% de cartografía.
  4. Diferenciación de expedición y niveles entre zonas seguras y hostiles.
  5. Formato de la bitácora de incursión y garantía de cero emojis unicode.
  6. Preservación del progreso ante encuentros hostiles en progreso.
- **Suite Total Web (`pnpm --filter web test`):** 16 de 16 pruebas aprobadas (100% éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de TypeScript y empaquetado Vite exitoso en 1.78s.
- **Auditoría Mecánica Impeccable (`detect.mjs`):** 0 hallazgos o defectos en `PantallaExploracion.tsx`.
- **Suite Backend (`pnpm --filter api test`):** 35 de 35 pruebas aprobadas.



