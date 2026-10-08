import { useEffect, useState } from "react";
import { Link } from "react-router";
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
import { api, ErrorApi } from "@/api";

interface ArticuloTienda {
  codigo: string;
  nombre: string;
  precio: number;
  tipo: "CAPTURA" | "CURACION";
  descripcion: string;
}

const ARTICULOS_TIENDA: ArticuloTienda[] = [
  {
    codigo: "talisman-basico",
    nombre: "Talismán Básico de Captura",
    precio: 50,
    tipo: "CAPTURA",
    descripcion: "Artefacto rúnico estándar que permite contener criaturas en combate (x1.0).",
  },
  {
    codigo: "talisman-resonante",
    nombre: "Talismán Resonante de Captura",
    precio: 150,
    tipo: "CAPTURA",
    descripcion: "Talismán reforzado con afinidad arcana para criaturas más esquivas (x1.5).",
  },
  {
    codigo: "pocion-menor",
    nombre: "Poción de Curación Menor",
    precio: 40,
    tipo: "CURACION",
    descripcion: "Brebaje de hierbas que restablece 30 puntos de salud a un compañero.",
  },
  {
    codigo: "pocion-mayor",
    nombre: "Poción de Curación Mayor",
    precio: 100,
    tipo: "CURACION",
    descripcion: "Extracto curativo concentrado que restablece 70 puntos de salud.",
  },
];

export function PantallaTienda() {
  const [monedas, setMonedas] = useState(120);
  const [cantidades, setCantidades] = useState<Record<string, number>>({
    "talisman-basico": 1,
    "talisman-resonante": 1,
    "pocion-menor": 1,
    "pocion-mayor": 1,
  });
  const [comprandoCodigo, setComprandoCodigo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .obtenerPersonajeActivo()
      .then((pj) => {
        if (!cancelado) setMonedas(pj.monedas);
      })
      .catch(() => {
        // mantener saldo por defecto si falla
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const ajustarCantidad = (codigo: string, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [codigo]: Math.max(1, Math.min(10, (prev[codigo] || 1) + delta)),
    }));
  };

  const handleComprar = async (articulo: ArticuloTienda) => {
    const cantidad = cantidades[articulo.codigo] || 1;
    const costoTotal = articulo.precio * cantidad;

    if (monedas < costoTotal) {
      toast.error("Saldo insuficiente de monedas para realizar esta adquisición.");
      return;
    }

    try {
      setComprandoCodigo(articulo.codigo);
      const res = await api.comprarEnTienda({
        itemCodigo: articulo.codigo,
        cantidad,
      });

      toast.success(`¡Has adquirido ${res.cantidadComprada}x ${articulo.nombre}!`);
      setMonedas(res.saldoRestante);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al procesar la compra en la tienda.");
      }
    } finally {
      setComprandoCodigo(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              Bazar y Tienda de Provisiones
            </h1>
            <Badge variant="secondary" className="text-amber-500 font-mono font-bold">
              {monedas} Oro disponible
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Adquiere suministros vitales para tus expediciones y encuentros salvajes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/inventario">
            <Button variant="outline" size="sm" className="text-xs">
              Ver Inventario
            </Button>
          </Link>
          <Link to="/hub">
            <Button variant="outline" size="sm" className="text-xs">
              Volver al Asentamiento
            </Button>
          </Link>
        </div>
      </div>

      {/* Catálogo de Artículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ARTICULOS_TIENDA.map((articulo) => {
          const cantidad = cantidades[articulo.codigo] || 1;
          const costoTotal = articulo.precio * cantidad;
          const puedeComprar = monedas >= costoTotal;
          const enProceso = comprandoCodigo === articulo.codigo;

          return (
            <Card key={articulo.codigo} className="border-2 flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {articulo.nombre}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {articulo.descripcion}
                    </CardDescription>
                  </div>
                  <Badge variant={articulo.tipo === "CAPTURA" ? "secondary" : "default"}>
                    {articulo.tipo === "CAPTURA" ? "Captura" : "Curación"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-muted/40 rounded border border-border/50">
                  <span className="text-muted-foreground">Precio unitario:</span>
                  <span className="font-mono font-bold text-amber-500">{articulo.precio} oro</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-8 p-0"
                      onClick={() => ajustarCantidad(articulo.codigo, -1)}
                      disabled={cantidad <= 1}
                    >
                      -
                    </Button>
                    <span className="font-mono font-bold w-6 text-center text-sm">
                      {cantidad}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-8 p-0"
                      onClick={() => ajustarCantidad(articulo.codigo, 1)}
                      disabled={cantidad >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                  <span className="font-semibold text-muted-foreground">Costo Total:</span>
                  <span className={`font-mono font-bold text-sm ${puedeComprar ? "text-amber-500" : "text-destructive"}`}>
                    {costoTotal} oro
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2 border-t border-border/40">
                <Button
                  className="w-full text-xs flex items-center justify-center gap-2"
                  disabled={!puedeComprar || enProceso}
                  onClick={() => handleComprar(articulo)}
                >
                  {enProceso ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Comprando...</span>
                    </>
                  ) : puedeComprar ? (
                    <span>Comprar ({costoTotal} oro)</span>
                  ) : (
                    <span>Oro insuficiente</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PantallaTienda;
