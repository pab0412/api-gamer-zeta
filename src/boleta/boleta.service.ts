import { Injectable } from '@nestjs/common';
import { CreateBoletaDto } from './dto/create-boleta.dto';
import { UpdateBoletaDto } from './dto/update-boleta.dto';

@Injectable()
export class BoletaService {
  create(createBoletaDto: CreateBoletaDto) {
    return 'This action adds a new boleta';
  }

  findAll() {
    return `This action returns all boleta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} boleta`;
  }

  update(id: number, updateBoletaDto: UpdateBoletaDto) {
    return `This action updates a #${id} boleta`;
  }

  remove(id: number) {
    return `This action removes a #${id} boleta`;
  }
}
