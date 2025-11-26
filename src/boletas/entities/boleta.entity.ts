import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Venta } from '../../ventas/entities/venta.entity';

@Entity('boletas')
export class Boleta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: string; // BOL-000001

  @CreateDateColumn()
  fechaEmision: Date;

  @Column({ default: 'Consumidor Final' })
  cliente: string;

  @Column({ nullable: true })
  rut: string;

  @Column('decimal', { precision: 10, scale: 2 })
  montoTotal: number;

  @OneToOne(() => Venta, (venta) => venta.boleta)
  @JoinColumn()
  venta: Venta;

  @Column()
  ventaId: number;
}