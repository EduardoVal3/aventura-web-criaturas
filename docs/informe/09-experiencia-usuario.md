# 09. Experiencia de Usuario y Enriquecimiento Visual Retro (Fase 10)

Este documento consolida las auditorías heurísticas con la skill `impeccable`, la evolución interactiva de cada pantalla y el cumplimiento de las directrices estéticas establecidas en `docs/DESIGN.md` para *Aethelgard: Sendas y Criaturas*.

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
  - `Lobo Estepario` (Bestia · *Cazador Ágil y Coordinado*).
  - `Víbora Rocosa` (Bestia · *Sigilo y Ponzoña*).
  - `Cangrejo Abismal` (Monstruosidad · *Defensa y Coraza Marina*).
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
1. **Falta de Ambientación Visual Retro-Brutalista y Estilo de Cuadro RPG:** La versión preliminar utilizaba tarjetas con bordes delgados de color tenue (`border-2 border-[#43526d]`), careciendo del impacto visual y peso físico característico de la estética *retro-brutalist 8-bit* de cartucho de consola y `8bitcn/ui` (`border-4 border-black shadow-[6px_6px_0_0_#000]`).
2. **Truncamientos Rígidos y Amputación de Textos en Móviles (360px–420px):** Uso de clases `truncate` y `line-clamp-2` rígidas que cortaban nombres compuestos de criaturas de varias palabras (ej. *"QUIMERA TRICÉFALA"*, *"REMORHAZ DEL GLACIAR ETERNO"*, *"CANGREJO ABISMAL"*), nombres de ítems de botín (`itemCodigo`) y títulos de zona en viewports reducidos, arruinando la lectura con puntos suspensivos innecesarios.
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
  - *Rival Hostil:* Situado en el cuadrante superior derecho sobre una plataforma de combate escalonada 16-bit (`bg-[#121927] border-2 border-black shadow-[2px_2px_0_0_#000]`), exhibiendo su sprite pixelado con `.pixelated`, placa HUD con borde pixelado, barra de salud segmentada y badge de nivel.
  - *Criatura Aliada:* Posicionada en el primer plano inferior izquierdo encarando diagonalmente al oponente, con tarjeta de estado persistente (`border-4 border-black shadow-[4px_4px_0_0_#000]`), medidor numérico de vitalidad (HP actual / HP total), barra de resonancia táctica de 10 bloques y barra de experiencia porcentual.
- **Atmósfera Inmersiva de Arena:** Fondo de fantasía oscura (`#090d16`) con cuadrícula retro CRT y gradiente de penumbra que enmarca los combatientes con máximo contraste.
- **Erradicación de Curvas y Desenfoques:** Supresión total de clases `rounded`, `rounded-full` y `blur` en la arena, pedestales y contenedores de incertidumbre de captura, reemplazándolos por marcos ortogonales geométricos.
- **Micro-animaciones Físicas de Combate:**
  - `anim-sacudida` y `anim-parpadeo-dano` ante impactos físicos.
  - Indicadores numéricos de daño flotante con código de color dinámico (carmesí para daño recibido, esmeralda para curación).
  - Secuencia de incertidumbre en captura (`anim-captura-incertidumbre`) con balanceo de talismán en marco retro antes de revelar el veredicto del servidor.

