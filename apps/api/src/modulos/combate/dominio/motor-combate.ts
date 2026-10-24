/**
 * Motor puro de combate táctico, afinidades elementales, estados y resonancia.
 * Diseñado conforme a las reglas de Aethelgard (§2.1, §2.2, §2.5, §2.8 y §4).
 * Es autoritativo, determinista y completamente desacoplado de Prisma.
 */

// ============================================================================
// 1. AFINIDADES ELEMENTALES Y DAÑO
// ============================================================================

export const ELEMENTOS = [
  'fisico',
  'fuego',
  'agua',
  'natura',
  'sombra',
  'luz',
] as const;

export type Elemento = (typeof ELEMENTOS)[number];

export type EtiquetaEfectividad = 'VENTAJA' | 'NEUTRAL' | 'DESVENTAJA';

/**
 * Matriz inmutable de afinidades elementales (§3.1).
 * Fila = atacante; Columna = defensor.
 * Valores: ventaja 1.5x, desventaja 0.75x, neutral 1.0x.
 */
const MATRIZ_AFINIDADES_BASE: Record<Elemento, Record<Elemento, number>> = {
  fisico: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 1.0,
    luz: 1.0,
  },
  fuego: {
    fisico: 1.0,
    fuego: 0.75,
    agua: 0.75,
    natura: 1.5,
    sombra: 1.0,
    luz: 1.0,
  },
  agua: {
    fisico: 1.0,
    fuego: 1.5,
    agua: 0.75,
    natura: 0.75,
    sombra: 1.0,
    luz: 1.0,
  },
  natura: {
    fisico: 1.0,
    fuego: 0.75,
    agua: 1.5,
    natura: 0.75,
    sombra: 1.0,
    luz: 1.0,
  },
  sombra: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 0.75,
    luz: 1.5,
  },
  luz: {
    fisico: 1.0,
    fuego: 1.0,
    agua: 1.0,
    natura: 1.0,
    sombra: 1.5,
    luz: 0.75,
  },
};

function congelarMatriz<T extends Record<string, Record<string, number>>>(
  matriz: T,
): Readonly<T> {
  for (const fila of Object.values(matriz)) {
    Object.freeze(fila);
  }
  return Object.freeze(matriz);
}

export const TABLA_AFINIDADES: Readonly<
  Record<Elemento, Readonly<Record<Elemento, number>>>
> = congelarMatriz(MATRIZ_AFINIDADES_BASE);

/**
 * Obtiene el multiplicador de afinidad entre el elemento atacante y el defensor.
 * Si alguno es desconocido o nulo, asume neutralidad (1.0).
 */
// simplificacion: elemento no reconocido o indefinido asume factor neutro 1.0 por compatibilidad con datos legados y mocks.
export function multiplicadorAfinidad(
  atacante?: string | null,
  defensor?: string | null,
): number {
  if (!atacante || !defensor) return 1.0;
  const fila = (TABLA_AFINIDADES as Record<string, Record<string, number>>)[atacante];
  if (!fila) return 1.0;
  return fila[defensor] ?? 1.0;
}

/**
 * Determina la etiqueta textual de efectividad a partir del multiplicador numérico.
 */
export function etiquetaEfectividad(multiplicador: number): EtiquetaEfectividad {
  if (multiplicador > 1.0) return 'VENTAJA';
  if (multiplicador < 1.0) return 'DESVENTAJA';
  return 'NEUTRAL';
}

/**
 * Calcula el daño final según la fórmula de equilibrio del juego (§2.1).
 * danoBruto = floor((ataque / max(1, defensa)) * poder * 0.8 + nivel * 0.5)
 * danoFinal = max(1, danoBruto) -> Cumple INV-04
 */
// simplificacion: factor base 1.0 para compatibilidad con tests unitarios existentes
export function calcularDano(
  ataque: number,
  defensa: number,
  poder: number,
  nivel: number,
  factorVariacion: number = 1.0,
): number {
  const danoBruto = (ataque / Math.max(1, defensa)) * poder * 0.8 + nivel * 0.5;
  const danoConVariacion = Math.floor(danoBruto * factorVariacion);
  return Math.max(1, danoConVariacion); // Cumple INV-04
}

/**
 * Aplica daño al HP respetando el intervalo [0, hpMaximo] (§2.1 e INV-03).
 */
export function aplicarDano(
  hpPrevio: number,
  danoFinal: number,
  hpMaximo: number,
): number {
  return Math.max(0, Math.min(hpMaximo, hpPrevio - danoFinal));
}

