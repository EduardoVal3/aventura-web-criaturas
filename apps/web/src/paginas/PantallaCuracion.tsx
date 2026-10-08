import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
import HealthBar from "@/components/ui/8bit/health-bar";
import { api, type CriaturaEquipo, ErrorApi } from "@/api";

export function PantallaCuracion() {
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [restaurando, setRestaurando] = useState(false);

  const cargarEquipo = async () => {
    try {
      const res = await api.obtenerEquipo();
      setEquipo(res.criaturas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al consultar el estado del equipo.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipo();
  }, []);

  const handleRestaurar = async () => {
    try {
      setRestaurando(true);
      const res = await api.restaurarEquipo();
      toast.success(res.mensaje || "¡Todo el equipo ha sido curado por completo!");
      // Actualizar localmente la salud a la máxima
      setEquipo((prev) =>
        prev.map((c) => ({
          ...c,
          hpActual: c.hpMaximo,
        })),
      );
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo completar la restauración.");
      }
    } finally {
      setRestaurando(false);
    }
  };

  const todoSaludable = equipo.every((c) => c.hpActual >= c.hpMaximo);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Cabecera del Santuario */}
      <Card className="border-2 border-primary/50 text-center">
        <CardHeader className="p-6 pb-2">
          <Badge variant="default" className="mx-auto text-xs mb-2">
            Servicio Gratuito de la Aldea
          </Badge>
          <CardTitle className="text-xl sm:text-3xl text-primary font-bold">
            Santuario de Curación
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            El agua sagrada del manantial restablece la vitalidad y alivia la fatiga de todas tus criaturas compañeras.
          </CardDescription>
        </CardHeader>

        <CardFooter className="p-6 pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center border-t border-border/40">
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 flex items-center justify-center gap-2"
            disabled={cargando || restaurando || todoSaludable}
            onClick={handleRestaurar}
          >
            {restaurando ? (
              <>
                <Spinner className="size-4" />
                <span>Canalizando bendición...</span>
              </>
            ) : todoSaludable ? (
              <span>Todo tu equipo está al máximo</span>
            ) : (
              <span>Restaurar todo el equipo</span>
            )}
          </Button>

          <Link to="/hub">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
              Volver al Asentamiento
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Estado de las Criaturas del Equipo */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
          Estado Actual del Equipo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipo.map((criatura) => {
            const porcentajeHp = Math.round((criatura.hpActual / criatura.hpMaximo) * 100);
            const estaPlena = criatura.hpActual >= criatura.hpMaximo;

            return (
              <Card key={criatura.criaturaId} className="p-4 border-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold">
                      {criatura.nombre}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono">
                      Posición #{criatura.orden}
                    </span>
                  </div>
                  <Badge variant={estaPlena ? "secondary" : "destructive"} className="text-[10px]">
                    {estaPlena ? "Saludable" : "Herida"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Puntos de Salud:</span>
                    <span className="font-mono font-bold">
                      {criatura.hpActual} / {criatura.hpMaximo} HP
                    </span>
                  </div>
                  <HealthBar
                    value={porcentajeHp}
                    variant="retro"
                    className="h-3"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PantallaCuracion;
