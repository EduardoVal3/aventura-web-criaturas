import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import HealthBar from "@/components/ui/8bit/health-bar";
import { api, type CriaturaEquipo, ErrorApi } from "@/api";

export function PantallaEquipo() {
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [transfiriendoId, setTransfiriendoId] = useState<string | null>(null);

  const cargarEquipo = async () => {
    try {
      const respuesta = await api.obtenerEquipo();
      setEquipo(respuesta.criaturas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las criaturas del equipo activo.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipo();
  }, []);

  const handleEnviarAlmacen = async (criatura: CriaturaEquipo) => {
    if (equipo.length <= 1) {
      toast.warning("Debes conservar al menos una criatura en tu equipo activo.");
      return;
    }
    try {
      setTransfiriendoId(criatura.criaturaId);
      const respuesta = await api.transferirCriatura({
        criaturaId: criatura.criaturaId,
        haciaEquipo: false,
      });
      toast.success(respuesta.mensaje || `${criatura.nombre} enviada al almacén.`);
      setEquipo((prev) => prev.filter((c) => c.criaturaId !== criatura.criaturaId));
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al transferir la criatura al almacén.");
      }
    } finally {
      setTransfiriendoId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              Equipo Activo
            </h1>
            <Badge variant="secondary">
              {equipo.length} / 6 Criaturas
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestiona los miembros que te acompañan en combate y expedición.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/almacen">
            <Button variant="outline" size="sm" className="text-xs">
              Ir al Almacén
            </Button>
          </Link>
          <Link to="/hub">
            <Button variant="outline" size="sm" className="text-xs">
              Volver al Asentamiento
            </Button>
          </Link>
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      ) : equipo.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="text-base text-muted-foreground mb-2">
            No tienes criaturas en tu equipo activo
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            Ve al almacén para transferir compañeros a tu equipo.
          </CardDescription>
          <Link to="/almacen">
            <Button size="sm">Ver Almacén</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipo.map((criatura) => {
            const porcentajeHp = Math.round((criatura.hpActual / criatura.hpMaximo) * 100);
            const enProceso = transfiriendoId === criatura.criaturaId;

            return (
              <Card key={criatura.criaturaId} className="border-2 flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {criatura.nombre}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                        Posición #{criatura.orden}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="text-[10px]">
                      Nv. {criatura.nivel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Puntos de Salud</span>
                      <span className="font-mono text-xs">
                        {criatura.hpActual} / {criatura.hpMaximo} HP
                      </span>
                    </div>
                    <HealthBar
                      value={porcentajeHp}
                      variant="retro"
                      className="h-3"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 rounded border border-border/50 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">ATQ</span>
                      <span className="font-semibold">{criatura.ataque}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">DEF</span>
                      <span className="font-semibold">{criatura.defensa}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">VEL</span>
                      <span className="font-semibold">{criatura.velocidad}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={enProceso}
                    onClick={() => handleEnviarAlmacen(criatura)}
                  >
                    {enProceso ? "Transfiriendo..." : "Enviar al almacén"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PantallaEquipo;
