import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class HuirDto {
  @ApiProperty({
    description: 'Identificador único del encuentro en curso',
    example: 'enc-401',
  })
  @IsNotEmpty({ message: 'El identificador del encuentro es requerido.' })
  @IsString({ message: 'El identificador del encuentro debe ser una cadena.' })
  encuentroId: string;

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
