import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HistorialService } from './historial.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Historial')
@ApiBearerAuth()
@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta la bitácora cronológica de eventos del personaje de forma paginada' })
  @ApiQuery({ name: 'pagina', required: false, type: Number, description: 'Número de página (por defecto 1)' })
  @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Elementos por página (por defecto 20)' })
  obtenerHistorial(
    @UsuarioActual('sub') usuarioId: string,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
  ) {
    return this.historialService.obtenerHistorial(usuarioId, { pagina, limite });
  }
}
