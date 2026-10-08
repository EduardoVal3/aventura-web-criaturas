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
import { api, type EventoHistorial, ErrorApi } from "@/api";

export function PantallaHistorial() {
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarHistorial = async () => {
    try {
      const res = await api.obtenerHistorial();
      setEventos(res.eventos);
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al cargar la bitácora de eventos.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatearFecha = (marcaTiempo: string) => {
    try {
      const fecha = new Date(marcaTiempo);
      return fecha.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return marcaTiempo;
    }
  };

  const obtenerInsigniaTipo = (tipo: string) => {
    switch (tipo) {
      case "VICTORIA_COMBATE":
        return <Badge variant="default" className="text-[10px]">Victoria</Badge>;
      case "CAPTURA":
        return <Badge variant="secondary" className="text-[10px]">Captura</Badge>;
      case "COMPRA":
        return <Badge variant="outline" className="text-[10px]">Compra</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{tipo}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              Bitácora de Eventos
            </h1>
            <Badge variant="secondary">
              {eventos.length} Registros
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Historial cronológico de victorias, capturas y transacciones en Aethelgard.
          </p>
        </div>

        <Link to="/hub">
          <Button variant="outline" size="sm" className="text-xs">
            Volver al Asentamiento
          </Button>
        </Link>
      </div>

      {cargando ? (
        <Skeleton className="h-48 w-full" />
      ) : eventos.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="text-base text-muted-foreground mb-2">
            No hay eventos registrados en la bitácora
          </CardTitle>
          <CardDescription className="text-xs mb-4">
            Emprende expediciones y participa en combates para escribir tu historia.
          </CardDescription>
          <Link to="/exploracion">
            <Button size="sm">Comenzar Exploración</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Fecha y Hora</TableHead>
                <TableHead className="w-28 text-center">Tipo</TableHead>
                <TableHead>Descripción del Acontecimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento.eventoId}>
                  <TableCell className="font-mono text-muted-foreground text-xs whitespace-nowrap">
                    {formatearFecha(evento.marcaTiempo)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {obtenerInsigniaTipo(evento.tipo)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {evento.descripcion}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default PantallaHistorial;
