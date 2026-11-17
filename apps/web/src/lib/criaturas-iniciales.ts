/**
 * Definición y estadísticas base de las criaturas iniciales elegibles
 * para los nuevos exploradores en Aethelgard: Sendas y Criaturas.
 */

export interface CriaturaInicialOpcion {
  slug: "lobo-estepario" | "vibora-rocosa" | "cangrejo-abismal";
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
    slug: "lobo-estepario",
    nombre: "Lobo Estepario",
    tipo: "Bestia",
    arquetipo: "Cazador Ágil y Coordinado",
    hpBase: 38,
    ataqueBase: 44,
    defensaBase: 38,
    velocidadBase: 52,
    descripcion:
      "Cazador en manada ágil y coordinado que recorre las praderas abiertas de Aethelgard.",
  },
  {
    slug: "vibora-rocosa",
    nombre: "Víbora Rocosa",
    tipo: "Bestia",
    arquetipo: "Sigilo y Ponzoña",
    hpBase: 32,
    ataqueBase: 48,
    defensaBase: 32,
    velocidadBase: 58,
    descripcion:
      "Sierpe venenosa camuflada entre las rocas calizas del amanecer con ataque punzante.",
  },
  {
    slug: "cangrejo-abismal",
    nombre: "Cangrejo Abismal",
    tipo: "Monstruosidad",
    arquetipo: "Defensa y Coraza Marina",
    hpBase: 44,
    ataqueBase: 42,
    defensaBase: 72,
    velocidadBase: 42,
    descripcion:
      "Crustáceo blindado adaptado a las presiones fangosas y aguas turbias de las marismas.",
  },
];
