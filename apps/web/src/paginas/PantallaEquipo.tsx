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
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="retro text-base sm:text-lg text-primary tracking-wide">
              Equipo Activo
            </h1>
            <Badge variant="secondary" className="rounded-none font-mono">
              {equipo.length} / {limiteEquipo}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Gestiona los miembros que te acompañan en combate y expedición.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs rounded-none">
            <Link to="/almacen">
              <Warehouse className="h-4 w-4 mr-1.5" />
              Ir al Almacén
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs rounded-none">
            <Link to="/hub">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver al Asentamiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Aviso de localidad no segura */}
      {!enLocalidadSegura && (
        <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 text-xs font-sans rounded-none">
          <MapPinOff className="h-4 w-4 shrink-0" />
          <span>
            Las transferencias solo están disponibles en un asentamiento seguro. El orden táctico sí puede ajustarse aquí.
          </span>
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-none" />
          ))}
        </div>
      ) : equipo.length === 0 ? (
        <Card className="text-center p-8 border-2 rounded-none">
          <CardTitle className="retro text-sm text-muted-foreground mb-2">
            No tienes criaturas en tu equipo activo
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-4 font-sans">
            Ve al almacén para transferir compañeros a tu equipo.
          </p>
          <Button asChild size="sm" className="rounded-none">
            <Link to="/almacen">
              <Warehouse className="h-4 w-4 mr-1.5" />
              Ver Almacén
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                className={`flex flex-col justify-between rounded-none ${
                  esLider
                    ? "border-4 border-amber-500/80 bg-amber-500/5 shadow-md"
                    : "border-2"
                }`}
              >
                <CardHeader className="p-3 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        #{criatura.orden}
                      </span>
                      {esLider && (
                        <Badge
                          variant="default"
                          className="bg-amber-500 text-black font-bold text-[9px] retro rounded-none gap-1 py-0.5 px-1.5"
                        >
                          <Crown className="h-3 w-3 fill-current" />
                          LÍDER
                        </Badge>
                      )}
                      {estaDebilitada && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] retro rounded-none py-0.5 px-1.5"
                        >
                          DEBILITADA
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono rounded-none">
                      Nv. {criatura.nivel}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={obtenerImagenCriatura(criatura.slug)}
                      alt={criatura.nombre}
                      onError={(e) => manejarErrorImagen(e, "criatura")}
                      className="pixelated h-16 w-16 object-contain shrink-0 bg-muted/20 border border-border/40 p-1"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="retro text-xs text-foreground truncate">
                        {criatura.nombre}
                      </CardTitle>
                      {criatura.apodo && (
                        <p className="text-xs text-muted-foreground font-sans truncate mt-0.5">
                          &ldquo;{criatura.apodo}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-1 space-y-2.5">
                  {/* Salud */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Heart className="h-3 w-3 text-red-500" /> Salud
                      </span>
                      <span className="font-mono text-[11px]">
                        {criatura.hpActual} / {criatura.hpMaximo} HP
                      </span>
                    </div>
                    <HealthBar
                      value={porcentajeHp}
                      variant="retro"
                      className="h-2.5 rounded-none"
                    />
                  </div>

                  {/* Progreso EXP (solo etiqueta de la barra, sin porcentaje duplicado) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-muted-foreground text-[11px]">
                        Progreso EXP
                      </span>
                      <span className="font-mono text-[11px] text-accent">
                        {criatura.porcentajeXp ?? 0}%
                      </span>
                    </div>
                    <XpBar
                      value={criatura.porcentajeXp ?? 0}
                      variant="retro"
                      className="h-2 rounded-none"
                    />
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-1 p-1.5 bg-muted/40 rounded-none border border-border/50 text-center font-mono text-xs">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Swords className="h-3 w-3" /> ATQ
                      </span>
                      <span className="font-semibold">{criatura.ataque}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Shield className="h-3 w-3" /> DEF
                      </span>
                      <span className="font-semibold">{criatura.defensa}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 uppercase">
                        <Zap className="h-3 w-3" /> VEL
                      </span>
                      <span className="font-semibold">{criatura.velocidad}</span>
                    </div>
                  </div>

                  {estaDebilitada && (
                    <p className="text-[11px] text-destructive font-sans">
                      El combate la omitirá hasta curarla.
                    </p>
                  )}
                </CardContent>

                <CardFooter className="p-3 pt-2 border-t border-border/40 flex flex-col gap-2">
                  {/* Botones de orden táctico */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        disabled={operacion !== null || index === 0}
                        onClick={() => handleSubir(index)}
                        aria-label={`Subir a ${criatura.nombre}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        disabled={operacion !== null || index === equipo.length - 1}
                        onClick={() => handleBajar(index)}
                        aria-label={`Bajar a ${criatura.nombre}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {!esLider && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-[10px] retro rounded-none gap-1 flex-1 sm:flex-initial"
                        disabled={operacion !== null || estaDebilitada}
                        onClick={() => handleDesignarLider(index)}
                        aria-busy={estaOrdenando}
                      >
                        {estaOrdenando ? (
                          <>
                            <Spinner className="h-3 w-3" />
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                            <span>Designar líder</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Transferir al almacén */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-none gap-1.5"
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
                        <Spinner className="h-3.5 w-3.5" />
                        <span>PROCESANDO...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-3.5 w-3.5" />
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
                className="border-2 border-dashed border-border/60 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[260px] bg-muted/10 rounded-none"
                aria-label={`Ranura libre ${numeroRanura} de ${limiteEquipo}`}
              >
                <span className="retro text-[10px] text-muted-foreground uppercase">
                  Ranura libre
                </span>
                <span className="font-mono text-xs text-muted-foreground/70">
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
