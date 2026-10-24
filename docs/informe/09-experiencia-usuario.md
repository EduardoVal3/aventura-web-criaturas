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

#### E. Libertad y Control del Usuario (Heurística de Nielsen #3) y Desbloqueo de Navegación
- **Mitigación de Trampa de Navegación en Creación de Personaje:** Si el explorador no cuenta con una sesión válida (o la base de datos fue reseteada con `prisma migrate reset`), `AutenticacionGuard` emite HTTP 401 `USUARIO_NO_ENCONTRADO`. El cliente captura este estado, purga `localStorage` (`aethelgard_token_acceso`) y redirige limpiamente a `/ingreso`.
- **Vías de Escape Retro (`LogOut`):** En `PantallaCrearPersonaje.tsx`, se integró un botón retro de salida en la cabecera ("SALIR AL INGRESO") y un enlace secundario en el pie ("¿Deseas ingresar con otra cuenta? Cerrar sesión").
- **Apertura de `RutaPublica`:** `RutaPublica` se configuró para redirigir al `/hub` únicamente cuando el usuario posee tanto token como personaje activo (`token && personajeActivo`). Si no tiene personaje activo, puede acceder sin trabas a las pantallas de `/ingreso` y `/registro` para alternar de cuenta o registrarse de nuevo.
- **Optimización Responsive en `LayoutPrincipal.tsx`:** Erradicación del botón de salir en la cabecera (centralizado donde corresponde en `PantallaHubUbicacion` para la partida activa y en `PantallaCrearPersonaje` para la creación), suprimiendo `flex-wrap` para que "Kit de interfaz" y "Créditos" se mantengan 100% visibles y accesibles desde celulares en una sola línea fluida sin apilarse bajo el logo.
- **Cumplimiento Estricto de Regla R1:** Erradicación de emojis unicode en los controles y botones de `PantallaCrearPersonaje.tsx` y `LayoutPrincipal.tsx`, empleando exclusivamente iconos SVG de Lucide (`Sparkles`, `Swords`, `LogOut`).

---

### 2.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-crear-personaje.spec.ts` y `verificacion-auth.spec.ts`):** 6 pruebas cubriendo validaciones del esquema Zod, filtrado de espacios (`trim`), rechazo de slugs no autorizados, consistencia de atributos/sprites, auditoría de escape hatch con `LogOut` en creación y layout, desbloqueo de `RutaPublica` y verificación estricta de cero emojis unicode según Regla R1.
- **Suite Total Web (`pnpm --filter web test`):** 60 de 60 pruebas aprobadas (100% éxito).
- **Linter Web (`oxlint`):** 0 errores.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa en TypeScript estricto y Vite.
- **Suite Backend (`pnpm --filter api test`):** 71 de 71 pruebas aprobadas.

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

---

## 8. Sub-Fase 10h: Santuario de Curación (`PantallaCuracion.tsx`)

### 8.1 Diagnóstico Inicial y Auditoría Impeccable
Previa a la intervención de la Sub-Fase 10h, el módulo de restauración y la pantalla del Santuario de Curación presentaban 10 carencias críticas de lógica en servidor, arquitectura de datos y experiencia de usuario retro:
1. **Condición de Carrera (TOCTOU) y Escrituras Redundantes en `CuracionService.restaurarEquipo`:** La transacción interactiva no serializaba la fila del personaje mediante bloqueo pesimista (`FOR UPDATE`), permitiendo que dobles clics concurrentes ejecutaran actualizaciones dobles y crearan entradas duplicadas en la tabla `historial`. Además, actualizaba indiscriminadamente a todas las criaturas aunque ya tuvieran salud completa.
2. **Respuesta Empobrecida en `POST /api/curacion/restaurar`:** El endpoint devolvía únicamente `{ mensaje, criaturasRestauradas: criaturasEquipo.length }`, informando el tamaño del equipo y no las criaturas sanadas. Omitía métricas cruciales como `criaturasCuradas`, `criaturasRevividas`, `hpTotalRestaurado`, `ubicacionNombre` y el arreglo `detalles: [{ criaturaId, nombre, hpPrevio, hpNuevo, hpMaximo, hpRestaurado, fueRevivida }]`.
3. **Ausencia de Orden Canónico e Inclusión de Especie:** `tx.criatura.findMany` omitía `orderBy: { ordenEquipo: 'asc' }` e `include: { especie: true }`, impidiendo conocer el nombre canónico de cada criatura restaurada en el servidor.
4. **Documentación Swagger Incompleta:** `CuracionController` declaraba únicamente `@ApiResponse({ status: 200 })`, omitiendo las respuestas de error de negocio `403 SERVICIO_NO_DISPONIBLE` y `404 PERSONAJE_NO_ENCONTRADO`.
5. **Ausencia de Atmósfera del Santuario y Desconocimiento de Ubicación Actual:** `PantallaCuracion.tsx` solo consultaba `api.obtenerEquipo()`, ignorando `api.obtenerUbicacionActual()`. No desplegaba el paisaje retro del manantial (`obtenerImagenZona` con fallback SVG y clase `.pixelated`), ni las insignias retro canónicas `SANTUARIO ANCESTRAL` y `SERVICIO GRATUITO`, ni advertía si el jugador se encontraba en una ruta hostil sin servicio.
6. **Ausencia Total de Sprites Pixel-Art y Metadatos Tácticos:** Las tarjetas de criaturas eran cajas de texto plano que no invocaban `obtenerImagenCriatura(criatura.slug)` ni `manejarErrorImagen(e, "criatura")`. No exhibían nivel (`Nv. X`), apodo, porcentaje numérico de salud ni destacaban al Líder del Equipo (`orden === 1`).
7. **Semáforo de Estado Incompleto:** La insignia alternaba únicamente entre "Saludable" y "Herida". Una criatura caída (`hpActual === 0`) se marcaba erróneamente como "Herida", sin diferenciar los 3 estados tácticos canónicos: `PLENA VITALIDAD`, `HERIDA` y `DEBILITADA / CAÍDA`.
8. **Carencia de Secuencia Cinemática de Bendición y Cifras Flotantes:** Al pulsar restaurar, la salud conmutaba instantáneamente en seco sin animación. No se aplicaban las clases de micro-interacción `anim-curacion` ni las cifras flotantes `anim-curacion-flotante` (`+XX HP` / `¡REVIVIDA! +XX HP`).
9. **Ausencia de Fanfarria Auditiva en Web Audio:** No se invocaba `reproducirSonido` y `sintetizarTonoRetro` en `assets.ts` carecía de una fanfarria solemne específica para la bendición grupal del santuario (`"santuario"` / `"bendicion"`).
10. **Anti-Patrón `<Link><Button/></Link>`, Tipografía Genérica y Falta de `aria-busy`:** Enlaces con botones anidados dentro de etiquetas `<a>` (HTML inválido), fuentes sans en títulos y ausencia de `aria-busy={restaurando}` con texto retro en mayúsculas `CANALIZANDO BENDICIÓN...`.

