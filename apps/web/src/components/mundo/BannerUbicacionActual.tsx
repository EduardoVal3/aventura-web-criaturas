import { Link } from "react-router";
import {
  Compass,
  Coins,
  Users,
  Package,
  LogOut,
  ShieldCheck,
  Skull,
  Sparkles,
  Swords,
  Store,
  Scroll,
} from "lucide-react";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import { Progress } from "@/components/ui/8bit/progress";
import type { PersonajeActivo, UbicacionActual } from "@/api";
import {
  obtenerImagenZona,
  manejarErrorImagen,
  sanitizarSlugZona,
  reproducirSonido,
} from "@/lib/assets";
import { formatearRangoFauna } from "@/lib/servicios-hub";
import { cn } from "@/lib/utils";

export interface BannerUbicacionActualProps {
  ubicacion: UbicacionActual;
  personaje: PersonajeActivo | null;
  viajando?: boolean;
  onCerrarSesion?: () => void;
}

export function BannerUbicacionActual({
  ubicacion,
  personaje,
  viajando = false,
  onCerrarSesion,
}: BannerUbicacionActualProps) {
  const slugZona =
    ubicacion.slug || sanitizarSlugZona(ubicacion.nombre || ubicacion.ubicacionId);

  const progreso =
    ubicacion.progresoZona !== undefined
      ? Number(ubicacion.progresoZona)
      : ubicacion.esSegura
        ? 100
        : 0;

  const poderEquipo = ubicacion.poderEquipo ?? {
    nivelMaximoEquipo: 1,
    nivelPromedioEquipo: 1,
    nivelMaximoColeccion: 1,
    criaturasEquipoNv5: 0,
    rangoDomador: "Recluta del Gremio",
  };

  const rangoFaunaTexto = formatearRangoFauna(
    ubicacion.faunaNivelMinimo ?? ubicacion.nivelMinimo,
    ubicacion.faunaNivelMaximo ?? ubicacion.nivelMaximo,
    ubicacion.nivelSugerido,
    ubicacion.esSegura,
  );

  return (
    <div className="relative bg-card border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
      {/* Paisaje y encabezado de la ubicación */}
      <div className="relative w-full min-h-[220px] sm:min-h-[260px] bg-[#090d16] border-b-4 border-black overflow-hidden flex flex-col justify-between">
        <img
          src={obtenerImagenZona(slugZona)}
          onError={(e) => manejarErrorImagen(e, "zona")}
          alt={`Paisaje de ${ubicacion.nombre ?? "Aethelgard"}`}
          className="absolute inset-0 w-full h-full object-cover object-center pixelated filter brightness-95 contrast-105"
        />

        {/* Degradado para contraste de texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/40 pointer-events-none" />

        {/* Badges superiores sobre el paisaje */}
        <div className="relative top-0 left-0 right-0 p-3 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            {ubicacion.esSegura ? (
              <Badge
                variant="outline"
                font="retro"
                className="bg-emerald-950/90 text-emerald-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1.5 py-1 px-2.5 backdrop-blur-xs text-[8px] sm:text-[9px]"
              >
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>ASENTAMIENTO SEGURO</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                font="retro"
                className="bg-red-950/90 text-red-400 border-2 border-black shadow-[2px_2px_0_0_#000] gap-1.5 py-1 px-2.5 backdrop-blur-xs text-[8px] sm:text-[9px]"
              >
                <Skull className="size-3.5 text-red-400" />
                <span>ZONA SILVESTRE</span>
              </Badge>
            )}

            <Badge
              variant="outline"
              font="retro"
              className={cn(
                "border-2 border-black shadow-[2px_2px_0_0_#000] gap-1.5 py-1 px-2.5 backdrop-blur-xs text-[8px] sm:text-[9px]",
                ubicacion.esSegura
                  ? "bg-slate-900/90 text-slate-300"
                  : "bg-amber-950/90 text-amber-300",
              )}
            >
              <Swords className="size-3 text-amber-300" />
              <span>{rangoFaunaTexto}</span>
            </Badge>
          </div>

          {onCerrarSesion && (
            <Button
              variant="outline"
              size="sm"
              font="retro"
              disabled={viajando}
              onClick={onCerrarSesion}
              className={cn(
                "bg-black/80 hover:bg-red-950/80 text-slate-200 hover:text-red-300 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 text-[8px] sm:text-[9px] gap-1.5 cursor-pointer backdrop-blur-xs",
                viajando && "pointer-events-none opacity-50",
              )}
            >
              <LogOut className="size-3.5" />
              <span>SALIR</span>
            </Button>
          )}
        </div>

        {/* Nombre, descripción y cartografía de la ubicación */}
        <div className="relative p-3 z-10 space-y-2 mt-auto">
          <div>
            <div className="inline-block bg-black/70 px-2 py-0.5 border border-black/80 mb-1 backdrop-blur-xs">
              <span className="retro text-[8px] sm:text-[9px] text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-400" />
                Territorio de Aethelgard
              </span>
            </div>
            <h1 className="retro text-base sm:text-xl md:text-2xl text-[#14d1e8] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-shadow-[2px_2px_0_#000] leading-tight break-words">
              <span className="text-amber-400 mr-2">[{ubicacion.ubicacionId}]</span>
              {ubicacion.nombre ?? "Villa Serena"}
            </h1>
            <p className="retro text-[8px] sm:text-[9px] text-slate-200 mt-1 max-w-3xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {ubicacion.descripcion}
            </p>
          </div>

          {/* Barra de progreso de cartografía empotrada */}
          <div className="bg-black/70 border-2 border-black p-2 space-y-1 max-w-xl backdrop-blur-xs">
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] retro">
              <span className="flex items-center gap-1.5 text-slate-200">
                {progreso >= 100 || ubicacion.esSegura ? (
                  <>
                    <Sparkles className="size-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">100 % CARTOGRAFIADA</span>
                  </>
                ) : (
                  <>
                    <Compass className="size-3 text-[#14d1e8]" />
                    <span className="text-[#14d1e8] font-bold">{progreso} % EXPLORADA</span>
                  </>
                )}
              </span>
              <span className="text-slate-400">
                {progreso >= 100 || ubicacion.esSegura
                  ? "Senda dominada"
                  : "Cartografía en curso"}
              </span>
            </div>
            <Progress
              value={progreso}
              className="h-2 rounded-none border border-black bg-slate-950"
            />
          </div>
        </div>
      </div>

      {/* Panel Superior del Explorador: Cajas Retro Táctiles (Nombre, Oro, Equipo y Almacén) */}
      <div className="p-3 sm:p-4 bg-card/95">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Nombre del Explorador y Rango de Domador */}
          <div className="p-2.5 sm:p-3 bg-muted/60 border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="retro text-[8px] sm:text-[9px] uppercase tracking-wider">Explorador</span>
              <Compass className="size-3.5 text-[#14d1e8] shrink-0" />
            </div>
            <div>
              <span
                className="retro text-[9px] sm:text-[10px] text-slate-100 font-bold leading-tight break-words block"
                title={personaje?.nombre ?? "Aventurero"}
              >
                {personaje?.nombre ?? "Aventurero"}
              </span>
              <span className="retro text-[7px] sm:text-[8px] text-amber-300 block mt-0.5">
                {poderEquipo.rangoDomador}
              </span>
            </div>
          </div>

          {/* Poder del Equipo */}
          <div className="p-2.5 sm:p-3 bg-muted/60 border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="retro text-[8px] sm:text-[9px] uppercase tracking-wider">Poder Equipo</span>
              <Swords className="size-3.5 text-[#14d1e8] shrink-0" />
            </div>
            <div>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="retro text-[10px] sm:text-xs font-bold text-[#14d1e8]">
                  Nv. {poderEquipo.nivelMaximoEquipo}
                </span>
                <span className="retro text-[7px] sm:text-[8px] text-slate-400">
                  (Prom. {poderEquipo.nivelPromedioEquipo})
                </span>
              </div>
              <span className="retro text-[7px] sm:text-[8px] text-slate-400 block mt-0.5">
                Mejor colec.: Nv. {poderEquipo.nivelMaximoColeccion}
              </span>
            </div>
          </div>

          {/* Monedas de Oro con Icono Coins */}
          <div className="p-2.5 sm:p-3 bg-muted/60 border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="retro text-[8px] sm:text-[9px] uppercase tracking-wider">Monedas</span>
              <Coins className="size-3.5 text-[#f5b724] shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="retro text-[10px] sm:text-xs font-bold text-[#f5b724]">
                {personaje?.monedas ?? 0}
              </span>
              <span className="retro text-[8px] sm:text-[9px] text-amber-200/90">oro</span>
            </div>
          </div>

          {/* Dotación de Criaturas: Equipo (X/6) y Almacén */}
          <div className="p-2.5 sm:p-3 bg-muted/60 border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="retro text-[8px] sm:text-[9px] uppercase tracking-wider">Dotación</span>
              <Users className="size-3.5 text-emerald-400 shrink-0" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="retro text-[10px] sm:text-xs font-bold text-emerald-400">
                  {personaje?.totalCriaturasEquipo ?? 0}/6
                </span>
                <span className="retro text-[8px] sm:text-[9px] text-slate-300">equipo</span>
              </div>
              <span className="retro text-[7px] sm:text-[8px] text-slate-400 block mt-0.5">
                {personaje?.totalCriaturasAlmacen ?? 0} en almacén
              </span>
            </div>
          </div>
        </div>

        {/* Píldoras de accesos rápidos a servicios del asentamiento */}
        {ubicacion.servicios && ubicacion.servicios.length > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-black/60 flex flex-wrap items-center gap-2">
            <span className="retro text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider mr-1">
              Servicios activos:
            </span>
            {ubicacion.servicios.includes("CURACION") && (
              <Link
                to="/curacion"
                onClick={() => reproducirSonido("click", 0.3)}
                className="retro text-[7px] sm:text-[8px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-black shadow-[2px_2px_0_0_#000] px-2 py-1 flex items-center gap-1 active:translate-y-0.5"
              >
                <Sparkles className="size-2.5 text-emerald-400" />
                <span>Santuario</span>
              </Link>
            )}
            {ubicacion.servicios.includes("TIENDA") && (
              <Link
                to="/tienda"
                onClick={() => reproducirSonido("click", 0.3)}
                className="retro text-[7px] sm:text-[8px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-black shadow-[2px_2px_0_0_#000] px-2 py-1 flex items-center gap-1 active:translate-y-0.5"
              >
                <Store className="size-2.5 text-amber-400" />
                <span>Tienda</span>
              </Link>
            )}
            {ubicacion.servicios.includes("ALMACEN") && (
              <Link
                to="/almacen"
                onClick={() => reproducirSonido("click", 0.3)}
                className="retro text-[7px] sm:text-[8px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-black shadow-[2px_2px_0_0_#000] px-2 py-1 flex items-center gap-1 active:translate-y-0.5"
              >
                <Package className="size-2.5 text-cyan-400" />
                <span>Almacén</span>
              </Link>
            )}
            {ubicacion.servicios.includes("HISTORIAL") && (
              <Link
                to="/historial"
                onClick={() => reproducirSonido("click", 0.3)}
                className="retro text-[7px] sm:text-[8px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-black shadow-[2px_2px_0_0_#000] px-2 py-1 flex items-center gap-1 active:translate-y-0.5"
              >
                <Scroll className="size-2.5 text-slate-400" />
                <span>Bitácora</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BannerUbicacionActual;
