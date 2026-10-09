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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import {
  api,
  type EncuentroActivo,
  type CriaturaCombateRival,
  type CriaturaCombateAliada,
  type ItemInventario,
  ErrorApi,
} from "@/api";

export function PantallaCombate() {
  const navigate = useNavigate();
  const [encuentro, setEncuentro] = useState<EncuentroActivo | null>(null);
  const [rival, setRival] = useState<CriaturaCombateRival | null>(null);
  const [aliado, setAliado] = useState<CriaturaCombateAliada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [porcentajeXp, setPorcentajeXp] = useState(0);
  const [subioNivel, setSubioNivel] = useState(false);
  const [bitacoraCombate, setBitacoraCombate] = useState<string[]>([]);
  const [combateFinalizado, setCombateFinalizado] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState<"VICTORIA" | "DERROTA" | "CAPTURADO" | null>(null);
  const [talismanes, setTalismanes] = useState<ItemInventario[]>([]);
  const [modalCapturaAbierto, setModalCapturaAbierto] = useState(false);
  const [talismanSeleccionado, setTalismanSeleccionado] = useState<string>("talisman-basico");

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
            `Turno ${datos.turno}: ¡Un ${datos.criaturaRival.nombre} salvaje (Nv. ${datos.criaturaRival.nivel}) está frente a ti!`,
            `¡Tu aliada es ${datos.criaturaAliada.nombre} (Nv. ${datos.criaturaAliada.nivel})!`,
          ]);
        }

        // Cargar talismanes para captura
        try {
          const inv = await api.obtenerInventario();
          if (!cancelado) {
            const itemsTalisman = inv.items.filter((i) => i.tipo === "CAPTURA" && i.cantidad > 0);
            setTalismanes(itemsTalisman);
            if (itemsTalisman.length > 0) {
              setTalismanSeleccionado(itemsTalisman[0].codigo);
            }
          }
        } catch {
          // ignora fallo no crítico de inventario
        }
      } catch (error) {
        if (!cancelado) {
          if (error instanceof ErrorApi) {
            if (error.codigo === "ENCUENTRO_NO_ENCONTRADO" || error.estado === 404) {
              toast.info("No tienes ningún combate pendiente.");
              navigate("/exploracion");
              return;
            }
            if (error.estado === 401) {
              navigate("/ingreso");
              return;
            }
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

      // 1. Aplicar de inmediato el impacto del jugador
      const mensajeJugador = `Tu criatura usó ${resultado.accionJugador.movimiento} causando ${resultado.accionJugador.danoCausado} de daño.`;
      setBitacoraCombate((prev) => [mensajeJugador, ...prev]);

      if (typeof resultado.accionJugador.hpRestanteRival === "number" && rival) {
        setRival({
          ...rival,
          hpActual: Math.max(0, resultado.accionJugador.hpRestanteRival),
        });
      }

      // 2. Si el rival sobrevive y contraatacó, pausar la UI 800ms manteniendo procesandoAccion=true
      if (resultado.accionRival && aliado) {
        await new Promise((resolver) => setTimeout(resolver, 800));

        const mensajeRival = `El rival respondió con ${resultado.accionRival.movimiento} causando ${resultado.accionRival.danoCausado} de daño.`;
        setBitacoraCombate((prev) => [mensajeRival, ...prev]);

        if (typeof resultado.accionRival.hpRestanteAliado === "number") {
          setAliado({
            ...aliado,
            hpActual: Math.max(0, resultado.accionRival.hpRestanteAliado),
          });
        }
      }

      // 3. Evaluación del estado final devuelto por el servidor
      if (resultado.estado === "VICTORIA") {
        setBitacoraCombate((prev) => [
          "¡Victoria! La criatura enemiga ha caído debilitada.",
          ...prev,
        ]);
        setCombateFinalizado(true);
        setEstadoFinal("VICTORIA");
        if (resultado.resultadoFinal?.subioNivel) {
          setSubioNivel(true);
          setPorcentajeXp(100);
          toast.success(
            `¡Tu criatura subió al nivel ${resultado.resultadoFinal.nivelNuevo ?? "superior"}!`,
          );
        } else if (resultado.resultadoFinal?.experienciaGanada) {
          toast.success(`¡Ganaste ${resultado.resultadoFinal.experienciaGanada} XP!`);
        }
      } else if (resultado.estado === "DERROTA") {
        setBitacoraCombate((prev) => [
          "Tu criatura ha quedado fuera de combate.",
          ...prev,
        ]);
        setCombateFinalizado(true);
        setEstadoFinal("DERROTA");
        toast.error("Has sido derrotado. Viaja al santuario a curar a tu equipo.");
      }
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

  const abrirSelectorCaptura = () => {
    if (talismanes.length === 0) {
      toast.error("No tienes talismanes de captura en tu inventario. Visita la tienda.");
      return;
    }
    setModalCapturaAbierto(true);
  };

  const ejecutarCaptura = async () => {
    if (!encuentro) return;
    setModalCapturaAbierto(false);
    try {
      setProcesandoAccion(true);
      const resultado = await api.capturar({
        encuentroId: encuentro.encuentroId,
        itemCodigo: talismanSeleccionado,
      });

      if (resultado.exito) {
        const destino = resultado.destinoCaptura === "EQUIPO" ? "tu equipo activo" : "el almacén";
        toast.success(`¡Captura exitosa! ${resultado.criaturaCapturada?.nombre ?? "La criatura"} fue enviada a ${destino}.`);
        setBitacoraCombate((prev) => [resultado.mensaje, ...prev]);
        setCombateFinalizado(true);
        setEstadoFinal("CAPTURADO");
      } else {
        toast.error(resultado.mensaje || "El talismán falló y la criatura se resistió.");
        const mensajesFallo = [resultado.mensaje || "La criatura se resistió a la captura."];
        if (resultado.contraataqueRival && aliado) {
          mensajesFallo.push(
            `El rival contraatacó con ${resultado.contraataqueRival.movimiento} causando ${resultado.contraataqueRival.danoCausado} de daño.`,
          );
          if (typeof resultado.contraataqueRival.hpRestanteAliado === "number") {
            setAliado({
              ...aliado,
              hpActual: Math.max(0, resultado.contraataqueRival.hpRestanteAliado),
            });
          }
        }
        setBitacoraCombate((prev) => [...mensajesFallo, ...prev]);
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
      } else {
        toast.error("No lograste escapar. El combate continúa.");
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
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Sincronizando estado del combate con el servidor...
        </p>
      </div>
    );
  }

  const porcentajeHpAliado = Math.round((aliado.hpActual / aliado.hpMaximo) * 100);
  const esTurnoJugador = encuentro?.esTurnoJugador ?? true;

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
                Turno {encuentro?.turno ?? 1}
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
                {estadoFinal === "VICTORIA"
                  ? "¡Has ganado el combate! Victoria registrada."
                  : estadoFinal === "CAPTURADO"
                  ? "¡Criatura capturada con éxito!"
                  : "El combate ha finalizado por derrota."}
              </span>
              <div className="flex gap-2">
                {estadoFinal === "DERROTA" ? (
                  <Button
                    onClick={() => navigate("/curacion")}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Ir a Centro de Curación
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/exploracion")}
                      className="w-full sm:w-auto"
                    >
                      Continuar Explorando
                    </Button>
                    <Button
                      onClick={() => navigate("/hub")}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Volver al Hub
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
              <Button
                disabled={procesandoAccion || !esTurnoJugador}
                onClick={() => handleAtacar(0)}
                className="flex items-center justify-center gap-2"
              >
                {procesandoAccion ? <Spinner className="size-4" /> : "Atacar"}
              </Button>

              <Button
                variant="secondary"
                disabled={procesandoAccion || !esTurnoJugador}
                onClick={abrirSelectorCaptura}
                className="flex items-center justify-center gap-2"
              >
                {procesandoAccion ? <Spinner className="size-4" /> : "Capturar (Talismán)"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={procesandoAccion || !esTurnoJugador}
                    className="flex items-center justify-center gap-2"
                  >
                    Huir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Deseas retirarte del combate?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Intentarás escapar hacia una posición segura en la ruta silvestre.
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

      {/* Modal de Selección de Talismán de Captura */}
      <Dialog open={modalCapturaAbierto} onOpenChange={setModalCapturaAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-primary">
              Seleccionar Talismán de Captura
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Elige el talismán que usarás para intentar sintonizar y capturar al rival.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {talismanes.map((item) => (
              <label
                key={item.codigo}
                className={`flex items-center justify-between p-3 border-2 rounded cursor-pointer transition-colors ${
                  talismanSeleccionado === item.codigo
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="talisman"
                    value={item.codigo}
                    checked={talismanSeleccionado === item.codigo}
                    onChange={() => setTalismanSeleccionado(item.codigo)}
                    className="accent-primary"
                  />
                  <span className="font-semibold text-xs text-foreground">
                    {item.nombre}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  x{item.cantidad} disponibles
                </Badge>
              </label>
            ))}
          </div>

          <DialogFooter className="flex gap-2">
            <Button className="flex-1" onClick={ejecutarCaptura}>
              Lanzar Talismán
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setModalCapturaAbierto(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaCombate;
