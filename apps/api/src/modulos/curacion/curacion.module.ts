import { Module } from '@nestjs/common';
import { CuracionController } from './curacion.controller';
import { CuracionService } from './curacion.service';

@Module({
  controllers: [CuracionController],
  providers: [CuracionService],
  exports: [CuracionService],
})
export class CuracionModule {}
