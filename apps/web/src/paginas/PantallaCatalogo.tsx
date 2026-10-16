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
import { Input } from "@/components/ui/8bit/input";
import { Progress } from "@/components/ui/8bit/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/8bit/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

/**
 * Mapeo canónico en español de los 6 tipos biológicos del SRD 5.2 (Open5e).
 */
export const TRADUCCION_TIPOS_ESPECIE: Record<string, string> = {
  beast: "Bestia",
  monstrosity: "Monstruosidad",
  undead: "No-muerto",
  elemental: "Elemental",
  construct: "Autómata",
  plant: "Planta",
};

/**
 * Determina el arquetipo táctico de una especie basándose en sus atributos o valor precalculado.
 */
export function calcularArquetipoCriatura(especie: {
  hpBase?: number;
  ataqueBase?: number;
  defensaBase?: number;
  velocidadBase?: number;
  arquetipo?: ArquetipoEspecie;
}): ArquetipoEspecie {
  if (especie.arquetipo) {
    return especie.arquetipo;
  }

  const hp = especie.hpBase ?? 30;
  const atq = especie.ataqueBase ?? 30;
  const def = especie.defensaBase ?? 30;
  const vel = especie.velocidadBase ?? 30;
  const maximo = Math.max(hp, atq, def, vel);

  if ((def >= 75 || hp >= 65) && (def === maximo || hp === maximo)) {
    return "TANQUE";
  }
  if (atq >= 70 && atq >= def && atq >= vel) {
    return "ATACANTE";
  }
  if (vel >= 70 && vel > atq) {
    return "VELOZ";
  }
  return "EQUILIBRADO";
}

export interface CriteriosFiltroCatalogo {
  tipo?: string;
  arquetipo?: string;
  busqueda?: string;
}

/**
 * Filtra en cliente de forma instantánea por tipo biológico, arquetipo/rareza y término de búsqueda.
 */
