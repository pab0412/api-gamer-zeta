import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Boleta } from '../../boletas/entities/boleta.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fecha: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  iva: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  metodoPago: string; // 'efectivo', 'tarjeta_debito', 'tarjeta_credito'

  @Column({ default: 'completada' })
  estado: string; // 'completada', 'anulada'

  @Column('simple-json')
  detalleProductos: Array<{
    productoId: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;

  @ManyToOne(() => User, (user) => user.ventas)
  usuario: User;

  @Column()
  usuarioId: number;

  @OneToOne(() => Boleta, (boleta) => boleta.venta)
  boleta: Boleta;
}