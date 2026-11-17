import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CriaturasService } from './criaturas.service';
import { Publico } from '../../comun/decoradores/publico.decorator';

@ApiTags('Especies')
@Controller('especies')
export class CriaturasController {
  constructor(private readonly criaturasService: CriaturasService) {}

  @Publico()
  @Get()
  @ApiOperation({
    summary: 'Lista las especies del compendio enriquecidas con movimientos y arquetipo táctico',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Filtro por tipo biológico (beast, monstrosity, undead, elemental, construct, plant)',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de especies consultado exitosamente.' })
  obtenerEspecies(@Query('tipo') tipo?: string) {
    return this.criaturasService.obtenerEspecies(tipo);
  }

  @Publico()
  @Get(':slug')
  @ApiOperation({
    summary: 'Obtiene la ficha técnica detallada de una especie por su identificador slug',
  })
  @ApiResponse({ status: 200, description: 'Ficha de la especie obtenida exitosamente.' })
  @ApiResponse({ status: 404, description: 'Especie no encontrada en el compendio.' })
  obtenerEspecie(@Param('slug') slug: string) {
    return this.criaturasService.obtenerEspeciePorSlug(slug);
  }
}
