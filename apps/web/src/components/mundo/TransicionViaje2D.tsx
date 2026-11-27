import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Compass } from "lucide-react";
import { obtenerConfiguracionIsla } from "@/lib/mapa-mundo";
import {
  DURACION_VIAJE_MS,
  DURACION_VIAJE_REDUCIDO_MS,
  calcularProyeccionCover,
  calcularRumboBrujula,
  evaluarEstadoViaje,
  mezclarColorRgba,
  obtenerPerfilBiomaViaje,
  type PerfilVisualBiomaViaje,
} from "@/lib/transicion-viaje";
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

interface ParticulaPolvo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tamano: number;
  vida: number;
  color: string;
}

interface ParticulaClima {
  semillaX: number;
  semillaY: number;
  velocidad: number;
  tamano: number;
  profundidad: number;
  fase: number;
}

interface EcoCriatura {
  x: number;
  y: number;
  escalaX: number;
  escalaY: number;
  inclinacion: number;
  enDestino: boolean;
}

function crearSemillaDeterminista(texto: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearPoolClima(semilla: string, cantidad: number): ParticulaClima[] {
  const rand = crearSemillaDeterminista(semilla);
  const lista: ParticulaClima[] = [];
  for (let i = 0; i < cantidad; i++) {
    lista.push({
      semillaX: rand(),
      semillaY: rand(),
      velocidad: 0.45 + rand() * 0.95,
      tamano: rand() > 0.68 ? 4 : rand() > 0.3 ? 3 : 2,
      profundidad: rand() > 0.72 ? 1 : 0,
      fase: rand() * Math.PI * 2,
    });
  }
  return lista;
}

function cargarImagenConFallback(
  src: string,
  fallback: string,
  onLista: (img: HTMLImageElement) => void,
): () => void {
  let cancelado = false;
  let entregada = false;
  const entregar = (img: HTMLImageElement) => {
    if (cancelado || entregada) return;
    entregada = true;
    onLista(img);
  };
  const img = new Image();
  img.decoding = "async";
  img.onload = () => entregar(img);
  img.onerror = () => {
    if (cancelado) return;
    if (/\.webp$/i.test(img.src)) {
      img.src = img.src.replace(/\.webp$/i, ".png");
    } else if (!img.src.endsWith(fallback)) {
      img.src = fallback;
    }
  };
  img.src = src;
  if (img.complete && img.naturalWidth > 0) {
    entregar(img);
  }
  return () => {
    cancelado = true;
  };
}

function crearSiluetaTintada(sprite: HTMLImageElement, colorHex: string): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const off = document.createElement("canvas");
  off.width = 96;
  off.height = 96;
  const octx = off.getContext("2d");
  if (!octx) return null;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(sprite, 0, 0, 96, 96);
  octx.globalCompositeOperation = "source-atop";
  octx.fillStyle = colorHex;
  octx.fillRect(0, 0, 96, 96);
  return off;
}

/**
 * Calcula la coordenada X pixel-escalonada del Velo Astral para una altura y dada.
 * Usa ondas suaves de baja frecuencia para un borde fluido y orgánico sin picos bruscos.
 */
function resolverXVelo(y: number, alto: number, baseX: number, inclSpan: number, tiempoMs: number): number {
  const yNorm = y / Math.max(1, alto);
  const ondaSuave =
    Math.sin(yNorm * Math.PI * 3.2 + tiempoMs * 0.0055) * 6 +
    Math.cos(yNorm * Math.PI * 6.5 - tiempoMs * 0.004) * 2.5;
  const baseDiagonal = baseX + (0.5 - yNorm) * inclSpan;
  return Math.round((baseDiagonal + ondaSuave) / 2) * 2;
}

function trazarPoligonoIzquierdaVelo(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  baseX: number,
  inclSpan: number,
  tiempoMs: number,
): void {
  const paso = 12;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let y = 0; y <= alto + paso; y += paso) {
    const xv = Math.max(-24, Math.min(ancho + 24, resolverXVelo(y, alto, baseX, inclSpan, tiempoMs)));
    ctx.lineTo(xv, y);
  }
  ctx.lineTo(0, alto);
  ctx.closePath();
}

function trazarPoligonoDerechaVelo(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  baseX: number,
  inclSpan: number,
  tiempoMs: number,
): void {
  const paso = 12;
  ctx.beginPath();
  ctx.moveTo(ancho, 0);
  for (let y = 0; y <= alto + paso; y += paso) {
    const xv = Math.max(-24, Math.min(ancho + 24, resolverXVelo(y, alto, baseX, inclSpan, tiempoMs)));
    ctx.lineTo(xv, y);
  }
  ctx.lineTo(ancho, alto);
  ctx.closePath();
}

