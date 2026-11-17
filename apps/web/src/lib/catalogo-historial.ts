import type {
  EspecieCatalogo,
  ArquetipoEspecie,
  EventoHistorial,
  CategoriaHistorial,
  RarezaEspecie,
  CriterioOrdenCatalogo,
} from "../api/ApiJuego";

export type { CriterioOrdenCatalogo, RarezaEspecie };

/**
 * Mapeo canónico en español de los 6 tipos biológicos del SRD 5.2 (Open5e).
 */
export const TRADUCCION_TIPOS_ESPECIE: Record<string, string> = {
  beast: "Bestia",
  monstrosity: "Monstruosidad",
  undead: "No-muerto",
  elemental: "Elemental",
  construct: "Autómata",
  plant: "Planta",
  dragon: "Dragón",
};

/**
 * Mapeo canónico de afinidades elementales retro de Aethelgard.
 */
export const TRADUCCION_ELEMENTOS: Record<string, { nombre: string; clase: string }> = {
  fisico: { nombre: "Físico", clase: "border-stone-500/80 bg-stone-500/15 text-stone-300" },
  fuego: { nombre: "Fuego", clase: "border-red-500/80 bg-red-500/15 text-red-300" },
  agua: { nombre: "Agua", clase: "border-blue-500/80 bg-blue-500/15 text-blue-300" },
  natura: { nombre: "Natura", clase: "border-emerald-500/80 bg-emerald-500/15 text-emerald-300" },
  sombra: { nombre: "Sombra", clase: "border-purple-500/80 bg-purple-500/15 text-purple-300" },
  luz: { nombre: "Luz", clase: "border-yellow-400/80 bg-yellow-400/15 text-yellow-200" },
};

/**
 * Determina el arquetipo táctico de una especie basándose en sus atributos o valor precalculado.
 */
/**
 * Calcula el presupuesto total de atributos (BST) de una especie o criatura.
 */
export function calcularPresupuestoCriatura(esp: {
  presupuestoTotal?: number;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
}): number {
  return (
    esp.presupuestoTotal ??
    esp.hpBase + esp.ataqueBase + esp.defensaBase + esp.velocidadBase
  );
}

/**
 * Resuelve la rareza y el peso canónico de una especie para insignias y ordenamiento.
 */
export function resolverRarezaEspecie(esp: {
  rareza?: RarezaEspecie;
  esLegendaria?: boolean;
  esEspecial?: boolean;
  pesoAparicion?: number;
}): { codigo: RarezaEspecie; etiqueta: string; peso: number } {
  let codigo: RarezaEspecie = "COMUN";
  if (esp.rareza) {
    codigo = esp.rareza;
  } else if (esp.esLegendaria) {
    codigo = "LEGENDARIA";
  } else if (esp.esEspecial || (esp.pesoAparicion !== undefined && esp.pesoAparicion <= 5)) {
    codigo = "ESPECIAL";
  } else if (esp.pesoAparicion !== undefined && esp.pesoAparicion <= 10) {
    codigo = "RARA";
  } else if (esp.pesoAparicion !== undefined && esp.pesoAparicion <= 15) {
    codigo = "FRECUENTE";
  }

  switch (codigo) {
    case "LEGENDARIA":
      return { codigo, etiqueta: "LEGENDARIA (5%)", peso: 5 };
    case "ESPECIAL":
      return { codigo, etiqueta: "ESPECIAL (5%)", peso: 5 };
    case "RARA":
      return { codigo, etiqueta: "RARA (10%)", peso: 10 };
    case "FRECUENTE":
      return { codigo, etiqueta: "FRECUENTE (15%)", peso: 15 };
    case "COMUN":
    default:
      return { codigo: "COMUN", etiqueta: "COMÚN (35%)", peso: 35 };
  }
}

const PESO_ORDEN_RAREZA: Record<RarezaEspecie, number> = {
  LEGENDARIA: 5,
  ESPECIAL: 4,
  RARA: 3,
  FRECUENTE: 2,
  COMUN: 1,
};

/**
 * Ordena inmutablemente la lista de especies del catálogo según el criterio seleccionado.
 */
