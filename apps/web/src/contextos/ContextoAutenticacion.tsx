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
  // simplificacion: almacenamiento en localStorage para preservar sesión durante navegación y recarga local.
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CLAVE_ALMACENAMIENTO_TOKEN);
    } catch {
      return null;
    }
  });

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [personajeActivo, setPersonajeActivo] = useState<PersonajeActivo | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

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

  useEffect(() => {
    api.establecerToken(token);
    if (token) {
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO_TOKEN, token);
      } catch {
        // ignorar fallo de almacenamiento en modo restringido
      }
      actualizarPersonajeActivo().finally(() => {
        setCargando(false);
      });
    } else {
      try {
        localStorage.removeItem(CLAVE_ALMACENAMIENTO_TOKEN);
      } catch {
        // ignorar fallo
      }
      setUsuario(null);
      setPersonajeActivo(null);
      setCargando(false);
    }
  }, [token, actualizarPersonajeActivo]);

  const iniciarSesion = useCallback(
    async (peticion: PeticionLogin): Promise<RespuestaLogin> => {
      const respuesta = await api.iniciarSesion(peticion);
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

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await api.cerrarSesion();
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
