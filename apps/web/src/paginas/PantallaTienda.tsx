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
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera Táctica y Saldo en Vivo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-border bg-bastion p-4 rounded-none">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="retro text-base sm:text-lg text-primary tracking-wide">
              Bazar de Provisiones
            </h1>
            <div className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs sm:text-sm border-2 border-amber-500/60 bg-amber-500/10 px-2.5 py-1 rounded-none">
              <Coins className="size-4 text-amber-400" />
              <span>{monedas} Oro</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Ubicación:{" "}
            <span className="font-semibold text-foreground">
              {catalogo?.ubicacionActual.nombre ?? "Cargando asentamiento..."}
            </span>{" "}
            • Aprovisiona consumibles y talismanes antes de partir en expedición.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="text-xs rounded-none">
            <Link to="/inventario" className="flex items-center gap-1.5">
              <Package className="size-3.5" />
              <span>Ver Bolsa</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs rounded-none">
            <Link to="/hub" className="flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" />
              <span>Asentamiento</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerta si la ubicación no tiene servicio TIENDA */}
      {!servicioDisponible && (
        <div className="rounded-none border-2 border-amber-500/70 bg-amber-500/10 p-4 flex items-start gap-3 text-amber-300">
          <MapPinOff className="size-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold retro text-[11px] text-amber-200">
              Servicio de Bazar No Disponible
            </p>
            <p className="font-sans leading-relaxed text-amber-300/90">
              Esta ubicación no dispone de bazar comercial activo. Viaja a un asentamiento mercantil
              como el Puesto Fronterizo del Río o el Bastión del Norte para realizar adquisiciones.
            </p>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {cargando && (
        <div className="border-2 border-border p-8 text-center bg-bastion rounded-none space-y-3">
          <Spinner className="size-6 mx-auto text-primary" />
          <p className="retro text-xs text-muted-foreground">Consultando catálogo mercantil...</p>
        </div>
      )}

      {/* Catálogo de Artículos */}
      {!cargando && items.length === 0 && (
        <div className="border-2 border-border p-8 text-center bg-bastion rounded-none space-y-3">
          <Package className="size-8 mx-auto text-muted-foreground" />
          <p className="retro text-xs text-muted-foreground">
            El bazar no dispone de artículos en este momento.
          </p>
        </div>
      )}

      {!cargando && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((articulo) => {
            const cantidad = cantidades[articulo.codigo] || 1;
            const resumen = calcularResumenCompra(articulo.precioCompra, cantidad, monedas);
            const puedeComprar = servicioDisponible && resumen.puedeComprar;

            return (
              <Card
                key={articulo.codigo}
                className="rounded-none border-2 bg-bastion flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start gap-3">
                    {/* Marco de Sprite Pixelado */}
                    <div className="border-2 border-border bg-abismo/60 p-1.5 size-16 shrink-0 flex items-center justify-center rounded-none">
                      <img
                        src={obtenerImagenObjeto(articulo.codigo)}
                        alt={articulo.nombre}
                        onError={(e) => manejarErrorImagen(e, "objeto")}
                        className="pixelated h-12 w-12 object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <CardTitle className="retro text-xs leading-relaxed text-foreground truncate">
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
                          className="rounded-none text-[10px] uppercase font-mono flex items-center gap-1"
                        >
                          {articulo.tipo === "CAPTURA" && <Crosshair className="size-3" />}
                          {articulo.tipo === "CURACION" && <HeartPulse className="size-3" />}
                          {articulo.tipo === "ESPECIAL" && <Sparkles className="size-3" />}
                          <span>
                            {articulo.tipo === "CAPTURA"
                              ? "Captura"
                              : articulo.tipo === "CURACION"
                              ? "Curación"
                              : "Especial"}
                          </span>
                        </Badge>
                      </div>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                        {articulo.descripcion}
                      </CardDescription>

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {articulo.tipo === "CURACION" && articulo.efectoValor > 0 && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-1.5 py-0.5 rounded-none">
                            +{articulo.efectoValor} HP
                          </span>
                        )}
                        {articulo.tipo === "CAPTURA" && articulo.efectoValor > 0 && (
                          <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/40 border border-sky-500/40 px-1.5 py-0.5 rounded-none">
                            Bono Captura Nv.{articulo.efectoValor}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground">
                          En tu bolsa:{" "}
                          <strong className="text-foreground">
                            x{articulo.cantidadEnInventario}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Selector Rápido de Lotes y Botones Unitarios */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Elegir Lote:
                      </span>
                      <div className="flex items-center gap-1">
                        {LOTES_COMPRA.map((lote) => (
                          <Button
                            key={lote}
                            size="sm"
                            variant={cantidad === lote ? "default" : "outline"}
                            className="h-7 px-2 text-xs font-mono rounded-none"
                            onClick={() => fijarCantidad(articulo.codigo, lote)}
                            disabled={!servicioDisponible}
                          >
                            x{lote}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Ajuste fino:</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="size-7 p-0 rounded-none"
                          onClick={() => ajustarCantidad(articulo.codigo, -1)}
                          disabled={cantidad <= 1 || !servicioDisponible}
                          aria-label={`Reducir cantidad de ${articulo.nombre}`}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="font-mono font-bold w-7 text-center text-xs">
                          {cantidad}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="size-7 p-0 rounded-none"
                          onClick={() => ajustarCantidad(articulo.codigo, 1)}
                          disabled={cantidad >= 99 || !servicioDisponible}
                          aria-label={`Incrementar cantidad de ${articulo.nombre}`}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desglose Económico */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 bg-abismo/40 border-2 border-border/60 rounded-none">
                    <div>
                      <span className="text-muted-foreground block">Precio unitario:</span>
                      <span className="font-bold text-amber-400">
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

                <CardFooter className="p-4 pt-2 border-t border-border/50">
                  <Button
                    className="w-full text-xs rounded-none flex items-center justify-center gap-2"
                    disabled={!puedeComprar || comprando}
                    onClick={() => abrirConfirmacion(articulo)}
                  >
                    <ShoppingCart className="size-3.5" />
                    {!servicioDisponible ? (
                      <span>Bazar Inactivo</span>
                    ) : resumen.puedeComprar ? (
                      <span>Adquirir lote ({resumen.costoTotal} oro)</span>
                    ) : (
                      <span>Oro insuficiente</span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Compra Sellado contra Overflow */}
      <Dialog
        open={Boolean(articuloConfirmar)}
        onOpenChange={(abierto) => {
          if (!abierto && !comprando) {
            setArticuloConfirmar(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden rounded-none border-2 border-border bg-bastion p-5">
          {articuloConfirmar && resumenModal && (
            <>
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="retro text-sm text-primary">
                  Confirmación de Adquisición
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Revisa las condiciones y el saldo proyectado antes de sellar la transacción.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Resumen del Artículo */}
                <div className="flex items-center gap-3 border-2 border-border bg-abismo/50 p-3 rounded-none">
                  <div className="border border-border bg-abismo p-1 size-14 shrink-0 flex items-center justify-center rounded-none">
                    <img
                      src={obtenerImagenObjeto(articuloConfirmar.codigo)}
                      alt={articuloConfirmar.nombre}
                      onError={(e) => manejarErrorImagen(e, "objeto")}
                      className="pixelated h-10 w-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="retro text-xs text-foreground truncate">
                      {articuloConfirmar.nombre}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {articuloConfirmar.descripcion}
                    </p>
                    <p className="text-[11px] font-mono text-amber-400 mt-1">
                      {articuloConfirmar.precioCompra} oro por unidad
                    </p>
                  </div>
                </div>

                {/* Ajuste de Lote en Modal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Unidades a comprar:</span>
                    <div className="flex items-center gap-1">
                      {LOTES_COMPRA.map((lote) => (
                        <Button
                          key={lote}
                          size="sm"
                          variant={cantidadConfirmar === lote ? "default" : "outline"}
                          className="h-6 px-2 text-[11px] font-mono rounded-none"
                          disabled={comprando}
                          onClick={() => fijarCantidadModal(lote)}
                        >
                          x{lote}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 border border-border/60 p-2 bg-bastion rounded-none">
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-7 p-0 rounded-none"
                      disabled={cantidadConfirmar <= 1 || comprando}
                      onClick={() => ajustarCantidadModal(-1)}
                      aria-label="Restar una unidad"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="font-mono font-bold text-sm text-foreground w-12 text-center">
                      x{cantidadConfirmar}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-7 p-0 rounded-none"
                      disabled={cantidadConfirmar >= 99 || comprando}
                      onClick={() => ajustarCantidadModal(1)}
                      aria-label="Sumar una unidad"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Balances Financieros */}
                <div className="space-y-1.5 text-xs font-mono border-2 border-border/80 bg-abismo/60 p-3 rounded-none">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Saldo actual:</span>
                    <span className="text-amber-400">{monedas} oro</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Costo total ({resumenModal.cantidad}x):</span>
                    <span className="text-destructive font-bold">
                      -{resumenModal.costoTotal} oro
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border/50 font-bold">
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
                  className="w-full text-xs rounded-none retro py-3"
                  disabled={comprando || !resumenModal.puedeComprar}
                  aria-busy={comprando}
                  onClick={ejecutarCompra}
                >
                  {comprando ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="size-4" />
                      <span>PROCESANDO...</span>
                    </div>
                  ) : resumenModal.puedeComprar ? (
                    <span>Confirmar Adquisición ({resumenModal.costoTotal} oro)</span>
                  ) : (
                    <span>Oro Insuficiente</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-xs rounded-none"
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
