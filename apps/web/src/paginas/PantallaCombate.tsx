import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
import EnemyHealthDisplay from "@/components/ui/8bit/enemy-health-display";
import HealthBar from "@/components/ui/8bit/health-bar";
import XpBar from "@/components/ui/8bit/xp-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/8bit/alert-dialog";
import {
  api,
  type EncuentroActivo,
  type CriaturaCombateRival,
  type CriaturaCombateAliada,
  ErrorApi,
} from "@/api";

export function PantallaCombate() {
  const navigate = useNavigate();
  const [encuentro, setEncuentro] = useState<EncuentroActivo | null>(null);
  const [rival, setRival] = useState<CriaturaCombateRival | null>(null);
  const [aliado, setAliado] = useState<CriaturaCombateAliada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [porcentajeXp, setPorcentajeXp] = useState(60);
  const [subioNivel, setSubioNivel] = useState(false);
  const [bitacoraCombate, setBitacoraCombate] = useState<string[]>([]);
  const [combateFinalizado, setCombateFinalizado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function inicializarCombate() {
      try {
        const datos = await api.obtenerEncuentroActivo();
        if (!cancelado) {
          setEncuentro(datos);
          setRival(datos.criaturaRival);
          setAliado(datos.criaturaAliada);
          setBitacoraCombate([
            `¡Un ${datos.criaturaRival.nombre} salvaje (Nv. ${datos.criaturaRival.nivel}) apareció!`,
            `¡Adelante, ${datos.criaturaAliada.nombre}!`,
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          if (error instanceof ErrorApi) {
            toast.error(error.message);
          } else {
            toast.error("Error al cargar los datos del combate activo.");
          }
          navigate("/exploracion");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    inicializarCombate();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const handleAtacar = async (movimientoIndice = 0) => {
    if (!encuentro) return;
    try {
      setProcesandoAccion(true);
      const resultado = await api.atacar({
        encuentroId: encuentro.encuentroId,
        movimientoIndice,
      });

      const nuevosMensajes: string[] = [];

      // Registro de acción del jugador
      nuevosMensajes.push(
        `Tu criatura usó ${resultado.accionJugador.movimiento} causando ${resultado.accionJugador.danoCausado} de daño.`,
      );

      // Actualizar salud del rival según lo recibido por la API
      if (typeof resultado.accionJugador.hpRestanteRival === "number" && rival) {
        setRival({
          ...rival,
          hpActual: Math.max(0, resultado.accionJugador.hpRestanteRival),
        });
      }

      // Registro de acción del rival si contraatacó
      if (resultado.accionRival && aliado) {
        nuevosMensajes.push(
          `El rival respondió con ${resultado.accionRival.movimiento} causando ${resultado.accionRival.danoCausado} de daño.`,
        );
        if (typeof resultado.accionRival.hpRestanteAliado === "number") {
          setAliado({
            ...aliado,
            hpActual: Math.max(0, resultado.accionRival.hpRestanteAliado),
          });
        }
      }

      // Evaluación del estado devuelto por la API
      if (resultado.estado === "VICTORIA") {
        nuevosMensajes.push("¡Victoria! La criatura enemiga ha caído debilitada.");
        setCombateFinalizado(true);
        if (resultado.resultadoFinal?.subioNivel) {
          setSubioNivel(true);
          setPorcentajeXp(100);
          toast.success("¡Tu criatura ha subido de nivel!");
        }
      } else if (resultado.estado === "DERROTA") {
        nuevosMensajes.push("Tu criatura ha quedado fuera de combate.");
        setCombateFinalizado(true);
        toast.error("Has sido derrotado. Regresa a Villa Serena a recuperarte.");
      }

      setBitacoraCombate((prev) => [...nuevosMensajes, ...prev]);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al ejecutar el ataque.");
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleCapturar = async () => {
    if (!encuentro) return;
    try {
      setProcesandoAccion(true);
      const resultado = await api.capturar({
        encuentroId: encuentro.encuentroId,
        itemCodigo: "talisman-basico",
      });

      if (resultado.exito) {
        toast.success(resultado.mensaje);
        setBitacoraCombate((prev) => [resultado.mensaje, ...prev]);
        setCombateFinalizado(true);
      } else {
        toast.error(resultado.mensaje || "El talismán no logró contener a la criatura.");
        setBitacoraCombate((prev) => [
          resultado.mensaje || "La criatura se resistió a la captura.",
          ...prev,
        ]);
      }
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al intentar la captura.");
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleHuir = async () => {
    if (!encuentro) return;
    try {
      setProcesandoAccion(true);
      const resultado = await api.huir({
        encuentroId: encuentro.encuentroId,
      });

      if (resultado.exito) {
        toast.info(resultado.mensaje || "Has escapado exitosamente del combate.");
        navigate("/exploracion");
      }
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No lograste huir del combate.");
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (cargando || !rival || !aliado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner className="size-8" />
        <p className="text-sm font-semibold text-muted-foreground">
          Preparando campo de batalla...
        </p>
      </div>
    );
  }

  const porcentajeHpAliado = Math.round((aliado.hpActual / aliado.hpMaximo) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Campo de Batalla */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel Rival */}
        <Card className="border-2 border-destructive/60 bg-card">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="destructive">Rival Silvestre</Badge>
              <span className="text-xs font-mono text-muted-foreground">
                Turno del combate
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <EnemyHealthDisplay
              enemyName={rival.nombre}
              level={rival.nivel}
              currentHealth={rival.hpActual}
              maxHealth={rival.hpMaximo}
              variant="retro"
              textColor="red"
            />
            <div className="p-3 bg-muted/40 rounded text-center text-xs text-muted-foreground font-mono">
              Salud Rival: {rival.hpActual} / {rival.hpMaximo} HP
            </div>
          </CardContent>
        </Card>

        {/* Panel Aliado */}
        <Card className="border-2 border-primary/60 bg-card">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="default">Tu Criatura</Badge>
              <span className="text-xs font-bold text-foreground font-mono">
                Nv. {aliado.nivel}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary">{aliado.nombre}</span>
                <span className="font-mono text-muted-foreground">
                  {aliado.hpActual} / {aliado.hpMaximo} HP
                </span>
              </div>
              <HealthBar
                value={porcentajeHpAliado}
                variant="retro"
                className="h-4"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Experiencia (XP)</span>
                <span className="font-mono">{porcentajeXp} %</span>
              </div>
              <XpBar
                value={porcentajeXp}
                variant="retro"
                className="h-3"
                levelUpMessage={subioNivel ? "¡SUBIÓ DE NIVEL!" : undefined}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bitácora Visual de Combate */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Bitácora de Combate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="bg-muted/30 p-3 rounded border border-border/60 max-h-36 overflow-y-auto space-y-1 text-xs font-mono">
            {bitacoraCombate.map((linea, index) => (
              <p key={index} className="leading-relaxed">
                <span className="text-primary font-bold">›</span> {linea}
              </p>
            ))}
          </div>
        </CardContent>

        {/* Acciones de Combate */}
        <CardFooter className="p-3 sm:p-4 border-t border-border/60">
          {combateFinalizado ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-semibold text-primary">
                El encuentro ha finalizado.
              </span>
              <Button
                onClick={() => navigate("/exploracion")}
                className="w-full sm:w-auto"
              >
                Regresar a Exploración
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
              <Button
                disabled={procesandoAccion}
                onClick={() => handleAtacar(0)}
                className="flex items-center justify-center gap-2"
              >
                {procesandoAccion ? <Spinner className="size-4" /> : "Atacar"}
              </Button>

              <Button
                variant="secondary"
                disabled={procesandoAccion}
                onClick={handleCapturar}
                className="flex items-center justify-center gap-2"
              >
                {procesandoAccion ? <Spinner className="size-4" /> : "Capturar (Talismán)"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={procesandoAccion}
                    className="flex items-center justify-center gap-2"
                  >
                    Huir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Deseas retirarte del combate?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Intentarás escapar hacia una posición segura en la ruta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Permanecer</AlertDialogCancel>
                    <AlertDialogAction onClick={handleHuir}>
                      Confirmar huida
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default PantallaCombate;
