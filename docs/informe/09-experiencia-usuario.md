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
- **Sello contra Desbordamiento y Optimización Tipográfica:**
  - `AlertDialogContent` configurado con ancho responsivo prioritario (`w-[calc(100vw-2rem)] sm:max-w-md! max-w-md!`) y `overflow-hidden`.
  - Disposición adaptativa en `AlertDialogFooter` (`flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 w-full`), apilando botones en pantallas estrechas y alineando a la derecha en escritorio sin desbordes.
  - Corrección de la etiqueta de cancelación a `PERMANECER`, evitando glifos no soportados (como la `Í` acentuada) en la fuente 8-bit `Press Start 2P`.

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

#### H. Resiliencia Responsive, Cero Overflow y Visibilidad Total de Ficha (Auditoría Impeccable)
- **Hero Panorámico Desacoplado:** Se separó la ilustración visual panorámica superior de los bloques textuales descriptivos y metadatos inferiores, eliminando cualquier superposición o truncamiento tipográfico en anchos reducidos (`320px–425px`).
- **Sellado de Modales contra Overflow Horizontal:** El contenedor principal `DialogContent` aplica `!flex flex-col w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] !p-0 !gap-0 overflow-hidden`. Al contener los bordes decorativos de 8bitcn/ui (`-mx-1.5`) dentro de `overflow-hidden`, se extingue la aparición de barras de scroll horizontal no deseadas.
- **Scroll Vertical Interno con Anclaje Fijo:** El contenido central del diálogo se confina a un sub-panel con `flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-5 py-2.5`, mientras que el encabezado y el pie de acciones permanecen fijos con `shrink-0`.
- **Eliminación de Conflictos de Shadcn (`flex-col-reverse`):** Se sustituyó el componente `DialogFooter` por un contenedor flex directo `shrink-0` con `flex flex-col gap-2 w-full`, erradicando la inversión de botones provocada por las clases por defecto de shadcn y asegurando que `INICIAR COMBATE` (primario) y `CERRAR FICHA` (secundario) mantengan su orden natural y 100% de visibilidad en todo momento.
- **Entrega Incondicional de Estadísticas Tácticas:** Se extendió el endpoint `GET /api/encuentros/activo` para retornar `ataque`, `defensa` y `velocidad` de la criatura rival, eliminando la pérdida de atributos tácticos al reanudar sesiones y garantizando el despliegue del panel de 3 columnas (ATQ / DEF / VEL) con salvaguardas defensivas.
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

---

## 5. Sub-Fase 10e: Combate Táctico y Captura de Criaturas (`PantallaCombate.tsx`)

### 5.1 Diagnóstico Inicial y Auditoría Impeccable
La versión preliminar del sistema de combate presentaba serias debilidades de experiencia, lógica de progresión y fidelidad visual:
1. **Disposición Espacial Plana y Sin Profundidad:** El combate se mostraba mediante dos tarjetas estáticas colocadas una al lado de la otra, careciendo de la emoción y perspectiva clásica de los RPG por turnos de 16-bit.
2. **Reanudación Débil de Encuentros Activos:** Al recargar la pantalla o regresar a `/combate`, el turno se reiniciaba arbitrariamente en 1, no se proveían movimientos y la bitácora anterior se perdía.
3. **Botonera Táctica Rudimentaria:** Solo existían acciones básicas sin opciones para seleccionar movimientos específicos, consumir pociones de vitalidad en combate, relevar el liderazgo de criaturas o seleccionar talismanes específicos de captura.
4. **Cálculo de Progresión Incoherente (Riesgo de Invariante §2.4):** Existía riesgo de duplicidad de fórmulas matemáticas de nivel y experiencia en el front-end, violando la regla de servidor autoritativo (A-8).
5. **Desbordamientos Horizontales en Modales:** Los modales de resolución (Victoria, Captura y Derrota) causaban scroll horizontal no deseado al apilar botones largos con tipografía pixelada `Press Start 2P`.
6. **Ausencia de Acústica Táctica:** Las acciones críticas (impacto de ataques y éxito de captura) carecían de efectos de sonido sintetizados.

---

### 5.2 Mejoras Implementadas

