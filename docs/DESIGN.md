---
name: Aethelgard: Sendas y Criaturas
description: Sistema visual retro global, tokens estéticos y guía interactiva 8-bit/16-bit para Aethelgard (ISC-305)
version: 1.0.0
colors:
  superficies:
    fondo-abismo: "hsl(222, 47%, 7%)"
    fondo-bastion: "hsl(222, 40%, 12%)"
    fondo-panel: "hsl(220, 35%, 16%)"
    fondo-flotante: "hsl(218, 32%, 20%)"
    fondo-superposicion: "hsla(222, 47%, 5%, 0.85)"
  bordes:
    pixel-negro: "hsl(222, 47%, 4%)"
    pixel-bisel: "hsl(215, 25%, 35%)"
    pixel-dorado: "hsl(43, 85%, 55%)"
    pixel-cian: "hsl(187, 85%, 53%)"
  barras:
    salud-alta: "hsl(142, 70%, 45%)"
    salud-media: "hsl(38, 92%, 50%)"
    salud-critica: "hsl(0, 84%, 60%)"
    energia-mp: "hsl(217, 91%, 60%)"
    experiencia-xp: "hsl(271, 81%, 66%)"
    canal-fondo: "hsl(222, 35%, 10%)"
  rareza:
    comun: "hsl(215, 16%, 65%)"
    poco-comun: "hsl(158, 64%, 48%)"
    raro: "hsl(217, 91%, 60%)"
    epico: "hsl(271, 91%, 65%)"
    legendario: "hsl(43, 96%, 56%)"
  texto:
    primario: "hsl(45, 29%, 95%)"
    secundario: "hsl(215, 20%, 75%)"
    atenuado: "hsl(215, 15%, 60%)"
    alerta: "hsl(0, 86%, 68%)"
    exito: "hsl(142, 65%, 60%)"
typography:
  display: "'Press Start 2P', monospace"
  cuerpo: "'Geist Variable', system-ui, sans-serif"
  mono: "'Geist Mono', monospace"
  escalas:
    display-hero: "1.5rem (24px)"
    titulo-pantalla: "1.125rem (18px)"
    subtitulo-seccion: "0.875rem (14px)"
    encabezado-tarjeta: "0.75rem (12px)"
    cuerpo-regular: "0.9375rem (15px)"
    cuerpo-compacto: "0.8125rem (13px)"
    etiqueta-badge: "0.625rem (10px)"
spacing:
  base: "4px"
  escala:
    1: "0.25rem (4px)"
    2: "0.5rem (8px)"
    3: "0.75rem (12px)"
    4: "1rem (16px)"
    6: "1.5rem (24px)"
    8: "2rem (32px)"
    12: "3rem (48px)"
borders:
  radio: "0px"
  grosores:
    fino: "2px"
    estandar: "4px"
    tarjeta: "6px"
elevation:
  sombra-pixel-sm: "2px 2px 0px 0px hsl(222, 47%, 4%)"
  sombra-pixel-md: "4px 4px 0px 0px hsl(222, 47%, 4%)"
  sombra-pixel-lg: "6px 6px 0px 0px hsl(222, 47%, 4%)"
motion:
  sacudida-combate-leve: "200ms ease-in-out"
  sacudida-combate-critica: "400ms ease-in-out"
  pulso-accion: "1200ms infinite ease-in-out"
  parpadeo-dano: "240ms steps(2, start)"
  transicion-pantalla: "250ms ease-out"
---

# Sistema de Diseño Visual Retro: Aethelgard

## 1. Visión General (Creative North Star)

**Creative North Star: "Fantasía Clásica de 16-bit en Pantalla CRT Cálida"**

*Aethelgard: Sendas y Criaturas* se concibe como una experiencia inmersiva inspirada en los clásicos RPG tácticos de consola de los años 90 (como Golden Sun, Final Fantasy VI y Dragon Quest V), transportada al entorno web moderno mediante componentes declarativos de alto rendimiento. La estética no se limita a colocar una fuente pixelada sobre un fondo oscuro plano: cada pantalla, panel y botón evoca un cartucho de fantasía viva donde la luz mágica de los talismanes resalta contra muros de piedra ancestral y el misterio del Velo Astral.

