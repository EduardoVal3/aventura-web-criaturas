import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Swords,
  Sparkles,
  Compass,
  ShoppingBag,
  HeartPulse,
  RefreshCw,
  ArrowLeft,
  Search,
  RotateCcw,
  BookOpen,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Input } from "@/components/ui/8bit/input";
import {
  api,
  type EventoHistorial,
  type CategoriaHistorial,
  ErrorApi,
} from "@/api";
import { reproducirSonido } from "@/lib/assets";

import {
  resolverCategoriaEvento,
  formatearFechaAmigable,
  filtrarEventosHistorial,
} from "@/lib/catalogo-historial";

export function PantallaHistorial() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");

  const cargarHistorial = async (esActualizacionManual = false) => {
    try {
      if (esActualizacionManual) {
        setActualizando(true);
      } else {
        setCargando(true);
      }
      const res = await api.obtenerHistorial();
      setEventos(res.eventos || []);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar la bitácora de eventos.");
      }
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Conteo de eventos por cada categoría canónica
  const conteoPorCategoria = useMemo(() => {
    const conteos: Record<string, number> = {
      TODOS: eventos.length,
      COMBATE: 0,
      CAPTURA: 0,
      EXPLORACION: 0,
      TIENDA: 0,
      CURACION: 0,
    };
    for (const ev of eventos) {
      const cat = resolverCategoriaEvento(ev);
      if (conteos[cat] !== undefined) {
        conteos[cat]++;
      }
    }
    return conteos;
  }, [eventos]);

  // Lista de eventos filtrados
  const eventosFiltrados = useMemo(() => {
    return filtrarEventosHistorial(eventos, categoriaActiva, busqueda);
  }, [eventos, categoriaActiva, busqueda]);

  const hayFiltrosActivos = categoriaActiva !== "TODOS" || busqueda.trim().length > 0;

  const limpiarFiltros = () => {
    reproducirSonido("click");
    setCategoriaActiva("TODOS");
    setBusqueda("");
  };

  const renderBadgeCategoria = (categoria: CategoriaHistorial) => {
    switch (categoria) {
      case "COMBATE":
        return (
          <Badge className="border-2 border-black bg-red-950/90 text-red-300 shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            <Swords className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
            <span>COMBATE</span>
          </Badge>
        );
      case "CAPTURA":
        return (
          <Badge className="border-2 border-black bg-purple-950/90 text-purple-300 shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" aria-hidden="true" />
            <span>CAPTURA</span>
          </Badge>
        );
      case "EXPLORACION":
        return (
          <Badge className="border-2 border-black bg-cyan-950/90 text-cyan-300 shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>EXPLORACIÓN</span>
          </Badge>
        );
      case "TIENDA":
        return (
          <Badge className="border-2 border-black bg-amber-950/90 text-amber-300 shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>TIENDA</span>
          </Badge>
        );
      case "CURACION":
        return (
          <Badge className="border-2 border-black bg-emerald-950/90 text-emerald-300 shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>CURACIÓN</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-2 border-black bg-muted text-foreground shadow-[2px_2px_0_0_#000] rounded-none px-2 py-1 flex items-center gap-1.5 retro text-[8px] sm:text-[9px]">
            {categoria}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden space-y-5 sm:space-y-6">
      {/* Cabecera Ceremonial y Navegación Retro */}
      <div className="border-4 border-black bg-bastion shadow-[6px_6px_0_0_#000] p-4 sm:p-5 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-primary tracking-wide retro drop-shadow-[2px_2px_0_#000]">
              BITÁCORA DE EXPEDICIONES
            </h1>
            <Badge
              variant="secondary"
              className="retro text-[8px] sm:text-[9px] flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] bg-background text-foreground py-1 px-2.5 rounded-none"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>{eventos.length} CRÓNICAS REGISTRADAS</span>
            </Badge>
          </div>
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed">
            Registro cronológico transversal de hazañas, capturas, comercio y travesías en Aethelgard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            className="retro text-[8px] sm:text-[9px] min-h-[40px] sm:h-10 px-4 rounded-none flex items-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[3px_3px_0_0_#000] w-full justify-center"
            onClick={() => {
              reproducirSonido("click");
              cargarHistorial(true);
            }}
            disabled={actualizando || cargando}
            aria-busy={actualizando}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actualizando ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{actualizando ? "ACTUALIZANDO..." : "ACTUALIZAR"}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="retro text-[8px] sm:text-[9px] min-h-[40px] sm:h-10 px-4 rounded-none flex items-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[3px_3px_0_0_#000] w-full justify-center"
            onClick={() => {
              reproducirSonido("click");
              navigate("/hub");
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver al Asentamiento</span>
          </Button>
        </div>
      </div>

      {/* Panel de Control: Filtros Rápidos en Cuadrícula Táctica y Buscador de Crónicas */}
      <div className="p-3 sm:p-5 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] rounded-none space-y-4 sm:space-y-5">
        {/* Filtros Rápidos por Categoría Canónica en Rejilla Simétrica (2 cols en móvil, 3 en tablet, 6 en desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full">
          {(
            [
              { id: "TODOS", etiqueta: "TODOS", icono: BookOpen },
              { id: "COMBATE", etiqueta: "COMBATE", icono: Swords },
              { id: "CAPTURA", etiqueta: "CAPTURA", icono: Sparkles },
              { id: "EXPLORACION", etiqueta: "EXPLORACIÓN", icono: Compass },
              { id: "TIENDA", etiqueta: "TIENDA", icono: ShoppingBag },
              { id: "CURACION", etiqueta: "CURACIÓN", icono: HeartPulse },
            ] as const
          ).map((cat) => {
            const Icono = cat.icono;
            const activo = categoriaActiva === cat.id;
            const conteo = conteoPorCategoria[cat.id] ?? 0;

            return (
              <Button
                key={cat.id}
                size="sm"
                variant={activo ? "default" : "outline"}
                className={`retro text-[7px] sm:text-[8px] lg:text-[8.5px] min-h-[40px] sm:h-10 px-1.5 sm:px-2.5 py-1.5 rounded-none flex items-center justify-between w-full border-2 border-black ${
                  activo
                    ? "shadow-[3px_3px_0_0_#000] bg-primary text-primary-foreground font-bold"
                    : "shadow-[2px_2px_0_0_#000] bg-background hover:bg-muted text-foreground"
                } active:translate-y-0.5 active:shadow-none transition-all`}
                onClick={() => {
                  reproducirSonido("click");
                  setCategoriaActiva(cat.id);
                }}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <Icono className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap tracking-tight">{cat.etiqueta}</span>
                </div>
                <span
                  className={`retro text-[6.5px] sm:text-[7.5px] px-1 sm:px-1.5 py-0.5 border border-black shrink-0 ml-0.5 sm:ml-1 ${
                    activo
                      ? "bg-black text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {conteo}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Buscador Textual y Botón Limpiar Filtros con placeholder conciso sin truncamiento */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-3.5 border-t-2 border-black/40">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar crónica..."
              aria-label="Buscar crónica"
              className="retro pl-9 pr-3 text-[8px] sm:text-[9px] placeholder:text-[7.5px] sm:placeholder:text-[8.5px] rounded-none bg-background border-2 border-black shadow-[2px_2px_0_0_#000] h-10 w-full"
            />
          </div>

          {hayFiltrosActivos && (
            <Button
              variant="ghost"
              size="sm"
              className="retro text-[8px] sm:text-[9px] min-h-[40px] sm:h-10 px-4 rounded-none flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground border-2 border-dashed border-black/50 hover:border-black shrink-0 active:translate-y-0.5"
              onClick={limpiarFiltros}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </Button>
          )}
        </div>
      </div>

      {/* Lista Cronológica de Crónicas */}
      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-20 w-full rounded-none border-2 border-black bg-muted/60 animate-pulse shadow-[2px_2px_0_0_#000]"
            />
          ))}
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <Card className="text-center p-6 sm:p-8 bg-bastion border-4 border-black shadow-[6px_6px_0_0_#000] rounded-none space-y-4">
          <CardTitle className="retro text-xs sm:text-sm md:text-base text-muted-foreground">
            No se encontraron crónicas en este filtro
          </CardTitle>
          <CardDescription className="retro text-[8px] sm:text-[9px] leading-relaxed max-w-xl mx-auto text-muted-foreground/80">
            {eventos.length === 0
              ? "Emprende expediciones, desafía criaturas y visita mercaderes para forjar tu historia en Aethelgard."
              : "Prueba seleccionando otra categoría o borrando el término de búsqueda."}
          </CardDescription>
          <div className="flex justify-center pt-3 gap-4 sm:gap-5 flex-wrap">
            {eventos.length === 0 ? (
              <Button
                size="sm"
                className="retro text-[8px] sm:text-[9px] min-h-[40px] sm:h-10 px-5 rounded-none border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                onClick={() => {
                  reproducirSonido("click");
                  navigate("/exploracion");
                }}
              >
                Comenzar Exploración
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="retro text-[8px] sm:text-[9px] min-h-[40px] sm:h-10 px-5 rounded-none border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                onClick={limpiarFiltros}
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventosFiltrados.map((evento) => {
            const categoria = resolverCategoriaEvento(evento);
            const tiempo = formatearFechaAmigable(evento.marcaTiempo);

            return (
              <div
                key={evento.eventoId}
                className="p-3.5 sm:p-4 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:border-black hover:translate-x-0.5 hover:shadow-[5px_5px_0_0_#000] transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full flex-1">
                  {/* Sello de Fecha/Hora e Insignia */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Sello de Fecha y Hora */}
                    <div className="retro text-center shrink-0 w-24 p-1.5 sm:p-2 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none">
                      <span className="retro font-bold text-foreground block text-[9px] sm:text-[10px]">{tiempo.hora}</span>
                      <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block mt-0.5">{tiempo.fecha}</span>
                    </div>

                    {/* Insignia de Categoría */}
                    <div className="shrink-0">
                      {renderBadgeCategoria(categoria)}
                    </div>
                  </div>

                  {/* Descripción de la Crónica y Registro Técnico */}
                  <div className="min-w-0 flex-1 w-full space-y-1.5">
                    <p className="retro text-[9px] sm:text-[10px] text-foreground font-normal leading-relaxed break-words">
                      {evento.descripcion}
                    </p>
                    <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block break-words break-all">
                      Registro técnico: {evento.tipo}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PantallaHistorial;
