import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AtacarDto {
  @ApiProperty({
    description: 'Identificador único del encuentro en curso',
    example: 'enc-401',
  })
  @IsNotEmpty({ message: 'El identificador del encuentro es requerido.' })
  @IsString({ message: 'El identificador del encuentro debe ser una cadena.' })
  encuentroId: string;

  @ApiPropertyOptional({
    description: 'Índice del movimiento a utilizar por la criatura activa',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El índice del movimiento debe ser un número entero.' })
  @Min(0, { message: 'El índice del movimiento no puede ser negativo.' })
  movimientoIndice?: number = 0;
}
