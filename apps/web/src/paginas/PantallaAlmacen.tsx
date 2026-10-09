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
import {
  api,
  type CriaturaAlmacen,
  type PersonajeActivo,
  ErrorApi,
} from "@/api";

export function PantallaAlmacen() {
  const [almacen, setAlmacen] = useState<CriaturaAlmacen[]>([]);
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [transfiriendoId, setTransfiriendoId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [respuestaAlmacen, datosPersonaje] = await Promise.all([
        api.obtenerAlmacen(),
        api.obtenerPersonajeActivo(),
      ]);
      setAlmacen(respuestaAlmacen.criaturas);
      setPersonaje(datosPersonaje);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar las criaturas del almacén.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalEnEquipo = personaje?.totalCriaturasEquipo ?? 0;
  const equipoLleno = totalEnEquipo >= 6;

  const handleMoverAEquipo = async (criatura: CriaturaAlmacen) => {
    if (equipoLleno) {
      toast.warning("Tu equipo ya cuenta con el límite máximo de 6 criaturas.");
      return;
    }
    try {
      setTransfiriendoId(criatura.criaturaId);
      const respuesta = await api.transferirCriatura({
        criaturaId: criatura.criaturaId,
        haciaEquipo: true,
      });
      toast.success(respuesta.mensaje || `${criatura.nombre} transferida al equipo activo.`);
      setAlmacen((prev) => prev.filter((c) => c.criaturaId !== criatura.criaturaId));
      if (personaje) {
        setPersonaje({
          ...personaje,
          totalCriaturasEquipo: totalEnEquipo + 1,
          totalCriaturasAlmacen: Math.max(0, personaje.totalCriaturasAlmacen - 1),
        });
      }
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al transferir la criatura al equipo activo.");
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
              Almacén de Criaturas
            </h1>
            <Badge variant="secondary">
              {almacen.length} en reserva
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Depósito seguro de criaturas capturadas que no están en tu equipo activo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/equipo">
            <Button variant="outline" size="sm" className="text-xs">
              Ver Equipo Activo ({totalEnEquipo}/6)
            </Button>
          </Link>
          <Link to="/hub">
            <Button variant="outline" size="sm" className="text-xs">
              Volver al Asentamiento
            </Button>
          </Link>
        </div>
      </div>

      {equipoLleno && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-500 text-xs font-semibold">
          Tu equipo activo está completo (6/6). Envía un miembro al almacén desde la pantalla de equipo para liberar espacio.
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : almacen.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="text-base text-muted-foreground mb-2">
            Tu almacén está vacío
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            ¡Captura más criaturas en tus viajes!
          </CardDescription>
          <Link to="/exploracion">
            <Button size="sm">Ir a Explorar</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {almacen.map((criatura) => {
            const porcentajeHp = Math.round((criatura.hpActual / criatura.hpMaximo) * 100);
            const enProceso = transfiriendoId === criatura.criaturaId;

            return (
              <Card key={criatura.criaturaId} className="border-2 flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      {criatura.nombre}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      Nv. {criatura.nivel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Salud</span>
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
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-border/40">
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={enProceso || equipoLleno}
                    onClick={() => handleMoverAEquipo(criatura)}
                  >
                    {enProceso ? "Transfiriendo..." : equipoLleno ? "Equipo completo" : "Mover al equipo"}
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

export default PantallaAlmacen;
