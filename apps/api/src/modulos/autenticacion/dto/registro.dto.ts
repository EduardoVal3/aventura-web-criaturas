import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistroDto {
  @ApiProperty({ example: 'arturo_sendas', description: 'Nombre de usuario único' })
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
  @MaxLength(20, { message: 'El nombre de usuario no puede exceder 20 caracteres.' })
  nombreUsuario: string;

  @ApiProperty({ example: 'arturo@ejemplo.com', description: 'Correo electrónico único' })
  @IsEmail({}, { message: 'El correo electrónico provisto no es válido.' })
  correo: string;

  @ApiProperty({ example: 'SecretoSeguro2026!', description: 'Contraseña de acceso' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  clave: string;
}
