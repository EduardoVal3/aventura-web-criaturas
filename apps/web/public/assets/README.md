# Guía Maestra de Dirección de Arte y Prompts para Assets (Aethelgard)

Este documento define las reglas técnicas, nombres exactos de archivo y **Prompts Maestros bloqueados** para que cualquier integrante del equipo genere los recursos visuales del juego manteniendo **exactamente la misma línea artística retro oscura (16-bit / HD-2D)** sin mezclar estilos incompatibles.

> **Carga automática multiformato (`.webp`, `.png`, `.jpg`, `.jpeg`):** El código en [`apps/web/src/lib/assets.ts`](../../src/lib/assets.ts) y [`BattlefieldBackground.tsx`](../../src/components/combate/BattlefieldBackground.tsx) busca automáticamente el archivo en orden `.webp` → `.png` → `.jpg` → `.jpeg` (se recomienda `.webp` o `.png` en criaturas y objetos para conservar el fondo transparente). Mientras un archivo no exista, el juego muestra su *placeholder* SVG sin romperse.

---

## 1. Estructura de Carpetas y Dimensiones Obligatorias

```text
apps/web/public/assets/
├── criaturas/      -> 30 criaturas canónicas (512x512 px, formato .webp, fondo transparente, MIRANDO A LA IZQUIERDA)
├── zonas/          -> 6 zonas silvestres + 3 localidades seguras (800x450 px, 16:9, formato .webp)
├── battlegrounds/  -> 6 escenarios de combate por zona (800x450 px, 16:9, formato .webp)
└── objetos/        -> 4 ítems del bazar (256x256 px, formato .webp, fondo transparente)
```

---

## 2. Reglas de Oro para Evitar Mezcla de Estilos ("Cero Relajo")

1. **ORIENTACIÓN OBLIGATORIA DE LAS CRIATURAS (MIRANDO A LA IZQUIERDA):**
   - **Todas las criaturas DEBEN generarse mirando hacia la IZQUIERDA (`3/4 profile view facing LEFT`).**
   - **¿Por qué?** En la pantalla de combate (`PantallaCombate.tsx`), el enemigo salvaje (ubicado arriba a la derecha) muestra el archivo original mirando hacia la izquierda (apuntando hacia tu criatura), mientras que tu criatura aliada (ubicada abajo a la izquierda) se invierte automáticamente mediante código (`scale-x-[-1]`) para mirarlo hacia la derecha. Si generas una criatura mirando a la derecha o de frente, en combate parecerá darle la espalda al enemigo.
2. **FONDO TRANSPARENTE EN CRIATURAS Y OBJETOS:**
   - Las criaturas (`/assets/criaturas/*.webp`) y los objetos (`/assets/objetos/*.webp`) deben tener **fondo 100% transparente** (sin recuadros, sin marcos y sin paisaje detrás), para que se integren limpiamente sobre el pedestal de la arena de combate y en las tarjetas del catálogo.
   - *Tip:* Si el generador de imágenes entrega fondo negro sólido (`#000000` o `#090d16`), remueve el fondo con una herramienta de eliminación de fondo antes de exportarlo a `.webp`.
3. **ESTILO ÚNICO BLOQUEADO (16-bit / 32-bit Dark Fantasy Pixel Art):**
   - Usa siempre los bloques de estilo exactos de esta guía. Prohibido generar imágenes en 3D realista, estilo anime moderno, vector plano o caricatura infantil.
4. **CERO TEXTO NI INTERFAZ DENTRO DE LA IMAGEN:**
   - Ninguna imagen debe contener letras, números, barras de vida ni marcos decorativos propios; la interfaz de `8bitcn/ui` ya pone los bordes y HUDs.

---

## 3. Prompt Maestro para las 30 Criaturas (`apps/web/public/assets/criaturas/`)

Como ya se cuenta con la descripción de cada criatura, **no inventes un prompt desde cero**. Copia exactamente la siguiente plantilla y solo reemplaza los campos entre corchetes `[...]`:

### Plantilla única para copiar y pegar (Criaturas)

