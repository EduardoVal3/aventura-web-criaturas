import { apiHttp } from "./apiHttp";
import { apiSimulada } from "./apiSimulada";
import type { ApiJuego } from "./ApiJuego";

const modo = import.meta.env.VITE_MODO_API ?? "simulado";
if (modo !== "simulado" && modo !== "http") {
  throw new Error(`VITE_MODO_API inválido: "${modo}". Usa "simulado" o "http".`);
}

// simplificacion: ambas implementaciones entran al bundle; si pesa, cambiar a import() dinámico por modo.
export const api: ApiJuego = modo === "http" ? apiHttp : apiSimulada;

export * from "./ApiJuego";
export { apiHttp } from "./apiHttp";
export { apiSimulada } from "./apiSimulada";
