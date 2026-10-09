import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  type PersonajeActivo,
  type PeticionLogin,
  type PeticionRegistro,
  type RespuestaLogin,
  type RespuestaRegistro,
} from "@/api";

export interface UsuarioSesion {
  usuarioId: string;
  nombreUsuario: string;
  correo?: string;
}

export interface ContextoAutenticacionTipo {
  token: string | null;
  usuario: UsuarioSesion | null;
  personajeActivo: PersonajeActivo | null;
  cargando: boolean;
  iniciarSesion: (peticion: PeticionLogin) => Promise<RespuestaLogin>;
  registrarUsuario: (peticion: PeticionRegistro) => Promise<RespuestaRegistro>;
  cerrarSesion: () => Promise<void>;
  actualizarPersonajeActivo: () => Promise<PersonajeActivo | null>;
  establecerPersonajeActivo: (personaje: PersonajeActivo | null) => void;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionTipo | undefined>(
  undefined,
);

const CLAVE_ALMACENAMIENTO_TOKEN = "aethelgard_token_acceso";

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const [tokenInicial] = useState<string | null>(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO_TOKEN);
      if (guardado) {
        api.establecerToken(guardado);
      }
      return guardado;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(tokenInicial);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [personajeActivo, setPersonajeActivo] = useState<PersonajeActivo | null>(null);
  const [cargando, setCargando] = useState<boolean>(() => Boolean(tokenInicial));

  const actualizarPersonajeActivo = useCallback(async (): Promise<PersonajeActivo | null> => {
    try {
      const personaje = await api.obtenerPersonajeActivo();
      setPersonajeActivo(personaje);
      return personaje;
    } catch {
      setPersonajeActivo(null);
      return null;
    }
  }, []);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await api.cerrarSesion();
    } catch {
      // simplificacion: si falla en servidor por token inválido, se purga de todos modos en cliente
    } finally {
      setToken(null);
      api.establecerToken(null);
      setUsuario(null);
      setPersonajeActivo(null);
      try {
        localStorage.removeItem(CLAVE_ALMACENAMIENTO_TOKEN);
      } catch {
        // ignorar fallo
      }
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    api.establecerToken(token);

    if (token) {
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, token);
      } catch {
        // ignorar fallo
      }
      api
        .obtenerPersonajeActivo()
        .then((personaje) => {
          if (!cancelado) {
            setPersonajeActivo(personaje);
          }
        })
        .catch((error: unknown) => {
          if (!cancelado) {
            setPersonajeActivo(null);
            if (
              typeof error === "object" &&
              error !== null &&
              "estado" in error &&
              (error as { estado: number }).estado === 401
            ) {
              cerrarSesion();
            }
          }
        })
        .finally(() => {
          if (!cancelado) {
            setCargando(false);
          }
        });
    } else {
      try {
        localStorage.removeItem(CLAVE_ALMACENAMIENTO_TOKEN);
      } catch {
        // ignorar fallo
      }
      setCargando(false);
    }

    return () => {
      cancelado = true;
    };
  }, [token, cerrarSesion]);

  useEffect(() => {
    const alDesautorizar = () => {
      cerrarSesion();
    };
    window.addEventListener("aethelgard:no-autorizado", alDesautorizar);
    return () => {
      window.removeEventListener("aethelgard:no-autorizado", alDesautorizar);
    };
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(
    async (peticion: PeticionLogin): Promise<RespuestaLogin> => {
      const respuesta = await api.iniciarSesion(peticion);
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, respuesta.tokenAcceso);
      } catch {
        // ignorar fallo
      }
      setToken(respuesta.tokenAcceso);
      api.establecerToken(respuesta.tokenAcceso);
      setUsuario({
        usuarioId: respuesta.usuarioId,
        nombreUsuario: respuesta.nombreUsuario,
        correo: peticion.correo,
      });
      if (respuesta.tienePersonaje) {
        await actualizarPersonajeActivo();
      } else {
        setPersonajeActivo(null);
      }
      return respuesta;
    },
    [actualizarPersonajeActivo],
  );

  const registrarUsuario = useCallback(
    async (peticion: PeticionRegistro): Promise<RespuestaRegistro> => {
      const respuesta = await api.registrarUsuario(peticion);
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, respuesta.tokenAcceso);
      } catch {
        // ignorar fallo
      }
      setToken(respuesta.tokenAcceso);
      api.establecerToken(respuesta.tokenAcceso);
      setUsuario({
        usuarioId: respuesta.usuarioId,
        nombreUsuario: respuesta.nombreUsuario,
        correo: respuesta.correo,
      });
      setPersonajeActivo(null);
      return respuesta;
    },
    [],
  );

  const valor: ContextoAutenticacionTipo = {
    token,
    usuario,
    personajeActivo,
    cargando,
    iniciarSesion,
    registrarUsuario,
    cerrarSesion,
    actualizarPersonajeActivo,
    establecerPersonajeActivo: setPersonajeActivo,
  };

  return (
    <ContextoAutenticacion.Provider value={valor}>
      {children}
    </ContextoAutenticacion.Provider>
  );
}

export function useAutenticacion(): ContextoAutenticacionTipo {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error(
      "useAutenticacion debe ser utilizado dentro de un ProveedorAutenticacion",
    );
  }
  return contexto;
}