export function filtrarEspeciesCatalogo(
  especies: EspecieCatalogo[],
  filtros: CriteriosFiltroCatalogo,
): EspecieCatalogo[] {
  const tipoFiltro = (filtros.tipo || "todos").toLowerCase().trim();
  const arquetipoFiltro = (filtros.arquetipo || "todos").toUpperCase().trim();
  const busquedaNormalizada = (filtros.busqueda || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return especies.filter((esp) => {
    // Filtro por tipo biológico
    if (tipoFiltro !== "todos" && esp.tipo.toLowerCase() !== tipoFiltro) {
      return false;
    }

    // Filtro por arquetipo o rareza especial
    if (arquetipoFiltro !== "TODOS") {
      if (arquetipoFiltro === "ESPECIAL" || arquetipoFiltro === "ESPECIALES") {
        if (!esp.esEspecial) return false;
      } else {
        const arq = esp.arquetipo || calcularArquetipoCriatura(esp);
        if (arq !== arquetipoFiltro) return false;
      }
    }

    // Filtro por término de búsqueda (nombre, slug, descripción o keyExterna)
    if (busquedaNormalizada) {
      const textoNombre = (esp.nombre || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoSlug = (esp.slug || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoDesc = (esp.descripcion || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const textoKey = (esp.keyExterna || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const coincide =
        textoNombre.includes(busquedaNormalizada) ||
        textoSlug.includes(busquedaNormalizada) ||
        textoDesc.includes(busquedaNormalizada) ||
        textoKey.includes(busquedaNormalizada);

      if (!coincide) return false;
    }

    return true;
  });
}

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
      <div className="p-3 bg-bastion border-2 border-border/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Buscador Interactivo */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar especie por nombre o rasgo..."
              aria-label="Buscar especie"
              className="pl-8 text-xs rounded-none bg-background"
            />
          </div>

          {/* Selector de los 6 tipos biológicos en español */}
          <div>
            <Select value={tipoFiltro} onValueChange={(val) => { reproducirSonido("click"); setTipoFiltro(val); }}>
              <SelectTrigger className="text-xs h-9 rounded-none bg-background">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="beast">Bestia</SelectItem>
                <SelectItem value="monstrosity">Monstruosidad</SelectItem>
                <SelectItem value="undead">No-muerto</SelectItem>
                <SelectItem value="elemental">Elemental</SelectItem>
                <SelectItem value="construct">Autómata</SelectItem>
                <SelectItem value="plant">Planta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botones rápidos de filtro por Arquetipo / Rareza */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40 text-[11px]">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase mr-1">
            Arquetipo:
          </span>
          {(["TODOS", "ATACANTE", "TANQUE", "VELOZ", "EQUILIBRADO", "ESPECIALES"] as const).map((arq) => (
            <Button
              key={arq}
              size="sm"
              variant={arquetipoFiltro === arq ? "default" : "outline"}
              className="text-[10px] h-7 px-2.5 rounded-none"
              onClick={() => {
                reproducirSonido("click");
                setArquetipoFiltro(arq);
              }}
            >
              {arq}
            </Button>
          ))}
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Criaturas */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-none" />
          ))}
        </div>
      ) : especiesFiltradas.length === 0 ? (
        <Card className="text-center p-8 bg-bastion border-2 rounded-none">
          <CardTitle className="text-base text-muted-foreground mb-2">
            No se encontraron criaturas con los filtros seleccionados
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Prueba ajustando el término de búsqueda, el selector de tipo o el arquetipo.
          </p>
          <Button
            size="sm"
            className="rounded-none"
            onClick={() => {
              reproducirSonido("click");
              setTipoFiltro("todos");
              setArquetipoFiltro("TODOS");
              setBusqueda("");
            }}
          >
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
                className={`border-2 rounded-none bg-bastion flex flex-col justify-between transition-colors ${
                  especie.esEspecial ? "border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.2)]" : "border-border"
                }`}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start gap-3">
                    {/* Marco de Sprite Pixel-Art */}
                    <div className="bg-abismo/90 border-2 border-border p-1.5 rounded-none shrink-0 w-[72px] h-[72px] flex items-center justify-center">
                      <img
                        src={obtenerImagenCriatura(especie.slug)}
                        alt={especie.nombre}
                        onError={(e) => manejarErrorImagen(e, "criatura")}
                        className="pixelated h-14 w-14 object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <CardTitle className="text-sm font-bold text-foreground truncate retro">
                          {especie.nombre}
                        </CardTitle>
                        {especie.esEspecial && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/70 text-[9px] px-1 py-0 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                            ESPECIAL
                          </Badge>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        {especie.keyExterna || `srd-2024_${especie.slug}`}
                      </p>

                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0">
                          {tipoEspanol}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 flex items-center gap-1">
                          {renderIconoArquetipo(arquetipo)}
                          <span>{arquetipo}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-1 space-y-2.5">
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
                    className="w-full text-xs rounded-none flex items-center justify-center gap-1.5"
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
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none border-2 border-primary bg-bastion p-4">
          {especieSeleccionada && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="bg-abismo/90 border-2 border-border p-1.5 rounded-none shrink-0 w-20 h-20 flex items-center justify-center">
                    <img
                      src={obtenerImagenCriatura(especieSeleccionada.slug)}
                      alt={especieSeleccionada.nombre}
                      onError={(e) => manejarErrorImagen(e, "criatura")}
                      className="pixelated h-16 w-16 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-sm sm:text-base font-bold text-primary tracking-wide retro">
                      {especieSeleccionada.nombre}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                      {especieSeleccionada.keyExterna || `srd-2024_${especieSeleccionada.slug}`}
                    </DialogDescription>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        {TRADUCCION_TIPOS_ESPECIE[especieSeleccionada.tipo.toLowerCase()] || especieSeleccionada.tipo}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] flex items-center gap-1">
                        {renderIconoArquetipo(calcularArquetipoCriatura(especieSeleccionada))}
                        <span>{calcularArquetipoCriatura(especieSeleccionada)}</span>
                      </Badge>
                      {especieSeleccionada.esEspecial && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/80 text-[9px] flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                          ESPECIAL
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Lore Biológico */}
              {especieSeleccionada.descripcion && (
                <div className="p-2.5 bg-background border border-border/70 text-xs leading-relaxed text-muted-foreground">
                  {especieSeleccionada.descripcion}
                </div>
              )}

              {/* Atributos Base con Barras Comparativas sobre 100 */}
              <div className="p-3 bg-background border border-border/70 space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Movimientos Conocidos
                </span>
                <div className="space-y-1">
                  {(especieSeleccionada.movimientos || []).slice(0, 3).map((mov, i) => (
                    <div
                      key={i}
                      className="p-2 bg-background border border-border/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-foreground block">{mov.nombre}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {mov.tipoAccion || "Ataque melé"} · {mov.nombreOriginal}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] rounded-none">
                        Pot. {mov.poder}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Cierre */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs rounded-none"
                onClick={() => setModalAbierto(false)}
              >
                Cerrar Ficha Táctica
              </Button>
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
