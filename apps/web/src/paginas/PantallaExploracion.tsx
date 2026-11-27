import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Compass,
  MapPin,
  Footprints,
  Swords,
  Sparkles,
  Scroll,
  Coins,
  Backpack,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Shield,
  Zap,
  Eye,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Progress } from "@/components/ui/8bit/progress";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import {
  api,
  type RespuestaExploracion,
  type UbicacionActual,
  type RecompensaExploracion,
  type EspecieEncuentro,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenZona,
  obtenerImagenCriatura,
  obtenerImagenObjeto,
  manejarErrorImagen,
  reproducirSonido,
  sanitizarSlugZona,
} from "@/lib/assets";
import { cn } from "@/lib/utils";
import { MinimapaRedTerritorial } from "@/components/mundo/MinimapaRedTerritorial";
import { construirNodosMapaFallback } from "@/lib/servicios-hub";

export interface EntradaBitacora {
  id: string;
  tipo: "INICIO" | "PASO" | "ENCUENTRO" | "OBJETO" | "AVISO";
  mensaje: string;
  hora: string;
}

export function PantallaExploracion() {
  const navigate = useNavigate();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [progresoZona, setProgresoZona] = useState<number>(0);
  const [explorando, setExplorando] = useState(false);
  const [destelloEncuentro, setDestelloEncuentro] = useState<"normal" | "legendario" | null>(null);

  // Estado del encuentro rival activo (persistido tanto al cargar como tras sortearse)
  const [rivalActivo, setRivalActivo] = useState<{
    slug: string;
    nombre: string;
    nivel: number;
    hpActual: number;
    hpMaximo: number;
    ataque?: number;
    defensa?: number;
    velocidad?: number;
    esLegendaria?: boolean;
    mensaje?: string;
  } | null>(null);

  const [modalEncuentroAbierto, setModalEncuentroAbierto] = useState(false);
  const [modalBotinAbierto, setModalBotinAbierto] = useState(false);
  const [ultimaRecompensa, setUltimaRecompensa] = useState<RecompensaExploracion | null>(null);
  const [bitacoraExploracion, setBitacoraExploracion] = useState<EntradaBitacora[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstado() {
      let ubi: UbicacionActual | null = null;
      try {
        ubi = await api.obtenerUbicacionActual();
        if (!cancelado) {
          setUbicacion(ubi);
          setProgresoZona(ubi.progresoZona ?? 0);

          const horaActual = new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          setBitacoraExploracion([
            {
              id: "inicio-1",
              tipo: "INICIO",
              mensaje: `Has ingresado a ${ubi.nombre}. El terreno agreste se extiende ante ti.`,
              hora: horaActual,
            },
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          if (error instanceof ErrorApi && error.estado === 401) {
            navigate("/ingreso");
            return;
          }
          toast.error("Error al cargar la ubicación actual.");
        }
      }

      // Reanudación activa: consultar /encuentros/activo solo cuando el servidor confirma combate en curso (evita 404 innecesarios)
      const debeConsultarEncuentro =
        ubi !== null &&
        (ubi.tieneEncuentroActivo === true ||
          (ubi.tieneEncuentroActivo === undefined && !ubi.esSegura));

      if (!debeConsultarEncuentro) {
        if (!cancelado) {
          setCargandoInicial(false);
        }
        return;
      }

      try {
        const encuentroEnCurso = await api.obtenerEncuentroActivo();
        if (!cancelado && encuentroEnCurso && encuentroEnCurso.estado === "EN_CURSO") {
          const rival = encuentroEnCurso.criaturaRival;
          setRivalActivo({
            slug: rival.slug,
            nombre: rival.nombre,
            nivel: rival.nivel,
            hpActual: rival.hpActual,
            hpMaximo: rival.hpMaximo,
            ataque: rival.ataque,
            defensa: rival.defensa,
            velocidad: rival.velocidad,
            esLegendaria: Boolean(rival.esLegendaria),
            mensaje: `Tienes un enfrentamiento activo pendiente contra ${rival.nombre}.`,
          });
        }
      } catch {
        // simplificacion: tolerancia si el encuentro se resolvió entre la lectura de ubicación y la reanudación.
      } finally {
        if (!cancelado) {
          setCargandoInicial(false);
        }
      }
    }

    cargarEstado();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const handleExplorar = async () => {
    if (explorando) return;

    // Si ya existe un combate activo detectado, dirigir directamente a combate
    if (rivalActivo) {
      reproducirSonido("alerta", 0.5);
      toast.info(`¡Tienes un combate en curso con ${rivalActivo.nombre}!`);
      navigate("/combate", { state: { encuentroActivoConfirmado: true } });
      return;
    }

    if (ubicacion?.esSegura) {
      reproducirSonido("error", 0.4);
      toast.info("Esta localidad es pacífica. Viaja a una ruta silvestre para explorar.");
      return;
    }

    try {
      setExplorando(true);
      reproducirSonido("paso", 0.4);

      const resultado: RespuestaExploracion = await api.explorar();

      if (typeof resultado.progresoZona === "number") {
        setProgresoZona(resultado.progresoZona);
      }

      const horaEvento = new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const nuevaEntrada: EntradaBitacora = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tipo:
          resultado.tipoEvento === "ENCUENTRO"
            ? "ENCUENTRO"
            : resultado.tipoEvento === "OBJETO"
              ? "OBJETO"
              : "PASO",
        mensaje: resultado.mensaje,
        hora: horaEvento,
      };

      setBitacoraExploracion((prev) => [nuevaEntrada, ...prev.slice(0, 14)]);

      if (resultado.tipoEvento === "ENCUENTRO" && resultado.encuentro?.especie) {
        const especie: EspecieEncuentro = resultado.encuentro.especie;
        const esLegendaria = Boolean(especie.esLegendaria);
        if (esLegendaria) {
          reproducirSonido("fanfarria", 0.7);
          toast.warning("¡AVISTAMIENTO LEGENDARIO! Una criatura mítica se alza en la senda.", {
            duration: 6000,
          });
        } else {
          reproducirSonido("alerta", 0.6);
        }
        setRivalActivo({
          slug: especie.slug,
          nombre: especie.nombre,
          nivel: especie.nivel,
          hpActual: especie.hpActual,
          hpMaximo: especie.hpMaximo,
          ataque: especie.ataque,
          defensa: especie.defensa,
          velocidad: especie.velocidad,
          esLegendaria,
          mensaje: resultado.mensaje,
        });
        setDestelloEncuentro(esLegendaria ? "legendario" : "normal");
        window.setTimeout(() => setDestelloEncuentro(null), 420);
        setModalEncuentroAbierto(true);
      } else if (resultado.tipoEvento === "OBJETO") {
        reproducirSonido("botin", 0.5);
        if (resultado.recompensa) {
          setUltimaRecompensa(resultado.recompensa);
          setModalBotinAbierto(true);
        } else {
          toast.success(resultado.mensaje || "Has encontrado un recurso en la senda.");
        }
      } else {
        reproducirSonido("seleccionar", 0.3);
        toast.info(resultado.mensaje || "La senda permanece en silencio.");
      }
    } catch (error) {
      reproducirSonido("error", 0.4);
      if (error instanceof ErrorApi) {
        if (
          error.codigo === "ENCUENTRO_ACTIVO_PENDIENTE" ||
          error.codigo === "ENCUENTRO_PREVIO_ACTIVO"
        ) {
          toast.info("Tienes un combate activo pendiente de resolución.");
          navigate("/combate", { state: { encuentroActivoConfirmado: true } });
          return;
        }
        if (error.codigo === "ZONA_NO_EXPLORABLE") {
          toast.error("No es posible explorar dentro de un asentamiento seguro.");
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Error al explorar el terreno.");
      }
    } finally {
      setExplorando(false);
    }
  };

  const handleIniciarCombate = () => {
    reproducirSonido("confirmar", 0.5);
    setModalEncuentroAbierto(false);
    navigate("/combate", { state: { encuentroActivoConfirmado: true } });
  };

  if (cargandoInicial) {
    return (
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 animate-pulse overflow-x-hidden">
        {/* Skeleton del Hero Panorámico Brutalist */}
        <div className="bg-card border-4 border-black shadow-[6px_6px_0_0_#000] p-3 sm:p-4 space-y-3">
          <Skeleton className="h-48 sm:h-56 md:h-64 w-full bg-[#1a2332] border-2 border-black" />
          <div className="flex justify-between items-center gap-3">
            <Skeleton className="h-5 w-48 bg-[#1a2332] border border-black" />
            <Skeleton className="h-5 w-24 bg-[#1a2332] border border-black" />
          </div>
        </div>

        {/* Skeleton del Panel de Medidor y Botonera */}
        <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-4 sm:p-5 space-y-3.5">
          <Skeleton className="h-5 w-44 bg-[#1a2332]" />
          <Skeleton className="h-5 w-full bg-[#1a2332] border-2 border-black" />
          <Skeleton className="h-12 w-full bg-[#1a2332] border-4 border-black" />
        </div>

        {/* Skeleton de la Bitácora de Incursión */}
        <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-4 sm:p-5 space-y-2.5">
          <Skeleton className="h-5 w-48 bg-[#1a2332]" />
          <Skeleton className="h-10 w-full bg-[#1a2332] border-2 border-black" />
          <Skeleton className="h-10 w-full bg-[#1a2332] border-2 border-black" />
        </div>
      </div>
    );
  }

  const slugZona = ubicacion?.slug || sanitizarSlugZona(ubicacion?.nombre || ubicacion?.ubicacionId);

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* 1. Panel de Entorno: Hero Panorámico Brutalist 8-Bit */}
      <div className="relative bg-card border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
        {/* Paisaje Panorámico de la Ruta con altura responsiva y marco retro */}
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-[#090d16] border-b-4 border-black overflow-hidden">
          <img
            src={obtenerImagenZona(slugZona)}
            onError={(e) => manejarErrorImagen(e, "zona")}
            alt={`Paisaje de ${ubicacion?.nombre ?? "Aethelgard"}`}
            className="w-full h-full object-cover object-center pixelated filter brightness-95 contrast-105"
          />

          {/* Degradado oscuro para integrar con el bastión y maximizar contraste WCAG AAA */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

          {/* Destello dramático al detectar una criatura salvaje */}
          {destelloEncuentro && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-20 pointer-events-none animate-pulse",
                destelloEncuentro === "legendario" ? "bg-amber-400/35" : "bg-red-500/30",
              )}
            />
          )}

          {/* Indicador visual de rastreo sobre el paisaje mientras explora */}
          {explorando && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 z-20 bg-black/75 border-t-2 border-[#14d1e8] px-3 py-1.5 flex items-center justify-center gap-2 pointer-events-none"
            >
              <span className="size-2 rounded-full bg-[#14d1e8] animate-ping" />
              <span className="retro text-[8px] sm:text-[9px] text-[#14d1e8] tracking-wider">
                RASTREANDO SENDAS...
              </span>
            </div>
          )}

          {/* Badges superiores sobre el paisaje: diseño retro brutalista adaptable sin colisiones */}
          <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-start justify-between gap-1.5 sm:gap-2 pointer-events-auto z-10">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0 max-w-[calc(100%-90px)] sm:max-w-none">
              {ubicacion?.esSegura ? (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-emerald-950/90 text-emerald-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5 text-[8px] sm:text-[9px]"
                >
                  <ShieldCheck className="size-2.5 sm:size-3 text-emerald-400 shrink-0" />
                  <span>LOCALIDAD SEGURA</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-red-950/90 text-red-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5 text-[8px] sm:text-[9px]"
                >
                  <AlertTriangle className="size-2.5 sm:size-3 text-red-400 shrink-0" />
                  <span>ZONA HOSTIL</span>
                </Badge>
              )}

              {!ubicacion?.esSegura && (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-[#1a2332]/95 text-[#14d1e8] border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5 text-[8px] sm:text-[9px]"
                >
                  <MapPin className="size-2.5 sm:size-3 text-[#14d1e8] shrink-0" />
                  <span>FAUNA SALVAJE: NV. {ubicacion?.nivelSugerido || "1-3"}</span>
                </Badge>
              )}

              <Badge
                variant="outline"
                font="retro"
                className="bg-[#1a2332]/95 text-emerald-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5 text-[8px] sm:text-[9px]"
              >
                <Swords className="size-2.5 sm:size-3 text-emerald-400 shrink-0" />
                <span>EQUIPO: NV. {ubicacion?.poderEquipo?.nivelMaximoEquipo ?? 1}</span>
              </Badge>

              {progresoZona >= 100 && (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-amber-950/90 text-[#f5b724] border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5 text-[8px] sm:text-[9px]"
                >
                  <Sparkles className="size-2.5 sm:size-3 text-[#f5b724] shrink-0" />
                  <span>100% CARTOGRAFÍA</span>
                </Badge>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              font="retro"
              className={cn(
                "shrink-0 bg-black/85 hover:bg-[#1a2332] text-slate-200 hover:text-[#14d1e8] border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 text-[8px] sm:text-[9px] gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 cursor-pointer",
                explorando && "pointer-events-none opacity-50",
              )}
            >
              <Link
                to="/hub"
                aria-disabled={explorando}
                onClick={(e) => {
                  if (explorando) {
                    e.preventDefault();
                    return;
                  }
                  reproducirSonido("click", 0.3);
                }}
              >
                <ArrowLeft className="size-2.5 sm:size-3 shrink-0" />
                <span>CAMPAMENTO</span>
              </Link>
            </Button>
          </div>

          {/* Nombre de la zona sobre la franja inferior del paisaje sin truncamiento rígido */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 pointer-events-none">
            <h1 className="retro text-[11px] sm:text-base md:text-xl text-[#14d1e8] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] break-words leading-snug">
              {ubicacion?.nombre ?? "Senda Silvestre"}
            </h1>
          </div>
        </div>

        {/* Panel Inferior del Entorno: Descripción y Estado de la Expedición en Tipografía Retro */}
        <div className="p-3 sm:p-4 bg-card space-y-2.5">
          <p className="retro text-[8px] sm:text-[9px] text-slate-200 leading-relaxed break-words">
            {ubicacion?.descripcion}
          </p>

          <div className="pt-2 border-t-2 border-black/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Compass className="size-3.5 text-[#14d1e8] shrink-0" />
              <span className="retro text-[8px] sm:text-[9px] text-slate-300 leading-relaxed break-words">
                {ubicacion?.esSegura
                  ? "Asentamiento protegido (Sin criaturas salvajes)"
                  : progresoZona >= 100
                    ? "Ruta totalmente explorada y cartografiada"
                    : "Terreno silvestre abierto a la expedición"}
              </span>
            </div>

            <span className="retro font-bold text-[8px] sm:text-[9px] text-[#14d1e8] bg-[#090d16] px-2 sm:px-2.5 py-0.5 sm:py-1 border-2 border-black shadow-[2px_2px_0_0_#000] shrink-0">
              PROGRESO: {progresoZona}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Banner Destacado de Combate Activo Pendiente (si existe encuentro en curso) */}
      {rivalActivo && (
        <div
          className={cn(
            "p-3 sm:p-4 space-y-3 bg-card border-2 border-black shadow-[4px_4px_0_0_#000]",
            rivalActivo.esLegendaria
              ? "border-amber-400 anim-halo-legendario shadow-[0_0_16px_rgba(251,191,36,0.35)]"
              : "border-red-600/80",
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            {rivalActivo.esLegendaria ? (
              <div className="flex items-center gap-2">
                <Crown className="size-4 sm:size-5 text-amber-400 animate-pulse shrink-0" />
                <h2 className="retro text-[10px] sm:text-xs md:text-sm text-amber-400 uppercase tracking-wider leading-tight">
                  ¡CRIATURA LEGENDARIA AL ACECHO!
                </h2>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Swords className="size-4 sm:size-5 text-red-400 animate-pulse shrink-0" />
                <h2 className="retro text-[10px] sm:text-xs md:text-sm text-red-400 uppercase tracking-wider leading-tight">
                  ¡CRIATURA HOSTIL AL ACECHO!
                </h2>
              </div>
            )}
            <Badge
              variant="outline"
              font="retro"
              className={cn(
                "border-2 border-black shadow-[2px_2px_0_0_#000] text-[8px] sm:text-[9px] shrink-0 py-0.5 px-1.5 sm:px-2",
                rivalActivo.esLegendaria
                  ? "bg-amber-900 text-amber-200 border-amber-400"
                  : "bg-red-900 text-white border-red-400",
              )}
            >
              {rivalActivo.esLegendaria ? "ENCUENTRO LEGENDARIO" : "COMBATE PENDIENTE"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 bg-[#090d16] p-2.5 sm:p-3 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)]">
            <div className="size-12 sm:size-14 bg-[#121927] border-2 border-black flex items-center justify-center shrink-0">
              <img
                src={obtenerImagenCriatura(rivalActivo.slug)}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                alt={rivalActivo.nombre}
                className="pixelated size-10 sm:size-12 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="retro text-[10px] sm:text-xs text-white break-words leading-tight max-w-full">
                  {rivalActivo.nombre}
                </span>
                <span className="retro text-[8px] sm:text-[9px] text-amber-300 bg-[#1a2332] px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  Nv. {rivalActivo.nivel}
                </span>
              </div>
              <p className="retro text-[8px] sm:text-[9px] text-slate-300 mt-0.5 break-words leading-relaxed">
                Salud rival: {rivalActivo.hpActual} / {rivalActivo.hpMaximo} HP
              </p>
            </div>
          </div>

          <p className="retro text-[8px] sm:text-[9px] text-slate-200 leading-relaxed break-words">
            Un rival hostil bloquea este sendero. Debes resolver el combate (vencer o huir desde
            la arena) antes de continuar explorando la ruta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2 sm:pt-3 mt-1">
            <Button
              font="retro"
              onClick={handleIniciarCombate}
              className="w-full sm:flex-1 bg-red-600 hover:bg-red-500 text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none text-[9.5px] sm:text-xs py-2.5 sm:py-3 px-2 sm:px-4 gap-2 cursor-pointer text-center whitespace-normal leading-snug"
            >
              <Swords className="size-3.5 sm:size-4 shrink-0" />
              <span className="break-words">ENTRAR EN COMBATE AHORA</span>
            </Button>
            <Button
              variant="outline"
              font="retro"
              onClick={() => {
                reproducirSonido("click", 0.3);
                setModalEncuentroAbierto(true);
              }}
              className="w-full sm:flex-1 bg-[#1a2332] text-[#14d1e8] hover:text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none text-[9.5px] sm:text-xs py-2.5 sm:py-3 px-2 sm:px-4 gap-2 cursor-pointer text-center whitespace-normal leading-snug"
            >
              <Eye className="size-3.5 sm:size-4 shrink-0" />
              <span>INSPECCIONAR RIVAL</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Medidor de Progreso de la Zona y Botonera Táctil Brutalist */}
      <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-[#14d1e8] shrink-0" />
            <h2 className="retro text-[10px] sm:text-xs md:text-sm text-[#14d1e8] tracking-wider uppercase">
              CARTOGRAFÍA Y AVANCE
            </h2>
          </div>
          <span className="retro font-bold text-[9px] sm:text-[10px] text-[#14d1e8] bg-[#090d16] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
            [ {progresoZona} % ]
          </span>
        </div>

        {/* Barra de progreso retro segmentada empotrada con canal oscuro y borde negro */}
        <div className="space-y-1.5">
          <Progress
            value={progresoZona}
            variant="retro"
            font="retro"
            className="h-4 sm:h-5 bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000]"
            progressBg={progresoZona >= 100 ? "bg-[#22c55e]" : "bg-[#14d1e8]"}
          />
        </div>

        {/* Mensaje descriptivo contextual según el estado de la zona */}
        {ubicacion?.esSegura ? (
          <div className="p-2.5 sm:p-3 bg-[#1a2332] border-2 border-black shadow-[2px_2px_0_0_#000] flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-[#f5b724] shrink-0 mt-0.5" />
            <div className="retro text-[8px] sm:text-[9px] text-slate-300 leading-relaxed break-words">
              <strong className="text-[#f5b724]">Localidad pacífica protegida:</strong> No
              existen criaturas salvajes para cazar en este asentamiento. Dirígete al Campamento
              para viajar a las Praderas del Amanecer u otras sendas silvestres.
            </div>
          </div>
        ) : rivalActivo ? (
          <p className="retro text-[8px] sm:text-[9px] text-amber-300 leading-relaxed flex items-center gap-1.5 break-words">
            <AlertTriangle className="size-3.5 text-amber-300 shrink-0" />
            <span>
              La senda está bloqueada por el combate en curso. Resuelve el encuentro para seguir
              explorando y cartografiando la ruta.
            </span>
          </p>
        ) : (
          <p className="retro text-[8px] sm:text-[9px] text-slate-400 leading-relaxed break-words">
            {progresoZona >= 100 ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-400 shrink-0" />
                <span>
                  Has completado la cartografía de esta ruta. Puedes patrullar para encontrar más
                  criaturas y recursos.
                </span>
              </span>
            ) : (
              "Avanza por el sendero para cartografiar el terreno, encontrar bestias salvajes y descubrir botines del gremio."
            )}
          </p>
        )}

        {/* Botón Principal de Inmersión Brutalist 8-Bit con holgura y marco de 4px */}
        <div className="pt-4 sm:pt-5 mt-2 sm:mt-3">
          {ubicacion?.esSegura ? (
            <Button
              asChild
              variant="outline"
              font="retro"
              className={cn(
                "w-full py-3 sm:py-4 px-2 sm:px-4 bg-[#1a2332] hover:bg-[#1a2332]/80 text-[#14d1e8] border-4 border-black shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000] text-[9.5px] sm:text-xs md:text-sm tracking-normal sm:tracking-wider uppercase gap-2 cursor-pointer text-center whitespace-normal leading-snug",
                explorando && "pointer-events-none opacity-50",
              )}
            >
              <Link
                to="/hub"
                aria-disabled={explorando}
                onClick={(e) => {
                  if (explorando) {
                    e.preventDefault();
                    return;
                  }
                  reproducirSonido("click", 0.4);
                }}
              >
                <Compass className="size-4 text-[#14d1e8] shrink-0" />
                <span className="break-words">VIAJAR A SENDA SILVESTRE DESDE EL CAMPAMENTO</span>
              </Link>
            </Button>
          ) : rivalActivo ? (
            <Button
              font="retro"
              onClick={handleIniciarCombate}
              className="w-full py-3 sm:py-4 px-2 sm:px-4 bg-red-600 hover:bg-red-500 text-white border-4 border-black shadow-[6px_6px_0_0_#000] text-[9.5px] sm:text-xs md:text-sm tracking-normal sm:tracking-wider uppercase transition-transform active:translate-y-1 active:shadow-[2px_2px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 text-center whitespace-normal leading-snug"
            >
              <Swords className="size-4 text-white shrink-0" />
              <span className="break-words">RESOLVER COMBATE CON {rivalActivo.nombre.toUpperCase()}</span>
            </Button>
          ) : (
            <Button
              font="retro"
              disabled={explorando}
              onClick={handleExplorar}
              aria-busy={explorando}
              className="w-full py-3 sm:py-4 px-2 sm:px-4 bg-[#14d1e8] hover:bg-[#14d1e8]/90 text-[#090d16] border-4 border-black shadow-[6px_6px_0_0_#000] text-[10px] sm:text-xs md:text-sm tracking-normal sm:tracking-wider uppercase transition-transform active:translate-y-1 active:shadow-[2px_2px_0_0_#000] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center whitespace-normal leading-snug"
            >
              {explorando ? (
                <>
                  <Loader2 className="size-4 animate-spin text-[#090d16] shrink-0" />
                  <span>EXPLORANDO SENDA...</span>
                </>
              ) : (
                <>
                  <Footprints className="size-4 text-[#090d16] shrink-0" />
                  <span>{progresoZona >= 100 ? "PATRULLAR SENDA" : "EXPLORAR SENDA"}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 4. Bitácora de Incursión: Registro Secuencial Retro Brutalist */}
      <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black/60 pb-2">
          <div className="flex items-center gap-2">
            <Scroll className="size-4 text-[#14d1e8] shrink-0" />
            <h3 className="retro text-[10px] sm:text-xs text-slate-200 tracking-wider uppercase">
              BITÁCORA DE INCURSIÓN
            </h3>
          </div>
          <span className="retro text-[8px] sm:text-[9px] text-slate-400">
            EVENTOS: {bitacoraExploracion.length}
          </span>
        </div>

        <ul className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
          {bitacoraExploracion.map((registro) => {
            const esEncuentro = registro.tipo === "ENCUENTRO";
            const esObjeto = registro.tipo === "OBJETO";
            const esInicio = registro.tipo === "INICIO";

            return (
              <li
                key={registro.id}
                className={cn(
                  "p-2 sm:p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-start gap-2.5 transition-colors",
                  esEncuentro
                    ? "bg-red-950/30 text-red-200"
                    : esObjeto
                      ? "bg-amber-950/30 text-amber-200"
                      : esInicio
                        ? "bg-[#1a2332] text-slate-300"
                        : "bg-[#1a2332]/70 text-slate-200",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {esEncuentro ? (
                    <Swords className="size-3.5 sm:size-4 text-red-400" />
                  ) : esObjeto ? (
                    <Coins className="size-3.5 sm:size-4 text-[#f5b724]" />
                  ) : esInicio ? (
                    <Compass className="size-3.5 sm:size-4 text-[#14d1e8]" />
                  ) : (
                    <Footprints className="size-3.5 sm:size-4 text-[#14d1e8]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span
                      className={cn(
                        "retro text-[8px] sm:text-[8.5px] uppercase tracking-wider",
                        esEncuentro
                          ? "text-red-400"
                          : esObjeto
                            ? "text-[#f5b724]"
                            : esInicio
                              ? "text-[#14d1e8]"
                              : "text-slate-400",
                      )}
                    >
                      {esEncuentro
                        ? "Encuentro Salvaje"
                        : esObjeto
                          ? "Botín Encontrado"
                          : esInicio
                            ? "Punto de Partida"
                            : "Avance de Exploración"}
                    </span>
                    <span className="retro text-[8px] sm:text-[8.5px] text-slate-400">
                      {registro.hora}
                    </span>
                  </div>
                  <p className="retro text-[8px] sm:text-[9px] text-slate-200 leading-relaxed break-words">
                    {registro.mensaje}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 5. Hábitat Autóctono y Red Territorial Conectada */}
      {ubicacion?.especiesHabitantes && ubicacion.especiesHabitantes.length > 0 && (
        <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center gap-2 border-b-2 border-black/60 pb-1.5">
            <Sparkles className="size-3.5 text-amber-400 shrink-0" />
            <h3 className="retro text-[9px] sm:text-[10px] text-slate-100 font-bold uppercase tracking-wider">
              FAUNA AVISTADA EN ESTE HÁBITAT ({ubicacion.especiesHabitantes.length} ESPECIES)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {ubicacion.especiesHabitantes.map((esp) => (
              <div
                key={esp.slug ?? esp.nombre}
                className="bg-[#1a2332] border-2 border-black shadow-[2px_2px_0_0_#000] px-2 py-1 flex items-center gap-1.5 text-[8px] sm:text-[9px] retro text-slate-200"
              >
                <span className="font-bold">{esp.nombre}</span>
                <span className="text-slate-400 text-[7px] sm:text-[8px]">({esp.tipo})</span>
                {esp.esLegendaria && (
                  <Crown className="size-3 text-amber-400 shrink-0" />
                )}
                {esp.esEspecial && !esp.esLegendaria && (
                  <Sparkles className="size-3 text-amber-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Territorial y Rutas */}
      {ubicacion && (
        <MinimapaRedTerritorial
          nodos={construirNodosMapaFallback(ubicacion)}
          ubicacionActualId={ubicacion.ubicacionId}
          compacto
        />
      )}

      {/* 6. Modal / Diálogo de Encuentro Hostil Cinemático (Dialog 8-bit Brutalist) */}
      <Dialog open={modalEncuentroAbierto} onOpenChange={setModalEncuentroAbierto}>
        <DialogContent
          font="normal"
          className={cn(
            "!flex flex-col w-[calc(100vw-2rem)] sm:max-w-md max-h-[85dvh] bg-card border-4 border-black shadow-[8px_8px_0_0_#000] text-slate-100 !p-0 !gap-0 overflow-hidden",
            rivalActivo?.esLegendaria && "anim-halo-legendario",
          )}
        >
          {/* Header fijo anclado arriba */}
          <DialogHeader className="shrink-0 px-3.5 sm:px-4 pt-3.5 pb-2 text-center border-b-2 border-black/80 relative pr-10 bg-[#090d16]">
            <DialogTitle
              font="normal"
              className={cn(
                "retro text-[10px] sm:text-xs md:text-sm text-center flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-wider whitespace-normal leading-snug",
                rivalActivo?.esLegendaria ? "text-amber-400" : "text-red-400",
              )}
            >
              {rivalActivo?.esLegendaria ? (
                <>
                  <Crown className="size-3.5 sm:size-4 text-amber-400 animate-pulse shrink-0" />
                  <span>¡AVISTAMIENTO LEGENDARIO!</span>
                </>
              ) : (
                <>
                  <Swords className="size-3.5 sm:size-4 text-red-400 animate-pulse shrink-0" />
                  <span>¡CRIATURA SALVAJE!</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="retro text-[8px] sm:text-[9px] text-slate-300 text-center mt-1 leading-relaxed break-words">
              {rivalActivo?.mensaje ?? "¡Una bestia hostil surge entre la maleza y bloquea tu sendero!"}
            </DialogDescription>
          </DialogHeader>

          {/* Cuerpo scrolleable interior: vitrina 8-bit con relieve interior adaptable a pantallas 360px-420px */}
          {rivalActivo && (
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 overscroll-contain">
              <div
                className={cn(
                  "p-3 sm:p-4 bg-black/70 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] space-y-2.5 sm:space-y-3 text-center",
                  rivalActivo.esLegendaria && "bg-amber-950/30 border-amber-500/60 shadow-[inset_2px_2px_0_0_rgba(251,191,36,0.2)]",
                )}
              >
                {/* Sprite de la criatura rival con relieve interior y clase .pixelated */}
                <div
                  className={cn(
                    "relative mx-auto size-20 sm:size-28 flex items-center justify-center bg-[#121927] border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] p-1.5 sm:p-2",
                    rivalActivo.esLegendaria && "border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]",
                  )}
                >
                  <img
                    src={obtenerImagenCriatura(rivalActivo.slug)}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    alt={rivalActivo.nombre}
                    className="pixelated max-h-16 sm:max-h-24 max-w-16 sm:max-w-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter brightness-105"
                  />
                  {rivalActivo.esLegendaria && (
                    <div className="absolute top-1 right-1">
                      <Crown className="size-3.5 sm:size-4 text-amber-400 animate-pulse drop-shadow-[0_1px_2px_#000]" />
                    </div>
                  )}
                </div>

                {/* Nombre en Press Start 2P e Insignia de Nivel sin truncamiento */}
                <div className="space-y-1">
                  <h3 className="retro text-[10px] sm:text-xs md:text-sm text-[#14d1e8] uppercase tracking-wider break-words leading-tight max-w-full">
                    {rivalActivo.nombre}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      font="retro"
                      className="bg-[#1a2332] text-amber-300 border-2 border-black shadow-[2px_2px_0_0_#000] text-[8.5px] sm:text-[9px] py-0.5 px-1.5"
                    >
                      Nv. {rivalActivo.nivel}
                    </Badge>
                    {rivalActivo.esLegendaria && (
                      <Badge
                        variant="outline"
                        font="retro"
                        className="bg-amber-500/30 text-amber-300 border-2 border-black shadow-[2px_2px_0_0_#000] text-[8.5px] sm:text-[9px] py-0.5 px-1.5 flex items-center gap-1"
                      >
                        <Crown className="size-2.5 text-amber-400" />
                        <span>LEGENDARIA</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Vitalidad de la Criatura Rival con barra empotrada */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] sm:text-[9px] retro text-slate-400">
                    <span>VITALIDAD RIVAL</span>
                    <span className="text-emerald-400 font-bold">
                      {rivalActivo.hpActual} / {rivalActivo.hpMaximo} HP
                    </span>
                  </div>
                  <div className="w-full bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] h-3 sm:h-3.5">
                    <div
                      className="bg-[#22c55e] h-full transition-all"
                      style={{
                        width: `${Math.round(
                          (rivalActivo.hpActual / (rivalActivo.hpMaximo || 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Ficha Táctica del Rival: 3 atributos base con mini-chips retro individuales */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 w-full">
                  <div className="bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] p-1.5 sm:p-2 text-center flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-center gap-1 text-red-400">
                      <Swords className="size-2.5 sm:size-3 shrink-0" />
                      <span className="retro text-[8px] sm:text-[9px] break-words">ATQ</span>
                    </div>
                    <span className="retro text-[9px] sm:text-[10px] font-bold text-slate-100">
                      {rivalActivo.ataque ?? 10}
                    </span>
                  </div>

                  <div className="bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] p-1.5 sm:p-2 text-center flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-center gap-1 text-blue-400">
                      <Shield className="size-2.5 sm:size-3 shrink-0" />
                      <span className="retro text-[8px] sm:text-[9px] break-words">DEF</span>
                    </div>
                    <span className="retro text-[9px] sm:text-[10px] font-bold text-slate-100">
                      {rivalActivo.defensa ?? 10}
                    </span>
                  </div>

                  <div className="bg-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] p-1.5 sm:p-2 text-center flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Zap className="size-2.5 sm:size-3 shrink-0" />
                      <span className="retro text-[8px] sm:text-[9px] break-words">VEL</span>
                    </div>
                    <span className="retro text-[9px] sm:text-[10px] font-bold text-slate-100">
                      {rivalActivo.velocidad ?? 10}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer fijo anclado abajo con separación táctil generosa */}
          <div className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t-2 border-black bg-[#090d16] flex flex-col sm:flex-row gap-4 sm:gap-6 w-full mt-3 sm:mt-4">
            <Button
              font="retro"
              className="w-full sm:flex-1 bg-red-600 hover:bg-red-500 text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-3 sm:py-3.5 text-[10px] sm:text-xs gap-2 cursor-pointer text-center whitespace-normal leading-snug"
              onClick={handleIniciarCombate}
            >
              <Swords className="size-3.5 shrink-0" />
              <span>INICIAR COMBATE</span>
            </Button>
            <Button
              variant="outline"
              font="retro"
              className="w-full sm:flex-1 bg-[#1a2332] hover:bg-[#232d3f] text-slate-300 hover:text-white border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-3 sm:py-3.5 text-[10px] sm:text-xs gap-2 cursor-pointer text-center whitespace-normal leading-snug"
              onClick={() => {
                reproducirSonido("click", 0.3);
                setModalEncuentroAbierto(false);
              }}
            >
              <Eye className="size-3.5 shrink-0" />
              <span>RETIRARSE</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Modal / Diálogo de Botín u Objeto Encontrado (Dialog 8-bit Brutalist) */}
      <Dialog open={modalBotinAbierto} onOpenChange={setModalBotinAbierto}>
        <DialogContent
          font="normal"
          className="!flex flex-col w-[calc(100vw-2rem)] sm:max-w-md max-h-[85dvh] bg-card border-4 border-black shadow-[8px_8px_0_0_#000] text-slate-100 !p-0 !gap-0 overflow-hidden"
        >
          <DialogHeader className="shrink-0 px-3.5 sm:px-4 pt-3.5 pb-2 text-center border-b-2 border-black/80 relative pr-10 bg-[#090d16]">
            <DialogTitle
              font="normal"
              className="retro text-[10px] sm:text-xs md:text-sm text-[#f5b724] text-center flex items-center justify-center gap-2 uppercase tracking-wider whitespace-normal leading-snug"
            >
              <Coins className="size-4 text-[#f5b724] shrink-0" />
              <span>¡BOTÍN DESCUBIERTO!</span>
            </DialogTitle>
            <DialogDescription className="retro text-[8px] sm:text-[9px] text-slate-300 text-center mt-1 leading-relaxed break-words">
              Tus pasos por la ruta han revelado un recurso valioso para la expedición.
            </DialogDescription>
          </DialogHeader>

          {ultimaRecompensa && (
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-5 py-3 overscroll-contain">
              <div className="p-3 sm:p-4 bg-black/70 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] text-center space-y-3">
                {ultimaRecompensa.tipo === "MONEDAS" ? (
                  <>
                    <div className="mx-auto size-12 sm:size-14 bg-[#1a2332] border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center">
                      <Coins className="size-6 sm:size-7 text-[#f5b724]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="retro text-[10px] sm:text-xs md:text-sm text-[#f5b724] uppercase tracking-wider leading-snug break-words">
                        +{ultimaRecompensa.cantidad} MONEDAS DE ORO
                      </h3>
                      <p className="retro text-[8px] sm:text-[9px] text-slate-300 break-words leading-relaxed">
                        Añadidas automáticamente a tus reservas del gremio.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto size-12 sm:size-14 bg-[#1a2332] border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center">
                      <img
                        src={obtenerImagenObjeto(ultimaRecompensa.itemCodigo)}
                        onError={(e) => manejarErrorImagen(e, "objeto")}
                        alt="Ítem obtenido"
                        className="pixelated size-7 sm:size-8 object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="retro text-[10px] sm:text-xs md:text-sm text-[#14d1e8] uppercase tracking-wider break-words leading-snug max-w-full">
                        {ultimaRecompensa.itemCodigo || "OBJETO ÚTIL"} (x{ultimaRecompensa.cantidad})
                      </h3>
                      <p className="retro text-[8px] sm:text-[9px] text-slate-300 break-words leading-relaxed">
                        Guardado con éxito en tu mochila de explorador.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t-2 border-black bg-[#090d16] w-full mt-3 sm:mt-4">
            <Button
              font="retro"
              onClick={() => {
                reproducirSonido("confirmar", 0.4);
                setModalBotinAbierto(false);
              }}
              className="w-full bg-[#f5b724] hover:bg-[#f5b724]/90 text-[#090d16] border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none text-[10px] sm:text-xs py-3.5 gap-2 cursor-pointer text-center whitespace-normal leading-snug"
            >
              <Backpack className="size-4 shrink-0" />
              <span>GUARDAR EN BOLSA</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaExploracion;


