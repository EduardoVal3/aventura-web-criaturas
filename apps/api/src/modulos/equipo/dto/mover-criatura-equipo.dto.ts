import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class MoverCriaturaEquipoDto {
  @IsString({ message: 'El id de la criatura debe ser un texto.' })
  @IsNotEmpty({ message: 'El id de la criatura es obligatorio.' })
  criaturaId: string;

  @IsBoolean({ message: 'haciaEquipo debe ser un valor booleano (true para equipo, false para almacén).' })
  haciaEquipo: boolean;
}
