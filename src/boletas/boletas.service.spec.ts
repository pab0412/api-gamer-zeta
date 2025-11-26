import { Test, TestingModule } from '@nestjs/testing';
import { BoletasService } from './boletas.service';

describe('BoletasService', () => {
  let service: BoletasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoletasService],
    }).compile();

    service = module.get<BoletasService>(BoletasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
