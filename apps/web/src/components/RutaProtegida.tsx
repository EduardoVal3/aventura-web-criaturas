import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { Spinner } from "@/components/ui/8bit/spinner";

interface RutaProtegidaProps {
  children: ReactNode;
  requierePersonaje?: boolean;
}

export function RutaProtegida({
  children,
  requierePersonaje = true,
}: RutaProtegidaProps) {
  const { cargando, token, personajeActivo } = useAutenticacion();

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

  return <>{children}</>;
}

export function RutaPublica({ children }: { children: ReactNode }) {
  const { cargando, token, personajeActivo } = useAutenticacion();

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

  if (token) {
    if (personajeActivo) {
      return <Navigate to="/hub" replace />;
    }
    return <Navigate to="/crear-personaje" replace />;
  }

  return <>{children}</>;
}
