import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Map,
  Users,
  Package,
  Backpack,
  Store,
  Sparkles,
  BookOpen,
  Scroll,
  Compass,
  Coins,
  Lock,
  ArrowRight,
  ShieldCheck,
  Skull,
  LogOut,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
import {
  obtenerImagenZona,
  manejarErrorImagen,
  reproducirSonido,
  sanitizarSlugZona,
} from "@/lib/assets";
import {
  SERVICIOS_HUB,
  type ServicioHub,
  estaServicioHabilitadoEnZona,
} from "@/lib/servicios-hub";

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
    if (viajando) return;
    try {
      setViajando(true);
      reproducirSonido("confirmar", 0.5);
      const respuesta = await api.viajar({ destinoId: conexion.ubicacionDestinoId });
      toast.success(respuesta.mensaje || `Has viajado hacia ${respuesta.nombre}`);
      const nuevaUbicacion = await api.obtenerUbicacionActual();
      setUbicacion(nuevaUbicacion);
    } catch (error) {
      reproducirSonido("error", 0.5);
      if (error instanceof ErrorApi) {
        if (error.codigo === "ZONA_BLOQUEADA") {
          toast.error(`Zona bloqueada: ${error.message}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("No fue posible completar el viaje.");
      }
    } finally {
      setViajando(false);
    }
  };

  const handleCerrarSesion = async () => {
    reproducirSonido("click", 0.4);
    await cerrarSesion();
    toast.info("Has cerrado sesión.");
    navigate("/ingreso");
  };

  const renderIconoServicio = (icono: ServicioHub["icono"]) => {
    switch (icono) {
      case "compass":
        return <Compass className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "users":
        return <Users className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "package":
        return <Package className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "backpack":
        return <Backpack className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "store":
        return <Store className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "sparkles":
        return <Sparkles className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "book-open":
        return <BookOpen className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
      case "scroll":
        return <Scroll className="size-5 text-[#14d1e8] group-hover:scale-110 transition-transform" />;
    }
  };

  if (cargando) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4 animate-pulse">
        {/* Skeleton del Hero del Asentamiento */}
        <div className="bg-[#121927] border-2 border-[#43526d] p-4 space-y-4">
          <Skeleton className="h-48 sm:h-64 w-full bg-[#1a2332]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-16 w-full bg-[#1a2332]" />
            <Skeleton className="h-16 w-full bg-[#1a2332]" />
            <Skeleton className="h-16 w-full bg-[#1a2332]" />
            <Skeleton className="h-16 w-full bg-[#1a2332]" />
          </div>
        </div>

        {/* Skeleton de Servicios */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-64 bg-[#1a2332]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-[#121927] border-2 border-[#43526d]" />
            ))}
          </div>
        </div>

        {/* Skeleton de Rutas */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-64 bg-[#1a2332]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full bg-[#121927] border-2 border-[#43526d]" />
            <Skeleton className="h-32 w-full bg-[#121927] border-2 border-[#43526d]" />
          </div>
        </div>
      </div>
    );
  }

  const slugZona = ubicacion?.slug || sanitizarSlugZona(ubicacion?.nombre || ubicacion?.ubicacionId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Hero del Asentamiento y Paisaje Retro */}
      <div className="relative bg-[#121927] border-2 border-[#43526d] overflow-hidden">
        {/* Contenedor del paisaje de la zona */}
        <div className="relative w-full h-48 sm:h-64 bg-[#090d16] border-b-2 border-[#43526d] overflow-hidden">
          <img
            src={obtenerImagenZona(slugZona)}
            onError={(e) => manejarErrorImagen(e, "zona")}
            alt={`Paisaje de ${ubicacion?.nombre ?? "Aethelgard"}`}
            className="w-full h-full object-cover object-center pixelated filter brightness-95 contrast-105"
          />

          {/* Degradado oscuro para integrar con el panel y maximizar contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121927] via-transparent to-black/40 pointer-events-none" />

          {/* Badges superiores sobre el paisaje */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
            <div>
              {ubicacion?.esSegura ? (
                <Badge
                  font="retro"
                  className="bg-emerald-950/80 text-emerald-400 border-emerald-500 gap-1.5 py-1 px-2.5 backdrop-blur-xs"
                >
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  <span className="text-[10px]">LOCALIDAD SEGURA</span>
                </Badge>
              ) : (
                <Badge
                  font="retro"
                  className="bg-red-950/80 text-red-400 border-red-500 gap-1.5 py-1 px-2.5 backdrop-blur-xs"
                >
                  <Skull className="size-3.5 text-red-400" />
                  <span className="text-[10px]">ZONA HOSTIL</span>
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              font="retro"
              onClick={handleCerrarSesion}
              className="bg-[#090d16]/80 text-slate-300 hover:text-red-400 border-[#43526d] hover:border-red-400 text-[10px] gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <LogOut className="size-3.5" />
              <span>SALIR</span>
            </Button>
          </div>

          {/* Nombre y descripción de la localidad */}
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <h1 className="retro text-lg sm:text-2xl text-[#14d1e8] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {ubicacion?.nombre ?? "Villa Serena"}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {ubicacion?.descripcion}
            </p>
          </div>
        </div>

        {/* Panel Superior del Explorador: Nombre, Oro, Equipo y Almacén */}
        <div className="p-3 sm:p-4 bg-[#121927]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Nombre del Explorador */}
            <div className="p-2.5 bg-[#1a2332] border border-[#43526d]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="retro text-[9px] uppercase tracking-wider">Explorador</span>
                <Compass className="size-3.5 text-[#14d1e8]" />
              </div>
              <span className="font-sans font-bold text-sm sm:text-base text-slate-100 truncate">
                {personaje?.nombre ?? "Aventurero"}
              </span>
            </div>

            {/* Monedas de Oro con Icono Coins */}
            <div className="p-2.5 bg-[#1a2332] border border-[#43526d]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="retro text-[9px] uppercase tracking-wider">Monedas</span>
                <Coins className="size-3.5 text-[#f5b724]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="retro text-xs sm:text-sm font-bold text-[#f5b724]">
                  {personaje?.monedas ?? 0}
                </span>
                <span className="font-sans text-[10px] text-amber-200/80">oro</span>
              </div>
            </div>

            {/* Equipo Activo (X/6) con Icono Users */}
            <div className="p-2.5 bg-[#1a2332] border border-[#43526d]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="retro text-[9px] uppercase tracking-wider">Equipo Activo</span>
                <Users className="size-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="retro text-xs sm:text-sm font-bold text-emerald-400">
                  {personaje?.totalCriaturasEquipo ?? 0}
                </span>
                <span className="font-sans text-[10px] text-slate-400">/ 6 aliados</span>
              </div>
            </div>

            {/* Almacén con Icono Package */}
            <div className="p-2.5 bg-[#1a2332] border border-[#43526d]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="retro text-[9px] uppercase tracking-wider">Almacén</span>
                <Package className="size-3.5 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="retro text-xs sm:text-sm font-bold text-slate-200">
                  {personaje?.totalCriaturasAlmacen ?? 0}
                </span>
                <span className="font-sans text-[10px] text-slate-400">criaturas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuadrícula de Servicios de la Localidad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#43526d]/60 pb-2">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-[#14d1e8]" />
            <h2 className="retro text-xs sm:text-sm text-slate-100 tracking-wider">
              SERVICIOS DE LA LOCALIDAD
            </h2>
          </div>
          <span className="font-sans text-xs text-slate-400 hidden sm:inline">
            Instalaciones y actividades del gremio
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {SERVICIOS_HUB.map((servicio) => {
            const disponible = estaServicioHabilitadoEnZona(servicio, ubicacion?.servicios);

            return (
              <Link
                key={servicio.id}
                to={servicio.ruta}
                onClick={() => reproducirSonido("click", 0.35)}
                className="block focus:outline-hidden group"
              >
                <div className="h-full bg-[#121927] hover:bg-[#1a2332] border-2 border-[#43526d] hover:border-[#14d1e8] p-3 sm:p-4 text-center flex flex-col justify-between items-center transition-all duration-200 group-hover:scale-[1.02] active:translate-y-0.5">
                  <div className="w-full flex items-center justify-between mb-2">
                    <div className="size-8 rounded bg-[#1a2332] group-hover:bg-[#121927] border border-[#43526d]/60 flex items-center justify-center transition-colors">
                      {renderIconoServicio(servicio.icono)}
                    </div>
                    {disponible ? (
                      <span
                        className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                        title="Servicio de la localidad"
                      />
                    ) : (
                      <span
                        className="size-2 rounded-full bg-slate-600"
                        title="Acceso general"
                      />
                    )}
                  </div>

                  <div className="w-full text-left">
                    <span className="retro text-[11px] sm:text-xs font-semibold text-[#14d1e8] block truncate mb-1">
                      {servicio.titulo}
                    </span>
                    <p className="font-sans text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {servicio.descripcion}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rutas y Destinos de Viaje */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#43526d]/60 pb-2">
          <div className="flex items-center gap-2">
            <Map className="size-4 text-[#14d1e8]" />
            <h2 className="retro text-xs sm:text-sm text-slate-100 tracking-wider">
              RUTAS Y DESTINOS DE VIAJE
            </h2>
          </div>
          <span className="font-sans text-xs text-slate-400 hidden sm:inline">
            Senderos conectados a esta posición
          </span>
        </div>

        {!ubicacion?.conexiones || ubicacion.conexiones.length === 0 ? (
          <div className="bg-[#121927] border-2 border-[#43526d] p-6 text-center">
            <Compass className="size-8 text-slate-500 mx-auto mb-2" />
            <p className="font-sans text-sm text-slate-300">
              No se divisan sendas transitables desde esta posición.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ubicacion.conexiones.map((conexion) => (
              <div
                key={conexion.ubicacionDestinoId}
                className="bg-[#121927] border-2 border-[#43526d] p-4 flex flex-col justify-between gap-3 transition-colors hover:border-[#14d1e8]/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="retro text-xs sm:text-sm font-bold text-slate-100 block">
                      {conexion.nombre}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-sans mt-1">
                      <Compass className="size-3.5 text-[#14d1e8]" />
                      <span>
                        Nivel sugerido: {conexion.nivelSugerido ?? "Rango libre"}
                      </span>
                    </div>
                  </div>

                  {conexion.estaBloqueada ? (
                    <Badge
                      font="retro"
                      className="bg-red-950/80 text-red-400 border-red-500 gap-1 text-[9px] py-0.5"
                    >
                      <Lock className="size-3 text-red-400" />
                      <span>BLOQUEADA</span>
                    </Badge>
                  ) : (
                    <Badge
                      font="retro"
                      className="bg-emerald-950/80 text-emerald-400 border-emerald-500 gap-1 text-[9px] py-0.5"
                    >
                      <ArrowRight className="size-3 text-emerald-400" />
                      <span>ACCESIBLE</span>
                    </Badge>
                  )}
                </div>

                <div className="pt-2 border-t border-[#43526d]/60">
                  {conexion.estaBloqueada ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          font="retro"
                          onClick={() => reproducirSonido("click", 0.3)}
                          className="w-full text-[10px] text-red-400 border-red-500/60 hover:bg-red-500/10 gap-1.5 cursor-pointer"
                        >
                          <Lock className="size-3 text-red-400" />
                          <span>REQUISITO DE ACCESO</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        font="normal"
                        className="bg-[#121927] border-2 border-[#43526d] text-slate-100 max-w-md"
                      >
                        <AlertDialogHeader>
                          <div className="flex items-center gap-2 text-red-400">
                            <Lock className="size-4" />
                            <AlertDialogTitle className="retro text-xs sm:text-sm text-red-400">
                              RUTA RESTRINGIDA
                            </AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="font-sans text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                            {conexion.requisito ??
                              "Esta senda requiere mayor experiencia o cumplir misiones previas con el gremio."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                          <AlertDialogAction
                            onClick={() => reproducirSonido("click", 0.3)}
                            className="retro bg-[#1a2332] hover:bg-[#232d3f] text-slate-200 border border-[#43526d] text-[10px]"
                          >
                            COMPRENDIDO
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          font="retro"
                          disabled={viajando}
                          onClick={() => reproducirSonido("click", 0.3)}
                          className="w-full text-[10px] bg-[#14d1e8] hover:bg-[#14d1e8]/90 text-slate-950 font-bold border-[#14d1e8] gap-1.5 cursor-pointer"
                        >
                          {viajando ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>VIAJANDO...</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="size-3.5" />
                              <span>VIAJAR A ESTA RUTA</span>
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        font="normal"
                        className="bg-[#121927] border-2 border-[#43526d] text-slate-100 max-w-md"
                      >
                        <AlertDialogHeader>
                          <div className="flex items-center gap-2 text-[#14d1e8]">
                            <Compass className="size-4 text-[#14d1e8]" />
                            <AlertDialogTitle className="retro text-xs sm:text-sm text-[#14d1e8]">
                              CONFIRMAR VIAJE
                            </AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="font-sans text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                            ¿Deseas desplazarte hacia{" "}
                            <strong className="text-white">{conexion.nombre}</strong>?
                            <br />
                            <span className="text-slate-400 mt-1 block">
                              Nivel recomendado: {conexion.nivelSugerido ?? "Rango libre"}.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 flex gap-2">
                          <AlertDialogCancel
                            onClick={() => reproducirSonido("click", 0.3)}
                            className="retro bg-[#1a2332] text-slate-300 hover:text-white border-[#43526d] text-[10px]"
                          >
                            PERMANECER AQUÍ
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleViajar(conexion)}
                            className="retro bg-[#14d1e8] hover:bg-[#14d1e8]/90 text-slate-950 font-bold border-[#14d1e8] text-[10px]"
                          >
                            EMPRENDER CAMINO
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PantallaHubUbicacion;
