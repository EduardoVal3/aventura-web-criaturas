import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HistorialService } from './historial.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Historial')
@ApiBearerAuth()
@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  @ApiOperation({
    summary: 'Consulta la bitácora cronológica de eventos del personaje de forma paginada y categorizada',
  })
  @ApiQuery({ name: 'pagina', required: false, type: Number, description: 'Número de página (por defecto 1)' })
  @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Elementos por página (por defecto 20)' })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: String,
    description: 'Filtro por categoría canónica (COMBATE, CAPTURA, EXPLORACION, TIENDA, CURACION)',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Alias o filtro directo por tipo de evento',
  })
  @ApiResponse({ status: 200, description: 'Bitácora consultada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Personaje no encontrado para el usuario activo.' })
  obtenerHistorial(
    @UsuarioActual('sub') usuarioId: string,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
    @Query('categoria') categoria?: string,
    @Query('tipo') tipo?: string,
  ) {
    const filtro = categoria || tipo;
    return this.historialService.obtenerHistorial(usuarioId, { pagina, limite, categoria: filtro });
  }
}
