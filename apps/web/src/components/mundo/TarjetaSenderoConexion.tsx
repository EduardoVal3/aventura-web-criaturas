import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Swords,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Flame,
  Droplets,
  Leaf,
  Moon,
  Sun,
  Shield,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
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
import type { ConexionUbicacion } from "@/api";
import { reproducirSonido } from "@/lib/assets";
import {
  formatearRangoFauna,
  evaluarRiesgoFauna,
  type EvaluacionRiesgoFauna,
} from "@/lib/servicios-hub";
import { cn } from "@/lib/utils";

export interface TarjetaSenderoConexionProps {
  conexion: ConexionUbicacion;
  nivelMaximoEquipo?: number;
  viajando?: boolean;
  desbloqueandoId?: string | null;
  onViajar: (conexion: ConexionUbicacion) => Promise<void>;
  onDesbloquear: (zonaId: string) => Promise<void>;
}

function renderIconoElemento(elemento?: string) {
  switch (elemento?.toLowerCase()) {
    case "fuego":
      return <Flame className="size-2.5 text-amber-500 shrink-0" />;
    case "agua":
      return <Droplets className="size-2.5 text-blue-400 shrink-0" />;
    case "natura":
      return <Leaf className="size-2.5 text-emerald-400 shrink-0" />;
    case "sombra":
      return <Moon className="size-2.5 text-purple-400 shrink-0" />;
    case "luz":
      return <Sun className="size-2.5 text-yellow-300 shrink-0" />;
    default:
      return <Shield className="size-2.5 text-slate-300 shrink-0" />;
  }
}

function traducirElemento(elemento?: string): string {
  switch (elemento?.toLowerCase()) {
    case "fuego":
      return "Fuego";
    case "agua":
      return "Agua";
    case "natura":
      return "Natura";
    case "sombra":
      return "Sombra";
    case "luz":
      return "Luz";
    default:
      return "Físico";
  }
}