function dibujarFondoPaisaje(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  perfil: PerfilVisualBiomaViaje,
  ancho: number,
  alto: number,
  paneoNorm: number,
  zoom: number,
  tiempoMs: number,
): void {
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const rect = calcularProyeccionCover(img.naturalWidth, img.naturalHeight, ancho, alto, paneoNorm, zoom);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, ancho, alto);
    ctx.imageSmoothingEnabled = false;
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, alto);
    grad.addColorStop(0, "#05070b");
    grad.addColorStop(0.55, perfil.colorCieloTinte);
    grad.addColorStop(1, perfil.colorAbismoSuperior);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ancho, alto);

    ctx.fillStyle = "rgba(5, 7, 11, 0.55)";
    const horizonte = Math.round(alto * 0.65);
    for (let x = 0; x < ancho; x += 24) {
      const hPico = 24 + Math.round(Math.abs(Math.sin(x * 0.015 + paneoNorm * 4)) * 46);
      ctx.fillRect(x, horizonte - hPico, 24, hPico + alto * 0.2);
    }
  }

  // Integración atmosférica sin apagar la riqueza cromática de la pintura original
  const veloAtm = ctx.createLinearGradient(0, 0, 0, alto);
  veloAtm.addColorStop(0, "rgba(5, 7, 11, 0.44)");
  veloAtm.addColorStop(0.26, mezclarColorRgba(perfil.colorCieloTinte, "#05070b", 0.35, 0.14));
  veloAtm.addColorStop(0.68, "rgba(5, 7, 11, 0.05)");
  veloAtm.addColorStop(1, "rgba(5, 7, 11, 0.62)");
  ctx.fillStyle = veloAtm;
  ctx.fillRect(0, 0, ancho, alto);

  if (perfil.tieneAurora) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const fase = tiempoMs * 0.0009 + i * 1.6;
      const bandaY = alto * (0.14 + i * 0.055);
      const gradAurora = ctx.createLinearGradient(0, bandaY - 26, 0, bandaY + 28);
      gradAurora.addColorStop(0, "rgba(125, 211, 252, 0)");
      gradAurora.addColorStop(
        0.5,
        i % 2 === 0 ? "rgba(45, 212, 191, 0.18)" : "rgba(125, 211, 252, 0.15)",
      );
      gradAurora.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = gradAurora;
      ctx.beginPath();
      ctx.moveTo(0, bandaY + 26);
      for (let x = 0; x <= ancho; x += 32) {
        ctx.lineTo(x, bandaY + Math.sin(x * 0.011 + fase) * 14);
      }
      ctx.lineTo(ancho, bandaY + 32);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (perfil.tieneHacesLuz) {
    ctx.save();
    const gradHaz = ctx.createLinearGradient(ancho * 0.58, 0, ancho * 0.34, alto * 0.78);
    gradHaz.addColorStop(0, mezclarColorRgba(perfil.colorSecundario, "#ffffff", 0.35, 0.13));
    gradHaz.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradHaz;
    const osc = Math.sin(tiempoMs * 0.001) * 16;
    ctx.beginPath();
    ctx.moveTo(ancho * 0.62 + osc, 0);
    ctx.lineTo(ancho * 0.78 + osc, 0);
    ctx.lineTo(ancho * 0.44 + osc, alto * 0.78);
    ctx.lineTo(ancho * 0.28 + osc, alto * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function dibujarBajoPuenteBioma(
  ctx: CanvasRenderingContext2D,
  perfil: PerfilVisualBiomaViaje,
  ancho: number,
  alto: number,
  nivelPuente: number,
  desplazamientoPx: number,
  tiempoMs: number,
): void {
  const yInicio = nivelPuente + 8;
  const alturaBajo = Math.max(0, alto - yInicio);
  if (alturaBajo <= 0) return;

  const grad = ctx.createLinearGradient(0, yInicio, 0, alto);
  grad.addColorStop(0, perfil.colorAbismoSuperior);
  grad.addColorStop(1, perfil.colorAbismoInferior);
  ctx.fillStyle = grad;
  ctx.fillRect(0, yInicio, ancho, alturaBajo);

  if (perfil.tipoBajoPuente === "oceano" || perfil.tipoBajoPuente === "lago") {
    const filas = 6;
    for (let f = 0; f < filas; f++) {
      const yFila = Math.round(yInicio + 10 + (f / filas) * (alturaBajo - 14));
      const paso = 48 + f * 10;
      const offset =
        ((desplazamientoPx * (0.28 + f * 0.07) + tiempoMs * 0.015 * (f % 2 === 0 ? 1 : -1)) % paso + paso) %
        paso;
      ctx.fillStyle = mezclarColorRgba(perfil.colorReflejo, "#ffffff", 0.22, 0.18 + f * 0.04);
      for (let x = -paso; x < ancho + paso; x += paso) {
        const largo = 16 + ((f * 7 + Math.abs(x)) % 22);
        ctx.fillRect(Math.round(x - offset), yFila, largo, f > 3 ? 3 : 2);
      }
    }
    if (perfil.tipoBajoPuente === "lago") {
      const bruma = ctx.createLinearGradient(0, yInicio, 0, yInicio + alturaBajo * 0.65);
      bruma.addColorStop(0, "rgba(168, 85, 247, 0.30)");
      bruma.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = bruma;
      ctx.fillRect(0, yInicio, ancho, alturaBajo * 0.65);
    }
  } else if (perfil.tipoBajoPuente === "magma") {
    const pulso = 0.74 + Math.sin(tiempoMs * 0.005) * 0.24;
    const resplandor = ctx.createLinearGradient(0, alto, 0, yInicio);
    resplandor.addColorStop(0, `rgba(234, 88, 12, ${(0.52 * pulso).toFixed(3)})`);
    resplandor.addColorStop(0.55, `rgba(192, 132, 252, ${(0.18 * pulso).toFixed(3)})`);
    resplandor.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = resplandor;
    ctx.fillRect(0, yInicio, ancho, alturaBajo);

    const paso = 64;
    const offset = ((desplazamientoPx * 0.35) % paso + paso) % paso;
    ctx.fillStyle = `rgba(251, 191, 36, ${(0.68 * pulso).toFixed(3)})`;
    for (let x = -paso; x < ancho + paso; x += paso) {
      const rx = Math.round(x - offset);
      const ry = Math.round(yInicio + alturaBajo * 0.52 + Math.sin(rx * 0.04 + tiempoMs * 0.004) * 5);
      ctx.fillRect(rx, ry, 30, 3);
      ctx.fillRect(rx + 10, ry + 5, 18, 2);
    }
  } else if (perfil.tipoBajoPuente === "glaciar") {
    const niebla = ctx.createLinearGradient(0, yInicio, 0, alto);
    niebla.addColorStop(0, "rgba(125, 211, 252, 0.24)");
    niebla.addColorStop(0.65, "rgba(45, 212, 191, 0.10)");
    niebla.addColorStop(1, "rgba(15, 23, 42, 0.08)");
    ctx.fillStyle = niebla;
    ctx.fillRect(0, yInicio, ancho, alturaBajo);

    const paso = 52;
    const offset = ((desplazamientoPx * 0.42) % paso + paso) % paso;
    ctx.fillStyle = "rgba(125, 211, 252, 0.24)";
    for (let x = -paso; x < ancho + paso; x += paso) {
      const px = Math.round(x - offset);
      const altoAguja = 20 + (Math.abs(x) % 24);
      ctx.fillRect(px, alto - altoAguja, 8, altoAguja);
      ctx.fillRect(px + 2, alto - altoAguja - 8, 4, 8);
    }
  } else {
    const bruma = ctx.createLinearGradient(0, yInicio, 0, yInicio + alturaBajo * 0.78);
    bruma.addColorStop(0, mezclarColorRgba(perfil.colorReflejo, "#05070b", 0.45, 0.28));
    bruma.addColorStop(1, "rgba(5, 7, 11, 0)");
    ctx.fillStyle = bruma;
    ctx.fillRect(0, yInicio, ancho, alturaBajo * 0.78);
  }
}

/**
 * Calzada de piedra tallada con arcos semicirculares pixel-escalonados, dovelas,
 * sillares alternos y monolitos rúnicos que se encienden al paso de la criatura.
 */
function dibujarCalzadaArcos16Bit(
  ctx: CanvasRenderingContext2D,
  perfil: PerfilVisualBiomaViaje,
  ancho: number,
  alto: number,
  nivelPuente: number,
  desplazamientoPx: number,
  criaturaX: number,
  tiempoMs: number,
): void {
  ctx.imageSmoothingEnabled = false;

  // 1. Arcos de medio punto de piedra medieval tallada con sillares y clave central
  const pasoArco = 152;
  const anchoPilar = 28;
  const radioArco = Math.round((pasoArco - anchoPilar) / 2); // 62px de radio claro
  const yCoronaArco = nivelPuente + 18;
  const yCentroArco = yCoronaArco + Math.round(radioArco * 0.74);
  const offsetArco = ((desplazamientoPx) % pasoArco + pasoArco) % pasoArco;
  const alturaRestante = Math.max(40, alto - nivelPuente);

  for (let gx = -pasoArco; gx < ancho + pasoArco; gx += pasoArco) {
    const xPilar = Math.round(gx - offsetArco);
    const centroArco = xPilar + Math.round(pasoArco / 2);

    // Enjutas y arco semicircular pixel-escalonado en bandas de 4px
    const yTopeEnjuta = nivelPuente + 12;
    const altoArcoPx = Math.max(24, yCentroArco - yTopeEnjuta);
    for (let dy = 0; dy < altoArcoPx; dy += 4) {
      const yFila = yTopeEnjuta + dy;
      const distCentroY = Math.max(0, yCentroArco - yFila);
      const ratioY = Math.min(1, distCentroY / Math.max(1, radioArco * 0.78));
      const mediaAbertura = Math.round((Math.sqrt(Math.max(0, 1 - ratioY * ratioY)) * radioArco) / 4) * 4;

      const xIzqAbertura = centroArco - mediaAbertura;
      const xDerAbertura = centroArco + mediaAbertura;

      // Relleno de mampostería izquierda y derecha de la enjuta
      const wIzq = Math.max(0, xIzqAbertura - (xPilar + anchoPilar / 2));
      const wDer = Math.max(0, xPilar + pasoArco - anchoPilar / 2 - xDerAbertura);

      ctx.fillStyle = perfil.colorPiedraSombra;
      if (wIzq > 0) ctx.fillRect(xPilar + anchoPilar / 2, yFila, wIzq, 4);
      if (wDer > 0) ctx.fillRect(xDerAbertura, yFila, wDer, 4);

      // Sillares iluminados intercalados en la enjuta
      if ((dy / 4) % 2 === 0) {
        ctx.fillStyle = perfil.colorPiedraBase;
        if (wIzq > 8) ctx.fillRect(xPilar + anchoPilar / 2 + 2, yFila, Math.max(0, wIzq - 8), 2);
        if (wDer > 8) ctx.fillRect(xDerAbertura + 6, yFila, Math.max(0, wDer - 8), 2);
      }

      // Dovelas talladas perfilando la curva interior del arco
      if (mediaAbertura > 4) {
        ctx.fillStyle = "#05070b";
        ctx.fillRect(xIzqAbertura - 2, yFila, 2, 4);
        ctx.fillRect(xDerAbertura, yFila, 2, 4);
        ctx.fillStyle = perfil.colorPiedraLuz;
        ctx.fillRect(xIzqAbertura - 6, yFila, 4, 4);
        ctx.fillStyle = perfil.colorPiedraBase;
        ctx.fillRect(xDerAbertura + 2, yFila, 4, 4);
      }
    }

    // Clave central destacada en la corona del arco
    ctx.fillStyle = "#05070b";
    ctx.fillRect(centroArco - 6, yTopeEnjuta, 12, 12);
    ctx.fillStyle = perfil.colorPiedraLuz;
    ctx.fillRect(centroArco - 4, yTopeEnjuta + 2, 8, 8);
    ctx.fillStyle = mezclarColorRgba(perfil.colorPiedraDetalle, perfil.colorPiedraLuz, 0.35, 0.85);
    ctx.fillRect(centroArco - 2, yTopeEnjuta + 4, 4, 4);

    // Pilar vertical de mampostería con basamento y juntas de sillares
    const xPilarIzq = xPilar - Math.round(anchoPilar / 2);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(xPilarIzq - 2, nivelPuente + 12, anchoPilar + 4, alturaRestante);
    ctx.fillStyle = perfil.colorPiedraSombra;
    ctx.fillRect(xPilarIzq, nivelPuente + 12, anchoPilar, alturaRestante);
    ctx.fillStyle = perfil.colorPiedraBase;
    ctx.fillRect(xPilarIzq + 2, nivelPuente + 14, anchoPilar - 8, alturaRestante);
    ctx.fillStyle = perfil.colorPiedraLuz;
    ctx.fillRect(xPilarIzq + 2, nivelPuente + 14, 4, alturaRestante);

    // Capitel de apoyo del arco sobre el pilar + hiladas horizontales de sillares
    ctx.fillStyle = perfil.colorPiedraLuz;
    ctx.fillRect(xPilarIzq - 2, yCentroArco - 2, anchoPilar + 4, 4);
    ctx.fillStyle = perfil.colorPiedraSombra;
    for (let sy = nivelPuente + 24; sy < alto; sy += 14) {
      ctx.fillRect(xPilarIzq, sy, anchoPilar, 2);
    }
  }

  // 2. Pretil bajo de piedra y monolitos rúnicos que se encienden al paso
  ctx.fillStyle = "#05070b";
  ctx.fillRect(0, nivelPuente - 9, ancho, 8);
  ctx.fillStyle = perfil.colorPiedraSombra;
  ctx.fillRect(0, nivelPuente - 7, ancho, 5);
  ctx.fillStyle = perfil.colorPiedraBase;
  ctx.fillRect(0, nivelPuente - 7, ancho, 2);

  const pasoPilarRunico = 180;
  const offsetRuna = ((desplazamientoPx) % pasoPilarRunico + pasoPilarRunico) % pasoPilarRunico;
  const pulsoRuna = 0.78 + Math.sin(tiempoMs * 0.012) * 0.22;

  for (let rx = -pasoPilarRunico; rx < ancho + pasoPilarRunico; rx += pasoPilarRunico) {
    const px = Math.round(rx - offsetRuna);
    const distancia = criaturaX - px;
    const encendido = distancia >= -16;
    const destelloReciente = Math.max(0, 1 - Math.abs(distancia) / 52);

    ctx.fillStyle = "#05070b";
    ctx.fillRect(px - 8, nivelPuente - 42, 16, 42);
    ctx.fillStyle = perfil.colorPiedraSombra;
    ctx.fillRect(px - 6, nivelPuente - 40, 12, 38);
    ctx.fillStyle = perfil.colorPiedraBase;
    ctx.fillRect(px - 5, nivelPuente - 38, 8, 34);
    ctx.fillStyle = perfil.colorPiedraLuz;
    ctx.fillRect(px - 7, nivelPuente - 42, 14, 4);
    ctx.fillRect(px - 4, nivelPuente - 46, 8, 4);

    if (encendido) {
      const radioHalo = 24 + destelloReciente * 20;
      const gradHalo = ctx.createRadialGradient(px, nivelPuente - 26, 2, px, nivelPuente - 26, radioHalo);
      gradHalo.addColorStop(0, mezclarColorRgba(perfil.colorAcento, "#ffffff", 0.28, 0.58 * pulsoRuna));
      gradHalo.addColorStop(1, mezclarColorRgba(perfil.colorAcento, "#000000", 0, 0));
      ctx.fillStyle = gradHalo;
      ctx.fillRect(px - radioHalo, nivelPuente - 26 - radioHalo, radioHalo * 2, radioHalo * 2);

      ctx.fillStyle = perfil.colorAcento;
      ctx.fillRect(px - 2, nivelPuente - 33, 4, 14);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(px - 1, nivelPuente - 31, 2, 8);

      ctx.fillStyle = mezclarColorRgba(perfil.colorAcento, "#ffffff", 0.1, 0.25 * pulsoRuna);
      ctx.fillRect(px - 18, nivelPuente, 36, 4);
    } else {
      ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
      ctx.fillRect(px - 1, nivelPuente - 31, 2, 10);
    }
  }

  // 3. Cornisa y losas biseladas 16-bit
  ctx.fillStyle = "#05070b";
  ctx.fillRect(0, nivelPuente - 2, ancho, 18);
  ctx.fillStyle = perfil.colorPiedraBase;
  ctx.fillRect(0, nivelPuente, ancho, 12);
  ctx.fillStyle = perfil.colorPiedraLuz;
  ctx.fillRect(0, nivelPuente, ancho, 3);
  ctx.fillStyle = perfil.colorPiedraSombra;
  ctx.fillRect(0, nivelPuente + 10, ancho, 4);

  const pasoLosa = 32;
  const offsetLosa = ((desplazamientoPx) % pasoLosa + pasoLosa) % pasoLosa;
  for (let lx = -pasoLosa; lx < ancho + pasoLosa; lx += pasoLosa) {
    const xLosa = Math.round(lx - offsetLosa);
    ctx.fillStyle = perfil.colorPiedraSombra;
    ctx.fillRect(xLosa, nivelPuente, 2, 10);
    ctx.fillRect(xLosa + 16, nivelPuente + 5, 2, 7);

    if (Math.abs(Math.round(lx / pasoLosa)) % 2 === 0) {
      ctx.fillStyle = mezclarColorRgba(perfil.colorPiedraDetalle, perfil.colorPiedraLuz, 0.25, 0.78);
      ctx.fillRect(xLosa + 6, nivelPuente + 2, 8, 2);
    }
  }
}

/**
 * Arco gótico rúnico de llegada con columnas biseladas, corona escalonada,
 * cristal flotante y vórtice astral multicolor del bioma destino.
 */
function dibujarPortalDestino(
  ctx: CanvasRenderingContext2D,
  perfilDestino: PerfilVisualBiomaViaje,
  portalX: number,
  nivelPuente: number,
  intensidad: number,
  tiempoMs: number,
): void {
  if (intensidad <= 0.01) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const px = Math.round(portalX);
  const py = Math.round(nivelPuente);
  const altoPortal = 104;
  const semiAncho = 28;
  const pulso = 0.84 + Math.sin(tiempoMs * 0.014) * 0.16;

  // Aura expansiva sobre el cielo y la calzada
  const radioGlow = 82 + intensidad * 42;
  const grad = ctx.createRadialGradient(px, py - altoPortal * 0.52, 4, px, py - altoPortal * 0.52, radioGlow);
  grad.addColorStop(0, mezclarColorRgba(perfilDestino.colorAcento, "#14d1e8", 0.35, 0.52 * intensidad));
  grad.addColorStop(0.55, mezclarColorRgba(perfilDestino.colorAcento, "#05070b", 0.2, 0.18 * intensidad));
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(px - radioGlow, py - altoPortal * 0.52 - radioGlow, radioGlow * 2, radioGlow * 2);

  // Vórtice interior escalonado con halo de energía ascendente
  ctx.fillStyle = mezclarColorRgba(perfilDestino.colorAcento, "#05070b", 0.2, 0.6 * intensidad * pulso);
  ctx.fillRect(px - 16, py - altoPortal + 18, 32, altoPortal - 20);
  ctx.fillStyle = mezclarColorRgba("#14d1e8", perfilDestino.colorAcento, 0.38, 0.78 * intensidad * pulso);
  ctx.fillRect(px - 10, py - altoPortal + 24, 20, altoPortal - 28);
  ctx.fillStyle = mezclarColorRgba("#e0f2fe", perfilDestino.colorAcento, 0.22, 0.9 * intensidad * pulso);
  ctx.fillRect(px - 4, py - altoPortal + 30, 8, altoPortal - 36);

  // Chispas verticales ascendiendo dentro del umbral
  for (let i = 0; i < 6; i++) {
    const fase = ((tiempoMs * 0.0014 + i * 0.19) % 1);
    const sx = px - 10 + ((i * 7) % 20);
    const sy = py - 8 - fase * (altoPortal - 32);
    ctx.fillStyle = i % 2 === 0 ? "#f8fafc" : perfilDestino.colorAcento;
    ctx.fillRect(Math.round(sx), Math.round(sy), 3, 5);
  }

  // Plinto escalonado de base
  ctx.fillStyle = "#05070b";
  ctx.fillRect(px - semiAncho - 8, py - 8, semiAncho * 2 + 16, 10);
  ctx.fillStyle = perfilDestino.colorPiedraBase;
  ctx.fillRect(px - semiAncho - 6, py - 6, semiAncho * 2 + 12, 6);
  ctx.fillStyle = perfilDestino.colorPiedraLuz;
  ctx.fillRect(px - semiAncho - 6, py - 6, semiAncho * 2 + 12, 2);

  // Columnas gemelas biseladas con capiteles
  ctx.fillStyle = "#05070b";
  ctx.fillRect(px - semiAncho - 2, py - altoPortal + 10, 14, altoPortal - 14);
  ctx.fillRect(px + semiAncho - 12, py - altoPortal + 10, 14, altoPortal - 14);

  ctx.fillStyle = perfilDestino.colorPiedraSombra;
  ctx.fillRect(px - semiAncho, py - altoPortal + 12, 10, altoPortal - 18);
  ctx.fillRect(px + semiAncho - 10, py - altoPortal + 12, 10, altoPortal - 18);

  ctx.fillStyle = perfilDestino.colorPiedraBase;
  ctx.fillRect(px - semiAncho, py - altoPortal + 12, 7, altoPortal - 18);
  ctx.fillRect(px + semiAncho - 10, py - altoPortal + 12, 7, altoPortal - 18);

  ctx.fillStyle = perfilDestino.colorPiedraLuz;
  ctx.fillRect(px - semiAncho, py - altoPortal + 12, 3, altoPortal - 18);
  ctx.fillRect(px + semiAncho - 10, py - altoPortal + 12, 3, altoPortal - 18);

  // Corona gótica escalonada en arco ojival pixelado
  const nivelesCorona = [
    { w: semiAncho * 2 + 12, y: py - altoPortal + 4, h: 10 },
    { w: semiAncho * 2 - 4, y: py - altoPortal - 4, h: 8 },
    { w: 28, y: py - altoPortal - 10, h: 6 },
    { w: 14, y: py - altoPortal - 16, h: 6 },
  ];
  for (const n of nivelesCorona) {
    ctx.fillStyle = "#05070b";
    ctx.fillRect(px - n.w / 2 - 2, n.y - 2, n.w + 4, n.h + 2);
    ctx.fillStyle = perfilDestino.colorPiedraBase;
    ctx.fillRect(px - n.w / 2, n.y, n.w, n.h);
    ctx.fillStyle = perfilDestino.colorPiedraLuz;
    ctx.fillRect(px - n.w / 2, n.y, n.w, 2);
  }

  // Runas talladas encendidas en pilares y clave
  ctx.fillStyle = perfilDestino.colorAcento;
  ctx.fillRect(px - 3, py - altoPortal - 8, 6, 6);
  ctx.fillRect(px - semiAncho + 4, py - 68, 2, 10);
  ctx.fillRect(px - semiAncho + 4, py - 46, 2, 10);
  ctx.fillRect(px + semiAncho - 6, py - 68, 2, 10);
  ctx.fillRect(px + semiAncho - 6, py - 46, 2, 10);

  // Cristal rúnico flotante sobre el pináculo del arco
  const flote = Math.round(Math.sin(tiempoMs * 0.008) * 4);
  const yCristal = py - altoPortal - 30 + flote;
  ctx.fillStyle = "#05070b";
  ctx.fillRect(px - 5, yCristal - 5, 10, 12);
  ctx.fillStyle = perfilDestino.colorAcento;
  ctx.fillRect(px - 3, yCristal - 3, 6, 8);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(px - 1, yCristal - 1, 2, 4);

  ctx.restore();
}

function dibujarParticulasClimaBioma(
  ctx: CanvasRenderingContext2D,
  pool: ParticulaClima[],
  perfil: PerfilVisualBiomaViaje,
  ancho: number,
  alto: number,
  tiempoMs: number,
  soloPrimerPlano: boolean,
): void {
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if ((p.profundidad === 1) !== soloPrimerPlano) continue;

    const vel = p.velocidad * (soloPrimerPlano ? 1.55 : 0.85);
    let x = 0;
    let y = 0;

    switch (perfil.tipoClima) {
      case "ceniza_volcan":
      case "brasas_puesto":
      case "chispas_puerto": {
        x =
          ((p.semillaX * ancho - tiempoMs * 0.08 * vel + Math.sin(tiempoMs * 0.003 + p.fase) * 18) % ancho +
            ancho) %
          ancho;
        y = ((p.semillaY * alto - tiempoMs * 0.065 * vel) % alto + alto) % alto;
        const parpadeo = 0.55 + Math.sin(tiempoMs * 0.012 + p.fase) * 0.45;
        ctx.fillStyle = mezclarColorRgba(
          perfil.colorParticula,
          perfil.colorAcento,
          0.35,
          (soloPrimerPlano ? 0.9 : 0.65) * parpadeo,
        );
        ctx.fillRect(Math.round(x), Math.round(y), p.tamano, p.tamano);
        break;
      }
      case "ventisca_glaciar":
      case "nieve_bastion": {
        x = ((p.semillaX * ancho - tiempoMs * 0.16 * vel) % ancho + ancho) % ancho;
        y = ((p.semillaY * alto + tiempoMs * 0.095 * vel) % alto + alto) % alto;
        ctx.fillStyle = mezclarColorRgba(perfil.colorParticula, "#ffffff", 0.3, soloPrimerPlano ? 0.88 : 0.6);
        ctx.fillRect(Math.round(x), Math.round(y), p.tamano + (soloPrimerPlano ? 2 : 0), Math.max(2, p.tamano - 1));
        break;
      }
      case "luciernagas_bosque":
      case "polen_pradera": {
        x =
          ((p.semillaX * ancho - tiempoMs * 0.055 * vel + Math.sin(tiempoMs * 0.002 + p.fase) * 24) % ancho +
            ancho) %
          ancho;
        y = ((p.semillaY * alto + Math.cos(tiempoMs * 0.0025 + p.fase) * 18) % alto + alto) % alto;
        const pulso = 0.45 + Math.sin(tiempoMs * 0.007 + p.fase) * 0.55;
        ctx.fillStyle = mezclarColorRgba(perfil.colorAcento, "#ffffff", 0.2, 0.24 * pulso);
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, p.tamano + 4, p.tamano + 4);
        ctx.fillStyle = mezclarColorRgba(perfil.colorParticula, "#ffffff", 0.45, 0.92 * pulso);
        ctx.fillRect(Math.round(x), Math.round(y), p.tamano, p.tamano);
        break;
      }
      case "viento_riscos": {
        x = ((p.semillaX * ancho - tiempoMs * 0.26 * vel) % ancho + ancho) % ancho;
        y = ((p.semillaY * alto + Math.sin(tiempoMs * 0.004 + p.fase) * 10) % alto + alto) % alto;
        ctx.fillStyle = mezclarColorRgba(perfil.colorParticula, perfil.colorAcento, 0.4, soloPrimerPlano ? 0.65 : 0.4);
        ctx.fillRect(Math.round(x), Math.round(y), soloPrimerPlano ? 16 : 10, 2);
        break;
      }
      case "gotas_lago":
      default: {
        x =
          ((p.semillaX * ancho - tiempoMs * 0.06 * vel + Math.sin(tiempoMs * 0.0028 + p.fase) * 14) % ancho +
            ancho) %
          ancho;
        y = ((p.semillaY * alto - tiempoMs * 0.04 * vel) % alto + alto) % alto;
        const brillo = 0.5 + Math.sin(tiempoMs * 0.009 + p.fase) * 0.5;
        ctx.fillStyle = mezclarColorRgba(perfil.colorParticula, perfil.colorSecundario, 0.2, 0.85 * brillo);
        ctx.fillRect(Math.round(x), Math.round(y), p.tamano, p.tamano);
        break;
      }
    }
  }
}

