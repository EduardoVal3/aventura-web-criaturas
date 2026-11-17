import {
  MapPin,
  CheckCircle2,
  Compass,
  Lock,
  Network,
  ShieldCheck,
  Swords,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/8bit/badge";
import type { NodoMapaTerritorial } from "@/api";
import { cn } from "@/lib/utils";

export interface MinimapaRedTerritorialProps {
  nodos: NodoMapaTerritorial[];
  ubicacionActualId: string;
  compacto?: boolean;
}

interface EscalonTerritorial {
  numero: number;
  titulo: string;
  descripcion: string;
  nodosIds: string[];
}

const ESCALONES_TERRITORIALES: readonly EscalonTerritorial[] = [
  {
    numero: 1,
    titulo: "Valle Inicial",
    descripcion: "Asentamiento inicial",
    nodosIds: ["LOC-01"],
  },
  {
    numero: 2,
    titulo: "Sendas Bajas",
    descripcion: "Fauna Nv. 1-4",
    nodosIds: ["ZON-01", "ZON-02"],
  },
  {
    numero: 3,
    titulo: "Frontera Media",
    descripcion: "Cruce y espesura",
    nodosIds: ["LOC-02", "ZON-03"],
  },
  {
    numero: 4,
    titulo: "Paso Escarpado",
    descripcion: "Fauna Nv. 5-7",
    nodosIds: ["ZON-04"],
  },
  {
    numero: 5,
    titulo: "Norte y Cumbre",
    descripcion: "Bastión y cimas",
    nodosIds: ["LOC-03", "ZON-05", "ZON-06"],
  },
] as const;

export function MinimapaRedTerritorial({
  nodos,
  ubicacionActualId,
  compacto = false,
}: MinimapaRedTerritorialProps) {
  const mapaNodos = new Map(nodos.map((n) => [n.id, n]));

  return (
    <div className="bg-card border-2 border-black shadow-[4px_4px_0_0_#000] p-3 sm:p-4 space-y-3 overflow-x-hidden">
      {/* Encabezado del Minimapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-6 bg-black border border-black flex items-center justify-center shrink-0">
            <Network className="size-3.5 text-[#14d1e8]" />
          </div>
          <div>
            <h3 className="retro text-xs sm:text-sm text-slate-100 tracking-wider">
              RED TERRITORIAL DE AETHELGARD
            </h3>
            <p className="retro text-[7px] sm:text-[8px] text-slate-400">
              Topología de las 9 ubicaciones y progresión de sendas
            </p>
          </div>
        </div>

        {/* Leyenda 8-Bit */}
        <div className="flex flex-wrap items-center gap-1.5 text-[7px] sm:text-[8px] retro">
          <span className="flex items-center gap-1 bg-[#14d1e8]/20 text-[#14d1e8] px-1.5 py-0.5 border border-[#14d1e8]/40">
            <MapPin className="size-2 text-[#14d1e8]" />
            <span>AQUÍ</span>
          </span>
          <span className="flex items-center gap-1 bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 border border-emerald-900">
            <CheckCircle2 className="size-2 text-emerald-400" />
            <span>100%</span>
          </span>
          <span className="flex items-center gap-1 bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 border border-cyan-900">
            <Compass className="size-2 text-cyan-300" />
            <span>EXPLORADA</span>
          </span>
          <span className="flex items-center gap-1 bg-red-950/80 text-red-400 px-1.5 py-0.5 border border-red-900">
            <Lock className="size-2 text-red-400" />
            <span>SELLADA</span>
          </span>
        </div>
      </div>

      {/* Estructura Topológica en 5 Escalones */}
      <div
        className={cn(
          "grid gap-2.5 sm:gap-3",
          compacto
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
        )}
      >
        {ESCALONES_TERRITORIALES.map((esc) => (
          <div
            key={esc.numero}
            className="bg-black/40 border border-black p-2 space-y-2 flex flex-col justify-between"
          >
            {/* Cabecera del escalón */}
            <div className="border-b border-black/60 pb-1 flex items-center justify-between">
              <span className="retro text-[7px] sm:text-[8px] text-amber-400 font-bold uppercase">
                Paso {esc.numero}
              </span>
              <span className="retro text-[6px] sm:text-[7px] text-slate-400">
                {esc.titulo}
              </span>
            </div>

            {/* Nodos contenidos en este escalón */}
            <div className="space-y-2">
              {esc.nodosIds.map((nodoId) => {
                const nodo = mapaNodos.get(nodoId);
                if (!nodo) return null;

                const esActual = nodo.id === ubicacionActualId || nodo.esActual;
                const estaAl100 = nodo.desbloqueada && (nodo.progreso >= 100 || nodo.esSegura);

                return (
                  <div
                    key={nodo.id}
                    className={cn(
                      "p-2 border-2 text-left space-y-1.5 transition-all relative",
                      esActual
                        ? "border-[#14d1e8] bg-[#14d1e8]/15 shadow-[3px_3px_0_0_#000]"
                        : nodo.desbloqueada
                          ? "border-black bg-card/90 shadow-[2px_2px_0_0_#000] hover:border-slate-400"
                          : "border-black/70 bg-black/70 opacity-75 shadow-[2px_2px_0_0_#000]",
                    )}
                  >
                    {/* Código y Estado */}
                    <div className="flex items-start justify-between gap-1 flex-wrap">
                      <span
                        className={cn(
                          "retro text-[8px] sm:text-[9px] font-bold block leading-tight",
                          esActual
                            ? "text-[#14d1e8]"
                            : nodo.desbloqueada
                              ? "text-slate-100"
                              : "text-slate-400",
                        )}
                      >
                        [{nodo.id}]
                      </span>

                      {esActual ? (
                        <Badge
                          variant="outline"
                          font="retro"
                          className="bg-[#14d1e8] text-slate-950 font-bold border border-black text-[6px] sm:text-[7px] py-0 px-1 gap-0.5"
                        >
                          <MapPin className="size-2 text-slate-950" />
                          <span>AQUÍ</span>
                        </Badge>
                      ) : estaAl100 ? (
                        <Badge
                          variant="outline"
                          font="retro"
                          className="bg-emerald-950 text-emerald-400 border border-black text-[6px] sm:text-[7px] py-0 px-1 gap-0.5"
                        >
                          <CheckCircle2 className="size-2 text-emerald-400" />
                          <span>100%</span>
                        </Badge>
                      ) : nodo.desbloqueada ? (
                        <Badge
                          variant="outline"
                          font="retro"
                          className="bg-cyan-950 text-cyan-300 border border-black text-[6px] sm:text-[7px] py-0 px-1 gap-0.5"
                        >
                          <Compass className="size-2 text-cyan-300" />
                          <span>{nodo.progreso}%</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          font="retro"
                          className="bg-red-950 text-red-400 border border-black text-[6px] sm:text-[7px] py-0 px-1 gap-0.5"
                        >
                          <Lock className="size-2 text-red-400" />
                          <span>SELLADA</span>
                        </Badge>
                      )}
                    </div>

                    {/* Nombre de la ubicación */}
                    <div className="retro text-[8px] sm:text-[9px] text-slate-200 font-bold leading-tight line-clamp-1">
                      {nodo.nombre}
                    </div>

                    {/* Subtítulo: Asentamiento o Fauna */}
                    <div className="flex items-center gap-1 text-[7px] sm:text-[8px] text-slate-400 retro">
                      {nodo.esSegura ? (
                        <>
                          <ShieldCheck className="size-2.5 text-emerald-400 shrink-0" />
                          <span>Asentamiento Pacífico</span>
                        </>
                      ) : (
                        <>
                          <Swords className="size-2.5 text-amber-400 shrink-0" />
                          <span>
                            Fauna Nv. {nodo.faunaNivelMinimo ?? 1}-{nodo.faunaNivelMaximo ?? 3}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Conexiones adyacentes */}
                    <div className="pt-1 border-t border-black/40 flex items-center justify-between text-[6px] sm:text-[7px] text-slate-400 retro">
                      <span>Rutas: {nodo.conexionesIds.join(", ")}</span>
                      {nodo.esAdyacente && !esActual && (
                        <span className="text-[#14d1e8] flex items-center gap-0.5 font-bold">
                          <ArrowRight className="size-2 text-[#14d1e8]" />
                          Senda
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MinimapaRedTerritorial;