#### A. Arena de Batalla Diagonal 16-Bit y Perspectiva Retro (`docs/DESIGN.md` §2)
- **Disposición Espacial Clásica:** Rediseño completo de la arena con perspectiva diagonal:
  - *Rival Hostil:* Situado en el cuadrante superior derecho sobre un pedestal circular de sombra (`bg-black/30`), exhibiendo su sprite pixelado, barra de salud segmentada y badge de nivel.
  - *Criatura Aliada:* Posicionada en el primer plano inferior izquierdo encarando diagonalmente al oponente, con tarjeta de estado persistente, medidor numérico de vitalidad (HP actual / HP total) y barra de experiencia porcentual.
- **Micro-animaciones Físicas de Combate:**
  - `anim-sacudida` y `anim-parpadeo-dano` ante impactos físicos.
  - Indicadores numéricos de daño flotante con código de color dinámico (carmesí para daño recibido, esmeralda para curación).
  - Secuencia de incertidumbre en captura (`anim-captura-incertidumbre`) con balanceo de talismán antes de revelar el veredicto del servidor.

#### B. Panel Táctil Extendido de 5 Comandos RPG y Prevención de Doble Acción (Hardening S-5)
- **Comandos Tácticos Accesibles:**
  1. *Atacar:* Selector interactivo de movimientos con indicación de poder base y tipo de ataque.
  2. *Usar Objeto:* Modal retro con filtrado exclusivo de ítems curativos del inventario, restaurando vitalidad con animación esmeralda y feedback flotante inmediato.
  3. *Cambiar Criatura:* Selector táctico de miembros del equipo con HP disponible y XP individual para relevar el liderazgo de combate mediante `PATCH /equipo/orden`.
  4. *Capturar:* Selector interactivo de talismanes disponibles con animación de incertidumbre y balanceo antes de revelar éxito o contraataque.
  5. *Huir:* Diálogo modal retro de confirmación con probabilidad probabilística acotada. Ante fallo en huir, el contraataque rival se anima y refleja inmediatamente en la barra de salud sin requerir recargar la página.
- **Hardening contra Acciones Dobles (S-5):**
  - Guarda reactiva de cadencia visual (~800 ms) entre turnos.
  - Botones con `disabled={enAccion}`, `aria-busy={enAccion}` y spinners retro que imposibilitan enviar paquetes concurrentes fuera de turno al servidor.

#### C. Reanudación Fiel de Encuentros y Preservación de Estado
- **Enriquecimiento del Backend (`GET /encuentros/activo`):**
  - Devuelve la especie aliada con sus movimientos reales registrados en catálogo.
  - Preserva el turno cronológico real alcanzado.
  - Reconstruye la bitácora cronológica histórica completa desde los registros de combate en base de datos PostgreSQL, garantizando continuidad ininterrumpida ante recargas de página o reconexiones.

#### D. Centralización Absoluta de Progresión en el Servidor (A-8 / S-6 / §2.4)
- **Cálculo Determinista de Experiencia:** Todo cálculo de puntos de experiencia, nivel, umbral de subida y porcentaje de barra se ejecuta exclusivamente en el servidor mediante `ProgresoService.calcularProgresoXp`.
- **Cliente Front-End Ligero:** La vista React actúa como cliente presentacional puro, consumiendo los campos `experiencia`, `porcentajeXp` y límites devueltos por la API sin formular cálculos locales de balance.

#### E. Sellado de Modales contra Desbordamiento Tipográfico (`Press Start 2P`)
- **Adaptación Responsiva sin Overflow:** Contenedor `DialogContent` y `AlertDialogContent` ajustados con `w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden`.
- **Apilado Vertical Inteligente:** Botones de acción en el pie de los modales estructurados con `flex flex-col gap-2.5 w-full`, eliminando colisiones horizontales y asegurando legibilidad total en resoluciones móviles (320px–425px).
- **Sanitización de Glifos:** Supresión de caracteres acentuados mayúsculos incompatibles en la tipografía pixelada.

#### F. Audio Retro Sintetizado Nativo Web Audio API
- Incorporación en `apps/web/src/lib/assets.ts` de sintetizadores nativos mediante osciladores Web Audio API:
  - `'golpe'`: Onda diente de sierra (`sawtooth`) con curva de caída de frecuencia percusiva.
  - `'captura'`: Arpegio ascendente de onda cuadrada (`square`) para fanfarria de domesticación exitosa.

---

