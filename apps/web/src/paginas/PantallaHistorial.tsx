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

export {
  resolverCategoriaEvento,
  formatearFechaAmigable,
  filtrarEventosHistorial,
} from "@/lib/catalogo-historial";
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
          <Badge className="border-red-500/60 bg-red-500/15 text-red-300 text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono">
            <Swords className="w-3 h-3" aria-hidden="true" />
            <span>COMBATE</span>
          </Badge>
        );
      case "CAPTURA":
        return (
          <Badge className="border-purple-500/60 bg-purple-500/15 text-purple-300 text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>CAPTURA</span>
          </Badge>
        );
      case "EXPLORACION":
        return (
          <Badge className="border-cyan-500/60 bg-cyan-500/15 text-cyan-300 text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono">
            <Compass className="w-3 h-3" aria-hidden="true" />
            <span>EXPLORACIÓN</span>
          </Badge>
        );
      case "TIENDA":
        return (
          <Badge className="border-amber-500/60 bg-amber-500/15 text-amber-300 text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono">
            <ShoppingBag className="w-3 h-3" aria-hidden="true" />
            <span>TIENDA</span>
          </Badge>
        );
      case "CURACION":
        return (
          <Badge className="border-emerald-500/60 bg-emerald-500/15 text-emerald-300 text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono">
            <HeartPulse className="w-3 h-3" aria-hidden="true" />
            <span>CURACIÓN</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-none font-mono">
            {categoria}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera y Navegación Retro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide retro">
              BITÁCORA DE EXPEDICIONES
            </h1>
            <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
              <BookOpen className="w-3 h-3" aria-hidden="true" />
              {eventos.length} CRÓNICAS REGISTRADAS
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Registro cronológico transversal de hazañas, capturas, comercio y travesías en Aethelgard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-none flex items-center gap-1.5"
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
            className="text-xs rounded-none flex items-center gap-1.5"
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

      {/* Panel de Control: Filtros Rápidos y Buscador de Crónicas */}
      <div className="p-3 bg-bastion border-2 border-border/80 space-y-3">
        {/* Filtros Rápidos por Categoría Canónica */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
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
                className="text-[11px] h-8 px-2.5 rounded-none flex items-center gap-1.5 font-mono"
                onClick={() => {
                  reproducirSonido("click");
                  setCategoriaActiva(cat.id);
                }}
              >
                <Icono className="w-3 h-3" aria-hidden="true" />
                <span>{cat.etiqueta}</span>
                <span className={`text-[10px] px-1 rounded ${activo ? "bg-background/30 text-foreground" : "bg-muted text-muted-foreground"}`}>
                  {conteo}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Buscador Textual y Botón Limpiar Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar crónica por palabra clave..."
              aria-label="Buscar crónica"
              className="pl-8 text-xs rounded-none bg-background h-9"
            />
          </div>

          {hayFiltrosActivos && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs rounded-none flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
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
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <Card className="text-center p-8 bg-bastion border-2 rounded-none">
          <CardTitle className="text-base text-muted-foreground mb-2">
            No se encontraron crónicas en este filtro
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            {eventos.length === 0
              ? "Emprende expediciones, desafía criaturas y visita mercaderes para forjar tu historia en Aethelgard."
              : "Prueba seleccionando otra categoría o borrando el término de búsqueda."}
          </CardDescription>
          {eventos.length === 0 ? (
            <Button
              size="sm"
              className="rounded-none"
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
              className="rounded-none"
              onClick={limpiarFiltros}
            >
              Restablecer filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2.5">
          {eventosFiltrados.map((evento) => {
            const categoria = resolverCategoriaEvento(evento);
            const tiempo = formatearFechaAmigable(evento.marcaTiempo);

            return (
              <div
                key={evento.eventoId}
                className="p-3 bg-bastion border-2 border-border/70 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-border transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Sello de Fecha y Hora */}
                  <div className="font-mono text-center shrink-0 w-24 p-1.5 bg-background border border-border/50 text-[11px]">
                    <span className="font-bold text-foreground block text-xs">{tiempo.hora}</span>
                    <span className="text-[9px] text-muted-foreground block">{tiempo.fecha}</span>
                  </div>

                  {/* Insignia de Categoría */}
                  <div className="shrink-0">
                    {renderBadgeCategoria(categoria)}
                  </div>

                  {/* Descripción de la Crónica */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-foreground font-sans font-medium leading-snug">
                      {evento.descripcion}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block truncate">
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
