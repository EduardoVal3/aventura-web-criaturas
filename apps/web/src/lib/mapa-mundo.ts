/**
 * Coordenadas virtuales, paletas de bioma dark-fantasy y metadatos visuales del mapa 2D de Aethelgard.
 * El lienzo base mide 1200 x 760 unidades lógicas y se adapta con paneo y zoom responsive.
 */

export const DIMENSIONES_MAPA_MUNDO = {
  ancho: 1200,
  alto: 760,
} as const;

export interface ConfiguracionIslaMapa {
  id: string;
  x: number;
  y: number;
  radioX: number;
  radioY: number;
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
    x: 340,
    y: 590,
    radioX: 118,
    radioY: 82,
    bioma: "puerto",
    colorSuelo: "#24352a",
    colorBorde: "#4a3e30",
    colorCielo: "#090f1c",
    colorAcento: "#f59e0b",
    etiquetaCorta: "Villa Serena",
  },
  "ZON-01": {
    id: "ZON-01",
    x: 185,
    y: 385,
    radioX: 115,
    radioY: 84,
    bioma: "pradera",
    colorSuelo: "#2f3824",
    colorBorde: "#211d18",
    colorCielo: "#130d21",
    colorAcento: "#eab308",
    etiquetaCorta: "Praderas",
  },
  "ZON-02": {
    id: "ZON-02",
    x: 730,
    y: 595,
    radioX: 118,
    radioY: 80,
    bioma: "lago",
    colorSuelo: "#142e36",
    colorBorde: "#0b1a22",
    colorCielo: "#06131f",
    colorAcento: "#14d1e8",
    etiquetaCorta: "Lago Espejo",
  },
  "LOC-02": {
    id: "LOC-02",
    x: 475,
    y: 390,
    radioX: 102,
    radioY: 74,
    bioma: "puesto",
    colorSuelo: "#2b3025",
    colorBorde: "#36281e",
    colorCielo: "#0c131c",
    colorAcento: "#f59e0b",
    etiquetaCorta: "Puesto del Río",
  },
  "ZON-03": {
    id: "ZON-03",
    x: 710,
    y: 415,
    radioX: 108,
    radioY: 76,
    bioma: "bosque",
    colorSuelo: "#11261b",
    colorBorde: "#09150f",
    colorCielo: "#071410",
    colorAcento: "#22c55e",
    etiquetaCorta: "Bosque",
  },
  "ZON-04": {
    id: "ZON-04",
    x: 685,
    y: 255,
    radioX: 96,
    radioY: 66,
    bioma: "riscos",
    colorSuelo: "#2c2829",
    colorBorde: "#1a1718",
    colorCielo: "#140f1a",
    colorAcento: "#a855f7",
    etiquetaCorta: "Riscos",
  },
  "LOC-03": {
    id: "LOC-03",
    x: 565,
    y: 130,
    radioX: 106,
    radioY: 72,
    bioma: "bastion",
    colorSuelo: "#262d36",
    colorBorde: "#171b22",
    colorCielo: "#090d16",
    colorAcento: "#38bdf8",
    etiquetaCorta: "Bastión Norte",
  },
  "ZON-05": {
    id: "ZON-05",
    x: 985,
    y: 345,
    radioX: 118,
    radioY: 84,
    bioma: "volcan",
    colorSuelo: "#1c1317",
    colorBorde: "#0f090b",
    colorCielo: "#1b080b",
    colorAcento: "#ef4444",
    etiquetaCorta: "Cueva Umbría",
  },
  "ZON-06": {
    id: "ZON-06",
    x: 895,
    y: 135,
    radioX: 118,
    radioY: 80,
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
      x: 600,
      y: 380,
      radioX: 100,
      radioY: 70,
      bioma: "pradera",
      colorSuelo: "#24352a",
      colorBorde: "#1a1718",
      colorCielo: "#090d16",
      colorAcento: "#14d1e8",
      etiquetaCorta: ubicacionId,
    }
  );
}
