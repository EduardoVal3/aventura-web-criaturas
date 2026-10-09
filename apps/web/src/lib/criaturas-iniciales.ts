/**
 * Definición y estadísticas base de las criaturas iniciales elegibles
 * para los nuevos exploradores en Aethelgard: Sendas y Criaturas.
 */

export interface CriaturaInicialOpcion {
  slug: "lobo-gris" | "pico-de-hacha" | "arana-lobo-gigante";
  nombre: string;
  tipo: string;
  arquetipo: string;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  descripcion: string;
}

export const OPCIONES_CRIATURAS: CriaturaInicialOpcion[] = [
  {
    slug: "lobo-gris",
    nombre: "Lobo Gris",
    tipo: "Bestia",
    arquetipo: "Defensa y Aguante",
    hpBase: 30,
    ataqueBase: 42,
    defensaBase: 58,
    velocidadBase: 50,
    descripcion:
      "Fiel cazador de manada. Posee gran resistencia física y defensas sólidas para resistir embestidas.",
  },
  {
    slug: "pico-de-hacha",
    nombre: "Pico de Hacha",
    tipo: "Bestia",
    arquetipo: "Equilibrado y Ágil",
    hpBase: 19,
    ataqueBase: 42,
    defensaBase: 51,
    velocidadBase: 60,
    descripcion:
      "Ave veloz de las planicies con un impacto cortante certero y zancada implacable.",
  },
  {
    slug: "arana-lobo-gigante",
    nombre: "Araña Lobo Gigante",
    tipo: "Bestia",
    arquetipo: "Velocidad e Iniciativa",
    hpBase: 11,
    ataqueBase: 44,
    defensaBase: 48,
    velocidadBase: 65,
    descripcion:
      "Depredadora nocturna de reflejos fulgurantes, alta iniciativa táctica y mordedura letal.",
  },
];
