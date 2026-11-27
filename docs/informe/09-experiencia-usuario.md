# 09. Experiencia de Usuario y Enriquecimiento Visual Retro (Fase 10)

Este documento consolida las auditorías heurísticas con la skill `impeccable`, la evolución interactiva de cada pantalla y el cumplimiento de las directrices estéticas establecidas en `docs/DESIGN.md` para _Aethelgard: Sendas y Criaturas_.

---

## 1. Sub-Fase 10a: Autenticación de Exploradores (`PantallaRegistro.tsx` y `PantallaIngreso.tsx`)

### 1.1 Diagnóstico Inicial y Auditoría Impeccable

Previo a la intervención y consolidación retro-brutalist, las vistas de autenticación cumplían con el contrato funcional pero presentaban vacíos de experiencia retro, ergonomía y contraste:

1. **Jerarquía y Escala Tipográfica:** Los títulos y etiquetas utilizaban tamaños genéricos y tipografía sans-serif en descripciones y controles, provocando incoherencia con la identidad de cartucho retro de Aethelgard. Se requería la adopción rigurosa de la fuente pixelada `Press Start 2P` (`.retro`) en absolutamente todos los elementos textuales (insignias, títulos, descripciones, labels, inputs, placeholders, mensajes de error, botones, enlaces secundarios y notas de seguridad).
2. **Deficiencias de Estética Retro-Brutalist 8-Bit:** La tarjeta de ingreso y registro empleaba sombras difusas y bordes genéricos (`shadow-2xl border-4`), careciendo del impacto visual de los marcos negros sólidos (`border-4 border-black`), esquinas ortogonales vivas (`rounded-none`) y sombras ortogonales proyectadas (`shadow-[6px_6px_0_0_#000]`) características del estándar `8bitcn/ui` y NES.css / RPG UI.
3. **Violación de la Regla R1 (Emojis Unicode):** La cabecera de `PantallaRegistro.tsx` incorporaba el emoji unicode `⚔️` en su insignia (`⚔️ GREMIO DE AVENTUREROS`), incumpliendo la directriz de interfaz retro basada exclusivamente en SVG vectoriales.
4. **Ergonomía de Entrada de Datos y Visibilidad de Llave Secreta:** Ausencia de botones táctiles con feedback acústico para alternar visibilidad de contraseña (`Eye` / `EyeOff`), o botones con áreas táctiles reducidas sin suficiente espaciado interior en el input (`pr-10 sm:pr-12`), provocando que la contraseña pudiera superponerse con el icono en pantallas móviles.
5. **Validación Preventiva y Feedback en Tiempo Real:** Los criterios de contraseña (8 caracteres, número, símbolo especial) no ofrecían asistencia visual dinámica en un panel estilizado 8-bit, dependiendo de errores posteriores al envío.
6. **Separación y Ergonomía en Controles Táctiles:** En pantallas táctiles móviles, los botones y campos carecían de suficiente holgura vertical y táctil (requiriendo `space-y-4 sm:space-y-5` en campos, botón de acción ergonómico de 48px–56px con `h-12 sm:h-14` y separador físico claro en el pie de navegación `border-t border-black/40` con `gap-3 sm:gap-4`).
7. **Riesgo de Desplazamiento Horizontal y Truncamiento en Móviles (360px–420px):** Riesgo de desbordamiento por falta de confinamiento estricto (`overflow-x-hidden`) y compresión lateral antiestética de los enlaces del pie («¿No tienes cuenta? Regístrate» y «Ver créditos») al presentarse en un único renglón sin adaptación responsive en columna.
8. **Respuesta Táctil, Auditiva y Hardening:** Ausencia o dispersión de señalización sonora retro (`reproducirSonido("click" | "confirmar" | "error")`), necesidad de declarar formalmente `aria-busy` y proteger los enlaces secundarios durante el envío para erradicar envíos concurrentes y trampas de navegación.

---

### 1.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-Bit (8bitcn/ui) y Jerarquía Visual (`docs/DESIGN.md`)

- **Marcos Brutalistas de Alto Impacto y Sombras Ortogonales Proyectadas:**
  - **Tarjeta Principal:** Rediseño integral de las tarjetas de `PantallaIngreso.tsx` y `PantallaRegistro.tsx` con marco negro sólido de 4px (`border-4 border-black`), esquinas vivas ortogonales (`rounded-none`) y proyección de sombra dura de 6px (`shadow-[6px_6px_0_0_#000]`), proporcionando el peso estético de un cartucho de consola RPG clásico de 8-bit.
  - **Insignia Heráldica Temática (`Badge`):** Cartuchos pixel-art con borde negro (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary/15 text-primary px-3 py-1 rounded-none`) portando la leyenda `RETORNO AL REINO` (con icono `Sparkles`) en ingreso y `GREMIO DE AVENTUREROS` (con icono `Swords`) en registro, enmarcadas con micro-separador ornamental de degradado y borde pixel de alto contraste.
  - **Cajas Táctiles de Entrada (`Input`):** Cajas de entrada de datos con estética de ranura de cartucho (`border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none bg-background/80 focus:shadow-[3px_3px_0_0_#000] focus:border-primary`), asegurando feedback visual interactivo de relieve y solidez táctil en nombre de usuario, correo y contraseña.
  - **Panel de Requisitos de Contraseña (`#requisitos-clave`):** Cartucho retro-brutalist con marco negro de alto contraste (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-background/90 p-2.5 sm:p-3 rounded-none`), cuadrícula fluida (`grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2`) e indicadores dinámicos con semáforo esmeralda/atenuado e iconos `ShieldCheck`.
  - **Botones Arcade de Acción Principal (`Button`):** Botones táctiles estilo arcade con marco negro grueso (`border-4 border-black shadow-[4px_4px_0_0_#000] bg-primary text-primary-foreground active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000] rounded-none`), proporcionando sensación física de pulsación retro tanto en `REGISTRAR CUENTA` como en `INICIAR SESIÓN`.
  - **Separadores Ornamentales Retro:** Divisores de alto contraste con estética pixelada que delimitan la cabecera, el cuerpo y el pie del formulario.
  - **Insignias Inferiores de Seguridad Gremial:** Pies evocativos con `ShieldCheck` («Alianza de Exploradores de Aethelgard · Conexión Cifrada» en registro y «Conexión asegurada con el Reino de Aethelgard» en ingreso) con micro-tipografía retro centrada (`text-[8px] sm:text-[9px]`).

#### B. Tipografía Retro Integral (`Press Start 2P` / `.retro` para TODO)

- Aplicación estricta y universal de la fuente pixelada `Press Start 2P` (`.retro`) en absolutamente todos los elementos textuales de la interfaz de registro e ingreso:
  - **Insignia superior:** `text-[9px] sm:text-[10px] tracking-wider` («GREMIO DE AVENTUREROS» y «RETORNO AL REINO»).
  - **Título principal:** `text-sm sm:text-base md:text-lg text-primary tracking-wide leading-relaxed` («Inscripción de Aventurero» y «Portal de Ingreso»).
  - **Descripción narrativa de ambientación:** `text-[9px] sm:text-[10px] leading-relaxed max-w-xs mx-auto text-muted-foreground`.
  - **Etiquetas de formulario (`Label`):** `text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold` con iconos SVG representativos (`User`, `Mail`, `Lock`) y micro-indicadores auxiliares («Mín. 3 car.» y «Llave secreta»).
  - **Campos de entrada (`Input`) y placeholders:** `text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] tracking-wide`.
  - **Panel de criterios de seguridad (`#requisitos-clave`):** Título de criterios y los tres requerimientos («8+ car.», «1 número», «1 símbolo») en escala compacta calibrada `text-[8px] sm:text-[9px]`.
  - **Mensajes de error Zod:** `text-[9px] sm:text-[10px] text-destructive` con icono `AlertCircle`.
  - **Botón principal de acción:** `text-[10px] sm:text-xs tracking-wider` («REGISTRAR CUENTA» / «CREANDO CUENTA...» e «INICIAR SESIÓN» / «INICIANDO SESIÓN...»).
  - **Enlaces de navegación secundaria del pie:** `text-[9px] sm:text-[10px]` («¿Ya tienes cuenta? Ingresa», «¿No tienes cuenta? Regístrate» y «Ver créditos»).
  - **Nota inferior de seguridad:** `text-[8px] sm:text-[9px]`.

#### C. Confinamiento Móvil y Ergonomía en Controles Táctiles (360px–420px)

- **Confinamiento sin Desbordamiento Horizontal:** Contenedores confinados mediante `w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-4 overflow-x-hidden` y tarjetas con ancho elástico completo (`w-full`), erradicando cualquier posibilidad de scroll horizontal o deformación de márgenes en dispositivos móviles estrechos.
- **Micro-Inspección de Contraseña Fluida sin Compresión:** El panel `#requisitos-clave` implementa cuadrícula adaptativa (`grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2`), evitando quiebres toscos o elipsis en pantallas de 360px y permitiendo lectura clara de los tres criterios de robustez.
- **Ergonomía en Campo de Llave Secreta:** Botón de alternar visibilidad de contraseña (`Eye` / `EyeOff`) con área táctil accesible de 32px (`size-8`), centrado vertical perfecto (`top-1/2 -translate-y-1/2`) y espaciado interior derecho en el input (`pr-10 sm:pr-12`), garantizando que los caracteres ingresados jamás colisionen con el icono en resoluciones móviles.
- **Separación Táctil en Formulario y Botonera:** Espaciado holgado (`space-y-4 sm:space-y-5`) entre los campos de usuario, correo y contraseña; separación superior del panel de requisitos (`mt-2 sm:mt-2.5`); separación vertical previa al botón (`pt-2 sm:pt-3`) con altura táctil ergonómica de 48px–56px (`h-12 sm:h-14`) para facilitar la pulsación en pantallas táctiles.
- **Disposición Adaptativa en Enlaces Secundarios:** Reorganización del pie mediante `flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left` sobre un divisor físico claro (`border-t border-black/40 pt-3 sm:pt-4`), eliminando la compresión lateral o corte de textos en pantallas de 360px.

#### D. Hardening, Audio Web Audio y Cumplimiento de Regla R1

- **Cumplimiento Estricto de Regla R1:** Cero emojis unicode en toda la pantalla; empleo exclusivo de iconos SVG vectoriales de Lucide (`Swords`, `User`, `Mail`, `Lock`, `Eye`, `EyeOff`, `ShieldCheck`, `AlertCircle`, `Sparkles`, `LogIn`).
- **Hardening Antirrebote y Prevención de Doble Envío:** Guarda inmediata ante mutaciones en vuelo (`if (enviando) return;`), inputs deshabilitados (`disabled={enviando}`), formulario y botón marcados con `aria-busy={enviando}`, despliegue de `<Spinner />` retro, y protección de enlaces secundarios mediante `pointer-events-none opacity-50` durante la llamada asíncrona.
- **Micro-Inspección Reactiva con React Hook Form:** Supervisión dinámica de la contraseña mediante `useWatch` conectado al control del formulario, evaluando `cumpleLargoMinimo`, `cumpleNumero` y `cumpleSimbolo` en tiempo real.
- **Efectos Sonoros Retro Centralizados (`assets.ts`):** Sintetización nativa mediante Web Audio para `click` (0.3 - 0.4) al interactuar con botones y alternar visibilidad, `confirmar` (0.5) al autenticar/registrar con éxito (redirigiendo a `/crear-personaje` en registro), y `error` (0.5) ante errores de validación, colisión de usuario/correo o fallas de red.

---

### 1.3 Verificación de Calidad y Cero Regresiones

- **Detector Impeccable:** Verificado con 0 defectos, excelente contraste retro y ergonomía responsive probada en viewports de 360px a 1440px.
- **Linter Web (`oxlint`):** 0 errores en 80 archivos del código web.
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-auth.spec.ts`):** 86 de 86 pruebas aprobadas al 100%, incorporando las dos pruebas exhaustivas `Auditoría Impeccable: PantallaIngreso consolida estética retro-brutalist 8-bit, tipografía integral, confinamiento móvil y espaciado ergonómico` y `Auditoría Impeccable: PantallaRegistro consolida estética retro-brutalist 8-bit, tipografía integral, micro-inspección y espaciado ergonómico`.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa con TypeScript estricto y Vite en 3.21s con cero errores de tipado.

---

## 2. Sub-Fase 10b: Creación de Explorador y Selección de Criatura (`PantallaCrearPersonaje.tsx`)

### 2.1 Diagnóstico Inicial y Auditoría Impeccable

La auditoría heurística y técnica con la skill `impeccable` y los estándares de `docs/DESIGN.md` identificó las siguientes oportunidades de mejora visual, retro-brutalist y ergonómica en la pantalla de creación de personaje:

1. **Estética Retro-Brutalist 8-Bit y Sombras Difusas:** La tarjeta exterior del formulario utilizaba bordes genéricos y sombras difusas (`shadow-2xl border-4`), desentonando con el estándar `8bitcn/ui` y NES.css / RPG UI. Se requería consolidar la superficie con marcos negros sólidos de 4px (`border-4 border-black`), esquinas vivas ortogonales (`rounded-none`) y proyección de sombra dura ortogonal de 6px (`shadow-[6px_6px_0_0_#000]`).
2. **Tipografía Retro Integral (`Press Start 2P` / `.retro` para TODO):** Si bien el formulario incluía clases retro dispersas, diversos elementos como etiquetas secundarias, indicadores de longitud, arquetipos o valores numéricos presentaban tamaños descalibrados o dependían de fuentes sans estándar. Se requería la aplicación estricta y universal de la fuente pixelada `Press Start 2P` (`.retro`) en absolutamente todos los elementos textuales de la interfaz (insignia heráldica, escape hatch, título, narrativa de ambientación, labels, input, placeholder, títulos de criatura, badges, descripciones, atributos base, resumen de compañero y botón principal).
3. **Desplazamiento Horizontal y Truncamiento en Móvil (360px–420px):** El contenedor exterior carecía de confinamiento explícito anti-desbordamiento (`overflow-x-hidden`), y los títulos de criaturas compañeras implementaban la clase `truncate` rígida, lo cual causaba la amputación indeseada de nombres compuestos («Cangrejo Abismal», «Lobo Estepario») en pantallas táctiles estrechas de 360px a 420px. Se requería migrar a `break-words` fluido y garantizar que las tarjetas ocuparan el ancho completo disponible en móvil con márgenes limpios.
4. **Separación y Ergonomía en Controles Táctiles:** En dispositivos móviles, la distancia vertical entre el bloque de nombre del explorador, la cuadrícula de criaturas y el pie de confirmación resultaba compacta, dificultando la interacción táctil. Asimismo, el botón principal requería una zona táctil cómoda de 48px–56px (`h-12 sm:h-14`) con ancho completo en móvil (`w-full sm:w-auto`), y la cabecera requería separación holgada (`gap-3 sm:gap-4`) entre la insignia y el botón de escape.
5. **Hardening y Escape Hatch:** Necesidad de preservar y blindar el escape hatch accesible (`SALIR AL INGRESO` con icono `LogOut`), protección antirrebote de doble clic (`aria-busy={enviando}`, `disabled={enviando}`), protección de enlaces secundarios con `pointer-events-none opacity-50`, feedback acústico retro sintetizado con Web Audio y estricto cumplimiento de la Regla R1 (cero emojis unicode).

---

### 2.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-Bit (8bitcn/ui) y Jerarquía Visual (`docs/DESIGN.md`)

- **Marco de Consola Clásica y Sombras Ortogonales Proyectadas:**
  - **Tarjeta Principal:** Rediseño integral de la tarjeta exterior con marco negro sólido de 4px (`border-4 border-black`), esquinas vivas ortogonales (`rounded-none`) y proyección de sombra dura de 6px (`shadow-[6px_6px_0_0_#000]`), transmitiendo la solidez física de un cartucho de consola RPG clásico de 8-bit.
  - **Insignia Heráldica Temática (`Badge`):** Cartucho pixel-art con marco negro (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary/15 text-primary px-2.5 py-1 rounded-none inline-flex items-center gap-1.5`) portando la leyenda `COMPAÑERO INICIAL` con icono `Sparkles`.
  - **Botón de Escape Superior (`SALIR AL INGRESO`):** Cartucho pixel-art con marco negro de alto contraste (`border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground h-8 px-2.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]`) e icono `LogOut`.
  - **Caja Táctil de Entrada (`Input`):** Campo de nombre del explorador con marco negro de 2px y sombra ortogonal dura (`border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none bg-background/80 focus:shadow-[3px_3px_0_0_#000] focus:border-primary`), asegurando feedback visual interactivo de relieve de cartucho.
  - **Separador Ornamental Pixelado:** Divisor de alto contraste de 1px con degradado que delimita la cabecera del cuerpo del formulario (`bg-gradient-to-r from-transparent via-black to-transparent dark:via-primary/50`).
  - **Botón Arcade de Acción Principal (`Button`):** Botón táctil estilo arcade con marco negro grueso (`border-4 border-black shadow-[4px_4px_0_0_#000] bg-primary text-primary-foreground active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000] rounded-none`), proporcionando sensación física de pulsación en `COMENZAR EN VILLA SERENA` / `INICIANDO AVENTURA...`.

#### B. Tipografía Retro Integral (`Press Start 2P` / `.retro` para TODO)

- Adopción exhaustiva de la fuente pixelada `Press Start 2P` (`.retro`) en absolutamente todos los elementos textuales de la pantalla:
  - **Insignia heráldica superior:** `text-[9px] sm:text-[10px] tracking-wider` («COMPAÑERO INICIAL»).
  - **Botón de escape superior:** `text-[8px] sm:text-[9px] tracking-wider` («SALIR AL INGRESO»).
  - **Título principal:** `text-sm sm:text-base md:text-lg text-primary tracking-wide leading-relaxed` («Crea tu Explorador»).
  - **Descripción narrativa introductoria:** `text-[9px] sm:text-[10px] leading-relaxed max-w-md mx-auto text-muted-foreground`.
  - **Etiquetas del campo de nombre (`Label`):** `text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider` con icono `User` y micro-etiqueta de longitud mínima (`Mín. 3 car.`).
  - **Campo de entrada (`Input`) y placeholder:** `text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] tracking-wide`.
  - **Título y descripción de selección de criatura:** `text-[10px] sm:text-xs uppercase tracking-wide` y `text-[9px] sm:text-[10px] leading-relaxed`.
  - **Tarjetas de criaturas iniciales:** Nombres de criaturas en `text-[10px] sm:text-[11px] font-bold`, badges (`ELEGIDO` y tipo biológico) en `text-[8px] sm:text-[9px]`, arquetipo táctico en `text-[9px] sm:text-[10px]`, descripción narrativa en `text-[8px] sm:text-[9px] leading-relaxed` y etiquetas/valores de atributos base en `text-[8px] sm:text-[9px] font-bold`.
  - **Pie de confirmación:** Resumen de compañero seleccionado en `text-[8px] sm:text-[9px]`, enlace de cerrar sesión en `text-[8px] sm:text-[9px]` y botón principal en `text-[10px] sm:text-xs tracking-wider`.

#### C. Cuadrícula de Compañeros Iniciales y Mini-Barras de Atributos Base

- **Compañeros Canónicos de Zona 1 (Villa Serena):** Despliegue de las 3 criaturas autorizadas por el SRD de Aethelgard:
  - `Lobo Estepario` (Bestia · _Cazador Ágil y Coordinado_).
  - `Víbora Rocosa` (Bestia · _Sigilo y Ponzoña_).
  - `Cangrejo Abismal` (Monstruosidad · _Defensa y Coraza Marina_).
- **Estética de Cartucho Retro (8bitcn/ui):**
  - Tarjeta inactiva: `border-2 sm:border-3 border-black shadow-[4px_4px_0_0_#000] bg-card hover:border-primary/50 rounded-none`.
  - Tarjeta activa (seleccionada): `border-primary bg-primary/10 shadow-[6px_6px_0_0_#000] scale-[1.02] rounded-none` coronada por la insignia `ELEGIDO`.
  - Visor de sprite pixel-art: marco negro `border-2 border-black bg-muted/30 shadow-[inset_2px_2px_0_0_#000]` con imagen pixelada (`pixelated`) y halo luminoso reactivo.
  - Erradicación de truncamiento: títulos de criaturas con `break-words`, permitiendo lectura completa sin cortes ni elipsis.
- **Mini-Barras de Atributos Base 8-Bit (HP, ATQ, DEF, VEL):**
  - Rieles negros de alto contraste (`bg-black/70 h-2 overflow-hidden border border-black p-[1px] shadow-[inset_1px_1px_0_0_#000]`).
  - Barras temáticas puras con transición suave: HP con `Heart` (esmeralda `bg-emerald-500`), ATQ con `Swords` (ámbar `bg-amber-500`), DEF con `Shield` (azul `bg-blue-500`) y VEL con `Zap` (cian `bg-cyan-400`).

#### D. Confinamiento Móvil, Ergonomía Táctil y Prevención de Desbordamiento (360px–420px)

- **Confinamiento sin Desbordamiento Horizontal:** Contenedor confinado mediante `w-full max-w-4xl mx-auto px-2 sm:px-4 overflow-x-hidden` y tarjeta central con ancho elástico completo (`w-full rounded-none`), erradicando cualquier posibilidad de scroll horizontal en dispositivos móviles.
- **Separación Táctil Holgada en Formulario:** Separación clara (`space-y-6 sm:space-y-8`) entre el bloque de nombre del explorador, la cuadrícula de criaturas y el pie de confirmación.
- **Cuadrícula Responsiva de 1 a 3 Columnas:** Disposición fluida `grid grid-cols-1 md:grid-cols-3 gap-4`, ocupando el ancho completo disponible en móvil sin compresión lateral.
- **Ergonomía en Botonera y Pie Adaptativo:** Botón de acción principal con altura ergonómica de 48px–56px (`h-12 sm:h-14`) y ancho completo en móvil (`w-full sm:w-auto`). Pie de página organizado con disposición adaptativa (`flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 w-full text-center sm:text-left`) sobre divisor físico claro (`border-t border-black/40 pt-6 pb-6`).

#### E. Hardening, Escape Hatch, Audio Retro y Cumplimiento de Regla R1

- **Cumplimiento Estricto de Regla R1:** Cero emojis unicode en toda la pantalla; empleo exclusivo de iconos SVG vectoriales de Lucide (`Sparkles`, `LogOut`, `User`, `AlertCircle`, `Heart`, `Swords`, `Shield`, `Zap`).
- **Hardening Antirrebote y Prevención de Doble Envío:** Guarda inmediata ante mutaciones en vuelo (`if (enviando) return;`), formulario y botón con `aria-busy={enviando}`, inputs deshabilitados (`disabled={enviando}`), despliegue de `<Spinner />` retro con texto `INICIANDO AVENTURA...`, y protección de controles secundarios mediante `pointer-events-none opacity-50` durante la llamada asíncrona.
- **Escape Hatch Accesible:** Botón retro `SALIR AL INGRESO` con icono `LogOut` en la cabecera y enlace en el pie para permitir cerrar sesión y volver a `/ingreso` sin trampas de navegación.
- **Captura Defensiva de 401 / `USUARIO_NO_ENCONTRADO`:** Si la sesión expiró o la base de datos se reinició, la pantalla captura el error, purga credenciales locales y remite al ingreso de forma segura.
- **Efectos Sonoros Retro Centralizados (`assets.ts`):** Sintetización nativa mediante Web Audio para `click` (0.4) en botones y navegación, `seleccionar` (0.35) al alternar criatura inicial, `confirmar` (0.5) tras crear el personaje con éxito, y `error` (0.5) ante errores de validación o del servidor.

---

### 2.3 Verificación de Calidad y Cero Regresiones

- **Detector Impeccable:** Verificado con 0 defectos, excelente contraste retro y ergonomía responsive probada en viewports de 360px a 1440px.
- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-crear-personaje.spec.ts` y `verificacion-auth.spec.ts`):** 5 pruebas especializadas en creación de personaje: validación del esquema Zod, soporte de nombres recortados (`trim`), autorización exclusiva de las 3 criaturas iniciales canónicas de Zona 1, consistencia de atributos y sprites, hardening defensivo y la prueba exhaustiva `Auditoría Impeccable: PantallaCrearPersonaje consolida estética retro-brutalist 8-bit, tipografía integral, confinamiento móvil y espaciado de controles`.
- **Suite Total Web (`pnpm --filter web test`):** 87 de 87 pruebas aprobadas al 100%.
- **Linter Web (`oxlint`):** 0 errores en archivos del código web.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa con TypeScript estricto y Vite con cero errores de tipado.

---

## 3. Sub-Fase 10c: Hub de Ubicación y Navegación del Mundo (`PantallaHubUbicacion.tsx`)

### 3.1 Diagnóstico Inicial y Auditoría Impeccable

La auditoría heurística y técnica con la skill `impeccable` y los estándares de `docs/DESIGN.md` identificó los siguientes puntos de fricción y oportunidades de consolidación estética y ergonómica en el Hub de Ubicación ("Campamento y Plaza del Gremio"):

1. **Truncamiento Rígido de Títulos y Metadatos:** Se identificaron clases `truncate` rígidas en los títulos de los servicios del gremio (`servicio.titulo`) y nombres de explorador, provocando que títulos de dos o más palabras («CENTRO DE CURACIÓN», «HISTORIAL DE INCURSIONES», «ALMACÉN DE CRIATURAS») se amputaran con elipsis (`...`) en resoluciones móviles o cuadrículas estrechas.
2. **Modales de Viaje Genéricos y Sin Ficha Interior Retro:** Los cuadros de confirmación de viaje y de rutas restringidas (`AlertDialog`) utilizaban fuentes sans genéricas, carecían de marco interior temático de destino y dependían de estilos por defecto sin el carácter brutalista de un cartucho de consola RPG clásico de 8-bit.
3. **Falta de Separación y Espaciado en Botones de Acción:** En móviles y pantallas táctiles, los botones de confirmación (`EMPRENDER CAMINO`) y cancelación (`PERMANECER`) dentro del pie del diálogo carecían de holgura suficiente (`gap` estrecho o nulo al apilarse verticalmente). Asimismo, en las tarjetas de senderos el botón de viaje se encontraba adyacente a la información de nivel sin un divisor físico claro.
4. **Disparidad Tipográfica (Sans vs. 8-Bit Retro):** Existían textos descriptivos, contadores del panel superior del explorador y leyendas en fuentes sans estándar que diluían la atmósfera inmersiva de fantasía oscura pixel-art exigida por el North Star visual del proyecto.
5. **Jerarquía Visual y Atmósfera Central:** La pantalla requería unificar bordes gruesos de alto relieve (`border-4 border-black shadow-[6px_6px_0_0_#000]`), superficie temática de Bastión (`bg-bastion`) y retícula geométrica uniforme de 4px/8px.
6. **Hardening contra Mutaciones en Vuelo:** Necesidad de prevenir doble viaje (`viajando`, botón deshabilitado con `aria-busy={viajando}` y `<Loader2 className="animate-spin" />` + texto retro `VIAJANDO...`) y proteger enlaces de navegación secundaria durante la petición.
7. **Cumplimiento Estricto de la Regla R1:** Garantizar la ausencia absoluta de emojis unicode en la vista, apoyándose exclusivamente en iconos SVG vectoriales de Lucide (`Compass`, `Coins`, `Users`, `Package`, `Store`, `Map`, `Sparkles`, `ShieldCheck`, `Skull`, `Lock`, `ArrowRight`, `LogOut`, `Loader2`) con textos 100% en español.

---

### 3.2 Mejoras Implementadas

#### A. Hero Panorámico con Marco 8-Bit de Alto Contraste (`docs/DESIGN.md` §2)

- **Marco de Consola Clásica:** Enmarcado integral de la cabecera del asentamiento con borde pixelado retro (`border-4 border-black shadow-[6px_6px_0_0_#000] bg-card`), transmitiendo de inmediato la estética de cartucho clásico.
- **Ilustración de Paisaje Regional con Fallback SVG:** Renderizado WebP con `obtenerImagenZona(...)` y sanitización kebab-case, degradado de contraste hacia el abismo (`bg-gradient-to-t from-black/90 via-black/40 to-black/30`) y degradación limpia ante desconexión.
- **Insignias Flotantes de Seguridad y Escape Retro:**
  - Badges con relieve 8-bit (`border-2 border-black shadow-[2px_2px_0_0_#000]`): `LOCALIDAD SEGURA` en verde esmeralda con `ShieldCheck` o `ZONA HOSTIL` en carmesí con `Skull`.
  - Botón táctil de salida (`SALIR` con icono `LogOut`) con borde pixelado, respuesta al clic (`active:translate-y-0.5`) y bloqueo durante mutaciones en vuelo.
- **Tipografía Pixelada y Sombra Proyectada:** Nombre del asentamiento renderizado con `Press Start 2P` (`.retro`), insignia ornamental de Plaza del Gremio con `Sparkles` y sombra proyectada dura (`text-shadow-[2px_2px_0_#000] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`).

#### B. Panel Superior del Explorador: Tipografía 8-Bit Integral y Flujo sin Truncamiento

- **4 Cajas de Estado Retro con Tipografía Pixelada:** Rediseño completo de las cajas de métricas con el marco táctil `border-2 border-black shadow-[4px_4px_0_0_#000] bg-muted/60 hover:bg-muted/80 transition-colors`:
  - **Explorador:** Icono `Compass` en cian (`#14d1e8`), micro-etiqueta retro `text-[8px] sm:text-[9px] uppercase tracking-wider` y nombre del personaje en tipografía retro compacta `text-[9px] sm:text-[10px]` con `break-words leading-tight`, erradicando el truncamiento rígido.
  - **Monedas de Oro:** Icono `Coins` en oro solar (`#f5b724`), número destacado en tipografía pixelada `text-[10px] sm:text-xs` y sufijo retro `oro` (`text-[8px] sm:text-[9px]`).
  - **Equipo Activo:** Icono `Users` en verde vital (`text-emerald-400`), contador numérico de aliados (`text-[10px] sm:text-xs`) y leyenda `/ 6 aliados` en tipografía retro integral.
  - **Almacén:** Icono `Package` en cian (`text-cyan-400`), contador numérico de criaturas en reserva con leyenda retro `criaturas`.

#### C. Cuadrícula Interactiva de Servicios del Gremio: Erradicación de Truncamientos

- **8 Instalaciones Modulares:** Exploración, Equipo Activo, Almacén, Inventario, Tienda/Bazar, Santuario de Salud, Compendio Open5e y Bitácora.
- **Flujo Tipográfico Multilínea Sin Amputaciones:** Se eliminó la clase `truncate` rígida en `servicio.titulo`. El texto se calibró a `text-[9px] sm:text-[10px]` con interlineado `leading-tight` y `break-words mb-1.5`, garantizando que títulos largos como «SANTUARIO DE SALUD», «COMPENDIO OPEN5E» o «HISTORIAL DE INCURSIONES» fluyan armoniosamente en dos renglones sin recortes ni elipsis (`...`).
- **Descripciones Retro de Lectura Descansada:** Párrafos descriptivos formateados en tipografía retro calibrada (`retro text-[8px] sm:text-[9px] text-slate-300 sm:text-slate-400 leading-relaxed`).
- **Tarjetas Pixeladas con Micro-Animación:** Tarjetas táctiles `border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:border-[#14d1e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000]`:
  - Contenedor cuadrado para el icono temático (`size-9 sm:size-10 bg-[#1a2332] border-2 border-black shadow-[2px_2px_0_0_#000]`).
  - Indicador esmeralda de servicio autóctono (`size-2.5 rounded-full bg-emerald-400 border border-black shadow-[0_0_6px_rgba(52,211,153,0.9)]`) frente a acceso general.
  - Protección de navegación secundaria durante desplazamientos (`viajando && "pointer-events-none opacity-50"`).

#### D. Rediseño Integral de Modales de Viaje (AlertDialog 8-bit Brutalist) y Tarjetas de Rutas

- **Marco de Consola Clásica RPG Box:** Los modales de confirmación de viaje y ruta restringida (`AlertDialogContent`) se transformaron en cuadros de diálogo de cartucho retro:
  - Estructura `w-[calc(100vw-2rem)] sm:max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100`.
  - Títulos temáticos pixelados con división interior: `CONFIRMAR VIAJE` en cian astral (`#14d1e8`) con icono `Compass` y `RUTA RESTRINGIDA` en carmesí de alerta (`#ef4444`) con icono `Lock`.
- **Ficha Interior de Destino:** Caja retro empotrada de alto contraste (`border-2 border-black bg-black/60 p-3 space-y-1.5 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]`), desplegando el nombre del destino en cian o carmesí con icono vectorial y nivel recomendado/sugerido en tipografía pixelada `text-[8px] sm:text-[9px]`.
- **Tipografía Retro en Todo el Diálogo:** Descripción del diálogo en escala calibrada `Press Start 2P` (`retro text-[9px] sm:text-[10px] leading-relaxed text-slate-200`).
- **Separación Táctil Holgada en Botonera (`AlertDialogFooter`):**
  - Contenedor de botones con espaciado generoso (`flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 w-full mt-4`).
  - Botón primario `EMPRENDER CAMINO` con acabado retro-brutalista primario (`bg-[#14d1e8] text-black font-bold border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 px-4 text-[10px]`).
  - Botón secundario `PERMANECER` claramente diferenciado (`bg-muted/80 hover:bg-muted text-slate-200 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 px-4 text-[10px]`).
  - Botón de cierre en ruta restringida `COMPRENDIDO` con padding ergonómico (`py-2.5 px-5 text-[10px]`).
- **Divisor Físico en Tarjetas de Senderos:** Separación visual nítida entre la información cartográfica y la acción de viaje mediante línea pixelada `border-t-2 border-black pt-3 mt-3`.
- **Confinamiento Móvil sin Overflow Horizontal:** Inclusión de `w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-x-hidden` en el contenedor principal y en el estado de carga (`Skeleton`), garantizando cero barras de scroll horizontal en pantallas estrechas (360px–420px).

#### E. Audio Retro Centralizado y Tolerancia a Fallos

- Integración de `reproducirSonido(...)` para eventos de interfaz:
  - Clic al interactuar con servicios y botones de navegación (`0.35`).
  - Confirmación al emprender viaje hacia otra zona (`0.5`).
  - Señalización de error ante bloqueos de senda o fallas de red (`0.5`).

---

### 3.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-hub-mundo.spec.ts` y `verificacion-auth.spec.ts`):** 7 pruebas especializadas aprobadas al 100%:
  1. Configuración, rutas e iconos de los 8 servicios del Hub.
  2. Lógica de habilitación de servicios según localidad actual.
  3. Sanitización de nombres y resolución de paisajes WebP con fallback.
  4. Estructura y reglas de conexiones de viaje bloqueadas vs accesibles.
  5. Regla R1 Estricta: Cero emojis unicode en `PantallaHubUbicacion.tsx`.
  6. Hardening y ergonomía: verificación estática de `aria-busy`, guarda `if (viajando) return;`, marco de hero 8-bit `border-4 border-black shadow-[6px_6px_0_0_#000]`, panel táctil `border-2 border-black shadow-[4px_4px_0_0_#000]`, modales `border-4 border-black shadow-[8px_8px_0_0_#000]` y sello `w-[calc(100vw-2rem)]`.
  7. Auditoría Impeccable: Erradicación de truncamientos rígidos en títulos de servicios, cajas de diálogo retro de consola RPG en modales de viaje con superficie `bg-bastion`, ficha interior de destino, espaciado generoso en `AlertDialogFooter` (`gap-3 sm:gap-4`), división en tarjetas de senderos (`border-t-2 border-black pt-3 mt-3`) y confinamiento `overflow-x-hidden`.
- **Suite Total Web (`pnpm --filter web test`):** 81 de 81 pruebas aprobadas al 100%.
- **Linter Web (`oxlint`):** 0 errores en 80 archivos.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa en TypeScript estricto y Vite en 2.06s con cero errores de tipos.

---

## 4. Sub-Fase 10d: Enriquecimiento de Exploración y Encuentros en Rutas (`PantallaExploracion.tsx`)

### 4.1 Diagnóstico Inicial y Auditoría Heurística Impeccable (Primera y Segunda Pasada)

La auditoría de diseño e interacción con la skill `impeccable` sobre la pantalla de expedición silvestre y sus diálogos de encuentro reveló los siguientes puntos de fricción, fallas de ergonomía y oportunidades de consolidación estética:

1. **Falta de Ambientación Visual Retro-Brutalista y Estilo de Cuadro RPG:** La versión preliminar utilizaba tarjetas con bordes delgados de color tenue (`border-2 border-[#43526d]`), careciendo del impacto visual y peso físico característico de la estética _retro-brutalist 8-bit_ de cartucho de consola y `8bitcn/ui` (`border-4 border-black shadow-[6px_6px_0_0_#000]`).
2. **Truncamientos Rígidos y Amputación de Textos en Móviles (360px–420px):** Uso de clases `truncate` y `line-clamp-2` rígidas que cortaban nombres compuestos de criaturas de varias palabras (ej. _"QUIMERA TRICÉFALA"_, _"REMORHAZ DEL GLACIAR ETERNO"_, _"CANGREJO ABISMAL"_), nombres de ítems de botín (`itemCodigo`) y títulos de zona en viewports reducidos, arruinando la lectura con puntos suspensivos innecesarios.
3. **Disparidad Tipográfica (Ausencia de Fuente Retro Integral):** Presencia de tipografías estándar `font-sans` y `font-mono` en descripciones de zona, cuerpo de la bitácora de incursión, mensajes de modales, medidor de vitalidad y fichas de atributos del rival, diluyendo la autenticidad 8-bit de Aethelgard.
4. **Apiñamiento y Rigidez en Botones de Acción de Modales:** Los botones `INICIAR COMBATE` y `RETIRARSE` en el diálogo de encuentro se encontraban estrechamente empaquetados en columna con un `gap-2` insuficiente para interacción táctil, sin diferenciación cromática nítida ni holgura responsive (`gap-3 sm:gap-4 flex flex-col sm:flex-row`).
5. **Vitrina del Rival Plana y Carente de Relieve Cinemático:** El modal de encuentro hostil carecía de un cuadro escénico de combate clásico de consola; el sprite del rival y la barra de vitalidad flotaban sobre fondos estándar sin el relieve interior empotrado (`shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)]`) ni chips de estadísticas tácticas con código de color.
6. **Legibilidad y Saturación en la Bitácora de Incursión:** El registro cronológico se desplegaba con tarjetas estándar sin tipografía pixelada compacta legible y requería un contenedor con desplazamiento vertical suave (`max-h-56 sm:max-h-64 overflow-y-auto pr-1`) para no interferir con la navegación de la página.

---

### 4.2 Mejoras Implementadas (Segunda Pasada de Excelencia Retro Impeccable)

#### A. Tipografía Retro 100% Integral (`Press Start 2P` / `.retro` en Toda la Pantalla)

- **Extensión Universal de `.retro`:** Se implementó la fuente pixelada `Press Start 2P` (`.retro`) en la totalidad de los elementos textuales de la pantalla:
  - Nombre de la senda en el hero panorámico, descripción ambiental y badges flotantes (`ZONA HOSTIL`, `NV. SUGERIDO: X`, `100% CARTOGRAFIA`, `LOCALIDAD SEGURA`).
  - Medidor de progreso cartográfico, conteo porcentual numérico y botón de acción (`EXPLORAR SENDA` / `RESOLVER COMBATE CON [RIVAL]`).
  - Bitácora de incursión: encabezado, contador de eventos, categorías de registro (`ENCUENTRO SALVAJE`, `BOTÍN ENCONTRADO`, `PUNTO DE PARTIDA`, `AVANCE DE EXPLORACIÓN`), marcas horarias y cuerpo de los mensajes.
  - Modal de Encuentro Cinemático: título (`¡CRIATURA SALVAJE!`, `¡AVISTAMIENTO LEGENDARIO!`), descripción del suceso, nombre completo del rival, insignia de nivel, indicador numérico de vitalidad (`HP actual / HP máximo`) y etiquetas de atributos tácticos (ATQ, DEF, VEL).
  - Modal de Botín: título (`¡BOTIN DESCUBIERTO!`), cantidad de oro o nombre completo del ítem y texto del botón de guardado.
- **Calibración Antiacortamiento y Legibilidad Óptima:** Escalas tipográficas adaptadas con interlineado holgado: `text-[8px] sm:text-[9px]` para descripciones, bitácora y mensajes; `text-[8.5px] sm:text-[9px]` para insignias de nivel y timestamps; `text-[9px] sm:text-[10px]` para chips de atributos y progreso; y `text-[10px] sm:text-xs` para nombres de bestias, títulos y botones de acción (`leading-relaxed` / `leading-snug`).

#### B. Erradicación de Títulos y Textos Truncados (`break-words` Fluido)

- **Eliminación Total de `truncate`:** Se suprimieron todas las clases `truncate` y `line-clamp` rígidas en el nombre de la criatura (`rivalActivo.nombre`), títulos de senda silvestre (`h1`), descripciones contextuales y códigos de botín (`ultimaRecompensa.itemCodigo`).
- **Envoltura Multilínea Contenida:** Se integró `break-words leading-tight max-w-full`, permitiendo que criaturas con nombres extensos (ej. «REMORHAZ DEL GLACIAR ETERNO», «QUIMERA TRICÉFALA») e ítems compuestos se lean de forma íntegra en dos líneas en pantallas móviles (360px–420px) sin cortes abruptos con puntos suspensivos.

#### C. Rediseño Cinemático de Modales (Dialog 8-bit Brutalist)

- **Marco de Consola Clásica RPG Box:** Contenedor `DialogContent` sellado con `w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] bg-card border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden !p-0 !gap-0 flex flex-col`.
- **Vitrina del Rival con Relieve Interior:** Caja escénica interior en relieve retro `p-3 sm:p-4 bg-black/70 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] space-y-2.5 sm:space-y-3 text-center`. Para criaturas Legendarias, se aplica iluminación dorada `bg-amber-950/30 border-amber-500/60`, corona mística flotante (`Crown` en oro solar) y halo radiante (`anim-halo-legendario`).
- **Barra de Vitalidad del Rival Empotrada:** Canal oscuro empotrado retro `bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] h-3 sm:h-3.5` con barra esmeralda `#22c55e` e indicador numérico en tipografía retro `text-[8px] sm:text-[9px]`.
- **Chips de Estadísticas Tácticas (ATQ, DEF, VEL):** Cajas negras individuales con marco retro `bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] p-1.5 sm:p-2 text-center flex flex-col items-center gap-1 min-w-0`, con iconos vectoriales SVG de Lucide codificados por color (`Swords` en rojo carmesí, `Shield` en azul cobalto, `Zap` en ámbar solar) y valores numéricos en `Press Start 2P`.

#### D. Separación Táctil y Desahogada en Botones de Acción

- **Botonera del Modal de Encuentro:** Espaciado generoso con `flex flex-col sm:flex-row gap-4 sm:gap-6 w-full mt-3 sm:mt-4` en un pie fijo `px-3.5 sm:px-5 py-3 sm:py-4 border-t-2 border-black bg-[#090d16]`:
  - Botón primario `INICIAR COMBATE` en carmesí retro-brutalista (`bg-red-600 hover:bg-red-500 text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 sm:py-3 text-[10px] sm:text-xs`).
  - Botón secundario `RETIRARSE` con estilo pizarra contrastada claramente diferenciado (`bg-[#1a2332] hover:bg-[#232d3f] text-slate-300 hover:text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 sm:py-3 text-[10px] sm:text-xs`).
- **Botón de Expedición:** Separado del medidor cartográfico con margen claro (`pt-4 sm:pt-5 mt-2 sm:mt-3`), dotado de marco masivo de 4px (`border-4 border-black shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000]`).
- **Botón de Retorno (`CAMPAMENTO`):** Ubicado en la cabecera del hero silvestre, separado con padding táctil contenido (`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px]`) y protegido con `pointer-events-none opacity-50` durante la exploración activa.
- **Modal de Botín:** Botón `GUARDAR EN BOLSA` en oro solar con padding táctil amplio (`py-3 text-[10px] sm:text-xs`).

#### E. Confinamiento Móvil sin Overflow Horizontal (360px–420px)

- **Contenedor Principal Hermético:** Inclusión de `w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 overflow-x-hidden`, replicado idénticamente en el estado de carga (`Skeleton`).
- **Bitácora de Incursión Elástica:** Desplazamiento vertical interno fluido (`max-h-56 sm:max-h-64 overflow-y-auto pr-1`) sin provocar scroll horizontal ni empujar el pie de página.
- **Regla R1 Estricta:** Cero emojis unicode en toda la pantalla; despliegue exclusivo de iconografía vectorial SVG de Lucide (`Compass`, `MapPin`, `Footprints`, `Swords`, `Sparkles`, `Scroll`, `Coins`, `Backpack`, `AlertTriangle`, `ArrowLeft`, `ShieldCheck`, `Loader2`, `Shield`, `Zap`, `Eye`, `Crown`).
- **Síntesis Auditiva Retro Centralizada:** Acústica Web Audio orquestada a través de `reproducirSonido`: 'paso' al avanzar, 'alerta' ante bestias hostiles comunes, 'fanfarria' ante criaturas Legendarias, 'botin' al encontrar tesoros, 'confirmar' al iniciar combate y 'error' ante bloqueos o zonas pacíficas.

---

### 4.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`apps/web/test/verificacion-exploracion.spec.ts`):** 9 pruebas especializadas aprobadas al 100%:
  1. Estructura y contrato de `RespuestaExploracion` ante encuentros con criaturas salvajes.
  2. Modelado de botines con monedas e ítems de inventario.
  3. Lógica de cálculo y límite persistente del 100% de cartografía.
  4. Diferenciación de expedición y niveles entre zonas seguras y hostiles.
  5. Formato de la bitácora de incursión y garantía de cero emojis unicode en mensajes.
  6. Preservación del progreso ante encuentros hostiles en curso.
  7. Regla R1 Estricta: Ausencia total de emojis unicode en textos y botones de `PantallaExploracion.tsx`.
  8. Hardening, Ergonomía y Estética Retro-Brutalist: Verificación estática de `aria-busy`, `disabled={explorando}`, guarda `if (explorando) return;`, marco de hero 8-bit `border-4 border-black shadow-[6px_6px_0_0_#000]`, paneles táctiles `border-2 border-black shadow-[4px_4px_0_0_#000]`, modales `border-4 border-black shadow-[8px_8px_0_0_#000]` y sello contra overflow `w-[calc(100vw-2rem)]`.
  9. Auditoría Impeccable (Segunda Pasada): Verificación estática de erradicación total de clases `truncate` en nombres y títulos, confinamiento `overflow-x-hidden`, holgura táctil en botones de diálogo de combate (`flex flex-col sm:flex-row gap-3 sm:gap-4 w-full mt-2.5`), botón `RETIRARSE` diferenciado en pizarra, margen de expedición `pt-3 mt-1`, vitrina con relieve interior `bg-black/70 border-2 border-black`, barra de vitalidad empotrada `bg-[#090d16] border-2 border-black` y botón de botín amplio `py-3`.
- **Suite Total Web (`pnpm --filter web test`):** 82 de 82 pruebas aprobadas al 100% de éxito.
- **Linter Web (`oxlint`):** 0 errores en 80 archivos evaluados.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa en TypeScript estricto y Vite en 1.52s con cero errores de tipos.

---

## 5. Sub-Fase 10e: Combate Táctico y Captura de Criaturas (`PantallaCombate.tsx`)

### 5.1 Diagnóstico Inicial y Auditoría Impeccable

La versión preliminar del sistema de combate presentaba serias debilidades de experiencia, lógica de progresión y fidelidad visual:

1. **Disposición Espacial Plana y Sin Profundidad:** El combate se mostraba mediante dos tarjetas estáticas colocadas una al lado de la otra, careciendo de la emoción y perspectiva clásica de los RPG por turnos de 16-bit.
2. **Reanudación Débil de Encuentros Activos:** Al recargar la pantalla o regresar a `/combate`, el turno se reiniciaba arbitrariamente en 1, no se proveían movimientos y la bitácora anterior se perdía.
3. **Botonera Táctica Rudimentaria:** Solo existían acciones básicas sin opciones para seleccionar movimientos específicos, consumir pociones de vitalidad en combate, relevar el liderazgo de criaturas o seleccionar talismanes específicos de captura.
4. **Cálculo de Progresión Incoherente (Riesgo de Invariante §2.4):** Existía riesgo de duplicidad de fórmulas matemáticas de nivel y experiencia en el front-end, violando la regla de servidor autoritativo (A-8).
5. **Desbordamientos Horizontales en Modales:** Los modales de resolución (Victoria, Captura y Derrota) causaban scroll horizontal no deseado al apilar botones largos con tipografía pixelada `Press Start 2P`.
6. **Inconsistencias Estéticas con `docs/DESIGN.md`:** Presencia de esquinas redondeadas (`rounded`, `rounded-full`), sombras difuminadas gaussianas y pedestales con `blur` que contradecían el estilo pixel-art de consola clásica de 8/16 bits.
7. **Ausencia de Acústica Táctica:** Las acciones críticas (impacto de ataques y éxito de captura) carecían de efectos de sonido sintetizados y feedback táctil consistente en botones secundarios.

---

### 5.2 Mejoras Implementadas

#### A. Arena de Batalla Diagonal 16-Bit y Perspectiva Retro (`docs/DESIGN.md` §2)

- **Disposición Espacial Clásica:** Rediseño completo de la arena con perspectiva diagonal:
  - _Rival Hostil:_ Situado en el cuadrante superior derecho sobre una plataforma de combate escalonada 16-bit (`bg-[#121927] border-2 border-black shadow-[2px_2px_0_0_#000]`), exhibiendo su sprite pixelado con `.pixelated`, placa HUD con borde pixelado, barra de salud segmentada y badge de nivel.
  - _Criatura Aliada:_ Posicionada en el primer plano inferior izquierdo encarando diagonalmente al oponente, con tarjeta de estado persistente (`border-4 border-black shadow-[4px_4px_0_0_#000]`), medidor numérico de vitalidad (HP actual / HP total), barra de resonancia táctica de 10 bloques y barra de experiencia porcentual.
- **Atmósfera Inmersiva de Arena:** Fondo de fantasía oscura (`#090d16`) con cuadrícula retro CRT y gradiente de penumbra que enmarca los combatientes con máximo contraste.
- **Erradicación de Curvas y Desenfoques:** Supresión total de clases `rounded`, `rounded-full` y `blur` en la arena, pedestales y contenedores de incertidumbre de captura, reemplazándolos por marcos ortogonales geométricos.
- **Micro-animaciones Físicas de Combate:**
  - `anim-sacudida` y `anim-parpadeo-dano` ante impactos físicos.
  - Indicadores numéricos de daño flotante con código de color dinámico (carmesí para daño recibido, esmeralda para curación).
  - Secuencia de incertidumbre en captura (`anim-captura-incertidumbre`) con balanceo de talismán en marco retro antes de revelar el veredicto del servidor.

#### B. Panel Táctil Extendido de 5 Comandos RPG y Prevención de Doble Acción (Hardening S-5)

- **Comandos Tácticos Accesibles (100% SVG Lucide, Cero Emojis Unicode R1):**
  1. _Atacar (`Swords`):_ Selector interactivo de movimientos desplegando los 4 slots tácticos (M1 a M4) con chips de efectividad (`¡EFICAZ!`, `RESISTIDO`), badges de estados aplicados y bloqueo de M4 cuando la resonancia es menor al 100%.
  2. _Usar Objeto (`HeartPulse`):_ Modal retro con filtrado exclusivo de ítems curativos del inventario, restaurando vitalidad con animación esmeralda y feedback flotante inmediato.
  3. _Cambiar Criatura (`ArrowLeftRight`):_ Selector táctico de miembros del equipo con HP disponible y XP individual para relevar el liderazgo de combate mediante `PATCH /equipo/orden`.
  4. _Capturar (`Sparkles`):_ Selector interactivo de talismanes disponibles con animación de incertidumbre y balanceo antes de revelar éxito o contraataque.
  5. _Huir (`LogOut`):_ Diálogo modal retro de confirmación con probabilidad probabilística acotada. Ante fallo en huir, el contraataque rival se anima y refleja inmediatamente en la barra de salud sin requerir recargar la página.
- **Hardening contra Acciones Dobles (S-5):**
  - Guarda reactiva de cadencia visual (`cerrojoAccion.current = true`) y control de estado asíncrono (`procesandoAccion`).
  - Botones con `disabled={procesandoAccion}`, `aria-busy={procesandoAccion}` y spinners retro que imposibilitan enviar paquetes concurrentes fuera de turno al servidor.

#### C. Reanudación Fiel de Encuentros y Preservación de Estado

- **Enriquecimiento del Backend (`GET /encuentros/activo`):**
  - Devuelve la especie aliada con sus movimientos reales registrados en catálogo.
  - Preserva el turno cronológico real alcanzado.
  - Reconstruye la bitácora cronológica histórica completa desde los registros de combate en base de datos PostgreSQL, garantizando continuidad ininterrumpida ante recargas de página o reconexiones.

#### D. Centralización Absoluta de Progresión en el Servidor (A-8 / S-6 / §2.4)

- **Cálculo Determinista de Experiencia:** Todo cálculo de puntos de experiencia, nivel, umbral de subida y porcentaje de barra se ejecuta exclusivamente en el servidor mediante `ProgresoService.calcularProgresoXp`.
- **Cliente Front-End Ligero:** La vista React actúa como cliente presentacional puro, consumiendo los campos `experiencia`, `porcentajeXp` y límites devueltos por la API sin formular cálculos locales de balance.

#### E. Sellado de Modales contra Desbordamiento Tipográfico (`Press Start 2P`)

- **Adaptación Responsiva sin Overflow:** Contenedores `DialogContent` y `AlertDialogContent` estructurados con `border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden` y paneles internos con scroll vertical elástico.
- **Apilado Vertical Inteligente:** Botones de acción en el pie de los modales estructurados con `flex flex-col sm:flex-row gap-2 w-full`, eliminando colisiones horizontales y asegurando legibilidad total en resoluciones móviles (320px–425px).
- **Sanitización de Glifos:** Supresión de caracteres acentuados mayúsculos incompatibles en la tipografía pixelada.

#### F. Audio Retro Sintetizado Nativo Web Audio API

- Incorporación en `apps/web/src/lib/assets.ts` de sintetizadores nativos mediante osciladores Web Audio API con disparadores acústicos en cada acción:
  - `'click'`: Pulsación física en botones de comandos y cierre de modales.
  - `'seleccionar'`: Conmutación de talismán de captura o navegación.
  - `'golpe'`: Onda diente de sierra (`sawtooth`) con curva de caída de frecuencia percusiva.
  - `'captura'`: Arpegio ascendente de onda cuadrada (`square`) para fanfarria de domesticación exitosa.
  - `'victoria'`: Fanfarria melódica de triunfo en combate.
  - `'error'`: Notificación acústica de fallo en captura o huida bloqueada.

---

### 5.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-combate.spec.ts`):** 6 pruebas unitarias exhaustivas validando:
  1. Contrato enriquecido de combate y reanudación fiel de encuentros.
  2. Lógica del panel táctico de 5 comandos.
  3. Respuestas de huida con contraataque inmediato.
  4. Síntesis acústica nativa para efectos de combate.
  5. Cumplimiento estricto de la Regla R1: cero emojis unicode en `PantallaCombate.tsx`.
  6. Hardening y ergonomía: estética retro 8bitcn, arena 16-bit, `aria-busy` y modales sellados.
- **Suite Total Web (`pnpm --filter web test`):** 71 de 71 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Balance (`pnpm --filter api test`):** 36 de 36 pruebas aprobadas, incluyendo la prueba unitaria `apps/api/test/progreso-tienda.spec.ts` que valida el cálculo de progresión en servidor.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación limpia sin errores TypeScript en Vite en 1.51s.
- **Linter Web (`oxlint`):** 0 errores.
- **Auditoría Mecánica Impeccable (`detect.mjs`):** 0 defectos encontrados en `PantallaCombate.tsx`.

---

## 6. Sub-Fase 10f: Equipo Activo y Almacén (`PantallaEquipo.tsx` y `PantallaAlmacen.tsx`)

### 6.1 Diagnóstico Inicial y Auditoría Heurística Impeccable

Previa a la intervención y consolidación retro-brutalist, la gestión táctica de combatientes y la custodia en almacén presentaban debilidades arquitectónicas, de sincronización y de ergonomía visual:

1. **Jerarquía Visual Plana entre Líder y Reserva:** La tarjeta del combatiente líder carecía de impacto visual supremo; usaba un borde dorado tenue sin sombras sólidas ortogonales, diluyéndose entre los compañeros de reserva y dificultando identificar de un vistazo quién abriría los combates.
2. **Ausencia de Estética Retro-Brutalist 8-Bit (`8bitcn/ui`):** Las tarjetas, barras y botones presentaban estilos genéricos sin los bordes negros gruesos (`border-2 border-black`, `border-4 border-black`) ni sombras sólidas duras (`shadow-[2px_2px_0_0_#000]`, `shadow-[4px_4px_0_0_#000]`, `shadow-[6px_6px_0_0_#000]`) exigidos por `docs/DESIGN.md`.
3. **Legibilidad Débil en Medidores de Vitalidad y Progresión:** Las barras `HealthBar` y `XpBar` no contaban con canales oscuros empotrados ni marcos protectores, y el porcentaje de EXP se camuflaba con el fondo por el uso de tokens atenuados.
4. **Trunking Prematuro y Falta de Ergonomía Móvil (360px–420px):** En pantallas pequeñas, títulos largos en `Press Start 2P` (ej. _"Mantarraya Espectral"_) se truncaban abruptamente con elipsis (`Mantarraya Esp...`), los sprites de 64px consumían excesivo ancho útil, la tarjeta del líder dejaba un hueco asimétrico en la botonera y las ranuras vacías forzaban alturas sobredimensionadas (`min-h-[260px]`).
5. **Invasión Tipográfica No Deseada:** El componente `Card` inyectaba la clase `.retro` en contenedores internos, forzando números monoespaciados y textos sans a adoptar glifos anchos pixelados que desbordaban la cuadrícula móvil.
6. **Inconsistencias en Servidor y Orden Táctico Indeterminado:** El endpoint `PATCH /api/equipo/orden` admitía permutaciones parciales y duplicadas. Dado que `CombateService` selecciona al combatiente líder según `ordenEquipo asc`, un reordenamiento corrupto dejaba indeterminado quién abría los combates.
7. **Condiciones de Carrera en la Regla A-6 y Equipo Mínimo:** Las transferencias leían el estado de la criatura y el total de integrantes fuera de transacciones serializadas, permitiendo que peticiones concurrentes (doble clic o sesiones simultáneas) desbordaran el límite de 6 criaturas o vaciaran completamente el equipo.
8. **Ausencia de Intercambio Atómico:** Cuando el equipo alcanzaba su capacidad máxima (6/6), el jugador debía salir a la pantalla de equipo, enviar una criatura al almacén y retornar a la pantalla de almacén para promover a la nueva criatura, creando ventanas de vulnerabilidad transitoria con 5 miembros y fricción innecesaria.
9. **Carencia de Estadísticas en Almacén:** `GET /api/almacen` omitía atributos esenciales (`ataque`, `defensa`, `velocidad`, `experiencia`, `porcentajeXp`), imposibilitando evaluar estratégicamente a qué combatiente incorporar.
10. **Falta de Exposición de la Regla de Localidad Segura:** La UI no informaba sobre la restricción territorial exigida por el servidor (`403 ACCION_NO_PERMITIDA`), ofreciendo controles que fallaban inesperadamente fuera de un asentamiento seguro.
11. **Hardening Insuficiente y Desincronización Local:** La deshabilitación por doble clic era aislada por tarjeta, posibilitando disparos concurrentes entre miembros; tras transferencias se filtraba el arreglo local sin renumerar posiciones.
12. **Navegación Inaccesible:** Existía anidamiento no conforme de `<button>` dentro de elementos `<a>` (`<Link>`), generando paradas dobles de foco para lectores de pantalla y teclado.
13. **Fuga Crítica de Recursos Web Audio:** `sintetizarTonoRetro` en `apps/web/src/lib/assets.ts` instanciaba un `AudioContext` en cada emisión acústica sin cerrarlo al finalizar, provocando el enmudecimiento total del audio en el navegador tras múltiples interacciones.

---

### 6.2 Mejoras Implementadas

#### A. Mesa Táctica de Mando 16-Bit y Jerarquía Retro-Brutalist (`docs/DESIGN.md` y `8bitcn/ui`)

- **Combatiente Líder (`orden === 1`):** Rediseñado con marco supremo retro-brutalista `border-4 border-black shadow-[6px_6px_0_0_#000] bg-amber-500/10 ring-1 ring-amber-400/40`, badge retro `LÍDER` con icono `Crown` (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-400 text-black font-bold text-[8px] sm:text-[9px] retro rounded-none gap-1 py-0.5 px-1.5 sm:px-2`), sprite pixelado con aura luminosa dorada (`bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] p-1`) y placa retro de mando inferior `LÍDER ACTUAL` en la botonera para preservar la simetría visual.
- **Compañeros de Reserva:** Enmarcados con marco brutalista táctil `border-2 border-black shadow-[4px_4px_0_0_#000] bg-card`, sprite pixelado con relieve interior oscuro (`bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1`) y badge de nivel monoespaciado en alto contraste (`Nv. X`) con `border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/50`.
- **Estado Debilitado:** Badge destructivo retro `DEBILITADA` (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-red-600 text-white font-bold text-[8px] sm:text-[9px] retro`) e indicador contextual enmarcado: _"El combate la omitirá hasta curarla."_
- **Barras Retro Empotradas de Vitalidad y EXP:**
  - `HealthBar` integrada en un canal oscuro protegido `border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]`, con semáforo cromático reactivo (>50% esmeralda, 20%-50% ámbar, <=20% carmesí crítico) y animación de pulso crítico.
  - `XpBar` empotrada en canal oscuro `border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]`, con porcentaje de avance en `text-purple-300 font-bold font-mono` asegurando contraste superior a 4.5:1.
- **Matriz de Atributos Base Táctica:** Caja retro `border-2 border-black bg-black/40 shadow-[2px_2px_0_0_#000] p-1 sm:p-1.5` con tres celdas independientes para ATQ (`Swords` en rojo), DEF (`Shield` en azul) y VEL (`Zap` en ámbar), con valores numéricos monoespaciados en negrita y máximo contraste.
- **Ranuras Libres como Pedestales Tácticos:** Ranuras desocupadas modeladas como pedestales brutales con borde discontinuo `border-2 border-dashed border-black/80 bg-black/20 shadow-[2px_2px_0_0_#000] p-4 sm:p-6 min-h-[140px] sm:min-h-[220px]`, texto retro `Ranura libre` en `Press Start 2P` y conteo `{numeroRanura} de {limiteEquipo}`.
- **Cabecera y Navegación Rápida:** Título principal con tipografía pixelada `Press Start 2P` (`.retro`), badge retro de capacidad `{equipo.length} / {limiteEquipo}` con `border-2 border-black shadow-[2px_2px_0_0_#000]`, y botones de acceso directo `/almacen` e `/hub` con marco brutalista táctil `border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none`.
- **Aviso Territorial:** Banner de advertencia territorial con `MapPinOff` con borde negro ortogonal `border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/10 text-amber-400`.

#### B. Componentes Táctiles 8bitcn/ui, Hardening y Ergonomía Móvil (Pantallas Pequeñas 320px–420px)

- **Tipografía Bimodal Estricta sin Invasión de `.retro`:** Se aplicó `font="normal"` a `Card`, `CardHeader`, `CardContent` y `CardFooter`, aislando `Press Start 2P` exclusivamente a encabezados y badges tácticos, mientras las lecturas de salud, progreso y estadísticas permanecen nítidas en fuentes sans y monoespaciadas.
- **Erradicación de Truncamiento en Nombres de Criatura:** Se calibró el título a `text-[10px] sm:text-xs` con `break-words line-clamp-2 leading-snug` y se adaptó el sprite a `h-12 w-12 sm:h-16 sm:w-16`, permitiendo que nombres compuestos (como _"Mantarraya Espectral"_) se lean completos sin elipsis (`...`) en pantallas de 360px.
- **Botonera Táctica con Feedback Físico y Simetría:** Botones de subida/bajada (`ChevronUp`, `ChevronDown`) de escala compacta (`h-7 w-7 sm:h-8 sm:w-8`) y botón `Designar líder` (`text-[8.5px] sm:text-[10px] retro`) con marco `border-2 border-black shadow-[2px_2px_0_0_#000]` y efecto de compresión física (`active:translate-y-0.5 active:shadow-none`). En la tarjeta líder, se proyecta la placa dorada `LÍDER ACTUAL` en lugar de un vacío asimétrico.
- **Bloqueo Global Reactivo contra Doble Acción:** Se implementó el estado unificado `operacion: { tipo, criaturaId } | null`. Durante cualquier petición en vuelo, **todos** los botones de la tarjeta se inhabilitan (`disabled={operacion !== null}`), aplicando `aria-busy={true}`, spinners retro pixelados y la leyenda `PROCESANDO...`.
- **Almacén de Custodia Retro-Brutalist (`PantallaAlmacen.tsx`):** Tarjetas de combatientes en reserva enmarcadas en `border-2 border-black shadow-[4px_4px_0_0_#000] bg-card`, con distintivo retro `CUSTODIA` en marco oscuro, insignia de nivel en alto contraste (`Nv. X`), sprite pixelado en relieve interior oscuro y nombre protegido con `break-words line-clamp-2 leading-snug` contra truncamiento prematuro.
- **Modal de Relevo e Intercambio Atómico Sellado contra Overflow:** `DialogContent` confinado con `w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none border-4 border-black shadow-[6px_6px_0_0_#000]`, scroll vertical interno acotado (`max-h-[55vh]`), radio group accesible con avatares pixelados de compañeros, badge dorado `LÍDER` y separación vertical estricta (`gap-3`) entre botones para erradicar cualquier solapamiento físico derivado de las decoraciones pixeladas de 6px de `8bitcn/ui`.
- **Adaptabilidad Móvil Estricta (320px–420px):** Contenedor elástico `max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4` y cuadrícula adaptable `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4` con apilado fluido, garantizando cero desbordamiento horizontal en dispositivos móviles estrechos.
- **Cumplimiento Estricto de la Regla R1:** Cero emojis unicode en código, comentarios y textos de UI. Toda la semántica gráfica se canaliza exclusivamente mediante iconos SVG de Lucide (`Crown`, `ChevronUp`, `ChevronDown`, `Archive`, `MapPinOff`, `Warehouse`, `ArrowLeft`, `Swords`, `Shield`, `Zap`, `Heart`, `Repeat`, `ArrowUpFromLine`, `PackageOpen`).

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

---

### 6.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-equipo-almacen.spec.ts`):** 12 pruebas unitarias exhaustivas aprobadas al 100%:
  1. Pureza e inmutabilidad de la función de reordenamiento `moverEnLista` (designación de líder al índice 0).
  2. Subida táctica de una posición ($i \to i - 1$).
  3. Bajada táctica de una posición ($i \to i + 1$).
  4. Comportamiento ante índices fuera de rango o iguales (conservación de copia intacta).
  5. Inmutabilidad de la entrada y conservación del multiconjunto de identificadores.
  6. Contrato tipado de `RespuestaEquipo` modelando `limiteEquipo` y `enLocalidadSegura`.
  7. Contrato tipado de `RespuestaAlmacen` modelando estadísticas completas y `totalEnEquipo`.
  8. Contrato tipado de `PeticionTransferirCriatura` soportando intercambio atómico con `intercambiarConId`.
  9. Regla R1 Estricta: Ausencia total de emojis unicode en `PantallaEquipo.tsx`.
  10. Regla R1 Estricta: Ausencia total de emojis unicode en `PantallaAlmacen.tsx`.
  11. Hardening, Ergonomía y Estética Retro-Brutalist: Verificación estática en `PantallaEquipo.tsx` de marco supremo de líder `border-4 border-black shadow-[6px_6px_0_0_#000]`, marcos tácticos `border-2 border-black shadow-[4px_4px_0_0_#000]`, sombras sólidas `shadow-[2px_2px_0_0_#000]`, ranuras discontinuas `border-2 border-dashed border-black/80`, protección `aria-busy={estaOrdenando}`, `aria-busy={estaTransfiriendo}`, bloqueo `disabled={operacion !== null`, leyenda retro `PROCESANDO...` e integración de `HealthBar` y `XpBar`.
  12. Hardening, Ergonomía y Estética Retro-Brutalist: Verificación estática en `PantallaAlmacen.tsx` de marcos tácticos `border-2 border-black shadow-[4px_4px_0_0_#000]`, modal sellado `w-[calc(100vw-2rem)] sm:max-w-md`, protección `aria-busy={operacionActiva}`, bloqueo `disabled={operacion !== null`, tipografía bimodal `font="normal"`, leyenda `PROCESANDO...` e integración de `HealthBar` y `XpBar`.
- **Suite Total Web (`pnpm --filter web test Corto`):** 75 de 75 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test Corto`):** 47 de 47 pruebas aprobadas (100% éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 1.77s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 80 archivos evaluados.
- **Inspección Responsive en Viewports Móviles (320px–420px):** Cero desbordamiento horizontal, legibilidad completa de nombres sin truncado abrupto y contraste óptico superior en barras de vitalidad y progresión.

---

## 7. Sub-Fase 10g: Bolsa de Inventario y Bazar de Provisiones (`PantallaInventario.tsx` y `PantallaTienda.tsx`)

### 7.1 Diagnóstico Inicial y Auditoría Impeccable

Previa a la intervención de la Sub-Fase 10g y bajo la auditoría heurística Impeccable, la gestión de objetos poseídos (`PantallaInventario.tsx`) y el comercio mercantil de provisiones (`PantallaTienda.tsx`) presentaban deficiencias críticas a nivel de experiencia de usuario, diseño retro y arquitectura:

1. **Desplazamiento Horizontal en Móvil (360px–420px):** Los contenedores principales carecían de `overflow-x-hidden` y confinamiento elástico. En la tienda, la cabecera mercantil y los controles de lotes (`x1`, `x5`, `x10`) junto al ajuste fino (`+/-`) y el desglose de precios forzaban desbordamiento lateral en dispositivos móviles compactos.
2. **Acortamiento y Truncamiento Excesivo de Textos:** Empleo de `truncate` y `line-clamp-2` rígidos que cortaban nombres largos de consumibles o talismanes y mutilaban sus descripciones tácticas, impidiendo conocer el impacto real de los artículos.
3. **Disparidad Tipográfica (Falta de Fuente Retro Integral):** Presencia de tipografías sans y monospace estándar en contadores de oro, existencias en bolsa, etiquetas de categoría, botones de lote, ajustes finos y balances económicos, diluyendo la inmersión 8-bit de Aethelgard.
4. **Fragilidad Ergonómica en el Modal de Adquisición:** El diálogo de compra carecía de sellado estricto contra desbordamiento en viewports reducidos y de un balance dinámico en vivo con código de color (verde para saldo remanente suficiente, rojo para déficit) y hardening contra doble clic concurrente.
5. **Consumo Indiscriminado de Objetos no Curativos fuera de Combate:** `POST /api/inventario/usar` verificaba la existencia del objeto pero no su clasificación taxonómica (`objeto.tipo === 'CURACION'`), permitiendo consumir talismanes de captura fuera de combate sumando estadísticas erróneas.
6. **Desperdicio de Consumibles sobre Criaturas con Salud Plena:** Si una criatura aliada poseía `hpActual >= hpMaximo`, el servidor descontaba la poción del inventario y registraba curación nula (+0 HP), violando el principio de salvaguarda del jugador y la regla `INV-03`.
7. **Condición de Carrera (TOCTOU) en Curación y Comercio:** `InventarioService.usarObjeto` y `TiendaService.comprar` leían saldo y salud fuera de las transacciones interactivas, permitiendo que peticiones concurrentes por doble clic consumieran más unidades que las poseídas o duplicaran compras de lotes.
8. **Falta de Validación de Límites Superiores en DTOs y Precios:** `ComprarDto` carecía de cota superior (`@Max(99)`), y `TiendaService.comprar` no exigía `precioCompra > 0`, abriendo ventanas a transacciones con cantidades desproporcionadas o adquisición gratuita de objetos no comerciables.
9. **Catálogo de Tienda Hardcodeado en Cliente:** `PantallaTienda.tsx` definía un arreglo estático `ARTICULOS_TIENDA` en lugar de consumir `GET /api/tienda`, ignorando la disponibilidad del servicio `TIENDA` en la localidad actual y las existencias reales en bolsa (`cantidadEnInventario`).
10. **Respuestas Empobrecidas en API:** `GET /api/inventario` omitía `descripcion`, `efectoValor`, `precioCompra`, `capacidadMaxima`, `ranurasOcupadas` y `totalUnidades`, impidiendo desplegar medidores de carga.
11. **Discrepancia Documental y Canónica de Precios:** `docs/wireframes.md` y `docs/decisiones.md` citaban precios obsoletos (40/100 oro y 30/70 HP), desalineados con los valores canónicos sembrados en PostgreSQL (`seed.ts`: 30/80 oro y 20/50 HP).
12. **Ausencia de Retroalimentación Acústica:** Cero invocaciones a `reproducirSonido` en compras y curaciones, y ausencia de síntesis Web Audio para tonos metálicos de monedas y arpegios curativos.

---

### 7.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-bit y Tipografía Integral (`docs/DESIGN.md`)

- **Tipografía Retro 100% Integral (`Press Start 2P` / `.retro` para TODO):** Despliegue universal de la fuente pixelada en todos los elementos de la interfaz de bolsa e inventario (`PantallaInventario.tsx`) y del bazar mercantil (`PantallaTienda.tsx`):
  - Título principal («Bazar de Provisiones») con sombra de texto ortogonal (`drop-shadow-[1px_1px_0_#000]`).
  - Medidores de monedas de oro (`retro text-[8px] sm:text-[9px]`) con borde negro `border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/10` y conteo de artículos disponibles.
  - Indicador de ubicación actual con asentamiento en negrita y botones de navegación rápida apilados fluidamente (`flex-1 sm:flex-none`).
  - Nombres de artículos en envoltura flexible multilínea (`break-words`) erradicando `truncate`, badges de categoría enmarcadas en negro con sombra ortogonal, descripciones completas sin cortes artificiales, efectos numéricos (`+N HP`, `Bono Captura Nv.N`) y existencias en bolsa (`xN`).
  - Selector de lotes (`x1`, `x5`, `x10`), controles táctiles de ajuste fino (`+/-`) y desglose de precio unitario vs costo total en caja negra retro.
  - Títulos, descripciones, ficha del artículo, ajuste de lotes, balance proyectado dinámico y botones de acción del modal de confirmación.
- **Calibración Antiacortamiento y Cero Overflow:** Sustitución de `truncate` por envoltura multilínea elástica y eliminación absoluta de `line-clamp-2` con interlineado adaptado (`leading-relaxed`) y tamaños compactos (`text-[8px] sm:text-[9px]`, `text-[10px] sm:text-xs`), permitiendo lectura completa en cualquier resolución móvil.
- **Confinamiento Responsivo Móvil (360px–420px):** Contenedor principal delimitado con `w-full max-w-5xl mx-auto px-2 sm:px-4 overflow-x-hidden`. Cabecera mercantil elástica (`flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4`) y banner de localidad sin bazar enmarcado con `border-2 border-black shadow-[4px_4px_0_0_#000] bg-amber-500/10`.

#### B. Componentes Táctiles 8bitcn/ui y Hardening

- **Tarjetas de Artículos Mercantiles Retro-Brutalist:** Enmarcadas con alto relieve `border-2 border-black shadow-[4px_4px_0_0_#000] bg-card hover:shadow-[6px_6px_0_0_#000]`, contenedor de sprite con marco negro y relieve interior (`border-2 border-black bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]`), renderizado `.pixelated` con fallback SVG, selector de lotes con botones táctiles `border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none`, desglose económico en caja negra retro (`border-2 border-black bg-black/40 p-2 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.4)]`), y botón de compra a ancho completo con icono `ShoppingCart` y retroalimentación de estado (`Adquirir lote`, `Oro insuficiente`, `Bazar Inactivo`).
- **Modal de Confirmación de Adquisición Sellado (Dialog 8-bit Brutalist):** `DialogContent` hermético con `w-[calc(100vw-2rem)] sm:max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-card overflow-hidden p-4 sm:p-5`, ficha de producto con relieve, ajuste de unidades interactivo, desglose de balances financieros con código de color dinámico y prevención estricta de doble compra (`comprando`, `disabled={comprando || !resumenModal.puedeComprar}`, `aria-busy={comprando}`, spinner retro y leyenda `PROCESANDO...`).
- **Cumplimiento Estricto de la Regla R1:** Cero emojis unicode en controles y botones retro; iconografía SVG provista exclusivamente por Lucide (`Coins`, `Package`, `Store`, `ArrowLeft`, `MapPinOff`, `HeartPulse`, `Crosshair`, `Sparkles`, `ShoppingCart`, `Minus`, `Plus`, `Layers`, `Crown`).

#### C. Multimedia y Audio Retro Centralizado (`assets.ts`)

- **Síntesis Acústica Web Audio para Monedas (`monedas` / `compra`):** Doble pulso metálico en onda cuadrada (`square`: 987.77 Hz a 1318.51 Hz con decaimiento exponencial en 0.22 s), activado al formalizar compras en el bazar.
- **Síntesis Acústica para Curación (`curar` / `pocion`):** Arpegio regenerativo ascendente en onda triangular suave (`triangle`: 523.25 Hz -> 659.25 Hz -> 783.99 Hz en 0.26 s), activado al aplicar consumibles sobre criaturas.
- **Efectos Táctiles Adicionales:** Señalización acústica `seleccionar` en cambios de filtro, ajuste de lotes y apertura de diálogos, y `error` ante saldo insuficiente o acciones inválidas.

#### D. Reglas de Servidor, Seguridad S-4/S-6 y Transacciones

- **Catálogo Centralizado desde PostgreSQL (`GET /api/tienda`):** Eliminación del catálogo hardcodeado. El endpoint sirve `servicioDisponible` (según `ubicacionActual.servicios.includes('TIENDA')`), `saldoMonedas` y `cantidadEnInventario` de cada objeto para actualización inmediata en Front-End.
- **Cálculo Unilateral de Precios y Compra Atómica (`S-4`, `S-6`):** `TiendaService.comprar` calcula unilateralmente costoTotal = precioCompra \* cantidad desde PostgreSQL. Rechaza campos inyectados (`whitelist: true`, `forbidNonWhitelisted: true`) y cantidades fuera del rango 1..99 (`@Max(99)` en `ComprarDto`).
- **Bloqueo Pesimista por Fila de Personaje (`FOR UPDATE`):** Tanto `TiendaService.comprar` como `InventarioService.usarObjeto` ejecutan `SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE` al inicio de la transacción de Prisma, serializando estrictamente compras y consumos concurrentes.
- **Blindaje de Consumibles y Salvaguarda `INV-03`:** En `InventarioService.usarObjeto`:
  - Se valida estrictamente `objeto.tipo === 'CURACION'` (`400 OBJETO_NO_CONSUMIBLE`).
  - Se valida que la criatura aliada pertenezca al personaje y no posea salud llena (`400 SALUD_COMPLETA`), impidiendo desperdiciar pociones.
  - Se acota matemáticamente hpNuevo = min(hpMaximo, hpPrevio + efectoValor) sin sobrecuración, descontando o eliminando el registro de inventario al agotarse el stock.

---

### 7.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-inventario-tienda.spec.ts`):** 10 pruebas unitarias exhaustivas aprobadas al 100%:
  1. Inmutabilidad y filtrado correcto por categoría en `filtrarItemsPorCategoria`.
  2. Normalización y acotamiento de lotes en `[1, 99]` en `normalizarCantidadCompra`.
  3. Proyección reactiva de costos y saldo en `calcularResumenCompra` (`x1`, `x5`, `x10`).
  4. Salvaguarda `INV-03` y detección de salud llena en `calcularVistaPreviaCuracion`.
  5. Contratos tipados de `RespuestaCatalogoTienda`, `RespuestaInventario`, `RespuestaComprarTienda` y `RespuestaUsarItem`.
  6. Cumplimiento de Regla R1: lectura mecánica con `node:fs` de `PantallaInventario.tsx` confirmando 0 emojis unicode.
  7. Cumplimiento de Regla R1: lectura mecánica con `node:fs` de `PantallaTienda.tsx` confirmando 0 emojis unicode.
  8. Confirmación de soporte acústico nativo en `assets.ts` para `"monedas"`/`"compra"` y `"curar"`/`"pocion"`.
  9. Hardening, Ergonomía y Estética Retro-Brutalist (Inventario): Comprobación estática de marcos 8bitcn `border-2 border-black` y `border-4 border-black`, sombras ortogonales sólidas `shadow-[4px_4px_0_0_#000]` y `shadow-[8px_8px_0_0_#000]`, confinamiento `overflow-x-hidden`, hardening `aria-busy={enProceso}` y `disabled={usando || vista.yaSaludCompleta}`, y erradicación de `line-clamp` rígido.
  10. Hardening, Ergonomía y Estética Retro-Brutalist (Tienda): Comprobación estática de marcos 8bitcn `border-2 border-black` y `border-4 border-black`, sombras ortogonales sólidas `shadow-[4px_4px_0_0_#000]` y `shadow-[8px_8px_0_0_#000]`, confinamiento `overflow-x-hidden`, hardening `aria-busy={comprando}` y `disabled={comprando || !resumenModal.puedeComprar}`, y erradicación de `line-clamp` y `truncate` rígidos.
- **Suite Total Web (`pnpm --filter web test`):** 77 de 77 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test`):** 52 de 52 pruebas aprobadas (100% éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 2.83s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 80 archivos analizados.
- **Inspección Responsive y Anti-Overflow:** Cero desplazamiento horizontal en viewports móviles de 320 px a 420 px, legibilidad táctica íntegra y jerarquía retro-brutalista de alto contraste.

---

## 8. Sub-Fase 10h: Santuario de Curación de Equipo en Asentamiento (`PantallaCuracion.tsx`)

### 8.1 Diagnóstico Inicial y Auditoría Impeccable

Previa a la auditoría heurística Impeccable y la consolidación visual retro-brutalista de la Sub-Fase 10h, el módulo de restauración y la pantalla del Santuario de Curación presentaban deficiencias críticas a nivel de experiencia de usuario, diseño retro y arquitectura:

1. **Desplazamiento Horizontal en Pantallas Móviles (360px–420px):** El contenedor principal carecía de confinamiento elástico (`w-full max-w-4xl mx-auto px-2 sm:px-4 overflow-x-hidden`). En dispositivos móviles compactos (360px–420px), la barra de 5 métricas tácticas y los márgenes rígidos generaban scroll lateral involuntario.
2. **Acortamiento y Truncamiento Excesivo de Nombres y Apodos:** Empleo de clases `truncate` rígidas en los encabezados y apodos de las criaturas, mutilando la identidad táctica de compañeros con nombres largos o apodos personalizados.
3. **Disparidad Tipográfica (Falta de Fuente Retro Integral):** Presencia residual de fuentes sans y monospace estándar en la descripción narrativa del manantial sagrado (`font-sans`), en las métricas tácticas del equipo (`font-mono`), en las etiquetas de vitalidad y en los botones de retorno, rompiendo la inmersión 8-bit de Aethelgard.
4. **Falta de Marcos Retro-Brutalistas 8bitcn/ui y Sombras Sólidas:** El contenedor Hero y las tarjetas de combatientes empleaban bordes delgados genéricos (`border-primary/50`, `border-border/60`) y sombras difusas estándar (`shadow-lg`), desalineadas con la guía de estilo brutalista de Aethelgard (`border-4 border-black shadow-[6px_6px_0_0_#000]` y `border-2 border-black shadow-[4px_4px_0_0_#000]`).
5. **Condición de Carrera (TOCTOU) y Escrituras Redundantes en `CuracionService.restaurarEquipo`:** La transacción interactiva no serializaba la fila del personaje mediante bloqueo pesimista (`FOR UPDATE`), permitiendo que dobles clics concurrentes ejecutaran actualizaciones dobles y crearan entradas duplicadas en la tabla `historial`. Además, actualizaba indiscriminadamente a todas las criaturas aunque ya tuvieran salud completa.
6. **Respuesta Empobrecida en `POST /api/curacion/restaurar`:** El endpoint devolvía únicamente `{ mensaje, criaturasRestauradas: criaturasEquipo.length }`, informando el tamaño del equipo y no las criaturas sanadas. Omitía métricas cruciales como `criaturasCuradas`, `criaturasRevividas`, `hpTotalRestaurado`, `ubicacionNombre` y el arreglo `detalles: [{ criaturaId, nombre, hpPrevio, hpNuevo, hpMaximo, hpRestaurado, fueRevivida }]`.
7. **Ausencia de Orden Canónico e Inclusión de Especie:** `tx.criatura.findMany` omitía `orderBy: { ordenEquipo: 'asc' }` e `include: { especie: true }`, impidiendo conocer el nombre canónico de cada criatura restaurada en el servidor.
8. **Documentación Swagger Incompleta:** `CuracionController` declaraba únicamente `@ApiResponse({ status: 200 })`, omitiendo las respuestas de error de negocio `403 SERVICIO_NO_DISPONIBLE` y `404 PERSONAJE_NO_ENCONTRADO`.
9. **Carencia de Secuencia Cinemática de Bendición y Cifras Flotantes:** Al pulsar restaurar, la salud conmutaba instantáneamente en seco sin animación ni cifras flotantes `anim-curacion-flotante` (`+XX HP` / `¡REVIVIDA! +XX HP`).
10. **Anti-Patrón `<Link><Button/></Link>` y Falta de Hardening:** Enlaces anidados en botones y ausencia de `aria-busy={restaurando}` con feedback retro de bloqueo.

---

### 8.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-bit y Tipografía Integral (`docs/DESIGN.md`)

- **Tipografía Retro 100% Integral (`Press Start 2P` / `.retro` para TODO):** Aplicación universal de la tipografía pixelada en la totalidad de los elementos textuales de la interfaz:
  - Título principal («SANTUARIO DE CURACIÓN») con sombra de texto ortogonal (`drop-shadow-[2px_2px_0_#000]`).
  - Descripción narrativa completa del manantial sagrado en tipografía retro compacta con interlineado adaptado (`retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words text-center`).
  - Insignias temáticas superiores retro-brutalistas enmarcadas en negro: `SANTUARIO ANCESTRAL` (`Sparkles`) y `SERVICIO GRATUITO` (`ShieldCheck`).
  - Resumen táctico de 5 métricas: etiquetas (`TOTAL EQUIPO`, `PLENA SALUD`, `HERIDAS`, `DEBILITADAS`, `DÉFICIT TOTAL`) y valores numéricos en `.retro`.
  - Botón de restauración masiva (`RESTAURAR TODO EL EQUIPO`, `EQUIPO EN PLENA VITALIDAD`, `CANALIZANDO BENDICIÓN...`) y botón de navegación de retorno al asentamiento.
  - Título de sección («DESGLOSE TÁCTICO DEL EQUIPO»), nombres de criaturas, insignias de estado vital (`LÍDER`, `PLENA VITALIDAD`, `HERIDA`, `DEBILITADA / CAÍDA`), nivel, posición en escuadrón y medidores de vitalidad (`Vitalidad: HP / MaxHP HP (XX%)`).
- **Calibración Antiacortamiento y Cero Truncado en Móvil:** Erradicación de clases `truncate` rígidas en nombres y apodos; adopción de envoltura elástica multilínea (`break-words`) con interlineado fluido (`leading-relaxed`), permitiendo lectura clara y sin mutilaciones en cualquier ancho de pantalla.
- **Confinamiento Responsivo Móvil sin Overflow Horizontal (360px–420px):** Contenedor principal acotado con `w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 overflow-x-hidden`.
- **Rejilla Táctica de 5 Métricas Elástica:** Rejilla responsiva `grid-cols-2 sm:grid-cols-5 gap-2` dentro de caja táctil negra `border-2 border-black bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)]` donde la quinta métrica (`DÉFICIT TOTAL`) adopta `col-span-2 sm:col-span-1` para apilado natural en 360px sin forzar scroll horizontal.

#### B. Componentes Táctiles 8bitcn/ui Brutalist y Cinemática

- **Hero del Santuario Retro-Brutalist:** Marco exterior grueso `border-4 border-black shadow-[6px_6px_0_0_#000] bg-card overflow-hidden text-center`, banner panorámico con borde inferior negro `border-b-4 border-black bg-abismo`, paisaje WebP de zona con degradado y badges enmarcadas con `border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/85`.
- **Botón de Restauración Brutalista:** Botón principal de tamaño ampliado con marco `border-4 border-black shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000] hover:shadow-[8px_8px_0_0_#000]` y prevención de doble clic con `aria-busy={restaurando}` y leyenda retro `CANALIZANDO BENDICIÓN...`.
- **Tarjetas de Criaturas Retro-Brutalistas:**
  - Marco brutalista `rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] bg-card` con realce dorado para el líder (`border-amber-500/80 bg-amber-500/10`) y destello verde en bendición (`anim-curacion border-emerald-500`).
  - Vitrina de sprite pixel-art con marco negro y relieve interior hundido (`border-2 border-black bg-black/50 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]`), renderizado `.pixelated`, filtro `grayscale` si la criatura está debilitada y corona de líder (`Crown`).
  - Semáforo vital de 3 estados enmarcados en negro con sombra sólida: `PLENA VITALIDAD` (esmeralda), `HERIDA` (ámbar) y `DEBILITADA / CAÍDA` (carmesí).
  - Barra de salud `HealthBar` en variante retro empotrada con canal oscuro y contorno negro.
  - Cifra flotante de vitalidad o resurrección `anim-curacion-flotante` en verde esmeralda con cuádruple sombra ortogonal negra (`+XX HP` o `¡REVIVIDA! +XX HP`).
- **Cumplimiento Estricto de la Regla R1:** Cero emojis unicode en toda la pantalla; iconografía SVG provista exclusivamente por Lucide (`Heart`, `Sparkles`, `ShieldCheck`, `ArrowLeft`, `AlertCircle`, `Crown`, `HeartPulse`).

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

- **Pruebas Automatizadas Front-End (`apps/web/test/verificacion-curacion.spec.ts`):** 9 pruebas unitarias exhaustivas aprobadas al 100%:
  1. Clasificación estricta de los 3 estados vitales y etiquetas en español.
  2. Cálculo de deltas bajo `INV-03` y resurrección de criaturas caídas.
  3. Contratos tipados de `RespuestaRestaurar` y `DetalleCriaturaRestaurada`.
  4. Resolución de rutas WebP y placeholders para criaturas y zonas.
  5. Síntesis de fanfarria de santuario en `assets.ts`.
  6. Regla R1: 0 emojis unicode en `PantallaCuracion.tsx`.
  7. Accesibilidad: ausencia del anti-patrón `<Link><Button>`.
  8. Presencia de `aria-busy`, texto retro `CANALIZANDO BENDICIÓN...`, sprites pixelados y animaciones cinemáticas `anim-curacion`.
  9. Hardening, Ergonomía y Estética Retro-Brutalist: Confinamiento `overflow-x-hidden` y `max-w-4xl`, marcos brutalistas `border-4 border-black` y `border-2 border-black`, sombras sólidas ortogonales (`shadow-[6px_6px_0_0_#000]`, `shadow-[4px_4px_0_0_#000]`, `shadow-[2px_2px_0_0_#000]`), erradicación de `truncate` rígido, presencia de `break-words`, insignias temáticas e integración de `HealthBar`.
- **Suite Total Web (`pnpm --filter web test`):** 78 de 78 pruebas aprobadas (100% éxito).
- **Pruebas Backend y Reglas de Servidor (`pnpm --filter api test`):** 54 de 54 pruebas aprobadas (100% éxito), incluyendo validaciones de restauración atómica, resurrección, desglose de salud y rechazo en localidades no seguras en `apps/api/test/progreso-tienda.spec.ts`.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en Vite, empaquetado exitoso en 4.68s.
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 80 archivos analizados con `oxlint`.
- **Inspección Responsive:** Ausencia absoluta de desplazamiento horizontal y legibilidad íntegra en resoluciones móviles de 320 px, 360 px, 375 px y 420 px.

---

## 9. Sub-Fase 10i / 10l: Compendio de Criaturas, Bitácora Transversal y Salón de la Fama (`PantallaCatalogo.tsx`, `PantallaHistorial.tsx`, `PaginaCreditos.tsx`)

### 9.1 Diagnóstico Inicial y Auditoría Impeccable

Previo a esta subfase y a su consolidación retro-brutalista, la experiencia del jugador en las pantallas finales de consulta y compendio presentaba importantes cuellos de botella de red, fallas heurísticas y limitaciones ergonómicas:

1. **Cuello de botella $N+1$ de 26 peticiones HTTP en cascada en `PantallaCatalogo.tsx`:** Al ingresar al compendio o cambiar de tipo, el cliente invocaba `api.obtenerEspecies()` y de inmediato ejecutaba `Promise.all(res.especies.map(esp => api.obtenerEspecie(esp.slug)))`, disparando 26 peticiones en ráfaga cada vez.
2. **Apiñamiento y Falta de Separación Táctil en Botones de Acción:** Los botones de cabecera (`ACTUALIZAR`, `Asentamiento`) y la botonera de arquetipos (`ATACANTE`, `TANQUE`, `VELOZ`, etc.) disponían de márgenes insuficientes (`gap-1.5`), careciendo de sombras sólidas ortogonales y produciendo fricción en pantallas táctiles móviles.
3. **Desplazamiento Horizontal en Móvil (360px–420px):** El contenedor principal carecía de confinamiento con `overflow-x-hidden` y relleno responsivo, lo que ante variaciones de pantalla provocaba scroll horizontal involuntario.
4. **Acortamiento Excesivo de Nombres y Movimientos:** Clases `truncate` y `line-clamp` rígidas mutilaban los nombres de criaturas de varias palabras y los efectos de movimientos tácticos en dispositivos compactos.
5. **Inconsistencia Tipográfica:** Presencia de fuentes sans-serif estándar en subtítulos, buscadores, selectores, estadísticas base y textos del modal de inspección, disonando con la estética 8-bit de Aethelgard.
6. **Módulo `CriaturasModule` vacío en el servidor:** `apps/api/src/modulos/criaturas/criaturas.module.ts` carecía de controlador y servicio, delegando de forma improvisada o incompleta el acceso a los datos de especies.
7. **Desalineación y falta de categorización canónica en `HistorialService`:** Aunque los distintos servicios del juego registraban eventos con tipos heterogéneos, `HistorialService` no exponía la categoría táctica canónica ni permitía filtrado por categoría en servidor.
8. **Ausencia total de sprites pixel-art (`obtenerImagenCriatura`) en `PantallaCatalogo.tsx`:** Las tarjetas del catálogo eran contenedores de texto plano sin sprites `.pixelated` ni fallback a SVG.
9. **Selector de tipos incompleto con texto en inglés y sin buscador interactivo:** El selector solo listaba 3 de los 6 tipos con etiquetas en inglés ("Beast", "Monstrosity"), violando R1.
10. **Diseño incompleto en `PaginaCreditos.tsx`:** Carecía de navegación de retorno al Asentamiento (`boton-volver-inicio-creditos`), no destacaba al equipo ni el homenaje académico al Ingeniero Claudio, y omitía fanfarria sonora.

### 9.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-bit y Jerarquía Visual (`docs/DESIGN.md`)

- **Compendio de Criaturas Retro-Brutalist:** Cabecera ceremonial con título en `Press Start 2P` (`COMPENDIO DE CRIATURAS`), insignia `30 ESPECIES SRD 5.2` con icono `BookOpen`, barra de avistamiento biológico (conteo de registradas, en vista, legendarias, especiales y tipos biológicos), y **vitrina central destacada de sprites pixel-art** de `h-36 sm:h-40` con fondo oscuro pixelado, bisel interior `border-y-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)]`, micro-interacción hover con escala suave (`group-hover:scale-110`), sombras retro duras (`obtenerImagenCriatura`, `.pixelated`, `manejarErrorImagen`) y badges ortogonales.
- **Tipografía Retro 100% Integral (`Press Start 2P` / `.retro`):** Unificación tipográfica radical en todos los elementos textuales de `PantallaCatalogo.tsx`: títulos, subtítulos, métricas, inputs de búsqueda, selector biológico, botones de arquetipo, encabezados de hábitat, badges de tipo y elemento, estadísticas base (`HP`, `ATQ`, `DEF`, `VEL`), CR, Tasa de Captura, lore, barras de progreso comparativas sobre 100 y lista de movimientos tácticos M1..M4. Calibración ergonómica en `text-[8px] sm:text-[9px]` y `text-[9px] sm:text-[10px]` con `leading-relaxed` y erradicación de `truncate` rígidos mediante envoltura multilínea `break-words`.
- **Marcos 8bitcn/ui Brutalistas y Sombras Ortogonales:** Enmarcado general con `border-2 border-black` y sombras duras `shadow-[4px_4px_0_0_#000]` y `shadow-[6px_6px_0_0_#000]`. Realce distintivo con marco dorado y animación pulsante `.anim-halo-legendario border-4 border-amber-400 bg-amber-950/25` junto a la corona `Crown` para especies legendarias.
- **Separación Táctil y Desahogada en Botones de Acción:**
  - Botones de cabecera (`ACTUALIZAR`, `Asentamiento`) con espaciado amplio `gap-2.5 sm:gap-3` y respuesta háptica retro `active:translate-y-0.5 active:shadow-none`.
  - Filtros rápidos de arquetipo (`TODOS`, `ATACANTE`, `TANQUE`, `VELOZ`, `EQUILIBRADO`, `ESPECIALES`, `LEGENDARIAS`) con distribución elástica `gap-2 sm:gap-2.5 flex-wrap` y borde negro de alto contraste.
  - Botón de limpiar filtros separado con margen autónomo `self-end sm:self-auto` y marco retro.
  - Botón de tarjeta (`INSPECCIONAR FICHA`) con holgura superior `pt-1 sm:pt-2` y marco `border-2 border-black shadow-[2px_2px_0_0_#000]`.
  - Botón de cierre en modal táctico con separación superior clara.
- **Ergonomía Móvil y Cero Overflow (360px–420px):**
  - Confinamiento estricto del contenedor raíz con `w-full max-w-5xl mx-auto px-2 sm:px-4 overflow-x-hidden`.
  - Barra de resumen de 5 métricas responsiva (`grid-cols-2 sm:grid-cols-5 gap-2`) con asignación `col-span-2 sm:col-span-1` para el 5º elemento en móvil.
  - Apilado vertical responsivo del buscador y selector de tipo (`flex-col sm:flex-row gap-2.5`).
- **Modal Hermético de Inspección Táctica Detallada:** Componente `Dialog` de 8bitcn/ui sellado contra overflow (`w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] border-4 border-black shadow-[8px_8px_0_0_#000] bg-card overflow-hidden p-0 flex flex-col rounded-none`), cabecera con botón `X` de alto contraste, scroll interno suave, barras sobre 100 y desglose íntegro de movimientos tácticos (M1..M4) sin truncamiento.
- **Bitácora de Crónicas Retro:** Tarjetas de crónicas con sello de tiempo, insignia con iconografía SVG de Lucide diferenciada por categoría y descripción de alto contraste WCAG AA.
- **Salón de la Fama y Ending RPG 16-bit (`PaginaCreditos.tsx`):** Cabecera ceremonial con marco dorado (`border-amber-500/80 bg-bastion`), insignias `SALÓN DE LA FAMA` y `ISC-305 · III PAC 2026`, galería de sprites pixel-art, Homenaje Académico al **Ingeniero Claudio**, atribución legal literal del `SRD 5.2` (CC BY 4.0), licencia MIT de `8bitcn/ui` y retorno con sonido de victoria.

#### B. Componentes Táctiles 8bitcn/ui y Hardening

- **Erradicación del Anti-Patrón `<Link><Button>` y Hardening `aria-busy`:** Reemplazo de enlaces anidados por navegación imperativa con `useNavigate` e integración de estados `aria-busy` en botones de recarga.
- **Restricción R1 Estricta:** Cero emojis unicode; empleo exclusivo de iconos SVG vectoriales de Lucide (`BookOpen`, `ArrowLeft`, `RefreshCw`, `Search`, `Shield`, `Swords`, `Zap`, `Scale`, `Sparkles`, `Crown`, `MapPin`, `Eye`, `RotateCcw`, `X`, `Filter`, `ChevronDown`).

#### C. Integración Multimedia y Audio Retro Centralizado (`assets.ts`)

- **Síntesis Web Audio:** Integración del sintetizador 8-bit para feedback táctil en clics (`"click"`), inspección de fichas (`"seleccionar"`), retorno victorioso (`"victoria"`) y fanfarria triunfal ceremonial (`"fanfarria"`).
- **Gestión de Assets con Fallback Seguro:** Uso universal de `obtenerImagenCriatura` y `manejarErrorImagen` con degradación a vectoriales SVG locales en caso de ausencia de sprites WebP.

#### D. Reglas de Servidor, Optimización de Consultas y Erradicación de N+1

- **`CriaturasService` y `CriaturasController` (`M-CRI`):** Implementación de endpoints públicos `GET /api/especies` y `GET /api/especies/:slug` en `O(1)` para las 30 especies canónicas con datos embebidos, erradicando por completo el patrón $N+1$.
- **Normalización de Bitácora en `HistorialService` (`M-HIS`):** Función pura `normalizarCategoriaHistorial`, paginación y filtrado en servidor.

### 9.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Backend (`apps/api/test/catalogo-historial.spec.ts`):** 6 pruebas unitarias verificando erradicación de $N+1$, filtros biológicos, detalle por slug, error 404, arquetipos y categorías.
- **Suite Total Backend (`pnpm --filter api test`):** 60 de 60 pruebas aprobadas (100% de éxito).
- **Pruebas Frontend (`apps/web/test/verificacion-historial-catalogo.spec.ts`):** 9 pruebas unitarias aprobadas, incluyendo auditoría estática de marcos brutalistas 8bitcn, sombras sólidas ortogonales, tipografía retro integral, separación táctil y confinamiento sin overflow horizontal.
- **Suite Total Frontend (`pnpm --filter web test`):** 79 de 79 pruebas aprobadas (100% de éxito).
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en modo estricto en Vite (construcción limpia en 2.2s).
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 80 archivos.
- **Inspección Responsive:** Verificación de ergonomía táctil y ausencia total de overflow horizontal en anchos móviles de 320px a 420px.

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

Con la culminación de las Subfases 10k y 10l, se da por **completada y auditada en su totalidad la Fase 10** del proyecto _Aethelgard: Sendas y Criaturas_, consolidando el hito **AV5 Definitivo (Entrega Final de UX Retro, Bestiario Canónico, Motor Táctico y Combate Completo Full-Stack)**.

### Tabla Resumen Consolidada de Subfases de la Fase 10

| Subfase | Alcance / Vistas                                                                                          | Mejoras Principales                                                                                                                                                                                                                                                                                       | Pruebas Automatizadas      | Estado        |
| :------ | :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- | :------------ |
| **10a** | Autenticación (`PantallaIngreso.tsx`)                                                                     | Validación Zod en tiempo real, estética CRT/VGA, cero emojis y audio retro.                                                                                                                                                                                                                               | 3 tests web                | ✅ Completada |
| **10b** | Creación Personaje (`PantallaCrearPersonaje.tsx`)                                                         | Selección táctica de iniciales con sprites, escape hatch retro con LogOut, desbloqueo de RutaPublica y guard contra tokens huérfanos.                                                                                                                                                                     | 6 tests web                | ✅ Completada |
| **10c** | Hub Localidad (`PantallaHubUbicacion.tsx`)                                                                | Cuadrícula de 8 servicios, ambientación dinámica WebP y navegación fluida.                                                                                                                                                                                                                                | 4 tests web                | ✅ Completada |
| **10d** | Exploración (`PantallaExploracion.tsx`)                                                                   | Cinemática de niebla, selector ponderado en servidor e historial de incursión.                                                                                                                                                                                                                            | 6 tests web                | ✅ Completada |
| **10e** | Combate (`PantallaCombate.tsx`)                                                                           | Bitácora de combate por turnos, animaciones CSS, cálculo de daño servidor INV-04.                                                                                                                                                                                                                         | 4 tests web                | ✅ Completada |
| **10f** | Equipo y Almacén (`PantallaEquipo.tsx`, `PantallaAlmacen.tsx`)                                            | Reordenamiento de líder, regla A-6, transferencia atómica con bloqueo pesimista.                                                                                                                                                                                                                          | 10 tests web + 8 tests api | ✅ Completada |
| **10g** | Inventario y Tienda (`PantallaInventario.tsx`, `PantallaTienda.tsx`)                                      | Filtros de objetos, compras por lotes (x1, x5, x10) en servidor y uso medicinal.                                                                                                                                                                                                                          | 8 tests web + 12 tests api | ✅ Completada |
| **10h** | Santuario de Curación (`PantallaCuracion.tsx`)                                                            | Restauración atómica INV-03 con FOR UPDATE, resurrección de caídas y cinemática.                                                                                                                                                                                                                          | 8 tests web + 6 tests api  | ✅ Completada |
| **10i** | Compendio, Bitácora y Créditos (`PantallaCatalogo.tsx`, `PantallaHistorial.tsx`, `PaginaCreditos.tsx`)    | Erradicación N+1 en catálogo, modal de inspección sellado, crónicas categorizadas con Lucide, Salón de la Fama y homenaje al Ing. Claudio.                                                                                                                                                                | 8 tests web + 6 tests api  | ✅ Completada |
| **10j** | Bestiario Canónico y Legendarias (`bestiario-canonico.ts`, `PantallaCatalogo.tsx`, `PantallaCombate.tsx`) | 30 especies canónicas soberanas, jerarquía J-1 a J-4, consagración de Behir y Remorhaz como Legendarias, sets de 4 movimientos M1..M4, bloqueo de Furia y tablas INV-01 al 100%.                                                                                                                          | 8 tests web + 11 tests api | ✅ Completada |
| **10k** | Motor Elemental y Estados (`motor-combate.ts`, `combate.service.ts`)                                      | Matriz inmutable 6×6 de afinidades, daño elemental INV-04, 6 estados alterados, DoT no letal D-4, inmunidad de 1 turno D-6, acumulador de resonancia, sinergia de captura x1.25 y bloqueo pesimista contra concurrencia.                                                                                  | 36 tests api               | ✅ Completada |
| **10l** | Experiencia Táctica y Catálogo (`PantallaCombate.tsx`, `PantallaCatalogo.tsx`, `PantallaExploracion.tsx`) | Panel interactivo de 4 comandos, chips de efectividad, barra de 10 bloques de Resonancia, botón «Desatar Insignia», cerrojo useRef, turnoEsperado y manejo 409, Web Audio sintetizado (eficaz, resistido, dot, furia), agrupación por 6 hábitats, halos legendarios y avistamiento mítico en exploración. | 3 tests web                | ✅ Completada |

### Métricas Finales de Calidad del Proyecto

- **Pruebas Unitarias de Back-End (NestJS):** 107 pruebas automatizadas con 100% de aprobación (`pnpm --filter api test`).
- **Pruebas Unitarias de Front-End (React / Vite):** 63 pruebas automatizadas con 100% de aprobación (`pnpm --filter web test`).
- **Total de Pruebas Automatizadas:** **170 pruebas unitarias libres de regresiones**.
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
  - **Decisión D-6 (Inmunidad Temporal de 1 Turno):** Al expirar un estado natural o por escudo agotado, la criatura adquiere inmunidad al mismo código de estado durante el turno siguiente para prevenir aturdimientos permanentes (_stunlock_).
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

---

## 14. Sub-Fase 10l: Experiencia Táctica de Combate, Catálogo por Zonas y Alerta Legendaria (`PantallaCombate.tsx`, `PantallaCatalogo.tsx`, `PantallaExploracion.tsx`)

### 14.1 Diagnóstico Inicial y Auditoría Impeccable

Previo a esta intervención, la experiencia de combate y compendio presentaba una brecha entre la riqueza de los motores de servidor (Fase 10k) y la retroalimentación visual/acústica del jugador en el cliente web:

1. **Invisibilidad del Medidor de Resonancia y M4 Desconectado:** El movimiento insignia (Slot 4 / Furia) permanecía bloqueado de forma estática en la UI (`Furia (Bloqueado)`) sin que el jugador pudiera monitorear visualmente el porcentaje de Resonancia acumulada ($0-100\%$) ni anticipar su momento de activación.
2. **Desincronización Visual de Salud tras Daño Continuo (DoT):** Al aplicarse efectos de estado en fin de turno (`efectosFinDeTurno`), la interfaz actualizaba el HP aliada/rival basándose en el daño del ataque directo pero postergaba la deducción del DoT, dejando barras de vida desfasadas hasta la siguiente recarga forzada de pantalla.
3. **Vulnerabilidad a Doble Clic y Concurrencia Silenciosa:** Si el explorador pulsaba rápidamente los botones de ataque antes de finalizar la cinemática o ante fluctuaciones de latencia, se emitían peticiones concurrentes sin adjuntar el número de turno esperado (`turnoEsperado`), provocando anomalías o rechazos no explicados en lugar de capturar el error `409 TURNO_DESACTUALIZADO`.
4. **Animaciones Parásitas ante Pérdida de Turno:** Cuando una criatura perdía su turno por parálisis o petrificación (`perdioTurno: true`), el cliente reproducía animaciones parásitas de impacto (`-0`), desconcertando al jugador respecto al efecto real del aturdimiento.
5. **Triplicación de la Lógica de Fin de Turno:** Las pantallas de combate duplicaban la resolución de contraataques rivales y DoT en tres manejadores inconexos (`handleAtacar`, `ejecutarCaptura` y `handleHuir`), elevando la deuda técnica y el riesgo de regresiones.
6. **Compendio Plano de Especies y Desalineación Geográfica:** En `PantallaCatalogo.tsx`, las 30 criaturas se mostraban en una cuadrícula plana continua sin agrupación por zonas de hábitat biológico. Asimismo, se identificó una inversión nominal en la semilla de datos entre la Zona 2 («Bosque Susurrante») y la Zona 3 («Riberas del Lago Espejo»), contradiciendo la presencia de especies acuáticas como `cangrejo-abismal` en ZON-02.
7. **Ausencia de Clímax Cinemático en Encuentros Legendarios:** En `PantallaExploracion.tsx`, toparse con criaturas legendarias como _Behir_ o _Remorhaz_ utilizaba el mismo modal y sonido de alerta que una bestia común de bajo nivel, privando al juego de la emoción retro del avistamiento de un titán mítico.

---

### 14.2 Mejoras Implementadas

#### A. Identidad Retro Aethelgard y Ergonomía Visual (`DESIGN.md`)

- **Selector de 4 Movimientos con Chips Dinámicos de Efectividad:** Rediseño del panel de combate con botones retro biselados para cada slot (`M1`, `M2`, `M3`, `M4`). Integración de chips de efectividad táctica en tiempo real: `[¡EFICAZ!]` en verde esmeralda brillante (`text-emerald-400 bg-emerald-950/40 border-emerald-500/70`) ante ventaja elemental ($1.5\times$), y `[RESISTIDO]` en rojo bermellón (`text-red-400 bg-red-950/40 border-red-500/70`) ante desventaja elemental ($0.75\times$).
- **Medidor Retro Segmentado de 10 Bloques de Resonancia:** Creación del componente `BarraResonancia` en `PanelTactico.tsx`, representando la resonancia mediante 10 bloques discretos retro (`floor(resonancia / 10)`). Al llegar al 100% de resonancia (10 bloques), la barra adquiere la animación pulsante ámbar `.anim-pulso-resonancia`, el slot 4 se desbloquea con iluminación dorada y emerge el botón heroico «Desatar Insignia».
- **Insignias Visuales de Estados Alterados:** Creación del componente `InsigniasEstado` con iconos vectoriales SVG de Lucide estrictos bajo la Regla R1 (cero emojis unicode): `Flame` para Quemadura, `Skull` para Veneno, `Snowflake` para Escarcha, `Zap` para Parálisis, `Mountain` para Petrificación y `Shield` para Bastión. Despliega el nombre y turnos restantes (`ej. Quemadura (2)`), renderizándose en las placas de ambos combatientes.
- **Catálogo Agrupado por 6 Hábitats Geográficos:** En `PantallaCatalogo.tsx`, se reestructuró la vista en 6 secciones temáticas `<section aria-labelledby>` utilizando la función pura `agruparEspeciesPorZona`, con badges de región (`ZON-01` a `ZON-06`), encabezados retro, recuento de especies y etiqueta dorada de «Hábitat Legendario».
- **Consagración Visual de Criaturas Legendarias:** Las dos especies legendarias (_Behir del Abismo Ciego_ en ZON-05 y _Remorhaz del Glaciar Eterno_ en ZON-06) lucen el halo respirante dorado `.anim-halo-legendario`, borde ámbar pixelado `border-amber-400` y una corona dorada `Crown` junto a su nombre tanto en la tarjeta como en la ficha del modal táctico.
- **Cinemática de Avistamiento Legendario:** En `PantallaExploracion.tsx`, el encuentro con una bestia legendaria transforma el diálogo con borde dorado palpitante, título `¡AVISTAMIENTO LEGENDARIO!`, corona `Crown` animada, sonido triunfal `fanfarria` y notificación toast de alta prioridad.

#### B. Componentes 8bitcn/ui, Hardening contra Concurrencia y Accesibilidad

- **Cerrojo Síncrono `useRef` contra Doble Clic:** Implementación de `peticionEnVueloRef = useRef(false)` en `PantallaCombate.tsx`, garantizando que clics repetidos o simultáneos sean bloqueados en el mismo milisegundo antes de que React re-renderice el estado `procesandoAccion`.
- **Integridad de Turno con `turnoEsperado` y Captura de 409:** El cliente adjunta `turnoEsperado: turno` en cada comando de combate (`atacar`, `capturar`, `huir`). Si ocurre una condición de carrera, el cliente captura el error `409 TURNO_DESACTUALIZADO`, muestra una alerta de resincronización y refresca limpiamente el estado sin desarmar la arena.
- **Unificación de Resolución de Ronda (`reproducirContraataqueYDoT`):** Se concentró la animación del contraataque rival, el reporte de estados, el relevo de aliada debilitada y la aplicación del daño continuo DoT en una única rutina compartida, asegurando que la salud final se actualice fidedignamente tras el DoT.
- **Soporte de Movimiento Reducido (`prefers-reduced-motion`):** En `index.css`, se definió el bloque `@media (prefers-reduced-motion: reduce)` que neutraliza las animaciones de pulso de resonancia, halos legendarios y parpadeos de turno para cumplir las directrices de accesibilidad WCAG.
- **Ergonomía Responsiva Impeccable (320 px):** Verificación exhaustiva de diseño en viewport móvil estrecho (320 px a 360 px) sin desbordes horizontales ni recortes de texto.

#### C. Multimedia y Síntesis Web Audio Retro Centralizada (`assets.ts`)

- **Síntesis Procedural de Audio 8-bit:**
  - `reproducirAudio("eficaz")`: Trino ascendente en quinta justa retro con oscilador triangular y modulación armónica brillante.
  - `reproducirAudio("resistido")`: Doble pulso amortiguado en frecuencias graves ($110-80\text{ Hz}$) con onda sinusoidal y decaimiento rápido.
  - `reproducirAudio("dot")`: Ráfaga estocástica de ruido blanco sintetizado directamente en buffer mono, con filtrado paso-banda y cierre limpio del contexto para evitar fugas de memoria.
  - `reproducirAudio("furia")`: Barrido épico multifrecuencia con ondas en diente de sierra ($180-600\text{ Hz}$) que emula la activación de un poder supremo de 16 bits.
- **Sonorización Dinámica de Impacto:** En combate, el impacto acústico se deriva dinámicamente según la afinidad mediante `sonidoDeGolpe(efectividad)`.

#### D. Reglas de Servidor, Prisma y Contratos Autoritativos

- **Corrección de Semilla de Datos de Zonas (Decisión D-1):** En `apps/api/prisma/seed.ts`, se intercambiaron los nombres y descripciones de `ZON-02` («Riberas del Lago Espejo») y `ZON-03` («Bosque Susurrante») alineándolos fidedignamente con sus biomas y especies acuáticas/forestales.
- **Ampliación Aditiva de Contratos sin Ruptura de Esquema:**
  - `CriaturasService.obtenerEspecies` y `obtenerEspeciePorSlug` exponen `zona: { id, nombre } | null` resolviendo la relación desde `apariciones.zona` con respaldo determinista en `TABLAS_APARICION`.
  - `ExploracionService.explorar` expone `esLegendaria: boolean` en `encuentro.especie`.
  - `EncuentrosService.obtenerEncuentroActivo` expone `esLegendaria: boolean` en `criaturaRival` y `estadoAplicado: CodigoEstado | null` en cada slot de movimiento aliado.
  - Los DTOs de combate (`AtacarDto`, `CapturarDto`, `HuirDto`) admiten de forma opcional `turnoEsperado?: number`.

---

### 14.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Unitarias de Back-End (`pnpm --filter api test`):**
  - **107 de 107 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Verificación exhaustiva de motores de combate, afinidades elementales, estados alterados, invariantes INV-01 a INV-05, compras por lotes, transferencias de almacén y persistencia de resonancia.
- **Pruebas Unitarias de Front-End (`pnpm --filter web test`):**
  - **63 de 63 pruebas aprobadas** (100% de éxito, cero regresiones).
  - Incorporación de la suite minimalista `apps/web/test/verificacion-combate-tactico.spec.ts` (55 líneas) validando:
    1. Renderizado de 4 slots tácticos y desbloqueo de M4 exclusivamente con 100 de Resonancia.
    2. Insignias de estados activos con icono Lucide, etiqueta en español y conteo de turnos.
    3. Agrupación por zonas de hábitat y preservación de la condición legendaria en _Behir_ y _Remorhaz_.
- **Compilación de Producción (`pnpm --filter web build`):**
  - **0 errores** TypeScript en modo estricto en Vite (construcción completada en 1.78s).
- **Linter de Front-End (`pnpm --filter web lint`):**
  - **0 errores** en 79 archivos analizados bajo 116 reglas de código.
- **Regla R1 Estricta:** 100% de interfaces de usuario, botones y controles libres de emojis unicode (uso universal de Lucide SVG).
- **Regla R2 Estricta:** Commits atómicos en la rama `funcionalidad/fase-10l-ux-combate-tactico-catalogo` con formato semántico en español.

---

### 14.4 Cobertura Integral de Efectos en Combate y Badges Tácticos (Decisión D-12)

- **Diagnóstico y Auditoría:** Se identificó que la base de datos y el bestiario contienen exactamente 51 efectos únicos asociados a los movimientos de las 30 criaturas. Se requería garantizar que absolutamente todos ellos produjeran impacto mecánico tangible tanto en el servidor como en el cliente visual.
- **Mapeo Autoritativo Exhaustivo en Backend (`motor-combate.ts`):**
  1. Se expandió `EFECTO_A_ESTADO` a 40 claves que aplican formalmente los 6 estados canónicos (`QUEMADURA`, `VENENO`, `ESCARCHA`, `PARALISIS`, `PETRIFICACION`, `BASTION`), contextualizando mensajes retro específicos para variantes protectoras (`ESPINAS`, `RETRIBUCION`, `BARRERA`, `FORTALEZA`, `BLOQUEO`, `INVISIBILIDAD`, `DESFASADO`, `DEF_UP`, `EVASION_UP`).
  2. Se implementaron las 11 mecánicas tácticas instantáneas restantes en `ejecutarTurnoJugador` y `ejecutarTurnoRival`:
     - `CRITICO` ($1.35\times$) y `EJECUCION` ($1.50\times$).
     - `DRENAJE`: Recuperación del $30\,\%$ del daño causado sin exceder `hpMaximo` (INV-03).
     - `REGENERACION`: Curación del $20\,\%$ de salud vital (INV-03).
     - `PURIFICACION` / `LUZ`: Disipación de estados negativos y restauración del $15\,\%$ de salud.
     - `ATQ_UP` ($1.20\times$), `DEF_DOWN` ($1.25\times$), `ATQ_DOWN` ($0.85\times$), `EMPUJE` ($1.15\times$).
     - `VEL_UP`: Aceleración táctica autoritativa que otorga $+15\,\%$ de Resonancia táctica inmediata al atacante e incrementa el daño en un $+10\,\%$ ($1.10\times$).
- **Visualización Táctica con Badges Retro y Reconciliación en Front-End (`combate-tactico.ts` y `PantallaCombate.tsx`):**
  - Mapeo determinista en `TABLA_BADGES_EFECTOS` de las 51 claves con estilo retro pixelado, tipografía monoespaciada e iconos SVG temáticos de Lucide (`Flame`, `Skull`, `Snowflake`, `Zap`, `ShieldAlert`, `Shield`, `Swords`, `HeartPulse`, `Sparkles`, `ChevronsUp`, `ChevronsDown`).
  - Renderizado contextual en movimientos activos (junto al chip de efectividad elemental) y en movimientos bloqueados del slot 4 (anticipando el efecto al alcanzar el $100\,\%$ de Resonancia).
  - Enriquecimiento accesible de atributos `aria-label` en la botonera de combate.
  - Sincronización en tiempo real durante la animación de impacto (`animarImpactoJugador`): la barra de salud aliada, la Resonancia y las insignias de estado se actualizan inmediatamente al resolver movimientos de curación (`DRENAJE`, `REGENERACION`, `PURIFICACION`, `LUZ`) o aceleración (`VEL_UP`), eliminando cualquier desfase perceptual antes del contraataque rival.
- **Certificación de Calidad:**
  - **115 de 115 pruebas aprobadas** en backend (`pnpm --filter api test`), incluyendo guardas de cobertura universal de los 51 efectos y prueba específica de `VEL_UP`.
  - **64 de 64 pruebas aprobadas** en frontend (`pnpm --filter web test`).
  - **0 antipatrones** en auditoría estática con la herramienta Impeccable.

---

## 15. Sub-Fase 10e: Rediseño Visual de Combate Móvil Impeccable (Zero-Scroll, Arena Diagonal JRPG, Consola Contextual y Estética Retro-Brutalist 8-Bit)

### 15.1 Diagnóstico Inicial y Auditoría Heurística Impeccable

Tras la estabilización mecánica de la Fase 10l, se realizó una auditoría visual y ergonómica exhaustiva de `PantallaCombate.tsx` con la skill `impeccable` y los estándares de `docs/DESIGN.md`, identificando los siguientes aspectos críticos:

1. **Inconsistencia Tipográfica Híbrida (`font-mono` / `font-sans` vs `.retro`):** Existía disparidad en la presentación de datos de combate: los niveles (`Lv.X`), estadísticas numéricas de vitalidad (`HP XX/YY`), medidores de Resonancia y EXP, nombres de movimientos, etiquetas de efectividad, descripciones de estado y botones de modales utilizaban `font-mono` o `font-sans`, rompiendo la inmersión retro de consola RPG de 8-bit/16-bit.
2. **Desplazamiento Horizontal y Truncamiento en Móvil (360px–420px):** En pantallas reducidas, las placas HUD de combate (aliado y rival) rozaban el límite del viewport, y el uso de `truncate` estricto en nombres y badges provocaba amputaciones textuales abruptas en resoluciones móviles. Asimismo, se requería garantizar `overflow-x-hidden` en el contenedor principal de combate para evitar scroll horizontal espurio.
3. **Falta de Separación y Ergonomía en Botones de Acción:**
   - En la consola principal (`ROOT`), los botones requerían una separación táctil más holgada (`gap-2.5 sm:gap-3`) y alturas confortables (48px–56px) para evitar pulsaciones erróneas con el pulgar.
   - En el submenú de movimientos (`ATTACK`), las ranuras M1 a M4 necesitaban mayor espacio frente al botón de retorno («Volver»).
   - En los modales y diálogos cinemáticos (Victoria, Captura, Derrota, Huida y Pausa), los botones de acción estaban demasiado juntos (`gap-2`), exigiendo una separación desahogada de al menos `gap-3 sm:gap-4`.
4. **Falta de Viewport Fijo (Zero-Scroll):** La vista dependía originalmente del contenedor global con barras web redundantes, forzando scroll vertical en dispositivos móviles y diluyendo la inmersión del jugador.
5. **Hardening y Cinemáticas:** Necesidad de blindar el combate contra doble clic mediante cerrojo síncrono `cerrojoAccion.current`, estado `procesandoAccion`, `aria-busy={procesandoAccion}` y desactivación física de controles, asegurando al mismo tiempo animaciones fluidas de sacudida y daño flotante sin generar barras de desplazamiento horizontales.

---

### 15.2 Mejoras Implementadas

#### A. Tipografía Retro Integral (`Press Start 2P` / `.retro` en Toda la Pantalla)

- **Consolidación Tipográfica Absoluta:** Se erradicó el uso de `font-mono` y `font-sans` en todos los controles y datos de combate, adoptando la tipografía pixelada `Press Start 2P` (`.retro`) en:
  - **Indicador Superior de Turno:** Pastilla central ornada con marco dorado (`◆ TURNO X: TU TURNO ◆` / `TURNO ENEMIGO`) con clases `retro text-[9px] sm:text-[11px] font-bold text-[#ffd700]`.
  - **Placas HUD de Combate:** Nombres de criaturas aliada y rival con `retro text-[9px] sm:text-[10px]`, niveles formateados en español retro (`NV.{rival.nivel}` y `NV.{aliado.nivel}` con `retro text-[8px] sm:text-[9px]`), etiquetas numéricas de salud (`HP` y `XX/YY HP` en `retro`), medidor de Resonancia (`RES.` y `XX%` en `retro`), y barra de EXP (`EXP` y `XX%` en `retro`).
  - **Insignias de Efecto y Estados Alterados:** Badges temáticos de afinidad elemental (`[{FUEGO}]`, `[{AGUA}]`, etc.) y estados activos (`[{QUEMADURA}]`, `[{PARÁLISIS}]`, etc.) renderizados en tipografía pixelada `retro text-[7px] sm:text-[8px]`.
  - **Cifras Flotantes de Daño y Curación:** Daño recibido (`-{dano}`) y curación (`+{curacion} HP`) flotantes con sombra dura de alto contraste (`drop-shadow-[2px_2px_0_#000] retro text-xs sm:text-sm`).
  - **Ticker y Drawer de Bitácora:** Ticker colapsado de 1 sola línea con tipografía retro (`retro text-[9px] sm:text-[10px]`) y hoja expandible (_bottom sheet_) con cronología completa estilizada en `retro text-[9px] sm:text-[10px]`.
  - **Botonera Contextual Arcade:** Comandos de consola (`ATACAR`, `USAR OBJETO`, `CAMBIAR`, `CAPTURAR`, `HUIR`) con tipografía retro `text-[10px] sm:text-xs`.
  - **Submenú de Movimientos Tácticos:** Ranuras (`M1` a `M4`), nombres de movimientos, potencia (`Pot. {poder}`), chips de efectividad (`¡EFICAZ!`, `RESISTIDO`), badges de efectos mecánicos y leyenda de bloqueo de Furia (`Requiere Resonancia 100 %`).
  - **Submenús de Objetos, Relevo y Captura:** Listados de consumibles, equipo y talismanes completamente renderizados en tipografía retro.
  - **Modales y Diálogos Cinemáticos:** Textos de Pausa, Huida, Victoria (con desglose de XP ganada, monedas obtenidas y nivel), Captura y Derrota renderizados íntegramente en `.retro`.

#### B. Confinamiento Móvil y Cero Desbordamiento Horizontal (360px–420px)

- **Contenedor Principal Blindado:** Estructura fija `h-full h-[100dvh] w-full max-w-5xl mx-auto flex flex-col justify-between overflow-hidden overflow-x-hidden select-none bg-[#090d16] border-x-0 md:border-x-4 border-black shadow-[6px_6px_0_0_#000]`.
- **Ancho Fluido en Placas HUD:** Calibración a `max-w-[210px] sm:max-w-[240px]` con tamaños de texto compactos (`text-[8px]` a `text-[10px]`), garantizando que en dispositivos estrechos (360px) el HUD del rival y del aliado coexistan holgadamente con los sprites sin producir solapamientos ni desbordamientos.
- **Cuadrícula Elástica de Movimientos:** En modo móvil, los 4 movimientos tácticos se despliegan en 2 columnas con altura mínima controlada (`min-h-[56px] sm:min-h-[64px]`) y badges con ancho máximo contenido (`max-w-[85px] sm:max-w-[100px]`), impidiendo roturas de la tarjeta.
- **Sellado Elástico de Modales:** Todos los cuadros de diálogo (`DialogContent` y `AlertDialogContent`) sellados con `w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden`, eliminando cualquier riesgo de scrollbar horizontal.

#### C. Separación Táctil y Ergonomía en Botones de Acción

- **Consola Principal (`ROOT`):** Cuadrícula con separación desahogada `gap-2.5 sm:gap-3`, áreas táctiles de 56px de alto en botones superiores (`h-14 sm:h-16`) y 48px en botón Huir (`h-12 sm:h-16`), optimizadas para la zona de alcance del pulgar.
- **Submenú de Movimientos (`ATTACK`):** Espaciado `gap-2 sm:gap-3` entre ranuras tácticas y separación nítida del botón «Volver» con micro-borde negro y sombra sólida.
- **Diálogos de Victoria, Captura y Derrota:** Separación generosa `gap-3 sm:gap-4` en la botonera vertical del pie (`Continuar Explorando` vs `Volver al Hub`, `Ver en Equipo` vs `Continuar`, `Ir a Centro de Curación` vs `Volver al Hub`).
- **Diálogo de Huida (`AlertDialogFooter`):** Separación desahogada `flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2` entre «Permanecer» y «Confirmar Huida».
- **Menú de Pausa:** Espaciado `gap-3` entre opciones primarias de combate y enlaces secundarios (`/kit-ui`, `/creditos`).

#### D. Estética Retro-Brutalist 8-Bit (8bitcn/ui) y Consola Arcade

- **Marcos y Sombras Ortogonales:** Marco perimetral y divisores con `border-2 border-black` / `border-4 border-black` y sombras duras de alto contraste `shadow-[2px_2px_0_0_#000]`, `shadow-[4px_4px_0_0_#000]` y `shadow-[6px_6px_0_0_#000]`.
- **Efecto de Pulsación Mecánica:** Botones arcade con micro-interacción física (`active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000]`).
- **Arena Diagonal JRPG con Fondos Desacoplados:** Composición con `BattlefieldBackground`, pedestal de sombra difuminada y perspectiva isométrica tradicional.
- **Barras Reactivas 8-Bit:** `HealthBar` y `XpBar` integradas con bordes negros sólidos, y medidor de Resonancia con animación de pulso áureo (`anim-pulso-resonancia`) al alcanzar el 100%.

#### E. Preservación Funcional, Hardening y Audio Retro Centralizado (`assets.ts`)

- **Preservación Integral de la Lógica de Servidor:** Sincronización estricta de turnos (`encuentro.turno`), motor de 4 ranuras tácticas (`construirSlotsTacticos`), bloqueo autoritativo de Movimiento Insignia / Furia (Slot 4) si Resonancia < 100%, inventario curativo (`api.usarItem`), relevo en vivo (`api.actualizarOrdenEquipo`), captura probabilística con talismán (`api.capturar`) y escape por velocidad (`api.huir`).
- **Hardening Estricto contra Doble Clic:** Cerrojo síncrono `cerrojoAccion.current = true`, estado reactivo `procesandoAccion`, atributos de accesibilidad `aria-busy={procesandoAccion}`, `aria-disabled={estaBloqueado}` y bloqueo visual con `<Spinner />`.
- **Audio Web Audio Retro Centralizado:** Consumo de `reproducirSonido(...)` para eventos de golpe elemental, victoria, captura exitosa, escape, uso de consumibles y clics táctiles.
- **Cumplimiento Estricto de la Regla R1:** Cero emojis unicode en toda la interfaz; uso exclusivo de iconos SVG vectoriales de Lucide (`Swords`, `Sparkles`, `HeartPulse`, `ArrowLeftRight`, `LogOut`, `Crown`, `Scroll`, `Pause`, `RotateCcw`, `Trophy`, `Lock`, `BookOpen`, `Award`, `ChevronsUp`, `ChevronsDown`).

---

### 15.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`pnpm --filter web test`):**
  - **84 de 84 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Verificación en `test/verificacion-combate.spec.ts` de:
    - Tipografía retro integral `Press Start 2P` (`.retro`) en turnos, HUDs (`NV.`), HP, Resonancia, EXP y modales.
    - Confinamiento móvil estricto con `overflow-x-hidden`.
    - Separación táctil en consola principal (`gap-2.5 sm:gap-3`) y modales (`gap-3 sm:gap-4`).
    - Hardening contra doble clic con `cerrojoAccion.current`, `disabled` y `aria-busy`.
    - Sellado elástico de modales contra desbordamiento (`w-[calc(100vw-2rem)] sm:max-w-md`).
    - Ausencia absoluta de emojis unicode (Regla R1).
  - Verificación en `test/verificacion-combate-tactico.spec.ts` de las 4 ranuras tácticas, regla del slot 4 de Furia bloqueada y badges de estados.
- **Auditoría Mecánica Impeccable:** Ejecución de `detect.mjs` sobre `PantallaCombate.tsx` arrojando `[]` (0 defectos).
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 80 archivos con 116 reglas.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript en modo estricto, bundle generado con Vite en 1.34s.

---

### 15.4 Pulido Visual de Botones Arcade Biselados, Simetría de Placas HUD y Corrección de Placeholder Invertido (Auditoría Fotográfica)

#### A. Diagnóstico de Defectos Visuales Identificados en Producción

A partir de una captura de pantalla real del combate en dispositivo móvil, se identificaron cuatro defectos visuales puntuales que degradaban la experiencia estética del juego:

1. **Truncamiento Asimétrico de Nombres en Placas HUD:** La placa aliada exhibía `Mantarr... NV.5 [Sombra]` debido a que el nombre, el nivel y la afinidad elemental estaban apiñados horizontalmente en un solo contenedor `flex` de ~210px. De igual forma, la placa rival truncaba nombres largos como `Mantarraya Espe... NV.3` por el uso de `truncate` rígido.
2. **Inversión Espejada del Placeholder Aliado (`AЯUTAЯIƆ`):** El sprite del aliado aplicaba incondicionalmente la clase CSS `scale-x-[-1]` para simular la vista de espaldas/perfil hacia el rival. Cuando la criatura utilizaba el SVG de reserva `placeholder-criatura.svg`, el texto interno `CRIATURA` se invertía en espejo como `AЯUTAЯIƆ`.
3. **Halo Cian Gigante Desalineado en Botón de Pausa:** En la esquina superior derecha, el botón de pausa utilizaba el componente `<Button variant="outline">` de `8bitcn/ui`, el cual inyectaba automáticamente la capa decorativa `ButtonDecorations` con `dark:bg-ring` absoluto, proyectando un enorme anillo circular cian descalibrado sobre la cabecera.
4. **Ticker de Bitácora Apretado y Botones Inferiores Genéricos:** El ticker de eventos mostraba un borde dorado desarticulado y un badge invasivo (`2 eventos`) que cortaba prematuramente el texto del encuentro. Asimismo, los botones de la consola inferior (`ROOT`) lucían planos y genéricos debido a que tres de los comandos (`USAR OBJETO`, `CAMBIAR`, `CAPTURAR`) compartían el mismo tono cian opaco plano (`#0e4b5c`), sin relieve táctil de botón de arcade.

#### B. Mejoras Implementadas

1. **Consola Arcade con Relieve Físico Tridimensional y Paleta Cromática JRPG:**
   - **Bisel Extruido 3D:** Se dotó a cada botón de la consola de un marco biselado tridimensional con luz cenital y sombra inferior ortogonal:
     `shadow-[inset_2px_2px_0_rgba(255,255,255,0.35),inset_-2px_-2px_0_rgba(0,0,0,0.5),4px_4px_0_0_#000]`.
   - **Micro-Animación Mecánica de Pulsación:** Al presionar, el botón se hunde físicamente invirtiendo la iluminación interna:
     `active:translate-y-0.5 active:shadow-[inset_2px_2px_0_rgba(0,0,0,0.6),2px_2px_0_0_#000]`.
   - **Jerarquía Cromática Táctica Canónica:**
     - **ATACAR:** Degradado rojo llama arcade (`from-[#dc2626] to-[#b91c1c]`) con icono `Swords` en amarillo solar (`#fde047`) con drop-shadow negro.
     - **USAR OBJETO:** Degradado verde esmeralda vital (`from-[#059669] to-[#047857]`) con icono `HeartPulse` en menta brillante (`#a7f3d0`).
     - **CAMBIAR:** Degradado azul zafiro táctico (`from-[#2563eb] to-[#1d4ed8]`) con icono `ArrowLeftRight` en cian brillante (`#7dd3fc`).
     - **CAPTURAR:** Degradado púrpura arcano amatista (`from-[#7c3aed] to-[#6d28d9]`) con icono `Sparkles` en oro (`#fde047`).
     - **HUIR:** Degradado carmesí oscuro de alerta (`from-[#991b1b] to-[#7f1d1d]`) con icono `LogOut` en tono carmesí claro.
2. **Simetría y Fluidez en Placas HUD:**
   - Se trasladó la afinidad elemental `{aliado.afinidad}` a la segunda fila de la placa aliada, alineándola simétricamente con la placa rival.
   - Se ampliaron los anchos máximos a `max-w-[225px] sm:max-w-[260px]`.
   - Se reemplazó el `truncate` rígido por `break-words line-clamp-2 leading-tight text-[8px] sm:text-[9px]`, permitiendo nombres completos de criaturas en dos líneas limpias sin cortar el nivel.
   - **Salud Numérica y Porcentual del Rival:** Se integró la visualización de los valores cuantitativos de vitalidad en el HUD rival (`{rival.hpActual}/{rival.hpMaximo} ({porcentajeHpRival}%)`), complementando la barra de salud y el porcentaje con datos exactos de combate.
3. **Erradicación de `AЯUTAЯIƆ`:**
   - Incorporación del estado reactivo `esPlaceholderAliado`. Se activa en `onError` de la imagen o si el slug es nulo.
   - La inversión `scale-x-[-1]` se aplica ahora de manera condicional exclusivamente a sprites reales:
     `${esPlaceholderAliado || !aliado.slug ? "" : "scale-x-[-1]"}`.
4. **Botón de Pausa Retro Nativo:**
   - Reemplazo de `<Button>` por un botón nativo `<button type="button">` con marco negro limpio `border-2 border-black bg-[#121927] shadow-[2px_2px_0_0_#000]`, eliminando por completo el anillo cian descalibrado.
5. **Ticker de Bitácora Estilo Cartucho:**
   - Sustitución del marco dorado por marco negro de cartucho `bg-[#0c1424] border-2 border-black shadow-[2px_2px_0_0_#000]`, badge compacto `{bitacoraCombate.length} ev.` y texto en `text-[8px] sm:text-[9px] retro text-amber-100`.

#### C. Verificación de Cero Regresiones

- **Pruebas Unitarias Web (`pnpm --filter web test`):** **84 de 84 pruebas aprobadas** (100% de éxito).
- **Linter Web (`pnpm --filter web lint`):** 0 errores.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores TypeScript, bundle completado exitosamente en Vite en 2.40s.

---

---

## 16. Sub-Fase 10i: Rediseño Visual de Créditos y Atribución Legal Impeccable (Estética Retro-Brutalist, Tipografía 8-Bit Integral y Cero Overflow Móvil)

### 16.1 Diagnóstico Inicial y Auditoría Impeccable

La auditoría heurística y de ergonomía visual sobre `PaginaCreditos.tsx` mediante la skill `impeccable` y los lineamientos de `docs/DESIGN.md` reveló oportunidades críticas de mejora estética y adaptabilidad:

1. **Apiñamiento y Separación Deficiente en Botones de Acción:** Los botones de cabecera (`CELEBRAR FANFARRIA` y `Volver al Asentamiento`) estaban dispuestos con un espaciado reducido (`gap-2`), generando apiñamiento y dificultad táctil en pantallas móviles; de igual forma, el pie de página requería una delimitación clara entre el aviso de derechos y el botón de retorno.
2. **Riesgo de Desbordamiento Horizontal en Móvil (360px–420px):** Las cajas de licencias legales (MIT de 8bitcn y CC BY 4.0 de Wizards of the Coast / Open5e) y las tarjetas técnicas carecían de confinamiento estricto contra desbordamientos, con riesgo de provocar desplazamiento horizontal indeseado.
3. **Acortamiento Excesivo de Textos (`truncate`):** La galería de criaturas emblemáticas utilizaba la clase utilitaria `truncate`, recortando títulos y nombres de especies con longitud media o alta en resoluciones móviles reducidas.
4. **Disparidad Tipográfica:** Existía una mezcla entre fuentes sans-serif genéricas, fuentes mono y la fuente retro del sistema, diluyendo la experiencia inmersiva de cartucho RPG retro.
5. **Falta de Relieve Brutalista:** Los contenedores empleaban sombras tenues o bordes estándar sin la contundencia física de la estética retro-brutalista de Aethelgard (`border-4 border-black shadow-[6px_6px_0_0_#000]`).

---

### 16.2 Mejoras Implementadas

#### A. Salón de la Fama Ceremonial con Marco Retro-Brutalist de Alto Contraste

- **Marco de Consola Dorada:** Enmarcado perimetral de alto impacto con `border-4 border-black shadow-[6px_6px_0_0_#000] bg-bastion p-4 sm:p-6 rounded-none space-y-5`.
- **Insignias Ceremoniales:** Badges temáticos con relieve ortogonal (`border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px]`):
  - `SALÓN DE LA FAMA`: Fondo ámbar translúcido (`bg-amber-500/20 text-amber-400`) con icono SVG `Crown`.
  - `ISC-305 · III PAC 2026`: Fondo secundario con icono SVG `Trophy`.
- **Título de Pantalla con Relieve y Sombra Densa:** Título principal «AETHELGARD: CRÉDITOS Y HONOR» en tipografía pixelada `Press Start 2P` con sombra proyectada ortogonal (`retro text-base sm:text-xl md:text-2xl font-bold tracking-tight text-primary drop-shadow-[2px_2px_0_#000] break-words leading-snug`).

#### B. Separación Holgada y Relieve Táctil en Botones de Acción

- **Botonera de Cabecera:** Separación táctil y vertical ampliada (`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto shrink-0 pt-2 sm:pt-0`), garantizando que en resoluciones móviles reducidas los botones cuenten con área de pulsación completa (`w-full sm:w-auto`), holgura superior e inferior y margen perimetral desahogado.
- **Botón de Fanfarria Reactivo:**
  - Estilizado en oro solar con `bg-amber-500 hover:bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] w-full sm:w-auto justify-center px-4 py-3`.
  - Icono `Volume2` con micro-animación de rebote (`animate-bounce`) y estado textual reactivo (`CELEBRANDO...` frente a `CELEBRAR FANFARRIA`).
  - Hardening antirrebote con guarda inmediata (`if (celebrando) return;`), `disabled={celebrando}` y atributo accesible `aria-busy={celebrando}`.
- **Botones de Retorno al Asentamiento:**
  - Preservación estricta de identificadores de pruebas y accesibilidad: `id="boton-volver-inicio-creditos"` y `data-testid="boton-volver-inicio-creditos"`.
  - Navegación autoritativa hacia `/hub` con disparo de síntesis sonora retro mediante `reproducirSonido("victoria")`.
- **Pie Ceremonial Separado:** Delimitación formal con `flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t-2 border-black`, separando el crédito institucional con `ShieldCheck` del botón de retorno secundario (`w-full sm:w-auto px-5 py-3`).

#### C. Tipografía Retro Integral (`Press Start 2P` / `.retro` 100%)

- **Erradicación Total de Fuentes Sans-Serif y Mono Estándar:** Adopción universal de la clase `.retro` (`Press Start 2P`) en absolutamente todos los elementos de la vista:
  - Títulos principales, insignias heráldicas y descripciones.
  - Homenaje académico al Ingeniero Claudio y principios rectores de software.
  - Cuadrícula técnica de arquitectura full-stack (Front-End React 19, Back-End NestJS 10, Audio Web Audio API; corregido de la mención inicial errónea a NestJS 11 en la auditoría de §27).
  - Mención de 8bitcn/ui y texto literal de la Licencia MIT.
  - Atribución exigida de Open5e / SRD 5.2 (en inglés canónico y traducción de cortesía en español).
  - Galería de criaturas victoriosas y botones de interacción.
- **Calibración Antiacortamiento en Móvil:**
  - Textos extensos de licencias y descripciones: `text-[8px] sm:text-[9px]` con `leading-relaxed` y `break-words`.
  - Módulos de arquitectura y principios rectores: `text-[9px] sm:text-[10px]`.
  - Títulos y botones: `text-[10px] sm:text-xs` con interlineado fluido.

#### D. Ergonomía Móvil y Rediseño Integral del Bestiario Victorioso (Vitrina de Trofeos 8-Bit)

- **Confinamiento Seguro:** Contenedor raíz delimitado con `w-full max-w-5xl mx-auto px-2 sm:px-4 space-y-6 sm:space-y-8 py-4 sm:py-6 overflow-x-hidden`.
- **Sincronización con Especies Canónicas Reales:** Erradicación de especies obsoletas o inexistentes en el compendio (`grifo`, `hidra-de-las-marismas`), sustituyéndolas por las 4 criaturas canónicas vigentes del bestiario de Aethelgard:
  1. `lobo-estepario` (_Lobo Estepario_ · Bestia · Praderas del Amanecer).
  2. `golem-granito` (_Golem Granito_ · Constructo · Paso de los Riscos).
  3. `quimera-tricefala` (_Quimera Tricéfala_ · Monstruosidad · Cueva Umbría).
  4. `remorhaz-glaciar` (_Remorhaz Glaciar_ · Monstruosidad · Pico de la Cumbre · Insignia Legendaria).
- **Vitrina de Trofeos Vertical (Eliminación de Cortes Silábicos):**
  - Rediseño con pedestal centrado para el sprite pixel-art (`size-16 bg-bastion border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)]`), otorgando el ancho completo de la tarjeta para el nombre y los badges.
  - Supresión definitiva de la partición de palabras ("Tricéfa / la" o "Estepar / io") mediante flujo centrado con tipografía retro compacta (`text-[8px] sm:text-[9px] font-bold leading-snug break-words`).
  - Badges temáticos de Tipo (`text-amber-300`) y Zona de origen (`text-primary`), más badge dorado flotante `LEGENDARIA` para el Remorhaz Glaciar.
- **Cajas de Licencias con Scroll Contenido:** Cajas legales configuradas con `max-h-48 overflow-y-auto overflow-x-hidden p-3 border-2 border-black bg-black/40 text-[8px] leading-relaxed break-words shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]`, permitiendo inspección íntegra del texto legal sin deformar la maquetación.

#### E. Cumplimiento Estricto de la Regla R1 (Cero Emojis Unicode)

- Cero emojis unicode en toda la pantalla; empleo exclusivo de iconos SVG vectoriales de Lucide: `Trophy`, `Crown`, `Sparkles`, `ArrowLeft`, `Volume2`, `Award`, `GraduationCap`, `Code2`, `ShieldCheck` y `BookOpen`.
- Todos los textos de interfaz redactados en español riguroso conforme a la directriz académica.

---

### 16.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`pnpm --filter web test`):**
  - **80 de 80 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Nueva prueba especializada `Hardening, Ergonomía y Estética Retro-Brutalist: PaginaCreditos cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y botones táctiles separados` que valida:
    1. Confinamiento de pantalla sin overflow horizontal (`overflow-x-hidden`, `max-w-5xl`).
    2. Marco retro-brutalist ceremonial en la cabecera (`border-4 border-black`, `shadow-[6px_6px_0_0_#000]`).
    3. Separación holgada y táctil en los botones de acción (`gap-5 sm:gap-4 flex-wrap`, `border-2 border-black shadow-[2px_2px_0_0_#000]`).
    4. Cero clases `truncate` rígidas en los nombres de criaturas.
    5. Cajas de licencias con scroll vertical contenido y relieve hundido retro.
    6. Guarda antirrebote con `if (celebrando) return;` y accesibilidad con `aria-busy={celebrando}`.
    7. Verificación de las especies canónicas del catálogo (`lobo-estepario`, `golem-granito`, `quimera-tricefala`, `remorhaz-glaciar`) y ausencia de criaturas espurias (`grifo`, `hidra-de-las-marismas`).
- **Regla R1 Estricta:** Verificación de 0 emojis unicode en `PaginaCreditos.tsx` auditada por la suite automatizada.
- **Linter Web (`pnpm --filter web lint`):** 0 errores de TypeScript y Oxlint en los 80 archivos del proyecto.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de compilación, empaquetado completado en Vite en 3.27s.

---

## 17. Sub-Fase 10i: Rediseño Visual de Bitácora de Expediciones Impeccable (Estética Retro-Brutalist 8-Bit, Tipografía Integral y Cero Overflow Móvil en PantallaHistorial.tsx)

### 17.1 Diagnóstico Inicial y Auditoría Impeccable

La auditoría heurística y de ergonomía visual sobre `PantallaHistorial.tsx` mediante la skill `impeccable` y los lineamientos de `docs/DESIGN.md` reveló oportunidades críticas de mejora estética, consistencia retro y adaptabilidad:

1. **Desplazamiento Horizontal y Truncamiento en Móvil (360px–420px):** Disposición rígida en fila horizontal que asfixiaba el sello de fecha/hora, el badge de categoría y la información en pantallas estrechas. El contenedor carecía de confinamiento con `overflow-x-hidden` y utilizaba la clase `truncate` que cortaba el registro técnico del evento si el tipo era extenso o la resolución reducida.
2. **Inconsistencia Tipográfica:** Presencia de fuentes sans-serif convencionales (`font-sans font-medium`) en el cuerpo descriptivo de las crónicas y fuentes monoespaciadas (`font-mono`) en fechas, sellos temporales y botones de filtro, rompiendo la inmersión auténtica de cartucho RPG retro.
3. **Carencia de Separación y Ergonomía en Botones de Acción:** Filtros rápidos apiñados con un espaciado reducido (`gap-1.5`), botones de cabecera con espacio insuficiente (`gap-2`) para interacción táctil cómoda en pantallas móviles y falta de separación holgada en la barra de búsqueda y estado vacío.
4. **Ausencia de Marcos Retro-Brutalistas:** Falta de bordes negros gruesos (`border-2 border-black` / `border-4 border-black`), esquinas vivas sin curvas (`rounded-none`) y sombras sólidas ortogonales proyectadas (`shadow-[4px_4px_0_0_#000]`, `shadow-[2px_2px_0_0_#000]`), descansando en bordes sutiles `border-border/80` sin la contundencia física de `8bitcn/ui` y NES.css.
5. **Higiene de Código:** Presencia de una re-exportación e importación redundante de funciones auxiliares desde `@/lib/catalogo-historial`, provocando advertencias de Fast Refresh en el linter.

---

### 17.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist y Marcos 8bitcn/ui

- **Cabecera Ceremonial de Crónicas:** Enmarcado perimetral contundente con `border-4 border-black bg-bastion shadow-[6px_6px_0_0_#000] p-4 sm:p-5 rounded-none`, presentando el título `BITÁCORA DE EXPEDICIONES` con sombra proyectada ortogonal (`drop-shadow-[2px_2px_0_#000] text-primary`).
- **Insignia Heráldica de Crónicas:** Badge superior en relieve pixelado (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-background text-foreground retro text-[8px] sm:text-[9px] py-1 px-2.5 rounded-none`) con icono SVG `BookOpen`.
- **Panel de Filtros y Búsqueda Brutalista:** Módulo de control unificado con `border-2 border-black shadow-[4px_4px_0_0_#000] bg-bastion p-3.5 sm:p-4 rounded-none space-y-4`.
- **Tarjetas de Crónicas con Relieve Interactivo:** Cada entrada histórica cuenta con marco negro grueso `border-2 border-black shadow-[4px_4px_0_0_#000] bg-bastion rounded-none p-3.5 sm:p-4` y micro-interacción al cursor (`hover:translate-x-0.5 hover:shadow-[5px_5px_0_0_#000] transition-all`).
- **Badges de Categoría Estilo Cartucho de Consola:** Insignias temáticas con relieve ortogonal (`border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none retro text-[8px] sm:text-[9px] px-2 py-1`) con paleta canónica de alto contraste:
  - `COMBATE`: Fondo carmesí oscuro (`bg-red-950/90 text-red-300`) con icono SVG `Swords`.
  - `CAPTURA`: Fondo místico púrpura (`bg-purple-950/90 text-purple-300`) con icono SVG `Sparkles`.
  - `EXPLORACIÓN`: Fondo cian boreal (`bg-cyan-950/90 text-cyan-300`) con icono SVG `Compass`.
  - `TIENDA`: Fondo ámbar dorado (`bg-amber-950/90 text-amber-300`) con icono SVG `ShoppingBag`.
  - `CURACIÓN`: Fondo esmeralda vital (`bg-emerald-950/90 text-emerald-300`) con icono SVG `HeartPulse`.
- **Sello de Tiempo Cronológico:** Caja retro tipo pergamino (`border-2 border-black bg-background shadow-[2px_2px_0_0_#000] p-1.5 sm:p-2 text-center rounded-none w-24 shrink-0`).
- **Skeletons y Estado Vacío Retro:** Barras de carga con marcos negros pixelados (`border-2 border-black bg-muted/60 animate-pulse shadow-[2px_2px_0_0_#000] rounded-none h-20`). Tarjeta de estado vacío ceremonial sellada con `border-4 border-black shadow-[6px_6px_0_0_#000] bg-bastion text-center p-6 sm:p-8 rounded-none space-y-4`.

#### B. Tipografía Retro Integral (`Press Start 2P` / `.retro` 100%)

- **Erradicación Universal de Fuentes Convencionales:** Supresión total de `font-sans` y `font-mono`, aplicando la tipografía retro pixelada `Press Start 2P` (`.retro`) en **absolutamente todos** los textos y controles:
  - Título principal (`text-base sm:text-xl md:text-2xl`), subtítulo de ambientación (`text-[8px] sm:text-[9px] leading-relaxed`) e insignia de crónicas.
  - Botones de filtros rápidos por categoría y píldoras numéricas de conteo (`text-[7px] sm:text-[8px]`).
  - Campo de búsqueda (`text-[8px] sm:text-[9px] placeholder:text-[8px] sm:placeholder:text-[9px]`) y botón «Limpiar filtros».
  - Sello temporal de hora (`text-[9px] sm:text-[10px]`) y fecha (`text-[7px] sm:text-[8px]`).
  - Insignias de categoría (`text-[8px] sm:text-[9px]`).
  - Descripciones narrativas de los eventos (`text-[9px] sm:text-[10px] leading-relaxed`).
  - Registro técnico de evento (`text-[7px] sm:text-[8px]`).
  - Títulos, descripciones y botones de estado vacío (`text-[8px]` a `text-xs`).

#### C. Confinamiento Móvil y Erradicación de Truncamientos (360px–420px)

- **Contenedor Raíz Confinado:** `w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden space-y-5 sm:space-y-6`, previniendo de manera estricta cualquier desbordamiento horizontal.
- **Ajuste Flexible Sin Amputaciones:** Supresión de cualquier clase `truncate` destructiva, implementando flujo multilínea con `break-words` y `break-all`.
- **Adaptación Fluida de Tarjetas:**
  - En pantallas móviles (<640px): la cabecera interna agrupa el sello temporal y la insignia de categoría en una micro-fila compacta superior, liberando el 100% del ancho inferior para el texto descriptivo y el registro técnico.
  - En pantallas de escritorio (>=640px): se preserva la alineación horizontal natural (`sm:flex-row items-center gap-4`), brindando lectura cómoda sin compresión.

#### D. Ergonomía Táctil, Separación de Botones y Calibración de Búsqueda

- **Botones de Cabecera:** Separación vertical y horizontal ampliada (`gap-4 sm:gap-5`) en contenedor elástico (`flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto`), con botones táctiles de al menos 40px de altura (`min-h-[40px] sm:h-10 px-4`), eliminando la compresión vertical en pantallas móviles y dotados de relieve táctil retro (`border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[3px_3px_0_0_#000]`).
- **Rejilla Táctica 6-Slot y Erradicación de Truncamiento en Filtros:** Reorganización simétrica en `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full`. Se calibró la escala tipográfica a `text-[7px] sm:text-[8px] lg:text-[8.5px]` con `whitespace-nowrap tracking-tight`, icono de 12px (`w-3 h-3 sm:w-3.5 sm:h-3.5`) y padding `px-1.5 sm:px-2.5`. Esto erradica definitivamente el truncamiento de etiquetas extensas como `EXPLORACIÓN` (que en viewports estrechos se cortaba como `EXPLORAC]`), garantizando lectura íntegra en pantallas de 360px sin escalonamientos asimétricos.
- **Barra de Búsqueda con Placeholder Inmune a Truncamiento:** Calibración del texto de sugerencia a `Buscar crónica...` (17 caracteres) con tipografía pixelada proporcional (`text-[8px] sm:text-[9px] placeholder:text-[7.5px] sm:placeholder:text-[9px]`) y sangría calibrada (`pl-8 sm:pl-9`), resolviendo de forma definitiva el corte de texto (`Buscar crónica por palabra c...`) advertido en auditoría visual móvil.
- **Buscador y Restablecimiento:** Separación explícita (`gap-3 sm:gap-4 pt-3`) entre el input de búsqueda y el botón «Limpiar filtros».
- **Botones de Estado Vacío:** Separación táctil holgada (`gap-3 sm:gap-4 flex-wrap`) entre las acciones de exploración y reseteo.

#### E. Reglas de Servidor, Audio y Cero Emojis Unicode (Regla R1)

- **Preservación Funcional Estricta:** Conservación íntegra de `api.obtenerHistorial()`, sincronización en tiempo real de estados de carga (`cargando`, `actualizando`), conteos reactivos por categoría y filtrado combinado (categoría canónica + búsqueda insensible a acentos mediante `filtrarEventosHistorial`).
- **Hardening Antirrebote y Accesibilidad:** Atributo `aria-busy={actualizando}`, deshabilitación durante peticiones activas e icono animado con `RefreshCw` en estado de rotación.
- **Audio Web Audio API Centralizado:** Disparo consistente de `reproducirSonido("click")` al interactuar con botones de navegación, cambio de categoría, búsqueda y actualización manual.
- **Cumplimiento Estricto de la Regla R1:** 100% español riguroso y cero emojis unicode en la interfaz, utilizando exclusivamente iconos vectoriales SVG de Lucide (`BookOpen`, `Swords`, `Sparkles`, `Compass`, `ShoppingBag`, `HeartPulse`, `RefreshCw`, `ArrowLeft`, `Search`, `RotateCcw`).
- **Higiene de Código:** Eliminación de la exportación redundante de funciones utilitarias en el archivo de la página.

---

### 17.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`pnpm --filter web test`):**
  - **83 de 83 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Nueva prueba especializada `Hardening, Ergonomía y Estética Retro-Brutalist: PantallaHistorial cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y confinamiento sin overflow` que audita:
    1. Confinamiento de pantalla contra overflow horizontal (`overflow-x-hidden`, `max-w-5xl mx-auto px-2 sm:px-4`).
    2. Erradicación total de clases `truncate` y adopción de `break-words` y `break-all`.
    3. Marcos negros brutalistas `border-2 border-black` y `border-4 border-black` con sombras sólidas `shadow-[4px_4px_0_0_#000]`, `shadow-[6px_6px_0_0_#000]` y `shadow-[2px_2px_0_0_#000]`.
    4. Separación táctil y holgada en botones de cabecera (`gap-3 sm:gap-4 flex flex-wrap items-center`) y filtros rápidos (`gap-2 sm:gap-3 flex-wrap`).
    5. Tipografía retro 100% integral (`Press Start 2P` / `.retro`) en títulos, subtítulos, sellos y descripciones.
    6. Higiene de código: ausencia de importación duplicada de `catalogo-historial`.
- **Regla R1 Estricta:** Verificación de 0 emojis unicode en `PantallaHistorial.tsx` validada por la suite de pruebas unitarias.
- **Pruebas Automatizadas API (`pnpm --filter api test`):** 115 de 115 pruebas aprobadas (100% de éxito), confirmando que `HistorialService` y el backend operan sin regresiones.
- **Linter Web (`pnpm --filter web lint`):** 0 errores de TypeScript y Oxlint en los 80 archivos del proyecto.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de compilación, empaquetado completado en Vite en 3.19s.

---

## 18. Sub-Fase 10c: Arquitectura de Layout y Navegación Global (`LayoutPrincipal.tsx`)

### 18.1 Diagnóstico Inicial y Auditoría Impeccable

La auditoría de diseño heurístico y técnico realizada con la skill `impeccable` y los lineamientos de `docs/DESIGN.md` sobre el cascarón de aplicación y navegación perimetral (`LayoutPrincipal.tsx`) detectó oportunidades cruciales de alineación visual y robustez ergonómica:

1. **Inconsistencia Tipográfica:** La cabecera y el pie de página originales utilizaban tipografía sans-serif convencional por defecto en los enlaces de navegación («Kit de interfaz», «Créditos», «Créditos y licencias») y en la leyenda de derechos institucionales `(c) 2026 Aethelgard · Proyecto Integrador ISC-305`. Esta disparidad rompía la inmersión retro de cartucho de consola RPG al alternar la fuente pixelada del logo con fuentes genéricas de sistema. Se requería la unificación rigurosa al 100% bajo la tipografía pixelada `Press Start 2P` (`.retro`).
2. **Ausencia de Marcos Retro-Brutalistas:** La cabecera superior y el pie de página descansaban sobre bordes tenues de baja definición (`border-b border-border` y `border-t border-border`), careciendo de la contundencia física de los marcos negros sólidos (`border-b-4 border-black` y `border-t-4 border-black`) y sombras ortogonales proyectadas duras (`shadow-[0_4px_0_0_#000]` y `shadow-[0_-4px_0_0_rgba(0,0,0,0.15)]`), estándar fundamental de `8bitcn/ui`, NES.css y RPG UI.
3. **Ergonomía de Navegación en la Cabecera:** Los enlaces superiores se presentaban como texto plano con subrayado sutil, desaprovechando la oportunidad táctil de comportarse como auténticos cartuchos de consola u arcade buttons 8-bit con relieve físico (`border-2 border-black shadow-[2px_2px_0_0_#000]`), micro-interacción al clic (`active:translate-y-0.5 active:shadow-none`) y distinción cromática nítida e inmediata entre estado activo e inactivo.
4. **Restricciones Arquitectónicas de Pruebas y Cero Regresiones:** El cascarón debía satisfacer con precisión matemática las salvaguardas de regresión:
   - Prohibición absoluta de `flex-wrap` en la cabecera fija, previniendo quiebres de línea o desalineaciones que rompan la altura estricta de la barra superior fija.
   - Ausencia total del botón de `LogOut` en el header global para no saturar la barra superior en pantallas reducidas (el cierre de sesión se delega exclusivamente a los escapes interiores de las pantallas correspondientes).
   - Disponibilidad accesible ininterrumpida de los enlaces hacia `/kit-ui` y `/creditos`.
5. **Desplazamiento Horizontal y Adaptación Móvil (360px–420px):** En pantallas angostas, el logo y los cartuchos de navegación requerían convivir holgadamente sin colisionar en una única fila compacta (`gap-2 sm:gap-4`), mientras que el pie de página requería apilamiento elástico fluido (`flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left`) con quiebre de texto protegido (`break-words`) para evitar cualquier desbordamiento lateral.
6. **Ausencia de Retroalimentación Háptica-Auditiva:** Falta de sonorización retro al interactuar con el logotipo de la marca y los enlaces de navegación primaria y secundaria.

---

### 18.2 Mejoras Implementadas

#### A. Identidad Retro-Brutalist 8-Bit y Marcos 8bitcn/ui (`docs/DESIGN.md`)

- **Cabecera Fija Superior con Relieve Ortogonal:** Barra de navegación superior fija (`sticky top-0 z-40`) enmarcada con borde negro grueso inferior de 4px (`border-b-4 border-black`), fondo de tarjeta sólida retro de alta opacidad (`bg-card/95 backdrop-blur-xs`) y sombra proyectada ortogonal de 4px (`shadow-[0_4px_0_0_#000]`), transmitiendo la firmeza de un bisel de consola retro.
- **Logotipo Heráldico de Marca con Relieve:** Enlace hacia `/hub` con tipografía pixelada `Press Start 2P` (`.retro`), escala responsive calibrada (`text-xs sm:text-base md:text-lg font-bold tracking-wider text-primary`) y sombra proyectada ortogonal de alto contraste (`drop-shadow-[1px_1px_0_#000]`).
- **Botones de Navegación en Formato Cartucho 8-Bit:** Los enlaces `NavLink` («Kit de interfaz» y «Créditos») fueron reconcebidos como cartuchos táctiles pixel-art:
  - _Estado Inactivo:_ Marco negro de 2px con sombra dura (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-background text-muted-foreground hover:text-foreground hover:border-primary active:translate-y-0.5 active:shadow-none`).
  - _Estado Activo:_ Fondo primario de alto impacto con marco negro y sombra sólida (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary text-primary-foreground font-bold`).
- **Pie de Página Brutalista Ceremonial:** Borde superior negro sólido de 4px (`border-t-4 border-black bg-card/95 shadow-[0_-4px_0_0_rgba(0,0,0,0.15)] px-4 py-4 sm:px-6 mt-auto`), con enlaces inferiores estilizados con tipografía retro, subrayado pixelado grueso de alto contraste (`underline underline-offset-4 decoration-2 decoration-black/40 hover:decoration-primary`) y transiciones de color nítidas.
- **Preservación Incondicional del Cascarón de Combate:** Rama de evaluación condicional `if (esCombate)` preservada de forma intacta a pantalla completa (`h-screen h-[100dvh] w-full overflow-hidden bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground max-w-full`), aislando las cinemáticas de batalla de las barras perimetrales.

#### B. Tipografía Retro Integral (`Press Start 2P` / `.retro` 100%)

- Adopción absoluta y homogénea de la fuente pixelada `Press Start 2P` (`.retro`) en la totalidad de cadenas textuales del cascarón perimetral:
  - **Marca principal:** `text-xs sm:text-base md:text-lg font-bold tracking-wider` («Aethelgard»).
  - **Cartuchos de navegación superior:** `text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wider` («Kit de interfaz» y «Créditos»).
  - **Leyenda institucional del pie:** `text-[7px] sm:text-[8px] md:text-[9px] text-muted-foreground leading-relaxed break-words` («(c) 2026 Aethelgard · Proyecto Integrador ISC-305»).
  - **Enlaces secundarios del pie:** `text-[8px] sm:text-[9px]` («Kit de interfaz» y «Créditos y licencias»).

#### C. Confinamiento Móvil, Erradicación de Desbordamiento y Calibración Ergonómica (360px–420px)

- **Confinamiento Anti-Overflow Raíz:** Contenedor raíz sellado con `min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground max-w-full overflow-x-hidden`.
- **Cabecera Compacta sin Desbordamiento ni `flex-wrap`:**
  - Barra superior en una sola fila (`flex items-center justify-between gap-2 sm:gap-4 w-full`) con padding vertical/horizontal afinado (`px-2.5 py-1.5 sm:px-6 sm:py-2.5`).
  - Nombre de marca con escala responsive y tracking adaptado (`text-[10px] sm:text-base md:text-lg font-bold tracking-tight sm:tracking-wider`).
  - El enlace a `/kit-ui` adopta etiqueta responsive adaptada: en móviles reducidos (<640px) despliega `Kit UI` (ahorrando 9 caracteres de ancho fijo) y en escritorio (>=640px) despliega `Kit de interfaz`. Esto erradica de forma definitiva la colisión y corte lateral del botón activo de la derecha («Créditos») en viewports de 360px a 390px, asegurando visualización íntegra de bordes negros y sombras proyectadas.
- **Pie de Página con Jerarquía Estructurada y sin Quiebres Huérfanos:**
  - Sombra ortogonal retro negra sólida visible (`shadow-[0_-4px_0_0_#000]`) sobre marco perimetral negro de 4px (`border-t-4 border-black bg-card/95`).
  - Desglose jerárquico de la leyenda institucional en pantallas móviles mediante contenedor flex elástico:
    - Línea principal: `(c) 2026 Aethelgard` con alto contraste y negrita retro (`text-[8px] sm:text-[9px] text-foreground/90 font-bold tracking-tight`).
    - Línea secundaria: `Proyecto Integrador ISC-305` como complemento armónico calibrado (`text-[7px] sm:text-[8px] text-muted-foreground/80 tracking-tight`).
    - En pantallas de escritorio (`sm:`), ambas cadenas se unifican en un único renglón con separador `·`.
    - Esto elimina el quiebre accidental que aislaba a «ISC-305» en una línea descolgada.
  - Enlaces del pie concebidos como micro-cartuchos retro interactivos (`border border-black/80 bg-background/60 hover:bg-background shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:translate-y-0.5 px-2.5 py-1 sm:px-3 sm:py-1.5`), erradicando el subrayado tosco que causaba efecto de tachado visual.

#### D. Ergonomía Táctil y Separación de Acciones

- **Botonera Superior:** Separación explícita (`gap-2 sm:gap-3`) entre cartuchos, con altura ergonómica táctil de 32px–36px (`h-8 sm:h-9`) y acolchado táctil holgado (`px-2 sm:px-3 py-1 sm:py-1.5`).
- **Botonera Inferior:** Separación generosa (`gap-4 sm:gap-6`) entre los enlaces «Kit de interfaz» y «Créditos y licencias», y separación vertical/horizontal (`gap-3 sm:gap-4`) respecto a la leyenda institucional.
- **Cuerpo Central (`<main>`):** Relleno interior confortable (`p-3 sm:p-6 lg:p-8 flex-1 max-w-6xl w-full mx-auto`), garantizando separación física entre el contenido interactivo de las pantallas y las barras perimetrales fijas.

#### E. Reglas de Servidor, Audio Web Audio y Cero Emojis (Regla R1)

- **Audio Retro Centralizado:** Integración de la función `reproducirSonido("click", 0.3)` desde `@/lib/assets` en todos los eventos interactivos de clic (marca, enlaces superiores y enlaces del pie), ofreciendo retroalimentación acústica clásica de consola.
- **Regla R1 Estricta:** 100% de textos en español normativo y cero emojis unicode en todo el cascarón.
- **Integridad de Enrutamiento:** Preservación sin alteraciones de `Outlet`, `Link`, `NavLink`, `useLocation` y el notificador global `<Toaster />`.

---

### 18.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Unitarias (`pnpm --filter web test`):**
  - **88 de 88 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Verificación formal de la prueba histórica `Ergonomía y Libertad de Usuario: PantallaCrearPersonaje y PantallaHubUbicacion incluyen escape hatch con LogOut, y LayoutPrincipal es responsive` (validando ausencia estricta de `flex-wrap` en cabecera, ausencia de botón `LogOut` en el header global y persistencia del enlace a `/kit-ui`).
  - Verificación de la prueba histórica de la Regla R1 `Regla R1: Cero emojis unicode en PantallaIngreso.tsx, PantallaRegistro.tsx, PantallaCrearPersonaje.tsx y LayoutPrincipal.tsx`.
  - Nueva prueba especializada `Auditoría Impeccable: LayoutPrincipal y Footer consolidan estética retro-brutalist 8-bit, tipografía integral y confinamiento móvil` validando:
    1. Marcos negros sólidos de 4px (`border-b-4 border-black`, `border-t-4 border-black`).
    2. Sombras ortogonales proyectadas duras (`shadow-[0_4px_0_0_#000]`, `shadow-[2px_2px_0_0_#000]`).
    3. Confinamiento de pantalla contra overflow horizontal (`overflow-x-hidden`).
    4. Estructura elástica de pie de página (`flex-col sm:flex-row items-center justify-between`) y quiebre protegido (`break-words`).
    5. Ergonomía y separación de controles (`gap-2 sm:gap-3`, `gap-3 sm:gap-4`, `gap-4 sm:gap-6`, `p-3 sm:p-6 lg:p-8`).
    6. Tipografía retro integral y retroalimentación táctil de audio con `reproducirSonido`.
- **Linter Web (`pnpm --filter web lint`):** 0 errores de tipado o calidad en 80 archivos evaluados con Oxlint.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de compilación, empaquetado completado en Vite en 1.76s.

---

## 19. Sub-Fase 10m: Desbloqueo Territorial y Jerarquía Monótona de Criaturas

### 19.1 Diagnóstico Inicial y Auditoría Impeccable

Previo a esta subfase, se detectaron las siguientes debilidades estructurales y de experiencia de usuario:

1. **Anomalía del 83 % de Captura en Golem Granito (Apex de `ZON-04`):**
   - Acoplamiento al `challenge_rating = 1` externo de Open5e en `normalizador-criaturas.util.ts` (`0.90 - 0.07 * 1 = 0.83`), provocando que un Apex `ESPECIAL` de nivel 5–7 fuera más fácil de capturar que criaturas comunes.
   - Lectura cruda desde la BD sin re-siembra ni blindaje autoritativo en `CriaturasService.obtenerEspecies()`.
   - Pendiente plana insuficiente en la fórmula previa ($1.10 - \text{BST}/400$), asignando 40 %–58 % a criaturas Apex.
2. **Ruptura de Jerarquía Rareza vs BST (Solapamientos entre zonas):**
   - Especies de menor rareza en zonas altas superaban en BST a especies de rareza superior de zonas iniciales (ej. `gargola` con BST 216 vs `oso-fresno` con BST 210), contradiciendo el orden en `PantallaCatalogo.tsx`.
3. **Bloqueo Permanente de Rutas y Ausencia de Señalética en el Hub:**
   - Rutas territoriales intermedias (`LOC-02`, `ZON-03`, `ZON-04`, `LOC-03`) carecían de persistencia en `zona_desbloqueada` y feedback cuantitativo en `PantallaHubUbicacion.tsx`.

---

### 19.2 Mejoras Implementadas

#### A. Identidad Retro y Jerarquía Visual

- **Bandas Globales Disjuntas de BST y Captura por Rareza:**
  | Rareza | Peso | Cantidad | Banda Global BST | Banda Tasa Captura Base | Separación Estricta |
  | :--- | :---: | :---: | :---: | :---: | :--- |
  | **`COMUN`** | 35 % (2/zona) | 12 | **$[150,\; 195]$** | **$0.70 - 0.85$** (70 % – 85 %) | $\max(\text{COMUN}) = 195 < 210 = \min(\text{FRECUENTE})$ |
  | **`FRECUENTE`** | 15 % (1/zona) | 6 | **$[210,\; 245]$** | **$0.53 - 0.65$** (53 % – 65 %) | $\max(\text{FRECUENTE}) = 245 < 261 = \min(\text{RARA})$ |
  | **`RARA`** | 10 % (1/zona) | 6 | **$[261,\; 296]$** | **$0.36 - 0.48$** (36 % – 48 %) | $\max(\text{RARA}) = 296 < 315 = \min(\text{ESPECIAL})$ |
  | **`ESPECIAL`** | 5 % (`Z1..Z4`) | 4 | **$[315,\; 345]$** | **$0.20 - 0.30$** (20 % – 30 %) | $\max(\text{ESPECIAL}) = 345 < 360 = \min(\text{LEGENDARIA})$ |
  | **`LEGENDARIA`** | 5 % (`Z5..Z6`) | 2 | **$[360,\; 375]$** | **$0.10 - 0.15$** (10 % – 15 %) | Ápice absoluto ($\text{BST} \ge 360$) |
- **Badges Jerárquicos en Tarjeta y Modal:** Insignias temáticas Lucide SVG (`Crown`, `Sparkles`, `Zap`, `Shield`, `BookOpen`) con marco negro y sombras sólidas; indicador `BST: {bst}`, `CR: {cr}` y `Captura: {Math.round(tasaCaptura * 100)}%` (con `20%` para Golem Granito, `15%` para Behir y `10%` para Remorhaz).
- **Selector de Ordenamiento con Criterio Alfabético:** Incorporación de 6 modos: Hábitat y Rareza (`ZONA_ASC`), Mayor Poder BST (`BST_DESC`), Menor Poder BST (`BST_ASC`), Mayor Rareza (`RAREZA_DESC`), Más Difícil Captura (`CAPTURA_ASC`) y Orden Alfabético (`NOMBRE_ASC`).

#### B. Componentes Táctiles 8bitcn/ui y Hardening

- **Tarjeta Táctica de Senda Sellada con `Progress`:** Visualización precisa del avance cartográfico `${progresoActual}% / ${progresoObjetivo}%` y desglose de requisitos pendientes en Hub y modal `AlertDialog`.
- **Botón Retro de Desbloqueo Territorial:** Acción `DESBLOQUEAR SENDA` conectada a `api.verificarZona` con `aria-busy`, prevención de doble clic y feedback táctil.
- **Insignia "LISTA PARA DESBLOQUEAR":** Notificación dorada de disponibilidad inmediata al cumplir la totalidad de condiciones de cartografía y nivel.

#### C. Integración Multimedia y Audio Retro Centralizado

- **Retroalimentación Acústica:** Fanfarria `confirmar` al desbloquear sendas, `error` ante bloqueos y `click` al interactuar con selectores.

#### D. Reglas de Servidor y Contratos

- **Fórmula Soberana y Determinística de Captura:**
  $$\text{BST} = \text{hpBase} + \text{ataqueBase} + \text{defensaBase} + \text{velocidadBase}$$
  $$\text{tasaCaptura}(\text{BST}) = \text{clamp}\left(0.10,\; 0.85,\; \text{round}\left(\left(1.35 - \frac{\text{BST}}{300}\right) \times 100\right) / 100\right)$$
  Erradica definitivamente el 83 % en Golem Granito ($\text{BST} = 345 \implies \text{tasaCaptura} = 0.20$).
- **Blindaje en `CriaturasService`:** Sincronización soberana directa contra `BESTIARIO` y `calcularTasaCapturaPorPresupuesto`, impidiendo la filtración de tasas obsoletas de BD.
- **Matriz Canónica de Desbloqueo Territorial (`REGLAS_DESBLOQUEO_TERRITORIAL`):**
  - `LOC-02` (Puesto Fronterizo del Río): Cartografiar `ZON-01` al 100%.
  - `ZON-03` (Bosque Susurrante): Cartografiar `ZON-02` al 100%.
  - `ZON-04` (Paso de los Riscos): Cartografiar `ZON-03` al 100% y 1 criatura Nv. 5+.
  - `LOC-03` (Bastión del Norte): Cartografiar `ZON-04` al 100%.
  - `ZON-05` (Cueva Umbría): Cartografiar `ZON-04` al 100% y 3 criaturas en equipo Nv. 5+.
  - `ZON-06` (Pico de la Cumbre): Cartografiar `ZON-05` al 100% y 1 criatura Nv. 10+.
- **Disparadores Transaccionales Idempotentes:** Invocación de `evaluarDesbloqueosAutomaticos` en `ExploracionService`, `CombateService` y `CapturaService`.

---

### 19.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Front-End (`pnpm --filter web test`):**
  - **92 de 92 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Verificación de ordenamiento alfabético `NOMBRE_ASC`, bandas disjuntas de BST, erradicación de anomalía en Golem Granito y cero emojis unicode (R1).
- **Pruebas Automatizadas Backend (`pnpm --filter api test`):**
  - **123 de 123 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Validación de los 5 invariantes matemáticos `J-1` a `J-5`, blindaje contra tasa obsoleta en Golem Granito y grafo territorial completo.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de tipado o empaquetado Vite.

---

## 20. Sub-Fase 10n: Orientación Territorial, Mapa Topológico y Claridad Semántica de Progresión

### 20.1 Diagnóstico Inicial y Auditoría Impeccable

1. **Ambigüedad Semántica Crítica en "Nivel sugerido":**
   - La etiqueta `"Nivel sugerido: 1-3"` en `PantallaHubUbicacion` y `PantallaExploracion` mezclaba erróneamente dos conceptos de dominio incompatibles: el rango de fauna salvaje hostil de la zona (`Zona.nivelMinimo`–`Zona.nivelMaximo`) y el nivel de combate del explorador.
   - En la base de datos de Prisma (`apps/api/prisma/schema.prisma`), el modelo `Personaje` carece legítimamente de columna de nivel; todo el progreso pertenece a `Criatura` (nivel, experiencia y atributos). La UI carecía de una representación visual de este poder real del equipo.
2. **Ausencia de Previa de Hábitat y Ceguera de Encuentros:**
   - Al contemplar los senderos disponibles desde el Hub, el jugador no tenía forma de conocer qué especies de criaturas habitan la zona de destino, obligándolo a navegar a ciegas o consultar externamente la documentación.
3. **Checklist de Requisitos no Estructurado:**
   - La senda hacia zonas avanzadas (`ZON-04`, `ZON-05`, `ZON-06`) mostraba una cadena de texto plana para los requisitos sin desglosar visualmente el avance en cartografía frente a la preparación de criaturas en el equipo activo.
4. **Carencia de Mapa Topológico Territorial:**
   - Los exploradores no contaban con una vista cartográfica general de los 9 nodos del mundo de Aethelgard (`LOC-01` a `LOC-03`, `ZON-01` a `ZON-06`), dificultando la planificación del viaje y la comprensión del avance global en el reino.

---

### 20.2 Mejoras Implementadas

#### A. Identidad Retro y Claridad Semántica: Fauna Salvaje vs. Poder de Equipo

- **Distinción Semántica Canónica:**
  - **Fauna Salvaje:** Etiqueta explícita `Fauna Salvaje: Nivel X - Y` para zonas silvestres, y `Asentamiento Pacífico (Sin Fauna Hostil)` para localidades seguras (`LOC-01`, `LOC-02`, `LOC-03`).
  - **Poder del Equipo y Rango de Domador:** Cálculo soberano en memoria de las métricas tácticas del personaje:
    - `nivelMaximoEquipo`: Nivel más alto entre las criaturas asignadas al equipo activo (1 a 6).
    - `nivelPromedioEquipo`: Promedio aritmético redondeado del equipo activo.
    - `nivelMaximoColeccion`: Nivel más alto considerando todo el inventario (equipo + almacén).
    - `rangoDomador`: Título oficial jerárquico derivado por `determinarRangoDomador` (`Recluta del Gremio`, `Rastreador de Sendas`, `Domador de Riscos`, `Custodio Umbrío`, `Maestro de la Cumbre`).
  - **Chip de Evaluación de Riesgo Táctico:** Clasificación comparativa en tiempo real entre el nivel máximo del equipo y la fauna de la senda:
    - `RIESGO CONTROLADO` (Esmeralda): $\text{nivelMaximoEquipo} \ge \text{faunaNivelMaximo}$.
    - `DESAFÍO EQUILIBRADO` (Cian): $\text{faunaNivelMinimo} \le \text{nivelMaximoEquipo} < \text{faunaNivelMaximo}$.
    - `PELIGRO ELEVADO` (Ámbar/Rojo): $\text{nivelMaximoEquipo} < \text{faunaNivelMinimo}$.
    - `ZONA SEGURA` (Esmeralda/Azul): Destino en asentamiento pacífico.

#### B. Componentes Táctiles 8bitcn/ui y Ergonomía

- **`BannerUbicacionActual.tsx`:**
  - Encabezado con código territorial oficial (`[LOC-01]`, `[ZON-02]`), insignias temáticas Lucide SVG (`ShieldCheck` para asentamientos, `Skull` para zonas silvestres), y badge de fauna salvaje.
  - Barra de cartografía empotrada (`<Progress />`) señalando el porcentaje de exploración o el estado de cartografía completa al 100 %.
  - Panel táctico retro de 4 cajas: Nombre y Rango de Domador, Nivel Máximo y Promedio del Equipo, Saldo de Monedas (`<Coins />`), y Dotación de Criaturas (`X/6 en equipo · Y en almacén`).
  - Píldoras de acceso rápido a servicios locales (`Curación`, `Almacén`, `Tienda`, `Historial`, `Exploración`).
- **`TarjetaSenderoConexion.tsx`:**
  - Cabecera con destino, tipo (`ASENTAMIENTO` con `ShieldCheck` o `ZONA SALVAJE` con `Swords`), y badge de estado de senda.
  - Indicador semántico de nivel de fauna y chip táctico de riesgo.
  - Previa de hábitat y fauna avistada con iconos elementales SVG (`Flame`, `Droplets`, `Leaf`, `Moon`, `Sun`, `Shield`) e insignias de especies legendarias (`Crown`) o especiales (`Sparkles`).
  - Checklist táctico de desbloqueo con iconos SVG `CheckCircle2` (verde) y `XCircle` (rojo) discriminando claramente cartografía previa y nivel/cantidad de criaturas requeridas.
  - Hardening anti-doble clic en botones `DESBLOQUEAR SENDA` y `VIAJAR A ESTA RUTA`.
- **`MinimapaRedTerritorial.tsx`:**
  - Visualización del grafo de los 9 nodos de Aethelgard distribuido en 5 escalones de progresión territorial:
    - _Escalón 1 (Valle Inicial):_ `[LOC-01] Villa Serena`.
    - _Escalón 2 (Sendas Bajas):_ `[ZON-01] Praderas del Amanecer` y `[ZON-02] Riberas del Lago Espejo`.
    - _Escalón 3 (Frontera Media):_ `[LOC-02] Puesto Fronterizo del Río` y `[ZON-03] Bosque Susurrante`.
    - _Escalón 4 (Paso Escarpado):_ `[ZON-04] Paso de los Riscos`.
    - _Escalón 5 (Norte y Cumbre):_ `[LOC-03] Bastión del Norte`, `[ZON-05] Cueva Umbría` y `[ZON-06] Pico de la Cumbre`.
  - Señalética retro con marcadores `AQUÍ` (cian pulsante), `100%` (esmeralda), `EXPLORADA` (ámbar) y `SELLADA` (candado rojo). Diseño responsive sin desbordamiento horizontal (`overflow-x-hidden`).

#### C. Integración Multimedia y Audio Retro

- Respeto del motor centralizado Web Audio API: preservación de fanfarrias de clic, viaje y desbloqueo, con soporte de síntesis polifónica sin bloqueos de reproducción ni fugas de memoria.

#### D. Reglas de Servidor y Contratos Enriquecidos

- **Enriquecimiento de `GET /api/mundo/ubicacion-actual`:**
  - Adición de `faunaNivelMinimo`, `faunaNivelMaximo`, `especiesHabitantes` (resueltas en memoria sin queries N+1 desde `TABLAS_APARICION` y `BESTIARIO`), y `poderEquipo` (calculado a partir de las criaturas del personaje).
  - Adición de `nodosMapa` con el estado cartográfico de las 9 ubicaciones canónicas.
  - Conexiones enriquecidas con objetos de checklist `requisitoCartografia` y `requisitoNivelEquipo` para consumo nativo en interfaces tácticas.
- **Principio YAGNI y Arquitectura Soberana:**
  - Cero migraciones SQL adicionales. El poder del equipo y el rango de domador se calculan de manera pura y determinista a partir de las criaturas asociadas al personaje.

---

### 20.3 Verificación de Calidad y Cero Regresiones

- **Pruebas Automatizadas Backend (`pnpm --filter api test`):**
  - **130 de 130 pruebas aprobadas** (100% de éxito, 41 suites, 0 fallos).
  - Nueva suite dedicada `apps/api/test/mundo.spec.ts` validando la obtención de especies habitantes, cálculo de poder de equipo, rangos de domador y enriquecimiento de `obtenerUbicacionActual`.
- **Pruebas Automatizadas Front-End (`pnpm --filter web test`):**
  - **95 de 95 pruebas aprobadas** (100% de éxito, 0 fallos).
  - Suite ampliada `apps/web/test/verificacion-hub-mundo.spec.ts` certificando helpers de fauna y riesgo, topología de 9 nodos, erradicación de emojis unicode (R1) e invariantes visuales de componentes 8bitcn/ui.
- **Linter de Frontend (`pnpm --filter web lint`):** 0 errores oxlint sobre el monorepo.
- **Compilación de Producción (`pnpm --filter web build`):** 0 errores de tipado TypeScript y empaquetado Vite (`tsc -b && vite build` completado exitosamente).

---

## 21. Optimización Multimedia e Integración de Sprites Canónicos (30 Criaturas)

### 21.1 Diagnóstico Inicial y Auditoría Técnica

- **Inventario maestro inicial:** Se auditaron las 30 ilustraciones fuente `*_2K.jpg` en `/sprites/` (excluidas de Git en `.gitignore`), todas en `2048x2048 px`, orientación perfil `3/4` mirando estrictamente hacia la izquierda (`0` criaturas requerían espejo manual) y fondo negro con ruido de compresión JPEG, totalizando **`65.62 MB`** (`68,812,242 bytes`, ~`1.83`–`2.73 MB` por archivo).
- **Auditoría de consumo y dimensiones reales en UI:** Mediante inspección con Graphify y búsqueda sobre `apps/web/src/`, se verificó que las 9 pantallas consumidoras (`PantallaCombate`, `PantallaCatalogo`, `PantallaEquipo`, `PantallaAlmacen`, `PantallaCuracion`, `PantallaExploracion`, `PantallaInventario`, `PantallaCrearPersonaje` y `PaginaCreditos`) ya resuelven `/assets/criaturas/<slug>.webp` mediante `obtenerImagenCriatura` en `apps/web/src/lib/assets.ts` con respaldo `onError` en cascada hacia `placeholder-criatura.svg`, renderizando en contenedores `36 px`–`128 px` (`size-9` a `size-32`) con `object-contain`, `.pixelated` (`image-rendering: pixelated`) y `scale-x-[-1]` automático para el aliado en arena.
- **Evaluación de alternativas y resolución:** El análisis FFT de las imágenes 2K confirmó tamaños de bloque artístico no enteros respecto a potencias de 2 (`4.6–6.8 px`, ~`300–445 px` efectivos). Se descartaron `PNG` optimizado (~4× más pesado), `AVIF` (decodificación más lenta en grillas de 30 tarjetas) y `NEAREST`/`256 px` (serrucho irregular y pérdida de detalle en extremidades), seleccionando **`512x512 RGBA WebP` (`q=90`, `alpha_quality=100`, `method=6`)** escalado con filtro `BOX` premultiplicado y recorte uniforme `1:1` (`4%` margen) como equilibrio óptimo entre peso y nitidez sobre fondos oscuros (`#090D16`, `#121927`, `#1A2332`).

### 21.2 Mejoras Implementadas

#### A. Identidad Retro Aethelgard y Fidelidad Visual

- **Preservación de silueta y disolución de halos oscuros:** Todas las criaturas conservan su orientación izquierda nativa, proporciones centradas con `4%` de holgura para animaciones/pedestales y contornos limpios sobre fondos tanto oscuros como claros. En una segunda iteración (`v4`), se corrigieron visualmente los defectos de borde detectados en web real mediante dos mejoras críticas: (1) una barrera morfológica perimetral (`pasos=5` en `1024 px`) que sella grietas estrechas e impide filtraciones hacia placas de armadura, corteza o escamas (`pesadilla`, `treant-anciano`, `vibora-rocosa`), y (2) protección de materiales mate oscuros (`gargola`, `treant-anciano`) combinada con rampa alfa suave + descontaminación exclusivamente sobre halos luminosos exteriores saturados sobre negro (`remorhaz-glaciar`, `vibora-rocosa`, `elemental-agua`, `basilisco`, `yeti`, `lobo-invernal`, `behir-abismo`, `anguila-penumbra`, `espectro-ceniza`).
- **Limpieza selectiva de cavidades sin perforar sombras:** La detección de cavidades cerradas exige núcleo puro erosionado `<= 5`, `pct2 >= 72%` y media `<= 1.95`, abriendo solo huecos reales entre alas, espiras, ramas y guadañas sin afectar zonas oscuras sólidas (`mantarraya-espectral`, `arana-gigante`, `pesadilla`).

#### B. Pipeline Multimedia y Optimización en Cliente (`apps/web`)

- **Generación de los 30 sprites canónicos:** Mapeo completo 1 a 1 de las 30 fuentes hacia `apps/web/public/assets/criaturas/<slug>.webp`, bajando el peso total de **`65.62 MB`** (`68,812,242 bytes`) a **`1.96 MB`** (`2,056,686 bytes`, rango **`51.3 KB`** en `escorpion-obsidiana.webp` a **`93.2 KB`** en `yeti.webp`, reducción neta del **`97.01%`**) manteniendo `/sprites/` intacto como respaldo maestro local y cero dependencias agregadas a `package.json`.
- **Decodificación asíncrona en combate:** En `apps/web/src/paginas/PantallaCombate.tsx`, se añadió `decoding="async"` a los sprites principales de rival y aliado para evitar bloqueos del hilo principal al alternar criaturas en relevo o encuentros nuevos; `apps/web/src/lib/assets.ts` se conservó intacto al cubrir ya la resolución `.webp` limpia.
- **Documentación y decisiones arquitectónicas:** Actualización de [apps/web/public/assets/README.md](file:///apps/web/public/assets/README.md) y registro de las decisiones **D-19** y **D-20** en [docs/decisiones.md](file:///docs/decisiones.md).

#### C. Integración Multimedia, Entrega HTTP y Audio Retro

- **Entrega individual sobre atlas:** Se mantuvo el esquema individual `/assets/criaturas/<slug>.webp` aprovechando caché HTTP por criatura y carga diferida (`loading="lazy"`) en grilla, manteniendo las 16 señales de audio Web Audio API de `assets.ts` intactas.

#### D. Reglas de Servidor y Contratos

- Sin cambios en contratos de API ni migraciones de base de datos; se validó correspondencia exacta de nomenclatura contra el arreglo canónico `BESTIARIO` en `apps/api/src/modulos/externo/bestiario-canonico.ts`.

### 21.3 Verificación de Calidad y Cero Regresiones

- **Suite de verificación multimedia (`apps/web/test/verificacion-sprites-criaturas.spec.ts`):** Valida automáticamente que los 30 slugs de `BESTIARIO` posean archivo `.webp` propio (`VP8X`, bit de canal alfa activo, exactamente `512x512 px`, rango de tamaño acotado) y que `obtenerImagenCriatura` no caiga al placeholder SVG.
- **Pruebas Automatizadas Front-End (`pnpm --filter web test`):** **97 de 97 pruebas aprobadas** (0 fallos, 0 omitidas).
- **Linter (`pnpm --filter web lint`):** `0` errores bajo `oxlint` (34 advertencias preexistentes en utilidades previas).
- **Compilación de Producción (`pnpm --filter web build`):** `tsc -b && vite build` completado con 0 errores (`30` archivos `.webp` empaquetados correctamente en `apps/web/dist/assets/criaturas/`).
- **Auditoría visual por láminas de control y composición simulada:** Inspección visual de los 30 sprites decodificados sobre fondo oscuro de arena (`#121927`), fondo neutro de contraste (`#64748b`) y escena dual de combate con reflejo `scale-x-[-1]`. La verificación interactiva vía Chrome DevTools quedó omitida al no encontrarse una instancia de Chrome con depuración remota activa en el entorno local.

---

## 22. Optimización e Integración Multimedia de Entornos, Arenas de Combate y Objetos del Bazar (19 Recursos)

### 22.1 Diagnóstico Inicial y Auditoría Técnica

- **Inventario maestro inicial en `/faltantes/` (respaldo local excluido en `.gitignore`):**
  - _Etapa 1 — Zonas y Localidades (`Etapa-1_Zonas-Villas/`, 9 archivos `.jpg` `2752x1536 px`):_ **`25.33 MB`** totales (`~2.59`–`3.21 MB` por escena), cubriendo las 6 zonas silvestres (`ZON-01`..`ZON-06`) y las 3 localidades seguras (`LOC-01`..`LOC-03`).
  - _Etapa 2 — Escenarios de Combate (`Etapa-2_Zonas-Combates/`, 6 archivos `.jpg` `2752x1536 px`):_ **`15.76 MB`** totales (`~2.41`–`2.91 MB` por arena diagonal `ZON-01`..`ZON-06`).
  - _Etapa 3 — Objetos del Bazar (`Etapa-3_Objetos/`, 4 archivos `.jpg` `2048x2048 px`):_ **`7.02 MB`** totales (`~1.45`–`1.99 MB` por ítem) sobre fondo negro `#000000` sin transparencia nativa (`Poción de Curación Menor`, `Poción de Curación Mayor`, `Talismán Básico de Captura`, `Talismán Avanzado de Captura`).
  - **Peso acumulado original:** **`48.11 MB`** (`50,450,183 bytes`).
- **Auditoría de consumo en UI y contratos (`apps/web/src`):** Se comprobó mediante inspección directa que `BannerUbicacionActual.tsx`, `PantallaCuracion.tsx` y `PantallaExploracion.tsx` ya resuelven `/assets/zonas/<slug>.webp` mediante `obtenerImagenZona(slugZona)` + `sanitizarSlugZona`; `BattlefieldBackground.tsx` consume `/assets/battlegrounds/<slug>.webp` con respaldo progresivo hacia `caverna-cristal.svg`; y `PantallaCombate.tsx`, `PantallaTienda.tsx`, `PantallaInventario.tsx` y `PantallaExploracion.tsx` consumen `/assets/objetos/<codigo>.webp` con `obtenerImagenObjeto(codigo)` y `loading="lazy"` en listados.

### 22.2 Mejoras Implementadas

#### A. Identidad Retro Aethelgard y Fidelidad Visual

- **Preservación de proporción `16:9` sin distorsión ni franjas negras:** Se auditó la posible presencia de marcos en `Puesto_Fronterizo_del_Río_(LOC-02).jpg`, verificando que corresponde a viñeta oscura continua y no a _letterboxing_. Al tener las fuentes una relación `2752x1536` (`1.7917`), se aplicó recorte horizontal simétrico al centro (`2731x1536`) antes de reescalar a `800x450 px`, manteniendo las plataformas de suelo despejadas abajo-izquierda y arriba-derecha en las 6 arenas.
- **Extracción alfa quirúrgica para vidrio, obsidiana y destellos aditivos (`objetos/`):** Se afinó un extractor en `1024x1024` previo al submuestreo premultiplicado a `256x256` que distingue entre material sólido oscuro de baja saturación y halos luminosos externos saturados sobre negro. Esto sella herméticamente la cámara superior de vidrio oscuro de `pocion-menor.webp` y `pocion-mayor.webp` sin perforarla, y conserva los rayos y chispas sueltos de `talisman-avanzado.webp` y `talisman-basico.webp` mediante des-premultiplicación aditiva suave sin generar bloques opacos ni bordes negros sobre fondos claros u oscuros.

#### B. Pipeline Multimedia y Optimización en Cliente (`apps/web`)

- **`apps/web/public/assets/zonas/` (9 archivos `800x450` `WebP VP8` `q=90`, filtro `BOX`):** De **`25.33 MB`** a **`808.0 KB` (`0.79 MB`)**, ahorro del **`96.88%`** (rango `75.3 KB` en `puesto-fronterizo-del-rio.webp` a `117.9 KB` en `villa-serena.webp`).
- **`apps/web/public/assets/battlegrounds/` (6 archivos `800x450` `WebP VP8` `q=90`, filtro `BOX`):** De **`15.76 MB`** a **`480.1 KB` (`0.47 MB`)**, ahorro del **`97.03%`** (rango `67.6 KB` en `cueva-umbria.webp` a `96.5 KB` en `praderas-del-amanecer.webp`), conservando `caverna-cristal.svg` intacto como respaldo estructural.
- **`apps/web/public/assets/objetos/` (4 archivos `256x256` `WebP VP8X` RGBA `q=90` / `alpha_quality=100`):** De **`7.02 MB`** a **`94.2 KB` (`0.09 MB`)**, ahorro del **`98.69%`** (`18.1 KB` a `31.7 KB` c/u, con márgenes de seguridad `>= 13 px` por lado).
- **Balance total de los 19 recursos:** **`48.11 MB`** (`50,450,183 bytes`) → **`1.35 MB`** (`1,415,486 bytes`), reducción neta del **`97.19%`**, manteniendo `/faltantes/` fuera de control de versiones en `.gitignore` y cero dependencias agregadas a `package.json`.
- **Sincronización documental y arquitectónica:** Actualización de [apps/web/public/assets/README.md](file:///apps/web/public/assets/README.md), [docs/INDICE.md](file:///docs/INDICE.md) y decisión **D-21** en [docs/decisiones.md](file:///docs/decisiones.md).

#### C. Integración Multimedia, Entrega HTTP y Audio Retro

- Entrega individual por ruta canónica (`/assets/zonas/*.webp`, `/assets/battlegrounds/*.webp`, `/assets/objetos/*.webp`) sin alterar el motor procedural Web Audio API ni los contratos de resolución en `apps/web/src/lib/assets.ts`.

#### D. Reglas de Servidor y Contratos

- Sin cambios en endpoints ni migraciones de base de datos; nomenclatura verificada 1 a 1 contra las 9 ubicaciones en `MundoService` (`apps/api/src/modulos/mundo/mundo.service.ts`) y los 4 ítems sembrados en `apps/api/prisma/seed.ts`.

### 22.3 Verificación de Calidad y Cero Regresiones

- **Suite de verificación multimedia (`apps/web/test/verificacion-assets-entornos-objetos.spec.ts`):** Valida automáticamente la correspondencia 1 a 1 de las 9 ubicaciones, 6 arenas y 4 objetos frente a servidor (`MundoService` y `seed.ts`), encabezados WebP `RIFF/WEBP`, chunk `VP8 ` `800x450` en escenarios, `VP8X` con canal alfa `256x256` en ítems, ausencia de caída a placeholders SVG y pesos acotados.
- **Pruebas Automatizadas Front-End (`pnpm --filter web test`):** **99 de 99 pruebas aprobadas** (`0` fallos, `0` omitidas, `1579.81 ms`).
- **Linter (`pnpm --filter web lint`):** `0` errores bajo `oxlint` (`34` advertencias preexistentes en componentes previos, `500 ms`).
- **Compilación de Producción (`pnpm --filter web build`):** `tsc -b && vite build` completado con `0` errores en **`4.04 s`**.
- **Inspección visual directa sobre láminas de control:** Verificación en comparación `BOX` vs `BICUBIC` vs `LANCZOS` sobre paisajes, mosaico `15/15` en `800x450` sin bandas negras y láminas de contraste claro/oscuro (`#090d16`) + máscara alfa pura para los 4 objetos sin artefactos de borde.

---

## 23. Mejora de Hub: Mapa Interactivo Navegable en Canvas, HUD Flotante y Transición 2D (`funcionalidad/mapa-interactivo-hub`)

### 23.1 Problema que Resuelve y Objetivo

Aunque el Hub anterior contaba con un minimapa estático por escalones y tarjetas de rutas, la experiencia seguía percibiéndose como una página web tradicional con scroll vertical en lugar de un videojuego RPG. Esta mejora migra el Hub (`/hub`) a una **interfaz de juego a pantalla completa (`100dvh`)** con estética **16-bit dark fantasy (tenebrosa)**, permitiendo explorar el archipiélago de Aethelgard directamente sobre un lienzo interactivo, inspeccionar cada isla antes de decidir si viajar y presenciar una transición animada 2D con la criatura líder del equipo al desplazarse entre zonas.

---

### 23.2 Arquitectura e Implementación

#### A. Cartografía Virtual y Paleta Tenebrosa (`apps/web/src/lib/mapa-mundo.ts`)

- **Espacio Lógico de 9 Islas:** Define `DIMENSIONES_MAPA_MUNDO` (`1200 × 760` unidades) y `CONFIGURACION_ISLAS_MAPA` para los 9 nodos canónicos (`LOC-01` a `LOC-03`, `ZON-01` a `ZON-06`) conectados según `CONEXIONES_AETHELGARD`.
- **Ambientación Oscura (Dark Fantasy):** Cada bioma cuenta con paleta nocturna (`colorSuelo`, `colorBorde`, `colorCielo`, `colorAcento`) acorde a `apps/web/public/assets/README.md`: mar abisal oscuro, puerto con cabañas sombrías, estepa crepuscular con monolitos rúnicos, lago bioluminiscente, bosque maldito, riscos de obsidiana, bastión gótico, volcán con lava pulsante y cumbres lunares.

#### B. Mapa Navegable en `<canvas>` (`apps/web/src/components/mundo/MapaInteractivoCanvas.tsx`)

- **Capas `absolute` + `relative`:** El `<canvas>` ocupa el fondo con `position: absolute; inset: 0`, mientras los marcadores de cada isla y los controles de cámara flotan en una capa `relative` sincronizada.
- **Navegación y Zoom Responsive:**
  - Paneo libre mediante `PointerEvents` (arrastre con ratón o pantalla táctil en móvil).
  - Zoom con rueda del ratón (`0.55x` a `2.0x`) y botonera flotante (`+`, `-`, `Centrar`), con centrado automático en la ubicación actual al cargar o cambiar de tamaño de pantalla.
- **Renderizado 2D Provisional y Soporte de Arte Final:**
  - Dibuja olas nocturnas, peñascos, puentes de madera desgastada (continuos si la ruta está desbloqueada, punteados si está sellada), niebla desplazándose y detalles animados por bioma (faroles ámbar parpadeantes, runas, esporas espectrales y lava).
  - Si el equipo coloca una ilustración definitiva en `/assets/zonas/mapa-mundo.webp`, el canvas la carga automáticamente como fondo; mientras tanto opera con el renderizado procedural 16-bit.
  - Muestra el sprite de la **criatura líder** (`equipo[0]`) con el distintivo `TÚ AQUÍ` sobre la isla actual.
  - Viñeta radial calibrada a las dimensiones reales del canvas escaladas por `devicePixelRatio` (`canvas.width`, `canvas.height`) para evitar cortes rectangulares en pantallas con escalado DPI.

#### C. Pantalla de Carga / Transición Animada 2D (`apps/web/src/components/mundo/TransicionViaje2D.tsx`)

- **Escena Nocturna de Travesía (~1.85 s):** Al confirmar un viaje (`api.viajar()`), despliega un `<canvas>` 2D con transición de cielo entre el bioma origen y destino, luna pálida, niebla en parallax, mar abisal y un puente viejo iluminado por faroles ámbar parpadeantes.
- **Animación del Líder y Audio Retro:** El sprite de la criatura líder (obtenido de `api.obtenerEquipo()`, invertido horizontalmente con `ctx.scale(-1, 1)` porque los sprites canónicos miran a la izquierda, con fallback seguro a `placeholder-criatura.svg`) avanza saltando por el puente generando partículas de polvo y disparando `reproducirSonido("paso")` durante el trayecto y `reproducirSonido("confirmar")` al llegar.

#### D. Hub a Pantalla Completa y HUD Flotante (`LayoutPrincipal.tsx` y `PantallaHubUbicacion.tsx`)

- **Viewport de Juego (`100dvh`):** `LayoutPrincipal.tsx` aplica el modo sin scroll ni cabecera/pie web a `/hub` (igual que `/combate`).
- **HUD Flotante `relative`:**
  - **Superior:** Ficha del explorador (avatar del líder, nombre, nivel máximo, ubicación actual y `%` de progreso), saldo de monedas y botón de engrane (`Settings`) con acceso a `Kit de interfaz`, `Créditos` y cierre de sesión (`SALIR`).
  - **Laterales:** Accesos rápidos flotantes a `Compendio`, `Bitácora`, `Almacén` (izquierda) y `Santuario`, `Tienda / Bazar`, `Inventario` (derecha), indicando con candado cuando un servicio no está habilitado en la localidad actual.
  - **Inferior (Dock):** Ranuras rápidas del equipo activo (enlace a `/equipo`) y botón principal central **`EXPLORAR`** (en zonas silvestres) o **`VIAJAR`** (en localidades seguras).
- **Modal de Decisión de Viaje (`AlertDialog`):** Al hacer clic en cualquier isla del mapa se abre un cuadro retro `8bitcn/ui` con vista previa de la zona, rango de fauna, barra de cartografía, requisitos de desbloqueo y acciones según estado (`EMPRENDER CAMINO`, `DESBLOQUEAR SENDA`, `EXPLORAR ZONA` o `PERMANECER`).
- **Soberanía del Servidor Intacta:** No se modificó ningún endpoint ni regla de negocio en `apps/api`; toda validación de viaje, desbloqueo y equipo sigue residiendo en el Back-End.

---

### 23.3 Control de Archivos (Agregados y Modificados)

|    Estado    | Archivo                                                   | Propósito                                                                                           |
| :----------: | :-------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Agregado** | `apps/web/src/lib/mapa-mundo.ts`                          | Coordenadas virtuales (`1200×760`) y paletas dark-fantasy de las 9 islas.                           |
| **Agregado** | `apps/web/src/components/mundo/MapaInteractivoCanvas.tsx` | Mapa interactivo en `<canvas>` (`absolute`) con paneo, zoom, niebla, viñeta DPR y nodos `relative`. |
| **Agregado** | `apps/web/src/components/mundo/TransicionViaje2D.tsx`     | Pantalla de carga 2D animada con la criatura líder cruzando el puente y sonido retro.               |
| **Editado**  | `apps/web/src/components/LayoutPrincipal.tsx`             | Habilita pantalla completa `100dvh` para la ruta `/hub`.                                            |
| **Editado**  | `apps/web/src/paginas/PantallaHubUbicacion.tsx`           | Migra el Hub al HUD flotante sobre el mapa interactivo y conecta `TransicionViaje2D`.               |
| **Editado**  | `apps/web/test/verificacion-hub-mundo.spec.ts`            | Actualiza las aserciones estáticas para validar `MapaInteractivoCanvas` y `TransicionViaje2D`.      |

---

### 23.4 Verificación de Calidad y Cero Regresiones

- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript.
- **Pruebas Unitarias Web (`pnpm --filter web test`):** 95 de 95 pruebas aprobadas (0 fallos).
- **Linter Web (`pnpm --filter web lint`):** 0 errores en 86 archivos.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`).

---

## 24. Sub-Fase 10o: Consolidación del Hub RPG en Canvas Interactivo, Transición 2D y Paridad Táctica (`PantallaHubUbicacion.tsx`)

### 24.1 Diagnóstico Inicial y Auditoría Impeccable

Tras integrar el PR #53 (`funcionalidad(hub): integrar mapa interactivo navegable y transicion 2d`) en la rama `desarrollo`, se ejecutó una auditoría técnica y heurística sobre el nuevo Hub interactivo sobre `<canvas>` detectando tres brechas críticas respecto a la especificación alcanzada en las subfases 10m y 10n:

1. **Condición de carrera en la transición 2D de viaje (`TransicionViaje2D.tsx` y `PantallaHubUbicacion.tsx`):** La referencia `onCompletadoRef.current = onCompletado` se actualizaba directamente durante el render y el cierre de la transición dependía de un estado reactivo `pendienteTrasAnimacion` acoplado a un `useEffect`. Si la petición `api.viajarAUbicacion` demoraba más de `1850ms` mientras la animación finalizaba primero, el flujo quedaba expuesto a un bloqueo de carga, además de generar advertencias de `oxlint` por reglas de hooks.
2. **Pérdida de paridad táctica de las Subfases 10m/10n en el Hub (`PantallaHubUbicacion.tsx`):** Al migrar a tarjetas flotantes y modal de isla sobre el canvas, se omitieron el indicador `rangoDomador` en el HUD superior, la sección de fauna del hábitat (`especiesHabitantes`), el checklist completo de progreso y requisitos de desbloqueo (`requisitoCartografia`, `requisitoNivelEquipo`, `detalleProgreso`), el atributo `aria-busy` en el botón de desbloqueo, el confinamiento de altura del modal (`max-h-[90dvh] overflow-y-auto overflow-x-hidden`) y la exportación por defecto (`export default PantallaHubUbicacion;`).
3. **Bloqueo en consulta de servicios laterales e indicador en zonas salvajes:** El acceso a rutas laterales restringía innecesariamente el modo consulta en pantallas que ya lo soportan (`PantallaTienda`, `PantallaCuracion`, `PantallaAlmacen`, `PantallaHistorial`), requiriendo diferenciar claramente la navegación de consulta frente a la disponibilidad operativa real (`activoEnZona` según `esSegura`).

### 24.2 Mejoras Implementadas

#### A. Identidad Visual Retro y Paridad Táctica (`PantallaHubUbicacion.tsx`)

- Restauración del distintivo `rangoDomador` dentro de la tarjeta superior del HUD flotante sobre el mapa interactivo.
- Incorporación del bloque táctico **"Fauna del Hábitat"** listando `especiesHabitantes` dentro del detalle de la isla seleccionada.
- Reincorporación del panel **"PROGRESO DE DESBLOQUEO"** con `requisitoCartografia`, `requisitoNivelEquipo`, `detalleProgreso` y la indicación de ruta **"LISTA PARA DESBLOQUEAR"**.
- Confinamiento responsivo del cuadro de diálogo (`AlertDialogContent`) mediante `max-h-[90dvh] overflow-y-auto overflow-x-hidden` para evitar desbordamiento en pantallas compactas.

#### B. Componentes `8bitcn/ui`, Accesibilidad y Reglas del Proyecto (R1)

- Preservación integral de iconografía SVG de Lucide sin emojis Unicode en los módulos nuevos y modificados (`PantallaHubUbicacion.tsx`, `MapaInteractivoCanvas.tsx`, `TransicionViaje2D.tsx` y `mapa-mundo.ts`), validada por pruebas automatizadas.
- Añadido de `aria-busy` en el botón de desbloqueo territorial para prevenir dobles envíos durante la llamada al servidor.
- Restauración de `export default PantallaHubUbicacion;` para mantener compatibilidad con importaciones existentes.

#### C. Sincronización Determinista de `TransicionViaje2D` y Higiene de Hooks

- En `apps/web/src/components/mundo/TransicionViaje2D.tsx`, la sincronización de `onCompletadoRef.current = onCompletado;` se trasladó dentro de `useEffect`, evitando mutar referencias durante el render.
- En `apps/web/src/paginas/PantallaHubUbicacion.tsx`, se reemplazó el patrón de estado reactivo `pendienteTrasAnimacion` + `useEffect` por referencias deterministas (`montadoRef`, `animacionCompletadaRef`, `viajePendienteRef`) coordinadas mediante el callback `finalizarViajeSiListo`, eliminando el riesgo de bloqueo cuando la API supera el tiempo mínimo de animación y erradicando las advertencias de `oxlint` en los archivos modificados.

#### D. Reglas de Servidor y Consulta Libre de Servicios Laterales

- En `renderBotonFlotanteServicio` dentro de `PantallaHubUbicacion.tsx`, los botones laterales permiten navegar libremente a sus rutas en modo consulta, mientras el indicador visual `activoEnZona` evalúa con precisión la regla de zonas seguras del servidor (`esSegura === false` marca como inactivos operativamente `CURACION`, `TIENDA` y `ALMACEN` fuera de localidades seguras).

### 24.3 Verificación de Calidad y Cero Regresiones

- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó sin errores (`LINT=0`) sobre 88 archivos evaluados (34 advertencias preexistentes en módulos previos; 0 advertencias en `PantallaHubUbicacion.tsx`, `TransicionViaje2D.tsx`, `MapaInteractivoCanvas.tsx` y `verificacion-hub-mundo.spec.ts`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** 99 de 99 pruebas aprobadas (0 fallos, 0 omitidas), ampliando `apps/web/test/verificacion-hub-mundo.spec.ts` para verificar ausencia de emojis en `MapaInteractivoCanvas.tsx`, `TransicionViaje2D.tsx` y `mapa-mundo.ts`, presencia de `requisitoCartografia`, `requisitoNivelEquipo`, `especiesHabitantes`, `rangoDomador`, `finalizarViajeSiListo`, `export default PantallaHubUbicacion` y cobertura de las 9 islas en `CONFIGURACION_ISLAS_MAPA`.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, 2160 módulos transformados en `1.82s`).
- **Pruebas Unitarias API (`pnpm --filter api test`):** 130 de 130 pruebas aprobadas en 41 suites (0 fallos, 0 omitidas).

---

## 25. Adenda de Retroalimentación Visual, "Game Feel", Cartas Tácticas y Control de Audio Retro (PR #55)

Con el objetivo de enriquecer la experiencia visual e interactiva del jugador manteniendo intactas la jugabilidad por turnos y todas las reglas autoritativas del servidor (`apps/api`), se incorporaron mejoras visuales y sensoriales en `apps/web`:

### 25.1 Mejoras Implementadas

1. **Mapa Interactivo más Vivo e Informativo (`apps/web/src/components/mundo/MapaInteractivoCanvas.tsx`):**
   - **Tooltip rico al hacer hover o enfocar un nodo:** Despliega una ficha flotante con el nombre de la ubicación, etiqueta del bioma, estado de viaje (actual, conectada, desbloqueable o bloqueada) y servicios disponibles (Santuario/Tienda en localidades seguras; rango de nivel de fauna y porcentaje explorado en zonas salvajes).
   - **Iconografía directa en placas de nodo:** Añade indicadores compactos de Santuario (`Heart`), Tienda (`Store`) y seguridad (`ShieldCheck`) en localidades, y de combate (`Swords` + `Nv. X-Y`) en zonas silvestres desbloqueadas.
   - **Flujo animado en rutas alcanzables:** Dibuja un resplandor y partículas en movimiento sobre los puentes conectados directamente desde la ubicación actual hacia destinos viajables o desbloqueables.
   - **Partículas ambientales por bioma:** Renderizado determinista en `<canvas>` de brasas, copos glaciales, luciérnagas y destellos acuáticos acordes al bioma de cada isla desbloqueada.

2. **Combate por Turnos con "Game Feel" y Cartas Tácticas (`PantallaCombate.tsx`, `index.css` y `health-bar.tsx`):**
   - **Estela de daño retardada en barras de vida (`apps/web/src/components/ui/8bit/health-bar.tsx`):** Cuando la salud disminuye, una barra secundaria ámbar permanece brevemente y se drena suavemente sin alterar el cálculo real de HP (actualizada de forma asíncrona para evitar cascadas de render en `useEffect`).
   - **Cartas Tácticas Elevables (`PantallaCombate.tsx`):** Los 4 slots del menú `ATACAR` (`C1..C4`) se presentan como cartas tácticas con coreografía diferenciada (_Físico_ → `Embestida`, _Elemental_ → `Proyectil`, _Defensivo/Estado_ → `Escudo`, _Insignia_ → clímax dorado y mini-zoom), respiración continua en reposo (`anim-respiracion-combate`), asistente contextual `TÁCTICA:` y aviso central de ataque enemigo.
   - **Etiquetas de efectividad e insignia en daño flotante:** `resolverEtiquetaImpacto()` lee `efectividad` (`VENTAJA`, `DESVENTAJA`) y `esInsignia` para mostrar etiquetas retro (`¡INSIGNIA!`, `¡MUY EFICAZ x1.5!`, `RESISTIDO x0.75`).

3. **Viaje y Exploración más Inmersivos (`TransicionViaje2D.tsx` y `PantallaExploracion.tsx`):**
   - **Clima dinámico de destino en `TransicionViaje2D.tsx`:** Partículas ambientales acordes al bioma de destino que se intensifican conforme avanza la travesía.
   - **Destello de encuentro y rastreo visual en `PantallaExploracion.tsx`:** Barra de rastreo (`RASTREANDO SENDAS...`) durante la petición de exploración y destello visual breve (carmesí en encuentro normal, ámbar dorado en avistamiento legendario).

4. **Control Global de Sonido Retro 8-bit (`assets.ts`, `LayoutPrincipal.tsx` y `MapaInteractivoCanvas.tsx`):**
   - **Persistencia en `localStorage` (`aethelgard_sonido_silenciado`):** Funciones `estaSonidoSilenciado()`, `establecerSonidoSilenciado()` y `alternarSonidoSilenciado()` respetadas automáticamente por `reproducirSonido()`.
   - **Botón accesible Silenciar / Activar (`Volume2` / `VolumeX`):** Integrado en la barra de navegación de `LayoutPrincipal.tsx` y junto a los controles de cámara en `MapaInteractivoCanvas.tsx`.

---

## 26. Calibración de Escenarios Reales, Mapa Volcánico, Ataques Precisos y Audio Ambiente (PR #55)

### 26.1 Problemas Detectados Tras la Integración de Escenarios WebP

1. **Superposición CSS sobre las ilustraciones de combate (`BattlefieldBackground.tsx`):** La rejilla 2.5D y pilares procedurales se renderizaban también cuando la imagen `.webp` real ya estaba cargada, tapando la iluminación y el relieve natural de los escenarios.
2. **Desalineación de criaturas y cartas HUD según la arena (`PantallaCombate.tsx`):** Cada una de las 6 arenas (`/assets/battlegrounds/*.webp`) ubica sus plataformas a distintas alturas y márgenes. Una única disposición flexbox fija hacía que en ciertas zonas los sprites flotaran o quedaran desplazados respecto a la roca.
3. **Proyectiles saliendo detrás de las cartas y ataques físicos sin impacto visible (`PantallaCombate.tsx` + `index.css`):** Los proyectiles usaban coordenadas CSS fijas y un `z-index` en el contenedor padre, naciendo detrás de las cartas HUD en ciertas arenas, y faltaba destello de impacto unificado (`anim-impacto-golpe`).
4. **Identidad visual del mapa de islas, HUD superior y audio ambiente (`MapaInteractivoCanvas.tsx`, `PantallaHubUbicacion.tsx`, `TransicionViaje2D.tsx`, `assets.ts`):** Se requerían las ilustraciones reales `/assets/zonas/*.webp` en cada isla, ambientación de obsidiana/magma acorde al tema _dark fantasy_, miniaturas de zona actual/destino y música ambiental suave diferenciada para hub y combate.

### 26.2 Soluciones y Mejoras Implementadas

| Archivo                                                     | Mejoras y Soluciones Aplicadas                                                                                                                                                                                                                                |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/components/combate/BattlefieldBackground.tsx` | Cuando `pasoFallback === 0` y no hay video, la arena `.webp` se muestra a opacidad completa (`opacity-100`) sin capas CSS encima; el escenario procedural 2.5D queda únicamente como respaldo si falla la carga de imagen.                                    |
| `apps/web/src/lib/battlegrounds.ts` _(nuevo)_               | Tabla `CALIBRACION_ARENAS_ZONA` y helper `obtenerCalibracionArena(zoneId)` con coordenadas calibradas para los 6 escenarios `800x450` y anclaje de cartas HUD en esquinas libres.                                                                             |
| `apps/web/src/paginas/PantallaCombate.tsx`                  | Posicionamiento absoluto por plataforma con `clamp(...)`; sombras de contacto sutiles; `proyectilActivo` e `impactoVisual` en `z-40` por encima de las cartas HUD (`z-20`) usando coordenadas reales origen-destino; activación de audio ambiente de combate. |
| `apps/web/src/index.css`                                    | Unificación de `.anim-proyectil-aliado` / `.anim-proyectil-rival` mediante variables CSS dinámicas (`--origen-x`, `--origen-y`, `--destino-x`, `--destino-y`) y animación `.anim-impacto-golpe`.                                                              |
| `apps/web/src/components/mundo/MapaInteractivoCanvas.tsx`   | Precarga y recorte elíptico de las 9 ilustraciones reales de `/assets/zonas/*.webp` sobre la superficie de cada isla; fondo abisal de obsidiana con ríos de magma pulsante, brasas ascendentes y anillo rúnico rotatorio en la isla actual.                   |
| `apps/web/src/paginas/PantallaHubUbicacion.tsx`             | Miniatura panorámica `16:9` de la zona actual en el HUD superior, barras de HP en el dock inferior, etiquetas `Disponible` / `Solo consulta` en servicios laterales y audio ambiente del hub.                                                                 |
| `apps/web/src/components/mundo/TransicionViaje2D.tsx`       | Vista previa de la zona destino (`DESTINO`) junto al lienzo animado; abismo de magma vivo bajo el puente, faroles que se encienden al paso del líder, estela cian y destello de portal al llegar.                                                             |
| `apps/web/src/lib/assets.ts`                                | Motor de audio ambiente suave con Web Audio API (`iniciarMusicaAmbiente("hub" \| "combate")`, `detenerMusicaAmbiente`) con filtro paso-bajo, baja ganancia y sincronización con el estado de silencio global.                                                 |
| `apps/web/src/components/ui/8bit/health-bar.tsx`            | Refactorización del efecto de estela retardada para evitar llamadas síncronas `setState` dentro de `useEffect` (0 advertencias nuevas en `oxlint`).                                                                                                           |

### 26.3 Verificación de Calidad Tras la Integración Final en `desarrollo`

- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó sin errores sobre **89 archivos** (`LINT=0`, 34 advertencias preexistentes en módulos previos; 0 advertencias nuevas tras la corrección en `health-bar.tsx`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **99 de 99 pruebas aprobadas** (`0` fallos, `0` omitidas).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, 2161 módulos transformados en `5.33s`).
- **Reglas de negocio:** Las reglas del combate por turnos, contratos de API y esquema de base de datos permanecen intactos.

---

## 27. Sub-Fase 10p: Rediseño Híbrido del Mapa Mundial 2D Dark Fantasy en Canvas, Calibración Geométrica e Iluminación Viva a 60 FPS (`MapaInteractivoCanvas.tsx`)

Con el objetivo de llevar el mapa interactivo del Hub (`/hub`) a un acabado visual de videojuego RPG comercial sin alterar un solo píxel de la interfaz retro circundante, la paleta de biomas ni las reglas autoritativas de navegación territorial, se ejecutó la **Sub-Fase 10p** sobre la rama `funcionalidad/fase-10p-mapa-dioramas-canvas`.

### 27.1 Diagnóstico Inicial y Auditoría Impeccable

1. **Apariencia genérica de elipses aisladas:** La versión anterior recortaba 9 retratos panorámicos `.webp` dentro de óvalos uniformes conectados por trazos rectos originados en el centro `(isla.x, isla.y)`, generando islas desconectadas del océano y con sensación visual básica frente a la dirección artística Dark Fantasy buscada.
2. **Cohesión geográfica y continuidad oceánica:** Al utilizar la ilustración maestra pixel-art de 9 islas (`1679×937`), el alejamiento de cámara o el desplazamiento hacia los extremos requería extender de forma natural el gradiente oceánico profundo y difuminar el perímetro de la lámina para evitar cortes rectangulares o bordes negros.
3. **Traslapes potenciales entre placas, marcador `"TÚ AQUÍ"` y puentes:** En un lienzo denso con 9 islas y 10 puentes de mampostería/madera, anclar todas las etiquetas con un único desplazamiento vertical uniforme `(radioY + 38)` provocaba cruces puntuales sobre el puente sur de _Praderas_, el viaducto este de _Puesto del Río_, el cristal sur de _La Cumbre_ o el emblema `"TÚ AQUÍ"` del _Bosque Susurrante_.

### 27.2 Mejoras Implementadas

#### A. Identidad Visual Dark Fantasy y Arquitectura Híbrida (`mapa-mundo.ts`, `mapa-dioramas.ts`, `MapaInteractivoCanvas.tsx`)

- **Ilustración maestra y océano continuo:** Incorporación de `apps/web/public/assets/zonas/mapa-mundo-aethelgard.png` (`DIMENSIONES_MAPA_MUNDO = 1679×937`, con carga asíncrona en `mapaImagenRef` y respaldo vectorial automático mediante `dibujarRespaldoIslasBase`), extendida por `dibujarFondoOceanoContinuo` (`#002040 → #002c50 → #002345` con destellos de oleaje) y `dibujarFusionBordesMapa` para lograr un océano infinito sin costuras.
- **Capa viva 60 FPS calibrada por bioma (`dibujarCapaVivaMapa`):** Conservando intactas las paletas cromáticas originales de cada región (`CONFIGURACION_ISLAS_MAPA`), se superpusieron velos de niebla sobre islas aún bloqueadas, aro rúnico cian pulsante alrededor de la costa actual (`trazarPoligonoLocal` con `generarGeometriaDiorama`), flujo guiado de orbes sobre los 10 trayectos Bezier cuadráticos calibrados (`TRAYECTOS_PUENTES_AETHELGARD`: verdes esmeralda en rutas viajables, ámbar en sendas desbloqueables y sombra en accesos cerrados) y micro-animaciones bioma por bioma respetando `prefers-reduced-motion`:
  - **Villa Serena (`LOC-01`):** brillo pulsante en la fuente central, faroles cálidos nocturnos y columnas de humo ascendentes en chimeneas.
  - **Praderas (`ZON-01`):** destellos en los monolitos rúnicos esmeralda/cian y motas doradas flotantes.
  - **Puesto del Río (`LOC-02`):** pebeteros encendidos en atalayas con chispas cálidas y estela espumosa animada sobre la cascada frontal.
  - **Lago Espejo (`ZON-02`):** halo prismático central, destellos cian en cristales costeros y neblina arcana ascendente.
  - **Bosque Susurrante (`ZON-03`):** luciérnagas verde esmeralda orbitando suavemente el claro del trono.
  - **Paso de los Riscos (`ZON-04`):** fulgor de brasas en grietas rocosas, humo de cumbre y pavesas naranjas ascendentes.
  - **Bastión del Norte (`LOC-03`):** pebeteros ardientes en las tres torres principales y nieve ligera en descenso.
  - **Cueva Umbría (`ZON-05`):** coladas de magma incandescentes con chispas ascendentes y arcos eléctricos violeta sobre los cristales del norte.
  - **Pico de la Cumbre (`ZON-06`):** cortinas ondulantes de aurora boreal verde/cian, destellos glaciares y nevada ártica.

#### B. Componentes `8bitcn/ui`, Navegación Responsive y Preservación de la UI

- **Conservación estricta de la interfaz HUD (R1 y estética existente):** Panel de jugador superior, medidor de experiencia, monedas, configuraciones, menús laterales (`Almacén`, `Compendio Open5e`, `Bitácora`, `Inventario`, `Tienda / Bazar`, `Santuario de Salud`), dock inferior de criaturas, botón `EXPLORAR`, controles de zoom/recentrado/audio, tooltip interactivo, placa `"TÚ AQUÍ"` y consumo de `/assets/zonas/*.webp` en HUD/modales permanecen intactos.
- **Compensaciones anti-traslape (`placaOffsetX` / `placaOffsetY`) e inspección geométrica:** Calibración individual de cada placa bajo su acantilado sur (`MapaInteractivoCanvas.tsx` + `CONFIGURACION_ISLAS_MAPA`) para dejar despejados los 10 puentes y evitar colisiones incluso con la placa activa `"TÚ AQUÍ"`.
- **Cámara en escritorio y móvil:** Auto-centrado automático en `ubicacionActualId` al abrir o viajar (`centrarEnUbicacion`), ampliación de `ZOOM_MINIMO` a `0.5` para vista panorámica completa en escritorio, preservación de escala natural en móvil (`zoomInicial = 0.9` sin comprimir el archipiélago), arrastre táctil (`touch-none`), zoom por rueda y gestos _pinch-to-zoom_ (`pinchRef`).

#### C. Audio Web Audio API y Reglas del Servidor

- **Sin alteración de contratos ni lógica del servidor:** Se conservan todas las reglas autoritativas de `CONEXIONES_AETHELGARD`, `TOPOLOGIA_AETHELGARD`, validación de viajes y desbloqueos en `apps/api`, manteniendo los efectos de clic/viaje sintetizados con Web Audio API y el control global de silencio (`Volume2` / `VolumeX`).

### 27.3 Verificación de Calidad y Cero Regresiones

- **Verificación Visual de Calibración sobre Lámina Real (`1679×937`):** Superposición bitmap verificada visualmente confirmando coincidencia exacta de los 9 contornos, las 9 placas (`placaOffsetX/Y`), las 9 áreas `"TÚ AQUÍ"` y los 10 trayectos Bezier cuadráticos sobre las pasarelas pintadas del mapa.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó sin errores en **90 archivos** (`LINT=0`, 34 advertencias preexistentes en módulos previos; 0 advertencias nuevas en `mapa-mundo.ts`, `mapa-dioramas.ts`, `MapaInteractivoCanvas.tsx` y `verificacion-hub-mundo.spec.ts`, ejecutado en `173ms`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **100 de 100 pruebas aprobadas** (`0` fallos, `0` omitidas en `1685.26ms`), incluyendo la nueva prueba integral `Subfase 10p` (validación de `DIMENSIONES_MAPA_MUNDO`, existencia en disco de `mapa-mundo-aethelgard.png`, geometría _pure-Node_ de las 9 islas, cobertura bidireccional de los 10 puentes Bezier, ausencia de `obtenerImagenZona` en el canvas y verificación de Regla R1 en `mapa-dioramas.ts`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2162 módulos** transformados en **`6.27s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `59.88s`).

---

## 28. Sub-Fase 10q: Mapa Transparente 3232×1794 sin Océano, Mar Abisal Animado y Recalibración Pixel-Exacta de Efectos (`MapaInteractivoCanvas.tsx`)

Para reemplazar el mapa con mar pre-horneado de la subfase previa por una lámina RGBA transparente libre de océano y recalibrar con exactitud milimétrica todas las luces, partículas, espuma costera y rutas Bezier sobre las 9 islas reales, se ejecutó la **Sub-Fase 10q** en la rama `funcionalidad/fase-10q-mapa-transparente-fx`.

### 28.1 Diagnóstico Inicial y Auditoría Impeccable

1. **Desajuste entre lámina transparente `3232×1794` y coordenadas previas (`1679×937`):** La versión RGBA sin océano (`apps/web/public/assets/zonas/mapa-mundo-aethelgard.png`, canal alfa `0` en esquinas y canales marinos, geometría opaca en `x=[0..1614], y=[0..896]` en escala lógica `1616×897` @ 2×) desplazaba respecto a `1679×937` las posiciones de faroles, grietas, cascadas, cristales y puentes, provocando que varios efectos lucieran corridos fuera de su elemento arquitectónico o natural.
2. **Océano oculto e integración costera 2.5D:** Con el fondo marino ahora completamente transparente en el PNG (incluidos los arcos inferiores de los 10 puentes de piedra), el lienzo necesitaba eliminar el recorte interior del océano en `dibujarFondoOceanoContinuo` y sustituir `dibujarFusionBordesMapa` por `dibujarAguasCosterasMapa` para dibujar sombras de flotación y espuma de oleaje exclusivamente en la base de los acantilados sur antes de pintar la ilustración de las islas, evitando que halos blancos asomen por detrás de cumbres nevadas o torres en el norte.
3. **Colisiones de UI y curvatura de puente:** La inspección bitmap visual (`calibration-1616-verify.png`) detectó además un acercamiento excesivo entre el emblema flotante `"TÚ AQUÍ"` de _Bosque_ (`ZON-03`) y la placa inferior de _Cueva Umbría_ (`ZON-05`), así como una curvatura elevada en el spline Bezier `ZON-02 → ZON-03` sobre la pasarela de piedra.

### 28.2 Mejoras Implementadas

#### A. Mapa Transparente `1616×897`, Aguas Costeras y Efectos Recalibrados (`mapa-mundo.ts`, `mapa-dioramas.ts`, `MapaInteractivoCanvas.tsx`)

- **Integración RGBA transparente (`Format32bppArgb`, `3232×1794`):** Actualización de `DIMENSIONES_MAPA_MUNDO = { ancho: 1616, alto: 897 }`, respaldo local en `Polish_20261114_215332459.png`, contenedor `bg-[#021327]` y centro de cámara `(808, 448)`.
- **Pipeline multicapa por debajo y encima de las islas (`MapaInteractivoCanvas.tsx`):** Ejecución ordenada `dibujarFondoOceanoContinuo` (sin hueco central para que el oleaje fluya en canales y bajo los 10 arcos de puente) → `dibujarAguasCosterasMapa` (sombras abisales, espuma costera anclada al acantilado inferior `y + radioY * 0.36`, ondas en la cascada de _Puesto del Río_ en `(742, 550)` y fulgor termal bajo el magma costero de _Cueva Umbría_) → `drawImage` de islas transparentes (con respaldo `dibujarRespaldoIslasBase`) → `dibujarCapaVivaMapa`.
- **Recalibración por centroides RGB y verificación bitmap en `dibujarCapaVivaMapa` y `TRAYECTOS_PUENTES_AETHELGARD`:**
  - **Villa Serena (`LOC-01`):** fuente `(237, 675)`, 8 faroles cálidos y 3 chimeneas (`[106,616]`, `[262,578]`, `[314,624]`).
  - **Praderas (`ZON-01`):** 5 monolitos rúnicos (`[81,398]`, `[147,344]`, `[133,451]`, `[249,392]`, `[288,381]`).
  - **Puesto del Río (`LOC-02`):** 4 pebeteros en atalayas (`[525,415]`, `[637,368]`, `[638,442]`, `[762,427]`), 2 fogatas (`[589,466]`, `[676,395]`) y cascada en `(742, 515)`.
  - **Lago Espejo (`ZON-02`):** espejo central `(806, 720)` y 5 cristales (`[689,705]`, `[839,652]`, `[969,698]`, `[781,785]`, `[942,775]`).
  - **Bosque (`ZON-03`):** aura sobre el trono de piedra `(1392, 672)` y 12 luciérnagas esmeralda.
  - **Riscos (`ZON-04`):** 7 grietas ígneas (`[902,255]`, `[1071,266]`, `[1018,341]`, `[905,346]`, `[1061,387]`, `[1066,420]`, `[949,419]`) y columnas de humo en `(900, 232)` y `(1002, 224)`.
  - **Bastión del Norte (`LOC-03`):** 3 torres ardientes (`[364,103]`, `[477,151]`, `[584,99]`) y nieve en descenso.
  - **Cueva Umbría (`ZON-05`):** colada en boca de cueva `(1452, 352)`, 3 cascadas de magma al acantilado (`(1324, 474)`, `(1412, 476)`, `(1526, 478)`), 3 grupos cristalinos violeta (`(1317, 328)`, `(1526, 255)`, `(1548, 358)`) y arco eléctrico `(1492,224)→(1522,206)→(1546,226)→(1570,208)`.
  - **La Cumbre (`ZON-06`):** aurora boreal `(875,42)→(1055,8)→(1245,36)`, 4 cristales glaciares (`[848,72]`, `[933,94]`, `[1247,114]`, `[1172,178]`) y nevada ligera.
  - **Puentes Bezier:** Recálculo de los 10 `TRAYECTOS_PUENTES_AETHELGARD`, ajustando `ZON-02 → ZON-03` a `inicio: { x: 1016, y: 716 }`, `control: { x: 1074, y: 696 }`, `fin: { x: 1134, y: 716 }` directamente sobre la calzada de piedra.

#### B. Componentes `8bitcn/ui`, Navegación Responsive y Convivencia de Placas

- **Preservación integral de interfaz y paletas:** Botoneras laterales, panel del jugador, monedas, dock de criaturas, botón `EXPLORAR`, controles de zoom/recentrado/silencio, paletas originales por bioma y flujo de cámara escritorio/móvil (auto-centrado en `ubicacionActualId`, paneo táctil y _pinch-to-zoom_ sin encoger el mundo en móvil) permanecen intactos.
- **Despeje `TÚ AQUÍ` vs placas:** Ajuste en `CONFIGURACION_ISLAS_MAPA` para `ZON-03` (`y: 702`, `radioY: 142`, `placaOffsetY: 158`) y `ZON-05` (`placaOffsetX: 72`, `placaOffsetY: 118`), garantizando holgura vertical y horizontal completa respecto al marcador activo del jugador.

#### C. Audio Web Audio API y Reglas del Servidor

- **Cero impacto en lógica autoritativa ni backend:** Las rutas REST, reglas de desbloqueo y viaje en `apps/api`, así como los efectos sintetizados Web Audio API (`reproducirSonido`), permanecen inalterados.

### 28.3 Verificación de Calidad y Cero Regresiones

- **Verificación Visual de Calibración Bitmap (`calibration-1616-verify.png`):** Inspección visual positiva confirmando coincidencia exacta de las 9 siluetas costeras, las 9 placas, los 9 marcadores `"AQUI"`, los 10 splines Bezier de puentes y todas las dianas de efectos recalibradas sobre `3232×1794`.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con `Found 34 warnings and 0 errors` en **90 archivos** (`158ms`, 116 reglas, 0 advertencias nuevas respecto a la línea base).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **100 de 100 pruebas aprobadas** (`0` fallos, `0` omitidas en `1121.35ms`), incluyendo `"Subfase 10p/10q: Calibración sobre mapa transparente (1616x897), aguas costeras, 10 puentes Bezier y efectos recalculados"` en `apps/web/test/verificacion-hub-mundo.spec.ts`.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2162 módulos** transformados en **`3.18s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `31140.60ms`).

---

## 29. Sub-Fase 10r: Optimización WebP Transparente (943.8 KB) y Calibración Milimétrica de Cascadas y Biomas (`MapaInteractivoCanvas.tsx`)

### 29.1 Diagnóstico Inicial y Auditoría Impeccable

- **Peso excesivo del arte maestro:** El mapa del mundo en formato PNG transparente (`apps/web/public/assets/zonas/mapa-mundo-aethelgard.png`, `3232×1794`) ocupaba **8.46 MB** (`8,463,051` bytes), incrementando innecesariamente el tiempo de descarga inicial del hub en navegadores de escritorio y móviles, además de convivir dentro de `apps/web/public/assets/zonas/`, donde `apps/web/test/verificacion-assets-entornos-objetos.spec.ts` exige exactamente 9 fondos `.webp` de `800×450`.
- **Cascada flotante y efectos desfasados tras inspección a zoom 2×:** Al auditar el dibujo procedural de `dibujarAguasCosterasMapa`, `dibujarCapaVivaMapa` y `TRAYECTOS_PUENTES_AETHELGARD` en `apps/web/src/lib/mapa-dioramas.ts` sobre el lienzo `1616×897`:
  - **Puesto del Río (`LOC-02`):** La caída de agua real en el arte abarca `x = 732..758`, `y = 528..587`, pero las partículas previas nacían en `y = 482..544` (sobre la empalizada/pasto superior) con salpicadura opaca en `(742, 545)` y ondas marinas en `(742, 550)`, provocando que la cascada se viera suspendida en el aire a mitad del acantilado. Además, los destellos del río cruzaban por encima de la torre de madera en primer plano y una fogata flotaba fuera de los campamentos reales.
  - **Resto del archipiélago:** Villa Serena (`LOC-01`) incluía una chimenea fantasma en `(106, 616)` sobre tejas sin tiro real y farolas ligeramente descentradas; Cueva Umbría (`ZON-05`) tenía saltos de magma con inicio debajo del labio superior del acantilado y deltas costeros desplazados; Riscos (`ZON-04`) presentaba columnas de humo fuera de los cráteres reales; y 3 puentes Bezier (`ZON-02->ZON-03`, `LOC-02->ZON-03`, `ZON-05->ZON-06`) requerían ajuste fino sobre las barandillas del arte maestro.

### 29.2 Mejoras Implementadas (Identidad Retro, Optimización WebP y Reglas de Cliente)

- **Conversión a WebP RGBA Transparente (`-88.9%` de peso):**
  - Se convirtió el mapa maestro mediante Pillow (`Image.Resampling.LANCZOS`, `quality=90`, `alpha_quality=100`, `method=6`) a `apps/web/public/assets/mapa-mundo-aethelgard.webp` en resolución **`2424×1346`**, formato `WEBP RGBA` con transparencia limpia (`corner_a = 0`) y un peso final de **943.8 KB** (reducción del **88.9%** respecto a los `8,463,051` bytes del PNG previo).
  - Se retiró el archivo PNG de `apps/web/public/assets/zonas/` (`git rm`) manteniendo esa carpeta con los 9 banners `.webp` de zona exigidos por la suite de pruebas, y se simplificó el cargador en `apps/web/src/components/mundo/MapaInteractivoCanvas.tsx` para consumir directamente `/assets/mapa-mundo-aethelgard.webp` sin fallback PNG.
- **Calibración Milimétrica de Aguas Costeras, Puentes y los 9 Biomas (`apps/web/src/lib/mapa-dioramas.ts`):**
  - **`LOC-02` (Puesto del Río):** Recorte estricto de la cascada a `y = 529..586` con salpicadura en `(744, 587)` y ondas costeras en `(744, 591)`; división del flujo del río en dos tramos (`556..610, 418..448` y `674..732, 486..520`) esquivando la torre frontal; y realineamiento de las 4 torres con brasero (`[524,414]`, `[636,365]`, `[638,452]`, `[763,426]`) y 3 fogatas reales (`[588,456]`, `[646,432]`, `[692,459]`).
  - **`LOC-01` (Villa Serena):** Fuente en `(237, 672)`, chispas en `(237, 667)`, 8 farolas reales y eliminación de la chimenea inexistente dejando únicamente `(285, 556)` y `(348, 609)`.
  - **`ZON-01` a `ZON-06` y `LOC-03`:** Recalibración de 5 monolitos en Praderas, lago `(820, 718)` y 5 cristales en Lago Espejo, trono `(1390, 668)` y 12 luciérnagas en Bosque, 7 grietas de magma, cascada lateral y cráteres `(904, 256)`/`(1069, 266)` en Riscos, 3 torres + rastrillo `(524, 198)` en Bastión Norte, 3 cascadas de magma desde el labio superior con deltas en `(1324, 480)`, `(1414, 492)`, `(1530, 486)`, boca de cueva `(1453, 296)->(1452, 352)`, 3 cúmulos violetas y descarga eléctrica en Cueva Umbría, aurora boreal `(840,28)->(1060,6)->(1275,32)` más 4 cristales gélidos en La Cumbre, y afinación de 3 splines Bezier en `TRAYECTOS_PUENTES_AETHELGARD`.
- **Sincronización Documental y Grafo:** Actualización de `Plan_Desarrollo_ISC305_Entregable1.md`, `docs/INDICE.md`, creación de `docs/workflows/fase-10/10-18-mapa-webp-calibracion.md` y reconstrucción del grafo con `graphify update .` (`2087` nodos, `4892` aristas, `137` comunidades).

### 29.3 Verificación de Calidad y Cero Regresiones

- **Verificación Visual de Calibración Bitmap (`calibration-10r-full.png`, `calibration-10r-detalles.png`, `calibration-10r-puesto-final.png`):** Confirmación visual a zoom 2× de la cascada del Puesto del Río encajada en su caída real sin flotar en el aire, farolas/chimeneas/fogatas sobre sus puntos exactos y compresión WebP transparente limpia.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores de TypeScript (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con `Found 34 warnings and 0 errors` en **90 archivos** (`322ms`, 116 reglas, 0 advertencias nuevas).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **100 de 100 pruebas aprobadas** (`0` fallos, `0` omitidas en `1567.04ms`), actualizando `apps/web/test/verificacion-hub-mundo.spec.ts` para validar el asset WebP (`< 1,500,000` bytes) y su carga en `MapaInteractivoCanvas.tsx`.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2162 módulos** transformados en **`3.80s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `44020.67ms`).

---

## 30. Sub-Fase 10s: Océano Vivo y Animación Marina 2.5D en el Mapa de Aethelgard

### 30.1 Diagnóstico Inicial y Auditoría Impeccable

Tras aislar en la Subfase 10r el mapa maestro transparente (`apps/web/public/assets/mapa-mundo-aethelgard.webp`, renderizado en el espacio lógico `1616×897`), el océano subyacente dependía de un degradado estático y elipses geométricas por isla (`dibujarAguasCosterasMapa`), mientras que algunos trazos uniformes y gradientes por cuadro limitaban la inmersión Dark Fantasy del archipiélago:

- **Falta de lectura real del terreno en el agua:** Al usar radios elípticos aproximados en lugar de la silueta alfa real del archipiélago, no existía campo de distancias ni normales costeras para evitar que oleaje, corrientes o fauna atravesaran tierra firme o acantilados.
- **Costuras geométricas y coste de renderizado por cuadro:** En la auditoría visual inicial sobre Chromium headless se detectaron tres artefactos puntuales que se corrigieron iterativamente: (1) saltos binarios entre meseta somera y aguas profundas provocados por la distancia entera Chamfer y umbrales discretos en puentes, (2) líneas rectas paralelas en pulsos de corriente y estelas vectoriales en `V` demasiado rígidas, y (3) necesidad de cachear en búferes fuera de pantalla (`WeakMap` y canvas auxiliares) para evitar asignar gradientes o patrones en `requestAnimationFrame`.
- **Invariancia estricta del HUD y biomas calibrados:** Se mantuvo intacta la interfaz externa (barras, placas, tipografía, controles) y las coordenadas de los 9 biomas ya calibrados en `dibujarCapaVivaMapa` (`apps/web/src/lib/mapa-dioramas.ts`).

### 30.2 Mejoras Implementadas

- **Nuevo motor oceánico dedicado ([oceano-vivo.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/oceano-vivo.ts)):**
  - **Extracción única de máscara alfa y campo de distancias isotrópico (`analizarMascaraAlfaOceano` / `calcularCampoDistancia`):** Al cargar `mapa-mundo-aethelgard.webp` en `crearRecursosOceano(imagenMapa)`, se muestrea el canal alfa en `808×449` (`escala = 0.5`, umbral `110`) generando dos campos flotantes Chamfer (`1 / escala`, `Math.SQRT2 / escala`): `distanciaMar` (islas + puentes para espuma y superficie) y `distanciaSinPuentes` (solo islas para permitir corrientes y cardúmenes cruzar bajo los arcos de los 10 puentes Bezier de `TRAYECTOS_PUENTES_AETHELGARD`), más detección 2.5D de frente de acantilados (`esFrenteAcantilado`).
  - **Batimetría y cáusticas cacheadas fuera de pantalla (`crearCanvasBatimetria` / `crearCanvasCausticas`):** Precalcula fosas abisales, transición continua mediante `suavizarHermite` sobre `distanciaSinPuentes` ponderando orientación vertical `nyRel` por isla (evitando halos celestes alrededor de cumbres, torres o copas de árboles y concentrando la meseta oscura sutil en los frentes costeros, con mezcla climática suave y matiz térmico volcánico al este), sombra de contacto oscura bajo acantilados y arcos de puentes, y patrón periódico `512×512` de cáusticas submarinas desplazado en doble capa opuesta; adicionalmente cachea gradientes por contexto en `WeakMap` (`cacheGradientesPorCtx` y `cacheGradientesRespaldo` en `mapa-dioramas.ts`).
  - **Corrientes, oleaje pelágico 2.5D y resaca regional por clima (`dibujarCorrientesMarinas`, `dibujarOlasYEstelasSuperficie`, `dibujarResacaYHitosRegionales`):**
    - 7 corrientes suavizadas con interpolación Catmull-Rom que fluyen por canales y bajo arcos de puentes mediante motas y filamentos pixel-art discontinuos.
    - Oleaje pelágico en perspectiva 2.5D y micro-estelas en `V` pixeladas validando navegabilidad en cada extremo (`esPosicionNavegable`).
    - Resaca orgánica adaptada al clima costero: bloques de hielo biselados 2.5D a la deriva al norte (`Bastión Norte` / `La Cumbre`), estelas portuarias junto a la escalinata de `Villa Serena` y turbulencia/rocío en la cascada de `Puesto del Río`, destellos bioluminiscentes violeta y esmeralda en aguas someras de `Lago Espejo` y `Bosque`, y reflejos ámbar/naranja rielantes con burbujas hirvientes y vapor pixelado en la costa volcánica de `Cueva Umbría`.
  - **Fauna marina abisal y atmósfera superficial (`dibujarFaunaSubmarina`, `dibujarLeviatanAbisal`, `dibujarAvesMarinasLejanas`):**
    - 6 cardúmenes translúcidos nadando en órbitas suaves con evasión por normal costera (`consultarNormalAgua`), 8 medusas luminosas pulsantes y 62 motas de plancton en cuencas abiertas.
    - Aparición periódica de leviatán / serpiente marina abisal en cuencas profundas exteriores despejadas de placas (`zonasLeviatan` con ciclos de `18_000 ms`, sombra corporal sumergida, lomos acorazados y anillos de ruptura).
    - Bandadas lejanas de gaviotas sobre mares exteriores dibujadas tras `ctx.drawImage`, respetando la claridad de todas las placas del mapa.
- **Integración limpia en el canvas ([MapaInteractivoCanvas.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/MapaInteractivoCanvas.tsx)):**
  - Invoca `crearRecursosOceano(img)` al cargar el WebP maestro y ejecuta `dibujarOceanoVivo` debajo de las islas y `dibujarAvesMarinasLejanas` por encima, manteniendo la ruta de respaldo (`dibujarFondoOceanoContinuo`, `dibujarAguasCosterasMapa`, `dibujarRespaldoIslasBase`), caché de viñeta (`vinetaCacheRef`), soporte íntegro de zoom/paneo sin reiniciar el bucle `rAF` al arrastrar y respeto a `prefers-reduced-motion`.

### 30.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual en Chromium Headless (6 capturas completas y zoom 2×, verificadas con `read_file` y eliminando los archivos temporales del repositorio antes de commitear):**
  - Tiempo de renderizado observado por cuadro entre **`4.1 ms` y `13.9 ms`** (margen sólido para 60 FPS en `< 16.6 ms`) con **`0` colisiones** registradas en tierra firme (`391` puntos de resaca, `7` corrientes, `6` cardúmenes, `13` bloques de hielo, `8` medusas, `62` motas de plancton, `4` bandadas, `4` cuencas del leviatán).
  - Confirmación visual sin halo celeste alrededor de islas, torres ni copas de árboles, canales fluidos sin costuras poligonales, leviatán y gaviotas en aguas abiertas y placas totalmente legibles.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con `Found 34 warnings and 0 errors` en **91 archivos** (`260ms`, 116 reglas, 0 advertencias nuevas en los módulos de Subfase 10s).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `1332.9893ms`), ampliando `apps/web/test/verificacion-hub-mundo.spec.ts` para verificar la máscara alfa, normales costeras, cobertura de ecosistemas, cero colisiones con tierra firme, cumplimiento R1 sin emojis e integración de caché en `MapaInteractivoCanvas.tsx`.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`5.60s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `73975.4108ms`).

---

## 31. Sub-Fase 10s (Ampliación): Fauna Abisal Gigante y Siluetas Submarinas 2.5D

### 31.1 Diagnóstico Inicial y Auditoría Impeccable

Tras entregar el motor oceánico multicapa en la Subfase 10s base (`1f2fb10`), la actividad de megafauna marina se concentraba en un único evento de serpiente marina (`zonasLeviatan`), cardúmenes pequeños y medusas puntuales, lo que dejaba amplios mares abisales exteriores sin variedad de depredadores ni sensación de criaturas profundas desplazándose bajo la superficie:

- **Falta de biodiversidad colosal:** El océano requería presencia diferenciada de **Mosasaurus**, **Kraken** y **Leviatán** alternados por cuencas abisales, además de sombras submarinas reconocibles nadando debajo de olas y puentes.
- **Hallazgos de primera captura headless (`01` a `06`):** Al auditar los primeros renderizados, las siluetas sumergidas (`alpha ~ 0.17–0.33`) resultaban excesivamente tenues sobre el fondo `#031428`, el **Mosasaurus** mostraba dos barras blancas horizontales rígidas en la línea de flotación (`03`, `06`) y el **Kraken** exhibía tentáculos de grosor uniforme y elipse lisa en superficie (`05`).

### 31.2 Mejoras Implementadas (Identidad Retro, Criaturas 2.5D y Reglas de Cliente)

- **Catálogo de Siluetas Submarinas (`apps/web/src/lib/oceano-vivo.ts`):**
  - Introducción de la capa `SiluetaSubmarina` (`mosasaurus`, `plesiosaurio`, `mantarraya`, `kraken`, `ballena`) desplegada en **9 rutas** de aguas abiertas y canales bajo puente (`NW`, `WestMid`, `NE`, `ChanW`, `SWBay`, `SEBay`, `ChanC`, `SW_corner`, `MidN`).
  - Renderizado 2.5D en doble capa con sombra abisal inferior difusa (`#00050e`), cuerpo translúcido adaptado al matiz regional (`glacial`, `abisal`, `mistico`), borde lunar tenue y nado continuo bajo las olas superficiales (`dibujarSiluetasSubmarinas`).
- **Avistamientos Abisales Escalonados en Superficie (`AvistamientoAbisal`):**
  - Expansión a **5 zonas escalonadas** alternando **Leviatán** (`NW`), **Mosasaurus** (`NE` y `SEBay`) y **Kraken** (`SWBay` y `WestMid`) con ciclos independientes (`15.5s` a `19.0s`), validación estricta contra `esPosicionNavegable(..., false)` y `!estaCercaDePlaca(...)` para jamás pisar tierra firme, puentes ni placas de zona.
  - Extracción del helper compartido `dibujarEspumaEmergente` (arcos de ola discontinuos y gotas dispersas de resaca), rediseño del **Mosasaurus** con fauces acorazadas, espinas dorsales, aleta pectoral y cola bilobada sin líneas rígidas, y rediseño del **Kraken** con manto cefalópodo picudo, ojos luminosos y 7 tentáculos cónicos gruesos con ventosas bioluminiscentes.
- **Presupuesto 60 FPS y Sin Asignaciones por Cuadro (`R1` / R4):**
  - Se elevaron todas las tuplas constantes de aletas y ángulos (`ALETAS_MOSASAURUS_SUB`, `ALETAS_PLESIOSAURIO_SUB`, `LADOS_ALETA_BALLENA`, `TENTACULOS_KRAKEN_SURGIMIENTO`) a constantes de módulo para evitar asignaciones de arreglos dentro del bucle `requestAnimationFrame`.
- **Sincronización Documental y Pruebas:** Ampliación de la suite en `apps/web/test/verificacion-hub-mundo.spec.ts` para verificar presencia íntegra de las 5 especies sumergidas, las 3 especies de avistamiento gigante en superficie y cero colisiones con tierra firme.

### 31.3 Verificación de Calidad y Cero Regresiones

- **Verificación Visual Headless en Chromium (`01`, `03`, `04`, `05`):**
  - Medición real en Chromium tras el pulido final: **`4.0–9.1 ms/cuadro`** (`espumas: 391`, `corrientes: 7`, `cardumenes: 6`, `siluetas: 9`, `avistamientos: 5`, `hielo: 13`, `medusas: 8`, `plancton: 62`, `aves: 4`, **`colisiones: 0`**).
  - Confirmación visual en las capturas `01-mapa-completo-leviatan.png`, `03-zoom-norte-glacial.png`, `04-zoom-este-volcanico-viaducto.png` y `05-zoom-villa-serena-sur.png` de las 5 siluetas sumergidas claramente legibles bajo el mar, erradicación de barras horizontales en el Mosasaurus, tentáculos cónicos orgánicos del Kraken y estelas respetando acantilados y placas.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con `Found 34 warnings and 0 errors` en **91 archivos** (`186ms`, 116 reglas, 0 advertencias nuevas en los módulos modificados).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `2340.3786ms`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`1.63s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `62815.8569ms`).

---

## 32. Sub-Fase 10s (Rediseño Visual): Legibilidad Anatómica y Erradicación de Sombras Ovaladas

### 32.1 Diagnóstico Inicial y Auditoría Impeccable

Tras la revisión directa del usuario sobre la primera entrega de fauna abisal (`e3c23c0`), se identificaron tres puntos visuales que impedían una lectura comercial limpia:

- **Elipses oscuras artificiales bajo la superficie:** Tanto las siluetas sumergidas (`ctx.ellipse(-2, 2.5, 25, 9, ...)`) como los avistamientos de **Mosasaurus**, **Kraken** y nodos del **Leviatán** proyectaban óvalos o charcos negros desconectados debajo del cuerpo, dando un aspecto postizo de disco plano sobre el agua.
- **Contornos tipo alambre hueco y escala reducida en profundidades:** Las siluetas submarinas empleaban `stroke` fino de 1 px sobre tonos casi idénticos al mar (`#041b32`), perdiendo masa corporal sólida y diferenciación anatómica al mirar el archipiélago completo.
- **Desconexión de piezas en superficie:** El **Mosasaurus** mostraba cabeza, dorso y un triángulo caudal separados en tres islotes distintos, y el **Kraken** requería mayor presencia frontal de tentáculos envolventes para ocultar su base recta en la línea del agua.

### 32.2 Mejoras Implementadas (Identidad Retro, Anatomía 2.5D y Reglas de Cliente)

- **Erradicación total de elipses ovaladas y transición a masas anatómicas continuas (`apps/web/src/lib/oceano-vivo.ts`):**
  - **Siluetas submarinas (`dibujarSiluetasSubmarinas`):** Se eliminaron el óvalo inferior y el borde `stroke` hueco; cada criatura se traza ahora como silueta abisal sólida (`#000712`, `alpha ~ 0.62`), mayor presencia (`escala` `1.14–1.44` según amplitud de cuenca o canal), volumen dorsal interno suave y rasgos anatómicos distintivos a simple vista (cráneo triangular y cola en media luna en **Mosasaurus**; cuello largo serpentino en **Plesiosaurio**; manchas pálidas simétricas y cuernos cefálicos en **Mantarraya**; aletas apicales y tentáculos cazadores con maza en **Kraken**; largas aletas pectorales con bordes claros y cola en T en **Ballena**).
  - **Separación espacial de cuencas:** Ajuste fino de subcuencas en `NE` (`[1455, 80, 1575, 225]` vs `[1340, 60, 1465, 180]`) y `SWBay` (`[520, 795, 625, 875]` vs `[465, 765, 575, 855]`) para evitar encimamiento entre el Kraken/Ballena sumergidos y los avistamientos en superficie.
- **Rediseño anatómico de monstruos en superficie y salpicaduras picadas:**
  - Sustitución de anillos elípticos geométricos por `dibujarSalpicaduraRuptura` (crestas de espuma picada y gotitas saltando en parábola exactamente donde el cuerpo corta el agua).
  - **Leviatán:** Unión de bucles mediante trazo serpentino continuo bajo el agua, cabeza draconiana alzada con cuerno barrido, fauces con colmillos, ojo dorado `#fde047` y arcos corporales asimétricos inclinados hacia el avance.
  - **Mosasaurus:** Cuerpo unificado continuo desde el lomo escamoso y el cuello hasta enorme cabeza cocodriliana con fauces abiertas en V mostrando dientes marfil en ambas mandíbulas, garganta carmesí oscuro `#311226`, aleta pectoral en remo y aleta caudal sólida curvada en hoz sin triángulo hueco.
  - **Kraken:** Tentáculos sumergidos irradiando desde abajo sin charco ovalado, manto cefalópodo púrpura-índigo con aletas triangulares en flecha y ceño luminoso, y 8 brazos musculosos con puntas enrolladas, ventosas claras integradas y dos tentáculos delanteros abrazando la línea de ruptura sobre el agua.

### 32.3 Verificación de Calidad y Cero Regresiones

- **Verificación Visual Headless en Chromium (`01` a `06`):**
  - Captura tras el pulido final con tiempos de cuadro en vivo entre **`6.7` y `12.5 ms/cuadro`** en zooms de región (`02–05`), `espumas: 391`, `corrientes: 7`, `cardumenes: 6`, `siluetas: 9`, `avistamientos: 5`, `hielo: 13`, `medusas: 8`, `plancton: 62`, `aves: 4` y **`colisiones: 0`**.
  - Confirmación visual en `01-mapa-completo-leviatan.png`, `03-zoom-norte-glacial.png`, `04-zoom-este-volcanico-viaducto.png`, `05-zoom-villa-serena-sur.png` y `06-componente-real-placas.png` de que todas las especies se distinguen a simple vista sin sombras ovaladas ni superposición con islas, puentes ni placas.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores (`TSC=0`).
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con `Found 34 warnings and 0 errors` en **91 archivos** (`173ms`, 116 reglas, 0 advertencias nuevas en `oceano-vivo.ts`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `1421.3266ms`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`1.53s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `32220.1676ms`).

---

## 33. Calibración de Puentes, Placas Escalables y Expansión Abisal de Océano (Subfase 10s — 15/11/2026)

### 33.1 Diagnóstico Inicial y Auditoría Visual (Impeccable)

Sobre la captura en vivo del mapa interactivo tras la Subfase 10s (`Riscos` / `La Cumbre` / `Cueva Umbría`) se identificaron 5 oportunidades directas de pulido espacial y de legibilidad:

1. **Aro punteado distrayente en ubicación actual:** `dibujarCapaVivaMapa` dibujaba dos anillos orbitales (`setLineDash([13, 9])`) en rotación continua alrededor de la isla activa, cruzando puentes y bordes vecinos.
2. **Desalineación en rutas Bezier de puentes adyacentes:** En `TRAYECTOS_PUENTES_AETHELGARD`, varias pasarelas (`Riscos -> Cueva Umbría`, `Riscos -> Bastión Norte`, `Bastión Norte -> La Cumbre`, `Cueva Umbría -> La Cumbre`, `Villa Serena -> Lago Espejo`) flotaban por encima del tablero real de piedra o cortaban agua abierta en lugar de seguir las losas caminables.
3. **Presencia y alcance acotado de abisales:** Los 5 avistamientos de superficie (`6.4–7.0s` sobre ciclos de `15.5–19.0s`, ~38% de tiempo activo) y las 9 siluetas se concentraban únicamente dentro de `[0..1616, 0..897]`, dejando el océano abierto alrededor del archipiélago sin actividad abisal al hacer zoom alejado.
4. **Sobrecarga de etiquetas de ubicación y tarjetas grandes al alejar:** El badge bajo el avatar leía `TÚ AQUÍ`, mientras que las tarjetas de isla mantenían tamaño completo al alejar el zoom (con quiebres multilínea en rangos de nivel), tapando costas y puentes cercanos; además faltaba un control rápido para ocultar/mostrar las tarjetas cuando el jugador desea inspeccionar el mapa limpio.

### 33.2 Mejoras Implementadas

- **Calibración Geométrica sobre Máster WebP y Eliminación del Aro Punteado ([mapa-dioramas.ts](file:///apps/web/src/lib/mapa-dioramas.ts)):**
  - Medición píxel a píxel de las 10 pasarelas reales en espacio lógico `1616×897`, recalibrando `TRAYECTOS_PUENTES_AETHELGARD` (ej. `ZON-04 -> ZON-05`: `{ inicio: {1122, 346}, control: {1188, 326}, fin: {1256, 353} }`, `ZON-05 -> ZON-06`: `{ inicio: {1328, 246}, control: {1270, 192}, fin: {1214, 178} }`, `LOC-01 -> ZON-02`: `{ inicio: {424, 720}, control: {526, 718}, fin: {628, 720} }`) y afinando los 5 orbes luminosos por ruta (`radio 3.2`) en `dibujarPuentesYRutasVivas`.
  - Eliminación completa del bloque de aros punteados (`setLineDash`) alrededor de `ubicacionActualId` en `dibujarCapaVivaMapa`, conservando únicamente los velos sobre islas bloqueadas y los efectos ambientales por bioma.
- **Expansión Abisal a Mares Abiertos y Ciclos Prolongados ([oceano-vivo.ts](file:///apps/web/src/lib/oceano-vivo.ts)):**
  - Generalización de `encontrarCuencaProfunda` para operar tanto en la rejilla rápida dentro de `1616×897` como en mar abierto exterior evaluando `consultarDistanciaMar` y evitando colisiones con `estaCercaDePlaca`.
  - Expansión de `recetasSiluetas` de **9 a 18 siluetas submarinas** (krakens, mosasaurus, plesiosaurios, mantarrayas y ballenas) y de `recetasAvistamientos` de **5 a 11 apariciones de superficie** (4 krakens, 4 mosasaurus y 3 leviatanes) extendidas por los cuatro cuadrantes oceánicos exteriores, además de ampliar cardúmenes, medusas, plancton y estelas fuera del perímetro costero.
  - Elevación de la presencia activa de cada abisal a **`>= 78%–86%` del ciclo** (`12.2–13.8s` sobre ciclos de `14.5–16.8s`) con envolvente en meseta suave (14% ascenso / 72% exposición plena / 14% inmersión).
- **HUD Limpio en Canvas: Badge `"Tú"`, Tarjetas Escalables y Botón Ocultar/Mostrar ([MapaInteractivoCanvas.tsx](file:///apps/web/src/components/mundo/MapaInteractivoCanvas.tsx)):**
  - Simplificación del badge del líder actual de `TÚ AQUÍ` a **`Tú`**.
  - Escalado proporcional automático de las tarjetas de isla al alejar el mapa (`escalaPlaca = Math.min(1, Math.max(0.54, camara.zoom / 1.02))`) con `whitespace-nowrap` en el distintivo de peligro para evitar roturas en 3 líneas.
  - Incorporación del botón accesible (`data-boton-placas-mapa`, `aria-pressed`, iconos vectoriales `Eye` / `EyeOff` de Lucide sin emojis bajo R1) dentro de la barra de controles flotantes para alternar al instante `mostrarPlacas` sin deshabilitar los nodos interactivos del archipiélago.

### 33.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual en Chromium Headless (`01` a `05`):**
  - Verificación en vistas equivalentes (`loc=ZON-04` y `loc=LOC-02`), alejado al mínimo (`zoom ~ 0.50`), modo tarjetas ocultas (`placasRestantes === 0`) y océano extendido (`1680×1005`), confirmando puentes centrados sobre piedra, ausencia total de aros punteados, tarjetas compactas sin solapes ni quiebres, badge `Tú` y criaturas abisales distribuidas por todo el mapa.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores.
- **Linter Web (`pnpm --filter web lint`):** `oxlint` con código de salida `0` y **`Found 0 warnings and 0 errors` en `56ms`** sobre los 4 archivos modificados (`oceano-vivo.ts`, `mapa-dioramas.ts`, `MapaInteractivoCanvas.tsx`, `verificacion-hub-mundo.spec.ts`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `3213.499ms`), incluyendo invariantes de ciclo `>= 78%`, expansión exterior `< 0` / `> 1616`, calibración de puentes, eliminación de `setLineDash` y nuevos atributos de placas.
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`3.30s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `75673.0201ms`).

---

## 34. Erradicación de Tarjetas DOM, Tooltip con Nombre Real y Equilibrio Abisal (Subfase 10s — 15/11/2026)

### 34.1 Diagnóstico Inicial y Auditoría Visual (Impeccable)

Tras validar la calibración previa en uso real se detectaron tres fricciones concretas de rendimiento y claridad en la capa interactiva del mapa:

1. **Latencia de desplazamiento provocada por tarjetas DOM flotantes:** Las 9 tarjetas `[data-placa-isla]` con `backdrop-blur-xs`, bordes sombreados y `animate-pulse` reproyectaban compositing sobre el lienzo WebGL/Canvas en cada cuadro de arrastre y zoom; además resultaban redundantes frente a la inspección directa mediante el tooltip de zona.
2. **Doble denominación y truncamiento en el tooltip al pasar el cursor:** El encabezado del modal flotante combinaba `{nodo.nombre}` con una etiqueta de bioma paralela inventada (`ETIQUETA_BIOMA[isla.bioma]`, ej. `"Paso ... Riscos Escarpados"`), recortando el nombre real de la región y mostrando un rótulo ficticio inexistente en el dominio del juego.
3. **Saturación visual de Kraken y Leviatán en superficie:** Al elevar a 11 los avistamientos de superficie y a 4 los krakens submarinos, ambas especies predominaban demasiado en pantalla en lugar de resaltar como encuentros amplios y bien espaciados.

### 34.2 Mejoras Implementadas

- **Eliminación completa de tarjetas flotantes y su botón de alternancia ([MapaInteractivoCanvas.tsx](file:///apps/web/src/components/mundo/MapaInteractivoCanvas.tsx)):**
  - Retiro integral de las tarjetas `[data-placa-isla]`, del estado `mostrarPlacas`, de las variables `escalaPlaca` / `desplazamientoPlaca*`, del botón `[data-boton-placas-mapa]` y de las importaciones de Lucide ahora innecesarias (`Compass`, `Eye`, `EyeOff`, `Lock`, `MapPin`, `ShieldCheck`, `Sparkles`), dejando la barra flotante con sus **4 controles limpios** (`Acercar mapa`, `Alejar mapa`, `Centrar en mi ubicación` y sonido).
- **Tooltip limpio exclusivamente con el nombre canónico real ([MapaInteractivoCanvas.tsx](file:///apps/web/src/components/mundo/MapaInteractivoCanvas.tsx)):**
  - Eliminación del diccionario `ETIQUETA_BIOMA` y del tipo `ConfiguracionIslaMapa` en el componente; el encabezado del tooltip `[role="tooltip"]` muestra únicamente `{nodo.nombre}` sobre contenedor `w-max min-w-52 max-w-68` sin truncamientos.
- **Equilibrio espacial de Kraken y Leviatán conservando ciclos prolongados ([oceano-vivo.ts](file:///apps/web/src/lib/oceano-vivo.ts)):**
  - Reducción de avistamientos de superficie de 11 a **6 ubicaciones espaciadas** (**2 krakens, 2 leviatanes y 2 mosasaurus** distribuidos en extremos opuestos sin solaparse) manteniendo presencia prolongada (`14.4–16.8s` activos sobre ciclos de `18.0–21.0s`, `>= 78%` del ciclo con envolvente en meseta), y ajuste de krakens submarinos de 4 a **2** preservando el resto de siluetas marinas (ballenas, plesiosaurios, mantarrayas, mosasaurus) por mares interiores y exteriores.

### 34.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual en Chromium Headless (`06` y `07`):**
  - Verificación con cursor sobre `ZON-04`: el DOM reportó `placasDom: 0`, `botonPlacasDom: 0`, `controlesCount: 4` y tooltip con encabezado íntegro **`"Paso de los Riscos"`** sin segundo subtítulo inventado; en vista alejada (`zoom = 0.50`) el mapa luce despejado, fluido y sin saturación de krakens ni leviatanes.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** 0 errores.
- **Linter Web (`pnpm --filter web lint`):** `oxlint` finalizó con **`Found 0 warnings and 0 errors` en `159ms`** sobre los 3 archivos modificados (`oceano-vivo.ts`, `MapaInteractivoCanvas.tsx`, `verificacion-hub-mundo.spec.ts`) y salida `0` global.
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `2402.6558ms`), verificando eliminación de tarjetas/botón/`ETIQUETA_BIOMA`, cota `<= 6` de avistamientos (`krakens <= 2`, `leviatanes <= 2`) y duración extendida (`>= 14s` y `>= 78%`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`4.32s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `53272.5467ms`).

---

## 35. Espuma y Ondas de Choque en Pilares de Puentes + Calibración de Cadencia (Subfase 10s — Rama `funcionalidad/fase-10s-espuma-pilares-puentes`)

### 35.1 Diagnóstico Inicial y Auditoría Visual

Al revisar en detalle los puentes de Aethelgard tras integrar la Subfase 10s (`33e2de9`), la inspección sobre la máscara alfa real (`mapa-mundo-aethelgard.webp`) y las capturas interactivas revelaron dos defectos visuales concatenados:

1. **Exclusión previa de pilares reales:** en `analizarMascaraAlfaOceano` ([apps/web/src/lib/oceano-vivo.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/oceano-vivo.ts)), la banda de exclusión de `28px` alrededor de cada spline Bezier de puente (`distanciaMinimaPuenteCuadrada <= 28 * 28`), sumada al filtro sur de acantilados (`enZonaAcantilado`) y a `tierraSinPuentes`, dejaba sin animación de choque de agua a las columnas de piedra que bajan hasta el mar en los viaductos multi-arco.
2. **Regresión intermedia en arcos oblicuos y ritmo acelerado:** al incorporar una detección inicial basada solo en alcance lateral amplio, varias secciones inclinadas bajo las bóvedas de arcos (notablemente en el gran viaducto central `LOC-02 <-> ZON-03`) recibieron arcos repetidos a lo largo de la curva interna, mientras que la primera velocidad elegida (`t * 0.00095`, ~`1.05s` por ciclo) producía ondas demasiado rápidas e invasivas visualmente.

### 35.2 Mejoras Implementadas

1. **Detección Geométrica Pura de Pilares Sumergidos ([oceano-vivo.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/oceano-vivo.ts)):**
   - Se extendió `PuntoEspuma` con la bandera opcional `esPilar?: boolean` y se calibró una pasada dedicada en `analizarMascaraAlfaOceano` (`esFrenteAcantilado[idx] = 2`) dentro de un radio de `115px` respecto a `TRAYECTOS_PUENTES_AETHELGARD` en agua inmediata (`3 <= distanciaMar <= 7`), exigiendo espesor sólido vertical (`>= Math.round(7 * escala)`) y agua abierta inferior (`>= Math.round(4 * escala)`).
   - Para erradicar por completo techos aéreos, muros inclinados internos de bóveda y acantilados de islas vecinos, cada celda candidata debe confirmar **flancos de agua a izquierda y derecha** a la altura `yBorde - 3` dentro de `alcanceFlancoColumna = Math.max(5, Math.round(20 * escala))` y carecer de bloque descendente contiguo `4` celdas abajo (`bajaCerca`). Con esto quedan aislados con precisión los pies de columnas reales (`14` emisores calibrados con separación mínima `sepPilar2 = 20 * 20` para evitar duplicados por columna).
2. **Cadencia Serena y Estética Integrada al Mar:**
   - En `dibujarResacaYHitosRegionales`, la velocidad de expansión de las ondas en `p.esPilar` se redujo de `t * 0.00095` a **`t * 0.00028`** (`~3.57s` por ciclo) con oleaje de marea suavizado (`Math.sin(t * 0.0014 + p.fase)`), collarín continuo sutil (`0.28..0.48` alfa), doble onda concéntrica en contrafase (`0.10..0.52` alfa, grosor `1.25..1.0px`), tintado por clima costero (`glacial`, `volcanico`, `templado`) y salpicaduras laterales discretas de `2×2px` bajo el nivel sólido del mapa.
3. **Cobertura de Pruebas y Auditoría Headless ([verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts)):**
   - Se añadió la aserción §7 verificando un puente sintético con dos columnas sumergidas y un vano de arco central aéreo (`LOC-01 <-> ZON-02`): confirma la detección de `esPilar` en ambos pies de pilar, la exclusión absoluta bajo el techo del arco central y cero invasión de mampostería sólida.
   - Se inspeccionaron visualmente capturas reales ampliadas en Chrome headless sobre los viaductos (`LOC-02 <-> ZON-03`, `LOC-01 <-> ZON-02`, `ZON-02 <-> ZON-03`, `LOC-03 <-> ZON-06` y `ZON-05 <-> ZON-06`), comprobando la ausencia total de artefactos bajo las bóvedas antes de eliminar los archivos temporales de prueba.

### 35.3 Verificación de Calidad y Cero Regresiones

- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores.
- **Linter Focalizado (`pnpm --filter web exec oxlint src/lib/oceano-vivo.ts test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`2` archivos en `20ms`).
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `91` archivos, `326ms`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `2920.5942ms`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`5.59s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `83152.7656ms`).

---

## 36. Calibración de Colindación Exacta del Agua con Columnas de Puentes (Subfase 10s)

> **Rama de trabajo:** `funcionalidad/fase-10s-calibracion-columnas`
> **Módulos implicados:** [oceano-vivo.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/oceano-vivo.ts)

### 36.1 Diagnóstico Inicial

Al auditar la captura en primer plano del área central entre `Puesto del Río`, `Villa Serena`, `Lago Espejo` y `Riscos Escarpados`, manteniendo intacta la animación serena de ondas en columnas, se detectaron tres causas geométricas de desalineación en la extracción automática de pilares (`esPilar: true`):

1. **Desplazamiento hacia el borde izquierdo de cada columna:** el barrido lineal de izquierda a derecha fijaba la semilla al primer píxel con distancia `sepPilar2 = 20 * 20`, ubicando el emisor en el borde izquierdo de columnas de `16–24px` de ancho en lugar de su eje horizontal central.
2. **Desfase vertical bajo el pie sumergido:** al muestrear agua a distancia `3..7` de la grilla (`0.5x`), los centros descendían `4–7px` por debajo de la mampostería (`y = 634` frente a la base real en `y ≈ 630` en el viaducto central `LOC-02 <-> ZON-03`), separando visualmente la onda del pilar.
3. **Falsos positivos aislados bajo copas de árboles en `Lago Espejo`:** `distanciaMinimaPuenteCuadrada` consideraba la cercanía lateral al trazo superior del viaducto `LOC-02 <-> ZON-03` sin validar que el punto estuviera a la altura vertical del puente (`ly >= yPuente - 4`), generando dos puntos por debajo de las copas de árboles superiores de `ZON-02`.

### 36.2 Mejoras Implementadas

1. **Agrupación por Columna y Centrado Exacto en Pie de Mampostería ([oceano-vivo.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/oceano-vivo.ts)):**
   - Se incorporó `muestraPuenteMasCercana(lx, ly)` devolviendo `{ d2, yPuente }` para exigir `ly >= cercano.yPuente - 4` en la pasada de pilares dentro de `analizarMascaraAlfaOceano` (distancia inmediata `d` entre `2` y `6`, altura de agua abierta `up` entre `1` y `3`), eliminando los artefactos sobre las copas de árboles de `Lago Espejo`.
   - En `generarDatosOceanoVivo`, todas las celdas candidatas `esFrenteAcantilado === 2` se agrupan por componente conexa (`|dx| <= 18 && |dy| <= 14`) para obtener su envolvente horizontal `[xMin, xMax]` y la base real de piedra `yBorde`, fijando `lx = (xMin + xMax) * 0.5`, `yAgua = (yBorde + 1) / escala` y ancho calibrado con el grosor sólido real medido en `yBorde - 1` (`Math.max(10, Math.min(28, maxAnchoCol * 1.15))`), con respaldo seguro a la celda de agua válida más cercana al eje si el punto medio toca un saliente irregular (`consultarDistanciaMar(...) === 0`).
   - Se conservó sin cambios la animación visual, cadencia (`t * 0.00028`) y renderizado en `dibujarResacaYHitosRegionales`.
2. **Inspección Visual en Chrome Headless:**
   - Se validaron capturas ampliadas sobre `LOC-02 <-> ZON-03`, `LOC-01 <-> ZON-02`, `ZON-02 <-> ZON-03`, `ZON-04 <-> ZON-05`, `ZON-05 <-> ZON-06`, `LOC-03 <-> ZON-06` y los puentes del oeste antes de retirar los archivos temporales de inspección.

### 36.3 Verificación de Calidad y Cero Regresiones

- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores.
- **Linter Focalizado (`pnpm --filter web exec oxlint src/lib/oceano-vivo.ts test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`2` archivos en `80ms`).
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `91` archivos en `176ms`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `1256.8878ms`).
- **Compilación de Producción (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`2.13s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **130 de 130 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `29078.2906ms`).

---

## 37. Corrección Responsive del Hub, Modales sin Desborde, Dock Completo de 6 Ranuras y Requisitos Limpios

### 37.1 Diagnóstico Inicial y Auditoría Visual

Al revisar capturas reales del Hub de Ubicación (`apps/web/src/paginas/PantallaHubUbicacion.tsx`) en resoluciones móviles verticales y horizontales compactas, así como en escritorio, se identificaron cuatro fricciones concretas de interfaz y legibilidad:

1. **Redundancia y empuje en HUD superior:** La tarjeta superior izquierda incluía una miniatura etiquetada como `ZONA` con la imagen de la ubicación actual (redundante frente al mapa interactivo y al nombre de la zona), lo que ensanchaba la tarjeta en pantallas estrechas y empujaba los controles superiores derechos (monedas y botón de menú/ajustes) hacia el borde horizontal.
2. **Desbordamiento horizontal en modales del Hub:** A diferencia de `PantallaCatalogo.tsx` (que utiliza `Dialog` / `DialogContent` en columna `flex-col`), ambos modales de `PantallaHubUbicacion.tsx` (menú de ajustes y modal de inspección/viaje de zona) seguían usando `AlertDialog` (`ShadcnAlertDialogContent` imponía `display: grid` y `data-[size=default]:max-w-xs`), ocasionando recortes laterales en la barra de cartografía, encabezados largos y etiquetas de fauna en pantallas móviles.
3. **Ocultamiento parcial del equipo en el dock inferior y roce con controles del mapa:** El dock inferior renderizaba únicamente 4 ranuras visibles más un indicador `+1` cuando el equipo superaba 4 criaturas, ocultando integrantes activos; además, en móvil el botón `EXPLORAR` / `VIAJAR` solapaba visualmente parte del dock y las botoneras laterales centradas coincidían verticalmente con los controles de zoom de `MapaInteractivoCanvas.tsx`.
4. **Exposición de IDs internos en textos de requisitos territoriales:** Tanto el backend (`REGLAS_DESBLOQUEO_TERRITORIAL` y `detalleProgreso` en `apps/api/src/modulos/progreso/progreso.service.ts`) como la vista de inspección de `PantallaHubUbicacion.tsx` mostraban identificadores técnicos (`(ZON-05)`, `[ZON-05]`, etc.) al jugador en lugar de presentar únicamente el nombre legible de la zona. Asimismo, se auditó la base de datos PostgreSQL para validar la consistencia de las tablas territoriales y de encuentro (`zona`, `conexion_zona`, `aparicion_zona`, `evento_zona`).

### 37.2 Mejoras Implementadas

- **Limpieza del HUD superior y ergonomía de rieles laterales (`PantallaHubUbicacion.tsx`, `MapaInteractivoCanvas.tsx`):**
  - Se eliminó la miniatura redundante `ZONA` de la tarjeta superior izquierda del HUD y se ajustó el contenedor flex (`min-w-0 flex-1` junto con `w-fit max-w-full min-w-0 sm:max-w-lg`) manteniendo los controles superiores derechos (`shrink-0`) dentro del viewport sin desbordes.
  - Se alinearon los rieles laterales de servicios con `items-start pt-3 sm:items-center sm:pt-0` en móvil y se desplazaron los controles del mapa en `MapaInteractivoCanvas.tsx` exclusivamente en escritorio hacia abajo (`bottom-36 sm:bottom-28 md:bottom-3`), despejando el botón de acercar (`+`) debajo de `Santuario de Salud` sin alterar la posición en móvil.
- **Migración de modales del Hub al patrón `Dialog` de `PantallaCatalogo.tsx`:**
  - Se reemplazaron los dos `AlertDialog` de `PantallaHubUbicacion.tsx` (menú de Aethelgard e inspección/viaje de nodo) por `Dialog` / `DialogContent` (`font="normal"`, `showCloseButton={false}`, `p-0`, `flex flex-col`, `w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden`) con cabecera/pie fijos (`bg-bastion`) y cuerpo desplazable (`overflow-y-auto overflow-x-hidden`), `min-w-0`, `flex-wrap` y `break-words`.
- **Dock inferior completo de 6 ranuras sin ocultar criaturas:**
  - Se reemplazó la vista truncada de 4 ranuras + `+1` por la cuadrícula completa de ranuras del equipo activo (`limiteEquipo`, mínimo `6` espacios visibles) mediante `grid grid-cols-6` apilada sobre el botón ancho `EXPLORAR` / `VIAJAR` en pantallas `< 640px` y en fila única desde `sm:`, reubicando la etiqueta de nivel de cada criatura en `top-0.5 right-0.5`.
- **Eliminación de IDs internos en requisitos de acceso (`progreso.service.ts` y `PantallaHubUbicacion.tsx`):**
  - Se retiraron los prefijos/sufijos `(ZON-01)`..`(ZON-05)` de `REGLAS_DESBLOQUEO_TERRITORIAL`, se sustituyó `regla.zonaPreviaId` por `regla.nombreZonaPrevia ?? regla.zonaPreviaId` en `detalleProgreso` dentro de `evaluarEstadoRequisitoZona`, y se eliminó `[{conexionSeleccionada.requisitoCartografia.zonaId}]` del modal del Hub, dejando únicamente el nombre de la zona previa.
  - Mediante consulta directa a PostgreSQL se verificó la integridad de los 9 nodos (`LOC-01`..`LOC-03`, `ZON-01`..`ZON-06`), 20 aristas dirigidas en `conexion_zona`, 5 especies por zona silvestre en `aparicion_zona` con suma de pesos exactamente 100 por zona (600 en total), y 18 registros en `evento_zona`.

### 37.3 Verificación de Calidad y Cero Regresiones

- **Linter Focalizado Web (`pnpm --filter web exec oxlint src/components/mundo/MapaInteractivoCanvas.tsx test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`2` archivos revisados con `116` reglas en `43ms`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **101 de 101 pruebas aprobadas** (`0` fallos, `0` omitidas en `1552.7386ms`), incluyendo aserciones actualizadas en `apps/web/test/verificacion-hub-mundo.spec.ts` sobre el patrón `Dialog`, eliminación de la miniatura `ZONA`, dock de 6 ranuras en móvil, ausencia de `requisitoCartografia.zonaId` en la UI y desplazamiento `md:bottom-3` de los controles del mapa en escritorio.
- **Compilación de Producción Web (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2163 módulos** transformados en **`1.74s`**).
- **Pruebas Unitarias API (`pnpm --filter api test`):** **131 de 131 pruebas aprobadas** en **41 suites** (`0` fallos, `0` omitidas en `49018.9091ms`), incluyendo la nueva prueba en `apps/api/test/progreso-tienda.spec.ts` que valida que `REGLAS_DESBLOQUEO_TERRITORIAL` y `detalleProgreso` no expongan `ZON-XX` / `LOC-XX`.
- **Compilación API (`pnpm --filter api build`):** Compilación exitosa (`nest build`, código de salida `0`).

---

## 38. Sub-Fase 10t: Animación Multicapa de "La Cumbre" (`ZON-06`) en el Mapa de Aethelgard

> **Rama de trabajo:** `funcionalidad/fase-10t-cumbre-viva` → refinamiento `funcionalidad/fase-10t-aurora-cumbre` (integradas en `desarrollo`)
> **Módulos implicados:** [diorama-cumbre.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-cumbre.ts) _(nuevo)_, [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts), [MapaInteractivoCanvas.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/MapaInteractivoCanvas.tsx) y [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts)

### 38.1 Diagnóstico Inicial y Auditoría Visual (Impeccable)

Antes de intervenir el diorama, se extrajo un recorte ampliado 3× de `ZON-06` directamente desde `apps/web/public/assets/mapa-mundo-aethelgard.webp` con rejilla de coordenadas lógicas `1616×897`, detectando cuatro brechas respecto al acabado Dark Fantasy del resto del archipiélago:

1. **Efecto glaciar mínimo y desfasado en `mapa-dioramas.ts`:** `ZON-06` solo contaba con un arco lineal único de aurora, 4 halos circulares desplazados bajo los cristales (`[852,82]`, `[933,102]`, `[1247,114]`, `[1172,180]`) y 14 cuadros de nieve sobre un rectángulo sin recorte de silueta (`790..1285`), dejando sin vida las puntas cristalinas, los picos de la cordillera ni los acantilados sur.
2. **Protagonismo desaprovechado del esqueleto del dragón ancestral:** La ilustración maestra presenta un fósil completo de dragón congelado sobre la meseta (`x: 1022..1182, y: 92..162`, con fauces en `(1024, 143)`, cuenca ocular oscura en `(1046, 130)` y columna vertebral arqueada hasta la cola), completamente estático hasta ahora.
3. **Riesgo de solapamiento con vecinos y costo de gradientes por cuadro:** Al sur de `La Cumbre`, los picos y nubes volcánicas de `ZON-04` (_Paso de los Riscos_, pico en `(996, 186)`) colindan con el acantilado helado; además, las animaciones debían evitar `createLinearGradient` / `createRadialGradient` dentro del bucle de 60 FPS y respetar íntegramente el HUD externo, las otras 8 islas y `prefers-reduced-motion`.

### 38.2 Mejoras Implementadas

#### A. Identidad Visual Retro Dark Fantasy y Submódulo Dedicado (`diorama-cumbre.ts`)

- **Medición exacta sobre el arte maestro (`1616×897`):** Se definieron las envolventes calibradas `SILUETA_ENVOLVENTE_CUMBRE` (32 vértices siguiendo cielo de cumbres, puntas de cristales y acantilado sur sin tocar `ZON-04`, `LOC-03` ni `ZON-05`) y `CONTORNO_MESETA_CUMBRE`, los 8 vértices de `PICOS_CORDILLERA_CUMBRE` (cumbre principal en `(1070, 3)`), los 4 cúmulos de `CRISTALES_GLACIARES_CUMBRE` + 2 `AGUJAS_ACANTILADO_CUMBRE`, el esqueleto completo `ESQUELETO_DRAGON_CUMBRE` (fauces, cuenca ocular, centro costal, patas y 11 vértebras), 12 `DESTELLOS_CORNISA_CUMBRE` y 5 `FRAGMENTOS_ESCARCHA_ACANTILADO`.
- **Aurora boreal multicapa detrás de las cumbres y reflejo polar frontal:** Se elevó la aurora a un espectáculo atmosférico de 3 cortinas plegadas en "S" con inclinación magnética orgánica (`cortinaEsmeralda` con borde inferior menta luminoso hacia corona cian-violeta, `cortinaVioleta` amatista-cian en profundidad y `rayoPilar` para 22 pilares de luz viajeros), baño polar (`haloAuroraPolar`), 18 estrellas polares titilantes y reflejo tenue en el mar norte. Mediante `dibujarFondoCieloMapa` (`mapa-dioramas.ts`) y `dibujarCieloAuroraCumbre`, las cortinas se dibujan **antes** del WebP transparente en `MapaInteractivoCanvas.tsx` para que las cumbres nevadas y cristales se recorten con nitidez por delante, complementadas por un baño polar frontal sutil y motas luminosas (`dibujarReflejoAuroraEnCumbres`) tras `ctx.drawImage`.
- **Ventisca alpina en 3 planos y plumas de cresta:** Nieve lejana (`COPOS_LEJANOS`), neblina rasante confinada a la meseta (`CONTORNO_MESETA_CUMBRE` + validación contra `mascaraOceano`), plumas de nieve desprendiéndose desde los picos más altos hacia la derecha, y 34 partículas diagonales de ventisca con estela corta y contraste cian sobre nieve blanca (`#7dd3fc` / `#f0f9ff`).
- **Cristales glaciares vivos y acantilado:** Micro-resplandor cian sobre la nieve de base, pulso interno en la arista central de cada cristal, destellos en cruz pixelada nítidos (`dibujarDestelloCruzPixel`) en las puntas principales y satélite, chispas de escarcha ascendentes, brillos intermitentes en la cornisa helada y 5 micro-fragmentos de escarcha cayendo al mar gélido (validando con `esTierraFirmeEnMascara` para no impactar terreno vecino).
- **Esqueleto del dragón ancestral:** Exhalación cíclica de aliento helado desde las fauces `(1024, 143)` hacia la izquierda al ras del suelo, bruma gélida reptando entre costillas y garras, y pulso espectral glaciar sutil en la cuenca ocular `(1046, 130)` seguido de una onda rúnica tenue recorriendo las 11 vértebras de la espina dorsal hacia la cola.
- **Diferenciación bloqueada vs. desbloqueada:** Cuando `ZON-06` está bloqueada (`dibujarEstadoBloqueadoCumbre`), preserva íntegro el sombreado de niebla oscura y limita el efecto a bruma fría contenida y copos tenues dispersos; al desbloquearse, despliega todas las capas atmosféricas, cristalinas y espectrales.

#### B. Rendimiento 60 FPS, Componentes `8bitcn/ui` e Integración en Canvas

- **Cero basura de memoria en `requestAnimationFrame`:** `obtenerSpritesCumbre()` pre-renderiza una única vez 8 sprites en canvas auxiliares (`resplandorGlacial`, `resplandorEspectral`, `cortinaEsmeralda`, `cortinaVioleta`, `rayoPilar`, `haloAuroraPolar`, `brumaFria`, `brumaCian`), dibujados por cuadro mediante `drawImage` y `globalAlpha`.
- **Integración limpia y respeto a accesibilidad:** `MapaInteractivoCanvas.tsx` pasa `recursosOceano.mascara` (opcional) a `dibujarCapaVivaMapa` en `mapa-dioramas.ts`, que delega `ZON-06` a `dibujarDioramaCumbre`. El modo `reducirMovimiento` (`prefers-reduced-motion`) congela una estampa limpia y equilibrada. Toda la interfaz `8bitcn/ui` externa, controles, paletas, océano y efectos de las otras 8 islas permanecen intactos.

#### C. Audio Web Audio API y Reglas del Servidor

- Sin alteraciones en la síntesis de audio (`reproducirSonido`) ni en reglas de negocio, rutas REST o esquema PostgreSQL en `apps/api`.

### 38.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual Headless a Zoom 1× y 2× (Chrome headless sobre los módulos reales):** Validación visual en estados bloqueado, desbloqueado (múltiples instantes `t = 1200 ms`, `t = 1500 ms`, `t = 3600 ms` y `t = 3800 ms`) y `reducirMovimiento`, confirmando las 3 cortinas S-plegadas de aurora boreal recortándose limpiamente detrás de las cumbres y cristales transparentes del WebP, ventisca recortada, 4 cristales, cuenca ocular, aliento y espina del dragón, y caída de escarcha al mar sin invadir `ZON-04` ni puentes; todos los archivos temporales de scratch fueron eliminados al finalizar.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores de TypeScript.
- **Linter Focalizado (`pnpm --filter web exec oxlint src/lib/diorama-cumbre.ts src/lib/mapa-dioramas.ts src/components/mundo/MapaInteractivoCanvas.tsx test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`4` archivos en `53ms`).
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `92` archivos, `510ms`).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **102 de 102 pruebas aprobadas** (`0` fallos, `0` omitidas en `3742.8139ms`), incluyendo la suite `Subfase 10t` (con validación de orden de renderizado `dibujarFondoCieloMapa` previo a `ctx.drawImage` y `dibujarCieloAuroraCumbre`) y la validación R1 (cero emojis) sobre `diorama-cumbre.ts`.
- **Compilación de Producción Web (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2164 módulos** transformados en **`5.91s`**).

---

## 39. Sub-Fase 10u: Diorama Vivo Completo de "Cueva Umbría" (`ZON-05`) en el Mapa de Aethelgard

> **Rama de trabajo:** `funcionalidad/fase-10u-cueva-umbria` (integrada hacia `desarrollo` con merge `--no-ff`)
> **Módulos implicados:** [diorama-cueva-umbria.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-cueva-umbria.ts) _(nuevo)_, [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts), [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts) y [INDICE.md](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/docs/INDICE.md)

### 39.1 Diagnóstico Inicial y Auditoría Visual (Impeccable)

Antes de intervenir `ZON-05`, se extrajo un recorte ampliado 3× directamente de `apps/web/public/assets/mapa-mundo-aethelgard.webp` con grilla lógica `1616×897` y análisis por píxel en Chromium headless, identificando cuatro carencias respecto al estándar fijado en `diorama-cumbre.ts`:

1. **Diorama rudimentario en `mapa-dioramas.ts` (`L983–L1083`):** `ZON-05` únicamente dibujaba halos circulares básicos (`dibujarHaloFuego`), 5 rectángulos cayendo en línea recta, chispas sueltas sin confinamiento y una polilínea rígida de 3 segmentos flotando sobre el cúmulo de cristales derecho (`(1486, 218)..(1558, 218)`), muy por encima de las puntas reales.
2. **Desaprovechamiento del contraste volcánico vs. abisal:** La lámina maestra posee una gran caverna oscura con caída vertical de magma, una meseta de basalto con 3 ramales de lava, 3 cascadas frontales (la central bifurcada en 3 hebras por estrías de roca) y 3 cúmulos de cristales amatista; ninguno de estos relieves contaba con animación fiel ni diferenciación bloqueada vs. desbloqueada.
3. **Proximidad crítica de fronteras vecinas:** Al oeste colinda el viaducto violeta hacia `ZON-04` (_Riscos_), al noroeste el puente de piedra hacia `ZON-06` (_La Cumbre_), y inmediatamente al sur (`y >= 510`) inicia la copa arbórea de `ZON-03` (_Bosque_), exigiendo contención estricta para que ni vapor ni lava invadan terreno vecino.

### 39.2 Mejoras Implementadas

#### A. Identidad Retro Dark Fantasy y Submódulo Dedicado (`diorama-cueva-umbria.ts`)

- **Medición píxel a píxel sobre el arte maestro (`1616×897`):** Se definieron `SILUETA_ENVOLVENTE_CUEVA` (33 vértices en `x: 1246..1602, y: 206..505`), `ARCO_CAVERNA_CUEVA` (12 vértices sobre la boca oscura central), `CASCADA_TECHO_CUEVA` (grieta superior en `(1453, 294)` hasta poza interior `(1453, 353)`), `PRESENCIA_UMBRIA_CUEVA` (ojo izquierdo `(1410, 326)`, ojo derecho `(1418, 326)` y umbral `(1398, 345)`), `CAUCES_LAVA_MESETA` (ramales oeste, central bajo puente basáltico, bifurcación izquierda y este) + 6 `BURBUJAS_LAVA_MESETA`, `CASCADAS_ACANTILADO_CUEVA` (3 caídas, con la central dividida en 3 hebras reales en `1393`, `1408` y `1422` y pozas acotadas en `y <= 488`), `CUMULOS_CRISTALES_CUEVA` (cúmulo oeste, cúmulo colosal con aguja maestra en `(1536, 225)` y cúmulo este) y 12 trayectorias en `ARCOS_CRISTAL_COLOSAL` (7 en el cúmulo colosal y 5 entre los cúmulos oeste y este).
- **Atmósfera trasera tras la cresta de basalto (`dibujarFondoCuevaUmbria` -> `dibujarFondoCieloMapa`):** Resplandor dual naranja-carmesí tras la cumbre basáltica y aura abisal púrpura detrás del gran cúmulo cristalino, acompañados de columnas lentas de humo oscuro/cálido y pavesas ascendiendo detrás de la silueta WebP.
- **Gran Caverna Sombría (`dibujarCavernaSombria`):** Dos chorros continuos multicapa (`lineCap = "round"` sobre `flujoBufferX`/`flujoBufferY` de 14 segmentos) cayendo desde la grieta superior con manto naranja exterior, crestas sinusoidales viajeras blanco-doradas y salpicaduras en la poza central; neblina densa violeta-azabache confinada al arco cavernoso y umbral izquierdo, más destello esporádico y elegante de ojos abisales cada ~9.6 s en la penumbra izquierda sin tocar el chorro de magma.
- **Ríos de lava y cascadas con choque térmico (`dibujarRiosLavaMeseta`, `dibujarCascadasYVaporCueva`):** Corrientes continuas serpeantes de magma (`18` tramos sobre `flujoBufferX`/`flujoBufferY`) calibradas exclusivamente sobre los cauces naranja expuestos sin invadir islotes de basalto, domos incandescentes (`BURBUJAS_LAVA_MESETA`) que se hinchan y estallan liberando micro-chispas, chorros viscosos continuos (`14` tramos ondulantes) en cada hebra de las 3 cascadas y nubes de vapor hirviente (`vaporCaliente`) ascendiendo desde las 3 pozas costeras (validando altura y `MascaraOceano` para jamás tocar `Bosque` ni chocar con el oleaje).
- **Cristales amatista, descargas arcanas y ceniza (`dibujarCristalesYArcosCueva`, `dibujarCenizaYPavesasCueva`):** Reflejo púrpura sobre la roca negra en la base de los 3 cúmulos, pulso mágico ascendente por cada aguja con reflejos de faceta y cruz pixelada (`dibujarDestelloCruzPixel`), 18 motas de éter violeta y arcos eléctricos orgánicos bifurcados de 12 segmentos angulosos (`lineCap = "square"`, `lineJoin = "miter"`, triple pasada corona púrpura + halo magenta + núcleo blanco-lavanda + 1 a 2 bifurcaciones vivas) con distribución áurea de fases sobre los 3 cúmulos; además de 24 cenizas grises y 18 pavesas naranjas en espiral dentro de la envolvente.
- **Diferenciación bloqueada vs. desbloqueada (`dibujarEstadoBloqueadoCueva`):** Cuando `ZON-05` está bloqueada, oculta la atmósfera trasera y limita la isla a rescoldos apagados en poza/cascadas, un hilo tenue de humo oscuro desde la caverna y pulsos débiles en la base de los cristales.

#### B. Rendimiento 60 FPS, Integración en Canvas y Componentes `8bitcn/ui`

- **Cero basura de memoria en `requestAnimationFrame`:** `obtenerSpritesCueva()` pre-renderiza una sola vez 7 sprites fuera de pantalla (`haloVolcanico`, `haloAbisalPurpura`, `haloMagmaNucleo`, `haloArcanoCristal`, `humoOscuro`, `vaporCaliente`, `brumaUmbria`) y reutiliza búferes estáticos `Float32Array` (`arcoBufferX`, `arcoBufferY`, `ramaBufferX`, `ramaBufferY`, `flujoBufferX`, `flujoBufferY`) para generar los arcos eléctricos y flujos de magma continuos sin asignaciones por cuadro.
- **Integración modular y accesibilidad:** [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) invoca `dibujarFondoCuevaUmbria` desde `dibujarFondoCieloMapa` y `dibujarDioramaCuevaUmbria` desde `dibujarCapaVivaMapa`, respetando `reducirMovimiento` (`prefers-reduced-motion`). No se alteraron HUD, tarjetas, botones `8bitcn/ui`, motor oceánico ni las otras 8 islas.

#### C. Audio Web Audio API y Reglas del Servidor

- Sin cambios en síntesis de audio (`assets.ts`) ni en rutas REST, DTOs o esquema PostgreSQL en `apps/api`.

### 39.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual Headless en Chromium (zoom 1× y 2.5×):** Verificación directa de capturas en contexto (`1×`), desbloqueada en múltiples instantes (`t = 1200 ms`, `t = 2675 ms` con arco eléctrico bifurcado en los 3 cúmulos + ojos abisales y `t = 4000 ms` con ráfagas cristalinas, burbujas y vapor), bloqueada (`t = 1500 ms`) y movimiento reducido, confirmando flujo continuo de lava sin cortes ni invasión sobre rocas basálticas, `ZON-03`, `ZON-04`, `ZON-06` ni puentes, con un tiempo promedio medido en CPU (`--disable-gpu`) de **`2.617 ms/cuadro`** sobre lienzo `1616×897` para `ZON-05`.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores.
- **Linter Focalizado (`pnpm --filter web exec oxlint src/lib/diorama-cueva-umbria.ts src/lib/mapa-dioramas.ts test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`3` archivos en `22ms`).
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `93` archivos en `401ms`, `0` advertencias nuevas).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **103 de 103 pruebas aprobadas** (`0` fallos, `0` omitidas en `1746.4818ms`), incluyendo la suite `Subfase 10u` sobre geometría calibrada, bifurcación central en 3 hebras, 12 arcos en cúmulos, caché de sprites, búfer continuo `flujoBufferX`, ejecución segura en Node y cumplimiento de `R1`.
- **Compilación de Producción Web (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2165 módulos** transformados en **`2.05s`**).

---

## 40. Sub-Fase 10v: Diorama Vivo Completo de "Paso de los Riscos" (`ZON-04`) en el Mapa de Aethelgard

> **Rama de trabajo:** `funcionalidad/fase-10v-riscos` (integrada hacia `desarrollo` con merge `--no-ff`)
> **Módulos implicados:** [diorama-riscos.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-riscos.ts) _(nuevo)_, [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts), [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts) y [INDICE.md](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/docs/INDICE.md)

### 40.1 Diagnóstico Inicial y Auditoría Visual (Impeccable)

Antes de diseñar las coordenadas de `ZON-04`, se extrajeron recortes ampliados (`3×` contextual y `3.5×` de detalle) desde [mapa-mundo-aethelgard.webp](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/public/assets/mapa-mundo-aethelgard.webp) con grilla lógica `1616×897` en Chromium headless, detectando cuatro deficiencias clave en la implementación anterior (`L920–L951` de `mapa-dioramas.ts`):

1. **Efectos genéricos e imprecisos:** `ZON-04` únicamente dibujaba 7 halos radiales básicos (`dibujarHaloFuego`), 2 rectángulos verticales desplazados `~18 px` al este de la cascada real (`1088` frente al cauce verdadero en `1070..1072`), `dibujarHumoChimenea` lineal y 6 chispas genéricas sin seguimiento de grietas.
2. **Desaprovechamiento de la identidad propia del desfiladero:** A diferencia de `Cueva Umbría` (volcán abierto y cristales arcanos), *Paso de los Riscos* destaca por tres arcos góticos en ruinas azotados por vientos de altura, dos fumarolas sulfurosas ocres tras las agujas oscuras, fisuras tectónicas de magma contenido y paredes escarpadas con gravilla suelta.
3. **Contención crítica en el centro del archipiélago:** `ZON-04` colinda al norte con el hielo sur de `ZON-06` (*La Cumbre*), al este con el viaducto violeta de `ZON-05` (*Cueva Umbría*), al noroeste con `LOC-03` (*Bastión Norte*) y al sur/suroeste con el puente de `LOC-02` (*Puesto del Río*) y el puente hacia `ZON-03` (*Bosque*), exigiendo límites estrictos para evitar solapamientos sobre puentes e islas vecinas.

### 40.2 Mejoras Implementadas

#### A. Identidad Retro Dark Fantasy y Submódulo Dedicado (`diorama-riscos.ts`)

- **Medición píxel a píxel sobre el arte maestro (`1616×897`):** Se calibraron `SILUETA_ENVOLVENTE_RISCOS` (41 vértices en `x: 746..1168, y: 198..470` evitando todos los puentes y márgenes vecinos), `FUMAROLAS_RISCOS` (foco oeste `(905, 254)` acotado a `y >= 208` y foco este `(1072, 274)` acotado a `y >= 230`), `ARCOS_RUINAS_RISCOS` (arco oeste `(900, 312)`, arco central `(943, 298)` y arco este roto `(1053, 320)` con coordenadas de clave y runas en pilares), `FISURAS_TECTONICAS_RISCOS` (11 trazos polilínea exactos sobre crestas, explanada oeste/este y acantilados oeste/centro/este), `CASCADA_IGNEA_RISCOS` (labio en `(1070, 386)`, cauce vertical `1070..1072` hasta la poza rocosa `(1072, 443)`), `DESPRENDIMIENTOS_RISCOS` (4 canaletas frontales alejadas de la calzada de `LOC-02` y del viaducto hacia `ZON-05`) y `RACHAS_POLVO_SENDERO_RISCOS` (6 puntos guía sobre la calzada de tierra).
- **Fondo atmosférico tras las crestas (`dibujarFondoRiscos` -> `dibujarFondoCieloMapa`):** Resplandor térmico contenido en terracota/ámbar profundo (`haloRescoldo`) detrás de las dos fumarolas y pico central, combinado con penachos volumétricos de humo sulfuroso ocre-pardo (`humoSulfuroso`) y neblina de altura gris-pizarra (`neblinaAltura`) disipándose al noreste sin rozar `ZON-06` ni `ZON-05`.
- **Arcos en ruinas vivos (`dibujarArcosVivosRiscos`):** Filetes aerodinámicos de viento cortante y polvo mineral serpenteando a través de los 3 vanos (`vientoBufferX`/`vientoBufferY`), motas minerales iluminadas por la calidez inferior y parpadeo tenue e intermitente de brasas/runas desgastadas en los pilares rotos (`haloRunaAntigua`).
- **Fisuras tectónicas con respiración subterránea (`dibujarFisurasTectonicasRiscos`):** Reemplaza las manchas circulares por trazos vértice a vértice sobre las grietas reales con onda térmica lenta viajando de izquierda a derecha (`Math.sin((mx - 770) * 0.022 - t * 0.0024)`) y chispas puntuales asomando únicamente en las junturas más profundas.
- **Fumarolas frontales, cascada ígnea y micro-vida geológica (`dibujarHumoYCentellasRiscos`, `dibujarCascadaIgneaRiscos`, `dibujarMicroVidaGeologicaRiscos`):** Volutas frontales dobladas hacia el noreste por la corriente lateral del paso y ceniza mineral dispersa; hilo viscoso continuo de magma (`cascadaBufferX`/`cascadaBufferY`) con bordes carmesí, goterones ocasionales y pequeñas volutas cálidas al caer en la poza basal respetando `MascaraOceano`; además de diminutos desprendimientos esporádicos de gravilla/polvo seco que se disipan antes del océano y rachas tenues de polvo rasante cruzando el sendero entre puentes.
- **Estado bloqueada vs. desbloqueada (`dibujarEstadoBloqueadoRiscos`):** Cuando `ZON-04` está bloqueada, oculta la atmósfera trasera y limita el diorama a fisuras dormidas en rescoldo oscuro (`#7c2d12`), rescoldo contenido en la poza basal y un hilo tenue de humo en las dos fumarolas, preservando intacto el sombreado territorial.

#### B. Rendimiento 60 FPS, Integración en Canvas y Componentes `8bitcn/ui`

- **Cero basura de memoria en `requestAnimationFrame`:** `obtenerSpritesRiscos()` pre-renderiza y cachea una sola vez 6 sprites fuera de pantalla (`haloRescoldo`, `haloMagmaNucleo`, `humoSulfuroso`, `neblinaAltura`, `haloRunaAntigua`, `polvoRoca`) y reutiliza búferes estáticos `Float32Array` (`fisuraBufferX`, `fisuraBufferY`, `vientoBufferX`, `vientoBufferY`, `cascadaBufferX`, `cascadaBufferY`) sin crear gradientes ni arreglos por cuadro.
- **Integración y accesibilidad:** [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) invoca `dibujarFondoRiscos` desde `dibujarFondoCieloMapa` y `dibujarDioramaRiscos` desde `dibujarCapaVivaMapa`, respetando `reducirMovimiento` (`prefers-reduced-motion`). No se alteraron el HUD externo, tarjetas, botones `8bitcn/ui`, puentes, motor oceánico ni las otras 8 islas.

#### C. Audio Web Audio API y Reglas del Servidor

- Sin cambios en síntesis de audio (`assets.ts`) ni en rutas REST, DTOs o esquema PostgreSQL en `apps/api`.

### 40.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual Headless en Chromium (zoom `1×` y `3×`):** Verificación directa sobre capturas reales en `1×` (`vista-1x-desbloqueada`), `3×` desbloqueada en múltiples instantes (`t = 900 ms`, `t = 2400 ms`, `t = 4100 ms`), bloqueada (`t = 1500 ms`) y movimiento reducido, confirmando alineación exacta de la cascada ígnea (`1070..1072, 386..443`), fisuras sobre las grietas reales, vientos dentro de los 3 arcos y cero invadimiento sobre `Bastión Norte`, `La Cumbre`, `Cueva Umbría`, `Puesto del Río`, `Bosque` ni puentes, con un costo promedio medido en CPU (`--disable-gpu`) de **`2.938 ms/cuadro`** sobre lienzo `1616×897`.
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores.
- **Linter Focalizado (`pnpm --filter web exec oxlint src/lib/diorama-riscos.ts src/lib/mapa-dioramas.ts test/verificacion-hub-mundo.spec.ts`):** `0` advertencias y `0` errores (`3` archivos en `16ms`).
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `94` archivos en `174ms`, `0` advertencias nuevas).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **104 de 104 pruebas aprobadas** (`0` fallos, `0` omitidas en `1848.4026ms`), incluyendo la nueva suite `Subfase 10v` sobre límites de silueta en `ZON-04`, 2 fumarolas, 3 arcos, fisuras polilínea, cascada sureste, ejecución segura en Node, caché de sprites, búferes estáticos y cumplimiento estricto de `R1`.
- **Compilación de Producción Web (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2166 módulos** transformados en **`1.79s`**).

---

## 41. Auditoría Integral de Páginas, Limpieza de Copy y Fix Móvil de Viewport/Safe-Area (`correccion/auditoria-movil-copy-viewport`)

> **Rama de trabajo:** `correccion/auditoria-movil-copy-viewport` (integrada hacia `desarrollo` con merge `--no-ff`)
> **Módulos implicados:** [index.html](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/index.html), [index.css](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/index.css), [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx), [PantallaHubUbicacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaHubUbicacion.tsx), [MapaInteractivoCanvas.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/MapaInteractivoCanvas.tsx), [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx), [BattlefieldBackground.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/combate/BattlefieldBackground.tsx), [PaginaCreditos.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaCreditos.tsx), [PaginaPendiente.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaPendiente.tsx), [servicios-hub.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/servicios-hub.ts) y vistas secundarias de `apps/web/src/paginas/`.

### 41.1 Diagnóstico Inicial y Auditoría Técnica

Al probar la aplicación desplegada en teléfonos reales y auditar el código fuente de `apps/web`, se identificaron tres frentes críticos de corrección manteniendo intacta la estética retro de Aethelgard:

1. **Bloqueo y ocultamiento de botones inferiores en teléfonos reales (`/hub` y `/combate`):**
   - Al inspeccionar el CSS compilado por Tailwind CSS v4 en `apps/web/dist/assets/`, se comprobó que `.h-screen` (`height: 100vh`) y `.h-full` (`height: 100%`) aparecían **después** de `.h-[100dvh]` en la cascada. En consecuencia, las clases `h-screen h-[100dvh]` (`LayoutPrincipal.tsx`, `PantallaHubUbicacion.tsx`) y `h-full h-[100dvh]` (`PantallaCombate.tsx`) resolvían a `100vh` estático, excediendo el alto visible real cuando las barras del navegador y la botonera táctil del sistema móvil estaban presentes y empujando **`EXPLORAR / VIAJAR`** y **`HUIR`** fuera de pantalla.
   - `apps/web/index.html` carecía de `viewport-fit=cover`, impidiendo el cálculo real de `env(safe-area-inset-bottom)` en WebViews y navegadores iOS/Android modernos; además, el dock del Hub (`pb-2.5`) y la consola de combate (`pb-3`) no reservaban zona segura inferior ni compactaban la altura móvil de los botones de combate (`h-14`/`h-12`).
   - `BattlefieldBackground.tsx` anteponía `h-full` al `className="flex-1 ..."` recibido desde `PantallaCombate.tsx`.
2. **Menciones internas del plan de desarrollo e imprecisiones técnicas en textos visibles:**
   - `PaginaCreditos.tsx`, `PaginaPendiente.tsx`, `LayoutPrincipal.tsx` y `servicios-hub.ts` exponían etiquetas internas (`AV5 · FASE 10`, `Fase 3`, `S-1 a S-7`, `INV-01 a INV-05`, `"estándar Impeccable"`, `"ráfagas N+1"`, `"trazabilidad documental"`, `"Compendio Open5e"`), además de señalar `NestJS 11` y `25 especies` cuando `apps/api/package.json` utiliza `@nestjs/core` `10.x` y `@prisma/client` `6.x` y el bestiario cuenta con `30` especies.
3. **Bugs menores de UI, tildes y truncamiento móvil en pantallas y modales:**
   - Tildes faltantes en etiquetas retro de `PantallaCombate.tsx` (`"ACCION..."`) y `PantallaExploracion.tsx` (`CARTOGRAFIA`, `BITACORA DE INCURSION`, `¡BOTIN DESCUBIERTO!`), texto `"Close"` en `dialog.tsx`, código interno de efecto crudo en `PantallaCatalogo.tsx`, token inexistente `text-destructive-foreground` en `PantallaTienda.tsx`, truncamiento prematuro de nombres de movimientos (`Mordi...`) en las tarjetas de `ATACAR` sobre `360px` y uso de `vh` en lugar de `dvh` en formularios/modales.

### 41.2 Mejoras Implementadas

#### A. Identidad Retro Aethelgard, Limpieza de Copy y Homenaje al Ingeniero Claudio

- **Homenaje académico fiel en [PaginaCreditos.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaCreditos.tsx):** Se reescribió el reconocimiento en **ISC-305 Programación Web** al **Ingeniero Claudio** destacando los conceptos reales impartidos (**principios SOLID**, **Clean Code**, arquitectura limpia en capas, separación de responsabilidades, validaciones autoritativas en servidor y diseño responsive), sustituyendo la insignia interna `AV5 · FASE 10` por `VERSIÓN 1.0`, corrigiendo la pila Back-End a `NestJS 10 + Prisma 6` y actualizando el conteo a `30 especies` manteniendo intacta la atribución oficial Open5e/SRD 5.2 (CC BY 4.0) y licencia MIT de `8bitcn/ui`.
- **Erradicación de términos internos en UI:** Se actualizaron [PaginaPendiente.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaPendiente.tsx) (sin mención a `Fase 3`), [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx) (`Aventura RPG Táctica · ISC-305 Programación Web`) y [servicios-hub.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/servicios-hub.ts) (`Bestiario` en lugar de `Compendio Open5e`).
- **Corrección de tildes (`R1`) y pulido de tarjetas:** Corrección de `"ACCIÓN..."` en `PantallaCombate.tsx`, tildes en `PantallaExploracion.tsx`, `"Cerrar"` en `dialog.tsx`, nombres legibles de efectos en `PantallaCatalogo.tsx` mediante `resolverBadgeEfectoMovimiento`, nombres de movimientos en tarjetas de combate en móvil ocultando la etiqueta secundaria (`hidden sm:inline`), y `overflow-x-hidden` en `PantallaEquipo.tsx` y `PantallaAlmacen.tsx`.

#### B. Viewport Dinámico (`h-dvh`), `viewport-fit=cover` y Safe-Area Móvil (`8bitcn/ui`)

- **`viewport-fit=cover` y utilidades reutilizables ([index.html](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/index.html), [index.css](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/index.css)):** Habilitación de `viewport-fit=cover`, fallback `@supports not (height: 100dvh)` para `.h-dvh`/`.min-h-dvh` sin sobreescribir `100dvh` en navegadores modernos, y utilidades `.pb-zona-segura` (`padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem)`) y `.pt-zona-segura` (`padding-top: max(0.625rem, env(safe-area-inset-top, 0px))`).
- **Unificación `h-dvh` y resguardo inferior en Hub y Combate:** Eliminación de clases conflictivas `h-screen h-[100dvh]` y `h-full h-[100dvh]` en [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx), [PantallaHubUbicacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaHubUbicacion.tsx) y [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx); ajuste de `BattlefieldBackground.tsx` para no forzar `h-full` cuando recibe `flex-1`; compactación táctil de la consola de combate en móvil (`h-11 sm:h-16`, `>= 44px` de área pulsable) manteniendo `shrink-0` y `pb-zona-segura` tanto en el menú raíz como en submenús (`ATTACK`, `ITEMS`, `SWAP`, `CAPTURE`), drawer de bitácora, resolución final y pie de `LayoutPrincipal.tsx`; y migración a `dvh` en alturas de formularios y modales (`PantallaIngreso.tsx`, `PantallaRegistro.tsx`, `PantallaCrearPersonaje.tsx`, `PantallaExploracion.tsx`, `PantallaCatalogo.tsx`, `PantallaAlmacen.tsx`, `PantallaInventario.tsx`).

#### C. Audio Web Audio API y Reglas del Servidor

- Sin cambios en la síntesis Web Audio API (`assets.ts`), endpoints REST, DTOs ni reglas autoritativas de `apps/api`.

### 41.3 Verificación de Calidad y Cero Regresiones

- **Inspección Visual y Geométrica en Chrome Headless (`360×640`, `360×540` simulando barra móvil reducida y `390×844`):** Se verificó que en `/hub` (`EXPLORAR`) y `/combate` (`HUIR` y submenú `ATACAR`) todos los botones inferiores permanecen 100 % visibles dentro del viewport (`visibleEnViewport: true`, `scrollH === innerH`) con `0 px` de desbordamiento horizontal (`scrollW === innerW`) en todas las rutas de `apps/web` (`/hub`, `/combate`, `/creditos`, `/catalogo`, `/exploracion`, `/equipo`, `/almacen`, `/inventario`, `/tienda`, `/curacion`, `/historial`, `/ingreso`, `/registro`).
- **Verificación de Tipos (`pnpm --filter web exec tsc -b --noEmit`):** `0` errores.
- **Linter Global Web (`pnpm --filter web lint`):** `0` errores (`34` advertencias preexistentes en `95` archivos en `145ms`, `0` advertencias nuevas).
- **Pruebas Unitarias Web (`pnpm --filter web test`):** **106 de 106 pruebas aprobadas** (`0` fallos, `0` omitidas en `1697.1966ms`), ampliando [verificacion-combate.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-combate.spec.ts), [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts) y [verificacion-historial-catalogo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-historial-catalogo.spec.ts) para resguardar `viewport-fit=cover`, `h-dvh`, `pb-zona-segura`, limpieza de copy interno y el homenaje actualizado al Ingeniero Claudio.
- **Compilación de Producción Web (`pnpm --filter web build`):** Compilación exitosa (`tsc -b && vite build`, **2166 módulos** transformados en **`2.46s`**).

### 41.4 Refinamiento Posterior: Emblema Retro de Aethelgard, Favicon Propio y Holgura de Controles en `/hub` (`mejora/logo-favicon-controles-mapa`)

- **Diagnóstico inicial:** en móvil (`< sm`), los 4 botones flotantes del mapa (`+`, `-`, centrar y silencio) en `bottom-36` quedaban a pocos píxeles del borde superior del dock inferior de equipo; además, la cabecera de [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx) mostraba únicamente texto y [favicon.svg](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/public/favicon.svg) aún conservaba el icono genérico de Vite.
- **Mejoras implementadas:**
  - **Despeje móvil en [MapaInteractivoCanvas.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/MapaInteractivoCanvas.tsx):** ajuste de `bottom-36` a `bottom-40` en móvil (`20 px` de holgura confirmada sobre el dock en `360×640`, `360×540` y `390×844`, y `6 px` libres bajo la botonera derecha en `360×540`), actualizando la aserción correspondiente en [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts).
  - **Identidad visual 16-bit (logo del Layout y favicon):** diseño y generación del escudo dorado con silueta astral de dragón y cristal cian en [logo-aethelgard.webp](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/public/assets/logo-aethelgard.webp) (`128×128` con transparencia alfa), integrado en [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx) a tamaño equivalente (`size-6 sm:size-8` manteniendo `44 px` de alto de barra en móvil y `60 px` en escritorio) junto con [favicon.png](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/public/favicon.png), [favicon.svg](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/public/favicon.svg) (reemplazando al de Vite) y el enlace actualizado en [index.html](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/index.html).
- **Verificación visual y técnica:** validado en Chrome headless (`360×640`, `360×540`, `390×844`, `1280×720`) y batería completa (`tsc`, `lint`, `test` y `build`) tras el merge `--no-ff` en `desarrollo`.

### 41.5 Calibración Pixel-Perfect de Islas Bloqueadas y Puentes Despejados (`correccion/calibracion-islas-bloqueadas`)

- **Diagnóstico inicial:** en [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts), `dibujarPuentesYRutasVivas` trazaba un trazo oscuro (`rgba(4, 9, 22, 0.52)`, `lineWidth = 14`) sobre todos los puentes bloqueados, mientras `dibujarCapaVivaMapa` cubría las islas bloqueadas con un óvalo genérico (`generarGeometriaDiorama`) que desbordaba hacia el mar o dejaba cumbres y estribos desalineados.
- **Mejoras implementadas:**
  - **Eliminación total del velo sobre puentes:** se suprimió el trazado oscuro en `dibujarPuentesYRutasVivas` cuando `!rutaDesbloqueada` para mantener los 10 puentes de piedra nítidos.
  - **Velo crepuscular calibrado píxel a píxel únicamente en islas bloqueadas:** en [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) se implementó `dibujarVeloIslasBloqueadas` usando la máscara real de terreno (`mascara.tierra`, las envolventes `SILUETA_ENVOLVENTE_*` y `CONFIGURACION_ISLAS_MAPA`), filtrando estrictamente los tramos estrechos de puente sobre agua abierta (`esPuntoSobrePuenteMapa` + `mascara.distanciaMar`) con transición suave en estribos para evitar calvas en acantilados nevados, y componiendo brumas crepusculares animadas vía `source-atop` reutilizando cachés por `MascaraOceano` (`WeakMap`) sin asignaciones por cuadro.
- **Verificación y pruebas:** validado visualmente en Chrome headless (`1280×720` con islas parciales y todas las islas exteriores bloqueadas) y protegido con aserciones en [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts) (`esPuntoSobrePuenteMapa` en los 10 puentes y `resolverIndiceIslaEnMapa` en las 9 islas) junto con `tsc`, `lint`, `test` y `build` en `desarrollo`.

### 41.6 Calibración de Trayectos de Zona Adyacente en Puentes (`correccion/calibracion-rutas-adyacentes-puentes`)

- **Diagnóstico:** al inspeccionar las 10 curvas cuadráticas de `TRAYECTOS_PUENTES_AETHELGARD` en [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) sobre la lámina real `1616×897`, la ruta entre `Cueva Umbría` (`ZON-05`) y `Pico de la Cumbre` (`ZON-06`) (`inicio: (1328, 246)`, `control: (1270, 192)`, `fin: (1214, 178)`) aparecía desplazada respecto al puente noreste real, además de ligeros desvíos laterales en `ZON-04 <-> LOC-03`, `LOC-02 <-> ZON-03`, `ZON-02 <-> ZON-03` y `ZON-01 <-> LOC-02`.
- **Calibración aplicada:** se recalibró `ZON-05 <-> ZON-06` al eje exacto de la calzada (`inicio: { x: 1378, y: 274 }`, `control: { x: 1320, y: 206 }`, `fin: { x: 1238, y: 186 }`) y se centraron finamente las curvas de `ZON-04 <-> LOC-03`, `LOC-03 <-> ZON-06`, `LOC-02 <-> ZON-03`, `ZON-02 <-> ZON-03` y `ZON-01 <-> LOC-02` dentro de sus parapetos en [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts).
- **Verificación:** inspección visual en mapa completo y zoom dedicado con rejilla (`puentes-diagnostico-zon05-zon06`) más batería completa (`tsc`, `lint`, `test` y `build`) tras integrar en `desarrollo`.

### 41.7 Auditoría Integral de Errores y Advertencias en Consola por Pantalla (`correccion/errores-consola-pantallas`)

- **Diagnóstico inicial y auditoría pantalla por pantalla:**
  1. **Cascada `POST /api/usuarios/logout 404` al fallar login o cerrar sesión:** [apiHttp.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/api/apiHttp.ts) emitía el evento global `aethelgard:no-autorizado` ante cualquier HTTP `401` (incluyendo credenciales inválidas en `/usuarios/login` o peticiones sin token previo), disparando `cerrarSesion()` → `POST /api/usuarios/logout`, una ruta inexistente en el Back-End JWT *stateless*.
  2. **`GET /api/personajes/activo 404` al registrarse, ingresar sin personaje o recargar `/crear-personaje`:** [ContextoAutenticacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/contextos/ContextoAutenticacion.tsx) lanzaba `obtenerPersonajeActivo()` en el `useEffect` de `[token]` inmediatamente después de `registrarUsuario()` / `iniciarSesion()` (duplicando además la llamada cuando `tienePersonaje === true`) y al recargar cuentas sin explorador.
  3. **`GET /api/personajes/activo 401/404` en ruta pública `/kit-ui`:** [PaginaKitUi.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaKitUi.tsx) invocaba `api.obtenerPersonajeActivo()` incondicionalmente al montar incluso sin sesión o sin personaje.
  4. **`GET /api/encuentros/activo 404` al entrar en `/exploracion` o `/combate` sin batalla activa:** [PantallaExploracion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaExploracion.tsx) y [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx) consultaban `/encuentros/activo` sin conocer previamente si existía un encuentro `EN_CURSO`.
  5. **Advertencias de autoplay y fuga de contextos Web Audio API:** [assets.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/assets.ts) instanciaba/reanudaba `AudioContext` desde `useEffect` antes de un gesto del usuario en `/hub` y `/combate`, y creaba un nuevo `AudioContext` por cada efecto sonoro.
  6. **Atributos DOM no estándar, anidamiento HTML y transiciones de cierre Radix:** los wrappers `8bitcn/ui` (`card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`) propagaban la prop `font` al DOM al no desestructurarla antes de `{...props}`; [PantallaExploracion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaExploracion.tsx) anidaba `<Button>` dentro de `<Link>`; y cuatro modales (`PantallaHubUbicacion`, `PantallaCatalogo`, `PantallaInventario`, `PantallaTienda`) desmontaban `DialogTitle`/`DialogDescription` durante la animación de cierre.
- **Mejoras implementadas (Identidad Retro, Componentes `8bitcn/ui`, Web Audio y Reglas de Servidor):**
  - **Reglas de Servidor (retrocompatibles):** [autenticacion.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/autenticacion/autenticacion.service.ts) (`GET /api/usuarios/perfil`) retorna `tienePersonaje` y resumen `personaje | null` siempre con `200 OK`; [mundo.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/mundo/mundo.service.ts) (`GET /api/mundo/ubicacion-actual`) expone `tieneEncuentroActivo: boolean`, preservando intactos los contratos `404` directos de `/personajes/activo` y `/encuentros/activo`.
  - **Capa HTTP y Contexto de Sesión:** [apiHttp.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/api/apiHttp.ts) incorpora `esRutaAutenticacionPublica` y `debeNotificarSesionExpirada` para disparar `aethelgard:no-autorizado` solo ante `401` real en rutas protegidas con token activo, y resuelve `cerrarSesion()` localmente en cliente; [ContextoAutenticacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/contextos/ContextoAutenticacion.tsx) hidrata vía `api.obtenerPerfil()` y evita reconsultas redundantes tras ingreso/registro con `omitirBootstrapTokenRef`.
  - **Pantallas y Componentes `8bitcn/ui`:** [PaginaKitUi.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaKitUi.tsx) reutiliza `useAutenticacion()`; [PantallaExploracion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaExploracion.tsx) y [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx) consultan `/encuentros/activo` solo cuando `tieneEncuentroActivo` es verdadero (o navegación confirmada) y corrigen `<Link><Button>` a `<Button asChild><Link>`; se limpió la desestructuración de `font`/`className` en `8bitcn/ui` y se añadieron cabeceras `sr-only` de respaldo en el cierre de modales Radix.
  - **Audio Web Audio API:** [assets.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/assets.ts) difiere la creación y reanudación del `AudioContext` hasta detectar gesto de usuario (`puedeIniciarAudioWeb`) y reutiliza un único `AudioContext` compartido para SFX y música ambiente.
- **Verificación de calidad y cero regresiones:**
  - **Pruebas unitarias Web (`pnpm --filter web test`):** **114 de 114 pruebas aprobadas** (`0` fallos), incorporando [verificacion-consola-limpia.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-consola-limpia.spec.ts).
  - **Pruebas unitarias API (`pnpm --filter api test`):** **137 de 137 pruebas aprobadas** en `43` suites (`0` fallos), incorporando [autenticacion-perfil.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/test/autenticacion-perfil.spec.ts) y validando `tieneEncuentroActivo` en [mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/test/mundo.spec.ts).
  - **Linter y Compilación (`pnpm --filter web lint`, `pnpm --filter web build`, `pnpm --filter api build`):** `0` errores de linter y compilación limpia en ambos paquetes.

### 41.8 Protección contra Bucle de Equipo Debilitado (0 HP) y Bloqueo de Navegación en Combate Activo (`correccion/combate-equipo-debilitado-y-bloqueo`)

- **Diagnóstico inicial y auditoría del flujo de combate:**
  1. **Bucle infinito (*soft-lock*) al explorar con todo el equipo en `0 HP`:** Tras cerrar un combate por `DERROTA` (todas las criaturas del equipo con `hpActual === 0`), si el explorador regresaba a `/exploracion` y pulsaba *Explorar senda*, `ExploracionService.explorar()` no validaba la existencia de al menos una criatura viva (`hpActual > 0`). Si el sorteo detonaba `ENCUENTRO`, creaba un encuentro `EN_CURSO` imposible de resolver: atacar y huir devolvían `400 EQUIPO_DEBILITADO` mientras viajar devolvía `409 ENCUENTRO_PREVIO_ACTIVO`, atrapando indefinidamente a la cuenta.
  2. **Rutas jugables abiertas durante combate activo y evasión de estado:** Al existir un combate `EN_CURSO`, el usuario podía cambiar manualmente la URL o volver atrás hacia `/hub`, `/tienda`, `/curacion`, `/almacen`, `/equipo` o `/exploracion`, rompiendo la integridad táctica de la arena. Asimismo, los endpoints de curación, tienda y transferencia de almacén no validaban `ENCUENTRO_PREVIO_ACTIVO`.
  3. **Salida confusa tras derrota en zona silvestre y falso cierre en captura/huida multi-criatura:** En [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx), la derrota dirigía directamente a `/curacion` (inactivo en zonas salvajes) en lugar de orientar hacia el mapa (`/hub`) o la bolsa (`/inventario`), y los manejadores de captura/huida fallida evaluaban `hpRestanteAliado <= 0` como derrota total incluso cuando quedaban criaturas vivas de relevo (`estado === "EN_CURSO"`).
- **Mejoras implementadas (Identidad Retro, Componentes `8bitcn/ui`, Web Audio y Reglas de Servidor):**
  - **Reglas Autoritativas de Servidor y Autorreparación ([encuentro-activo.util.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/comun/util/encuentro-activo.util.ts)):**
    - [exploracion.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/exploracion/exploracion.service.ts) valida ahora `criatura.count({ enEquipo: true, hpActual: { gt: 0 } }) > 0`, rechazando con `400 EQUIPO_DEBILITADO` si todo el equipo está caído.
    - Autorreparación automática en `obtenerOReconciliarEncuentroActivo` y [encuentros.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/encuentros/encuentros.service.ts): cualquier encuentro huérfano `EN_CURSO` cuyo equipo entero tenga `0 HP` se cierra automáticamente a `DERROTA` (`fechaResolucion = now()`), desbloqueando cuentas previamente afectadas sin intervención manual en BD.
    - [mundo.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/mundo/mundo.service.ts) expone `equipoDebilitado: boolean` y [autenticacion.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/autenticacion/autenticacion.service.ts) incluye `tieneEncuentroActivo: boolean` en `GET /api/usuarios/perfil`.
    - [curacion.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/curacion/curacion.service.ts), [tienda.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/tienda/tienda.service.ts) y `EquipoService.moverCriatura` ([equipo.service.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/src/modulos/equipo/equipo.service.ts)) rechazan con `409 ENCUENTRO_PREVIO_ACTIVO` si existe un combate activo, manteniendo libres `PATCH /api/equipo/orden` y `POST /api/inventario/usar` usados dentro de la arena.
  - **Bloqueo Centralizado de Navegación y Excepción Informativa (`SOLID / SRP`):**
    - [ContextoAutenticacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/contextos/ContextoAutenticacion.tsx) gestiona `combateActivo` hidratado desde `/usuarios/perfil` y sincronizado por [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx), [PantallaExploracion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaExploracion.tsx) y [PantallaHubUbicacion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaHubUbicacion.tsx).
    - [RutaProtegida.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/RutaProtegida.tsx) y [App.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/App.tsx) bloquean centralizadamente las rutas jugables (`/hub`, `/exploracion`, `/equipo`, `/almacen`, `/inventario`, `/tienda`, `/curacion`, `/catalogo`, `/historial`) redirigiendo a `/combate` con un toast deduplicado; las vistas informativas de solo lectura (`/creditos` y `/kit-ui`) siguen accesibles desde el menú de pausa (útil en la defensa académica) acompañadas de una franja retro responsive (`flex-col sm:flex-row`, sin truncamiento en móvil) `COMBATE EN PAUSA · ARENA ACTIVA` + `VOLVER AL COMBATE` en [LayoutPrincipal.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/LayoutPrincipal.tsx) y botones adaptativos en [PaginaCreditos.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PaginaCreditos.tsx).
  - **Identidad Retro, Componentes `8bitcn/ui` y Audio Web Audio:**
    - En [PantallaExploracion.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaExploracion.tsx), cuando `equipoDebilitado` es verdadero se muestra un aviso brutalista de alerta (`0 HP`) y botones de recuperación directa hacia `/hub` (viajar a santuario) y `/inventario` (usar poción), sin `truncate`, sin emojis unicode (`R1`) y con feedback acústico coherente (`reproducirSonido`).
    - En [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx), se eliminó el tope `max-w-5xl` y bordes laterales en escritorio para que la arena, la bitácora y la consola de comandos abarquen el 100 % del viewport sin franjas vacías; exclusivamente en móvil vertical (`< 640px`, validado en `360×640` y `390×844`), se rediseñaron las placas HUD con jerarquía apilada (cifras arriba y barras de ancho completo abajo con margen de marco pixelado `px-1`), ancho fluido `w-[min(194px,54vw)]`, medidor de Resonancia de 10 bloques visibles (`h-3`), chip táctico de cruce elemental (`x1.5`/`x0.75`), tipografía `.retro` (`Press Start 2P`) integral a escala compacta sin cortes en bitácora y guía táctica, y botonera vertical *thumb-zone* con contadores reales retro de pociones, relevos vivos y talismanes (manteniendo intacta la presentación de escritorio); además, el diálogo y la barra de derrota ofrecen `Ir al Mapa (Viajar a Santuario)` y `Abrir Bolsa (Usar Poción)`, y se corrigió el relevo automático ante contraataques en captura/huida fallida con varias criaturas.
    - En [battlegrounds.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/battlegrounds.ts), [BattlefieldBackground.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/combate/BattlefieldBackground.tsx) y [PantallaCombate.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/paginas/PantallaCombate.tsx), se midieron sobre rejilla del 5 % las 6 ilustraciones `800×450` de batalla (`praderas-del-amanecer`, `riberas-del-lago-espejo`, `bosque-susurrante`, `paso-de-los-riscos`, `cueva-umbria` y `pico-de-la-cumbre`) y se implementó `proyectarPlataformaEnArena` con `ResizeObserver` + `object-position` focal por zona, proyectando exactamente los pies de aliado y rival (más proyectiles e impactos) sobre sus plataformas reales al compensar el recorte de `object-cover` y la altura de la cabecera de turno tanto en escritorio (`1280×720`) como en móvil vertical (`360×640`, `390×844`).
- **Verificación de calidad y cero regresiones:**
  - **Pruebas unitarias Web (`pnpm --filter web test`):** **118 de 118 pruebas aprobadas** (`0` fallos), incorporando [verificacion-combate-bloqueo-y-derrota.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-combate-bloqueo-y-derrota.spec.ts) y pruebas de calibración y proyección de las 6 arenas en [verificacion-combate.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-combate.spec.ts).
  - **Pruebas unitarias API (`pnpm --filter api test`):** **143 de 143 pruebas aprobadas** en `44` suites (`0` fallos), incorporando [exploracion-y-bloqueo-combate.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/api/test/exploracion-y-bloqueo-combate.spec.ts).
  - **Linter y Compilación (`pnpm --filter web lint`, `pnpm --filter web build`, `nest build`):** `0` errores de linter y compilación limpia en Front-End y Back-End.

### 41.9 Rediseño Cinematográfico 16-bit de la Transición de Viaje entre Zonas (`TransicionViaje2D.tsx`)

- **Diagnóstico inicial y auditoría Impeccable:**
  1. **Desconexión estética respecto al arte maestro del juego:** La versión anterior de [TransicionViaje2D.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/TransicionViaje2D.tsx) presentaba un diálogo modal genérico con un lienzo rígido `640×260` compuesto por rectángulos planos (franja fija de lava/carretera, faroles rectos y luna circular plana) superpuesto junto a una miniatura estática repetitiva de la zona destino, independientemente de los biomas reales de origen y destino.
  2. **Redundancia informativa y carga de re-renderizados:** Repetía el nombre del destino hasta tres veces (tarjeta, cabecera y pie con el slug crudo entre paréntesis), disparaba `setProgreso()` 60 veces por segundo causando re-renderizados innecesarios en React, carecía de ruta dedicada para `prefers-reduced-motion` y aparecía/desaparecía sin fundido hacia Abismo Astral.
- **Mejoras implementadas (Identidad Retro, Componentes `8bitcn/ui`, Audio Web Audio y Reglas de Servidor):**
  - **Motor cinemático y perfiles de los 9 biomas ([transicion-viaje.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/transicion-viaje.ts)):** Módulo puro sin dependencias DOM con perfiles visuales diferenciados para los 9 biomas (`puerto`, `pradera`, `lago`, `puesto`, `bosque`, `riscos`, `bastion`, `volcan`, `glaciar`), cálculo de rumbo cardinal real sobre `CONFIGURACION_ISLAS_MAPA` (`calcularRumboBrujula`), proyección `object-cover` con paneo panorámico sin deformación (`calcularProyeccionCover`) y cinemática determinista (`evaluarEstadoViaje`) con zancadas elásticas (*squash & stretch*), cruce del Velo Astral y fundidos oscuros al Abismo Astral (`#05070b`, cero destellos blancos).
  - **Escenario cinematográfico a pantalla completa ([TransicionViaje2D.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/TransicionViaje2D.tsx) e [index.css](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/index.css)):** Lienzo HiDPI (`ResizeObserver` + DPR ≤ 2) a 60 FPS que fusiona los paisajes WebP reales de origen y destino (`/assets/zonas/*.webp`) mediante un **Velo Astral** luminoso que barre la pantalla al paso de la criatura líder; calzada medieval de arcos semicirculares de piedra pixel-art con dovelas, sillares, monolitos rúnicos que se encienden al paso y profundidad viva bajo el puente adaptada al bioma (océano/lago con reflejos, magma, neblina de bosque o agujas glaciales); ecos espectrales 16-bit, polvo de pisada reactivo al terreno, clima dual en primer/segundo plano y arco gótico rúnico de llegada con cristal flotante.
  - **Interfaz retro fluida, accesibilidad y Audio Web Audio ([assets.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/assets.ts)):** Bandas cinematográficas *letterbox* con textura CRT sutil (`.retro-scanlines-viaje`), indicador cardinal orientado por ángulo real (`ArrowUp` de Lucide, cero emojis bajo `R1`), ficha compacta del líder sin recortes en móvil vertical (`390×844`), estandarte JRPG flotante de la zona destino y barra segmentada actualizada directamente en compositor GPU (`scaleX` / `translate3d`, reduciendo los renders de React a los 3 cambios de fase). Se añadió el efecto sintetizado Web Audio `"velo"` al atravesar la frontera de biomas (respetando silencio persistente y gesto de usuario), una ruta serena de `750 ms` para `prefers-reduced-motion: reduce`, y se mantuvo intacto el contrato autoritativo de `POST /api/mundo/viajar` y `finalizarViajeSiListo` en `PantallaHubUbicacion.tsx`.
- **Verificación de calidad y cero regresiones:**
  - **Inspección visual real en Chrome headless (`0` errores de consola):** Validado en móvil vertical (`390×844` normal y `prefers-reduced-motion: reduce`) y escritorio (`1280×720`) en los cruces *Riberas del Lago Espejo → Bosque Susurrante* y *Cueva Umbría → Pico de la Cumbre*.
  - **Pruebas unitarias Web (`pnpm --filter web test`):** **119 de 119 pruebas aprobadas** (`0` fallos), ampliando [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts) con validación de los 9 biomas, rumbos cardinales, cinemática del Velo, proyección `object-cover`, ausencia de emojis (`R1`) y `prefers-reduced-motion`.
  - **Typecheck, Linter y Compilación (`tsc`, `oxlint`, `vite build`):** `0` errores de TypeScript, `0` errores de linter y compilación de producción limpia.

### 41.10 Alertas Sonner con Estética Retro 8-bit y Optimización 60 FPS del Hub (`sonner.tsx`, `diorama-cueva-umbria.ts`, `diorama-riscos.ts`, `mapa-dioramas.ts`)

- **Diagnóstico inicial:**
  1. **Alertas Sonner genéricas:** [sonner.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/ui/sonner.tsx) mantenía la apariencia predeterminada (tipografía sans-serif, sombra difusa y bordes estándar), rompiendo la coherencia retro 8-bit del resto del HUD.
  2. **Caídas de FPS en el Hub al acumular dioramas volcánicos y arcanos:** La auditoría del bucle 60 FPS en [diorama-cueva-umbria.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-cueva-umbria.ts), [diorama-riscos.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-riscos.ts) y [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) identificó ~190–210 llamadas individuales `ctx.stroke()` por cuadro en los flujos de lava y rayos, múltiples `ctx.clip()` de polígonos de 33 vértices, ausencia de *frustum culling* en `dibujarCapaVivaMapa`/`dibujarFondoCieloMapa`, ~25–30 `createRadialGradient()` nuevos por cuadro en `dibujarHaloFuego` y recomposición offscreen de la bruma de islas bloqueadas en cada cuadro.
- **Mejoras implementadas (Identidad Retro, Componentes `8bitcn/ui`, Web Audio y Reglas de Servidor):**
  - **Notificaciones Sonner 8-bit ([sonner.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/ui/sonner.tsx), [index.css](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/index.css)):** Títulos en `Press Start 2P` (`.retro`), bordes ortogonales (`0px`) con doble marco (`border: 3px solid #05070b` + `outline` interno por severidad), sombra sólida `4px 4px 0 #05070b`, icono Lucide enmarcado y centrado (`28×28px`), tema oscuro forzado y cero emojis (`R1`).
  - **Optimización 60 FPS sin recortar fidelidad visual:**
    - **Agrupación de trazos por banda térmica:** En [diorama-cueva-umbria.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-cueva-umbria.ts) y [diorama-riscos.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/diorama-riscos.ts) los segmentos de cascadas, ríos de magma, fisuras tectónicas y bifurcaciones de rayos se agrupan en `2–3` llamadas `ctx.stroke()` por banda cromática (reduciendo >85 % la teselación de GPU), sustituyendo los `ctx.clip()` redundantes de 33 vértices por límites calibrados y confinamiento analítico.
    - ***Frustum culling* por `vistaMundo` y caché de halos:** [mapa-dioramas.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/lib/mapa-dioramas.ts) incorpora `esIslaVisibleEnVista` conectado desde [MapaInteractivoCanvas.tsx](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/src/components/mundo/MapaInteractivoCanvas.tsx), cachea los halos radiales en `spritesHaloMapaCache`, saca `ctx.save()/restore()` fuera del bucle de chispas y regula la recomposición offscreen de la bruma de islas bloqueadas cada `80 ms` (`~12 Hz`).
    - Sin cambios en contratos de servidor ni reglas de negocio autoritativas.
- **Verificación de calidad y cero regresiones:**
  - **Pruebas unitarias Web (`pnpm --filter web test`):** **120 de 120 pruebas aprobadas** (`0` fallos), incorporando validación de *frustum culling*, caché de halos, regulación de bruma y contrato retro de Sonner en [verificacion-hub-mundo.spec.ts](file:///c:/Users/USER/Desktop/projects/Proyecto%20Integrador%20ISC305%20Aventura%20Web%20Criaturas/apps/web/test/verificacion-hub-mundo.spec.ts).
  - **Typecheck, Linter y Compilación (`tsc`, `oxlint`, `vite build`):** `0` errores de TypeScript, `0` errores de linter y compilación limpia en producción.
