import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosicionOrdenDto {
  @IsString({ message: 'El id de la criatura debe ser un texto.' })
  @IsNotEmpty({ message: 'El id de la criatura es obligatorio.' })
  criaturaId: string;

  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(1, { message: 'El orden mínimo es 1.' })
  @Max(6, { message: 'El orden máximo es 6.' })
  orden: number;
}

export class ActualizarOrdenEquipoDto {
  @IsOptional()
  @IsArray({ message: 'orden debe ser un arreglo de posiciones.' })
  @ValidateNested({ each: true })
  @Type(() => PosicionOrdenDto)
  orden?: PosicionOrdenDto[];

  @IsOptional()
  @IsArray({ message: 'criaturaIds debe ser un arreglo de IDs.' })
  @IsString({ each: true, message: 'Cada id de criatura debe ser un texto.' })
  criaturaIds?: string[];
}
