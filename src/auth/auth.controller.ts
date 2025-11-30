import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // ✅ Ya tiene getUser()
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('users')
  @UseGuards(AuthGuard)
  getAllUsers(@Request() req) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException(
        'Solo administradores pueden ver usuarios',
      );
    }
    return this.authService.getAllUsers();
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  // ✅ ENDPOINT QUE ARREGLA EL 404 /api/v1/auth/users/2
  @Get('users/:id')
  @UseGuards(AuthGuard)
  async getUserById(
    @Param('id') id: string,
    @Request() req,
  ) {
    const userId = +id;

    // Permisos: admin O el propio usuario
    if (req.user.rol !== 'admin' && req.user.id !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para ver este usuario',
      );
    }

    // ✅ USA TU MÉTODO EXISTENTE
    return await this.authService.getUser(userId);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @Request() req,
  ) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Solo administradores');
    }
    return this.authService.updateUser(+id, updateData);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard)
  deleteUser(@Param('id') id: string, @Request() req) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Solo administradores');
    }
    return this.authService.deleteUser(+id);
  }
}
