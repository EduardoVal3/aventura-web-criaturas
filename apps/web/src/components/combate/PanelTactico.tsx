import {
  Flame,
  Skull,
  Snowflake,
  Zap,
  ShieldAlert,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/8bit/button";
import { Badge } from "../ui/8bit/badge";
import type { EstadoActivo } from "../../api/ApiJuego";
import {
  bloquesResonancia,
  describirEstado,
  type DescripcionEstado,
} from "../../lib/combate-tactico";

interface BarraResonanciaProps {
  resonancia?: number;
  onDesatarInsignia?: () => void;
  deshabilitado?: boolean;
}

export function BarraResonancia({
  resonancia = 0,
  onDesatarInsignia,
  deshabilitado = false,
}: BarraResonanciaProps) {
  const bloques = bloquesResonancia(resonancia);
  const esCompleta = resonancia >= 100;

  return (
    <div
      className={`p-2 bg-[#090d16] border-2 transition-all duration-300 ${
        esCompleta
          ? "border-amber-400 anim-pulso-resonancia motion-reduce:animate-none bg-amber-500/10 shadow-[2px_2px_0_0_#f59e0b]"
          : "border-black shadow-[2px_2px_0_0_#000]"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-amber-300 retro">
            Resonancia
          </span>
          {esCompleta && (
            <Badge
              variant="outline"
              font="retro"
              className="text-[9px] px-1 py-0 border-black shadow-[1px_1px_0_0_#000] text-amber-300 bg-amber-500/20"
            >
              ¡100 %!
            </Badge>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-200">
          {Math.min(100, Math.floor(resonancia))} %
        </span>
      </div>

      {/* Medidor de 10 Bloques */}
      <div
        role="meter"
        aria-label="Resonancia"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.floor(resonancia))}
        className="grid grid-cols-10 gap-1 h-3 w-full bg-[#121927] p-0.5 border border-black shadow-[inset_1px_1px_0_0_#000]"
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const activo = i < bloques;
          return (
            <div
              key={i}
              className={`h-full transition-all duration-200 ${
                activo
                  ? esCompleta
                    ? "bg-amber-300 shadow-[0_0_4px_#f59e0b]"
                    : "bg-amber-400/90"
                  : "bg-[#090d16]/70 border border-black/40"
              }`}
            />
          );
        })}
      </div>

      {/* Botón Atajo de Movimiento Insignia */}
      {esCompleta && onDesatarInsignia && (
        <div className="pt-2">
          <Button
            size="sm"
            disabled={deshabilitado}
            aria-busy={deshabilitado}
            onClick={onDesatarInsignia}
            className="w-full h-8 text-[11px] font-bold tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black hover:from-amber-400 hover:to-amber-300 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 transition-all"
          >
            <Sparkles className="size-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>Desatar Insignia</span>
          </Button>
        </div>
      )}
    </div>
  );
}

const ICONOS_MAPA = {
  Flame,
  Skull,
  Snowflake,
  Zap,
  ShieldAlert,
  Shield,
};

const ESTILOS_ESTADO: Record<string, string> = {
  QUEMADURA: "bg-red-500/15 text-red-400 border-red-500/40",
  VENENO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  ESCARCHA: "bg-cyan-500/15 text-cyan-400 border-cyan-500/40",
  PARALISIS: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  PETRIFICACION: "bg-stone-500/20 text-stone-300 border-stone-500/40",
  BASTION: "bg-blue-500/15 text-blue-300 border-blue-500/40",
};

interface InsigniasEstadoProps {
  estados?: EstadoActivo[];
}

export function InsigniasEstado({ estados = [] }: InsigniasEstadoProps) {
  if (!estados || estados.length === 0) {
    return null;
  }

  const descripciones: DescripcionEstado[] = estados.map(describirEstado);

  return (
    <div className="space-y-1 pt-1">
      <div className="flex flex-wrap items-center gap-1.5" role="list">
        {descripciones.map((desc, i) => {
          const IconoComp = ICONOS_MAPA[desc.icono] ?? ShieldAlert;
          const estiloColor =
            ESTILOS_ESTADO[desc.codigo] ?? "bg-primary/10 text-primary border-primary/30";

          return (
            <div
              key={`${desc.codigo}-${i}`}
              role="listitem"
              aria-label={desc.descripcion}
              className={`flex items-center gap-1 px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] text-[10px] font-mono font-medium ${estiloColor} transition-all`}
            >
              <IconoComp className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{desc.nombre}</span>
              <span className="text-[9px] opacity-80 shrink-0">({desc.turnos})</span>
            </div>
          );
        })}
      </div>
      {descripciones.length === 1 && (
        <p className="text-[9px] font-mono text-muted-foreground truncate">
          {descripciones[0].descripcion}
        </p>
      )}
    </div>
  );
}
