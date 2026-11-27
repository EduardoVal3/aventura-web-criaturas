import {
  type ApiJuego,
  type EncuentroActivo,
  type EspecieDetalle,
  ErrorApi,
  type PersonajeActivo,
  type PeticionAtacar,
  type PeticionCapturar,
  type PeticionComprarTienda,
  type PeticionCrearPersonaje,
  type PeticionHuir,
  type PeticionLogin,
  type PeticionRegistro,
  type PeticionTransferirCriatura,
  type PeticionUsarItem,
  type PeticionVerificarZona,
  type PeticionViajar,
  type RespuestaAlmacen,
  type RespuestaAtacar,
  type RespuestaCapturar,
  type RespuestaCatalogoTienda,
  type RespuestaComprarTienda,
  type RespuestaCrearPersonaje,
  type RespuestaDesbloqueos,
  type RespuestaEquipo,
  type RespuestaEspecies,
  type RespuestaExploracion,
  type RespuestaHistorial,
  type RespuestaHuir,
  type RespuestaInventario,
  type RespuestaLogin,
  type RespuestaLogout,
  type RespuestaPerfil,
  type RespuestaRegistro,
  type RespuestaRestaurar,
  type RespuestaSalud,
  type RespuestaTransferirCriatura,
  type RespuestaUsarItem,
  type RespuestaVerificarZona,
  type RespuestaViajar,
  type UbicacionActual,
} from "./ApiJuego.ts";

export type { DetalleCriaturaRestaurada } from "./ApiJuego.ts";

let tokenActual: string | null = null;

export function normalizarUrlBaseApi(urlApi?: string): string {
  return (urlApi ?? "").trim().replace(/\/+$/, "");
}

export function construirEncabezadosApi(
  token: string | null,
  claveGateway?: string,
): Record<string, string> {
  const encabezados: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const clave = (claveGateway ?? "").trim();
  if (clave) {
    encabezados.apikey = clave;
  }

  if (token) {
    encabezados.Authorization = `Bearer ${token}`;
  }

  return encabezados;
}

export function resolverErrorRespuestaHttp(
  estadoHttp: number,
  datosError: unknown,
): { codigo: string; mensaje: string } {
  const errorApi = (datosError as { error?: { codigo?: string; mensaje?: string } } | null)?.error;
  if (errorApi) {
    return {
      codigo: errorApi.codigo ?? "ERROR_DESCONOCIDO",
      mensaje: errorApi.mensaje ?? "No se pudo completar la solicitud.",
    };
  }

  if (estadoHttp === 429) {
    return {
      codigo: "LIMITE_SOLICITUDES",
      mensaje:
        "Has superado el límite de solicitudes por minuto. Espera un momento e inténtalo de nuevo.",
    };
  }

  return {
    codigo: "ERROR_DESCONOCIDO",
    mensaje: "No se pudo completar la solicitud.",
  };
}

const RUTAS_AUTENTICACION_PUBLICA = new Set([
  "/usuarios/login",
  "/usuarios/ingreso",
  "/usuarios/registro",
  "/autenticacion/login",
  "/autenticacion/ingreso",
  "/autenticacion/registro",
]);

export function esRutaAutenticacionPublica(ruta: string): boolean {
  const rutaLimpia = ruta.split("?")[0].replace(/\/+$/, "");
  return RUTAS_AUTENTICACION_PUBLICA.has(rutaLimpia);
}

export function debeNotificarSesionExpirada(
  estadoHttp: number,
  ruta: string,
  teniaToken: boolean,
): boolean {
  return estadoHttp === 401 && teniaToken && !esRutaAutenticacionPublica(ruta);
}

async function solicitar<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const entorno = import.meta.env;
  const urlBase = normalizarUrlBaseApi(entorno?.VITE_URL_API);
  const url = `${urlBase}/api${ruta}`;
  const tokenEnviado = tokenActual;
  const encabezados = construirEncabezadosApi(tokenEnviado, entorno?.VITE_CLAVE_GATEWAY);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, "SIN_CONEXION", "No se pudo conectar con el servidor.");
  }

  if (!respuesta.ok) {
    let datosError: unknown = null;

    try {
      datosError = await respuesta.json();
    } catch {
      // simplificacion: si el cuerpo no es JSON legible, se usan los valores por defecto.
    }

    const { codigo, mensaje } = resolverErrorRespuestaHttp(respuesta.status, datosError);

    if (
      debeNotificarSesionExpirada(respuesta.status, ruta, Boolean(tokenEnviado)) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("aethelgard:no-autorizado"));
    }

    throw new ErrorApi(respuesta.status, codigo, mensaje);
  }

  return (await respuesta.json()) as T;
}

