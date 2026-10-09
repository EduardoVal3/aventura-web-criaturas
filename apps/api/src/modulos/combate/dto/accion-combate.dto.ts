import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const TIPOS_ACCION_COMBATE = [
  'ATACAR',
  'USAR_OBJETO',
  'CAMBIAR_CRIATURA',
  'CAPTURAR',
  'HUIR',
] as const;

export type TipoAccionCombate = (typeof TIPOS_ACCION_COMBATE)[number];

export class AccionCombateDto {
  @ApiProperty({
    description: 'Tipo de acción a ejecutar en el turno de combate',
    enum: TIPOS_ACCION_COMBATE,
    example: 'ATACAR',
  })
  @IsNotEmpty({ message: 'El tipo de acción es requerido.' })
  @IsIn(TIPOS_ACCION_COMBATE, {
    message:
      'El tipo de acción debe ser ATACAR, USAR_OBJETO, CAMBIAR_CRIATURA, CAPTURAR o HUIR.',
  })
  tipoAccion: TipoAccionCombate;

  @ApiPropertyOptional({
    description: 'Índice del movimiento a ejecutar (si tipoAccion es ATACAR)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El índice del movimiento debe ser un número entero.' })
  @Min(0, { message: 'El índice del movimiento no puede ser negativo.' })
  movimientoIndice?: number;

  @ApiPropertyOptional({
    description:
      'Código del objeto a utilizar (si tipoAccion es USAR_OBJETO o CAPTURAR)',
    example: 'talisman-basico',
  })
  @IsOptional()
  @IsString({ message: 'El código del objeto debe ser una cadena.' })
  itemCodigo?: string;
}