### 5.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-combate.spec.ts`):** 4 pruebas unitarias exhaustivas validando:
  1. Contrato enriquecido de combate y reanudación fiel de encuentros.
  2. Lógica del panel táctico de 5 comandos.
  3. Respuestas de huida con contraataque inmediato.
  4. Síntesis acústica nativa para efectos de combate.
- **Suite Total Web (`pnpm --filter web test`):** 20 de 20 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Balance (`pnpm --filter api test`):** 36 de 36 pruebas aprobadas, incluyendo la prueba unitaria `apps/api/test/progreso-tienda.spec.ts` que valida el cálculo de progresión en servidor.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación limpia sin errores TypeScript en Vite.
- **Linter Web (`oxlint`):** 0 errores.

---

## 6. Sub-Fase 10f: Equipo Activo y Almacén (`PantallaEquipo.tsx` y `PantallaAlmacen.tsx`)

### 6.1 Diagnóstico Inicial y Auditoría Impeccable
Previa a la intervención, la gestión táctica de criaturas y la custodia en almacén presentaban debilidades arquitectónicas, de sincronización y de ergonomía visual:
1. **Inconsistencias en Servidor y Orden Táctico Indeterminado:** El endpoint `PATCH /api/equipo/orden` admitía permutaciones parciales y duplicadas. Dado que `CombateService` selecciona al combatiente líder según `ordenEquipo asc`, un reordenamiento corrupto dejaba indeterminado quién abría los combates.
2. **Condiciones de Carrera en la Regla A-6 y Equipo Mínimo:** Las transferencias leían el estado de la criatura y el total de integrantes fuera de transacciones serializadas, permitiendo que peticiones concurrentes (doble clic o sesiones simultáneas) desbordaran el límite de 6 criaturas o vaciaran completamente el equipo.
3. **Ausencia de Intercambio Atómico:** Cuando el equipo alcanzaba su capacidad máxima (6/6), el jugador debía salir a la pantalla de equipo, enviar una criatura al almacén y retornar a la pantalla de almacén para promover a la nueva criatura, creando ventanas de vulnerabilidad transitoria con 5 miembros y fricción innecesaria.
4. **Carencia de Estadísticas en Almacén:** `GET /api/almacen` omitía atributos esenciales (`ataque`, `defensa`, `velocidad`, `experiencia`, `porcentajeXp`), imposibilitando evaluar estratégicamente a qué combatiente incorporar.
5. **Falta de Exposición de la Regla de Localidad Segura:** La UI no informaba sobre la restricción territorial exigida por el servidor (`403 ACCION_NO_PERMITIDA`), ofreciendo controles que fallaban inesperadamente fuera de un asentamiento seguro.
6. **Ausencia de Identidad Visual Retro y Sprites:** Las criaturas carecían de sprites pixelados con respaldo; se empleaban tipografías sans genéricas y bordes redondeados (`rounded`) en tarjetas y estadísticas, en contravención con `docs/DESIGN.md`.
7. **Hardening Insuficiente y Desincronización Local:** La deshabilitación por doble clic era aislada por tarjeta, posibilitando disparos concurrentes entre miembros; tras transferencias se filtraba el arreglo local sin renumerar posiciones.
8. **Navegación Inaccesible:** Existía anidamiento no conforme de `<button>` dentro de elementos `<a>` (`<Link>`), generando paradas dobles de foco para lectores de pantalla y teclado.
9. **Fuga Crítica de Recursos Web Audio:** `sintetizarTonoRetro` en `apps/web/src/lib/assets.ts` instanciaba un `AudioContext` en cada emisión acústica sin cerrarlo al finalizar, provocando el enmudecimiento total del audio en el navegador tras múltiples interacciones.

---