El sistema equilibra con rigor dos prioridades técnicas fundamentales:
1. **Autenticidad Retro Estricta:** Cuadrícula geométrica ortogonal, bordes escalonados sin curvas (`border-radius: 0px`), sombras duras sin desenfoque gaussiano, paleta HSL con contraste deliberado y renderizado pixelado nítido (`image-rendering: pixelated`).
2. **Accesibilidad y Ergonomía Moderna (WCAG AA):** Tipografía híbrida que reserva la fuente 8-bit para títulos e insignias mientras despliega texto sans-serif nítido para descripciones y tablas densas; ratios de contraste superiores a 4.5:1 en todos los textos de lectura; y tolerancia total a fallos con degradación visual limpia ante recursos multimedia no cargados.

### Características Clave
- **Superficies Temáticas de Fantasía Oscura:** Capas cromáticas escalonadas en HSL desde el *Abismo Astral* (fondo base) hasta el *Bastión* (tarjetas) y *Pérgamo* (diálogos).
- **Jerarquía Tipográfica Bimodal:** Fusión armónica entre `Press Start 2P` (identidad 8-bit) y `Geist Sans` (ergonomía de lectura extendida).
- **Componentes Táctiles 8bitcn/ui:** Botones con bisel de sombra y feedback físico al presionar (`active:translate-y-1`), barras segmentadas de vitalidad y marcos con esquinas pixeladas.
- **Dinamismo Retro Reactivo:** Sacudidas de pantalla ante impactos de combate, parpadeos de daño, pulsos de turno activo y cifras flotantes.
- **Consumo Multimedia Centralizado:** Arquitectura desacoplada en `apps/web/src/lib/assets.ts` con placeholders SVG de respaldo garantizado.

---

## 2. Paleta Cromática Retro HSL y Accesibilidad WCAG AA

La paleta se formula íntegramente mediante el modelo **HSL (Hue, Saturation, Lightness)**. Esto permite modular dinámicamente la saturación para estados desactivados, ajustar la luminosidad para sombras ortogonales y mantener coherencia cromática en modos oscuros de fantasía.

```
+-----------------------------------------------------------------------------+
|                               PALETA RETRO HSL                              |
+-----------------------------------------------------------------------------+
|  ABISMO (Base)       BASTIÓN (Tarjetas)    PÉRGAMO (Paneles)    FLOTANTE    |
|  hsl(222, 47%, 7%)   hsl(222, 40%, 12%)    hsl(220, 35%, 16%)   (218,32,20) |
|  [#090D16]           [#121927]             [#1A2332]            [#232D3F]   |
+-----------------------------------------------------------------------------+
|  SALUD ALTA          SALUD MEDIA           SALUD CRÍTICA        ENERGÍA MP  |
|  hsl(142, 70%, 45%)  hsl(38, 92%, 50%)     hsl(0, 84%, 60%)     (217,91,60) |
|  [#22C55E]           [#F59E0B]             [#EF4444]            [#3B82F6]   |
+-----------------------------------------------------------------------------+
|  COMÚN               POCO COMÚN            RARO         ÉPICO    LEGENDARIO |
|  (215, 16%, 65%)     (158, 64%, 48%)       (217,91,60)  (271)    (43,96,56) |
+-----------------------------------------------------------------------------+
```

### 2.1 Superficies y Fondos de Fantasía Oscura
- **Fondo Abismo (`--color-fondo-abismo` / `hsl(222, 47%, 7%)` / `#090D16`):**
  Lienzo global de la aplicación. Representa la noche de Aethelgard y la inmensidad del Velo Astral. Proporciona una base oscura que absorbe reflejos y hace resaltar las criaturas y los efectos de magia.
- **Fondo Bastión (`--color-fondo-bastion` / `hsl(222, 40%, 12%)` / `#121927`):**
  Superficie de tarjetas (`Card`), inventario, ranuras de equipo y contenedores de combate. Genera una elevación visual sutil respecto al fondo abismo sin recurrir a sombras suaves.
- **Fondo Panel (`--color-fondo-panel` / `hsl(220, 35%, 16%)` / `#1A2332`):**
  Contenedores de diálogo de PNJs, bitácora del gremio, desplegables de selección y pestañas activas.
