import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  combateActivo: boolean;
  cargando: boolean;
  iniciarSesion: (peticion: PeticionLogin) => Promise<RespuestaLogin>;
  registrarUsuario: (peticion: PeticionRegistro) => Promise<RespuestaRegistro>;
  cerrarSesion: () => Promise<void>;
  actualizarPersonajeActivo: () => Promise<PersonajeActivo | null>;
  establecerPersonajeActivo: (personaje: PersonajeActivo | null) => void;
  establecerCombateActivo: (activo: boolean) => void;
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
  const [combateActivo, setCombateActivo] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(() => Boolean(tokenInicial));
  const omitirBootstrapTokenRef = useRef<string | null>(null);

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

  const limpiarSesionLocal = useCallback(() => {
    omitirBootstrapTokenRef.current = null;
    setToken(null);
    api.establecerToken(null);
    setUsuario(null);
    setPersonajeActivo(null);
    setCombateActivo(false);
    try {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO_TOKEN);
    } catch {
      // ignorar fallo
    }
  }, []);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await api.cerrarSesion();
    } catch {
      // simplificacion: si falla en servidor por token inválido, se purga de todos modos en cliente
    } finally {
      limpiarSesionLocal();
    }
  }, [limpiarSesionLocal]);

  useEffect(() => {
    let cancelado = false;
    api.establecerToken(token);

    if (token) {
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, token);
      } catch {
        // ignorar fallo
      }

      if (omitirBootstrapTokenRef.current === token) {
        omitirBootstrapTokenRef.current = null;
        setCargando(false);
        return () => {
          cancelado = true;
        };
      }

      api
        .obtenerPerfil()
        .then(async (perfil) => {
          if (cancelado) return;
          const usuarioId = perfil.usuarioId ?? perfil.sub;
          if (usuarioId) {
            setUsuario({
              usuarioId,
              nombreUsuario: perfil.nombreUsuario ?? "",
              correo: perfil.correo,
            });
          }

          if (typeof perfil.tieneEncuentroActivo === "boolean") {
            setCombateActivo(perfil.tieneEncuentroActivo);
          }

          if (typeof perfil.tienePersonaje === "boolean") {
            if (!perfil.tienePersonaje) {
              setPersonajeActivo(null);
              setCombateActivo(false);
              return;
            }
            if (perfil.personaje) {
              setPersonajeActivo(perfil.personaje);
              return;
            }
          }

          const personaje = await api.obtenerPersonajeActivo();
          if (!cancelado) {
            setPersonajeActivo(personaje);
          }
        })
        .catch((error: unknown) => {
          if (!cancelado) {
            setPersonajeActivo(null);
            setCombateActivo(false);
            if (
              typeof error === "object" &&
              error !== null &&
              "estado" in error &&
              (error as { estado: number }).estado === 401
            ) {
              limpiarSesionLocal();
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
  }, [token, limpiarSesionLocal]);

  useEffect(() => {
    const alDesautorizar = () => {
      limpiarSesionLocal();
    };
    window.addEventListener("aethelgard:no-autorizado", alDesautorizar);
    return () => {
      window.removeEventListener("aethelgard:no-autorizado", alDesautorizar);
    };
  }, [limpiarSesionLocal]);

  const iniciarSesion = useCallback(
    async (peticion: PeticionLogin): Promise<RespuestaLogin> => {
      const respuesta = await api.iniciarSesion(peticion);
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, respuesta.tokenAcceso);
      } catch {
        // ignorar fallo
      }
      omitirBootstrapTokenRef.current = respuesta.tokenAcceso;
      api.establecerToken(respuesta.tokenAcceso);
      setToken(respuesta.tokenAcceso);
      setUsuario({
        usuarioId: respuesta.usuarioId,
        nombreUsuario: respuesta.nombreUsuario,
        correo: peticion.correo,
      });
      if (respuesta.tienePersonaje) {
        try {
          const perfil = await api.obtenerPerfil();
          setCombateActivo(Boolean(perfil.tieneEncuentroActivo));
          if (perfil.personaje) {
            setPersonajeActivo(perfil.personaje);
          } else {
            await actualizarPersonajeActivo();
          }
        } catch {
          setCombateActivo(false);
          await actualizarPersonajeActivo();
        }
      } else {
        setPersonajeActivo(null);
        setCombateActivo(false);
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
      omitirBootstrapTokenRef.current = respuesta.tokenAcceso;
      api.establecerToken(respuesta.tokenAcceso);
      setToken(respuesta.tokenAcceso);
      setUsuario({
        usuarioId: respuesta.usuarioId,
        nombreUsuario: respuesta.nombreUsuario,
        correo: respuesta.correo,
      });
      setPersonajeActivo(null);
      setCombateActivo(false);
      return respuesta;
    },
    [],
  );

  const valor: ContextoAutenticacionTipo = {
    token,
    usuario,
    personajeActivo,
    combateActivo,
    cargando,
    iniciarSesion,
    registrarUsuario,
    cerrarSesion,
    actualizarPersonajeActivo,
    establecerPersonajeActivo: setPersonajeActivo,
    establecerCombateActivo: setCombateActivo,
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
