/**
 * Definición centralizada de los servicios de localidad y navegación disponibles desde el Hub.
 */
import type { UbicacionActual, NodoMapaTerritorial } from "../api/ApiJuego";

export interface ServicioHub {
  id: string;
  ruta: string;
  titulo: string;
  descripcion: string;
  icono: "compass" | "users" | "package" | "backpack" | "store" | "sparkles" | "book-open" | "scroll";
  codigoLocalidad?: "CURACION" | "TIENDA" | "ALMACEN" | "HISTORIAL";
}

export const SERVICIOS_HUB: readonly ServicioHub[] = [
  {
    id: "exploracion",
    ruta: "/exploracion",
    titulo: "Exploración",
    descripcion: "Incursiona en sendas silvestres y halla criaturas",
    icono: "compass",
  },
  {
    id: "equipo",
    ruta: "/equipo",
    titulo: "Equipo Activo",
    descripcion: "Inspecciona y organiza tus 6 compañeros de batalla",
    icono: "users",
  },
  {
    id: "almacen",
    ruta: "/almacen",
    titulo: "Almacén",
    descripcion: "Reserva y transfiere aliados de tu colección",
    icono: "package",
    codigoLocalidad: "ALMACEN",
  },
  {
    id: "inventario",
    ruta: "/inventario",
    titulo: "Inventario",
    descripcion: "Bolsa de talismanes, orbes y consumibles",
    icono: "backpack",
  },
  {
    id: "tienda",
    ruta: "/tienda",
    titulo: "Tienda / Bazar",
    descripcion: "Adquiere suministros, botiquines y artefactos",
    icono: "store",
    codigoLocalidad: "TIENDA",
  },
  {
    id: "curacion",
    ruta: "/curacion",
    titulo: "Santuario de Salud",
    descripcion: "Restaura la vitalidad de todo tu equipo",
    icono: "sparkles",
    codigoLocalidad: "CURACION",
  },
  {
    id: "catalogo",
    ruta: "/catalogo",
    titulo: "Compendio Open5e",
    descripcion: "Bestiario de especies y criaturas de Aethelgard",
    icono: "book-open",
  },
  {
    id: "historial",
    ruta: "/historial",
    titulo: "Bitácora",
    descripcion: "Registro cronológico de eventos y hazañas",
    icono: "scroll",
    codigoLocalidad: "HISTORIAL",
  },
] as const;

/**
 * Topología canónica territorial de Aethelgard (las 9 ubicaciones y sus conexiones).
 */
export interface InfoNodoTopologia {
  id: string;
  nombre: string;
  tipo: "LOCALIDAD" | "ZONA";
  esSegura: boolean;
  fila: number;
  columna: number;
  faunaNivelMinimo: number | null;
  faunaNivelMaximo: number | null;
  conexionesIds: string[];
}

export const CONEXIONES_AETHELGARD: readonly [string, string][] = [
  ["LOC-01", "ZON-01"],
  ["LOC-01", "ZON-02"],
  ["ZON-01", "LOC-02"],
  ["ZON-02", "ZON-03"],
  ["ZON-03", "LOC-02"],
  ["LOC-02", "ZON-04"],
  ["ZON-04", "LOC-03"],
  ["ZON-04", "ZON-05"],
  ["LOC-03", "ZON-06"],
  ["ZON-05", "ZON-06"],
] as const;

export const TOPOLOGIA_AETHELGARD: readonly InfoNodoTopologia[] = [
  { id: "LOC-01", nombre: "Villa Serena", tipo: "LOCALIDAD", esSegura: true, fila: 1, columna: 1, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ["ZON-01", "ZON-02"] },
  { id: "ZON-01", nombre: "Praderas del Amanecer", tipo: "ZONA", esSegura: false, fila: 2, columna: 1, faunaNivelMinimo: 1, faunaNivelMaximo: 3, conexionesIds: ["LOC-01", "LOC-02"] },
  { id: "ZON-02", nombre: "Riberas del Lago Espejo", tipo: "ZONA", esSegura: false, fila: 2, columna: 2, faunaNivelMinimo: 2, faunaNivelMaximo: 4, conexionesIds: ["LOC-01", "ZON-03"] },
  { id: "LOC-02", nombre: "Puesto Fronterizo del Río", tipo: "LOCALIDAD", esSegura: true, fila: 3, columna: 1, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ["ZON-01", "ZON-03", "ZON-04"] },
  { id: "ZON-03", nombre: "Bosque Susurrante", tipo: "ZONA", esSegura: false, fila: 3, columna: 2, faunaNivelMinimo: 3, faunaNivelMaximo: 5, conexionesIds: ["ZON-02", "LOC-02"] },
  { id: "ZON-04", nombre: "Paso de los Riscos", tipo: "ZONA", esSegura: false, fila: 4, columna: 1, faunaNivelMinimo: 5, faunaNivelMaximo: 7, conexionesIds: ["LOC-02", "LOC-03", "ZON-05"] },
  { id: "LOC-03", nombre: "Bastión del Norte", tipo: "LOCALIDAD", esSegura: true, fila: 5, columna: 1, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ["ZON-04", "ZON-06"] },
  { id: "ZON-05", nombre: "Cueva Umbría", tipo: "ZONA", esSegura: false, fila: 5, columna: 2, faunaNivelMinimo: 7, faunaNivelMaximo: 10, conexionesIds: ["ZON-04", "ZON-06"] },
  { id: "ZON-06", nombre: "Pico de la Cumbre", tipo: "ZONA", esSegura: false, fila: 5, columna: 3, faunaNivelMinimo: 8, faunaNivelMaximo: 12, conexionesIds: ["LOC-03", "ZON-05"] },
] as const;

