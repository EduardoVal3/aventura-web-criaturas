import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';
import { UsarObjetoDto } from './dto/usar-objeto.dto';

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene el inventario y saldo de monedas del personaje activo' })
  obtener(@UsuarioActual('sub') usuarioId: string) {
    return this.inventarioService.obtenerInventario(usuarioId);
  }

  @Post('usar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplica un objeto consumible sobre una criatura aliada' })
  @ApiResponse({
    status: 200,
    description: 'Objeto aplicado y puntos de golpe restaurados con éxito.',
  })
  usar(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: UsarObjetoDto,
  ) {
    return this.inventarioService.usarObjeto(
      usuarioId,
      dto.itemCodigo,
      dto.criaturaId,
    );
  }
}
