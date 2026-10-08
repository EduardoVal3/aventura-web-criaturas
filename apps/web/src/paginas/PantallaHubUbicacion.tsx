import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/8bit/alert-dialog";
import {
  api,
  type PersonajeActivo,
  type UbicacionActual,
  type ConexionUbicacion,
  ErrorApi,
} from "@/api";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";

export function PantallaHubUbicacion() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAutenticacion();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [viajando, setViajando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        const [datosUbicacion, datosPersonaje] = await Promise.all([
          api.obtenerUbicacionActual(),
          api.obtenerPersonajeActivo(),
        ]);
        if (!cancelado) {
          setUbicacion(datosUbicacion);
          setPersonaje(datosPersonaje);
        }
      } catch (error) {
        if (!cancelado) {
          if (error instanceof ErrorApi && error.estado === 401) {
            toast.error("Sesión expirada o no autorizada. Ingresa nuevamente.");
            navigate("/ingreso");
          } else {
            toast.error("Error al cargar los datos del asentamiento.");
          }
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }
    cargarDatos();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const handleViajar = async (conexion: ConexionUbicacion) => {
    try {
      setViajando(true);
      const respuesta = await api.viajar({ destinoId: conexion.ubicacionDestinoId });
      toast.success(respuesta.mensaje || `Has viajado hacia ${respuesta.nombre}`);
      const nuevaUbicacion = await api.obtenerUbicacionActual();
      setUbicacion(nuevaUbicacion);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No fue posible completar el viaje.");
      }
    } finally {
      setViajando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    toast.info("Has cerrado sesión.");
    navigate("/ingreso");
  };

  if (cargando) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera del Explorador y Asentamiento */}
      <Card className="border-2 border-primary/50 shadow-md">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl text-primary font-bold">
                  {ubicacion?.nombre ?? "Villa Serena"}
                </CardTitle>
                <Badge variant={ubicacion?.esSegura ? "default" : "destructive"}>
                  {ubicacion?.esSegura ? "Localidad Segura" : "Zona Hostil"}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                {ubicacion?.descripcion}
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCerrarSesion}
              className="text-xs self-end sm:self-auto"
            >
              Cerrar sesión
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 border-t border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-muted/40 rounded">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Explorador
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {personaje?.nombre ?? "Aventurero"}
              </span>
            </div>

            <div className="p-2 bg-muted/40 rounded">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Monedas
              </span>
              <span className="font-semibold text-sm sm:text-base text-amber-500">
                {personaje?.monedas ?? 0} oro
              </span>
            </div>

            <div className="p-2 bg-muted/40 rounded">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Equipo Activo
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {personaje?.totalCriaturasEquipo ?? 0} / 6
              </span>
            </div>

            <div className="p-2 bg-muted/40 rounded">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Almacén
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {personaje?.totalCriaturasAlmacen ?? 0} criaturas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servicios de la Localidad */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide">
          Servicios del Asentamiento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link to="/exploracion" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Exploración
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Incursiona en rutas silvestres
              </CardDescription>
            </Card>
          </Link>

          <Link to="/equipo" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Equipo Activo
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Inspecciona tus 6 criaturas
              </CardDescription>
            </Card>
          </Link>

          <Link to="/almacen" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Almacén
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Reserva y transfiere aliados
              </CardDescription>
            </Card>
          </Link>

          <Link to="/inventario" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Inventario
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Bolsa de objetos y pociones
              </CardDescription>
            </Card>
          </Link>

          <Link to="/tienda" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Tienda / Bazar
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Compra talismanes y botiquines
              </CardDescription>
            </Card>
          </Link>

          <Link to="/curacion" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Santuario de Salud
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Restaura todo tu equipo
              </CardDescription>
            </Card>
          </Link>

          <Link to="/catalogo" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Compendio Open5e
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Consulta especies del mundo
              </CardDescription>
            </Card>
          </Link>

          <Link to="/historial" className="block focus:outline-hidden group">
            <Card className="h-full hover:border-primary transition-all p-3 text-center flex flex-col justify-between items-center group-hover:scale-[1.02]">
              <CardTitle className="text-xs sm:text-sm font-semibold mb-1 text-primary">
                Bitácora
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Registro de eventos pasados
              </CardDescription>
            </Card>
          </Link>
        </div>
      </div>

      {/* Rutas y Destinos de Viaje */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide">
          Rutas y Destinos de Viaje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ubicacion?.conexiones?.map((conexion) => (
            <Card key={conexion.ubicacionDestinoId} className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold">
                    {conexion.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Nivel recomendado: {conexion.nivelSugerido}
                  </CardDescription>
                </div>
                {conexion.estaBloqueada ? (
                  <Badge variant="destructive">Bloqueada</Badge>
                ) : (
                  <Badge variant="secondary">Accesible</Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                {conexion.estaBloqueada ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs text-destructive">
                        Requisito de acceso
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Zona Bloqueada: {conexion.nombre}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {conexion.requisito ?? "Esta zona requiere mayor experiencia o cumplir misiones previas."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction>Comprendido</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={viajando}
                    onClick={() => handleViajar(conexion)}
                  >
                    {viajando ? "Viajando..." : "Viajar a esta ruta"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PantallaHubUbicacion;
