import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
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
  Settings,
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
  type CriaturaEquipo,
  ErrorApi,
} from "@/api";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import {
  detenerMusicaAmbiente,
  iniciarMusicaAmbiente,
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

const IDS_SERVICIOS_IZQUIERDA = ["catalogo", "historial", "almacen"] as const;
const IDS_SERVICIOS_DERECHA = ["curacion", "tienda", "inventario"] as const;

export function PantallaHubUbicacion() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAutenticacion();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [viajando, setViajando] = useState(false);
  const [desbloqueandoId, setDesbloqueandoId] = useState<string | null>(null);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoMapaTerritorial | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [transicionActiva, setTransicionActiva] = useState<EstadoTransicionViaje | null>(null);
  const montadoRef = useRef(true);
  const animacionCompletadaRef = useRef(false);
  const viajePendienteRef = useRef<{
    ubicacion: UbicacionActual;
    mensaje: string;
  } | null>(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarTodo = useCallback(async () => {
    const [datosUbicacion, datosPersonaje, datosEquipo] = await Promise.all([
      api.obtenerUbicacionActual(),
      api.obtenerPersonajeActivo(),
      api.obtenerEquipo().catch(() => null),
    ]);
    setUbicacion(datosUbicacion);
    setPersonaje(datosPersonaje);
    setEquipo(datosEquipo?.criaturas ?? []);
  }, []);

  useEffect(() => {
    iniciarMusicaAmbiente("hub");
    return () => detenerMusicaAmbiente();
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

  const lider: LiderMapaInfo | null = useMemo(() => {
    const primero = equipo[0];
    if (!primero) return null;
    return {
      nombre: primero.apodo || primero.nombre,
      especieSlug: primero.slug,
      nivel: primero.nivel,
    };
  }, [equipo]);

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

  const finalizarViajeSiListo = useCallback(() => {
    if (!montadoRef.current) return;
    if (!animacionCompletadaRef.current || !viajePendienteRef.current) return;
    const pendiente = viajePendienteRef.current;
    viajePendienteRef.current = null;
    animacionCompletadaRef.current = false;
    setUbicacion(pendiente.ubicacion);
    toast.success(pendiente.mensaje);
    setTransicionActiva(null);
    setViajando(false);
  }, []);

  const handleViajar = async (conexion: ConexionUbicacion) => {
    if (viajando) return;
    if (!ubicacion) return;
    try {
      setViajando(true);
      reproducirSonido("confirmar", 0.5);

      const origenId = ubicacion.ubicacionId;
      const origenNombre = ubicacion.nombre;

      animacionCompletadaRef.current = false;
      viajePendienteRef.current = null;
      setNodoSeleccionado(null);
      setTransicionActiva({
        origenId,
        origenNombre,
        destinoId: conexion.ubicacionDestinoId,
        destinoNombre: conexion.nombre,
      });

      const respuesta = await api.viajar({ destinoId: conexion.ubicacionDestinoId });
      const nuevaUbicacion = await api.obtenerUbicacionActual();
      if (!montadoRef.current) return;
      viajePendienteRef.current = {
        ubicacion: nuevaUbicacion,
        mensaje: respuesta.mensaje || `Has viajado hacia ${respuesta.nombre}`,
      };
      finalizarViajeSiListo();
    } catch (error) {
      viajePendienteRef.current = null;
      animacionCompletadaRef.current = false;
      if (!montadoRef.current) return;
      setTransicionActiva(null);
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
    animacionCompletadaRef.current = true;
    finalizarViajeSiListo();
  }, [finalizarViajeSiListo]);

  const handleCerrarSesion = async () => {
    reproducirSonido("click", 0.4);
    await cerrarSesion();
    toast.info("Has cerrado sesión.");
    navigate("/ingreso");
  };

  const handleBotonPrincipal = () => {
    if (!ubicacion || viajando) return;
    reproducirSonido("confirmar", 0.45);
    if (!ubicacion.esSegura) {
      navigate("/exploracion");
      return;
    }
    const primeraDisponible = ubicacion.conexiones.find((c) => !c.estaBloqueada);
    if (primeraDisponible) {
      const nodoDestino = nodosMapa.find((n) => n.id === primeraDisponible.ubicacionDestinoId);
      if (nodoDestino) {
        setNodoSeleccionado(nodoDestino);
        return;
      }
    }
    toast.info("Toca una isla conectada en el mapa para emprender camino.");
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

  const renderBotonFlotanteServicio = (servicio: ServicioHub) => {
    // En zonas silvestres (servicios=[]), los servicios exclusivos de localidad quedan en modo solo consulta
    const requiereLocalidad =
      Boolean(servicio.codigoLocalidad) && servicio.codigoLocalidad !== "HISTORIAL";
    const activoEnZona =
      ubicacion?.esSegura === false && requiereLocalidad
        ? false
        : estaServicioHabilitadoEnZona(servicio, ubicacion?.servicios);

    return (
      <Link
        key={servicio.id}
        to={servicio.ruta}
        onClick={(e) => {
          if (viajando) {
            e.preventDefault();
            return;
          }
          reproducirSonido("click", 0.35);
        }}
        aria-disabled={viajando}
        className={cn(
          "group pointer-events-auto bg-gradient-to-r from-[#0d1628]/95 to-[#16233b]/95 backdrop-blur-xs border-2 border-black shadow-[4px_4px_0_0_#000] px-2 py-1.5 sm:px-2.5 sm:py-2 flex items-center gap-2 transition-all w-11 sm:w-40 justify-center sm:justify-start hover:border-[#14d1e8] hover:-translate-y-0.5 hover:shadow-[4px_6px_0_0_#000,0_0_12px_rgba(20,209,232,0.28)] active:translate-y-0.5",
          !activoEnZona && "opacity-85",
          viajando && "pointer-events-none opacity-50",
        )}
        title={
          activoEnZona
            ? servicio.titulo
            : `${servicio.titulo} (Solo consulta aquí; viaja a una localidad con este servicio para operar)`
        }
      >
        <div className="relative shrink-0 size-7 sm:size-8 bg-[#080e1a] border border-[#14d1e8]/40 flex items-center justify-center">
          {renderIconoServicio(servicio.icono)}
          {!activoEnZona && (
            <Lock className="size-2.5 text-amber-300 absolute -top-1 -right-1 bg-black rounded-full p-0.5" />
          )}
        </div>
        <div className="hidden sm:flex flex-col min-w-0">
          <span className="retro text-[8px] text-slate-100 leading-tight break-words mb-1.5">
            {servicio.titulo}
          </span>
          <span className="text-[9px] text-[#14d1e8]/80 leading-tight">
            {activoEnZona ? "Disponible" : "Solo consulta"}
          </span>
        </div>
      </Link>
    );
  };

  if (cargando) {
    return (
      <div className="relative h-screen h-[100dvh] w-full bg-[#070d18] overflow-hidden overflow-x-hidden p-4 flex flex-col justify-between animate-pulse">
        <Skeleton className="h-14 w-full max-w-md bg-[#1a2332] border-4 border-black" />
        <Skeleton className="h-24 w-full max-w-xl mx-auto bg-[#1a2332] border-4 border-black" />
      </div>
    );
  }

  const serviciosIzquierda = SERVICIOS_HUB.filter((s) =>
    (IDS_SERVICIOS_IZQUIERDA as readonly string[]).includes(s.id),
  );
  const serviciosDerecha = SERVICIOS_HUB.filter((s) =>
    (IDS_SERVICIOS_DERECHA as readonly string[]).includes(s.id),
  );

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
  const especiesNodo = nodoSeleccionado
    ? nodoSeleccionado.id === ubicacion?.ubicacionId
      ? ubicacion.especiesHabitantes
      : conexionSeleccionada?.especiesHabitantes
    : undefined;

  return (
    <div className="relative h-screen h-[100dvh] w-full bg-[#070d18] overflow-hidden overflow-x-hidden flex flex-col justify-between">
      {/* Capa 1: Canvas Interactivo de fondo con position: absolute */}
      {ubicacion && (
        <div className="absolute inset-0 z-0">
          <MapaInteractivoCanvas
            nodos={nodosMapa}
            conexiones={ubicacion.conexiones}
            ubicacionActualId={ubicacion.ubicacionId}
            lider={lider}
            onSeleccionarNodo={(nodo) => setNodoSeleccionado(nodo)}
          />
        </div>
      )}

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

      {/* Capa 2: HUD Superior Flotante (Relative) */}
      {ubicacion && (
        <header
          aria-label="HUD superior del explorador"
          className="relative z-20 pointer-events-none px-2.5 pt-2.5 sm:px-4 sm:pt-3 flex items-start justify-between gap-2"
        >
          {/* Ficha del Jugador + Miniatura de Zona Actual (HUD superior) */}
          <div className="pointer-events-auto bg-gradient-to-r from-[#0b1322]/95 via-[#132038]/95 to-[#0b1322]/95 backdrop-blur-xs border-2 border-[#14d1e8]/80 outline outline-2 outline-black shadow-[6px_6px_0_0_#000] px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 max-w-[72vw] sm:max-w-xl">
            <div className="relative size-10 sm:size-12 bg-[#070b14] border-2 border-amber-400 shadow-[inset_0_0_10px_rgba(20,209,232,0.35)] p-0.5 shrink-0 flex items-center justify-center">
              <img
                src={obtenerImagenCriatura(lider?.especieSlug)}
                alt={lider?.nombre || "Líder"}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                className="w-full h-full object-contain scale-x-[-1] anim-respiracion-combate"
              />
              {ubicacion.poderEquipo && (
                <span className="retro text-[6.5px] bg-amber-400 text-black font-bold px-1 border border-black absolute -bottom-1.5 -right-1.5">
                  NV.{ubicacion.poderEquipo.nivelMaximoEquipo}
                </span>
              )}
            </div>
            <div className="relative w-14 sm:w-24 aspect-video bg-[#070b14] border-2 border-[#14d1e8]/70 shadow-[2px_2px_0_0_#000] overflow-hidden shrink-0">
              <img
                src={obtenerImagenZona(sanitizarSlugZona(ubicacion.nombre))}
                alt={`Vista de ${ubicacion.nombre}`}
                decoding="async"
                onError={(e) => manejarErrorImagen(e, "zona")}
                className="w-full h-full object-cover"
              />
              <span className="retro text-[5.5px] bg-black/80 text-[#14d1e8] px-1 py-0.5 absolute bottom-0 left-0 right-0 truncate text-center">
                ZONA
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="retro text-[9px] sm:text-[11px] text-white font-bold truncate drop-shadow-[1px_1px_0_#000]">
                  {personaje?.nombre ?? "Explorador"}
                </span>
                {ubicacion.poderEquipo ? (
                  <span
                    title={`Rango de domador: ${ubicacion.poderEquipo.rangoDomador}`}
                    className="hidden sm:inline-flex items-center gap-0.5 retro text-[7px] bg-black/80 text-[#14d1e8] px-1.5 py-0.5 border border-[#14d1e8]/40 whitespace-nowrap"
                  >
                    <Crown className="size-2.5" />
                    NV.{ubicacion.poderEquipo.nivelMaximoEquipo} · {ubicacion.poderEquipo.rangoDomador}
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-0.5 retro text-[7px] bg-black/70 text-amber-300 px-1.5 py-0.5 border border-amber-400/50">
                    <Crown className="size-2.5" />
                    {ubicacion.esSegura ? "ZONA SEGURA" : "ZONA SALVAJE"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="retro text-[7px] sm:text-[8px] text-[#14d1e8] truncate">
                  {ubicacion.nombre}
                </span>
              </div>
              {!ubicacion.esSegura && typeof ubicacion.progresoZona === "number" && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-black border border-slate-700 overflow-hidden min-w-[60px]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, ubicacion.progresoZona))}%` }}
                    />
                  </div>
                  <span className="retro text-[6.5px] text-emerald-300 shrink-0">
                    {ubicacion.progresoZona}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Monedas + Menú de Ajustes / Salir */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="bg-gradient-to-b from-amber-950/95 to-[#1b1206]/95 backdrop-blur-xs border-2 border-amber-400/80 outline outline-2 outline-black shadow-[4px_4px_0_0_#000] px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5">
              <Coins className="size-3.5 sm:size-4 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
              <span className="retro text-[9px] sm:text-[11px] text-amber-200 font-bold">
                {personaje?.monedas ?? 0}
              </span>
            </div>

            <AlertDialog open={menuAbierto} onOpenChange={setMenuAbierto}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Opciones y sesión"
                  disabled={viajando}
                  className={cn(
                    "size-9 sm:size-10 border-2 border-black shadow-[4px_4px_0_0_#000] bg-card/95 text-slate-100 hover:text-[#14d1e8]",
                    viajando && "pointer-events-none opacity-50",
                  )}
                >
                  <Settings className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-sm border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="retro text-xs sm:text-sm text-[#14d1e8]">
                    MENÚ DE AETHELGARD
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-300">
                    Accesos del sistema y cierre de sesión seguro.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                  <Link
                    to="/kit-ui"
                    onClick={() => {
                      reproducirSonido("click", 0.3);
                      setMenuAbierto(false);
                    }}
                    className="block w-full text-center retro text-[9px] border-2 border-black bg-card px-3 py-2 shadow-[3px_3px_0_0_#000] hover:border-[#14d1e8]"
                  >
                    KIT DE INTERFAZ
                  </Link>
                  <Link
                    to="/creditos"
                    onClick={() => {
                      reproducirSonido("click", 0.3);
                      setMenuAbierto(false);
                    }}
                    className="block w-full text-center retro text-[9px] border-2 border-black bg-card px-3 py-2 shadow-[3px_3px_0_0_#000] hover:border-[#14d1e8]"
                  >
                    CRÉDITOS Y LICENCIAS
                  </Link>
                </div>

                <AlertDialogFooter className="gap-3 sm:gap-4 w-full mt-4">
                  <AlertDialogCancel className="retro text-[9px] border-2 border-black">
                    PERMANECER
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCerrarSesion}
                    className="retro text-[9px] border-2 border-black bg-red-700 hover:bg-red-600 text-white"
                  >
                    <LogOut className="size-3.5 mr-1" />
                    SALIR
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
      )}

      {/* Capa 3: Botoneras Laterales Flotantes (Relative, estilo juego) */}
      {ubicacion && (
        <div className="relative z-20 pointer-events-none flex-1 flex items-center justify-between px-2 sm:px-4">
          <div className="flex flex-col gap-2">
            {serviciosIzquierda.map(renderBotonFlotanteServicio)}
          </div>
          <div className="flex flex-col gap-2">
            {serviciosDerecha.map(renderBotonFlotanteServicio)}
          </div>
        </div>
      )}

      {/* Capa 4: Dock Inferior estilo Juego (Equipo + Botón Principal EXPLORAR / VIAJAR) */}
      {ubicacion && (
        <footer
          aria-label="Dock inferior de equipo y acción principal"
          className="relative z-20 pointer-events-none px-2.5 pb-2.5 sm:px-4 sm:pb-3 flex flex-col items-center gap-2"
        >
          <div className="pointer-events-auto w-full max-w-2xl bg-gradient-to-r from-[#0b1322]/95 via-[#14223b]/95 to-[#0b1322]/95 backdrop-blur-xs border-4 border-black shadow-[6px_6px_0_0_#000] ring-1 ring-[#14d1e8]/60 p-2 sm:p-2.5 flex items-center justify-between gap-2 sm:gap-3">
            {/* Ranuras rápidas del equipo activo con barra HP */}
            <Link
              to="/equipo"
              onClick={() => reproducirSonido("click", 0.35)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 min-w-0 group",
                viajando && "pointer-events-none opacity-50",
              )}
              title="Gestionar Equipo Activo"
            >
              {Array.from({ length: 4 }).map((_, indice) => {
                const criatura = equipo[indice];
                const hpPct =
                  criatura && criatura.hpMaximo > 0
                    ? Math.max(0, Math.min(100, Math.round((criatura.hpActual / criatura.hpMaximo) * 100)))
                    : 0;
                const colorHp =
                  hpPct > 50 ? "bg-emerald-400" : hpPct > 20 ? "bg-amber-400" : "bg-red-500";
                return (
                  <div
                    key={indice}
                    className={cn(
                      "w-11 h-12 sm:w-13 sm:h-14 border-2 border-black bg-[#070b14] flex flex-col items-center justify-between p-1 relative shrink-0 group-hover:border-[#14d1e8] transition-colors",
                      indice === 0 && criatura && "border-[#14d1e8] shadow-[0_0_8px_rgba(20,209,232,0.3)]",
                    )}
                  >
                    {criatura ? (
                      <>
                        <img
                          src={obtenerImagenCriatura(criatura.slug)}
                          alt={criatura.nombre}
                          onError={(e) => manejarErrorImagen(e, "criatura")}
                          className="w-7 h-7 sm:w-9 sm:h-9 object-contain scale-x-[-1]"
                        />
                        <div className="w-full h-1 bg-slate-900 border border-black overflow-hidden">
                          <div className={`h-full ${colorHp}`} style={{ width: `${hpPct}%` }} />
                        </div>
                        <span className="retro text-[6px] bg-black/95 text-amber-300 px-1 border border-black absolute -top-1.5 -right-1.5">
                          {criatura.nivel}
                        </span>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <Users className="size-3.5 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}
              {equipo.length > 4 && (
                <span className="retro text-[8px] text-[#14d1e8] pl-0.5">
                  +{equipo.length - 4}
                </span>
              )}
            </Link>

            {/* Botón Principal Central estilo Arcade RPG */}
            <Button
              type="button"
              disabled={viajando}
              onClick={handleBotonPrincipal}
              className={cn(
                "retro text-[10px] sm:text-xs h-12 sm:h-14 px-4 sm:px-7 border-4 border-black shadow-[inset_0_2px_0_rgba(255,255,255,0.4),4px_4px_0_0_#000] shrink-0 active:translate-y-0.5 transition-all",
                !ubicacion.esSegura
                  ? "bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white"
                  : "bg-gradient-to-b from-[#22d3ee] to-[#0284c7] hover:from-[#67e8f9] hover:to-[#0ea5e9] text-black",
                viajando && "pointer-events-none opacity-50",
              )}
            >
              {!ubicacion.esSegura ? (
                <>
                  <Swords className="size-4 mr-1.5" />
                  EXPLORAR
                </>
              ) : (
                <>
                  <Compass className="size-4 mr-1.5" />
                  VIAJAR
                </>
              )}
            </Button>
          </div>
        </footer>
      )}

      {/* Modal Retro de Inspección y Decisión de Viaje al hacer clic en una Isla */}
      <AlertDialog
        open={Boolean(nodoSeleccionado)}
        onOpenChange={(abierto) => {
          if (!abierto && !viajando) {
            setNodoSeleccionado(null);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto overflow-x-hidden border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 text-slate-100">
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

              <div className="border-2 border-black bg-black/80 overflow-hidden h-32 sm:h-40 relative">
                <img
                  src={obtenerImagenZona(slugSeleccionado)}
                  alt={nodoSeleccionado.nombre}
                  onError={(e) => manejarErrorImagen(e, "zona")}
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

                {/* Previa de Fauna del Hábitat (Subfase 10n) */}
                {especiesNodo && especiesNodo.length > 0 && (
                  <div className="bg-black/50 border border-black p-2 space-y-1 mt-1">
                    <span className="retro text-[7px] sm:text-[8px] text-amber-400 uppercase tracking-widest block">
                      Fauna del Hábitat:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {especiesNodo.map((esp) => (
                        <span
                          key={esp.slug ?? esp.nombre}
                          className="bg-[#1a2332] border border-black px-1.5 py-0.5 text-[7px] text-slate-200 retro flex items-center gap-1"
                        >
                          {esp.nombre}
                          {esp.esLegendaria && <Crown className="size-2 text-amber-400" />}
                          {esp.esEspecial && !esp.esLegendaria && <Sparkles className="size-2 text-amber-300" />}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist estructurado de desbloqueo territorial (Subfases 10m/10n) */}
                {conexionSeleccionada?.estaBloqueada ? (
                  <div className="border-t-2 border-black bg-black/50 p-2.5 space-y-1.5 mt-3">
                    <div className="flex items-center justify-between gap-2 text-[8px] sm:text-[9px] retro">
                      <span className="flex items-center gap-1 text-slate-300">
                        {conexionSeleccionada.cumpleRequisito ? (
                          <Sparkles className="size-3 text-amber-400 shrink-0" />
                        ) : (
                          <Lock className="size-3 text-red-400 shrink-0" />
                        )}
                        <span className="font-bold">PROGRESO DE DESBLOQUEO</span>
                      </span>
                      <span className={conexionSeleccionada.cumpleRequisito ? "text-amber-400 font-bold" : "text-slate-300"}>
                        {conexionSeleccionada.progresoActual ?? 0}% / {conexionSeleccionada.progresoObjetivo ?? 100}%
                      </span>
                    </div>
                    <Progress
                      value={conexionSeleccionada.progresoActual ?? 0}
                      className="h-2 rounded-none border border-black"
                    />

                    {conexionSeleccionada.requisitoCartografia && (
                      <div className="flex items-start gap-1 text-[8px] sm:text-[9px] retro">
                        {conexionSeleccionada.requisitoCartografia.completada ? (
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span className={conexionSeleccionada.requisitoCartografia.completada ? "text-emerald-300" : "text-slate-300"}>
                          Cartografía previa: [{conexionSeleccionada.requisitoCartografia.zonaId}] {conexionSeleccionada.requisitoCartografia.nombre} al 100% ({conexionSeleccionada.requisitoCartografia.progresoActual}%)
                        </span>
                      </div>
                    )}

                    {conexionSeleccionada.requisitoNivelEquipo && (
                      <div className="flex items-start gap-1 text-[8px] sm:text-[9px] retro">
                        {conexionSeleccionada.requisitoNivelEquipo.cumplido ? (
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span className={conexionSeleccionada.requisitoNivelEquipo.cumplido ? "text-emerald-300" : "text-slate-300"}>
                          Poder de equipo: Requiere {conexionSeleccionada.requisitoNivelEquipo.cantidadCriaturas} criatura(s) Nv.{conexionSeleccionada.requisitoNivelEquipo.nivelRequerido}+ (Tienes: {conexionSeleccionada.requisitoNivelEquipo.cantidadActual ?? 0} · Mejor: Nv.{conexionSeleccionada.requisitoNivelEquipo.nivelMaximoActual})
                        </span>
                      </div>
                    )}

                    {(conexionSeleccionada.detalleProgreso || conexionSeleccionada.requisito) && (
                      <p className="retro text-[8px] sm:text-[9px] text-slate-300 leading-relaxed">
                        {conexionSeleccionada.detalleProgreso ?? conexionSeleccionada.requisito}
                      </p>
                    )}

                    {conexionSeleccionada.cumpleRequisito && (
                      <Badge className="retro text-[7px] mt-1 bg-amber-950 text-amber-300 border border-amber-400">
                        LISTA PARA DESBLOQUEAR
                      </Badge>
                    )}
                  </div>
                ) : conexionSeleccionada?.requisito ? (
                  <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-300 border-t-2 border-black mt-3">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs">{conexionSeleccionada.requisito}</p>
                  </div>
                ) : null}

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
                      aria-busy={desbloqueandoId === nodoSeleccionado.id}
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

export default PantallaHubUbicacion;