```text
Masterpiece 16-bit dark fantasy JRPG monster battle sprite of [NOMBRE DE LA CRIATURA]: [PEGA AQUÍ TU DESCRIPCIÓN DE LA CRIATURA].
POSE AND ORIENTATION: Full-body aggressive combat stance, 3/4 profile view strictly FACING LEFT (looking toward the left side of the frame), dynamic menacing posture ready to strike, centered in frame with margin around extremities.
ELEMENTAL AURA & PALETTE: [PEGA AQUÍ EL BLOQUE ELEMENTAL DE LA TABLA INFERIOR].
POWER TIER: [PEGA AQUÍ EL BLOQUE DE JERARQUÍA SEGÚN SU RAREZA].
ART STYLE LOCK: Authentic high-detail 16-bit / 32-bit pixel art sprite (style of Octopath Traveler, Chrono Trigger, and Final Fantasy VI boss sprites), crisp pixel edges, hand-crafted dithering shading, dramatic dark fantasy chiaroscuro lighting, glowing arcane rim-light, intimidating, fierce, awe-inspiring collector design.
BACKGROUND: Isolated on a pure solid flat pitch-black background (#000000) for clean alpha transparency extraction, no ground scenery, no frames, no text, no UI, 1:1 square aspect ratio.
```

### Bloques de Afinidad Elemental (para insertar en `ELEMENTAL AURA & PALETTE`)

- **Si es `fisico`:** `Raw primal beast armor, weathered bone, scarred hide and slate-steel tones, subtle dust shockwave accents.`
- **Si es `fuego`:** `Glowing ember veins, volcanic obsidian scales, searing orange-crimson and molten gold fire wisps (#f04d24, #fbbf24).`
- **Si es `agua`:** `Abyssal bioluminescent cyan and deep oceanic sapphire tones (#14d1e8, #2563eb), frost mist or surging brine droplets.`
- **Si es `natura`:** `Ancient sylvan emerald moss, venomous jade luminescence, gnarled dark bark and toxic spore highlights (#22c55e, #10b981).`
- **Si es `sombra`:** `Void-corrupted spectral purple and abyssal indigo aura (#a855f7, #4c1d95), shadowy tendrils and ghostly necrotic eyes.`
- **Si es `luz`:** `Celestial astral gold and pale moonlit cyan radiance (#facc15, #bae6fd), sacred runic shimmer in the dark.`

### Bloques de Jerarquía (para insertar en `POWER TIER`)

- **Común / Frecuente / Raro (`J-1` a `J-3`):** `Wild predatory creature, battle-hardened anatomy, sharp silhouette, lethal presence.`
- **Especial (Apex de Zona - 5%):** `Apex regional alpha predator, imposing muscular or armored silhouette, heightened elemental glow, intimidating boss-tier presence.`
- **LEGENDARIA (`behir-abismo` y `remorhaz-glaciar`):** `Colossal primordial mythical elder titan, overwhelming apex catastrophe aura, intricate pixel detail, god-tierJRPG final boss intimidation.`

---

### Tabla de los 30 Archivos de Criaturas (Nombres exactos de archivo)

Guarda cada imagen en `apps/web/public/assets/criaturas/` con este nombre exacto:

| # | Zona | Archivo exacto (`.webp`) | Nombre | Elemento | Categoría | Descripción base de referencia |
| -: | :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | ZON-01 | `lobo-estepario.webp` | Lobo Estepario | `fisico` | Común | Cazador en manada ágil y feroz de pelaje grisáceo erizado, colmillos descubiertos y ojos ámbar. |
| 2 | ZON-01 | `vibora-rocosa.webp` | Víbora Rocosa | `natura` | Común | Sierpe venenosa de escamas pétreas afiladas y colmillos goteando veneno esmeralda. |
| 3 | ZON-01 | `ciervo-lunar.webp` | Ciervo Lunar | `luz` | Frecuente | Ciervo místico e imponente con cornamenta cristalina que irradia luz astral plateada y dorada. |
| 4 | ZON-01 | `halcon-ceniza.webp` | Halcón Ceniza | `fuego` | Raro | Rapaz de combate con alas extendidas de plumas incandescentes, brasas y garras al rojo vivo. |
| 5 | ZON-01 | `oso-fresno.webp` | Oso Fresno | `fisico` | **Especial** | Oso colosal acorazado con corteza de fresno petrificada, cicatrices de batalla y garras masivas. |
| 6 | ZON-02 | `cangrejo-abismal.webp` | Cangrejo Abismal | `agua` | Común | Crustáceo monstruoso con caparazón espinoso de las profundidades y tenazas trituradoras. |
| 7 | ZON-02 | `anguila-penumbra.webp` | Anguila Penumbra | `sombra` | Común | Depredador serpentino abisal rodeado de relámpagos púrpura oscuro y fauces de agujas. |
| 8 | ZON-02 | `quelonio-lacustre.webp` | Quelonio Lacustre | `agua` | Frecuente | Reptil acorazado ancestral de cuello largo, caparazón rúnico hidro-resistente y fauces marinas. |
| 9 | ZON-02 | `tiburon-arrecife.webp` | Tiburón Arrecife | `agua` | Raro | Depredador escualo de aspecto prehistórico con aletas cortantes, cicatrices y fauces serradas. |
| 10 | ZON-02 | `mantarraya-espectral.webp` | Mantarraya Espectral | `sombra` | **Especial** | Monstruosidad abisal fantasmagórica que flota envuelta en niebla necrótica violeta y aguijón letal. |
| 11 | ZON-03 | `arana-gigante.webp` | Araña Gigante | `natura` | Común | Arácnido monstruoso de quitina negra y verde, múltiples ojos brillantes y quelíceros tóxicos. |
| 12 | ZON-03 | `jabali-espinoso.webp` | Jabalí Espinoso | `fisico` | Común | Bestia de guerra salvaje con colmillos gigantescos curvados y el lomo cubierto de púas óseas. |
| 13 | ZON-03 | `basilisco.webp` | Basilisco | `natura` | Frecuente | Reptil pesado de ocho patas con cresta espinosa y ojos fosforescentes capaces de petrificar. |
| 14 | ZON-03 | `treant-anciano.webp` | Treant Anciano | `natura` | Raro | Coloso arbóreo viviente de madera negra retorcida, fauces en el tronco y núcleo de savia brillante. |
| 15 | ZON-03 | `mantis-sombria.webp` | Mantis Sombría | `sombra` | **Especial** | Insectoide asesino de las sombras con guadañas quitinosas afiladas que desprenden estelas violetas. |
| 16 | ZON-04 | `gargola.webp` | Gárgola | `fisico` | Común | Demonio alado esculpido en granito oscuro agrietado, cuernos pétreos y garras desgarradoras. |
| 17 | ZON-04 | `esqueleto-guerrero.webp` | Esqueleto Guerrero | `sombra` | Común | Campeón no-muerto con armadura antigua destrozada, fuego espectral en las cuencas y mandoble. |
| 18 | ZON-04 | `escorpion-obsidiana.webp` | Escorpión Obsidiana | `fuego` | Frecuente | Arácnido gigante de roca volcánica negra con fisuras de lava ardiente y aguijón incandescente. |
| 19 | ZON-04 | `espectro-ceniza.webp` | Espectro Ceniza | `sombra` | Raro | Entidad fantasmal de túnicas desgarradas de humo, garras etéreas y cráneo envuelto en fuego frío. |
| 20 | ZON-04 | `golem-granito.webp` | Golem Granito | `fisico` | **Especial** | Titán rúnico construido con bloques monolíticos de roca viva unidos por energía arcana dorada. |
| 21 | ZON-05 | `elemental-fuego.webp` | Elemental Fuego | `fuego` | Común | Espíritu titánico de llamas furiosas y escoria volcánica con silueta monstruosa acorazada. |
| 22 | ZON-05 | `salamandra-magma.webp` | Salamandra Magma | `fuego` | Común | Depredador reptiliano de fuego líquido, cresta ígnea y cola candente que derrite la roca. |
| 23 | ZON-05 | `pesadilla.webp` | Pesadilla | `sombra` | Frecuente | Corcel demoníaco del abismo de piel azabache, ojos carmesí y crin y cascos de fuego infernal. |
| 24 | ZON-05 | `quimera-tricefala.webp` | Quimera Tricéfala | `fuego` | Raro | Monstruo alado feroz con cabezas de león abisal, cabra negra cornuda y dragón escupiendo fuego. |
| 25 | ZON-05 | `behir-abismo.webp` | Behir del Abismo | `sombra` | **LEGENDARIA** | Dragón serpentino colosal de doce patas, escamas de obsidiana azulada y tormenta de rayos umbríos. |
| 26 | ZON-06 | `yeti.webp` | Yeti | `agua` | Común | Bestia gigante de las cumbres heladas, pelaje blanco escarchado, cuernos y garras de hielo azul. |
| 27 | ZON-06 | `lobo-invernal.webp` | Lobo Invernal | `agua` | Común | Huargo gigante ártico de pelaje plateado, cicatrices y aliento de ventisca congelante en las fauces. |
| 28 | ZON-06 | `elemental-agua.webp` | Elemental Agua | `agua` | Frecuente | Vorágine monstruosa de agua abisal helada y témpanos afilados con núcleo bioluminiscente. |
| 29 | ZON-06 | `tigre-dientes-sable.webp` | Tigre Dientes Sable | `fisico` | Raro | Depredador alfa prehistórico de la tundra con colmillos de marfil gigantescos y musculatura brutal. |
| 30 | ZON-06 | `remorhaz-glaciar.webp` | Remorhaz Glaciar | `fuego` | **LEGENDARIA** | Leviatán ciempiés blindado de los glaciares con quitina helada azul y espinas dorsales al rojo vivo. |

