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
  Crown,
  MapPin,
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
  TRADUCCION_ELEMENTOS,
  calcularArquetipoCriatura,
  calcularPresupuestoCriatura,
  resolverRarezaEspecie,
  ordenarEspeciesCatalogo,
  type CriterioOrdenCatalogo,
  type CriteriosFiltroCatalogo,
  filtrarEspeciesCatalogo,
  agruparEspeciesPorZona,
} from "@/lib/catalogo-historial";
import {
  TRADUCCION_TIPOS_ESPECIE,
  TRADUCCION_ELEMENTOS,
  calcularArquetipoCriatura,
  calcularPresupuestoCriatura,
  resolverRarezaEspecie,
  ordenarEspeciesCatalogo,
  type CriterioOrdenCatalogo,
  filtrarEspeciesCatalogo,
  agruparEspeciesPorZona,
} from "@/lib/catalogo-historial";

const ARQUETIPOS_FILTRO = [
  { id: "TODOS", etiqueta: "TODOS", icono: BookOpen },
  { id: "ATACANTE", etiqueta: "ATACANTE", icono: Swords },
  { id: "TANQUE", etiqueta: "TANQUE", icono: Shield },
  { id: "VELOZ", etiqueta: "VELOZ", icono: Zap },
  { id: "EQUILIBRADO", etiqueta: "EQUILIBRADO", icono: Scale },
  { id: "ESPECIALES", etiqueta: "ESPECIALES", icono: Sparkles },
  { id: "LEGENDARIAS", etiqueta: "LEGENDARIAS", icono: Crown },
] as const;