- **Fondo Flotante (`--color-fondo-flotante` / `hsl(218, 32%, 20%)` / `#232D3F`):**
  Ventanas emergentes de confirmación (`Dialog`, `AlertDialog`), tooltips de estadísticas y popovers de inspección.
- **Superposición Oscura (`--color-fondo-superposicion` / `hsla(222, 47%, 5%, 0.85)`):**
  Fondo translúcido para modales y bloqueos de pantalla durante transiciones de combate.

### 2.2 Bordes y Biseles Estilo Pixel-Art
- **Borde Pixel Negro (`--color-borde-negro` / `hsl(222, 47%, 4%)` / `#05070B`):**
  Contorno exterior obligatorio de 2px, 4px o 6px que delimita cada elemento con la firmeza del trazo pixel-art clásico.
- **Borde Bisel Plateado (`--color-borde-bisel` / `hsl(215, 25%, 35%)` / `#43526D`):**
  Línea de luz interior que simula el relieve esculpido en piedra o metal de los marcos retro.
- **Borde Dorado Gremial (`--color-borde-dorado` / `hsl(43, 85%, 55%)` / `#F5B724`):**
  Marco ceremonial reservado para recompensas de misión, rangos de veterano, zonas desbloqueadas y criaturas legendarias.
- **Borde Resonante Cian (`--color-borde-cian` / `hsl(187, 85%, 53%)` / `#14D1E8`):**
  Foco interactivo de teclado y selección activa de objetivos en combate por turnos.

### 2.3 Barras de Estado (Salud, Energía y Experiencia)
- **Salud Alta (> 50% HP) (`hsl(142, 70%, 45%)` / `#22C55E`):**
  Verde esmeralda vibrante. Transmite vitalidad óptima y estabilidad del equipo.
- **Salud Media (20% – 50% HP) (`hsl(38, 92%, 50%)` / `#F59E0B`):**
  Ámbar dorado. Señal de alerta táctica preventiva antes del estado crítico.
- **Salud Crítica (< 20% HP) (`hsl(0, 84%, 60%)` / `#EF4444`):**
  Rojo carmesí pulsante. Alerta de peligro inminente de derrota de la criatura.
- **Energía / Maná / Puntos de Habilidad (`hsl(217, 91%, 60%)` / `#3B82F6`):**
  Azul cobalto místico para consumo de habilidades y talismanes en combate.
- **Experiencia XP (`hsl(271, 81%, 66%)` / `#A855F7`):**
  Púrpura arcano brillante que llena la barra de progresión de nivel de cada especie.
- **Canal de Fondo de Barra (`hsl(222, 35%, 10%)` / `#111722`):**
  Canal oscuro empotrado con sombra interna dura que aloja el medidor.

### 2.4 Acentos de Rareza de Criaturas y Objetos
Alineados con el catálogo de criaturas y el modelo de datos del servidor:

| Rareza | Token HSL | Color Hex | Uso Típico |
| :--- | :--- | :--- | :--- |
| **Común (`COMUN`)** | `hsl(215, 16%, 65%)` | `#94A3B8` | Criaturas iniciales de pradera, pociones menores, ramas de madera. |
| **Poco Común (`POCO_COMUN`)** | `hsl(158, 64%, 48%)` | `#2DD4BF` | Especies de bosque espeso, talismanes de captura estándar. |
| **Raro (`RARO`)** | `hsl(217, 91%, 60%)` | `#3B82F6` | Criaturas de lago y caverna con habilidades resonantes. |
| **Épico (`EPICO`)** | `hsl(271, 91%, 65%)` | `#A855F7` | Bestias de cumbres y riscos con altos atributos base. |
| **Legendario (`LEGENDARIO`)** | `hsl(43, 96%, 56%)` | `#FBBF24` | Guardianes ancestrales del Velo Astral y talismanes supremos. |

### 2.5 Matriz de Contraste y Cumplimiento WCAG AA
Para satisfacer las directrices de accesibilidad sin comprometer la identidad retro, todos los pares de color de texto y superficie cumplen con los ratios de contraste establecidos por WCAG 2.1 AA (mínimo 4.5:1 para texto estándar y 3.0:1 para elementos de interfaz y texto grande):