export function ordenarEspeciesCatalogo(
  especies: EspecieCatalogo[],
  criterio: CriterioOrdenCatalogo,
): EspecieCatalogo[] {
  const copia = [...especies];

  switch (criterio) {
    case "BST_DESC":
      return copia.sort((a, b) => {
        const bstDiff = calcularPresupuestoCriatura(b) - calcularPresupuestoCriatura(a);
        if (bstDiff !== 0) return bstDiff;
        return a.nombre.localeCompare(b.nombre, "es");
      });

    case "BST_ASC":
      return copia.sort((a, b) => {
        const bstDiff = calcularPresupuestoCriatura(a) - calcularPresupuestoCriatura(b);
        if (bstDiff !== 0) return bstDiff;
        return a.nombre.localeCompare(b.nombre, "es");
      });

    case "CAPTURA_ASC":
      return copia.sort((a, b) => {
        const diffCaptura = a.tasaCaptura - b.tasaCaptura;
        if (diffCaptura !== 0) return diffCaptura;
        const bstDiff = calcularPresupuestoCriatura(b) - calcularPresupuestoCriatura(a);
        if (bstDiff !== 0) return bstDiff;
        return a.nombre.localeCompare(b.nombre, "es");
      });

    case "RAREZA_DESC":
      return copia.sort((a, b) => {
        const rarezaA = PESO_ORDEN_RAREZA[resolverRarezaEspecie(a).codigo];
        const rarezaB = PESO_ORDEN_RAREZA[resolverRarezaEspecie(b).codigo];
        if (rarezaB !== rarezaA) return rarezaB - rarezaA;
        const bstDiff = calcularPresupuestoCriatura(b) - calcularPresupuestoCriatura(a);
        if (bstDiff !== 0) return bstDiff;
        return a.nombre.localeCompare(b.nombre, "es");
      });

    case "NOMBRE_ASC":
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    case "ZONA_ASC":
    default:
      return copia.sort((a, b) => {
        const zonaA = a.zona?.id ?? "ZZZ";
        const zonaB = b.zona?.id ?? "ZZZ";
        if (zonaA !== zonaB) return zonaA.localeCompare(zonaB, "es");
        const bstDiff = calcularPresupuestoCriatura(a) - calcularPresupuestoCriatura(b);
        if (bstDiff !== 0) return bstDiff;
        return a.nombre.localeCompare(b.nombre, "es");
      });
  }
}

export function calcularArquetipoCriatura(especie: {
  hpBase?: number;
  ataqueBase?: number;
  defensaBase?: number;
  velocidadBase?: number;
  arquetipo?: ArquetipoEspecie;
}): ArquetipoEspecie {
  if (especie.arquetipo) {
    return especie.arquetipo;
  }

  const hp = especie.hpBase ?? 30;
  const atq = especie.ataqueBase ?? 30;
  const def = especie.defensaBase ?? 30;
  const vel = especie.velocidadBase ?? 30;
  const maximo = Math.max(hp, atq, def, vel);

  if ((def >= 75 || hp >= 65) && (def === maximo || hp === maximo)) {
    return "TANQUE";
  }
  if (atq >= 70 && atq >= def && atq >= vel) {
    return "ATACANTE";
  }
  if (vel >= 70 && vel > atq) {
    return "VELOZ";
  }
  return "EQUILIBRADO";
}

export interface CriteriosFiltroCatalogo {
  tipo?: string;
  arquetipo?: string;
  busqueda?: string;
}

/**
 * Filtra en cliente de forma instantánea por tipo biológico, arquetipo/rareza y término de búsqueda.
 */
