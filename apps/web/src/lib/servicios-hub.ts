/**
 * Definición centralizada de los servicios de localidad y navegación disponibles desde el Hub.
 */

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
