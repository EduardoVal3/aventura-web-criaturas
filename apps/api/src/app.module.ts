import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './comun/prisma/prisma.module';
import { AutenticacionGuard } from './comun/guards/autenticacion.guard';
import { AutenticacionModule } from './modulos/autenticacion/autenticacion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AutenticacionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AutenticacionGuard,
    },
  ],
})
export class AppModule {}
