import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Compass, Crosshair, Lock, MapPin, Minus, Plus, Sparkles } from "lucide-react";
import type { ConexionUbicacion, NodoMapaTerritorial } from "@/api";
import { CONEXIONES_AETHELGARD } from "@/lib/servicios-hub";
import {
  CONFIGURACION_ISLAS_MAPA,
  DIMENSIONES_MAPA_MUNDO,
  obtenerConfiguracionIsla,
  type ConfiguracionIslaMapa,
} from "@/lib/mapa-mundo";
import {
  RUTAS_PLACEHOLDERS,
  manejarErrorImagen,
  obtenerImagenCriatura,
  reproducirSonido,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

export interface LiderMapaInfo {
  nombre: string;
  especieSlug: string;
  nivel: number;
}

export interface MapaInteractivoCanvasProps {
  nodos: NodoMapaTerritorial[];
  conexiones: ConexionUbicacion[];
  ubicacionActualId: string;
  lider?: LiderMapaInfo | null;
  onSeleccionarNodo: (nodo: NodoMapaTerritorial) => void;
}

interface CamaraMapa {
  x: number;
  y: number;
  zoom: number;
}

const ZOOM_MINIMO = 0.55;
const ZOOM_MAXIMO = 2.0;

function limitar(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function dibujarIslaPixel(
  ctx: CanvasRenderingContext2D,
  isla: ConfiguracionIslaMapa,
  tiempo: number,
  esActual: boolean,
  desbloqueada: boolean,
) {
  ctx.save();
  ctx.translate(isla.x, isla.y);

  if (!desbloqueada) {
    ctx.globalAlpha = 0.55;
  }

  // Aura fantasmal / oleaje sombrío alrededor de la isla
  const pulso = Math.sin(tiempo * 0.0025 + isla.x * 0.01) * 3;
  ctx.fillStyle = esActual
    ? "rgba(20, 209, 232, 0.18)"
    : "rgba(15, 23, 42, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0, 8, isla.radioX + 12 + pulso, isla.radioY + 10 + pulso * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abismo / acantilado inferior
  ctx.fillStyle = "#05070c";
  ctx.beginPath();
  ctx.ellipse(0, 14, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Borde costero oscuro
  ctx.fillStyle = isla.colorBorde;
  ctx.beginPath();
  ctx.ellipse(0, 5, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Superficie principal del bioma
  ctx.fillStyle = isla.colorSuelo;
  ctx.beginPath();
  ctx.ellipse(0, -2, isla.radioX - 10, isla.radioY - 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Contorno pixelado oscuro (o cian brillante si es ubicación actual)
  ctx.strokeStyle = esActual ? "#14d1e8" : "#05070c";
  ctx.lineWidth = esActual ? 3.5 : 3;
  ctx.beginPath();
  ctx.ellipse(0, 2, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.stroke();

  const parpadeo = 0.65 + Math.sin(tiempo * 0.006 + isla.y) * 0.35;

  // Detalles tenebrosos por bioma (16-bit dark fantasy)
  switch (isla.bioma) {
    case "puerto": {
      // Muelle viejo de madera
      ctx.fillStyle = "#3b2718";
      ctx.fillRect(-10, isla.radioY - 18, 20, 26);
      ctx.fillStyle = "#26180e";
      ctx.fillRect(-14, isla.radioY - 6, 28, 6);
      // Cabañas oscuras con ventanas de farol ámbar parpadeante
      for (const [cx, cy] of [
        [-38, -18],
        [18, -22],
        [-8, 12],
      ]) {
        ctx.fillStyle = "#3f3832";
        ctx.fillRect(cx - 12, cy, 24, 16);
        ctx.fillStyle = "#5c2222";
        ctx.fillRect(cx - 15, cy - 10, 30, 12);
        ctx.fillStyle = `rgba(245, 158, 11, ${parpadeo})`;
        ctx.fillRect(cx - 7, cy + 4, 5, 5);
        ctx.fillRect(cx + 3, cy + 4, 5, 5);
      }
      break;
    }
    case "pradera": {
      // Sendero sombrío + monolitos con runas brillantes
      ctx.fillStyle = "#3b3228";
      ctx.fillRect(-45, -6, 90, 12);
      for (const [mx, my] of [
        [-42, -26],
        [36, 16],
      ]) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(mx - 6, my - 14, 12, 24);
        ctx.fillStyle = `rgba(234, 179, 8, ${parpadeo})`;
        ctx.fillRect(mx - 2, my - 8, 4, 10);
      }
      // Árboles retorcidos
      for (const [ax, ay] of [
        [24, -30],
        [-28, 22],
      ]) {
        ctx.fillStyle = "#261a14";
        ctx.fillRect(ax - 3, ay, 6, 12);
        ctx.fillStyle = "#1a331d";
        ctx.beginPath();
        ctx.arc(ax, ay - 6, 13, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "lago": {
      // Lago abisal con brillo espectral cian
      ctx.fillStyle = "#082f49";
      ctx.beginPath();
      ctx.ellipse(-6, 4, 44, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(20, 209, 232, ${0.35 * parpadeo})`;
      ctx.beginPath();
      ctx.ellipse(-10, 0, 24, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "puesto": {
      // Fuerte de empalizada oscura con antorchas
      ctx.fillStyle = "#3b2718";
      ctx.fillRect(-34, -22, 68, 42);
      ctx.fillStyle = "#334155";
      ctx.fillRect(-22, -32, 44, 34);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-26, -38, 52, 8);
      ctx.fillStyle = `rgba(245, 158, 11, ${parpadeo})`;
      ctx.fillRect(-28, -14, 5, 5);
      ctx.fillRect(23, -14, 5, 5);
      break;
    }
    case "bosque": {
      // Pinos oscuros y esporas espectrales
      for (const [tx, ty] of [
        [-38, -14],
        [-10, -28],
        [22, -20],
        [38, 6],
        [-24, 16],
        [8, 18],
      ]) {
        ctx.fillStyle = "#071710";
        ctx.beginPath();
        ctx.moveTo(tx, ty - 22);
        ctx.lineTo(tx - 16, ty + 8);
        ctx.lineTo(tx + 16, ty + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#0f2e1f";
        ctx.beginPath();
        ctx.moveTo(tx, ty - 22);
        ctx.lineTo(tx - 10, ty);
        ctx.lineTo(tx + 10, ty);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = `rgba(74, 222, 128, ${0.5 * parpadeo})`;
      ctx.fillRect(-14, -4, 3, 3);
      ctx.fillRect(18, 10, 3, 3);
      break;
    }
    case "riscos": {
      // Riscos de obsidiana con fisura arcana violeta
      for (const [rx, ry, rw] of [
        [-28, -14, 24],
        [14, -20, 28],
        [-6, 8, 30],
      ]) {
        ctx.fillStyle = "#1c1917";
        ctx.beginPath();
        ctx.moveTo(rx, ry - rw * 0.8);
        ctx.lineTo(rx - rw * 0.7, ry + 10);
        ctx.lineTo(rx + rw * 0.7, ry + 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = `rgba(168, 85, 247, ${parpadeo})`;
      ctx.fillRect(-8, -2, 6, 3);
      break;
    }
    case "bastion": {
      // Fortaleza gótica oscura
      ctx.fillStyle = "#334155";
      ctx.fillRect(-36, -26, 72, 44);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-44, -34, 18, 52);
      ctx.fillRect(26, -34, 18, 52);
      ctx.fillRect(-16, -42, 32, 30);
      ctx.fillStyle = `rgba(56, 189, 248, ${parpadeo})`;
      ctx.fillRect(-4, -52, 8, 10);
      ctx.fillStyle = "#090d16";
      ctx.fillRect(-8, -2, 16, 20);
      break;
    }
    case "volcan": {
      // Volcán oscuro de obsidiana y magma pulsante
      ctx.fillStyle = "#120c0e";
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(-56, 24);
      ctx.lineTo(56, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.ellipse(0, -50, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = Math.sin(tiempo * 0.005) > 0 ? "#f97316" : "#b91c1c";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(-14, -10);
      ctx.lineTo(12, 14);
      ctx.lineTo(-8, 36);
      ctx.stroke();
      break;
    }
    case "glaciar": {
      // Cumbres sombrías bajo luz lunar pálida
      for (const [px, py, ph] of [
        [-20, 12, 54],
        [18, 8, 62],
        [0, 20, 44],
      ]) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(px, py - ph);
        ctx.lineTo(px - 28, py);
        ctx.lineTo(px + 28, py);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(px, py - ph);
        ctx.lineTo(px - 14, py - ph * 0.52);
        ctx.lineTo(px + 14, py - ph * 0.52);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

export function MapaInteractivoCanvas({
  nodos,
  conexiones,
  ubicacionActualId,
  lider,
  onSeleccionarNodo,
}: MapaInteractivoCanvasProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapaImagenRef = useRef<HTMLImageElement | null>(null);
  const mapaImagenListaRef = useRef(false);

  const [tamanoContenedor, setTamanoContenedor] = useState({ ancho: 900, alto: 540 });
  const [camara, setCamara] = useState<CamaraMapa>({ x: 600, y: 380, zoom: 0.9 });
  const arrastreRef = useRef<{
    activo: boolean;
    inicioX: number;
    inicioY: number;
    camaraInicioX: number;
    camaraInicioY: number;
    distancia: number;
  }>({
    activo: false,
    inicioX: 0,
    inicioY: 0,
    camaraInicioX: 600,
    camaraInicioY: 380,
    distancia: 0,
  });

  const conexionesPorId = useMemo(
    () => new Map(conexiones.map((c) => [c.ubicacionDestinoId, c])),
    [conexiones],
  );
  const nodosPorId = useMemo(() => new Map(nodos.map((n) => [n.id, n])), [nodos]);

  const centrarEnUbicacion = useCallback(
    (ubicacionId: string, zoomObjetivo?: number) => {
      const isla = obtenerConfiguracionIsla(ubicacionId);
      setCamara((prev) => ({
        x: isla.x,
        y: isla.y,
        zoom: zoomObjetivo ?? prev.zoom,
      }));
    },
    [],
  );

  // Cargar imagen opcional del mapa si el equipo coloca /assets/zonas/mapa-mundo.webp
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      mapaImagenRef.current = img;
      mapaImagenListaRef.current = true;
    };
    img.onerror = () => {
      mapaImagenListaRef.current = false;
    };
    img.src = "/assets/zonas/mapa-mundo.webp";
  }, []);

  // Medir el contenedor para proyectar coordenadas responsive
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;

    const actualizarTamano = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTamanoContenedor({ ancho: rect.width, alto: rect.height });
      }
    };
    actualizarTamano();

    const observer = new ResizeObserver(actualizarTamano);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Centrar automáticamente al cambiar de ubicación o tamaño móvil/escritorio
  const esMovil = tamanoContenedor.ancho < 640;
  useEffect(() => {
    const zoomInicial = esMovil ? 0.68 : 0.92;
    const id = requestAnimationFrame(() => {
      centrarEnUbicacion(ubicacionActualId, zoomInicial);
    });
    return () => cancelAnimationFrame(id);
  }, [ubicacionActualId, centrarEnUbicacion, esMovil]);

  // Bucle de renderizado 2D del Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;

    const renderizar = (tiempo: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const anchoReal = Math.floor(tamanoContenedor.ancho * dpr);
      const altoReal = Math.floor(tamanoContenedor.alto * dpr);

      if (canvas.width !== anchoReal || canvas.height !== altoReal) {
        canvas.width = anchoReal;
        canvas.height = altoReal;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // Fondo oceánico abisal oscuro (dark fantasy)
      ctx.fillStyle = "#070d18";
      ctx.fillRect(0, 0, tamanoContenedor.ancho, tamanoContenedor.alto);

      // Transformación de cámara centrada
      ctx.translate(tamanoContenedor.ancho / 2, tamanoContenedor.alto / 2);
      ctx.scale(camara.zoom, camara.zoom);
      ctx.translate(-camara.x, -camara.y);

      if (mapaImagenListaRef.current && mapaImagenRef.current) {
        ctx.drawImage(
          mapaImagenRef.current,
          0,
          0,
          DIMENSIONES_MAPA_MUNDO.ancho,
          DIMENSIONES_MAPA_MUNDO.alto,
        );
      } else {
        // Ondas tenebrosas en el mar nocturno
        const desplazamientoOla = Math.sin(tiempo * 0.0014) * 16;
        ctx.fillStyle = "rgba(30, 58, 95, 0.38)";
        for (let oy = 40; oy < DIMENSIONES_MAPA_MUNDO.alto; oy += 90) {
          for (let ox = 40; ox < DIMENSIONES_MAPA_MUNDO.ancho; ox += 150) {
            ctx.fillRect(ox + desplazamientoOla, oy, 26, 3);
            ctx.fillRect(ox + 60 - desplazamientoOla, oy + 36, 18, 3);
          }
        }

        // Peñascos e islotes oscuros
        for (const [ix, iy] of [
          [160, 125],
          [320, 175],
          [130, 625],
          [1060, 560],
        ]) {
          ctx.fillStyle = "#05080f";
          ctx.beginPath();
          ctx.ellipse(ix, iy, 28, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#262322";
          ctx.beginPath();
          ctx.ellipse(ix, iy - 4, 22, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Puentes viejos entre islas conectadas
        for (const [origenId, destinoId] of CONEXIONES_AETHELGARD) {
          const origen = CONFIGURACION_ISLAS_MAPA[origenId];
          const destino = CONFIGURACION_ISLAS_MAPA[destinoId];
          if (!origen || !destino) continue;

          const nodoOrigen = nodosPorId.get(origenId);
          const nodoDestino = nodosPorId.get(destinoId);
          const rutaDesbloqueada = Boolean(nodoOrigen?.desbloqueada && nodoDestino?.desbloqueada);

          ctx.save();
          if (!rutaDesbloqueada) {
            ctx.setLineDash([10, 8]);
          }
          // Sombra puente
          ctx.strokeStyle = "#030508";
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(origen.x, origen.y + 4);
          ctx.lineTo(destino.x, destino.y + 4);
          ctx.stroke();

          // Tablones oscuros del puente
          ctx.strokeStyle = rutaDesbloqueada ? "#47311e" : "#27272a";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.moveTo(origen.x, origen.y);
          ctx.lineTo(destino.x, destino.y);
          ctx.stroke();

          // Líneas centrales de madera desgastada
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = rutaDesbloqueada ? "#785333" : "#3f3f46";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(origen.x, origen.y);
          ctx.lineTo(destino.x, destino.y);
          ctx.stroke();
          ctx.restore();
        }

        // Dibujar cada isla
        for (const nodo of nodos) {
          const isla = CONFIGURACION_ISLAS_MAPA[nodo.id];
          if (!isla) continue;
          dibujarIslaPixel(
            ctx,
            isla,
            tiempo,
            nodo.id === ubicacionActualId,
            nodo.desbloqueada,
          );
        }

        // Bancos de niebla pixelada desplazándose lentamente
        const nieblaX = (tiempo * 0.015) % DIMENSIONES_MAPA_MUNDO.ancho;
        ctx.fillStyle = "rgba(148, 163, 184, 0.06)";
        for (let i = 0; i < 6; i++) {
          const nx = ((nieblaX + i * 230) % (DIMENSIONES_MAPA_MUNDO.ancho + 200)) - 100;
          const ny = 90 + (i * 115) % 600;
          ctx.fillRect(nx, ny, 160, 24);
          ctx.fillRect(nx + 30, ny - 12, 100, 14);
        }
      }

      ctx.restore();

      // Viñeta tenebrosa en los bordes del visor
      const vineta = ctx.createRadialGradient(
        tamanoContenedor.ancho / 2,
        tamanoContenedor.alto / 2,
        Math.min(tamanoContenedor.ancho, tamanoContenedor.alto) * 0.3,
        tamanoContenedor.ancho / 2,
        tamanoContenedor.alto / 2,
        Math.max(tamanoContenedor.ancho, tamanoContenedor.alto) * 0.72,
      );
      vineta.addColorStop(0, "rgba(0, 0, 0, 0)");
      vineta.addColorStop(1, "rgba(3, 5, 10, 0.68)");
      ctx.fillStyle = vineta;
      ctx.fillRect(0, 0, tamanoContenedor.ancho, tamanoContenedor.alto);

      frameId = requestAnimationFrame(renderizar);
    };

    frameId = requestAnimationFrame(renderizar);
    return () => cancelAnimationFrame(frameId);
  }, [camara, nodos, nodosPorId, tamanoContenedor, ubicacionActualId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    arrastreRef.current = {
      activo: true,
      inicioX: e.clientX,
      inicioY: e.clientY,
      camaraInicioX: camara.x,
      camaraInicioY: camara.y,
      distancia: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastreRef.current.activo) return;
    const dx = e.clientX - arrastreRef.current.inicioX;
    const dy = e.clientY - arrastreRef.current.inicioY;
    arrastreRef.current.distancia = Math.hypot(dx, dy);

    setCamara((prev) => ({
      ...prev,
      x: limitar(
        arrastreRef.current.camaraInicioX - dx / prev.zoom,
        80,
        DIMENSIONES_MAPA_MUNDO.ancho - 80,
      ),
      y: limitar(
        arrastreRef.current.camaraInicioY - dy / prev.zoom,
        60,
        DIMENSIONES_MAPA_MUNDO.alto - 60,
      ),
    }));
  };

  const handlePointerUp = () => {
    arrastreRef.current.activo = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCamara((prev) => ({
      ...prev,
      zoom: limitar(Number((prev.zoom + delta).toFixed(2)), ZOOM_MINIMO, ZOOM_MAXIMO),
    }));
  };

  const ajustarZoom = (delta: number) => {
    reproducirSonido("click", 0.3);
    setCamara((prev) => ({
      ...prev,
      zoom: limitar(Number((prev.zoom + delta).toFixed(2)), ZOOM_MINIMO, ZOOM_MAXIMO),
    }));
  };

  return (
    <div
      ref={contenedorRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-[54vh] min-h-[380px] sm:h-[60vh] md:h-[64vh] bg-[#070d18] border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Fondo Canvas con position: absolute */}
      <canvas
        ref={canvasRef}
        aria-label="Mapa interactivo del archipiélago de Aethelgard"
        className="absolute inset-0 w-full h-full block touch-none"
      />

      {/* Capa de botones de zona sincronizados con la cámara */}
      <div className="relative w-full h-full pointer-events-none">
        {nodos.map((nodo) => {
          const isla = obtenerConfiguracionIsla(nodo.id);
          const pantallaX = (isla.x - camara.x) * camara.zoom + tamanoContenedor.ancho / 2;
          const pantallaY = (isla.y - camara.y) * camara.zoom + tamanoContenedor.alto / 2;

          // Ocultar nodos muy fuera de pantalla para mantener DOM limpio
          if (
            pantallaX < -140 ||
            pantallaX > tamanoContenedor.ancho + 140 ||
            pantallaY < -110 ||
            pantallaY > tamanoContenedor.alto + 110
          ) {
            return null;
          }

          const conexion = conexionesPorId.get(nodo.id);
          const esActual = nodo.id === ubicacionActualId;
          const esViajable = Boolean(conexion && !conexion.estaBloqueada);
          const esDesbloqueable = Boolean(conexion?.estaBloqueada && conexion.cumpleRequisito);

          return (
            <button
              key={nodo.id}
              type="button"
              onClick={() => {
                reproducirSonido("click", 0.35);
                onSeleccionarNodo(nodo);
              }}
              style={{
                left: `${pantallaX}px`,
                top: `${pantallaY}px`,
                transform: "translate(-50%, -50%)",
              }}
              className={cn(
                "absolute pointer-events-auto group flex flex-col items-center gap-1 transition-transform duration-150 hover:scale-105 focus:outline-none z-10",
                esActual && "z-20",
              )}
              aria-label={`Inspeccionar ${nodo.nombre}`}
            >
              {/* Avatar de la criatura líder si el jugador está en esta isla */}
              {esActual && (
                <div className="relative flex flex-col items-center -mb-1 animate-bounce">
                  <div className="size-11 sm:size-13 bg-black/80 border-2 border-[#14d1e8] shadow-[3px_3px_0_0_#000] p-0.5 flex items-center justify-center">
                    <img
                      src={obtenerImagenCriatura(lider?.especieSlug)}
                      alt={lider?.nombre || "Líder"}
                      onError={(e) => manejarErrorImagen(e, RUTAS_PLACEHOLDERS.criatura)}
                      className="w-full h-full object-contain scale-x-[-1]"
                    />
                  </div>
                  <span className="retro text-[7px] bg-[#14d1e8] text-black px-1.5 py-0.5 border border-black font-bold -mt-1">
                    TÚ AQUÍ
                  </span>
                </div>
              )}

              {/* Placa interactiva de la zona */}
              <div
                className={cn(
                  "px-2 py-1 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-1.5 backdrop-blur-xs",
                  esActual
                    ? "bg-black/90 text-[#14d1e8] border-[#14d1e8]"
                    : esDesbloqueable
                      ? "bg-amber-950/95 text-amber-300 border-amber-400 animate-pulse"
                      : esViajable
                        ? "bg-emerald-950/95 text-emerald-300 border-emerald-400"
                        : !nodo.desbloqueada
                          ? "bg-slate-950/90 text-slate-400 border-slate-600"
                          : "bg-card/90 text-slate-100 border-black",
                )}
              >
                {esActual ? (
                  <MapPin className="size-3 shrink-0 text-[#14d1e8]" />
                ) : esDesbloqueable ? (
                  <Sparkles className="size-3 shrink-0 text-amber-300" />
                ) : !nodo.desbloqueada ? (
                  <Lock className="size-3 shrink-0 text-slate-400" />
                ) : (
                  <Compass className="size-3 shrink-0 text-emerald-300" />
                )}

                <span className="retro text-[8px] sm:text-[9px] whitespace-nowrap">
                  {isla.etiquetaCorta}
                </span>

                {!nodo.esSegura && nodo.desbloqueada && (
                  <span className="retro text-[7px] bg-black/70 px-1 py-0.5 border border-black/80 text-amber-300">
                    {nodo.progreso}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Controles de Zoom y Centrado (relativos en esquina) */}
      <div className="absolute right-2.5 bottom-2.5 z-30 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => ajustarZoom(0.15)}
          aria-label="Acercar mapa"
          className="size-8 sm:size-9 bg-card/95 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center text-slate-100 hover:text-[#14d1e8] active:translate-y-0.5"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => ajustarZoom(-0.15)}
          aria-label="Alejar mapa"
          className="size-8 sm:size-9 bg-card/95 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center text-slate-100 hover:text-[#14d1e8] active:translate-y-0.5"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            reproducirSonido("click", 0.3);
            centrarEnUbicacion(ubicacionActualId, tamanoContenedor.ancho < 640 ? 0.68 : 0.92);
          }}
          aria-label="Centrar en mi ubicación"
          className="size-8 sm:size-9 bg-card/95 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center text-[#14d1e8] hover:bg-black active:translate-y-0.5"
        >
          <Crosshair className="size-4" />
        </button>
      </div>

      {/* Leyenda rápida en esquina superior izquierda */}
      <div className="absolute left-2.5 top-2.5 z-30 pointer-events-none hidden sm:flex items-center gap-2 bg-black/80 border-2 border-black px-2.5 py-1 shadow-[3px_3px_0_0_#000]">
        <span className="retro text-[7px] text-slate-300">
          ARRASTRA PARA EXPLORAR EL MAPA · CLIC EN UNA ISLA PARA VIAJAR
        </span>
      </div>
    </div>
  );
}