export const apiHttp = {
  establecerToken(token: string | null): void {
    tokenActual = token;
  },

  obtenerSalud(): Promise<RespuestaSalud> {
    return solicitar<RespuestaSalud>("GET", "/salud");
  },

  registrarUsuario(peticion: PeticionRegistro): Promise<RespuestaRegistro> {
    return solicitar<RespuestaRegistro>("POST", "/usuarios/registro", peticion);
  },

  iniciarSesion(peticion: PeticionLogin): Promise<RespuestaLogin> {
    return solicitar<RespuestaLogin>("POST", "/usuarios/login", peticion);
  },

  cerrarSesion(): Promise<RespuestaLogout> {
    // simplificacion: autenticación JWT stateless sin lista negra en servidor; se purga el token localmente sin invocar un endpoint /usuarios/logout inexistente. Si se implementa revocación de sesiones en servidor, conectar aquí el POST correspondiente.
    tokenActual = null;
    return Promise.resolve({ mensaje: "Sesión cerrada correctamente." });
  },

  obtenerPerfil(): Promise<RespuestaPerfil> {
    return solicitar<RespuestaPerfil>("GET", "/usuarios/perfil");
  },

  crearPersonaje(peticion: PeticionCrearPersonaje): Promise<RespuestaCrearPersonaje> {
    return solicitar<RespuestaCrearPersonaje>("POST", "/personajes", peticion);
  },

  obtenerPersonajeActivo(): Promise<PersonajeActivo> {
    return solicitar<PersonajeActivo>("GET", "/personajes/activo");
  },

  obtenerUbicacionActual(): Promise<UbicacionActual> {
    return solicitar<UbicacionActual>("GET", "/mundo/ubicacion-actual");
  },

  viajar(peticion: PeticionViajar): Promise<RespuestaViajar> {
    return solicitar<RespuestaViajar>("POST", "/mundo/viajar", peticion);
  },

  explorar(): Promise<RespuestaExploracion> {
    return solicitar<RespuestaExploracion>("POST", "/exploracion/explorar");
  },

  obtenerEncuentroActivo(): Promise<EncuentroActivo> {
    return solicitar<EncuentroActivo>("GET", "/encuentros/activo");
  },

  atacar(peticion: PeticionAtacar): Promise<RespuestaAtacar> {
    return solicitar<RespuestaAtacar>("POST", "/combate/atacar", peticion);
  },

  capturar(peticion: PeticionCapturar): Promise<RespuestaCapturar> {
    return solicitar<RespuestaCapturar>("POST", "/combate/capturar", peticion);
  },

  huir(peticion: PeticionHuir): Promise<RespuestaHuir> {
    return solicitar<RespuestaHuir>("POST", "/combate/huir", peticion);
  },

  obtenerEquipo(): Promise<RespuestaEquipo> {
    return solicitar<RespuestaEquipo>("GET", "/equipo");
  },

  obtenerAlmacen(): Promise<RespuestaAlmacen> {
    return solicitar<RespuestaAlmacen>("GET", "/almacen");
  },

  transferirCriatura(peticion: PeticionTransferirCriatura): Promise<RespuestaTransferirCriatura> {
    return solicitar<RespuestaTransferirCriatura>("POST", "/equipo/transferir", peticion);
  },

  obtenerInventario(): Promise<RespuestaInventario> {
    return solicitar<RespuestaInventario>("GET", "/inventario");
  },

  obtenerCatalogoTienda(): Promise<RespuestaCatalogoTienda> {
    return solicitar<RespuestaCatalogoTienda>("GET", "/tienda");
  },

  comprarEnTienda(peticion: PeticionComprarTienda): Promise<RespuestaComprarTienda> {
    return solicitar<RespuestaComprarTienda>("POST", "/tienda/comprar", peticion);
  },

  usarItem(peticion: PeticionUsarItem): Promise<RespuestaUsarItem> {
    return solicitar<RespuestaUsarItem>("POST", "/inventario/usar", peticion);
  },

  restaurarEquipo(): Promise<RespuestaRestaurar> {
    return solicitar<RespuestaRestaurar>("POST", "/curacion/restaurar");
  },

  obtenerDesbloqueos(): Promise<RespuestaDesbloqueos> {
    return solicitar<RespuestaDesbloqueos>("GET", "/progreso/desbloqueos");
  },

  verificarZona(peticion: PeticionVerificarZona): Promise<RespuestaVerificarZona> {
    return solicitar<RespuestaVerificarZona>("POST", "/progreso/verificar-zona", peticion);
  },

  obtenerEspecies(tipo?: string): Promise<RespuestaEspecies> {
    const sufijo = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
    return solicitar<RespuestaEspecies>("GET", `/especies${sufijo}`);
  },

  obtenerEspecie(slug: string): Promise<EspecieDetalle> {
    return solicitar<EspecieDetalle>("GET", `/especies/${encodeURIComponent(slug)}`);
  },

  obtenerHistorial(categoria?: string): Promise<RespuestaHistorial> {
    const sufijo = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
    return solicitar<RespuestaHistorial>("GET", `/historial${sufijo}`);
  },
  actualizarOrdenEquipo(peticion: {
    criaturaIds?: string[];
    orden?: { criaturaId: string; orden: number }[];
  }): Promise<RespuestaEquipo> {
    return solicitar<RespuestaEquipo>("PATCH", "/equipo/orden", peticion);
  },
} satisfies ApiJuego;
