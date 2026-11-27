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
  X,
} from "lucide-react";
import {
  MapaInteractivoCanvas,
  type LiderMapaInfo,
} from "@/components/mundo/MapaInteractivoCanvas";
import { TransicionViaje2D } from "@/components/mundo/TransicionViaje2D";
import { Button } from "@/components/ui/8bit/button";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Progress } from "@/components/ui/8bit/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/8bit/dialog";
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
  const { cerrarSesion, establecerCombateActivo } = useAutenticacion();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [limiteEquipo, setLimiteEquipo] = useState<number>(6);
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
    setLimiteEquipo(Math.max(6, datosEquipo?.limiteEquipo ?? 6));
    if (datosUbicacion.tieneEncuentroActivo === true) {
      establecerCombateActivo(true);
    }
  }, [establecerCombateActivo]);

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
        if (error.codigo === "ENCUENTRO_PREVIO_ACTIVO") {
          establecerCombateActivo(true);
          toast.info("Tienes un combate activo pendiente de resolución.");
          navigate("/combate", { state: { encuentroActivoConfirmado: true } });
        } else if (error.codigo === "ZONA_BLOQUEADA") {
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
      <div className="relative h-dvh w-full bg-[#070d18] overflow-hidden overflow-x-hidden p-4 pt-zona-segura pb-zona-segura flex flex-col justify-between animate-pulse">
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
    <div className="relative h-dvh w-full bg-[#070d18] overflow-hidden overflow-x-hidden flex flex-col justify-between">
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
          className="relative z-20 pointer-events-none px-2.5 pt-zona-segura sm:px-4 sm:pt-3 flex items-start justify-between gap-2 sm:gap-3"
        >
          {/* Ficha del Jugador (sin miniatura redundante de zona para evitar desbordes en móvil) */}
          <div className="min-w-0 flex-1 flex items-start">
            <div className="pointer-events-auto bg-gradient-to-r from-[#0b1322]/95 via-[#132038]/95 to-[#0b1322]/95 backdrop-blur-xs border-2 border-[#14d1e8]/80 outline outline-2 outline-black shadow-[6px_6px_0_0_#000] px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 w-fit max-w-full min-w-0 sm:max-w-lg">
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
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="retro text-[9px] sm:text-[11px] text-white font-bold truncate drop-shadow-[1px_1px_0_#000]">
                    {personaje?.nombre ?? "Explorador"}
                  </span>
                  {ubicacion.poderEquipo ? (
                    <span
                      title={`Rango de domador: ${ubicacion.poderEquipo.rangoDomador}`}
                      className="hidden sm:inline-flex items-center gap-0.5 retro text-[7px] bg-black/80 text-[#14d1e8] px-1.5 py-0.5 border border-[#14d1e8]/40 whitespace-nowrap shrink-0"
                    >
                      <Crown className="size-2.5" />
                      NV.{ubicacion.poderEquipo.nivelMaximoEquipo} · {ubicacion.poderEquipo.rangoDomador}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-0.5 retro text-[7px] bg-black/70 text-amber-300 px-1.5 py-0.5 border border-amber-400/50 whitespace-nowrap shrink-0">
                      <Crown className="size-2.5" />
                      {ubicacion.esSegura ? "ZONA SEGURA" : "ZONA SALVAJE"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <span className="retro text-[7px] sm:text-[8px] text-[#14d1e8] truncate">
                    {ubicacion.nombre}
                  </span>
                </div>
                {!ubicacion.esSegura && typeof ubicacion.progresoZona === "number" && (
                  <div className="mt-1 flex items-center gap-1.5 min-w-0">
                    <div className="flex-1 h-1.5 bg-black border border-slate-700 overflow-hidden min-w-[40px]">
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
          </div>

          {/* Monedas + Menú de Ajustes / Salir */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="bg-gradient-to-b from-amber-950/95 to-[#1b1206]/95 backdrop-blur-xs border-2 border-amber-400/80 outline outline-2 outline-black shadow-[4px_4px_0_0_#000] px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5">
              <Coins className="size-3.5 sm:size-4 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
              <span className="retro text-[9px] sm:text-[11px] text-amber-200 font-bold tabular-nums">
                {personaje?.monedas ?? 0}
              </span>
            </div>

            <Dialog open={menuAbierto} onOpenChange={setMenuAbierto}>
              <DialogTrigger asChild>
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
              </DialogTrigger>
              <DialogContent
                font="normal"
                showCloseButton={false}
                className="w-[calc(100vw-2rem)] sm:max-w-sm max-h-[85dvh] overflow-hidden rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] bg-card p-0 flex flex-col text-slate-100"
              >
                <div className="flex flex-col max-h-[85dvh] overflow-hidden min-w-0">
                  <DialogHeader className="p-3 bg-bastion border-b-2 border-black flex flex-row items-center justify-between gap-3 shrink-0 text-left">
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="retro text-xs sm:text-sm text-[#14d1e8] break-words">
                        MENÚ DE AETHELGARD
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-300 mt-1 break-words">
                        Accesos del sistema y cierre de sesión seguro.
                      </DialogDescription>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar menú"
                      className="text-slate-300 hover:text-white p-1.5 transition-all border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted/40 rounded-none shrink-0 cursor-pointer"
                      onClick={() => setMenuAbierto(false)}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </DialogHeader>

                  <div className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2.5 flex-1 min-w-0">
                    <Link
                      to="/kit-ui"
                      onClick={() => {
                        reproducirSonido("click", 0.3);
                        setMenuAbierto(false);
                      }}
                      className="block w-full text-center retro text-[9px] border-2 border-black bg-bastion px-3 py-2.5 shadow-[3px_3px_0_0_#000] hover:border-[#14d1e8] transition-colors"
                    >
                      KIT DE INTERFAZ
                    </Link>
                    <Link
                      to="/creditos"
                      onClick={() => {
                        reproducirSonido("click", 0.3);
                        setMenuAbierto(false);
                      }}
                      className="block w-full text-center retro text-[9px] border-2 border-black bg-bastion px-3 py-2.5 shadow-[3px_3px_0_0_#000] hover:border-[#14d1e8] transition-colors"
                    >
                      CRÉDITOS Y LICENCIAS
                    </Link>
                  </div>

                  <div className="p-3 bg-bastion border-t-2 border-black shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMenuAbierto(false)}
                      className="w-full sm:w-auto retro text-[9px] border-2 border-black"
                    >
                      PERMANECER
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCerrarSesion}
                      className="w-full sm:w-auto retro text-[9px] border-2 border-black bg-red-700 hover:bg-red-600 text-white"
                    >
                      <LogOut className="size-3.5 mr-1.5" />
                      SALIR
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
      )}

      {/* Capa 3: Botoneras Laterales Flotantes (en móvil arriba para despejar controles del mapa) */}
      {ubicacion && (
        <div className="relative z-20 pointer-events-none flex-1 flex items-start pt-3 sm:items-center sm:pt-0 justify-between px-2 sm:px-4">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {serviciosIzquierda.map(renderBotonFlotanteServicio)}
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {serviciosDerecha.map(renderBotonFlotanteServicio)}
          </div>
        </div>
      )}

      {/* Capa 4: Dock Inferior estilo Juego (Equipo completo 6 ranuras + Botón Principal EXPLORAR / VIAJAR) */}
      {ubicacion && (
        <footer
          aria-label="Dock inferior de equipo y acción principal"
          className="relative z-20 pointer-events-none px-2.5 pb-zona-segura sm:px-4 flex flex-col items-center gap-2 shrink-0"
        >
          <div className="pointer-events-auto w-full max-w-2xl bg-gradient-to-r from-[#0b1322]/95 via-[#14223b]/95 to-[#0b1322]/95 backdrop-blur-xs border-4 border-black shadow-[6px_6px_0_0_#000] ring-1 ring-[#14d1e8]/60 p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
            {/* Ranuras completas del equipo activo (hasta 6 criaturas visibles sin truncar ni ocultar) */}
            <Link
              to="/equipo"
              onClick={() => reproducirSonido("click", 0.35)}
              aria-label={`Gestionar equipo activo (${equipo.length} de ${limiteEquipo} criaturas)`}
              className={cn(
                "grid grid-cols-6 gap-1.5 sm:flex sm:items-center sm:gap-2 min-w-0 group",
                viajando && "pointer-events-none opacity-50",
              )}
              title={`Gestionar Equipo Activo (${equipo.length}/${limiteEquipo})`}
            >
              {Array.from({ length: limiteEquipo }).map((_, indice) => {
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
                      "h-12 sm:w-12 sm:h-14 border-2 flex flex-col items-center justify-between p-1 relative shrink-0 transition-colors",
                      criatura
                        ? "border-black bg-[#070b14] group-hover:border-[#14d1e8]"
                        : "border-slate-800/90 bg-[#050811]/85 group-hover:border-slate-600",
                      indice === 0 && criatura && "border-[#14d1e8] shadow-[0_0_8px_rgba(20,209,232,0.3)]",
                    )}
                  >
                    {criatura ? (
                      <>
                        <span className="retro text-[5.5px] sm:text-[6px] leading-none bg-black/90 text-amber-300 px-1 py-0.5 border border-black/80 absolute top-0.5 right-0.5 z-10 tabular-nums">
                          {criatura.nivel}
                        </span>
                        <img
                          src={obtenerImagenCriatura(criatura.slug)}
                          alt={criatura.nombre}
                          onError={(e) => manejarErrorImagen(e, "criatura")}
                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain scale-x-[-1] mt-1"
                        />
                        <div className="w-full h-1 bg-slate-900 border border-black overflow-hidden">
                          <div className={`h-full ${colorHp}`} style={{ width: `${hpPct}%` }} />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <Users className="size-3 sm:size-3.5 text-slate-700" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}
            </Link>

            {/* Botón Principal Central estilo Arcade RPG */}
            <Button
              type="button"
              disabled={viajando}
              onClick={handleBotonPrincipal}
              className={cn(
                "retro text-[10px] sm:text-xs w-full sm:w-auto h-11 sm:h-14 px-4 sm:px-7 border-4 border-black shadow-[inset_0_2px_0_rgba(255,255,255,0.4),4px_4px_0_0_#000] shrink-0 active:translate-y-0.5 transition-all",
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

      {/* Modal Retro de Inspección y Decisión de Viaje al hacer clic en una Isla (Referencia: PantallaCatalogo) */}
      <Dialog
        open={Boolean(nodoSeleccionado)}
        onOpenChange={(abierto) => {
          if (!abierto && !viajando && !desbloqueandoId) {
            setNodoSeleccionado(null);
          }
        }}
      >
        <DialogContent
          font="normal"
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85dvh] overflow-hidden rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] bg-card p-0 flex flex-col text-slate-100"
        >
          {nodoSeleccionado ? (
            <div className="flex flex-col max-h-[85dvh] overflow-hidden min-w-0">
              {/* Cabecera fija del Modal con Insignias, Título y Botón Cerrar */}
              <DialogHeader className="p-3 bg-bastion border-b-2 border-black flex flex-row items-start justify-between gap-3 shrink-0 text-left">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 retro text-[8px] border border-black shadow-[1px_1px_0_0_#000] rounded-none",
                        nodoSeleccionado.esSegura
                          ? "bg-emerald-900 text-emerald-200"
                          : "bg-amber-900 text-amber-200",
                      )}
                    >
                      {nodoSeleccionado.esSegura ? (
                        <>
                          <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
                          <span>LOCALIDAD SEGURA</span>
                        </>
                      ) : (
                        <>
                          <Skull className="size-3 shrink-0" aria-hidden="true" />
                          <span>ZONA SILVESTRE</span>
                        </>
                      )}
                    </span>

                    {riesgoSeleccionado && !nodoSeleccionado.esSegura && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 retro text-[7px] sm:text-[8px] bg-black/80 border border-black text-[#14d1e8] shadow-[1px_1px_0_0_#000] rounded-none">
                        <Swords className="size-3 shrink-0" aria-hidden="true" />
                        <span>{riesgoSeleccionado.etiqueta}</span>
                      </span>
                    )}
                  </div>

                  <DialogTitle className="retro text-xs sm:text-sm text-[#14d1e8] break-words leading-snug">
                    {nodoSeleccionado.nombre.toUpperCase()}
                  </DialogTitle>

                  <DialogDescription className="sr-only">
                    Detalles e inspección de viaje para {nodoSeleccionado.nombre}
                  </DialogDescription>
                </div>

                <button
                  type="button"
                  disabled={viajando || Boolean(desbloqueandoId)}
                  aria-label="Cerrar inspección de zona"
                  className="text-slate-300 hover:text-white p-1.5 transition-all border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted/40 rounded-none shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => setNodoSeleccionado(null)}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </DialogHeader>

              {/* Cuerpo del Modal con Scroll Interno Limpio */}
              <div className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 flex-1 min-w-0">
                <div className="border-2 border-black bg-black/80 overflow-hidden h-32 sm:h-40 relative shrink-0">
                  <img
                    src={obtenerImagenZona(slugSeleccionado)}
                    alt={nodoSeleccionado.nombre}
                    onError={(e) => manejarErrorImagen(e, "zona")}
                    className="w-full h-full object-cover"
                  />
                  {!nodoSeleccionado.desbloqueada && (
                    <div className="absolute inset-0 bg-black/65 flex items-center justify-center p-2">
                      <div className="flex items-center gap-1.5 bg-black/90 border-2 border-amber-400 px-3 py-1.5">
                        <Lock className="size-4 text-amber-300 shrink-0" />
                        <span className="retro text-[9px] text-amber-300">SENDA BLOQUEADA</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-2 border-black bg-black/60 p-3 space-y-2 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] min-w-0">
                  <p className="retro text-[8px] sm:text-[9px] text-slate-200 break-words leading-relaxed">
                    {formatearRangoFauna(
                      nodoSeleccionado.faunaNivelMinimo,
                      nodoSeleccionado.faunaNivelMaximo,
                      conexionSeleccionada?.nivelSugerido ?? null,
                      nodoSeleccionado.esSegura,
                    )}
                  </p>

                  {!nodoSeleccionado.esSegura && (
                    <div className="space-y-1.5 pt-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap retro text-[8px] text-slate-300">
                        <span>CARTOGRAFÍA DE ZONA</span>
                        <span className="text-amber-300 tabular-nums shrink-0">{nodoSeleccionado.progreso}%</span>
                      </div>
                      <Progress
                        value={nodoSeleccionado.progreso}
                        className="h-2.5 border border-black bg-black"
                      />
                    </div>
                  )}

                  {/* Previa de Fauna del Hábitat (Subfase 10n) */}
                  {especiesNodo && especiesNodo.length > 0 && (
                    <div className="bg-black/50 border border-black p-2 space-y-1.5 mt-1 min-w-0">
                      <span className="retro text-[7px] sm:text-[8px] text-amber-400 uppercase tracking-widest block">
                        Fauna del Hábitat:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {especiesNodo.map((esp) => (
                          <span
                            key={esp.slug ?? esp.nombre}
                            className="bg-[#1a2332] border border-black px-1.5 py-0.5 text-[7px] text-slate-200 retro inline-flex items-center gap-1 max-w-full break-words"
                          >
                            <span className="break-words">{esp.nombre}</span>
                            {esp.esLegendaria && <Crown className="size-2.5 text-amber-400 shrink-0" />}
                            {esp.esEspecial && !esp.esLegendaria && <Sparkles className="size-2.5 text-amber-300 shrink-0" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checklist estructurado de desbloqueo territorial (Subfases 10m/10n) */}
                  {conexionSeleccionada?.estaBloqueada ? (
                    <div className="border-t-2 border-black bg-black/50 p-2.5 space-y-2 mt-2 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[8px] sm:text-[9px] retro">
                        <span className="flex items-center gap-1 text-slate-300 min-w-0">
                          {conexionSeleccionada.cumpleRequisito ? (
                            <Sparkles className="size-3 text-amber-400 shrink-0" />
                          ) : (
                            <Lock className="size-3 text-red-400 shrink-0" />
                          )}
                          <span className="font-bold break-words">PROGRESO DE DESBLOQUEO</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 tabular-nums",
                            conexionSeleccionada.cumpleRequisito ? "text-amber-400 font-bold" : "text-slate-300",
                          )}
                        >
                          {conexionSeleccionada.progresoActual ?? 0}% / {conexionSeleccionada.progresoObjetivo ?? 100}%
                        </span>
                      </div>
                      <Progress
                        value={conexionSeleccionada.progresoActual ?? 0}
                        className="h-2 rounded-none border border-black"
                      />

                      {conexionSeleccionada.requisitoCartografia && (
                        <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro min-w-0">
                          {conexionSeleccionada.requisitoCartografia.completada ? (
                            <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 break-words leading-relaxed",
                              conexionSeleccionada.requisitoCartografia.completada ? "text-emerald-300" : "text-slate-300",
                            )}
                          >
                            Cartografía previa: {conexionSeleccionada.requisitoCartografia.nombre} al 100% ({conexionSeleccionada.requisitoCartografia.progresoActual}%)
                          </span>
                        </div>
                      )}

                      {conexionSeleccionada.requisitoNivelEquipo && (
                        <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro min-w-0">
                          {conexionSeleccionada.requisitoNivelEquipo.cumplido ? (
                            <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 break-words leading-relaxed",
                              conexionSeleccionada.requisitoNivelEquipo.cumplido ? "text-emerald-300" : "text-slate-300",
                            )}
                          >
                            Poder de equipo: Requiere {conexionSeleccionada.requisitoNivelEquipo.cantidadCriaturas} criatura(s) Nv.{conexionSeleccionada.requisitoNivelEquipo.nivelRequerido}+ (Tienes: {conexionSeleccionada.requisitoNivelEquipo.cantidadActual ?? 0} · Mejor: Nv.{conexionSeleccionada.requisitoNivelEquipo.nivelMaximoActual})
                          </span>
                        </div>
                      )}

                      {(conexionSeleccionada.detalleProgreso || conexionSeleccionada.requisito) && (
                        <p className="retro text-[8px] sm:text-[9px] text-slate-300 leading-relaxed break-words">
                          {conexionSeleccionada.detalleProgreso ?? conexionSeleccionada.requisito}
                        </p>
                      )}

                      {conexionSeleccionada.cumpleRequisito && (
                        <span className="inline-flex items-center px-2 py-0.5 retro text-[7px] mt-1 bg-amber-950 text-amber-300 border border-amber-400">
                          LISTA PARA DESBLOQUEAR
                        </span>
                      )}
                    </div>
                  ) : conexionSeleccionada?.requisito ? (
                    <div className="pt-2 flex items-start gap-1.5 text-xs text-slate-300 border-t-2 border-black mt-2 min-w-0">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] sm:text-xs break-words min-w-0 flex-1">{conexionSeleccionada.requisito}</p>
                    </div>
                  ) : null}

                  {!conexionSeleccionada && nodoSeleccionado.id !== ubicacion?.ubicacionId && (
                    <p className="text-[11px] text-slate-400 pt-1 break-words">
                      No tiene conexión directa desde {ubicacion?.nombre}. Viaja primero a una isla conectada por puente.
                    </p>
                  )}
                </div>
              </div>

              {/* Pie fijo con acciones separadas y sellado contra doble clic */}
              <div className="p-3 bg-bastion border-t-2 border-black shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={viajando || Boolean(desbloqueandoId)}
                  onClick={() => setNodoSeleccionado(null)}
                  className="w-full sm:w-auto retro text-[9px] border-2 border-black"
                >
                  PERMANECER
                </Button>

                {nodoSeleccionado.id === ubicacion?.ubicacionId ? (
                  !ubicacion.esSegura ? (
                    <Button
                      type="button"
                      onClick={() => {
                        reproducirSonido("confirmar", 0.4);
                        setNodoSeleccionado(null);
                        navigate("/exploracion");
                      }}
                      className="w-full sm:w-auto retro text-[9px] border-2 border-black bg-[#14d1e8] text-black hover:bg-[#38bdf8]"
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
                      className="w-full sm:w-auto retro text-[9px] border-2 border-black bg-amber-500 text-black hover:bg-amber-400"
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
                  <Button
                    type="button"
                    aria-busy={viajando}
                    disabled={viajando}
                    onClick={() => void handleViajar(conexionSeleccionada)}
                    className="w-full sm:w-auto retro text-[9px] border-2 border-black bg-emerald-600 hover:bg-emerald-500 text-white"
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
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <DialogHeader className="sr-only">
              <DialogTitle>Inspección de zona</DialogTitle>
              <DialogDescription>Detalles e inspección de viaje.</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaHubUbicacion;
