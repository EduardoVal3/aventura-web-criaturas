export interface MovimientoCanonico {
  nombre: string;
  nombreOriginal: string;
  tipoAccion: 'Ataque melé' | 'Ataque a distancia' | 'Estado';
  poder: number;
  slot: number;
  efecto: string | null;
}

export interface StatsBaseCanonicas {
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
}

export interface EspecieCanonica {
  idExterno: string;
  slug: string;
  nombre: string;
  tipo: string;
  elemento: 'fisico' | 'fuego' | 'agua' | 'natura' | 'sombra' | 'luz';
  esEspecial: boolean;
  esLegendaria: boolean;
  descripcion: string;
  statsBase: StatsBaseCanonicas;
  movimientos: [
    MovimientoCanonico,
    MovimientoCanonico,
    MovimientoCanonico,
    MovimientoCanonico,
  ];
}

export interface AparicionCanonica {
  zonaId: string;
  especieSlug: string;
  peso: number;
  nivelMinimo: number;
  nivelMaximo: number;
}

// simplificacion: la jerarquía de invariantes J-1 a J-3 compara únicamente el presupuesto total de atributos (hp + ataque + defensa + velocidad) y no cada estadística por separado; suficiente para asegurar la progresión monotónica entre zonas de juego, luego si se requiere balance simétrico por atributo individual se deberán calibrar cotas y bandas por estadística.
export function calcularPresupuestoEspecie(stats: StatsBaseCanonicas): number {
  return stats.hpBase + stats.ataqueBase + stats.defensaBase + stats.velocidadBase;
}

export function calcularTasaCapturaPorPresupuesto(presupuesto: number): number {
  const valor = Math.round((1.35 - presupuesto / 300) * 100) / 100;
  return Math.max(0.10, Math.min(0.85, valor));
}

