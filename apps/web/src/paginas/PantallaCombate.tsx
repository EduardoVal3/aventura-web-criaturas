import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
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
import {
  Lock,
  Crown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Flame,
  Skull,
  Snowflake,
  Zap,
  ShieldAlert,
  Shield,
  Swords,
  HeartPulse,
  Trophy,
  LogOut,
  ArrowLeftRight,
  Scroll,
  Pause,
  ChevronUp,
  X,
  RotateCcw,
  BookOpen,
  Award,
} from "lucide-react";
import { TRADUCCION_ELEMENTOS } from "@/lib/catalogo-historial";
import {
  construirSlotsTacticos,
  ETIQUETA_EFECTIVIDAD,
  sonidoDeGolpe,
  resolverBadgeEfectoMovimiento,
  describirEstado,
  type TipoIconoEfecto,
} from "@/lib/combate-tactico";
import { BattlefieldBackground } from "@/components/combate/BattlefieldBackground";

const ICONOS_EFECTO_LUCIDE: Record<
  TipoIconoEfecto,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  Flame,
  Skull,
  Snowflake,
  Zap,
  ShieldAlert,
  Shield,
  Sparkles,
  Swords,
  HeartPulse,
  ChevronsUp,
  ChevronsDown,
};

const ICONOS_ESTADO: Record<
  string,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  Flame,
  Skull,
  Snowflake,
  Zap,
  ShieldAlert,
  Shield,
  Sparkles,
};

interface RecompensasVictoria {
  xpGanada: number;
  monedasGanadas: number;
  subioNivel: boolean;
  nivelNuevo?: number;
}

