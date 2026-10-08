/**
 * Extremos calibrados según docs/catalogo-criaturas.md §2.1 y Anexo A.3
 */
export const EXTREMOS_CALIBRADOS = {
  HP: { min: 11, max: 184 },
  ATAQUE: { min: 3.5, max: 15.0 },
  DEFENSA: { min: 8, max: 18 },
  VELOCIDAD: { min: 20, max: 90 },
};

export function calcularHpBase(hitPoints: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.HP;
  return Math.round(30 + (70 * (hitPoints - min)) / (max - min));
}

export function calcularAtaqueBase(mejorAtaque: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.ATAQUE;
  return Math.round(30 + (70 * (mejorAtaque - min)) / (max - min));
}

export function calcularDefensaBase(armorClass: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.DEFENSA;
  return Math.round(30 + (70 * (armorClass - min)) / (max - min));
}

export function calcularVelocidadBase(speedMax: number): number {
  const { min, max } = EXTREMOS_CALIBRADOS.VELOCIDAD;
  return Math.round(30 + (70 * (speedMax - min)) / (max - min));
}

export function calcularTasaCaptura(challengeRating: number): number {
  const valor = 0.90 - 0.07 * challengeRating;
  const redondeado = Number(valor.toFixed(2));
  return Math.max(0.10, Math.min(0.90, redondeado));
}

export function extraerLadosDelDado(damageDieType: string): number {
  const match = damageDieType.match(/\d+/);
  return match ? parseInt(match[0], 10) : 6;
}

export function calcularPoderAtaque(
  damageDieCount: number,
  damageDieType: string,
  damageBonus: number | null,
): number {
  const lados = extraerLadosDelDado(damageDieType);
  const promedioDado = lados / 2 + 0.5;
  const bono = damageBonus ?? 0;
  return damageDieCount * promedioDado + bono;
}

export function extraerVelocidadMaxima(speedAll: Record<string, unknown>): number {
  if (!speedAll || typeof speedAll !== 'object') {
    return 30;
  }
  let max = 0;
  for (const [key, value] of Object.entries(speedAll)) {
    if (key !== 'unit' && key !== 'hover' && typeof value === 'number') {
      if (value > max) {
        max = value;
      }
    }
  }
  return max > 0 ? max : 30;
}

/**
 * Diccionario canónico de las 25 especies según docs/catalogo-criaturas.md §2
 */
export const CATALOGO_ESPECIES_PROPENSO: Record<
  string,
  {
    nombre: string;
    slug: string;
    tipo: string;
    esEspecial: boolean;
    descripcion: string;
  }
