import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class CrearPersonajeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del personaje no puede estar vacío.' })
  @Length(3, 20, { message: 'El nombre debe tener entre 3 y 20 caracteres.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'La especie inicial es obligatoria.' })
  @IsIn(['lobo-gris', 'oso-negro', 'arana-lobo-gigante'], {
    message: 'La especie inicial debe ser una de las autorizadas: lobo-gris, oso-negro, arana-lobo-gigante.',
  })
  especieInicialSlug: string;
}
