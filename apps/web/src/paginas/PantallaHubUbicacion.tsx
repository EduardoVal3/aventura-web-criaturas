import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Map as MapIcon,
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
  CheckCircle2,
  XCircle,
  Crown,
  Swords,
} from "lucide-react";
import {
  MapaInteractivoCanvas,
  type LiderMapaInfo,
} from "@/components/mundo/MapaInteractivoCanvas";
import { TransicionViaje2D } from "@/components/mundo/TransicionViaje2D";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Progress } from "@/components/ui/8bit/progress";
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
  type NodoMapaTerritorial,
  ErrorApi,
} from "@/api";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import {
  RUTAS_PLACEHOLDERS,
  manejarErrorImagen,
  obtenerImagenCriatura,
  obtenerImagenZona,
  reproducirSonido,
  sanitizarSlugZona,
} from "@/lib/assets";
import {
  SERVICIOS_HUB,
  type ServicioHub,
  estaServicioHabilitadoEnZona,
  formatearRangoFauna,
  evaluarRiesgoFauna,
  construirNodosMapaFallback,
} from "@/lib/servicios-hub";
import { cn } from "@/lib/utils";

interface EstadoTransicionViaje {
  origenId: string;
  origenNombre: string;
  destinoId: string;
  destinoNombre: string;
}

