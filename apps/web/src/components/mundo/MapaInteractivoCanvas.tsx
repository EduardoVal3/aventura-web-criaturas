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
    ctx.globalAlpha = 0.65;
  }

  // Espuma animada alrededor de la isla
  const pulso = Math.sin(tiempo * 0.003 + isla.x * 0.01) * 3;
  ctx.fillStyle = "rgba(186, 230, 253, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 8, isla.radioX + 10 + pulso, isla.radioY + 8 + pulso * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sombra / acantilado inferior de la isla
  ctx.fillStyle = "#16202e";
  ctx.beginPath();
  ctx.ellipse(0, 12, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Borde costero / arena / roca
  ctx.fillStyle = isla.colorBorde;
  ctx.beginPath();
  ctx.ellipse(0, 4, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Superficie principal del bioma
  ctx.fillStyle = isla.colorSuelo;
  ctx.beginPath();
  ctx.ellipse(0, -2, isla.radioX - 10, isla.radioY - 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Contorno pixelado oscuro
  ctx.strokeStyle = esActual ? "#14d1e8" : "#0b111b";
  ctx.lineWidth = esActual ? 4 : 3;
  ctx.beginPath();
  ctx.ellipse(0, 2, isla.radioX, isla.radioY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Detalles temáticos por bioma (provisional 16-bit)
  switch (isla.bioma) {
    case "puerto": {
      // Muelle de madera abajo
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(-10, isla.radioY - 18, 20, 26);
      ctx.fillStyle = "#5c3a1b";
      ctx.fillRect(-14, isla.radioY - 6, 28, 6);
      // Casitas con techo rojo
      for (const [cx, cy] of [
        [-38, -18],
        [18, -22],
        [-8, 12],
      ]) {
        ctx.fillStyle = "#e8dcc4";
        ctx.fillRect(cx - 12, cy, 24, 16);
        ctx.fillStyle = "#b93829";
        ctx.fillRect(cx - 15, cy - 10, 30, 12);
        ctx.fillStyle = "#4a2c18";
        ctx.fillRect(cx - 3, cy + 6, 6, 10);
      }
      break;
    }
    case "pradera": {
      // Camino de tierra + monolitos rúnicos
      ctx.fillStyle = "#c9a86a";
      ctx.fillRect(-45, -6, 90, 14);
      for (const [mx, my] of [
        [-42, -26],
        [36, 16],
      ]) {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(mx - 6, my - 14, 12, 24);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(mx - 2, my - 6, 4, 8);
      }
      // Árboles
      for (const [ax, ay] of [
        [24, -30],
        [-28, 22],
      ]) {
        ctx.fillStyle = "#5c3a1b";
        ctx.fillRect(ax - 3, ay, 6, 12);
        ctx.fillStyle = "#2d6a31";
        ctx.beginPath();
        ctx.arc(ax, ay - 6, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "lago": {
      // Lago luminoso central
      ctx.fillStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.ellipse(-6, 4, 42, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(-10, 0, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "puesto": {
      // Fuerte de empalizada y torreón
      ctx.fillStyle = "#7c5329";
      ctx.fillRect(-34, -22, 68, 42);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-22, -32, 44, 34);
      ctx.fillStyle = "#334155";
      ctx.fillRect(-26, -38, 52, 8);
      ctx.fillStyle = "#4a2c18";
      ctx.fillRect(-7, 2, 14, 18);
      break;
    }
    case "bosque": {
      // Copa densa de pinos oscuros
      for (const [tx, ty] of [
        [-38, -14],
        [-10, -28],
        [22, -20],
        [38, 6],
        [-24, 16],
        [8, 18],
      ]) {
        ctx.fillStyle = "#143625";
        ctx.beginPath();
        ctx.moveTo(tx, ty - 22);
        ctx.lineTo(tx - 16, ty + 8);
        ctx.lineTo(tx + 16, ty + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1f5438";
        ctx.beginPath();
        ctx.moveTo(tx, ty - 22);
        ctx.lineTo(tx - 11, ty);
        ctx.lineTo(tx + 11, ty);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "riscos": {
      // Rocas escarpadas
      for (const [rx, ry, rw] of [
        [-28, -14, 24],
        [14, -20, 28],
        [-6, 8, 30],
      ]) {
        ctx.fillStyle = "#57534e";
        ctx.beginPath();
        ctx.moveTo(rx, ry - rw * 0.8);
        ctx.lineTo(rx - rw * 0.7, ry + 10);
        ctx.lineTo(rx + rw * 0.7, ry + 10);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "bastion": {
      // Fortaleza de piedra con torres laterales
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-36, -26, 72, 44);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-44, -34, 18, 52);
      ctx.fillRect(26, -34, 18, 52);
      ctx.fillRect(-16, -42, 32, 30);
      // Estandarte azul/dorado
      ctx.fillStyle = "#14d1e8";
      ctx.fillRect(-4, -52, 8, 12);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-8, -2, 16, 20);
      break;
    }
    case "volcan": {
      // Cono volcánico y ríos de lava
      ctx.fillStyle = "#261c20";
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(-56, 24);
      ctx.lineTo(56, 24);
      ctx.closePath();
      ctx.fill();
      // Cráter incandescente
      ctx.fillStyle = "#f04d24";
      ctx.beginPath();
      ctx.ellipse(0, -50, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Río de lava animado
      ctx.strokeStyle = Math.sin(tiempo * 0.005) > 0 ? "#fbbf24" : "#f04d24";
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
      // Picos nevados y pinos escarchados
      for (const [px, py, ph] of [
        [-20, 12, 54],
        [18, 8, 62],
        [0, 20, 44],
      ]) {
        ctx.fillStyle = "#6488a8";
        ctx.beginPath();
        ctx.moveTo(px, py - ph);
        ctx.lineTo(px - 28, py);
        ctx.lineTo(px + 28, py);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
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

      // Fondo oceánico retro oscuro
      ctx.fillStyle = "#174b82";
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
        // Olas pixeladas en el océano
        const desplazamientoOla = Math.sin(tiempo * 0.0018) * 14;
        ctx.fillStyle = "#1f5f9e";
        for (let oy = 40; oy < DIMENSIONES_MAPA_MUNDO.alto; oy += 90) {
          for (let ox = 40; ox < DIMENSIONES_MAPA_MUNDO.ancho; ox += 150) {
            ctx.fillRect(ox + desplazamientoOla, oy, 26, 4);
            ctx.fillRect(ox + 60 - desplazamientoOla, oy + 36, 18, 4);
          }
        }

        // Islotes decorativos
        for (const [ix, iy] of [
          [160, 125],
          [320, 175],
          [130, 625],
          [1060, 560],
        ]) {
          ctx.fillStyle = "#2b4257";
          ctx.beginPath();
          ctx.ellipse(ix, iy, 28, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#9a8a68";
          ctx.beginPath();
          ctx.ellipse(ix, iy - 4, 22, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Puentes de madera entre islas conectadas
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
          ctx.strokeStyle = "#0b111b";
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(origen.x, origen.y + 4);
          ctx.lineTo(destino.x, destino.y + 4);
          ctx.stroke();

          // Tablones del puente
          ctx.strokeStyle = rutaDesbloqueada ? "#8b5a2b" : "#475569";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.moveTo(origen.x, origen.y);
          ctx.lineTo(destino.x, destino.y);
          ctx.stroke();

          // Líneas centrales de madera
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = rutaDesbloqueada ? "#c98b4b" : "#64748b";
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
      }

      ctx.restore();
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
      className="relative w-full h-[54vh] min-h-[380px] sm:h-[60vh] md:h-[64vh] bg-[#174b82] border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden select-none cursor-grab active:cursor-grabbing"
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