export function TarjetaSenderoConexion({
  conexion,
  nivelMaximoEquipo = 1,
  viajando = false,
  desbloqueandoId = null,
  onViajar,
  onDesbloquear,
}: TarjetaSenderoConexionProps) {
  const esLocalidad = conexion.tipoDestino === "LOCALIDAD" || conexion.esSegura === true;
  const rangoFauna = formatearRangoFauna(
    conexion.faunaNivelMinimo,
    conexion.faunaNivelMaximo,
    conexion.nivelSugerido,
    conexion.esSegura,
  );

  const riesgo: EvaluacionRiesgoFauna = esLocalidad
    ? { codigo: "PACIFICO", etiqueta: "ASENTAMIENTO SEGURO" }
    : evaluarRiesgoFauna(
        nivelMaximoEquipo,
        conexion.faunaNivelMinimo,
        conexion.faunaNivelMaximo,
      );

  const estaDesbloqueando = desbloqueandoId === conexion.ubicacionDestinoId;

  return (
    <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] p-4 flex flex-col justify-between gap-3.5 transition-all hover:border-[#14d1e8]/80">
      <div className="space-y-3">
        {/* Encabezado: Código y Nombre + Badges de tipo y estado */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="retro text-[10px] sm:text-xs font-bold text-slate-100 block leading-tight break-words">
              Hacia <span className="text-amber-400">[{conexion.ubicacionDestinoId}]</span> {conexion.nombre}
            </span>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {esLocalidad ? (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-emerald-950/80 text-emerald-400 border border-black text-[7px] sm:text-[8px] py-0.5 px-1.5 gap-1"
                >
                  <ShieldCheck className="size-2.5 text-emerald-400" />
                  <span>ASENTAMIENTO</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-slate-900/80 text-slate-300 border border-black text-[7px] sm:text-[8px] py-0.5 px-1.5 gap-1"
                >
                  <Swords className="size-2.5 text-amber-400" />
                  <span>ZONA SALVAJE</span>
                </Badge>
              )}

              {/* Chip comparativo de riesgo */}
              <Badge
                variant="outline"
                font="retro"
                className={cn(
                  "border border-black text-[7px] sm:text-[8px] py-0.5 px-1.5",
                  riesgo.codigo === "CONTROLADO" && "bg-emerald-950/80 text-emerald-300",
                  riesgo.codigo === "EQUILIBRADO" && "bg-cyan-950/80 text-cyan-300",
                  riesgo.codigo === "PELIGROSO" && "bg-red-950/80 text-red-300",
                  riesgo.codigo === "PACIFICO" && "bg-slate-950 text-slate-300",
                )}
              >
                {riesgo.etiqueta}
              </Badge>
            </div>
          </div>

          {/* Insignia de estado de ruta */}
          {conexion.estaBloqueada ? (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge
                variant="outline"
                font="retro"
                className="bg-red-950/90 text-red-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 text-[8px] sm:text-[9px] py-1 px-2"
              >
                <Lock className="size-3 text-red-400" />
                <span>BLOQUEADA</span>
              </Badge>
              {conexion.cumpleRequisito && (
                <Badge
                  variant="outline"
                  font="retro"
                  className="bg-amber-950/90 text-amber-300 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 text-[7px] sm:text-[8px] py-0.5 px-1.5"
                >
                  <Sparkles className="size-2.5 text-amber-300" />
                  <span>LISTA PARA DESBLOQUEAR</span>
                </Badge>
              )}
            </div>
          ) : (
            <Badge
              variant="outline"
              font="retro"
              className="bg-emerald-950/90 text-emerald-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1 text-[8px] sm:text-[9px] py-1 px-2 shrink-0"
            >
              <ArrowRight className="size-3 text-emerald-400" />
              <span>ACCESIBLE</span>
            </Badge>
          )}
        </div>

        {/* Indicador Semántico de Fauna */}
        <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-slate-300 retro">
          <Compass className="size-3.5 text-[#14d1e8] shrink-0" />
          <span className="leading-tight">{rangoFauna}</span>
        </div>

        {/* Previa de Hábitat (Fauna Autóctona) */}
        {conexion.especiesHabitantes && conexion.especiesHabitantes.length > 0 && (
          <div className="bg-black/50 border border-black p-2 space-y-1.5">
            <span className="retro text-[7px] sm:text-[8px] text-amber-400 uppercase tracking-widest block">
              HÁBITAT Y FAUNA AVISTADA ({conexion.especiesHabitantes.length} especies)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {conexion.especiesHabitantes.map((esp) => (
                <div
                  key={esp.slug ?? esp.nombre}
                  className="bg-[#1a2332] border border-black px-1.5 py-0.5 flex items-center gap-1 text-[7px] sm:text-[8px] retro"
                  title={`${esp.nombre} · Elemento ${traducirElemento(esp.elemento)} · Tipo ${esp.tipo}`}
                >
                  {renderIconoElemento(esp.elemento)}
                  <span className="text-slate-200">{esp.nombre}</span>
                  <span className="text-slate-400">({traducirElemento(esp.elemento)})</span>
                  {esp.esLegendaria && (
                    <span title="Legendaria">
                      <Crown className="size-2.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                  {esp.esEspecial && !esp.esLegendaria && (
                    <span title="Especial">
                      <Sparkles className="size-2.5 text-amber-300 shrink-0" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Táctico de Desbloqueo (Para rutas bloqueadas) */}
        {conexion.estaBloqueada && (
          <div className="border-2 border-black bg-black/60 p-2.5 space-y-2 mt-1">
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] retro">
              <span className="flex items-center gap-1 text-slate-300">
                {conexion.cumpleRequisito ? (
                  <Sparkles className="size-3 text-amber-400 shrink-0" />
                ) : (
                  <Lock className="size-3 text-red-400 shrink-0" />
                )}
                <span className="font-bold">CHECKLIST DE DESBLOQUEO</span>
              </span>
              <span
                className={
                  conexion.cumpleRequisito
                    ? "text-amber-400 font-bold"
                    : "text-slate-300"
                }
              >
                {conexion.progresoActual ?? 0}% / {conexion.progresoObjetivo ?? 100}%
              </span>
            </div>

            <Progress
              value={conexion.progresoActual ?? 0}
              className="h-2 rounded-none border border-black bg-slate-950"
            />

            {/* Ítems estructurados del checklist */}
            <div className="space-y-1.5 pt-1 border-t border-black/40">
              {conexion.requisitoCartografia && (
                <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro leading-relaxed">
                  {conexion.requisitoCartografia.completada ? (
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      conexion.requisitoCartografia.completada
                        ? "text-emerald-300"
                        : "text-slate-300"
                    }
                  >
                    Cartografía previa: [{conexion.requisitoCartografia.zonaId}] {conexion.requisitoCartografia.nombre} al 100% (Actual: {conexion.requisitoCartografia.progresoActual}%)
                  </span>
                </div>
              )}

              {conexion.requisitoNivelEquipo && (
                <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro leading-relaxed">
                  {conexion.requisitoNivelEquipo.cumplido ? (
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      conexion.requisitoNivelEquipo.cumplido
                        ? "text-emerald-300"
                        : "text-slate-300"
                    }
                  >
                    {conexion.requisitoNivelEquipo.cantidadCriaturas > 1 ? (
                      <>
                        Poder de equipo: Requiere {conexion.requisitoNivelEquipo.cantidadCriaturas} criaturas en equipo de Nivel {conexion.requisitoNivelEquipo.nivelRequerido}+ (Tienes: {conexion.requisitoNivelEquipo.cantidadActual ?? 0}/{conexion.requisitoNivelEquipo.cantidadCriaturas} · Mejor: Nivel {conexion.requisitoNivelEquipo.nivelMaximoActual})
                      </>
                    ) : (
                      <>
                        Poder de equipo: Requiere al menos 1 criatura de Nivel {conexion.requisitoNivelEquipo.nivelRequerido}+ (Tu mejor criatura: Nivel {conexion.requisitoNivelEquipo.nivelMaximoActual})
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Texto de respaldo si no hay desglose estructurado */}
              {!conexion.requisitoCartografia && !conexion.requisitoNivelEquipo && (
                <p className="retro text-[8px] sm:text-[9px] text-slate-300 leading-relaxed">
                  {conexion.detalleProgreso ?? conexion.requisito}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botonera de Acción y Modales Sellados */}
      <div className="border-t-2 border-black pt-3 mt-3">
        {conexion.estaBloqueada ? (
          <div className="space-y-2">
            {/* Si ya cumple requisitos, permite desbloqueo directo */}
            {conexion.cumpleRequisito ? (
              <Button
                onClick={() => onDesbloquear(conexion.ubicacionDestinoId)}
                disabled={Boolean(desbloqueandoId) || viajando}
                aria-busy={estaDesbloqueando}
                font="retro"
                className="w-full text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 gap-1.5 cursor-pointer py-2.5"
              >
                {estaDesbloqueando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>DESBLOQUEANDO...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>DESBLOQUEAR SENDA</span>
                  </>
                )}
              </Button>
            ) : null}

            {/* Modal de Requisito de Acceso / Inspección detallada */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  font="retro"
                  disabled={viajando || Boolean(desbloqueandoId)}
                  onClick={() => reproducirSonido("click", 0.3)}
                  className={cn(
                    "w-full text-[10px] border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 gap-1.5 cursor-pointer",
                    conexion.cumpleRequisito
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-red-400 hover:bg-red-500/10",
                    viajando && "pointer-events-none opacity-50",
                  )}
                >
                  <Lock className="size-3 text-red-400 shrink-0" />
                  <span>REQUISITO DE ACCESO</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md !max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100">
                <AlertDialogHeader className="!flex !flex-col !w-full !text-left !items-stretch space-y-3">
                  <div className="w-full flex items-center gap-2 border-b-2 border-black pb-2 text-red-400">
                    <Lock className="size-4 shrink-0 text-red-400" />
                    <AlertDialogTitle className="retro text-xs sm:text-sm text-red-400 tracking-wider">
                      RUTA RESTRINGIDA
                    </AlertDialogTitle>
                  </div>

                  {/* Ficha Interior de Destino */}
                  <div className="border-2 border-black bg-black/60 p-3 space-y-1.5 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] w-full">
                    <div className="flex items-center gap-2">
                      <Lock className="size-3.5 text-red-400 shrink-0" />
                      <span className="retro text-[9px] sm:text-[10px] text-red-400 font-bold leading-tight break-words">
                        [{conexion.ubicacionDestinoId}] {conexion.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 retro text-[8px] sm:text-[9px]">
                      <Compass className="size-3 text-[#14d1e8] shrink-0" />
                      <span>{rangoFauna}</span>
                    </div>

                    <div className="pt-1.5 space-y-1 border-t border-black/40">
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] retro">
                        <span className="text-slate-300">ESTADO DEL REQUISITO</span>
                        <span
                          className={
                            conexion.cumpleRequisito
                              ? "text-amber-400 font-bold"
                              : "text-slate-300"
                          }
                        >
                          {conexion.progresoActual ?? 0}% / {conexion.progresoObjetivo ?? 100}%
                        </span>
                      </div>
                      <Progress
                        value={conexion.progresoActual ?? 0}
                        className="h-2 rounded-none border border-black"
                      />
                    </div>
                  </div>

                  {/* Checklist en modal */}
                  <div className="space-y-1.5 text-left w-full">
                    {conexion.requisitoCartografia && (
                      <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro">
                        {conexion.requisitoCartografia.completada ? (
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            conexion.requisitoCartografia.completada
                              ? "text-emerald-300"
                              : "text-slate-300"
                          }
                        >
                          Cartografía [{conexion.requisitoCartografia.zonaId}] al 100% ({conexion.requisitoCartografia.progresoActual}%)
                        </span>
                      </div>
                    )}
                    {conexion.requisitoNivelEquipo && (
                      <div className="flex items-start gap-1.5 text-[8px] sm:text-[9px] retro">
                        {conexion.requisitoNivelEquipo.cumplido ? (
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            conexion.requisitoNivelEquipo.cumplido
                              ? "text-emerald-300"
                              : "text-slate-300"
                          }
                        >
                          Poder de equipo Nv.{conexion.requisitoNivelEquipo.nivelRequerido}+ ({conexion.requisitoNivelEquipo.cantidadActual ?? 0}/{conexion.requisitoNivelEquipo.cantidadCriaturas})
                        </span>
                      </div>
                    )}
                  </div>

                  <AlertDialogDescription className="w-full retro text-[9px] sm:text-[10px] leading-relaxed text-slate-200 text-left">
                    {conexion.detalleProgreso ??
                      conexion.requisito ??
                      "Esta senda requiere mayor experiencia o cumplir misiones previas con el gremio."}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 w-full mt-4 !m-0 !p-0 !bg-transparent !border-0 pt-4 border-t-2 border-black/60">
                  <AlertDialogCancel
                    onClick={() => reproducirSonido("click", 0.3)}
                    className="retro !bg-[#1a2332] hover:!bg-[#232d3f] !text-slate-200 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none text-[10px] py-2.5 px-5 cursor-pointer w-full sm:w-auto text-center"
                  >
                    CERRAR
                  </AlertDialogCancel>
                  <Button
                    onClick={() => onDesbloquear(conexion.ubicacionDestinoId)}
                    disabled={Boolean(desbloqueandoId) || viajando || conexion.cumpleRequisito === false}
                    aria-busy={estaDesbloqueando}
                    font="retro"
                    className={cn(
                      "text-[10px] py-2.5 px-4 font-bold border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer w-full sm:w-auto gap-1.5",
                      conexion.cumpleRequisito
                        ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60",
                    )}
                  >
                    {estaDesbloqueando ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>DESBLOQUEANDO...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" />
                        <span>DESBLOQUEAR SENDA</span>
                      </>
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                font="retro"
                disabled={viajando}
                aria-busy={viajando}
                onClick={() => reproducirSonido("click", 0.3)}
                className="w-full text-[10px] bg-[#14d1e8] hover:bg-[#14d1e8]/90 text-slate-950 font-bold border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 gap-1.5 cursor-pointer py-2.5"
              >
                {viajando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>VIAJANDO...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="size-3.5" />
                    <span>VIAJAR A ESTA RUTA</span>
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md !max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-bastion p-4 sm:p-5 overflow-hidden text-slate-100">
              <AlertDialogHeader className="!flex !flex-col !w-full !text-left !items-stretch space-y-3">
                <div className="w-full flex items-center gap-2 border-b-2 border-black pb-2 text-[#14d1e8]">
                  <Compass className="size-4 text-[#14d1e8] shrink-0" />
                  <AlertDialogTitle className="retro text-xs sm:text-sm text-[#14d1e8] tracking-wider">
                    CONFIRMAR VIAJE
                  </AlertDialogTitle>
                </div>

                {/* Ficha Interior de Destino */}
                <div className="border-2 border-black bg-black/60 p-3 space-y-1.5 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] w-full">
                  <div className="flex items-center gap-2">
                    <Compass className="size-3.5 text-[#14d1e8] shrink-0" />
                    <span className="retro text-[9px] sm:text-[10px] text-[#14d1e8] font-bold leading-tight break-words">
                      [{conexion.ubicacionDestinoId}] {conexion.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 retro text-[8px] sm:text-[9px]">
                    <ArrowRight className="size-3 text-emerald-400 shrink-0" />
                    <span>{rangoFauna}</span>
                  </div>
                </div>

                <AlertDialogDescription className="w-full retro text-[9px] sm:text-[10px] leading-relaxed text-slate-200 text-left">
                  ¿Deseas emprender camino hacia las tierras de este sendero? Prepárate para los peligros del viaje.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 w-full mt-4 !m-0 !p-0 !bg-transparent !border-0 pt-4 border-t-2 border-black/60">
                <AlertDialogCancel
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="retro !bg-[#1a2332] hover:!bg-[#232d3f] !text-slate-200 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 px-4 text-[10px] w-full sm:w-auto shrink-0 cursor-pointer text-center"
                >
                  PERMANECER
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={viajando}
                  onClick={() => onViajar(conexion)}
                  className="retro !bg-[#14d1e8] hover:!bg-[#14d1e8]/90 !text-black font-bold border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none py-2.5 px-4 text-[10px] w-full sm:w-auto shrink-0 cursor-pointer text-center"
                >
                  {viajando ? "VIAJANDO..." : "EMPRENDER CAMINO"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default TarjetaSenderoConexion;
