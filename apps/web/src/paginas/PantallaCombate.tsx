import { useEffect, useState, useCallback, useRef } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import {
  api,
  type EncuentroActivo,
  type CriaturaCombateRival,
  type CriaturaCombateAliada,
  type ItemInventario,
  type CriaturaEquipo,
  type CriaturaCapturada,
  type AccionCombate,
  type EfectoFinDeTurno,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenCriatura,
  obtenerImagenObjeto,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import { Lock, Crown, ChevronsUp, ChevronsDown, Sparkles } from "lucide-react";
import { TRADUCCION_ELEMENTOS } from "@/lib/catalogo-historial";
import {
  construirSlotsTacticos,
  ETIQUETA_EFECTIVIDAD,
  sonidoDeGolpe,
} from "@/lib/combate-tactico";
import {
  BarraResonancia,
  InsigniasEstado,
} from "@/components/combate/PanelTactico";

interface RecompensasVictoria {
  xpGanada: number;
  monedasGanadas: number;
  subioNivel: boolean;
  nivelNuevo?: number;
}

export function PantallaCombate() {
  const navigate = useNavigate();

  // Estados nucleares del encuentro
  const [encuentro, setEncuentro] = useState<EncuentroActivo | null>(null);
  const [rival, setRival] = useState<CriaturaCombateRival | null>(null);
  const [aliado, setAliado] = useState<CriaturaCombateAliada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [bitacoraCombate, setBitacoraCombate] = useState<string[]>([]);
  const [combateFinalizado, setCombateFinalizado] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState<"VICTORIA" | "DERROTA" | "CAPTURADO" | null>(null);

  // Estados visuales y micro-interacciones (Fase 10 - docs/DESIGN.md)
  const [animacionRival, setAnimacionRival] = useState("");
  const [animacionAliado, setAnimacionAliado] = useState("");
  const [danoFlotanteRival, setDanoFlotanteRival] = useState<number | null>(null);
  const [danoFlotanteAliado, setDanoFlotanteAliado] = useState<number | null>(null);
  const [curacionFlotanteAliado, setCuracionFlotanteAliado] = useState<number | null>(null);
  const [secuenciaCaptura, setSecuenciaCaptura] = useState(false);

  // Recompensas y resolución
  const [porcentajeXp, setPorcentajeXp] = useState(0);
  const [subioNivel, setSubioNivel] = useState(false);
  const [recompensasVictoria, setRecompensasVictoria] = useState<RecompensasVictoria | null>(null);
  const [criaturaCapturada, setCriaturaCapturada] = useState<CriaturaCapturada | null>(null);
  const [destinoCaptura, setDestinoCaptura] = useState<"EQUIPO" | "ALMACEN" | null>(null);

  // Menús tácticos y modales
  const [panelMovimientosAbierto, setPanelMovimientosAbierto] = useState(false);
  const [modalObjetosAbierto, setModalObjetosAbierto] = useState(false);
  const [modalCambioCriaturaAbierto, setModalCambioCriaturaAbierto] = useState(false);
  const [modalCapturaAbierto, setModalCapturaAbierto] = useState(false);

  // Inventario y equipo
  const [talismanes, setTalismanes] = useState<ItemInventario[]>([]);
  const [itemsCuracion, setItemsCuracion] = useState<ItemInventario[]>([]);
  const [equipoCriaturas, setEquipoCriaturas] = useState<CriaturaEquipo[]>([]);
  const [talismanSeleccionado, setTalismanSeleccionado] = useState<string>("talisman-basico");

  useEffect(() => {
    let cancelado = false;

    async function sincronizar() {
      try {
        const datos = await api.obtenerEncuentroActivo();
        if (cancelado) return;
        setEncuentro(datos);
        setRival(datos.criaturaRival);
        setAliado(datos.criaturaAliada);

        // Reanudación fiel de bitácora
        if (datos.bitacora && datos.bitacora.length > 0) {
          setBitacoraCombate(datos.bitacora);
        } else {
          setBitacoraCombate([
            `¡Tu criatura aliada es ${datos.criaturaAliada?.nombre ?? "Compañero"} (Nv. ${datos.criaturaAliada?.nivel ?? 1})!`,
            `Turno ${datos.turno}: ¡Un ${datos.criaturaRival.nombre} salvaje (Nv. ${datos.criaturaRival.nivel}) está frente a ti!`,
          ]);
        }

        // Sincronización fiel del progreso de XP calculado por el servidor (§2.4)
        if (datos.criaturaAliada) {
          setPorcentajeXp(datos.criaturaAliada.porcentajeXp ?? 0);
        }

        try {
          const inv = await api.obtenerInventario();
          if (cancelado) return;
          const listaTalismanes = inv.items.filter((i) => i.tipo === "CAPTURA" && i.cantidad > 0);
          const listaCuracion = inv.items.filter((i) => i.tipo === "CURACION" && i.cantidad > 0);
          setTalismanes(listaTalismanes);
          setItemsCuracion(listaCuracion);
          if (listaTalismanes.length > 0) {
            setTalismanSeleccionado(listaTalismanes[0].codigo);
          }
        } catch {
          // simplificacion: tolerancia a fallo en lectura de inventario secundario
        }

        try {
          const respEquipo = await api.obtenerEquipo();
          if (cancelado) return;
          setEquipoCriaturas(respEquipo.criaturas);
        } catch {
          // simplificacion: tolerancia a fallo en lectura de equipo secundario
        }
      } catch (error) {
        if (cancelado) return;
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
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    sincronizar();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  // Cerrojo síncrono para hardening estricto contra doble clic rápido
  const cerrojoAccion = useRef(false);

  // Recarga fiel tras relevo de criatura aliada
  const refrescarCombate = useCallback(async () => {
    try {
      const [datos, respEquipo] = await Promise.all([
        api.obtenerEncuentroActivo(),
        api.obtenerEquipo(),
      ]);
      setEncuentro(datos);
      setRival(datos.criaturaRival);
      setAliado(datos.criaturaAliada);

      if (datos.criaturaAliada) {
        setPorcentajeXp(datos.criaturaAliada.porcentajeXp ?? 0);
      }

      if (datos.bitacora && datos.bitacora.length > 0) {
        setBitacoraCombate(datos.bitacora);
      }
      setEquipoCriaturas(respEquipo.criaturas);
    } catch {
      // simplificacion: tolerancia a fallo en refresco secundario
    }
  }, []);

  // Auxiliar unificado para animar contraataque rival y efectos fin de turno (DoT)
  const reproducirContraataqueYDoT = async (
    contraataque: AccionCombate | null | undefined,
    efectosFinDeTurno: EfectoFinDeTurno[] = [],
  ) => {
    if (contraataque && aliado) {
      await new Promise((resolver) => setTimeout(resolver, 600));

      if (contraataque.perdioTurno) {
        reproducirSonido("error");
      } else {
        reproducirSonido(sonidoDeGolpe(contraataque));
        setAnimacionAliado("anim-sacudida anim-parpadeo-dano");
        setDanoFlotanteAliado(contraataque.danoCausado);

        if (typeof contraataque.hpRestanteAliado === "number") {
          setAliado((prev) =>
            prev ? { ...prev, hpActual: Math.max(0, contraataque.hpRestanteAliado!) } : null,
          );
        }

        setTimeout(() => {
          setAnimacionAliado("");
          setDanoFlotanteAliado(null);
        }, 500);
      }
    }

    if (efectosFinDeTurno && efectosFinDeTurno.length > 0) {
      for (const efecto of efectosFinDeTurno) {
        await new Promise((resolver) => setTimeout(resolver, 400));
        reproducirSonido("dot");

        if (efecto.objetivo === "ALIADA") {
          setAnimacionAliado("anim-parpadeo-dano");
          setDanoFlotanteAliado(efecto.dano);
          setAliado((prev) =>
            prev ? { ...prev, hpActual: Math.max(0, efecto.hpRestante) } : null,
          );
          setTimeout(() => {
            setAnimacionAliado("");
            setDanoFlotanteAliado(null);
          }, 450);
        } else {
          setAnimacionRival("anim-parpadeo-dano");
          setDanoFlotanteRival(efecto.dano);
          setRival((prev) =>
            prev ? { ...prev, hpActual: Math.max(0, efecto.hpRestante) } : null,
          );
          setTimeout(() => {
            setAnimacionRival("");
            setDanoFlotanteRival(null);
          }, 450);
        }
      }
    }
  };

  // Manejador de Ataque con selector de movimientos tácticos
  const handleAtacar = async (movimientoIndice = 0) => {
    if (!encuentro || cerrojoAccion.current || procesandoAccion || combateFinalizado) return;

    cerrojoAccion.current = true;
    setPanelMovimientosAbierto(false);
    setProcesandoAccion(true);
    reproducirSonido("click");

    try {
      const resultado = await api.atacar({
        encuentroId: encuentro.encuentroId,
        movimientoIndice,
        turnoEsperado: encuentro.turno,
      });

      // Bitácora fiel: anteponer mensajes invertidos si el servidor los envió
      if (resultado.mensajes && resultado.mensajes.length > 0) {
        setBitacoraCombate((prev) => [...[...resultado.mensajes!].reverse(), ...prev]);
      } else if (resultado.accionJugador) {
        const mensajeJugador = `Tu criatura usó ${resultado.accionJugador.movimiento} causando ${resultado.accionJugador.danoCausado} de daño.`;
        setBitacoraCombate((prev) => [mensajeJugador, ...prev]);
      }

      // Animación de impacto del jugador sobre el rival
      const animarImpactoJugador = async () => {
        if (!resultado.accionJugador) return;
        if (resultado.accionJugador.perdioTurno) {
          reproducirSonido("error");
        } else {
          reproducirSonido(sonidoDeGolpe(resultado.accionJugador));
          setAnimacionRival("anim-sacudida anim-parpadeo-dano");
          setDanoFlotanteRival(resultado.accionJugador.danoCausado);

          if (typeof resultado.accionJugador.hpRestanteRival === "number" && rival) {
            setRival({
              ...rival,
              hpActual: Math.max(0, resultado.accionJugador.hpRestanteRival),
            });
          }

          await new Promise((resolver) => setTimeout(resolver, 500));
          setAnimacionRival("");
          setDanoFlotanteRival(null);
        }
      };

      // Animación de contraataque rival
      const animarContraataqueRival = async () => {
        if (!resultado.accionRival) return;
        await reproducirContraataqueYDoT(resultado.accionRival, []);
      };

      // Procesar recompensas de victoria
      const procesarVictoria = () => {
        reproducirSonido("victoria");
        setCombateFinalizado(true);
        setEstadoFinal("VICTORIA");

        const recompensa = resultado.progreso || resultado.recompensas || (
          typeof resultado.resultadoFinal === "object" ? resultado.resultadoFinal : null
        );

        if (recompensa) {
          const subio = Boolean(recompensa.subioNivel);
          const xp =
            "xpGanada" in recompensa
              ? recompensa.xpGanada
              : ("experienciaGanada" in recompensa
                ? (recompensa.experienciaGanada ?? 0)
                : 0);
          const monedas =
            "monedasGanadas" in recompensa ? (recompensa.monedasGanadas ?? 0) : 0;
          const nivelNuevo = recompensa.nivelNuevo;

          setRecompensasVictoria({
            xpGanada: xp,
            monedasGanadas: monedas,
            subioNivel: subio,
            nivelNuevo,
          });

          if (subio) {
            setSubioNivel(true);
            setPorcentajeXp(100);
            toast.success(`¡Tu criatura subió al nivel ${nivelNuevo ?? "superior"}!`);
          } else if (xp > 0 && aliado) {
            const nuevaXp = (aliado.experiencia ?? 0) + xp;
            const nuevoPorcentaje =
              "porcentajeXp" in recompensa && typeof recompensa.porcentajeXp === "number"
                ? recompensa.porcentajeXp
                : porcentajeXp;
            setAliado({ ...aliado, experiencia: nuevaXp, porcentajeXp: nuevoPorcentaje });
            setPorcentajeXp(nuevoPorcentaje);
            toast.success(`¡Ganaste ${xp} XP y ${monedas} monedas!`);
          }
        }
      };

      // Secuencia cronológica estricta según prioridad de velocidad
      if (resultado.rivalActuoPrimero) {
        // 1. El rival actuó primero
        await animarContraataqueRival();

        // 2. Si la aliada quedó debilitada antes de responder
        if (resultado.resultadoFinal === "ALIADA_DEBILITADA" || resultado.estado === "DERROTA") {
          if (resultado.estado === "DERROTA") {
            reproducirSonido("error");
            setCombateFinalizado(true);
            setEstadoFinal("DERROTA");
            toast.error("Has sido derrotado. Viaja al santuario a curar a tu equipo.");
            return;
          }

          toast.info("¡Tu criatura cayó debilitada! Entra la siguiente criatura activa del equipo.");
          await refrescarCombate();
          return;
        }

        // 3. Si sobrevivió, la aliada responde con su ataque
        if (resultado.accionJugador) {
          await animarImpactoJugador();
        }
      } else {
        // 1. La aliada actuó primero
        if (resultado.accionJugador) {
          await animarImpactoJugador();
        }

        if (resultado.estado === "VICTORIA") {
          procesarVictoria();
          return;
        }

        // 2. El rival contraataca
        if (resultado.accionRival) {
          await animarContraataqueRival();
        }

        if (resultado.resultadoFinal === "ALIADA_DEBILITADA" || resultado.estado === "DERROTA") {
          if (resultado.estado === "DERROTA") {
            reproducirSonido("error");
            setCombateFinalizado(true);
            setEstadoFinal("DERROTA");
            toast.error("Has sido derrotado. Viaja al santuario a curar a tu equipo.");
            return;
          }

          toast.info("¡Tu criatura cayó debilitada! Entra la siguiente criatura activa del equipo.");
          await refrescarCombate();
          return;
        }
      }

      // 4. Si terminó en victoria tras la respuesta
      if (resultado.estado === "VICTORIA") {
        procesarVictoria();
        return;
      }

      // 5. Efectos fin de turno (DoT de quemadura/veneno)
      if (resultado.efectosFinDeTurno && resultado.efectosFinDeTurno.length > 0) {
        await reproducirContraataqueYDoT(null, resultado.efectosFinDeTurno);
      }

      // 6. Reconciliación fiel de estado con el servidor (D-7)
      if (resultado.estado === "EN_CURSO") {
        await refrescarCombate();
      }
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === "TURNO_DESACTUALIZADO") {
        toast.info("El combate avanzó en otra pestaña. Sincronizando...");
        await refrescarCombate();
      } else if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al ejecutar el ataque.");
      }
    } finally {
      cerrojoAccion.current = false;
      setProcesandoAccion(false);
    }
  };

  // Manejador de Uso de Objeto de Curación en combate
  const handleUsarObjetoCuracion = async (itemCodigo: string) => {
    if (!aliado || procesandoAccion || combateFinalizado) return;

    setModalObjetosAbierto(false);
    setProcesandoAccion(true);
    reproducirSonido("click");

    try {
      const resultado = await api.usarItem({
        itemCodigo,
        criaturaId: aliado.criaturaId,
      });

      const curacionEfectiva = resultado.hpNuevo - resultado.hpPrevio;
      reproducirSonido("exito");
      setAnimacionAliado("anim-restauracion-salud");
      setCuracionFlotanteAliado(curacionEfectiva);

      setAliado({
        ...aliado,
        hpActual: resultado.hpNuevo,
      });

      setBitacoraCombate((prev) => [
        `Usaste un objeto curativo restaurando +${curacionEfectiva} HP a tu criatura.`,
        ...prev,
      ]);
      toast.success(`+${curacionEfectiva} HP restaurados.`);

      setTimeout(() => {
        setAnimacionAliado("");
        setCuracionFlotanteAliado(null);
      }, 700);

      // Refrescar inventario
      const inv = await api.obtenerInventario();
      setItemsCuracion(inv.items.filter((i) => i.tipo === "CURACION" && i.cantidad > 0));
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo usar el objeto curativo.");
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejador de Cambio de Criatura Activa
  const handleCambiarCriatura = async (nuevaCriaturaId: string) => {
    if (procesandoAccion || combateFinalizado) return;

    setModalCambioCriaturaAbierto(false);
    setProcesandoAccion(true);
    reproducirSonido("click");

    try {
      const criaturasIdsOrdenadas = [
        nuevaCriaturaId,
        ...equipoCriaturas
          .map((c) => c.criaturaId)
          .filter((id) => id !== nuevaCriaturaId),
      ];

      await api.actualizarOrdenEquipo({
        criaturaIds: criaturasIdsOrdenadas,
      });

      reproducirSonido("confirmar");
      toast.success("¡Criatura al frente cambiada con éxito!");

      // Recargar datos actualizados del encuentro con la nueva criatura líder y su XP exacta
      await refrescarCombate();

      const criaturaNueva = equipoCriaturas.find((c) => c.criaturaId === nuevaCriaturaId);
      setBitacoraCombate((prev) => [
        `¡Cambiaste al frente de combate a ${criaturaNueva?.nombre ?? "tu compañera"}!`,
        ...prev,
      ]);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo cambiar de criatura.");
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Secuencia de Captura con Suspenso Visual e Incertidumbre (impeccable animate)
  const ejecutarCaptura = async () => {
    if (!encuentro || cerrojoAccion.current || procesandoAccion || combateFinalizado) return;

    cerrojoAccion.current = true;
    setModalCapturaAbierto(false);
    setProcesandoAccion(true);
    setSecuenciaCaptura(true);
    reproducirSonido("seleccionar");

    // Suspenso visual de tirada de dados retro con pulsos de incertidumbre (1200 ms)
    await new Promise((resolver) => setTimeout(resolver, 1200));

    try {
      const resultado = await api.capturar({
        encuentroId: encuentro.encuentroId,
        itemCodigo: talismanSeleccionado,
        turnoEsperado: encuentro.turno,
      });

      setSecuenciaCaptura(false);

      if (resultado.exito) {
        reproducirSonido("captura");
        const destino = resultado.destinoCaptura === "EQUIPO" ? "tu equipo activo" : "el almacén";
        toast.success(`¡Captura exitosa! Criatura enviada a ${destino}.`);

        setBitacoraCombate((prev) => [resultado.mensaje, ...prev]);
        setCombateFinalizado(true);
        setEstadoFinal("CAPTURADO");
        setDestinoCaptura(resultado.destinoCaptura || "EQUIPO");
        if (resultado.criaturaCapturada) {
          setCriaturaCapturada(resultado.criaturaCapturada);
        }
      } else {
        reproducirSonido("error");
        toast.error(resultado.mensaje || "El talismán falló y la criatura se resistió.");

        if (resultado.mensajes && resultado.mensajes.length > 0) {
          setBitacoraCombate((prev) => [...[...resultado.mensajes!].reverse(), ...prev]);
        } else {
          setBitacoraCombate((prev) => [
            resultado.mensaje || "La criatura se resistió a la captura.",
            ...prev,
          ]);
        }

        await reproducirContraataqueYDoT(
          resultado.contraataqueRival,
          resultado.efectosFinDeTurno,
        );

        if (
          (resultado.estado as string) === "DERROTA" ||
          (typeof resultado.contraataqueRival?.hpRestanteAliado === "number" &&
            resultado.contraataqueRival.hpRestanteAliado <= 0)
        ) {
          reproducirSonido("error");
          setCombateFinalizado(true);
          setEstadoFinal("DERROTA");
          toast.error("Tu criatura ha quedado fuera de combate tras el contraataque.");
        } else if (resultado.estado === "EN_CURSO") {
          await refrescarCombate();
        }

        // Refrescar inventario de talismanes
        const inv = await api.obtenerInventario();
        setTalismanes(inv.items.filter((i) => i.tipo === "CAPTURA" && i.cantidad > 0));
      }
    } catch (error) {
      setSecuenciaCaptura(false);
      if (error instanceof ErrorApi && error.codigo === "TURNO_DESACTUALIZADO") {
        toast.info("El combate avanzó en otra pestaña. Sincronizando...");
        await refrescarCombate();
      } else if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al intentar la captura.");
      }
    } finally {
      cerrojoAccion.current = false;
      setProcesandoAccion(false);
    }
  };

  // Manejador de Huida del Combate con aplicación inmediata de daño de contraataque
  const handleHuir = async () => {
    if (!encuentro || cerrojoAccion.current || procesandoAccion || combateFinalizado) return;

    cerrojoAccion.current = true;
    setProcesandoAccion(true);
    reproducirSonido("click");

    try {
      const resultado = await api.huir({
        encuentroId: encuentro.encuentroId,
        turnoEsperado: encuentro.turno,
      });

      if (resultado.exito) {
        reproducirSonido("paso");
        toast.info(resultado.mensaje || "Has escapado exitosamente del combate.");
        navigate("/exploracion");
      } else {
        reproducirSonido("error");
        toast.error(resultado.mensaje || "No lograste escapar. El combate continúa.");

        if (resultado.mensajes && resultado.mensajes.length > 0) {
          setBitacoraCombate((prev) => [...[...resultado.mensajes!].reverse(), ...prev]);
        } else {
          setBitacoraCombate((prev) => [
            resultado.mensaje || "Intentaste huir pero el rival te bloqueó el paso.",
            ...prev,
          ]);
        }

        await reproducirContraataqueYDoT(
          resultado.contraataqueRival,
          resultado.efectosFinDeTurno,
        );

        if (
          resultado.estado === "DERROTA" ||
          (typeof resultado.contraataqueRival?.hpRestanteAliado === "number" &&
            resultado.contraataqueRival.hpRestanteAliado <= 0)
        ) {
          reproducirSonido("error");
          setCombateFinalizado(true);
          setEstadoFinal("DERROTA");
          toast.error("Tu criatura ha quedado fuera de combate tras el contraataque.");
        } else if (resultado.estado === "EN_CURSO") {
          await refrescarCombate();
        }
      }
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === "TURNO_DESACTUALIZADO") {
        toast.info("El combate avanzó en otra pestaña. Sincronizando...");
        await refrescarCombate();
      } else if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("No lograste huir del combate.");
      }
    } finally {
      cerrojoAccion.current = false;
      setProcesandoAccion(false);
    }
  };

  if (cargando || !rival || !aliado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground animate-pulse font-mono">
          Sincronizando estado del combate con el servidor...
        </p>
      </div>
    );
  }

  const porcentajeHpAliado = Math.round((aliado.hpActual / aliado.hpMaximo) * 100);
  const esTurnoJugador = encuentro?.esTurnoJugador ?? true;
  const movimientosAliados = aliado.movimientos && aliado.movimientos.length > 0
    ? aliado.movimientos
    : [{ nombre: "Golpe Firme", poder: 12, tipoAccion: "ATAQUE", slot: 1 }];
  const slotsTacticos = construirSlotsTacticos(movimientosAliados, aliado.resonancia ?? 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-0">
      {/* Barra de Estado Superior */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-bastion border-2 border-pixel shadow-pixel-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase font-mono">
            Encuentro Silvestre
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            Turno {encuentro?.turno ?? 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {procesandoAccion ? (
            <Badge variant="secondary" className="text-[10px] animate-pulse">
              Procesando acción...
            </Badge>
          ) : esTurnoJugador && !combateFinalizado ? (
            <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground anim-pulso-turno">
              Tu Turno
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Turno Rival
            </Badge>
          )}
        </div>
      </div>

      {/* CAMPO DE BATALLA ESTILO RPG CLÁSICO (16-bit Battle Arena) */}
      <div className="relative w-full rounded border-4 border-pixel bg-abismo p-4 sm:p-6 overflow-hidden shadow-pixel-md min-h-[320px] sm:min-h-[380px] flex flex-col justify-between">
        {/* Textura y efecto ambiental retro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-black/60 pointer-events-none" />

        {/* Capa de Incertidumbre de Captura */}
        {secuenciaCaptura && (
          <div className="absolute inset-0 z-30 bg-black/75 flex flex-col items-center justify-center gap-4 anim-revelacion-evento">
            <div className="size-20 sm:size-24 rounded-full border-4 border-pixel-dorado bg-bastion flex items-center justify-center anim-captura-incertidumbre shadow-pixel-lg">
              <img
                src={obtenerImagenObjeto(talismanSeleccionado)}
                alt="Talismán lanzado"
                onError={(e) => manejarErrorImagen(e, "objeto")}
                className="size-12 sm:size-16 pixelated object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="retro text-xs sm:text-sm text-pixel-dorado tracking-wider">
                Sintonizando talismán...
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Pulsos de resonancia con {rival.nombre}
              </p>
            </div>
          </div>
        )}

        {/* SECTOR RIVAL: Fondo / Arriba-Derecha */}
        <div className="relative z-10 flex flex-col items-end sm:flex-row sm:items-start sm:justify-end gap-3 sm:gap-6 self-end w-full sm:w-auto">
          {/* Placa de Vitalidad del Rival */}
          <div className="w-full sm:w-64 bg-bastion border-2 border-pixel p-2.5 shadow-pixel-sm space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {rival.esLegendaria && (
                  <span title="Criatura Legendaria" className="shrink-0">
                    <Crown className="size-3.5 text-amber-400 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
                  </span>
                )}
                <span className="font-bold text-xs truncate text-destructive">
                  {rival.nombre}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {rival.afinidad && TRADUCCION_ELEMENTOS[rival.afinidad] && (
                  <Badge
                    variant="outline"
                    className={`text-[8px] font-mono px-1 py-0 ${TRADUCCION_ELEMENTOS[rival.afinidad].clase}`}
                  >
                    {TRADUCCION_ELEMENTOS[rival.afinidad].nombre}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] font-mono">
                  Nv. {rival.nivel}
                </Badge>
              </div>
            </div>

            <EnemyHealthDisplay
              enemyName={rival.nombre}
              level={rival.nivel}
              currentHealth={rival.hpActual}
              maxHealth={rival.hpMaximo}
              variant="retro"
              textColor="red"
            />

            <InsigniasEstado estados={rival.estados} />
          </div>

          {/* Sprite del Rival con pedestal y efecto de daño */}
          <div className="relative flex flex-col items-center">
            {danoFlotanteRival !== null && (
              <span className="absolute -top-6 text-base sm:text-lg font-bold text-red-400 drop-shadow-[2px_2px_0_#000] anim-dano-flotante z-20 retro">
                -{danoFlotanteRival}
              </span>
            )}
            <div
              className={`size-28 sm:size-36 flex items-center justify-center transition-transform ${animacionRival}`}
            >
              <img
                src={obtenerImagenCriatura(rival.slug)}
                alt={rival.nombre}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                className="max-h-full max-w-full object-contain pixelated drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]"
              />
            </div>
            {/* Pedestal de sombra */}
            <div className="w-24 sm:w-32 h-3 sm:h-4 bg-bastion/80 border border-pixel rounded-full -mt-2 -z-0 blur-[0.5px]" />
          </div>
        </div>

        {/* SECTOR ALIADO: Primer Plano / Abajo-Izquierda */}
        <div className="relative z-10 flex flex-col items-start sm:flex-row sm:items-end gap-3 sm:gap-6 self-start w-full sm:w-auto mt-4 sm:mt-0">
          {/* Sprite del Aliado con pedestal y efecto de impacto/curación */}
          <div className="relative flex flex-col items-center order-2 sm:order-1">
            {danoFlotanteAliado !== null && (
              <span className="absolute -top-6 text-base sm:text-lg font-bold text-red-400 drop-shadow-[2px_2px_0_#000] anim-dano-flotante z-20 retro">
                -{danoFlotanteAliado}
              </span>
            )}
            {curacionFlotanteAliado !== null && (
              <span className="absolute -top-6 text-base sm:text-lg font-bold text-emerald-400 drop-shadow-[2px_2px_0_#000] anim-curacion-flotante z-20 retro">
                +{curacionFlotanteAliado} HP
              </span>
            )}
            <div
              className={`size-32 sm:size-40 flex items-center justify-center transition-transform ${animacionAliado}`}
            >
              <img
                src={obtenerImagenCriatura(aliado.slug)}
                alt={aliado.nombre}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                className="max-h-full max-w-full object-contain pixelated drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
              />
            </div>
            {/* Pedestal de sombra */}
            <div className="w-28 sm:w-36 h-3 sm:h-4 bg-bastion/80 border border-pixel rounded-full -mt-2 -z-0 blur-[0.5px]" />
          </div>

          {/* Placa de Vitalidad y XP del Aliado */}
          <div className="w-full sm:w-72 bg-bastion border-2 border-pixel p-3 shadow-pixel-sm space-y-2 order-1 sm:order-2">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="font-bold text-xs sm:text-sm text-primary tracking-wide truncate">
                  {aliado.nombre}
                </span>
                {aliado.afinidad && TRADUCCION_ELEMENTOS[aliado.afinidad] && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono px-1 py-0 shrink-0 ${TRADUCCION_ELEMENTOS[aliado.afinidad].clase}`}
                  >
                    {TRADUCCION_ELEMENTOS[aliado.afinidad].nombre}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                Nv. {aliado.nivel}
              </Badge>
            </div>

            {/* Barra de Salud del Aliado */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>HP</span>
                <span>
                  {aliado.hpActual} / {aliado.hpMaximo}
                </span>
              </div>
              <HealthBar
                value={porcentajeHpAliado}
                variant="retro"
                className="h-3 sm:h-3.5"
              />
            </div>

            {/* Barra de Resonancia Táctica (10 Bloques Ámbar) */}
            <BarraResonancia
              resonancia={aliado.resonancia ?? 0}
              deshabilitado={procesandoAccion || !esTurnoJugador}
              onDesatarInsignia={() => handleAtacar(3)}
            />

            {/* Insignias de Estados Activos Aliados */}
            <InsigniasEstado estados={aliado.estados} />

            {/* Barra de Experiencia (XP) precisa según escalado de nivel (§2.4) */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>EXP</span>
                <span>{porcentajeXp}%</span>
              </div>
              <XpBar
                value={porcentajeXp}
                variant="retro"
                className="h-2.5"
                levelUpMessage={subioNivel ? "¡SUBIÓ DE NIVEL!" : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BITÁCORA VISUAL DE COMBATE (Consola RPG de Pérgamo) */}
      <Card className="border-2 border-pixel bg-bastion shadow-pixel-sm">
        <CardHeader className="p-3 pb-1 border-b border-border/40 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider retro">
            Bitácora de Encuentro
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">
            {bitacoraCombate.length} eventos registrados
          </span>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="bg-abismo/80 p-2.5 rounded border border-border/40 max-h-32 sm:max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
            {bitacoraCombate.map((linea, index) => {
              const esAliado = linea.includes("Tu criatura") || linea.includes("Usaste");
              const esRival = linea.includes("El rival") || linea.includes("debilitada");
              const esCaptura = linea.includes("Captura") || linea.includes("talismán");

              return (
                <p key={index} className="leading-relaxed flex items-start gap-1.5">
                  <span
                    className={`font-bold ${
                      esAliado
                        ? "text-primary"
                        : esRival
                        ? "text-destructive"
                        : esCaptura
                        ? "text-pixel-dorado"
                        : "text-muted-foreground"
                    }`}
                  >
                    ›
                  </span>
                  <span
                    className={
                      index === 0
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {linea}
                  </span>
                </p>
              );
            })}
          </div>
        </CardContent>

        {/* PANEL TÁCTICO DE COMANDOS RETRO */}
        <CardFooter className="p-3 sm:p-4 border-t border-border/40 bg-panel/40">
          {combateFinalizado ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-primary text-center sm:text-left">
                {estadoFinal === "VICTORIA"
                  ? "¡Victoria consumada! El camino está despejado."
                  : estadoFinal === "CAPTURADO"
                  ? "¡Criatura capturada con éxito!"
                  : "Tu equipo ha quedado debilitado en combate."}
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                {estadoFinal === "DERROTA" ? (
                  <Button
                    onClick={() => navigate("/curacion")}
                    variant="destructive"
                    className="w-full sm:w-auto text-xs"
                  >
                    Ir a Centro de Curación
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/exploracion")}
                      className="flex-1 sm:flex-none text-xs"
                    >
                      Continuar Explorando
                    </Button>
                    <Button
                      onClick={() => navigate("/hub")}
                      variant="outline"
                      className="flex-1 sm:flex-none text-xs"
                    >
                      Volver al Hub
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-2">
              {/* Desplegable de Movimientos cuando se presiona Atacar */}
              {panelMovimientosAbierto && (
                <div className="p-2 bg-abismo border-2 border-primary/70 rounded space-y-2 anim-revelacion-evento">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <span className="text-[11px] font-bold text-primary retro">
                      Selecciona un Movimiento:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelMovimientosAbierto(false)}
                      className="h-6 px-2 text-[10px]"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {slotsTacticos.map((slotItem) => {
                      const { slot, movimiento: mov, bloqueado, esInsignia } = slotItem;
                      const esFuriaSlot4 = esInsignia;
                      const estaBloqueado = bloqueado;
                      const nombreMov =
                        mov?.nombre ??
                        (esInsignia ? "Movimiento Insignia" : `Movimiento ${slot}`);
                      const poder = mov?.poder ?? 10;
                      const etiquetaEfectividad = (encuentro?.efectividadAliadaSobreRival
                        ?.etiqueta as keyof typeof ETIQUETA_EFECTIVIDAD) || "NEUTRAL";
                      const textoChip = ETIQUETA_EFECTIVIDAD[etiquetaEfectividad];

                      return (
                        <Button
                          key={slot}
                          variant={estaBloqueado ? "outline" : esInsignia ? "default" : "secondary"}
                          size="sm"
                          disabled={procesandoAccion || estaBloqueado}
                          aria-disabled={estaBloqueado}
                          aria-busy={procesandoAccion}
                          onClick={() => !estaBloqueado && handleAtacar(slot - 1)}
                          aria-label={
                            estaBloqueado
                              ? `${nombreMov} bloqueado. Requiere Resonancia 100 %`
                              : `${nombreMov}, Potencia ${poder}${textoChip ? `, ${textoChip}` : ""}`
                          }
                          className={`flex flex-col items-start justify-between text-xs min-h-[58px] p-2 border border-pixel transition-all ${
                            estaBloqueado
                              ? "opacity-60 cursor-not-allowed bg-muted/20 border-dashed border-border/80 text-muted-foreground"
                              : esInsignia
                              ? "border-amber-400 bg-amber-500/20 hover:bg-amber-500/30 anim-pulso-resonancia motion-reduce:animate-none"
                              : "hover:border-primary active:scale-[0.98]"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-mono shrink-0 px-1 py-0 ${
                                  estaBloqueado
                                    ? "border-border text-muted-foreground"
                                    : esInsignia
                                    ? "border-amber-400 text-amber-300 bg-amber-500/20"
                                    : "border-border text-foreground"
                                }`}
                              >
                                M{slot}
                              </Badge>
                              <span className="font-semibold truncate text-[11px]">
                                {nombreMov}
                              </span>
                            </div>
                            {estaBloqueado ? (
                              <Lock className="size-3 text-amber-400/80 shrink-0" aria-hidden="true" />
                            ) : esInsignia ? (
                              <Sparkles className="size-3 text-amber-300 shrink-0" aria-hidden="true" />
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between w-full mt-1 min-w-0">
                            {estaBloqueado ? (
                              <span className="text-[9px] font-mono text-amber-300/80 truncate">
                                Requiere Resonancia 100 %
                                {esFuriaSlot4 && <span className="sr-only">Furia (Bloqueado)</span>}
                              </span>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 min-w-0">
                                  {textoChip === "¡EFICAZ!" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] font-mono px-1 py-0 border-emerald-500/70 text-emerald-300 bg-emerald-500/10 flex items-center gap-0.5"
                                    >
                                      <ChevronsUp className="size-2.5" aria-hidden="true" />
                                      {textoChip}
                                    </Badge>
                                  )}
                                  {textoChip === "RESISTIDO" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] font-mono px-1 py-0 border-stone-500/70 text-stone-300 bg-stone-500/10 flex items-center gap-0.5"
                                    >
                                      <ChevronsDown className="size-2.5" aria-hidden="true" />
                                      {textoChip}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                                  Pot. {poder}
                                </span>
                              </>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botonera Principal de 5 Comandos */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
                {/* 1. Atacar */}
                <Button
                  disabled={procesandoAccion || !esTurnoJugador}
                  onClick={() => setPanelMovimientosAbierto((prev) => !prev)}
                  className={`text-xs ${
                    panelMovimientosAbierto ? "border-2 border-primary bg-primary/20" : ""
                  }`}
                >
                  {procesandoAccion ? <Spinner className="size-3.5" /> : "Atacar"}
                </Button>

                {/* 2. Usar Objeto */}
                <Button
                  variant="secondary"
                  disabled={procesandoAccion || !esTurnoJugador}
                  onClick={() => setModalObjetosAbierto(true)}
                  className="text-xs"
                >
                  Usar Objeto
                </Button>

                {/* 3. Cambiar Criatura */}
                <Button
                  variant="secondary"
                  disabled={procesandoAccion || !esTurnoJugador}
                  onClick={() => setModalCambioCriaturaAbierto(true)}
                  className="text-xs"
                >
                  Cambiar
                </Button>

                {/* 4. Capturar */}
                <Button
                  variant="outline"
                  disabled={procesandoAccion || !esTurnoJugador}
                  onClick={() => setModalCapturaAbierto(true)}
                  className="text-xs border-pixel-dorado/70 text-amber-300 hover:bg-amber-950/20"
                >
                  Capturar
                </Button>

                {/* 5. Huir */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={procesandoAccion || !esTurnoJugador}
                      className="text-xs col-span-2 sm:col-span-1"
                    >
                      Huir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-2 border-pixel">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-sm">
                        ¿Intentar escapar del combate?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs">
                        La probabilidad de éxito depende de la velocidad relativa de tu criatura frente al rival. Si fallas, el rival contraatacará de inmediato.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-2">
                      <AlertDialogCancel className="text-xs">Permanecer</AlertDialogCancel>
                      <AlertDialogAction onClick={handleHuir} className="text-xs">
                        Confirmar Huida
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* MODAL RETRO: SELECCIÓN DE TALISMÁN DE CAPTURA */}
      <Dialog open={modalCapturaAbierto} onOpenChange={setModalCapturaAbierto}>
        <DialogContent className="sm:max-w-md w-[92vw] border-2 border-pixel bg-bastion">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-pixel-dorado retro">
              Lanzar Talismán de Captura
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Elige el orbe o talismán que usarás para sintonizar a {rival.nombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {talismanes.length === 0 ? (
              <div className="p-4 bg-muted/20 border border-border/40 text-center space-y-2 rounded">
                <p className="text-xs text-muted-foreground">
                  No tienes talismanes de captura en tu inventario.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/tienda")}
                  className="text-xs"
                >
                  Visitar la Tienda
                </Button>
              </div>
            ) : (
              talismanes.map((item) => (
                <label
                  key={item.codigo}
                  className={`flex items-center justify-between p-3 border-2 rounded cursor-pointer transition-colors ${
                    talismanSeleccionado === item.codigo
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="talisman"
                      value={item.codigo}
                      checked={talismanSeleccionado === item.codigo}
                      onChange={() => setTalismanSeleccionado(item.codigo)}
                      className="accent-primary"
                    />
                    <img
                      src={obtenerImagenObjeto(item.codigo)}
                      alt={item.nombre}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      className="size-7 pixelated object-contain"
                    />
                    <span className="font-semibold text-xs text-foreground">
                      {item.nombre}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    x{item.cantidad}
                  </Badge>
                </label>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full">
            <Button
              className="flex-1 text-xs py-2"
              disabled={talismanes.length === 0 || procesandoAccion}
              onClick={ejecutarCaptura}
            >
              Lanzar Talismán
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-xs py-2"
              onClick={() => setModalCapturaAbierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL RETRO: OBJETOS CURATIVOS */}
      <Dialog open={modalObjetosAbierto} onOpenChange={setModalObjetosAbierto}>
        <DialogContent className="sm:max-w-md w-[92vw] border-2 border-pixel bg-bastion">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-primary retro">
              Bolsa de Pociones y Curación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Aplica un consumible sobre {aliado.nombre} ({aliado.hpActual}/{aliado.hpMaximo} HP).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {itemsCuracion.length === 0 ? (
              <div className="p-4 bg-muted/20 border border-border/40 text-center space-y-2 rounded">
                <p className="text-xs text-muted-foreground">
                  No posees consumibles de curación en tu inventario.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/tienda")}
                  className="text-xs"
                >
                  Ir a la Tienda
                </Button>
              </div>
            ) : (
              itemsCuracion.map((item) => (
                <div
                  key={item.codigo}
                  className="flex items-center justify-between p-3 border-2 border-border/60 rounded bg-panel/30"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={obtenerImagenObjeto(item.codigo)}
                      alt={item.nombre}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      className="size-7 pixelated object-contain"
                    />
                    <div>
                      <p className="font-semibold text-xs text-foreground">
                        {item.nombre}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Disponibles: {item.cantidad}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={procesandoAccion || aliado.hpActual >= aliado.hpMaximo}
                    onClick={() => handleUsarObjetoCuracion(item.codigo)}
                    className="text-xs"
                  >
                    Usar (+HP)
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 w-full">
            <Button
              variant="outline"
              className="w-full text-xs py-2"
              onClick={() => setModalObjetosAbierto(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL RETRO: CAMBIAR CRIATURA ACTIVA */}
      <Dialog open={modalCambioCriaturaAbierto} onOpenChange={setModalCambioCriaturaAbierto}>
        <DialogContent className="sm:max-w-md w-[92vw] border-2 border-pixel bg-bastion">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-primary retro">
              Relevar Criatura en Combate
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona una compañera activa de tu equipo para relevar al frente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-64 overflow-y-auto">
            {equipoCriaturas.filter((c) => c.criaturaId !== aliado.criaturaId).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tienes otras criaturas en tu equipo activo.
              </p>
            ) : (
              equipoCriaturas
                .filter((c) => c.criaturaId !== aliado.criaturaId)
                .map((comp) => {
                  const debilitada = comp.hpActual <= 0;
                  const xpIndividual = comp.porcentajeXp ?? 0;
                  return (
                    <div
                      key={comp.criaturaId}
                      className={`flex items-center justify-between p-2.5 border-2 rounded ${
                        debilitada
                          ? "opacity-50 border-destructive/40 bg-destructive/5"
                          : "border-border/60 bg-panel/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={obtenerImagenCriatura(comp.slug)}
                          alt={comp.nombre}
                          onError={(e) => manejarErrorImagen(e, "criatura")}
                          className="size-8 pixelated object-contain"
                        />
                        <div>
                          <p className="font-semibold text-xs">{comp.nombre}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Nv. {comp.nivel} · {comp.hpActual}/{comp.hpMaximo} HP · {xpIndividual}% EXP
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={debilitada || procesandoAccion}
                        onClick={() => handleCambiarCriatura(comp.criaturaId)}
                        className="text-xs"
                      >
                        {debilitada ? "Debilitada" : "Relevar"}
                      </Button>
                    </div>
                  );
                })
            )}
          </div>

          <div className="pt-2 w-full">
            <Button
              variant="outline"
              className="w-full text-xs py-2"
              onClick={() => setModalCambioCriaturaAbierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CINEMÁTICO DE VICTORIA RETRO */}
      <Dialog open={estadoFinal === "VICTORIA"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md w-[92vw] border-4 border-pixel-dorado bg-bastion anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-12 rounded bg-pixel-dorado/20 border-2 border-pixel-dorado flex items-center justify-center anim-pulso-turno">
              <span className="text-xl">🏆</span>
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-pixel-dorado retro tracking-wider">
              ¡VICTORIA EN COMBATE!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Has derrotado a {rival.nombre} silvestre con valentía táctica.
            </DialogDescription>
          </DialogHeader>

          {recompensasVictoria && (
            <div className="p-3 bg-abismo border-2 border-pixel space-y-2 rounded">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Experiencia Ganada:</span>
                <span className="font-bold text-purple-400">
                  +{recompensasVictoria.xpGanada} XP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Monedas Obtenidas:</span>
                <span className="font-bold text-pixel-dorado">
                  +{recompensasVictoria.monedasGanadas} Monedas
                </span>
              </div>
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground">Progreso de Nivel:</span>
                  <span className="text-accent font-bold">
                    Nv. {recompensasVictoria.nivelNuevo ?? aliado?.nivel} ({porcentajeXp}%)
                  </span>
                </div>
                <XpBar value={porcentajeXp} variant="retro" className="h-2.5" />
              </div>
              {recompensasVictoria.subioNivel && (
                <div className="p-2 bg-pixel-dorado/10 border border-pixel-dorado text-center rounded anim-pulso-turno">
                  <p className="retro text-[11px] text-pixel-dorado">
                    ¡SUBIDA DE NIVEL! Nv. {recompensasVictoria.nivelNuevo ?? ((aliado?.nivel ?? 1) + 1)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-3 w-full">
            <Button
              className="w-full text-xs py-2"
              onClick={() => navigate("/exploracion")}
            >
              Continuar Explorando
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2"
              onClick={() => navigate("/hub")}
            >
              Volver al Hub
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CINEMÁTICO DE CAPTURA RETRO */}
      <Dialog open={estadoFinal === "CAPTURADO"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md w-[92vw] border-4 border-primary bg-bastion anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-20 rounded border-2 border-primary bg-abismo flex items-center justify-center anim-captura-exito">
              <img
                src={obtenerImagenCriatura(rival.slug)}
                alt={rival.nombre}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                className="size-16 pixelated object-contain"
              />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-primary retro">
              ¡CRIATURA CAPTURADA!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {criaturaCapturada?.nombre ?? rival.nombre} ha sido sintonizada y enviada a{" "}
              {destinoCaptura === "EQUIPO" ? "tu equipo activo" : "el almacén de reserva"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 pt-3 w-full">
            <Button
              className="w-full text-xs py-2"
              onClick={() => navigate("/exploracion")}
            >
              Continuar Explorando
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2"
              onClick={() => navigate("/equipo")}
            >
              Ver en Equipo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CINEMÁTICO DE DERROTA RETRO */}
      <Dialog open={estadoFinal === "DERROTA"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md w-[92vw] border-4 border-destructive/80 bg-bastion anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-12 rounded bg-destructive/20 border-2 border-destructive flex items-center justify-center anim-sacudida">
              <span className="text-xl">⚔️</span>
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-destructive retro">
              EQUIPO DEBILITADO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tu criatura aliada ha quedado fuera de combate. Debes acudir al santuario para sanar a tu equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 pt-3 w-full">
            <Button
              variant="destructive"
              className="w-full text-xs py-2"
              onClick={() => navigate("/curacion")}
            >
              Ir a Centro de Curación
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2"
              onClick={() => navigate("/hub")}
            >
              Volver al Hub
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaCombate;