/**
 * Calcula el daño final aplicando factor de variación y efectividad elemental (§3.2).
 * Garantiza INV-04 (danoFinal >= 1).
 */
export function calcularDanoElemental(
  ataque: number,
  defensa: number,
  poder: number,
  nivel: number,
  factorVariacion: number = 1.0,
  elementoAtacante?: Elemento | string | null,
  elementoDefensor?: Elemento | string | null,
): number {
  const m = multiplicadorAfinidad(elementoAtacante, elementoDefensor);
  return calcularDano(ataque, defensa, poder, nivel, factorVariacion * m);
}

// ============================================================================
// 2. ESTADOS ALTERADOS Y REGLAS DE CONTROL / DoT
// ============================================================================

export const CODIGOS_ESTADO = [
  'QUEMADURA',
  'VENENO',
  'ESCARCHA',
  'PARALISIS',
  'PETRIFICACION',
  'BASTION',
] as const;

export type CodigoEstado = (typeof CODIGOS_ESTADO)[number];

export interface DefinicionEstado {
  codigo: CodigoEstado;
  nombre: string;
  duracionBase: number;
  aplicaSobre: 'OBJETIVO' | 'PROPIO';
  esBeneficioso: boolean;
}

/**
 * Catálogo inmutable de los 6 estados autoritativos del sistema (§3.3).
 */
export const CATALOGO_ESTADOS: Readonly<
  Record<CodigoEstado, Readonly<DefinicionEstado>>
> = Object.freeze({
  QUEMADURA: Object.freeze({
    codigo: 'QUEMADURA',
    nombre: 'Quemadura',
    duracionBase: 3,
    aplicaSobre: 'OBJETIVO',
    esBeneficioso: false,
  }),
  VENENO: Object.freeze({
    codigo: 'VENENO',
    nombre: 'Veneno',
    duracionBase: 4,
    aplicaSobre: 'OBJETIVO',
    esBeneficioso: false,
  }),
  ESCARCHA: Object.freeze({
    codigo: 'ESCARCHA',
    nombre: 'Escarcha',
    duracionBase: 2,
    aplicaSobre: 'OBJETIVO',
    esBeneficioso: false,
  }),
  PARALISIS: Object.freeze({
    codigo: 'PARALISIS',
    nombre: 'Parálisis',
    duracionBase: 3,
    aplicaSobre: 'OBJETIVO',
    esBeneficioso: false,
  }),
  PETRIFICACION: Object.freeze({
    codigo: 'PETRIFICACION',
    nombre: 'Petrificación',
    duracionBase: 2,
    aplicaSobre: 'OBJETIVO',
    esBeneficioso: false,
  }),
  BASTION: Object.freeze({
    codigo: 'BASTION',
    nombre: 'Bastión',
    duracionBase: 3,
    aplicaSobre: 'PROPIO',
    esBeneficioso: true,
  }),
});

/**
 * Mapeo de claves de efecto existentes en Movimiento/BESTIARIO hacia estados autoritativos.
 * Todos los efectos no listados son informativos (D-6).
 */
export const EFECTO_A_ESTADO: Readonly<Record<string, CodigoEstado>> = Object.freeze({
  QUEMADURA: 'QUEMADURA',
  QUEMADURA_GRAVE: 'QUEMADURA',
  VENENO: 'VENENO',
  VENENO_GRAVE: 'VENENO',
  ENFRIAMIENTO: 'ESCARCHA',
  CONGELACION: 'ESCARCHA',
  LENTITUD: 'ESCARCHA',
  PARALISIS: 'PARALISIS',
  STUN: 'PARALISIS',
  ATURDIMIENTO: 'PARALISIS',
  PETRIFICACION: 'PETRIFICACION',
  PETRIFICACION_LEVE: 'PETRIFICACION',
  BASTION: 'BASTION',
  BARRERA: 'BASTION',
  FORTALEZA: 'BASTION',
  BLOQUEO: 'BASTION',
});

export interface EstadoActivo {
  codigo: CodigoEstado;
  nombre: string;
  turnosRestantes: number;
  escudo?: number;
}

export interface EstadoLadoBatalla {
  criaturaId?: string;
  resonancia: number;
  estados: EstadoActivo[];
  inmunidades: CodigoEstado[];
}

export interface EstadoBatalla {
  aliada: EstadoLadoBatalla;
  rival: EstadoLadoBatalla;
}