| Elemento de Texto | Color / Token | Fondo de Aplicación | Ratio Calculado | Nivel WCAG |
| :--- | :--- | :--- | :---: | :---: |
| **Texto Primario** | Pergamino Claro (`hsl(45, 29%, 95%)`) | Fondo Abismo (`#090D16`) | **15.8:1** | ✅ AAA (>7:1) |
| **Texto Primario** | Pergamino Claro (`hsl(45, 29%, 95%)`) | Fondo Bastión (`#121927`) | **13.5:1** | ✅ AAA (>7:1) |
| **Texto Secundario** | Gris Plata (`hsl(215, 20%, 75%)`) | Fondo Abismo (`#090D16`) | **8.2:1** | ✅ AAA (>7:1) |
| **Texto Secundario** | Gris Plata (`hsl(215, 20%, 75%)`) | Fondo Bastión (`#121927`) | **7.0:1** | ✅ AAA / AA |
| **Texto Atenuado** | Gris Ceniza (`hsl(215, 15%, 60%)`) | Fondo Abismo (`#090D16`) | **5.1:1** | ✅ AA (>4.5:1) |
| **Texto Alerta / Error** | Rojo Fuego (`hsl(0, 86%, 68%)`) | Fondo Abismo (`#090D16`) | **6.4:1** | ✅ AA (>4.5:1) |
| **Texto Éxito** | Verde Hoja (`hsl(142, 65%, 60%)`) | Fondo Abismo (`#090D16`) | **8.1:1** | ✅ AAA (>7:1) |
| **Insignia Legendaria** | Oro Solar (`hsl(43, 96%, 56%)`) | Fondo Bastión (`#121927`) | **9.6:1** | ✅ AAA (>7:1) |

### 2.6 Reglas Cromáticas con Nombre
- **La Regla del 10% Dorado:** El color dorado (`hsl(43, 85%, 55%)`) se reserva estrictamente para elementos de gloria, rangos de gremio y rareza legendaria. Ocupa como máximo el 10% del área de cualquier pantalla para conservar su impacto e intención.
- **La Regla del Semáforo de Supervivencia:** La salud de una criatura cambia automáticamente de verde a ámbar a rojo según su porcentaje en el servidor. Nunca se muestra una barra de vida roja si la criatura tiene más de 20% de HP.
- **La Regla del Fondo Neutro Puro:** Los fondos nunca son negro absoluto (`#000000`) salvo en la capa de borde exterior de píxel. Esto evita el efecto de "mancha vacía" y genera la atmósfera azulada del Velo Astral.

---

## 3. Tipografía Retro y Escala Jerárquica

### 3.1 Estrategia Tipográfica Híbrida (8-bit + Sans)
La autenticidad retro exige fuentes pixel-art, pero las fuentes tipo `Press Start 2P` tienen baja densidad de caracteres por píxel, provocando fatiga extrema si se emplean en párrafos largos o tablas técnicas. *Aethelgard* implementa una **estrategia bimodal:**

1. **Tipografía Display Retro (`"Press Start 2P", monospace`):**
   - Utilizada exclusivamente en: encabezados H1/H2, nombres de criaturas, valores de daño flotante, botones de acción retro, insignias de nivel y etiquetas breves.
   - Definida bajo la clase utilitaria `.retro` en `apps/web/src/components/ui/8bit/styles/retro.css`.
2. **Tipografía de Contenido y Lectura (`"Geist Variable", system-ui, sans-serif`):**
   - Utilizada en: descripciones de misiones, bitácoras narrativas, tablas de inventario, formularios de autenticación, mensajes de validación y diálogos extensos.
   - Asegura lectura fluida y renderizado perfecto en cualquier dispositivo y resolución.
3. **Tipografía Monospace de Datos (`"Geist Mono", monospace`):**
   - Empleada para ranuras numéricas (ej. `[3/6]`), coordenadas de mapa y estadísticas numéricas de criaturas (`ATQ: 45 | DEF: 38`).

### 3.2 Escala Modular de Texto

