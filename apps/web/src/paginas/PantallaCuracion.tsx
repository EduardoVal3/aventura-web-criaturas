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

export type EstadoVitalCriatura = "PLENA_VITALIDAD" | "HERIDA" | "DEBILITADA";

/**
 * Clasifica de forma pura el estado de vitalidad táctica de una criatura.
 */
export function clasificarEstadoVital(
  hpActual: number,
  hpMaximo: number,
): EstadoVitalCriatura {
  if (hpActual <= 0) {
    return "DEBILITADA";
  }
  if (hpActual >= hpMaximo) {
    return "PLENA_VITALIDAD";
  }
  return "HERIDA";
}

/**
 * Devuelve la etiqueta de texto en español estricto para cada estado vital.
 */
export function etiquetaEstadoVital(estado: EstadoVitalCriatura): string {
  switch (estado) {
    case "PLENA_VITALIDAD":
      return "PLENA VITALIDAD";
    case "HERIDA":
      return "HERIDA";
    case "DEBILITADA":
      return "DEBILITADA / CAÍDA";
  }
}

/**
 * Calcula el déficit de puntos de vitalidad bajo el invariante INV-03.
 */
export function calcularDeltaCuracion(
  hpActual: number,
  hpMaximo: number,
): number {
  const hpBase = Math.max(0, hpActual);
  const hpTope = Math.max(1, hpMaximo);
  return Math.max(0, hpTope - hpBase);
}

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
    <div className="space-y-6 max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-0">
      {/* Cabecera inmersiva del Santuario */}
      <Card className="border-2 border-primary/50 bg-bastion rounded-none overflow-hidden text-center shadow-lg">
        {/* Banner panorámico con imagen de zona y fallback pixelado */}
        <div className="relative h-28 sm:h-40 w-full overflow-hidden border-b-2 border-primary/40 bg-abismo">
          <img
            src={obtenerImagenZona(slugZona)}
            alt={ubicacion?.nombre || "Santuario de Curación"}
            onError={(e) => manejarErrorImagen(e, "zona")}
            className="pixelated w-full h-full object-cover object-center opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bastion via-bastion/60 to-transparent pointer-events-none" />

          {/* Insignias temáticas 8-bit */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-2 justify-between items-center pointer-events-none">
            <Badge
              variant="outline"
              className="rounded-none border-primary/60 bg-abismo/80 text-primary retro text-[9px] sm:text-[10px] flex items-center gap-1.5 py-1 px-2"
            >
              <Sparkles className="size-3 text-amber-400" />
              <span>SANTUARIO ANCESTRAL</span>
            </Badge>

            <Badge
              variant="outline"
              className="rounded-none border-emerald-500/60 bg-abismo/80 text-emerald-300 retro text-[9px] sm:text-[10px] flex items-center gap-1.5 py-1 px-2"
            >
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>SERVICIO GRATUITO</span>
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="retro text-base sm:text-2xl text-primary tracking-wide mb-2">
            SANTUARIO DE CURACIÓN
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto font-sans">
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
          <div className="mx-4 sm:mx-6 mb-4 p-3 border-2 border-destructive/70 bg-destructive/10 rounded-none flex items-start gap-2.5 text-left">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-destructive retro text-[10px]">
                SANTUARIO NO DISPONIBLE
              </p>
              <p className="text-muted-foreground">
                Te encuentras fuera de un asentamiento con santuario activo.
                Regresa a una localidad segura para recibir la bendición del
                manantial.
              </p>
            </div>
          </div>
        )}

        {/* Barra de resumen táctico del equipo */}
        <div className="mx-4 sm:mx-6 mb-4 p-3 border-2 border-border/60 bg-abismo/60 rounded-none grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              TOTAL EQUIPO
            </span>
            <span className="font-bold font-mono text-sm">
              {totalEnEquipo} / 6
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              PLENA SALUD
            </span>
            <span className="font-bold font-mono text-sm text-emerald-400">
              {enPlenaVitalidad}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              HERIDAS
            </span>
            <span className="font-bold font-mono text-sm text-amber-400">
              {heridas}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              DEBILITADAS
            </span>
            <span className="font-bold font-mono text-sm text-red-400">
              {debilitadas}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground block font-mono">
              DÉFICIT TOTAL
            </span>
            <span className="font-bold font-mono text-sm text-cyan-400">
              +{deficitTotalHp} HP
            </span>
          </div>
        </div>

        {/* Botones de acción del Santuario */}
        <CardFooter className="p-4 sm:p-6 pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center border-t border-border/40">
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 flex items-center justify-center gap-2 rounded-none"
            disabled={
              cargando || restaurando || todoSaludable || !servicioDisponible
            }
            aria-busy={restaurando}
            onClick={handleRestaurar}
          >
            {restaurando ? (
              <>
                <Spinner className="size-4" />
                <span className="retro text-[10px]">
                  CANALIZANDO BENDICIÓN...
                </span>
              </>
            ) : todoSaludable ? (
              <>
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="retro text-[10px]">
                  EQUIPO EN PLENA VITALIDAD
                </span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-amber-300" />
                <span className="retro text-[10px]">
                  RESTAURAR TODO EL EQUIPO
                </span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto text-xs rounded-none flex items-center justify-center gap-2"
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
        <h2 className="retro text-xs sm:text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
          <Heart className="size-4 text-rose-400" />
          <span>DESGLOSE TÁCTICO DEL EQUIPO</span>
        </h2>

        {equipo.length === 0 && !cargando && (
          <Card className="p-8 text-center border-2 border-dashed border-border/60 rounded-none bg-bastion/50">
            <p className="text-sm text-muted-foreground font-mono">
              No tienes criaturas en el equipo activo. Visita el Almacén para
              incorporar compañeros.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  "relative p-4 border-2 rounded-none bg-bastion transition-all",
                  esLider && "border-amber-500/80 bg-amber-500/5",
                  tieneDelta && "anim-curacion border-emerald-500/80",
                )}
              >
                {/* Cifra flotante de vitalidad o resurrección */}
                {tieneDelta && (
                  <div className="absolute -top-3 right-3 z-20 pointer-events-none anim-curacion-flotante retro text-xs sm:text-sm font-bold text-emerald-400 [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">
                    {deltaInfo.fueRevivida
                      ? `¡REVIVIDA! +${deltaInfo.delta} HP`
                      : `+${deltaInfo.delta} HP`}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Marco de sprite pixel-art de 64x64 con clase .pixelated */}
                  <div className="relative h-16 w-16 shrink-0 border-2 border-border bg-abismo/80 p-1 rounded-none flex items-center justify-center overflow-hidden">
                    <img
                      src={obtenerImagenCriatura(criatura.slug)}
                      alt={criatura.nombre}
                      onError={(e) => manejarErrorImagen(e, "criatura")}
                      className={cn(
                        "pixelated h-14 w-14 object-contain transition-all duration-500",
                        esDebilitada && "grayscale opacity-70",
                      )}
                    />
                    {esLider && (
                      <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-black">
                        <Crown className="size-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Identidad táctica y estado */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="retro text-xs sm:text-sm truncate text-foreground">
                          {criatura.apodo || criatura.nombre}
                        </h3>
                        {esLider && (
                          <Badge
                            variant="outline"
                            className="rounded-none border-amber-500/80 bg-amber-500/20 text-amber-300 retro text-[8px] py-0 px-1 flex items-center gap-1 shrink-0"
                          >
                            <Crown className="size-2.5 text-amber-400" />
                            <span>LÍDER</span>
                          </Badge>
                        )}
                      </div>

                      {/* Semáforo de estado de 3 niveles con iconos Lucide */}
                      {esPlena && (
                        <Badge
                          variant="outline"
                          className="rounded-none border-emerald-500/60 bg-emerald-500/15 text-emerald-300 text-[9px] py-0 px-1.5 flex items-center gap-1 shrink-0 font-mono"
                        >
                          <ShieldCheck className="size-2.5" />
                          <span>PLENA VITALIDAD</span>
                        </Badge>
                      )}
                      {esHerida && (
                        <Badge
                          variant="outline"
                          className="rounded-none border-amber-500/60 bg-amber-500/15 text-amber-300 text-[9px] py-0 px-1.5 flex items-center gap-1 shrink-0 font-mono"
                        >
                          <HeartPulse className="size-2.5" />
                          <span>HERIDA</span>
                        </Badge>
                      )}
                      {esDebilitada && (
                        <Badge
                          variant="outline"
                          className="rounded-none border-red-500/70 bg-red-500/20 text-red-300 text-[9px] py-0 px-1.5 flex items-center gap-1 shrink-0 font-mono"
                        >
                          <AlertCircle className="size-2.5" />
                          <span>DEBILITADA / CAÍDA</span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mb-2">
                      <span>Nv. {criatura.nivel}</span>
                      <span>•</span>
                      <span>Posición #{criatura.orden}</span>
                      {criatura.apodo && criatura.apodo !== criatura.nombre && (
                        <>
                          <span>•</span>
                          <span className="italic truncate">
                            {criatura.nombre}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Barra de vitalidad interactiva con porcentaje */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
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
                        className="h-3 rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PantallaCuracion;
