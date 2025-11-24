import { PartialType } from '@nestjs/swagger';
import { CreateBoletaDto } from './create-boleta.dto';

export class UpdateBoletaDto extends PartialType(CreateBoletaDto) {}
