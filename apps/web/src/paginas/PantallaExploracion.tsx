import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { Progress } from "@/components/ui/8bit/progress";
import { Spinner } from "@/components/ui/8bit/spinner";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import {
  api,
  type RespuestaExploracion,
  type UbicacionActual,
  ErrorApi,
} from "@/api";

export function PantallaExploracion() {
  const navigate = useNavigate();
  const [ubicacion, setUbicacion] = useState<UbicacionActual | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [progresoZona, setProgresoZona] = useState<number>(0);
  const [explorando, setExplorando] = useState(false);
  const [eventoEncuentro, setEventoEncuentro] = useState<RespuestaExploracion | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalReanudacion, setModalReanudacion] = useState(false);
  const [nombreRivalReanudado, setNombreRivalReanudado] = useState<string>("");
  const [bitacoraExploracion, setBitacoraExploracion] = useState<string[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstado() {
      try {
        const ubi = await api.obtenerUbicacionActual();
        if (!cancelado) {
          setUbicacion(ubi);
          setProgresoZona(ubi.progresoZona ?? 0);
          setBitacoraExploracion([
            `Te encuentras en ${ubi.nombre}. El terreno se extiende ante ti.`,
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          if (error instanceof ErrorApi && error.estado === 401) {
            navigate("/ingreso");
            return;
          }
          toast.error("Error al cargar la ubicación actual.");
        }
      }

      // Reanudación activa: verificar si hay combate en curso
      try {
        const encuentroActivo = await api.obtenerEncuentroActivo();
        if (!cancelado && encuentroActivo && encuentroActivo.estado === "EN_CURSO") {
          setNombreRivalReanudado(encuentroActivo.criaturaRival.nombre);
          setModalReanudacion(true);
        }
      } catch {
        // 404 o ENCUENTRO_NO_ENCONTRADO es normal si no hay combate en curso
      } finally {
        if (!cancelado) {
          setCargandoInicial(false);
        }
      }
    }

    cargarEstado();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const handleExplorar = async () => {
    try {
      setExplorando(true);
      const resultado = await api.explorar();

      if (typeof resultado.progresoZona === "number") {
        setProgresoZona(resultado.progresoZona);
      }
      setBitacoraExploracion((prev) => [resultado.mensaje, ...prev.slice(0, 5)]);

      if (resultado.tipoEvento === "ENCUENTRO") {
        setEventoEncuentro(resultado);
        setModalAbierto(true);
      } else if (resultado.tipoEvento === "OBJETO") {
        toast.success(resultado.mensaje || "¡Has encontrado un objeto útil!");
      } else {
        toast.info(resultado.mensaje || "El camino sigue despejado.");
      }
    } catch (error) {
      if (error instanceof ErrorApi) {
        if (error.codigo === "ENCUENTRO_ACTIVO_PENDIENTE") {
          toast.info("¡Tienes un combate pendiente de resolución!");
          navigate("/combate");
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Error al explorar el terreno.");
      }
    } finally {
      setExplorando(false);
    }
  };

  const handleIniciarCombate = () => {
    setModalAbierto(false);
    navigate("/combate");
  };

  if (cargandoInicial) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Cabecera de la Ruta Silvestre */}
      <Card className="border-2 border-primary/50">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl text-primary font-bold">
                  {ubicacion?.nombre ?? "Zona de Expedición"}
                </CardTitle>
                <Badge variant={ubicacion?.esSegura ? "default" : "destructive"}>
                  {ubicacion?.esSegura ? "Zona Segura" : "Zona Hostil"}
                </Badge>
                {progresoZona >= 100 && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-950/40">
                    Zona 100% Explorada / Cartografiada
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                {ubicacion?.descripcion}
              </CardDescription>
            </div>
            <Link to="/hub">
              <Button variant="outline" size="sm" className="text-xs">
                Regresar al Hub
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Progreso de Exploración del Área
              </span>
              <span className="font-mono font-bold text-primary">{progresoZona} %</span>
            </div>
            <Progress value={progresoZona} variant="retro" className="h-4" />
          </div>

          <div className="p-3 bg-muted/40 rounded border border-border/50">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Bitácora de Terreno
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {bitacoraExploracion.map((registro, indice) => (
                <li key={indice} className="flex items-start gap-2">
                  <span className="text-primary font-mono select-none">›</span>
                  <span>{registro}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 pt-2 border-t border-border/60 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Avanza para recolectar botín o encontrar criaturas.
          </span>
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 flex items-center justify-center gap-2"
            disabled={explorando}
            onClick={handleExplorar}
          >
            {explorando ? (
              <>
                <Spinner className="size-4" />
                <span>Explorando terreno...</span>
              </>
            ) : (
              <span>Explorar terreno</span>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Modal / Diálogo de Encuentro con Criatura */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-destructive font-bold text-center">
              ¡Encuentro Silvestre!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-center">
              {eventoEncuentro?.mensaje ?? "¡Una criatura hostil bloquea tu sendero!"}
            </DialogDescription>
          </DialogHeader>

          {eventoEncuentro?.encuentro?.especie && (
            <div className="p-4 bg-muted/50 rounded border border-border my-2 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-base text-foreground">
                  {eventoEncuentro.encuentro.especie.nombre}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Nv. {eventoEncuentro.encuentro.especie.nivel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Salud inicial: {eventoEncuentro.encuentro.especie.hpActual} /{" "}
                {eventoEncuentro.encuentro.especie.hpMaximo} HP
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="w-full sm:w-auto flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleIniciarCombate}
            >
              Entrar en Combate
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex-1"
              onClick={() => setModalAbierto(false)}
            >
              Mantener distancia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal / Diálogo de Reanudación de Combate Activo */}
      <Dialog open={modalReanudacion} onOpenChange={setModalReanudacion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-primary font-bold text-center">
              ¡Combate Activo Pendiente!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-center">
              Tienes un encuentro en curso con{" "}
              <strong className="text-foreground">{nombreRivalReanudado}</strong> que no ha sido
              resuelto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="w-full sm:w-auto flex-1"
              onClick={() => {
                setModalReanudacion(false);
                navigate("/combate");
              }}
            >
              Reanudar Combate
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex-1"
              onClick={() => setModalReanudacion(false)}
            >
              Cerrar aviso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaExploracion;
