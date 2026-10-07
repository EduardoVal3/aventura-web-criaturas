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
  type RespuestaRegistro,
  type RespuestaRestaurar,
  type RespuestaSalud,
  type RespuestaTransferirCriatura,
  type RespuestaUsarItem,
  type RespuestaVerificarZona,
  type RespuestaViajar,
  type UbicacionActual,
} from "./ApiJuego";

let tokenActual: string | null = null;

async function solicitar<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const urlBase = import.meta.env.VITE_URL_API ?? "";
  const url = `${urlBase}/api${ruta}`;

  const encabezados: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (tokenActual) {
    encabezados.Authorization = `Bearer ${tokenActual}`;
  }

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
    let codigo = "ERROR_DESCONOCIDO";
    let mensaje = "No se pudo completar la solicitud.";

    try {
      const datosError = await respuesta.json();
      if (datosError?.error) {
        codigo = datosError.error.codigo ?? codigo;
        mensaje = datosError.error.mensaje ?? mensaje;
      }
    } catch {
      // simplificacion: si el cuerpo no es JSON legible, se usan los valores por defecto.
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
    return solicitar<RespuestaLogout>("POST", "/usuarios/logout");
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

  obtenerHistorial(): Promise<RespuestaHistorial> {
    return solicitar<RespuestaHistorial>("GET", "/historial");
  },
} satisfies ApiJuego;
