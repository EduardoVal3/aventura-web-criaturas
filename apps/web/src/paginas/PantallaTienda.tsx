import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Coins,
  Crosshair,
  HeartPulse,
  MapPinOff,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
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
import { api, ErrorApi, type ArticuloCatalogoTienda, type RespuestaCatalogoTienda } from "@/api";
import {
  obtenerImagenObjeto,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import {
  LOTES_COMPRA,
  normalizarCantidadCompra,
  calcularResumenCompra,
} from "@/lib/economia-inventario";

export function PantallaTienda() {
  const [catalogo, setCatalogo] = useState<RespuestaCatalogoTienda | null>(null);
  const [monedas, setMonedas] = useState(0);
  const [items, setItems] = useState<ArticuloCatalogoTienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [articuloConfirmar, setArticuloConfirmar] = useState<ArticuloCatalogoTienda | null>(null);
  const [cantidadConfirmar, setCantidadConfirmar] = useState<number>(1);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);

    api
      .obtenerCatalogoTienda()
      .then((datos) => {
        if (cancelado) return;
        setCatalogo(datos);
        setMonedas(datos.saldoMonedas);
        setItems(datos.items);
        const cantidadesIniciales: Record<string, number> = {};
        for (const item of datos.items) {
          cantidadesIniciales[item.codigo] = 1;
        }
        setCantidades(cantidadesIniciales);
      })
      .catch((error) => {
        if (cancelado) return;
        const mensaje = error instanceof ErrorApi ? error.message : "Error al consultar el bazar.";
        toast.error(mensaje);
        reproducirSonido("error");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const fijarCantidad = (codigo: string, valor: number) => {
    reproducirSonido("seleccionar");
    setCantidades((prev) => ({
      ...prev,
      [codigo]: normalizarCantidadCompra(valor),
    }));
  };

  const ajustarCantidad = (codigo: string, delta: number) => {
    reproducirSonido("seleccionar");
    setCantidades((prev) => {
      const actual = prev[codigo] || 1;
      return {
        ...prev,
        [codigo]: normalizarCantidadCompra(actual + delta),
      };
    });
  };

  const abrirConfirmacion = (articulo: ArticuloCatalogoTienda) => {
    const cantidadActual = cantidades[articulo.codigo] || 1;
    setArticuloConfirmar(articulo);
    setCantidadConfirmar(cantidadActual);
    reproducirSonido("seleccionar");
  };

  const ajustarCantidadModal = (delta: number) => {
    reproducirSonido("seleccionar");
    setCantidadConfirmar((prev) => normalizarCantidadCompra(prev + delta));
  };

  const fijarCantidadModal = (valor: number) => {
    reproducirSonido("seleccionar");
    setCantidadConfirmar(normalizarCantidadCompra(valor));
  };

  const ejecutarCompra = async () => {
    if (!articuloConfirmar || comprando) return;

    const resumen = calcularResumenCompra(
      articuloConfirmar.precioCompra,
      cantidadConfirmar,
      monedas,
    );

    if (!resumen.puedeComprar) {
      toast.error("Saldo insuficiente de monedas para formalizar esta adquisición.");
      reproducirSonido("error");
      return;
    }

    try {
      setComprando(true);
      const res = await api.comprarEnTienda({
        itemCodigo: articuloConfirmar.codigo,
        cantidad: resumen.cantidad,
      });

      setMonedas(res.saldoRestante);
      setItems((prev) =>
        prev.map((it) =>
          it.codigo === res.itemCodigo
            ? {
                ...it,
                cantidadEnInventario:
                  res.cantidadEnInventario ?? it.cantidadEnInventario + res.cantidadComprada,
              }
            : it,
        ),
      );

      reproducirSonido("monedas");
      toast.success(
        `¡Has adquirido ${res.cantidadComprada}x ${res.nombre || articuloConfirmar.nombre} por ${res.costoTotal} monedas!`,
      );
      setArticuloConfirmar(null);
    } catch (error) {
      reproducirSonido("error");
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al procesar la adquisición en el bazar.");
      }
    } finally {
      setComprando(false);
    }
  };

  const servicioDisponible = catalogo?.servicioDisponible ?? true;
  const resumenModal = articuloConfirmar
    ? calcularResumenCompra(articuloConfirmar.precioCompra, cantidadConfirmar, monedas)
    : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4 overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Cabecera Mercantil y Saldo en Vivo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-2 border-black shadow-[4px_4px_0_0_#000] bg-card p-3 sm:p-4 rounded-none">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="retro text-xs sm:text-base text-primary tracking-wide drop-shadow-[1px_1px_0_#000]">
              Bazar de Provisiones
            </h1>
            <div className="inline-flex items-center gap-1.5 text-amber-400 retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] bg-amber-500/10 px-2 py-1 rounded-none">
              <Coins className="size-3 sm:size-3.5 text-amber-400 shrink-0" />
              <span>{monedas} Oro</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-sky-400 retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] bg-sky-500/10 px-2 py-1 rounded-none">
              <Package className="size-3 sm:size-3.5 text-sky-400 shrink-0" />
              <span>{items.length} artículos en venta</span>
            </div>
          </div>
          <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
            Ubicación:{" "}
            <span className="text-foreground font-bold">
              {catalogo?.ubicacionActual.nombre ?? "Cargando asentamiento..."}
            </span>{" "}
            • Aprovisiona consumibles y talismanes antes de partir en expedición.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:bg-muted cursor-pointer"
          >
            <Link to="/inventario" className="flex items-center justify-center gap-1.5">
              <Package className="size-3 sm:size-3.5" />
              <span>Ver Bolsa</span>
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

      {/* Alerta si la ubicación no tiene servicio TIENDA */}
      {!servicioDisponible && (
        <div className="rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] bg-amber-500/10 p-3 sm:p-4 flex items-start gap-3 text-amber-300">
          <MapPinOff className="size-4 sm:size-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <p className="retro text-[9px] sm:text-[10px] text-amber-200">
              Servicio de Bazar No Disponible
            </p>
            <p className="retro text-[8px] sm:text-[9px] leading-relaxed text-amber-300/90 break-words">
              Esta ubicación no dispone de bazar comercial activo. Viaja a un asentamiento mercantil
              como el Puesto Fronterizo del Río o el Bastión del Norte para realizar adquisiciones.
            </p>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {cargando && (
        <div className="border-2 border-black shadow-[4px_4px_0_0_#000] p-8 text-center bg-card rounded-none space-y-3">
          <Spinner className="size-6 mx-auto text-primary" />
          <p className="retro text-[9px] sm:text-[10px] text-muted-foreground">Consultando catálogo mercantil...</p>
        </div>
      )}

      {/* Catálogo de Artículos Vacío */}
      {!cargando && items.length === 0 && (
        <div className="border-2 border-black shadow-[4px_4px_0_0_#000] p-8 text-center bg-card rounded-none space-y-3">
          <Package className="size-8 mx-auto text-muted-foreground" />
          <p className="retro text-[9px] sm:text-[10px] text-muted-foreground">
            El bazar no dispone de artículos en este momento.
          </p>
        </div>
      )}

      {/* Catálogo de Artículos Mercantiles (8bitcn/ui Brutalist) */}
      {!cargando && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {items.map((articulo) => {
            const cantidad = cantidades[articulo.codigo] || 1;
            const resumen = calcularResumenCompra(articulo.precioCompra, cantidad, monedas);
            const puedeComprar = servicioDisponible && resumen.puedeComprar;

            return (
              <Card
                key={articulo.codigo}
                className="rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] bg-card transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <div className="flex items-start gap-3">
                    {/* Marco de Sprite Pixelado */}
                    <div className="border-2 border-black bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1.5 size-14 sm:size-16 shrink-0 flex items-center justify-center rounded-none">
                      <img
                        src={obtenerImagenObjeto(articulo.codigo)}
                        alt={articulo.nombre}
                        onError={(e) => manejarErrorImagen(e, "objeto")}
                        className="pixelated size-10 sm:size-12 object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <CardTitle className="retro text-[10px] sm:text-xs leading-relaxed text-foreground break-words">
                          {articulo.nombre}
                        </CardTitle>
                        <Badge
                          variant={
                            articulo.tipo === "CAPTURA"
                              ? "secondary"
                              : articulo.tipo === "CURACION"
                              ? "default"
                              : "outline"
                          }
                          className="rounded-none text-[8px] sm:text-[9px] retro uppercase border-2 border-black flex items-center gap-1 shadow-[2px_2px_0_0_#000] py-0.5 px-1.5"
                        >
                          {articulo.tipo === "CAPTURA" && <Crosshair className="size-2.5 sm:size-3" />}
                          {articulo.tipo === "CURACION" && <HeartPulse className="size-2.5 sm:size-3" />}
                          {articulo.tipo === "ESPECIAL" && <Sparkles className="size-2.5 sm:size-3" />}
                          <span>
                            {articulo.tipo === "CAPTURA"
                              ? "Captura"
                              : articulo.tipo === "CURACION"
                              ? "Curación"
                              : "Especial"}
                          </span>
                        </Badge>
                      </div>

                      <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
                        {articulo.descripcion}
                      </CardDescription>

                      <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
                        {articulo.tipo === "CURACION" && articulo.efectoValor > 0 && (
                          <span className="text-[8px] sm:text-[9px] retro text-emerald-400 bg-emerald-950/40 border-2 border-black px-1.5 py-0.5 rounded-none shadow-[2px_2px_0_0_#000]">
                            +{articulo.efectoValor} HP
                          </span>
                        )}
                        {articulo.tipo === "CAPTURA" && articulo.efectoValor > 0 && (
                          <span className="text-[8px] sm:text-[9px] retro text-sky-400 bg-sky-950/40 border-2 border-black px-1.5 py-0.5 rounded-none shadow-[2px_2px_0_0_#000]">
                            Bono Captura Nv.{articulo.efectoValor}
                          </span>
                        )}
                        <span className="text-[8px] sm:text-[9px] retro text-muted-foreground">
                          En bolsa:{" "}
                          <strong className="text-amber-400">
                            x{articulo.cantidadEnInventario}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 pt-2 space-y-2.5 sm:space-y-3">
                  {/* Selector Rápido de Lotes y Botones Unitarios */}
                  <div className="space-y-2 pt-2 border-t-2 border-black/40">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="retro text-[8px] sm:text-[9px] text-muted-foreground">
                        Elegir Lote:
                      </span>
                      <div className="flex items-center gap-1">
                        {LOTES_COMPRA.map((lote) => (
                          <Button
                            key={lote}
                            size="sm"
                            variant={cantidad === lote ? "default" : "outline"}
                            className="h-6 sm:h-7 px-2 text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                            onClick={() => fijarCantidad(articulo.codigo, lote)}
                            disabled={!servicioDisponible}
                          >
                            x{lote}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="retro text-[8px] sm:text-[9px] text-muted-foreground">Ajuste fino:</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="size-6 sm:size-7 p-0 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                          onClick={() => ajustarCantidad(articulo.codigo, -1)}
                          disabled={cantidad <= 1 || !servicioDisponible}
                          aria-label={`Reducir cantidad de ${articulo.nombre}`}
                        >
                          <Minus className="size-2.5 sm:size-3" />
                        </Button>
                        <span className="retro text-[9px] sm:text-[10px] w-7 text-center">
                          {cantidad}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="size-6 sm:size-7 p-0 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                          onClick={() => ajustarCantidad(articulo.codigo, 1)}
                          disabled={cantidad >= 99 || !servicioDisponible}
                          aria-label={`Incrementar cantidad de ${articulo.nombre}`}
                        >
                          <Plus className="size-2.5 sm:size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desglose Económico */}
                  <div className="grid grid-cols-2 gap-2 retro text-[8px] sm:text-[9px] p-2 bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.4)] rounded-none">
                    <div>
                      <span className="text-muted-foreground block">Precio unitario:</span>
                      <span className="text-amber-400 font-bold">
                        {articulo.precioCompra} oro
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block">Costo ({cantidad}x):</span>
                      <span
                        className={`font-bold ${
                          resumen.puedeComprar ? "text-amber-400" : "text-destructive"
                        }`}
                      >
                        {resumen.costoTotal} oro
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 sm:p-4 pt-2 border-t-2 border-black/40">
                  <Button
                    className="w-full text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 py-2 sm:py-2.5"
                    disabled={!puedeComprar || comprando}
                    onClick={() => abrirConfirmacion(articulo)}
                  >
                    <ShoppingCart className="size-3 sm:size-3.5" />
                    {!servicioDisponible ? (
                      <span>Bazar Inactivo</span>
                    ) : resumen.puedeComprar ? (
                      <span>Adquirir lote ({resumen.costoTotal} oro)</span>
                    ) : (
                      <span className="text-destructive-foreground">Oro insuficiente</span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Compra Sellado contra Overflow (Dialog 8-bit Brutalist) */}
      <Dialog
        open={Boolean(articuloConfirmar)}
        onOpenChange={(abierto) => {
          if (!abierto && !comprando) {
            setArticuloConfirmar(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-card overflow-hidden p-4 sm:p-5 rounded-none">
          {articuloConfirmar && resumenModal && (
            <>
              <DialogHeader className="text-left space-y-1.5">
                <DialogTitle className="retro text-[10px] sm:text-xs text-primary leading-relaxed">
                  Confirmación de Adquisición
                </DialogTitle>
                <DialogDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
                  Revisa las condiciones y el saldo proyectado antes de sellar la transacción.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 sm:space-y-4 py-2">
                {/* Resumen del Artículo */}
                <div className="flex items-center gap-3 border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/40 p-2.5 sm:p-3 rounded-none">
                  <div className="border-2 border-black bg-black/60 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] p-1 size-12 sm:size-14 shrink-0 flex items-center justify-center rounded-none">
                    <img
                      src={obtenerImagenObjeto(articuloConfirmar.codigo)}
                      alt={articuloConfirmar.nombre}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      className="pixelated size-9 sm:size-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="retro text-[9px] sm:text-[10px] text-foreground leading-relaxed break-words">
                      {articuloConfirmar.nombre}
                    </h3>
                    <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
                      {articuloConfirmar.descripcion}
                    </p>
                    <p className="retro text-[8px] sm:text-[9px] text-amber-400 font-bold">
                      {articuloConfirmar.precioCompra} oro por unidad
                    </p>
                  </div>
                </div>

                {/* Ajuste de Lote en Modal */}
                <div className="space-y-2 border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/20 p-2.5 sm:p-3 rounded-none">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="retro text-[8px] sm:text-[9px] text-muted-foreground">Unidades a comprar:</span>
                    <div className="flex items-center gap-1">
                      {LOTES_COMPRA.map((lote) => (
                        <Button
                          key={lote}
                          size="sm"
                          variant={cantidadConfirmar === lote ? "default" : "outline"}
                          className="h-6 px-2 text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                          disabled={comprando}
                          onClick={() => fijarCantidadModal(lote)}
                        >
                          x{lote}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 border-2 border-black p-2 bg-black/40 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.4)] rounded-none">
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-7 p-0 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                      disabled={cantidadConfirmar <= 1 || comprando}
                      onClick={() => ajustarCantidadModal(-1)}
                      aria-label="Restar una unidad"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="retro text-xs text-foreground w-12 text-center">
                      x{cantidadConfirmar}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-7 p-0 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                      disabled={cantidadConfirmar >= 99 || comprando}
                      onClick={() => ajustarCantidadModal(1)}
                      aria-label="Sumar una unidad"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Balances Financieros con código de color dinámico */}
                <div className="space-y-1.5 retro text-[8px] sm:text-[9px] border-2 border-black shadow-[2px_2px_0_0_#000] bg-black/50 p-2.5 sm:p-3 rounded-none">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Saldo actual:</span>
                    <span className="text-amber-400 font-bold">{monedas} oro</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Costo total ({resumenModal.cantidad}x):</span>
                    <span className="text-destructive font-bold">
                      -{resumenModal.costoTotal} oro
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t-2 border-black/40 font-bold">
                    <span>Saldo restante:</span>
                    <span
                      className={
                        resumenModal.puedeComprar ? "text-emerald-400" : "text-destructive"
                      }
                    >
                      {resumenModal.saldoRestante} oro
                    </span>
                  </div>
                </div>
              </div>

              {/* Botonera Apilada Verticalmente para Evitar Desbordes */}
              <DialogFooter className="flex flex-col gap-2 sm:flex-col w-full mt-2">
                <Button
                  className="w-full text-[8px] sm:text-[9px] retro py-3 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                  disabled={comprando || !resumenModal.puedeComprar}
                  aria-busy={comprando}
                  onClick={ejecutarCompra}
                >
                  {comprando ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="size-3.5 sm:size-4" />
                      <span>PROCESANDO...</span>
                    </div>
                  ) : resumenModal.puedeComprar ? (
                    <span>Confirmar Adquisición ({resumenModal.costoTotal} oro)</span>
                  ) : (
                    <span className="text-destructive-foreground">Oro Insuficiente</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-[8px] sm:text-[9px] retro rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                  disabled={comprando}
                  onClick={() => setArticuloConfirmar(null)}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaTienda;
