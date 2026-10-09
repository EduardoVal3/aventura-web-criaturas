import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UsarObjetoDto {
  @ApiProperty({
    description: 'Código único del objeto consumible a utilizar',
    example: 'pocion-menor',
  })
  @IsNotEmpty({ message: 'El código del objeto es requerido.' })
  @IsString({ message: 'El código del objeto debe ser una cadena.' })
  itemCodigo: string;

  @ApiProperty({
    description: 'Identificador único de la criatura aliada destinataria',
    example: 'cri-301',
  })
  @IsNotEmpty({ message: 'El identificador de la criatura es requerido.' })
  @IsString({ message: 'El identificador de la criatura debe ser una cadena.' })
  criaturaId: string;
}
