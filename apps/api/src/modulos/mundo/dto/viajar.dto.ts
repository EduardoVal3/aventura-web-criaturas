import { IsNotEmpty, IsString } from 'class-validator';

export class ViajarDto {
  @IsString({ message: 'El id de la zona destino debe ser un texto.' })
  @IsNotEmpty({ message: 'El id de la zona destino es obligatorio.' })
  destinoId: string;
}
