import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/8bit/select";
import {
  api,
  type EspecieDetalle,
  ErrorApi,
} from "@/api";
import muestrasOpen5e from "@/api/datos-simulados/open5e-muestras.json";

export function PantallaCatalogo() {
  const [especies, setEspecies] = useState<EspecieDetalle[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [cargando, setCargando] = useState(true);

  const cargarCatalogo = async (filtro?: string) => {
    try {
      setCargando(true);
      const tipoConsulta = filtro && filtro !== "todos" ? filtro : undefined;
      const res = await api.obtenerEspecies(tipoConsulta);

      // Enriquecer con detalles y movimientos de cada especie
      const especiesDetalladas = await Promise.all(
        res.especies.map(async (esp) => {
          try {
            return await api.obtenerEspecie(esp.slug);
          } catch {
            return {
              ...esp,
              keyExterna: `srd-2024_${esp.slug}`,
              movimientos: [
                {
                  nombre: "Ataque Primario",
                  nombreOriginal: "Primary Attack",
                  poder: 5.0,
                },
              ],
            } as EspecieDetalle;
          }
        }),
      );

      setEspecies(especiesDetalladas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las especies del catálogo.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo(tipoFiltro);
  }, [tipoFiltro]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              Compendio de Criaturas
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              Open5e srd-2024
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Catálogo biológico de especies del mundo con datos del System Reference Document 5.2.
          </p>
        </div>

        <Link to="/hub">
          <Button variant="outline" size="sm" className="text-xs">
            Volver al Asentamiento
          </Button>
        </Link>
      </div>

      {/* Barra de Filtros y Atribución */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border-2 border-border/60 rounded">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Filtrar por tipo:
          </span>
          <div className="w-48">
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="beast">Bestia (Beast)</SelectItem>
                <SelectItem value="monstrosity">Monstruosidad (Monstrosity)</SelectItem>
                <SelectItem value="undead">No muerto (Undead)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono">
          {especies.length} de {muestrasOpen5e.totalRegistros} especies registradas en muestra local
        </div>
      </div>

      {/* Fichas de Criaturas */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : especies.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="text-base text-muted-foreground mb-2">
            No se encontraron criaturas de este tipo
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            Prueba seleccionando otro tipo de criatura en el selector.
          </CardDescription>
          <Button size="sm" onClick={() => setTipoFiltro("todos")}>
            Mostrar todas las criaturas
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {especies.map((especie) => (
            <Card key={especie.slug} className="border-2 flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {especie.nombre}
                    </CardTitle>
                    <CardDescription className="text-xs italic text-muted-foreground font-mono mt-0.5">
                      Open5e: {especie.keyExterna}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {especie.tipo}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-1 p-2 bg-muted/40 rounded border border-border/50 text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase">CR (Desafío)</span>
                    <span className="font-semibold text-primary">{especie.challengeRating}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase">HP Base</span>
                    <span className="font-semibold">{especie.hpBase}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase">Captura</span>
                    <span className="font-semibold text-amber-500">
                      {Math.round(especie.tasaCaptura * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Movimientos conocidos:
                  </span>
                  <ul className="space-y-1">
                    {especie.movimientos?.map((mov, i) => (
                      <li
                        key={i}
                        className="text-xs p-1.5 bg-card border border-border/50 rounded flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">{mov.nombre}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {mov.nombreOriginal} · Pot. {mov.poder}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Nota legal / Atribución exigida por CC BY 4.0 */}
      <footer className="p-3 bg-muted/30 border border-border/40 rounded text-[11px] text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Atribución SRD 5.2 / Open5e:</strong> Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0).
        </p>
      </footer>
    </div>
  );
}

export default PantallaCatalogo;
