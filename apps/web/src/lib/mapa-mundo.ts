/**
 * Coordenadas calibradas sobre la ilustración pixel-art transparente maestra (3232x1794 en espacio lógico 1616x897),
 * paletas originales de cada bioma y compensaciones visuales del mapa interactivo de Aethelgard.
 */

export const DIMENSIONES_MAPA_MUNDO = {
  ancho: 1616,
  alto: 897,
} as const;

export interface ConfiguracionIslaMapa {
  id: string;
  x: number;
  y: number;
  radioX: number;
  radioY: number;
  placaOffsetX?: number;
  placaOffsetY?: number;
  bioma: "puerto" | "pradera" | "lago" | "puesto" | "bosque" | "riscos" | "bastion" | "volcan" | "glaciar";
  colorSuelo: string;
  colorBorde: string;
  colorCielo: string;
  colorAcento: string;
  etiquetaCorta: string;
}

export const CONFIGURACION_ISLAS_MAPA: Record<string, ConfiguracionIslaMapa> = {
  "LOC-01": {
    id: "LOC-01",
    x: 230,
    y: 705,
    radioX: 195,
    radioY: 145,
    placaOffsetX: -12,
    placaOffsetY: 165,
    bioma: "puerto",
    colorSuelo: "#24352a",
    colorBorde: "#4a3e30",
    colorCielo: "#090f1c",
    colorAcento: "#f59e0b",
    etiquetaCorta: "Villa Serena",
  },
  "ZON-01": {
    id: "ZON-01",
    x: 192,
    y: 422,
    radioX: 184,
    radioY: 98,
    placaOffsetX: -95,
    placaOffsetY: 94,
    bioma: "pradera",
    colorSuelo: "#2f3824",
    colorBorde: "#211d18",
    colorCielo: "#130d21",
    colorAcento: "#eab308",
    etiquetaCorta: "Praderas",
  },
  "ZON-02": {
    id: "ZON-02",
    x: 808,
    y: 725,
    radioX: 196,
    radioY: 136,
    placaOffsetX: 0,
    placaOffsetY: 148,
    bioma: "lago",
    colorSuelo: "#142e36",
    colorBorde: "#0b1a22",
    colorCielo: "#06131f",
    colorAcento: "#14d1e8",
    etiquetaCorta: "Lago Espejo",
  },
  "LOC-02": {
    id: "LOC-02",
    x: 622,
    y: 458,
    radioX: 155,
    radioY: 102,
    placaOffsetX: -28,
    placaOffsetY: 108,
    bioma: "puesto",
    colorSuelo: "#2b3025",
    colorBorde: "#36281e",
    colorCielo: "#0c131c",
    colorAcento: "#f59e0b",
    etiquetaCorta: "Puesto del Río",
  },
  "ZON-03": {
    id: "ZON-03",
    x: 1370,
    y: 702,
    radioX: 220,
    radioY: 142,
    placaOffsetX: 0,
    placaOffsetY: 158,
    bioma: "bosque",
    colorSuelo: "#11261b",
    colorBorde: "#09150f",
    colorCielo: "#071410",
    colorAcento: "#22c55e",
    etiquetaCorta: "Bosque",
  },
  "ZON-04": {
    id: "ZON-04",
    x: 960,
    y: 318,
    radioX: 204,
    radioY: 108,
    placaOffsetX: 25,
    placaOffsetY: 112,
    bioma: "riscos",
    colorSuelo: "#2c2829",
    colorBorde: "#1a1718",
    colorCielo: "#140f1a",
    colorAcento: "#a855f7",
    etiquetaCorta: "Riscos",
  },
  "LOC-03": {
    id: "LOC-03",
    x: 472,
    y: 205,
    radioX: 192,
    radioY: 138,
    placaOffsetX: -32,
    placaOffsetY: 152,
    bioma: "bastion",
    colorSuelo: "#262d36",
    colorBorde: "#171b22",
    colorCielo: "#090d16",
    colorAcento: "#38bdf8",
    etiquetaCorta: "Bastión Norte",
  },
  "ZON-05": {
    id: "ZON-05",
    x: 1435,
    y: 392,
    radioX: 185,
    radioY: 132,
    placaOffsetX: 72,
    placaOffsetY: 118,
    bioma: "volcan",
    colorSuelo: "#1c1317",
    colorBorde: "#0f090b",
    colorCielo: "#1b080b",
    colorAcento: "#ef4444",
    etiquetaCorta: "Cueva Umbría",
  },
  "ZON-06": {
    id: "ZON-06",
    x: 1045,
    y: 132,
    radioX: 256,
    radioY: 98,
    placaOffsetX: 115,
    placaOffsetY: 94,
    bioma: "glaciar",
    colorSuelo: "#2c3d4f",
    colorBorde: "#17222e",
    colorCielo: "#081221",
    colorAcento: "#7dd3fc",
    etiquetaCorta: "La Cumbre",
  },
};

export function obtenerConfiguracionIsla(ubicacionId: string): ConfiguracionIslaMapa {
  return (
    CONFIGURACION_ISLAS_MAPA[ubicacionId] ?? {
      id: ubicacionId,
      x: 808,
      y: 448,
      radioX: 165,
      radioY: 110,
      bioma: "pradera",
      colorSuelo: "#24352a",
      colorBorde: "#1a1718",
      colorCielo: "#090d16",
      colorAcento: "#14d1e8",
      etiquetaCorta: ubicacionId,
    }
  );
}