#### B. Panel Táctil Extendido de 5 Comandos RPG y Prevención de Doble Acción (Hardening S-5)
- **Comandos Tácticos Accesibles (100% SVG Lucide, Cero Emojis Unicode R1):**
  1. *Atacar (`Swords`):* Selector interactivo de movimientos desplegando los 4 slots tácticos (M1 a M4) con chips de efectividad (`¡EFICAZ!`, `RESISTIDO`), badges de estados aplicados y bloqueo de M4 cuando la resonancia es menor al 100%.
  2. *Usar Objeto (`HeartPulse`):* Modal retro con filtrado exclusivo de ítems curativos del inventario, restaurando vitalidad con animación esmeralda y feedback flotante inmediato.
  3. *Cambiar Criatura (`ArrowLeftRight`):* Selector táctico de miembros del equipo con HP disponible y XP individual para relevar el liderazgo de combate mediante `PATCH /equipo/orden`.
  4. *Capturar (`Sparkles`):* Selector interactivo de talismanes disponibles con animación de incertidumbre y balanceo antes de revelar éxito o contraataque.
  5. *Huir (`LogOut`):* Diálogo modal retro de confirmación con probabilidad probabilística acotada. Ante fallo en huir, el contraataque rival se anima y refleja inmediatamente en la barra de salud sin requerir recargar la página.
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
4. **Trunking Prematuro y Falta de Ergonomía Móvil (360px–420px):** En pantallas pequeñas, títulos largos en `Press Start 2P` (ej. *"Mantarraya Espectral"*) se truncaban abruptamente con elipsis (`Mantarraya Esp...`), los sprites de 64px consumían excesivo ancho útil, la tarjeta del líder dejaba un hueco asimétrico en la botonera y las ranuras vacías forzaban alturas sobredimensionadas (`min-h-[260px]`).
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
- **Estado Debilitado:** Badge destructivo retro `DEBILITADA` (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-red-600 text-white font-bold text-[8px] sm:text-[9px] retro`) e indicador contextual enmarcado: *"El combate la omitirá hasta curarla."*
- **Barras Retro Empotradas de Vitalidad y EXP:**
  - `HealthBar` integrada en un canal oscuro protegido `border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]`, con semáforo cromático reactivo (>50% esmeralda, 20%-50% ámbar, <=20% carmesí crítico) y animación de pulso crítico.
  - `XpBar` empotrada en canal oscuro `border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]`, con porcentaje de avance en `text-purple-300 font-bold font-mono` asegurando contraste superior a 4.5:1.
- **Matriz de Atributos Base Táctica:** Caja retro `border-2 border-black bg-black/40 shadow-[2px_2px_0_0_#000] p-1 sm:p-1.5` con tres celdas independientes para ATQ (`Swords` en rojo), DEF (`Shield` en azul) y VEL (`Zap` en ámbar), con valores numéricos monoespaciados en negrita y máximo contraste.
- **Ranuras Libres como Pedestales Tácticos:** Ranuras desocupadas modeladas como pedestales brutales con borde discontinuo `border-2 border-dashed border-black/80 bg-black/20 shadow-[2px_2px_0_0_#000] p-4 sm:p-6 min-h-[140px] sm:min-h-[220px]`, texto retro `Ranura libre` en `Press Start 2P` y conteo `{numeroRanura} de {limiteEquipo}`.
- **Cabecera y Navegación Rápida:** Título principal con tipografía pixelada `Press Start 2P` (`.retro`), badge retro de capacidad `{equipo.length} / {limiteEquipo}` con `border-2 border-black shadow-[2px_2px_0_0_#000]`, y botones de acceso directo `/almacen` e `/hub` con marco brutalista táctil `border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none`.
- **Aviso Territorial:** Banner de advertencia territorial con `MapPinOff` con borde negro ortogonal `border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/10 text-amber-400`.

#### B. Componentes Táctiles 8bitcn/ui, Hardening y Ergonomía Móvil (Pantallas Pequeñas 320px–420px)
- **Tipografía Bimodal Estricta sin Invasión de `.retro`:** Se aplicó `font="normal"` a `Card`, `CardHeader`, `CardContent` y `CardFooter`, aislando `Press Start 2P` exclusivamente a encabezados y badges tácticos, mientras las lecturas de salud, progreso y estadísticas permanecen nítidas en fuentes sans y monoespaciadas.
- **Erradicación de Truncamiento en Nombres de Criatura:** Se calibró el título a `text-[10px] sm:text-xs` con `break-words line-clamp-2 leading-snug` y se adaptó el sprite a `h-12 w-12 sm:h-16 sm:w-16`, permitiendo que nombres compuestos (como *"Mantarraya Espectral"*) se lean completos sin elipsis (`...`) en pantallas de 360px.
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
- **Cálculo Unilateral de Precios y Compra Atómica (`S-4`, `S-6`):** `TiendaService.comprar` calcula unilateralmente costoTotal = precioCompra * cantidad desde PostgreSQL. Rechaza campos inyectados (`whitelist: true`, `forbidNonWhitelisted: true`) y cantidades fuera del rango 1..99 (`@Max(99)` en `ComprarDto`).
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

Con la culminación de las Subfases 10k y 10l, se da por **completada y auditada en su totalidad la Fase 10** del proyecto *Aethelgard: Sendas y Criaturas*, consolidando el hito **AV5 Definitivo (Entrega Final de UX Retro, Bestiario Canónico, Motor Táctico y Combate Completo Full-Stack)**.

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
| **10k** | Motor Elemental y Estados (`motor-combate.ts`, `combate.service.ts`) | Matriz inmutable 6×6 de afinidades, daño elemental INV-04, 6 estados alterados, DoT no letal D-4, inmunidad de 1 turno D-6, acumulador de resonancia, sinergia de captura x1.25 y bloqueo pesimista contra concurrencia. | 36 tests api | ✅ Completada |
| **10l** | Experiencia Táctica y Catálogo (`PantallaCombate.tsx`, `PantallaCatalogo.tsx`, `PantallaExploracion.tsx`) | Panel interactivo de 4 comandos, chips de efectividad, barra de 10 bloques de Resonancia, botón «Desatar Insignia», cerrojo useRef, turnoEsperado y manejo 409, Web Audio sintetizado (eficaz, resistido, dot, furia), agrupación por 6 hábitats, halos legendarios y avistamiento mítico en exploración. | 3 tests web | ✅ Completada |

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
7. **Ausencia de Clímax Cinemático en Encuentros Legendarios:** En `PantallaExploracion.tsx`, toparse con criaturas legendarias como *Behir* o *Remorhaz* utilizaba el mismo modal y sonido de alerta que una bestia común de bajo nivel, privando al juego de la emoción retro del avistamiento de un titán mítico.

---

### 14.2 Mejoras Implementadas

#### A. Identidad Retro Aethelgard y Ergonomía Visual (`DESIGN.md`)
- **Selector de 4 Movimientos con Chips Dinámicos de Efectividad:** Rediseño del panel de combate con botones retro biselados para cada slot (`M1`, `M2`, `M3`, `M4`). Integración de chips de efectividad táctica en tiempo real: `[¡EFICAZ!]` en verde esmeralda brillante (`text-emerald-400 bg-emerald-950/40 border-emerald-500/70`) ante ventaja elemental ($1.5\times$), y `[RESISTIDO]` en rojo bermellón (`text-red-400 bg-red-950/40 border-red-500/70`) ante desventaja elemental ($0.75\times$).
- **Medidor Retro Segmentado de 10 Bloques de Resonancia:** Creación del componente `BarraResonancia` en `PanelTactico.tsx`, representando la resonancia mediante 10 bloques discretos retro (`floor(resonancia / 10)`). Al llegar al 100% de resonancia (10 bloques), la barra adquiere la animación pulsante ámbar `.anim-pulso-resonancia`, el slot 4 se desbloquea con iluminación dorada y emerge el botón heroico «Desatar Insignia».
- **Insignias Visuales de Estados Alterados:** Creación del componente `InsigniasEstado` con iconos vectoriales SVG de Lucide estrictos bajo la Regla R1 (cero emojis unicode): `Flame` para Quemadura, `Skull` para Veneno, `Snowflake` para Escarcha, `Zap` para Parálisis, `Mountain` para Petrificación y `Shield` para Bastión. Despliega el nombre y turnos restantes (`ej. Quemadura (2)`), renderizándose en las placas de ambos combatientes.
- **Catálogo Agrupado por 6 Hábitats Geográficos:** En `PantallaCatalogo.tsx`, se reestructuró la vista en 6 secciones temáticas `<section aria-labelledby>` utilizando la función pura `agruparEspeciesPorZona`, con badges de región (`ZON-01` a `ZON-06`), encabezados retro, recuento de especies y etiqueta dorada de «Hábitat Legendario».
- **Consagración Visual de Criaturas Legendarias:** Las dos especies legendarias (*Behir del Abismo Ciego* en ZON-05 y *Remorhaz del Glaciar Eterno* en ZON-06) lucen el halo respirante dorado `.anim-halo-legendario`, borde ámbar pixelado `border-amber-400` y una corona dorada `Crown` junto a su nombre tanto en la tarjeta como en la ficha del modal táctico.
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
    3. Agrupación por zonas de hábitat y preservación de la condición legendaria en *Behir* y *Remorhaz*.
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
  - **Ticker y Drawer de Bitácora:** Ticker colapsado de 1 sola línea con tipografía retro (`retro text-[9px] sm:text-[10px]`) y hoja expandible (*bottom sheet*) con cronología completa estilizada en `retro text-[9px] sm:text-[10px]`.
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
    * Tipografía retro integral `Press Start 2P` (`.retro`) en turnos, HUDs (`NV.`), HP, Resonancia, EXP y modales.
    * Confinamiento móvil estricto con `overflow-x-hidden`.
    * Separación táctil en consola principal (`gap-2.5 sm:gap-3`) y modales (`gap-3 sm:gap-4`).
    * Hardening contra doble clic con `cerrojoAccion.current`, `disabled` y `aria-busy`.
    * Sellado elástico de modales contra desbordamiento (`w-[calc(100vw-2rem)] sm:max-w-md`).
    * Ausencia absoluta de emojis unicode (Regla R1).
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
     * **ATACAR:** Degradado rojo llama arcade (`from-[#dc2626] to-[#b91c1c]`) con icono `Swords` en amarillo solar (`#fde047`) con drop-shadow negro.
     * **USAR OBJETO:** Degradado verde esmeralda vital (`from-[#059669] to-[#047857]`) con icono `HeartPulse` en menta brillante (`#a7f3d0`).
     * **CAMBIAR:** Degradado azul zafiro táctico (`from-[#2563eb] to-[#1d4ed8]`) con icono `ArrowLeftRight` en cian brillante (`#7dd3fc`).
     * **CAPTURAR:** Degradado púrpura arcano amatista (`from-[#7c3aed] to-[#6d28d9]`) con icono `Sparkles` en oro (`#fde047`).
     * **HUIR:** Degradado carmesí oscuro de alerta (`from-[#991b1b] to-[#7f1d1d]`) con icono `LogOut` en tono carmesí claro.
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
  - Cuadrícula técnica de arquitectura full-stack (Front-End React 19, Back-End NestJS 11, Audio Web Audio API).
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
  1. `lobo-estepario` (*Lobo Estepario* · Bestia · Praderas del Amanecer).
  2. `golem-granito` (*Golem Granito* · Constructo · Paso de los Riscos).
  3. `quimera-tricefala` (*Quimera Tricéfala* · Monstruosidad · Cueva Umbría).
  4. `remorhaz-glaciar` (*Remorhaz Glaciar* · Monstruosidad · Pico de la Cumbre · Insignia Legendaria).
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
  - *Estado Inactivo:* Marco negro de 2px con sombra dura (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-background text-muted-foreground hover:text-foreground hover:border-primary active:translate-y-0.5 active:shadow-none`).
  - *Estado Activo:* Fondo primario de alto impacto con marco negro y sombra sólida (`border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary text-primary-foreground font-bold`).
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
    - `rangoDomador`: Título oficial jerárquico (`Aspirante a Domador`, `Domador Novato`, `Explorador de Senderos`, `Veterano de Aethelgard`, `Maestro Domador de la Cumbre`).
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
    - *Escalón 1 (Valle Inicial):* `[LOC-01] Villa Serena`.
    - *Escalón 2 (Sendas Bajas):* `[ZON-01] Praderas del Amanecer` y `[ZON-02] Riberas del Lago Espejo`.
    - *Escalón 3 (Frontera Media):* `[LOC-02] Puesto Fronterizo del Río` y `[ZON-03] Bosque Susurrante`.
    - *Escalón 4 (Paso Escarpado):* `[ZON-04] Paso de los Riscos`.
    - *Escalón 5 (Norte y Cumbre):* `[LOC-03] Bastión del Norte`, `[ZON-05] Cueva Umbría` y `[ZON-06] Pico de la Cumbre`.
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
- **Preservación de silueta y auras oscuras:** Todas las criaturas conservan su orientación izquierda nativa, proporciones centradas con `4%` de holgura para animaciones de impacto/flotación y sombras proyectadas en arena, y contornos nítidos sobre la paleta oscuro-abismo sin halos negros ni recuadros opacos.
- **Limpieza selectiva de cavidades sin perforar sombras:** La extracción híbrida evitó explícitamente la perforación de quitina y armadura oscura en especies críticas (`pesadilla`, `arana-gigante`, `mantarraya-espectral`), a la vez que abrió cavidades genuinamente encerradas entre alas, espiras, cuernos y guadañas (`basilisco`, `gargola`, `elemental-fuego`, `mantis-sombria`, `anguila-penumbra`, `behir-abismo`, `treant-anciano`, `remorhaz-glaciar`, `vibora-rocosa`, `lobo-estepario`, `jabali-espinoso`).

#### B. Pipeline Multimedia y Optimización en Cliente (`apps/web`)
- **Generación de los 30 sprites canónicos:** Mapeo completo 1 a 1 de las 30 fuentes hacia `apps/web/public/assets/criaturas/<slug>.webp`, bajando el peso total de **`65.62 MB`** a **`1.92 MB`** (`2,012,252 bytes`, rango `50.1 KB` en `arana-gigante.webp` a `89.3 KB` en `behir-abismo.webp`, reducción neta del **`97.08%`**) manteniendo `/sprites/` intacto como respaldo maestro local y cero dependencias agregadas a `package.json`.
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

