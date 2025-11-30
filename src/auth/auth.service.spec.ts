import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    rol: 'cajero',
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe crear usuario admin si no existe', async () => {
      mockUsersService.findOneByEmail
        .mockResolvedValueOnce(null) // admin no existe
        .mockResolvedValueOnce(null); // cajero no existe

      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.onModuleInit();

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('admin@gamer.com');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Admin',
        email: 'admin@gamer.com',
        password: 'hashedPassword',
        rol: 'admin',
      });
    });

    it('debe crear usuario cajero si no existe', async () => {
      mockUsersService.findOneByEmail
        .mockResolvedValueOnce(mockUser) // admin existe
        .mockResolvedValueOnce(null); // cajero no existe

      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.onModuleInit();

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('cajero@gamer.com');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Cajero',
        email: 'cajero@gamer.com',
        password: 'hashedPassword',
        rol: 'cashier',
      });
    });

    it('no debe crear usuarios si ya existen', async () => {
      mockUsersService.findOneByEmail
        .mockResolvedValueOnce(mockUser) // admin existe
        .mockResolvedValueOnce(mockUser); // cajero existe

      await service.onModuleInit();

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Nuevo Usuario',
      email: 'nuevo@example.com',
      password: 'password123',
    };

    it('debe registrar un nuevo usuario correctamente', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcryptjs.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashedPassword',
        rol: 'cajero',
      });
      expect(result).toEqual({ message: 'Usuario creado exitosamente' });
    });

    it('debe lanzar BadRequestException si el email ya existe', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'El email ya existe',
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('debe hacer login correctamente y retornar un token', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        rol: mockUser.rol,
      });
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        email: mockUser.email,
        name: mockUser.name,
        rol: mockUser.rol,
      });
    });

    it('debe lanzar UnauthorizedException si el email no existe', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Email inválido');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Contraseña inválida',
      );
    });
  });

  describe('getAllUsers', () => {
    it('debe retornar todos los usuarios', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('getUser', () => {
    it('debe retornar un usuario por ID', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getUser(1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    const updateDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('debe actualizar un usuario correctamente', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        updateDto.email,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('debe hashear la contraseña si se proporciona', async () => {
      const updateWithPassword = {
        ...updateDto,
        password: 'newPassword123',
      };
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUsersService.update.mockResolvedValue(mockUser);

      await service.updateUser(1, updateWithPassword);

      expect(bcryptjs.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockUsersService.update).toHaveBeenCalledWith(1, {
        ...updateDto,
        password: 'newHashedPassword',
      });
    });

    it('debe lanzar BadRequestException si el email ya está en uso por otro usuario', async () => {
      const existingUser = { ...mockUser, id: 2 };
      mockUsersService.findOneByEmail.mockResolvedValue(existingUser);

      await expect(service.updateUser(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUser(1, updateDto)).rejects.toThrow(
        'El email ya está en uso',
      );
    });

    it('debe permitir actualizar el email si es el mismo usuario', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(mockUser);

      await service.updateUser(1, { email: 'test@example.com' });

      expect(mockUsersService.update).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('debe eliminar un usuario cajero correctamente', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Usuario eliminado exitosamente' });
    });

    it('debe lanzar BadRequestException al intentar eliminar el último admin', async () => {
      const adminUser = { ...mockUser, id: 1, rol: 'admin' };
      const allUsers = [adminUser];

      mockUsersService.findOne.mockResolvedValue(adminUser);
      mockUsersService.findAll.mockResolvedValue(allUsers);

      await expect(service.deleteUser(1)).rejects.toThrow(BadRequestException);
      await expect(service.deleteUser(1)).rejects.toThrow(
        'No puedes eliminar el último administrador',
      );
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('debe permitir eliminar un admin si hay más de uno', async () => {
      const adminUser1 = { ...mockUser, id: 1, rol: 'admin' };
      const adminUser2 = { ...mockUser, id: 2, rol: 'admin' };
      const allUsers = [adminUser1, adminUser2];

      mockUsersService.findOne.mockResolvedValue(adminUser1);
      mockUsersService.findAll.mockResolvedValue(allUsers);

      const result = await service.deleteUser(1);

      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Usuario eliminado exitosamente' });
    });
  });
});