---

## 4. Prompts para las 6 Zonas + 3 Localidades (`apps/web/public/assets/zonas/`)

Estas imágenes se muestran como banner panorámico en el **Hub de Ubicación**, en **Exploración** y en el **Santuario**.  
- **Formato:** `.webp` panorámico **16:9 (`800x450 px`)**.

### Prompt Maestro Base para Zonas (Exploración / Hub)
Cada uno de los prompts inferiores ya incluye el bloqueo de estilo para que las 6 zonas y 3 localidades parezcan parte del mismo mundo:

#### ZON-01: Praderas del Amanecer (`apps/web/public/assets/zonas/praderas-del-amanecer.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Praderas del Amanecer": vast windswept golden-amber steppes at twilight dawn, ancient weathered stone monoliths with faint glowing runes, jagged limestone outcrops, distant misty mountain silhouettes under a deep indigo and amber sky. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), rich atmospheric lighting, crisp pixel art details, dark moody vignette, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### ZON-02: Riberas del Lago Espejo (`apps/web/public/assets/zonas/riberas-del-lago-espejo.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Riberas del Lago Espejo": eerie mirror-still dark lake at dusk reflecting a pale crescent moon, crooked marsh cypress trees, glowing cyan bioluminescent reeds along rocky shores, creeping purple mist over deep water, submerged ancient ruins. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), high contrast moody lighting, crisp pixel art details, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### ZON-03: Bosque Susurrante (`apps/web/public/assets/zonas/bosque-susurrante.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Bosque Susurrante": dense ancient primeval forest of colossal twisted dark trees, glowing emerald spores floating in the air, thick roots and giant cobwebs in the shadows, shafts of eerie moonlight piercing the canopy, overgrown stone altar. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), dramatic chiaroscuro pixel shading, crisp pixel edges, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### ZON-04: Paso de los Riscos (`apps/web/public/assets/zonas/paso-de-los-riscos.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Paso de los Riscos": treacherous jagged obsidian and granite mountain pass above the clouds, ruined gothic stone archways, narrow cliffside path, ominous storm clouds with distant amber lightning, glowing volcanic fissures in the dark rock. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), dramatic high-contrast lighting, crisp pixel art details, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### ZON-05: Cueva Umbría (`apps/web/public/assets/zonas/cueva-umbria.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Cueva Umbría": colossal subterranean abyssal cavern, rivers of glowing molten magma and violet shadow crystals, towering stalagmites, basalt rock bridges, dark arcane electrical arcs in the deep chasm. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), intense chiaroscuro lighting with fiery orange and deep purple rim light, crisp pixel edges, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### ZON-06: Pico de la Cumbre (`apps/web/public/assets/zonas/pico-de-la-cumbre.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG environment illustration of "Pico de la Cumbre": apocalyptic frozen mountain summit battered by an eternal arcane blizzard, towering blue glacier spires, jagged black ice cliffs, glowing aurora borealis in a pitch-dark sky, ancient frozen dragon bones. Authentic 16-bit / 32-bit pixel art landscape (style of Octopath Traveler and Chrono Trigger backgrounds), high-contrast icy cyan and deep abyssal blue lighting, crisp pixel edges, no characters, no text, no UI, 16:9 widescreen aspect ratio (800x450).
```

#### Localidades Seguras (Opcionales pero recomendadas para el Hub y Santuario en `apps/web/public/assets/zonas/`)
- **`villa-serena.webp` (`LOC-01`):**
  ```text
  Masterpiece 16-bit dark fantasy JRPG environment illustration of "Villa Serena": medieval guild sanctuary village nestled in a quiet valley at night, warm amber lantern light from timber and stone cottages, glowing healing fountain shrine in the cobblestone square, starry indigo sky. Authentic 16-bit pixel art (Octopath Traveler style), crisp pixel details, no characters, no text, no UI, 16:9 widescreen (800x450).
  ```
- **`puesto-fronterizo-del-rio.webp` (`LOC-02`):**
  ```text
  Masterpiece 16-bit dark fantasy JRPG environment illustration of "Puesto Fronterizo del Río": fortified river crossing outpost at twilight, stone bridge, merchant bazaar tents with glowing arcane lanterns, wooden palisades and watchtowers overlooking dark rushing waters. Authentic 16-bit pixel art (Octopath Traveler style), crisp pixel details, no characters, no text, no UI, 16:9 widescreen (800x450).
  ```
- **`bastion-del-norte.webp` (`LOC-03`):**
  ```text
  Masterpiece 16-bit dark fantasy JRPG environment illustration of "Bastión del Norte": imposing citadel fortress of black stone built on snow-swept northern cliffs, braziers burning with golden fire on battlements, towering guild gates, dark stormy sky. Authentic 16-bit pixel art (Octopath Traveler style), crisp pixel details, no characters, no text, no UI, 16:9 widescreen (800x450).
  ```

---

## 5. Prompts para las 6 Zonas de Combate (`apps/web/public/assets/battlegrounds/`)

Estos escenarios se renderizan como fondo de la **Arena de Combate (`PantallaCombate.tsx`)**.  
- **Requisito crítico de composición:** Deben tener **perspectiva de arena JRPG diagonal**, dejando suelo plano y despejado **abajo a la izquierda** (donde se para nuestra criatura) y **arriba a la derecha** (donde se para la criatura enemiga), sin árboles ni rocas estorbando en medio de las plataformas.
- **Formato:** `.webp` **16:9 (`800x450 px`)**.

#### 1. Arena de Combate ZON-01 (`apps/web/public/assets/battlegrounds/praderas-del-amanecer.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Praderas del Amanecer": diagonal camera perspective looking across a flat dirt and stone clearing in golden-amber twilight grasslands. COMPOSITION LOCK: Clear flat open ground in the bottom-left foreground (player creature position) and clear flat elevated stone earth in the upper-right midground (enemy creature position), framed by weathered runic stones and swaying dark grass on the edges, deep indigo dusk sky at the top. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast so UI HUDs are readable, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

