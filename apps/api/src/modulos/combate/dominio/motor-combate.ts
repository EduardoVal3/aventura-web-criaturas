/**
 * Motor puro de combate táctico, afinidades elementales, estados y resonancia.
 * Diseñado conforme a las reglas de Aethelgard (§2.1, §2.2, §2.5, §2.8 y §4).
 * Es autoritativo, determinista y completamente desacoplado de Prisma.
 */

import { GeneradorAleatorio } from '../../../comun/azar/generador-aleatorio.interface';

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
 * simplificacion: Mapeo O(1) con tabla inmutable exhaustiva para los 41 efectos de estado del bestiario de BD.
 */
export const EFECTO_A_ESTADO: Readonly<Record<string, CodigoEstado>> = Object.freeze({
  // Quemadura y DoT ígneo
  QUEMADURA: 'QUEMADURA',
  QUEMADURA_GRAVE: 'QUEMADURA',
  IGNICION: 'QUEMADURA',
  COMBUSTION: 'QUEMADURA',
  TRAMPA_FUEGO: 'QUEMADURA',
  BOMBARDEO: 'QUEMADURA',
  DEVASTACION_LEGENDARIA: 'QUEMADURA',
  CALAMIDAD: 'QUEMADURA',

  // Veneno, DoT tóxico y sangrado
  VENENO: 'VENENO',
  VENENO_GRAVE: 'VENENO',
  DESGARRO: 'VENENO',
  HERIDA: 'VENENO',
  CONDENA: 'VENENO',

  // Escarcha, congelación y ralentización
  ENFRIAMIENTO: 'ESCARCHA',
  CONGELACION: 'ESCARCHA',
  LENTITUD: 'ESCARCHA',
  MAREJADA: 'ESCARCHA',

  // Parálisis, aturdimiento y control de turno
  PARALISIS: 'PARALISIS',
  STUN: 'PARALISIS',
  ATURDIMIENTO: 'PARALISIS',
  ENREDO: 'PARALISIS',
  MIEDO: 'PARALISIS',
  TERROR: 'PARALISIS',
  CONFUSION: 'PARALISIS',
  CEGUERA: 'PARALISIS',
  SOBRECARGA_LEGENDARIA: 'PARALISIS',
  DISTANCIA: 'PARALISIS',

  // Petrificación y sacudidas telúricas
  PETRIFICACION: 'PETRIFICACION',
  PETRIFICACION_LEVE: 'PETRIFICACION',
  SISMICO: 'PETRIFICACION',

  // Bastión, escudos y evasión protectora
  BASTION: 'BASTION',
  BARRERA: 'BASTION',
  FORTALEZA: 'BASTION',
  BLOQUEO: 'BASTION',
  RETRIBUCION: 'BASTION',
  ESPINAS: 'BASTION',
  DESFASADO: 'BASTION',
  INVISIBILIDAD: 'BASTION',
  DEF_UP: 'BASTION',
  EVASION_UP: 'BASTION',
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

// ============================================================================
// 3. ACUMULADOR DE RESONANCIA
// ============================================================================

export const CONSTANTES_RESONANCIA = {
  GANANCIA_RONDA_COMPLETADA: 8,
  FACTOR_DANO_RECIBIDO: 50,
  TOPE_DANO_RECIBIDO: 20,
  BONIFICACION_VENTAJA: 10,
  MAXIMO: 100,
} as const;

export interface ParametrosResonancia {
  rondaCompletada?: boolean;
  danoRecibido?: number;
  hpMaximoAliada?: number;
  golpeConVentaja?: boolean;
  ejecutoInsignia?: boolean;
}

/**
 * Acumula o consume resonancia de la criatura aliada (§3.4).
 * Si ejecutó el movimiento insignia (M4), la resonancia se reinicia a 0 y no gana resonancia en esa ronda.
 */
export function acumularResonancia(
  resonanciaPrevia: number,
  params: ParametrosResonancia,
): number {
  if (params.ejecutoInsignia) {
    return 0;
  }

  let ganancia = 0;
  if (params.rondaCompletada) {
    ganancia += CONSTANTES_RESONANCIA.GANANCIA_RONDA_COMPLETADA;
  }
  if (
    typeof params.danoRecibido === 'number' &&
    params.danoRecibido > 0 &&
    typeof params.hpMaximoAliada === 'number' &&
    params.hpMaximoAliada > 0
  ) {
    const gananciaDano = Math.min(
      CONSTANTES_RESONANCIA.TOPE_DANO_RECIBIDO,
      Math.round(
        (CONSTANTES_RESONANCIA.FACTOR_DANO_RECIBIDO * params.danoRecibido) /
          params.hpMaximoAliada,
      ),
    );
    ganancia += gananciaDano;
  }
  if (params.golpeConVentaja) {
    ganancia += CONSTANTES_RESONANCIA.BONIFICACION_VENTAJA;
  }

  return Math.min(
    CONSTANTES_RESONANCIA.MAXIMO,
    Math.max(0, resonanciaPrevia + ganancia),
  );
}

// ============================================================================
// 4. RESOLUCIÓN DETERMINISTA DE LA RONDA
// ============================================================================

export interface MovimientoCombatiente {
  nombre: string;
  poder: number;
  tipoAccion: string;
  slot?: number;
  efecto?: string | null;
}

export interface Combatiente {
  id?: string;
  nombre: string;
  nivel: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  hpActual: number;
  hpMaximo: number;
  elemento?: string | null;
  movimientos: MovimientoCombatiente[];
}

export function construirCombatiente(criatura: any, defectoNombre: string): Combatiente {
  const movimientos = criatura?.especie?.movimientos ?? [];
  return {
    id: criatura?.id ?? 'desconocido',
    nombre: criatura?.apodo ?? criatura?.especie?.nombre ?? defectoNombre,
    nivel: criatura?.nivel ?? 1,
    ataque: criatura?.ataque ?? 10,
    defensa: criatura?.defensa ?? 10,
    velocidad: criatura?.velocidad ?? 10,
    hpActual: criatura?.hpActual ?? 10,
    hpMaximo: criatura?.hpMaximo ?? 10,
    elemento: criatura?.especie?.elemento ?? 'fisico',
    movimientos: movimientos.map((m: any) => ({
      nombre: m.nombre,
      poder: m.poder ?? 10,
      tipoAccion: m.tipoAccion ?? 'Ataque melé',
      slot: m.slot,
      efecto: m.efecto,
    })),
  };
}

export interface AccionResultado {
  movimiento: string;
  danoCausado: number;
  hpRestanteRival: number;
  efectividad: EtiquetaEfectividad;
  multiplicadorAfinidad: number;
  danoAbsorbido: number;
  estadoAplicado: CodigoEstado | null;
  perdioTurno: CodigoEstado | null;
  esInsignia: boolean;
}

export interface EfectoFinDeTurno {
  objetivo: 'ALIADA' | 'RIVAL';
  codigo: CodigoEstado;
  dano: number;
  hpRestante: number;
}

export interface ResultadoRonda {
  hpRestanteAliada: number;
  hpRestanteRival: number;
  estadoBatalla: EstadoBatalla;
  accionJugador: AccionResultado | null;
  accionRival: AccionResultado | null;
  efectosFinDeTurno: EfectoFinDeTurno[];
  mensajes: string[];
  resultado: 'EN_CURSO' | 'VICTORIA' | 'ALIADA_DEBILITADA';
  rivalActuoPrimero: boolean;
}

export interface AccionIntencionJugador {
  indiceMovimiento: number;
}

function obtenerAleatorio(gen: GeneradorAleatorio): number {
  if (gen && typeof gen.generar === 'function') {
    return gen.generar();
  }
  return Math.random();
}

/**
 * Resuelve una ronda completa de combate táctico de forma pura y determinista (§3.7).
 */
export function resolverRonda(
  aliada: Combatiente,
  rival: Combatiente,
  snapshotPrevio: EstadoBatalla,
  accionJugador: AccionIntencionJugador | null,
  generador: GeneradorAleatorio,
): ResultadoRonda {
  let estadosAliada = [...snapshotPrevio.aliada.estados];
  let inmunidadesAliada = [...snapshotPrevio.aliada.inmunidades];
  let resonanciaAliada = snapshotPrevio.aliada.resonancia;

  let estadosRival = [...snapshotPrevio.rival.estados];
  let inmunidadesRival = [...snapshotPrevio.rival.inmunidades];

  let hpAliada = aliada.hpActual;
  let hpRival = rival.hpActual;

  const mensajes: string[] = [];
  let accionJugadorResultado: AccionResultado | null = null;
  let accionRivalResultado: AccionResultado | null = null;

  let danoRecibidoPorAliada = 0;
  let golpeJugadorConVentaja = false;
  let jugadorEjecutoInsignia = false;

  const velAliada = velocidadEfectiva(aliada.velocidad, estadosAliada);
  const velRival = velocidadEfectiva(rival.velocidad, estadosRival);

  // D-3: rival solo actúa primero si su velocidad efectiva es estrictamente mayor
  const rivalActuaPrimero = accionJugador !== null && velRival > velAliada;

  function ejecutarTurnoJugador() {
    if (accionJugador === null) return;
    const esInsignia = accionJugador.indiceMovimiento === 3;
    if (esInsignia) jugadorEjecutoInsignia = true;

    // 1. Petrificación
    if (estadosAliada.some((e) => e.codigo === 'PETRIFICACION')) {
      accionJugadorResultado = {
        movimiento: 'Turno perdido',
        danoCausado: 0,
        hpRestanteRival: hpRival,
        efectividad: 'NEUTRAL',
        multiplicadorAfinidad: 1.0,
        danoAbsorbido: 0,
        estadoAplicado: null,
        perdioTurno: 'PETRIFICACION',
        esInsignia,
      };
      mensajes.push(`Tu criatura perdió el turno debido a la petrificación.`);
      return;
    }

    // 2. Parálisis
    if (estadosAliada.some((e) => e.codigo === 'PARALISIS')) {
      const tiradaParalisis = obtenerAleatorio(generador);
      if (tiradaParalisis < 0.25) {
        accionJugadorResultado = {
          movimiento: 'Turno perdido',
          danoCausado: 0,
          hpRestanteRival: hpRival,
          efectividad: 'NEUTRAL',
          multiplicadorAfinidad: 1.0,
          danoAbsorbido: 0,
          estadoAplicado: null,
          perdioTurno: 'PARALISIS',
          esInsignia,
        };
        mensajes.push(`Tu criatura no pudo actuar por un espasmo de parálisis.`);
        return;
      }
    }

    // Movimiento
    const mov =
      aliada.movimientos[accionJugador.indiceMovimiento] ??
      aliada.movimientos[0] ?? {
        nombre: 'Ataque Básico',
        poder: 10,
        tipoAccion: 'Ataque melé',
        efecto: null,
      };

    // 3. Tirada de variación
    const tiradaVariacion = obtenerAleatorio(generador);
    const factorVariacion = 0.85 + 0.3 * tiradaVariacion;

    // 4. Daño y absorción
    const multAfinidad = multiplicadorAfinidad(aliada.elemento, rival.elemento);
    const efectividad = etiquetaEfectividad(multAfinidad);
    if (efectividad === 'VENTAJA') golpeJugadorConVentaja = true;

    // Modificadores tácticos autoritativos según efecto del movimiento
    let multEfecto = 1.0;
    let esCritico = false;
    let esEjecucion = false;
    if (mov.efecto === 'CRITICO') {
      multEfecto = 1.35;
      esCritico = true;
    } else if (mov.efecto === 'EJECUCION') {
      multEfecto = 1.50;
      esEjecucion = true;
    } else if (mov.efecto === 'EMPUJE') {
      multEfecto = 1.15;
    } else if (mov.efecto === 'ATQ_UP') {
      multEfecto = 1.20;
    } else if (mov.efecto === 'DEF_DOWN') {
      multEfecto = 1.25;
    } else if (mov.efecto === 'ATQ_DOWN') {
      multEfecto = 0.85;
    }

    const defEfectivaRival = defensaEfectiva(rival.defensa, estadosRival);
    const danoBase = calcularDano(
      aliada.ataque,
      defEfectivaRival,
      mov.poder,
      aliada.nivel,
      factorVariacion * multAfinidad * multEfecto,
    );

    const { danoRestante, danoAbsorbido, estadosActualizados } = absorberConEscudo(
      danoBase,
      estadosRival,
    );
    estadosRival = estadosActualizados;

    hpRival = aplicarDano(hpRival, danoRestante, rival.hpMaximo);

    // 5. Aplicar estado alterado si mapea en EFECTO_A_ESTADO
    let estadoAplicado: CodigoEstado | null = null;
    if (mov.efecto && mov.efecto in EFECTO_A_ESTADO) {
      const codigo = EFECTO_A_ESTADO[mov.efecto];
      if (codigo === 'BASTION') {
        const res = aplicarEstado(
          estadosAliada,
          inmunidadesAliada,
          'BASTION',
          aliada.hpMaximo,
          esInsignia,
        );
        if (res.aplicado) {
          estadosAliada = res.estados;
          estadoAplicado = 'BASTION';
        }
      } else if (esInsignia) {
        const res = aplicarEstado(
          estadosRival,
          inmunidadesRival,
          codigo,
          rival.hpMaximo,
          true,
        );
        if (res.aplicado) {
          estadosRival = res.estados;
          estadoAplicado = codigo;
        }
      } else {
        const prob = mov.tipoAccion === 'Estado' ? 0.9 : 0.5;
        const rEfecto = obtenerAleatorio(generador);
        if (rEfecto < prob) {
          const res = aplicarEstado(
            estadosRival,
            inmunidadesRival,
            codigo,
            rival.hpMaximo,
            false,
          );
          if (res.aplicado) {
            estadosRival = res.estados;
            estadoAplicado = codigo;
          }
        }
      }
    }

    // 6. Mecánicas de Drenaje, Regeneración y Purificación
    if (mov.efecto === 'DRENAJE' && danoBase > 0) {
      const curacionDrenaje = Math.max(1, Math.floor(danoBase * 0.30));
      const hpPrevioAliada = hpAliada;
      hpAliada = Math.min(aliada.hpMaximo, hpAliada + curacionDrenaje);
      const drenadoReal = hpAliada - hpPrevioAliada;
      if (drenadoReal > 0) {
        mensajes.push(`¡Tu criatura drenó vitalidad y recuperó ${drenadoReal} PV!`);
      }
    } else if (mov.efecto === 'REGENERACION') {
      const curacionRegen = Math.max(1, Math.floor(aliada.hpMaximo * 0.20));
      const hpPrevioAliada = hpAliada;
      hpAliada = Math.min(aliada.hpMaximo, hpAliada + curacionRegen);
      const curadoReal = hpAliada - hpPrevioAliada;
      if (curadoReal > 0) {
        mensajes.push(`¡Tu criatura canalizó energía vital y regeneró ${curadoReal} PV!`);
      }
    } else if (mov.efecto === 'PURIFICACION' || mov.efecto === 'LUZ') {
      const tieneAfliccion = estadosAliada.some((e) => e.codigo !== 'BASTION');
      if (tieneAfliccion) {
        estadosAliada = estadosAliada.filter((e) => e.codigo === 'BASTION');
        mensajes.push(`¡El resplandor místico purificó todas las aflicciones de tu criatura!`);
      }
      const curacionLuz = Math.max(1, Math.floor(aliada.hpMaximo * 0.15));
      const hpPrevioAliada = hpAliada;
      hpAliada = Math.min(aliada.hpMaximo, hpAliada + curacionLuz);
      const curadoLuz = hpAliada - hpPrevioAliada;
      if (curadoLuz > 0) {
        mensajes.push(`¡La luz estelar restauró ${curadoLuz} PV a tu criatura!`);
      }
    }

    accionJugadorResultado = {
      movimiento: mov.nombre,
      danoCausado: danoBase,
      hpRestanteRival: hpRival,
      efectividad,
      multiplicadorAfinidad: multAfinidad,
      danoAbsorbido,
      estadoAplicado,
      perdioTurno: null,
      esInsignia,
    };

    let msg = `Tu criatura usó ${mov.nombre}. ¡Causó ${danoBase} de daño!`;
    if (esCritico) msg += ` ¡Golpe crítico!`;
    if (esEjecucion) msg += ` ¡Ejecución letal asestada!`;
    if (efectividad === 'VENTAJA') msg += ` ¡Fue muy efectivo!`;
    else if (efectividad === 'DESVENTAJA') msg += ` No fue muy efectivo...`;
    if (danoAbsorbido > 0) msg += ` (El escudo absorbió ${danoAbsorbido} de daño)`;
    if (estadoAplicado) {
      if (estadoAplicado === 'BASTION') {
        msg += ` ¡Tu criatura alzó un Bastión protector!`;
      } else {
        msg += ` ¡El rival quedó afectado por ${CATALOGO_ESTADOS[estadoAplicado].nombre}!`;
      }
    }
    mensajes.push(msg);
  }

  function ejecutarTurnoRival() {
    // 1. Petrificación
    if (estadosRival.some((e) => e.codigo === 'PETRIFICACION')) {
      accionRivalResultado = {
        movimiento: 'Turno perdido',
        danoCausado: 0,
        hpRestanteRival: hpAliada,
        efectividad: 'NEUTRAL',
        multiplicadorAfinidad: 1.0,
        danoAbsorbido: 0,
        estadoAplicado: null,
        perdioTurno: 'PETRIFICACION',
        esInsignia: false,
      };
      mensajes.push(`El rival perdió el turno debido a la petrificación.`);
      return;
    }

    // 2. Parálisis
    if (estadosRival.some((e) => e.codigo === 'PARALISIS')) {
      const tiradaParalisis = obtenerAleatorio(generador);
      if (tiradaParalisis < 0.25) {
        accionRivalResultado = {
          movimiento: 'Turno perdido',
          danoCausado: 0,
          hpRestanteRival: hpAliada,
          efectividad: 'NEUTRAL',
          multiplicadorAfinidad: 1.0,
          danoAbsorbido: 0,
          estadoAplicado: null,
          perdioTurno: 'PARALISIS',
          esInsignia: false,
        };
        mensajes.push(`El rival no pudo actuar por un espasmo de parálisis.`);
        return;
      }
    }

    // Selección de movimiento: slots 1-3
    const poolRival = rival.movimientos.slice(0, Math.min(3, rival.movimientos.length));
    const tiradaIndice = obtenerAleatorio(generador);
    const indice =
      poolRival.length > 0
        ? Math.min(poolRival.length - 1, Math.floor(tiradaIndice * poolRival.length))
        : 0;
    const mov = poolRival[indice] ?? {
      nombre: 'Ataque Básico',
      poder: 10,
      tipoAccion: 'Ataque melé',
      efecto: null,
    };

    // 3. Tirada de variación
    const tiradaVariacion = obtenerAleatorio(generador);
    const factorVariacion = 0.85 + 0.3 * tiradaVariacion;

    // 4. Daño y absorción
    const multAfinidad = multiplicadorAfinidad(rival.elemento, aliada.elemento);
    const efectividad = etiquetaEfectividad(multAfinidad);

    // Modificadores tácticos autoritativos según efecto del movimiento del rival
    let multEfecto = 1.0;
    let esCritico = false;
    let esEjecucion = false;
    if (mov.efecto === 'CRITICO') {
      multEfecto = 1.35;
      esCritico = true;
    } else if (mov.efecto === 'EJECUCION') {
      multEfecto = 1.50;
      esEjecucion = true;
    } else if (mov.efecto === 'EMPUJE') {
      multEfecto = 1.15;
    } else if (mov.efecto === 'ATQ_UP') {
      multEfecto = 1.20;
    } else if (mov.efecto === 'DEF_DOWN') {
      multEfecto = 1.25;
    } else if (mov.efecto === 'ATQ_DOWN') {
      multEfecto = 0.85;
    }

    const defEfectivaAliada = defensaEfectiva(aliada.defensa, estadosAliada);
    const danoBase = calcularDano(
      rival.ataque,
      defEfectivaAliada,
      mov.poder,
      rival.nivel,
      factorVariacion * multAfinidad * multEfecto,
    );

    const { danoRestante, danoAbsorbido, estadosActualizados } = absorberConEscudo(
      danoBase,
      estadosAliada,
    );
    estadosAliada = estadosActualizados;

    hpAliada = aplicarDano(hpAliada, danoRestante, aliada.hpMaximo);
    danoRecibidoPorAliada += danoBase;

    // 5. Efecto
    let estadoAplicado: CodigoEstado | null = null;
    if (mov.efecto && mov.efecto in EFECTO_A_ESTADO) {
      const codigo = EFECTO_A_ESTADO[mov.efecto];
      if (codigo === 'BASTION') {
        const res = aplicarEstado(
          estadosRival,
          inmunidadesRival,
          'BASTION',
          rival.hpMaximo,
          false,
        );
        if (res.aplicado) {
          estadosRival = res.estados;
          estadoAplicado = 'BASTION';
        }
      } else {
        const prob = mov.tipoAccion === 'Estado' ? 0.9 : 0.5;
        const rEfecto = obtenerAleatorio(generador);
        if (rEfecto < prob) {
          const res = aplicarEstado(
            estadosAliada,
            inmunidadesAliada,
            codigo,
            aliada.hpMaximo,
            false,
          );
          if (res.aplicado) {
            estadosAliada = res.estados;
            estadoAplicado = codigo;
          }
        }
      }
    }

    // 6. Mecánicas de Drenaje, Regeneración y Purificación del Rival
    if (mov.efecto === 'DRENAJE' && danoBase > 0) {
      const curacionDrenaje = Math.max(1, Math.floor(danoBase * 0.30));
      const hpPrevioRival = hpRival;
      hpRival = Math.min(rival.hpMaximo, hpRival + curacionDrenaje);
      const drenadoReal = hpRival - hpPrevioRival;
      if (drenadoReal > 0) {
        mensajes.push(`¡El rival drenó vitalidad y recuperó ${drenadoReal} PV!`);
      }
    } else if (mov.efecto === 'REGENERACION') {
      const curacionRegen = Math.max(1, Math.floor(rival.hpMaximo * 0.20));
      const hpPrevioRival = hpRival;
      hpRival = Math.min(rival.hpMaximo, hpRival + curacionRegen);
      const curadoReal = hpRival - hpPrevioRival;
      if (curadoReal > 0) {
        mensajes.push(`¡El rival canalizó energía vital y regeneró ${curadoReal} PV!`);
      }
    } else if (mov.efecto === 'PURIFICACION' || mov.efecto === 'LUZ') {
      const tieneAfliccion = estadosRival.some((e) => e.codigo !== 'BASTION');
      if (tieneAfliccion) {
        estadosRival = estadosRival.filter((e) => e.codigo === 'BASTION');
        mensajes.push(`¡Un resplandor místico purificó todas las aflicciones del rival!`);
      }
      const curacionLuz = Math.max(1, Math.floor(rival.hpMaximo * 0.15));
      hpRival = Math.min(rival.hpMaximo, hpRival + curacionLuz);
    }

    accionRivalResultado = {
      movimiento: mov.nombre,
      danoCausado: danoBase,
      hpRestanteRival: hpAliada,
      efectividad,
      multiplicadorAfinidad: multAfinidad,
      danoAbsorbido,
      estadoAplicado,
      perdioTurno: null,
      esInsignia: false,
    };

    let msg = `El rival usó ${mov.nombre}. ¡Causó ${danoBase} de daño a tu criatura!`;
    if (esCritico) msg += ` ¡Golpe crítico!`;
    if (esEjecucion) msg += ` ¡Ejecución letal asestada!`;
    if (efectividad === 'VENTAJA') msg += ` ¡Fue muy efectivo!`;
    else if (efectividad === 'DESVENTAJA') msg += ` No fue muy efectivo...`;
    if (danoAbsorbido > 0) msg += ` (El escudo absorbió ${danoAbsorbido} de daño)`;
    if (estadoAplicado) {
      if (estadoAplicado === 'BASTION') {
        msg += ` ¡El rival alzó un Bastión protector!`;
      } else {
        msg += ` ¡Tu criatura quedó afectada por ${CATALOGO_ESTADOS[estadoAplicado].nombre}!`;
      }
    }
    mensajes.push(msg);
  }

  if (rivalActuaPrimero) {
    ejecutarTurnoRival();
    if (hpAliada <= 0) {
      return {
        hpRestanteAliada: 0,
        hpRestanteRival: hpRival,
        estadoBatalla: {
          aliada: {
            criaturaId: aliada.id,
            resonancia: resonanciaAliada,
            estados: estadosAliada,
            inmunidades: inmunidadesAliada,
          },
          rival: { resonancia: 0, estados: estadosRival, inmunidades: inmunidadesRival },
        },
        accionJugador: null,
        accionRival: accionRivalResultado,
        efectosFinDeTurno: [],
        mensajes,
        resultado: 'ALIADA_DEBILITADA',
        rivalActuoPrimero: true,
      };
    }

    ejecutarTurnoJugador();
    if (hpRival <= 0) {
      return {
        hpRestanteAliada: hpAliada,
        hpRestanteRival: 0,
        estadoBatalla: {
          aliada: {
            criaturaId: aliada.id,
            resonancia: jugadorEjecutoInsignia ? 0 : resonanciaAliada,
            estados: estadosAliada,
            inmunidades: inmunidadesAliada,
          },
          rival: { resonancia: 0, estados: estadosRival, inmunidades: inmunidadesRival },
        },
        accionJugador: accionJugadorResultado,
        accionRival: accionRivalResultado,
        efectosFinDeTurno: [],
        mensajes,
        resultado: 'VICTORIA',
        rivalActuoPrimero: true,
      };
    }
  } else {
    ejecutarTurnoJugador();
    if (hpRival <= 0) {
      return {
        hpRestanteAliada: hpAliada,
        hpRestanteRival: 0,
        estadoBatalla: {
          aliada: {
            criaturaId: aliada.id,
            resonancia: jugadorEjecutoInsignia ? 0 : resonanciaAliada,
            estados: estadosAliada,
            inmunidades: inmunidadesAliada,
          },
          rival: { resonancia: 0, estados: estadosRival, inmunidades: inmunidadesRival },
        },
        accionJugador: accionJugadorResultado,
        accionRival: null,
        efectosFinDeTurno: [],
        mensajes,
        resultado: 'VICTORIA',
        rivalActuoPrimero: false,
      };
    }

    ejecutarTurnoRival();
    if (hpAliada <= 0) {
      return {
        hpRestanteAliada: 0,
        hpRestanteRival: hpRival,
        estadoBatalla: {
          aliada: {
            criaturaId: aliada.id,
            resonancia: resonanciaAliada,
            estados: estadosAliada,
            inmunidades: inmunidadesAliada,
          },
          rival: { resonancia: 0, estados: estadosRival, inmunidades: inmunidadesRival },
        },
        accionJugador: accionJugadorResultado,
        accionRival: accionRivalResultado,
        efectosFinDeTurno: [],
        mensajes,
        resultado: 'ALIADA_DEBILITADA',
        rivalActuoPrimero: false,
      };
    }
  }

  // Fin de ronda
  const efectosFinDeTurno: EfectoFinDeTurno[] = [];

  // 1. DoT de aliada
  for (const estado of estadosAliada) {
    const dot = calcularDot(estado.codigo, aliada.hpMaximo);
    if (dot > 0) {
      hpAliada = aplicarDot(hpAliada, dot);
      efectosFinDeTurno.push({
        objetivo: 'ALIADA',
        codigo: estado.codigo,
        dano: dot,
        hpRestante: hpAliada,
      });
      mensajes.push(
        `Tu criatura sufre ${dot} de daño por ${CATALOGO_ESTADOS[estado.codigo].nombre}.`,
      );
    }
  }

  // 2. DoT de rival
  for (const estado of estadosRival) {
    const dot = calcularDot(estado.codigo, rival.hpMaximo);
    if (dot > 0) {
      hpRival = aplicarDot(hpRival, dot);
      efectosFinDeTurno.push({
        objetivo: 'RIVAL',
        codigo: estado.codigo,
        dano: dot,
        hpRestante: hpRival,
      });
      mensajes.push(
        `El rival sufre ${dot} de daño por ${CATALOGO_ESTADOS[estado.codigo].nombre}.`,
      );
    }
  }

  // 3. Resonancia aliada
  resonanciaAliada = acumularResonancia(resonanciaAliada, {
    rondaCompletada: true,
    danoRecibido: danoRecibidoPorAliada,
    hpMaximoAliada: aliada.hpMaximo,
    golpeConVentaja: golpeJugadorConVentaja,
    ejecutoInsignia: jugadorEjecutoInsignia,
  });

  // 4. Decremento de duraciones y gestión de inmunidades
  const nuevasInmunidadesAliada: CodigoEstado[] = [];
  const estadosActualizadosAliada: EstadoActivo[] = [];
  for (const e of estadosAliada) {
    const restantes = e.turnosRestantes - 1;
    if (restantes > 0) {
      estadosActualizadosAliada.push({ ...e, turnosRestantes: restantes });
    } else {
      if (e.codigo === 'PARALISIS' || e.codigo === 'PETRIFICACION') {
        nuevasInmunidadesAliada.push(e.codigo);
      }
    }
  }

  const nuevasInmunidadesRival: CodigoEstado[] = [];
  const estadosActualizadosRival: EstadoActivo[] = [];
  for (const e of estadosRival) {
    const restantes = e.turnosRestantes - 1;
    if (restantes > 0) {
      estadosActualizadosRival.push({ ...e, turnosRestantes: restantes });
    } else {
      if (e.codigo === 'PARALISIS' || e.codigo === 'PETRIFICACION') {
        nuevasInmunidadesRival.push(e.codigo);
      }
    }
  }

  return {
    hpRestanteAliada: hpAliada,
    hpRestanteRival: hpRival,
    estadoBatalla: {
      aliada: {
        criaturaId: aliada.id,
        resonancia: resonanciaAliada,
        estados: estadosActualizadosAliada,
        inmunidades: nuevasInmunidadesAliada,
      },
      rival: {
        resonancia: 0,
        estados: estadosActualizadosRival,
        inmunidades: nuevasInmunidadesRival,
      },
    },
    accionJugador: accionJugadorResultado,
    accionRival: accionRivalResultado,
    efectosFinDeTurno,
    mensajes,
    resultado: 'EN_CURSO',
    rivalActuoPrimero: Boolean(rivalActuaPrimero),
  };
}
