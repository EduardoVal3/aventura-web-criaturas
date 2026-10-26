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
  claseEstilo: string;
}

export const ESTILOS_ESTADO: Record<CodigoEstado, string> = {
  QUEMADURA: "border-red-500/80 text-red-400 bg-red-500/15",
  VENENO: "border-emerald-500/80 text-emerald-400 bg-emerald-500/15",
  ESCARCHA: "border-cyan-500/80 text-cyan-400 bg-cyan-500/15",
  PARALISIS: "border-amber-400/80 text-amber-300 bg-amber-400/15",
  PETRIFICACION: "border-stone-400/80 text-stone-300 bg-stone-500/25",
  BASTION: "border-blue-400/80 text-blue-300 bg-blue-500/15",
};

const DESCRIPCIONES_BASE_ESTADO: Record<
  CodigoEstado,
  { icono: IconoEstadoLucide; descripcion: string; claseEstilo: string }
> = {
  QUEMADURA: {
    icono: "Flame",
    descripcion: "Daño ígneo residual al final de cada ronda",
    claseEstilo: ESTILOS_ESTADO.QUEMADURA,
  },
  VENENO: {
    icono: "Skull",
    descripcion: "Daño tóxico continuo al final de cada ronda",
    claseEstilo: ESTILOS_ESTADO.VENENO,
  },
  ESCARCHA: {
    icono: "Snowflake",
    descripcion: "Ralentiza el tiempo de reacción y entumece al portador",
    claseEstilo: ESTILOS_ESTADO.ESCARCHA,
  },
  PARALISIS: {
    icono: "Zap",
    descripcion: "Descargas que provocan riesgo de perder el turno de acción",
    claseEstilo: ESTILOS_ESTADO.PARALISIS,
  },
  PETRIFICACION: {
    icono: "ShieldAlert",
    descripcion: "Endurecimiento pétreo severo que bloquea movimientos",
    claseEstilo: ESTILOS_ESTADO.PETRIFICACION,
  },
  BASTION: {
    icono: "Shield",
    descripcion: "Barrera mística protectora que absorbe daño entrante",
    claseEstilo: ESTILOS_ESTADO.BASTION,
  },
};

/**
 * Entrega la representación táctica de un estado alterado para la interfaz retro.
 */
