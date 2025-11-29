import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
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

  describe('register', () => {
    it('debe registrar un usuario correctamente', async () => {
      const registerDto = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue({ id: 1, ...registerDto });

      const result = await service.register(registerDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'juan@example.com',
      );
      expect(bcryptjs.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'hashedPassword',
      });
      expect(result).toEqual({ message: 'Usuario creado exitosamente' });
    });

    it('debe lanzar BadRequestException si el email ya existe', async () => {
      const registerDto = {
        name: 'Juan',
        email: 'existente@example.com',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue({
        id: 1,
        email: 'existente@example.com',
      });

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
    it('debe hacer login correctamente y retornar token', async () => {
      const loginDto = {
        email: 'juan@example.com',
        password: 'password123',
      };

      const user = {
        id: 1,
        name: 'Juan',
        email: 'juan@example.com',
        password: 'hashedPassword',
        rol: 'cajero',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('fake-jwt-token');

      const result = await service.login(loginDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'juan@example.com',
      );
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'juan@example.com',
        name: 'Juan',
        rol: 'cajero',
      });
      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        email: 'juan@example.com',
        name: 'Juan',
        rol: 'cajero',
      });
    });

    it('debe lanzar UnauthorizedException si el email no existe', async () => {
      const loginDto = {
        email: 'noexiste@example.com',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Email inválido');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const loginDto = {
        email: 'juan@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 1,
        email: 'juan@example.com',
        password: 'hashedPassword',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Contraseña inválida',
      );
    });
  });
});