> = {
  'srd-2024_wolf': {
    nombre: 'Lobo Gris',
    slug: 'lobo-gris',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Cazador en manada ágil y coordinado que habita en llanuras y bosques.',
  },
  'srd-2024_giant-wolf-spider': {
    nombre: 'Araña Lobo Gigante',
    slug: 'arana-lobo-gigante',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Arácnido cazador que acecha entre matorrales y cuevas sombrías.',
  },
  'srd-2024_skeleton': {
    nombre: 'Esqueleto Guerrero',
    slug: 'esqueleto-guerrero',
    tipo: 'undead',
    esEspecial: false,
    descripcion: 'Restos óseos reanimados por magia nigromántica, armados con espada corta.',
  },
  'srd-2024_zombie': {
    nombre: 'Zombi Putrefacto',
    slug: 'zombi-putrefacto',
    tipo: 'undead',
    esEspecial: false,
    descripcion: 'Cadáver reanimado resistente pero lento, impulsado por odio ciego.',
  },
  'srd-2024_axe-beak': {
    nombre: 'Pico de Hacha',
    slug: 'pico-de-hacha',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Ave corredora no voladora dotada de un pico masivo y afilado.',
  },
  'srd-2024_black-bear': {
    nombre: 'Oso Negro',
    slug: 'oso-negro',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Feroz plantígrado territorial con garras cortantes y olfato agudo.',
  },
  'srd-2024_cockatrice': {
    nombre: 'Cocatriza',
    slug: 'cocatriza',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Criatura híbrida de gallo y reptil cuyo picotazo entumece a las víctimas.',
  },
  'srd-2024_dire-wolf': {
    nombre: 'Lobo Huargo',
    slug: 'lobo-huargo',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Variedad masiva de cánido salvaje de mordedura demoledora.',
  },
  'srd-2024_ghoul': {
    nombre: 'Necrófago',
    slug: 'necrofago',
    tipo: 'undead',
    esEspecial: false,
    descripcion: 'Espíritu carroñero cuyas garras inducen una parálisis mortal.',
  },
  'srd-2024_brown-bear': {
    nombre: 'Oso Pardo',
    slug: 'oso-pardo',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Poderoso depredador de gran corpulencia que domina los lagos y valles.',
  },
  'srd-2024_tiger': {
    nombre: 'Tigre Dientes de Sable',
    slug: 'tigre-dientes-de-sable',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Felino prehistórico provisto de colmillos letales y sigilo implacable.',
  },
  'srd-2024_animated-armor': {
    nombre: 'Armadura Animada',
    slug: 'armadura-animada',
    tipo: 'construct',
    esEspecial: false,
    descripcion: 'Coraza de acero encantada para vigilar salas y bastiones olvidados.',
  },
  'srd-2024_allosaurus': {
    nombre: 'Alosaurio',
    slug: 'alosaurio',
    tipo: 'beast',
    esEspecial: false,
    descripcion: 'Bípedo carnívoro de velocidad prodigiosa y mandíbulas descomunales.',
  },
  'srd-2024_awakened-tree': {
    nombre: 'Árbol Despierto',
    slug: 'arbol-despierto',
    tipo: 'plant',
    esEspecial: false,
    descripcion: 'Vegetación ancestral dotada de consciencia y fuerza de contusión.',
  },
  'srd-2024_griffon': {
    nombre: 'Grifo',
    slug: 'grifo',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Majestuosa bestia con cuerpo de león y cabeza y alas de águila.',
  },
  'srd-2024_gargoyle': {
    nombre: 'Gárgola',
    slug: 'gargola',
    tipo: 'elemental',
    esEspecial: false,
    descripcion: 'Centinela alado de roca viva tallado en templos y riscos.',
  },
  'srd-2024_basilisk': {
    nombre: 'Basilisco',
    slug: 'basilisco',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Reptil de ocho patas cuyo mordisco es letal y su mirada petrificante.',
  },
  'srd-2024_owlbear': {
    nombre: 'Osobuho',
    slug: 'osobuho',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Híbrido temible que combina la fuerza del oso con la ferocidad del búho.',
  },
  'srd-2024_manticore': {
    nombre: 'Mantícora',
    slug: 'manticora',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Monstruosidad alada con cola provista de espinas disparables.',
  },
  'srd-2024_werewolf': {
    nombre: 'Hombre Lobo',
    slug: 'hombre-lobo',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Humanoide afligido por la maldición licántropa en forma híbrida feroz.',
  },
  'srd-2024_winter-wolf': {
    nombre: 'Lobo Invernal',
    slug: 'lobo-invernal',
    tipo: 'monstrosity',
    esEspecial: false,
    descripcion: 'Lobo de pelaje blanco y gélido que exhala escarcha en cumbres nevadas.',
  },
  'srd-2024_air-elemental': {
    nombre: 'Elemental de Aire',
    slug: 'elemental-de-aire',
    tipo: 'elemental',
    esEspecial: false,
    descripcion: 'Torbellino consciente de viento huracanado con gran velocidad.',
  },
  'srd-2024_fire-elemental': {
    nombre: 'Elemental de Fuego',
    slug: 'elemental-de-fuego',
    tipo: 'elemental',
    esEspecial: false,
    descripcion: 'Pira viviente que calcina cuanto toca con llamaradas vivas.',
  },
  'srd-2024_chimera': {
    nombre: 'Quimera Tricéfala',
    slug: 'quimera-tricefala',
    tipo: 'monstrosity',
    esEspecial: true,
    descripcion: 'Bestia híbrida alada con cabezas de león, carnero y dragón.',
  },
  'srd-2024_hydra': {
    nombre: 'Hidra de las Marismas',
    slug: 'hidra-de-las-marismas',
    tipo: 'monstrosity',
    esEspecial: true,
    descripcion: 'Coloso reptiliano de múltiples cabezas voraces y resistencia colosal.',
  },
};

/**
 * Tabla de correspondencia oficial de movimientos según docs/catalogo-criaturas.md §3
 */
export const TRADUCCION_MOVIMIENTOS: Record<
  string,
  Record<string, { nombre: string; tipoAccion: string }>
