import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router";

import { LayoutPrincipal } from "@/componentes/LayoutPrincipal";
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
  const { token, personajeActivo } = useAutenticacion();
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
        element: <PantallaIngreso />,
      },
      {
        path: "/registro",
        element: <PantallaRegistro />,
      },
      {
        path: "/crear-personaje",
        element: <PantallaCrearPersonaje />,
      },
      {
        path: "/hub",
        element: <PantallaHubUbicacion />,
      },
      {
        path: "/exploracion",
        element: <PantallaExploracion />,
      },
      {
        path: "/combate",
        element: <PantallaCombate />,
      },
      {
        path: "/equipo",
        element: <PantallaEquipo />,
      },
      {
        path: "/almacen",
        element: <PantallaAlmacen />,
      },
      {
        path: "/inventario",
        element: <PantallaInventario />,
      },
      {
        path: "/tienda",
        element: <PantallaTienda />,
      },
      {
        path: "/curacion",
        element: <PantallaCuracion />,
      },
      {
        path: "/catalogo",
        element: <PantallaCatalogo />,
      },
      {
        path: "/historial",
        element: <PantallaHistorial />,
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
