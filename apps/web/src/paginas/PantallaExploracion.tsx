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
} from "lucide-react";

import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Progress } from "@/components/ui/8bit/progress";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
    mensaje?: string;
  } | null>(null);

  const [modalEncuentroAbierto, setModalEncuentroAbierto] = useState(false);
  const [modalBotinAbierto, setModalBotinAbierto] = useState(false);
  const [ultimaRecompensa, setUltimaRecompensa] = useState<RecompensaExploracion | null>(null);
  const [bitacoraExploracion, setBitacoraExploracion] = useState<EntradaBitacora[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstado() {
      try {
        const ubi = await api.obtenerUbicacionActual();
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

      // Reanudación activa: verificar si hay combate en curso en el servidor
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
            mensaje: `Tienes un enfrentamiento activo pendiente contra ${rival.nombre}.`,
          });
        }
      } catch {
        // simplificacion: 404 o ENCUENTRO_NO_ENCONTRADO es el estado esperado cuando no hay batalla activa.
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
      navigate("/combate");
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
        reproducirSonido("alerta", 0.6);
        const especie: EspecieEncuentro = resultado.encuentro.especie;
        setRivalActivo({
          slug: especie.slug,
          nombre: especie.nombre,
          nivel: especie.nivel,
          hpActual: especie.hpActual,
          hpMaximo: especie.hpMaximo,
          ataque: especie.ataque,
          defensa: especie.defensa,
          velocidad: especie.velocidad,
          mensaje: resultado.mensaje,
        });
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
          navigate("/combate");
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
    navigate("/combate");
  };

  if (cargandoInicial) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 animate-pulse">
        {/* Skeleton del Hero Panorámico */}
        <div className="bg-[#121927] border-2 border-[#43526d] p-3 sm:p-4 space-y-3">
          <Skeleton className="h-40 sm:h-56 w-full bg-[#1a2332]" />
          <div className="flex justify-between items-center gap-3">
            <Skeleton className="h-5 w-40 bg-[#1a2332]" />
            <Skeleton className="h-5 w-20 bg-[#1a2332]" />
          </div>
        </div>

        {/* Skeleton del Panel de Medidor */}
        <div className="bg-[#121927] border-2 border-[#43526d] p-3 sm:p-4 space-y-3">
          <Skeleton className="h-4 w-32 bg-[#1a2332]" />
          <Skeleton className="h-4 w-full bg-[#1a2332]" />
          <Skeleton className="h-10 w-full bg-[#1a2332]" />
        </div>

        {/* Skeleton de la Bitácora */}
        <div className="bg-[#121927] border-2 border-[#43526d] p-3 sm:p-4 space-y-2">
          <Skeleton className="h-4 w-36 bg-[#1a2332]" />
          <Skeleton className="h-8 w-full bg-[#1a2332]" />
          <Skeleton className="h-8 w-full bg-[#1a2332]" />
        </div>
      </div>
    );
  }

  const slugZona = ubicacion?.slug || sanitizarSlugZona(ubicacion?.nombre || ubicacion?.ubicacionId);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6">
      {/* 1. Panel de Entorno: Hero Panorámico Retro con Iluminación Nocturna de Aethelgard */}
      <div className="relative bg-[#121927] border-2 border-[#43526d] overflow-hidden">
        {/* Paisaje Panorámico de la Ruta con altura responsiva */}
        <div className="relative w-full h-40 sm:h-52 md:h-60 bg-[#090d16] border-b-2 border-[#43526d] overflow-hidden">
          <img
            src={obtenerImagenZona(slugZona)}
            onError={(e) => manejarErrorImagen(e, "zona")}
            alt={`Paisaje de ${ubicacion?.nombre ?? "Aethelgard"}`}
            className="w-full h-full object-cover object-center pixelated filter brightness-95 contrast-105"
          />

          {/* Degradado oscuro para integrar con el bastión y maximizar contraste WCAG AAA */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121927] via-transparent to-black/60 pointer-events-none" />

          {/* Badges superiores sobre el paisaje: diseño responsivo que no colisiona con el texto */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {ubicacion?.esSegura ? (
                <Badge
                  font="retro"
                  className="bg-emerald-950/90 text-emerald-400 border-emerald-500 gap-1 py-1 px-2 text-[9px] sm:text-[10px]"
                >
                  <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
                  <span>LOCALIDAD SEGURA</span>
                </Badge>
              ) : (
                <Badge
                  font="retro"
                  className="bg-red-950/90 text-red-400 border-red-500 gap-1 py-1 px-2 text-[9px] sm:text-[10px]"
                >
                  <AlertTriangle className="size-3 text-red-400 shrink-0" />
                  <span>ZONA HOSTIL</span>
                </Badge>
              )}

              {!ubicacion?.esSegura && (
                <Badge
                  font="retro"
                  className="bg-[#1a2332]/95 text-[#14d1e8] border-[#14d1e8] gap-1 py-1 px-2 text-[9px] sm:text-[10px]"
                >
                  <MapPin className="size-3 text-[#14d1e8] shrink-0" />
                  <span>NV: {ubicacion?.nivelSugerido || "1-3"}</span>
                </Badge>
              )}

              {progresoZona >= 100 && (
                <Badge
                  font="retro"
                  className="bg-amber-950/90 text-[#f5b724] border-[#f5b724] gap-1 py-1 px-2 text-[9px] sm:text-[10px]"
                >
                  <Sparkles className="size-3 text-[#f5b724] shrink-0" />
                  <span>100% CARTOGRAFÍA</span>
                </Badge>
              )}
            </div>

            <Link to="/hub" className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                font="retro"
                onClick={() => reproducirSonido("click", 0.3)}
                className="bg-[#090d16]/90 text-slate-300 hover:text-[#14d1e8] border-[#43526d] hover:border-[#14d1e8] text-[9px] sm:text-[10px] gap-1 px-2.5 py-1 cursor-pointer"
              >
                <ArrowLeft className="size-3" />
                <span>HUB</span>
              </Button>
            </Link>
          </div>

          {/* Nombre de la zona sobre la franja inferior del paisaje */}
          <div className="absolute bottom-2 left-2.5 right-2.5 pointer-events-none">
            <h1 className="retro text-sm sm:text-lg md:text-xl text-[#14d1e8] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] truncate">
              {ubicacion?.nombre ?? "Senda Silvestre"}
            </h1>
          </div>
        </div>

        {/* Panel Inferior del Entorno: Descripción y Estado de la Expedición */}
        <div className="p-3 sm:p-4 bg-[#121927] space-y-2">
          <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
            {ubicacion?.descripcion}
          </p>

          <div className="pt-2 border-t border-[#43526d]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Compass className="size-3.5 text-[#14d1e8] shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs">
                {ubicacion?.esSegura
                  ? "Asentamiento protegido (Sin criaturas salvajes)"
                  : progresoZona >= 100
                    ? "Ruta totalmente explorada y cartografiada"
                    : "Terreno silvestre abierto a la expedición"}
              </span>
            </div>

            <span className="font-mono text-[10px] sm:text-[11px] text-[#14d1e8] bg-[#090d16] px-2 py-0.5 border border-[#43526d]/60 shrink-0">
              PROGRESO: {progresoZona}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Banner Destacado de Combate Activo Pendiente (si existe encuentro en curso) */}
      {rivalActivo && (
        <div className="bg-red-950/60 border-2 border-red-500 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Swords className="size-4 sm:size-5 text-red-400 animate-pulse shrink-0" />
              <h2 className="retro text-xs sm:text-sm text-red-400 uppercase tracking-wider">
                ¡CRIATURA HOSTIL AL ACECHO!
              </h2>
            </div>
            <Badge
              font="retro"
              className="bg-red-900 text-white border-red-400 text-[9px] sm:text-[10px] shrink-0"
            >
              COMBATE PENDIENTE
            </Badge>
          </div>

          <div className="flex items-center gap-3 bg-[#090d16]/80 p-2.5 border border-red-500/40">
            <div className="size-12 sm:size-14 bg-[#121927] border border-[#43526d] flex items-center justify-center shrink-0">
              <img
                src={obtenerImagenCriatura(rivalActivo.slug)}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                alt={rivalActivo.nombre}
                className="pixelated size-10 sm:size-12 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="retro text-xs text-white truncate">{rivalActivo.nombre}</span>
                <span className="font-mono text-[10px] text-amber-300 bg-[#1a2332] px-1.5 py-0.5 border border-[#f5b724]">
                  Nv. {rivalActivo.nivel}
                </span>
              </div>
              <p className="font-sans text-[11px] text-slate-300 mt-0.5 truncate">
                Salud rival: {rivalActivo.hpActual} / {rivalActivo.hpMaximo} HP
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-slate-200 leading-relaxed">
            Un rival hostil bloquea este sendero. Debes resolver el combate (vencer o huir desde
            la arena) antes de continuar explorando la ruta.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              font="retro"
              onClick={handleIniciarCombate}
              className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 text-xs py-3 gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#05070b] active:translate-y-1"
            >
              <Swords className="size-4" />
              <span>ENTRAR EN COMBATE AHORA</span>
            </Button>
            <Button
              variant="outline"
              font="retro"
              onClick={() => {
                reproducirSonido("click", 0.3);
                setModalEncuentroAbierto(true);
              }}
              className="w-full sm:w-auto bg-[#1a2332] text-[#14d1e8] hover:text-white border-[#43526d] text-xs py-3 gap-2 cursor-pointer active:translate-y-1"
            >
              <Eye className="size-4" />
              <span>INSPECCIONAR RIVAL</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Medidor de Progreso de la Zona y Control de Inmersión */}
      <div className="bg-[#121927] border-2 border-[#43526d] p-3.5 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-[#14d1e8]" />
            <h2 className="retro text-xs sm:text-sm text-[#14d1e8] tracking-wider uppercase">
              CARTOGRAFÍA Y AVANCE
            </h2>
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm text-[#14d1e8] bg-[#090d16] px-2.5 py-1 border border-[#43526d]/60">
            [ {progresoZona} % ]
          </span>
        </div>

        {/* Barra de progreso retro segmentada con canal oscuro */}
        <div className="space-y-1.5">
          <Progress
            value={progresoZona}
            variant="retro"
            font="normal"
            className="h-4 sm:h-5 bg-[#090d16] border border-[#43526d]/60"
            progressBg={progresoZona >= 100 ? "bg-[#22c55e]" : "bg-[#14d1e8]"}
          />
        </div>

        {/* Mensaje descriptivo contextual según el estado de la zona */}
        {ubicacion?.esSegura ? (
          <div className="p-3 bg-[#1a2332] border border-[#f5b724]/40 flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-[#f5b724] shrink-0 mt-0.5" />
            <div className="font-sans text-xs text-slate-300 leading-relaxed">
              <strong className="text-[#f5b724]">Localidad pacífica protegida:</strong> No
              existen criaturas salvajes para cazar en este asentamiento. Dirígete a las salidas
              del Hub para viajar a las Praderas del Amanecer u otras sendas silvestres.
            </div>
          </div>
        ) : rivalActivo ? (
          <p className="font-sans text-xs text-amber-300 leading-relaxed flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-300 shrink-0" />
            <span>
              La senda está bloqueada por el combate en curso. Resuelve el encuentro para seguir
              explorando y cartografiando la ruta.
            </span>
          </p>
        ) : (
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
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

        {/* Botón Principal de Inmersión o Resolución */}
        {ubicacion?.esSegura ? (
          <Link to="/hub" className="block w-full">
            <Button
              variant="outline"
              font="retro"
              onClick={() => reproducirSonido("click", 0.4)}
              className="w-full py-3.5 sm:py-4 bg-[#1a2332] hover:bg-[#1a2332]/80 text-[#14d1e8] border-2 border-[#14d1e8]/60 text-xs sm:text-sm tracking-wider uppercase gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#05070b] active:translate-y-1"
            >
              <Compass className="size-4 text-[#14d1e8]" />
              <span>VIAJAR A SENDA SILVESTRE DESDE EL HUB</span>
            </Button>
          </Link>
        ) : rivalActivo ? (
          <Button
            font="retro"
            onClick={handleIniciarCombate}
            className="w-full py-3.5 sm:py-4 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 text-xs sm:text-sm tracking-wider uppercase transition-transform active:translate-y-1 shadow-[4px_4px_0px_0px_#05070b] cursor-pointer flex items-center justify-center gap-2"
          >
            <Swords className="size-4 text-white" />
            <span>RESOLVER COMBATE CON {rivalActivo.nombre.toUpperCase()}</span>
          </Button>
        ) : (
          <Button
            font="retro"
            disabled={explorando}
            onClick={handleExplorar}
            aria-busy={explorando}
            className="w-full py-3.5 sm:py-4 bg-[#14d1e8] hover:bg-[#14d1e8]/90 text-[#090d16] border-2 border-[#05070b] text-xs sm:text-sm tracking-wider uppercase transition-transform active:translate-y-1 shadow-[4px_4px_0px_0px_#05070b] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {explorando ? (
              <>
                <Loader2 className="size-4 animate-spin text-[#090d16]" />
                <span>EXPLORANDO SENDA...</span>
              </>
            ) : (
              <>
                <Footprints className="size-4 text-[#090d16]" />
                <span>{progresoZona >= 100 ? "PATRULLAR SENDA" : "EXPLORAR SENDA"}</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* 4. Bitácora de Incursión: Registro Secuencial de Eventos en Geist Sans */}
      <div className="bg-[#121927] border-2 border-[#43526d] p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#43526d]/40 pb-2">
          <div className="flex items-center gap-2">
            <Scroll className="size-4 text-[#14d1e8]" />
            <h3 className="retro text-xs text-slate-200 tracking-wider uppercase">
              BITÁCORA DE INCURSIÓN
            </h3>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            EVENTOS: {bitacoraExploracion.length}
          </span>
        </div>

        <ul className="space-y-2 max-h-52 sm:max-h-64 overflow-y-auto pr-1">
          {bitacoraExploracion.map((registro) => {
            const esEncuentro = registro.tipo === "ENCUENTRO";
            const esObjeto = registro.tipo === "OBJETO";
            const esInicio = registro.tipo === "INICIO";

            return (
              <li
                key={registro.id}
                className={`p-2 sm:p-2.5 border flex items-start gap-2.5 transition-colors ${
                  esEncuentro
                    ? "bg-red-950/30 border-red-900/60 text-red-200"
                    : esObjeto
                      ? "bg-amber-950/30 border-amber-900/60 text-amber-200"
                      : esInicio
                        ? "bg-[#1a2332] border-[#43526d]/60 text-slate-300"
                        : "bg-[#1a2332]/70 border-[#43526d]/40 text-slate-200"
                }`}
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
                  <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                    <span
                      className={`retro text-[9px] uppercase tracking-wider ${
                        esEncuentro
                          ? "text-red-400"
                          : esObjeto
                            ? "text-[#f5b724]"
                            : esInicio
                              ? "text-[#14d1e8]"
                              : "text-slate-400"
                      }`}
                    >
                      {esEncuentro
                        ? "Encuentro Salvaje"
                        : esObjeto
                          ? "Botín Encontrado"
                          : esInicio
                            ? "Punto de Partida"
                            : "Avance de Exploración"}
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] text-slate-500">
                      {registro.hora}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-200 leading-relaxed break-words">
                    {registro.mensaje}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 5. Modal / Diálogo de Encuentro Retro Cinemático (Dialog 8-bit con scroll interno y responsive) */}
      <Dialog open={modalEncuentroAbierto} onOpenChange={setModalEncuentroAbierto}>
        <DialogContent
          font="normal"
          className="w-[94vw] max-w-md max-h-[85vh] overflow-y-auto bg-[#121927] border-2 border-[#43526d] text-slate-100 p-4 sm:p-5"
        >
          <DialogHeader>
            <DialogTitle
              font="normal"
              className="retro text-sm sm:text-base text-red-400 text-center flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Swords className="size-4 sm:size-5 text-red-400 animate-pulse shrink-0" />
              <span>¡CRIATURA SALVAJE!</span>
            </DialogTitle>
            <DialogDescription className="font-sans text-xs sm:text-sm text-slate-300 text-center mt-1">
              {rivalActivo?.mensaje ?? "¡Una bestia hostil surge entre la maleza y bloquea tu sendero!"}
            </DialogDescription>
          </DialogHeader>

          {rivalActivo && (
            <div className="my-2 sm:my-3 p-3 sm:p-4 bg-[#090d16] border-2 border-red-500/50 space-y-3 text-center">
              {/* Sprite de la criatura rival con renderizado pixelado nítido */}
              <div className="relative mx-auto size-24 sm:size-28 md:size-32 flex items-center justify-center bg-[#121927]/60 border border-[#43526d]/40">
                <img
                  src={obtenerImagenCriatura(rivalActivo.slug)}
                  onError={(e) => manejarErrorImagen(e, "criatura")}
                  alt={rivalActivo.nombre}
                  className="pixelated max-h-20 sm:max-h-24 max-w-20 sm:max-w-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter brightness-105"
                />
              </div>

              {/* Nombre en Press Start 2P e Insignia de Nivel */}
              <div>
                <h3 className="retro text-xs sm:text-sm text-[#14d1e8] uppercase tracking-wider truncate">
                  {rivalActivo.nombre}
                </h3>
                <Badge
                  font="retro"
                  className="bg-[#1a2332] text-amber-300 border-[#f5b724] text-[9px] sm:text-[10px] mt-1"
                >
                  Nv. {rivalActivo.nivel}
                </Badge>
              </div>

              {/* Vitalidad de la Criatura Rival */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-[10px] sm:text-[11px] font-mono text-slate-400">
                  <span>VITALIDAD RIVAL</span>
                  <span className="text-emerald-400 font-bold">
                    {rivalActivo.hpActual} / {rivalActivo.hpMaximo} HP
                  </span>
                </div>
                <div className="w-full bg-[#121927] border border-[#43526d]/60 h-2 sm:h-2.5">
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

              {/* Estadísticas Tácticas de Combate (si están disponibles) */}
              {(typeof rivalActivo.ataque === "number" ||
                typeof rivalActivo.defensa === "number" ||
                typeof rivalActivo.velocidad === "number") && (
                <div className="grid grid-cols-3 gap-1.5 pt-1 font-mono text-[9px] sm:text-[10px] text-slate-300">
                  <div className="bg-[#1a2332] border border-[#43526d]/50 p-1 text-center flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 text-red-400">
                      <Swords className="size-2.5 sm:size-3" />
                      <span>ATQ</span>
                    </div>
                    <span className="font-bold text-slate-100">{rivalActivo.ataque ?? 10}</span>
                  </div>

                  <div className="bg-[#1a2332] border border-[#43526d]/50 p-1 text-center flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 text-blue-400">
                      <Shield className="size-2.5 sm:size-3" />
                      <span>DEF</span>
                    </div>
                    <span className="font-bold text-slate-100">{rivalActivo.defensa ?? 10}</span>
                  </div>

                  <div className="bg-[#1a2332] border border-[#43526d]/50 p-1 text-center flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Zap className="size-2.5 sm:size-3" />
                      <span>VEL</span>
                    </div>
                    <span className="font-bold text-slate-100">{rivalActivo.velocidad ?? 10}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              font="retro"
              className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 text-xs py-2.5 gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#05070b] active:translate-y-1"
              onClick={handleIniciarCombate}
            >
              <Swords className="size-3.5" />
              <span>INICIAR COMBATE</span>
            </Button>
            <Button
              variant="outline"
              font="retro"
              className="w-full sm:w-auto flex-1 bg-[#1a2332] text-slate-300 hover:text-white border-[#43526d] text-xs py-2.5 gap-2 cursor-pointer active:translate-y-1"
              onClick={() => {
                reproducirSonido("click", 0.3);
                setModalEncuentroAbierto(false);
              }}
            >
              <Eye className="size-3.5" />
              <span>CERRAR FICHA</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal / Diálogo de Botín u Objeto Encontrado */}
      <Dialog open={modalBotinAbierto} onOpenChange={setModalBotinAbierto}>
        <DialogContent
          font="normal"
          className="w-[94vw] max-w-md max-h-[85vh] overflow-y-auto bg-[#121927] border-2 border-[#43526d] text-slate-100 p-4 sm:p-5"
        >
          <DialogHeader>
            <DialogTitle
              font="normal"
              className="retro text-sm sm:text-base text-[#f5b724] text-center flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Coins className="size-4 sm:size-5 text-[#f5b724]" />
              <span>¡BOTÍN DESCUBIERTO!</span>
            </DialogTitle>
            <DialogDescription className="font-sans text-xs sm:text-sm text-slate-300 text-center mt-1">
              Tus pasos por la ruta han revelado un recurso valioso para la expedición.
            </DialogDescription>
          </DialogHeader>

          {ultimaRecompensa && (
            <div className="my-3 p-4 bg-[#090d16] border-2 border-[#f5b724]/50 text-center space-y-3">
              {ultimaRecompensa.tipo === "MONEDAS" ? (
                <>
                  <div className="mx-auto size-14 sm:size-16 bg-[#1a2332] border border-[#f5b724]/60 flex items-center justify-center">
                    <Coins className="size-7 sm:size-8 text-[#f5b724]" />
                  </div>
                  <div>
                    <h3 className="retro text-xs sm:text-sm text-[#f5b724] uppercase tracking-wider">
                      +{ultimaRecompensa.cantidad} MONEDAS DE ORO
                    </h3>
                    <p className="font-sans text-xs text-slate-300 mt-1">
                      Añadidas automáticamente a tus reservas del gremio.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto size-14 sm:size-16 bg-[#1a2332] border border-[#14d1e8]/60 flex items-center justify-center">
                    <img
                      src={obtenerImagenObjeto(ultimaRecompensa.itemCodigo)}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      alt="Ítem obtenido"
                      className="pixelated size-8 sm:size-10 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="retro text-xs sm:text-sm text-[#14d1e8] uppercase tracking-wider truncate">
                      {ultimaRecompensa.itemCodigo || "OBJETO ÚTIL"} (x{ultimaRecompensa.cantidad})
                    </h3>
                    <p className="font-sans text-xs text-slate-300 mt-1">
                      Guardado con éxito en tu mochila de explorador.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              font="retro"
              onClick={() => {
                reproducirSonido("confirmar", 0.4);
                setModalBotinAbierto(false);
              }}
              className="w-full bg-[#f5b724] hover:bg-[#f5b724]/90 text-[#090d16] border-2 border-[#05070b] text-xs py-2.5 gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#05070b] active:translate-y-1"
            >
              <Backpack className="size-4" />
              <span>GUARDAR EN BOLSA</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaExploracion;