type EstadoMenuConsola = "ROOT" | "ATTACK" | "ITEMS" | "SWAP" | "CAPTURE";

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

  // Consola de acciones contextual in-place (Thumb-zone state machine)
  const [menuState, setMenuState] = useState<EstadoMenuConsola>("ROOT");

  // Ticker y drawer expandible de bitácora
  const [bitacoraAbierta, setBitacoraAbierta] = useState(false);

  // Modales secundarios de combate
  const [modalPausaAbierto, setModalPausaAbierto] = useState(false);
  const [dialogoHuirAbierto, setDialogoHuirAbierto] = useState(false);

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
    setMenuState("ROOT");
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
              estados: resultado.estados?.rival ?? rival.estados,
            });
          }

          // Si el ataque del jugador curó vitalidad, reflejar en pantalla
          if (
            typeof resultado.hpRestanteAliada === "number" &&
            aliado &&
            resultado.hpRestanteAliada > aliado.hpActual
          ) {
            setAliado({
              ...aliado,
              hpActual: Math.min(aliado.hpMaximo, resultado.hpRestanteAliada),
              resonancia: resultado.resonancia?.aliada ?? aliado.resonancia,
              estados: resultado.estados?.aliada ?? aliado.estados,
            });
          } else if (resultado.resonancia?.aliada !== undefined && aliado) {
            setAliado({
              ...aliado,
              resonancia: resultado.resonancia.aliada,
              estados: resultado.estados?.aliada ?? aliado.estados,
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
        await animarContraataqueRival();

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

        if (resultado.accionJugador) {
          await animarImpactoJugador();
        }
      } else {
        if (resultado.accionJugador) {
          await animarImpactoJugador();
        }

        if (resultado.estado === "VICTORIA") {
          procesarVictoria();
          return;
        }

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

      if (resultado.estado === "VICTORIA") {
        procesarVictoria();
        return;
      }

      if (resultado.efectosFinDeTurno && resultado.efectosFinDeTurno.length > 0) {
        await reproducirContraataqueYDoT(null, resultado.efectosFinDeTurno);
      }

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

    setMenuState("ROOT");
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

    setMenuState("ROOT");
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

  // Secuencia de Captura con Suspenso Visual e Incertidumbre
  const ejecutarCaptura = async () => {
    if (!encuentro || cerrojoAccion.current || procesandoAccion || combateFinalizado) return;

    cerrojoAccion.current = true;
    setMenuState("ROOT");
    setProcesandoAccion(true);
    setSecuenciaCaptura(true);
    reproducirSonido("seleccionar");

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

  // Manejador de Huida del Combate
  const handleHuir = async () => {
    if (!encuentro || cerrojoAccion.current || procesandoAccion || combateFinalizado) return;

    cerrojoAccion.current = true;
    setDialogoHuirAbierto(false);
    setModalPausaAbierto(false);
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
      <div className="flex flex-col items-center justify-center h-full h-[100dvh] w-full bg-[#070a13] gap-3">
        <div className="bg-card border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col items-center gap-3">
          <Spinner className="size-8 text-[#14d1e8]" />
          <p className="text-xs sm:text-sm font-bold text-muted-foreground animate-pulse retro">
            Sincronizando estado del combate con el servidor...
          </p>
        </div>
      </div>
    );
  }

  const porcentajeHpAliado = Math.max(0, Math.min(100, Math.round((aliado.hpActual / aliado.hpMaximo) * 100)));
  const porcentajeHpRival = Math.max(0, Math.min(100, Math.round((rival.hpActual / rival.hpMaximo) * 100)));
  const esTurnoJugador = encuentro?.esTurnoJugador ?? true;
  const movimientosAliados = aliado.movimientos && aliado.movimientos.length > 0
    ? aliado.movimientos
    : [{ nombre: "Golpe Firme", poder: 12, tipoAccion: "ATAQUE", slot: 1 }];
  const slotsTacticos = construirSlotsTacticos(movimientosAliados, aliado.resonancia ?? 0);

  return (
    <div className="relative h-full h-[100dvh] w-full max-w-5xl mx-auto flex flex-col justify-between overflow-hidden select-none bg-[#090d16] border-x-0 md:border-x-4 border-black shadow-[6px_6px_0_0_#000]">
      {/* 1. ARENA DINÁMICA CON FONDO DESACOPLADO (Battlefield Background System) */}
      <BattlefieldBackground
        className="flex-1 w-full relative min-h-0"
      >
        {/* Cabecera Superior: Indicador Ornato de Turno y Botón de Pausa */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 z-20">
          <div className="w-8" />
          {/* Pastilla Central Ornada de Turno Retro */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0b1424]/95 border-2 border-[#d4af37] shadow-[2px_2px_0_0_#000]">
            <span className="text-[#ffd700] text-[9px] retro">◆</span>
            <span className="text-[10px] sm:text-xs font-bold text-[#ffd700] retro uppercase tracking-wider">
              TURNO {encuentro?.turno ?? 1}: {procesandoAccion ? "ACCION..." : esTurnoJugador && !combateFinalizado ? "TU TURNO" : "TURNO ENEMIGO"}
            </span>
            <span className="text-[#ffd700] text-[9px] retro">◆</span>
          </div>

          {/* Botón de Pausa Retro en la Esquina Superior Derecha */}
          <Button
            size="sm"
            variant="outline"
            aria-label="Pausa y opciones secundarias de combate"
            onClick={() => {
              reproducirSonido("click", 0.4);
              setModalPausaAbierto(true);
            }}
            className="size-8 p-0 border-2 border-black bg-[#121927] hover:bg-[#1c273c] text-foreground shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
          >
            <Pause className="size-4 text-[#14d1e8]" aria-hidden="true" />
          </Button>
        </div>

        {/* Capa de Incertidumbre de Captura */}
        {secuenciaCaptura && (
          <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center gap-4 anim-revelacion-evento">
            <div className="size-20 sm:size-24 border-4 border-black bg-bastion flex items-center justify-center anim-captura-incertidumbre shadow-[4px_4px_0_0_#000]">
              <img
                src={obtenerImagenObjeto(talismanSeleccionado)}
                alt="Talismán lanzado"
                onError={(e) => manejarErrorImagen(e, "objeto")}
                className="size-12 sm:size-16 pixelated object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="retro text-xs sm:text-sm text-amber-300 tracking-wider">
                Sintonizando talismán...
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Pulsos de resonancia con {rival.nombre}
              </p>
            </div>
          </div>
        )}

        {/* ARENA DE COMBATE: Disposición Diagonal Clásica JRPG */}
        <div className="flex-1 w-full px-3 py-1 flex flex-col justify-between relative z-10 overflow-hidden">
          {/* SECTOR RIVAL: Arriba a la derecha */}
          <div className="flex items-start justify-end gap-2 sm:gap-3 self-end w-full max-w-[92%] sm:max-w-[85%] pt-1">
            {/* Placa HUD Flotante Compacta del Rival */}
            <div className="bg-[#0b1322]/95 border-2 border-black p-2 shadow-[3px_3px_0_0_#000] flex-1 max-w-[210px] space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0 truncate">
                  {rival.esLegendaria && (
                    <Crown className="size-3 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                  <span className="font-bold text-[10px] sm:text-[11px] truncate text-foreground retro">
                    {rival.nombre}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-muted-foreground shrink-0">
                  Lv.{rival.nivel}
                </span>
              </div>

              {rival.afinidad && TRADUCCION_ELEMENTOS[rival.afinidad] && (
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[8px] font-mono px-1 py-0 border border-black shadow-[1px_1px_0_0_#000] ${TRADUCCION_ELEMENTOS[rival.afinidad].clase}`}
                  >
                    [{TRADUCCION_ELEMENTOS[rival.afinidad].nombre}]
                  </span>
                </div>
              )}

              {/* Barra de Salud del Rival con Porcentaje */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[9px] font-bold text-red-400 font-mono">HP</span>
                <div className="flex-1">
                  <HealthBar
                    value={porcentajeHpRival}
                    variant="retro"
                    className="h-2 border-black shadow-[1px_1px_0_0_#000]"
                  />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground shrink-0 font-bold">
                  {porcentajeHpRival}%
                </span>
              </div>

              {/* Insignias de Estado del Rival (Tocar para ver descripción) */}
              {rival.estados && rival.estados.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5" role="list">
                  {rival.estados.map((st, idx) => {
                    const desc = describirEstado(st);
                    const IconoComp = ICONOS_ESTADO[desc.icono] ?? Shield;
                    return (
                      <button
                        key={`${st.codigo}-${idx}`}
                        type="button"
                        onClick={() => toast.info(`${desc.nombre}: ${desc.descripcion} (${desc.turnos})`)}
                        className={`flex items-center gap-0.5 px-1 py-0.2 border text-[8px] font-mono shadow-[1px_1px_0_0_#000] active:scale-95 transition-transform ${desc.claseEstilo}`}
                        title={`${desc.nombre}: ${desc.descripcion}`}
                      >
                        <IconoComp className="size-2.5" aria-hidden="true" />
                        <span>[{desc.nombre}]</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sprite del Rival con Pedestal y Daño Flotante */}
            <div className="relative flex flex-col items-center shrink-0">
              {danoFlotanteRival !== null && (
                <span className="absolute -top-5 text-sm sm:text-base font-bold text-red-400 drop-shadow-[2px_2px_0_#000] anim-dano-flotante z-20 retro">
                  -{danoFlotanteRival}
                </span>
              )}
              <div
                className={`size-20 sm:size-28 flex items-center justify-center transition-transform ${animacionRival}`}
              >
                <img
                  src={obtenerImagenCriatura(rival.slug)}
                  alt={rival.nombre}
                  onError={(e) => manejarErrorImagen(e, "criatura")}
                  className="max-h-full max-w-full object-contain pixelated drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)]"
                />
              </div>
              <div className="w-16 sm:w-20 h-2 bg-black/60 rounded-full blur-[1px] -mt-1 -z-0" />
            </div>
          </div>

          {/* SECTOR ALIADO: Abajo a la izquierda */}
          <div className="flex items-end justify-start gap-2 sm:gap-3 self-start w-full max-w-[92%] sm:max-w-[85%] pb-1">
            {/* Sprite del Aliado (de espaldas/perfil hacia el rival) */}
            <div className="relative flex flex-col items-center shrink-0">
              {danoFlotanteAliado !== null && (
                <span className="absolute -top-5 text-sm sm:text-base font-bold text-red-400 drop-shadow-[2px_2px_0_#000] anim-dano-flotante z-20 retro">
                  -{danoFlotanteAliado}
                </span>
              )}
              {curacionFlotanteAliado !== null && (
                <span className="absolute -top-5 text-sm sm:text-base font-bold text-emerald-400 drop-shadow-[2px_2px_0_#000] anim-curacion-flotante z-20 retro">
                  +{curacionFlotanteAliado} HP
                </span>
              )}
              <div
                className={`size-24 sm:size-32 flex items-center justify-center transition-transform ${animacionAliado}`}
              >
                <img
                  src={obtenerImagenCriatura(aliado.slug)}
                  alt={aliado.nombre}
                  onError={(e) => manejarErrorImagen(e, "criatura")}
                  className="max-h-full max-w-full object-contain pixelated drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] scale-x-[-1]"
                />
              </div>
              <div className="w-20 sm:w-24 h-2 bg-black/60 rounded-full blur-[1px] -mt-1 -z-0" />
            </div>

            {/* Placa HUD Flotante Compacta del Aliado */}
            <div className="bg-[#0b1322]/95 border-2 border-black p-2 shadow-[3px_3px_0_0_#000] flex-1 max-w-[225px] space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <span className="font-bold text-[10px] sm:text-[11px] truncate text-foreground retro">
                    {aliado.nombre}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-muted-foreground shrink-0">
                    Lv.{aliado.nivel}
                  </span>
                </div>
                {aliado.afinidad && TRADUCCION_ELEMENTOS[aliado.afinidad] && (
                  <span
                    className={`text-[8px] font-mono px-1 py-0 border border-black shadow-[1px_1px_0_0_#000] ${TRADUCCION_ELEMENTOS[aliado.afinidad].clase}`}
                  >
                    [{TRADUCCION_ELEMENTOS[aliado.afinidad].nombre}]
                  </span>
                )}
              </div>

              {/* Barra de Salud del Aliado con Valores Numéricos */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[9px] font-bold text-red-400 font-mono">HP</span>
                <div className="flex-1">
                  <HealthBar
                    value={porcentajeHpAliado}
                    variant="retro"
                    className="h-2 border-black shadow-[1px_1px_0_0_#000]"
                  />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground shrink-0 font-bold">
                  {aliado.hpActual}/{aliado.hpMaximo}
                </span>
              </div>

              {/* Medidor de Resonancia */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-cyan-400 font-mono">Resonancia</span>
                <div className="flex-1 bg-[#121927] border border-black h-2 overflow-hidden shadow-[inset_1px_1px_0_0_#000]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      aliado.resonancia && aliado.resonancia >= 100
                        ? "bg-amber-300 anim-pulso-resonancia"
                        : "bg-cyan-400"
                    }`}
                    style={{ width: `${Math.min(100, aliado.resonancia ?? 0)}%` }}
                  />
                </div>
              </div>

              {/* Barra de Experiencia (EXP) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-amber-400 font-mono">EXP</span>
                <div className="flex-1">
                  <XpBar
                    value={porcentajeXp}
                    variant="retro"
                    className="h-1.5 border-black shadow-[1px_1px_0_0_#000]"
                    levelUpMessage={subioNivel ? "¡SUBIÓ DE NIVEL!" : undefined}
                  />
                </div>
                <span className="text-[8px] font-mono text-muted-foreground shrink-0 font-bold">
                  {porcentajeXp}%
                </span>
              </div>

              {/* Estados Activos Aliados */}
              {aliado.estados && aliado.estados.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5" role="list">
                  {aliado.estados.map((st, idx) => {
                    const desc = describirEstado(st);
                    const IconoComp = ICONOS_ESTADO[desc.icono] ?? Shield;
                    return (
                      <button
                        key={`${st.codigo}-${idx}`}
                        type="button"
                        onClick={() => toast.info(`${desc.nombre}: ${desc.descripcion} (${desc.turnos})`)}
                        className={`flex items-center gap-0.5 px-1 py-0.2 border text-[8px] font-mono shadow-[1px_1px_0_0_#000] active:scale-95 transition-transform ${desc.claseEstilo}`}
                        title={`${desc.nombre}: ${desc.descripcion}`}
                      >
                        <IconoComp className="size-2.5" aria-hidden="true" />
                        <span>[{desc.nombre}]</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </BattlefieldBackground>

      {/* 2. BITÁCORA DE ENCUENTRO: Ticker Colapsado de 1 Sola Línea */}
      <div className="px-2 py-1.5 z-20 bg-[#090d16]/95 border-y-2 border-black">
        <button
          type="button"
          onClick={() => {
            reproducirSonido("click", 0.35);
            setBitacoraAbierta((prev) => !prev);
          }}
          className="w-full bg-[#0b1322] border-2 border-[#d4af37] px-3 py-1.5 shadow-[2px_2px_0_0_#000] flex items-center justify-between text-left active:translate-y-0.5 transition-all group"
          aria-expanded={bitacoraAbierta}
          aria-label="Abrir bitácora de eventos de combate"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <Scroll className="size-3.5 text-[#14d1e8] shrink-0" aria-hidden="true" />
            <p className="text-[11px] sm:text-xs font-mono text-amber-200 truncate font-semibold">
              {bitacoraCombate[0] ?? "El combate ha comenzado."}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-mono text-muted-foreground bg-black/50 px-1.5 py-0.5 border border-black">
              {bitacoraCombate.length} eventos
            </span>
            <ChevronUp
              className={`size-3.5 text-amber-300 transition-transform ${bitacoraAbierta ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>

      {/* 3. DRAWER EXPANDIBLE: Bottom Sheet de Historial Completo */}
      {bitacoraAbierta && (
        <div className="absolute inset-x-0 bottom-0 top-[38%] z-30 bg-[#090d16]/98 border-t-4 border-black p-3 flex flex-col shadow-[0_-6px_12px_rgba(0,0,0,0.85)] anim-revelacion-evento backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-2">
            <div className="flex items-center gap-2">
              <Scroll className="size-4 text-[#14d1e8]" aria-hidden="true" />
              <span className="text-xs font-bold text-foreground retro uppercase tracking-wider">
                Bitácora de Encuentro
              </span>
              <Badge variant="outline" font="retro" className="text-[9px] border-black shadow-[1px_1px_0_0_#000]">
                {bitacoraCombate.length} eventos
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reproducirSonido("click", 0.35);
                setBitacoraAbierta(false);
              }}
              className="h-6 px-2 text-[10px] retro hover:bg-black/40"
            >
              <X className="size-3.5 mr-1" aria-hidden="true" />
              Cerrar
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono p-1">
            {bitacoraCombate.map((linea, index) => {
              const esAliado = linea.includes("Tu criatura") || linea.includes("Usaste") || linea.includes("Tu aliada");
              const esRival = linea.includes("El rival") || linea.includes("salvaje") || linea.includes("debilitada");
              const esCaptura = linea.includes("Captura") || linea.includes("talismán") || linea.includes("sintonizada");
              return (
                <div key={index} className="flex items-start gap-1.5 leading-relaxed">
                  <span
                    className={`font-bold shrink-0 ${
                      esAliado
                        ? "text-[#14d1e8]"
                        : esRival
                        ? "text-destructive"
                        : esCaptura
                        ? "text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    ›
                  </span>
                  <span className={index === 0 ? "text-foreground font-semibold" : "text-muted-foreground"}>
                    {linea}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CONSOLA DE ACCIONES EN LA ZONA DEL PULGAR (In-Place Contextual Deck) */}
      <div className="px-2.5 pb-3 pt-1.5 bg-[#090d16] z-20">
        {combateFinalizado ? (
          /* Estado de Resolución Posterior al Combate */
          <div className="space-y-2 py-1">
            <div
              className={`p-2 border-2 border-black text-center retro text-xs sm:text-sm font-bold shadow-[2px_2px_0_0_#000] ${
                estadoFinal === "VICTORIA"
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/60"
                  : estadoFinal === "CAPTURADO"
                  ? "bg-cyan-950/60 text-[#14d1e8] border-cyan-500/60"
                  : "bg-red-950/60 text-destructive border-destructive/60"
              }`}
            >
              {estadoFinal === "VICTORIA"
                ? "¡Victoria consumada! El camino está despejado."
                : estadoFinal === "CAPTURADO"
                ? "¡Criatura capturada con éxito!"
                : "Tu equipo ha quedado debilitado en combate."}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {estadoFinal === "DERROTA" ? (
                <Button
                  onClick={() => {
                    reproducirSonido("click", 0.4);
                    navigate("/curacion");
                  }}
                  variant="destructive"
                  className="col-span-2 text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
                >
                  <HeartPulse className="size-3.5 mr-1.5" aria-hidden="true" />
                  <span>Ir a Curación</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      reproducirSonido("click", 0.4);
                      navigate("/exploracion");
                    }}
                    className="text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
                  >
                    <Swords className="size-3.5 mr-1.5" aria-hidden="true" />
                    <span>Continuar</span>
                  </Button>
                  <Button
                    onClick={() => {
                      reproducirSonido("click", 0.4);
                      navigate("/hub");
                    }}
                    variant="outline"
                    className="text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
                  >
                    <span>Volver al Hub</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : menuState === "ROOT" ? (
          /* Estado Raíz: Botonera Clásica Retro (2x2 + Huir Inferior) */
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* 1. Atacar (Oro/Ámbar prominente) */}
              <button
                type="button"
                disabled={procesandoAccion || !esTurnoJugador}
                aria-busy={procesandoAccion}
                onClick={() => {
                  reproducirSonido("click", 0.4);
                  setMenuState("ATTACK");
                }}
                className="h-14 sm:h-16 bg-[#d97706] hover:bg-[#b45309] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-retro text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {procesandoAccion ? (
                  <Spinner className="size-4" />
                ) : (
                  <>
                    <Swords className="size-4 text-white" aria-hidden="true" />
                    <span>ATACAR</span>
                  </>
                )}
              </button>

              {/* 2. Usar Objeto (Cian Oscuro) */}
              <button
                type="button"
                disabled={procesandoAccion || !esTurnoJugador}
                aria-busy={procesandoAccion}
                onClick={() => {
                  reproducirSonido("click", 0.4);
                  setMenuState("ITEMS");
                }}
                className="h-14 sm:h-16 bg-[#0e4b5c] hover:bg-[#0a3744] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-retro text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <HeartPulse className="size-4 text-emerald-300" aria-hidden="true" />
                <span>USAR OBJETO</span>
              </button>

              {/* 3. Cambiar Criatura (Cian Oscuro) */}
              <button
                type="button"
                disabled={procesandoAccion || !esTurnoJugador}
                aria-busy={procesandoAccion}
                onClick={() => {
                  reproducirSonido("click", 0.4);
                  setMenuState("SWAP");
                }}
                className="h-14 sm:h-16 bg-[#0e4b5c] hover:bg-[#0a3744] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-retro text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeftRight className="size-4 text-[#14d1e8]" aria-hidden="true" />
                <span>CAMBIAR</span>
              </button>

              {/* 4. Capturar (Cian Oscuro) */}
              <button
                type="button"
                disabled={procesandoAccion || !esTurnoJugador}
                aria-busy={procesandoAccion}
                onClick={() => {
                  reproducirSonido("click", 0.4);
                  setMenuState("CAPTURE");
                }}
                className="h-14 sm:h-16 bg-[#0e4b5c] hover:bg-[#0a3744] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-retro text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="size-4 text-amber-300" aria-hidden="true" />
                <span>CAPTURAR</span>
              </button>

              {/* 5. Huir (En móvil ancho completo; en desktop col-span-1) */}
              <button
                type="button"
                disabled={procesandoAccion || !esTurnoJugador}
                aria-busy={procesandoAccion}
                onClick={() => {
                  reproducirSonido("click", 0.4);
                  setDialogoHuirAbierto(true);
                }}
                className="h-11 sm:h-16 col-span-2 sm:col-span-1 bg-[#8c1d28] hover:bg-[#6d141d] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-retro text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <LogOut className="size-3.5 text-white" aria-hidden="true" />
                <span>HUIR</span>
              </button>
            </div>
          </div>
        ) : menuState === "ATTACK" ? (
          /* Submenú Contextual In-Place: Selección de 4 Movimientos */
          <div className="space-y-1.5 anim-revelacion-evento">
            <div className="flex items-center justify-between pb-1 border-b border-black">
              <span className="text-[10px] font-bold text-amber-300 retro">
                Elige un Movimiento:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  setMenuState("ROOT");
                }}
                className="h-6 px-2 text-[10px] retro"
              >
                <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                Volver
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slotsTacticos.map((slotItem) => {
                const { slot, movimiento: mov, bloqueado, esInsignia } = slotItem;
                const esFuriaSlot4 = esInsignia;
                const estaBloqueado = bloqueado;
                const nombreMov = mov?.nombre ?? (esInsignia ? "Movimiento Insignia" : `Movimiento ${slot}`);
                const poder = mov?.poder ?? 10;
                const etiquetaEfectividad = (encuentro?.efectividadAliadaSobreRival?.etiqueta as keyof typeof ETIQUETA_EFECTIVIDAD) || "NEUTRAL";
                const textoChip = ETIQUETA_EFECTIVIDAD[etiquetaEfectividad];
                const badgeEfecto = resolverBadgeEfectoMovimiento(mov?.efecto, mov?.estadoAplicado);

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={procesandoAccion || estaBloqueado}
                    aria-disabled={estaBloqueado}
                    aria-busy={procesandoAccion}
                    onClick={() => !estaBloqueado && handleAtacar(slot - 1)}
                    className={`flex flex-col items-start justify-between min-h-[56px] p-2 border-2 border-black shadow-[2px_2px_0_0_#000] text-left transition-all ${
                      estaBloqueado
                        ? "opacity-60 cursor-not-allowed bg-muted/20 border-dashed text-muted-foreground"
                        : esInsignia
                        ? "border-amber-400 bg-amber-500/20 hover:bg-amber-500/30 anim-pulso-resonancia text-amber-200"
                        : "bg-[#121927] hover:border-primary text-foreground active:translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1 min-w-0">
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-[8px] font-mono px-1 py-0 border border-black bg-black/40 text-foreground">
                          M{slot}
                        </span>
                        <span className="font-semibold truncate text-[10px] font-mono">
                          {nombreMov}
                        </span>
                      </div>
                      {estaBloqueado ? (
                        <Lock className="size-3 text-amber-400/80 shrink-0" aria-hidden="true" />
                      ) : esInsignia ? (
                        <Sparkles className="size-3 text-amber-300 shrink-0" aria-hidden="true" />
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between w-full mt-1 min-w-0 gap-1">
                      {estaBloqueado ? (
                        <span className="text-[8px] font-mono text-amber-300/80 truncate">
                          Requiere Resonancia 100 %
                          {esFuriaSlot4 && <span className="sr-only">Furia (Bloqueado)</span>}
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 min-w-0 flex-wrap">
                            {textoChip === "¡EFICAZ!" && (
                              <span className="text-[7px] font-mono px-1 border border-emerald-500 text-emerald-300 bg-emerald-500/10 flex items-center gap-0.5">
                                <ChevronsUp className="size-2" aria-hidden="true" />
                                {textoChip}
                              </span>
                            )}
                            {textoChip === "RESISTIDO" && (
                              <span className="text-[7px] font-mono px-1 border border-stone-500 text-stone-300 bg-stone-500/10 flex items-center gap-0.5">
                                <ChevronsDown className="size-2" aria-hidden="true" />
                                {textoChip}
                              </span>
                            )}
                            {badgeEfecto && (
                              <span
                                className={`text-[7px] font-mono px-1 border truncate max-w-[85px] flex items-center gap-0.5 shadow-[1px_1px_0_0_#000] ${badgeEfecto.claseEstilo}`}
                              >
                                {(() => {
                                  const IconoComp = ICONOS_EFECTO_LUCIDE[badgeEfecto.icono] ?? Sparkles;
                                  return <IconoComp className="size-2 shrink-0" aria-hidden="true" />;
                                })()}
                                <span>{badgeEfecto.nombre}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground ml-auto shrink-0 font-bold">
                            Pot. {poder}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : menuState === "ITEMS" ? (
          /* Submenú Contextual In-Place: Objetos Curativos */
          <div className="space-y-1.5 anim-revelacion-evento">
            <div className="flex items-center justify-between pb-1 border-b border-black">
              <span className="text-[10px] font-bold text-emerald-400 retro">
                Bolsa de Pociones y Curación:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  setMenuState("ROOT");
                }}
                className="h-6 px-2 text-[10px] retro"
              >
                <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                Volver
              </Button>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1.5 p-0.5">
              {itemsCuracion.length === 0 ? (
                <div className="p-3 bg-muted/20 border-2 border-black text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground">
                    No posees consumibles de curación en tu inventario.
                  </p>
                </div>
              ) : (
                itemsCuracion.map((item) => (
                  <div
                    key={item.codigo}
                    className="flex items-center justify-between p-1.5 border-2 border-black bg-[#121927] shadow-[2px_2px_0_0_#000]"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={obtenerImagenObjeto(item.codigo)}
                        alt={item.nombre}
                        onError={(e) => manejarErrorImagen(e, "objeto")}
                        className="size-6 pixelated object-contain"
                      />
                      <div>
                        <p className="font-semibold text-[10px] text-foreground font-mono">
                          {item.nombre}
                        </p>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          Disponibles: x{item.cantidad}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={procesandoAccion || aliado.hpActual >= aliado.hpMaximo}
                      onClick={() => handleUsarObjetoCuracion(item.codigo)}
                      className="text-[10px] h-7 px-2 border-2 border-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5"
                    >
                      Usar (+HP)
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : menuState === "SWAP" ? (
          /* Submenú Contextual In-Place: Relevo de Criatura */
          <div className="space-y-1.5 anim-revelacion-evento">
            <div className="flex items-center justify-between pb-1 border-b border-black">
              <span className="text-[10px] font-bold text-[#14d1e8] retro">
                Relevar Criatura al Frente:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  setMenuState("ROOT");
                }}
                className="h-6 px-2 text-[10px] retro"
              >
                <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                Volver
              </Button>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1.5 p-0.5">
              {equipoCriaturas.filter((c) => c.criaturaId !== aliado.criaturaId).length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2 font-mono">
                  No tienes otras criaturas en tu equipo activo.
                </p>
              ) : (
                equipoCriaturas
                  .filter((c) => c.criaturaId !== aliado.criaturaId)
                  .map((comp) => {
                    const debilitada = comp.hpActual <= 0;
                    return (
                      <div
                        key={comp.criaturaId}
                        className={`flex items-center justify-between p-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] ${
                          debilitada ? "opacity-50 bg-destructive/5" : "bg-[#121927]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={obtenerImagenCriatura(comp.slug)}
                            alt={comp.nombre}
                            onError={(e) => manejarErrorImagen(e, "criatura")}
                            className="size-7 pixelated object-contain"
                          />
                          <div>
                            <p className="font-semibold text-[10px] text-foreground font-mono">
                              {comp.nombre}
                            </p>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              Nv. {comp.nivel} · {comp.hpActual}/{comp.hpMaximo} HP
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={debilitada || procesandoAccion}
                          onClick={() => handleCambiarCriatura(comp.criaturaId)}
                          className="text-[10px] h-7 px-2 border-2 border-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5"
                        >
                          {debilitada ? "Caída" : "Relevar"}
                        </Button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        ) : (
          /* Submenú Contextual In-Place: Talismán de Captura */
          <div className="space-y-1.5 anim-revelacion-evento">
            <div className="flex items-center justify-between pb-1 border-b border-black">
              <span className="text-[10px] font-bold text-amber-300 retro">
                Lanzar Talismán de Captura:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  setMenuState("ROOT");
                }}
                className="h-6 px-2 text-[10px] retro"
              >
                <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                Volver
              </Button>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1.5 p-0.5">
              {talismanes.length === 0 ? (
                <div className="p-3 bg-muted/20 border-2 border-black text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground">
                    No tienes talismanes de captura en tu inventario.
                  </p>
                </div>
              ) : (
                talismanes.map((item) => (
                  <label
                    key={item.codigo}
                    className={`flex items-center justify-between p-2 border-2 border-black cursor-pointer shadow-[2px_2px_0_0_#000] ${
                      talismanSeleccionado === item.codigo
                        ? "border-primary bg-primary/10 shadow-[2px_2px_0_0_#000]"
                        : "bg-[#121927] hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="talisman"
                        value={item.codigo}
                        checked={talismanSeleccionado === item.codigo}
                        onChange={() => {
                          reproducirSonido("seleccionar", 0.35);
                          setTalismanSeleccionado(item.codigo);
                        }}
                        className="accent-primary"
                      />
                      <img
                        src={obtenerImagenObjeto(item.codigo)}
                        alt={item.nombre}
                        onError={(e) => manejarErrorImagen(e, "objeto")}
                        className="size-6 pixelated object-contain"
                      />
                      <span className="font-semibold text-[10px] text-foreground font-mono">
                        {item.nombre}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-mono border-black shadow-[1px_1px_0_0_#000]">
                      x{item.cantidad}
                    </Badge>
                  </label>
                ))
              )}
            </div>

            <Button
              className="w-full h-8 text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 bg-amber-600 hover:bg-amber-500 text-white"
              disabled={talismanes.length === 0 || procesandoAccion}
              onClick={ejecutarCaptura}
            >
              <Sparkles className="size-3.5 mr-1.5" aria-hidden="true" />
              <span>Lanzar Talismán</span>
            </Button>
          </div>
        )}
      </div>

      {/* MODAL DISCRETO DE PAUSA (Opciones Secundarias Retro) */}
      <Dialog open={modalPausaAbierto} onOpenChange={setModalPausaAbierto}>
        <DialogContent className="border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Pause className="size-4 text-[#14d1e8]" aria-hidden="true" />
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground retro">
                Menú de Pausa
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Opciones secundarias y navegación del encuentro activo en Aethelgard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <Button
              onClick={() => {
                reproducirSonido("click", 0.35);
                setModalPausaAbierto(false);
              }}
              className="w-full text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
            >
              Continuar Combate
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                reproducirSonido("click", 0.35);
                setModalPausaAbierto(false);
                setDialogoHuirAbierto(true);
              }}
              className="w-full text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-3.5 mr-1.5" aria-hidden="true" />
              Huir / Rendirse
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/40">
              <Button
                variant="outline"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  navigate("/kit-ui");
                }}
                className="text-[11px] border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              >
                <BookOpen className="size-3.5 mr-1" aria-hidden="true" />
                Kit de Interfaz
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  reproducirSonido("click", 0.35);
                  navigate("/creditos");
                }}
                className="text-[11px] border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              >
                <Award className="size-3.5 mr-1" aria-hidden="true" />
                Créditos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL RETRO: CONFIRMACIÓN DE HUIDA */}
      <AlertDialog open={dialogoHuirAbierto} onOpenChange={setDialogoHuirAbierto}>
        <AlertDialogContent className="border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 space-y-3">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <LogOut className="size-4 text-destructive" aria-hidden="true" />
              <AlertDialogTitle className="text-sm font-bold retro text-destructive">
                ¿Intentar escapar del combate?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              La probabilidad de éxito depende de la velocidad relativa de tu criatura frente al rival. Si fallas, el rival contraatacará de inmediato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <AlertDialogCancel
              onClick={() => {
                reproducirSonido("click", 0.35);
                setDialogoHuirAbierto(false);
              }}
              className="text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
            >
              Permanecer
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHuir}
              className="text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 bg-destructive hover:bg-destructive/90 text-white"
            >
              Confirmar Huida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO CINEMÁTICO DE VICTORIA RETRO */}
      <Dialog open={estadoFinal === "VICTORIA"} onOpenChange={() => {}}>
        <DialogContent className="border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 space-y-4 anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-14 bg-amber-500/20 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center anim-pulso-turno">
              <Trophy className="size-7 text-amber-400" aria-hidden="true" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-amber-400 retro tracking-wider">
              ¡VICTORIA EN COMBATE!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Has derrotado a {rival.nombre} silvestre con valentía táctica.
            </DialogDescription>
          </DialogHeader>

          {recompensasVictoria && (
            <div className="p-3.5 bg-[#090d16] border-2 border-black shadow-[inset_2px_2px_0_0_#000] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Experiencia Ganada:</span>
                <span className="font-bold text-purple-400">
                  +{recompensasVictoria.xpGanada} XP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Monedas Obtenidas:</span>
                <span className="font-bold text-amber-300">
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
                <XpBar value={porcentajeXp} variant="retro" className="h-2.5 border-black shadow-[1px_1px_0_0_#000]" />
              </div>
              {recompensasVictoria.subioNivel && (
                <div className="p-2 bg-amber-500/20 border-2 border-black shadow-[2px_2px_0_0_#000] text-center anim-pulso-turno">
                  <p className="retro text-[10px] text-amber-300">
                    ¡SUBIDA DE NIVEL! Nv. {recompensasVictoria.nivelNuevo ?? ((aliado?.nivel ?? 1) + 1)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 w-full">
            <Button
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/exploracion");
              }}
            >
              <Swords className="size-3.5 mr-1.5" aria-hidden="true" />
              <span>Continuar Explorando</span>
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/hub");
              }}
            >
              <span>Volver al Hub</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CINEMÁTICO DE CAPTURA RETRO */}
      <Dialog open={estadoFinal === "CAPTURADO"} onOpenChange={() => {}}>
        <DialogContent className="border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 space-y-4 anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-20 border-2 border-black bg-[#090d16] shadow-[2px_2px_0_0_#000] flex items-center justify-center anim-captura-exito">
              <img
                src={obtenerImagenCriatura(rival.slug)}
                alt={rival.nombre}
                onError={(e) => manejarErrorImagen(e, "criatura")}
                className="size-16 pixelated object-contain"
              />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-[#14d1e8] retro">
              ¡CRIATURA CAPTURADA!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {criaturaCapturada?.nombre ?? rival.nombre} ha sido sintonizada y enviada a{" "}
              {destinoCaptura === "EQUIPO" ? "tu equipo activo" : "el almacén de reserva"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2 w-full">
            <Button
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/exploracion");
              }}
            >
              <Swords className="size-3.5 mr-1.5" aria-hidden="true" />
              <span>Continuar Explorando</span>
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/equipo");
              }}
            >
              <span>Ver en Equipo</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CINEMÁTICO DE DERROTA RETRO */}
      <Dialog open={estadoFinal === "DERROTA"} onOpenChange={() => {}}>
        <DialogContent className="border-4 border-black bg-card shadow-[6px_6px_0_0_#000] w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 space-y-4 anim-revelacion-evento">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto size-14 bg-destructive/20 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center anim-sacudida">
              <Swords className="size-7 text-destructive" aria-hidden="true" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-destructive retro">
              EQUIPO DEBILITADO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tu criatura aliada ha quedado fuera de combate. Debes acudir al santuario para sanar a tu equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2 w-full">
            <Button
              variant="destructive"
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/curacion");
              }}
            >
              <HeartPulse className="size-3.5 mr-1.5" aria-hidden="true" />
              <span>Ir a Centro de Curación</span>
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs py-2 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
              onClick={() => {
                reproducirSonido("click", 0.4);
                navigate("/hub");
              }}
            >
              <span>Volver al Hub</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaCombate;
