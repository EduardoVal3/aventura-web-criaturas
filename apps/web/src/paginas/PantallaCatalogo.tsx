import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Search,
  Shield,
  Swords,
  Zap,
  Scale,
  Sparkles,
  Eye,
  RotateCcw,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Progress } from "@/components/ui/8bit/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/8bit/dialog";
import {
  api,
  type EspecieCatalogo,
  type ArquetipoEspecie,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";

export {
  TRADUCCION_TIPOS_ESPECIE,
  calcularArquetipoCriatura,
  type CriteriosFiltroCatalogo,
  filtrarEspeciesCatalogo,
} from "@/lib/catalogo-historial";
import {
  TRADUCCION_TIPOS_ESPECIE,
  calcularArquetipoCriatura,
  filtrarEspeciesCatalogo,
} from "@/lib/catalogo-historial";

const ARQUETIPOS_FILTRO = [
  { id: "TODOS", etiqueta: "TODOS", icono: BookOpen },
  { id: "ATACANTE", etiqueta: "ATACANTE", icono: Swords },
  { id: "TANQUE", etiqueta: "TANQUE", icono: Shield },
  { id: "VELOZ", etiqueta: "VELOZ", icono: Zap },
  { id: "EQUILIBRADO", etiqueta: "EQUILIBRADO", icono: Scale },
  { id: "ESPECIALES", etiqueta: "ESPECIALES", icono: Sparkles },
] as const;

export function PantallaCatalogo() {
  const navigate = useNavigate();
  const [especies, setEspecies] = useState<EspecieCatalogo[]>([]);
  const [totalEspecies, setTotalEspecies] = useState<number>(0);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [arquetipoFiltro, setArquetipoFiltro] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(true);
  const [especieSeleccionada, setEspecieSeleccionada] = useState<EspecieCatalogo | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  /**
   * Carga el catálogo completo en una ÚNICA petición O(1), erradicando las ráfagas N+1.
   */
  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const res = await api.obtenerEspecies();
      setTotalEspecies(res.total);
      setEspecies(res.especies || []);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las especies del compendio.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  // Filtrado instantáneo en cliente
  const especiesFiltradas = useMemo(() => {
    return filtrarEspeciesCatalogo(especies, {
      tipo: tipoFiltro,
      arquetipo: arquetipoFiltro,
      busqueda,
    });
  }, [especies, tipoFiltro, arquetipoFiltro, busqueda]);

  // Métricas para la barra de avistamiento
  const metricas = useMemo(() => {
    const especiales = especies.filter((e) => e.esEspecial).length;
    const tipos = new Set(especies.map((e) => e.tipo)).size;
    return { especiales, tipos };
  }, [especies]);

  const hayFiltrosActivos = busqueda.trim() !== "" || tipoFiltro !== "todos" || arquetipoFiltro !== "TODOS";

  const abrirInspeccion = (especie: EspecieCatalogo) => {
    reproducirSonido("seleccionar");
    setEspecieSeleccionada(especie);
    setModalAbierto(true);
  };

  const renderIconoArquetipo = (arquetipo: ArquetipoEspecie) => {
    switch (arquetipo) {
      case "TANQUE":
        return <Shield className="w-3 h-3 text-blue-400" aria-hidden="true" />;
      case "ATACANTE":
        return <Swords className="w-3 h-3 text-red-400" aria-hidden="true" />;
      case "VELOZ":
        return <Zap className="w-3 h-3 text-emerald-400" aria-hidden="true" />;
      case "EQUILIBRADO":
      default:
        return <Scale className="w-3 h-3 text-amber-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera y Navegación Retro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide retro">
              COMPENDIO DE CRIATURAS
            </h1>
            <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
              <BookOpen className="w-3 h-3" aria-hidden="true" />
              25 ESPECIES SRD 5.2
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Registro biológico y táctico de las criaturas del mundo de Aethelgard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-none flex items-center gap-1.5"
            onClick={() => {
              reproducirSonido("click");
              cargarCatalogo();
            }}
            disabled={cargando}
            aria-busy={cargando}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>ACTUALIZAR</span>
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
            <span>Asentamiento</span>
          </Button>
        </div>
      </div>

      {/* Barra de Resumen de Avistamiento Biológico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-bastion border-2 border-border/80 text-center font-mono text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Registradas</span>
          <span className="font-bold text-primary">{totalEspecies || especies.length}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">En Vista</span>
          <span className="font-bold text-foreground">{especiesFiltradas.length}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Especiales</span>
          <span className="font-bold text-amber-400">{metricas.especiales}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Tipos Biológicos</span>
          <span className="font-bold text-foreground">{metricas.tipos}</span>
        </div>
      </div>

      {/* Panel de Control: Buscador y Filtros Interactivos */}
      <div className="p-3 sm:p-4 bg-bastion border-2 border-border/80 space-y-3">
        {/* Fila 1: Buscador y Selector de Tipo */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Buscador Interactivo */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar especie por nombre o rasgo..."
              aria-label="Buscar especie"
              className="w-full h-10 pl-9 pr-8 bg-background border-2 border-border text-xs text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:border-primary rounded-none transition-colors"
            />
            {busqueda.trim() !== "" && (
              <button
                type="button"
                aria-label="Borrar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                onClick={() => {
                  reproducirSonido("click");
                  setBusqueda("");
                }}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Selector de los 6 tipos biológicos en español */}
          <div className="w-full sm:w-56 shrink-0 relative">
            <select
              value={tipoFiltro}
              onChange={(e) => {
                reproducirSonido("click");
                setTipoFiltro(e.target.value);
              }}
              aria-label="Filtrar por tipo biológico"
              className="w-full h-10 px-3 pr-8 bg-background border-2 border-border text-xs text-foreground font-sans rounded-none focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value="todos">Todos los tipos</option>
              <option value="beast">Bestia</option>
              <option value="monstrosity">Monstruosidad</option>
              <option value="undead">No-muerto</option>
              <option value="elemental">Elemental</option>
              <option value="construct">Autómata</option>
              <option value="plant">Planta</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Fila 2: Botones rápidos de filtro por Arquetipo y Acción de Limpiar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" aria-hidden="true" />
              Arquetipo:
            </span>
            {ARQUETIPOS_FILTRO.map((item) => {
              const Icono = item.icono;
              const activo = arquetipoFiltro === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`text-[11px] h-7 sm:h-8 px-2 sm:px-2.5 rounded-none font-mono flex items-center gap-1.5 border-2 transition-colors ${
                    activo
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-[2px_2px_0_0_#000]"
                      : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                  }`}
                  onClick={() => {
                    reproducirSonido("click");
                    setArquetipoFiltro(item.id);
                  }}
                >
                  <Icono className="w-3 h-3" aria-hidden="true" />
                  <span>{item.etiqueta}</span>
                </button>
              );
            })}
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              className="h-7 sm:h-8 px-2.5 text-[11px] font-mono text-amber-300 hover:text-amber-200 border border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 rounded-none flex items-center gap-1.5 transition-colors self-end sm:self-auto shrink-0"
              onClick={() => {
                reproducirSonido("click");
                setTipoFiltro("todos");
                setArquetipoFiltro("TODOS");
                setBusqueda("");
              }}
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Criaturas */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-none" />
          ))}
        </div>
      ) : especiesFiltradas.length === 0 ? (
        <Card className="text-center p-8 bg-bastion border-2 rounded-none space-y-3">
          <CardTitle className="text-base text-muted-foreground retro">
            No se encontraron criaturas
          </CardTitle>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-sans">
            No hay ninguna especie en el compendio que coincida con los criterios de búsqueda, tipo biológico o arquetipo seleccionados.
          </p>
          <Button
            size="sm"
            className="rounded-none font-mono text-xs"
            onClick={() => {
              reproducirSonido("click");
              setTipoFiltro("todos");
              setArquetipoFiltro("TODOS");
              setBusqueda("");
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            Restablecer todos los filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {especiesFiltradas.map((especie) => {
            const arquetipo = especie.arquetipo || calcularArquetipoCriatura(especie);
            const tipoEspanol = TRADUCCION_TIPOS_ESPECIE[especie.tipo.toLowerCase()] || especie.tipo;

            return (
              <Card
                key={especie.slug}
                className={`border-2 rounded-none bg-bastion flex flex-col justify-between transition-all duration-200 hover:border-primary/80 ${
                  especie.esEspecial
                    ? "border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                    : "border-border"
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <CardHeader className="p-3 pb-2 space-y-1">
                  {/* Título de la Criatura a ancho completo: sin truncate forzado que corte nombres largos */}
                  <CardTitle className="text-xs sm:text-[13px] font-bold text-foreground leading-snug retro tracking-tight break-words line-clamp-2 min-h-[2rem]">
                    {especie.nombre}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {especie.keyExterna || `srd-2024_${especie.slug}`}
                  </p>

                  {/* Badges de Tipo y Arquetipo limpios sin pseudo-bordes laterales desbordados */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase bg-secondary text-secondary-foreground border border-border rounded-none">
                      {tipoEspanol}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono border border-border bg-background text-muted-foreground rounded-none">
                      {renderIconoArquetipo(arquetipo)}
                      <span>{arquetipo}</span>
                    </span>
                  </div>
                </CardHeader>

                {/* Vitrina Central de la Criatura con Sprite Pixel-Art */}
                <div className="relative w-full h-36 sm:h-40 bg-abismo/90 border-y-2 border-border/70 flex items-center justify-center p-3 overflow-hidden group">
                  <div
                    className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Badge ESPECIAL ubicado como sello flotante en la vitrina para nunca recortarse ni competir con el título */}
                  {especie.esEspecial && (
                    <span className="absolute top-2 right-2 z-10 bg-amber-500/20 text-amber-300 border border-amber-500/80 text-[9px] px-1.5 py-0.5 rounded-none font-mono font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                      <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>ESPECIAL</span>
                    </span>
                  )}

                  <img
                    src={obtenerImagenCriatura(especie.slug)}
                    alt={`Sprite de ${especie.nombre}`}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    className="pixelated h-28 w-28 sm:h-32 sm:w-32 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                    loading="lazy"
                  />
                </div>

                {/* Contenido: Atributos y Acciones */}
                <CardContent className="p-3 pt-2.5 space-y-2.5">
                  {/* Resumen de Atributos Base */}
                  <div className="grid grid-cols-4 gap-1 p-1.5 bg-background border border-border/60 text-center font-mono text-[11px]">
                    <div>
                      <span className="text-[8px] text-muted-foreground block uppercase">HP</span>
                      <span className="font-semibold text-foreground">{especie.hpBase}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground block uppercase">ATQ</span>
                      <span className="font-semibold text-red-400">{especie.ataqueBase}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground block uppercase">DEF</span>
                      <span className="font-semibold text-blue-400">{especie.defensaBase}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground block uppercase">VEL</span>
                      <span className="font-semibold text-emerald-400">{especie.velocidadBase}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono px-0.5 text-muted-foreground">
                    <span>CR: <strong className="text-primary">{especie.challengeRating}</strong></span>
                    <span>Captura: <strong className="text-amber-400">{Math.round(especie.tasaCaptura * 100)}%</strong></span>
                  </div>

                  {/* Botón de Inspección */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs rounded-none flex items-center justify-center gap-1.5 h-8 font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => abrirInspeccion(especie)}
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>INSPECCIONAR FICHA</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Sellado de Inspección Táctica Detallada */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent
          font="normal"
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden rounded-none border-2 border-primary bg-bastion p-0 flex flex-col"
        >
          {especieSeleccionada && (
            <div className="flex flex-col max-h-[85vh] overflow-hidden">
              {/* Cabecera del Modal con Título y Botón Cerrar */}
              <div className="p-3 bg-bastion border-b-2 border-border/80 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xs sm:text-sm font-bold text-primary tracking-wide retro truncate">
                    {especieSeleccionada.nombre}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground font-mono truncate">
                    {especieSeleccionada.keyExterna || `srd-2024_${especieSeleccionada.slug}`}
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar ficha táctica"
                  className="text-muted-foreground hover:text-foreground p-1 transition-colors border border-border/60 hover:bg-muted/40 rounded-none shrink-0"
                  onClick={() => setModalAbierto(false)}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Cuerpo del Modal con Scroll Interno Limpio */}
              <div className="overflow-y-auto p-4 space-y-4 font-sans text-xs flex-1">
                {/* Vitrina Ampliada en Modal */}
                <div className="relative w-full h-36 bg-abismo border-2 border-border/80 flex items-center justify-center p-3 overflow-hidden shrink-0">
                  <div
                    className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"
                    aria-hidden="true"
                  />
                  <img
                    src={obtenerImagenCriatura(especieSeleccionada.slug)}
                    alt={especieSeleccionada.nombre}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    className="pixelated h-28 w-28 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                  />
                  {especieSeleccionada.esEspecial && (
                    <span className="absolute top-2 right-2 bg-amber-500/20 text-amber-300 border border-amber-500/80 text-[9px] px-1.5 py-0.5 rounded-none font-mono font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                      <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>ESPECIAL</span>
                    </span>
                  )}
                </div>

                {/* Fila de Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase font-mono font-semibold bg-secondary text-secondary-foreground border border-border rounded-none">
                    {TRADUCCION_TIPOS_ESPECIE[especieSeleccionada.tipo.toLowerCase()] || especieSeleccionada.tipo}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono border border-border bg-background text-muted-foreground rounded-none">
                    {renderIconoArquetipo(calcularArquetipoCriatura(especieSeleccionada))}
                    <span>{calcularArquetipoCriatura(especieSeleccionada)}</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono border border-border text-muted-foreground rounded-none">
                    CR {especieSeleccionada.challengeRating}
                  </span>
                </div>

                {/* Lore Biológico */}
                {especieSeleccionada.descripcion && (
                  <div className="p-2.5 bg-background border border-border/70 text-xs leading-relaxed text-muted-foreground font-sans">
                    {especieSeleccionada.descripcion}
                  </div>
                )}

                {/* Atributos Base con Barras Comparativas sobre 100 */}
                <div className="p-3 bg-background border border-border/70 space-y-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">
                    Atributos Base (Escala 100)
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>Puntos de Salud (HP)</span>
                        <span className="font-semibold">{especieSeleccionada.hpBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.hpBase} className="h-2 rounded-none" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>Ataque</span>
                        <span className="font-semibold text-red-400">{especieSeleccionada.ataqueBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.ataqueBase} className="h-2 rounded-none" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>Defensa</span>
                        <span className="font-semibold text-blue-400">{especieSeleccionada.defensaBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.defensaBase} className="h-2 rounded-none" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>Velocidad</span>
                        <span className="font-semibold text-emerald-400">{especieSeleccionada.velocidadBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.velocidadBase} className="h-2 rounded-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[10px] font-mono">
                    <div>CR: <strong className="text-primary">{especieSeleccionada.challengeRating}</strong></div>
                    <div>Tasa Captura: <strong className="text-amber-400">{Math.round(especieSeleccionada.tasaCaptura * 100)}%</strong></div>
                  </div>
                </div>

                {/* Lista de Movimientos Conocidos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">
                    Movimientos Conocidos
                  </span>
                  <div className="space-y-1">
                    {(especieSeleccionada.movimientos || []).slice(0, 3).map((mov, i) => (
                      <div
                        key={i}
                        className="p-2 bg-background border border-border/60 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-foreground block font-sans">{mov.nombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {mov.tipoAccion || "Ataque melé"} · {mov.nombreOriginal}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded-none">
                          Pot. {mov.poder}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de Cierre */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-none font-mono"
                  onClick={() => setModalAbierto(false)}
                >
                  Cerrar Ficha Táctica
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nota legal / Atribución exigida por CC BY 4.0 */}
      <footer className="p-3 bg-bastion border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Atribución SRD 5.2 / Open5e:</strong> Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
        </p>
      </footer>
    </div>
  );
}

export default PantallaCatalogo;