/**
 * Genera una estructura de estado vacía.
 */
export function estadoVacio(criaturaAliadaId?: string): EstadoBatalla {
  return {
    aliada: {
      criaturaId: criaturaAliadaId,
      resonancia: 0,
      estados: [],
      inmunidades: [],
    },
    rival: {
      resonancia: 0,
      estados: [],
      inmunidades: [],
    },
  };
}

function sanitizarLado(
  lado: unknown,
  criaturaIdEsperada?: string,
  esAliada = false,
): EstadoLadoBatalla {
  if (!lado || typeof lado !== 'object') {
    return {
      criaturaId: criaturaIdEsperada,
      resonancia: 0,
      estados: [],
      inmunidades: [],
    };
  }

  const l = lado as Record<string, unknown>;
  const criaturaId = typeof l.criaturaId === 'string' ? l.criaturaId : criaturaIdEsperada;

  // D-11: si la aliada cambió, reiniciar estado de la aliada
  if (esAliada && criaturaIdEsperada && l.criaturaId && l.criaturaId !== criaturaIdEsperada) {
    return {
      criaturaId: criaturaIdEsperada,
      resonancia: 0,
      estados: [],
      inmunidades: [],
    };
  }

  const rawResonancia =
    typeof l.resonancia === 'number' && !Number.isNaN(l.resonancia) ? l.resonancia : 0;
  const resonancia = Math.max(0, Math.min(100, Math.round(rawResonancia)));

  const estados: EstadoActivo[] = [];
  if (Array.isArray(l.estados)) {
    for (const item of l.estados) {
      if (item && typeof item === 'object') {
        const codigo = (item as Record<string, unknown>).codigo;
        if (typeof codigo === 'string' && codigo in CATALOGO_ESTADOS) {
          const cod = codigo as CodigoEstado;
          const turnosRaw =
            typeof (item as Record<string, unknown>).turnosRestantes === 'number'
              ? (item as Record<string, unknown>).turnosRestantes
              : 1;
          const turnosRestantes = Math.max(1, Math.round(turnosRaw as number));
          const def = CATALOGO_ESTADOS[cod];
          const est: EstadoActivo = {
            codigo: cod,
            nombre: def.nombre,
            turnosRestantes,
          };
          if (cod === 'BASTION') {
            const rawEscudo =
              typeof (item as Record<string, unknown>).escudo === 'number'
                ? (item as Record<string, unknown>).escudo
                : 0;
            est.escudo = Math.max(1, Math.round(rawEscudo as number));
          }
          estados.push(est);
        }
      }
    }
  }

  const inmunidades: CodigoEstado[] = [];
  if (Array.isArray(l.inmunidades)) {
    for (const item of l.inmunidades) {
      if (
        typeof item === 'string' &&
        item in CATALOGO_ESTADOS &&
        !inmunidades.includes(item as CodigoEstado)
      ) {
        inmunidades.push(item as CodigoEstado);
      }
    }
  }

  return {
    criaturaId,
    resonancia,
    estados,
    inmunidades,
  };
}

/**
 * Valida y reconstruye el snapshot de combate desde JSON de BD (frontera de confianza).
 */
export function leerEstadoBatalla(
  detalleJson: unknown,
  criaturaAliadaId?: string,
): EstadoBatalla {
  if (!detalleJson) return estadoVacio(criaturaAliadaId);

  let raw = detalleJson;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return estadoVacio(criaturaAliadaId);
    }
  }

  if (!raw || typeof raw !== 'object') {
    return estadoVacio(criaturaAliadaId);
  }

  const estadoBatallaRaw = (raw as Record<string, unknown>).estadoBatalla ?? raw;
  if (!estadoBatallaRaw || typeof estadoBatallaRaw !== 'object') {
    return estadoVacio(criaturaAliadaId);
  }

  const eb = estadoBatallaRaw as Record<string, unknown>;
  return {
    aliada: sanitizarLado(eb.aliada, criaturaAliadaId, true),
    rival: sanitizarLado(eb.rival, undefined, false),
  };
}

/**
 * Calcula la defensa efectiva considerando estados como PETRIFICACION (§3.3).
 */
export function defensaEfectiva(
  defensaBase: number,
  estados: EstadoActivo[],
): number {
  const tienePetrificacion = estados.some((e) => e.codigo === 'PETRIFICACION');
  if (tienePetrificacion) {
    return Math.floor(1.5 * defensaBase);
  }
  return defensaBase;
}

