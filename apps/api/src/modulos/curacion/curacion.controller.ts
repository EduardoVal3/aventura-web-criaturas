import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CuracionService } from './curacion.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Curación')
@ApiBearerAuth()
@Controller('curacion')
export class CuracionController {
  constructor(private readonly curacionService: CuracionService) {}

  @Post('restaurar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Restaura completamente los puntos de golpe de las criaturas del equipo en un centro de curación',
  })
  @ApiResponse({
    status: 200,
    description: 'Criaturas completamente restauradas a su HP máximo.',
  })
  restaurar(@UsuarioActual('sub') usuarioId: string) {
    return this.curacionService.restaurarEquipo(usuarioId);
  }
}
