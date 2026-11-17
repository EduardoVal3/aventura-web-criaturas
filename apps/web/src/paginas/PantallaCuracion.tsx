import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Heart,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Crown,
  HeartPulse,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
import HealthBar from "@/components/ui/8bit/health-bar";
import {
  api,
  type CriaturaEquipo,
  type UbicacionActual,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenCriatura,
  obtenerImagenZona,
  sanitizarSlugZona,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import { cn } from "@/lib/utils";
import {
  clasificarEstadoVital,
  calcularDeltaCuracion,
} from "@/lib/curacion-santuario";

export function PantallaCuracion() {
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [cargando, setCargando] = useState(true);
  const [restaurando, setRestaurando] = useState(false);
  const [animandoBendicion, setAnimandoBendicion] = useState(false);
  const [deltasCuracion, setDeltasCuracion] = useState<
    Record<string, { delta: number; fueRevivida: boolean }>
  >({});

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEquipo, resUbicacion] = await Promise.all([
        api.obtenerEquipo(),
        api.obtenerUbicacionActual().catch(() => null),
      ]);
      setEquipo(resEquipo.criaturas);
      setUbicacion(resUbicacion);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al consultar el estado del santuario y equipo.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Determinar si la localidad actual cuenta con servicio de curación activo
  const serviciosUbicacion = ubicacion?.servicios ?? [];
  const tieneServicioCuracion =
    serviciosUbicacion.includes("CURACION") ||
    serviciosUbicacion.includes("CENTRO_CURACION");
  const servicioDisponible = ubicacion
    ? Boolean(ubicacion.esSegura && tieneServicioCuracion)
    : true; // fallback permisivo si la API de ubicación no responde

  // Métricas tácticas del equipo
  const totalEnEquipo = equipo.length;
  const enPlenaVitalidad = equipo.filter(
    (c) => clasificarEstadoVital(c.hpActual, c.hpMaximo) === "PLENA_VITALIDAD",
  ).length;
  const heridas = equipo.filter(
    (c) => clasificarEstadoVital(c.hpActual, c.hpMaximo) === "HERIDA",
  ).length;
  const debilitadas = equipo.filter(
    (c) => clasificarEstadoVital(c.hpActual, c.hpMaximo) === "DEBILITADA",
  ).length;
  const deficitTotalHp = equipo.reduce(
    (acc, c) => acc + calcularDeltaCuracion(c.hpActual, c.hpMaximo),
    0,
  );
  const todoSaludable = totalEnEquipo > 0 && enPlenaVitalidad === totalEnEquipo;

  const handleRestaurar = async () => {
    if (restaurando || !servicioDisponible || todoSaludable) return;

    try {
      setRestaurando(true);
      reproducirSonido("click");

      const res = await api.restaurarEquipo();

      // Construcción de mapa de deltas y resurrección para números flotantes autoritativos
      const deltas: Record<string, { delta: number; fueRevivida: boolean }> = {};

      if (res.detalles && res.detalles.length > 0) {
        for (const detalle of res.detalles) {
          deltas[detalle.criaturaId] = {
            delta: detalle.hpRestaurado,
            fueRevivida: detalle.fueRevivida,
          };
        }
      } else {
        for (const criatura of equipo) {
          const delta = calcularDeltaCuracion(
            criatura.hpActual,
            criatura.hpMaximo,
          );
          deltas[criatura.criaturaId] = {
            delta,
            fueRevivida: criatura.hpActual <= 0 && delta > 0,
          };
        }
      }

      setDeltasCuracion(deltas);
      setAnimandoBendicion(true);

      // Reproducción de fanfarria solemne del santuario
      reproducirSonido("santuario");

      // Actualizar localmente la salud de todo el equipo al máximo (INV-03)
      setEquipo((prev) =>
        prev.map((c) => ({
          ...c,
          hpActual: c.hpMaximo,
        })),
      );

      toast.success(
        res.mensaje ||
          "¡Todas las criaturas del equipo han recibido la bendición del santuario!",
      );

      // Desactivar animación cinemática tras 1200ms
      setTimeout(() => {
        setAnimandoBendicion(false);
      }, 1200);
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo completar la restauración en el santuario.");
      }
    } finally {
      setRestaurando(false);
    }
  };

  const slugZona =
    ubicacion?.slug || sanitizarSlugZona(ubicacion?.nombre || "villa-serena");

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Cabecera inmersiva del Santuario (8bitcn/ui Brutalist) */}
      <Card className="rounded-none border-4 border-black shadow-[6px_6px_0_0_#000] bg-card overflow-hidden text-center">
        {/* Banner panorámico con imagen de zona y fallback pixelado */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden border-b-4 border-black bg-[#090d16]">
          <img
            src={obtenerImagenZona(slugZona)}
            alt={ubicacion?.nombre || "Santuario de Curación"}
            onError={(e) => manejarErrorImagen(e, "zona")}
            className="pixelated w-full h-full object-cover object-center filter brightness-95 contrast-105 scale-100 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 pointer-events-none" />

          {/* Insignias temáticas 8-bit */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-2 justify-between items-center pointer-events-auto z-10">
            <Badge
              variant="outline"
              className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/85 text-primary retro text-[8px] sm:text-[9px] flex items-center gap-1.5 py-1 px-2 backdrop-blur-xs"
            >
              <Sparkles className="size-3 text-amber-400 shrink-0" />
              <span>SANTUARIO ANCESTRAL</span>
            </Badge>

            <Badge
              variant="outline"
              className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/85 text-emerald-300 retro text-[8px] sm:text-[9px] flex items-center gap-1.5 py-1 px-2 backdrop-blur-xs"
            >
              <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
              <span>SERVICIO GRATUITO</span>
            </Badge>
          </div>

          {/* Título y locación integrados con protagonismo cinematográfico sobre el paisaje */}
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10 text-center">
            <div className="inline-flex items-center gap-1.5 bg-black/80 border border-black/80 px-2.5 py-1 mb-1.5 shadow-[2px_2px_0_0_#000]">
              <Sparkles className="size-3 text-amber-400 shrink-0" />
              <span className="retro text-[7px] sm:text-[8px] text-amber-300 uppercase tracking-widest">
                Manantial Místico • {ubicacion?.nombre || "Villa Serena"}
              </span>
            </div>
            <CardTitle className="retro text-base sm:text-2xl text-primary tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:2px_2px_0_#000]">
              SANTUARIO DE CURACIÓN
            </CardTitle>
          </div>
        </div>

        <CardHeader className="p-3 sm:p-4 pb-2 space-y-1">
          <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground max-w-xl mx-auto leading-relaxed break-words text-center">
            Las aguas místicas del manantial sagrado en{" "}
            <span className="font-bold text-foreground">
              {ubicacion?.nombre || "este asentamiento"}
            </span>{" "}
            restauran la vitalidad, alivian la fatiga y reviven a las criaturas
            caídas de tu equipo sin costo de monedas.
          </CardDescription>
        </CardHeader>

        {/* Advertencia preventiva si la localidad no tiene servicio activo */}
        {!servicioDisponible && (
          <div className="mx-2 sm:mx-6 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] bg-amber-500/10 text-amber-300 flex items-start gap-2.5 text-left">
            <AlertCircle className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left min-w-0">
              <p className="font-bold text-amber-200 retro text-[9px] sm:text-[10px]">
                SANTUARIO NO DISPONIBLE
              </p>
              <p className="retro text-[8px] sm:text-[9px] text-amber-300/90 leading-relaxed break-words">
                Te encuentras fuera de un asentamiento con santuario activo.
                Regresa a una localidad segura para recibir la bendición del
                manantial.
              </p>
            </div>
          </div>
        )}

        {/* Barra de resumen táctico del equipo (5 métricas tácticas) */}
        <div className="mx-2 sm:mx-6 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-none border-2 border-black bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)] grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-1">
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mb-1">
              TOTAL EQUIPO
            </span>
            <span className="retro text-[10px] sm:text-xs font-bold text-foreground">
              {totalEnEquipo} / 6
            </span>
          </div>
          <div className="p-1">
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mb-1">
              PLENA SALUD
            </span>
            <span className="retro text-[10px] sm:text-xs font-bold text-emerald-400">
              {enPlenaVitalidad}
            </span>
          </div>
          <div className="p-1">
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mb-1">
              HERIDAS
            </span>
            <span className="retro text-[10px] sm:text-xs font-bold text-amber-400">
              {heridas}
            </span>
          </div>
          <div className="p-1">
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mb-1">
              DEBILITADAS
            </span>
            <span className="retro text-[10px] sm:text-xs font-bold text-red-400">
              {debilitadas}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-1">
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mb-1">
              DÉFICIT TOTAL
            </span>
            <span className="retro text-[10px] sm:text-xs font-bold text-cyan-400">
              +{deficitTotalHp} HP
            </span>
          </div>
        </div>

        {/* Botones de acción del Santuario */}
        <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center border-t-2 border-black/40 bg-black/20">
          <Button
            size="lg"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-none border-4 border-black shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] transition-all cursor-pointer font-bold flex items-center justify-center gap-2"
            disabled={
              cargando || restaurando || todoSaludable || !servicioDisponible
            }
            aria-busy={restaurando}
            onClick={handleRestaurar}
          >
            {restaurando ? (
              <>
                <Spinner className="size-4" />
                <span className="retro text-[9px] sm:text-[10px]">
                  CANALIZANDO BENDICIÓN...
                </span>
              </>
            ) : todoSaludable ? (
              <>
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="retro text-[9px] sm:text-[10px]">
                  EQUIPO EN PLENA VITALIDAD
                </span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-amber-300" />
                <span className="retro text-[9px] sm:text-[10px]">
                  RESTAURAR TODO EL EQUIPO
                </span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:bg-muted transition-all cursor-pointer retro text-[8px] sm:text-[9px] flex items-center justify-center gap-2"
            onClick={() => {
              reproducirSonido("click");
              navigate("/hub");
            }}
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Asentamiento</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Desglose táctico de las criaturas del equipo */}
      <div className="space-y-3">
        <h2 className="retro text-[10px] sm:text-xs text-foreground uppercase tracking-wide flex items-center gap-2 drop-shadow-[1px_1px_0_#000]">
          <Heart className="size-3.5 sm:size-4 text-rose-400 shrink-0" />
          <span>DESGLOSE TÁCTICO DEL EQUIPO</span>
        </h2>

        {cargando && (
          <div className="rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] p-8 text-center bg-card space-y-3">
            <Spinner className="size-6 mx-auto text-primary" />
            <p className="retro text-[9px] sm:text-[10px] text-muted-foreground">
              Consultando estado del santuario...
            </p>
          </div>
        )}

        {equipo.length === 0 && !cargando && (
          <Card className="p-6 sm:p-8 text-center rounded-none border-2 border-dashed border-black/80 bg-card shadow-[4px_4px_0_0_#000]">
            <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
              No tienes criaturas en el equipo activo. Visita el Almacén para
              incorporar compañeros.
            </p>
          </Card>
        )}

        {!cargando && equipo.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {equipo.map((criatura) => {
              const estado = clasificarEstadoVital(
                criatura.hpActual,
                criatura.hpMaximo,
              );
              const esDebilitada = estado === "DEBILITADA";
              const esHerida = estado === "HERIDA";
              const esPlena = estado === "PLENA_VITALIDAD";
              const esLider = criatura.orden === 1;

              const porcentajeHp = Math.round(
                (Math.max(0, criatura.hpActual) /
                  Math.max(1, criatura.hpMaximo)) *
                  100,
              );

              const deltaInfo = deltasCuracion[criatura.criaturaId];
              const tieneDelta =
                animandoBendicion && deltaInfo && deltaInfo.delta > 0;

              return (
                <Card
                  key={criatura.criaturaId}
                  className={cn(
                    "relative p-3 sm:p-4 rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] bg-card transition-all",
                    esLider && "border-amber-500/80 bg-amber-500/10",
                    tieneDelta && "anim-curacion border-emerald-500",
                  )}
                >
                  {/* Cifra flotante de vitalidad o resurrección */}
                  {tieneDelta && (
                    <div className="absolute -top-3.5 right-2 sm:right-3 z-30 pointer-events-none anim-curacion-flotante retro text-[10px] sm:text-xs font-bold text-emerald-400 [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">
                      {deltaInfo.fueRevivida
                        ? `¡REVIVIDA! +${deltaInfo.delta} HP`
                        : `+${deltaInfo.delta} HP`}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Marco de sprite pixel-art con relieve interior */}
                    <div className="relative size-16 sm:size-18 shrink-0 rounded-none border-2 border-black bg-black/50 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={obtenerImagenCriatura(criatura.slug)}
                        alt={criatura.nombre}
                        onError={(e) => manejarErrorImagen(e, "criatura")}
                        className={cn(
                          "pixelated size-14 sm:size-16 object-contain transition-all duration-500",
                          esDebilitada && "grayscale opacity-70",
                        )}
                        loading="lazy"
                      />
                      {esLider && (
                        <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-black border-t-2 border-l-2 border-black">
                          <Crown className="size-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Identidad táctica y estado */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="retro text-[10px] sm:text-xs leading-tight text-foreground break-words">
                            {criatura.apodo || criatura.nombre}
                          </h3>
                          {esLider && (
                            <Badge
                              variant="outline"
                              className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/20 text-amber-300 retro text-[7px] sm:text-[8px] py-0 px-1 flex items-center gap-1 shrink-0"
                            >
                              <Crown className="size-2 text-amber-400" />
                              <span>LÍDER</span>
                            </Badge>
                          )}
                        </div>

                        {/* Semáforo de estado de 3 niveles con iconos Lucide y estilo retro-brutalist */}
                        {esPlena && (
                          <Badge
                            variant="outline"
                            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-emerald-500/20 text-emerald-300 retro text-[7px] sm:text-[8px] py-0 px-1.5 flex items-center gap-1 shrink-0"
                          >
                            <ShieldCheck className="size-2.5 text-emerald-400" />
                            <span>PLENA VITALIDAD</span>
                          </Badge>
                        )}
                        {esHerida && (
                          <Badge
                            variant="outline"
                            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/20 text-amber-300 retro text-[7px] sm:text-[8px] py-0 px-1.5 flex items-center gap-1 shrink-0"
                          >
                            <HeartPulse className="size-2.5 text-amber-400" />
                            <span>HERIDA</span>
                          </Badge>
                        )}
                        {esDebilitada && (
                          <Badge
                            variant="outline"
                            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-red-500/25 text-red-300 retro text-[7px] sm:text-[8px] py-0 px-1.5 flex items-center gap-1 shrink-0"
                          >
                            <AlertCircle className="size-2.5 text-red-400" />
                            <span>DEBILITADA / CAÍDA</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 retro text-[7px] sm:text-[8px] text-muted-foreground leading-relaxed break-words">
                        <span>Nv. {criatura.nivel}</span>
                        <span>•</span>
                        <span>Posición #{criatura.orden}</span>
                        {criatura.apodo && criatura.apodo !== criatura.nombre && (
                          <>
                            <span>•</span>
                            <span className="italic break-words">
                              ({criatura.nombre})
                            </span>
                          </>
                        )}
                      </div>

                      {/* Barra de vitalidad interactiva con porcentaje */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between retro text-[7px] sm:text-[8px] gap-1 flex-wrap">
                          <span className="text-muted-foreground">
                            Vitalidad:
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              esDebilitada && "text-red-400",
                              esHerida && "text-amber-400",
                              esPlena && "text-emerald-400",
                            )}
                          >
                            {criatura.hpActual} / {criatura.hpMaximo} HP (
                            {porcentajeHp}%)
                          </span>
                        </div>
                        <HealthBar
                          value={porcentajeHp}
                          variant="retro"
                          className="h-3 rounded-none border border-black"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PantallaCuracion;
