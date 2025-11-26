// boletas/boletas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoletasService } from './boletas.service';
import { CreateBoletaDto } from './dto/create-boleta.dto';
import { UpdateBoletaDto } from './dto/update-boleta.dto';

@ApiTags('boletas')
@Controller('boletas')
export class BoletasController {
  constructor(private readonly boletasService: BoletasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva boleta' })
  @ApiResponse({ status: 201, description: 'Boleta creada exitosamente' })
  create(@Body() createBoletaDto: CreateBoletaDto) {
    return this.boletasService.create(createBoletaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las boletas' })
  findAll() {
    return this.boletasService.findAll();
  }

  @Get('numero/:numero')
  @ApiOperation({ summary: 'Obtener boleta por número' })
  findByNumero(@Param('numero') numero: string) {
    return this.boletasService.findByNumero(numero);
  }

  @Get('venta/:ventaId')
  @ApiOperation({ summary: 'Obtener boleta por venta' })
  findByVenta(@Param('ventaId') ventaId: string) {
    return this.boletasService.findByVenta(+ventaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una boleta por ID' })
  findOne(@Param('id') id: string) {
    return this.boletasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una boleta' })
  update(@Param('id') id: string, @Body() updateBoletaDto: UpdateBoletaDto) {
    return this.boletasService.update(+id, updateBoletaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una boleta' })
  remove(@Param('id') id: string) {
    return this.boletasService.remove(+id);
  }
}