export const BESTIARIO: EspecieCanonica[] = [
  // --- ZON-01: Praderas del Amanecer ---
  {
    idExterno: 'srd-2024_wolf',
    slug: 'lobo-estepario',
    nombre: 'Lobo Estepario',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Cazador en manada ágil y coordinado que recorre las praderas abiertas de Aethelgard.',
    statsBase: { hpBase: 34, ataqueBase: 39, defensaBase: 32, velocidadBase: 45 }, // Presupuesto = 150
    movimientos: [
      { nombre: 'Mordisco', nombreOriginal: 'Bite', tipoAccion: 'Ataque melé', poder: 12, slot: 1, efecto: null },
      { nombre: 'Acometida Ágil', nombreOriginal: 'Agile Pounce', tipoAccion: 'Ataque melé', poder: 14, slot: 2, efecto: 'VEL_UP' },
      { nombre: 'Aullido Estepario', nombreOriginal: 'Steppe Howl', tipoAccion: 'Estado', poder: 10, slot: 3, efecto: 'DEF_DOWN' },
      { nombre: 'Furia de Manada', nombreOriginal: 'Pack Fury', tipoAccion: 'Ataque melé', poder: 24, slot: 4, efecto: 'CRITICO' },
    ],
  },
  {
    idExterno: 'srd-2024_poisonous-snake',
    slug: 'vibora-rocosa',
    nombre: 'Víbora Rocosa',
    tipo: 'beast',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Sierpe venenosa camuflada entre las rocas calizas del amanecer.',
    statsBase: { hpBase: 30, ataqueBase: 42, defensaBase: 30, velocidadBase: 51 }, // Presupuesto = 153
    movimientos: [
      { nombre: 'Picotazo', nombreOriginal: 'Peck Strike', tipoAccion: 'Ataque melé', poder: 11, slot: 1, efecto: null },
      { nombre: 'Mordedura Tóxica', nombreOriginal: 'Toxic Bite', tipoAccion: 'Ataque melé', poder: 14, slot: 2, efecto: 'VENENO' },
      { nombre: 'Constricción', nombreOriginal: 'Constriction', tipoAccion: 'Ataque melé', poder: 16, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Colmillo Pétreo', nombreOriginal: 'Petrous Fang', tipoAccion: 'Ataque melé', poder: 24, slot: 4, efecto: 'VENENO_GRAVE' },
    ],
  },
  {
    idExterno: 'srd-2024_deer',
    slug: 'ciervo-lunar',
    nombre: 'Ciervo Lunar',
    tipo: 'beast',
    elemento: 'luz',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Herbívoro esquivo imbuido por la luz astral que ilumina las sendas nocturnas.',
    statsBase: { hpBase: 46, ataqueBase: 44, defensaBase: 45, velocidadBase: 75 }, // Presupuesto = 210
    movimientos: [
      { nombre: 'Cornada', nombreOriginal: 'Horn Attack', tipoAccion: 'Ataque melé', poder: 11, slot: 1, efecto: null },
      { nombre: 'Pisada Luminosa', nombreOriginal: 'Luminous Stomp', tipoAccion: 'Ataque melé', poder: 13, slot: 2, efecto: 'LUZ' },
      { nombre: 'Destello Lunar', nombreOriginal: 'Lunar Flash', tipoAccion: 'Estado', poder: 16, slot: 3, efecto: 'CEGUERA' },
      { nombre: 'Galope Astral', nombreOriginal: 'Astral Gallop', tipoAccion: 'Ataque melé', poder: 24, slot: 4, efecto: 'PURIFICACION' },
    ],
  },
  {
    idExterno: 'srd-2024_hawk',
    slug: 'halcon-ceniza',
    nombre: 'Halcón Ceniza',
    tipo: 'beast',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Rapaz de plumas incandescentes que vigila los horizontes cálidos desde el cielo.',
    statsBase: { hpBase: 54, ataqueBase: 66, defensaBase: 51, velocidadBase: 90 }, // Presupuesto = 261
    movimientos: [
      { nombre: 'Picotazo Aéreo', nombreOriginal: 'Aerial Peck', tipoAccion: 'Ataque melé', poder: 12, slot: 1, efecto: null },
      { nombre: 'Zarpazo Flamígero', nombreOriginal: 'Flaming Talon', tipoAccion: 'Ataque melé', poder: 15, slot: 2, efecto: 'QUEMADURA' },
      { nombre: 'Picado Veloz', nombreOriginal: 'Swift Dive', tipoAccion: 'Ataque melé', poder: 18, slot: 3, efecto: 'VEL_UP' },
      { nombre: 'Espiral Ígnea', nombreOriginal: 'Fiery Spiral', tipoAccion: 'Ataque a distancia', poder: 26, slot: 4, efecto: 'QUEMADURA' },
    ],
  },
  {
    idExterno: 'srd-2024_black-bear',
    slug: 'oso-fresno',
    nombre: 'Oso Fresno',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Imponente plantígrado guardián de los bosques de fresno y claros de hierba.',
    statsBase: { hpBase: 90, ataqueBase: 82, defensaBase: 83, velocidadBase: 60 }, // Presupuesto = 315
    movimientos: [
      { nombre: 'Zarpazo', nombreOriginal: 'Claw Strike', tipoAccion: 'Ataque melé', poder: 14, slot: 1, efecto: null },
      { nombre: 'Dentellada Fuerte', nombreOriginal: 'Heavy Bite', tipoAccion: 'Ataque melé', poder: 18, slot: 2, efecto: 'ATQ_DOWN' },
      { nombre: 'Abrazo Aplastante', nombreOriginal: 'Crushing Hug', tipoAccion: 'Ataque melé', poder: 20, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Embestida Fresno', nombreOriginal: 'Ash Slam', tipoAccion: 'Ataque melé', poder: 28, slot: 4, efecto: 'STUN' },
    ],
  },

  // --- ZON-02: Marismas del Ocaso ---
  {
    idExterno: 'srd-2024_crab',
    slug: 'cangrejo-abismal',
    nombre: 'Cangrejo Abismal',
    tipo: 'monstrosity',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Crustáceo blindado adaptado a las presiones fangosas y aguas turbias.',
    statsBase: { hpBase: 36, ataqueBase: 35, defensaBase: 56, velocidadBase: 32 }, // Presupuesto = 159
    movimientos: [
      { nombre: 'Pinzazo', nombreOriginal: 'Pincer Strike', tipoAccion: 'Ataque melé', poder: 12, slot: 1, efecto: null },
      { nombre: 'Tenaza Quebradora', nombreOriginal: 'Breaker Claws', tipoAccion: 'Ataque melé', poder: 16, slot: 2, efecto: 'DEF_DOWN' },
      { nombre: 'Coraza Marina', nombreOriginal: 'Marine Shell', tipoAccion: 'Estado', poder: 10, slot: 3, efecto: 'BASTION' },
      { nombre: 'Marejada Abisal', nombreOriginal: 'Abyssal Surge', tipoAccion: 'Ataque a distancia', poder: 26, slot: 4, efecto: 'DRENAJE' },
    ],
  },
  {
    idExterno: 'srd-2024_giant-eel',
    slug: 'anguila-penumbra',
    nombre: 'Anguila Penumbra',
    tipo: 'beast',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Depredador serpentino que se desliza entre sombras acuáticas descargando energía oscura.',
    statsBase: { hpBase: 36, ataqueBase: 41, defensaBase: 34, velocidadBase: 51 }, // Presupuesto = 162
    movimientos: [
      { nombre: 'Latigazo', nombreOriginal: 'Whip Lash', tipoAccion: 'Ataque melé', poder: 13, slot: 1, efecto: null },
      { nombre: 'Descarga Umbría', nombreOriginal: 'Umbral Jolt', tipoAccion: 'Ataque a distancia', poder: 16, slot: 2, efecto: 'PARALISIS' },
      { nombre: 'Deslizamiento', nombreOriginal: 'Shadow Glide', tipoAccion: 'Estado', poder: 12, slot: 3, efecto: 'EVASION_UP' },
      { nombre: 'Vorágine Oscura', nombreOriginal: 'Dark Maelstrom', tipoAccion: 'Ataque a distancia', poder: 27, slot: 4, efecto: 'DRENAJE' },
    ],
  },
  {
    idExterno: 'srd-2024_plesiosaurus',
    slug: 'quelonio-lacustre',
    nombre: 'Quelonio Lacustre',
    tipo: 'beast',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Reptil de cuello estilizado y caparazón robusto que nada con serenidad en aguas lacustres.',
    statsBase: { hpBase: 66, ataqueBase: 46, defensaBase: 69, velocidadBase: 36 }, // Presupuesto = 217
    movimientos: [
      { nombre: 'Mordisco Lacustre', nombreOriginal: 'Lake Bite', tipoAccion: 'Ataque melé', poder: 13, slot: 1, efecto: null },
      { nombre: 'Caparazón Acuático', nombreOriginal: 'Aqua Shell', tipoAccion: 'Estado', poder: 11, slot: 2, efecto: 'BASTION' },
      { nombre: 'Hidroariete', nombreOriginal: 'Hydro Ram', tipoAccion: 'Ataque melé', poder: 18, slot: 3, efecto: 'EMPUJE' },
      { nombre: 'Tsunami Quelonio', nombreOriginal: 'Chelonian Tsunami', tipoAccion: 'Ataque a distancia', poder: 28, slot: 4, efecto: 'DEF_UP' },
    ],
  },
  {
    idExterno: 'srd-2024_reef-shark',
    slug: 'tiburon-arrecife',
    nombre: 'Tiburón Arrecife',
    tipo: 'beast',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Cazador incansable con olfato agudo y mandíbulas serradas adaptadas al arrecife.',
    statsBase: { hpBase: 64, ataqueBase: 79, defensaBase: 56, velocidadBase: 69 }, // Presupuesto = 268
    movimientos: [
      { nombre: 'Dentellada Arrecife', nombreOriginal: 'Reef Bite', tipoAccion: 'Ataque melé', poder: 15, slot: 1, efecto: null },
      { nombre: 'Caza Frenética', nombreOriginal: 'Frenzied Hunt', tipoAccion: 'Estado', poder: 18, slot: 2, efecto: 'ATQ_UP' },
      { nombre: 'Embestida Salina', nombreOriginal: 'Brine Charge', tipoAccion: 'Ataque melé', poder: 20, slot: 3, efecto: 'HERIDA' },
      { nombre: 'Mandíbula Voraz', nombreOriginal: 'Voracious Jaw', tipoAccion: 'Ataque melé', poder: 30, slot: 4, efecto: 'CRITICO' },
    ],
  },
  {
    idExterno: 'srd-2024_giant-sea-horse',
    slug: 'mantarraya-espectral',
    nombre: 'Mantarraya Espectral',
    tipo: 'monstrosity',
    elemento: 'sombra',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Ser abisal etéreo cuyas alas acuáticas proyectan nieblas de perdición y terror.',
    statsBase: { hpBase: 80, ataqueBase: 79, defensaBase: 76, velocidadBase: 90 }, // Presupuesto = 325
    movimientos: [
      { nombre: 'Aguijonazo', nombreOriginal: 'Ghostly Sting', tipoAccion: 'Ataque melé', poder: 16, slot: 1, efecto: null },
      { nombre: 'Vuelo Abisal', nombreOriginal: 'Abyssal Glide', tipoAccion: 'Ataque melé', poder: 19, slot: 2, efecto: 'CONFUSION' },
      { nombre: 'Manto Espectral', nombreOriginal: 'Spectral Cloak', tipoAccion: 'Estado', poder: 15, slot: 3, efecto: 'INVISIBILIDAD' },
      { nombre: 'Tormenta Espectral', nombreOriginal: 'Spectral Tempest', tipoAccion: 'Ataque a distancia', poder: 32, slot: 4, efecto: 'CONDENA' },
    ],
  },

  // --- ZON-03: Bosque Susurrante ---
  {
    idExterno: 'srd-2024_giant-spider',
    slug: 'arana-gigante',
    nombre: 'Araña Gigante',
    tipo: 'beast',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Depredador arácnido que teje trampas invisibles entre el follaje espeso.',
    statsBase: { hpBase: 38, ataqueBase: 46, defensaBase: 36, velocidadBase: 48 }, // Presupuesto = 168
    movimientos: [
      { nombre: 'Picadura Venenosa', nombreOriginal: 'Poison Bite', tipoAccion: 'Ataque melé', poder: 14, slot: 1, efecto: 'VENENO' },
      { nombre: 'Disparo de Telaraña', nombreOriginal: 'Web Shot', tipoAccion: 'Ataque a distancia', poder: 15, slot: 2, efecto: 'ENREDO' },
      { nombre: 'Mordedura Parásita', nombreOriginal: 'Parasitic Bite', tipoAccion: 'Ataque melé', poder: 18, slot: 3, efecto: 'DRENAJE' },
      { nombre: 'Telaraña Mortal', nombreOriginal: 'Deadly Web', tipoAccion: 'Estado', poder: 28, slot: 4, efecto: 'PARALISIS' },
    ],
  },
  {
    idExterno: 'srd-2024_boar',
    slug: 'jabali-espinoso',
    nombre: 'Jabalí Espinoso',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Fiera de colmillos prominentes y lomo armado de púas que embiste sin titubeos.',
    statsBase: { hpBase: 45, ataqueBase: 44, defensaBase: 43, velocidadBase: 39 }, // Presupuesto = 171
    movimientos: [
      { nombre: 'Cornada Espinosa', nombreOriginal: 'Barbed Gore', tipoAccion: 'Ataque melé', poder: 14, slot: 1, efecto: null },
      { nombre: 'Carga Feroz', nombreOriginal: 'Ferocious Charge', tipoAccion: 'Ataque melé', poder: 17, slot: 2, efecto: 'EMPUJE' },
      { nombre: 'Piel Espinosa', nombreOriginal: 'Spiny Hide', tipoAccion: 'Estado', poder: 14, slot: 3, efecto: 'ESPINAS' },
      { nombre: 'Estampida Jabalina', nombreOriginal: 'Boar Stampede', tipoAccion: 'Ataque melé', poder: 28, slot: 4, efecto: 'CRITICO' },
    ],
  },
  {
    idExterno: 'srd-2024_basilisk',
    slug: 'basilisco',
    nombre: 'Basilisco',
    tipo: 'monstrosity',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Reptil de mirada fatal cuya saliva densa y ojos fosforescentes petrifican la carne.',
    statsBase: { hpBase: 60, ataqueBase: 59, defensaBase: 66, velocidadBase: 39 }, // Presupuesto = 224
    movimientos: [
      { nombre: 'Mordedura Petrificante', nombreOriginal: 'Petrifying Bite', tipoAccion: 'Ataque melé', poder: 16, slot: 1, efecto: 'PETRIFICACION_LEVE' },
      { nombre: 'Cola Látigo', nombreOriginal: 'Tail Whip', tipoAccion: 'Ataque melé', poder: 18, slot: 2, efecto: 'DEF_DOWN' },
      { nombre: 'Mirada de Piedra', nombreOriginal: 'Stone Gaze', tipoAccion: 'Estado', poder: 15, slot: 3, efecto: 'LENTITUD' },
      { nombre: 'Mirada Petrificante', nombreOriginal: 'Petrifying Stare', tipoAccion: 'Estado', poder: 32, slot: 4, efecto: 'PETRIFICACION' },
    ],
  },
  {
    idExterno: 'srd-2024_awakened-tree',
    slug: 'treant-anciano',
    nombre: 'Treant Anciano',
    tipo: 'plant',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Árbol colosal despertado por la savia primordial con raíces profundas y ramas como mazas.',
    statsBase: { hpBase: 84, ataqueBase: 68, defensaBase: 81, velocidadBase: 42 }, // Presupuesto = 275
    movimientos: [
      { nombre: 'Tajo de Rama', nombreOriginal: 'Branch Sweep', tipoAccion: 'Ataque melé', poder: 15, slot: 1, efecto: null },
      { nombre: 'Arraigo Boscoso', nombreOriginal: 'Forest Rooting', tipoAccion: 'Estado', poder: 14, slot: 2, efecto: 'REGENERACION' },
      { nombre: 'Embestida de Tronco', nombreOriginal: 'Trunk Slam', tipoAccion: 'Ataque melé', poder: 20, slot: 3, efecto: 'STUN' },
      { nombre: 'Furia Silvestre', nombreOriginal: 'Sylvan Fury', tipoAccion: 'Estado', poder: 30, slot: 4, efecto: 'BARRERA' },
    ],
  },
  {
    idExterno: 'srd-2024_cockatrice',
    slug: 'mantis-sombria',
    nombre: 'Mantis Sombría',
    tipo: 'monstrosity',
    elemento: 'sombra',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Insectoide letal de reflejos fulgurantes cuyas cuchillas cortan el aire en penumbra.',
    statsBase: { hpBase: 76, ataqueBase: 94, defensaBase: 73, velocidadBase: 92 }, // Presupuesto = 335
    movimientos: [
      { nombre: 'Cuchillada Ágil', nombreOriginal: 'Agile Slash', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: null },
      { nombre: 'Golpe Quirúrgico', nombreOriginal: 'Surgical Strike', tipoAccion: 'Ataque melé', poder: 20, slot: 2, efecto: 'CRITICO' },
      { nombre: 'Manto de Sombras', nombreOriginal: 'Cloak of Shadows', tipoAccion: 'Estado', poder: 16, slot: 3, efecto: 'EVASION_UP' },
      { nombre: 'Danza Sombría', nombreOriginal: 'Shadow Dance', tipoAccion: 'Ataque melé', poder: 32, slot: 4, efecto: 'EJECUCION' },
    ],
  },

  // --- ZON-04: Paso de los Riscos ---
  {
    idExterno: 'srd-2024_gargoyle',
    slug: 'gargola',
    nombre: 'Gárgola',
    tipo: 'elemental',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Escultura viviente de granito alado que vigila cornisas y riscos escarpados.',
    statsBase: { hpBase: 43, ataqueBase: 42, defensaBase: 54, velocidadBase: 38 }, // Presupuesto = 177
    movimientos: [
      { nombre: 'Garra de Granito', nombreOriginal: 'Granite Claw', tipoAccion: 'Ataque melé', poder: 16, slot: 1, efecto: null },
      { nombre: 'Picado de Piedra', nombreOriginal: 'Stone Dive', tipoAccion: 'Ataque melé', poder: 19, slot: 2, efecto: 'DEF_DOWN' },
      { nombre: 'Postura de Estatua', nombreOriginal: 'Statue Stance', tipoAccion: 'Estado', poder: 12, slot: 3, efecto: 'FORTALEZA' },
      { nombre: 'Desprendimiento Rocoso', nombreOriginal: 'Rockslide', tipoAccion: 'Ataque melé', poder: 30, slot: 4, efecto: 'STUN' },
    ],
  },
  {
    idExterno: 'srd-2024_skeleton',
    slug: 'esqueleto-guerrero',
    nombre: 'Esqueleto Guerrero',
    tipo: 'undead',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Antiguo combatiente alzado por nigromancia que blande su espada mellada sin descanso.',
    statsBase: { hpBase: 41, ataqueBase: 47, defensaBase: 50, velocidadBase: 42 }, // Presupuesto = 180
    movimientos: [
      { nombre: 'Tajo de Espada', nombreOriginal: 'Sword Slash', tipoAccion: 'Ataque melé', poder: 15, slot: 1, efecto: null },
      { nombre: 'Disparo Óseo', nombreOriginal: 'Bone Shot', tipoAccion: 'Ataque a distancia', poder: 17, slot: 2, efecto: 'DISTANCIA' },
      { nombre: 'Guardia Cadavérica', nombreOriginal: 'Cadaveric Guard', tipoAccion: 'Estado', poder: 13, slot: 3, efecto: 'BLOQUEO' },
      { nombre: 'Segador de Almas', nombreOriginal: 'Soul Reaper', tipoAccion: 'Ataque melé', poder: 28, slot: 4, efecto: 'DRENAJE' },
    ],
  },
  {
    idExterno: 'srd-2024_giant-scorpion',
    slug: 'escorpion-obsidiana',
    nombre: 'Escorpión Obsidiana',
    tipo: 'monstrosity',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Arácnido acorazado con caparazón de roca volcánica y aguijón cargado de fuego líquido.',
    statsBase: { hpBase: 58, ataqueBase: 60, defensaBase: 63, velocidadBase: 50 }, // Presupuesto = 231
    movimientos: [
      { nombre: 'Pinza Ígnea', nombreOriginal: 'Fiery Pincer', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: 'QUEMADURA' },
      { nombre: 'Cola de Obsidiana', nombreOriginal: 'Obsidian Tail', tipoAccion: 'Ataque melé', poder: 21, slot: 2, efecto: 'VENENO' },
      { nombre: 'Coraza Candente', nombreOriginal: 'Searing Shell', tipoAccion: 'Estado', poder: 15, slot: 3, efecto: 'RETRIBUCION' },
      { nombre: 'Aguijón Apocalíptico', nombreOriginal: 'Apocalyptic Sting', tipoAccion: 'Ataque melé', poder: 34, slot: 4, efecto: 'QUEMADURA_GRAVE' },
    ],
  },
  {
    idExterno: 'srd-2024_specter',
    slug: 'espectro-ceniza',
    nombre: 'Espectro Ceniza',
    tipo: 'undead',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Aparición espectral surgida de hogueras extintas que drena el calor vital de sus víctimas.',
    statsBase: { hpBase: 64, ataqueBase: 79, defensaBase: 56, velocidadBase: 83 }, // Presupuesto = 282
    movimientos: [
      { nombre: 'Toque Gélido', nombreOriginal: 'Chilling Touch', tipoAccion: 'Ataque melé', poder: 16, slot: 1, efecto: 'ENFRIAMIENTO' },
      { nombre: 'Alarido Cenizo', nombreOriginal: 'Ash Shrike', tipoAccion: 'Estado', poder: 18, slot: 2, efecto: 'TERROR' },
      { nombre: 'Paso Etéreo', nombreOriginal: 'Ethereal Step', tipoAccion: 'Estado', poder: 14, slot: 3, efecto: 'DESFASADO' },
      { nombre: 'Lamento de Cenizas', nombreOriginal: 'Wail of Ashes', tipoAccion: 'Ataque a distancia', poder: 30, slot: 4, efecto: 'CONDENA' },
    ],
  },
  {
    idExterno: 'srd-2024_animated-armor',
    slug: 'golem-granito',
    nombre: 'Golem Granito',
    tipo: 'construct',
    elemento: 'fisico',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Constructo rúnico forjado en roca viva dotado de blindaje impenetrable y fuerza aplastante.',
    statsBase: { hpBase: 94, ataqueBase: 86, defensaBase: 98, velocidadBase: 67 }, // Presupuesto = 345
    movimientos: [
      { nombre: 'Puñetazo de Granito', nombreOriginal: 'Granite Punch', tipoAccion: 'Ataque melé', poder: 18, slot: 1, efecto: null },
      { nombre: 'Furia de Piedra', nombreOriginal: 'Stone Fury', tipoAccion: 'Ataque melé', poder: 22, slot: 2, efecto: 'STUN' },
      { nombre: 'Blindaje Sísmico', nombreOriginal: 'Seismic Shield', tipoAccion: 'Estado', poder: 16, slot: 3, efecto: 'BASTION' },
      { nombre: 'Terremoto Arcano', nombreOriginal: 'Arcane Quake', tipoAccion: 'Ataque a distancia', poder: 34, slot: 4, efecto: 'SISMICO' },
    ],
  },

  // --- ZON-05: Cueva Umbría / Abismo ---
  {
    idExterno: 'srd-2024_fire-elemental',
    slug: 'elemental-fuego',
    nombre: 'Elemental Fuego',
    tipo: 'elemental',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Columna ígnea danzante que calcina la piedra de los abismos subterráneos.',
    statsBase: { hpBase: 44, ataqueBase: 51, defensaBase: 41, velocidadBase: 50 }, // Presupuesto = 186
    movimientos: [
      { nombre: 'Toque Flamígero', nombreOriginal: 'Flaming Touch', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: 'QUEMADURA' },
      { nombre: 'Llama Viva', nombreOriginal: 'Living Flame', tipoAccion: 'Ataque a distancia', poder: 20, slot: 2, efecto: 'IGNICION' },
      { nombre: 'Vórtice de Ceniza', nombreOriginal: 'Ash Vortex', tipoAccion: 'Estado', poder: 18, slot: 3, efecto: 'CEGUERA' },
      { nombre: 'Piroclasma', nombreOriginal: 'Pyroclasm', tipoAccion: 'Ataque a distancia', poder: 34, slot: 4, efecto: 'COMBUSTION' },
    ],
  },
  {
    idExterno: 'srd-2024_fire-snake',
    slug: 'salamandra-magma',
    nombre: 'Salamandra Magma',
    tipo: 'elemental',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Reptil elemental nacido en pozos de lava que nada en roca fundida con naturalidad.',
    statsBase: { hpBase: 45, ataqueBase: 51, defensaBase: 46, velocidadBase: 47 }, // Presupuesto = 189
    movimientos: [
      { nombre: 'Mordisco Magmático', nombreOriginal: 'Magma Bite', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: null },
      { nombre: 'Coletazo Candente', nombreOriginal: 'Searing Tail', tipoAccion: 'Ataque melé', poder: 19, slot: 2, efecto: 'QUEMADURA' },
      { nombre: 'Foso Ígneo', nombreOriginal: 'Fire Pit', tipoAccion: 'Estado', poder: 18, slot: 3, efecto: 'TRAMPA_FUEGO' },
      { nombre: 'Erupción Magmática', nombreOriginal: 'Magma Eruption', tipoAccion: 'Ataque a distancia', poder: 32, slot: 4, efecto: 'BOMBARDEO' },
    ],
  },
  {
    idExterno: 'srd-2024_nightmare',
    slug: 'pesadilla',
    nombre: 'Pesadilla',
    tipo: 'monstrosity',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Corcel tenebroso con crin de llamas sulfurosas y cascos que prenden el abismo a su paso.',
    statsBase: { hpBase: 57, ataqueBase: 62, defensaBase: 47, velocidadBase: 72 }, // Presupuesto = 238
    movimientos: [
      { nombre: 'Casco Ardiente', nombreOriginal: 'Burning Hoof', tipoAccion: 'Ataque melé', poder: 18, slot: 1, efecto: null },
      { nombre: 'Ráfaga Etérea', nombreOriginal: 'Ethereal Gust', tipoAccion: 'Ataque a distancia', poder: 21, slot: 2, efecto: 'CONFUSION' },
      { nombre: 'Crin de Llamas', nombreOriginal: 'Fiery Mane', tipoAccion: 'Estado', poder: 18, slot: 3, efecto: 'ATQ_UP' },
      { nombre: 'Salto Pesadilla', nombreOriginal: 'Nightmare Pounce', tipoAccion: 'Ataque melé', poder: 34, slot: 4, efecto: 'CONDENA' },
    ],
  },
  {
    idExterno: 'srd-2024_chimera',
    slug: 'quimera-tricefala',
    nombre: 'Quimera Tricéfala',
    tipo: 'monstrosity',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Bestia legendaria con cabezas de león, cabra y dragón que asola cuevas y riscos.',
    statsBase: { hpBase: 73, ataqueBase: 82, defensaBase: 66, velocidadBase: 68 }, // Presupuesto = 289
    movimientos: [
      { nombre: 'Mordisco Dracónico', nombreOriginal: 'Dragon Bite', tipoAccion: 'Ataque melé', poder: 19, slot: 1, efecto: 'QUEMADURA' },
      { nombre: 'Cornada Caprina', nombreOriginal: 'Goat Horn', tipoAccion: 'Ataque melé', poder: 21, slot: 2, efecto: 'EMPUJE' },
      { nombre: 'Zarpazo de León', nombreOriginal: 'Lion Claw', tipoAccion: 'Ataque melé', poder: 23, slot: 3, efecto: 'DESGARRO' },
      { nombre: 'Aliento Tricéfalo', nombreOriginal: 'Tricephalous Breath', tipoAccion: 'Ataque a distancia', poder: 36, slot: 4, efecto: 'CALAMIDAD' },
    ],
  },
  {
    idExterno: 'srd-2024_behir',
    slug: 'behir-abismo',
    nombre: 'Behir del Abismo',
    tipo: 'monstrosity',
    elemento: 'sombra',
    esEspecial: true,
    esLegendaria: true,
    descripcion: 'Monstruo serpentino legendario de doce patas que descarga arcos voltaicos y relámpagos umbríos.',
    statsBase: { hpBase: 94, ataqueBase: 96, defensaBase: 89, velocidadBase: 81 }, // Presupuesto = 360
    movimientos: [
      { nombre: 'Descarga Eléctrica', nombreOriginal: 'Electric Discharge', tipoAccion: 'Ataque a distancia', poder: 20, slot: 1, efecto: 'PARALISIS' },
      { nombre: 'Mordedura Titánica', nombreOriginal: 'Titanic Bite', tipoAccion: 'Ataque melé', poder: 24, slot: 2, efecto: 'CRITICO' },
      { nombre: 'Constricción Relámpago', nombreOriginal: 'Lightning Constriction', tipoAccion: 'Ataque melé', poder: 22, slot: 3, efecto: 'ATURDIMIENTO' },
      { nombre: 'Relámpago del Abismo', nombreOriginal: 'Abyssal Lightning', tipoAccion: 'Ataque a distancia', poder: 38, slot: 4, efecto: 'SOBRECARGA_LEGENDARIA' },
    ],
  },

  // --- ZON-06: Pico de la Cumbre / Glaciar ---
  {
    idExterno: 'srd-2024_yeti',
    slug: 'yeti',
    nombre: 'Yeti',
    tipo: 'monstrosity',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Gigante peludo de las nieves eternas con garras heladas y rugido ensordecedor.',
    statsBase: { hpBase: 50, ataqueBase: 53, defensaBase: 47, velocidadBase: 42 }, // Presupuesto = 192
    movimientos: [
      { nombre: 'Garra Congelada', nombreOriginal: 'Frozen Claw', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: 'ENFRIAMIENTO' },
      { nombre: 'Bramido Polar', nombreOriginal: 'Polar Roar', tipoAccion: 'Estado', poder: 20, slot: 2, efecto: 'MIEDO' },
      { nombre: 'Muro Helado', nombreOriginal: 'Frost Wall', tipoAccion: 'Estado', poder: 18, slot: 3, efecto: 'BARRERA' },
      { nombre: 'Glaciación Brutal', nombreOriginal: 'Brutal Glaciation', tipoAccion: 'Ataque a distancia', poder: 32, slot: 4, efecto: 'CONGELACION' },
    ],
  },
  {
    idExterno: 'srd-2024_winter-wolf',
    slug: 'lobo-invernal',
    nombre: 'Lobo Invernal',
    tipo: 'monstrosity',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Depredador glacial con pelaje blanco y aliento gélido capaz de congelar a sus presas.',
    statsBase: { hpBase: 47, ataqueBase: 51, defensaBase: 45, velocidadBase: 52 }, // Presupuesto = 195
    movimientos: [
      { nombre: 'Mordisco Escarchado', nombreOriginal: 'Rime Bite', tipoAccion: 'Ataque melé', poder: 17, slot: 1, efecto: 'ENFRIAMIENTO' },
      { nombre: 'Aliento de Escarcha', nombreOriginal: 'Frost Breath', tipoAccion: 'Ataque a distancia', poder: 21, slot: 2, efecto: 'LENTITUD' },
      { nombre: 'Caza en Ventisca', nombreOriginal: 'Blizzard Stalk', tipoAccion: 'Estado', poder: 18, slot: 3, efecto: 'VEL_UP' },
      { nombre: 'Ventisca Ártica', nombreOriginal: 'Arctic Blizzard', tipoAccion: 'Ataque a distancia', poder: 34, slot: 4, efecto: 'CONGELACION' },
    ],
  },
  {
    idExterno: 'srd-2024_water-elemental',
    slug: 'elemental-agua',
    nombre: 'Elemental Agua',
    tipo: 'elemental',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Marea viviente de agua ártica que arrastra a sus oponentes con oleajes implacables.',
    statsBase: { hpBase: 68, ataqueBase: 58, defensaBase: 67, velocidadBase: 52 }, // Presupuesto = 245
    movimientos: [
      { nombre: 'Golpe Torrencial', nombreOriginal: 'Torrential Slam', tipoAccion: 'Ataque melé', poder: 18, slot: 1, efecto: null },
      { nombre: 'Corriente Helada', nombreOriginal: 'Frozen Stream', tipoAccion: 'Ataque a distancia', poder: 20, slot: 2, efecto: 'ENFRIAMIENTO' },
      { nombre: 'Manto Acuoso', nombreOriginal: 'Aqueous Mantle', tipoAccion: 'Estado', poder: 16, slot: 3, efecto: 'REGENERACION' },
      { nombre: 'Tsunami Glaciar', nombreOriginal: 'Glacial Tsunami', tipoAccion: 'Ataque a distancia', poder: 34, slot: 4, efecto: 'MAREJADA' },
    ],
  },
  {
    idExterno: 'srd-2024_tiger',
    slug: 'tigre-dientes-sable',
    nombre: 'Tigre Dientes Sable',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Gran felino prehistórico adaptado a la tundra con colmillos curvos capaces de partir hielo.',
    statsBase: { hpBase: 72, ataqueBase: 84, defensaBase: 62, velocidadBase: 78 }, // Presupuesto = 296
    movimientos: [
      { nombre: 'Zarpazo Ártico', nombreOriginal: 'Arctic Slash', tipoAccion: 'Ataque melé', poder: 18, slot: 1, efecto: null },
      { nombre: 'Colmillos Quebradores', nombreOriginal: 'Breaker Fangs', tipoAccion: 'Ataque melé', poder: 23, slot: 2, efecto: 'DEF_DOWN' },
      { nombre: 'Salto Depredador', nombreOriginal: 'Predatory Leap', tipoAccion: 'Ataque melé', poder: 20, slot: 3, efecto: 'ATQ_UP' },
      { nombre: 'Desgarro Glaciar', nombreOriginal: 'Glacial Rend', tipoAccion: 'Ataque melé', poder: 36, slot: 4, efecto: 'CRITICO' },
    ],
  },
  {
    idExterno: 'srd-2024_remorhaz',
    slug: 'remorhaz-glaciar',
    nombre: 'Remorhaz Glaciar',
    tipo: 'monstrosity',
    elemento: 'fuego',
    esEspecial: true,
    esLegendaria: true,
    descripcion: 'Monstruo colosal de los glaciares eternos cuyo núcleo arde con calor infernal mientras camina sobre el hielo.',
    statsBase: { hpBase: 97, ataqueBase: 99, defensaBase: 93, velocidadBase: 86 }, // Presupuesto = 375
    movimientos: [
      { nombre: 'Mordedura Glacial', nombreOriginal: 'Glacial Bite', tipoAccion: 'Ataque melé', poder: 22, slot: 1, efecto: 'ENFRIAMIENTO' },
      { nombre: 'Vapor Hirviente', nombreOriginal: 'Scalding Steam', tipoAccion: 'Ataque a distancia', poder: 26, slot: 2, efecto: 'QUEMADURA' },
      { nombre: 'Placas Candentes', nombreOriginal: 'Searing Plates', tipoAccion: 'Estado', poder: 22, slot: 3, efecto: 'RETRIBUCION' },
      { nombre: 'Cataclismo de Magma y Escarcha', nombreOriginal: 'Cataclysm of Magma and Frost', tipoAccion: 'Ataque a distancia', poder: 40, slot: 4, efecto: 'DEVASTACION_LEGENDARIA' },
    ],
  },
];

export const TABLAS_APARICION: AparicionCanonica[] = [
  // --- ZON-01: Praderas del Amanecer (Nivel 1–3) ---
  { zonaId: 'ZON-01', especieSlug: 'lobo-estepario', peso: 35, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', especieSlug: 'vibora-rocosa', peso: 35, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', especieSlug: 'ciervo-lunar', peso: 15, nivelMinimo: 1, nivelMaximo: 3 },
  { zonaId: 'ZON-01', especieSlug: 'halcon-ceniza', peso: 10, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-01', especieSlug: 'oso-fresno', peso: 5, nivelMinimo: 2, nivelMaximo: 3 },

  // --- ZON-02: Marismas del Ocaso (Nivel 2–4) ---
  { zonaId: 'ZON-02', especieSlug: 'cangrejo-abismal', peso: 35, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-02', especieSlug: 'anguila-penumbra', peso: 35, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-02', especieSlug: 'quelonio-lacustre', peso: 15, nivelMinimo: 2, nivelMaximo: 4 },
  { zonaId: 'ZON-02', especieSlug: 'tiburon-arrecife', peso: 10, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-02', especieSlug: 'mantarraya-espectral', peso: 5, nivelMinimo: 3, nivelMaximo: 4 },

  // --- ZON-03: Bosque Susurrante (Nivel 3–5) ---
  { zonaId: 'ZON-03', especieSlug: 'arana-gigante', peso: 35, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-03', especieSlug: 'jabali-espinoso', peso: 35, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-03', especieSlug: 'basilisco', peso: 15, nivelMinimo: 3, nivelMaximo: 5 },
  { zonaId: 'ZON-03', especieSlug: 'treant-anciano', peso: 10, nivelMinimo: 4, nivelMaximo: 5 },
  { zonaId: 'ZON-03', especieSlug: 'mantis-sombria', peso: 5, nivelMinimo: 4, nivelMaximo: 5 },

  // --- ZON-04: Paso de los Riscos (Nivel 5–7) ---
  { zonaId: 'ZON-04', especieSlug: 'gargola', peso: 35, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', especieSlug: 'esqueleto-guerrero', peso: 35, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', especieSlug: 'escorpion-obsidiana', peso: 15, nivelMinimo: 5, nivelMaximo: 7 },
  { zonaId: 'ZON-04', especieSlug: 'espectro-ceniza', peso: 10, nivelMinimo: 6, nivelMaximo: 7 },
  { zonaId: 'ZON-04', especieSlug: 'golem-granito', peso: 5, nivelMinimo: 6, nivelMaximo: 7 },

  // --- ZON-05: Cueva Umbría / Abismo (Nivel 7–10) ---
  { zonaId: 'ZON-05', especieSlug: 'elemental-fuego', peso: 35, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', especieSlug: 'salamandra-magma', peso: 35, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', especieSlug: 'pesadilla', peso: 15, nivelMinimo: 8, nivelMaximo: 9 },
  { zonaId: 'ZON-05', especieSlug: 'quimera-tricefala', peso: 10, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-05', especieSlug: 'behir-abismo', peso: 5, nivelMinimo: 9, nivelMaximo: 10 },

  // --- ZON-06: Pico de la Cumbre / Glaciar (Nivel 8–12) ---
  { zonaId: 'ZON-06', especieSlug: 'yeti', peso: 35, nivelMinimo: 8, nivelMaximo: 9 },
  { zonaId: 'ZON-06', especieSlug: 'lobo-invernal', peso: 35, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-06', especieSlug: 'elemental-agua', peso: 15, nivelMinimo: 9, nivelMaximo: 11 },
  { zonaId: 'ZON-06', especieSlug: 'tigre-dientes-sable', peso: 10, nivelMinimo: 9, nivelMaximo: 11 },
  { zonaId: 'ZON-06', especieSlug: 'remorhaz-glaciar', peso: 5, nivelMinimo: 10, nivelMaximo: 12 },
];

export const TABLA_APARICION_CANONICA = TABLAS_APARICION;
