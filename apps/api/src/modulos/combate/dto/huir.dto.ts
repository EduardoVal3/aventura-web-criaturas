import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HuirDto {
  @ApiProperty({
    description: 'Identificador único del encuentro en curso',
    example: 'enc-401',
  })
  @IsNotEmpty({ message: 'El identificador del encuentro es requerido.' })
  @IsString({ message: 'El identificador del encuentro debe ser una cadena.' })
  encuentroId: string;
}