#### 2. Arena de Combate ZON-02 (`apps/web/public/assets/battlegrounds/riberas-del-lago-espejo.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Riberas del Lago Espejo": diagonal camera perspective across a shallow misty lakeshore arena at night. COMPOSITION LOCK: Clear flat rocky sandbar in the bottom-left foreground (player position) and clear flat stone shoal in the upper-right midground (enemy position), surrounded by dark mirror water, glowing cyan bioluminescent reeds, and purple marsh fog on the borders. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

#### 3. Arena de Combate ZON-03 (`apps/web/public/assets/battlegrounds/bosque-susurrante.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Bosque Susurrante": diagonal camera perspective inside a dark ancient forest glade. COMPOSITION LOCK: Clear flat mossy stone floor in the bottom-left foreground (player position) and clear flat root-ringed clearing in the upper-right midground (enemy position), surrounded on the periphery by gnarled giant black tree trunks, glowing green spores, and eerie moonlight beams. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

#### 4. Arena de Combate ZON-04 (`apps/web/public/assets/battlegrounds/paso-de-los-riscos.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Paso de los Riscos": diagonal camera perspective on a wide windswept obsidian cliff plateau high in the mountains. COMPOSITION LOCK: Clear flat cracked granite ground in the bottom-left foreground (player position) and clear flat rocky ledge in the upper-right midground (enemy position), bordered by ruined stone pillars, glowing lava cracks, and dark storm clouds in the background. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

