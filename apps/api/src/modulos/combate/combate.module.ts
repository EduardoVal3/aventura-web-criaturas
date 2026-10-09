import { Module } from '@nestjs/common';
import { CombateController } from './combate.controller';
import { CombateService } from './combate.service';
import { HistorialModule } from '../historial/historial.module';

@Module({
  imports: [HistorialModule],
  controllers: [CombateController],
  providers: [CombateService],
  exports: [CombateService],
})
export class CombateModule {}
