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

export type TipoIconoEfecto =
  | "Flame"
  | "Skull"
  | "Snowflake"
  | "Zap"
  | "ShieldAlert"
  | "Shield"
  | "Sparkles"
  | "Swords"
  | "HeartPulse"
  | "ChevronsUp"
  | "ChevronsDown";

export interface BadgeEfectoMovimiento {
  nombre: string;
  icono: TipoIconoEfecto;
  claseEstilo: string;
}

const TABLA_BADGES_EFECTOS: Readonly<
  Record<string, { nombre: string; icono: TipoIconoEfecto; claseEstilo: string }>
> = Object.freeze({
  QUEMADURA: {
    nombre: "Quemadura",
    icono: "Flame",
    claseEstilo: "border-red-500/70 text-red-400 bg-red-500/15",
  },
  QUEMADURA_GRAVE: {
    nombre: "Quemadura+",
    icono: "Flame",
    claseEstilo: "border-red-500/80 text-red-300 bg-red-500/20",
  },
  VENENO: {
    nombre: "Veneno",
    icono: "Skull",
    claseEstilo: "border-emerald-500/70 text-emerald-400 bg-emerald-500/15",
  },
  VENENO_GRAVE: {
    nombre: "Veneno+",
    icono: "Skull",
    claseEstilo: "border-emerald-500/80 text-emerald-300 bg-emerald-500/20",
  },
  ESCARCHA: {
    nombre: "Escarcha",
    icono: "Snowflake",
    claseEstilo: "border-cyan-500/70 text-cyan-400 bg-cyan-500/15",
  },
  ENFRIAMIENTO: {
    nombre: "Escarcha",
    icono: "Snowflake",
    claseEstilo: "border-cyan-500/70 text-cyan-400 bg-cyan-500/15",
  },
  CONGELACION: {
    nombre: "Congelación",
    icono: "Snowflake",
    claseEstilo: "border-cyan-500/80 text-cyan-300 bg-cyan-500/20",
  },
  LENTITUD: {
    nombre: "Lentitud",
    icono: "Snowflake",
    claseEstilo: "border-sky-500/70 text-sky-300 bg-sky-500/15",
  },
  PARALISIS: {
    nombre: "Parálisis",
    icono: "Zap",
    claseEstilo: "border-amber-400/70 text-amber-300 bg-amber-400/15",
  },
  STUN: {
    nombre: "Aturdimiento",
    icono: "Zap",
    claseEstilo: "border-amber-400/70 text-amber-300 bg-amber-400/15",
  },
  ATURDIMIENTO: {
    nombre: "Aturdimiento",
    icono: "Zap",
    claseEstilo: "border-amber-400/70 text-amber-300 bg-amber-400/15",
  },
  PETRIFICACION: {
    nombre: "Petrificación",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-400/70 text-stone-300 bg-stone-500/20",
  },
  PETRIFICACION_LEVE: {
    nombre: "Petrif. Leve",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-400/60 text-stone-300 bg-stone-500/15",
  },
  BASTION: {
    nombre: "Bastión",
    icono: "Shield",
    claseEstilo: "border-blue-400/70 text-blue-300 bg-blue-500/15",
  },
  BARRERA: {
    nombre: "Barrera",
    icono: "Shield",
    claseEstilo: "border-blue-400/70 text-blue-300 bg-blue-500/15",
  },
  FORTALEZA: {
    nombre: "Fortaleza",
    icono: "Shield",
    claseEstilo: "border-blue-400/70 text-blue-300 bg-blue-500/15",
  },
  BLOQUEO: {
    nombre: "Bloqueo",
    icono: "Shield",
    claseEstilo: "border-blue-400/70 text-blue-300 bg-blue-500/15",
  },
  CRITICO: {
    nombre: "Crítico",
    icono: "Swords",
    claseEstilo: "border-rose-400/70 text-rose-300 bg-rose-500/15",
  },
  DRENAJE: {
    nombre: "Drenaje",
    icono: "HeartPulse",
    claseEstilo: "border-purple-400/70 text-purple-300 bg-purple-500/15",
  },
  ATQ_UP: {
    nombre: "Ataque +",
    icono: "ChevronsUp",
    claseEstilo: "border-red-400/70 text-red-300 bg-red-500/15",
  },
  ATQ_DOWN: {
    nombre: "Ataque -",
    icono: "ChevronsDown",
    claseEstilo: "border-orange-400/70 text-orange-300 bg-orange-500/15",
  },
  DEF_UP: {
    nombre: "Defensa +",
    icono: "Shield",
    claseEstilo: "border-sky-400/70 text-sky-300 bg-sky-500/15",
  },
  DEF_DOWN: {
    nombre: "Defensa -",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-400/70 text-stone-300 bg-stone-500/15",
  },
  VEL_UP: {
    nombre: "Velocidad +",
    icono: "Zap",
    claseEstilo: "border-teal-400/70 text-teal-300 bg-teal-500/15",
  },
  EVASION_UP: {
    nombre: "Evasión +",
    icono: "Sparkles",
    claseEstilo: "border-indigo-400/70 text-indigo-300 bg-indigo-500/15",
  },
  EMPUJE: {
    nombre: "Empuje",
    icono: "Swords",
    claseEstilo: "border-amber-500/70 text-amber-300 bg-amber-500/15",
  },
  ESPINAS: {
    nombre: "Espinas",
    icono: "ShieldAlert",
    claseEstilo: "border-lime-500/70 text-lime-300 bg-lime-500/15",
  },
  REGENERACION: {
    nombre: "Regeneración",
    icono: "HeartPulse",
    claseEstilo: "border-emerald-400/70 text-emerald-300 bg-emerald-500/15",
  },
  ENREDO: {
    nombre: "Enredo",
    icono: "Snowflake",
    claseEstilo: "border-amber-600/70 text-amber-300 bg-amber-600/15",
  },
  CONFUSION: {
    nombre: "Confusión",
    icono: "Sparkles",
    claseEstilo: "border-fuchsia-400/70 text-fuchsia-300 bg-fuchsia-500/15",
  },
  CEGUERA: {
    nombre: "Ceguera",
    icono: "Sparkles",
    claseEstilo: "border-zinc-500/70 text-zinc-300 bg-zinc-600/15",
  },
  LUZ: {
    nombre: "Luz",
    icono: "Sparkles",
    claseEstilo: "border-yellow-300/70 text-yellow-200 bg-yellow-400/15",
  },
  PURIFICACION: {
    nombre: "Purificación",
    icono: "Sparkles",
    claseEstilo: "border-yellow-300/70 text-yellow-200 bg-yellow-400/15",
  },
  INVISIBILIDAD: {
    nombre: "Invisibilidad",
    icono: "Sparkles",
    claseEstilo: "border-slate-400/70 text-slate-300 bg-slate-500/15",
  },
  CONDENA: {
    nombre: "Condena",
    icono: "Skull",
    claseEstilo: "border-violet-400/70 text-violet-300 bg-violet-500/15",
  },
  HERIDA: {
    nombre: "Herida",
    icono: "Swords",
    claseEstilo: "border-red-500/70 text-red-300 bg-red-500/15",
  },
  EJECUCION: {
    nombre: "Ejecución",
    icono: "Swords",
    claseEstilo: "border-rose-500/80 text-rose-300 bg-rose-600/25",
  },
  SOBRECARGA_LEGENDARIA: {
    nombre: "Sobrecarga",
    icono: "Sparkles",
    claseEstilo: "border-amber-400 text-amber-300 bg-amber-500/20",
  },
  DEVASTACION_LEGENDARIA: {
    nombre: "Devastación",
    icono: "Flame",
    claseEstilo: "border-orange-400 text-orange-300 bg-orange-500/20",
  },
});

/**
 * simplificacion: Mapeo O(1) con tabla estática de efectos para recuadros de movimiento.
 * Suficiente para todos los efectos del bestiario; si surgen nuevos sufijos, se añade la clave en la tabla.
 */
export function resolverBadgeEfectoMovimiento(
  efecto?: string | null,
  estadoAplicado?: CodigoEstado | null,
): BadgeEfectoMovimiento | null {
  const clave = (efecto || estadoAplicado || "").trim().toUpperCase();
  if (!clave) return null;

  if (clave in TABLA_BADGES_EFECTOS) {
    return TABLA_BADGES_EFECTOS[clave];
  }

  // simplificacion: Capitalizar palabras de efectos no tabulados y asignar icono Sparkles como respaldo seguro.
  const nombreFormateado = clave
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  return {
    nombre: nombreFormateado,
    icono: "Sparkles",
    claseEstilo: "border-pixel text-muted-foreground bg-muted/20",
  };
}
