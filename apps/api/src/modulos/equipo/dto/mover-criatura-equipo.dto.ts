import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MoverCriaturaEquipoDto {
  @IsString({ message: 'El id de la criatura debe ser un texto.' })
  @IsNotEmpty({ message: 'El id de la criatura es obligatorio.' })
  criaturaId: string;

  @IsBoolean({ message: 'haciaEquipo debe ser un valor booleano (true para equipo, false para almacén).' })
  haciaEquipo: boolean;

  @IsOptional()
  @IsString({ message: 'El id de intercambio debe ser un texto.' })
  @IsNotEmpty({ message: 'El id de intercambio no debe estar vacío.' })
  intercambiarConId?: string;
}
