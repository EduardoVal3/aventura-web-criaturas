export interface AtaqueExternoDto {
  nombreOriginal: string;
  tipoAccion: string;
  poder: number;
}

export interface CriaturaExternaDto {
  idExterno: string;
  tipoExterno: string;
  hitPoints: number;
  armorClass: number;
  speedMax: number;
  challengeRating: number;
  ataques: AtaqueExternoDto[];
}

export interface ProveedorCriaturas {
  obtenerEspeciesSeleccionadas(claves: string[]): Promise<CriaturaExternaDto[]>;
}
