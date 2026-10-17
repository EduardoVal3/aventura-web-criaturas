export interface MovimientoCanonico {
  nombre: string;
  nombreOriginal: string;
  tipoAccion: 'Ataque melé' | 'Ataque a distancia' | 'Estado';
  poder: number;
  slot: number;
  efecto: 'QUEMADURA' | 'VENENO' | 'ESCARCHA' | 'PARALISIS' | 'PETRIFICACION' | 'BASTION' | null;
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
export const BESTIARIO: EspecieCanonica[] = [
  // --- ZON-01: Praderas del Amanecer ---
  {
    idExterno: 'srd-2024_wolf',
    slug: 'lobo-gris',
    nombre: 'Lobo Gris',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Cazador en manada ágil y coordinado que habita en llanuras y bosques.',
    statsBase: { hpBase: 32, ataqueBase: 38, defensaBase: 33, velocidadBase: 37 }, // Presupuesto = 140
    movimientos: [
      { nombre: 'Mordisco Veloz', nombreOriginal: 'Bite', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Embestida de Manada', nombreOriginal: 'Pack Pounce', tipoAccion: 'Ataque melé', poder: 10.0, slot: 2, efecto: null },
      { nombre: 'Aullido de Manada', nombreOriginal: 'Pack Howl', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'BASTION' },
      { nombre: 'Furia del Alfa', nombreOriginal: 'Alpha Fury', tipoAccion: 'Ataque melé', poder: 15.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_axe-beak',
    slug: 'pico-de-hacha',
    nombre: 'Pico de Hacha',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Ave corredora de gran tamaño con un pico masivo capaz de cortar madera y hueso.',
    statsBase: { hpBase: 34, ataqueBase: 38, defensaBase: 32, velocidadBase: 40 }, // Presupuesto = 144
    movimientos: [
      { nombre: 'Picotazo Certero', nombreOriginal: 'Beak Strike', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Hachazo de Pico', nombreOriginal: 'Axe Beak', tipoAccion: 'Ataque melé', poder: 10.5, slot: 2, efecto: null },
      { nombre: 'Graznido Aturdidor', nombreOriginal: 'Stunning Squawk', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Estampida Cortante', nombreOriginal: 'Cleaving Stampede', tipoAccion: 'Ataque melé', poder: 15.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_giant-wolf-spider',
    slug: 'arana-lobo-gigante',
    nombre: 'Araña Lobo Gigante',
    tipo: 'beast',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Arácnido cazador que acecha entre matorrales y cuevas sombrías.',
    statsBase: { hpBase: 36, ataqueBase: 40, defensaBase: 36, velocidadBase: 36 }, // Presupuesto = 148
    movimientos: [
      { nombre: 'Mordisco Rápido', nombreOriginal: 'Quick Bite', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Embestida Reptante', nombreOriginal: 'Crawling Lunge', tipoAccion: 'Ataque melé', poder: 10.0, slot: 2, efecto: null },
      { nombre: 'Telaraña Ponzoñosa', nombreOriginal: 'Poisonous Web', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'VENENO' },
      { nombre: 'Cacería Venenosa', nombreOriginal: 'Venomous Hunt', tipoAccion: 'Ataque melé', poder: 15.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_cockatrice',
    slug: 'cocatriza',
    nombre: 'Cocatriza',
    tipo: 'monstrosity',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Criatura aberrante con cuerpo de gallo y cola serpentina que petrifica con su tacto.',
    statsBase: { hpBase: 40, ataqueBase: 36, defensaBase: 39, velocidadBase: 40 }, // Presupuesto = 155
    movimientos: [
      { nombre: 'Picoteo', nombreOriginal: 'Peck', tipoAccion: 'Ataque melé', poder: 4.5, slot: 1, efecto: null },
      { nombre: 'Aleteo Ponzoñoso', nombreOriginal: 'Venomous Flap', tipoAccion: 'Ataque melé', poder: 9.5, slot: 2, efecto: null },
      { nombre: 'Roce Petrificante', nombreOriginal: 'Petrifying Touch', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'PETRIFICACION' },
      { nombre: 'Mirada de Piedra', nombreOriginal: 'Stone Gaze', tipoAccion: 'Ataque a distancia', poder: 16.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_dire-wolf',
    slug: 'lobo-huargo',
    nombre: 'Lobo Huargo',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Depredador primitivo de tamaño descomunal y mandíbulas devastadoras.',
    statsBase: { hpBase: 50, ataqueBase: 70, defensaBase: 46, velocidadBase: 58 }, // Presupuesto = 224
    movimientos: [
      { nombre: 'Mordisco Feroz', nombreOriginal: 'Fierce Bite', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Derribo Brutal', nombreOriginal: 'Brutal Takedown', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Postura de Cazador', nombreOriginal: 'Hunter Stance', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'BASTION' },
      { nombre: 'Furia del Huargo', nombreOriginal: 'Dire Fury', tipoAccion: 'Ataque melé', poder: 17.5, slot: 4, efecto: null },
    ],
  },

  // --- ZON-02: Bosque Susurrante ---
  {
    idExterno: 'srd-2024_black-bear',
    slug: 'oso-negro',
    nombre: 'Oso Negro',
    tipo: 'beast',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Mamífero robusto de los bosques con garras afiladas y fuerza respetable.',
    statsBase: { hpBase: 46, ataqueBase: 48, defensaBase: 36, velocidadBase: 30 }, // Presupuesto = 160
    movimientos: [
      { nombre: 'Zarpazo', nombreOriginal: 'Claw Swipe', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Abrazo de Oso', nombreOriginal: 'Bear Hug', tipoAccion: 'Ataque melé', poder: 10.5, slot: 2, efecto: null },
      { nombre: 'Rugido Intimidante', nombreOriginal: 'Intimidating Roar', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'BASTION' },
      { nombre: 'Furia del Plantígrado', nombreOriginal: 'Plantigrade Fury', tipoAccion: 'Ataque melé', poder: 16.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_boar',
    slug: 'jabali-salvaje',
    nombre: 'Jabalí Salvaje',
    tipo: 'beast',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Fiera de matorral con colmillos curvos y una tenacidad implacable al embestir.',
    statsBase: { hpBase: 44, ataqueBase: 46, defensaBase: 38, velocidadBase: 36 }, // Presupuesto = 164
    movimientos: [
      { nombre: 'Colmillazo', nombreOriginal: 'Tusk Strike', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Embestida Salvaje', nombreOriginal: 'Wild Charge', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Piel Endurecida', nombreOriginal: 'Hardened Hide', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'BASTION' },
      { nombre: 'Carga Imparable', nombreOriginal: 'Unstoppable Charge', tipoAccion: 'Ataque melé', poder: 16.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_awakened-tree',
    slug: 'arbol-despierto',
    nombre: 'Árbol Despierto',
    tipo: 'plant',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Vegetación colosal imbuida de consciencia mágica y ramas pesadas como arietes.',
    statsBase: { hpBase: 50, ataqueBase: 48, defensaBase: 40, velocidadBase: 30 }, // Presupuesto = 168
    movimientos: [
      { nombre: 'Golpe de Rama', nombreOriginal: 'Branch Strike', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Aplastamiento de Tronco', nombreOriginal: 'Trunk Slam', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Espinas Venenosas', nombreOriginal: 'Poison Thorns', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'VENENO' },
      { nombre: 'Furia del Bosque', nombreOriginal: 'Forest Fury', tipoAccion: 'Ataque melé', poder: 16.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_green-dragon-wyrmling',
    slug: 'draco-verde-cria',
    nombre: 'Draco Verde Cría',
    tipo: 'dragon',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Joven sierpe venenosa de escamas esmeralda y mirada astuta.',
    statsBase: { hpBase: 48, ataqueBase: 50, defensaBase: 42, velocidadBase: 35 }, // Presupuesto = 175
    movimientos: [
      { nombre: 'Mordisco Dracónico', nombreOriginal: 'Draconic Bite', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Zarpazo Escamoso', nombreOriginal: 'Scaly Claw', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Nube Tóxica', nombreOriginal: 'Toxic Cloud', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'VENENO' },
      { nombre: 'Furia del Dragón Verde', nombreOriginal: 'Green Dragon Fury', tipoAccion: 'Ataque a distancia', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_owlbear',
    slug: 'osobuho',
    nombre: 'Osobuho',
    tipo: 'monstrosity',
    elemento: 'natura',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Temible cruce de rapaz y oso, conocido por su temperamento feroz y chillido penetrante.',
    statsBase: { hpBase: 62, ataqueBase: 80, defensaBase: 52, velocidadBase: 56 }, // Presupuesto = 250
    movimientos: [
      { nombre: 'Zarpazo Rapaz', nombreOriginal: 'Raptor Claw', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Abrazo Desgarrador', nombreOriginal: 'Rending Hug', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Chillido Estremecedor', nombreOriginal: 'Shocking Screech', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Furia del Osobuho', nombreOriginal: 'Owlbear Fury', tipoAccion: 'Ataque melé', poder: 18.0, slot: 4, efecto: null },
    ],
  },

  // --- ZON-03: Riberas del Lago Espejo ---
  {
    idExterno: 'srd-2024_plesiosaurus',
    slug: 'quelonio-lacustre',
    nombre: 'Quelonio Lacustre',
    tipo: 'beast',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Reptil acorazado de aguas profundas dotado de un caparazón impenetrable y aletas poderosas.',
    statsBase: { hpBase: 52, ataqueBase: 36, defensaBase: 60, velocidadBase: 32 }, // Presupuesto = 180
    movimientos: [
      { nombre: 'Mordisco de Concha', nombreOriginal: 'Shell Bite', tipoAccion: 'Ataque melé', poder: 4.5, slot: 1, efecto: null },
      { nombre: 'Embestida de Caparazón', nombreOriginal: 'Shell Charge', tipoAccion: 'Ataque melé', poder: 10.0, slot: 2, efecto: null },
      { nombre: 'Resguardo de Caparazón', nombreOriginal: 'Shell Bastion', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'BASTION' },
      { nombre: 'Marea Furiosa', nombreOriginal: 'Raging Tide', tipoAccion: 'Ataque a distancia', poder: 15.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_tiger',
    slug: 'tigre-dientes-sable',
    nombre: 'Tigre Dientes de Sable',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Gran felino prehistórico provisto de colmillos prominentes para apresar presas blindadas.',
    statsBase: { hpBase: 48, ataqueBase: 64, defensaBase: 38, velocidadBase: 34 }, // Presupuesto = 184
    movimientos: [
      { nombre: 'Zarpazo Felino', nombreOriginal: 'Feline Claw', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Colmillos de Sable', nombreOriginal: 'Saber Fangs', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Salto Aplastante', nombreOriginal: 'Pouncing Leap', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Furia del Sable', nombreOriginal: 'Saber Fury', tipoAccion: 'Ataque melé', poder: 16.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_allosaurus',
    slug: 'alosaurio',
    nombre: 'Alosaurio',
    tipo: 'beast',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Terópodo carnívoro de velocidad intimidante y quijadas diseñadas para destrozar carne.',
    statsBase: { hpBase: 54, ataqueBase: 62, defensaBase: 40, velocidadBase: 34 }, // Presupuesto = 190
    movimientos: [
      { nombre: 'Mordisco Saurio', nombreOriginal: 'Saurian Bite', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Embestida Prehistórica', nombreOriginal: 'Prehistoric Charge', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Rugido Ancestral', nombreOriginal: 'Ancient Roar', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'BASTION' },
      { nombre: 'Pisotón Cataclísmico', nombreOriginal: 'Cataclysmic Stomp', tipoAccion: 'Ataque melé', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_water-elemental',
    slug: 'elemental-agua',
    nombre: 'Elemental de Agua',
    tipo: 'elemental',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Vórtice líquido animado capaz de sumergir y arrastrar a sus adversarios.',
    statsBase: { hpBase: 56, ataqueBase: 54, defensaBase: 48, velocidadBase: 37 }, // Presupuesto = 195
    movimientos: [
      { nombre: 'Golpe de Oleaje', nombreOriginal: 'Wave Slam', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Torrente Aplastante', nombreOriginal: 'Crushing Torrent', tipoAccion: 'Ataque a distancia', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Corriente Helada', nombreOriginal: 'Chilled Current', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'ESCARCHA' },
      { nombre: 'Maremoto', nombreOriginal: 'Tidal Wave', tipoAccion: 'Ataque a distancia', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_hydra',
    slug: 'hidra-marismas',
    nombre: 'Hidra de las Marismas',
    tipo: 'monstrosity',
    elemento: 'natura',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Coloso reptiliano de múltiples cabezas voraces y resistencia colosal.',
    statsBase: { hpBase: 78, ataqueBase: 68, defensaBase: 60, velocidadBase: 64 }, // Presupuesto = 270
    movimientos: [
      { nombre: 'Mordisco Múltiple', nombreOriginal: 'Multiple Bite', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Cabezazo Pantanoso', nombreOriginal: 'Swamp Headbutt', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Saliva Corrosiva', nombreOriginal: 'Corrosive Saliva', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'VENENO' },
      { nombre: 'Furia de las Cabezas', nombreOriginal: 'Hydra Head Fury', tipoAccion: 'Ataque melé', poder: 18.0, slot: 4, efecto: null },
    ],
  },

  // --- ZON-04: Paso de los Riscos ---
  {
    idExterno: 'srd-2024_griffon',
    slug: 'grifo',
    nombre: 'Grifo',
    tipo: 'monstrosity',
    elemento: 'luz',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Criatura majestuosa con torso de león y alas de águila que vigila las alturas.',
    statsBase: { hpBase: 48, ataqueBase: 56, defensaBase: 44, velocidadBase: 52 }, // Presupuesto = 200
    movimientos: [
      { nombre: 'Picotazo en Picada', nombreOriginal: 'Dive Peck', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Garra Rapaz', nombreOriginal: 'Raptor Talon', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Chillido Cegador', nombreOriginal: 'Blinding Screech', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Descenso Fulminante', nombreOriginal: 'Fulminant Descent', tipoAccion: 'Ataque melé', poder: 16.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_gargoyle',
    slug: 'gargola',
    nombre: 'Gárgola',
    tipo: 'elemental',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Constructo alado de piedra oscura que acecha inmóvil hasta que su presa se aproxima.',
    statsBase: { hpBase: 50, ataqueBase: 48, defensaBase: 66, velocidadBase: 40 }, // Presupuesto = 204
    movimientos: [
      { nombre: 'Garra de Piedra', nombreOriginal: 'Stone Claw', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Golpe Pétreo', nombreOriginal: 'Petrous Slam', tipoAccion: 'Ataque melé', poder: 10.5, slot: 2, efecto: null },
      { nombre: 'Mirada Pétrea', nombreOriginal: 'Petrous Gaze', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'PETRIFICACION' },
      { nombre: 'Furia Gárgola', nombreOriginal: 'Gargoyle Fury', tipoAccion: 'Ataque melé', poder: 16.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_manticore',
    slug: 'manticora',
    nombre: 'Mantícora',
    tipo: 'monstrosity',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Quimera grotesca con rostro humanoide, cuerpo leonino y cola armada de púas venenosas.',
    statsBase: { hpBase: 52, ataqueBase: 62, defensaBase: 48, velocidadBase: 48 }, // Presupuesto = 210
    movimientos: [
      { nombre: 'Garra Salvaje', nombreOriginal: 'Savage Claw', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Púas de Cola', nombreOriginal: 'Tail Spikes', tipoAccion: 'Ataque a distancia', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Púas Envenenadas', nombreOriginal: 'Poison Spikes', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'VENENO' },
      { nombre: 'Lluvia de Espinas', nombreOriginal: 'Thorn Rain', tipoAccion: 'Ataque a distancia', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_earth-elemental',
    slug: 'elemental-tierra',
    nombre: 'Elemental de Tierra',
    tipo: 'elemental',
    elemento: 'natura',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Masa colosal de roca viva y fango que se desliza por el terreno como pez en el agua.',
    statsBase: { hpBase: 60, ataqueBase: 54, defensaBase: 70, velocidadBase: 31 }, // Presupuesto = 215
    movimientos: [
      { nombre: 'Puñetazo Rocoso', nombreOriginal: 'Rocky Punch', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Derrumbe', nombreOriginal: 'Cave In', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Muro de Roca', nombreOriginal: 'Rock Wall', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'BASTION' },
      { nombre: 'Terremoto', nombreOriginal: 'Earthquake', tipoAccion: 'Ataque melé', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_chimera',
    slug: 'quimera-tricefala',
    nombre: 'Quimera Tricéfala',
    tipo: 'monstrosity',
    elemento: 'fuego',
    esEspecial: true,
    esLegendaria: false,
    descripcion: 'Abominación con cabezas de león, dragón y cabra capaz de asolar cumbres enteras.',
    statsBase: { hpBase: 76, ataqueBase: 80, defensaBase: 68, velocidadBase: 76 }, // Presupuesto = 300
    movimientos: [
      { nombre: 'Mordisco Triple', nombreOriginal: 'Triple Bite', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Cornada de Carnero', nombreOriginal: 'Ram Gore', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Aliento Ígneo', nombreOriginal: 'Fire Breath', tipoAccion: 'Estado', poder: 5.0, slot: 3, efecto: 'QUEMADURA' },
      { nombre: 'Furia Tricéfala', nombreOriginal: 'Tricephalous Fury', tipoAccion: 'Ataque melé', poder: 18.0, slot: 4, efecto: null },
    ],
  },

  // --- ZON-05: Cueva Umbría ---
  {
    idExterno: 'srd-2024_skeleton',
    slug: 'esqueleto-guerrero',
    nombre: 'Esqueleto Guerrero',
    tipo: 'undead',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Restos óseos reanimados por magia nigromántica, armados con espada corta.',
    statsBase: { hpBase: 48, ataqueBase: 54, defensaBase: 68, velocidadBase: 50 }, // Presupuesto = 220
    movimientos: [
      { nombre: 'Tajo de Espada', nombreOriginal: 'Sword Slash', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Estocada Ósea', nombreOriginal: 'Bone Thrust', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Armadura de Huesos', nombreOriginal: 'Bone Armor', tipoAccion: 'Estado', poder: 4.0, slot: 3, efecto: 'BASTION' },
      { nombre: 'Danza Macabra', nombreOriginal: 'Danse Macabre', tipoAccion: 'Ataque melé', poder: 16.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_zombie',
    slug: 'zombi-putrefacto',
    nombre: 'Zombi Putrefacto',
    tipo: 'undead',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Cadáver animado implacable que avanza con resistencia antinatural a la muerte.',
    statsBase: { hpBase: 70, ataqueBase: 56, defensaBase: 50, velocidadBase: 48 }, // Presupuesto = 224
    movimientos: [
      { nombre: 'Zarpazo Putrefacto', nombreOriginal: 'Rotten Claw', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Golpe Pesado', nombreOriginal: 'Heavy Slam', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Aliento Pútrido', nombreOriginal: 'Putrid Breath', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'VENENO' },
      { nombre: 'Furia Insaciable', nombreOriginal: 'Insatiable Fury', tipoAccion: 'Ataque melé', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_ghoul',
    slug: 'necrofago',
    nombre: 'Necrófago',
    tipo: 'undead',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Monstruosidad voraz que merodea cementerios y paraliza a los vivos con sus garras.',
    statsBase: { hpBase: 56, ataqueBase: 62, defensaBase: 50, velocidadBase: 62 }, // Presupuesto = 230
    movimientos: [
      { nombre: 'Mordisco Carroñero', nombreOriginal: 'Scavenger Bite', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Zarpazo Voraz', nombreOriginal: 'Voracious Claw', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Toque Paralizante', nombreOriginal: 'Paralyzing Touch', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Festín Macabro', nombreOriginal: 'Macabre Feast', tipoAccion: 'Ataque melé', poder: 17.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_basilisk',
    slug: 'basilisco',
    nombre: 'Basilisco',
    tipo: 'monstrosity',
    elemento: 'sombra',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Reptil de ocho patas cuya mirada directa transforma la carne en roca sólida.',
    statsBase: { hpBase: 58, ataqueBase: 66, defensaBase: 68, velocidadBase: 43 }, // Presupuesto = 235
    movimientos: [
      { nombre: 'Mordisco Pétreo', nombreOriginal: 'Petrous Bite', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Embestida Reptante', nombreOriginal: 'Crawling Charge', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Mirada Petrificante', nombreOriginal: 'Petrifying Gaze', tipoAccion: 'Estado', poder: 5.0, slot: 3, efecto: 'PETRIFICACION' },
      { nombre: 'Mirada Letal', nombreOriginal: 'Lethal Gaze', tipoAccion: 'Ataque a distancia', poder: 17.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_behir',
    slug: 'behir-abismo',
    nombre: 'Behir del Abismo',
    tipo: 'monstrosity',
    elemento: 'luz',
    esEspecial: true,
    esLegendaria: true,
    descripcion: 'Monstruo serpentino legendario de doce patas que descarga arcos voltaicos letales en las cavernas.',
    statsBase: { hpBase: 94, ataqueBase: 90, defensaBase: 80, velocidadBase: 91 }, // Presupuesto = 355
    movimientos: [
      { nombre: 'Mordisco Serpentino', nombreOriginal: 'Serpentine Bite', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Constricción Abismal', nombreOriginal: 'Abyssal Constriction', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Relámpago Paralizante', nombreOriginal: 'Paralyzing Lightning', tipoAccion: 'Estado', poder: 5.0, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Cataclismo del Abismo', nombreOriginal: 'Abyssal Cataclysm', tipoAccion: 'Ataque a distancia', poder: 21.0, slot: 4, efecto: null },
    ],
  },

  // --- ZON-06: Pico de la Cumbre ---
  {
    idExterno: 'srd-2024_winter-wolf',
    slug: 'lobo-invernal',
    nombre: 'Lobo Invernal',
    tipo: 'monstrosity',
    elemento: 'agua',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Monstruo ártico con inteligencia perversa y aliento glacial que congela a los incautos.',
    statsBase: { hpBase: 56, ataqueBase: 68, defensaBase: 56, velocidadBase: 60 }, // Presupuesto = 240
    movimientos: [
      { nombre: 'Mordisco Gélido', nombreOriginal: 'Gelid Bite', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Zarpazo Glacial', nombreOriginal: 'Glacial Claw', tipoAccion: 'Ataque melé', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Aliento Escarchado', nombreOriginal: 'Frost Breath', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'ESCARCHA' },
      { nombre: 'Ventisca Aullante', nombreOriginal: 'Howling Blizzard', tipoAccion: 'Ataque a distancia', poder: 17.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_animated-armor',
    slug: 'armadura-animada',
    nombre: 'Armadura Animada',
    tipo: 'construct',
    elemento: 'fisico',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Coraza metálica encantada que empuña mandoble y guarda fortalezas olvidadas.',
    statsBase: { hpBase: 58, ataqueBase: 52, defensaBase: 82, velocidadBase: 52 }, // Presupuesto = 244
    movimientos: [
      { nombre: 'Golpe de Armadura', nombreOriginal: 'Armor Slam', tipoAccion: 'Ataque melé', poder: 5.0, slot: 1, efecto: null },
      { nombre: 'Mandoble Férreo', nombreOriginal: 'Iron Greatsword', tipoAccion: 'Ataque melé', poder: 11.0, slot: 2, efecto: null },
      { nombre: 'Postura Acorazada', nombreOriginal: 'Armored Stance', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'BASTION' },
      { nombre: 'Furia de Acero', nombreOriginal: 'Steel Fury', tipoAccion: 'Ataque melé', poder: 17.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_air-elemental',
    slug: 'elemental-aire',
    nombre: 'Elemental de Aire',
    tipo: 'elemental',
    elemento: 'luz',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Vórtice de viento huracanado que golpea con fuerza descomunal y vuela con agilidad suprema.',
    statsBase: { hpBase: 60, ataqueBase: 62, defensaBase: 52, velocidadBase: 76 }, // Presupuesto = 250
    movimientos: [
      { nombre: 'Ráfaga Cortante', nombreOriginal: 'Slashing Gust', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Torbellino', nombreOriginal: 'Whirlwind', tipoAccion: 'Ataque a distancia', poder: 11.5, slot: 2, efecto: null },
      { nombre: 'Descarga Estática', nombreOriginal: 'Static Discharge', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'PARALISIS' },
      { nombre: 'Tormenta Eléctrica', nombreOriginal: 'Thunderstorm', tipoAccion: 'Ataque a distancia', poder: 17.5, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_fire-elemental',
    slug: 'elemental-fuego',
    nombre: 'Elemental de Fuego',
    tipo: 'elemental',
    elemento: 'fuego',
    esEspecial: false,
    esLegendaria: false,
    descripcion: 'Entidad ígnea danzante que consume todo combustible a su paso y causa quemaduras persistentes.',
    statsBase: { hpBase: 62, ataqueBase: 80, defensaBase: 52, velocidadBase: 61 }, // Presupuesto = 255
    movimientos: [
      { nombre: 'Toque Ardiente', nombreOriginal: 'Burning Touch', tipoAccion: 'Ataque melé', poder: 5.5, slot: 1, efecto: null },
      { nombre: 'Explosión Ígnea', nombreOriginal: 'Fiery Burst', tipoAccion: 'Ataque a distancia', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Llamarada Persistente', nombreOriginal: 'Lingering Flare', tipoAccion: 'Estado', poder: 4.5, slot: 3, efecto: 'QUEMADURA' },
      { nombre: 'Erupción', nombreOriginal: 'Eruption', tipoAccion: 'Ataque a distancia', poder: 18.0, slot: 4, efecto: null },
    ],
  },
  {
    idExterno: 'srd-2024_remorhaz',
    slug: 'remorhaz-glaciar',
    nombre: 'Remorhaz Glaciar',
    tipo: 'monstrosity',
    elemento: 'agua',
    esEspecial: true,
    esLegendaria: true,
    descripcion: 'Depredador legendario de los páramos árticos que combina calor incandescente interior con ferocidad glacial.',
    statsBase: { hpBase: 100, ataqueBase: 96, defensaBase: 88, velocidadBase: 96 }, // Presupuesto = 380
    movimientos: [
      { nombre: 'Mordisco Helado', nombreOriginal: 'Frost Bite', tipoAccion: 'Ataque melé', poder: 6.0, slot: 1, efecto: null },
      { nombre: 'Engullir Glacial', nombreOriginal: 'Glacial Swallow', tipoAccion: 'Ataque melé', poder: 12.0, slot: 2, efecto: null },
      { nombre: 'Aura Ártica', nombreOriginal: 'Arctic Aura', tipoAccion: 'Estado', poder: 5.0, slot: 3, efecto: 'ESCARCHA' },
      { nombre: 'Cataclismo Glacial', nombreOriginal: 'Glacial Cataclysm', tipoAccion: 'Ataque a distancia', poder: 22.0, slot: 4, efecto: null },
    ],
  },
];

export const TABLAS_APARICION: AparicionCanonica[] = [
  // --- ZON-01: Praderas del Amanecer (Nivel 1–3) ---
  { zonaId: 'ZON-01', especieSlug: 'lobo-gris', peso: 35, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', especieSlug: 'pico-de-hacha', peso: 35, nivelMinimo: 1, nivelMaximo: 3 },
  { zonaId: 'ZON-01', especieSlug: 'arana-lobo-gigante', peso: 15, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', especieSlug: 'cocatriza', peso: 10, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-01', especieSlug: 'lobo-huargo', peso: 5, nivelMinimo: 3, nivelMaximo: 4 },

  // --- ZON-02: Bosque Susurrante (Nivel 2–4) ---
  { zonaId: 'ZON-02', especieSlug: 'oso-negro', peso: 35, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-02', especieSlug: 'jabali-salvaje', peso: 35, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-02', especieSlug: 'arbol-despierto', peso: 15, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-02', especieSlug: 'draco-verde-cria', peso: 10, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-02', especieSlug: 'osobuho', peso: 5, nivelMinimo: 4, nivelMaximo: 5 },

  // --- ZON-03: Riberas del Lago Espejo (Nivel 3–5) ---
  { zonaId: 'ZON-03', especieSlug: 'quelonio-lacustre', peso: 35, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-03', especieSlug: 'tigre-dientes-sable', peso: 35, nivelMinimo: 3, nivelMaximo: 5 },
  { zonaId: 'ZON-03', especieSlug: 'alosaurio', peso: 15, nivelMinimo: 4, nivelMaximo: 5 },
  { zonaId: 'ZON-03', especieSlug: 'elemental-agua', peso: 10, nivelMinimo: 4, nivelMaximo: 5 },
  { zonaId: 'ZON-03', especieSlug: 'hidra-marismas', peso: 5, nivelMinimo: 5, nivelMaximo: 6 },

  // --- ZON-04: Paso de los Riscos (Nivel 5–7) ---
  { zonaId: 'ZON-04', especieSlug: 'grifo', peso: 35, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', especieSlug: 'gargola', peso: 35, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', especieSlug: 'manticora', peso: 15, nivelMinimo: 6, nivelMaximo: 7 },
  { zonaId: 'ZON-04', especieSlug: 'elemental-tierra', peso: 10, nivelMinimo: 6, nivelMaximo: 7 },
  { zonaId: 'ZON-04', especieSlug: 'quimera-tricefala', peso: 5, nivelMinimo: 7, nivelMaximo: 8 },

  // --- ZON-05: Cueva Umbría (Nivel 7–10) ---
  { zonaId: 'ZON-05', especieSlug: 'esqueleto-guerrero', peso: 35, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', especieSlug: 'zombi-putrefacto', peso: 35, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', especieSlug: 'necrofago', peso: 15, nivelMinimo: 8, nivelMaximo: 9 },
  { zonaId: 'ZON-05', especieSlug: 'basilisco', peso: 10, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-05', especieSlug: 'behir-abismo', peso: 5, nivelMinimo: 9, nivelMaximo: 10 },

  // --- ZON-06: Pico de la Cumbre (Nivel 8–12) ---
  { zonaId: 'ZON-06', especieSlug: 'lobo-invernal', peso: 35, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-06', especieSlug: 'armadura-animada', peso: 35, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-06', especieSlug: 'elemental-aire', peso: 15, nivelMinimo: 9, nivelMaximo: 11 },
  { zonaId: 'ZON-06', especieSlug: 'elemental-fuego', peso: 10, nivelMinimo: 10, nivelMaximo: 11 },
  { zonaId: 'ZON-06', especieSlug: 'remorhaz-glaciar', peso: 5, nivelMinimo: 11, nivelMaximo: 12 },
];
