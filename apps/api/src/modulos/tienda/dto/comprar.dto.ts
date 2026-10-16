import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ComprarDto {
  @ApiProperty({
    description: 'Código del objeto que se desea adquirir en la tienda',
    example: 'talisman-basico',
  })
  @IsNotEmpty({ message: 'El código del objeto es requerido.' })
  @IsString({ message: 'El código del objeto debe ser una cadena.' })
  itemCodigo: string;

  @ApiPropertyOptional({
    description: 'Cantidad de unidades a comprar',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima a comprar es 1.' })
  @Max(99, { message: 'La cantidad máxima a comprar por operación es 99.' })
  cantidad?: number = 1;
}
