import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    rol: 'cajero',
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un usuario con rol por defecto "cajero"', async () => {
      const createDto: CreateUserDto = {
        name: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        password: 'hashedPassword',
      };

      const expectedUser = { ...createDto, rol: 'cajero' };
      mockUserRepository.create.mockReturnValue(expectedUser);
      mockUserRepository.save.mockResolvedValue({ id: 1, ...expectedUser });

      const result = await service.create(createDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createDto,
        rol: 'cajero',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expectedUser);
      expect(result.rol).toBe('cajero');
    });

    it('debe crear un usuario con el rol especificado', async () => {
      const createDto: CreateUserDto = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashedPassword',
        rol: 'admin',
      };

      const expectedUser = { ...createDto };
      mockUserRepository.create.mockReturnValue(expectedUser);
      mockUserRepository.save.mockResolvedValue({ id: 1, ...expectedUser });

      const result = await service.create(createDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createDto);
      expect(result.rol).toBe('admin');
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los usuarios sin contraseñas', async () => {
      const users = [
        { id: 1, name: 'User 1', email: 'user1@example.com', rol: 'cajero' },
        { id: 2, name: 'User 2', email: 'user2@example.com', rol: 'admin' },
      ];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'email', 'rol'],
      });
      expect(result).toEqual(users);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por ID sin contraseña', async () => {
      const userWithoutPassword = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        rol: 'cajero',
      };

      mockUserRepository.findOne.mockResolvedValue(userWithoutPassword);

      const result = await service.findOne(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'name', 'email', 'rol'],
      });
      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Usuario con ID 999 no encontrado',
      );
    });
  });

  describe('findOneByEmail', () => {
    it('debe retornar un usuario por email con contraseña', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
      expect(result?.password).toBeDefined();
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByEmail('noexiste@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debe actualizar un usuario correctamente', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
    });

    it('debe actualizar la contraseña si se proporciona', async () => {
      const updateDto: UpdateUserDto = {
        password: 'newHashedPassword',
      };

      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.password).toBe('newHashedPassword');
    });

    it('no debe actualizar la contraseña si no se proporciona', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        password: undefined,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.update(1, updateDto);

      // Verificar que se eliminó el campo password del DTO
      expect(updateDto).not.toHaveProperty('password');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        'Usuario con ID 999 no encontrado',
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar un usuario existente', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow(
        'Usuario con ID 999 no encontrado',
      );
      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });
  });
});