import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CombateService } from './combate.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';
import { AtacarDto } from './dto/atacar.dto';
import { HuirDto } from './dto/huir.dto';
import { AccionCombateDto } from './dto/accion-combate.dto';

@ApiTags('Combate')
@ApiBearerAuth()
@Controller(['combate', 'combates'])
export class CombateController {
  constructor(private readonly combateService: CombateService) {}

  @Post('atacar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecuta un ataque contra la criatura rival en combate' })
  @ApiResponse({
    status: 200,
    description: 'Ataque ejecutado y contraataque resuelto con éxito.',
  })
  atacar(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: AtacarDto,
  ) {
    return this.combateService.atacar(
      usuarioId,
      dto.encuentroId,
      dto.movimientoIndice ?? 0,
    );
  }

  @Post('huir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Intenta huir del combate salvaje' })
  @ApiResponse({
    status: 200,
    description: 'Resolución probabilística del intento de huida.',
  })
  huir(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: HuirDto,
  ) {
    return this.combateService.huir(usuarioId, dto.encuentroId);
  }

  @Post(':id/acciones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Despachador unificado de acciones de combate por turno',
  })
  @ApiResponse({
    status: 200,
    description: 'Acción despachada y turno resuelto.',
  })
  ejecutarAccion(
    @UsuarioActual('sub') usuarioId: string,
    @Param('id') encuentroId: string,
    @Body() dto: AccionCombateDto,
  ) {
    switch (dto.tipoAccion) {
      case 'ATACAR':
        return this.combateService.atacar(
          usuarioId,
          encuentroId,
          dto.movimientoIndice ?? 0,
        );
      case 'HUIR':
        return this.combateService.huir(usuarioId, encuentroId);
      default:
        throw new BadRequestException({
          codigo: 'ACCION_NO_SOPORTADA',
          mensaje: `La acción ${dto.tipoAccion} no es soportada en este endpoint de combate.`,
        });
    }
  }
}
