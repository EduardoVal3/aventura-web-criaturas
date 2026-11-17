import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Coins,
  Crown,
  Crosshair,
  HeartPulse,
  Layers,
  Package,
  Sparkles,
  Store,
} from "lucide-react";
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
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/8bit/dialog";
import HealthBar from "@/components/ui/8bit/health-bar";
import {
  api,
  type ItemInventario,
  type CriaturaEquipo,
  type CategoriaObjeto,
  type RespuestaInventario,
  ErrorApi,
} from "@/api";
import {
  obtenerImagenObjeto,
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import {
  filtrarItemsPorCategoria,
  calcularVistaPreviaCuracion,
} from "@/lib/economia-inventario";

type CategoriaFiltro = "TODOS" | CategoriaObjeto;

export function PantallaInventario() {
  const [inventario, setInventario] = useState<RespuestaInventario | null>(null);
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [monedas, setMonedas] = useState(0);
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>("TODOS");

  // Estado para el modal de curación reactiva
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemInventario | null>(null);
  const [modalCuracionAbierto, setModalCuracionAbierto] = useState(false);
  const [criaturaObjetivoId, setCriaturaObjetivoId] = useState<string | null>(null);
  const [usando, setUsando] = useState(false);
  const [ultimaCriaturaCuradaId, setUltimaCriaturaCuradaId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resInventario, resEquipo] = await Promise.all([
        api.obtenerInventario(),
        api.obtenerEquipo(),
      ]);
      setInventario(resInventario);
      setItems(resInventario.items);
      setMonedas(resInventario.monedas);
      setEquipo(resEquipo.criaturas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar los objetos del inventario.");
      }
      reproducirSonido("error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cambiarCategoria = (cat: CategoriaFiltro) => {
    reproducirSonido("seleccionar");
    setCategoriaActiva(cat);
  };

  const abrirModalUso = (item: ItemInventario) => {
    if (item.tipo === "CAPTURA") {
      toast.info("Los talismanes de captura solo pueden utilizarse durante un combate activo.");
      reproducirSonido("error");
      return;
    }
    if (item.tipo === "ESPECIAL") {
      toast.info("Este objeto especial es una reliquia pasiva o de uso en misiones.");
      reproducirSonido("seleccionar");
      return;
    }
    setItemSeleccionado(item);
    setModalCuracionAbierto(true);
    reproducirSonido("seleccionar");
  };

  const handleCurarCriatura = async (criatura: CriaturaEquipo) => {
    if (!itemSeleccionado || usando) return;

    const vistaPrevia = calcularVistaPreviaCuracion(
      criatura.hpActual,
      criatura.hpMaximo,
      itemSeleccionado.efectoValor ?? 0,
    );

    if (vistaPrevia.yaSaludCompleta) {
      toast.info("La criatura seleccionada ya tiene sus puntos de salud al máximo.");
      reproducirSonido("error");
      return;
    }

    try {
      setUsando(true);
      setCriaturaObjetivoId(criatura.criaturaId);

      const res = await api.usarItem({
        itemCodigo: itemSeleccionado.codigo,
        criaturaId: criatura.criaturaId,
      });

      reproducirSonido("curar");
      setUltimaCriaturaCuradaId(criatura.criaturaId);
      setTimeout(() => setUltimaCriaturaCuradaId(null), 1200);

      toast.success(
        `¡${itemSeleccionado.nombre} aplicada a ${res.criaturaNombre || criatura.nombre}! (+${
          res.curacionAplicada ?? res.hpNuevo - res.hpPrevio
        } HP)`,
      );

      // Actualizar criatura reactivamente en el equipo local
      setEquipo((prev) =>
        prev.map((c) =>
          c.criaturaId === criatura.criaturaId ? { ...c, hpActual: res.hpNuevo } : c,
        ),
      );

      // Actualizar existencias del ítem en el inventario local
      setItems((prev) =>
        prev
          .map((i) =>
            i.codigo === itemSeleccionado.codigo ? { ...i, cantidad: res.cantidadRestante } : i,
          )
          .filter((i) => i.cantidad > 0),
      );

      if (res.cantidadRestante <= 0) {
        setItemSeleccionado(null);
        setModalCuracionAbierto(false);
      } else {
        setItemSeleccionado((prev) => (prev ? { ...prev, cantidad: res.cantidadRestante } : null));
      }
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al aplicar el consumible sobre la criatura.");
      }
    } finally {
      setUsando(false);
      setCriaturaObjetivoId(null);
    }
  };

  // Métricas de capacidad de inventario
  const capacidadMaxima = inventario?.capacidadMaxima ?? 20;
  const ranurasOcupadas = inventario?.ranurasOcupadas ?? items.length;
  const totalUnidades =
    inventario?.totalUnidades ?? items.reduce((acc, it) => acc + it.cantidad, 0);
  const porcentajeCapacidad = Math.min(100, Math.round((ranurasOcupadas / capacidadMaxima) * 100));

  // Conteo de elementos por categoría
  const cuentaCuracion = items.filter((i) => i.tipo === "CURACION").length;
  const cuentaCaptura = items.filter((i) => i.tipo === "CAPTURA").length;
  const cuentaEspecial = items.filter((i) => i.tipo === "ESPECIAL").length;

  // simplificacion: filtrado en memoria de items; suficiente para el límite de 20 ranuras de bolsa del explorador.
  const itemsFiltrados = filtrarItemsPorCategoria(items, categoriaActiva);

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4 overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Cabecera y Balances Tácticos de Bolsa */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-2 border-black shadow-[4px_4px_0_0_#000] bg-card p-3 sm:p-4 rounded-none">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="retro text-xs sm:text-base text-primary tracking-wide drop-shadow-[1px_1px_0_#000]">
              Bolsa e Inventario
            </h1>
            <div className="inline-flex items-center gap-1.5 text-amber-400 retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/10 px-2 py-1 rounded-none">
              <Coins className="size-3 sm:size-3.5 text-amber-400 shrink-0" />
              <span>{monedas} Oro</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-sky-400 retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] bg-sky-500/10 px-2 py-1 rounded-none">
              <Package className="size-3 sm:size-3.5 text-sky-400 shrink-0" />
              <span>
                Ranuras: {ranurasOcupadas}/{capacidadMaxima} • {totalUnidades} uds.
              </span>
            </div>
          </div>
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
            Gestión táctica de provisiones medicinales, talismanes de expedición y reliquias.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/tienda" className="flex items-center justify-center gap-1.5">
              <Store className="size-3 sm:size-3.5" />
              <span>Ir al Bazar</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/hub" className="flex items-center justify-center gap-1.5">
              <ArrowLeft className="size-3 sm:size-3.5" />
              <span>Asentamiento</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Indicador Visual de Capacidad de Carga */}
      <div className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card p-3 rounded-none space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 retro text-[8px] sm:text-[9px]">
          <span className="text-muted-foreground">Capacidad de carga de la bolsa:</span>
          <span className="text-foreground">
            {ranurasOcupadas} de {capacidadMaxima} ranuras ocupadas ({porcentajeCapacidad}%)
          </span>
        </div>

        {/* Barra de Progreso Ortogonal */}
        <div className="h-3 w-full bg-black/60 border-2 border-black rounded-none overflow-hidden p-0.5">
          <div
            className={`h-full transition-all duration-300 ${
              porcentajeCapacidad >= 90
                ? "bg-destructive"
                : porcentajeCapacidad >= 70
                ? "bg-amber-500"
                : "bg-primary"
            }`}
            style={{ width: `${porcentajeCapacidad}%` }}
          />
        </div>

        {/* Grilla Simbólica de Ranuras 8-Bit */}
        <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 pt-1">
          {Array.from({ length: capacidadMaxima }).map((_, idx) => {
            const ocupada = idx < ranurasOcupadas;
            return (
              <div
                key={idx}
                className={`h-2 border border-black ${
                  ocupada ? "bg-primary" : "bg-black/30"
                }`}
                title={ocupada ? `Ranura ${idx + 1}: Ocupada` : `Ranura ${idx + 1}: Vacía`}
              />
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros por Categoría */}
      <div
        role="tablist"
        aria-label="Filtros de categoría de inventario"
        className="flex flex-wrap gap-1.5 sm:gap-2 border-2 border-black shadow-[4px_4px_0_0_#000] bg-card p-2 sm:p-2.5 rounded-none"
      >
        <Button
          size="sm"
          variant={categoriaActiva === "TODOS" ? "default" : "outline"}
          className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 px-2 py-1"
          onClick={() => cambiarCategoria("TODOS")}
        >
          <Layers className="size-3 sm:size-3.5 shrink-0" />
          <span>Todos ({items.length})</span>
        </Button>

        <Button
          size="sm"
          variant={categoriaActiva === "CURACION" ? "default" : "outline"}
          className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 px-2 py-1"
          onClick={() => cambiarCategoria("CURACION")}
        >
          <HeartPulse className="size-3 sm:size-3.5 shrink-0" />
          <span>Curación ({cuentaCuracion})</span>
        </Button>

        <Button
          size="sm"
          variant={categoriaActiva === "CAPTURA" ? "default" : "outline"}
          className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 px-2 py-1"
          onClick={() => cambiarCategoria("CAPTURA")}
        >
          <Crosshair className="size-3 sm:size-3.5 shrink-0" />
          <span>Captura ({cuentaCaptura})</span>
        </Button>

        <Button
          size="sm"
          variant={categoriaActiva === "ESPECIAL" ? "default" : "outline"}
          className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 px-2 py-1"
          onClick={() => cambiarCategoria("ESPECIAL")}
        >
          <Sparkles className="size-3 sm:size-3.5 shrink-0" />
          <span>Especial ({cuentaEspecial})</span>
        </Button>
      </div>

      {/* Estado de Carga */}
      {cargando && (
        <div className="border-2 border-black shadow-[4px_4px_0_0_#000] p-6 sm:p-8 text-center bg-card rounded-none space-y-3">
          <Spinner className="size-6 mx-auto text-primary" />
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground">
            Inspeccionando bolsa de explorador...
          </p>
        </div>
      )}

      {/* Estado Vacío General o por Filtro */}
      {!cargando && itemsFiltrados.length === 0 && (
        <Card className="text-center p-6 sm:p-8 border-2 border-black shadow-[4px_4px_0_0_#000] bg-card rounded-none space-y-3">
          <Package className="size-8 mx-auto text-muted-foreground" />
          <CardTitle className="retro text-[10px] sm:text-xs text-foreground">
            {items.length === 0
              ? "Tu bolsa de provisiones está vacía"
              : "No se encontraron objetos en esta categoría"}
          </CardTitle>
          <CardDescription className="retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground max-w-md mx-auto">
            {items.length === 0
              ? "Visita el bazar comercial en un asentamiento para adquirir pociones reconstituyentes y talismanes de expedición."
              : "Selecciona otra pestaña o restablece los filtros para ver los demás objetos de tu bolsa."}
          </CardDescription>

          <div className="pt-2 flex justify-center gap-2 flex-wrap">
            {items.length === 0 ? (
              <Button
                asChild
                size="sm"
                className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                <Link to="/tienda" className="flex items-center gap-1.5">
                  <Store className="size-3.5" />
                  <span>Ir al Bazar</span>
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                onClick={() => cambiarCategoria("TODOS")}
              >
                Ver todos los objetos
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Cuadrícula Táctica de Tarjetas de Inventario (Cero Scroll Horizontal) */}
      {!cargando && itemsFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {itemsFiltrados.map((item) => (
            <Card
              key={item.codigo}
              className="rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transition-shadow bg-card flex flex-col justify-between"
            >
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-start gap-3">
                  {/* Sprite Pixelado del Objeto con marco y relieve */}
                  <div className="border-2 border-black bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1.5 size-14 shrink-0 flex items-center justify-center rounded-none">
                    <img
                      src={obtenerImagenObjeto(item.codigo)}
                      alt={item.nombre}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      className="pixelated h-10 w-10 object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5 flex-wrap">
                      <CardTitle className="retro text-[10px] sm:text-xs leading-snug text-foreground break-words">
                        {item.nombre}
                      </CardTitle>
                      <Badge
                        variant={
                          item.tipo === "CURACION"
                            ? "default"
                            : item.tipo === "CAPTURA"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-none text-[8px] sm:text-[9px] uppercase retro border-2 border-black shadow-[1px_1px_0_0_#000] flex items-center gap-1 px-1.5 py-0.5"
                      >
                        {item.tipo === "CURACION" && <HeartPulse className="size-2.5 sm:size-3" />}
                        {item.tipo === "CAPTURA" && <Crosshair className="size-2.5 sm:size-3" />}
                        {item.tipo === "ESPECIAL" && <Sparkles className="size-2.5 sm:size-3" />}
                        <span>
                          {item.tipo === "CURACION"
                            ? "Curación"
                            : item.tipo === "CAPTURA"
                            ? "Captura"
                            : "Especial"}
                        </span>
                      </Badge>
                    </div>

                    <p className="retro text-[8px] text-muted-foreground break-all">
                      Cód: {item.codigo}
                    </p>

                    {item.descripcion && (
                      <CardDescription className="retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
                        {item.descripcion}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 pt-1 space-y-2">
                <div className="border-2 border-black bg-black/30 p-2 sm:p-2.5 rounded-none space-y-1.5">
                  <div className="flex items-center justify-between retro text-[8px] sm:text-[9px] gap-2">
                    <span className="text-muted-foreground">Efecto:</span>
                    <span className="text-foreground text-right break-words">
                      {item.tipo === "CURACION" && (item.efectoValor ?? 0) > 0
                        ? `Restaura +${item.efectoValor} HP`
                        : item.tipo === "CAPTURA" && (item.efectoValor ?? 0) > 0
                        ? `Bono de captura Nv.${item.efectoValor}`
                        : "Uso táctico"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between retro text-[8px] sm:text-[9px] pt-1 border-t border-black/40">
                    <span className="text-muted-foreground">Existencias:</span>
                    <span className="text-amber-400 font-bold retro text-[9px] sm:text-[10px]">
                      x{item.cantidad}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-3 sm:p-4 pt-1 border-t-2 border-black/30">
                {item.tipo === "CURACION" ? (
                  <Button
                    size="sm"
                    className="w-full retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5 py-2"
                    onClick={() => abrirModalUso(item)}
                  >
                    <HeartPulse className="size-3 sm:size-3.5" />
                    <span>Aplicar a criatura</span>
                  </Button>
                ) : item.tipo === "CAPTURA" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5 py-2 text-muted-foreground"
                    onClick={() => abrirModalUso(item)}
                  >
                    <Crosshair className="size-3 sm:size-3.5" />
                    <span>Uso en combate</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5 py-2 text-muted-foreground"
                    onClick={() => abrirModalUso(item)}
                  >
                    <Sparkles className="size-3 sm:size-3.5" />
                    <span>Reliquia / Especial</span>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Curación Fuera de Combate Sellado contra Overflow (INV-03) */}
      <Dialog
        open={modalCuracionAbierto}
        onOpenChange={(abierto) => {
          if (!abierto && !usando) {
            setModalCuracionAbierto(false);
            setItemSeleccionado(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-card overflow-hidden p-4 sm:p-5 rounded-none">
          {itemSeleccionado && (
            <>
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <HeartPulse className="size-4 text-emerald-400 shrink-0" />
                  <DialogTitle className="retro text-xs sm:text-sm text-primary drop-shadow-[1px_1px_0_#000]">
                    Curación de Compañero
                  </DialogTitle>
                </div>
                <DialogDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
                  Aplica {itemSeleccionado.nombre} para restablecer la vitalidad de tu equipo.
                </DialogDescription>
              </DialogHeader>

              {/* Ficha del Consumible Activo */}
              <div className="flex items-center gap-2.5 sm:gap-3 border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/40 p-2.5 rounded-none">
                <div className="border-2 border-black bg-black/60 p-1 size-11 sm:size-12 shrink-0 flex items-center justify-center rounded-none">
                  <img
                    src={obtenerImagenObjeto(itemSeleccionado.codigo)}
                    alt={itemSeleccionado.nombre}
                    onError={(e) => manejarErrorImagen(e, "objeto")}
                    className="pixelated h-8 w-8 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="retro text-[9px] sm:text-[10px] block text-foreground break-words">
                    {itemSeleccionado.nombre}
                  </span>
                  <div className="flex items-center gap-2.5 text-muted-foreground retro text-[8px] sm:text-[9px] mt-1 flex-wrap">
                    <span>
                      Existencias:{" "}
                      <strong className="text-amber-400">x{itemSeleccionado.cantidad}</strong>
                    </span>
                    {(itemSeleccionado.efectoValor ?? 0) > 0 && (
                      <span className="text-emerald-400">
                        +{itemSeleccionado.efectoValor} HP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista Desplazable del Equipo con HealthBar y Vista Previa */}
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 py-1">
                {equipo.length === 0 ? (
                  <p className="retro text-[8px] sm:text-[9px] text-muted-foreground text-center py-4">
                    No tienes criaturas asignadas en tu equipo activo.
                  </p>
                ) : (
                  equipo.map((criatura) => {
                    const efectoPocion = itemSeleccionado.efectoValor ?? 0;
                    const vista = calcularVistaPreviaCuracion(
                      criatura.hpActual,
                      criatura.hpMaximo,
                      efectoPocion,
                    );
                    const porcentajeActual = Math.round(
                      (criatura.hpActual / criatura.hpMaximo) * 100,
                    );
                    const porcentajeProyectado = Math.round(
                      (vista.hpNuevo / criatura.hpMaximo) * 100,
                    );
                    const enProceso = usando && criaturaObjetivoId === criatura.criaturaId;
                    const acabaDeCurarse = ultimaCriaturaCuradaId === criatura.criaturaId;

                    return (
                      <div
                        key={criatura.criaturaId}
                        className={`p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/30 rounded-none transition-all duration-300 ${
                          acabaDeCurarse ? "anim-restauracion-salud border-emerald-500" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Sprite Pixelado de la Criatura con marco retro */}
                          <div className="size-11 sm:size-12 shrink-0 border-2 border-black bg-black/40 p-0.5 flex items-center justify-center rounded-none">
                            <img
                              src={obtenerImagenCriatura(criatura.slug)}
                              alt={criatura.nombre}
                              onError={(e) => manejarErrorImagen(e, "criatura")}
                              className="pixelated h-9 w-9 sm:h-10 sm:w-10 object-contain"
                              loading="lazy"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="retro text-[9px] sm:text-[10px] text-foreground break-words">
                                  {criatura.apodo || criatura.nombre}
                                </span>
                                {criatura.orden === 1 && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-none text-[7px] sm:text-[8px] px-1 py-0 retro border border-black flex items-center gap-0.5"
                                  >
                                    <Crown className="size-2 text-amber-400 shrink-0" />
                                    <span>LÍDER</span>
                                  </Badge>
                                )}
                              </div>
                              <span className="retro text-[8px] sm:text-[9px] text-muted-foreground">
                                Nv.{criatura.nivel}
                              </span>
                            </div>

                            {/* Barra de Salud Reactiva */}
                            <HealthBar value={porcentajeActual} className="h-2 rounded-none border border-black" />

                            <div className="flex items-center justify-between retro text-[8px] sm:text-[9px] gap-1 flex-wrap">
                              <span className="text-muted-foreground">
                                {criatura.hpActual} / {criatura.hpMaximo} HP
                              </span>

                              {!vista.yaSaludCompleta ? (
                                <span className="text-emerald-400">
                                  +{vista.curacionEfectiva} HP ({porcentajeProyectado}%)
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[8px]">
                                  Salud Completa
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón de Aplicación de Curación con Hardening */}
                        <div className="mt-2 pt-2 border-t border-black/40 flex justify-end">
                          <Button
                            size="sm"
                            className="w-full sm:w-auto retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer py-1.5"
                            disabled={usando || vista.yaSaludCompleta}
                            aria-busy={enProceso}
                            onClick={() => handleCurarCriatura(criatura)}
                          >
                            {enProceso ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Spinner className="size-3" />
                                <span>PROCESANDO...</span>
                              </div>
                            ) : vista.yaSaludCompleta ? (
                              <span>Salud Completa</span>
                            ) : (
                              <span>Sanar (+{vista.curacionEfectiva} HP)</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botonera Apilada Verticalmente */}
              <DialogFooter className="flex flex-col gap-2 sm:flex-col w-full mt-2">
                <Button
                  variant="outline"
                  className="w-full retro text-[8px] sm:text-[9px] rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer py-2"
                  disabled={usando}
                  onClick={() => {
                    setModalCuracionAbierto(false);
                    setItemSeleccionado(null);
                  }}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaInventario;