function dibujarSiluetasPrimerPlano(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  desplazamientoPx: number,
): void {
  ctx.fillStyle = "#05070b";
  const paso = 112;
  const offset = ((desplazamientoPx * 1.75) % paso + paso) % paso;
  for (let x = -paso; x < ancho + paso; x += paso) {
    const px = Math.round(x - offset);
    const h = 8 + (Math.abs(x) % 10);
    ctx.fillRect(px, alto - h, 24, h);
    ctx.fillRect(px + 6, alto - h - 4, 10, 4);
  }
}

function dibujarCosturaVeloAstral(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  baseX: number,
  inclSpan: number,
  perfilOrigen: PerfilVisualBiomaViaje,
  perfilDestino: PerfilVisualBiomaViaje,
  intensidadCruce: number,
  tiempoMs: number,
): void {
  if (baseX < -inclSpan - 56 || baseX > ancho + inclSpan + 56) return;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const paso = 10;

  const trazarLineaVelo = (despX: number) => {
    ctx.beginPath();
    for (let y = 0; y <= alto + paso; y += paso) {
      const xv = resolverXVelo(y, alto, baseX, inclSpan, tiempoMs) + despX;
      if (y === 0) ctx.moveTo(xv, y);
      else ctx.lineTo(xv, y);
    }
    ctx.stroke();
  };

  // Sombra sutil de profundidad en el borde saliente para separar nítidamente ambos paisajes
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(5, 7, 11, 0.34)";
  trazarLineaVelo(-6);

  // Halo atmosférico suave en el tono del bioma entrante
  ctx.lineWidth = 22 + intensidadCruce * 14;
  ctx.strokeStyle = mezclarColorRgba(
    perfilOrigen.colorAcento,
    perfilDestino.colorAcento,
    0.65,
    0.18 + intensidadCruce * 0.22,
  );
  trazarLineaVelo(0);

  // Filamento astral intermedio en cian resonante
  ctx.lineWidth = 5 + intensidadCruce * 3;
  ctx.strokeStyle = `rgba(20, 209, 232, ${(0.58 + intensidadCruce * 0.34).toFixed(3)})`;
  trazarLineaVelo(0);

  // Núcleo fino cristalino + estela delicada de píxeles flotantes
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < alto; y += paso) {
    const xv = resolverXVelo(y, alto, baseX, inclSpan, tiempoMs);
    ctx.fillStyle = "rgba(224, 242, 254, 0.92)";
    ctx.fillRect(xv - 1, y, 2, paso);

    const idx = Math.floor(y / paso);
    if ((idx + Math.floor(tiempoMs / 65)) % 2 === 0) {
      const despIzq = -6 - ((Math.floor(y * 1.9 + tiempoMs * 0.14)) % 26);
      ctx.fillStyle = mezclarColorRgba(perfilDestino.colorAcento, "#14d1e8", idx % 2 === 0 ? 0.2 : 0.75, 0.85);
      ctx.fillRect(xv + despIzq, y + 2, 3, 3);
    }
    if ((idx + Math.floor(tiempoMs / 90)) % 3 === 0) {
      const despDer = 6 + ((Math.floor(y * 1.3 + tiempoMs * 0.1)) % 16);
      ctx.fillStyle = mezclarColorRgba(perfilDestino.colorParticula, "#ffffff", 0.3, 0.75);
      ctx.fillRect(xv + despDer, y + 4, 2, 2);
    }
  }
  ctx.restore();
}