export function PantallaCatalogo() {
  const navigate = useNavigate();
  const [especies, setEspecies] = useState<EspecieCatalogo[]>([]);
  const [totalEspecies, setTotalEspecies] = useState<number>(0);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [arquetipoFiltro, setArquetipoFiltro] = useState<string>("TODOS");
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrdenCatalogo>("ZONA_ASC");
  const [busqueda, setBusqueda] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(true);
  const [especieSeleccionada, setEspecieSeleccionada] = useState<EspecieCatalogo | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  const obtenerBadgeRareza = (esp: EspecieCatalogo) => {
    const info = resolverRarezaEspecie(esp);

    let icono = BookOpen;
    let estilo = "bg-secondary text-secondary-foreground border-black shadow-[1px_1px_0_0_#000]";
    if (info.codigo === "LEGENDARIA") {
      icono = Crown;
      estilo = "bg-amber-400/25 text-amber-300 border-black shadow-[1px_1px_0_0_#000]";
    } else if (info.codigo === "ESPECIAL") {
      icono = Sparkles;
      estilo = "bg-purple-500/25 text-purple-300 border-black shadow-[1px_1px_0_0_#000]";
    } else if (info.codigo === "RARA") {
      icono = Zap;
      estilo = "bg-blue-500/25 text-blue-300 border-black shadow-[1px_1px_0_0_#000]";
    } else if (info.codigo === "FRECUENTE") {
      icono = Shield;
      estilo = "bg-emerald-500/25 text-emerald-300 border-black shadow-[1px_1px_0_0_#000]";
    }

    return {
      rareza: info.codigo,
      porcentaje: info.peso,
      texto: info.etiqueta,
      icono,
      estilo,
    };
  };

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

  // Filtrado reactivo en cliente con complejidad lineal sobre la memoria local
  const especiesFiltradas = useMemo(() => {
    return filtrarEspeciesCatalogo(especies, {
      tipo: tipoFiltro,
      arquetipo: arquetipoFiltro,
      busqueda,
    });
  }, [especies, tipoFiltro, arquetipoFiltro, busqueda]);

  // Ordenamiento monótono jerárquico (Subfase 10m)
  const especiesOrdenadas = useMemo(() => {
    return ordenarEspeciesCatalogo(especiesFiltradas, criterioOrden);
  }, [especiesFiltradas, criterioOrden]);

  // Agrupamiento por hábitat de zona (Subfase 10l / 10m)
  const gruposPorZona = useMemo(() => {
    return agruparEspeciesPorZona(especiesOrdenadas, criterioOrden);
  }, [especiesOrdenadas, criterioOrden]);

  // Métricas para la barra de avistamiento
  const metricas = useMemo(() => {
    const especiales = especies.filter((e) => e.esEspecial).length;
    const legendarias = especies.filter((e) => e.esLegendaria).length;
    const tipos = new Set(especies.map((e) => e.tipo)).size;
    return { especiales, legendarias, tipos };
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
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-6 overflow-x-hidden">
      {/* Cabecera y Navegación Retro con bordes brutalistas y tipografía integral */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b-2 border-black">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="retro text-lg sm:text-xl font-bold text-primary tracking-wide drop-shadow-[2px_2px_0_#000]">
              COMPENDIO DE CRIATURAS
            </h1>
            <Badge
              variant="secondary"
              className="retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none flex items-center gap-1.5 px-2 py-0.5"
            >
              <BookOpen className="w-3 h-3 text-primary" aria-hidden="true" />
              <span>30 ESPECIES SRD 5.2</span>
            </Badge>
          </div>
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
            Registro biológico y táctico de las criaturas del mundo de Aethelgard.
          </p>
        </div>

        {/* Botones de acción con separación amplia y desahogada entre uno y otro (gap-4 sm:gap-5) para evitar que los bordes pixelados se toquen */}
        <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center gap-1.5 h-8 px-3 cursor-pointer"
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
            className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center gap-1.5 h-8 px-3 cursor-pointer"
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

      {/* Barra de Resumen de Avistamiento Biológico con Rejilla Responsiva */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] text-center retro text-[8px] sm:text-[9px]">
        <div className="p-1.5 bg-background border border-black/60 shadow-[1px_1px_0_0_#000]">
          <span className="text-[7px] sm:text-[8px] text-muted-foreground block uppercase mb-0.5">Registradas</span>
          <span className="font-bold text-primary text-[10px] sm:text-xs">{totalEspecies || especies.length}</span>
        </div>
        <div className="p-1.5 bg-background border border-black/60 shadow-[1px_1px_0_0_#000]">
          <span className="text-[7px] sm:text-[8px] text-muted-foreground block uppercase mb-0.5">En Vista</span>
          <span className="font-bold text-foreground text-[10px] sm:text-xs">{especiesFiltradas.length}</span>
        </div>
        <div className="p-1.5 bg-background border border-black/60 shadow-[1px_1px_0_0_#000]">
          <span className="text-[7px] sm:text-[8px] text-muted-foreground block uppercase mb-0.5">Legendarias</span>
          <span className="font-bold text-amber-300 text-[10px] sm:text-xs flex items-center justify-center gap-1">
            <Crown className="w-3 h-3 text-amber-400 inline" aria-hidden="true" />
            <span>{metricas.legendarias}</span>
          </span>
        </div>
        <div className="p-1.5 bg-background border border-black/60 shadow-[1px_1px_0_0_#000]">
          <span className="text-[7px] sm:text-[8px] text-muted-foreground block uppercase mb-0.5">Especiales</span>
          <span className="font-bold text-amber-400 text-[10px] sm:text-xs">{metricas.especiales}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-1.5 bg-background border border-black/60 shadow-[1px_1px_0_0_#000]">
          <span className="text-[7px] sm:text-[8px] text-muted-foreground block uppercase mb-0.5">Tipos Biológicos</span>
          <span className="font-bold text-foreground text-[10px] sm:text-xs">{metricas.tipos}</span>
        </div>
      </div>

      {/* Panel de Control: Buscador y Filtros Interactivos */}
      <div className="p-3 sm:p-4 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] space-y-3.5">
        {/* Fila 1: Buscador y Selector de Tipo con Apilado Vertical en Móvil */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Buscador Interactivo */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar especie por nombre o rasgo..."
              aria-label="Buscar especie"
              className="w-full h-10 pl-9 pr-8 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] text-foreground placeholder:text-muted-foreground rounded-none focus:outline-none focus:border-primary transition-colors"
            />
            {busqueda.trim() !== "" && (
              <button
                type="button"
                aria-label="Borrar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
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
          <div className="w-full sm:w-52 shrink-0 relative">
            <select
              value={tipoFiltro}
              onChange={(e) => {
                reproducirSonido("click");
                setTipoFiltro(e.target.value);
              }}
              aria-label="Filtrar por tipo biológico"
              className="w-full h-10 px-3 pr-8 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] text-foreground rounded-none focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value="todos">TODOS LOS TIPOS</option>
              <option value="beast">BESTIA</option>
              <option value="monstrosity">MONSTRUOSIDAD</option>
              <option value="undead">NO-MUERTO</option>
              <option value="elemental">ELEMENTAL</option>
              <option value="construct">AUTÓMATA</option>
              <option value="plant">PLANTA</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>

          {/* Selector de ordenamiento jerárquico (Subfase 10m) */}
          <div className="w-full sm:w-56 shrink-0 relative">
            <select
              value={criterioOrden}
              onChange={(e) => {
                reproducirSonido("click");
                setCriterioOrden(e.target.value as CriterioOrdenCatalogo);
              }}
              aria-label="Ordenar especies del catálogo"
              className="w-full h-10 px-3 pr-8 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] text-foreground rounded-none focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value="ZONA_ASC">ORDEN: HÁBITAT Y RAREZA</option>
              <option value="BST_DESC">ORDEN: MAYOR PODER (BST)</option>
              <option value="BST_ASC">ORDEN: MENOR PODER (BST)</option>
              <option value="RAREZA_DESC">ORDEN: MAYOR RAREZA</option>
              <option value="CAPTURA_ASC">ORDEN: MÁS DIFÍCIL CAPTURA</option>
              <option value="NOMBRE_ASC">ORDEN: ALFABÉTICO (A-Z)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Fila 2: Botones rápidos de filtro por Arquetipo con separación generosa entre sí y Acción de Limpiar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-black/40">
          <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
            <span className="retro text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-1 mr-1.5 sm:mr-2">
              <Filter className="w-3 h-3 text-primary" aria-hidden="true" />
              <span>Arquetipo:</span>
            </span>
            {ARQUETIPOS_FILTRO.map((item) => {
              const Icono = item.icono;
              const activo = arquetipoFiltro === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`retro text-[8px] sm:text-[9px] h-7 sm:h-8 px-2 sm:px-2.5 rounded-none flex items-center gap-1.5 border-2 border-black cursor-pointer transition-all ${
                    activo
                      ? "bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_#000] translate-y-0.5"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
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
              className="h-7 sm:h-8 px-3 retro text-[8px] sm:text-[9px] text-amber-300 hover:text-amber-200 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none bg-amber-500/15 hover:bg-amber-500/25 rounded-none flex items-center gap-1.5 transition-all mt-2 sm:mt-0 sm:ml-4 self-end sm:self-auto shrink-0 cursor-pointer"
              onClick={() => {
                reproducirSonido("click");
                setTipoFiltro("todos");
                setArquetipoFiltro("TODOS");
                setBusqueda("");
              }}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Criaturas */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]" />
          ))}
        </div>
      ) : especiesFiltradas.length === 0 ? (
        <Card className="text-center p-8 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] rounded-none space-y-3">
          <CardTitle className="retro text-xs sm:text-sm text-muted-foreground">
            No se encontraron criaturas
          </CardTitle>
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground max-w-md mx-auto leading-relaxed break-words">
            No hay ninguna especie en el compendio que coincida con los criterios de búsqueda, tipo biológico o arquetipo seleccionados.
          </p>
          <Button
            size="sm"
            className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
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
        <div className="space-y-8">
          {gruposPorZona.map((grupo) => (
            <section
              key={grupo.zonaId}
              aria-labelledby={`zona-encabezado-${grupo.zonaId}`}
              className="space-y-3"
            >
              {/* Encabezado Retro de la Zona de Hábitat con alto contraste y separación generosa del nombre */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className="retro text-[8px] sm:text-[9px] uppercase rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary/20 text-primary px-2 py-0.5 mr-2.5 sm:mr-3.5"
                  >
                    {grupo.zonaId}
                  </Badge>
                  <h2
                    id={`zona-encabezado-${grupo.zonaId}`}
                    className="retro text-xs sm:text-sm font-bold text-foreground drop-shadow-[1px_1px_0_#000] tracking-wide"
                  >
                    {grupo.zonaNombre}
                  </h2>
                  <span className="retro text-[8px] sm:text-[9px] text-muted-foreground ml-1 sm:ml-1.5">
                    ({grupo.especies.length} {grupo.especies.length === 1 ? "criatura" : "criaturas"})
                  </span>
                </div>
                {grupo.legendarias > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 retro text-[8px] sm:text-[9px] font-bold border-2 border-black bg-amber-400/25 text-amber-300 rounded-none shadow-[2px_2px_0_0_#000]">
                    <Crown className="w-3 h-3 text-amber-400" aria-hidden="true" />
                    <span>Hábitat Legendario</span>
                  </span>
                )}
              </div>

              {/* Cuadrícula de Criaturas de la Zona */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupo.especies.map((especie) => {
                  const arquetipo = especie.arquetipo || calcularArquetipoCriatura(especie);
                  const tipoEspanol = TRADUCCION_TIPOS_ESPECIE[especie.tipo.toLowerCase()] || especie.tipo;

                  return (
                    <Card
                      key={especie.slug}
                      className={`rounded-none bg-card flex flex-col justify-between transition-all duration-200 ${
                        especie.esLegendaria
                          ? "anim-halo-legendario border-4 border-amber-400 bg-amber-950/25 shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000]"
                          : especie.esEspecial
                          ? "border-2 border-amber-500/90 shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]"
                          : "border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]"
                      }`}
                    >
                      {/* Cabecera de la Tarjeta */}
                      <CardHeader className="p-3 pb-2 space-y-1.5">
                        {/* Título de la Criatura con corona en especies legendarias */}
                        <CardTitle className="retro text-[10px] sm:text-xs font-bold text-foreground leading-relaxed tracking-tight break-words min-h-[2rem]">
                          {especie.nombre}
                          {especie.esLegendaria && (
                            <Crown
                              className="w-3.5 h-3.5 text-amber-400 inline ml-1.5 align-text-bottom drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                              aria-label="Criatura Legendaria"
                            />
                          )}
                        </CardTitle>
                        <p className="retro text-[8px] sm:text-[9px] text-muted-foreground break-all">
                          {especie.keyExterna || `srd-2024_${especie.slug}`}
                        </p>

                        {/* Badges de Tipo, Afinidad Elemental, Arquetipo y Rareza */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 retro text-[8px] font-semibold uppercase bg-secondary text-secondary-foreground border border-black shadow-[1px_1px_0_0_#000] rounded-none">
                            {tipoEspanol}
                          </span>
                          {especie.elemento && TRADUCCION_ELEMENTOS[especie.elemento] && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 retro text-[8px] font-semibold uppercase border border-black shadow-[1px_1px_0_0_#000] rounded-none ${
                                TRADUCCION_ELEMENTOS[especie.elemento].clase
                              }`}
                            >
                              {TRADUCCION_ELEMENTOS[especie.elemento].nombre}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] border border-black shadow-[1px_1px_0_0_#000] bg-background text-muted-foreground rounded-none">
                            {renderIconoArquetipo(arquetipo)}
                            <span>{arquetipo}</span>
                          </span>
                          {(() => {
                            const badge = obtenerBadgeRareza(especie);
                            const IconoBadge = badge.icono;
                            return (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] font-semibold uppercase border rounded-none ${badge.estilo}`}>
                                <IconoBadge className="w-2.5 h-2.5" aria-hidden="true" />
                                <span>{badge.texto}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </CardHeader>

                      {/* Vitrina Central de la Criatura con Sprite Pixel-Art */}
                      <div className="relative w-full h-36 sm:h-40 bg-black/60 border-y-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] flex items-center justify-center p-3 overflow-hidden group">
                        <div
                          className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"
                          aria-hidden="true"
                        />

                        {/* Badge flotante de LEGENDARIO o ESPECIAL */}
                        {especie.esLegendaria ? (
                          <span className="absolute top-2 right-2 z-10 bg-amber-400/30 text-amber-200 border-2 border-black text-[8px] px-2 py-0.5 rounded-none retro font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                            <Crown className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                            <span>LEGENDARIO</span>
                          </span>
                        ) : especie.esEspecial ? (
                          <span className="absolute top-2 right-2 z-10 bg-amber-500/25 text-amber-300 border-2 border-black text-[8px] px-2 py-0.5 rounded-none retro font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" aria-hidden="true" />
                            <span>ESPECIAL</span>
                          </span>
                        ) : null}

                        <img
                          src={obtenerImagenCriatura(especie.slug)}
                          alt={`Sprite de ${especie.nombre}`}
                          onError={(e) => manejarErrorImagen(e, "criatura")}
                          className="pixelated h-28 w-28 sm:h-32 sm:w-32 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                          loading="lazy"
                        />
                      </div>

                      {/* Contenido: Atributos y Acciones con holgura táctica */}
                      <CardContent className="p-3 pt-3 space-y-3">
                        {/* Resumen de Atributos Base en contenedor retro-brutalista */}
                        <div className="grid grid-cols-4 gap-1.5 p-2 bg-black/50 border-2 border-black shadow-[2px_2px_0_0_#000] text-center retro text-[9px]">
                          <div>
                            <span className="text-[7px] text-muted-foreground block uppercase">HP</span>
                            <span className="font-bold text-foreground">{especie.hpBase}</span>
                          </div>
                          <div>
                            <span className="text-[7px] text-muted-foreground block uppercase">ATQ</span>
                            <span className="font-bold text-red-400">{especie.ataqueBase}</span>
                          </div>
                          <div>
                            <span className="text-[7px] text-muted-foreground block uppercase">DEF</span>
                            <span className="font-bold text-blue-400">{especie.defensaBase}</span>
                          </div>
                          <div>
                            <span className="text-[7px] text-muted-foreground block uppercase">VEL</span>
                            <span className="font-bold text-emerald-400">{especie.velocidadBase}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between retro text-[8px] sm:text-[9px] px-0.5 text-muted-foreground flex-wrap gap-1">
                          <span>BST: <strong className="text-emerald-400">{calcularPresupuestoCriatura(especie)}</strong></span>
                          <span>CR: <strong className="text-primary">{especie.challengeRating}</strong></span>
                          <span>Captura: <strong className="text-amber-400">{Math.round(especie.tasaCaptura * 100)}%</strong></span>
                        </div>

                        {/* Botón de Inspección con separación y estética retro-brutalista */}
                        <div className="pt-2 sm:pt-3 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 cursor-pointer"
                            onClick={() => abrirInspeccion(especie)}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>INSPECCIONAR FICHA</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Sellado de Inspección Táctica Detallada (Dialog 8-bit Brutalist) */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent
          font="normal"
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] bg-card p-0 flex flex-col"
        >
          {especieSeleccionada && (
            <div className="flex flex-col max-h-[85vh] overflow-hidden">
              {/* Cabecera del Modal con Título y Botón Cerrar */}
              <div className="p-3 bg-bastion border-b-2 border-black flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="retro text-[10px] sm:text-xs font-bold text-primary tracking-wide break-words">
                    {especieSeleccionada.nombre}
                  </DialogTitle>
                  <DialogDescription className="retro text-[7px] sm:text-[8px] text-muted-foreground break-all mt-0.5">
                    {especieSeleccionada.keyExterna || `srd-2024_${especieSeleccionada.slug}`}
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar ficha táctica"
                  className="text-muted-foreground hover:text-foreground p-1.5 transition-all border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted/50 rounded-none shrink-0 cursor-pointer"
                  onClick={() => setModalAbierto(false)}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Cuerpo del Modal con Scroll Interno Limpio y Tipografía Retro Integral */}
              <div className="overflow-y-auto p-3 sm:p-4 space-y-4 retro text-[8px] sm:text-[9px] flex-1">
                {/* Vitrina Ampliada en Modal */}
                <div className="relative w-full h-36 bg-black/60 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] flex items-center justify-center p-3 overflow-hidden shrink-0">
                  <div
                    className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"
                    aria-hidden="true"
                  />
                  <img
                    src={obtenerImagenCriatura(especieSeleccionada.slug)}
                    alt={especieSeleccionada.nombre}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    className="pixelated h-28 w-28 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                  />
                  {especieSeleccionada.esLegendaria ? (
                    <span className="absolute top-2 right-2 bg-amber-400/30 text-amber-200 border-2 border-black text-[8px] px-2 py-0.5 rounded-none retro font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                      <Crown className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                      <span>LEGENDARIO</span>
                    </span>
                  ) : especieSeleccionada.esEspecial ? (
                    <span className="absolute top-2 right-2 bg-amber-500/25 text-amber-300 border-2 border-black text-[8px] px-2 py-0.5 rounded-none retro font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" aria-hidden="true" />
                      <span>ESPECIAL</span>
                    </span>
                  ) : null}
                </div>

                {/* Fila de Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 retro text-[8px] uppercase font-semibold bg-secondary text-secondary-foreground border border-black shadow-[1px_1px_0_0_#000] rounded-none">
                    {TRADUCCION_TIPOS_ESPECIE[especieSeleccionada.tipo.toLowerCase()] || especieSeleccionada.tipo}
                  </span>
                  {especieSeleccionada.elemento && TRADUCCION_ELEMENTOS[especieSeleccionada.elemento] && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 retro text-[8px] uppercase font-semibold border border-black shadow-[1px_1px_0_0_#000] rounded-none ${
                        TRADUCCION_ELEMENTOS[especieSeleccionada.elemento].clase
                      }`}
                    >
                      {TRADUCCION_ELEMENTOS[especieSeleccionada.elemento].nombre}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] border border-black shadow-[1px_1px_0_0_#000] bg-background text-muted-foreground rounded-none">
                    {renderIconoArquetipo(calcularArquetipoCriatura(especieSeleccionada))}
                    <span>{calcularArquetipoCriatura(especieSeleccionada)}</span>
                  </span>
                  {(() => {
                    const badge = obtenerBadgeRareza(especieSeleccionada);
                    const IconoBadge = badge.icono;
                    return (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] font-semibold uppercase border rounded-none ${badge.estilo}`}>
                        <IconoBadge className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>{badge.texto}</span>
                      </span>
                    );
                  })()}
                  <span className="inline-flex items-center px-1.5 py-0.5 retro text-[8px] border border-black shadow-[1px_1px_0_0_#000] text-muted-foreground rounded-none">
                    CR {especieSeleccionada.challengeRating}
                  </span>
                  {especieSeleccionada.zona && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] border border-black shadow-[1px_1px_0_0_#000] text-muted-foreground rounded-none bg-background">
                      <MapPin className="w-2.5 h-2.5 text-primary" aria-hidden="true" />
                      <span>{especieSeleccionada.zona.nombre}</span>
                    </span>
                  )}
                  {especieSeleccionada.esLegendaria && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 retro text-[8px] font-bold border-2 border-black bg-amber-400/25 text-amber-300 rounded-none shadow-[2px_2px_0_0_#000]">
                      <Crown className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                      <span>Criatura Legendaria</span>
                    </span>
                  )}
                </div>

                {/* Lore Biológico */}
                {especieSeleccionada.descripcion && (
                  <div className="p-2.5 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
                    {especieSeleccionada.descripcion}
                  </div>
                )}

                {/* Atributos Base con Barras Comparativas sobre 100 */}
                <div className="p-3 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] space-y-2.5">
                  <span className="retro text-[8px] sm:text-[9px] font-bold text-primary uppercase tracking-wider block">
                    Atributos Base (Escala 100)
                  </span>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between retro text-[8px] sm:text-[9px]">
                        <span>Puntos de Salud (HP)</span>
                        <span className="font-bold text-foreground">{especieSeleccionada.hpBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.hpBase} className="h-2 rounded-none border border-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between retro text-[8px] sm:text-[9px]">
                        <span>Ataque</span>
                        <span className="font-bold text-red-400">{especieSeleccionada.ataqueBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.ataqueBase} className="h-2 rounded-none border border-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between retro text-[8px] sm:text-[9px]">
                        <span>Defensa</span>
                        <span className="font-bold text-blue-400">{especieSeleccionada.defensaBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.defensaBase} className="h-2 rounded-none border border-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between retro text-[8px] sm:text-[9px]">
                        <span>Velocidad</span>
                        <span className="font-bold text-emerald-400">{especieSeleccionada.velocidadBase}</span>
                      </div>
                      <Progress value={especieSeleccionada.velocidadBase} className="h-2 rounded-none border border-black" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-black/40 retro text-[8px] sm:text-[9px]">
                    <div>BST: <strong className="text-emerald-400">{calcularPresupuestoCriatura(especieSeleccionada)}</strong></div>
                    <div>CR: <strong className="text-primary">{especieSeleccionada.challengeRating}</strong></div>
                    <div>Tasa Captura: <strong className="text-amber-400">{Math.round(especieSeleccionada.tasaCaptura * 100)}%</strong></div>
                  </div>
                </div>

                {/* Lista de Movimientos Conocidos (4 Slots Canónicos) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="retro text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Movimientos Tácticos (4 Slots)
                    </span>
                    <span className="retro text-[7px] sm:text-[8px] text-muted-foreground">
                      M1..M3 Combate · M4 Furia
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(especieSeleccionada.movimientos || []).map((mov, i) => {
                      const numSlot = mov.slot ?? (i + 1);
                      const esSlot4 = numSlot === 4;
                      return (
                        <div
                          key={i}
                          className={`p-2 bg-background border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-between gap-2 ${
                            esSlot4 ? "border-amber-500/80 bg-amber-500/10" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`retro text-[7px] sm:text-[8px] px-1 py-0.5 border border-black font-bold ${
                                  esSlot4
                                    ? "border-amber-400 text-amber-300 bg-amber-400/25"
                                    : "border-black text-foreground bg-muted/40"
                                }`}
                              >
                                M{numSlot}
                              </span>
                              <span className="retro text-[8px] sm:text-[9px] font-bold text-foreground break-words">
                                {mov.nombre}
                              </span>
                              {mov.efecto && (
                                <span className="retro text-[7px] sm:text-[8px] uppercase px-1 py-0.5 border border-primary/60 bg-primary/20 text-primary">
                                  {mov.efecto}
                                </span>
                              )}
                            </div>
                            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground block break-words">
                              {mov.tipoAccion || "Ataque melé"} {mov.nombreOriginal ? `· ${mov.nombreOriginal}` : ""}
                            </span>
                          </div>
                          <span className="retro text-[7px] sm:text-[8px] px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] bg-background text-foreground shrink-0">
                            Pot. {mov.poder}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botón de Cierre de Ficha Táctica con separación táctil */}
                <div className="pt-3 sm:pt-4 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] cursor-pointer"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cerrar Ficha Táctica
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nota legal / Atribución exigida por CC BY 4.0 con tipografía retro y marco brutalista */}
      <footer className="p-3 bg-bastion border-2 border-black shadow-[4px_4px_0_0_#000] retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
        <p>
          <strong className="text-foreground">Atribución SRD 5.2 / Open5e:</strong> Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
        </p>
      </footer>
    </div>
  );
}

export default PantallaCatalogo;