### 6.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Tipografía Bimodal Estricta:** Encabezados (`h1`), insignias tácticas y botones de comando implementan `Press Start 2P` (`.retro`), respetando una escala visual contenida (`text-base sm:text-lg`). Textos complementarios, descripciones y apodos se canalizan mediante fuentes sans de alta legibilidad.
- **Insignia y Corona de Liderazgo:** La criatura en la primera posición (`orden === 1`) exhibe una insignia distintiva dorada `LÍDER` con el icono `Crown` y un borde reforzado `border-4 border-amber-500/80 bg-amber-500/5`, denotando inequívocamente quién abrirá la arena de combate.
- **Insignia y Salvaguarda de Estado Debilitada:** Los combatientes con `hpActual === 0` se marcan con la insignia destructiva `DEBILITADA`, inhabilitando su designación como líder con la advertencia contextual: *"El combate la omitirá hasta curarla."*
- **Visualización de Ranuras Libres:** La capacidad disponible del equipo se visualiza explícitamente mediante marcos rectangulares `border-2 border-dashed border-border/60` con la leyenda *"Ranura libre N de 6"*, permitiendo dimensionar el margen de reclutamiento disponible.
- **Geometría Retro 8-Bit:** Supresión radical de esquinas redondeadas (`rounded`), instaurando bordes ortogonales puros (`rounded-none`) y sprites de criatura con clase `.pixelated` y respaldo SVG transparente.

#### B. Componentes Táctiles 8bitcn/ui y Hardening
- **Bloqueo Global Reactivo contra Doble Clic:** Se sustituyó el flag local por el estado unificado `operacion: { tipo, criaturaId } | null`. Durante cualquier petición en vuelo, **todos** los botones de reordenamiento y transferencia se inhabilitan, asignando `aria-busy={true}`, spinners pixelados y la leyenda retro `PROCESANDO...`.
- **Modal de Intercambio Sellado contra Overflow:** Cuando el equipo está lleno (6/6), el botón de la criatura en almacén conmuta a `Intercambiar`, abriendo un diálogo retro (`Dialog` de 8bitcn/ui) adaptativo:
  - Contenedor confinado con `w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none`.
  - Desplazamiento vertical interno con `max-h-[55vh] overflow-y-auto` para seleccionar al compañero saliente mediante un grupo de radio accesible (`role="radio"`).
  - Pie apilado verticalmente (`flex-col gap-2 w-full`) con botones a ancho completo, suprimiendo desbordamientos horizontales en dispositivos móviles (320px–425px).
- **Navegación Accesible y Erradicación de Emojis Unicode:** Los enlaces de cabecera implementan `Button asChild` envolviendo a `Link` de `react-router`, eliminando advertencias de validación HTML. Cero emojis unicode presentes en las vistas, sustituidos por iconografía SVG de Lucide (`Crown`, `ChevronUp`, `ChevronDown`, `Archive`, `Repeat`, `ArrowUpFromLine`, `MapPinOff`, `Warehouse`, `Users`, `ArrowLeft`).

#### C. Integración Multimedia y Audio Retro Centralizado (`assets.ts`)
- **Erradicación de Fugas de `AudioContext`:** Inserción de la directiva `osc.onended = () => void ctx.close();` en `sintetizarTonoRetro`, asegurando la liberación inmediata del canal acústico tras reproducir cualquier efecto de sonido.
- **Sincronización Acústica Web Audio:**
  - `seleccionar`: Disparado al pulsar subir/bajar, seleccionar relevo o abrir el modal de intercambio.
  - `confirmar`: Emitido al consolidar satisfactoriamente el orden táctico o completar un intercambio atómico.
  - `exito`: Señal acústica tras transferencias exitosas hacia o desde el almacén.
  - `error`: Notificación sonora ante rechazos o fallas reportadas por el servidor.

#### D. Reglas de Servidor y Contratos
- **Validación Estricta de Permutación en `PATCH /api/equipo/orden`:** El servidor rechaza con `400 ORDEN_INVALIDO` cualquier payload incompleto, con identificadores duplicados, criaturas ajenas o índices discontinuos, garantizando una biyección matemática estricta sobre las criaturas del equipo.
- **Serialización Pesimista por Explorador:** Tanto `actualizarOrden` como `moverCriatura` ejecutan `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE` al inicio de su transacción interactiva en PostgreSQL, blindando las invariantes `A-6` (máximo 6 criaturas) y equipo mínimo ($\ge 1$ criatura) frente a concurrencia extrema.
- **Intercambio Atómico de Posición (`intercambiarConId`):** Permuta en una única transacción atómica el estado de ambas criaturas; la entrante hereda exactamente el `ordenEquipo` de la saliente, garantizando que si se releva al líder, la nueva criatura asume la jefatura de combate de inmediato sin alterar el conteo total.
- **Enriquecimiento del Contrato REST:** `GET /api/equipo` y `GET /api/almacen` entregan `limiteEquipo: 6`, `enLocalidadSegura: boolean` y `totalEnEquipo`, sirviendo como fuentes autoritativas de verdad para el cliente.
- *Observación fuera de alcance:* Se mantiene sin modificaciones la regla de combate documentada en la subfase 10e (S-5) donde el cambio de criatura mediante `PATCH /equipo/orden` no consume turno.