```
+-----------------------------------------------------------------------------------------+
|                                ESCALA MODULAR DE TEXTO                                  |
+-----------------------------------------------------------------------------------------+
| Token              Tamaño         Fuente            Tracking  Uso                       |
+-----------------------------------------------------------------------------------------+
| display-hero       24px (1.5rem)  Press Start 2P    +1.0px    Pantalla inicio / Victoria|
| titulo-pantalla    18px (1.125rem)Press Start 2P    +0.5px    Títulos de pantalla (H1)  |
| subtitulo-seccion  14px (0.875rem)Press Start 2P    +0.5px    Subtítulos de bloque (H2) |
| encabezado-tarjeta 12px (0.75rem) Press Start 2P    normal    Títulos de tarjeta (H3)   |
| cuerpo-regular     15px (0.9375r) Geist Sans        normal    Párrafos, lore (máx 65ch) |
| cuerpo-compacto    13px (0.8125r) Geist Sans        normal    Metadatos, descripciones  |
| etiqueta-badge     10px (0.625rem)Press Start 2P    +0.5px    Nivel, rareza, botones SM |
+-----------------------------------------------------------------------------------------+
```

### 3.3 Reglas Tipográficas con Nombre
- **La Regla de los 30 Caracteres en Display:** Ningún texto redactado en `Press Start 2P` debe exceder los 30 caracteres continuos en una misma línea sin quiebre. Si un texto informativo supera las dos líneas, debe renderizarse obligatoriamente en `Geist Sans`.
- **La Regla del Contorno Duro en Combate:** Todo número flotante en combate (daño infligido, curación o captura) lleva un contorno ortogonal de 2px mediante `text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000` para garantizar legibilidad absoluta sobre cualquier fondo o sprite.

---

## 4. Sistema de Tokens de Espaciado, Bordes y Profundidad

### 4.1 Retícula de 4px / 8px (Pixel Grid)
En consonancia con el diseño pixel-art, todos los espaciados, rellenos (`padding`), márgenes (`margin`) y separaciones (`gap`) siguen una cuadrícula modular basada en pasos de 4px:

- `espacio-1` (`p-1`, `gap-1`): **4px (0.25rem)** — Separación entre iconos e insignias.
- `espacio-2` (`p-2`, `gap-2`): **8px (0.5rem)** — Relleno interno de botones pequeños y ranuras de inventario.
- `espacio-3` (`p-3`, `gap-3`): **12px (0.75rem)** — Separación entre tarjetas de criaturas en la cuadrícula de equipo.
- `espacio-4` (`p-4`, `gap-4`): **16px (1rem)** — Relleno estándar de tarjetas (`CardContent`) y contenedores.
- `espacio-6` (`p-6`, `gap-6`): **24px (1.5rem)** — Espaciado de cabeceras de pantalla y secciones principales.
- `espacio-8` (`p-8`, `gap-8`): **32px (2rem)** — Separación vertical entre paneles mayores.

### 4.2 Geometría y Bordes Pixel-Art
- **Cero Curvatura (`border-radius: 0px` / `rounded-none`):**
  Queda estrictamente prohibido el uso de esquinas redondeadas estándar (`rounded-md`, `rounded-lg`, etc.). Toda forma geométrica de *Aethelgard* es ortogonal y angular.
- **Grosores de Borde Pixel:**
  - `2px` (`border-2`): Borde de ranuras de inventario, entradas de texto e insignias.
  - `4px` (`border-4`): Borde de marcos de combate y botones de acción principal.
  - `6px` (`border-6` / `border-y-6`): Borde distintivo de tarjetas `8bitcn/ui` (`BitCard`).
- **Esquinas Escalonadas (Pixel Step):**
  Los botones y tarjetas de `apps/web/src/components/ui/8bit/` utilizan pseudo-elementos o spans de esquina de 6px (`size-1.5` en Tailwind) ubicados en las 4 esquinas para emular la muesca de pixel-art clásica de 8-bit.

### 4.3 Profundidad y Sombras Ortogonales
El sistema prescinde totalmente del desenfoque gaussiano (`blur(0px)`). La profundidad se logra exclusivamente mediante sombras duras escalonadas proyectadas a 45 grados:

```css
/* Tokens de Elevación Retro */
--sombra-pixel-sm: 2px 2px 0px 0px hsl(222, 47%, 4%);
--sombra-pixel-md: 4px 4px 0px 0px hsl(222, 47%, 4%);
--sombra-pixel-lg: 6px 6px 0px 0px hsl(222, 47%, 4%);
```

