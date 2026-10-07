import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router";

import { LayoutPrincipal } from "@/componentes/LayoutPrincipal";
import { PaginaCreditos } from "@/paginas/PaginaCreditos";
import { PaginaKitUi } from "@/paginas/PaginaKitUi";
import { PaginaNoEncontrada } from "@/paginas/PaginaNoEncontrada";
import { PaginaPendiente } from "@/paginas/PaginaPendiente";

const rutasPlaceholder = [
  { ruta: "/ingreso", titulo: "Ingreso" },
  { ruta: "/registro", titulo: "Registro" },
  { ruta: "/crear-personaje", titulo: "Crear personaje" },
  { ruta: "/hub", titulo: "Hub de ubicación" },
  { ruta: "/exploracion", titulo: "Exploración" },
  { ruta: "/combate", titulo: "Combate" },
  { ruta: "/equipo", titulo: "Equipo" },
  { ruta: "/almacen", titulo: "Almacén" },
  { ruta: "/inventario", titulo: "Inventario" },
  { ruta: "/tienda", titulo: "Tienda" },
  { ruta: "/curacion", titulo: "Curación" },
  { ruta: "/catalogo", titulo: "Catálogo" },
  { ruta: "/historial", titulo: "Historial" },
];

const enrutador = createBrowserRouter([
  {
    path: "/",
    element: <LayoutPrincipal />,
    children: [
      {
        index: true,
        element: <Navigate to="/ingreso" replace />,
      },
      {
        path: "/kit-ui",
        element: <PaginaKitUi />,
      },
      {
        path: "/creditos",
        element: <PaginaCreditos />,
      },
      ...rutasPlaceholder.map(({ ruta, titulo }) => ({
        path: ruta,
        element: <PaginaPendiente titulo={titulo} />,
      })),
      {
        path: "*",
        element: <PaginaNoEncontrada />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={enrutador} />;
}

export default App;
