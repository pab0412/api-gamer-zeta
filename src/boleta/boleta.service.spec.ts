import { Test, TestingModule } from '@nestjs/testing';
import { BoletaService } from './boleta.service';

describe('BoletaService', () => {
  let service: BoletaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoletaService],
    }).compile();

    service = module.get<BoletaService>(BoletaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
