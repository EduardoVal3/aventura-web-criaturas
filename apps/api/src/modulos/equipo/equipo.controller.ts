import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipoService } from './equipo.service';
import { MoverCriaturaEquipoDto } from './dto/mover-criatura-equipo.dto';
import { ActualizarOrdenEquipoDto } from './dto/actualizar-orden-equipo.dto';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Equipo')
@ApiBearerAuth()
@Controller()
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Get('equipo')
  @ApiOperation({ summary: 'Obtiene el listado de hasta 6 criaturas activas en el equipo' })
  obtenerEquipo(@UsuarioActual('sub') usuarioId: string) {
    return this.equipoService.obtenerEquipo(usuarioId);
  }

  @Get('almacen')
  @ApiOperation({ summary: 'Obtiene las criaturas resguardadas en el almacén de reserva' })
  obtenerAlmacen(@UsuarioActual('sub') usuarioId: string) {
    return this.equipoService.obtenerAlmacen(usuarioId);
  }

  @Patch('equipo/orden')
  @ApiOperation({ summary: 'Actualiza el orden táctico de las criaturas del equipo' })
  actualizarOrden(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: ActualizarOrdenEquipoDto,
  ) {
    return this.equipoService.actualizarOrden(usuarioId, dto);
  }

  @Post(['equipo/mover', 'equipo/transferir'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mueve una criatura entre el equipo activo y el almacén' })
  moverCriatura(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: MoverCriaturaEquipoDto,
  ) {
    return this.equipoService.moverCriatura(usuarioId, dto);
  }
}
