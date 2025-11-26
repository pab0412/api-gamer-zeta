// boletas/boletas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletasService } from './boletas.service';
import { BoletasController } from './boletas.controller';
import { Boleta } from './entities/boleta.entity';
import { VentasModule } from '../ventas/ventas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleta]),
    VentasModule,
  ],
  controllers: [BoletasController],
  providers: [BoletasService],
})
export class BoletasModule {}