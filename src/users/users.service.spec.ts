import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<User>;

  const mockUserRepository = {
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un usuario correctamente', async () => {
      const createDto = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'hashedPassword123',
        role: 'cajero',
      };

      const usuario = { id: 1, ...createDto };
      mockUserRepository.save.mockResolvedValue(usuario);

      const result = await service.create(createDto);

      expect(mockUserRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(usuario);
    });
  });

  describe('findOneByEmail', () => {
    it('debe retornar un usuario por email', async () => {
      const usuario = {
        id: 1,
        name: 'Juan',
        email: 'juan@example.com',
        role: 'cajero',
      };

      mockUserRepository.findOneBy.mockResolvedValue(usuario);

      const result = await service.findOneByEmail('juan@example.com');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: 'juan@example.com',
      });
      expect(result).toEqual(usuario);
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneByEmail('noexiste@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('debe retornar un usuario por ID', async () => {
      const usuario = {
        id: 1,
        name: 'Juan',
        email: 'juan@example.com',
        role: 'cajero',
      };

      mockUserRepository.findOneBy.mockResolvedValue(usuario);

      const result = await service.findOneById(1);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(usuario);
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneById(999);

      expect(result).toBeNull();
    });
  });
});