> = {
  'lobo-gris': {
    Bite: { nombre: 'Mordisco Feroz', tipoAccion: 'Ataque melé' },
  },
  'arana-lobo-gigante': {
    Bite: { nombre: 'Mordedura Venenosa', tipoAccion: 'Ataque melé' },
  },
  'esqueleto-guerrero': {
    Shortsword: { nombre: 'Tajo de Espada Corta', tipoAccion: 'Ataque melé' },
    Shortbow: { nombre: 'Disparo de Arco Corto', tipoAccion: 'Ataque distancia' },
  },
  'zombi-putrefacto': {
    Slam: { nombre: 'Golpe Descompuesto', tipoAccion: 'Ataque melé' },
  },
  'pico-de-hacha': {
    Beak: { nombre: 'Picotazo Cortante', tipoAccion: 'Ataque melé' },
  },
  'oso-negro': {
    Rend: { nombre: 'Desgarrón de Garra', tipoAccion: 'Ataque melé' },
  },
  cocatriza: {
    'Petrifying Bite': { nombre: 'Picotazo Petrificante', tipoAccion: 'Ataque melé' },
  },
  'lobo-huargo': {
    Bite: { nombre: 'Quijada Huarga', tipoAccion: 'Ataque melé' },
  },
  necrofago: {
    Bite: { nombre: 'Fauces Cadavéricas', tipoAccion: 'Ataque melé' },
    Claw: { nombre: 'Zarpazo Paralizante', tipoAccion: 'Ataque melé' },
  },
  'oso-pardo': {
    Bite: { nombre: 'Dentellada Brutal', tipoAccion: 'Ataque melé' },
    Claw: { nombre: 'Zarpa Imponente', tipoAccion: 'Ataque melé' },
  },
  'tigre-dientes-de-sable': {
    Rend: { nombre: 'Desgarro Colmillo', tipoAccion: 'Ataque melé' },
  },
  'armadura-animada': {
    Slam: { nombre: 'Impacto de Hierro', tipoAccion: 'Ataque melé' },
  },
  alosaurio: {
    Bite: { nombre: 'Fauces Prehistóricas', tipoAccion: 'Ataque melé' },
    Claws: { nombre: 'Garras Devastadoras', tipoAccion: 'Ataque melé' },
  },
  'arbol-despierto': {
    Slam: { nombre: 'Embestida de Tronco', tipoAccion: 'Ataque melé' },
  },
  grifo: {
    Rend: { nombre: 'Zarpazo Alado', tipoAccion: 'Ataque melé' },
  },
  gargola: {
    Claw: { nombre: 'Garfas de Granito', tipoAccion: 'Ataque melé' },
  },
  basilisco: {
    Bite: { nombre: 'Mordedura de Basilisco', tipoAccion: 'Ataque melé' },
  },
  osobuho: {
    Rend: { nombre: 'Abrazo del Osobuho', tipoAccion: 'Ataque melé' },
  },
  manticora: {
    Rend: { nombre: 'Desgarre Abisal', tipoAccion: 'Ataque melé' },
    'Tail Spike': { nombre: 'Espina de Cola', tipoAccion: 'Ataque distancia' },
  },
  'hombre-lobo': {
    Bite: { nombre: 'Mordisco Licántropo', tipoAccion: 'Ataque melé' },
    Longbow: { nombre: 'Disparo de Arco Largo', tipoAccion: 'Ataque distancia' },
    Scratch: { nombre: 'Arañazo Salvaje', tipoAccion: 'Ataque melé' },
  },
  'lobo-invernal': {
    Bite: { nombre: 'Mordisco Escarchado', tipoAccion: 'Ataque melé' },
  },
  'elemental-de-aire': {
    'Thunderous Slam': { nombre: 'Ráfaga Trueno', tipoAccion: 'Ataque melé' },
  },
  'elemental-de-fuego': {
    Burn: { nombre: 'Toque Abrasador', tipoAccion: 'Ataque melé' },
  },
  'quimera-tricefala': {
    Bite: { nombre: 'Mordisco de Dragón', tipoAccion: 'Ataque melé' },
    Ram: { nombre: 'Cornada de Carnero', tipoAccion: 'Ataque melé' },
    Claw: { nombre: 'Garra de León', tipoAccion: 'Ataque melé' },
  },
  'hidra-de-las-marismas': {
    Bite: { nombre: 'Dentellada Múltiple', tipoAccion: 'Ataque melé' },
  },
};
