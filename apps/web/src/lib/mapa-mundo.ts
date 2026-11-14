/**
 * Coordenadas virtuales, paletas de bioma y metadatos visuales del mapa 2D de Aethelgard.
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
    colorSuelo: "#4d9e48",
    colorBorde: "#d8b46a",
    colorCielo: "#1b3a5c",
    etiquetaCorta: "Villa Serena",
  },
  "ZON-01": {
    id: "ZON-01",
    x: 185,
    y: 385,
    radioX: 115,
    radioY: 84,
    bioma: "pradera",
    colorSuelo: "#6ab04c",
    colorBorde: "#3e7031",
    colorCielo: "#3b2c4e",
    etiquetaCorta: "Praderas",
  },
  "ZON-02": {
    id: "ZON-02",
    x: 730,
    y: 595,
    radioX: 118,
    radioY: 80,
    bioma: "lago",
    colorSuelo: "#2f7d7a",
    colorBorde: "#1b4d52",
    colorCielo: "#0f2e47",
    etiquetaCorta: "Lago Espejo",
  },
  "LOC-02": {
    id: "LOC-02",
    x: 475,
    y: 390,
    radioX: 102,
    radioY: 74,
    bioma: "puesto",
    colorSuelo: "#5e8c45",
    colorBorde: "#6e563e",
    colorCielo: "#233645",
    etiquetaCorta: "Puesto del Río",
  },
  "ZON-03": {
    id: "ZON-03",
    x: 710,
    y: 415,
    radioX: 108,
    radioY: 76,
    bioma: "bosque",
    colorSuelo: "#2c6b45",
    colorBorde: "#1a422b",
    colorCielo: "#112b24",
    etiquetaCorta: "Bosque",
  },
  "ZON-04": {
    id: "ZON-04",
    x: 685,
    y: 255,
    radioX: 96,
    radioY: 66,
    bioma: "riscos",
    colorSuelo: "#7c756c",
    colorBorde: "#4a443e",
    colorCielo: "#2c2838",
    etiquetaCorta: "Riscos",
  },
  "LOC-03": {
    id: "LOC-03",
    x: 565,
    y: 130,
    radioX: 106,
    radioY: 72,
    bioma: "bastion",
    colorSuelo: "#588246",
    colorBorde: "#6e737b",
    colorCielo: "#1b2436",
    etiquetaCorta: "Bastión Norte",
  },
  "ZON-05": {
    id: "ZON-05",
    x: 985,
    y: 345,
    radioX: 118,
    radioY: 84,
    bioma: "volcan",
    colorSuelo: "#362b30",
    colorBorde: "#1c1518",
    colorCielo: "#2e1014",
    etiquetaCorta: "Cueva Umbría",
  },
  "ZON-06": {
    id: "ZON-06",
    x: 895,
    y: 135,
    radioX: 118,
    radioY: 80,
    bioma: "glaciar",
    colorSuelo: "#dcebf7",
    colorBorde: "#8fb8d6",
    colorCielo: "#152b47",
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
      colorSuelo: "#588246",
      colorBorde: "#3e7031",
      colorCielo: "#1b2436",
      etiquetaCorta: ubicacionId,
    }
  );
}
