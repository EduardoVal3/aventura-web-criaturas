import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

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
}
