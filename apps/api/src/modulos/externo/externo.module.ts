import { Module } from '@nestjs/common';
import { AdaptadorCriaturasExternas } from './adaptador-criaturas-externas.service';

@Module({
  providers: [AdaptadorCriaturasExternas],
  exports: [AdaptadorCriaturasExternas],
})
export class ExternoModule {}
