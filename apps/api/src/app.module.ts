import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './comun/prisma/prisma.module';
import { AutenticacionGuard } from './comun/guards/autenticacion.guard';
import { AutenticacionModule } from './modulos/autenticacion/autenticacion.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { PersonajesModule } from './modulos/personajes/personajes.module';
import { MundoModule } from './modulos/mundo/mundo.module';
import { CriaturasModule } from './modulos/criaturas/criaturas.module';
import { EncuentrosModule } from './modulos/encuentros/encuentros.module';
import { CombateModule } from './modulos/combate/combate.module';
import { InventarioModule } from './modulos/inventario/inventario.module';
import { TiendaModule } from './modulos/tienda/tienda.module';
import { HistorialModule } from './modulos/historial/historial.module';
import { ExternoModule } from './modulos/externo/externo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AutenticacionModule,
    UsuariosModule,
    PersonajesModule,
    MundoModule,
    CriaturasModule,
    EncuentrosModule,
    CombateModule,
    InventarioModule,
    TiendaModule,
    HistorialModule,
    ExternoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AutenticacionGuard,
    },
  ],
})
export class AppModule {}
