import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BoletaService } from './boleta.service';
import { CreateBoletaDto } from './dto/create-boleta.dto';
import { UpdateBoletaDto } from './dto/update-boleta.dto';

@Controller('boleta')
export class BoletaController {
  constructor(private readonly boletaService: BoletaService) {}

  @Post()
  create(@Body() createBoletaDto: CreateBoletaDto) {
    return this.boletaService.create(createBoletaDto);
  }

  @Get()
  findAll() {
    return this.boletaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boletaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoletaDto: UpdateBoletaDto) {
    return this.boletaService.update(+id, updateBoletaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boletaService.remove(+id);
  }
}
