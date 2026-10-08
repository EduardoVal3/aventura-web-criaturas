import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/8bit/table";
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
  type ItemInventario,
  type CriaturaEquipo,
  ErrorApi,
} from "@/api";

export function PantallaInventario() {
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [monedas, setMonedas] = useState(0);
  const [equipo, setEquipo] = useState<CriaturaEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemInventario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usando, setUsando] = useState(false);

  const cargarDatos = async () => {
    try {
      const [resInventario, resEquipo] = await Promise.all([
        api.obtenerInventario(),
        api.obtenerEquipo(),
      ]);
      setItems(resInventario.items);
      setMonedas(resInventario.monedas);
      setEquipo(resEquipo.criaturas);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar los objetos del inventario.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalUso = (item: ItemInventario) => {
    if (item.tipo === "CAPTURA") {
      toast.info("Los talismanes de captura solo pueden utilizarse durante el combate activo.");
      return;
    }
    setItemSeleccionado(item);
    setModalAbierto(true);
  };

  const handleUsarSobreCriatura = async (criatura: CriaturaEquipo) => {
    if (!itemSeleccionado) return;
    try {
      setUsando(true);
      const res = await api.usarItem({
        itemCodigo: itemSeleccionado.codigo,
        criaturaId: criatura.criaturaId,
      });

      toast.success(`Poción aplicada a ${criatura.nombre}. HP actual: ${res.hpNuevo}`);

      // Actualizar criatura localmente
      setEquipo((prev) =>
        prev.map((c) =>
          c.criaturaId === criatura.criaturaId ? { ...c, hpActual: res.hpNuevo } : c,
        ),
      );

      // Actualizar cantidad de ítem
      setItems((prev) =>
        prev
          .map((i) =>
            i.codigo === itemSeleccionado.codigo ? { ...i, cantidad: res.cantidadRestante } : i,
          )
          .filter((i) => i.cantidad > 0),
      );

      setModalAbierto(false);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al utilizar el objeto.");
      }
    } finally {
      setUsando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              Bolsa e Inventario
            </h1>
            <Badge variant="secondary" className="text-amber-500 font-mono">
              {monedas} Monedas de oro
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Inspecciona tus provisiones, talismanes de captura y pociones de salud.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tienda">
            <Button size="sm" className="text-xs">
              Ir a la Tienda
            </Button>
          </Link>
          <Link to="/hub">
            <Button variant="outline" size="sm" className="text-xs">
              Volver al Asentamiento
            </Button>
          </Link>
        </div>
      </div>

      {cargando ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="text-base text-muted-foreground mb-2">
            Tu bolsa está vacía
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            Visita la tienda del asentamiento para aprovisionarte de talismanes y pociones.
          </CardDescription>
          <Link to="/tienda">
            <Button size="sm">Ir a la Tienda</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Nombre del Objeto</TableHead>
                <TableHead className="w-28 text-center">Tipo</TableHead>
                <TableHead className="w-24 text-center">Cantidad</TableHead>
                <TableHead className="w-32 text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.codigo}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {item.codigo}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {item.nombre}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.tipo === "CURACION" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {item.tipo === "CURACION" ? "Curación" : "Captura"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {item.cantidad}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={item.tipo === "CURACION" ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => abrirModalUso(item)}
                    >
                      {item.tipo === "CURACION" ? "Usar" : "En combate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal para usar poción sobre una criatura */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar {itemSeleccionado?.nombre}</DialogTitle>
            <DialogDescription>
              Selecciona una criatura de tu equipo activo para restablecer sus puntos de vida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {equipo.map((criatura) => (
              <div
                key={criatura.criaturaId}
                className="flex items-center justify-between p-2 rounded border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                <div>
                  <span className="font-bold text-xs block">{criatura.nombre}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Salud: {criatura.hpActual} / {criatura.hpMaximo} HP
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={usando || criatura.hpActual >= criatura.hpMaximo}
                  onClick={() => handleUsarSobreCriatura(criatura)}
                  className="text-xs"
                >
                  {criatura.hpActual >= criatura.hpMaximo ? "Salud Llena" : "Restablecer"}
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PantallaInventario;
