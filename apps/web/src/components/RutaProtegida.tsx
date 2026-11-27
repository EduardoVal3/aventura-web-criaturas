import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { Spinner } from "@/components/ui/8bit/spinner";

interface RutaProtegidaProps {
  children: ReactNode;
  requierePersonaje?: boolean;
  permitirEnCombate?: boolean;
}

export function RutaProtegida({
  children,
  requierePersonaje = true,
  permitirEnCombate = false,
}: RutaProtegidaProps) {
  const { cargando, token, personajeActivo, combateActivo } = useAutenticacion();
  const bloqueadoPorCombate =
    !cargando &&
    Boolean(token) &&
    requierePersonaje &&
    Boolean(personajeActivo) &&
    combateActivo &&
    !permitirEnCombate;

  useEffect(() => {
    if (bloqueadoPorCombate) {
      toast.info(
        "Tienes un combate en curso. Resuélvelo antes de cambiar de pantalla.",
        { id: "bloqueo-combate-activo" },
      );
    }
  }, [bloqueadoPorCombate]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6">
        <Spinner className="size-8 text-primary" />
        <p className="font-mono text-sm tracking-wider text-muted-foreground animate-pulse">
          Verificando sesión en Aethelgard...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/ingreso" replace />;
  }

  if (requierePersonaje && !personajeActivo) {
    return <Navigate to="/crear-personaje" replace />;
  }

  if (bloqueadoPorCombate) {
    return (
      <Navigate
        to="/combate"
        state={{ encuentroActivoConfirmado: true }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export function RutaPublica({ children }: { children: ReactNode }) {
  const { cargando, token, personajeActivo, combateActivo } = useAutenticacion();

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6">
        <Spinner className="size-8 text-primary" />
        <p className="font-mono text-sm tracking-wider text-muted-foreground animate-pulse">
          Verificando sesión en Aethelgard...
        </p>
      </div>
    );
  }

  // simplificacion: si ya está completamente autenticado con personaje activo, se le remite al combate activo o al hub.
  // Si no posee personaje o desea iniciar sesión/registrarse con otra cuenta, se le permite acceder a la vista pública.
  if (token && personajeActivo) {
    return (
      <Navigate
        to={combateActivo ? "/combate" : "/hub"}
        state={combateActivo ? { encuentroActivoConfirmado: true } : undefined}
        replace
      />
    );
  }

  return <>{children}</>;
}