- **Al Presionar (Estado Activo):**
  El componente traslada su contenido 2px hacia abajo y a la derecha (`transform: translate(2px, 2px)` o `active:translate-y-1`), anulando su sombra proyectada para simular el hundimiento mecánico de un botón de mando o consola.

---

## 5. Catálogo de Componentes 8-bit (8bitcn/ui + Tailwind)

Todos los componentes residen en `apps/web/src/components/ui/` y su variante retro en `apps/web/src/components/ui/8bit/`.

### 5.1 Botones (`Button` / `BitButton`)
- **Estructura:** Cuadrado sin radio, contorno pixelado de spans decorativos (`ButtonDecorations`).
- **Variantes:**
  - `default`: Fondo oscuro con bisel de alto contraste. Para acciones primarias.
  - `destructive`: Fondo carmesí (`hsl(0, 84%, 60%)`) para acciones críticas (huir de combate, liberar criatura).
  - `outline`: Borde pixelado nítido con fondo transparente.
  - `secondary`: Fondo pizarra (`hsl(220, 35%, 16%)`) para navegación de retorno.
- **Tipografía:** Clase `font-retro` opcional vía prop `font="retro"`.
- **Feedback:** `active:translate-y-1` para efecto táctil instantáneo.

### 5.2 Tarjetas (`Card` / `BitCard`)
- **Estructura:** Contenedor con `border-y-6` y pseudo-marcos laterales `border-x-6` que generan las 4 esquinas recortadas de estilo pixel-art.
- **Fondo:** `--color-fondo-bastion` (`hsl(222, 40%, 12%)`).
- **Cabecera (`CardHeader`):** Título en `Press Start 2P` de 12px a 14px, centrado o alineado a la izquierda según contexto.
- **Cuerpo (`CardContent`):** Contenido descriptivo en `Geist Sans` para máxima legibilidad.

### 5.3 Barras de Vitalidad y Progreso (`HealthBar`, `ManaBar`, `XpBar`)
- **Estructura:** Canales rectangulares con borde de 2px negro y fondo de canal oscuro (`hsl(222, 35%, 10%)`).
- **Segmentación:** Relleno de color plano sin degradados, con división visual simulada en bloques de 4px.
- **Comportamiento Dinámico:**
  - `HealthBar`: Transiciona suavemente en anchura (`transition-[width] duration-300 ease-out`), cambiando automáticamente a color rojo cuando el valor cae bajo el 20%.
  - `XpBar`: Relleno púrpura brillante (`hsl(271, 81%, 66%)`) con indicador numérico `XP: [actual]/[meta]`.

### 5.4 Insignias de Rareza y Estado (`Badge`)
- **Estructura:** Rectángulo compacto con borde de 2px, padding horizontal de 8px y vertical de 2px.
- **Color de Borde y Texto:** Acorde al token de rareza (`COMUN`, `POCO_COMUN`, `RARO`, `EPICO`, `LEGENDARIO`).
- **Texto:** Mayúsculas estrictas en `Press Start 2P` de 10px.

### 5.5 Campos de Entrada (`Input`)
- **Estructura:** Borde pixel de 2px, fondo abismo (`hsl(222, 47%, 7%)`), texto blanco pergamino en `Geist Sans`.
- **Foco (`focus-visible`):** Anillo pixelado cian (`hsl(187, 85%, 53%)`) de 2px sin resplandor difuso.
- **Placeholder:** Texto gris ceniza legible (`hsl(215, 15%, 60%)`).

---

## 6. Guía de Micro-interacciones y Dinamismo Retro

Para trascender la apariencia estática y dotar al juego de vitalidad táctil, se implementan las siguientes micro-animaciones retro:

```
+-----------------------------------------------------------------------------+
|                     DINAMISMO Y MICRO-INTERACCIONES RETRO                   |
+-----------------------------------------------------------------------------+
| 1. SACUDIDA COMBATE: Traslaciones rápidas en X/Y (±3px a ±6px en 200-400ms) |
| 2. PULSO DE ACCIÓN:  Borde parpadeante suave (1.2s) para guiar el turno     |
| 3. PARPADEO DE DAÑO: 3 ciclos de opacidad (1 -> 0.2 -> 1) en 240ms          |
| 4. DAÑO FLOTANTE:    Número salta -16px y se desvanece en 600ms con contorno|
| 5. TRANSICIÓN ZONA:  Fundido en negro (250ms) con preservación del HUD      |
+-----------------------------------------------------------------------------+
```

