import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class AtacarDto {
  @ApiProperty({
    description: 'Identificador único del encuentro en curso',
    example: 'enc-401',
  })
  @IsNotEmpty({ message: 'El identificador del encuentro es requerido.' })
  @IsString({ message: 'El identificador del encuentro debe ser una cadena.' })
  encuentroId: string;

  @ApiPropertyOptional({
    description: 'Índice del movimiento a utilizar por la criatura activa (0 a 3)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El índice del movimiento debe ser un número entero.' })
  @Min(0, { message: 'El índice del movimiento no puede ser negativo.' })
  @Max(3, { message: 'El índice del movimiento no puede ser mayor a 3.' })
  movimientoIndice?: number = 0;

  @ApiPropertyOptional({
    description:
      'Turno esperado por el cliente para prevenir desincronizaciones concurrentes',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'El turno esperado debe ser un número entero.' })
  @Min(1, { message: 'El turno esperado debe ser mayor o igual a 1.' })
  turnoEsperado?: number;
}
