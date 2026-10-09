import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerificarZonaDto {
  @ApiProperty({
    description: 'Identificador de la zona a verificar y desbloquear',
    example: 'ZON-05',
  })
  @IsNotEmpty({ message: 'El identificador de la zona es requerido.' })
  @IsString({ message: 'El identificador de la zona debe ser una cadena.' })
  zonaId: string;
}
