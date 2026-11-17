import { Module } from '@nestjs/common';
import { CriaturasController } from './criaturas.controller';
import { CriaturasService } from './criaturas.service';
import { PrismaModule } from '../../comun/prisma/prisma.module';
import { ExternoModule } from '../externo/externo.module';

@Module({
  imports: [PrismaModule, ExternoModule],
  controllers: [CriaturasController],
  providers: [CriaturasService],
  exports: [CriaturasService],
})
export class CriaturasModule {}