/**
 * Calcula la velocidad efectiva considerando estados como ESCARCHA (§3.3).
 */
export function velocidadEfectiva(
  velocidadBase: number,
  estados: EstadoActivo[],
): number {
  const tieneEscarcha = estados.some((e) => e.codigo === 'ESCARCHA');
  if (tieneEscarcha) {
    return Math.max(1, Math.floor(0.5 * velocidadBase));
  }
  return velocidadBase;
}

/**
 * Calcula el daño DoT por ronda de un estado activo (§3.3).
 */
export function calcularDot(codigo: CodigoEstado, hpMaximo: number): number {
  if (codigo === 'QUEMADURA') {
    return Math.max(1, Math.floor(0.08 * hpMaximo));
  }
  if (codigo === 'VENENO') {
    return Math.max(1, Math.floor(0.06 * hpMaximo));
  }
  return 0;
}

/**
 * Aplica daño DoT respetando D-4 (no letal, mínimo 1 PV) e INV-03.
 */
// simplificacion: DoT no letal; respeta D-4 nunca bajando de 1 PV para mantener INV-03 y favorecer captura
export function aplicarDot(hpActual: number, dot: number): number {
  if (hpActual <= 1) return 1;
  return Math.max(1, hpActual - dot);
}

/**
 * Absorbe daño directo mediante escudo (BASTION) antes de reducir PV (§3.3).
 */
export function absorberConEscudo(
  dano: number,
  estados: EstadoActivo[],
): {
  danoRestante: number;
  danoAbsorbido: number;
  estadosActualizados: EstadoActivo[];
} {
  const indiceBastion = estados.findIndex((e) => e.codigo === 'BASTION');
  if (indiceBastion === -1) {
    return {
      danoRestante: dano,
      danoAbsorbido: 0,
      estadosActualizados: [...estados],
    };
  }

  const bastion = estados[indiceBastion];
  const escudoActual = bastion.escudo ?? 0;
  const danoAbsorbido = Math.min(escudoActual, dano);
  const danoRestante = dano - danoAbsorbido;
  const escudoRestante = escudoActual - danoAbsorbido;

  const estadosActualizados: EstadoActivo[] = [];
  for (let i = 0; i < estados.length; i++) {
    if (i === indiceBastion) {
      if (escudoRestante > 0) {
        estadosActualizados.push({
          ...bastion,
          escudo: escudoRestante,
        });
      }
    } else {
      estadosActualizados.push(estados[i]);
    }
  }

  return {
    danoRestante,
    danoAbsorbido,
    estadosActualizados,
  };
}

/**
 * Determina si la criatura tiene algún estado perjudicial activo (excluye BASTION).
 */
export function tieneEstadoAlterado(estados: EstadoActivo[]): boolean {
  return estados.some((e) => e.codigo !== 'BASTION');
}

/**
 * Aplica o refresca un estado alterado sobre la lista de estados de un combatiente (§3.3, D-5, D-7).
 */
export function aplicarEstado(
  estados: EstadoActivo[],
  inmunidades: CodigoEstado[],
  codigo: CodigoEstado,
  hpMaximo: number,
  esInsignia: boolean = false,
): {
  aplicado: boolean;
  estados: EstadoActivo[];
  motivo?: 'INMUNE';
} {
  if (inmunidades.includes(codigo)) {
    return { aplicado: false, estados: [...estados], motivo: 'INMUNE' };
  }

  const def = CATALOGO_ESTADOS[codigo];
  const duracion = def.duracionBase + (esInsignia ? 1 : 0);
  const escudo =
    codigo === 'BASTION' ? Math.max(1, Math.floor(0.15 * hpMaximo)) : undefined;

  const indiceExistente = estados.findIndex((e) => e.codigo === codigo);
  if (indiceExistente >= 0) {
    const copia = [...estados];
    const existente = copia[indiceExistente];
    copia[indiceExistente] = {
      ...existente,
      turnosRestantes: Math.max(existente.turnosRestantes, duracion),
      ...(codigo === 'BASTION' ? { escudo } : {}),
    };
    return { aplicado: true, estados: copia };
  }

  const nuevoEstado: EstadoActivo = {
    codigo,
    nombre: def.nombre,
    turnosRestantes: duracion,
    ...(escudo !== undefined ? { escudo } : {}),
  };

  return {
    aplicado: true,
    estados: [...estados, nuevoEstado],
  };
}