---

### 8.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Cabecera Inmersiva con Paisaje del Manantial:** Integración de banner panorámico ortogonal que resuelve dinámicamente la imagen de la localidad (`obtenerImagenZona`) con clase `.pixelated`, degradado de atmósfera sagrada y fallback SVG sin fisuras.
- **Insignias Temáticas 8-Bit:** Inclusión de distintivos superiores retro con tipografía `Press Start 2P`: `SANTUARIO ANCESTRAL` (icono `Sparkles`) y `SERVICIO GRATUITO` (icono `ShieldCheck`).
- **Tipografía Bimodal Estricta:** Título principal del santuario, insignias y estados renderizados en `Press Start 2P` (`.retro`), combinados con `Geist Mono` para métricas numéricas y `Geist Sans` para narrativa inmersiva.
- **Sprites Pixelados de 64x64 y Distinción del Líder:** Cada miembro del equipo cuenta con un marco pixel-art de 64x64 con `obtenerImagenCriatura`, `.pixelated` y atenuación en escala de grises (`grayscale`) si se encuentra debilitada. La primera posición (`orden === 1`) exhibe borde ámbar reforzado e insignia distintiva `LÍDER` con corona (`Crown`).
- **Semáforo Táctico de 3 Niveles:**
  - `PLENA VITALIDAD`: Borde y fondo esmeralda con icono `ShieldCheck` (`hpActual >= hpMaximo`).
  - `HERIDA`: Borde y fondo ámbar con icono `HeartPulse` (`0 < hpActual < hpMaximo`).
  - `DEBILITADA / CAÍDA`: Borde y fondo carmesí con icono `AlertCircle` (`hpActual <= 0`).

#### B. Componentes Táctiles 8bitcn/ui y Hardening
- **Barra de Resumen Táctico del Equipo:** Cuadrícula ortogonal de 5 columnas con métricas en tiempo real: `TOTAL EQUIPO`, `PLENA SALUD`, `HERIDAS`, `DEBILITADAS` y `DÉFICIT TOTAL` (`+{deficitTotalHp} HP`).
- **Secuencia Cinemática de Bendición y Números Flotantes:**
  - Al completar el ritual, las tarjetas de criaturas que recibieron restauración activan el resplandor esmeralda `anim-curacion`.
  - En la esquina superior derecha se disparan cifras flotantes `anim-curacion-flotante` con contorno ortogonal negro de 2px (`+XX HP` o `¡REVIVIDA! +XX HP` si la criatura fue levantada desde 0 HP).
- **Hardening contra Doble Clic:** Botón de acción con deshabilitación estricta durante la mutación, `aria-busy={restaurando}`, spinner pixelado y texto en mayúsculas `CANALIZANDO BENDICIÓN...`.
- **Eliminación del Anti-Patrón `<Link><Button>` y Regla R1:** Navegación hacia el Hub mediante `useNavigate` en un botón nativo retro. Cero emojis unicode en toda la pantalla (inspeccionado en pruebas automatizadas), sustituidos por iconos SVG de Lucide (`Heart`, `Sparkles`, `ShieldCheck`, `ArrowLeft`, `AlertCircle`, `Crown`, `HeartPulse`).

#### C. Integración Multimedia y Audio Retro Centralizado (`assets.ts`)
- **Síntesis Web Audio para Santuario (`santuario` / `bendicion`):** Fanfarria solemne ascendente de 4 notas en onda triangular cristalina (`triangle`: 523.25 Hz -> 659.25 Hz -> 783.99 Hz -> 1046.50 Hz con duración de 0.42 s), libre de fugas de `AudioContext` gracias a `osc.onended = () => void ctx.close()`.
- **Sonidos Complementarios:** Efecto `click` en pulsaciones y `error` ante fallas o bloqueos por localidad no autorizada.

#### D. Reglas de Servidor, Seguridad y Restauración Atómica (`INV-03`)
- **Bloqueo Pesimista por Fila de Personaje (`FOR UPDATE`):** `CuracionService.restaurarEquipo` ejecuta `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE` en PostgreSQL, serializando invocaciones concurrentes y evitando duplicación de registros en `historial`.
- **Validación Estricta de Localidad Segura y Servicio:** Rechazo inmediato con `403 SERVICIO_NO_DISPONIBLE` si la ubicación no es segura (`!esSegura`) o no cuenta con `CURACION` o `CENTRO_CURACION`.
- **Resurrección y Cumplimiento de `INV-03`:** Todo el equipo activo se restablece al 100 % de su salud ($\text{hpActual} = \text{hpMaximo}$), levantando criaturas caídas desde 0 HP sin posibilidad matemática de sobrecuración. Solo se ejecutan sentencias de actualización en BD sobre criaturas con salud incompleta.
- **Payload Enriquecido:** El endpoint retorna métricas consolidadas (`criaturasRestauradas`, `criaturasCuradas`, `criaturasRevividas`, `hpTotalRestaurado`, `ubicacionNombre`, `detalles`).

---

### 8.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-curacion.spec.ts`):** 8 pruebas unitarias exhaustivas validando:
  1. Clasificación estricta de los 3 estados vitales y etiquetas en español.
  2. Cálculo de deltas bajo `INV-03` y resurrección de criaturas caídas.
  3. Contratos tipados de `RespuestaRestaurar` y `DetalleCriaturaRestaurada`.
  4. Resolución de rutas WebP y placeholders para criaturas y zonas.
  5. Síntesis de fanfarria de santuario en `assets.ts`.
  6. Regla R1: 0 emojis unicode en `PantallaCuracion.tsx`.
  7. Accesibilidad: ausencia del anti-patrón `<Link><Button>`.
  8. Presencia de `aria-busy`, texto retro `CANALIZANDO BENDICIÓN...`, sprites y animaciones `anim-curacion`.