/**
 * Formatea el rótulo semántico de fauna según si la zona es asentamiento seguro o salvaje.
 */
export function formatearRangoFauna(
  nivelMinimo?: number | null,
  nivelMaximo?: number | null,
  nivelSugerido?: string | null,
  esSegura?: boolean,
): string {
  if (
    esSegura === true ||
    (!nivelMinimo && !nivelMaximo && (!nivelSugerido || nivelSugerido === "Rango libre"))
  ) {
    return "Asentamiento Pacífico (Sin Fauna Hostil)";
  }
  if (nivelMinimo && nivelMaximo) {
    return `Fauna Salvaje: Nivel ${nivelMinimo} - ${nivelMaximo}`;
  }
  if (nivelSugerido) {
    return `Fauna Salvaje: Nivel ${nivelSugerido}`;
  }
  if (nivelMinimo) {
    return `Fauna Salvaje: Nivel ${nivelMinimo}+`;
  }
  return "Fauna Salvaje";
}

export interface EvaluacionRiesgoFauna {
  codigo: "PACIFICO" | "CONTROLADO" | "EQUILIBRADO" | "PELIGROSO";
  etiqueta: string;
}

/**
 * Evalúa el riesgo táctico comparando el nivel máximo del equipo del explorador contra el rango de fauna.
 */
export function evaluarRiesgoFauna(
  nivelMaximoEquipo: number,
  faunaNivelMinimo?: number | null,
  faunaNivelMaximo?: number | null,
): EvaluacionRiesgoFauna {
  if (!faunaNivelMinimo) {
    return { codigo: "PACIFICO", etiqueta: "ZONA SEGURA" };
  }
  const techo = faunaNivelMaximo ?? faunaNivelMinimo;
  if (nivelMaximoEquipo >= techo) {
    return { codigo: "CONTROLADO", etiqueta: "RIESGO CONTROLADO" };
  }
  if (nivelMaximoEquipo >= faunaNivelMinimo) {
    return { codigo: "EQUILIBRADO", etiqueta: "DESAFÍO EQUILIBRADO" };
  }
  return { codigo: "PELIGROSO", etiqueta: "PELIGRO ELEVADO" };
}

/**
 * Construye los 9 nodos del mapa territorial de Aethelgard como fallback resiliente
 * cuando el backend o un mock parcial no provee el campo nodosMapa precalculado.
 */
export function construirNodosMapaFallback(
  ubicacion: UbicacionActual,
): NodoMapaTerritorial[] {
  if (ubicacion.nodosMapa && ubicacion.nodosMapa.length > 0) {
    return ubicacion.nodosMapa;
  }
  const adyacentesSet = new Set((ubicacion.conexiones ?? []).map((c) => c.ubicacionDestinoId));
  return TOPOLOGIA_AETHELGARD.map((topo) => {
    const esActual = topo.id === ubicacion.ubicacionId;
    const esAdyacente = adyacentesSet.has(topo.id);
    const conexionAdyacente = (ubicacion.conexiones ?? []).find(
      (c) => c.ubicacionDestinoId === topo.id,
    );

    let desbloqueada = esActual;
    let progreso = 0;
    if (esActual) {
      desbloqueada = true;
      progreso = ubicacion.progresoZona ?? (topo.esSegura ? 100 : 0);
    } else if (conexionAdyacente) {
      desbloqueada = !conexionAdyacente.estaBloqueada;
      progreso = conexionAdyacente.progresoActual ?? (desbloqueada ? 100 : 0);
    } else if (topo.id === "LOC-01" || topo.id === "ZON-01" || topo.id === "ZON-02") {
      desbloqueada = true;
      progreso = topo.esSegura ? 100 : 0;
    }

    return {
      id: topo.id,
      nombre: topo.nombre,
      tipo: topo.tipo,
      esSegura: topo.esSegura,
      faunaNivelMinimo: topo.faunaNivelMinimo,
      faunaNivelMaximo: topo.faunaNivelMaximo,
      desbloqueada,
      progreso,
      esActual,
      esAdyacente,
      conexionesIds: [...topo.conexionesIds],
    };
  });
}

/**
 * Determina si un servicio está habilitado según la localidad actual.
 * Los servicios generales (exploración, equipo, inventario, compendio) están siempre habilitados.
 */
export function estaServicioHabilitadoEnZona(
  servicio: ServicioHub,
  serviciosZona?: readonly string[] | null,
): boolean {
  if (!servicio.codigoLocalidad) {
    return true;
  }
  if (!serviciosZona || serviciosZona.length === 0) {
    return true; // simplificacion: si la zona no declara restricciones, permite acceso general
  }
  return serviciosZona.includes(servicio.codigoLocalidad);
}
