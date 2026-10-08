import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class IngresoDto {
  @ApiProperty({ example: 'arturo@ejemplo.com', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  correo: string;

  @ApiProperty({ example: 'SecretoSeguro2026!', description: 'Contraseña de la cuenta' })
  @IsString({ message: 'La contraseña es requerida.' })
  clave: string;
}