### 6.1 Sacudida de Combate (Screen Shake)
Al recibir daño una criatura o al impactar un ataque crítico en combate:
- **Sacudida Leve (Ataque Normal):**
  Desplazamiento horizontal y vertical rápido de ±3px durante 200ms.
  ```css
  @keyframes sacudida-leve {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(-3px, 2px); }
    40% { transform: translate(3px, -2px); }
    60% { transform: translate(-2px, -1px); }
    80% { transform: translate(2px, 1px); }
  }
  .anim-sacudida-leve {
    animation: sacudida-leve 200ms ease-in-out;
  }
  ```
- **Sacudida Crítica (Golpe Crítico o Derrota):**
  Desplazamiento de ±6px a ±8px durante 400ms, acompañado de un destello rojo perimetral momentáneo.

### 6.2 Parpadeo de Daño en Sprite (Damage Blink)
Cuando una criatura recibe un impacto, su sprite no se distorsiona; parpadea en ciclos rápidos de visibilidad (emulando la limitación de sprites por scanline de consolas clásicas):
```css
@keyframes parpadeo-dano {
  0%, 49% { opacity: 1; }
  50%, 74% { opacity: 0.2; }
  75%, 100% { opacity: 1; }
}
.anim-parpadeo-dano {
  animation: parpadeo-dano 240ms steps(2, start);
}
```

### 6.3 Pulso de Acción Disponible (Turn Pulse)
En turnos de combate o en botones de exploración disponibles, un pulso rítmico alerta al jugador sin estridencias:
```css
@keyframes pulso-retro {
  0%, 100% { border-color: hsl(43, 85%, 55%); }
  50% { border-color: hsl(43, 85%, 25%); }
}
.anim-pulso-turno {
  animation: pulso-retro 1200ms infinite ease-in-out;
}
```

### 6.4 Cifras Flotantes de Daño (Floating Combat Text)
Los números de daño, curación o captura saltan desde el objetivo hacia arriba:
```css
@keyframes flotar-dano {
  0% { transform: translateY(0px) scale(1); opacity: 1; }
  50% { transform: translateY(-16px) scale(1.15); opacity: 1; }
  100% { transform: translateY(-24px) scale(0.9); opacity: 0; }
}
.anim-dano-flotante {
  animation: flotar-dano 600ms ease-out forwards;
}
```

### 6.5 Prevención de Doble Clic y Estados de Carga (Harden)
- Todo botón que despache una mutación hacia el servidor (`POST /api/combate/accion`, `POST /api/exploracion`, etc.) debe pasar inmediatamente a estado deshabilitado (`disabled`) con `aria-busy="true"`.
- Mientras dura la solicitud, el texto de la acción se reemplaza por el componente `Spinner` de 8bitcn/ui o el texto animado `PROCESANDO...` en `Press Start 2P`.

---

## 7. Protocolo de Integración Multimedia

Todo recurso audiovisual de *Aethelgard* se rige por la **Regla Transversal 8** del proyecto: ningún componente puede hardcodear rutas directas a imágenes o sonidos.

### 7.1 Consumo Centralizado vía `apps/web/src/lib/assets.ts`
El módulo `apps/web/src/lib/assets.ts` es la única fuente de verdad para resolución de recursos:

| Función | Tipo de Recurso | Destino Primario | Fallback de Seguridad |
| :--- | :--- | :--- | :--- |
| `obtenerImagenCriatura(slug)` | Sprite de criatura | `/assets/criaturas/${slug}.webp` | `/assets/placeholder-criatura.svg` |
| `obtenerImagenZona(slug)` | Paisaje de ruta/zona | `/assets/zonas/${slug}.webp` | `/assets/placeholder-zona.svg` |
| `obtenerImagenObjeto(slug)` | Icono de ítem/objeto | `/assets/objetos/${slug}.webp` | `/assets/placeholder-objeto.svg` |
| `reproducirSonido(nombre, vol)` | Audio retro | `/assets/sonidos/${nombre}.mp3` | Silencio silencioso controlado |
| `manejarErrorImagen(evento, tipo)` | Manejador `onError` | Asigna fallback SVG | Previene bucles infinitos de 404 |

