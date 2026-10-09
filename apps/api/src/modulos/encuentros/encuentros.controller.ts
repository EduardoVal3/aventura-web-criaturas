import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EncuentrosService } from './encuentros.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Encuentros')
@ApiBearerAuth()
@Controller('encuentros')
export class EncuentrosController {
  constructor(private readonly encuentrosService: EncuentrosService) {}

  @Get('activo')
  @ApiOperation({ summary: 'Consulta el estado del encuentro silvestre en curso' })
  obtenerEncuentroActivo(@UsuarioActual('sub') usuarioId: string) {
    return this.encuentrosService.obtenerEncuentroActivo(usuarioId);
  }
}
