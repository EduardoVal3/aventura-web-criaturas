import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ArrowUpFromLine,
  Repeat,
  MapPinOff,
  Users,
  ArrowLeft,
  PackageOpen,
  Swords,
  Shield,
  Zap,
  Heart,
  Crown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Spinner } from "@/components/ui/8bit/spinner";
import HealthBar from "@/components/ui/8bit/health-bar";
import XpBar from "@/components/ui/8bit/xp-bar";
import {
  api,
  type CriaturaAlmacen,
  type CriaturaEquipo,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";

export function PantallaAlmacen() {
  const [almacen, setAlmacen] = useState<CriaturaAlmacen[]>([]);
  const [limiteEquipo, setLimiteEquipo] = useState<number>(6);
  const [enLocalidadSegura, setEnLocalidadSegura] = useState<boolean>(true);
  const [totalEnEquipo, setTotalEnEquipo] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [operacion, setOperacion] = useState<{
    tipo: "transferir" | "intercambiar";
    criaturaId: string;
  } | null>(null);

  // Estado para el modal de intercambio atómico
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [criaturaEntrante, setCriaturaEntrante] = useState<CriaturaAlmacen | null>(null);
  const [equipoParaIntercambio, setEquipoParaIntercambio] = useState<CriaturaEquipo[]>([]);
  const [cargandoEquipoIntercambio, setCargandoEquipoIntercambio] = useState<boolean>(false);
  const [criaturaSalienteId, setCriaturaSalienteId] = useState<string | null>(null);

  const cargarAlmacen = async () => {
    try {
      const respuesta = await api.obtenerAlmacen();
      setAlmacen(respuesta.criaturas);
      setLimiteEquipo(respuesta.limiteEquipo ?? 6);
      setEnLocalidadSegura(respuesta.enLocalidadSegura ?? true);
      setTotalEnEquipo(respuesta.totalEnEquipo ?? 0);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las criaturas del almacén.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlmacen();
  }, []);

  const equipoLleno = totalEnEquipo >= limiteEquipo;

  const handleMoverAEquipo = async (criatura: CriaturaAlmacen) => {
    if (operacion) return;
    if (equipoLleno) {
      toast.warning(`Tu equipo ya cuenta con el límite de ${limiteEquipo} criaturas.`);
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
        haciaEquipo: true,
      });
      reproducirSonido("exito");
      toast.success(respuesta.mensaje || `${criatura.nombre} transferida al equipo activo.`);
      await cargarAlmacen();
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al transferir la criatura al equipo activo.");
      }
    } finally {
      setOperacion(null);
    }
  };

  const handleAbrirIntercambio = async (criatura: CriaturaAlmacen) => {
    if (operacion) return;
    reproducirSonido("seleccionar");
    setCriaturaEntrante(criatura);
    setCriaturaSalienteId(null);
    setModalAbierto(true);
    setCargandoEquipoIntercambio(true);

    try {
      const respEquipo = await api.obtenerEquipo();
      setEquipoParaIntercambio(respEquipo.criaturas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las criaturas del equipo para el intercambio.");
      }
      setModalAbierto(false);
    } finally {
      setCargandoEquipoIntercambio(false);
    }
  };

  const handleConfirmarIntercambio = async () => {
    if (operacion || !criaturaEntrante || !criaturaSalienteId) return;

    try {
      setOperacion({ tipo: "intercambiar", criaturaId: criaturaEntrante.criaturaId });
      const saliente = equipoParaIntercambio.find((c) => c.criaturaId === criaturaSalienteId);
      const eraLider = saliente?.orden === 1;

      const respuesta = await api.transferirCriatura({
        criaturaId: criaturaEntrante.criaturaId,
        haciaEquipo: true,
        intercambiarConId: criaturaSalienteId,
      });

      reproducirSonido("confirmar");

      if (eraLider) {
        toast.success(
          `${respuesta.mensaje} ¡${criaturaEntrante.nombre} es ahora tu líder de combate!`,
        );
      } else {
        toast.success(respuesta.mensaje);
      }

      setModalAbierto(false);
      setCriaturaEntrante(null);
      setCriaturaSalienteId(null);
      await cargarAlmacen();
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al realizar el intercambio.");
      }
    } finally {
      setOperacion(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
      {/* Cabecera y Navegación Rápida */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b-2 border-black/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <h1 className="retro text-sm sm:text-lg text-primary tracking-wide drop-shadow-[2px_2px_0_#000]">
              Almacén de Criaturas
            </h1>
            <Badge
              variant="secondary"
              className="rounded-none font-mono text-[10px] sm:text-xs border-2 border-black shadow-[2px_2px_0_0_#000] bg-card text-foreground px-1.5 sm:px-2 py-0.5"
            >
              {almacen.length} en reserva
            </Badge>
          </div>
          <p className="text-[11px] sm:text-sm text-muted-foreground font-sans leading-snug">
            Depósito seguro de criaturas capturadas que no están en tu equipo activo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2.5 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-[11px] sm:text-xs rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/equipo">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Ver Equipo ({totalEnEquipo}/{limiteEquipo})
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

      {/* Banner de equipo lleno con instrucción de intercambio */}
      {equipoLleno && enLocalidadSegura && (
        <div className="p-2.5 sm:p-3 bg-blue-500/10 border-2 border-black shadow-[2px_2px_0_0_#000] text-blue-400 text-[11px] sm:text-xs font-sans rounded-none flex items-center justify-between gap-2 flex-wrap leading-snug">
          <span>
            Tu equipo activo está completo ({totalEnEquipo}/{limiteEquipo}). Usa el botón <strong>Intercambiar</strong> en cualquier criatura para relevar a un compañero sin liberar espacio previo.
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
      ) : almacen.length === 0 ? (
        <Card font="normal" className="text-center p-6 sm:p-8 border-4 border-black shadow-[6px_6px_0_0_#000] bg-card rounded-none">
          <div className="flex justify-center mb-3 text-muted-foreground">
            <PackageOpen className="h-10 w-10 stroke-1" />
          </div>
          <CardTitle className="retro text-xs sm:text-sm text-muted-foreground mb-2">
            Tu almacén está vacío
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-4 font-sans">
            Explora las sendas y domestica nuevas criaturas con talismanes de captura.
          </p>
          <Button
            asChild
            size="sm"
            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer text-xs mt-2"
          >
            <Link to="/exploracion">
              Ir a Explorar
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {almacen.map((criatura) => {
            const porcentajeHp = Math.round(
              (criatura.hpActual / criatura.hpMaximo) * 100,
            );
            const operacionActiva = operacion?.criaturaId === criatura.criaturaId;

            return (
              <Card
                key={criatura.criaturaId}
                font="normal"
                className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card flex flex-col justify-between rounded-none transition-all"
              >
                <CardHeader font="normal" className="p-2.5 sm:p-3 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground bg-black/40 border border-black px-1.5 py-0.5 shadow-[1px_1px_0_0_#000]">
                      CUSTODIA
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] sm:text-[10px] font-mono font-bold rounded-none border-2 border-black bg-black/50 shadow-[2px_2px_0_0_#000] text-foreground shrink-0 px-1.5 py-0.5"
                    >
                      Nv. {criatura.nivel}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative shrink-0 flex items-center justify-center bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1">
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

                  {/* Estadísticas */}
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
                </CardContent>

                <CardFooter font="normal" className="p-3 sm:p-3.5 pt-3 border-t-2 border-black/40">
                  {equipoLleno ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full h-7 sm:h-8 text-[10px] sm:text-xs rounded-none gap-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={operacion !== null || !enLocalidadSegura}
                      aria-busy={operacionActiva}
                      onClick={() => handleAbrirIntercambio(criatura)}
                    >
                      <Repeat className="h-3.5 w-3.5" />
                      Intercambiar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full h-7 sm:h-8 text-[10px] sm:text-xs rounded-none gap-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={operacion !== null || !enLocalidadSegura}
                      aria-busy={operacionActiva}
                      onClick={() => handleMoverAEquipo(criatura)}
                    >
                      {operacionActiva ? (
                        <>
                          <Spinner className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>PROCESANDO...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                          <span>Mover al equipo</span>
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de intercambio atómico sellado contra overflow */}
      <Dialog
        open={modalAbierto}
        onOpenChange={(abierto) => {
          if (operacion !== null) return;
          setModalAbierto(abierto);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none p-4 sm:p-5 space-y-3.5 bg-card border-4 border-black shadow-[6px_6px_0_0_#000]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="retro text-xs sm:text-sm text-foreground drop-shadow-[1px_1px_0_#000]">
              Elegir relevo
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground leading-snug">
              {criaturaEntrante ? (
                <>
                  <strong className="text-foreground">{criaturaEntrante.nombre}</strong>{" "}
                  ocupará el puesto de la criatura que elijas.
                </>
              ) : (
                "Selecciona la criatura que volverá al almacén."
              )}
            </DialogDescription>
          </DialogHeader>

          {cargandoEquipoIntercambio ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Spinner className="h-6 w-6" />
              <span className="text-xs text-muted-foreground font-sans">
                Consultando equipo activo...
              </span>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Criaturas del equipo para relevar"
              className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1"
            >
              {equipoParaIntercambio.map((comp) => {
                const seleccionada = criaturaSalienteId === comp.criaturaId;
                const esLider = comp.orden === 1;

                return (
                  <button
                    type="button"
                    key={comp.criaturaId}
                    role="radio"
                    aria-checked={seleccionada}
                    onClick={() => {
                      if (operacion) return;
                      reproducirSonido("seleccionar");
                      setCriaturaSalienteId(comp.criaturaId);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 sm:p-2.5 text-left border-2 border-black shadow-[2px_2px_0_0_#000] transition-colors rounded-none ${
                      seleccionada
                        ? "border-primary bg-primary/20 ring-1 ring-primary shadow-[3px_3px_0_0_#000]"
                        : "bg-black/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="relative shrink-0 flex items-center justify-center bg-black/40 border border-black p-0.5">
                      <img
                        src={obtenerImagenCriatura(comp.slug)}
                        alt={comp.nombre}
                        onError={(e) => manejarErrorImagen(e, "criatura")}
                        className="pixelated h-10 w-10 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="retro text-[10px] sm:text-xs text-foreground truncate">
                          {comp.nombre}
                        </span>
                        {esLider && (
                          <Badge
                            variant="default"
                            className="bg-amber-400 text-black font-bold text-[8px] retro rounded-none py-0.5 px-1.5 gap-0.5 border border-black shadow-[1px_1px_0_0_#000]"
                          >
                            <Crown className="h-2.5 w-2.5 fill-current" />
                            LÍDER
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                        <span className="font-bold text-foreground">Nv. {comp.nivel}</span>
                        <span>•</span>
                        <span>
                          {comp.hpActual}/{comp.hpMaximo} HP
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 w-full pt-3 border-t-2 border-black/40">
            <Button
              type="button"
              variant="default"
              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                operacion !== null ||
                !criaturaSalienteId ||
                cargandoEquipoIntercambio
              }
              aria-busy={operacion?.tipo === "intercambiar"}
              onClick={handleConfirmarIntercambio}
            >
              {operacion?.tipo === "intercambiar" ? (
                <>
                  <Spinner className="h-3.5 w-3.5 mr-1" />
                  <span>PROCESANDO...</span>
                </>
              ) : (
                "Confirmar intercambio"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted"
              disabled={operacion !== null}
              onClick={() => {
                if (operacion) return;
                setModalAbierto(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaAlmacen;