#### 5. Arena de Combate ZON-05 (`apps/web/public/assets/battlegrounds/cueva-umbria.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Cueva Umbría": diagonal camera perspective inside a volcanic abyssal cavern. COMPOSITION LOCK: Clear flat dark basalt platform in the bottom-left foreground (player position) and clear flat obsidian arena floor in the upper-right midground (enemy position), surrounded by glowing magma veins, purple shadow crystals, and subterranean chasm walls in the background. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

#### 6. Arena de Combate ZON-06 (`apps/web/public/assets/battlegrounds/pico-de-la-cumbre.webp`)
```text
Masterpiece 16-bit dark fantasy JRPG turn-based battle arena background for "Pico de la Cumbre": diagonal camera perspective on a frozen glacier summit plateau at night. COMPOSITION LOCK: Clear flat dark ice and snow ground in the bottom-left foreground (player position) and clear flat glacial rock shelf in the upper-right midground (enemy position), framed by jagged blue ice crystals, swirling frost mist, and dark aurora sky at the top. Authentic 16-bit / 32-bit pixel art battleground (Octopath Traveler / Chrono Trigger battle screen style), crisp pixel edges, dark atmospheric contrast, no characters, no monsters, no text, no UI, 16:9 widescreen (800x450).
```

---

## 6. Prompts para los 4 Objetos del Bazar (`apps/web/public/assets/objetos/`)

- **Formato:** `.webp` cuadrado **`256x256 px`**, fondo transparente.

1. **`talisman-basico.webp` (Talismán Básico de Captura):**
   ```text
   16-bit dark fantasy RPG pixel art item icon of an ancient bronze and iron runic capture talisman orb etched with glowing cyan sigils, crisp pixel edges, hand-crafted pixel shading, centered on a solid pitch-black background (#000000) for transparency, no text, no UI, 1:1 square.
   ```
2. **`talisman-avanzado.webp` (Talismán Avanzado de Captura):**
   ```text
   16-bit dark fantasy RPG pixel art item icon of an ornate masterwork obsidian and gold arcane capture talisman core radiating intense purple and golden lightning runes, crisp pixel edges, hand-crafted pixel shading, centered on a solid pitch-black background (#000000) for transparency, no text, no UI, 1:1 square.
   ```
3. **`pocion-menor.webp` (Poción de Curación Menor):**
   ```text
   16-bit dark fantasy RPG pixel art item icon of a small medieval glass alchemical vial corked with leather, filled with glowing emerald-green healing elixir, crisp pixel edges, hand-crafted pixel shading, centered on a solid pitch-black background (#000000) for transparency, no text, no UI, 1:1 square.
   ```
4. **`pocion-mayor.webp` (Poción de Curación Mayor):**
   ```text
   16-bit dark fantasy RPG pixel art item icon of an ornate crystal alchemical flask reinforced with gold filigree, filled with radiant ruby-gold restorative elixir and sparkles, crisp pixel edges, hand-crafted pixel shading, centered on a solid pitch-black background (#000000) for transparency, no text, no UI, 1:1 square.
   ```