export function PantallaHubUbicacion() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAutenticacion();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [lider, setLider] = useState<LiderMapaInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [viajando, setViajando] = useState(false);
  const [desbloqueandoId, setDesbloqueandoId] = useState<string | null>(null);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoMapaTerritorial | null>(null);
  const [transicionActiva, setTransicionActiva] = useState<EstadoTransicionViaje | null>(null);
  const [pendienteTrasAnimacion, setPendienteTrasAnimacion] = useState<{
    ubicacion: UbicacionActual;
    mensaje: string;
  } | null>(null);

  const cargarTodo = useCallback(async () => {
    const [datosUbicacion, datosPersonaje, datosEquipo] = await Promise.all([
      api.obtenerUbicacionActual(),
      api.obtenerPersonajeActivo(),
      api.obtenerEquipo().catch(() => null),
    ]);
    setUbicacion(datosUbicacion);
    setPersonaje(datosPersonaje);

    const criaturaLider = datosEquipo?.criaturas?.[0];
    if (criaturaLider) {
      setLider({
        nombre: criaturaLider.apodo || criaturaLider.nombre,
        especieSlug: criaturaLider.slug,
        nivel: criaturaLider.nivel,
      });
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      try {
        await cargarTodo();
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
    void iniciar();
    return () => {
      cancelado = true;
    };
  }, [cargarTodo, navigate]);

  const nodosMapa = useMemo(
    () => (ubicacion ? construirNodosMapaFallback(ubicacion) : []),
    [ubicacion],
  );

  const conexionSeleccionada: ConexionUbicacion | null = useMemo(() => {
    if (!ubicacion || !nodoSeleccionado) return null;
    return (
      ubicacion.conexiones.find((c) => c.ubicacionDestinoId === nodoSeleccionado.id) ?? null
    );
  }, [nodoSeleccionado, ubicacion]);

  const handleDesbloquearRuta = async (zonaId: string) => {
    if (desbloqueandoId || viajando) return;
    try {
      setDesbloqueandoId(zonaId);
      reproducirSonido("click", 0.4);
      const res = await api.verificarZona({ zonaId });
      if (res.desbloqueada) {
        reproducirSonido("confirmar", 0.6);
        toast.success(res.mensaje);
        const nuevaUbicacion = await api.obtenerUbicacionActual();
        setUbicacion(nuevaUbicacion);
        setNodoSeleccionado((prev) =>
          prev && prev.id === zonaId ? { ...prev, desbloqueada: true } : prev,
        );
      }
    } catch (error) {
      reproducirSonido("error", 0.5);
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No fue posible desbloquear la senda.");
      }
    } finally {
      setDesbloqueandoId(null);
    }
  };

  const handleViajar = async (conexion: ConexionUbicacion) => {
    if (viajando || !ubicacion) return;
    try {
      setViajando(true);
      reproducirSonido("confirmar", 0.5);

      const origenId = ubicacion.ubicacionId;
      const origenNombre = ubicacion.nombre;

      setNodoSeleccionado(null);
      setTransicionActiva({
        origenId,
        origenNombre,
        destinoId: conexion.ubicacionDestinoId,
        destinoNombre: conexion.nombre,
      });

      const respuesta = await api.viajar({ destinoId: conexion.ubicacionDestinoId });
      const nuevaUbicacion = await api.obtenerUbicacionActual();
      setPendienteTrasAnimacion({
        ubicacion: nuevaUbicacion,
        mensaje: respuesta.mensaje || `Has viajado hacia ${respuesta.nombre}`,
      });
    } catch (error) {
      setTransicionActiva(null);
      setPendienteTrasAnimacion(null);
      setViajando(false);
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
    }
  };

  const handleAnimacionViajeCompletada = useCallback(() => {
    if (pendienteTrasAnimacion) {
      setUbicacion(pendienteTrasAnimacion.ubicacion);
      toast.success(pendienteTrasAnimacion.mensaje);
      setPendienteTrasAnimacion(null);
      setTransicionActiva(null);
      setViajando(false);
    }
  }, [pendienteTrasAnimacion]);

  // Si la API terminó después de la animación, aplicamos en cuanto llegue
  useEffect(() => {
    if (!transicionActiva && pendienteTrasAnimacion) {
      setUbicacion(pendienteTrasAnimacion.ubicacion);
      toast.success(pendienteTrasAnimacion.mensaje);
      setPendienteTrasAnimacion(null);
      setViajando(false);
    }
  }, [pendienteTrasAnimacion, transicionActiva]);

  const handleCerrarSesion = async () => {
    reproducirSonido("click", 0.4);
    await cerrarSesion();
    toast.info("Has cerrado sesión.");
    navigate("/ingreso");
  };

  const renderIconoServicio = (icono: ServicioHub["icono"]) => {
    const clase = "size-4 sm:size-5 text-[#14d1e8] group-hover:scale-110 transition-transform";
    switch (icono) {
      case "compass":
        return <Compass className={clase} />;
      case "users":
        return <Users className={clase} />;
      case "package":
        return <Package className={clase} />;
      case "backpack":
        return <Backpack className={clase} />;
      case "store":
        return <Store className={clase} />;
      case "sparkles":
        return <Sparkles className={clase} />;
      case "book-open":
        return <BookOpen className={clase} />;
      case "scroll":
        return <Scroll className={clase} />;
    }
  };

  if (cargando) {
    return (
      <div className="space-y-4 w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-x-hidden animate-pulse">
        <div className="bg-card border-4 border-black shadow-[6px_6px_0_0_#000] p-3">
          <Skeleton className="h-14 w-full bg-[#1a2332] border-2 border-black" />
        </div>
        <div className="bg-card border-4 border-black shadow-[6px_6px_0_0_#000] p-2">
          <Skeleton className="h-[54vh] min-h-[380px] w-full bg-[#1a2332] border-2 border-black" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-20 w-full bg-card border-2 border-black shadow-[4px_4px_0_0_#000]"
            />
          ))}
        </div>
      </div>
    );
  }

  const slugSeleccionado = nodoSeleccionado
    ? sanitizarSlugZona(nodoSeleccionado.nombre)
    : "zona";
  const riesgoSeleccionado = nodoSeleccionado
    ? evaluarRiesgoFauna(
        ubicacion?.poderEquipo?.nivelMaximoEquipo ?? 1,
        nodoSeleccionado.faunaNivelMinimo,
        nodoSeleccionado.faunaNivelMaximo,
      )
    : null;

  return (
    <div className="space-y-4 w-full max-w-6xl mx-auto px-1.5 sm:px-3 py-1 sm:py-2 overflow-x-hidden">
      {/* Transición animada 2D de viaje */}
      {transicionActiva && (
        <TransicionViaje2D
          origenId={transicionActiva.origenId}
          origenNombre={transicionActiva.origenNombre}
          destinoId={transicionActiva.destinoId}
          destinoNombre={transicionActiva.destinoNombre}
          lider={lider}
          onCompletado={handleAnimacionViajeCompletada}
        />
      )}

      {/* HUD Superior Flotante (Relative) */}
      {ubicacion && (
        <section
          aria-label="Resumen del explorador"
          className="relative z-10 bg-card border-4 border-black shadow-[6px_6px_0_0_#000] p-2.5 sm:p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Identidad del Jugador y Líder */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-10 sm:size-12 bg-black border-2 border-[#14d1e8] shadow-[2px_2px_0_0_#000] p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src={obtenerImagenCriatura(lider?.especieSlug)}
                  alt={lider?.nombre || "Líder de equipo"}
                  onError={(e) => manejarErrorImagen(e, RUTAS_PLACEHOLDERS.criatura)}
                  className="w-full h-full object-contain scale-x-[-1]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="retro text-[10px] sm:text-xs text-slate-100 font-bold truncate">
                    {personaje?.nombre ?? "Explorador"}
                  </span>
                  <Badge className="retro text-[7px] bg-[#14d1e8]/20 text-[#14d1e8] border border-[#14d1e8]/50">
                    {ubicacion.nombre}
                  </Badge>
                </div>
                <p className="retro text-[7px] sm:text-[8px] text-slate-400 mt-0.5 truncate">
                  {lider
                    ? `Líder: ${lider.nombre} (Nv.${lider.nivel})`
                    : "Sin líder asignado"}
                  {ubicacion.poderEquipo
                    ? ` · ${ubicacion.poderEquipo.rangoDomador}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Métricas y Botón Salir */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-black/70 border-2 border-black shadow-[4px_4px_0_0_#000] px-2.5 py-1 flex items-center gap-1.5">
                <Coins className="size-3.5 text-amber-400 shrink-0" />
                <span className="retro text-[9px] sm:text-[10px] text-amber-300">
                  {personaje?.monedas ?? 0}
                </span>
              </div>

              {ubicacion.poderEquipo && (
                <div className="hidden sm:flex bg-black/70 border-2 border-black shadow-[4px_4px_0_0_#000] px-2.5 py-1 items-center gap-1.5">
                  <Crown className="size-3.5 text-[#14d1e8] shrink-0" />
                  <span className="retro text-[9px] text-slate-200">
                    MAX NV.{ubicacion.poderEquipo.nivelMaximoEquipo}
                  </span>
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={viajando}
                    className={cn(
                      "retro text-[8px] sm:text-[9px] h-8 border-2 border-black bg-red-950/70 text-red-200 hover:bg-red-900",
                      viajando && "pointer-events-none opacity-50",
                    )}
                  >
                    <LogOut className="size-3.5 mr-1" />
                    SALIR
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="retro text-xs sm:text-sm text-[#14d1e8]">
                      CERRAR SESIÓN
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs sm:text-sm text-slate-300">
                      Tu progreso queda guardado en el servidor de Aethelgard. ¿Deseas salir ahora?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3 sm:gap-4 w-full mt-4">
                    <AlertDialogCancel className="retro text-[9px] border-2 border-black">
                      PERMANECER
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCerrarSesion}
                      className="retro text-[9px] border-2 border-black bg-red-700 hover:bg-red-600 text-white"
                    >
                      SALIR
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>
      )}

      {/* Mapa Interactivo Navegable (Canvas absolute + Nodos relative) */}
      {ubicacion && (
        <section aria-label="Mapa navegable de Aethelgard">
          <MapaInteractivoCanvas
            nodos={nodosMapa}
            conexiones={ubicacion.conexiones}
            ubicacionActualId={ubicacion.ubicacionId}
            lider={lider}
            onSeleccionarNodo={(nodo) => setNodoSeleccionado(nodo)}
          />
        </section>
      )}

      {/* Dock Inferior de Servicios del Hub (Relative) */}
      <section aria-label="Servicios disponibles" className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-black border border-black flex items-center justify-center">
              <MapIcon className="size-3.5 text-[#14d1e8]" />
            </div>
            <h2 className="retro text-[10px] sm:text-xs text-slate-100 tracking-wider">
              ACCIONES Y SERVICIOS ({ubicacion?.nombre.toUpperCase()})
            </h2>
          </div>
          {ubicacion && !ubicacion.esSegura && typeof ubicacion.progresoZona === "number" && (
            <div className="flex items-center gap-2">
              <span className="retro text-[8px] text-amber-300">
                PROGRESO {ubicacion.progresoZona}%
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {SERVICIOS_HUB.map((servicio) => {
            const habilitado = estaServicioHabilitadoEnZona(
              servicio,
              ubicacion?.servicios,
            );
            return (
              <Link
                key={servicio.id}
                to={habilitado ? servicio.ruta : "#"}
                onClick={(e) => {
                  if (!habilitado || viajando) {
                    e.preventDefault();
                    reproducirSonido("error", 0.35);
                    toast.info(
                      `${servicio.titulo} solo está disponible en localidades con este servicio.`,
                    );
                    return;
                  }
                  reproducirSonido("click", 0.35);
                }}
                aria-disabled={!habilitado || viajando}
                className={cn(
                  "group bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-2.5 sm:p-3 flex flex-col justify-between transition-all",
                  habilitado && !viajando
                    ? "hover:border-[#14d1e8] hover:-translate-y-0.5 active:translate-y-0.5"
                    : "opacity-50 grayscale cursor-not-allowed",
                  viajando && "pointer-events-none opacity-50",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="size-8 bg-black border border-black flex items-center justify-center shrink-0">
                    {renderIconoServicio(servicio.icono)}
                  </div>
                  {!habilitado && <Lock className="size-3.5 text-slate-400 shrink-0" />}
                </div>
                <div>
                  <span className="retro text-[9px] sm:text-[10px] text-slate-100 block leading-tight break-words mb-1.5">
                    {servicio.titulo}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {servicio.descripcion}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Modal Retro de Inspección y Decisión de Viaje al hacer clic en una Isla */}
      <AlertDialog
        open={Boolean(nodoSeleccionado)}
        onOpenChange={(abierto) => {
          if (!abierto && !viajando) {
            setNodoSeleccionado(null);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-lg border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100">
          {nodoSeleccionado && (
            <>
              <AlertDialogHeader className="space-y-2 text-left">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    className={cn(
                      "retro text-[8px] border border-black",
                      nodoSeleccionado.esSegura
                        ? "bg-emerald-900 text-emerald-200"
                        : "bg-amber-900 text-amber-200",
                    )}
                  >
                    {nodoSeleccionado.esSegura ? (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="size-3" /> LOCALIDAD SEGURA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Skull className="size-3" /> ZONA SILVESTRE
                      </span>
                    )}
                  </Badge>

                  {riesgoSeleccionado && !nodoSeleccionado.esSegura && (
                    <Badge className="retro text-[7px] bg-black/80 border border-black text-[#14d1e8]">
                      <Swords className="size-3 mr-1" />
                      {riesgoSeleccionado.etiqueta}
                    </Badge>
                  )}
                </div>

                <AlertDialogTitle className="retro text-xs sm:text-sm text-[#14d1e8]">
                  {nodoSeleccionado.nombre.toUpperCase()}
                </AlertDialogTitle>

                <AlertDialogDescription className="sr-only">
                  Detalles e inspección de viaje para {nodoSeleccionado.nombre}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Vista previa del paisaje de la zona */}
              <div className="border-2 border-black bg-black/80 overflow-hidden h-32 sm:h-40 relative">
                <img
                  src={obtenerImagenZona(slugSeleccionado)}
                  alt={nodoSeleccionado.nombre}
                  onError={(e) => manejarErrorImagen(e, RUTAS_PLACEHOLDERS.zona)}
                  className="w-full h-full object-cover"
                />
                {!nodoSeleccionado.desbloqueada && (
                  <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 bg-black/90 border-2 border-amber-400 px-3 py-1.5">
                      <Lock className="size-4 text-amber-300" />
                      <span className="retro text-[9px] text-amber-300">SENDA BLOQUEADA</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha interior retro de destino */}
              <div className="border-2 border-black bg-black/60 p-3 space-y-1.5 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]">
                <p className="retro text-[8px] sm:text-[9px] text-slate-200">
                  {formatearRangoFauna(
                    nodoSeleccionado.faunaNivelMinimo,
                    nodoSeleccionado.faunaNivelMaximo,
                    conexionSeleccionada?.nivelSugerido ?? null,
                    nodoSeleccionado.esSegura,
                  )}
                </p>

                {!nodoSeleccionado.esSegura && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between retro text-[8px] text-slate-300">
                      <span>CARTOGRAFÍA DE ZONA</span>
                      <span className="text-amber-300">{nodoSeleccionado.progreso}%</span>
                    </div>
                    <Progress
                      value={nodoSeleccionado.progreso}
                      className="h-2.5 border border-black bg-black"
                    />
                  </div>
                )}

                {conexionSeleccionada?.requisito && (
                  <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-300 border-t-2 border-black mt-3">
                    {conexionSeleccionada.cumpleRequisito ? (
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-[11px] sm:text-xs">{conexionSeleccionada.requisito}</p>
                      {conexionSeleccionada.cumpleRequisito && (
                        <Badge className="retro text-[7px] mt-1 bg-amber-950 text-amber-300 border border-amber-400">
                          LISTA PARA DESBLOQUEAR
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {!conexionSeleccionada && nodoSeleccionado.id !== ubicacion?.ubicacionId && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    No tiene conexión directa desde {ubicacion?.nombre}. Viaja primero a una isla conectada por puente.
                  </p>
                )}
              </div>

              <AlertDialogFooter className="gap-3 sm:gap-4 w-full mt-4 flex-col sm:flex-row">
                <AlertDialogCancel
                  disabled={viajando}
                  className="retro text-[9px] border-2 border-black"
                >
                  PERMANECER
                </AlertDialogCancel>

                {nodoSeleccionado.id === ubicacion?.ubicacionId ? (
                  !ubicacion.esSegura ? (
                    <Button
                      type="button"
                      onClick={() => {
                        reproducirSonido("confirmar", 0.4);
                        setNodoSeleccionado(null);
                        navigate("/exploracion");
                      }}
                      className="retro text-[9px] border-2 border-black bg-[#14d1e8] text-black hover:bg-[#38bdf8]"
                    >
                      <Compass className="size-3.5 mr-1.5" />
                      EXPLORAR ZONA
                    </Button>
                  ) : null
                ) : conexionSeleccionada?.estaBloqueada ? (
                  conexionSeleccionada.cumpleRequisito ? (
                    <Button
                      type="button"
                      disabled={Boolean(desbloqueandoId) || viajando}
                      onClick={() => handleDesbloquearRuta(nodoSeleccionado.id)}
                      className="retro text-[9px] border-2 border-black bg-amber-500 text-black hover:bg-amber-400"
                    >
                      {desbloqueandoId === nodoSeleccionado.id ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                          DESBLOQUEANDO...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 mr-1.5" />
                          DESBLOQUEAR SENDA
                        </>
                      )}
                    </Button>
                  ) : null
                ) : conexionSeleccionada ? (
                  <AlertDialogAction
                    type="button"
                    aria-busy={viajando}
                    disabled={viajando}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleViajar(conexionSeleccionada);
                    }}
                    className="retro text-[9px] border-2 border-black bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {viajando ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        VIAJANDO...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="size-3.5 mr-1.5" />
                        EMPRENDER CAMINO
                      </>
                    )}
                  </AlertDialogAction>
                ) : null}
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