export function filtrarEspeciesCatalogo(
  especies: EspecieCatalogo[],
  filtros: CriteriosFiltroCatalogo,
): EspecieCatalogo[] {
  const tipoFiltro = (filtros.tipo || "todos").toLowerCase().trim();
  const arquetipoFiltro = (filtros.arquetipo || "todos").toUpperCase().trim();
  const busquedaNormalizada = (filtros.busqueda || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return especies.filter((esp) => {
    // Filtro por tipo biológico
    if (tipoFiltro !== "todos" && esp.tipo.toLowerCase() !== tipoFiltro) {
      return false;
    }

    // Filtro por arquetipo o rareza especial/legendaria
    if (arquetipoFiltro !== "TODOS") {
      if (arquetipoFiltro === "LEGENDARIAS" || arquetipoFiltro === "LEGENDARIO") {
        if (!esp.esLegendaria) return false;
      } else if (arquetipoFiltro === "ESPECIAL" || arquetipoFiltro === "ESPECIALES") {
        if (!esp.esEspecial) return false;
      } else {
        const arq = esp.arquetipo || calcularArquetipoCriatura(esp);
        if (arq !== arquetipoFiltro) return false;
      }
    }

    // Filtro por término de búsqueda (nombre, slug, descripción o keyExterna)
    if (busquedaNormalizada) {
      const textoNombre = (esp.nombre || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoSlug = (esp.slug || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoDesc = (esp.descripcion || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoKey = (esp.keyExterna || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const coincide =
        textoNombre.includes(busquedaNormalizada) ||
        textoSlug.includes(busquedaNormalizada) ||
        textoDesc.includes(busquedaNormalizada) ||
        textoKey.includes(busquedaNormalizada);

      if (!coincide) return false;
    }

    return true;
  });
}

/**
 * Resuelve la categoría canónica de un evento del historial.
 */
export function resolverCategoriaEvento(evento: EventoHistorial): CategoriaHistorial {
  if (evento.categoria) {
    return evento.categoria;
  }

  const tipoUpper = (evento.tipo || "").toUpperCase().trim();

  if (tipoUpper === "CAPTURA") {
    return "CAPTURA";
  }
  if (["COMERCIO", "TIENDA", "COMPRA"].includes(tipoUpper)) {
    return "TIENDA";
  }
  if (["CURACION", "SANTUARIO"].includes(tipoUpper)) {
    return "CURACION";
  }
  if (
    ["COMBATE", "VICTORIA_COMBATE", "DERROTA_COMBATE", "HUIDA", "PROGRESO"].includes(tipoUpper)
  ) {
    return "COMBATE";
  }
  return "EXPLORACION";
}

/**
 * Formatea una marca de tiempo ISO en componentes amigables de fecha y hora.
 */
export function formatearFechaAmigable(marcaTiempo: string): {
  hora: string;
  fecha: string;
  textoCompleto: string;
} {
  try {
    const d = new Date(marcaTiempo);
    if (isNaN(d.getTime())) {
      return {
        hora: "--:--",
        fecha: marcaTiempo,
        textoCompleto: marcaTiempo,
      };
    }
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    const horaStr = `${hora}:${min}`;
    const fechaStr = `${dia}/${mes}/${anio}`;
    return {
      hora: horaStr,
      fecha: fechaStr,
      textoCompleto: `${fechaStr} · ${horaStr}`,
    };
  } catch {
    return {
      hora: "--:--",
      fecha: marcaTiempo,
      textoCompleto: marcaTiempo,
    };
  }
}

/**
 * Filtra los eventos de la bitácora por categoría canónica y texto en la descripción.
 */
export function filtrarEventosHistorial(
  eventos: EventoHistorial[],
  categoriaActiva: string,
  busqueda: string,
): EventoHistorial[] {
  const catUpper = (categoriaActiva || "TODOS").toUpperCase().trim();
  const busquedaNorm = (busqueda || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return eventos.filter((ev) => {
    if (catUpper !== "TODOS") {
      const catEv = resolverCategoriaEvento(ev);
      if (catEv !== catUpper) {
        return false;
      }
    }

    if (busquedaNorm) {
      const desc = (ev.descripcion || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const tipo = (ev.tipo || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (!desc.includes(busquedaNorm) && !tipo.includes(busquedaNorm)) {
        return false;
      }
    }

    return true;
  });
}

export interface GrupoZona {
  zonaId: string;
  zonaNombre: string;
  especies: EspecieCatalogo[];
  legendarias: number;
}

/**
 * Agrupa las especies del catálogo por su zona de hábitat canónica.
 * Ordena los grupos por zonaId ascendente; las especies sin zona se agrupan al final bajo "SIN-ZONA".
 */
export function agruparEspeciesPorZona(
  especies: EspecieCatalogo[] = [],
  criterioOrden?: CriterioOrdenCatalogo,
): GrupoZona[] {
  const mapa = new Map<string, { zonaNombre: string; especies: EspecieCatalogo[] }>();
  const sinZona: EspecieCatalogo[] = [];

  for (const esp of especies) {
    if (esp.zona && esp.zona.id) {
      const zId = esp.zona.id;
      if (!mapa.has(zId)) {
        mapa.set(zId, { zonaNombre: esp.zona.nombre || zId, especies: [] });
      }
      mapa.get(zId)!.especies.push(esp);
    } else {
      sinZona.push(esp);
    }
  }

  const grupos: GrupoZona[] = Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([zonaId, datos]) => {
      const especiesOrdenadas = criterioOrden
        ? ordenarEspeciesCatalogo(datos.especies, criterioOrden)
        : datos.especies;
      return {
        zonaId,
        zonaNombre: datos.zonaNombre,
        especies: especiesOrdenadas,
        legendarias: datos.especies.filter((e) => Boolean(e.esLegendaria)).length,
      };
    });

  if (sinZona.length > 0) {
    const sinZonaOrdenadas = criterioOrden
      ? ordenarEspeciesCatalogo(sinZona, criterioOrden)
      : sinZona;
    grupos.push({
      zonaId: "SIN-ZONA",
      zonaNombre: "Sin zona asignada",
      especies: sinZonaOrdenadas,
      legendarias: sinZona.filter((e) => Boolean(e.esLegendaria)).length,
    });
  }

  return grupos;
}

