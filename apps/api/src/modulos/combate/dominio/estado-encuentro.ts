export const ESTADOS_ENCUENTRO = {
  ACTIVO: 'EN_CURSO',
  VICTORIA: 'VICTORIA',
  DERROTA: 'DERROTA',
  HUIDO: 'HUIDO',
  CAPTURADO: 'CAPTURADO',
} as const;

export type EstadoEncuentro =
  (typeof ESTADOS_ENCUENTRO)[keyof typeof ESTADOS_ENCUENTRO];

const ESTADOS_TERMINALES: readonly string[] = [
  ESTADOS_ENCUENTRO.VICTORIA,
  ESTADOS_ENCUENTRO.DERROTA,
  ESTADOS_ENCUENTRO.HUIDO,
  ESTADOS_ENCUENTRO.CAPTURADO,
];

export function esEstadoTerminal(estado: string): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
