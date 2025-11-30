import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// @ts-ignore
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.usersService.findOneByEmail('admin@gamer.com');

    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      await this.usersService.create({
        name: 'Admin',
        email: 'admin@gamer.com',
        password: hashedPassword,
        rol: 'admin',
      });
      console.log('✅ Usuario admin creado: admin@gamer.com / admin123');
    }
    const cajeroExists = await this.usersService.findOneByEmail('cajero@gamer.com');
    if (!cajeroExists) {
      const hashedPassword = await bcryptjs.hash('cajero123', 10);
      await this.usersService.create({
        name: 'Cajero',
        email: 'cajero@gamer.com',
        password: hashedPassword,
        rol: 'cashier',
      });
      console.log('Usuario cajero creado: cajero@gamer.com / cajero123');
    }
  }



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
      rol: 'cajero',
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
      name: user.name,
      rol: user.rol,
    };

    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
      email: user.email,
      name: user.name,
      rol: user.rol,
    };
  }

  async getAllUsers() {
    return await this.usersService.findAll();
  }

  async getUser(id: number) {
    return await this.usersService.findOne(id);
  }

  async updateUser(id: number, updateData: UpdateUserDto) {
    // Verificar si el email ya existe (si se está cambiando)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (updateData.email) {
      const existingUser = await this.usersService.findOneByEmail(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updateData.email,
      );
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('El email ya está en uso');
      }
    }

    // Si se envía nueva contraseña, hashearla
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (updateData.password) {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.usersService.update(id, updateData);
  }

  async deleteUser(id: number) {
    // Verificar que no sea el último admin
    const user = await this.usersService.findOne(id);
    if (user.rol === 'admin') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const allUsers = await this.usersService.findAll();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const adminCount = allUsers.filter(u => u.rol === 'admin').length;

      if (adminCount <= 1) {
        throw new BadRequestException('No puedes eliminar el último administrador');
      }
    }


    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado exitosamente' };
  }
}