- **Suite Total Web (`pnpm --filter web test`):** 46 de 46 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test`):** 54 de 54 pruebas aprobadas (100% éxito), incluyendo validaciones de restauración atómica, resurrección, desglose de salud y rechazo en localidades no seguras en `apps/api/test/progreso-tienda.spec.ts`.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 2.19s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores.
- **Inspección Responsive:** Ausencia total de scroll horizontal en resoluciones móviles de 320 px, 375 px y 768 px.

---

## 9. Sub-Fase 10i: Compendio de Criaturas, Bitácora Transversal y Salón de la Fama (`PantallaCatalogo.tsx`, `PantallaHistorial.tsx`, `PaginaCreditos.tsx`)

### 9.1 Diagnóstico Inicial y Auditoría Impeccable
Previo a esta subfase, la experiencia del jugador en las pantallas finales de consulta y cierre presentaba importantes cuellos de botella de red, fallas heurísticas y de diseño:
1. **Cuello de botella $N+1$ de 26 peticiones HTTP en cascada en `PantallaCatalogo.tsx`:** Al ingresar al compendio o cambiar de tipo, el cliente invocaba `api.obtenerEspecies()` y de inmediato ejecutaba `Promise.all(res.especies.map(esp => api.obtenerEspecie(esp.slug)))`, disparando 26 peticiones en ráfaga cada vez.
2. **Módulo `CriaturasModule` vacío en el servidor:** `apps/api/src/modulos/criaturas/criaturas.module.ts` carecía de controlador y servicio, delegando de forma improvisada o incompleta el acceso a los datos de especies.
3. **Desalineación y falta de categorización canónica en `HistorialService`:** Aunque los distintos servicios del juego registraban eventos con tipos heterogéneos (`COMBATE`, `PROGRESO`, `CAPTURA`, `EXPLORACION`, `ENCUENTRO`, `OBJETO`, `COMERCIO`, `CURACION`), `HistorialService` no exponía la categoría táctica canónica ni permitía filtrado por categoría en servidor.
4. **Ausencia total de sprites pixel-art (`obtenerImagenCriatura`) en `PantallaCatalogo.tsx`:** Las tarjetas del catálogo eran contenedores de texto plano sin sprites `.pixelated` ni fallback a SVG.
5. **Selector de tipos incompleto con texto en inglés y sin buscador interactivo:** El selector solo listaba 3 de los 6 tipos (`beast`, `monstrosity`, `undead`) con etiquetas en inglés ("Beast", "Monstrosity"), violando R1 y dejando inaccesibles a `elemental`, `construct` y `plant`. No existía buscador por nombre ni filtro por arquetipo.
6. **Falta de atributos base visibles y ausencia de Modal de Inspección Táctica:** No se mostraban atributos (`HP`, `ATQ`, `DEF`, `VEL`), y no existía un modal sellado para examinar lore, movimientos y estadísticas completas.
7. **Tabla plana sin categorización ni filtros rápidos en `PantallaHistorial.tsx`:** La bitácora utilizaba una tabla plana sin iconografía SVG, dejando sin clasificar la gran mayoría de eventos reales.
8. **Diseño incompleto en `PaginaCreditos.tsx`:** Carecía de navegación de retorno al Asentamiento (`boton-volver-inicio-creditos`), no destacaba al equipo ni el homenaje académico al Ingeniero Claudio, omitía el motor de síntesis Web Audio y no ejecutaba fanfarria sonora.
9. **Anti-patrón `<Link><Button/></Link>` y falta de `aria-busy`:** Existían botones anidados dentro de enlaces y las acciones de actualización no contaban con hardening contra doble clic.

### 9.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Compendio de Criaturas:** Cabecera ceremonial con título en `Press Start 2P` (`COMPENDIO DE CRIATURAS`), insignia `25 ESPECIES SRD 5.2` con icono `BookOpen`, barra de avistamiento biológico (conteo de registradas, en vista, especiales y tipos biológicos), y **vitrina central destacada de sprites pixel-art** de `h-36 sm:h-40` con fondo abismo pixelado, micro-interacción hover con escala suave (`group-hover:scale-110`), sombras retro duras (`obtenerImagenCriatura`, `.pixelated`, `manejarErrorImagen`) y badges ortogonales.
- **Clasificación por Arquetipos Tácticos:** Asignación visual de los 4 arquetipos tácticos calculados según atributos base (`TANQUE` con `Shield`, `ATACANTE` con `Swords`, `VELOZ` con `Zap`, `EQUILIBRADO` con `Scale`) e insignia dorada `ESPECIAL` (`Sparkles`) para criaturas legendarias de CR 6 y CR 8.
- **Bitácora de Crónicas Retro:** Sustitución de la tabla plana por tarjetas de crónicas con sello de tiempo en `font-mono` (hora destacada y fecha), insignia con iconografía SVG de Lucide diferenciada por categoría y descripción en `font-sans` con alto contraste WCAG AA:
  - `COMBATE`: icono `Swords`, acento carmesí/ámbar (`border-red-500/60 bg-red-500/15 text-red-300`).
  - `CAPTURA`: icono `Sparkles`, acento púrpura arcano (`border-purple-500/60 bg-purple-500/15 text-purple-300`).
  - `EXPLORACIÓN`: icono `Compass`, acento cian astral (`border-cyan-500/60 bg-cyan-500/15 text-cyan-300`).
  - `TIENDA`: icono `ShoppingBag`, acento oro gremial (`border-amber-500/60 bg-amber-500/15 text-amber-300`).
  - `CURACIÓN`: icono `HeartPulse`, acento verde esmeralda (`border-emerald-500/60 bg-emerald-500/15 text-emerald-300`).
- **Salón de la Fama y Ending RPG 16-bit (`PaginaCreditos.tsx`):** Cabecera ceremonial con marco dorado (`border-amber-500/80 bg-bastion`), insignias `SALÓN DE LA FAMA` y `ISC-305 · III PAC 2026`, galería de sprites pixel-art de criaturas emblemáticas de Aethelgard (*Lobo Gris*, *Grifo*, *Quimera*, *Hidra*), reconocimiento de arquitectura full-stack, Homenaje Académico al **Ingeniero Claudio**, atribución legal literal del `SRD 5.2` (Wizards of the Coast LLC bajo CC BY 4.0), licencia MIT íntegra de `8bitcn/ui` y retorno limpio con sonido de victoria.

#### B. Componentes Táctiles 8bitcn/ui y Hardening
- **Modal Sellado de Inspección Táctica Detallada:** Componente `Dialog` de 8bitcn/ui sellado herméticamente contra desbordamiento horizontal y vertical (`w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-none border-2 border-primary bg-bastion`), que expone vitrina superior ampliada de criatura, lore biológico descriptivo, barras comparativas de atributos base sobre 100 (`Progress` retro) y lista de movimientos conocidos con tipo de acción y potencia.
- **Buscadores y Filtros Ergonómicos Instantáneos:** Barra de control con alineación de alturas estricta (`h-10`), buscador interactivo con tipografía `font="normal"` y botón de borrado rápido (`X`), selector estilizado en español para los 6 tipos biológicos (`Bestia`, `Monstruosidad`, `No-muerto`, `Elemental`, `Autómata`, `Planta`), botones de arquetipo acompañados de iconografía Lucide con estados activo/inactivo contrastados, y botón `Limpiar filtros` (`RotateCcw`).
- **Erradicación del Anti-Patrón `<Link><Button>` y Hardening `aria-busy`:** Reemplazo de enlaces anidados por navegación imperativa con `useNavigate` e integración de estados `aria-busy` (`ACTUALIZANDO...`) en botones de recarga.

#### C. Integración Multimedia y Audio Retro Centralizado (`assets.ts`)
- **Síntesis Web Audio:** Integración del sintetizador 8-bit para feedback táctil en clics (`"click"`), inspección de fichas (`"seleccionar"`), retorno victorioso (`"victoria"`) y fanfarria triunfal ceremonial (`"fanfarria"`) en el Salón de la Fama.
- **Gestión de Assets con Fallback Seguro:** Uso universal de `obtenerImagenCriatura` y `manejarErrorImagen` con degradación a vectoriales SVG locales en caso de ausencia de sprites WebP.

#### D. Reglas de Servidor, Optimización de Consultas y Erradicación de N+1
- **`CriaturasService` y `CriaturasController` (`M-CRI`):** Implementación de endpoints públicos `GET /api/especies` y `GET /api/especies/:slug`. El endpoint de listado entrega en una única llamada `O(1)` las 25 especies enriquecidas con `keyExterna`, `descripcion`, `arquetipo` y `movimientos` embebidos, eliminando completamente las ráfagas $N+1$ en el cliente.
- **Fallback Determinista de Contingencia:** En caso de consultar una base de datos sin siembra previa, `CriaturasService` recurre de forma transparente al snapshot local de `AdaptadorCriaturasExternas` garantizando alta disponibilidad.
- **Normalización de Bitácora en `HistorialService` (`M-HIS`):** Función pura `normalizarCategoriaHistorial` que mapea cualquier tipo emitido hacia las 5 categorías canónicas, soporte de paginación (`pagina`, `limite`) y filtrado en servidor por `categoria`.

### 9.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Backend (`apps/api/test/catalogo-historial.spec.ts`):** 6 pruebas unitarias verificando la erradicación del $N+1$, filtros por tipo biológico, detalle por slug, error 404, clasificación de las 4 vertientes de arquetipos y normalización/filtrado de las 5 categorías de historial.
- **Suite Total Backend (`pnpm --filter api test`):** 60 de 60 pruebas aprobadas (100% de éxito).
- **Pruebas Frontend (`apps/web/test/verificacion-historial-catalogo.spec.ts`):** 8 pruebas unitarias validando traducción de tipos, cálculo de arquetipos, filtros combinados, normalización de crónicas, formato temporal amigable, auditoría estática de código (ausencia de $N+1$, modales sellados, iconos Lucide SVG, homenaje a Claudio, licencias) y cumplimiento estricto de la Regla R1 (0 emojis unicode).
- **Suite Total Frontend (`pnpm --filter web test`):** 55 de 55 pruebas aprobadas (100% de éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en modo estricto en Vite (construcción limpia en 2.2s).
- **Linter Web (`pnpm --filter web lint`):** 0 errores.
- **Inspección Responsive:** Verificación de ergonomía táctil y ausencia total de overflow horizontal en anchos móviles de 320px.

---

## 10. Sub-Fase 10j: Bestiario Canónico, Jerarquía de Atributos, Sets Tácticos de Movimientos y Tablas de Aparición (30 Criaturas)

### 10.1 Diagnóstico Inicial y Auditoría Impeccable
Previo a esta intervención, el ecosistema de criaturas presentaba importantes asimetrías de diseño, inconsistencias numéricas y problemas de balance competitivo:
1. **Asimetría de Cobertura Regional (25 vs 30 criaturas):** El catálogo original contaba con 25 especies distribuidas desigualmente entre las 6 zonas (Z1 a Z4 con 4 especies, Z5 con 5 y Z6 con 4), generando ecosistemas incompletos y saltos arbitrarios de probabilidad.
2. **Volatilidad de Atributos y Dependencia del SRD Externo:** Las estadísticas de juego se calculaban dinámicamente mediante fórmulas de normalización al vuelo basadas en el snapshot de Open5e, lo que provocaba anomalías estadísticas (p. ej. criaturas de zonas avanzadas con atributos inferiores a las de zonas iniciales) y carecía de progresión controlada.
3. **Truncamiento Arbitrario de Movimientos a 3 Slots:** En la base de datos y la interfaz de usuario, los movimientos se recortaban mediante `.slice(0, 3)` sin una jerarquía táctica clara, omitiendo la distinción fundamental entre ataque básico, técnica táctica, movimiento de cobertura y técnica definitiva de Furia.
4. **Disparidad de Probabilidades en Tablas de Aparición:** Varias tablas de aparición acumulaban ponderaciones dispares o con saltos bruscos (`40/35/20/5`), alejándose de una progresión predecible y balanceada entre especies comunes, frecuentes, raras y especiales.
5. **Carencia de Criaturas Legendarias Canónicas:** Las especies ápice de las zonas finales carecían de una consagración formal como Criaturas Legendarias tanto a nivel de modelo relacional como de distinción visual e iconográfica en el compendio.
6. **Vulnerabilidad de Furia Desbloqueada:** El cuarto movimiento (Furia) no contaba con salvaguarda ni bloqueo en el servidor, permitiendo su uso indiscriminado sin requerir la mecánica de Resonancia.

---

### 10.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual (`docs/DESIGN.md`)
- **Consagración de Criaturas Legendarias (`Crown` de Lucide):** Se consagraron formalmente `behir-abismo` (Zona 5, Presupuesto 355) y `remorhaz-glaciar` (Zona 6, Presupuesto 380) como **Criaturas Legendarias** (`esLegendaria: true`). En `PantallaCatalogo.tsx`, se destacan con un marco dorado retro (`border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.4)]`), una vitrina heroica con fondo abismo pixelado y una insignia flotante dorada `LEGENDARIO` acompañada del icono `Crown` de Lucide.
- **Paleta Canónica de Afinidades Elementales:** Asignación visual y textual de las 6 afinidades elementales retro de Aethelgard: Físico (`stone`), Fuego (`red`), Agua (`blue`), Natura (`emerald`), Sombra (`purple`) y Luz (`yellow`), desplegadas en badges retro biselados tanto en las tarjetas del catálogo como en el modal de inspección táctica.
- **Compendio de 30 Especies SRD 5.2:** Actualización de la cabecera a `30 ESPECIES SRD 5.2` y expansión de la barra de avistamiento biológico a 5 columnas, incorporando la métrica en tiempo real de Criaturas Legendarias (`metricas.legendarias`) con texto dorado e icono `Crown`.
- **Filtro de Rareza Legendaria:** Se añadió el filtro directo `LEGENDARIAS` a la barra de controles de arquetipos, permitiendo aislar instantáneamente a las criaturas ápice del mundo.
- **Despliegue Integral de los 4 Slots Tácticos:** Se erradicó el truncamiento `.slice(0, 3)` en el modal de inspección táctica, renderizando los 4 movimientos canónicos con su identificador de slot (`M1`, `M2`, `M3`, `M4`), nombre, tipo de acción, potencia entera y badges de efectos secundarios (`PARALISIS`, `BASTION`, `DEF_DOWN`, `VENENO`, etc.).

#### B. Componentes Táctiles 8bitcn/ui y Hardening en Combate
- **Modal Sellado contra Overflow:** El modal de inspección mantiene la directriz Impeccable de acotamiento responsive (`w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden rounded-none border-2 border-primary bg-bastion`), previniendo desbordes horizontales en pantallas móviles de 320 px a 360 px.
- **Panel Táctico de 4 Movimientos en `PantallaCombate.tsx`:** El desplegable de ataques de la criatura aliada renderiza ahora los 4 movimientos canónicos. El slot 4 (`mov.slot === 4` o índice 3) se muestra deshabilitado de forma reactiva con el badge retro `Furia (Bloqueado)`, borde punteado tenue, tooltip explicativo y protección `aria-disabled`, impidiendo su activación hasta que el explorador acumule el 100% de Resonancia en combate.
- **Hardening contra Doble Clic:** Protección estricta con `aria-busy={procesandoAccion}` y desactivación de todos los botones de ataque durante la resolución de turnos.

#### C. Integración Multimedia y Web Audio (`assets.ts`)
- **Retroalimentación Acústica de Inspección y Combate:** Utilización del sintetizador nativo de ondas cuadradas de `assets.ts` para clics de navegación (`"click"`), apertura del modal de inspección (`"seleccionar"`), impactos de combate (`"golpe"`) y fanfarria de victoria (`"victoria"`).

#### D. Reglas de Servidor, Prisma y Soberanía Interna de Atributos
- **Migración Relacional de Prisma (`20261017050700_bestiario_canonico`):**
  - Modelo `Especie`: Incorporación de columnas `elemento TEXT NOT NULL DEFAULT 'fisico'` y `esLegendaria BOOLEAN NOT NULL DEFAULT false`.
  - Modelo `Movimiento`: Incorporación de `slot INTEGER NOT NULL DEFAULT 1` y `efecto TEXT`, con restricción de unicidad compuesta `@@unique([especieId, slot])` que garantiza que ninguna especie posea dos movimientos en la misma posición.
- **Bestiario Canónico Soberano (`bestiario-canonico.ts`):** Definición inmutable de las 30 criaturas (5 por zona, Z1..Z6) con atributos progresivos monótonos divididos en 4 escalones de presupuesto: J-1 Aprendiz (160–210), J-2 Aventurero (210–280), J-3 Veterano (270–320) y J-4 Maestro Legendario (310–380), garantizando que cada atributo individual se mantenga estrictamente en el intervalo $[30, 100]$.
- **Siembra Idempotente y Depuración de Huérfanos (`importar-especies.ts`):** El importador ejecuta un upsert transaccional por `idExterno`, asigna los 4 movimientos por especie y depura de forma transaccional cualquier especie obsoleta no canónica (`brown-bear`, `werewolf`, etc.), resembrando limpiamente `AparicionZona` y `Movimiento`.
- **Invariante INV-01 en las 6 Tablas de Aparición:** Normalización matemática de las tablas de aparición a exactamente 5 especies por zona con pesos $35\% + 35\% + 15\% + 10\% + 5\% = 100\%$, asegurando que la suma de pesos sea idénticamente 100 en todas las regiones del mundo.
- **Bloqueo en Servidor del Slot 4 (`MOVIMIENTO_BLOQUEADO`):** En `CombateService.atacar`, si el jugador intenta ejecutar el índice 3 (Slot 4), la acción es rechazada inmediatamente con la excepción `BadRequestException(MOVIMIENTO_BLOQUEADO)` ("El movimiento seleccionado requiere 100% de Resonancia en combate para ejecutarse."). Los DTOs de combate incorporan `@Max(3)` en `movimientoIndice`. Asimismo, la IA rival sortea su contraataque exclusivamente entre los slots 1 y 3 (`sortearIndiceMovimientoRival(0, 2)`), impidiendo que las criaturas salvajes disparen la Furia antes de tiempo.

---

### 10.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Automatizadas de Invariantes del Bestiario (`apps/api/test/bestiario-canonico.spec.ts`):** Suite creada con 8 pruebas unitarias aprobadas que verifican:
  1. Existencia exacta de 30 especies y 5 especies por cada una de las 6 zonas.
  2. Cumplimiento de INV-01 con suma de pesos exactamente igual a 100 en las 6 zonas.
  3. Estricta monotonía creciente del presupuesto medio por zona ($Z_1 < Z_2 < Z_3 < Z_4 < Z_5 < Z_6$).
  4. Acotamiento de atributos individuales en $[30, 100]$ y presupuesto en $[160, 380]$.
  5. Exactamente 4 movimientos por especie con slots $1..4$ y poderes en $[10, 40]$.
  6. Existencia de exactamente 2 criaturas legendarias (`behir-abismo` y `remorhaz-glaciar`).
- **Pruebas de Jerarquía y Bloqueo en Combate (`apps/api/test/combate.spec.ts`):** 3 nuevas pruebas unitarias verificando el rechazo con `MOVIMIENTO_BLOQUEADO`, exclusión del slot 4 en el contraataque rival y rechazo de índices $>3$ en ValidationPipe.
- **Suite Total Backend (`pnpm --filter api test`):** **71 de 71 pruebas aprobadas** (100% de éxito).
- **Pruebas Frontend (`apps/web/test/verificacion-historial-catalogo.spec.ts`):** Pruebas actualizadas con 57 pruebas aprobadas validando la traducción de elementos, filtro de criaturas legendarias, auditoría estática de 30 especies, insignia `Crown`, 4 slots sin `.slice(0, 3)` en `PantallaCatalogo.tsx` y slot 4 de Furia deshabilitado en `PantallaCombate.tsx`.
- **Suite Total Frontend (`pnpm --filter web test`):** **57 de 57 pruebas aprobadas** (100% de éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en modo estricto en Vite (construcción limpia en 7.1s).
- **Regla R1 Estricta:** Cero emojis unicode en toda la interfaz de usuario.

---

## 11. Cierre Formal de la Fase 10 (Consolidado Full-Stack AV5 Definitivo)

Con la culminación de la Subfase 10j, se da por **completada y auditada en su totalidad la Fase 10** del proyecto *Aethelgard: Sendas y Criaturas*, consolidando el hito **AV5 Definitivo (Entrega Final de UX Retro, Bestiario Canónico y Mecánicas Full-Stack)**.

### Tabla Resumen Consolidada de Subfases de la Fase 10

| Subfase | Alcance / Vistas | Mejoras Principales | Pruebas Automatizadas | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **10a** | Autenticación (`PantallaIngreso.tsx`) | Validación Zod en tiempo real, estética CRT/VGA, cero emojis y audio retro. | 3 tests web | ✅ Completada |
| **10b** | Creación Personaje (`PantallaCrearPersonaje.tsx`) | Selección táctica de iniciales con sprites, escape hatch retro con LogOut, desbloqueo de RutaPublica y guard contra tokens huérfanos. | 6 tests web | ✅ Completada |
| **10c** | Hub Localidad (`PantallaHubUbicacion.tsx`) | Cuadrícula de 8 servicios, ambientación dinámica WebP y navegación fluida. | 4 tests web | ✅ Completada |
| **10d** | Exploración (`PantallaExploracion.tsx`) | Cinemática de niebla, selector ponderado en servidor e historial de incursión. | 6 tests web | ✅ Completada |
| **10e** | Combate (`PantallaCombate.tsx`) | Bitácora de combate por turnos, animaciones CSS, cálculo de daño servidor INV-04. | 4 tests web | ✅ Completada |
| **10f** | Equipo y Almacén (`PantallaEquipo.tsx`, `PantallaAlmacen.tsx`) | Reordenamiento de líder, regla A-6, transferencia atómica con bloqueo pesimista. | 10 tests web + 8 tests api | ✅ Completada |
| **10g** | Inventario y Tienda (`PantallaInventario.tsx`, `PantallaTienda.tsx`) | Filtros de objetos, compras por lotes (x1, x5, x10) en servidor y uso medicinal. | 8 tests web + 12 tests api | ✅ Completada |
| **10h** | Santuario de Curación (`PantallaCuracion.tsx`) | Restauración atómica INV-03 con FOR UPDATE, resurrección de caídas y cinemática. | 8 tests web + 6 tests api | ✅ Completada |
| **10i** | Compendio, Bitácora y Créditos (`PantallaCatalogo.tsx`, `PantallaHistorial.tsx`, `PaginaCreditos.tsx`) | Erradicación N+1 en catálogo, modal de inspección sellado, crónicas categorizadas con Lucide, Salón de la Fama y homenaje al Ing. Claudio. | 8 tests web + 6 tests api | ✅ Completada |
| **10j** | Bestiario Canónico y Legendarias (`bestiario-canonico.ts`, `PantallaCatalogo.tsx`, `PantallaCombate.tsx`) | 30 especies canónicas soberanas, jerarquía J-1 a J-4, consagración de Behir y Remorhaz como Legendarias, sets de 4 movimientos M1..M4, bloqueo de Furia y tablas INV-01 al 100%. | 8 tests web + 11 tests api | ✅ Completada |

### Métricas Finales de Calidad del Proyecto
- **Pruebas Unitarias de Back-End (NestJS):** 71 pruebas automatizadas con 100% de aprobación (`pnpm --filter api test`).
- **Pruebas Unitarias de Front-End (React / Vite):** 60 pruebas automatizadas con 100% de aprobación (`pnpm --filter web test`).
- **Total de Pruebas Automatizadas:** **131 pruebas unitarias libres de regresiones**.
- **Compilación TypeScript:** 100% limpia en `web` y `api` bajo configuración estricta.
- **Diseño y Ergonomía:** Cumplimiento riguroso de la guía `docs/DESIGN.md`, cero emojis unicode en controles (Regla R1), cero anidamientos de botones interactivos, modales sellados contra overflow en 320px–360px bajo el estándar Impeccable y audio retro sintetizado en Web Audio API.

---

## 12. Adenda de Calidad: Alineación Definitiva del Bestiario Canónico y Criaturas Iniciales

A solicitud de la dirección técnica y bajo la estricta auditoría del Ingeniero Claudio, se ejecutó la consolidación definitiva entre el catálogo temático oficial (`docs/catalogo-criaturas.md`) y el ecosistema ejecutable del proyecto.

### 12.1 Diagnóstico Inicial y Auditoría
1. **Desfase en Definición de Especies del Servidor:** `apps/api/src/modulos/externo/bestiario-canonico.ts` conservaba remanentes de prototipado temprano (como `lobo-gris`, `pico-de-hacha`, `arana-lobo-gigante`, `lobo-huargo`) desalineados con las 30 especies temáticas canónicas consagradas en `docs/catalogo-criaturas.md`.
2. **Inconsistencia de Criaturas Iniciales:** El endpoint de creación de personaje (`crear-personaje.dto.ts`, `personajes.service.ts`) y la interfaz web (`criaturas-iniciales.ts`, `esquemas-auth.ts`, `PantallaCrearPersonaje.tsx`, `PaginaKitUi.tsx`) requerían restringir las especies elegibles estrictamente a rareza Común (peso 35%). Al ser `ciervo-lunar` una criatura de rareza Frecuente (15%), se seleccionó una especie común de la Zona 02 (`cangrejo-abismal`, común 35%, agua, con acceso inicial habilitado) para consolidar el trío canónico común: `lobo-estepario`, `vibora-rocosa` y `cangrejo-abismal`.
3. **Dispersión en Snapshot de Contingencia:** El snapshot estático requería albergar exactamente los 30 identificadores externos (`idExterno`) de Open5e SRD 2024 para garantizar el 100% de aislamiento ante contingencias de red.

### 12.2 Mejoras Implementadas
1. **Bestiario Soberano Unificado (`apps/api/src/modulos/externo/bestiario-canonico.ts`):** Se reemplazaron íntegramente las 30 especies de `BESTIARIO` y las 30 filas de `TABLAS_APARICION` (con alias retrocompatible `TABLA_APARICION_CANONICA`) siguiendo la matriz oficial de 5 especies por bioma regional, distribuciones INV-01 ($35\%/35\%/15\%/10\%/5\%$), atributos base dentro del intervalo $[30, 100]$, jerarquía táctica J-1 a J-4 y sets de 4 movimientos con tipos de acción y efectos.
2. **Consagración de Criaturas Legendarias:** Se fijaron con `esLegendaria: true` y `esEspecial: true` exclusivamente a `behir-abismo` (Zona 5, Presupuesto 355) y `remorhaz-glaciar` (Zona 6, Presupuesto 380).
3. **Restricción de Especies Iniciales a Rareza Común (35%):** Se sincronizaron las opciones autorizadas a `lobo-estepario` (Zona 1, común 35%, físico), `vibora-rocosa` (Zona 1, común 35%, natura) y `cangrejo-abismal` (Zona 2, común 35%, agua) en:
   - DTO y servicio de creación de personaje (`apps/api/src/modulos/personajes/`).
   - Biblioteca de opciones y esquemas Zod (`apps/web/src/lib/`).
   - Pantalla interactiva de creación de explorador y catálogo de componentes (`apps/web/src/paginas/`).
4. **Sincronización del Snapshot Externo:** Actualización de `apps/api/src/modulos/externo/snapshot/open5e-srd-2024-seleccion.json` y `datos/open5e-srd-2024-seleccion.json` conteniendo los 30 registros SRD exactos.
5. **Reset y Siembra Idempotente en PostgreSQL (Decisión D-3):**
   - Ejecución de `pnpm --filter api exec prisma migrate reset --force` para purgar registros residuales de prototipado temprano y reaplicar las 4 migraciones limpias con `prisma/seed.ts`.
   - Ejecución verificada de `pnpm --filter api importar:especies` en dos tandas consecutivas para garantizar idempotencia estricta sin duplicidad de registros ni desbordamiento de pesos.

### 12.3 Verificación de Calidad y Cero Regresiones
- **Comprobación Estricta en Base de Datos (MCP PostgreSQL):**
  - Tabla `especie`: **30 registros soberanos** con slugs y atributos canónicos exactos.
  - Tabla `movimiento`: **120 registros tácticos** (exactamente 4 movimientos ordenados por slot `1..4` por criatura).
  - Tabla `aparicion_zona`: **30 registros** (5 especies por cada una de las 6 zonas, cada zona sumando exactamente $100\,\%$ bajo `INV-01`).
  - Tabla `criatura`: Purga completa de 46 criaturas desfasadas previas al reset; confirmación de 0 especies obsoletas (`lobo-gris`, `arana-lobo-gigante`, etc.).
  - Especies Legendarias: Confirmadas `behir-abismo` y `remorhaz-glaciar` con `es_legendaria = true` y `es_especial = true`.
- **Pruebas Unitarias de Servidor (`pnpm --filter api test`):** **71 de 71 pruebas aprobadas** (100% de éxito), incluyendo la suite exhaustiva de invariantes en `bestiario-canonico.spec.ts`.
- **Pruebas de Integración y Seguridad E2E (`pnpm --filter api test:e2e`):** **24 de 24 pruebas aprobadas** (100% de éxito) interactuando con la base de datos PostgreSQL real (flujos de creación de personaje con `lobo-estepario`, exploración, combates y batería de seguridad S-1 a S-7).
- **Pruebas de Interfaz (`pnpm --filter web test`):** **60 de 60 pruebas aprobadas** (100% de éxito), validando esquemas Zod, componentes `8bitcn/ui` y compatibilidad con el trío común inicial.
- **Compilación de Producción (`pnpm --filter web build`):** Build de Vite 100% limpio en TypeScript estricto en 2.70 s.
- **Regla R1 y Estándar Retro:** Cumplimiento estricto de nomenclatura en español, cero emojis unicode en controles interactivos y modales responsive libres de overflow horizontal.

---

## 13. Sub-Fase 10k: Motor Autoritativo de Combate Táctico, Afinidades Elementales y Resonancia

A solicitud de la dirección técnica y bajo la estricta auditoría del Ingeniero Claudio, se implementó el motor autoritativo de combate táctico por turnos en el backend de NestJS, integrando afinidades elementales (6×6), catálogo autoritativo de estados alterados (persistidos en `detalleJson`), acumulador de Resonancia para desbloqueo del movimiento insignia (Slot 4 / M4) y sinergia de captura con contraataque autoritativo.

### 13.1 Diagnóstico Inicial y Auditoría Impeccable
Antes de esta intervención, la resolución de combates y acciones asociadas presentaba deficiencias arquitectónicas y de balance:
1. **Fórmula de Daño Plana y Carente de Afinidades:** El cálculo de daño en `CombateService` evaluaba únicamente ataque, defensa y poder sin ponderar el tipo elemental del movimiento ni la afinidad defensora, desaprovechando las afinidades canónicas asignadas a las 30 criaturas en la Subfase 10j.
2. **Ausencia de Estados Alterados Autoritativos:** A pesar de que los movimientos registraban efectos (`QUEMADURA`, `VENENO`, `ESCARCHA`, `PARALISIS`, `PETRIFICACION`, `BASTION`), el servidor no disponía de un gestor de estados por turnos, ni de persistencia de duraciones o ejecución de daño periódico (DoT) en fin de turno.
3. **Mecánica de Furia / Resonancia Inoperante en Servidor:** El movimiento insignia (Slot 4) se bloqueaba estáticamente en el cliente y servidor sin un mecanismo autoritativo de acumulación de Resonancia ($0-100\%$) que permitiera su desbloqueo táctico y posterior reinicio.
4. **Desarticulación de Huida y Captura del Motor de Combate:** La huida fallida y el intento de captura fallido aplicaban fórmulas ad-hoc de daño rival en lugar de delegar en el motor determinista de combate, provocando desincronización de estados, desactualización de turnos y omisión de efectos de fin de ronda.
5. **Carencia de Sinergia Táctica en Captura:** La probabilidad de captura evaluaba únicamente salud y multiplicador de talismán, ignorando la regla oficial de bonificación ($\times 1.25$) cuando la criatura rival se encuentra afectada por un estado alterado activo.
6. **Reanudación del Encuentro Incompleta:** `GET /encuentros/activo` omitía afinidades, resonancia y estados activos de los contendientes, forzando al cliente a reconstruir o inventar el estado de la batalla tras recargar la página.

---

### 13.2 Mejoras Implementadas

#### A. Matriz Inmutable de Afinidades Elementales y Daño Elemental (`motor-combate.ts`)
- **Matriz 6×6 Congelada (`TABLA_AFINIDADES`):** Implementación inmutable (`Object.freeze`) para los 6 elementos canónicos (`fisico`, `fuego`, `agua`, `natura`, `sombra`, `luz`), definiendo 5 ventajas elementales ($1.5\times$), 8 desventajas elementales ($0.75\times$) y 23 cruces neutrales ($1.0\times$):
  - Fuego vence a Natura ($1.5\times$), resistido por Fuego y Agua ($0.75\times$).
  - Agua vence a Fuego ($1.5\times$), resistido por Agua y Natura ($0.75\times$).
  - Natura vence a Agua ($1.5\times$), resistido por Natura y Fuego ($0.75\times$).
  - Sombra vence a Luz ($1.5\times$), resistido por Sombra ($0.75\times$).
  - Luz vence a Sombra ($1.5\times$), resistido por Luz ($0.75\times$).
- **Etiquetado Oficial:** Funciones puras `multiplicadorAfinidad` y `etiquetaEfectividad` (`VENTAJA` para $>1.0$, `DESVENTAJA` para $<1.0$, `NEUTRAL` para $1.0$).
- **Fórmula de Daño Elemental con Salvaguarda INV-04:**
  $$D = \max\left(1, \left\lfloor \left( \left( \frac{\text{Ataque}}{\text{DefensaEfectiva}} \times \text{Poder} \times 0.8 \right) + (\text{Nivel} \times 0.5) \right) \times \text{factorVariacion} \times F_{\text{afinidad}} \right\rfloor \right)$$
  Garantizando $\text{danoFinal} \ge 1$ (`INV-04`) y acotamiento estricto de salud en $[0, \text{hpMaximo}]$ (`INV-03`).

#### B. Catálogo Autoritativo de Estados Alterados y Persistencia
- **Catálogo de 6 Estados (`CATALOGO_ESTADOS`):**
  - `QUEMADURA`: DoT del $10\%$ del HP Máximo (mínimo 1), reduce defensa efectiva en $25\%$ ($0.75\times$), duración 3 turnos.
  - `VENENO`: DoT del $12\%$ del HP Máximo (mínimo 1), duración 4 turnos.
  - `ESCARCHA`: Reduce velocidad efectiva en $40\%$ ($0.60\times$), duración 2 turnos.
  - `PARALISIS`: Reduce velocidad efectiva en $25\%$ ($0.75\times$), $25\%$ de probabilidad de perder el turno por bloqueo motor ($r < 0.25$), duración 2 turnos.
  - `PETRIFICACION`: Inmovilización total ($100\%$ de pérdida de turno, sin consumir tirada aleatoria), duración 1 turno.
  - `BASTION`: Escudo protector equivalente al $20\%$ del HP Máximo que absorbe daño entrante antes de tocar la salud; expira al consumirse o tras 3 turnos (beneficio no alterado: `esAlterado: false`).
- **Reglas de Supervivencia y Balance:**
  - **Decisión D-4 (DoT No Letal):** El daño por estados al final del turno nunca debilita a una criatura por sí solo; se acota con $\max(1, \text{hpActual} - \text{danoDoT})$, requiriendo un impacto directo para la derrota.
  - **Decisión D-6 (Inmunidad Temporal de 1 Turno):** Al expirar un estado natural o por escudo agotado, la criatura adquiere inmunidad al mismo código de estado durante el turno siguiente para prevenir aturdimientos permanentes (*stunlock*).
  - **Persistencia en `Combate.detalleJson.estadoBatalla`:** Reconstrucción determinista del estado mediante `leerEstadoBatalla(detalleJson, criaturaAliadaId)`, saneando límites y reiniciando el lado aliado si ocurre un relevo por muerte (`D-11`).

#### C. Acumulador Puro de Resonancia y Desbloqueo del Movimiento Insignia
- **Dinámica de Resonancia ($0-100\%$):**
  - Ganancia base por ronda: $+8\%$.
  - Bonificación por ventaja elemental: $+10\%$.
  - Carga por daño recibido: $\lfloor (\text{danoAbsorbido} / \text{hpMaximo}) \times 40 \rfloor$, con tope de $+20\%$ por ronda.
- **Desbloqueo Autoritativo de M4 (Furia/Insignia):**
  - La acción `RESONANCIA` o índice 3 sólo es admisible si `resonanciaAliada === 100`. De lo contrario, se rechaza en servidor con `BadRequestException(MOVIMIENTO_BLOQUEADO)`.
  - Al ejecutarse M4 con éxito, la resonancia de la criatura se reinicia inmediatamente a $0\%$ sin sumar ganancias en dicha ronda.
  - El rival nunca ejecuta movimientos del Slot 4 en sus turnos regulares.

#### D. Sinergia de Captura, Bloqueo de Turno y Resolución Unificada
- **Sinergia Táctica de Captura (§2.2):**
  $$\text{probBruta} = \text{tasaCaptura} \times \left(1.0 - 0.5 \times \frac{\text{hpActual}}{\text{hpMaximo}}\right) \times \text{multTalisman} \times \text{multEstado}$$
  Donde $\text{multEstado} = 1.25$ si el rival sufre un estado alterado activo (`tieneEstadoAlterado`), acotando el resultado final en $[0.05, 0.95]$ bajo la invariante `INV-02`.
- **Bloqueo Pesimista de Concurrencia:** Integración de `bloquearYVerificarTurno` en `atacar`, `huir` y `capturar`, adquiriendo bloqueo pesimista en PostgreSQL (`SELECT id FROM personaje ... FOR UPDATE`) y validando el turno esperado contra desincronizaciones (`ConflictException: TURNO_DESACTUALIZADO`, HTTP 409).
- **Contraataque Táctico en Huida y Captura:** Si la huida o la captura fallan, el contraataque rival se procesa invocando `resolverRonda(aliada, rival, snapshot, null, generador)`, persistiendo estados, desgastando escudos y aplicando DoTs en fin de turno.
- **Reanudación Enriquecida (`GET /encuentros/activo`):** Entrega afinidad elemental de ambos bandos, efectividad aliada sobre rival (`multiplicador`, `etiqueta`), barra de resonancia ($0-100$), lista de estados activos y movimientos con flag `bloqueado: boolean`.

---

### 13.3 Verificación de Calidad y Cero Regresiones
- **Pruebas Unitarias de Back-End (`pnpm --filter api test`):**
  - `combate-elemental.spec.ts`: 22 pruebas deterministas validando afinidades 6×6, daño elemental INV-04, catálogo de estados alterados, DoT no letal D-4, absorción y desgaste de Bastión, escarcha/petrificación, refresco e inmunidades, acumulador de resonancia y resolución determinista de la ronda.
  - `captura.spec.ts`: 12 pruebas validando fórmula INV-02, sinergia $\times 1.25$ ante estados alterados y contraataque táctico autoritativo en fallo de captura.
  - `encuentros-activo.spec.ts`: 4 pruebas verificando reanudación inicial y avanzada con afinidad, resonancia y estados persistidos.
  - `combate.spec.ts`: 18 pruebas verificando bloqueo autoritativo de M4 con $<100\%$ de resonancia, desbloqueo y reseteo a 0, detección de concurrencia 409 `TURNO_DESACTUALIZADO` y saneamiento ante relevo D-11.
  - **Total de pruebas en API:** **107 de 107 pruebas aprobadas** (100% de éxito, 0 fallos).
- **Pruebas Unitarias de Front-End (`pnpm --filter web test`):**
  - **60 de 60 pruebas aprobadas** (100% de éxito, cero regresiones).
- **Compilación de Producción (`pnpm --filter web build`):**
  - 0 errores TypeScript en modo estricto en Vite (construcción limpia en 3.0s).
- **Regla R1 Estricta:** Textos en español sin emojis unicode en controles ni respuestas de la API.
- **Invariantes del Sistema:** Verificación estricta de `INV-01` (tablas de aparición al 100%), `INV-02` (captura en $[0.05, 0.95]$), `INV-03` (salud en $[0, \text{hpMaximo}]$) e `INV-04` ($\text{danoFinal} \ge 1$).







