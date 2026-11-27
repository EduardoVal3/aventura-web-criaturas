import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Heart,
  Minus,
  Plus,
  Store,
  Swords,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ConexionUbicacion, NodoMapaTerritorial } from "@/api";
import {
  DIMENSIONES_MAPA_MUNDO,
  obtenerConfiguracionIsla,
} from "@/lib/mapa-mundo";
import {
  alternarSonidoSilenciado,
  estaSonidoSilenciado,
  manejarErrorImagen,
  obtenerImagenCriatura,
  reproducirSonido,
} from "@/lib/assets";
import {
  dibujarAguasCosterasMapa,
  dibujarCapaVivaMapa,
  dibujarFondoCieloMapa,
  dibujarFondoOceanoContinuo,
  dibujarRespaldoIslasBase,
} from "@/lib/mapa-dioramas";
import {
  crearRecursosOceano,
  dibujarAvesMarinasLejanas,
  dibujarOceanoVivo,
  type RecursosOceanoVivo,
} from "@/lib/oceano-vivo";
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

const ZOOM_MINIMO = 0.5;
const ZOOM_MAXIMO = 2.1;

function limitar(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function resolverZoomInicial(anchoPantalla: number): number {
  return anchoPantalla < 640 ? 0.9 : 0.86;
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
  const recursosOceanoRef = useRef<RecursosOceanoVivo | null>(null);
  const vinetaCacheRef = useRef<{ ancho: number; alto: number; grad: CanvasGradient } | null>(null);
  const dibujarUnaVezRef = useRef<((tiempo: number) => void) | null>(null);

  const [mapaImagenLista, setMapaImagenLista] = useState(false);
  const [tamanoContenedor, setTamanoContenedor] = useState({ ancho: 900, alto: 540 });
  const [camara, setCamara] = useState<CamaraMapa>(() => {
    const islaInicial = obtenerConfiguracionIsla(ubicacionActualId);
    const anchoInicial = typeof window !== "undefined" ? window.innerWidth : 1024;
    return {
      x: islaInicial.x,
      y: islaInicial.y,
      zoom: resolverZoomInicial(anchoInicial),
    };
  });
  const [nodoHoverId, setNodoHoverId] = useState<string | null>(null);
  const [silenciado, setSilenciado] = useState(() => estaSonidoSilenciado());
  const camaraRef = useRef<CamaraMapa>(camara);
  const punterosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    distanciaInicial: number;
    zoomInicial: number;
    camaraInicioX: number;
    camaraInicioY: number;
    centroInicioX: number;
    centroInicioY: number;
  } | null>(null);
  const arrastreRef = useRef<{
    activo: boolean;
    inicioX: number;
    inicioY: number;
    camaraInicioX: number;
    camaraInicioY: number;
    distancia: number;
    suprimirClickHasta: number;
  }>({
    activo: false,
    inicioX: 0,
    inicioY: 0,
    camaraInicioX: 808,
    camaraInicioY: 448,
    distancia: 0,
    suprimirClickHasta: 0,
  });

  useEffect(() => {
    camaraRef.current = camara;
  }, [camara]);

  // Cargar ilustración transparente optimizada en WebP (respaldo vectorial si aún no termina de descargar)
  useEffect(() => {
    let cancelado = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelado) return;
      mapaImagenRef.current = img;
      recursosOceanoRef.current = crearRecursosOceano(img);
      setMapaImagenLista(true);
    };
    img.onerror = () => {
      if (!cancelado) setMapaImagenLista(false);
    };
    img.src = "/assets/mapa-mundo-aethelgard.webp";
    return () => {
      cancelado = true;
    };
  }, []);

  const conexionesPorId = useMemo(
    () => new Map(conexiones.map((c) => [c.ubicacionDestinoId, c])),
    [conexiones],
  );

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

  // Centrar automáticamente al abrir o cambiar de ubicación (sin encoger el mundo en móvil)
  const esMovil = tamanoContenedor.ancho < 640;
  useEffect(() => {
    const zoomInicial = esMovil ? 0.9 : 0.86;
    const id = requestAnimationFrame(() => {
      centrarEnUbicacion(ubicacionActualId, zoomInicial);
    });
    return () => cancelAnimationFrame(id);
  }, [ubicacionActualId, centrarEnUbicacion, esMovil]);

  // Bucle de renderizado 2D del Canvas a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    const reducirMovimiento =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const dibujarCuadro = (tiempo: number) => {
      const camActual = camaraRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const anchoReal = Math.floor(tamanoContenedor.ancho * dpr);
      const altoReal = Math.floor(tamanoContenedor.alto * dpr);

      if (canvas.width !== anchoReal || canvas.height !== altoReal) {
        canvas.width = anchoReal;
        canvas.height = altoReal;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fondo oceánico continuo y transformación de cámara centrada
      ctx.fillStyle = "#021327";
      ctx.fillRect(0, 0, tamanoContenedor.ancho, tamanoContenedor.alto);

      ctx.translate(tamanoContenedor.ancho / 2, tamanoContenedor.alto / 2);
      ctx.scale(camActual.zoom, camActual.zoom);
      ctx.translate(-camActual.x, -camActual.y);

      const mitadAnchoMundo = tamanoContenedor.ancho / 2 / camActual.zoom;
      const mitadAltoMundo = tamanoContenedor.alto / 2 / camActual.zoom;
      const vistaMundo = {
        minX: camActual.x - mitadAnchoMundo,
        minY: camActual.y - mitadAltoMundo,
        maxX: camActual.x + mitadAnchoMundo,
        maxY: camActual.y + mitadAltoMundo,
      };

      const recursosOceano = recursosOceanoRef.current;
      if (mapaImagenLista && mapaImagenRef.current && recursosOceano) {
        dibujarOceanoVivo(ctx, recursosOceano, tiempo, reducirMovimiento, vistaMundo);
        dibujarFondoCieloMapa(ctx, nodos, tiempo, reducirMovimiento, vistaMundo);
        ctx.drawImage(
          mapaImagenRef.current,
          0,
          0,
          DIMENSIONES_MAPA_MUNDO.ancho,
          DIMENSIONES_MAPA_MUNDO.alto,
        );
        dibujarCapaVivaMapa(
          ctx,
          nodos,
          conexionesPorId,
          ubicacionActualId,
          tiempo,
          reducirMovimiento,
          recursosOceano.mascara,
          true,
          vistaMundo,
        );
        dibujarAvesMarinasLejanas(ctx, recursosOceano, tiempo, reducirMovimiento);
      } else {
        dibujarFondoOceanoContinuo(ctx, tiempo, reducirMovimiento, vistaMundo);
        dibujarAguasCosterasMapa(ctx, nodos, tiempo, reducirMovimiento);
        const hayMapaReal = Boolean(mapaImagenLista && mapaImagenRef.current);
        if (hayMapaReal && mapaImagenRef.current) {
          dibujarFondoCieloMapa(ctx, nodos, tiempo, reducirMovimiento, vistaMundo);
          ctx.drawImage(
            mapaImagenRef.current,
            0,
            0,
            DIMENSIONES_MAPA_MUNDO.ancho,
            DIMENSIONES_MAPA_MUNDO.alto,
          );
        } else {
          dibujarRespaldoIslasBase(ctx, nodos);
        }
        dibujarCapaVivaMapa(
          ctx,
          nodos,
          conexionesPorId,
          ubicacionActualId,
          tiempo,
          reducirMovimiento,
          recursosOceano?.mascara,
          hayMapaReal,
          vistaMundo,
        );
      }

      ctx.restore();

      // Viñeta atmosférica Dark Fantasy en los extremos del visor (cacheada por tamaño)
      ctx.save();
      let cacheVineta = vinetaCacheRef.current;
      if (!cacheVineta || cacheVineta.ancho !== canvas.width || cacheVineta.alto !== canvas.height) {
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          Math.min(canvas.width, canvas.height) * 0.42,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) * 0.82,
        );
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, "rgba(2, 6, 16, 0.36)");
        cacheVineta = { ancho: canvas.width, alto: canvas.height, grad };
        vinetaCacheRef.current = cacheVineta;
      }
      ctx.fillStyle = cacheVineta.grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    dibujarUnaVezRef.current = dibujarCuadro;

    const renderizar = (tiempo: number) => {
      dibujarCuadro(tiempo);
      if (!reducirMovimiento) {
        frameId = requestAnimationFrame(renderizar);
      }
    };

    frameId = requestAnimationFrame(renderizar);
    return () => {
      cancelAnimationFrame(frameId);
      dibujarUnaVezRef.current = null;
    };
  }, [conexionesPorId, mapaImagenLista, nodos, tamanoContenedor, ubicacionActualId]);

  // En modo de movimiento reducido, refrescar el cuadro estático tras paneo o zoom
  useEffect(() => {
    const reducirMovimiento =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (!reducirMovimiento) return;
    const id = requestAnimationFrame(() => {
      dibujarUnaVezRef.current?.(0);
    });
    return () => cancelAnimationFrame(id);
  }, [camara]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-controles-mapa]")) return;

    punterosRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const camActual = camaraRef.current;

    if (punterosRef.current.size === 2) {
      const [p1, p2] = Array.from(punterosRef.current.values());
      const dist = Math.max(10, Math.hypot(p2.x - p1.x, p2.y - p1.y));
      pinchRef.current = {
        distanciaInicial: dist,
        zoomInicial: camActual.zoom,
        camaraInicioX: camActual.x,
        camaraInicioY: camActual.y,
        centroInicioX: (p1.x + p2.x) / 2,
        centroInicioY: (p1.y + p2.y) / 2,
      };
      arrastreRef.current.activo = false;
      arrastreRef.current.suprimirClickHasta = Date.now() + 300;
      return;
    }

    pinchRef.current = null;
    arrastreRef.current = {
      activo: true,
      inicioX: e.clientX,
      inicioY: e.clientY,
      camaraInicioX: camActual.x,
      camaraInicioY: camActual.y,
      distancia: 0,
      suprimirClickHasta: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (punterosRef.current.has(e.pointerId)) {
      punterosRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (punterosRef.current.size === 2 && pinchRef.current) {
      const [p1, p2] = Array.from(punterosRef.current.values());
      const dist = Math.max(10, Math.hypot(p2.x - p1.x, p2.y - p1.y));
      const centroActualX = (p1.x + p2.x) / 2;
      const centroActualY = (p1.y + p2.y) / 2;
      const {
        distanciaInicial,
        zoomInicial,
        camaraInicioX,
        camaraInicioY,
        centroInicioX,
        centroInicioY,
      } = pinchRef.current;

      const nuevoZoom = limitar(
        Number(((zoomInicial * dist) / distanciaInicial).toFixed(3)),
        ZOOM_MINIMO,
        ZOOM_MAXIMO,
      );
      const dxCentro = centroActualX - centroInicioX;
      const dyCentro = centroActualY - centroInicioY;

      setCamara({
        zoom: nuevoZoom,
        x: limitar(camaraInicioX - dxCentro / nuevoZoom, 80, DIMENSIONES_MAPA_MUNDO.ancho - 80),
        y: limitar(camaraInicioY - dyCentro / nuevoZoom, 60, DIMENSIONES_MAPA_MUNDO.alto - 60),
      });
      return;
    }

    if (!arrastreRef.current.activo) return;
    const dx = e.clientX - arrastreRef.current.inicioX;
    const dy = e.clientY - arrastreRef.current.inicioY;
    arrastreRef.current.distancia = Math.hypot(dx, dy);

    if (arrastreRef.current.distancia > 6) {
      arrastreRef.current.suprimirClickHasta = Date.now() + 260;
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignorar si el navegador no soporta captura en punteros sintéticos
        }
      }
    }

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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    punterosRef.current.delete(e.pointerId);
    if (punterosRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (punterosRef.current.size === 1) {
      const [restante] = Array.from(punterosRef.current.values());
      const camActual = camaraRef.current;
      arrastreRef.current = {
        activo: true,
        inicioX: restante.x,
        inicioY: restante.y,
        camaraInicioX: camActual.x,
        camaraInicioY: camActual.y,
        distancia: 10,
        suprimirClickHasta: Date.now() + 260,
      };
    } else {
      arrastreRef.current.activo = false;
    }
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
      className="relative w-full h-full bg-[#021327] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
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
            pantallaX < -320 ||
            pantallaX > tamanoContenedor.ancho + 320 ||
            pantallaY < -320 ||
            pantallaY > tamanoContenedor.alto + 320
          ) {
            return null;
          }

          const conexion = conexionesPorId.get(nodo.id);
          const esActual = nodo.id === ubicacionActualId;
          const esViajable = Boolean(conexion && !conexion.estaBloqueada);
          const esDesbloqueable = Boolean(conexion?.estaBloqueada && conexion.cumpleRequisito);
          const enHover = nodoHoverId === nodo.id;
          const rangoFauna =
            nodo.faunaNivelMinimo !== null && nodo.faunaNivelMaximo !== null
              ? `Nv.${nodo.faunaNivelMinimo}-${nodo.faunaNivelMaximo}`
              : null;

          const anchoHitbox = Math.max(100, Math.round(isla.radioX * 1.68 * camara.zoom));
          const altoHitbox = Math.max(72, Math.round(isla.radioY * 1.56 * camara.zoom));
          const desplazamientoAvatarY = Math.round(-(isla.radioY * 0.96) * camara.zoom);

          return (
            <button
              key={nodo.id}
              type="button"
              data-nodo-mapa={nodo.id}
              onMouseEnter={() => setNodoHoverId(nodo.id)}
              onMouseLeave={() => setNodoHoverId((prev) => (prev === nodo.id ? null : prev))}
              onFocus={() => setNodoHoverId(nodo.id)}
              onBlur={() => setNodoHoverId((prev) => (prev === nodo.id ? null : prev))}
              onClick={() => {
                if (Date.now() < arrastreRef.current.suprimirClickHasta) return;
                reproducirSonido("click", 0.35);
                onSeleccionarNodo(nodo);
              }}
              style={{
                left: `${pantallaX}px`,
                top: `${pantallaY}px`,
                width: `${anchoHitbox}px`,
                height: `${altoHitbox}px`,
                transform: "translate(-50%, -50%)",
              }}
              className={cn(
                "absolute pointer-events-auto group flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14d1e8]/75 rounded-full z-10",
                esActual && "z-20",
                enHover && "z-30",
              )}
              aria-label={`Inspeccionar ${nodo.nombre}`}
            >
              {/* Tooltip flotante con el nombre real de la zona, estado de acceso y servicios */}
              {enHover && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full mb-2 w-max min-w-52 max-w-68 bg-slate-950/95 border-2 border-[#14d1e8] shadow-[4px_4px_0_0_#000] px-2.5 py-2 text-left z-40"
                >
                  <div className="border-b border-slate-800 pb-1 mb-1">
                    <span className="retro text-[8px] text-white leading-snug block">{nodo.nombre}</span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-200 mb-1">
                    {esActual
                      ? "Ubicación actual del grupo."
                      : esViajable
                        ? "Ruta conectada: clic para viajar."
                        : esDesbloqueable
                          ? "Senda desbloqueable disponible."
                          : !nodo.desbloqueada
                            ? "Zona aún bloqueada."
                            : "Zona descubierta (no adyacente)."}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300">
                    {nodo.esSegura ? (
                      <>
                        <span className="inline-flex items-center gap-0.5 text-emerald-300">
                          <Heart className="size-3" /> Santuario
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-300">
                          <Store className="size-3" /> Tienda
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-0.5 text-rose-300">
                          <Swords className="size-3" /> {rangoFauna ?? "Zona salvaje"}
                        </span>
                        {nodo.desbloqueada && (
                          <span className="text-amber-300">· {nodo.progreso}% explorado</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Avatar de la criatura líder en el borde superior de la isla actual sin tapar el monumento */}
              {esActual && (
                <div
                  style={{ top: "50%", marginTop: `${desplazamientoAvatarY}px` }}
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center animate-bounce z-30"
                >
                  <div className="size-10 sm:size-12 bg-black/85 border-2 border-[#14d1e8] shadow-[3px_3px_0_0_#000] p-0.5 flex items-center justify-center">
                    <img
                      src={obtenerImagenCriatura(lider?.especieSlug)}
                      alt={lider?.nombre || "Líder"}
                      onError={(e) => manejarErrorImagen(e, "criatura")}
                      className="w-full h-full object-contain scale-x-[-1]"
                    />
                  </div>
                  <span className="retro text-[7px] bg-[#14d1e8] text-black px-1.5 py-0.5 border border-black font-bold -mt-1">
                    Tú
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Controles de Zoom y Centrado (en móvil sobre el dock con holgura; en desktop abajo a la derecha despejando Santuario de Salud) */}
      <div
        data-controles-mapa="true"
        className="absolute right-2.5 bottom-40 sm:bottom-28 md:bottom-3 mb-[env(safe-area-inset-bottom,0px)] z-30 flex flex-col gap-1.5"
      >
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
            centrarEnUbicacion(ubicacionActualId, resolverZoomInicial(tamanoContenedor.ancho));
          }}
          aria-label="Centrar en mi ubicación"
          className="size-8 sm:size-9 bg-card/95 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center text-[#14d1e8] hover:bg-black active:translate-y-0.5"
        >
          <Crosshair className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const nuevo = alternarSonidoSilenciado();
            setSilenciado(nuevo);
            if (!nuevo) reproducirSonido("click", 0.35);
          }}
          aria-label={silenciado ? "Activar sonido retro" : "Silenciar sonido retro"}
          title={silenciado ? "Activar sonido retro" : "Silenciar sonido retro"}
          className="size-8 sm:size-9 bg-card/95 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center text-slate-100 hover:text-[#14d1e8] active:translate-y-0.5"
        >
          {silenciado ? (
            <VolumeX className="size-4 text-rose-400" />
          ) : (
            <Volume2 className="size-4 text-[#14d1e8]" />
          )}
        </button>
      </div>

      {/* Fin de controles de mapa */}
    </div>
  );
}