export function TransicionViaje2D({
  origenId,
  origenNombre,
  destinoId,
  destinoNombre,
  lider,
  onCompletado,
}: TransicionViaje2DProps) {
  const escenarioRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barraRellenoRef = useRef<HTMLDivElement | null>(null);
  const chispaBarraRef = useRef<HTMLDivElement | null>(null);
  const porcentajeRef = useRef<HTMLSpanElement | null>(null);
  const estandarteRef = useRef<HTMLDivElement | null>(null);
  const onCompletadoRef = useRef(onCompletado);

  useEffect(() => {
    onCompletadoRef.current = onCompletado;
  }, [onCompletado]);

  const islaOrigen = useMemo(() => obtenerConfiguracionIsla(origenId), [origenId]);
  const islaDestino = useMemo(() => obtenerConfiguracionIsla(destinoId), [destinoId]);
  const perfilOrigen = useMemo(() => obtenerPerfilBiomaViaje(islaOrigen.bioma), [islaOrigen.bioma]);
  const perfilDestino = useMemo(() => obtenerPerfilBiomaViaje(islaDestino.bioma), [islaDestino.bioma]);
  const rumbo = useMemo(() => calcularRumboBrujula(islaOrigen, islaDestino), [islaOrigen, islaDestino]);

  const [faseActual, setFaseActual] = useState<"saliendo" | "cruzando" | "llegando">("saliendo");
  const tamanoEscenarioRef = useRef({ ancho: 960, alto: 520 });

  // Medir el escenario panorámico en ref para mantener resolución DPR sin reiniciar la animación al redimensionar
  useEffect(() => {
    const el = escenarioRef.current;
    if (!el) return;
    const medir = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        tamanoEscenarioRef.current = {
          ancho: Math.round(rect.width),
          alto: Math.round(rect.height),
        };
      }
    };
    medir();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(medir);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducirMovimiento =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);
    const duracionMs = reducirMovimiento ? DURACION_VIAJE_REDUCIDO_MS : DURACION_VIAJE_MS;

    let imgOrigen: HTMLImageElement | null = null;
    let imgDestino: HTMLImageElement | null = null;
    let imgSprite: HTMLImageElement | null = null;
    let siluetaOrigen: HTMLCanvasElement | null = null;
    let siluetaDestino: HTMLCanvasElement | null = null;

    const cancelarOrigen = cargarImagenConFallback(
      obtenerImagenZona(sanitizarSlugZona(origenNombre)),
      RUTAS_PLACEHOLDERS.zona,
      (img) => {
        imgOrigen = img;
      },
    );
    const cancelarDestino = cargarImagenConFallback(
      obtenerImagenZona(sanitizarSlugZona(destinoNombre)),
      RUTAS_PLACEHOLDERS.zona,
      (img) => {
        imgDestino = img;
      },
    );
    const cancelarSprite = cargarImagenConFallback(
      obtenerImagenCriatura(lider?.especieSlug),
      RUTAS_PLACEHOLDERS.criatura,
      (img) => {
        imgSprite = img;
        siluetaOrigen = crearSiluetaTintada(img, perfilOrigen.colorAcento);
        siluetaDestino = crearSiluetaTintada(img, perfilDestino.colorAcento);
      },
    );

    const poolClimaOrigen = crearPoolClima(`clima-${origenId}`, 38);
    const poolClimaDestino = crearPoolClima(`clima-${destinoId}`, 46);
    const particulasPolvo: ParticulaPolvo[] = [];
    const ecosCriatura: EcoCriatura[] = [];

    const inicio = performance.now();
    let frameId = 0;
    let finalizado = false;
    let veloSonado = false;
    let ultimoCicloPaso = -1;
    let ultimaFase: "saliendo" | "cruzando" | "llegando" = "saliendo";
    let ultimoEcoMs = 0;

    const actualizarHudDirecto = (progreso01: number, opacidadTitulo: number, desplazamientoY: number) => {
      const pct = Math.round(progreso01 * 100);
      if (barraRellenoRef.current) {
        barraRellenoRef.current.style.transform = `scaleX(${progreso01.toFixed(4)})`;
      }
      if (chispaBarraRef.current) {
        chispaBarraRef.current.style.transform = `translate3d(${((progreso01 - 1) * 100).toFixed(2)}%, 0, 0)`;
      }
      if (porcentajeRef.current) {
        porcentajeRef.current.textContent = `${pct}%`;
      }
      if (estandarteRef.current) {
        estandarteRef.current.style.opacity = opacidadTitulo.toFixed(3);
        estandarteRef.current.style.transform = `translate3d(0, ${desplazamientoY.toFixed(1)}px, 0)`;
      }
    };

    const animar = (ahora: number) => {
      const transcurrido = ahora - inicio;
      const t = Math.min(1, transcurrido / duracionMs);
      const estado = evaluarEstadoViaje(t);

      if (estado.faseEtiqueta !== ultimaFase) {
        ultimaFase = estado.faseEtiqueta;
        setFaseActual(estado.faseEtiqueta);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(320, tamanoEscenarioRef.current.ancho);
      const H = Math.max(220, tamanoEscenarioRef.current.alto);
      const anchoReal = Math.floor(W * dpr);
      const altoReal = Math.floor(H * dpr);
      if (canvas.width !== anchoReal || canvas.height !== altoReal) {
        canvas.width = anchoReal;
        canvas.height = altoReal;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      if (reducirMovimiento) {
        // Ruta dedicada de movimiento reducido: disolución serena entre paisajes sin sacudidas ni rebotes
        dibujarFondoPaisaje(ctx, imgOrigen, perfilOrigen, W, H, 0.5, 1.02, 0);
        ctx.save();
        ctx.globalAlpha = estado.progresoSuave;
        dibujarFondoPaisaje(ctx, imgDestino, perfilDestino, W, H, 0.5, 1.02, 0);
        ctx.restore();

        const nivelPuente = Math.round(H * 0.78);
        const perfilEst = t < 0.5 ? perfilOrigen : perfilDestino;
        dibujarBajoPuenteBioma(ctx, perfilEst, W, H, nivelPuente, 0, 0);
        dibujarCalzadaArcos16Bit(ctx, perfilEst, W, H, nivelPuente, 0, W * 0.5, 0);

        if (imgSprite) {
          const tamSprite = Math.round(Math.max(72, Math.min(104, W * 0.14)));
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(Math.round(W * 0.5), nivelPuente - tamSprite * 0.43);
          ctx.scale(-1, 1);
          ctx.drawImage(imgSprite, -tamSprite / 2, -tamSprite / 2, tamSprite, tamSprite);
          ctx.restore();
        }

        const opacidadCortina = Math.max(estado.opacidadCortinaEntrada, estado.opacidadCortinaSalida);
        if (opacidadCortina > 0.01) {
          ctx.fillStyle = `rgba(5, 7, 11, ${opacidadCortina.toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();

        actualizarHudDirecto(t, t >= 0.25 && t <= 0.92 ? 1 : 0, 0);
      } else {
        const esMovil = W < 640;
        const nivelPuente = Math.round(H * (esMovil ? 0.76 : 0.78));
        const inclSpan = Math.min(165, W * 0.24);
        const veloBaseX = estado.posicionVeloNormX * W;
        const desplazamientoPx = estado.desplazamientoPuenteNorm * Math.max(260, W * 0.42);
        const criaturaX = estado.criaturaNormX * W;
        const enTerritorioDestino = criaturaX >= resolverXVelo(nivelPuente, H, veloBaseX, inclSpan, ahora);
        const perfilActivoCriatura = enTerritorioDestino ? perfilDestino : perfilOrigen;

        // Sonido cristalino una sola vez justo al atravesar el Velo Astral
        if (!veloSonado && estado.intensidadCruceVelo > 0.65) {
          veloSonado = true;
          reproducirSonido("velo", 0.48);
          for (let k = 0; k < 16; k++) {
            const ang = (k / 16) * Math.PI * 2;
            const spd = 2.4 + (k % 3) * 1.5;
            particulasPolvo.push({
              x: criaturaX,
              y: nivelPuente - 36,
              vx: Math.cos(ang) * spd - 0.8,
              vy: Math.sin(ang) * spd - 0.6,
              tamano: k % 2 === 0 ? 5 : 3,
              vida: 1,
              color: k % 2 === 0 ? perfilDestino.colorAcento : "#14d1e8",
            });
          }
        }

        // Pasos sonoros y ráfaga de polvo biome-reactiva sincronizados con cada apoyo real de zancada
        const cicloPaso = Math.floor(t * 8.5);
        if (cicloPaso !== ultimoCicloPaso && t > 0.06 && t < 0.86) {
          ultimoCicloPaso = cicloPaso;
          reproducirSonido("paso", 0.24);
          for (let p = 0; p < 6; p++) {
            particulasPolvo.push({
              x: criaturaX - 10 - p * 3,
              y: nivelPuente - 2 - (p % 2) * 3,
              vx: -2.4 - p * 0.48,
              vy: -1.0 - (p % 3) * 0.72,
              tamano: p % 2 === 0 ? 4 : 3,
              vida: 1,
              color: perfilActivoCriatura.colorPolvoPaso,
            });
          }
        }

        // Micro sacudida sutil de cámara al romper el Velo Astral
        const shakeX =
          estado.intensidadCruceVelo > 0.4
            ? Math.sin(ahora * 0.08) * 2.5 * estado.intensidadCruceVelo
            : 0;
        const shakeY =
          estado.intensidadCruceVelo > 0.4
            ? Math.cos(ahora * 0.09) * 1.8 * estado.intensidadCruceVelo
            : 0;
        ctx.translate(shakeX, shakeY);

        // --- CAPA 1 y 3: Mundo ORIGEN a la izquierda del Velo ---
        if (veloBaseX > -inclSpan - 28) {
          ctx.save();
          trazarPoligonoIzquierdaVelo(ctx, W, H, veloBaseX, inclSpan, ahora);
          ctx.clip();
          dibujarFondoPaisaje(ctx, imgOrigen, perfilOrigen, W, H, 0.24 + t * 0.36, 1.05 + t * 0.05, ahora);
          dibujarBajoPuenteBioma(ctx, perfilOrigen, W, H, nivelPuente, desplazamientoPx, ahora);
          dibujarParticulasClimaBioma(ctx, poolClimaOrigen, perfilOrigen, W, H, ahora, false);
          dibujarCalzadaArcos16Bit(ctx, perfilOrigen, W, H, nivelPuente, desplazamientoPx, criaturaX, ahora);
          ctx.restore();
        }

        // --- CAPA 1 y 3: Mundo DESTINO a la derecha del Velo ---
        if (veloBaseX < W + inclSpan + 28) {
          ctx.save();
          trazarPoligonoDerechaVelo(ctx, W, H, veloBaseX, inclSpan, ahora);
          ctx.clip();
          dibujarFondoPaisaje(ctx, imgDestino, perfilDestino, W, H, 0.32 + t * 0.36, 1.06 + (1 - t) * 0.04, ahora);
          dibujarBajoPuenteBioma(ctx, perfilDestino, W, H, nivelPuente, desplazamientoPx, ahora);
          dibujarParticulasClimaBioma(ctx, poolClimaDestino, perfilDestino, W, H, ahora, false);
          dibujarCalzadaArcos16Bit(ctx, perfilDestino, W, H, nivelPuente, desplazamientoPx, criaturaX, ahora);
          ctx.restore();
        }

        // --- CAPA 2: Costura luminosa pixel-art del Velo Astral ---
        dibujarCosturaVeloAstral(
          ctx,
          W,
          H,
          veloBaseX,
          inclSpan,
          perfilOrigen,
          perfilDestino,
          estado.intensidadCruceVelo,
          ahora,
        );

        // --- CAPA 5: Arco gótico rúnico de llegada ---
        const portalX = W * (esMovil ? 0.86 : 0.88) + (1 - Math.min(1, t / 0.78)) * 130;
        dibujarPortalDestino(ctx, perfilDestino, portalX, nivelPuente, estado.intensidadPortal, ahora);

        // --- CAPA 6: Criatura líder, ecos espectrales, líneas de impulso y polvo ---
        const tamSprite = Math.round(Math.max(76, Math.min(112, W * (esMovil ? 0.22 : 0.115))));
        const criaturaCentroY = nivelPuente - tamSprite * 0.43 - estado.saltoPx;

        if (ahora - ultimoEcoMs > 36 && t > 0.12 && t < 0.88) {
          ultimoEcoMs = ahora;
          ecosCriatura.push({
            x: criaturaX,
            y: criaturaCentroY,
            escalaX: estado.escalaX,
            escalaY: estado.escalaY,
            inclinacion: estado.inclinacionRad,
            enDestino: enTerritorioDestino,
          });
          if (ecosCriatura.length > 4) ecosCriatura.shift();
        }

        // Sombra anclada y reflejo de aura sobre las losas
        const radioSombraX = Math.max(12, tamSprite * 0.34 - estado.saltoPx * 0.45);
        ctx.fillStyle = "rgba(5, 7, 11, 0.58)";
        ctx.beginPath();
        ctx.ellipse(criaturaX, nivelPuente + 3, radioSombraX, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const auraSuelo = ctx.createRadialGradient(
          criaturaX,
          nivelPuente + 2,
          2,
          criaturaX,
          nivelPuente + 2,
          radioSombraX * 1.5,
        );
        auraSuelo.addColorStop(
          0,
          mezclarColorRgba(perfilActivoCriatura.colorAcento, "#14d1e8", 0.3, 0.38 * estado.opacidadCriatura),
        );
        auraSuelo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraSuelo;
        ctx.fillRect(criaturaX - radioSombraX * 1.5, nivelPuente - 12, radioSombraX * 3, 28);

        // Estelas horizontales de velocidad pixel-art detrás del líder
        if (t > 0.12 && t < 0.88) {
          ctx.imageSmoothingEnabled = false;
          for (let s = 0; s < 3; s++) {
            const sy = Math.round(criaturaCentroY - 18 + s * 16 + Math.sin(ahora * 0.02 + s) * 3);
            const largo = 22 + s * 10;
            const sx = Math.round(criaturaX - tamSprite * 0.45 - largo - s * 10);
            ctx.fillStyle = mezclarColorRgba(perfilActivoCriatura.colorAcento, "#e0f2fe", 0.35, 0.28 * estado.opacidadCriatura);
            ctx.fillRect(sx, sy, largo, 2);
          }
        }

        // Ecos espectrales 16-bit detrás del corredor
        for (let i = 0; i < ecosCriatura.length; i++) {
          const eco = ecosCriatura[i];
          const silueta = eco.enDestino ? siluetaDestino : siluetaOrigen;
          if (!silueta) continue;
          const alfaEco = ((i + 1) / (ecosCriatura.length + 1)) * 0.34 * estado.opacidadCriatura;
          ctx.save();
          ctx.globalAlpha = alfaEco;
          ctx.imageSmoothingEnabled = false;
          ctx.translate(Math.round(eco.x - (ecosCriatura.length - i) * 5), Math.round(eco.y));
          ctx.rotate(eco.inclinacion);
          ctx.scale(-eco.escalaX, eco.escalaY);
          ctx.drawImage(silueta, -tamSprite / 2, -tamSprite / 2, tamSprite, tamSprite);
          ctx.restore();
        }

        // Doble onda expansiva en rombo pixelado justo al romper el Velo Astral
        if (estado.intensidadCruceVelo > 0.05) {
          const radioExt = (1 - estado.intensidadCruceVelo) * 86 + 20;
          const radioInt = radioExt * 0.62;
          ctx.save();
          ctx.strokeStyle = mezclarColorRgba(
            perfilDestino.colorAcento,
            "#14d1e8",
            0.45,
            estado.intensidadCruceVelo * 0.9,
          );
          ctx.lineWidth = 3;
          for (const radio of [radioExt, radioInt]) {
            ctx.beginPath();
            ctx.moveTo(criaturaX, criaturaCentroY - radio);
            ctx.lineTo(criaturaX + radio, criaturaCentroY);
            ctx.lineTo(criaturaX, criaturaCentroY + radio);
            ctx.lineTo(criaturaX - radio, criaturaCentroY);
            ctx.closePath();
            ctx.stroke();
          }
          ctx.restore();
        }

        // Sprite principal de la criatura líder
        ctx.save();
        ctx.globalAlpha = estado.opacidadCriatura;
        ctx.imageSmoothingEnabled = false;
        ctx.translate(Math.round(criaturaX), Math.round(criaturaCentroY));
        ctx.rotate(estado.inclinacionRad);
        ctx.scale(-estado.escalaX, estado.escalaY);
        if (imgSprite) {
          ctx.drawImage(imgSprite, -tamSprite / 2, -tamSprite / 2, tamSprite, tamSprite);
        } else {
          ctx.fillStyle = perfilActivoCriatura.colorAcento;
          ctx.fillRect(-18, -18, 36, 36);
        }
        ctx.restore();

        // Actualizar y dibujar polvo de pasos y chispas del cruce
        ctx.imageSmoothingEnabled = false;
        for (let i = particulasPolvo.length - 1; i >= 0; i--) {
          const p = particulasPolvo[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08;
          p.vida -= 0.036;
          if (p.vida <= 0) {
            particulasPolvo.splice(i, 1);
            continue;
          }
          ctx.fillStyle = mezclarColorRgba(p.color, "#ffffff", 0.15, p.vida * 0.92);
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.tamano, p.tamano);
        }

        // --- CAPA 7: Clima en primer plano + siluetas parallax + viñeta y cortina Abismo ---
        if (veloBaseX > -inclSpan - 28) {
          ctx.save();
          trazarPoligonoIzquierdaVelo(ctx, W, H, veloBaseX, inclSpan, ahora);
          ctx.clip();
          dibujarParticulasClimaBioma(ctx, poolClimaOrigen, perfilOrigen, W, H, ahora, true);
          ctx.restore();
        }
        if (veloBaseX < W + inclSpan + 28) {
          ctx.save();
          trazarPoligonoDerechaVelo(ctx, W, H, veloBaseX, inclSpan, ahora);
          ctx.clip();
          dibujarParticulasClimaBioma(ctx, poolClimaDestino, perfilDestino, W, H, ahora, true);
          ctx.restore();
        }

        dibujarSiluetasPrimerPlano(ctx, W, H, desplazamientoPx);

        const vineta = ctx.createRadialGradient(
          W * 0.5,
          H * 0.48,
          Math.min(W, H) * 0.38,
          W * 0.5,
          H * 0.48,
          Math.max(W, H) * 0.80,
        );
        vineta.addColorStop(0, "rgba(5, 7, 11, 0)");
        vineta.addColorStop(1, "rgba(5, 7, 11, 0.56)");
        ctx.fillStyle = vineta;
        ctx.fillRect(0, 0, W, H);

        // Cortina de entrada / salida hacia Abismo Astral (cero destellos blancos)
        const opacidadCortina = Math.max(estado.opacidadCortinaEntrada, estado.opacidadCortinaSalida);
        if (opacidadCortina > 0.005) {
          ctx.fillStyle = `rgba(5, 7, 11, ${opacidadCortina.toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();

        actualizarHudDirecto(t, estado.opacidadTituloDestino, estado.desplazamientoTituloPx);
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
    return () => {
      cancelAnimationFrame(frameId);
      cancelarOrigen();
      cancelarDestino();
      cancelarSprite();
    };
  }, [destinoId, destinoNombre, lider?.especieSlug, origenId, origenNombre, perfilDestino, perfilOrigen]);

  const mensajeFaseCorto =
    faseActual === "saliendo"
      ? "Senda abierta"
      : faseActual === "cruzando"
        ? "Cruzando el Velo"
        : "Arribando a destino";

  const mensajeFaseDetalle =
    faseActual === "saliendo"
      ? `Senda abierta · ${rumbo.etiqueta}`
      : faseActual === "cruzando"
        ? `Cruzando el Velo · ${rumbo.etiqueta}`
        : `Arribando · ${perfilDestino.tituloRegion}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Viajando de ${origenNombre} hacia ${destinoNombre}`}
      className="fixed inset-0 z-50 bg-[#05070b] flex flex-col overflow-hidden select-none text-slate-100"
    >
      {/* Banda cinematográfica superior */}
      <header className="anim-banda-cine-superior relative z-20 shrink-0 bg-[#05070b] border-b-2 border-black px-3 sm:px-6 pt-zona-segura pb-2.5 sm:py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className="size-8 sm:size-9 shrink-0 bg-[#0c1322] border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center relative"
              style={{ borderColor: perfilDestino.colorAcento }}
            >
              <Compass className="size-4 text-[#14d1e8]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="retro text-[8.5px] sm:text-[11px] text-[#14d1e8] tracking-wider">
                  TRAVESÍA
                </span>
                <span className="inline-flex items-center gap-1 bg-[#121927] border border-slate-700/80 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono text-slate-200 shrink-0">
                  <ArrowUp
                    className="size-2.5 shrink-0"
                    style={{
                      color: perfilDestino.colorAcento,
                      transform: `rotate(${rumbo.anguloGrados}deg)`,
                    }}
                    aria-hidden="true"
                  />
                  <span>{rumbo.sigla}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-tight mt-0.5 sm:hidden">
                {mensajeFaseCorto}
              </p>
              <p className="hidden sm:block text-xs text-slate-300 leading-tight mt-0.5">
                {mensajeFaseDetalle}
              </p>
            </div>
          </div>

          {lider && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0c1322] border-2 border-black px-1.5 py-1 sm:px-2.5 sm:py-1.5 shadow-[3px_3px_0_0_#000] shrink-0 max-w-[56%] sm:max-w-none">
              <div className="size-7 sm:size-8 bg-[#05070b] border border-amber-400/70 p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src={obtenerImagenCriatura(lider.especieSlug)}
                  alt={lider.nombre}
                  decoding="async"
                  onError={(e) => manejarErrorImagen(e, "criatura")}
                  className="pixelated w-full h-full object-contain scale-x-[-1]"
                />
              </div>
              <div className="min-w-0">
                <span className="retro text-[6.5px] sm:text-[9px] text-amber-300 block truncate leading-tight">
                  {lider.nombre.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-slate-300 block leading-tight tabular-nums">
                  NV.{lider.nivel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filete luminoso de transición entre colores de bioma */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${perfilOrigen.colorAcento} 0%, #14d1e8 50%, ${perfilDestino.colorAcento} 100%)`,
          }}
        />
      </header>

      {/* Escenario panorámico 2D vivo (Canvas HiDPI adaptativo + Estandarte JRPG de llegada) */}
      <div
        ref={escenarioRef}
        className="relative flex-1 w-full min-h-0 overflow-hidden bg-[#05070b]"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          aria-hidden="true"
        />

        {/* Textura CRT cálida sutil sobre el escenario */}
        <div
          aria-hidden="true"
          className="retro-scanlines-viaje pointer-events-none absolute inset-0 opacity-25"
        />

        {/* Estandarte cinematográfico JRPG integrado al cielo al cruzar el Velo */}
        <div
          ref={estandarteRef}
          style={{ opacity: 0, transform: "translate3d(0, 14px, 0)" }}
          className="pointer-events-none absolute inset-x-3 top-[10%] sm:top-[12%] z-10 flex flex-col items-center text-center will-change-transform"
        >
          <div
            className="px-6 sm:px-12 py-3 sm:py-4 max-w-xl relative"
            style={{
              background:
                "linear-gradient(90deg, rgba(5,7,11,0) 0%, rgba(5,7,11,0.82) 18%, rgba(5,7,11,0.82) 82%, rgba(5,7,11,0) 100%)",
            }}
          >
            {/* Filigrana superior e inferior con muescas pixeladas */}
            <div
              aria-hidden="true"
              className="absolute inset-x-4 top-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${perfilDestino.colorAcento} 50%, transparent 100%)`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-4 bottom-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${perfilDestino.colorAcento} 50%, transparent 100%)`,
              }}
            />
            <h2 className="retro texto-contorno-retro text-xs sm:text-lg text-slate-50 tracking-wider leading-snug">
              {destinoNombre.toUpperCase()}
            </h2>
            <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-200">
              <span
                aria-hidden="true"
                className="inline-block size-1.5 rotate-45 shrink-0"
                style={{ backgroundColor: perfilDestino.colorAcento }}
              />
              <span>{perfilDestino.tituloRegion}</span>
              <span
                aria-hidden="true"
                className="inline-block size-1.5 rotate-45 shrink-0"
                style={{ backgroundColor: perfilDestino.colorAcento }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banda cinematográfica inferior: Senda cartográfica y medidor pixelado 16-bit */}
      <footer className="anim-banda-cine-inferior relative z-20 shrink-0 bg-[#05070b] border-t-2 border-black px-3 sm:px-6 pt-2.5 pb-zona-segura">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${perfilOrigen.colorAcento} 0%, #14d1e8 50%, ${perfilDestino.colorAcento} 100%)`,
          }}
        />

        <div className="max-w-4xl mx-auto space-y-2">
          {/* Ruta Origen -> Destino legible sin recortes bruscos en móvil ni escritorio */}
          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-sm min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 border border-black"
                style={{ backgroundColor: perfilOrigen.colorAcento }}
              />
              <span className="text-slate-300 truncate font-medium">
                {origenNombre}
              </span>
            </div>

            <ArrowRight className="size-3.5 sm:size-4 text-[#14d1e8] shrink-0" aria-hidden="true" />

            <div className="flex items-center justify-end gap-1.5 min-w-0">
              <span
                className="font-semibold sm:retro text-xs sm:text-[10px] truncate"
                style={{ color: perfilDestino.colorAcento }}
              >
                {destinoNombre}
              </span>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 border border-black"
                style={{ backgroundColor: perfilDestino.colorAcento }}
              />
            </div>
          </div>

          {/* Medidor 16-bit con rastro de energía astral y porcentaje tabular */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 h-3.5 bg-[#090d16] border-2 border-black outline-1 outline-slate-800 overflow-hidden">
              <div
                ref={barraRellenoRef}
                style={{
                  transform: "scaleX(0)",
                  transformOrigin: "left center",
                  background: `linear-gradient(90deg, ${perfilOrigen.colorAcento} 0%, #14d1e8 55%, ${perfilDestino.colorAcento} 100%)`,
                }}
                className="absolute inset-0 will-change-transform"
              />
              {/* Segmentación pixelada de 8-bit sobre el canal */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(5, 7, 11, 0.45) 10px, rgba(5, 7, 11, 0.45) 12px)",
                }}
              />
              {/* Destello puntero de avance en compositor GPU */}
              <div
                ref={chispaBarraRef}
                aria-hidden="true"
                style={{ transform: "translate3d(-100%, 0, 0)" }}
                className="pointer-events-none absolute inset-0 flex justify-end will-change-transform"
              >
                <span className="block w-1.5 h-full bg-slate-50 shadow-[0_0_6px_rgba(20,209,232,0.9)]" />
              </div>
            </div>

            <span
              ref={porcentajeRef}
              className="retro text-[9px] sm:text-[10px] text-slate-200 tabular-nums w-11 text-right shrink-0"
            >
              0%
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