export function describirEstado(estado: EstadoActivo): DescripcionEstado {
  const config = DESCRIPCIONES_BASE_ESTADO[estado.codigo] ?? {
    icono: "ShieldAlert" as IconoEstadoLucide,
    descripcion: "Alteración táctica en combate",
    claseEstilo: "border-muted-foreground/60 text-muted-foreground bg-muted/20",
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
    claseEstilo: config.claseEstilo,
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
  // Estados y variantes de fuego
  QUEMADURA: {
    nombre: "Quemadura",
    icono: "Flame",
    claseEstilo: "border-red-500/80 text-red-400 bg-red-500/15",
  },
  QUEMADURA_GRAVE: {
    nombre: "Quemadura+",
    icono: "Flame",
    claseEstilo: "border-red-500 text-red-300 bg-red-500/25",
  },
  IGNICION: {
    nombre: "Ignición",
    icono: "Flame",
    claseEstilo: "border-orange-500/80 text-orange-400 bg-orange-500/15",
  },
  COMBUSTION: {
    nombre: "Combustión",
    icono: "Flame",
    claseEstilo: "border-red-600/80 text-red-300 bg-red-600/20",
  },
  BOMBARDEO: {
    nombre: "Bombardeo",
    icono: "Flame",
    claseEstilo: "border-amber-600/80 text-amber-400 bg-amber-600/20",
  },
  TRAMPA_FUEGO: {
    nombre: "Trampa Ígnea",
    icono: "Flame",
    claseEstilo: "border-orange-500/80 text-orange-300 bg-orange-500/20",
  },
  CALAMIDAD: {
    nombre: "Calamidad",
    icono: "Flame",
    claseEstilo: "border-rose-600/80 text-rose-300 bg-rose-600/25",
  },
  DEVASTACION_LEGENDARIA: {
    nombre: "Devastación",
    icono: "Flame",
    claseEstilo: "border-amber-500 text-amber-300 bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
  },

  // Estados y variantes de veneno
  VENENO: {
    nombre: "Veneno",
    icono: "Skull",
    claseEstilo: "border-emerald-500/80 text-emerald-400 bg-emerald-500/15",
  },
  VENENO_GRAVE: {
    nombre: "Veneno+",
    icono: "Skull",
    claseEstilo: "border-emerald-400 text-emerald-300 bg-emerald-500/25",
  },

  // Escarcha, frío y agua
  ESCARCHA: {
    nombre: "Escarcha",
    icono: "Snowflake",
    claseEstilo: "border-cyan-500/80 text-cyan-400 bg-cyan-500/15",
  },
  ENFRIAMIENTO: {
    nombre: "Escarcha",
    icono: "Snowflake",
    claseEstilo: "border-cyan-500/80 text-cyan-400 bg-cyan-500/15",
  },
  CONGELACION: {
    nombre: "Congelación",
    icono: "Snowflake",
    claseEstilo: "border-cyan-400 text-cyan-200 bg-cyan-500/25",
  },
  LENTITUD: {
    nombre: "Lentitud",
    icono: "Snowflake",
    claseEstilo: "border-sky-500/80 text-sky-300 bg-sky-500/15",
  },
  MAREJADA: {
    nombre: "Marejada",
    icono: "Snowflake",
    claseEstilo: "border-blue-500/80 text-blue-300 bg-blue-500/20",
  },

  // Rayo, parálisis y aturdimiento
  PARALISIS: {
    nombre: "Parálisis",
    icono: "Zap",
    claseEstilo: "border-amber-400/80 text-amber-300 bg-amber-400/15",
  },
  STUN: {
    nombre: "Aturdimiento",
    icono: "Zap",
    claseEstilo: "border-yellow-400/80 text-yellow-300 bg-yellow-400/15",
  },
  ATURDIMIENTO: {
    nombre: "Aturdimiento",
    icono: "Zap",
    claseEstilo: "border-yellow-400/80 text-yellow-300 bg-yellow-400/15",
  },
  SOBRECARGA_LEGENDARIA: {
    nombre: "Sobrecarga",
    icono: "Sparkles",
    claseEstilo: "border-yellow-300 text-yellow-200 bg-yellow-400/25 shadow-[0_0_8px_rgba(253,224,71,0.3)]",
  },

  // Piedra, tierra y petrificación
  PETRIFICACION: {
    nombre: "Petrificación",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-400/80 text-stone-300 bg-stone-500/25",
  },
  PETRIFICACION_LEVE: {
    nombre: "Petrif. Leve",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-500/70 text-stone-300 bg-stone-500/15",
  },
  SISMICO: {
    nombre: "Sísmico",
    icono: "ShieldAlert",
    claseEstilo: "border-amber-800/80 text-amber-200 bg-amber-900/30",
  },

  // Escudo, protección y defensas
  BASTION: {
    nombre: "Bastión",
    icono: "Shield",
    claseEstilo: "border-blue-400/80 text-blue-300 bg-blue-500/15",
  },
  BARRERA: {
    nombre: "Barrera",
    icono: "Shield",
    claseEstilo: "border-blue-500/80 text-blue-300 bg-blue-500/20",
  },
  FORTALEZA: {
    nombre: "Fortaleza",
    icono: "Shield",
    claseEstilo: "border-indigo-500/80 text-indigo-300 bg-indigo-500/20",
  },
  BLOQUEO: {
    nombre: "Bloqueo",
    icono: "Shield",
    claseEstilo: "border-blue-400/80 text-blue-200 bg-blue-600/20",
  },

  // Modificadores de estadísticas (Buffs)
  ATQ_UP: {
    nombre: "Ataque +",
    icono: "ChevronsUp",
    claseEstilo: "border-red-400/80 text-red-300 bg-red-500/15",
  },
  DEF_UP: {
    nombre: "Defensa +",
    icono: "Shield",
    claseEstilo: "border-sky-400/80 text-sky-300 bg-sky-500/15",
  },
  VEL_UP: {
    nombre: "Velocidad +",
    icono: "Zap",
    claseEstilo: "border-teal-400/80 text-teal-300 bg-teal-500/15",
  },
  EVASION_UP: {
    nombre: "Evasión +",
    icono: "Sparkles",
    claseEstilo: "border-indigo-400/80 text-indigo-300 bg-indigo-500/15",
  },
  REGENERACION: {
    nombre: "Regeneración",
    icono: "HeartPulse",
    claseEstilo: "border-emerald-400/80 text-emerald-300 bg-emerald-500/20",
  },

  // Perjuicios de estadísticas y control (Debuffs)
  ATQ_DOWN: {
    nombre: "Ataque -",
    icono: "ChevronsDown",
    claseEstilo: "border-orange-500/80 text-orange-300 bg-orange-600/15",
  },
  DEF_DOWN: {
    nombre: "Defensa -",
    icono: "ShieldAlert",
    claseEstilo: "border-stone-400/80 text-stone-300 bg-stone-600/20",
  },
  ENREDO: {
    nombre: "Enredo",
    icono: "ShieldAlert",
    claseEstilo: "border-lime-700/80 text-lime-300 bg-lime-900/25",
  },
  CONFUSION: {
    nombre: "Confusión",
    icono: "Sparkles",
    claseEstilo: "border-fuchsia-400/80 text-fuchsia-300 bg-fuchsia-500/20",
  },
  CEGUERA: {
    nombre: "Ceguera",
    icono: "Sparkles",
    claseEstilo: "border-zinc-500/80 text-zinc-300 bg-zinc-700/25",
  },
  MIEDO: {
    nombre: "Miedo",
    icono: "Zap",
    claseEstilo: "border-purple-400/80 text-purple-300 bg-purple-500/20",
  },
  TERROR: {
    nombre: "Terror",
    icono: "Zap",
    claseEstilo: "border-purple-500/80 text-purple-200 bg-purple-700/25",
  },
  CONDENA: {
    nombre: "Condena",
    icono: "Skull",
    claseEstilo: "border-violet-400/80 text-violet-300 bg-violet-600/25",
  },

  // Sacro, luz y purificación
  LUZ: {
    nombre: "Luz",
    icono: "Sparkles",
    claseEstilo: "border-yellow-300/80 text-yellow-200 bg-yellow-400/20",
  },
  PURIFICACION: {
    nombre: "Purificación",
    icono: "Sparkles",
    claseEstilo: "border-yellow-200/90 text-yellow-100 bg-yellow-400/25",
  },

  // Evasión y posicionamiento
  INVISIBILIDAD: {
    nombre: "Invisibilidad",
    icono: "Sparkles",
    claseEstilo: "border-slate-400/80 text-slate-300 bg-slate-600/25",
  },
  DESFASADO: {
    nombre: "Desfasado",
    icono: "Shield",
    claseEstilo: "border-indigo-400/80 text-indigo-300 bg-indigo-600/20",
  },
  DISTANCIA: {
    nombre: "Distancia",
    icono: "Zap",
    claseEstilo: "border-cyan-600/80 text-cyan-300 bg-cyan-700/20",
  },

  // Ataques físicos, sangrado y remate
  CRITICO: {
    nombre: "Crítico",
    icono: "Swords",
    claseEstilo: "border-rose-400/80 text-rose-300 bg-rose-500/20",
  },
  HERIDA: {
    nombre: "Herida",
    icono: "Swords",
    claseEstilo: "border-red-500/80 text-red-300 bg-red-600/20",
  },
  DESGARRO: {
    nombre: "Desgarro",
    icono: "Skull",
    claseEstilo: "border-rose-500/80 text-rose-300 bg-rose-700/25",
  },
  EJECUCION: {
    nombre: "Ejecución",
    icono: "Swords",
    claseEstilo: "border-red-500 text-red-200 bg-red-700/35",
  },
  EMPUJE: {
    nombre: "Empuje",
    icono: "Swords",
    claseEstilo: "border-amber-600/80 text-amber-300 bg-amber-600/20",
  },
  ESPINAS: {
    nombre: "Espinas",
    icono: "ShieldAlert",
    claseEstilo: "border-lime-500/80 text-lime-300 bg-lime-600/20",
  },
  RETRIBUCION: {
    nombre: "Retribución",
    icono: "Shield",
    claseEstilo: "border-amber-500/80 text-amber-200 bg-amber-600/25",
  },
  DRENAJE: {
    nombre: "Drenaje",
    icono: "HeartPulse",
    claseEstilo: "border-purple-400/80 text-purple-300 bg-purple-600/25",
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