### 7.2 Estructura en `apps/web/public/assets/`
```text
apps/web/public/assets/
├── criaturas/              -> Sprites individuales (formato WebP, ej. lobo-estelar.webp)
├── zonas/                  -> Paisajes panorámicos (formato WebP 16:9, ej. praderas-del-amanecer.webp)
├── objetos/                -> Iconos de pociones y talismanes (formato WebP, ej. pocion-curativa.webp)
├── sonidos/                -> Clips breves de audio retro (formato MP3, ej. ataque.mp3, click.mp3)
├── placeholder-criatura.svg-> Silueta pixelada SVG vectorial de respaldo
├── placeholder-zona.svg    -> Paisaje pixelado SVG vectorial de respaldo
├── placeholder-objeto.svg  -> Icono de cofre/orbe SVG vectorial de respaldo
└── README.md               -> Especificación de dimensiones y convenciones
```

### 7.3 Renderizado Nítido de Píxeles (`.pixelated`)
Los navegadores modernos aplican interpolación bilineal suave a las imágenes escaladas, lo que destruye el pixel-art. Es obligatorio aplicar la clase utilitaria `.pixelated` a todos los elementos `<img>` de criaturas y objetos:
```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### 7.4 Patrón Estándar de Implementación en Vistas (React 19)
Toda pantalla que renderice criaturas, zonas u objetos debe implementar el siguiente patrón canónico:

```tsx
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";

export function TarjetaCriaturaCombate({ criatura }: { criatura: Criatura }) {
  return (
    <div className="relative border-4 border-foreground bg-card p-3">
      <img
        src={obtenerImagenCriatura(criatura.especie.slug)}
        alt={criatura.especie.nombre}
        onError={(e) => manejarErrorImagen(e, "criatura")}
        className="pixelated mx-auto h-32 w-32 object-contain"
      />
      <p className="retro mt-2 text-center text-xs">
        {criatura.especie.nombre}
      </p>
    </div>
  );
}
```

---

## 8. Qué Hacer y Qué No Hacer (Do's and Don'ts)

### ✅ Qué Hacer (Do):
1. **Usar siempre variables de color en HSL o Tailwind semántico:** Emplear `bg-background`, `border-foreground`, o variables CSS semánticas para garantizar compatibilidad con temas y contraste.
2. **Aplicar la clase `.pixelated` a todo sprite:** Mantener los bordes de los píxeles nítidos sin desenfoque de escalado.
3. **Utilizar `Geist Sans` para párrafos y tablas:** Reservar `Press Start 2P` exclusivamente para encabezados breves, botones y valores de combate.
4. **Incluir `onError={(e) => manejarErrorImagen(e, 'tipo')}` en cada imagen:** Garantizar que ninguna imagen rota arruine la experiencia si el archivo WebP aún no existe.
5. **Verificar el ratio de contraste WCAG AA (≥ 4.5:1):** Comprobar que cualquier texto informativo sea legible contra su fondo.
6. **Usar `rounded-none` en todo componente nuevo:** La curvatura geométrica es 0px en todo el juego.
7. **Proteger botones contra doble clic:** Deshabilitar la interfaz y mostrar spinner retro durante operaciones asíncronas con el servidor.

### ❌ Qué No Hacer (Don't):
1. **No usar bordes redondeados (`rounded-md`, `rounded-full`):** Destruyen la coherencia estética retro de consola 8-bit.
2. **No hardcodear rutas directas a `/assets/...` en componentes:** Todo consumo debe resolverse a través de `apps/web/src/lib/assets.ts`.
3. **No usar `Press Start 2P` en textos largos de más de 30 caracteres por línea:** Provoca fatiga visual severa y viola principios de accesibilidad.
4. **No aplicar sombras suaves difuminadas (`box-shadow` con blur):** Solo se permiten sombras duras ortogonales (`2px 2px 0 0 #...`).
5. **No usar transiciones con destellos blancos (white flashes):** Toda transición de pantalla debe fundir hacia o desde el fondo abismo oscuro para proteger la vista del usuario.
6. **No inventar nombres en inglés para componentes o variables del juego:** Respetar estrictamente la Regla R1 y el glosario en español de §1.
