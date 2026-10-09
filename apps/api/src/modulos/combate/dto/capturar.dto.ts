import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CapturarDto {
  @ApiPropertyOptional({
    description: 'Identificador del encuentro (requerido para endpoint /api/combate/capturar)',
    example: 'enc-401',
  })
  @IsOptional()
  @IsString({ message: 'El identificador del encuentro debe ser una cadena.' })
  encuentroId?: string;

  @ApiProperty({
    description: 'Código del talismán a emplear en el intento de captura',
    example: 'talisman-basico',
  })
  @IsNotEmpty({ message: 'El código del objeto talismán es requerido.' })
  @IsString({ message: 'El código del objeto debe ser una cadena.' })
  itemCodigo: string;
}
