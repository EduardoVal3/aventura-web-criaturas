import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Crown,
  Archive,
  MapPinOff,
  Warehouse,
  ArrowLeft,
  Swords,
  Shield,
  Zap,
  Heart,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Spinner } from "@/components/ui/8bit/spinner";
import HealthBar from "@/components/ui/8bit/health-bar";
import XpBar from "@/components/ui/8bit/xp-bar";
import { api, type CriaturaEquipo, ErrorApi } from "@/api";
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import { moverEnLista } from "@/lib/orden-equipo";

export function PantallaEquipo() {
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [limiteEquipo, setLimiteEquipo] = useState<number>(6);
  const [enLocalidadSegura, setEnLocalidadSegura] = useState<boolean>(true);
  const [cargando, setCargando] = useState<boolean>(true);
  const [operacion, setOperacion] = useState<{
    tipo: "orden" | "transferir";
    criaturaId: string;
  } | null>(null);

  const cargarEquipo = async () => {
    try {
      const respuesta = await api.obtenerEquipo();
      setEquipo(respuesta.criaturas);
      setLimiteEquipo(respuesta.limiteEquipo ?? 6);
      setEnLocalidadSegura(respuesta.enLocalidadSegura ?? true);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las criaturas del equipo activo.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipo();
  }, []);

  const handleReordenar = async (nuevosIds: string[], criaturaId: string, esLider: boolean) => {
    if (operacion) return;
    try {
      setOperacion({ tipo: "orden", criaturaId });
      reproducirSonido("seleccionar");
      const respuesta = await api.actualizarOrdenEquipo({ criaturaIds: nuevosIds });
      setEquipo(respuesta.criaturas);
      setLimiteEquipo(respuesta.limiteEquipo ?? 6);
      setEnLocalidadSegura(respuesta.enLocalidadSegura ?? true);
      reproducirSonido("confirmar");
      toast.success(
        esLider
          ? "Nueva criatura líder designada para el combate."
          : "Orden táctico del equipo actualizado.",
      );
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al actualizar el orden táctico.");
      }
    } finally {
      setOperacion(null);
    }
  };

  const handleSubir = (indice: number) => {
    if (indice <= 0 || operacion) return;
    const ids = equipo.map((c) => c.criaturaId);
    const nuevosIds = moverEnLista(ids, indice, indice - 1);
    handleReordenar(nuevosIds, equipo[indice].criaturaId, indice - 1 === 0);
  };

  const handleBajar = (indice: number) => {
    if (indice >= equipo.length - 1 || operacion) return;
    const ids = equipo.map((c) => c.criaturaId);
    const nuevosIds = moverEnLista(ids, indice, indice + 1);
    handleReordenar(nuevosIds, equipo[indice].criaturaId, false);
  };

  const handleDesignarLider = (indice: number) => {
    if (indice === 0 || operacion) return;
    const ids = equipo.map((c) => c.criaturaId);
    const nuevosIds = moverEnLista(ids, indice, 0);
    handleReordenar(nuevosIds, equipo[indice].criaturaId, true);
  };

  const handleEnviarAlmacen = async (criatura: CriaturaEquipo) => {
    if (operacion) return;
    if (equipo.length <= 1) {
      toast.warning("Debes conservar al menos una criatura en tu equipo activo.");
      return;
    }
    if (!enLocalidadSegura) {
      toast.warning("Solo puedes transferir criaturas en un asentamiento seguro.");
      return;
    }

    try {
      setOperacion({ tipo: "transferir", criaturaId: criatura.criaturaId });
      reproducirSonido("seleccionar");
      const respuesta = await api.transferirCriatura({
        criaturaId: criatura.criaturaId,
        haciaEquipo: false,
      });
      reproducirSonido("exito");

      const datosActualizados = await api.obtenerEquipo();
      setEquipo(datosActualizados.criaturas);
      setLimiteEquipo(datosActualizados.limiteEquipo ?? 6);
      setEnLocalidadSegura(datosActualizados.enLocalidadSegura ?? true);

      if (criatura.orden === 1 && datosActualizados.criaturas.length > 0) {
        toast.success(
          `${respuesta.mensaje} ${datosActualizados.criaturas[0].nombre} asume el liderazgo.`,
        );
      } else {
        toast.success(respuesta.mensaje || `${criatura.nombre} enviada al almacén.`);
      }
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al transferir la criatura al almacén.");
      }
    } finally {
      setOperacion(null);
    }
  };

  const ranurasLibres = Math.max(0, limiteEquipo - equipo.length);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
      {/* Cabecera y Navegación Rápida */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b-2 border-black/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <h1 className="retro text-sm sm:text-lg text-primary tracking-wide drop-shadow-[2px_2px_0_#000]">
              Equipo Activo
            </h1>
            <Badge
              variant="secondary"
              className="rounded-none font-mono text-[10px] sm:text-xs border-2 border-black shadow-[2px_2px_0_0_#000] bg-card text-foreground px-1.5 sm:px-2 py-0.5"
            >
              {equipo.length} / {limiteEquipo}
            </Badge>
          </div>
          <p className="text-[11px] sm:text-sm text-muted-foreground font-sans leading-snug">
            Mesa táctica de mando: gestiona el combatiente líder y compañeros de expedición.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2.5 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-[11px] sm:text-xs rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/almacen">
              <Warehouse className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Ir al Almacén
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-[11px] sm:text-xs rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/hub">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Volver al Asentamiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Aviso de localidad no segura */}
      {!enLocalidadSegura && (
        <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-amber-500/10 border-2 border-black shadow-[2px_2px_0_0_#000] text-amber-400 text-[11px] sm:text-xs font-sans rounded-none leading-snug">
          <MapPinOff className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Las transferencias solo están disponibles en un asentamiento seguro. El orden táctico sí puede ajustarse aquí.
          </span>
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-4 space-y-3"
            >
              <Skeleton className="h-6 w-3/4 bg-muted/40 border border-black rounded-none" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 bg-muted/40 border border-black rounded-none shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full bg-muted/40 border border-black rounded-none" />
                  <Skeleton className="h-3 w-1/2 bg-muted/40 border border-black rounded-none" />
                </div>
              </div>
              <Skeleton className="h-12 w-full bg-muted/40 border border-black rounded-none" />
              <Skeleton className="h-8 w-full bg-muted/40 border border-black rounded-none" />
            </div>
          ))}
        </div>
      ) : equipo.length === 0 ? (
        <Card font="normal" className="text-center p-6 sm:p-8 border-4 border-black shadow-[6px_6px_0_0_#000] bg-card rounded-none">
          <CardTitle className="retro text-xs sm:text-sm text-muted-foreground mb-2">
            No tienes criaturas en tu equipo activo
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-4 font-sans">
            Ve al almacén para transferir compañeros a tu equipo.
          </p>
          <Button
            asChild
            size="sm"
            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer text-xs mt-2"
          >
            <Link to="/almacen">
              <Warehouse className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Ver Almacén
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {equipo.map((criatura, index) => {
            const porcentajeHp = Math.round(
              (criatura.hpActual / criatura.hpMaximo) * 100,
            );
            const esLider = criatura.orden === 1;
            const estaDebilitada = criatura.hpActual <= 0;
            const operacionActiva = operacion?.criaturaId === criatura.criaturaId;
            const estaTransfiriendo =
              operacionActiva && operacion?.tipo === "transferir";
            const estaOrdenando =
              operacionActiva && operacion?.tipo === "orden";

            return (
              <Card
                key={criatura.criaturaId}
                font="normal"
                className={`flex flex-col justify-between rounded-none transition-all ${
                  esLider
                    ? "border-4 border-black shadow-[6px_6px_0_0_#000] bg-amber-500/10 ring-1 ring-amber-400/40"
                    : "border-2 border-black shadow-[4px_4px_0_0_#000] bg-card"
                }`}
              >
                <CardHeader font="normal" className="p-2.5 sm:p-3 pb-2 space-y-2">
                  {/* Fila superior: Orden/Líder/Debilitada y Nivel */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground bg-black/40 border border-black px-1.5 py-0.5 shadow-[1px_1px_0_0_#000]">
                        #{criatura.orden}
                      </span>
                      {esLider && (
                        <Badge
                          variant="default"
                          className="bg-amber-400 text-black font-bold text-[8px] sm:text-[9px] retro rounded-none gap-1 py-0.5 px-1.5 sm:px-2 border-2 border-black shadow-[2px_2px_0_0_#000]"
                        >
                          <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                          LÍDER
                        </Badge>
                      )}
                      {estaDebilitada && (
                        <Badge
                          variant="destructive"
                          className="bg-red-600 text-white text-[8px] sm:text-[9px] retro rounded-none py-0.5 px-1.5 sm:px-2 border-2 border-black shadow-[2px_2px_0_0_#000]"
                        >
                          DEBILITADA
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] sm:text-[10px] font-mono font-bold rounded-none border-2 border-black bg-black/50 shadow-[2px_2px_0_0_#000] text-foreground shrink-0 px-1.5 py-0.5"
                    >
                      Nv. {criatura.nivel}
                    </Badge>
                  </div>

                  {/* Fila del Sprite y Nombre */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className={`relative shrink-0 flex items-center justify-center ${
                        esLider
                          ? "bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                          : "bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]"
                      } p-1`}
                    >
                      <img
                        src={obtenerImagenCriatura(criatura.slug)}
                        alt={criatura.nombre}
                        onError={(e) => manejarErrorImagen(e, "criatura")}
                        className="pixelated h-12 w-12 sm:h-16 sm:w-16 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="retro text-[10px] sm:text-xs text-foreground drop-shadow-[1px_1px_0_#000] leading-snug line-clamp-2 break-words">
                        {criatura.nombre}
                      </CardTitle>
                      {criatura.apodo && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-sans truncate mt-0.5 italic">
                          &ldquo;{criatura.apodo}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent font="normal" className="p-2.5 sm:p-3 pt-1 space-y-2.5 sm:space-y-3">
                  {/* Salud */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-muted-foreground flex items-center gap-1 text-[10px] sm:text-[11px]">
                        <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" /> Salud
                      </span>
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold text-foreground">
                        {criatura.hpActual} / {criatura.hpMaximo} HP
                      </span>
                    </div>
                    <div className="border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]">
                      <HealthBar
                        value={porcentajeHp}
                        variant="retro"
                        className="h-2 sm:h-2.5 rounded-none"
                      />
                    </div>
                  </div>

                  {/* Progreso EXP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-muted-foreground text-[10px] sm:text-[11px]">
                        Progreso EXP
                      </span>
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold text-purple-300">
                        {criatura.porcentajeXp ?? 0}%
                      </span>
                    </div>
                    <div className="border border-black bg-black/60 p-0.5 shadow-[1px_1px_0_0_#000]">
                      <XpBar
                        value={criatura.porcentajeXp ?? 0}
                        variant="retro"
                        className="h-2 rounded-none"
                      />
                    </div>
                  </div>

                  {/* Matriz de Atributos Base */}
                  <div className="grid grid-cols-3 gap-1 p-1 sm:p-1.5 bg-black/40 border-2 border-black shadow-[2px_2px_0_0_#000] text-center font-mono text-xs">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Swords className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" /> ATQ
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">{criatura.ataque}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-400" /> DEF
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">{criatura.defensa}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400" /> VEL
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">{criatura.velocidad}</span>
                    </div>
                  </div>

                  {estaDebilitada && (
                    <div className="p-1 sm:p-1.5 bg-red-950/40 border border-red-500/40 text-[10px] sm:text-[11px] text-red-400 font-sans leading-snug">
                      El combate la omitirá hasta curarla.
                    </div>
                  )}
                </CardContent>

                <CardFooter font="normal" className="p-3 sm:p-3.5 pt-3 border-t-2 border-black/40 flex flex-col gap-3.5 sm:gap-4">
                  {/* Botones de orden táctico */}
                  <div className="flex items-center justify-between gap-3 sm:gap-3.5 w-full">
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={operacion !== null || index === 0}
                        onClick={() => handleSubir(index)}
                        aria-label={`Subir a ${criatura.nombre}`}
                      >
                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={operacion !== null || index === equipo.length - 1}
                        onClick={() => handleBajar(index)}
                        aria-label={`Bajar a ${criatura.nombre}`}
                      >
                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {!esLider ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 sm:h-8 text-[8.5px] sm:text-[10px] retro rounded-none gap-1 flex-1 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed px-1.5 sm:px-2.5"
                        disabled={operacion !== null || estaDebilitada}
                        onClick={() => handleDesignarLider(index)}
                        aria-busy={estaOrdenando}
                      >
                        {estaOrdenando ? (
                          <>
                            <Spinner className="h-3 w-3" />
                            <span>PROCESANDO...</span>
                          </>
                        ) : (
                          <>
                            <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" />
                            <span>Designar líder</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex-1 h-7 sm:h-8 flex items-center justify-center text-[7.5px] sm:text-[8.5px] retro text-amber-400 bg-amber-950/40 border border-amber-500/50 px-1 sm:px-2 text-center shadow-[1px_1px_0_0_#000] tracking-wider">
                        LÍDER ACTUAL
                      </div>
                    )}
                  </div>

                  {/* Transferir al almacén */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-7 sm:h-8 text-[10px] sm:text-xs rounded-none gap-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={
                      operacion !== null ||
                      equipo.length <= 1 ||
                      !enLocalidadSegura
                    }
                    aria-busy={estaTransfiriendo}
                    onClick={() => handleEnviarAlmacen(criatura)}
                  >
                    {estaTransfiriendo ? (
                      <>
                        <Spinner className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>PROCESANDO...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>Enviar al almacén</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {/* Ranuras vacías */}
          {Array.from({ length: ranurasLibres }).map((_, k) => {
            const numeroRanura = equipo.length + k + 1;
            return (
              <div
                key={`ranura-vacia-${numeroRanura}`}
                className="border-2 border-dashed border-black/80 bg-black/20 shadow-[2px_2px_0_0_#000] p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 min-h-[140px] sm:min-h-[220px] rounded-none"
                aria-label={`Ranura libre ${numeroRanura} de ${limiteEquipo}`}
              >
                <span className="retro text-[9px] sm:text-[10px] text-muted-foreground uppercase">
                  Ranura libre
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-muted-foreground/80 font-bold">
                  {numeroRanura} de {limiteEquipo}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PantallaEquipo;
