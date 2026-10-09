import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExploracionService } from './exploracion.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Exploración')
@ApiBearerAuth()
@Controller('exploracion')
export class ExploracionController {
  constructor(private readonly exploracionService: ExploracionService) {}

  // simplificacion: mapeo simultáneo de '' y 'explorar' para cumplir tanto con el plan (/api/exploracion) como con el contrato REST (/api/exploracion/explorar).
  @Post(['', 'explorar'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecuta una acción de exploración probabilística en la zona activa' })
  explorar(@UsuarioActual('sub') usuarioId: string) {
    return this.exploracionService.explorar(usuarioId);
  }
}
