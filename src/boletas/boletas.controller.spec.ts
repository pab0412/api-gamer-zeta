import { Test, TestingModule } from '@nestjs/testing';
import { BoletasController } from './boletas.controller';
import { BoletasService } from './boletas.service';

describe('BoletasController', () => {
  let controller: BoletasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoletasController],
      providers: [BoletasService],
    }).compile();

    controller = module.get<BoletasController>(BoletasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
