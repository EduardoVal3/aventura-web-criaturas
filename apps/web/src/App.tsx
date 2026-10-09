import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router";

import { LayoutPrincipal } from "@/components/LayoutPrincipal";
import { RutaProtegida, RutaPublica } from "@/components/RutaProtegida";
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  ProveedorAutenticacion,
  useAutenticacion,
} from "@/contextos/ContextoAutenticacion";
import { PaginaCreditos } from "@/paginas/PaginaCreditos";
import { PaginaKitUi } from "@/paginas/PaginaKitUi";
import { PaginaNoEncontrada } from "@/paginas/PaginaNoEncontrada";
import { PantallaIngreso } from "@/paginas/PantallaIngreso";
import { PantallaRegistro } from "@/paginas/PantallaRegistro";
import { PantallaCrearPersonaje } from "@/paginas/PantallaCrearPersonaje";
import { PantallaHubUbicacion } from "@/paginas/PantallaHubUbicacion";
import { PantallaExploracion } from "@/paginas/PantallaExploracion";
import { PantallaCombate } from "@/paginas/PantallaCombate";
import { PantallaEquipo } from "@/paginas/PantallaEquipo";
import { PantallaAlmacen } from "@/paginas/PantallaAlmacen";
import { PantallaInventario } from "@/paginas/PantallaInventario";
import { PantallaTienda } from "@/paginas/PantallaTienda";
import { PantallaCuracion } from "@/paginas/PantallaCuracion";
import { PantallaCatalogo } from "@/paginas/PantallaCatalogo";
import { PantallaHistorial } from "@/paginas/PantallaHistorial";

function RutaRaiz() {
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
  if (!personajeActivo) {
    return <Navigate to="/crear-personaje" replace />;
  }
  return <Navigate to="/hub" replace />;
}

const enrutador = createBrowserRouter([
  {
    path: "/",
    element: <LayoutPrincipal />,
    children: [
      {
        index: true,
        element: <RutaRaiz />,
      },
      {
        path: "/ingreso",
        element: (
          <RutaPublica>
            <PantallaIngreso />
          </RutaPublica>
        ),
      },
      {
        path: "/registro",
        element: (
          <RutaPublica>
            <PantallaRegistro />
          </RutaPublica>
        ),
      },
      {
        path: "/crear-personaje",
        element: (
          <RutaProtegida requierePersonaje={false}>
            <PantallaCrearPersonaje />
          </RutaProtegida>
        ),
      },
      {
        path: "/hub",
        element: (
          <RutaProtegida>
            <PantallaHubUbicacion />
          </RutaProtegida>
        ),
      },
      {
        path: "/exploracion",
        element: (
          <RutaProtegida>
            <PantallaExploracion />
          </RutaProtegida>
        ),
      },
      {
        path: "/combate",
        element: (
          <RutaProtegida>
            <PantallaCombate />
          </RutaProtegida>
        ),
      },
      {
        path: "/equipo",
        element: (
          <RutaProtegida>
            <PantallaEquipo />
          </RutaProtegida>
        ),
      },
      {
        path: "/almacen",
        element: (
          <RutaProtegida>
            <PantallaAlmacen />
          </RutaProtegida>
        ),
      },
      {
        path: "/inventario",
        element: (
          <RutaProtegida>
            <PantallaInventario />
          </RutaProtegida>
        ),
      },
      {
        path: "/tienda",
        element: (
          <RutaProtegida>
            <PantallaTienda />
          </RutaProtegida>
        ),
      },
      {
        path: "/curacion",
        element: (
          <RutaProtegida>
            <PantallaCuracion />
          </RutaProtegida>
        ),
      },
      {
        path: "/catalogo",
        element: (
          <RutaProtegida>
            <PantallaCatalogo />
          </RutaProtegida>
        ),
      },
      {
        path: "/historial",
        element: (
          <RutaProtegida>
            <PantallaHistorial />
          </RutaProtegida>
        ),
      },
      {
        path: "/kit-ui",
        element: <PaginaKitUi />,
      },
      {
        path: "/creditos",
        element: <PaginaCreditos />,
      },
      {
        path: "*",
        element: <PaginaNoEncontrada />,
      },
    ],
  },
]);

export function App() {
  return (
    <ProveedorAutenticacion>
      <RouterProvider router={enrutador} />
    </ProveedorAutenticacion>
  );
}

export default App;