---

### 6.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-equipo-almacen.spec.ts`):** 10 pruebas unitarias exhaustivas validando:
  1. Pureza e inmutabilidad de la función de reordenamiento `moverEnLista`.
  2. Comportamiento ante índices fuera de rango o extremos.
  3. Contratos tipados de `RespuestaEquipo`, `RespuestaAlmacen` y `PeticionTransferirCriatura`.
  4. Cumplimiento de la regla R1 (0 emojis unicode detectados mecánicamente en `PantallaEquipo.tsx` y `PantallaAlmacen.tsx`).
- **Suite Total Web (`pnpm --filter web test`):** 30 de 30 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test`):** 47 de 47 pruebas aprobadas (100% éxito), incluyendo 9 nuevas pruebas en `apps/api/test/equipo.spec.ts` cubriendo permutaciones de orden, rechazo de duplicados, regla `A-6`, equipo mínimo, salvaguarda de localidad segura e intercambio atómico.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 1.34s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores.
- **Inspección Responsive:** Sin scroll horizontal en anchos reducidos (320px, 375px y 768px).

---

## 7. Sub-Fase 10g: Bolsa de Inventario y Bazar de Provisiones (`PantallaInventario.tsx` y `PantallaTienda.tsx`)

### 7.1 Diagnóstico Inicial y Auditoría Impeccable
Previa a la intervención de la Sub-Fase 10g, la gestión de objetos poseídos y el comercio de provisiones presentaban 14 deficiencias críticas a nivel de seguridad en el servidor, arquitectura de datos y ergonomía visual retro:
1. **Consumo Indiscriminado de Objetos no Curativos fuera de Combate:** `POST /api/inventario/usar` verificaba la existencia del objeto pero no su clasificación taxonómica (`objeto.tipo === 'CURACION'`), permitiendo consumir talismanes de captura fuera de combate sumando estadísticas erróneas.
2. **Desperdicio de Consumibles sobre Criaturas con Salud Plena:** Si una criatura aliada poseía `hpActual >= hpMaximo`, el servidor descontaba la poción del inventario y registraba curación nula (+0 HP), violando el principio de salvaguarda del jugador y la regla `INV-03`.
3. **Condición de Carrera (TOCTOU) en Curación y Comercio:** `InventarioService.usarObjeto` y `TiendaService.comprar` leían saldo y salud fuera de las transacciones interactivas, permitiendo que peticiones concurrentes por doble clic consumieran más unidades que las poseídas o duplicaran compras de lotes.
4. **Falta de Validación de Límites Superiores en DTOs y Precios:** `ComprarDto` carecía de cota superior (`@Max(99)`), y `TiendaService.comprar` no exigía `precioCompra > 0`, abriendo ventanas a transacciones con cantidades desproporcionadas o adquisición gratuita de objetos no comerciables.
5. **Catálogo de Tienda Hardcodeado en Cliente:** `PantallaTienda.tsx` definía un arreglo estático `ARTICULOS_TIENDA` en lugar de consumir `GET /api/tienda`, ignorando la disponibilidad del servicio `TIENDA` en la localidad actual y las existencias reales en bolsa (`cantidadEnInventario`).
6. **Respuestas Empobrecidas en API:** `GET /api/inventario` omitía `descripcion`, `efectoValor`, `precioCompra`, `capacidadMaxima`, `ranurasOcupadas` y `totalUnidades`, impidiendo desplegar medidores de carga.
7. **Discrepancia Documental y Canónica de Precios:** `docs/wireframes.md` y `docs/decisiones.md` citaban precios obsoletos (40/100 oro y 30/70 HP), desalineados con los valores canónicos sembrados en PostgreSQL (`seed.ts`: 30/80 oro y 20/50 HP).
8. **Selector de Cantidad Inflexible en Tienda:** La vista limitaba la selección de 1 a 10 unidades de 1 en 1, careciendo de selectores de lote rápido (`x1`, `x5`, `x10`) para expediciones ágiles.
9. **Carencia de Filtros por Categoría en Inventario:** `PantallaInventario.tsx` presentaba una tabla plana sin categorización (`TODOS`, `CURACION`, `CAPTURA`, `ESPECIAL`) ni desglose visual de ranuras.
10. **Desbordamiento Horizontal (Overflow) en 320 px:** La tabla ancha de inventario forzaba desplazamiento horizontal en dispositivos móviles compactos.
11. **Modal de Curación Frágil y poco Informativo:** No incluía vista previa de restauración (`+{efectoValor} HP`), cerraba prematuramente el diálogo tras usar una unidad aunque quedaran más pociones y no renderizaba barras reactivas de salud.
12. **Ausencia de Sprites Pixelados de Objetos y Criaturas:** Ninguna pantalla invocaba `obtenerImagenObjeto` ni `obtenerImagenCriatura` con clase `.pixelated` y fallback SVG.
13. **Inconsistencias de Estilo y Navegación:** Títulos con fuentes sans genéricas, bordes redondeados (`rounded`) prohibidos por `DESIGN.md` y anidamiento inválido `<Link><Button/></Link>`.
14. **Ausencia de Retroalimentación Acústica:** Cero invocaciones a `reproducirSonido` en compras y curaciones, y ausencia de síntesis Web Audio para tonos metálicos de monedas y arpegios curativos.

---

### 7.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Tipografía Bimodal Estricta:** Títulos principales de ambas pantallas (`Bazar de Provisiones` y `Bolsa e Inventario`) y encabezados modales renderizados con `Press Start 2P` (`.retro`), combinados con fuentes monospace (`font-mono`) para balances numéricos y sans de alta legibilidad para descripciones tácticas.
- **Sprites Pixelados de Objetos y Criaturas:** Cada tarjeta y diálogo despliega iconos pixelados de 64x64 o 56x56 con `obtenerImagenObjeto(codigo)` y `obtenerImagenCriatura(slug)`, clase obligatoria `.pixelated` y desacoplamiento ante fallos vía `manejarErrorImagen` con placeholders SVG seguros.
- **Medidor Visual de Ranuras y Capacidad de Carga:** Representación gráfica de la bolsa (20 ranuras estándar) mediante una barra de porcentaje ortogonal y una grilla compacta 8-bit de 20 cajitas de ranura, informando ranuras ocupadas y total de unidades.
- **Geometría Ortogonal Pura:** Erradicación total de esquinas redondeadas (`rounded-none` estricto en tarjetas, badges, botones y contenedores).

#### B. Componentes Táctiles 8bitcn/ui y Hardening
- **Selector Rápido de Lotes (`x1`, `x5`, `x10`):** Implementación de botones de aprovisionamiento inmediato en cada tarjeta del bazar y dentro del modal de confirmación, complementados con botones de ajuste fino `-` y `+` acotados entre 1 y 99 unidades.
- **Filtros Interactivos por Categoría:** Barra táctil accesible con `role="tablist"` en inventario (`Todos`, `Consumibles Curativos`, `Talismanes de Captura`, `Objetos Especiales`) con conteo dinámico de existencias y estados vacíos contextuales.
- **Modales Sellados contra Desbordamiento Horizontal:** Tanto el modal de confirmación de compra como el modal de curación táctica incorporan `DialogContent` confinado con `w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none`, scroll vertical interno acotado (`max-h-[50vh] overflow-y-auto`) y botoneras apiladas verticalmente a ancho completo (`flex-col gap-2 w-full`), garantizando cero overflow horizontal en viewports de 320 px.
- **Blindaje contra Doble Clic:** Protección reactiva durante peticiones en vuelo con deshabilitación de controles, `aria-busy="true"` y señalización retro `PROCESANDO...` con spinners 8-bit.
- **Navegación Accesible y Regla R1:** Uso de `Button asChild` envolviendo enlaces `Link`. Cero emojis unicode en toda la interfaz (inspección automatizada en CI/CD), sustituidos íntegramente por iconografía SVG de Lucide (`Coins`, `Package`, `Store`, `HeartPulse`, `Crosshair`, `Sparkles`, `Layers`, `Crown`, `MapPinOff`, `Minus`, `Plus`, `ShoppingCart`).

#### C. Multimedia y Audio Retro Centralizado (`assets.ts`)
- **Síntesis Acústica Web Audio para Monedas (`monedas` / `compra`):** Doble pulso metálico en onda cuadrada (`square`: 987.77 Hz a 1318.51 Hz con decaimiento exponencial en 0.22 s), activado al formalizar compras en el bazar.
- **Síntesis Acústica para Curación (`curar` / `pocion`):** Arpegio regenerativo ascendente en onda triangular suave (`triangle`: 523.25 Hz -> 659.25 Hz -> 783.99 Hz en 0.26 s), activado al aplicar consumibles sobre criaturas.
- **Efectos Táctiles Adicionales:** Señalización acústica `seleccionar` en cambios de filtro y selección de lotes, y `error` ante saldo insuficiente o acciones inválidas.

#### D. Reglas de Servidor, Seguridad S-4/S-6 y Transacciones
- **Catálogo Centralizado desde PostgreSQL (`GET /api/tienda`):** Eliminación del catálogo hardcodeado. El endpoint sirve `servicioDisponible` (según `ubicacionActual.servicios.includes('TIENDA')`), `saldoMonedas` y `cantidadEnInventario` de cada objeto para actualización inmediata en Front-End.
- **Cálculo Unilateral de Precios y Compra Atómica (`S-4`, `S-6`):** `TiendaService.comprar` calcula unilateralmente $\text{costoTotal} = \text{precioCompra} \times \text{cantidad}$ desde PostgreSQL. Rechaza campos inyectados (`whitelist: true`, `forbidNonWhitelisted: true`) y cantidades fuera del rango 1..99 (`@Max(99)` en `ComprarDto`).
- **Bloqueo Pesimista por Fila de Personaje (`FOR UPDATE`):** Tanto `TiendaService.comprar` como `InventarioService.usarObjeto` ejecutan `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE` al inicio de la transacción de Prisma, serializando estrictamente compras y consumos concurrentes.
- **Blindaje de Consumibles y Salvaguarda `INV-03`:** En `InventarioService.usarObjeto`:
  - Se valida estrictamente `objeto.tipo === 'CURACION'` (`400 OBJETO_NO_CONSUMIBLE`).
  - Se valida que la criatura aliada pertenezca al personaje y no posea salud llena (`400 SALUD_COMPLETA`), impidiendo desperdiciar pociones.
  - Se acota matemáticamente $\text{hpNuevo} = \min(\text{hpMaximo}, \text{hpPrevio} + \text{efectoValor})$ sin sobrecuración, descontando o eliminando el registro de inventario al agotarse el stock.

---

### 7.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-inventario-tienda.spec.ts`):** 8 pruebas unitarias exhaustivas validando:
  1. Inmutabilidad y filtrado correcto por categoría en `filtrarItemsPorCategoria`.
  2. Normalización y acotamiento de lotes en `[1, 99]` en `normalizarCantidadCompra`.
  3. Proyección reactiva de costos y saldo en `calcularResumenCompra` (`x1`, `x5`, `x10`).
  4. Salvaguarda `INV-03` y detección de salud llena en `calcularVistaPreviaCuracion`.
  5. Contratos tipados de `RespuestaCatalogoTienda`, `RespuestaInventario`, `RespuestaComprarTienda` y `RespuestaUsarItem`.
  6. Cumplimiento de Regla R1: lectura mecánica con `node:fs` de `PantallaInventario.tsx` y `PantallaTienda.tsx` confirmando 0 emojis unicode (`/\p{Extended_Pictographic}/u`).
  7. Confirmación de soporte acústico nativo en `assets.ts` para `"monedas"`/`"compra"` y `"curar"`/`"pocion"`.
- **Suite Total Web (`pnpm --filter web test`):** 38 de 38 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test`):** 52 de 52 pruebas aprobadas (100% éxito), incluyendo nuevos casos en `apps/api/test/progreso-tienda.spec.ts` cubriendo `OBJETO_NO_CONSUMIBLE`, `SALUD_COMPLETA`, compras por lotes `x5`/`x10`, validaciones `@Max(99)` y `@Min(1)` en `ComprarDto`, y catálogo enriquecido con existencias.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 1.11s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores.
- **Inspección Responsive y Anti-Overflow:** 0 overflow horizontal en resoluciones móviles de 320 px, 375 px y tablets de 768 px.




