import type {
  CodigoEstado,
  EstadoActivo,
  EtiquetaEfectividad,
  MovimientoCombate,
  AccionCombate,
} from "../api/ApiJuego";

export const ETIQUETA_EFECTIVIDAD: Record<
  EtiquetaEfectividad,
  string | null
> = Object.freeze({
  VENTAJA: "¡EFICAZ!",
  DESVENTAJA: "RESISTIDO",
  NEUTRAL: null,
});

/**
 * Calcula el número de bloques activos (0 a 10) de la barra de resonancia.
 * 100 % de resonancia produce 10 bloques completos.
 */
export function bloquesResonancia(resonancia = 0): number {
  const acotada = Math.max(0, Math.min(100, Math.floor(resonancia)));
  return Math.floor(acotada / 10);
}

export interface SlotTactico {
  slot: number;
  movimiento: MovimientoCombate | null;
  bloqueado: boolean;
  esInsignia: boolean;
}

/**
 * Construye con determinismo exactamente 4 slots de combate táctico.
 * El slot 4 representa el Movimiento Insignia que se desbloquea al alcanzar 100 % de Resonancia.
 */
export function construirSlotsTacticos(
  movimientos: MovimientoCombate[] = [],
  resonancia = 0,
): SlotTactico[] {
  const slots: SlotTactico[] = [];

  for (let s = 1; s <= 4; s++) {
    const mov = movimientos.find((m) => m.slot === s) ?? movimientos[s - 1] ?? null;
    const esInsignia = s === 4;

    let bloqueado = true;
    if (mov) {
      if (typeof mov.bloqueado === "boolean") {
        bloqueado = mov.bloqueado;
      } else {
        bloqueado = esInsignia ? resonancia < 100 : false;
      }
    }

    slots.push({
      slot: s,
      movimiento: mov,
      bloqueado,
      esInsignia,
    });
  }

  return slots;
}

export type IconoEstadoLucide =
  | "Flame"
  | "Skull"
  | "Snowflake"
  | "Zap"
  | "ShieldAlert"
  | "Shield";

export interface DescripcionEstado {
  codigo: CodigoEstado;
  nombre: string;
  icono: IconoEstadoLucide;
  turnos: number;
  etiqueta: string;
  descripcion: string;
}

const DESCRIPCIONES_BASE_ESTADO: Record<
  CodigoEstado,
  { icono: IconoEstadoLucide; descripcion: string }
> = {
  QUEMADURA: {
    icono: "Flame",
    descripcion: "Daño ígneo residual al final de cada ronda",
  },
  VENENO: {
    icono: "Skull",
    descripcion: "Daño tóxico continuo al final de cada ronda",
  },
  ESCARCHA: {
    icono: "Snowflake",
    descripcion: "Ralentiza el tiempo de reacción y entumece al portador",
  },
  PARALISIS: {
    icono: "Zap",
    descripcion: "Descargas que provocan riesgo de perder el turno de acción",
  },
  PETRIFICACION: {
    icono: "ShieldAlert",
    descripcion: "Endurecimiento pétreo severo que bloquea movimientos",
  },
  BASTION: {
    icono: "Shield",
    descripcion: "Barrera mística protectora que absorbe daño entrante",
  },
};

/**
 * Entrega la representación táctica de un estado alterado para la interfaz retro.
 */
export function describirEstado(estado: EstadoActivo): DescripcionEstado {
  const config = DESCRIPCIONES_BASE_ESTADO[estado.codigo] ?? {
    icono: "ShieldAlert" as IconoEstadoLucide,
    descripcion: "Alteración táctica en combate",
  };

  const turnos = estado.turnosRestantes;
  const etiqueta = `${estado.nombre} (${turnos})`;

  let descripcion = config.descripcion;
  if (estado.codigo === "BASTION" && typeof estado.escudo === "number") {
    descripcion = `${config.descripcion} (${estado.escudo} PV restantes)`;
  }

  return {
    codigo: estado.codigo,
    nombre: estado.nombre,
    icono: config.icono,
    turnos,
    etiqueta,
    descripcion,
  };
}

/**
 * Resuelve el efecto de sonido retro para el impacto de una acción de combate.
 */
export function sonidoDeGolpe(accion?: AccionCombate | null): string {
  if (!accion) return "golpe";
  if (accion.perdioTurno) return "error";
  if (accion.esInsignia) return "furia";
  if (accion.efectividad === "VENTAJA") return "eficaz";
  if (accion.efectividad === "DESVENTAJA") return "resistido";
  return "golpe";
}
