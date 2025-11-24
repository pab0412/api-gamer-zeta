import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ password, email, name }: RegisterDto) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      throw new BadRequestException('El email ya existe');
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });
    return {
      message: 'Usuario creado exitosamente',
    };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email inválido');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña inválida');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name
    };

    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
      email: user.email,
      name: user.name,
    };
  }
}