import { useEffect, useRef, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { Progress } from "@/components/ui/8bit/progress";
import { obtenerConfiguracionIsla } from "@/lib/mapa-mundo";
import {
  RUTAS_PLACEHOLDERS,
  manejarErrorImagen,
  obtenerImagenCriatura,
  obtenerImagenZona,
  reproducirSonido,
  sanitizarSlugZona,
} from "@/lib/assets";
import type { LiderMapaInfo } from "./MapaInteractivoCanvas";

export interface TransicionViaje2DProps {
  origenId: string;
  origenNombre: string;
  destinoId: string;
  destinoNombre: string;
  lider?: LiderMapaInfo | null;
  onCompletado: () => void;
}

const DURACION_VIAJE_MS = 1850;

export function TransicionViaje2D({
  origenId,
  origenNombre,
  destinoId,
  destinoNombre,
  lider,
  onCompletado,
}: TransicionViaje2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompletadoRef = useRef(onCompletado);
  onCompletadoRef.current = onCompletado;

  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const islaOrigen = obtenerConfiguracionIsla(origenId);
    const islaDestino = obtenerConfiguracionIsla(destinoId);

    // Cargar sprite de la criatura líder con fallback seguro
    const sprite = new Image();
    let spriteCargado = false;
    sprite.onload = () => {
      spriteCargado = true;
    };
    sprite.onerror = () => {
      if (!sprite.src.endsWith(RUTAS_PLACEHOLDERS.criatura)) {
        sprite.src = RUTAS_PLACEHOLDERS.criatura;
      }
    };
    sprite.src = obtenerImagenCriatura(lider?.especieSlug);

    const particulas: { x: number; y: number; vx: number; vy: number; vida: number }[] = [];
    const inicio = performance.now();
    let ultimoPasoSonoro = 0;
    let frameId = 0;
    let finalizado = false;

    const animar = (ahora: number) => {
      const transcurrido = ahora - inicio;
      const t = Math.min(1, transcurrido / DURACION_VIAJE_MS);
      setProgreso(Math.round(t * 100));

      // Sonido rítmico de pasos mientras camina
      if (t < 0.92 && ahora - ultimoPasoSonoro > 320) {
        ultimoPasoSonoro = ahora;
        reproducirSonido("paso", 0.3);
        particulas.push({
          x: 70 + t * 500 - 12,
          y: 190,
          vx: -1.4 - Math.random(),
          vy: -0.8 - Math.random() * 1.2,
          vida: 1,
        });
      }

      const W = 640;
      const H = 260;
      ctx.imageSmoothingEnabled = false;

      // Cielo nocturno tenebroso con transición de bioma origen -> destino
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, islaOrigen.colorCielo);
      grad.addColorStop(1, islaDestino.colorCielo);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Luna pálida espectral
      ctx.fillStyle = "rgba(226, 232, 240, 0.14)";
      ctx.beginPath();
      ctx.arc(520, 56, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(520, 56, 18, 0, Math.PI * 2);
      ctx.fill();

      // Estrellas tenues y niebla nocturna en parallax
      ctx.fillStyle = "rgba(203, 213, 225, 0.35)";
      for (let i = 0; i < 18; i++) {
        const sx = ((i * 73 - t * 90) % W + W) % W;
        const sy = 16 + (i * 29) % 95;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
      const nieblaOffset = (t * 120) % W;
      ctx.fillRect(W - nieblaOffset, 128, 180, 22);
      ctx.fillRect((W * 0.5 - nieblaOffset + W) % W, 146, 140, 18);

      // Abismo volcánico inferior con río de magma y brasas ascendentes
      const pulsoLava = 0.65 + Math.sin(ahora * 0.005) * 0.3;
      ctx.fillStyle = "#160708";
      ctx.fillRect(0, 198, W, 62);
      ctx.fillStyle = `rgba(234, 88, 12, ${0.42 * pulsoLava})`;
      ctx.fillRect(0, 212, W, 22);
      ctx.fillStyle = `rgba(251, 191, 36, ${0.55 * pulsoLava})`;
      for (let wx = 0; wx < W; wx += 44) {
        const offset = Math.sin(ahora * 0.006 + wx) * 5;
        ctx.fillRect(wx + offset, 220, 20, 3);
      }

      // Tierra de la isla origen (izquierda)
      ctx.fillStyle = islaOrigen.colorBorde;
      ctx.fillRect(0, 184, 150, 26);
      ctx.fillStyle = islaOrigen.colorSuelo;
      ctx.fillRect(0, 178, 146, 14);

      // Tierra de la isla destino (derecha)
      ctx.fillStyle = islaDestino.colorBorde;
      ctx.fillRect(490, 184, 150, 26);
      ctx.fillStyle = islaDestino.colorSuelo;
      ctx.fillRect(494, 178, 146, 14);

      // Puente viejo de madera oscura con faroles que se encienden al pasar el líder
      const posX = 70 + t * 500;
      ctx.fillStyle = "#26180e";
      ctx.fillRect(140, 184, 360, 12);
      ctx.fillStyle = "#47311e";
      for (let px = 144; px < 496; px += 18) {
        ctx.fillRect(px, 181, 14, 8);
      }
      const brilloFarol = 0.72 + Math.sin(ahora * 0.015) * 0.28;
      for (let px = 150; px <= 490; px += 68) {
        const encendida = posX >= px - 14;
        ctx.fillStyle = "#1c120a";
        ctx.fillRect(px, 160, 6, 28);
        if (encendida) {
          ctx.fillStyle = `rgba(251, 146, 60, ${0.3 * brilloFarol})`;
          ctx.beginPath();
          ctx.arc(px + 3, 157, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(253, 224, 71, ${brilloFarol})`;
          ctx.fillRect(px - 1, 154, 8, 6);
        } else {
          ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
          ctx.fillRect(px, 155, 6, 5);
        }
      }
      ctx.fillStyle = "#3b2718";
      ctx.fillRect(150, 168, 344, 4);

      // Estela de energía y polvo detrás de la criatura
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.04;
        if (p.vida <= 0) {
          particulas.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(20, 209, 232, ${p.vida * 0.85})`;
        ctx.fillRect(p.x, p.y, 5, 5);
      }

      // Destello de portal al llegar a la isla destino
      if (t > 0.82) {
        const intensidadPortal = (t - 0.82) / 0.18;
        ctx.strokeStyle = `rgba(20, 209, 232, ${intensidadPortal * 0.85})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(570, 152, 26 + intensidadPortal * 14, 38 + intensidadPortal * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Criatura líder caminando/saltando de izquierda a derecha
      const salto = Math.abs(Math.sin(t * Math.PI * 10)) * 12;
      const posY = 178 - salto;

      // Sombra en el suelo
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(posX, 184, 22 - salto * 0.4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (spriteCargado) {
        ctx.save();
        ctx.translate(posX, posY - 40);
        // Los sprites canónicos miran a la izquierda; invertimos en X para que camine a la derecha
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -38, -38, 76, 76);
        ctx.restore();
      } else {
        // Silueta provisional mientras carga
        ctx.fillStyle = "#14d1e8";
        ctx.fillRect(posX - 16, posY - 36, 32, 32);
      }

      // Partículas ambientales del bioma destino que se intensifican al acercarse
      const colorClima =
        islaDestino.bioma === "glaciar"
          ? "rgba(224, 242, 254, 0.8)"
          : islaDestino.bioma === "volcan"
            ? "rgba(251, 146, 60, 0.85)"
            : islaDestino.bioma === "bosque" || islaDestino.bioma === "pradera"
              ? "rgba(163, 230, 53, 0.78)"
              : islaDestino.bioma === "lago"
                ? "rgba(34, 211, 238, 0.75)"
                : "rgba(251, 191, 36, 0.65)";

      const cantidadClima = Math.max(4, Math.floor(4 + t * 12));
      ctx.fillStyle = colorClima;
      for (let i = 0; i < cantidadClima; i++) {
        const faseClima = (ahora * 0.0005 + i * 0.17) % 1;
        const cx = ((i * 89 + ahora * 0.04) % W + W) % W;
        const cy =
          islaDestino.bioma === "volcan"
            ? H - faseClima * (H * 0.85)
            : faseClima * (H * 0.85);
        ctx.fillRect(Math.round(cx), Math.round(cy), 3, 3);
      }

      if (t < 1) {
        frameId = requestAnimationFrame(animar);
      } else if (!finalizado) {
        finalizado = true;
        reproducirSonido("confirmar", 0.55);
        onCompletadoRef.current();
      }
    };

    frameId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frameId);
  }, [destinoId, lider?.especieSlug, origenId]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-2xl bg-bastion border-4 border-black shadow-[8px_8px_0_0_#000] p-4 sm:p-6 space-y-4 text-slate-100">
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-[#14d1e8] animate-spin" />
            <span className="retro text-[10px] sm:text-xs text-[#14d1e8] tracking-wider">
              TRAVESÍA EN CURSO
            </span>
          </div>
          {lider && (
            <span className="retro text-[8px] sm:text-[9px] text-amber-300 bg-black/70 px-2 py-1 border border-black">
              LÍDER: {lider.nombre.toUpperCase()} NV.{lider.nivel}
            </span>
          )}
        </div>

        {/* Vista previa de la zona destino + Lienzo 2D animado */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 items-stretch">
          <div className="border-4 border-black bg-[#090d16] shadow-[inset_2px_2px_0_0_#000] overflow-hidden">
            <canvas
              ref={canvasRef}
              width={640}
              height={260}
              className="w-full h-full object-cover block"
            />
          </div>
          <div className="border-4 border-black bg-[#090d16] shadow-[4px_4px_0_0_#000] overflow-hidden relative min-h-[110px]">
            <img
              src={obtenerImagenZona(sanitizarSlugZona(destinoNombre))}
              alt={`Zona destino: ${destinoNombre}`}
              decoding="async"
              onError={(e) => manejarErrorImagen(e, "zona")}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2">
              <span className="retro text-[7px] text-[#14d1e8] tracking-wider">
                DESTINO
              </span>
              <span className="retro text-[9px] text-white font-bold leading-tight truncate">
                {destinoNombre}
              </span>
            </div>
          </div>
        </div>

        {/* Origen -> Destino y barra de carga */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 retro text-[9px] sm:text-[11px]">
            <span className="text-slate-300">{origenNombre}</span>
            <ArrowRight className="size-3.5 text-[#14d1e8]" />
            <span className="text-emerald-300 font-bold">{destinoNombre}</span>
          </div>
          <Progress value={progreso} className="h-3 border-2 border-black bg-black" />
          <p className="text-center retro text-[8px] text-slate-400">
            Avanzando hacia {destinoNombre} ({obtenerConfiguracionIsla(destinoId).bioma})... {progreso}%
          </p>
        </div>
      </div>
    </div>
  );
}
